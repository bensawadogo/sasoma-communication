import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { bearerTokenValid, normalizeHostname, timingSafeStringEqual } from '../wsAuth.js';
import { QuestEngine, QuestStore } from './questEngine.js';
import { LEVELS } from './questRules.js';
import type { Actor, Gate, QaItem, QuestCommand, Role, Step } from './types.js';
import { GATES, QA_ITEMS, STEPS } from './types.js';

type CompleteStep = Extract<QuestCommand, { type: 'complete_step' }>;

const ROLES: readonly Role[] = ['chef', 'secretary', 'agent'];

/** The chef (Ben) is whoever holds the server token. */
const CHEF: Actor = { id: 'ben', role: 'chef' };

/**
 * Where the log lives: the business project, not the tool's home, so it travels with the client files.
 * `STUDIO_DATA_DIR` overrides; otherwise `<folder the CLI was started in>/production`.
 */
export function defaultQuestFile(): string {
  const dir = process.env['STUDIO_DATA_DIR'] ?? path.join(process.cwd(), 'production');
  return path.join(dir, 'quests.jsonl');
}

/**
 * Extra players with their own token and a limited role, from `~/.pixel-agents/quest-actors.json`:
 * `{ "<token>": { "id": "awa", "role": "secretary" } }`. A secretary token never opens a gate (the rules say so),
 * and the role always comes from this file, never from a request.
 */
function loadExtraActors(file: string): Map<string, Actor> {
  const out = new Map<string, Actor>();
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null) return out;
    for (const [token, value] of Object.entries(parsed)) {
      const v = value as { id?: unknown; role?: unknown };
      if (
        token.length >= 16 &&
        typeof v.id === 'string' &&
        /^[a-z0-9_-]{1,32}$/.test(v.id) &&
        typeof v.role === 'string' &&
        (ROLES as readonly string[]).includes(v.role) &&
        v.role !== 'chef' // there is one chef: the holder of the server token
      ) {
        out.set(token, { id: v.id, role: v.role as Role });
      }
    }
  } catch {
    // No file, or damaged: only the chef can play.
  }
  return out;
}

function bearer(header: string | undefined): string {
  const m = /^Bearer\s+(.+)$/i.exec(header ?? '');
  return m?.[1]?.trim() ?? '';
}

export function resolveActor(
  authorization: string | undefined,
  serverToken: string,
  extra: ReadonlyMap<string, Actor>,
): Actor | null {
  if (bearerTokenValid(authorization, serverToken)) return CHEF;
  const provided = bearer(authorization);
  if (!provided) return null;
  for (const [token, actor] of extra) {
    if (timingSafeStringEqual(provided, token)) return actor;
  }
  return null;
}

const isStr = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

/** Strict shape check of a request body: anything unexpected is refused, extra keys are dropped. */
export function parseCommand(body: unknown): QuestCommand | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const stepOk = (v: unknown) => typeof v === 'string' && (STEPS as readonly string[]).includes(v);
  const gateOk = (v: unknown) => typeof v === 'string' && (GATES as readonly string[]).includes(v);

  if (b['type'] === 'create_mission') {
    if (!isStr(b['missionId'], 64) || !isStr(b['clientId'], 64) || !isStr(b['title'], 140)) return null;
    return { type: 'create_mission', missionId: b['missionId'], clientId: b['clientId'], title: b['title'] };
  }

  if (b['type'] === 'complete_step') {
    if (!isStr(b['missionId'], 64) || !stepOk(b['step'])) return null;
    let production: CompleteStep['production'];
    let checklist: CompleteStep['checklist'];

    const p = b['production'];
    if (p !== undefined) {
      const o = p as Record<string, unknown>;
      if (
        typeof p !== 'object' ||
        p === null ||
        !isBool(o['realPhoto']) ||
        !isBool(o['aiGeneratedProduct']) ||
        !isBool(o['paidToolUsed']) ||
        !isBool(o['costAnnounced'])
      ) {
        return null;
      }
      production = {
        realPhoto: o['realPhoto'],
        aiGeneratedProduct: o['aiGeneratedProduct'],
        paidToolUsed: o['paidToolUsed'],
        costAnnounced: o['costAnnounced'],
      };
    }

    const c = b['checklist'];
    if (c !== undefined) {
      if (typeof c !== 'object' || c === null) return null;
      const list = {} as Record<QaItem, boolean>;
      for (const item of QA_ITEMS) {
        const v = (c as Record<string, unknown>)[item];
        if (v !== undefined && !isBool(v)) return null;
        list[item] = v === true;
      }
      checklist = list;
    }
    return {
      type: 'complete_step',
      missionId: b['missionId'],
      step: b['step'] as Step,
      ...(production ? { production } : {}),
      ...(checklist ? { checklist } : {}),
    };
  }

  if (b['type'] === 'reject_gate') {
    if (!isStr(b['missionId'], 64) || !gateOk(b['gate']) || !isStr(b['reason'], 500)) return null;
    return {
      type: 'reject_gate',
      missionId: b['missionId'],
      gate: b['gate'] as Gate,
      reason: b['reason'],
    };
  }
  return null;
}

export interface QuestRouteOptions {
  token: string;
  allowedHostnames: ReadonlySet<string>;
  engine?: QuestEngine;
}

/** `/api/quests`: read the board, send one command. Every request needs a bearer token and a trusted Host. */
export function registerQuestRoutes(app: FastifyInstance, options: QuestRouteOptions): void {
  const engine = options.engine ?? new QuestEngine(new QuestStore(defaultQuestFile()));
  const actorsFile = path.join(os.homedir(), '.pixel-agents', 'quest-actors.json');

  const gate = async (request: FastifyRequest, reply: FastifyReply): Promise<Actor | null> => {
    const host = normalizeHostname(request.headers.host);
    if (host === null || !options.allowedHostnames.has(host)) {
      reply.code(403).send({ ok: false, message: 'Hôte non autorisé.' });
      return null;
    }
    const actor = resolveActor(request.headers.authorization, options.token, loadExtraActors(actorsFile));
    if (!actor) {
      reply.code(401).send({ ok: false, message: 'Non autorisé.' });
      return null;
    }
    return actor;
  };

  const board = (actor: Actor) => ({
    me: actor,
    ...engine.snapshot(),
    rules: { steps: STEPS, gates: GATES, qaItems: QA_ITEMS, levels: LEVELS },
  });

  app.get('/api/quests', async (request, reply) => {
    const actor = await gate(request, reply);
    if (!actor) return;
    reply.send(board(actor));
  });

  app.post<{ Body: unknown }>('/api/quests/command', async (request, reply) => {
    const actor = await gate(request, reply);
    if (!actor) return;
    const command = parseCommand(request.body);
    if (!command) {
      reply.code(400).send({ ok: false, message: 'Commande invalide.' });
      return;
    }
    const decision = engine.dispatch(command, actor);
    if (!decision.ok) {
      reply.code(422).send({ ok: false, rule: decision.rule, message: decision.message });
      return;
    }
    reply.send({ ok: true, ...board(actor) });
  });
}
