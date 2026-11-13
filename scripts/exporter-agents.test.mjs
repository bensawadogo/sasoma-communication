import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { exporter } from './exporter-agents.mjs';
import { aliasAnthropic, chargerConfig, identifiant, lireAgents, PROFILS, ROOT, YAML } from './lib-agents.mjs';

const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'export-'));
const frontmatter = (f) => YAML.parse(/^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(f, 'utf8'))[1]);

test('chaque agent a un modèle dans chaque profil, et les identifiants sont ceux de la table', () => {
  const config = chargerConfig();
  const noms = lireAgents().map((a) => a.nom).sort();
  assert.deepEqual(Object.keys(config.agents).sort(), noms);
  for (const nom of noms) {
    for (const profil of PROFILS) {
      const alias = aliasAnthropic(config, nom, profil);
      assert.ok(config.fournisseurs.anthropic.modeles[alias], `${nom}/${profil}: ${alias} inconnu`);
      assert.ok(identifiant(config, nom, profil, 'openai'), `${nom}/${profil}: pas de modèle OpenAI`);
    }
  }
});

test('OpenCode (1.x) : un agent par fichier, modèle OpenRouter du profil, droits limités au périmètre', () => {
  const sortie = tmp();
  try {
    exporter({ cible: 'opencode', profil: 'max', sortie });
    const dir = path.join(sortie, '.opencode', 'agents');
    assert.equal(readdirSync(dir).length, 11);
    const chef = frontmatter(path.join(dir, 'chef-de-studio.md'));
    assert.equal(chef.mode, 'primary');
    assert.equal(chef.model, 'openrouter/anthropic/claude-fable-5.2');
    const prog = frontmatter(path.join(dir, 'programmateur.md'));
    assert.equal(prog.mode, 'subagent');
    assert.equal(prog.model, 'openrouter/anthropic/claude-sonnet-5.5');
    assert.equal(prog.permissions, undefined, "pas la syntaxe V2 : OpenCode 1.x la refuse");
    assert.equal(prog.permission.edit['*'], 'deny');
    assert.equal(prog.permission.edit['.claude/agent-memory/programmateur/**'], 'allow');
    assert.equal(prog.permission.bash, 'deny');
    const ctrl = frontmatter(path.join(dir, 'controleur.md'));
    assert.equal(ctrl.permission.edit['brouillons/*-controle*'], 'allow');
    assert.equal(ctrl.permission.edit['brouillons/**'], undefined);
  } finally {
    rmSync(sortie, { recursive: true, force: true });
  }
});

test('OpenCode : fournisseur direct et nouvelle syntaxe V2 sur demande', () => {
  const sortie = tmp();
  try {
    exporter({ cible: 'opencode', profil: 'max', fournisseur: 'anthropic', formatOpenCode: 'v2', sortie });
    const prog = frontmatter(path.join(sortie, '.opencode', 'agents', 'programmateur.md'));
    assert.equal(prog.model, 'anthropic/claude-sonnet-5-5');
    assert.deepEqual(prog.permissions[0], { action: 'edit', resource: '*', effect: 'deny' });
    assert.deepEqual(prog.permissions.at(-1), { action: 'shell', resource: '*', effect: 'deny' });
    assert.equal(prog.permission, undefined);
  } finally {
    rmSync(sortie, { recursive: true, force: true });
  }
});

test('Codex : TOML avec nom, description, modèle OpenAI et instructions', () => {
  const sortie = tmp();
  try {
    exporter({ cible: 'codex', profil: 'equilibre', sortie });
    const t = readFileSync(path.join(sortie, '.codex', 'agents', 'chef-de-studio.toml'), 'utf8');
    assert.match(t, /^name = "chef-de-studio"$/m);
    assert.match(t, /^model = "gpt-6\.1-sol"$/m);
    assert.match(t, /^developer_instructions = '''/m);
    const prog = readFileSync(path.join(sortie, '.codex', 'agents', 'programmateur.toml'), 'utf8');
    assert.match(prog, /^model = "gpt-6-luna"$/m);
    assert.equal(readdirSync(path.join(sortie, '.codex', 'agents')).length, 11);
  } finally {
    rmSync(sortie, { recursive: true, force: true });
  }
});

test('Gemini : sans modèle l\'agent hérite ; avec un identifiant il le prend', () => {
  const sortie = tmp();
  try {
    exporter({ cible: 'gemini', sortie });
    assert.equal(frontmatter(path.join(sortie, '.gemini', 'agents', 'veilleur.md')).model, undefined);
    exporter({ cible: 'gemini', modeleGemini: 'un-identifiant', sortie });
    assert.equal(frontmatter(path.join(sortie, '.gemini', 'agents', 'veilleur.md')).model, 'un-identifiant');
  } finally {
    rmSync(sortie, { recursive: true, force: true });
  }
});

test('AGENTS.md porte les règles et le skill est copié au chemin standard', () => {
  const sortie = tmp();
  try {
    exporter({ cible: 'agents', sortie });
    const md = readFileSync(path.join(sortie, 'AGENTS.md'), 'utf8');
    assert.match(md, /bidon Petrovöll/);
    assert.match(md, /`controleur`/);
    assert.ok(existsSync(path.join(sortie, '.agents', 'skills', 'regles-cm', 'SKILL.md')));
  } finally {
    rmSync(sortie, { recursive: true, force: true });
  }
});

test('profil ou cible inconnus : refus net, code 1', () => {
  const run = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'exporter-agents.mjs'), ...args], { encoding: 'utf8' });
  assert.equal(run('--profil', 'luxe', '--sortie', os.tmpdir()).status, 1);
  assert.equal(run('--cible', 'inconnu', '--sortie', os.tmpdir()).status, 1);
});
