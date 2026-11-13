import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { DEBUT, FIN, remplacerZone, tachesOuvertes, zoneAuto } from './relais.mjs';
import { ROOT } from './lib-agents.mjs';

test('la zone automatique est remplacée sans toucher au texte écrit à la main', () => {
  const texte = `Avant\n${DEBUT}\nancien\n${FIN}\nAprès`;
  const sortie = remplacerZone(texte, 'nouveau');
  assert.equal(sortie, `Avant\n${DEBUT}\nnouveau\n${FIN}\nAprès`);
  assert.equal(remplacerZone(sortie, 'nouveau'), sortie, 'idempotent');
  assert.throws(() => remplacerZone('sans repères', 'x'));
  assert.throws(() => remplacerZone(`${FIN}\n${DEBUT}`, 'x'), 'repères dans le désordre');
});

test('les tâches ouvertes viennent de TODO.md, sans gras', () => {
  assert.deepEqual(tachesOuvertes('- [x] fait\n- [ ] **B** : créer le compte\n  - [ ] sous-tâche\ntexte'), ['B : créer le compte', 'sous-tâche']);
});

test('ETAT-DU-PROJET.md a ses repères et la zone auto se génère', () => {
  const etat = readFileSync(path.join(ROOT, 'ETAT-DU-PROJET.md'), 'utf8');
  assert.ok(etat.includes(DEBUT) && etat.includes(FIN));
  assert.match(etat, /## Reprise/);
  const zone = zoneAuto(ROOT);
  assert.match(zone, /Profil de modèles actif/);
  assert.match(zone, /chef-de-studio/);
});

test('réglages des autres outils : serveur delegue-ia branché, aucune clé écrite, ordinateur protégé', () => {
  const serveur = path.join(ROOT, 'scripts', 'delegue-ia', 'serveur.mjs');
  assert.ok(existsSync(serveur));
  const motifCle = /sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}/;

  const oc = readFileSync(path.join(ROOT, 'opencode.json'), 'utf8');
  const conf = JSON.parse(oc);
  assert.equal(conf.permissions, undefined, 'OpenCode 1.x refuse la syntaxe V2 (permissions)');
  const srv = conf.mcp['delegue-ia'];
  assert.equal(srv.type, 'local');
  assert.deepEqual(srv.command, ['node', 'scripts/delegue-ia/serveur.mjs']);
  assert.equal(srv.environment.OPENROUTER_API_KEY, '{env:OPENROUTER_API_KEY}');
  assert.ok(conf.model.startsWith('openrouter/'));
  assert.equal(conf.permission.external_directory, 'deny', 'rien hors du projet');
  assert.equal(conf.permission.bash['*'], 'ask', 'commandes sur demande');
  assert.equal(conf.permission.bash['git push*'], 'deny');
  assert.equal(conf.permission.read['*standalone-token*'], 'deny');
  assert.equal(conf.permission.read['*.env*'], 'deny');
  assert.ok(!motifCle.test(oc));

  const toml = readFileSync(path.join(ROOT, '.codex', 'config.toml'), 'utf8');
  assert.match(toml, /\[mcp_servers\.delegue-ia\]/);
  assert.match(toml, /env_vars = \["OPENROUTER_API_KEY"\]/);
  assert.match(toml, /sandbox_mode = "workspace-write"/);
  assert.match(toml, /network_access = false/);
  assert.ok(!motifCle.test(toml));

  const gem = readFileSync(path.join(ROOT, '.gemini', 'settings.json'), 'utf8');
  const g = JSON.parse(gem);
  assert.equal(g.mcpServers['delegue-ia'].trust, false);
  assert.equal(g.mcpServers['delegue-ia'].env.OPENROUTER_API_KEY, '$OPENROUTER_API_KEY');
  assert.ok(!motifCle.test(gem));
  for (const f of [toml, gem]) assert.ok(f.includes('scripts/delegue-ia/serveur.mjs'));

  const agents = readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
  assert.match(agents, /ETAT-DU-PROJET\.md/);
  assert.match(readFileSync(path.join(ROOT, 'GEMINI.md'), 'utf8'), /ETAT-DU-PROJET\.md/);
});
