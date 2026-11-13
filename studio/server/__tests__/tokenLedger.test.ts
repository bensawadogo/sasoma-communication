import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseRecord, TokenLedger } from '../src/tokens/tokenLedger.js';

const NOW = Date.parse('2026-11-13T12:00:00Z');
let root: string;
let projects: string;
let data: string;

const assistant = (id: string, atIso: string, usage: object, model = 'claude-x') =>
  JSON.stringify({ type: 'assistant', timestamp: atIso, requestId: 'r-' + id, message: { id, model, usage } });

const ledger = () =>
  new TokenLedger({ dataDir: data, claudeProjectsDir: projects, projectMatch: 'sasoma-communication', now: () => NOW });

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-'));
  projects = path.join(root, 'projects');
  data = path.join(root, 'data');
  fs.mkdirSync(path.join(projects, 'C--SASOMA-COMMUNICATION', 'sess', 'subagents'), { recursive: true });
  fs.mkdirSync(path.join(projects, 'C--OTHER-PROJECT'), { recursive: true });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const file = (...p: string[]) => path.join(projects, ...p);

describe('Claude usage from transcripts', () => {
  it('keeps the LAST line of a streamed message, not the placeholder first one', () => {
    fs.writeFileSync(
      file('C--SASOMA-COMMUNICATION', 's.jsonl'),
      [
        assistant('m1', '2026-11-13T11:00:00Z', { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 100, cache_read_input_tokens: 5000 }),
        assistant('m1', '2026-11-13T11:00:01Z', { input_tokens: 1, output_tokens: 159, cache_creation_input_tokens: 100, cache_read_input_tokens: 5000 }),
      ].join('\n') + '\n',
    );
    const claude = ledger().report().providers.find((p) => p.id === 'claude')!;
    expect(claude.connected).toBe(true);
    expect(claude.today).toMatchObject({ input: 1, output: 159, cacheWrite: 100, cacheRead: 5000, messages: 1, total: 260 });
  });

  it('counts sub-agent transcripts, ignores other projects and synthetic records', () => {
    fs.writeFileSync(
      file('C--SASOMA-COMMUNICATION', 'sess', 'subagents', 'a.jsonl'),
      assistant('m2', '2026-11-13T10:00:00Z', { input_tokens: 10, output_tokens: 20 }) + '\n',
    );
    fs.writeFileSync(
      file('C--OTHER-PROJECT', 'o.jsonl'),
      assistant('m3', '2026-11-13T10:00:00Z', { input_tokens: 999, output_tokens: 999 }) + '\n',
    );
    fs.writeFileSync(
      file('C--SASOMA-COMMUNICATION', 'syn.jsonl'),
      assistant('m4', '2026-11-13T10:00:00Z', { input_tokens: 0, output_tokens: 0 }, '<synthetic>') + '\n',
    );
    const claude = ledger().report().providers.find((p) => p.id === 'claude')!;
    expect(claude.today.total).toBe(30);
    expect(claude.today.messages).toBe(1);
  });

  it('windows: 5 hours, today, 7 days', () => {
    fs.writeFileSync(
      file('C--SASOMA-COMMUNICATION', 'w.jsonl'),
      [
        assistant('a', '2026-11-13T11:00:00Z', { input_tokens: 10, output_tokens: 0 }), // 1 h ago
        assistant('b', '2026-11-13T03:00:00Z', { input_tokens: 100, output_tokens: 0 }), // today, > 5 h ago
        assistant('c', '2026-11-10T03:00:00Z', { input_tokens: 1000, output_tokens: 0 }), // this week
        assistant('d', '2026-10-01T03:00:00Z', { input_tokens: 99999, output_tokens: 0 }), // too old
      ].join('\n') + '\n',
    );
    const c = ledger().report().providers.find((p) => p.id === 'claude')!;
    expect([c.fiveHour.total, c.today.total, c.week.total]).toEqual([10, 110, 1110]);
  });

  it('reads only what is new on the next refresh', () => {
    const f = file('C--SASOMA-COMMUNICATION', 'g.jsonl');
    fs.writeFileSync(f, assistant('a', '2026-11-13T11:00:00Z', { input_tokens: 5, output_tokens: 5 }) + '\n');
    const l = ledger();
    expect(l.report().providers.find((p) => p.id === 'claude')!.today.total).toBe(10);
    fs.appendFileSync(f, assistant('b', '2026-11-13T11:30:00Z', { input_tokens: 1, output_tokens: 1 }) + '\n');
    l.refresh(0);
    expect(l.report().providers.find((p) => p.id === 'claude')!.today.total).toBe(12);
  });
});

describe('other providers', () => {
  it('are listed as not connected until something is recorded', () => {
    const r = ledger().report();
    expect(r.providers.map((p) => [p.id, p.connected])).toEqual([
      ['claude', false],
      ['deepseek', false],
      ['kimi', false],
    ]);
  });

  it('record a use, then show it', () => {
    const l = ledger();
    const e = parseRecord({ provider: 'deepseek', model: 'deepseek-chat', input: 1200, output: 300 }, NOW - 1000)!;
    l.record(e);
    const d = l.report().providers.find((p) => p.id === 'deepseek')!;
    expect(d.connected).toBe(true);
    expect(d.today.total).toBe(1500);
    expect(d.byModel[0]).toMatchObject({ model: 'deepseek-chat' });
  });

  it('refuse a bad record, and refuse claude (it is read, never declared)', () => {
    expect(parseRecord({ provider: 'DeepSeek', input: 1, output: 1 }, NOW)).toBeNull();
    expect(parseRecord({ provider: 'deepseek', input: -1, output: 1 }, NOW)).toBeNull();
    expect(parseRecord({ provider: 'deepseek', input: 1 }, NOW)).toBeNull();
    expect(parseRecord({ provider: 'claude', input: 1, output: 1 }, NOW)).toBeNull();
  });
});

describe('budgets', () => {
  it('are passed along only when configured', () => {
    fs.mkdirSync(data, { recursive: true });
    fs.writeFileSync(path.join(data, 'budgets.json'), JSON.stringify({ claude: { dailyTokens: 500000 }, kimi: { dailyTokens: -5 } }));
    const r = ledger().report();
    expect(r.providers.find((p) => p.id === 'claude')!.budget).toEqual({ dailyTokens: 500000 });
    expect(r.providers.find((p) => p.id === 'deepseek')!.budget).toBeUndefined();
    expect(r.providers.find((p) => p.id === 'kimi')!.budget).toEqual({});
  });
});
