#!/usr/bin/env node
// Change le profil de modèles des agents Claude Code : eco, equilibre ou max (config/modeles.json).
// Usage : node scripts/profil-modele.mjs equilibre         applique le profil
//         node scripts/profil-modele.mjs                  affiche le profil actif et le modèle de chaque agent
// Relancer Claude Code ensuite : les agents sont lus au démarrage de la session.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { aliasAnthropic, chargerConfig, lireAgents, PROFILS, ROOT } from './lib-agents.mjs';

const config = chargerConfig();
const demande = process.argv[2];

if (!demande) {
  console.log(`Profil actif : ${config.actif}`);
  for (const a of lireAgents()) console.log(`  ${a.nom.padEnd(16)} ${a.fm.model ?? '(hérite)'}  (profil ${config.actif} : ${aliasAnthropic(config, a.nom, config.actif)})`);
  process.exit(0);
}
if (!PROFILS.includes(demande)) {
  console.error(`Profil inconnu « ${demande} ». Choix : ${PROFILS.join(', ')}.`);
  process.exit(1);
}

for (const a of lireAgents()) {
  const alias = aliasAnthropic(config, a.nom, demande);
  const brut = readFileSync(a.fichier, 'utf8');
  const suivant = /^model:.*$/m.test(brut) ? brut.replace(/^model:.*$/m, `model: ${alias}`) : brut.replace(/^memory: project$/m, `model: ${alias}\nmemory: project`);
  if (suivant !== brut) writeFileSync(a.fichier, suivant, 'utf8');
  console.log(`${a.nom.padEnd(16)} -> ${alias}`);
}
const fichierConfig = path.join(ROOT, 'config', 'modeles.json');
writeFileSync(fichierConfig, readFileSync(fichierConfig, 'utf8').replace(/"actif": "[a-z]+"/, `"actif": "${demande}"`), 'utf8');
console.log(`\nProfil actif : ${demande}. Relance Claude Code (lancer-manager.ps1) pour que les agents le prennent en compte.`);
