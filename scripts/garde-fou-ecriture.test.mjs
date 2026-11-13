import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { decider, PERIMETRES } from './garde-fou-ecriture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (rel) => path.join(ROOT, rel);

test('chaque agent écrit dans son périmètre et nulle part ailleurs', () => {
  assert.equal(decider('stratege', p('brouillons/calendrier.md')).ok, true);
  assert.equal(decider('veilleur', p('knowledge/afrique-de-l-ouest.md')).ok, true);
  assert.equal(decider('analyste', p('clients/sasoma.md')).ok, true);
  assert.equal(decider('stratege', p('clients/sasoma.md')).ok, false);
  assert.equal(decider('scenariste', p('docs/03-PROCESSUS-CM.md')).ok, false);
});

test('personne ne touche aux agents, aux réglages, au code, ni au site livré', () => {
  for (const agent of Object.keys(PERIMETRES)) {
    assert.equal(decider(agent, p('.claude/agents/veilleur.md')).ok, false, `${agent} agents`);
    assert.equal(decider(agent, p('.claude/settings.local.json')).ok, false, `${agent} settings`);
    assert.equal(decider(agent, p('studio/server/src/httpServer.ts')).ok, false, `${agent} code`);
    assert.equal(decider(agent, p('CLAUDE.md')).ok, false, `${agent} CLAUDE.md`);
    assert.equal(decider(agent, 'C:/SITE-SASOMA/index.html').ok, false, `${agent} site`);
    assert.equal(decider(agent, p('scripts/garde-fou-ecriture.mjs')).ok, false, `${agent} garde-fou`);
  }
});

test("la mémoire d'un agent est à lui seul", () => {
  assert.equal(decider('veilleur', p('.claude/agent-memory/veilleur/notes.md')).ok, true);
  assert.equal(decider('veilleur', p('.claude/agent-memory/stratege/notes.md')).ok, false);
});

test("le contrôleur n'écrit que ses rapports, jamais le brouillon qu'il contrôle", () => {
  assert.equal(decider('controleur', p('brouillons/sasoma-idees-v1-controle.md')).ok, true);
  assert.equal(decider('controleur', p('brouillons/sasoma-idees-v1.md')).ok, false);
});

test("le programmateur n'écrit que dans sa mémoire", () => {
  assert.equal(decider('programmateur', p('brouillons/post.md')).ok, false);
  assert.equal(decider('programmateur', p('.claude/agent-memory/programmateur/x.md')).ok, true);
});

test('un chemin qui remonte (..) ne sort pas du périmètre', () => {
  assert.equal(decider('stratege', p('brouillons/../docs/05-VERIFICATIONS-ET-HYPOTHESES.md')).ok, false);
  assert.equal(decider('stratege', 'brouillons/../CLAUDE.md', ROOT).ok, false);
  assert.equal(decider('stratege', 'brouillons/ok.md', ROOT).ok, true);
});

test('un agent inconnu est refusé', () => {
  assert.equal(decider('inconnu', p('brouillons/x.md')).ok, false);
});

test('le script bloque (code 2) et laisse passer (code 0) comme un vrai hook', () => {
  const script = path.join(ROOT, 'scripts', 'garde-fou-ecriture.mjs');
  const run = (agent, input) => spawnSync(process.execPath, [script, agent], { input, encoding: 'utf8' });
  const ok = run('stratege', JSON.stringify({ tool_name: 'Write', tool_input: { file_path: p('brouillons/x.md') }, cwd: ROOT }));
  assert.equal(ok.status, 0);
  const non = run('stratege', JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: p('docs/01-VISION-ET-OFFRE.md') }, cwd: ROOT }));
  assert.equal(non.status, 2);
  assert.match(non.stderr, /hors de ton périmètre/);
  const casse = run('stratege', 'pas du json');
  assert.equal(casse.status, 2);
});

test('le traceur écrit ses kits de pixel, et rien d\'autre (ni le site d\'un client, ni les autres dossiers de production)', () => {
  assert.equal(decider('traceur', p('production/pixels/sasoma/pixel-base.html')).ok, true);
  assert.equal(decider('traceur', p('production/plans/2026-11-13-pub.md')).ok, false);
  assert.equal(decider('traceur', p('brouillons/pub.md')).ok, false);
  assert.equal(decider('traceur', p('knowledge/pixel-meta-modele.md')).ok, false);
  assert.equal(decider('traceur', 'C:/SITE-SASOMA/index.html').ok, false);
  // les autres agents ne touchent pas à ses kits, sauf ceux qui écrivent dans production/
  assert.equal(decider('formateur', p('production/pixels/sasoma/pixel-base.html')).ok, false);
});

test("le spécialiste Andromeda écrit ses plans de diversité, et rien d'autre", () => {
  assert.equal(decider('andromeda', p('production/andromeda/sasoma/lancement.md')).ok, true);
  assert.equal(decider('andromeda', p('production/plans/x.md')).ok, false);
  assert.equal(decider('andromeda', p('knowledge/andromeda-meta.md')).ok, false);
  assert.equal(decider('andromeda', p('clients/sasoma.md')).ok, false);
});

test("l'inspirateur écrit ses carnets d'inspiration, et rien d'autre", () => {
  assert.equal(decider('inspirateur', p('production/inspirations/sasoma/chaleur.md')).ok, true);
  assert.equal(decider('inspirateur', p('production/plans/x.md')).ok, false);
  assert.equal(decider('inspirateur', p('brouillons/x.md')).ok, false);
  assert.equal(decider('inspirateur', p('clients/sasoma.md')).ok, false);
});
