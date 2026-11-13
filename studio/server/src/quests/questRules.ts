import type {
  Actor,
  Decision,
  Gate,
  Mission,
  Player,
  QaItem,
  QuestCommand,
  QuestEvent,
  QuestState,
  Role,
  RuleId,
  Step,
} from './types.js';
import { isGate, QA_ITEMS, STEPS } from './types.js';

/** Who may complete each step. Gates are chef-only: the game cannot let anyone else open them. */
const STEP_ROLES: Record<Step, readonly Role[]> = {
  idea: ['chef', 'secretary', 'agent'],
  calendar_gate: ['chef'],
  production: ['chef', 'secretary', 'agent'],
  qa_gate: ['chef'],
  scheduled: ['chef', 'secretary', 'agent'],
  send_gate: ['chef'],
  report: ['chef', 'secretary', 'agent'],
};

/** XP for finishing a work step. */
const WORK_XP: Partial<Record<Step, number>> = { idea: 10, production: 30, scheduled: 20, report: 25 };
/** XP the author of the previous step earns when the chef passes a gate. */
const GATE_AUTHOR_XP: Partial<Record<Step, number>> = { calendar_gate: 10, qa_gate: 40, send_gate: 30 };
const GATE_CHEF_XP = 5;
const FIRST_TIME_RIGHT_BONUS = 25;

/** The work step a gate checks, and where a rejection sends the mission back to. */
const STEP_BEFORE_GATE: Record<Gate, Step> = {
  calendar_gate: 'idea',
  qa_gate: 'production',
  send_gate: 'scheduled',
};

export const LEVELS = [
  { level: 1, title: 'Recrue', minXp: 0 },
  { level: 2, title: 'Pousse', minXp: 40 },
  { level: 3, title: 'Talent', minXp: 120 },
  { level: 4, title: 'Pilier', minXp: 250 },
  { level: 5, title: 'Étoile', minXp: 450 },
  { level: 6, title: 'Légende', minXp: 700 },
] as const;

export function levelOf(xp: number): { level: number; title: string; nextAt: number | null } {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;
  const next = LEVELS.find((l) => l.minXp > xp);
  return { level: current.level, title: current.title, nextAt: next ? next.minXp : null };
}

export function emptyState(): QuestState {
  return { missions: {}, players: {} };
}

function refuse(rule: RuleId, message: string): Decision {
  return { ok: false, rule, message };
}

// ── Decide: command -> event, or a refusal with the rule that applies ─────────

export function decide(state: QuestState, command: QuestCommand, actor: Actor, at: number): Decision {
  switch (command.type) {
    case 'create_mission': {
      if (state.missions[command.missionId]) {
        return refuse('MISSION_EXISTS', 'Cette mission existe déjà.');
      }
      if (!command.title.trim() || !command.clientId.trim() || !command.missionId.trim()) {
        return refuse('EMPTY_FIELD', 'Il faut un client et un titre.');
      }
      return {
        ok: true,
        event: {
          type: 'mission_created',
          at,
          missionId: command.missionId,
          clientId: command.clientId,
          title: command.title.trim(),
          actor,
        },
      };
    }

    case 'complete_step': {
      const mission = state.missions[command.missionId];
      if (!mission) return refuse('UNKNOWN_MISSION', 'Mission introuvable.');
      if (mission.next !== command.step) {
        return refuse(
          'WRONG_ORDER',
          mission.next === 'done'
            ? 'Cette mission est terminée.'
            : `Étape suivante attendue : ${mission.next}.`,
        );
      }
      if (!STEP_ROLES[command.step].includes(actor.role)) {
        return refuse(
          'ROLE_NOT_ALLOWED',
          isGate(command.step)
            ? 'Seul le chef peut passer une porte de validation.'
            : "Ton rôle ne permet pas cette étape.",
        );
      }
      if (command.step === 'production') {
        const d = command.production;
        if (!d) return refuse('MISSING_DECLARATION', 'Déclare la production (photo réelle, outils, coût).');
        if (d.aiGeneratedProduct) {
          return refuse(
            'NO_AI_PRODUCT',
            'Règle absolue : un produit ou un logo ne se génère jamais par IA. Refais avec la vraie photo.',
          );
        }
        if (!d.realPhoto) return refuse('NO_REAL_PHOTO', 'Le produit doit être montré par une vraie photo du client.');
        if (d.paidToolUsed && !d.costAnnounced) {
          return refuse('COST_NOT_ANNOUNCED', "Un outil à crédits se lance seulement après avoir annoncé son coût à Ben.");
        }
      }
      if (command.step === 'qa_gate') {
        const missing = QA_ITEMS.filter((item: QaItem) => command.checklist?.[item] !== true);
        if (missing.length > 0) {
          return refuse('QA_INCOMPLETE', `Contrôle qualité incomplet : ${missing.join(', ')}.`);
        }
      }
      return {
        ok: true,
        event: {
          type: 'step_completed',
          at,
          missionId: command.missionId,
          step: command.step,
          actor,
          ...(command.production ? { production: command.production } : {}),
          ...(command.checklist ? { checklist: command.checklist } : {}),
        },
      };
    }

    case 'reject_gate': {
      const mission = state.missions[command.missionId];
      if (!mission) return refuse('UNKNOWN_MISSION', 'Mission introuvable.');
      if (!isGate(command.gate)) return refuse('NOT_A_GATE', "Ce n'est pas une porte de validation.");
      if (mission.next !== command.gate) {
        return refuse('WRONG_ORDER', `La mission n'est pas à la porte ${command.gate}.`);
      }
      if (actor.role !== 'chef') return refuse('ROLE_NOT_ALLOWED', 'Seul le chef peut refuser à une porte.');
      if (!command.reason.trim()) return refuse('REASON_REQUIRED', 'Explique pourquoi pour que ça serve à progresser.');
      return {
        ok: true,
        event: {
          type: 'gate_rejected',
          at,
          missionId: command.missionId,
          gate: command.gate,
          actor,
          reason: command.reason.trim(),
        },
      };
    }
  }
}

// ── Reduce: event -> new state. The only place XP and badges are created. ─────

function playerFor(state: QuestState, actor: { id: string; role: Role }): Player {
  let p = state.players[actor.id];
  if (!p) {
    p = { id: actor.id, role: actor.role, xp: 0, badges: [], sent: 0, firstTimeRight: 0, reports: 0 };
    state.players[actor.id] = p;
  }
  return p;
}

function addBadge(p: Player, badge: string): void {
  if (!p.badges.includes(badge)) p.badges.push(badge);
}

function nextStepAfter(step: Step): Step | 'done' {
  const i = STEPS.indexOf(step);
  return STEPS[i + 1] ?? 'done';
}

export function reduce(prev: QuestState, event: QuestEvent): QuestState {
  const state = structuredClone(prev);

  if (event.type === 'mission_created') {
    const mission: Mission = {
      id: event.missionId,
      clientId: event.clientId,
      title: event.title,
      createdBy: event.actor.id,
      createdAt: event.at,
      completed: [],
      authors: {},
      revisions: 0,
      rewarded: [],
      next: 'idea',
    };
    state.missions[mission.id] = mission;
    playerFor(state, event.actor);
    return state;
  }

  const mission = state.missions[event.missionId];
  if (!mission) return state; // an orphan event in a damaged log is ignored, never trusted

  if (event.type === 'gate_rejected') {
    const back = STEP_BEFORE_GATE[event.gate];
    mission.completed = mission.completed.filter((s) => s !== back);
    delete mission.authors[back];
    mission.revisions += 1;
    mission.next = back;
    return state;
  }

  // step_completed
  const step = event.step;
  const doer = playerFor(state, event.actor);
  mission.completed.push(step);
  mission.next = nextStepAfter(step);

  if (!isGate(step)) {
    mission.authors[step] = event.actor.id;
    if (!mission.rewarded.includes(step)) {
      mission.rewarded.push(step);
      doer.xp += WORK_XP[step] ?? 0;
    }
    if (step === 'report') {
      doer.reports += 1;
      if (doer.reports === 1) addBadge(doer, 'premier_bilan');
    }
    return state;
  }

  // A gate was passed: the chef earns a little, the author of the checked step earns the real reward.
  doer.xp += GATE_CHEF_XP;
  const checked = STEP_BEFORE_GATE[step as Gate];
  const authorId = mission.authors[checked];
  const author = authorId ? state.players[authorId] : undefined;
  if (author) {
    author.xp += GATE_AUTHOR_XP[step] ?? 0;
    if (step === 'qa_gate' && mission.revisions === 0) {
      author.xp += FIRST_TIME_RIGHT_BONUS;
      author.firstTimeRight += 1;
      if (author.firstTimeRight === 3) addBadge(author, 'sans_faute_x3');
    }
    if (step === 'send_gate') {
      author.sent += 1;
      if (author.sent === 1) addBadge(author, 'premier_envoi');
    }
  }
  return state;
}
