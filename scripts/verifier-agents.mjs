#!/usr/bin/env node
// Vérifie que les 11 agents du Studio CM sont bien formés : c'est ce qui aurait évité qu'un agent disparaisse sans bruit
// (un « : » dans sa description rend son en-tête YAML illisible et Claude Code l'ignore).
// Usage : node scripts/verifier-agents.mjs        (code 1 s'il y a un problème)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PERIMETRES } from './garde-fou-ecriture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'studio', 'package.json'));
const YAML = require('yaml');

/** Le modèle de chaque agent (décision de Ben, voir docs/16). Un agent absent de cette table est une erreur. */
export const MODELES = {
  'chef-de-studio': 'opus',
  controleur: 'opus',
  veilleur: 'sonnet',
  stratege: 'sonnet',
  scenariste: 'sonnet',
  'createur-visuel': 'sonnet',
  programmateur: 'sonnet',
  publicitaire: 'sonnet',
  analyste: 'sonnet',
  formateur: 'sonnet',
  commercial: 'sonnet',
};
/** Outils qu'aucun agent ne doit avoir : exécuter des commandes, ou publier/envoyer/supprimer chez un tiers. */
const INTERDITS = [/^Bash$/, /^PowerShell$/, /createScheduledPost(?!ForReview)/i, /publish/i, /delete/i, /sendMessage|send_message/i];

export function verifier() {
  const erreurs = [];
  const dir = path.join(ROOT, '.claude', 'agents');
  const fichiers = readdirSync(dir).filter((f) => f.endsWith('.md'));
  const noms = fichiers.map((f) => f.replace(/\.md$/, ''));
  for (const nom of Object.keys(MODELES)) if (!noms.includes(nom)) erreurs.push(`${nom} : fichier manquant`);

  if (!existsSync(path.join(ROOT, '.claude', 'skills', 'regles-cm', 'SKILL.md'))) erreurs.push('skill regles-cm manquant');

  for (const f of fichiers) {
    const nom = f.replace(/\.md$/, '');
    const brut = readFileSync(path.join(dir, f), 'utf8');
    const err = (m) => erreurs.push(`${nom} : ${m}`);
    if (brut.includes('\u0000')) err('caractère nul dans le fichier');
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(brut);
    if (!m) {
      err("pas d'en-tête YAML");
      continue;
    }
    let fm;
    try {
      fm = YAML.parse(m[1]);
    } catch (e) {
      err(`en-tête YAML illisible (Claude Code ignorerait cet agent) : ${String(e.message).split('\n')[0]}`);
      continue;
    }
    if (fm.name !== nom) err(`name « ${fm.name} » différent du nom de fichier`);
    if (typeof fm.description !== 'string' || fm.description.length < 20) err('description absente ou trop courte');
    const outils = String(fm.tools ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    if (outils.length === 0) err("liste d'outils vide");
    for (const o of outils) for (const re of INTERDITS) if (re.test(o)) err(`outil interdit : ${o}`);
    if (!Array.isArray(fm.skills) || !fm.skills.includes('regles-cm')) err('skill regles-cm non chargé');
    const hook = JSON.stringify(fm.hooks ?? {});
    if (!hook.includes(`garde-fou-ecriture.mjs ${nom}`)) err("garde-fou d'écriture absent ou pour un autre agent");
    if (!(nom in PERIMETRES)) err("pas de périmètre d'écriture dans garde-fou-ecriture.mjs");
    if (fm.model !== MODELES[nom]) err(`modèle « ${fm.model} » au lieu de « ${MODELES[nom]} » (docs/16)`);
    if (fm.memory !== 'project') err('mémoire de projet absente');
  }
  return erreurs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const erreurs = verifier();
  if (erreurs.length === 0) {
    console.log(`OK : ${Object.keys(MODELES).length} agents bien formés (YAML, outils, skill, garde-fou, modèle).`);
  } else {
    console.error(`${erreurs.length} problème(s) :\n- ${erreurs.join('\n- ')}`);
    process.exit(1);
  }
}
