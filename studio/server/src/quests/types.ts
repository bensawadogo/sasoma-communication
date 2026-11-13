/**
 * Quest engine: the game layer of the CM studio.
 *
 * The game never invents progress. Every point of XP comes from a real step of the real process
 * (docs/03-PROCESSUS-CM.md), accepted by the rules below and recorded in an append-only event log.
 */

export type Role = 'chef' | 'secretary' | 'agent';

export interface Actor {
  readonly id: string;
  readonly role: Role;
}

/** The seven steps of one publication (a "mission"), in order. Three of them are gates only the chef can pass. */
export const STEPS = [
  'idea',
  'calendar_gate',
  'production',
  'qa_gate',
  'scheduled',
  'send_gate',
  'report',
] as const;
export type Step = (typeof STEPS)[number];

export const GATES = ['calendar_gate', 'qa_gate', 'send_gate'] as const;
export type Gate = (typeof GATES)[number];

export function isGate(step: Step): step is Gate {
  return (GATES as readonly string[]).includes(step);
}

/** Quality checklist of gate 2 (docs/03). All items must be true to pass. */
export const QA_ITEMS = [
  'real_photo',
  'no_ai_brand_text',
  'facts_verified',
  'no_negative_review',
  'proofread',
  'format_ok',
  'call_to_action_ok',
  'rights_ok',
  'cost_noted',
] as const;
export type QaItem = (typeof QA_ITEMS)[number];
export type QaChecklist = Readonly<Record<QaItem, boolean>>;

/** What the author of the production step declares. Self-declared: Ben's gate 2 is the backstop. */
export interface ProductionDeclaration {
  readonly realPhoto: boolean;
  readonly aiGeneratedProduct: boolean;
  readonly paidToolUsed: boolean;
  readonly costAnnounced: boolean;
}

export type QuestEvent =
  | {
      readonly type: 'mission_created';
      readonly at: number;
      readonly missionId: string;
      readonly clientId: string;
      readonly title: string;
      readonly actor: Actor;
    }
  | {
      readonly type: 'step_completed';
      readonly at: number;
      readonly missionId: string;
      readonly step: Step;
      readonly actor: Actor;
      readonly production?: ProductionDeclaration;
      readonly checklist?: QaChecklist;
    }
  | {
      readonly type: 'gate_rejected';
      readonly at: number;
      readonly missionId: string;
      readonly gate: Gate;
      readonly actor: Actor;
      readonly reason: string;
    };

export type QuestCommand =
  | { readonly type: 'create_mission'; readonly missionId: string; readonly clientId: string; readonly title: string }
  | {
      readonly type: 'complete_step';
      readonly missionId: string;
      readonly step: Step;
      readonly production?: ProductionDeclaration;
      readonly checklist?: QaChecklist;
    }
  | { readonly type: 'reject_gate'; readonly missionId: string; readonly gate: Gate; readonly reason: string };

export interface Mission {
  id: string;
  clientId: string;
  title: string;
  createdBy: string;
  createdAt: number;
  completed: Step[];
  /** Who completed each non-gate step (the author who gets rewarded when the next gate passes). */
  authors: Partial<Record<Step, string>>;
  revisions: number;
  /** Work steps already rewarded once: redoing a refused step earns no second reward. */
  rewarded: Step[];
  /** The only step that can be completed now, or 'done'. */
  next: Step | 'done';
}

export interface Player {
  id: string;
  role: Role;
  xp: number;
  badges: string[];
  sent: number;
  firstTimeRight: number;
  reports: number;
}

export interface QuestState {
  missions: Record<string, Mission>;
  players: Record<string, Player>;
}

/** Stable identifiers of the rules, so the interface can explain a refusal. */
export type RuleId =
  | 'UNKNOWN_MISSION'
  | 'MISSION_EXISTS'
  | 'EMPTY_FIELD'
  | 'WRONG_ORDER'
  | 'ROLE_NOT_ALLOWED'
  | 'NO_AI_PRODUCT'
  | 'NO_REAL_PHOTO'
  | 'COST_NOT_ANNOUNCED'
  | 'MISSING_DECLARATION'
  | 'QA_INCOMPLETE'
  | 'NOT_A_GATE'
  | 'REASON_REQUIRED';

export type Decision =
  | { readonly ok: true; readonly event: QuestEvent }
  | { readonly ok: false; readonly rule: RuleId; readonly message: string };
