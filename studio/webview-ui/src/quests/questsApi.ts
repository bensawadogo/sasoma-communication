import { serverToken } from '../transport/serverToken.js';
import type { Board, CommandResult, QuestCommand } from './questTypes.js';

/** The token rides a header, never the URL, so it stays out of request logs. */
function headers(): HeadersInit {
  return { Authorization: `Bearer ${serverToken ?? ''}`, 'Content-Type': 'application/json' };
}

export const hasQuestAccess = serverToken !== null;

export async function fetchBoard(signal?: AbortSignal): Promise<Board | null> {
  if (!hasQuestAccess) return null;
  const res = await fetch('/api/quests', { headers: headers(), signal });
  if (!res.ok) return null;
  return (await res.json()) as Board;
}

export async function sendCommand(command: QuestCommand): Promise<CommandResult> {
  try {
    const res = await fetch('/api/quests/command', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(command),
    });
    const data = (await res.json()) as { message?: string } & Partial<Board>;
    if (res.ok) return { ok: true, board: data as Board };
    return { ok: false, message: data.message ?? 'Refusé.' };
  } catch {
    return { ok: false, message: 'Connexion perdue. Réessaie.' };
  }
}
