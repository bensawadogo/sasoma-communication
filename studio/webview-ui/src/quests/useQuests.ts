import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchBoard, hasQuestAccess, sendCommand } from './questsApi.js';
import type { Board, QuestCommand } from './questTypes.js';

const POLL_MS = 5000;

export interface QuestsState {
  board: Board | null;
  /** True once the first answer (or failure) came back. */
  loaded: boolean;
  /** Set when a command was refused: the rule's message, shown until the next action. */
  error: string | null;
  /** The player's level went up since the last look: the title reached, for a short celebration. */
  levelUp: string | null;
  busy: boolean;
  send: (command: QuestCommand) => Promise<boolean>;
  dismissLevelUp: () => void;
  clearError: () => void;
}

/** The quest board while the panel is open: polled every few seconds, replaced by each command's answer. */
export function useQuests(active: boolean): QuestsState {
  const [board, setBoard] = useState<Board | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastLevel = useRef<number | null>(null);

  const apply = useCallback((next: Board) => {
    setBoard(next);
    const mine = next.players.find((p) => p.id === next.me.id);
    if (mine) {
      if (lastLevel.current !== null && mine.level > lastLevel.current) setLevelUp(mine.title);
      lastLevel.current = mine.level;
    }
  }, []);

  useEffect(() => {
    if (!active || !hasQuestAccess) {
      setLoaded(true);
      return;
    }
    const controller = new AbortController();
    const tick = async () => {
      try {
        const next = await fetchBoard(controller.signal);
        if (next) apply(next);
      } catch {
        // Aborted or offline: the next tick tries again.
      }
      setLoaded(true);
    };
    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, [active, apply]);

  const send = useCallback(
    async (command: QuestCommand) => {
      setBusy(true);
      setError(null);
      const result = await sendCommand(command);
      setBusy(false);
      if (result.ok) {
        apply(result.board);
        return true;
      }
      setError(result.message);
      return false;
    },
    [apply],
  );

  return {
    board,
    loaded,
    error,
    levelUp,
    busy,
    send,
    dismissLevelUp: () => setLevelUp(null),
    clearError: () => setError(null),
  };
}
