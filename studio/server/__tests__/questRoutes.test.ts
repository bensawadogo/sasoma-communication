import Fastify from 'fastify';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QuestEngine, QuestStore } from '../src/quests/questEngine.js';
import { parseCommand, registerQuestRoutes } from '../src/quests/questRoutes.js';
import { QA_ITEMS } from '../src/quests/types.js';

const TOKEN = 'test-token-0123456789abcdef';
const SECRETARY_TOKEN = 'secretary-token-0123456789';
const HOST = { host: '127.0.0.1:3100' };

let dir: string;
let actorsFile: string;
let app: ReturnType<typeof Fastify>;

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-routes-'));
  // HOME is isolated per test run (isolateHome.setup); the extra-actors file lives under it.
  actorsFile = path.join(os.homedir(), '.pixel-agents', 'quest-actors.json');
  fs.mkdirSync(path.dirname(actorsFile), { recursive: true });
  fs.writeFileSync(actorsFile, JSON.stringify({ [SECRETARY_TOKEN]: { id: 'awa', role: 'secretary' } }));
  app = Fastify();
  registerQuestRoutes(app, {
    token: TOKEN,
    allowedHostnames: new Set(['127.0.0.1']),
    engine: new QuestEngine(new QuestStore(path.join(dir, 'q.jsonl')), () => 1),
  });
  await app.ready();
});
afterEach(async () => {
  await app.close();
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(actorsFile, { force: true });
});

const as = (token: string) => ({ ...HOST, authorization: `Bearer ${token}` });
const post = (token: string, payload: unknown) =>
  app.inject({ method: 'POST', url: '/api/quests/command', headers: as(token), payload: payload as object });

describe('access', () => {
  it('refuses a request without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/quests', headers: HOST });
    expect(res.statusCode).toBe(401);
  });

  it('refuses a wrong token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/quests', headers: as('nope') });
    expect(res.statusCode).toBe(401);
  });

  it('refuses an untrusted Host even with the right token (DNS rebinding)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/quests',
      headers: { host: 'evil.example', authorization: `Bearer ${TOKEN}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('gives the server token the chef role and a secretary token the secretary role', async () => {
    const chef = await app.inject({ method: 'GET', url: '/api/quests', headers: as(TOKEN) });
    expect(chef.json().me).toEqual({ id: 'ben', role: 'chef' });
    const sec = await app.inject({ method: 'GET', url: '/api/quests', headers: as(SECRETARY_TOKEN) });
    expect(sec.json().me).toEqual({ id: 'awa', role: 'secretary' });
  });

  it('never lets a request choose its own role', async () => {
    const res = await post(SECRETARY_TOKEN, {
      type: 'create_mission',
      missionId: 'm1',
      clientId: 'sasoma',
      title: 'A',
      actor: { id: 'ben', role: 'chef' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().missions.m1.createdBy).toBe('awa');
  });
});

describe('commands', () => {
  it('rejects malformed bodies', async () => {
    expect((await post(TOKEN, { type: 'hack' })).statusCode).toBe(400);
    expect((await post(TOKEN, { type: 'complete_step', missionId: 'm1', step: 'nope' })).statusCode).toBe(400);
    expect(
      (await post(TOKEN, { type: 'complete_step', missionId: 'm1', step: 'production', production: { realPhoto: 'yes' } }))
        .statusCode,
    ).toBe(400);
  });

  it('answers a refused rule with 422 and the rule id', async () => {
    await post(SECRETARY_TOKEN, { type: 'create_mission', missionId: 'm1', clientId: 'sasoma', title: 'A' });
    await post(SECRETARY_TOKEN, { type: 'complete_step', missionId: 'm1', step: 'idea' });
    const res = await post(SECRETARY_TOKEN, { type: 'complete_step', missionId: 'm1', step: 'calendar_gate' });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ ok: false, rule: 'ROLE_NOT_ALLOWED' });
  });

  it('runs a full flow end to end, secretary working and chef opening the doors', async () => {
    await post(SECRETARY_TOKEN, { type: 'create_mission', missionId: 'm1', clientId: 'sasoma', title: 'A' });
    const ok = async (token: string, p: unknown) => expect((await post(token, p)).statusCode).toBe(200);
    await ok(SECRETARY_TOKEN, { type: 'complete_step', missionId: 'm1', step: 'idea' });
    await ok(TOKEN, { type: 'complete_step', missionId: 'm1', step: 'calendar_gate' });
    await ok(SECRETARY_TOKEN, {
      type: 'complete_step',
      missionId: 'm1',
      step: 'production',
      production: { realPhoto: true, aiGeneratedProduct: false, paidToolUsed: false, costAnnounced: false },
    });
    await ok(TOKEN, {
      type: 'complete_step',
      missionId: 'm1',
      step: 'qa_gate',
      checklist: Object.fromEntries(QA_ITEMS.map((i) => [i, true])),
    });
    await ok(SECRETARY_TOKEN, { type: 'complete_step', missionId: 'm1', step: 'scheduled' });
    const last = await post(TOKEN, { type: 'complete_step', missionId: 'm1', step: 'send_gate' });
    const awa = last.json().players.find((p: { id: string }) => p.id === 'awa');
    expect(awa).toMatchObject({ xp: 165, sent: 1 });
  });
});

describe('parseCommand', () => {
  it('drops unknown keys and keeps only the known ones', () => {
    const cmd = parseCommand({ type: 'reject_gate', missionId: 'm1', gate: 'qa_gate', reason: 'x', extra: 1 });
    expect(cmd).toEqual({ type: 'reject_gate', missionId: 'm1', gate: 'qa_gate', reason: 'x' });
  });
  it('refuses a step that is not a step', () => {
    expect(parseCommand({ type: 'reject_gate', missionId: 'm1', gate: 'idea', reason: 'x' })).toBeNull();
  });
});
