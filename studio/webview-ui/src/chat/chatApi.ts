import { serverToken } from '../transport/serverToken.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  text: string;
  at?: string;
}

export interface ChatState {
  agentId: number;
  name: string;
  /** The agent has a terminal in the Studio, so a message can be typed into it. */
  canSend: boolean;
  /** The agent's turn is over: it waits for the person. */
  waiting: boolean;
  messages: ChatMessage[];
}

export type SendResult = { ok: true } | { ok: false; message: string };

/** The token rides a header, never the URL, so it stays out of request logs. */
function headers(): HeadersInit {
  return { Authorization: `Bearer ${serverToken ?? ''}`, 'Content-Type': 'application/json' };
}

export const hasChatAccess = serverToken !== null;

export async function fetchChat(agentId: number, signal?: AbortSignal): Promise<ChatState | null> {
  if (!hasChatAccess) return null;
  const res = await fetch(`/api/chat/${agentId}`, { headers: headers(), signal });
  if (!res.ok) return null;
  return (await res.json()) as ChatState;
}

export async function sendChat(agentId: number, text: string): Promise<SendResult> {
  try {
    const res = await fetch(`/api/chat/${agentId}/send`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ text }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json()) as { message?: string };
    return { ok: false, message: data.message ?? 'Refusé.' };
  } catch {
    return { ok: false, message: 'Connexion perdue. Réessaie.' };
  }
}

export type PhotoResult = { ok: true; path: string; rel: string } | { ok: false; message: string };

/** Sends one (already shrunk) photo to the server, which saves it where the agents can read it. */
export async function uploadPhoto(agentId: number, base64: string): Promise<PhotoResult> {
  try {
    const res = await fetch(`/api/chat/${agentId}/photo`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ data: base64 }),
    });
    const data = (await res.json()) as { message?: string; path?: string; rel?: string };
    if (res.ok && data.path && data.rel) return { ok: true, path: data.path, rel: data.rel };
    return { ok: false, message: data.message ?? 'Photo refusée.' };
  } catch {
    return { ok: false, message: 'Connexion perdue. Réessaie.' };
  }
}

export interface RosterEntry {
  agentId: number;
  name: string;
  waiting: boolean;
  canSend: boolean;
}

/** Everyone the server knows, with their display names (the 3D office labels its characters with them). */
export async function fetchRoster(signal?: AbortSignal): Promise<RosterEntry[] | null> {
  if (!hasChatAccess) return null;
  const res = await fetch('/api/chat', { headers: headers(), signal });
  if (!res.ok) return null;
  const body = (await res.json()) as { agents?: RosterEntry[] };
  return Array.isArray(body.agents) ? body.agents : null;
}
