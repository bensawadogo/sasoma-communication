// Lance le jeu de test maison (evals/taches.json) sur plusieurs modèles, par `delegue-ia`, avec les mêmes garde-fous.
//   node scripts/delegue-ia/lancer-eval.mjs [--agent <nom|tous>]            estime seulement, n'envoie rien
//   node scripts/delegue-ia/lancer-eval.mjs [--agent <nom|tous>] --oui 0.80  envoie, si 0.80 $ couvre l'estimation annoncée
// Les réponses sont écrites sans nom de modèle (A, B, C... mélangées) dans evals/resultats/<agent>/ ; la correspondance est
// dans _CLE.json : ne l'ouvre qu'APRÈS avoir noté (README.md des evals).
import { randomInt } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { contexteParDefaut, ErreurDelegation, executer, preparer, ROOT } from './coeur.mjs';

const sortir = async (code) => {
  await new Promise((r) => setTimeout(r, 200)); // laisse se fermer les connexions réseau (sinon alerte libuv sous Windows)
  process.exit(code);
};
const arg = (nom) => {
  const i = process.argv.indexOf(nom);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const agentDemande = arg('--agent') ?? 'tous';
const oui = arg('--oui') === undefined ? null : Number(arg('--oui'));

const { taches } = JSON.parse(readFileSync(path.join(ROOT, 'evals', 'taches.json'), 'utf8'));
const agents = agentDemande === 'tous' ? Object.keys(taches) : [agentDemande];
for (const a of agents) if (!taches[a]) {
  console.error(`Agent inconnu dans evals/taches.json : ${a}. Disponibles : ${Object.keys(taches).join(', ')}`);
  await sortir(1);
}

const ctx = contexteParDefaut(process.env);
const parametres = (agent, alias) => {
  const t = taches[agent];
  return { agent, alias, donnees: 'client', tache: t.tache, contexte: t.contexte, fichiers: t.fichiers, max_tokens: 2500 };
};

// 1. estimation (sans rien envoyer)
const plan = [];
let total = 0;
for (const agent of agents) {
  for (const alias of taches[agent].modeles) {
    try {
      const prep = await preparer(parametres(agent, alias), ctx);
      plan.push({ agent, alias, estimation: prep.estimationUsd, classe: prep.classe });
      total += prep.estimationUsd;
    } catch (e) {
      if (!(e instanceof ErreurDelegation)) throw e;
      console.error(`Impossible de préparer ${agent}/${alias} : ${e.code} ${e.message}`);
      await sortir(1);
    }
  }
}
console.log('Jeu de test : coût MAXIMAL estimé (sortie 2500 tokens), avant tout envoi');
for (const p of plan) console.log(`  ${p.agent.padEnd(16)} ${p.alias.padEnd(9)} ${p.estimation.toFixed(4)} $  (données ${p.classe})`);
console.log(`TOTAL maximal : ${total.toFixed(4)} $ pour ${plan.length} appels. Le coût réel sera plus bas (la réponse n'atteint pas toujours le maximum).`);

if (oui === null) {
  console.log('Rien envoyé. Pour lancer : --oui <montant en $ au moins égal au total ci-dessus>, après accord de Ben.');
  await sortir(0);
}
if (!(oui >= total)) {
  console.error(`Refusé : ${oui} $ ne couvre pas le total maximal ${total.toFixed(4)} $.`);
  await sortir(1);
}

// 2. exécution, un appel à la fois
const date = new Date().toISOString().slice(0, 10);
let depense = 0;
for (const agent of agents) {
  const reponses = [];
  const erreurs = [];
  for (const alias of taches[agent].modeles) {
    const estimation = plan.find((p) => p.agent === agent && p.alias === alias).estimation;
    try {
      const r = await executer({ ...parametres(agent, alias), cout_annonce_usd: estimation }, ctx);
      if (r.simulation) {
        console.log(`${agent}/${alias} : SIMULATION (pas de clé OPENROUTER_API_KEY), rien envoyé.`);
        continue;
      }
      depense += r.cout;
      reponses.push({ alias, texte: r.texte, cout: r.cout, coupe: r.coupe });
      console.log(`${agent}/${alias} : ok, ${r.cout.toFixed(4)} $`);
    } catch (e) {
      if (!(e instanceof ErreurDelegation)) throw e;
      erreurs.push({ alias, erreur: `${e.code} ${e.message}` });
      console.error(`${agent}/${alias} : ${e.code} ${e.message}`);
    }
  }
  if (reponses.length === 0) continue;

  // lettres mélangées : le nom du modèle n'apparaît dans aucun fichier à noter
  const melange = [...reponses];
  for (let i = melange.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [melange[i], melange[j]] = [melange[j], melange[i]];
  }
  const dossier = path.join(ROOT, 'evals', 'resultats', agent);
  mkdirSync(dossier, { recursive: true });
  writeFileSync(path.join(ROOT, 'evals', 'resultats', 'DATE.md'), `Dernier test lancé le ${date}.\n`);
  const cle = {};
  melange.forEach((r, i) => {
    const lettre = String.fromCharCode(65 + i);
    writeFileSync(path.join(dossier, `${lettre}.md`), `${r.texte}\n`);
    cle[lettre] = { alias: r.alias, cout_usd: r.cout, ...(r.coupe ? { coupee: true } : {}) };
  });
  writeFileSync(path.join(dossier, '_CLE.json'), JSON.stringify({ date, correspondance: cle, erreurs }, null, 2));
  const lignes = melange.map((_, i) => `| ${String.fromCharCode(65 + i)} |  |  |  |  |  |  |`);
  writeFileSync(
    path.join(dossier, 'notes.md'),
    `# ${agent} : notation à l'aveugle (${date})\n\n**Tâche** : ${taches[agent].tache}\n\n**Ce qu'on attend** : ${taches[agent].attendu}\n\n` +
      `Note chaque réponse de 0 à 2 (0 = non, 1 = en partie, 2 = oui). N'ouvre pas \`_CLE.json\` avant d'avoir fini.\n\n` +
      `| Réponse | Faits | Règles | Langue et ton | Utilité | Sobriété | Total /10 |\n|---|---|---|---|---|---|---|\n${lignes.join('\n')}\n\n` +
      `Règle : un 0 en « Règles » élimine la réponse. Le moins cher à 1 point ou moins du meilleur gagne.\n`,
  );
}
console.log(`\nDépense réelle de ce lot : ${depense.toFixed(4)} $. Réponses dans evals/resultats/<agent>/ ; notes dans notes.md.`);
await sortir(0);
