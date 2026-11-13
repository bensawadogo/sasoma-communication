import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QuestEngine, QuestStore } from '../src/quests/questEngine.js';
import { levelOf } from '../src/quests/questRules.js';
import type { Actor, ProductionDeclaration, QaChecklist, Step } from '../src/quests/types.js';
import { QA_ITEMS } from '../src/quests/types.js';

const ben: Actor = { id: 'ben', role: 'chef' };
const awa: Actor = { id: 'awa', role: 'secretary' };
const bot: Actor = { id: 'scenariste', role: 'agent' };

const goodProduction: ProductionDeclaration = {
  realPhoto: true,
  aiGeneratedProduct: false,
  paidToolUsed: false,
  costAnnounced: false,
};
const fullChecklist = Object.fromEntries(QA_ITEMS.map((i) => [i, true])) as QaChecklist;

let dir: string;
let file: string;
let engine: QuestEngine;

function newEngine(): QuestEngine {
  return new QuestEngine(new QuestStore(file), () => 1_000);
}

function step(who: Actor, s: Step, extra: Record<string, unknown> = {}) {
  return engine.dispatch({ type: 'complete_step', missionId: 'm1', step: s, ...extra }, who);
}

/** Runs one mission up to just before `until`. */
function runTo(until: Step, producer: Actor = awa): void {
  engine.dispatch({ type: 'create_mission', missionId: 'm1', clientId: 'sasoma', title: 'Vidange' }, ben);
  const order: [Actor, Step, Record<string, unknown>?][] = [
    [producer, 'idea'],
    [ben, 'calendar_gate'],
    [producer, 'production', { production: goodProduction }],
    [ben, 'qa_gate', { checklist: fullChecklist }],
    [producer, 'scheduled'],
    [ben, 'send_gate'],
    [producer, 'report'],
  ];
  for (const [who, s, extra] of order) {
    if (s === until) return;
    const r = step(who, s, extra ?? {});
    expect(r.ok, `${s} should pass`).toBe(true);
  }
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quests-'));
  file = path.join(dir, 'events.jsonl');
  engine = newEngine();
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('process order', () => {
  it('refuses a step that is not the next one', () => {
    engine.dispatch({ type: 'create_mission', missionId: 'm1', clientId: 'sasoma', title: 'Vidange' }, ben);
    const r = step(awa, 'production', { production: goodProduction });
    expect(r).toMatchObject({ ok: false, rule: 'WRONG_ORDER' });
  });

  it('refuses a duplicate mission and empty fields', () => {
    engine.dispatch({ type: 'create_mission', missionId: 'm1', clientId: 'sasoma', title: 'A' }, ben);
    expect(engine.dispatch({ type: 'create_mission', missionId: 'm1', clientId: 'sasoma', title: 'B' }, ben)).toMatchObject({
      rule: 'MISSION_EXISTS',
    });
    expect(engine.dispatch({ type: 'create_mission', missionId: 'm2', clientId: 'sasoma', title: '  ' }, ben)).toMatchObject({
      rule: 'EMPTY_FIELD',
    });
  });

  it('walks a full mission to done', () => {
    runTo('report');
    expect(step(awa, 'report').ok).toBe(true);
    expect(engine.snapshot().missions['m1']!.next).toBe('done');
  });
});

describe('gates belong to the chef', () => {
  it.each(['calendar_gate', 'qa_gate', 'send_gate'] as const)('a secretary cannot pass %s', (gate) => {
    runTo(gate);
    expect(step(awa, gate, { checklist: fullChecklist })).toMatchObject({ ok: false, rule: 'ROLE_NOT_ALLOWED' });
  });

  it('an AI agent cannot pass a gate either', () => {
    runTo('calendar_gate');
    expect(step(bot, 'calendar_gate')).toMatchObject({ ok: false, rule: 'ROLE_NOT_ALLOWED' });
  });

  it('only the chef can reject, and must give a reason', () => {
    runTo('qa_gate');
    expect(engine.dispatch({ type: 'reject_gate', missionId: 'm1', gate: 'qa_gate', reason: 'flou' }, awa)).toMatchObject({
      rule: 'ROLE_NOT_ALLOWED',
    });
    expect(engine.dispatch({ type: 'reject_gate', missionId: 'm1', gate: 'qa_gate', reason: ' ' }, ben)).toMatchObject({
      rule: 'REASON_REQUIRED',
    });
  });
});

describe('absolute business rules', () => {
  it('refuses an AI-generated product (the bidon rule)', () => {
    runTo('production');
    const r = step(awa, 'production', { production: { ...goodProduction, aiGeneratedProduct: true } });
    expect(r).toMatchObject({ ok: false, rule: 'NO_AI_PRODUCT' });
  });

  it('refuses production without a real photo', () => {
    runTo('production');
    expect(step(awa, 'production', { production: { ...goodProduction, realPhoto: false } })).toMatchObject({
      rule: 'NO_REAL_PHOTO',
    });
  });

  it('refuses a paid tool whose cost was not announced', () => {
    runTo('production');
    const r = step(awa, 'production', { production: { ...goodProduction, paidToolUsed: true, costAnnounced: false } });
    expect(r).toMatchObject({ rule: 'COST_NOT_ANNOUNCED' });
    const ok = step(awa, 'production', { production: { ...goodProduction, paidToolUsed: true, costAnnounced: true } });
    expect(ok.ok).toBe(true);
  });

  it('requires a production declaration', () => {
    runTo('production');
    expect(step(awa, 'production')).toMatchObject({ rule: 'MISSING_DECLARATION' });
  });

  it('refuses gate 2 unless every quality item is checked', () => {
    runTo('qa_gate');
    expect(step(ben, 'qa_gate')).toMatchObject({ rule: 'QA_INCOMPLETE' });
    const partial = { ...fullChecklist, facts_verified: false };
    const r = step(ben, 'qa_gate', { checklist: partial });
    expect(r).toMatchObject({ rule: 'QA_INCOMPLETE' });
    expect((r as { message: string }).message).toContain('facts_verified');
  });
});

describe('XP is earned only by real accepted steps', () => {
  it('rewards the author when the chef passes the gate, with a first-time-right bonus', () => {
    runTo('report');
    const awaP = engine.snapshot().players.find((p) => p.id === 'awa')!;
    // idea 10 + gate1 10 + production 30 + gate2 40 + first time 25 + scheduled 20 + gate3 30
    expect(awaP.xp).toBe(165);
    expect(awaP.sent).toBe(1);
    expect(awaP.badges).toContain('premier_envoi');
    expect(awaP.firstTimeRight).toBe(1);
  });

  it('gives no XP for refused attempts', () => {
    runTo('production');
    step(awa, 'production', { production: { ...goodProduction, aiGeneratedProduct: true } });
    const awaP = engine.snapshot().players.find((p) => p.id === 'awa')!;
    expect(awaP.xp).toBe(10 + 10); // idea + gate 1 only
  });

  it('a rejected gate sends the mission back, costs no XP, and removes the first-time bonus', () => {
    runTo('qa_gate');
    const rejected = engine.dispatch(
      { type: 'reject_gate', missionId: 'm1', gate: 'qa_gate', reason: 'Fait non vérifié' },
      ben,
    );
    expect(rejected.ok).toBe(true);
    expect(engine.snapshot().missions['m1']!.next).toBe('production');
    expect(engine.snapshot().missions['m1']!.revisions).toBe(1);

    step(awa, 'production', { production: goodProduction });
    step(ben, 'qa_gate', { checklist: fullChecklist });
    const awaP = engine.snapshot().players.find((p) => p.id === 'awa')!;
    // idea 10 + gate1 10 + production 30 (rewarded once, redoing earns nothing) + gate2 40, no first-time bonus
    expect(awaP.xp).toBe(10 + 10 + 30 + 40);
    expect(awaP.firstTimeRight).toBe(0);
  });

  it('computes levels from XP', () => {
    expect(levelOf(0)).toEqual({ level: 1, title: 'Recrue', nextAt: 40 });
    expect(levelOf(120).level).toBe(3);
    expect(levelOf(10_000)).toMatchObject({ level: 6, nextAt: null });
  });
});

describe('persistence: the log is the truth', () => {
  it('rebuilds the same state from the log after a restart', () => {
    runTo('report');
    const before = engine.snapshot();
    const reloaded = newEngine().snapshot();
    expect(reloaded.players).toEqual(before.players);
    expect(reloaded.missions).toEqual(before.missions);
  });

  it('never logs a refused command', () => {
    runTo('production');
    step(awa, 'production', { production: { ...goodProduction, aiGeneratedProduct: true } });
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    expect(lines.every((l) => !l.includes('"aiGeneratedProduct":true'))).toBe(true);
  });

  it('skips damaged lines instead of trusting them, and counts them', () => {
    runTo('report');
    fs.appendFileSync(file, 'not json\n{"type":"step_completed"}\n{"type":"hack","missionId":"m1"}\n');
    const reloaded = newEngine().snapshot();
    expect(reloaded.skippedLines).toBe(3);
    expect(reloaded.players.find((p) => p.id === 'awa')!.xp).toBe(165);
  });

  it('ignores an injected orphan event for a mission that does not exist', () => {
    fs.writeFileSync(
      file,
      JSON.stringify({
        type: 'step_completed',
        at: 1,
        missionId: 'ghost',
        step: 'production',
        actor: { id: 'cheater', role: 'secretary' },
      }) + '\n',
    );
    const snap = newEngine().snapshot();
    expect(snap.players).toHaveLength(0);
  });
});
