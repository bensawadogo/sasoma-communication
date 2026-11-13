import { useCallback, useEffect, useState } from 'react';

import type { ChatState } from './chatApi.js';
import { fetchChat, hasChatAccess, sendChat, uploadPhoto } from './chatApi.js';
import { shrinkPhoto } from './photo.js';

const POLL_MS = 2000;
/** After a message is sent the answer starts within seconds: look more often for a short while. */
const FAST_POLL_MS = 700;
const FAST_POLL_COUNT = 12;

export interface AgentChat {
  chat: ChatState | null;
  loaded: boolean;
  error: string | null;
  sending: boolean;
  send: (text: string, photo?: File | null) => Promise<boolean>;
  clearError: () => void;
}

/** One agent's conversation while its popup is open: read from its transcript, refreshed every couple of seconds. */
export function useAgentChat(agentId: number | null): AgentChat {
  const [chat, setChat] = useState<ChatState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Bumped by a send: restarts the polling loop in its fast phase.
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    setChat(null);
    setLoaded(false);
    setError(null);
  }, [agentId]);

  useEffect(() => {
    if (agentId === null || !hasChatAccess) {
      setLoaded(true);
      return;
    }
    const controller = new AbortController();
    let timer = 0;
    let remainingFast = burst > 0 ? FAST_POLL_COUNT : 0;
    const tick = async () => {
      try {
        const next = await fetchChat(agentId, controller.signal);
        if (controller.signal.aborted) return;
        if (next) setChat(next);
      } catch {
        // Aborted or offline: the next tick tries again.
      }
      if (controller.signal.aborted) return;
      setLoaded(true);
      const delay = remainingFast > 0 ? FAST_POLL_MS : POLL_MS;
      if (remainingFast > 0) remainingFast -= 1;
      timer = window.setTimeout(() => void tick(), delay);
    };
    void tick();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [agentId, burst]);

  const send = useCallback(
    async (text: string, photo?: File | null) => {
      if (agentId === null) return false;
      setSending(true);
      setError(null);
      let message = text;
      if (photo) {
        try {
          const uploaded = await uploadPhoto(agentId, await shrinkPhoto(photo));
          if (!uploaded.ok) {
            setSending(false);
            setError(uploaded.message);
            return false;
          }
          // The agent opens the file itself (its Read tool shows images); the path is all the message carries.
          message = `${text} (photo jointe, à regarder avec Read : ${uploaded.path})`.trim();
        } catch (e) {
          setSending(false);
          setError(e instanceof Error ? e.message : 'Photo illisible.');
          return false;
        }
      }
      const result = await sendChat(agentId, message);
      setSending(false);
      if (result.ok) {
        setBurst((n) => n + 1);
        return true;
      }
      setError(result.message);
      return false;
    },
    [agentId],
  );

  return { chat, loaded, error, sending, send, clearError: () => setError(null) };
}
