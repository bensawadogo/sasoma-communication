import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { construirePage, echapper, lienSur, cheminImageAutorise } from './moodboard.mjs';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==', 'base64');

function racineTemporaire() {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'moodboard-'));
  fs.mkdirSync(path.join(racine, 'photos-clients', '_a-classer'), { recursive: true });
  fs.mkdirSync(path.join(racine, 'production', 'inspirations', 'sasoma'), { recursive: true });
  fs.writeFileSync(path.join(racine, 'photos-clients', '_a-classer', 'a.png'), PNG);
  fs.writeFileSync(path.join(racine, 'secret.png'), PNG);
  return racine;
}

test('la planche inclut l\'image rapportée, la source et le verdict', () => {
  const racine = racineTemporaire();
  const { html, avertissements, total } = construirePage({
    racine, client: 'sasoma', theme: 't',
    references: [{ image: 'photos-clients/_a-classer/a.png', source: 'Studio X', lien: 'https://exemple.org/p', groupe: 'Atelier', note: 'lumière rasante', verdict: 'garder' }],
  });
  assert.equal(total, 1);
  assert.deepEqual(avertissements, []);
  assert.match(html, /data:image\/png;base64,/);
  assert.match(html, /Studio X/);
  assert.match(html, /garder/);
});

test('une image hors des dossiers prévus est refusée', () => {
  const racine = racineTemporaire();
  const dossier = path.join(racine, 'production', 'inspirations', 'sasoma');
  assert.equal(cheminImageAutorise(racine, 'secret.png', dossier), null);
  assert.equal(cheminImageAutorise(racine, '../secret.png', dossier), null);
  assert.equal(cheminImageAutorise(racine, 'photos-clients/_a-classer/a.png', dossier) !== null, true);
  assert.equal(cheminImageAutorise(racine, 'photos-clients/x.exe', dossier), null);
});

test('une référence sans source est signalée, jamais acceptée en silence', () => {
  const racine = racineTemporaire();
  const { avertissements, html } = construirePage({ racine, client: 'sasoma', theme: 't', references: [{ image: 'photos-clients/_a-classer/a.png' }] });
  assert.ok(avertissements.some((a) => /source/.test(a)));
  assert.match(html, /non vérifié/);
});

test('le HTML est échappé et seuls les liens http(s) sont gardés', () => {
  assert.equal(echapper('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(lienSur('javascript:alert(1)'), null);
  assert.equal(lienSur('data:text/html,x'), null);
  assert.equal(lienSur('https://a.org/x'), 'https://a.org/x');
  const racine = racineTemporaire();
  const { html, avertissements } = construirePage({
    racine, client: 'sasoma', theme: 't',
    references: [{ source: '<script>alert(1)</script>', lien: 'javascript:alert(1)', note: '"><b>', verdict: 'garder' }],
  });
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /href="javascript/);
  assert.ok(avertissements.some((a) => /lien refusé/.test(a)));
});
