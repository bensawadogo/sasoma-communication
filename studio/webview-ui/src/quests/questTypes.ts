/** What the quest API sends (server/src/quests). The webview only depends on this shape, never on server code. */

export type Role = 'chef' | 'secretary' | 'agent';
export type Step =
  | 'idea'
  | 'calendar_gate'
  | 'production'
  | 'qa_gate'
  | 'scheduled'
  | 'send_gate'
  | 'report';
export type Gate = 'calendar_gate' | 'qa_gate' | 'send_gate';
export type QaItem =
  | 'real_photo'
  | 'no_ai_brand_text'
  | 'facts_verified'
  | 'no_negative_review'
  | 'proofread'
  | 'format_ok'
  | 'call_to_action_ok'
  | 'rights_ok'
  | 'cost_noted';

export interface Mission {
  id: string;
  clientId: string;
  title: string;
  createdBy: string;
  completed: Step[];
  revisions: number;
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
  level: number;
  title: string;
  nextLevelAt: number | null;
}

export interface Board {
  me: { id: string; role: Role };
  missions: Record<string, Mission>;
  players: Player[];
  skippedLines: number;
  rules: {
    steps: readonly Step[];
    gates: readonly Gate[];
    qaItems: readonly QaItem[];
    levels: readonly { level: number; title: string; minXp: number }[];
  };
}

export interface Production {
  realPhoto: boolean;
  aiGeneratedProduct: boolean;
  paidToolUsed: boolean;
  costAnnounced: boolean;
}

export type QuestCommand =
  | { type: 'create_mission'; missionId: string; clientId: string; title: string }
  | {
      type: 'complete_step';
      missionId: string;
      step: Step;
      production?: Production;
      checklist?: Record<QaItem, boolean>;
    }
  | { type: 'reject_gate'; missionId: string; gate: Gate; reason: string };

export type CommandResult = { ok: true; board: Board } | { ok: false; message: string };
