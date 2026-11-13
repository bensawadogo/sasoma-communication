import '../quests/sims.css';

import { useEffect, useRef, useState } from 'react';

import { Modal } from '../components/ui/Modal.js';
import { Plumbob } from '../quests/Plumbob.js';
import type { ChatMessage } from './chatApi.js';
import { hasChatAccess } from './chatApi.js';
import { useAgentChat } from './useAgentChat.js';

interface AgentChatModalProps {
  /** The agent being talked to, or null when the popup is closed. */
  agentId: number | null;
  onClose: () => void;
  /** Opens the agent's raw terminal (desktop drawer / phone page). Absent: no such button. */
  onOpenTerminal?: (agentId: number) => void;
}

/**
 * The popup opened by clicking an agent: its conversation as chat bubbles, a field to write to it, and what it
 * is doing. The words come from the agent's own transcript; a message is typed into its terminal, so the
 * agent receives it exactly as if Ben had typed it there.
 */
export function AgentChatModal({ agentId, onClose, onOpenTerminal }: AgentChatModalProps) {
  const { chat, loaded, error, sending, send, clearError } = useAgentChat(agentId);
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const lastId = chat?.messages[chat.messages.length - 1]?.id;

  // Keep the newest message in view, unless Ben scrolled up to read older ones.
  const stickRef = useRef(true);
  useEffect(() => {
    const el = logRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [lastId, agentId]);

  const onScroll = () => {
    const el = logRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    stickRef.current = true;
    if (await send(text)) setDraft('');
  };

  const title = chat?.name ?? 'Agent';
  const working = chat !== null && !chat.waiting;

  return (
    <Modal isOpen={agentId !== null} onClose={onClose} title={title} className="w-[560px]">
      <div className="sims-root sims-chat">
        {!hasChatAccess ? (
          <p className="sims-muted" style={{ margin: 0 }}>
            Ouvre le lien complet du Studio (celui qui contient « ?token= ») pour parler à un agent.
          </p>
        ) : !loaded ? (
          <p className="sims-muted" style={{ margin: 0 }}>
            Chargement…
          </p>
        ) : !chat ? (
          <p className="sims-muted" style={{ margin: 0 }}>
            Cet agent n'est pas joignable. Il a peut-être été fermé.
          </p>
        ) : (
          <>
            <div className="sims-card sims-row" style={{ alignItems: 'flex-end', paddingTop: 22 }}>
              <div className="sims-avatar" aria-hidden="true">
                <Plumbob tone={working ? 'orange' : 'green'} />
                {chat.name.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="sims-title">{chat.name}</div>
                <div className="sims-muted sims-small" role="status">
                  {working ? 'Au travail…' : 'Il attend ton message'}
                </div>
              </div>
              {onOpenTerminal && (
                <button type="button" className="sims-btn" data-kind="plain" onClick={() => onOpenTerminal(chat.agentId)}>
                  Terminal
                </button>
              )}
            </div>

            <div ref={logRef} onScroll={onScroll} className="sims-chat-log" aria-live="polite">
              {chat.messages.length === 0 ? (
                <p className="sims-muted" style={{ margin: 0 }}>
                  Aucun message pour l'instant. Écris-lui ci-dessous.
                </p>
              ) : (
                chat.messages.map((m) => <Bubble key={m.id} message={m} agentName={chat.name} />)
              )}
              {working && (
                <div className="sims-typing" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="sims-alert">
                <span>{error}</span>
                <button type="button" onClick={clearError} aria-label="Fermer le message" className="sims-btn" data-kind="plain" style={{ minWidth: 46, padding: 0 }}>
                  ×
                </button>
              </div>
            )}

            {!chat.canSend && (
              <p className="sims-muted sims-small" style={{ margin: 0 }}>
                Cet agent n'a pas de terminal ouvert dans le Studio : tu peux lire sa conversation, pas lui écrire. Lance-le avec le bouton +
                pour pouvoir lui parler.
              </p>
            )}

            <form
              className="sims-row"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                className="sims-input"
                style={{ marginTop: 0 }}
                value={draft}
                maxLength={2000}
                disabled={!chat.canSend || sending}
                placeholder={chat.canSend ? `Écris à ${chat.name}…` : 'Écriture indisponible'}
                aria-label={`Message pour ${chat.name}`}
                enterKeyHint="send"
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="sims-btn" disabled={!chat.canSend || sending || !draft.trim()}>
                {sending ? '…' : 'Envoyer'}
              </button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

function Bubble({ message, agentName }: { message: ChatMessage; agentName: string }) {
  if (message.role === 'tool') {
    return <div className="sims-tool-line">› {message.text}</div>;
  }
  return (
    <div className="sims-bubble" data-role={message.role}>
      <div className="sims-bubble-who">{message.role === 'user' ? 'Toi' : agentName}</div>
      <div className="sims-bubble-text">{message.text}</div>
    </div>
  );
}
