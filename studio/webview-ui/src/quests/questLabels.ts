import type { QaItem, Role, Step } from './questTypes.js';

/** All player-facing words of the quest board, in French. Short on purpose: phones, slow reading. */

export const STEP_LABEL: Record<Step, string> = {
  idea: 'Idée',
  calendar_gate: 'Porte 1 · Calendrier',
  production: 'Production',
  qa_gate: 'Porte 2 · Qualité',
  scheduled: 'Programmation',
  send_gate: 'Porte 3 · Envoi',
  report: 'Bilan',
};

/** What the person does at this step, as a verb phrase for the action button. */
export const STEP_ACTION: Record<Step, string> = {
  idea: "J'ai l'idée",
  calendar_gate: 'Ouvrir la porte',
  production: "J'ai produit",
  qa_gate: 'Ouvrir la porte',
  scheduled: "J'ai programmé",
  send_gate: 'Ouvrir la porte',
  report: "J'ai fait le bilan",
};

export const QA_LABEL: Record<QaItem, string> = {
  real_photo: 'Le produit est une vraie photo du client',
  no_ai_brand_text: "Aucun logo ni texte de marque fait par l'IA",
  facts_verified: 'Chaque fait est vérifié',
  no_negative_review: 'Aucun avis négatif cité',
  proofread: 'Orthographe et ton relus',
  format_ok: 'Format correct pour le réseau',
  call_to_action_ok: "Lien, numéro ou appel à l'action corrects",
  rights_ok: 'Droits OK (photos de décor, musique)',
  cost_noted: "Coût des crédits d'outils noté",
};

export const ROLE_LABEL: Record<Role, string> = {
  chef: 'Chef du studio',
  secretary: 'Secrétaire',
  agent: 'Agent IA',
};

export const BADGE_LABEL: Record<string, string> = {
  premier_envoi: 'Premier envoi',
  sans_faute_x3: 'Trois du premier coup',
  premier_bilan: 'Premier bilan',
};

export const PRODUCTION_LABEL = {
  realPhoto: "J'utilise une vraie photo du produit",
  aiGeneratedProduct: "Le produit ou le logo vient d'une IA (interdit)",
  paidToolUsed: "J'ai utilisé un outil à crédits",
  costAnnounced: 'Le coût a été annoncé à Ben avant',
} as const;
