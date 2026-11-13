// Met à jour la partie automatique de ETAT-DU-PROJET.md (profil de modèles, agents, derniers changements, tâches ouvertes,
// dépenses des autres IA). Le texte écrit à la main reste intact : seule la zone entre les deux repères change.
//   node scripts/relais.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chargerConfig, lireAgents, ROOT } from './lib-agents.mjs';

export const DEBUT = '<!-- AUTO:DEBUT -->';
export const FIN = '<!-- AUTO:FIN -->';

function git(args, root) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

export function tachesOuvertes(texte, max = 12) {
  return texte
    .split('\n')
    .filter((l) => /^\s*- \[ \]/.test(l))
    .map((l) => l.replace(/^\s*- \[ \]\s*/, '').replace(/\*\*/g, '').slice(0, 160))
    .slice(0, max);
}

/** Lit les dépenses déjà journalisées par delegue-ia (jamais le contenu). */
export function depenses(root) {
  const f = path.join(root, 'production', 'ia-deleguee.jsonl');
  if (!existsSync(f)) return { appels: 0, total: 0 };
  let total = 0;
  let appels = 0;
  for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
    try {
      const e = JSON.parse(l);
      if (typeof e.cout_usd === 'number') {
        total += e.cout_usd;
        appels += 1;
      }
    } catch {
      /* ligne abîmée : ignorée */
    }
  }
  return { appels, total };
}

export function zoneAuto(root = ROOT) {
  const config = chargerConfig();
  const agents = lireAgents().map((a) => a.nom).join(', ');
  const modeles = Object.entries(
    Object.entries(config.agents).reduce((acc, [nom, a]) => {
      const m = a.modeles[config.actif]?.anthropic ?? '?';
      (acc[m] ??= []).push(nom);
      return acc;
    }, {}),
  )
    .map(([m, noms]) => `${m} : ${noms.join(', ')}`)
    .join(' ; ');
  const commits = git(['log', '-8', '--format=- %h %s'], root) || '- (historique git indisponible)';
  const todoFile = path.join(root, 'TODO.md');
  const taches = existsSync(todoFile) ? tachesOuvertes(readFileSync(todoFile, 'utf8')) : [];
  const dep = depenses(root);
  return [
    '## État automatique (`node scripts/relais.mjs`)',
    `- Profil de modèles actif : **${config.actif}** (${modeles})`,
    `- Agents : ${agents}`,
    `- Autres IA via OpenRouter : ${dep.appels} appel(s), ${dep.total.toFixed(4)} $ dépensés au total (journal sans contenu)`,
    '- Derniers changements :',
    commits,
    `- Tâches ouvertes dans TODO.md (${taches.length} affichées) :`,
    ...(taches.length ? taches.map((t) => `  - ${t}`) : ['  - (aucune)']),
  ].join('\n');
}

/** Remplace la zone entre les repères, sans toucher au reste. */
export function remplacerZone(texte, zone) {
  const i = texte.indexOf(DEBUT);
  const j = texte.indexOf(FIN);
  if (i < 0 || j < i) throw new Error(`Repères ${DEBUT} / ${FIN} introuvables ou dans le désordre.`);
  return `${texte.slice(0, i + DEBUT.length)}\n${zone}\n${texte.slice(j)}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fichier = path.join(ROOT, 'ETAT-DU-PROJET.md');
  const ancien = readFileSync(fichier, 'utf8');
  const nouveau = remplacerZone(ancien, zoneAuto(ROOT));
  if (nouveau !== ancien) writeFileSync(fichier, nouveau);
  console.log(nouveau !== ancien ? 'ETAT-DU-PROJET.md mis à jour.' : 'ETAT-DU-PROJET.md déjà à jour.');
}
