#!/usr/bin/env node
// Génère les agents du Studio CM pour d'autres outils que Claude Code, à partir d'une seule source : .claude/agents + config/modeles.json.
//   node scripts/exporter-agents.mjs --cible tous --profil equilibre
//   --cible    opencode | codex | gemini | agents | tous       (agents = AGENTS.md + .agents/skills/, lus par Codex, OpenCode, Cursor, Copilot...)
//   --profil   eco | equilibre | max                            (défaut : le profil actif de config/modeles.json)
//   --fournisseur openrouter | anthropic | openai | deepseek    (défaut : openrouter pour opencode, openai pour codex)
//   --format-opencode v1 | v2                                   (défaut v1 : OpenCode 1.x, celui installé ; v2 = nouvelle syntaxe des droits)
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

/** Droits d'écriture de l'agent, en une liste neutre : le périmètre du garde-fou (garde-fou-ecriture.mjs). */
function droitsEcriture(nom) {
  const regle = PERIMETRES[nom];
  return [
    ...(regle?.dossiers ?? []).map((d) => `${d}/**`),
    ...(regle?.fichiers ?? []),
    ...(regle?.rapportsDans ?? []).map((d) => `${d}/*-controle*`),
  ];
}

// OpenCode 1.x compare les motifs au chemin complet : un motif relatif contenant « / » ne correspond à rien (testé le 13/11/2026 :
// « formation/** » refusait une écriture permise). On ancre donc sur le nom du dossier du projet (préfixe « ** » puis « / », « projet », « / »).
const ancrer = (motif) => `**/${path.basename(ROOT)}/${motif}`;

/** Identifiant de modèle pour OpenCode : « openrouter/<id OpenRouter> » (porte unique, config/delegation.json), sinon « fournisseur/<id direct> ». */
function modeleOpenCode(config, nom, profil, fournisseur) {
  if (fournisseur === 'openrouter') {
    const alias = config.agents[nom]?.modeles[profil]?.anthropic;
    const delegation = JSON.parse(readFileSync(path.join(ROOT, 'config', 'delegation.json'), 'utf8'));
    const id = delegation.modeles[alias]?.id;
    if (!id) throw new Error(`${nom} : pas d'identifiant OpenRouter pour « ${alias} » (config/delegation.json)`);
    return `openrouter/${id}`;
  }
  const id = identifiant(config, nom, profil, fournisseur);
  return id ? `${fournisseur}/${id}` : undefined;
}

/**
 * OpenCode : .opencode/agents/<nom>.md, droits d'écriture limités au périmètre de l'agent.
 * format « v1 » (OpenCode 1.x, celui installé chez Ben : clé `permission`, objet motif -> action, la dernière règle gagne)
 * ou « v2 » (clé `permissions`, liste action/resource/effect : refusée par OpenCode 1.19).
 */
function opencode(agents, config, profil, fournisseur, sortie, format = 'v1') {
  const fichiers = [];
  for (const a of agents) {
    const model = modeleOpenCode(config, a.nom, profil, fournisseur);
    const droits = droitsEcriture(a.nom);
    let regles;
    if (format === 'v2') {
      regles = {
        permissions: [
          { action: 'edit', resource: '*', effect: 'deny' },
          ...droits.map((resource) => ({ action: 'edit', resource, effect: 'allow' })),
          { action: 'shell', resource: '*', effect: 'deny' },
        ],
      };
    } else {
      regles = { permission: { edit: { '*': 'deny', ...Object.fromEntries(droits.map((d) => [ancrer(d), 'allow'])) }, bash: 'deny' } };
    }
    const fm = { description: a.fm.description, mode: a.nom === 'chef-de-studio' ? 'primary' : 'subagent', ...(model ? { model } : {}), ...regles };
    fichiers.push(ecrire(sortie, `.opencode/agents/${a.nom}.md`, `---
${YAML.stringify(fm)}---

${AVERTISSEMENT(a.nom)}

${a.corps}
`));
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

## Début et fin de chaque session (tous les outils)
1. **Lis \`ETAT-DU-PROJET.md\`** : mémoire commune du projet (qui est Ben, comment travailler avec lui, décisions prises, ce qui est fait, ce qui attend). Ben écrit en français : réponds en français.
2. Travaille **dans le dossier du projet** ; n'ouvre rien d'autre sur l'ordinateur de Ben sans son accord. Ne lis jamais un fichier de jeton, de clé ou \`.env\`.
3. **À la fin**, mets à jour la section « Reprise » de \`ETAT-DU-PROJET.md\` (fait, en cours, prochain pas, ce qui attend Ben), puis lance \`node scripts/relais.mjs\`. C'est ce qui permet de changer d'outil sans rien perdre.
4. Pour confier une tâche à une autre IA, utilise l'outil \`delegue-ia\` (docs/20), jamais un envoi direct de données de client.

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

export function exporter({ cible = 'tous', profil, fournisseur, modeleGemini, formatOpenCode = 'v1', sortie = ROOT }) {
  const config = chargerConfig();
  const p = profil ?? config.actif;
  if (!PROFILS.includes(p)) throw new Error(`Profil inconnu « ${p} » (${PROFILS.join(', ')})`);
  const agents = lireAgents();
  const faits = [];
  const veut = (c) => cible === 'tous' || cible === c;
  if (veut('opencode')) faits.push(...opencode(agents, config, p, fournisseur ?? 'openrouter', sortie, formatOpenCode));
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
    const faits = exporter({ cible: arg('cible'), profil: arg('profil'), fournisseur: arg('fournisseur'), modeleGemini: arg('modele-gemini'), formatOpenCode: arg('format-opencode') ?? 'v1', sortie: arg('sortie') ? path.resolve(arg('sortie')) : ROOT });
    console.log(`${faits.length} fichier(s) générés :\n- ${faits.join('\n- ')}`);
  } catch (e) {
    console.error(String(e.message));
    process.exit(1);
  }
}
