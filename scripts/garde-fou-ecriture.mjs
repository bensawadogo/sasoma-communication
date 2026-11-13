#!/usr/bin/env node
// Garde-fou d'écriture des agents du Studio CM (hook PreToolUse, matcher Write|Edit).
// Usage dans la définition d'un agent :  node C:/SASOMA-COMMUNICATION/scripts/garde-fou-ecriture.mjs <agent>
// Reçoit le JSON de l'appel d'outil sur stdin. Code 2 = l'appel est bloqué, le message (stderr) revient à l'agent.
// Principe : chaque agent n'écrit que dans son périmètre. Tout ce qui est inconnu ou illisible est refusé.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const memoire = (agent) => `.claude/agent-memory/${agent}`;

/** Où chaque agent a le droit d'écrire (dossiers ou fichiers, relatifs à la racine du projet). */
export const PERIMETRES = {
  'chef-de-studio': {
    dossiers: ['production', 'brouillons', 'clients', memoire('chef-de-studio')],
    fichiers: ['knowledge/lecons.md'],
  },
  // L'inspirateur n'écrit que ses carnets d'inspiration (mots-clés, grille de tri, direction de l'histoire).
  inspirateur: { dossiers: ['production/inspirations', memoire('inspirateur')] },
  veilleur: { dossiers: ['recherches', 'knowledge', memoire('veilleur')] },
  stratege: { dossiers: ['brouillons', 'production', memoire('stratege')] },
  scenariste: { dossiers: ['brouillons', 'production', memoire('scenariste')] },
  'createur-visuel': { dossiers: ['brouillons', 'production', memoire('createur-visuel')] },
  // Le contrôleur ne corrige pas le travail des autres : il n'écrit que ses rapports (nom contenant « -controle »).
  controleur: { dossiers: [memoire('controleur')], rapportsDans: ['brouillons'] },
  programmateur: { dossiers: [memoire('programmateur')] },
  analyste: { dossiers: ['clients', 'production', memoire('analyste')] },
  publicitaire: { dossiers: ['brouillons', 'production', memoire('publicitaire')] },
  // Le traceur n'écrit que ses kits de suivi (production/pixels) : il n'a aucun accès à Meta ni aux sites des clients.
  traceur: { dossiers: ['production/pixels', memoire('traceur')] },
  formateur: {
    dossiers: ['brouillons', 'formation', memoire('formateur')],
    fichiers: ['docs/04-FORMATION-SECRETAIRES.md'],
  },
  commercial: { dossiers: ['clients', 'brouillons', memoire('commercial')] },
};

const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);

/** Le chemin réel : suit les liens symboliques du plus proche dossier existant, pour qu'un lien ne serve pas d'échappatoire. */
function cheminReel(p) {
  let courant = path.resolve(p);
  const reste = [];
  while (!existsSync(courant)) {
    const parent = path.dirname(courant);
    if (parent === courant) break;
    reste.unshift(path.basename(courant));
    courant = parent;
  }
  let base = courant;
  try {
    base = realpathSync(courant);
  } catch {
    // Chemin illisible : on garde le chemin calculé, la comparaison le refusera s'il sort du périmètre.
  }
  return path.join(base, ...reste);
}

function dedans(fichier, dossier) {
  const rel = path.relative(norm(cheminReel(dossier)), norm(fichier));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/** { ok, raison } : peut-on écrire ce chemin pour cet agent ? */
export function decider(agent, cheminDemande, cwd = ROOT) {
  const regle = PERIMETRES[agent];
  if (!regle) return { ok: false, raison: `Agent « ${agent} » inconnu du garde-fou : écriture refusée.` };
  if (typeof cheminDemande !== 'string' || cheminDemande.trim() === '') return { ok: true };
  const fichier = cheminReel(path.resolve(cwd, cheminDemande));
  const sousRacine = (rel) => path.join(ROOT, rel);

  for (const d of regle.dossiers ?? []) if (dedans(fichier, sousRacine(d))) return { ok: true };
  for (const f of regle.fichiers ?? []) if (norm(fichier) === norm(cheminReel(sousRacine(f)))) return { ok: true };
  for (const d of regle.rapportsDans ?? []) {
    if (dedans(fichier, sousRacine(d))) {
      if (path.basename(fichier).toLowerCase().includes('-controle')) return { ok: true };
      return {
        ok: false,
        raison:
          "Le contrôleur n'écrit que ses rapports (nom de fichier contenant « -controle »). " +
          "Il ne corrige pas le travail des autres : renvoie la liste des corrections à l'auteur.",
      };
    }
  }
  const permis = [
    ...(regle.dossiers ?? []),
    ...(regle.fichiers ?? []),
    ...(regle.rapportsDans ?? []).map((d) => `${d}/*-controle*`),
  ].join(', ');
  return {
    ok: false,
    raison: `Écriture refusée pour « ${agent} » : ${path.relative(ROOT, fichier) || fichier} est hors de ton périmètre. Tu peux écrire dans : ${permis}.`,
  };
}

function main() {
  const agent = process.argv[2] ?? '';
  let entree;
  try {
    entree = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.stderr.write('Garde-fou : appel illisible, écriture refusée par précaution.\n');
    process.exit(2);
  }
  const entreeOutil = entree?.tool_input ?? {};
  const cible = entreeOutil.file_path ?? entreeOutil.notebook_path ?? entreeOutil.path;
  const verdict = decider(agent, cible, entree?.cwd ?? ROOT);
  if (!verdict.ok) {
    process.stderr.write(`${verdict.raison}\n`);
    process.exit(2);
  }
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
