import { useEffect, useState } from 'react';

import { fetchBoard, hasQuestAccess } from '../quests/questsApi.js';
import type { Gate } from '../quests/questTypes.js';
import type { GateCounts } from './officeBuilder.js';

// Every 12 s, and not while the page is hidden (a metered tunnel counts every request).
const POLL_MS = 12000;

/** How many missions wait at each of Ben's gates, read from the real quest board (the server's journal). */
export function useGateCounts(active: boolean): GateCounts | null {
  const [counts, setCounts] = useState<GateCounts | null>(null);
  useEffect(() => {
    if (!active || !hasQuestAccess) return;
    const controller = new AbortController();
    let timer = 0;
    const tick = async () => {
      try {
        const board = document.hidden ? null : await fetchBoard(controller.signal);
        if (board && !controller.signal.aborted) {
          const waiting = (gate: Gate) => Object.values(board.missions).filter((m) => m.next === gate).length;
          setCounts({ calendar: waiting('calendar_gate'), qa: waiting('qa_gate'), send: waiting('send_gate') });
        }
      } catch {
        // Offline or aborted: the next tick tries again.
      }
      if (!controller.signal.aborted) timer = window.setTimeout(() => void tick(), POLL_MS);
    };
    void tick();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [active]);
  return counts;
}
