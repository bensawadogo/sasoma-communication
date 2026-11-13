import './sims.css';

import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Modal } from '../components/ui/Modal.js';
import type { Tone } from './Plumbob.js';
import { Plumbob } from './Plumbob.js';
import { BADGE_LABEL, PRODUCTION_LABEL, QA_LABEL, ROLE_LABEL, STEP_ACTION, STEP_LABEL } from './questLabels.js';
import { hasQuestAccess } from './questsApi.js';
import type { Board, Gate, Mission, Player, Production, QaItem, QuestCommand, Step } from './questTypes.js';
import { useQuests } from './useQuests.js';

interface QuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'missions' | 'team';

const GATES: readonly Step[] = ['calendar_gate', 'qa_gate', 'send_gate'];
const isGate = (s: Step | 'done'): s is Gate => s !== 'done' && GATES.includes(s);

/**
 * The Studio's game layer: a board of missions (one per publication) that advance station by station,
 * three doors only the chef can open, and a team strip with levels. Every rule is enforced by the server;
 * this panel only shows the state and sends commands.
 */
export function QuestsModal({ isOpen, onClose }: QuestsModalProps) {
  const q = useQuests(isOpen);
  const [tab, setTab] = useState<Tab>('missions');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quêtes" className="w-[560px]">
      <div className="sims-root">
        {!hasQuestAccess ? (
          <p className="sims-muted" style={{ margin: 0 }}>
            Ouvre le lien complet du Studio (celui qui contient « ?token= ») pour jouer.
          </p>
        ) : !q.loaded ? (
          <p className="sims-muted" style={{ margin: 0 }}>
            Chargement…
          </p>
        ) : !q.board ? (
          <p className="sims-muted" style={{ margin: 0 }}>
            Le tableau n'est pas joignable. Vérifie que le Studio tourne, puis rouvre cette fenêtre.
          </p>
        ) : (
          <div className="sims-stack">
            <div role="tablist" className="sims-tabs" style={{ marginBottom: 0 }}>
              <TabButton active={tab === 'missions'} onClick={() => setTab('missions')}>
                Missions
              </TabButton>
              <TabButton active={tab === 'team'} onClick={() => setTab('team')}>
                Équipe
              </TabButton>
            </div>

            {q.levelUp && (
              <button type="button" onClick={q.dismissLevelUp} className="sims-levelup">
                <Sparks />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Plumbob tone="gold" inline />
                  Niveau supérieur ! Tu es maintenant {q.levelUp}.
                </span>
              </button>
            )}

            {q.error && (
              <div role="alert" className="sims-alert">
                <span>{q.error}</span>
                <button
                  type="button"
                  onClick={q.clearError}
                  aria-label="Fermer le message"
                  className="sims-btn"
                  data-kind="plain"
                  style={{ minWidth: 46, padding: 0 }}
                >
                  ×
                </button>
              </div>
            )}

            {tab === 'missions' ? (
              <MissionsTab board={q.board} send={q.send} busy={q.busy} />
            ) : (
              <TeamTab board={q.board} />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className="sims-tab">
      {children}
    </button>
  );
}

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return { dx: Math.round(Math.cos(angle) * 70), dy: Math.round(Math.sin(angle) * 34) };
});

/** Étincelles du changement de niveau : une seule fois à l'apparition du bandeau. */
function Sparks() {
  return (
    <>
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="sims-spark"
          style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animationDelay: `${i * 30}ms` } as CSSProperties}
        />
      ))}
    </>
  );
}

// ── Personnage et barre d'expérience ─────────────────────────

/** Une barre de besoin façon Sims : verte quand elle est bien remplie, jaune puis orange quand elle baisse. */
function NeedBar({ ratio, label, tone }: { ratio: number; label: string; tone?: 'high' | 'mid' | 'low' }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  const resolved = tone ?? (pct >= 60 ? 'high' : pct >= 30 ? 'mid' : 'low');
  return (
    <div
      className="sims-need"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="sims-need-fill" data-tone={resolved === 'high' ? undefined : resolved} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PlayerCard({ player, levels, tone }: { player: Player; levels: Board['rules']['levels']; tone: Tone }) {
  const floor = levels.find((l) => l.level === player.level)?.minXp ?? 0;
  const ceil = player.nextLevelAt;
  const ratio = ceil === null ? 1 : Math.min(1, (player.xp - floor) / Math.max(1, ceil - floor));

  // Le gain d'XP s'affiche un court instant à côté de la barre (calculé au rendu, sans effet).
  const [prevXp, setPrevXp] = useState(player.xp);
  const [pop, setPop] = useState<{ amount: number; key: number } | null>(null);
  if (player.xp !== prevXp) {
    if (player.xp > prevXp) setPop({ amount: player.xp - prevXp, key: player.xp });
    setPrevXp(player.xp);
  }

  const name = player.id === 'ben' ? 'Ben' : player.id;
  return (
    <div className="sims-row" style={{ alignItems: 'flex-end' }}>
      <div className="sims-avatar" aria-hidden="true">
        <Plumbob tone={tone} />
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div className="sims-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="sims-title">
            {name} · {player.title}
          </span>
          <span className="sims-muted sims-small">Niv. {player.level}</span>
        </div>
        <NeedBar ratio={ratio} label="Expérience" tone="high" />
        <div className="sims-muted sims-small" style={{ marginTop: 2 }}>
          {player.xp} XP{ceil !== null ? ` / ${ceil}` : ' · niveau maximum'}
        </div>
        {pop && (
          <span key={pop.key} className="sims-xp-pop" onAnimationEnd={() => setPop(null)}>
            +{pop.amount} XP
          </span>
        )}
      </div>
    </div>
  );
}

// ── Missions ─────────────────────────────────────────────────

interface Sender {
  send: (c: QuestCommand) => Promise<boolean>;
  busy: boolean;
}

function MissionsTab({ board, send, busy }: { board: Board } & Sender) {
  const me = board.players.find((p) => p.id === board.me.id);
  const missions = useMemo(
    () =>
      Object.values(board.missions).sort(
        (a, b) => Number(a.next === 'done') - Number(b.next === 'done') || a.title.localeCompare(b.title),
      ),
    [board.missions],
  );
  const [creating, setCreating] = useState(false);

  // Humeur du studio : orange tant qu'une porte attend Ben, vert sinon. Toujours accompagnée d'un texte.
  const waiting = missions.filter((m) => isGate(m.next)).length;
  const isChef = board.me.role === 'chef';
  const tone: Tone = waiting > 0 ? 'orange' : 'green';
  const moodText =
    waiting > 0
      ? isChef
        ? `${waiting} porte${waiting > 1 ? 's' : ''} t'attend${waiting > 1 ? 'ent' : ''}`
        : `${waiting} mission${waiting > 1 ? 's' : ''} attend${waiting > 1 ? 'ent' : ''} Ben`
      : missions.some((m) => m.next !== 'done')
        ? 'Tout roule, continue !'
        : 'Le studio est prêt pour une mission';

  return (
    <div className="sims-stack">
      <div className="sims-card">
        {me ? (
          <PlayerCard player={me} levels={board.rules.levels} tone={tone} />
        ) : (
          <p className="sims-muted" style={{ margin: 0 }}>
            Termine une première étape pour gagner de l'XP.
          </p>
        )}
      </div>

      <div className="sims-mood" data-tone={waiting > 0 ? 'wait' : undefined} role="status">
        <Plumbob tone={tone} inline />
        <span>{moodText}</span>
      </div>

      {creating ? (
        <NewMission
          busy={busy}
          onCancel={() => setCreating(false)}
          onCreate={async (clientId, title) => {
            const ok = await send({
              type: 'create_mission',
              missionId: `m-${Date.now().toString(36)}`,
              clientId,
              title,
            });
            if (ok) setCreating(false);
          }}
        />
      ) : (
        <SimsButton onClick={() => setCreating(true)}>+ Nouvelle mission</SimsButton>
      )}

      {missions.length === 0 ? (
        <p className="sims-muted" style={{ margin: 0 }}>
          Aucune mission. Une mission = une publication, de l'idée au bilan. Crée la première.
        </p>
      ) : (
        missions.map((m) => <MissionCard key={m.id} mission={m} board={board} send={send} busy={busy} />)
      )}
    </div>
  );
}

interface SimsButtonProps {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'plain' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  grow?: boolean;
}

function SimsButton({ children, onClick, kind, disabled, type = 'button', grow = false }: SimsButtonProps) {
  return (
    <button
      type={type}
      className="sims-btn"
      data-kind={kind}
      disabled={disabled}
      onClick={onClick}
      style={grow ? { flex: 1 } : undefined}
    >
      {children}
    </button>
  );
}

function NewMission({
  busy,
  onCancel,
  onCreate,
}: {
  busy: boolean;
  onCancel: () => void;
  onCreate: (clientId: string, title: string) => void;
}) {
  const [clientId, setClientId] = useState('sasoma');
  const [title, setTitle] = useState('');
  return (
    <form
      className="sims-card sims-stack"
      style={{ gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim() && clientId.trim()) onCreate(clientId.trim(), title.trim());
      }}
    >
      <label className="sims-muted sims-small">
        Client
        <input className="sims-input" value={clientId} maxLength={64} onChange={(e) => setClientId(e.target.value)} />
      </label>
      <label className="sims-muted sims-small">
        Titre de la publication
        <input
          className="sims-input"
          value={title}
          maxLength={140}
          autoFocus
          placeholder="Ex. : Pourquoi vidanger à temps"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div className="sims-row">
        <SimsButton type="submit" grow disabled={busy || !title.trim()}>
          Créer
        </SimsButton>
        <SimsButton kind="plain" onClick={onCancel}>
          Annuler
        </SimsButton>
      </div>
    </form>
  );
}

function StationPath({ mission, steps }: { mission: Mission; steps: readonly Step[] }) {
  return (
    <ol className="sims-path" aria-label="Progression">
      {steps.map((step, i) => {
        const done = mission.completed.includes(step);
        const current = mission.next === step;
        const gate = GATES.includes(step);
        const state = done ? 'done' : current ? 'current' : 'todo';
        return (
          <li key={step}>
            <span
              className="sims-node"
              data-state={state}
              data-gate={gate ? 'true' : undefined}
              title={STEP_LABEL[step]}
              aria-label={`${STEP_LABEL[step]} : ${done ? 'fait' : current ? 'maintenant' : 'à venir'}`}
            >
              <span aria-hidden="true">{done ? '✓' : ''}</span>
            </span>
            {i < steps.length - 1 && <span className="sims-link" data-done={done ? 'true' : undefined} />}
          </li>
        );
      })}
    </ol>
  );
}

function MissionCard({ mission, board, send, busy }: { mission: Mission; board: Board } & Sender) {
  const [open, setOpen] = useState(false);
  const { next } = mission;
  const isChef = board.me.role === 'chef';
  const canAct = next !== 'done' && (!isGate(next) || isChef);
  const total = board.rules.steps.length;
  const state = next === 'done' ? 'done' : isGate(next) ? 'gate' : undefined;

  return (
    <article className="sims-card sims-stack" style={{ gap: 8 }} data-state={state}>
      <header>
        <h3 className="sims-title">{mission.title}</h3>
        <div className="sims-muted sims-small">
          {mission.clientId}
          {mission.revisions > 0 ? ` · ${mission.revisions} retour${mission.revisions > 1 ? 's' : ''} de Ben` : ''}
        </div>
      </header>

      <StationPath mission={mission} steps={board.rules.steps} />
      <NeedBar ratio={mission.completed.length / total} label="Avancement de la mission" />

      {next === 'done' ? (
        <p className="sims-title" style={{ color: 'var(--sims-green-dark)' }}>
          Mission terminée. Bravo !
        </p>
      ) : (
        <>
          <p style={{ margin: 0 }}>
            Maintenant : <strong>{STEP_LABEL[next]}</strong>
            {!canAct && <span className="sims-muted"> · en attente de Ben</span>}
          </p>
          {canAct && !open && (
            <SimsButton onClick={() => setOpen(true)} disabled={busy}>
              {STEP_ACTION[next]}
            </SimsButton>
          )}
          {canAct && open && (
            <StepForm
              mission={mission}
              step={next}
              board={board}
              busy={busy}
              onCancel={() => setOpen(false)}
              send={async (c) => {
                const ok = await send(c);
                if (ok) setOpen(false);
                return ok;
              }}
            />
          )}
        </>
      )}
    </article>
  );
}

// ── Step forms ───────────────────────────────────────────────

function StepForm({
  mission,
  step,
  board,
  busy,
  onCancel,
  send,
}: {
  mission: Mission;
  step: Step;
  board: Board;
  busy: boolean;
  onCancel: () => void;
  send: (c: QuestCommand) => Promise<boolean>;
}) {
  if (step === 'production') {
    return (
      <ProductionForm
        busy={busy}
        onCancel={onCancel}
        onSubmit={(production) => send({ type: 'complete_step', missionId: mission.id, step, production })}
      />
    );
  }
  if (isGate(step)) {
    return (
      <GateForm
        gate={step}
        qaItems={board.rules.qaItems}
        busy={busy}
        onCancel={onCancel}
        onPass={(checklist) =>
          send({ type: 'complete_step', missionId: mission.id, step, ...(checklist ? { checklist } : {}) })
        }
        onReject={(reason) => send({ type: 'reject_gate', missionId: mission.id, gate: step, reason })}
      />
    );
  }
  return (
    <div className="sims-row">
      <SimsButton grow disabled={busy} onClick={() => void send({ type: 'complete_step', missionId: mission.id, step })}>
        Confirmer : {STEP_LABEL[step]}
      </SimsButton>
      <SimsButton kind="plain" onClick={onCancel}>
        Annuler
      </SimsButton>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  danger = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <label className="sims-toggle" data-checked={checked ? 'true' : 'false'} data-danger={danger ? 'true' : undefined}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ProductionForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (p: Production) => void;
}) {
  const [p, setP] = useState<Production>({
    realPhoto: false,
    aiGeneratedProduct: false,
    paidToolUsed: false,
    costAnnounced: false,
  });
  const set = (k: keyof Production) => (v: boolean) => setP((cur) => ({ ...cur, [k]: v }));
  return (
    <div className="sims-stack" style={{ gap: 8 }}>
      <p className="sims-muted sims-small" style={{ margin: 0 }}>
        Dis la vérité : Ben contrôle à la porte 2. Un produit ou un logo ne se génère jamais par IA.
      </p>
      <Toggle checked={p.realPhoto} onChange={set('realPhoto')} label={PRODUCTION_LABEL.realPhoto} />
      <Toggle
        checked={p.aiGeneratedProduct}
        onChange={set('aiGeneratedProduct')}
        label={PRODUCTION_LABEL.aiGeneratedProduct}
        danger
      />
      <Toggle checked={p.paidToolUsed} onChange={set('paidToolUsed')} label={PRODUCTION_LABEL.paidToolUsed} />
      {p.paidToolUsed && (
        <Toggle checked={p.costAnnounced} onChange={set('costAnnounced')} label={PRODUCTION_LABEL.costAnnounced} />
      )}
      <div className="sims-row">
        <SimsButton grow disabled={busy} onClick={() => onSubmit(p)}>
          Envoyer la production
        </SimsButton>
        <SimsButton kind="plain" onClick={onCancel}>
          Annuler
        </SimsButton>
      </div>
    </div>
  );
}

function GateForm({
  gate,
  qaItems,
  busy,
  onCancel,
  onPass,
  onReject,
}: {
  gate: Gate;
  qaItems: readonly QaItem[];
  busy: boolean;
  onCancel: () => void;
  onPass: (checklist?: Record<QaItem, boolean>) => void;
  onReject: (reason: string) => void;
}) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const isQa = gate === 'qa_gate';
  const allChecked = !isQa || qaItems.every((i) => checks[i]);

  if (rejecting) {
    return (
      <div className="sims-stack" style={{ gap: 8 }}>
        <label className="sims-muted sims-small">
          Pourquoi ? (pour que ça serve à progresser)
          <textarea
            className="sims-input"
            style={{ minHeight: 96 }}
            value={reason}
            maxLength={500}
            autoFocus
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div className="sims-row">
          <SimsButton kind="danger" grow disabled={busy || !reason.trim()} onClick={() => onReject(reason)}>
            Renvoyer à l'auteur
          </SimsButton>
          <SimsButton kind="plain" onClick={() => setRejecting(false)}>
            Retour
          </SimsButton>
        </div>
      </div>
    );
  }

  return (
    <div className="sims-stack" style={{ gap: 8 }}>
      <p className="sims-muted sims-small" style={{ margin: 0 }}>
        {isQa
          ? 'Porte 2 : coche les 9 points. Un seul manque et la porte reste fermée.'
          : 'Tu es le seul à pouvoir ouvrir cette porte.'}
      </p>
      {isQa &&
        qaItems.map((item) => (
          <Toggle
            key={item}
            checked={checks[item] === true}
            onChange={(v) => setChecks((cur) => ({ ...cur, [item]: v }))}
            label={QA_LABEL[item]}
          />
        ))}
      <div className="sims-row" style={{ flexWrap: 'wrap' }}>
        <SimsButton
          grow
          disabled={busy || !allChecked}
          onClick={() =>
            onPass(isQa ? (Object.fromEntries(qaItems.map((i) => [i, checks[i] === true])) as Record<QaItem, boolean>) : undefined)
          }
        >
          Passer la porte
        </SimsButton>
        <SimsButton kind="danger" onClick={() => setRejecting(true)}>
          Refuser
        </SimsButton>
        <SimsButton kind="plain" onClick={onCancel}>
          Fermer
        </SimsButton>
      </div>
    </div>
  );
}

// ── Équipe ───────────────────────────────────────────────────

function TeamTab({ board }: { board: Board }) {
  if (board.players.length === 0) {
    return (
      <p className="sims-muted" style={{ margin: 0 }}>
        Personne n'a encore joué. La première étape terminée te fait entrer dans l'équipe.
      </p>
    );
  }
  return (
    <ul className="sims-stack" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {board.players.map((p) => (
        <li key={p.id} className="sims-card sims-stack" style={{ gap: 6 }}>
          <PlayerCard player={p} levels={board.rules.levels} tone="green" />
          <div className="sims-muted sims-small">{ROLE_LABEL[p.role]}</div>
          {p.badges.length > 0 && (
            <div className="sims-row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {p.badges.map((b) => (
                <span key={b} className="sims-badge">
                  {BADGE_LABEL[b] ?? b}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
