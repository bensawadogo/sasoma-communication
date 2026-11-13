// Outils communs aux scripts qui lisent les agents du Studio CM et la table des modèles.
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'studio', 'package.json'));
export const YAML = require('yaml');

export const PROFILS = ['eco', 'equilibre', 'max'];

export function chargerConfig() {
  return JSON.parse(readFileSync(path.join(ROOT, 'config', 'modeles.json'), 'utf8'));
}

/** L'alias du modèle Anthropic (haiku, sonnet, opus, fable) d'un agent pour un profil. */
export function aliasAnthropic(config, agent, profil) {
  const m = config.agents[agent]?.modeles?.[profil]?.anthropic;
  if (!m) throw new Error(`Pas de modèle Anthropic pour ${agent} en profil ${profil}`);
  return m;
}

/** L'identifiant d'API d'un agent chez un fournisseur pour un profil, ou null s'il n'y en a pas (ou s'il n'est pas confirmé). */
export function identifiant(config, agent, profil, fournisseur) {
  const cle = config.agents[agent]?.modeles?.[profil]?.[fournisseur];
  if (!cle) return null;
  return config.fournisseurs[fournisseur]?.modeles?.[cle]?.id ?? null;
}

/** Les agents de .claude/agents : { nom, fm (en-tête lu), corps, fichier }. */
export function lireAgents() {
  const dir = path.join(ROOT, '.claude', 'agents');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const brut = readFileSync(path.join(dir, f), 'utf8');
      const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(brut);
      if (!m) throw new Error(`${f} : pas d'en-tête YAML`);
      return { nom: f.replace(/\.md$/, ''), fm: YAML.parse(m[1]), corps: m[2].trim(), fichier: path.join(dir, f) };
    });
}
