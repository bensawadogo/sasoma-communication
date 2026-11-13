import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';

import type { AgentStateStore } from '../agentStateStore.js';
import type { TerminalSessions } from '../terminal/terminalSessions.js';
import { bearerTokenValid, normalizeHostname } from '../wsAuth.js';

/** Studio chat: talk to an agent from a popup instead of its terminal. Standalone only. */

/** How much of the end of a transcript is read: enough for a long conversation, never the whole file. */
const MAX_TRANSCRIPT_BYTES = 1_500_000;
/** Messages returned per request (the newest). */
const MAX_MESSAGES = 150;
/** Longest message the chat sends. */
export const MAX_PROMPT_CHARS = 2000;
/** The text is typed first and Enter follows after this pause, so the terminal never reads Enter as part of a paste. */
const ENTER_DELAY_MS = 150;
/** One line of a tool's activity in the chat. */
const TOOL_DETAIL_CHARS = 90;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  text: string;
  /** ISO timestamp from the transcript, when it has one. */
  at?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** What the chat shows of a tool call: its name and the one input that says what it works on. */
function toolLine(block: Record<string, unknown>): string {
  const name = typeof block['name'] === 'string' ? block['name'] : 'outil';
  const input = isObj(block['input']) ? block['input'] : {};
  const detail = [input['file_path'], input['path'], input['command'], input['pattern'], input['description'], input['prompt']].find(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  );
  return detail ? `${name} · ${detail.replace(/\s+/g, ' ').slice(0, TOOL_DETAIL_CHARS)}` : name;
}

/** Text typed by the person: skips tool results, system notices and slash-command echoes (they start with "<"). */
function userText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((b) => (isObj(b) && b['type'] === 'text' && typeof b['text'] === 'string' ? b['text'] : ''))
    .join('\n');
}

/** Reads the end of a Claude Code transcript (JSONL) and returns the conversation as chat messages. Never throws. */
export function readChatMessages(file: string): ChatMessage[] {
  let raw: string;
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      const start = Math.max(0, size - MAX_TRANSCRIPT_BYTES);
      const buf = Buffer.alloc(size - start);
      fs.readSync(fd, buf, 0, buf.length, start);
      raw = buf.toString('utf8');
      // A read that starts mid-file begins with a partial line: drop it.
      if (start > 0) raw = raw.slice(raw.indexOf('\n') + 1);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return [];
  }

  const out: ChatMessage[] = [];
  const lines = raw.split('\n');
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    let rec: unknown;
    try {
      rec = JSON.parse(line);
    } catch {
      return; // A line still being written, or damaged: skipped.
    }
    if (!isObj(rec) || !isObj(rec['message'])) return;
    if (rec['isSidechain'] === true || rec['isMeta'] === true) return;
    const id = typeof rec['uuid'] === 'string' ? rec['uuid'] : `l${index}`;
    const at = typeof rec['timestamp'] === 'string' ? rec['timestamp'] : undefined;
    const content = rec['message']['content'];

    if (rec['type'] === 'user') {
      const text = userText(content).trim();
      if (text && !text.startsWith('<')) out.push({ id, role: 'user', text, ...(at ? { at } : {}) });
    } else if (rec['type'] === 'assistant' && Array.isArray(content)) {
      content.forEach((block, i) => {
        if (!isObj(block)) return;
        if (block['type'] === 'text' && typeof block['text'] === 'string' && block['text'].trim()) {
          out.push({ id: `${id}:${i}`, role: 'assistant', text: block['text'].trim(), ...(at ? { at } : {}) });
        } else if (block['type'] === 'tool_use') {
          out.push({ id: `${id}:${i}`, role: 'tool', text: toolLine(block), ...(at ? { at } : {}) });
        }
      });
    }
  });
  return out.slice(-MAX_MESSAGES);
}

/** One line of plain text safe to type into a terminal: no newline, no escape or control characters. */
export function sanitizePrompt(text: string): string {
  return text
    .replace(/[\r\n\t]+/g, ' ')
     
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface ChatRouteOptions {
  token: string;
  allowedHostnames: ReadonlySet<string>;
  store: AgentStateStore;
  ptyManager?: TerminalSessions;
}

export function registerChatRoutes(app: FastifyInstance, options: ChatRouteOptions): void {
  // Same two gates as the quest board: a trusted Host and the server token. Typing into an agent is
  // as powerful as its terminal (it runs with that agent's tools), so only the token holder may do it.
  const gate = (request: FastifyRequest, reply: FastifyReply): boolean => {
    const host = normalizeHostname(request.headers.host);
    if (host === null || !options.allowedHostnames.has(host)) {
      reply.code(403).send({ ok: false, message: 'Hôte non autorisé.' });
      return false;
    }
    if (!bearerTokenValid(request.headers.authorization, options.token)) {
      reply.code(401).send({ ok: false, message: 'Non autorisé.' });
      return false;
    }
    return true;
  };

  const agentOf = (idParam: string, reply: FastifyReply) => {
    const id = Number(idParam);
    const agent = Number.isInteger(id) && id >= 0 ? options.store.get(id) : undefined;
    if (!agent) {
      reply.code(404).send({ ok: false, message: 'Agent introuvable.' });
      return null;
    }
    return { id, agent };
  };

  const state = (id: number, agent: NonNullable<ReturnType<AgentStateStore['get']>>) => {
    const session = options.ptyManager?.get(id);
    return {
      ok: true as const,
      agentId: id,
      name: agent.agentName ?? `Agent ${id}`,
      /** Typing needs the agent's own terminal, which only agents launched from the Studio have. */
      canSend: session !== undefined && !session.hasExited,
      /** True while the agent waits for the person (its turn is over). */
      waiting: agent.isWaiting,
      messages: readChatMessages(agent.jsonlFile),
    };
  };

  // The roster for the 3D office: who is there and what each is doing, without any transcript text.
  app.get('/api/chat', async (request, reply) => {
    if (!gate(request, reply)) return;
    const agents = [...options.store.entries()].map(([id, agent]) => ({
      agentId: id,
      name: agent.agentName ?? `Agent ${id}`,
      waiting: agent.isWaiting,
      canSend: options.ptyManager?.get(id)?.hasExited === false,
    }));
    reply.send({ ok: true, agents });
  });

  app.get<{ Params: { agentId: string } }>('/api/chat/:agentId', async (request, reply) => {
    if (!gate(request, reply)) return;
    const found = agentOf(request.params.agentId, reply);
    if (!found) return;
    reply.send(state(found.id, found.agent));
  });

  app.post<{ Params: { agentId: string }; Body: unknown }>('/api/chat/:agentId/send', async (request, reply) => {
    if (!gate(request, reply)) return;
    const found = agentOf(request.params.agentId, reply);
    if (!found) return;
    const body = request.body;
    const raw = isObj(body) && typeof body['text'] === 'string' ? body['text'] : '';
    const text = sanitizePrompt(raw).slice(0, MAX_PROMPT_CHARS);
    if (!text) {
      reply.code(400).send({ ok: false, message: 'Message vide.' });
      return;
    }
    const session = options.ptyManager?.get(found.id);
    if (!session || session.hasExited) {
      reply.code(409).send({
        ok: false,
        message: "Cet agent n'a pas de terminal ouvert dans le Studio : lance-le depuis le Studio (bouton +) pour lui écrire.",
      });
      return;
    }
    session.write(text);
    setTimeout(() => {
      if (!session.hasExited) session.write('\r');
    }, ENTER_DELAY_MS);
    reply.send({ ok: true });
  });
}
