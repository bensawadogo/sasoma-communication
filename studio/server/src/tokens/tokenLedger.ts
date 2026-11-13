import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Token ledger: how many tokens each AI provider has used, for the Studio's token bar.
 *
 * Two sources:
 *  - Claude: read from Claude Code's own transcripts (~/.claude/projects/<project>/**.jsonl, sub-agents included).
 *    A streamed answer is written as several lines sharing one message id; the LAST line holds the final counts
 *    (the first ones carry placeholders), so one event is kept per message id, the last seen.
 *  - Other providers (DeepSeek, Kimi...): lines appended to `<data dir>/tokens.jsonl` through POST /api/tokens/record
 *    by whatever calls them (the future `delegue-ia` server). Until something writes there, they read "not connected".
 *
 * Counts from transcripts are an estimate of consumption, not an invoice: nothing here is a price.
 */

export interface TokenTotals {
  /** Fresh input + cache writes + output: what the bar adds up. */
  total: number;
  input: number;
  output: number;
  cacheWrite: number;
  /** Tokens served from the cache: cheap and large, reported apart and left out of `total`. */
  cacheRead: number;
  messages: number;
}

export interface UsageEvent {
  /** Epoch milliseconds. */
  at: number;
  provider: string;
  model: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export interface ProviderBudget {
  /** Optional ceilings, in `total` tokens. Absent = no cap, so the bar shows numbers only (never an invented percentage). */
  fiveHourTokens?: number;
  dailyTokens?: number;
}

export interface ProviderReport {
  id: string;
  label: string;
  /** False when nothing has ever been recorded for this provider. */
  connected: boolean;
  fiveHour: TokenTotals;
  today: TokenTotals;
  week: TokenTotals;
  byModel: Array<{ model: string; today: TokenTotals }>;
  budget?: ProviderBudget;
}

export interface TokenReport {
  generatedAt: number;
  providers: ProviderReport[];
}

const HOUR = 3_600_000;
const FIVE_HOURS = 5 * HOUR;
const WEEK = 7 * 24 * HOUR;
/** Providers listed even before they report anything, so the bar shows what is planned and what is live. */
const KNOWN_PROVIDERS: Record<string, string> = { claude: 'Claude', deepseek: 'DeepSeek', kimi: 'Kimi' };

export const emptyTotals = (): TokenTotals => ({ total: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0, messages: 0 });

function add(t: TokenTotals, e: UsageEvent): void {
  t.input += e.input;
  t.output += e.output;
  t.cacheWrite += e.cacheWrite;
  t.cacheRead += e.cacheRead;
  t.total += e.input + e.output + e.cacheWrite;
  t.messages += 1;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Incrementally read file: only the bytes added since last time are parsed. */
class JsonlTail {
  private offset = 0;
  private carry = '';
  constructor(private readonly onRecord: (rec: Record<string, unknown>) => void) {}

  /** Returns true when the file changed. */
  poll(file: string): boolean {
    let size: number;
    try {
      size = fs.statSync(file).size;
    } catch {
      return false;
    }
    if (size < this.offset) {
      this.offset = 0; // The file was replaced or truncated: start over.
      this.carry = '';
    }
    if (size === this.offset) return false;
    const fd = fs.openSync(file, 'r');
    try {
      const buf = Buffer.alloc(size - this.offset);
      fs.readSync(fd, buf, 0, buf.length, this.offset);
      this.offset = size;
      const text = this.carry + buf.toString('utf8');
      const lines = text.split('\n');
      this.carry = lines.pop() ?? ''; // A line still being written waits for its end.
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const rec: unknown = JSON.parse(line);
          if (isObj(rec)) this.onRecord(rec);
        } catch {
          // Damaged line: skipped.
        }
      }
    } finally {
      fs.closeSync(fd);
    }
    return true;
  }
}

export interface LedgerOptions {
  /** Folder for tokens.jsonl and budgets.json. */
  dataDir: string;
  /** Claude Code's projects folder. Default: ~/.claude/projects */
  claudeProjectsDir?: string;
  /** Only project folders whose name contains this are read (case-insensitive). */
  projectMatch?: string;
  now?: () => number;
}

export class TokenLedger {
  private readonly claudeDir: string;
  private readonly match: string;
  private readonly now: () => number;
  /** file -> tail reader; message key -> last event seen for that message. */
  private readonly tails = new Map<string, JsonlTail>();
  private readonly claudeEvents = new Map<string, UsageEvent>();
  private readonly external: UsageEvent[] = [];
  private externalTail: JsonlTail;
  private lastScan = 0;

  constructor(private readonly options: LedgerOptions) {
    this.claudeDir = options.claudeProjectsDir ?? path.join(os.homedir(), '.claude', 'projects');
    this.match = (options.projectMatch ?? 'SASOMA-COMMUNICATION').toLowerCase();
    this.now = options.now ?? Date.now;
    this.externalTail = new JsonlTail((rec) => this.readExternal(rec));
  }

  get ledgerFile(): string {
    return path.join(this.options.dataDir, 'tokens.jsonl');
  }

  /** Appends one use of a provider. The caller has already validated the shape (see parseRecord). */
  record(event: UsageEvent): void {
    fs.mkdirSync(this.options.dataDir, { recursive: true });
    fs.appendFileSync(this.ledgerFile, JSON.stringify(event) + '\n', 'utf8');
    this.lastScan = 0; // The next report re-reads.
  }

  private readExternal(rec: Record<string, unknown>): void {
    const provider = typeof rec['provider'] === 'string' ? rec['provider'] : '';
    if (!/^[a-z0-9-]{1,32}$/.test(provider) || provider === 'claude') return; // Claude is read from its transcripts only.
    this.external.push({
      at: num(rec['at']),
      provider,
      model: typeof rec['model'] === 'string' ? rec['model'].slice(0, 64) : 'inconnu',
      input: num(rec['input']),
      output: num(rec['output']),
      cacheWrite: 0,
      cacheRead: 0,
    });
  }

  private claudeRecord(rec: Record<string, unknown>): void {
    if (rec['type'] !== 'assistant' || !isObj(rec['message'])) return;
    const msg = rec['message'];
    const usage = msg['usage'];
    if (!isObj(usage)) return;
    const at = typeof rec['timestamp'] === 'string' ? Date.parse(rec['timestamp']) : NaN;
    if (!Number.isFinite(at)) return;
    const event: UsageEvent = {
      at,
      provider: 'claude',
      model: typeof msg['model'] === 'string' ? msg['model'] : 'inconnu',
      input: num(usage['input_tokens']),
      output: num(usage['output_tokens']),
      cacheWrite: num(usage['cache_creation_input_tokens']),
      cacheRead: num(usage['cache_read_input_tokens']),
    };
    if (event.model === '<synthetic>') return; // API errors and interrupts: zeros that mean "no news".
    const id = typeof msg['id'] === 'string' ? msg['id'] : null;
    const requestId = typeof rec['requestId'] === 'string' ? rec['requestId'] : '';
    // One streamed answer = several lines with one message id; the last one is final.
    const key = id ? `${id}:${requestId}` : `${at}:${event.output}:${event.model}`;
    this.claudeEvents.set(key, event);
  }

  private claudeFiles(): string[] {
    const out: string[] = [];
    const cutoff = this.now() - WEEK - HOUR;
    const walk = (dir: string, depth: number) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && depth < 4) walk(full, depth + 1);
        else if (e.isFile() && e.name.endsWith('.jsonl')) {
          try {
            if (fs.statSync(full).mtimeMs >= cutoff) out.push(full);
          } catch {
            // Gone meanwhile.
          }
        }
      }
    };
    let projects: fs.Dirent[] = [];
    try {
      projects = fs.readdirSync(this.claudeDir, { withFileTypes: true });
    } catch {
      return out;
    }
    for (const p of projects) {
      if (p.isDirectory() && p.name.toLowerCase().includes(this.match)) walk(path.join(this.claudeDir, p.name), 0);
    }
    return out;
  }

  /** Reads what is new on disk. Cheap when nothing changed; throttled so a polling client cannot hammer the disk. */
  refresh(minIntervalMs = 4000): void {
    const t = this.now();
    if (t - this.lastScan < minIntervalMs) return;
    this.lastScan = t;
    for (const file of this.claudeFiles()) {
      let tail = this.tails.get(file);
      if (!tail) {
        tail = new JsonlTail((rec) => this.claudeRecord(rec));
        this.tails.set(file, tail);
      }
      tail.poll(file);
    }
    this.externalTail.poll(this.ledgerFile);
  }

  private budgets(): Record<string, ProviderBudget> {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(path.join(this.options.dataDir, 'budgets.json'), 'utf8'));
      if (!isObj(parsed)) return {};
      const out: Record<string, ProviderBudget> = {};
      for (const [id, v] of Object.entries(parsed)) {
        if (!isObj(v) || !/^[a-z0-9-]{1,32}$/.test(id)) continue;
        const b: ProviderBudget = {};
        if (num(v['fiveHourTokens']) > 0) b.fiveHourTokens = num(v['fiveHourTokens']);
        if (num(v['dailyTokens']) > 0) b.dailyTokens = num(v['dailyTokens']);
        out[id] = b;
      }
      return out;
    } catch {
      return {};
    }
  }

  report(): TokenReport {
    this.refresh();
    const t = this.now();
    const startOfDay = t - (t % (24 * HOUR)); // Ouagadougou is on UTC+0, so UTC midnight is local midnight.
    const budgets = this.budgets();
    const all = [...this.claudeEvents.values(), ...this.external];
    const byProvider = new Map<string, ProviderReport>();
    const ensure = (id: string): ProviderReport => {
      let r = byProvider.get(id);
      if (!r) {
        r = {
          id,
          label: KNOWN_PROVIDERS[id] ?? id,
          connected: false,
          fiveHour: emptyTotals(),
          today: emptyTotals(),
          week: emptyTotals(),
          byModel: [],
          ...(budgets[id] ? { budget: budgets[id] } : {}),
        };
        byProvider.set(id, r);
      }
      return r;
    };
    for (const id of Object.keys(KNOWN_PROVIDERS)) ensure(id);
    const models = new Map<string, TokenTotals>();
    for (const e of all) {
      const r = ensure(e.provider);
      r.connected = true;
      if (e.at >= t - WEEK) add(r.week, e);
      if (e.at >= startOfDay) {
        add(r.today, e);
        const key = `${e.provider}\u0000${e.model}`;
        const m = models.get(key) ?? emptyTotals();
        add(m, e);
        models.set(key, m);
      }
      if (e.at >= t - FIVE_HOURS) add(r.fiveHour, e);
    }
    for (const [key, today] of models) {
      const [provider, model] = key.split('\u0000') as [string, string];
      ensure(provider).byModel.push({ model, today });
    }
    return { generatedAt: t, providers: [...byProvider.values()] };
  }
}

/** Strict shape of a usage line sent by another provider's caller. */
export function parseRecord(body: unknown, at: number): UsageEvent | null {
  if (!isObj(body)) return null;
  const provider = body['provider'];
  if (typeof provider !== 'string' || !/^[a-z0-9-]{1,32}$/.test(provider) || provider === 'claude') return null;
  const input = body['input'];
  const output = body['output'];
  const ok = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1_000_000_000;
  if (!ok(input) || !ok(output)) return null;
  const model = typeof body['model'] === 'string' && body['model'].length <= 64 ? body['model'] : 'inconnu';
  return { at, provider, model, input: Math.floor(input as number), output: Math.floor(output as number), cacheWrite: 0, cacheRead: 0 };
}
