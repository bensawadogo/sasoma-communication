#!/usr/bin/env node
// Génère les agents du Studio CM pour d'autres outils que Claude Code, à partir d'une seule source : .claude/agents + config/modeles.json.
//   node scripts/exporter-agents.mjs --cible tous --profil equilibre
//   --cible    opencode | codex | gemini | agents | tous       (agents = AGENTS.md + .agents/skills/, lus par Codex, OpenCode, Cursor, Copilot...)
//   --profil   eco | equilibre | max                            (défaut : le profil actif de config/modeles.json)
//   --fournisseur anthropic | openai | deepseek                 (défaut : anthropic pour opencode, openai pour codex)
//   --modele-gemini <identifiant>                               (Gemini CLI : identifiant exact copié de la page de Google ; sinon l'agent hérite)
//   --sortie <dossier>                                          (défaut : la racine du projet)
// Les fichiers générés portent un avertissement : on modifie la source, jamais la copie.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PERIMETRES } from './garde-fou-ecriture.mjs';
import { chargerConfig, identifiant, lireAgents, PROFILS, ROOT, YAML } from './lib-agents.mjs';

const AVERTISSEMENT = (nom) =>
  `> Fichier généré depuis .claude/agents/${nom}.md par scripts/exporter-agents.mjs : ne pas le modifier ici (modifier la source, puis relancer l'export).\n` +
  `> Les règles ci-dessous sont des règles écrites. Le blocage matériel du périmètre d'écriture n'existe que dans Claude Code (voir docs/19).`;

function ecrire(sortie, relatif, contenu) {
  const f = path.join(sortie, relatif);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, contenu, 'utf8');
  return relatif;
}

/** OpenCode : .opencode/agents/<nom>.md, modèle fournisseur/modèle, droits d'écriture limités au périmètre de l'agent. */
function opencode(agents, config, profil, fournisseur, sortie) {
  const fichiers = [];
  for (const a of agents) {
    const id = identifiant(config, a.nom, profil, fournisseur);
    const regle = PERIMETRES[a.nom];
    const permissions = [{ action: 'edit', resource: '*', effect: 'deny' }];
    for (const d of regle?.dossiers ?? []) permissions.push({ action: 'edit', resource: `${d}/**`, effect: 'allow' });
    for (const f of regle?.fichiers ?? []) permissions.push({ action: 'edit', resource: f, effect: 'allow' });
    for (const d of regle?.rapportsDans ?? []) permissions.push({ action: 'edit', resource: `${d}/*-controle*`, effect: 'allow' });
    permissions.push({ action: 'shell', resource: '*', effect: 'deny' });
    const fm = { description: a.fm.description, mode: a.nom === 'chef-de-studio' ? 'primary' : 'subagent', ...(id ? { model: `${fournisseur}/${id}` } : {}), permissions };
    fichiers.push(ecrire(sortie, `.opencode/agents/${a.nom}.md`, `---\n${YAML.stringify(fm)}---\n\n${AVERTISSEMENT(a.nom)}\n\n${a.corps}\n`));
  }
  return fichiers;
}

/** Codex : .codex/agents/<nom>.toml (name, description, model, developer_instructions). */
function codex(agents, config, profil, fournisseur, sortie) {
  const fichiers = [];
  for (const a of agents) {
    const id = identifiant(config, a.nom, profil, fournisseur);
    const texte = `${AVERTISSEMENT(a.nom)}\n\n${a.corps}`;
    if (texte.includes("'''")) throw new Error(`${a.nom} : le texte contient ''' (impossible en TOML littéral)`);
    const lignes = [
      `name = ${JSON.stringify(a.nom)}`,
      `description = ${JSON.stringify(a.fm.description)}`,
      ...(id ? [`model = ${JSON.stringify(id)}`, 'model_reasoning_effort = "medium"'] : []),
      `developer_instructions = '''\n${texte}\n'''`,
    ];
    fichiers.push(ecrire(sortie, `.codex/agents/${a.nom}.toml`, `${lignes.join('\n')}\n`));
  }
  return fichiers;
}

/** Gemini CLI : .gemini/agents/<nom>.md. Sans `tools` : l'agent hérite de tous les outils de la session (à restreindre dans Gemini CLI). */
function gemini(agents, _config, _profil, modeleGemini, sortie) {
  const fichiers = [];
  for (const a of agents) {
    const fm = { name: a.nom, description: a.fm.description, ...(modeleGemini ? { model: modeleGemini } : {}), max_turns: 30 };
    fichiers.push(ecrire(sortie, `.gemini/agents/${a.nom}.md`, `---\n${YAML.stringify(fm)}---\n\n${AVERTISSEMENT(a.nom)}\n\n${a.corps}\n`));
  }
  return fichiers;
}

/** AGENTS.md (lu par Codex, OpenCode, Cursor, Copilot...) et le skill des règles dans .agents/skills/. */
function agentsMd(agents, config, profil, sortie) {
  const regles = readFileSync(path.join(ROOT, '.claude', 'skills', 'regles-cm', 'SKILL.md'), 'utf8').replace(/^---[\s\S]*?---\s*/, '');
  const lignes = agents.map((a) => `| \`${a.nom}\` | ${config.agents[a.nom]?.metier ?? ''} |`);
  const contenu = `# Studio CM de Ben (Burkina Faso, Afrique de l'Ouest)

Fichier généré par scripts/exporter-agents.mjs : ne pas le modifier ici.
Service de community management : on propose, **Ben décide**. Contexte complet : README.md, docs/03-PROCESSUS-CM.md, clients/.

## L'équipe
| Agent | Métier |
|---|---|
${lignes.join('\n')}

Définitions détaillées : \`.claude/agents/\` (Claude Code), \`.opencode/agents/\`, \`.codex/agents/\`, \`.gemini/agents/\` (générées). Modèles : config/modeles.json (profil ${profil}).

${regles.trim()}
`;
  const fichiers = [ecrire(sortie, 'AGENTS.md', contenu)];
  const src = path.join(ROOT, '.claude', 'skills', 'regles-cm');
  mkdirSync(path.join(sortie, '.agents', 'skills'), { recursive: true });
  cpSync(src, path.join(sortie, '.agents', 'skills', 'regles-cm'), { recursive: true });
  fichiers.push('.agents/skills/regles-cm/SKILL.md');
  return fichiers;
}

export function exporter({ cible = 'tous', profil, fournisseur, modeleGemini, sortie = ROOT }) {
  const config = chargerConfig();
  const p = profil ?? config.actif;
  if (!PROFILS.includes(p)) throw new Error(`Profil inconnu « ${p} » (${PROFILS.join(', ')})`);
  const agents = lireAgents();
  const faits = [];
  const veut = (c) => cible === 'tous' || cible === c;
  if (veut('opencode')) faits.push(...opencode(agents, config, p, fournisseur ?? 'anthropic', sortie));
  if (veut('codex')) faits.push(...codex(agents, config, p, fournisseur ?? 'openai', sortie));
  if (veut('gemini')) faits.push(...gemini(agents, config, p, modeleGemini, sortie));
  if (veut('agents')) faits.push(...agentsMd(agents, config, p, sortie));
  if (faits.length === 0) throw new Error(`Cible inconnue « ${cible} » (opencode, codex, gemini, agents, tous)`);
  return faits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (nom) => {
    const i = process.argv.indexOf(`--${nom}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  try {
    const faits = exporter({ cible: arg('cible'), profil: arg('profil'), fournisseur: arg('fournisseur'), modeleGemini: arg('modele-gemini'), sortie: arg('sortie') ? path.resolve(arg('sortie')) : ROOT });
    console.log(`${faits.length} fichier(s) générés :\n- ${faits.join('\n- ')}`);
  } catch (e) {
    console.error(String(e.message));
    process.exit(1);
  }
}
