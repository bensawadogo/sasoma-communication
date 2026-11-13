import * as fs from 'fs';
import * as path from 'path';

import { decide, emptyState, levelOf, reduce } from './questRules.js';
import type { Actor, Decision, Player, QuestCommand, QuestEvent, QuestState } from './types.js';

const EVENT_TYPES = new Set(['mission_created', 'step_completed', 'gate_rejected']);

/** Append-only JSON-lines log. The log is the truth; XP and levels are only ever recomputed from it. */
export class QuestStore {
  constructor(private readonly file: string) {}

  append(event: QuestEvent): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.appendFileSync(this.file, JSON.stringify(event) + '\n', 'utf8');
  }

  /** Lines that are not a recognisable event are counted and skipped, never guessed at. */
  load(): { events: QuestEvent[]; skipped: number } {
    if (!fs.existsSync(this.file)) return { events: [], skipped: 0 };
    const events: QuestEvent[] = [];
    let skipped = 0;
    for (const line of fs.readFileSync(this.file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const parsed: unknown = JSON.parse(line);
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          EVENT_TYPES.has((parsed as { type?: string }).type ?? '') &&
          typeof (parsed as { missionId?: unknown }).missionId === 'string'
        ) {
          events.push(parsed as QuestEvent);
        } else {
          skipped += 1;
        }
      } catch {
        skipped += 1;
      }
    }
    return { events, skipped };
  }
}

export interface PlayerView extends Player {
  level: number;
  title: string;
  nextLevelAt: number | null;
}

export interface QuestSnapshot {
  missions: QuestState['missions'];
  players: PlayerView[];
  skippedLines: number;
}

/**
 * One engine per studio. Commands are checked against the business rules; only accepted ones reach the log.
 * Who the actor is must come from the authenticated request, never from the request body.
 */
export class QuestEngine {
  private state: QuestState = emptyState();
  private skipped = 0;

  constructor(
    private readonly store: QuestStore,
    private readonly now: () => number = Date.now,
  ) {
    const { events, skipped } = store.load();
    this.skipped = skipped;
    for (const event of events) this.state = reduce(this.state, event);
  }

  dispatch(command: QuestCommand, actor: Actor): Decision {
    const decision = decide(this.state, command, actor, this.now());
    if (decision.ok) {
      this.store.append(decision.event);
      this.state = reduce(this.state, decision.event);
    }
    return decision;
  }

  snapshot(): QuestSnapshot {
    const players = Object.values(this.state.players)
      .map((p): PlayerView => {
        const { level, title, nextAt } = levelOf(p.xp);
        return { ...p, level, title, nextLevelAt: nextAt };
      })
      .sort((a, b) => b.xp - a.xp);
    return { missions: this.state.missions, players, skippedLines: this.skipped };
  }
}
