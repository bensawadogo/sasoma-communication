import Fastify from 'fastify';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readChatMessages, registerChatRoutes, sanitizePrompt } from '../src/chat/chatRoutes.js';

const TOKEN = 'test-token-0123456789abcdef';
const HOST = { host: '127.0.0.1:3100' };
const AUTH = { ...HOST, authorization: `Bearer ${TOKEN}` };

let dir: string;
let transcript: string;

const line = (o: unknown) => JSON.stringify(o);

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-'));
  transcript = path.join(dir, 's.jsonl');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('readChatMessages', () => {
  it('keeps what Ben typed and what the agent said, and summarises tools', () => {
    fs.writeFileSync(
      transcript,
      [
        line({ type: 'user', uuid: 'u1', message: { content: 'Propose 3 idées' } }),
        line({
          type: 'assistant',
          uuid: 'a1',
          message: {
            content: [
              { type: 'thinking', thinking: 'secret reasoning' },
              { type: 'text', text: 'Voici 3 idées.' },
              { type: 'tool_use', name: 'Read', input: { file_path: 'clients/sasoma.md' } },
            ],
          },
        }),
        line({ type: 'user', uuid: 'u2', message: { content: [{ type: 'tool_result', content: 'x' }] } }),
      ].join('\n'),
    );
    const out = readChatMessages(transcript);
    expect(out.map((m) => [m.role, m.text])).toEqual([
      ['user', 'Propose 3 idées'],
      ['assistant', 'Voici 3 idées.'],
      ['tool', 'Read · clients/sasoma.md'],
    ]);
  });

  it('skips system notices, meta records, sidechains and damaged lines', () => {
    fs.writeFileSync(
      transcript,
      [
        line({ type: 'user', message: { content: '<command-name>/clear</command-name>' } }),
        line({ type: 'user', isMeta: true, message: { content: 'meta' } }),
        line({ type: 'assistant', isSidechain: true, message: { content: [{ type: 'text', text: 'sub-agent' }] } }),
        '{not json',
        line({ type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }] } }),
      ].join('\n'),
    );
    expect(readChatMessages(transcript).map((m) => m.text)).toEqual(['ok']);
  });

  it('returns nothing for a missing file', () => {
    expect(readChatMessages(path.join(dir, 'nope.jsonl'))).toEqual([]);
  });
});

describe('sanitizePrompt', () => {
  it('makes one plain line: no newline, no escape sequence', () => {
    expect(sanitizePrompt('a\nb\r\nc\x1b[31m d\x07')).toBe('a b c[31m d');
  });
});

describe('routes', () => {
  const write = vi.fn();
  const session = { hasExited: false, write };
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    write.mockClear();
    fs.writeFileSync(transcript, line({ type: 'user', message: { content: 'salut' } }));
    const agents = new Map([[3, { jsonlFile: transcript, agentName: 'chef', isWaiting: true }]]);
    app = Fastify();
    registerChatRoutes(app, {
      token: TOKEN,
      allowedHostnames: new Set(['127.0.0.1']),
      store: { get: (id: number) => agents.get(id) } as never,
      ptyManager: { get: (id: number) => (id === 3 ? session : undefined) } as never,
    });
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('refuses a missing token and an untrusted host', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/chat/3', headers: HOST })).statusCode).toBe(401);
    const bad = await app.inject({
      method: 'GET',
      url: '/api/chat/3',
      headers: { host: 'evil.example', authorization: `Bearer ${TOKEN}` },
    });
    expect(bad.statusCode).toBe(403);
  });

  it('reads a conversation', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/chat/3', headers: AUTH });
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body).toMatchObject({ name: 'chef', canSend: true, waiting: true });
    expect(body.messages[0].text).toBe('salut');
  });

  it('lists the roster for the 3D office, behind the same gates, without transcript text', async () => {
    const agents = new Map([
      [3, { jsonlFile: transcript, agentName: 'chef', isWaiting: true }],
      [5, { jsonlFile: transcript, isWaiting: false }],
    ]);
    const app3 = Fastify();
    registerChatRoutes(app3, {
      token: TOKEN,
      allowedHostnames: new Set(['127.0.0.1']),
      store: { get: (id: number) => agents.get(id), entries: () => agents.entries() } as never,
      ptyManager: { get: (id: number) => (id === 3 ? session : undefined) } as never,
    });
    await app3.ready();
    expect((await app3.inject({ method: 'GET', url: '/api/chat', headers: HOST })).statusCode).toBe(401);
    const res = await app3.inject({ method: 'GET', url: '/api/chat', headers: AUTH });
    expect(res.statusCode).toBe(200);
    expect(res.json().agents).toEqual([
      { agentId: 3, name: 'chef', waiting: true, canSend: true },
      { agentId: 5, name: 'Agent 5', waiting: false, canSend: false },
    ]);
    expect(JSON.stringify(res.json())).not.toContain('salut');
    await app3.close();
  });

  it('404s an unknown agent', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/chat/99', headers: AUTH })).statusCode).toBe(404);
  });

  it('types a cleaned message into the terminal, then Enter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat/3/send',
      headers: AUTH,
      payload: { text: 'bonjour\nle monde' },
    });
    expect(res.statusCode).toBe(200);
    expect(write).toHaveBeenCalledWith('bonjour le monde');
    // Enter follows after a short pause (real timer: Fastify's own inject needs the real clock).
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(write).toHaveBeenCalledWith('\r');
  });

  it('refuses an empty message and an agent without a terminal', async () => {
    const empty = await app.inject({ method: 'POST', url: '/api/chat/3/send', headers: AUTH, payload: { text: '  ' } });
    expect(empty.statusCode).toBe(400);
    const agents = new Map([[4, { jsonlFile: transcript, isWaiting: false }]]);
    const app2 = Fastify();
    registerChatRoutes(app2, {
      token: TOKEN,
      allowedHostnames: new Set(['127.0.0.1']),
      store: { get: (id: number) => agents.get(id) } as never,
      ptyManager: { get: () => undefined } as never,
    });
    await app2.ready();
    const res = await app2.inject({ method: 'POST', url: '/api/chat/4/send', headers: AUTH, payload: { text: 'hi' } });
    expect(res.statusCode).toBe(409);
    await app2.close();
  });
});

describe('chat photos', () => {
  const jpeg = Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe1, 0x00, 0x12]),
    Buffer.from('Exif\0\0GPS-12.3,-1.5'),
    Buffer.from([0xff, 0xdb, 0x00, 0x04, 0x01, 0x02]),
    Buffer.from([0xff, 0xda, 0x00, 0x04, 0x03, 0x04, 0x99, 0x98, 0xff, 0xd9]),
  ]);
  let photos: string;
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    photos = path.join(dir, 'photos-clients');
    const agents = new Map([[3, { jsonlFile: transcript, agentName: 'chef', isWaiting: true }]]);
    const session = { hasExited: false, write: vi.fn() };
    app = Fastify();
    registerChatRoutes(app, {
      token: TOKEN,
      allowedHostnames: new Set(['127.0.0.1']),
      store: { get: (id: number) => agents.get(id) } as never,
      ptyManager: { get: (id: number) => (id === 3 ? session : undefined) } as never,
      photosDir: photos,
    });
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  const post = (data: unknown, headers: Record<string, string> = AUTH, id = 3) =>
    app.inject({ method: 'POST', url: `/api/chat/${id}/photo`, headers, payload: { data } });

  it('saves a photo without its metadata and answers with its path', async () => {
    const res = await post(jpeg.toString('base64'));
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.rel).toMatch(/^photos-clients\/_a-classer\/\d{8}-\d{6}-[0-9a-f]{4}\.jpg$/);
    const saved = fs.readFileSync(body.path);
    expect(saved.includes('GPS')).toBe(false);
    expect([...saved.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    expect([...saved.subarray(-2)]).toEqual([0xff, 0xd9]);
    expect(body.path.startsWith(photos)).toBe(true);
  });

  it('accepts a data URL, refuses anything that is not a JPEG or PNG, empty or too heavy', async () => {
    expect((await post(`data:image/jpeg;base64,${jpeg.toString('base64')}`)).statusCode).toBe(200);
    expect((await post(Buffer.from('<?php echo 1;').toString('base64'))).statusCode).toBe(400);
    expect((await post(Buffer.from('GIF89a....').toString('base64'))).statusCode).toBe(400);
    expect((await post('')).statusCode).toBe(400);
    expect((await post(123)).statusCode).toBe(400);
    const heavy = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(4_100_000)]);
    expect((await post(heavy.toString('base64'))).statusCode).toBe(400);
  });

  it('refuses without the token, from an untrusted host, for an unknown agent or one without a terminal', async () => {
    expect((await post(jpeg.toString('base64'), HOST)).statusCode).toBe(401);
    expect((await post(jpeg.toString('base64'), { host: 'evil.example', authorization: `Bearer ${TOKEN}` })).statusCode).toBe(403);
    expect((await post(jpeg.toString('base64'), AUTH, 99)).statusCode).toBe(404);
    expect(fs.existsSync(photos)).toBe(false);
  });
});
