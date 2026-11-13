import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as path from 'path';

import { bearerTokenValid, normalizeHostname } from '../wsAuth.js';
import { parseRecord, TokenLedger } from './tokenLedger.js';

export interface TokenRouteOptions {
  token: string;
  allowedHostnames: ReadonlySet<string>;
  ledger?: TokenLedger;
}

export function defaultDataDir(): string {
  return process.env['STUDIO_DATA_DIR'] ?? path.join(process.cwd(), 'production');
}

/** `/api/tokens`: the token bar's data, and where other providers' callers report their usage. */
export function registerTokenRoutes(app: FastifyInstance, options: TokenRouteOptions): void {
  const ledger = options.ledger ?? new TokenLedger({ dataDir: defaultDataDir() });

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

  app.get('/api/tokens', async (request, reply) => {
    if (!gate(request, reply)) return;
    reply.send({ ok: true, ...ledger.report() });
  });

  app.post<{ Body: unknown }>('/api/tokens/record', async (request, reply) => {
    if (!gate(request, reply)) return;
    const event = parseRecord(request.body, Date.now());
    if (!event) {
      reply.code(400).send({ ok: false, message: 'Usage invalide (provider, input, output requis ; claude est lu automatiquement).' });
      return;
    }
    ledger.record(event);
    reply.send({ ok: true });
  });
}
