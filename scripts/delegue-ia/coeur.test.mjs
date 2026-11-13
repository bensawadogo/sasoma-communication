import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createInterface } from 'node:readline';

import { budget, chargerConfig, corpsRequete, deleguer, ErreurDelegation, estimer, journalChemin, lireJournal, nettoyer, preparer, reinitialiserCachePrix, ROOT } from './coeur.mjs';

const cfgReelle = chargerConfig(ROOT);

function projet() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'delegue-'));
  const ecrire = (rel, txt) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), txt);
  };
  ecrire('clients/sasoma.md', '# SASOMA\nDistributeur Petrovöll, tél 70 12 34 56.');
  ecrire('knowledge/lecons.md', '# Leçons\nPhrases courtes.');
  ecrire('docs/guide.md', '# Guide\nUn guide interne.');
  ecrire('brouillons/post.md', 'Brouillon de post.');
  ecrire('production/budgets.json', '{"secret": 1}');
  ecrire('studio/code.md', 'code');
  ecrire('docs/token-studio.md', 'jeton');
  ecrire('README.md', 'racine');
  ecrire('.claude/agents/scenariste.md', '---\nname: scenariste\ndescription: x\n---\nTu écris des scénarios courts.');
  ecrire('.claude/skills/regles-cm/SKILL.md', '---\nname: regles-cm\n---\nRÈGLE : le bidon n\'est jamais généré.');
  return root;
}

function contexte(root, { cle = null, reponse, appels = [], plafonds = {} } = {}) {
  reinitialiserCachePrix();
  return {
    root,
    cfg: { ...cfgReelle, plafonds: { ...cfgReelle.plafonds, ...plafonds }, modeles: { ...cfgReelle.modeles, texte: { id: 'x/texte-seul', zone: 'occidentale', prix_ref: [1, 1] } } },
    env: cle ? { OPENROUTER_API_KEY: cle } : {},
    base: 'https://exemple.test/api/v1',
    maintenant: () => new Date('2026-11-13T10:00:00Z'),
    fetch: async (url, opts) => {
      appels.push({ url, opts });
      if (url.endsWith('/models')) {
        const voit = (id) => ({ id, pricing: { prompt: '0.000002', completion: '0.00001' }, architecture: { input_modalities: ['text', 'image'] } });
        return { ok: true, status: 200, json: async () => ({ data: [voit('openai/gpt-6.1-sol'), voit('anthropic/claude-sonnet-5.5'), { id: 'x/texte-seul', pricing: { prompt: '0.000001', completion: '0.000001' }, architecture: { input_modalities: ['text'] } }] }) };
      }
      if (url.endsWith('/key')) return { ok: true, status: 200, json: async () => ({ data: { limit: 5, limit_remaining: 4.5, usage_daily: 0.1, usage_monthly: 0.5 } }) };
      return reponse ?? { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'Texte rendu' }, finish_reason: 'stop' }], usage: { prompt_tokens: 100, completion_tokens: 20, cost: 0.0012 }, provider: 'FournisseurTest' }) };
    },
  };
}

const base = { alias: 'luna', donnees: 'public', tache: 'Écris trois idées de légendes sur les saisons.' };
const refus = (promesse, code) => assert.rejects(promesse, (e) => e instanceof ErreurDelegation && e.code === code, `attendu ${code}`);

test('nettoyer masque clés, jetons, e-mails, téléphones ; garde le texte normal', () => {
  const { texte, compte } = nettoyer(
    'clé sk-or-v1-abcdef1234567890abcdef ; ?token=abc123def ; Bearer abcdefghijklmnop1234 ; ben@exemple.com ; +226 70 12 34 56 ; 70 12 34 56 ; ' +
      'a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6 ; anticonstitutionnellement_anticonstitutionnellement ; entretien du moteur',
  );
  assert.ok(!/sk-or|abc123def|abcdefghijklmnop|ben@|70 12|a1b2c3d4/.test(texte), texte);
  assert.match(texte, /anticonstitutionnellement_anticonstitutionnellement/);
  assert.match(texte, /entretien du moteur/);
  assert.ok(compte.cle >= 4 && compte.email === 1 && compte.telephone >= 2, JSON.stringify(compte));
});

test('données non déclarées : refus ; modèle inconnu : refus', async () => {
  const root = projet();
  try {
    await refus(preparer({ alias: 'luna', tache: 'x' }, contexte(root)), 'DONNEES_REQUISES');
    await refus(preparer({ ...base, alias: 'inconnu' }, contexte(root)), 'MODELE_INCONNU');
    await refus(preparer({ ...base, tache: '  ' }, contexte(root)), 'TACHE_VIDE');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('une donnée client ne part jamais vers un modèle chinois, même déclarée publique', async () => {
  const root = projet();
  try {
    await refus(preparer({ ...base, alias: 'kimi', donnees: 'client' }, contexte(root)), 'ZONE_REFUSEE');
    await refus(preparer({ ...base, alias: 'deepseek-flash', donnees: 'interne' }, contexte(root)), 'ZONE_REFUSEE');
    // déclaré public mais le texte nomme le client
    await refus(preparer({ ...base, alias: 'glm', tache: 'Idées de posts pour SASOMA' }, contexte(root)), 'ZONE_REFUSEE');
    await refus(preparer({ ...base, alias: 'glm', tache: 'Un bidon Petrovöll sur la route' }, contexte(root)), 'ZONE_REFUSEE');
    // déclaré public mais un fichier client est lu
    await refus(preparer({ ...base, alias: 'qwen-flash', fichiers: ['clients/sasoma.md'] }, contexte(root)), 'ZONE_REFUSEE');
    await refus(preparer({ ...base, alias: 'qwen-flash', fichiers: ['docs/guide.md'] }, contexte(root)), 'ZONE_REFUSEE');
    // brouillons = client
    const p = await preparer({ ...base, alias: 'sol', fichiers: ['brouillons/post.md'] }, contexte(root));
    assert.equal(p.classe, 'client');
    assert.ok(p.raisons.length > 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('public : un modèle chinois est permis, sans contexte du projet ; client : zdr et pas de collecte', async () => {
  const root = projet();
  try {
    const pub = await preparer({ ...base, alias: 'deepseek-flash', agent: 'scenariste' }, contexte(root));
    assert.equal(pub.classe, 'public');
    assert.ok(!pub.messages[0].content.includes('bidon'), 'le contexte du projet ne part pas en public');
    assert.ok(!pub.messages[0].content.includes('scénarios courts'));
    const c1 = corpsRequete(pub);
    assert.equal(c1.provider.data_collection, 'deny');
    assert.equal(c1.provider.zdr, undefined);

    const cli = await preparer({ ...base, alias: 'sol', donnees: 'client', agent: 'scenariste' }, contexte(root));
    assert.match(cli.messages[0].content, /scénarios courts/);
    assert.match(cli.messages[0].content, /bidon/);
    const c2 = corpsRequete(cli);
    assert.deepEqual(c2.provider, { data_collection: 'deny', zdr: true, require_parameters: true });
    assert.equal(c2.tools, undefined, "aucun outil n'est donné à l'autre IA");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('le texte envoyé est nettoyé (téléphone d’une fiche client, clé collée par erreur)', async () => {
  const root = projet();
  try {
    const p = await preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: ['clients/sasoma.md'], contexte: 'ma clé sk-abcdef1234567890abcdef' }, contexte(root));
    const tout = p.messages.map((m) => m.content).join('\n');
    assert.ok(!tout.includes('70 12 34 56') && !tout.includes('sk-abcdef'), tout);
    assert.ok(p.redactions.telephone >= 1 && p.redactions.cle >= 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fichiers : production, code, jetons, racine, hors projet, extensions refusés', async () => {
  const root = projet();
  try {
    for (const f of ['production/budgets.json', 'studio/code.md', 'docs/token-studio.md', 'README.md', '../secret.md', path.join(os.tmpdir(), 'x.md'), '.claude/agents/scenariste.md']) {
      await refus(preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: [f] }, contexte(root)), 'FICHIER_REFUSE');
    }
    // « secretaires » n'est pas un secret : ce fichier doit rester lisible
    writeFileSync(path.join(root, 'docs', '04-FORMATION-SECRETAIRES.md'), 'fiche');
    const ok = await preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: ['docs/04-FORMATION-SECRETAIRES.md'] }, contexte(root));
    assert.deepEqual(ok.fichiers, ['docs/04-FORMATION-SECRETAIRES.md']);
    for (const f of ['docs/mon_secret.md', 'docs/api-key.md', 'docs/standalone-token.md']) {
      writeFileSync(path.join(root, f), 'x');
      await refus(preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: [f] }, contexte(root)), 'FICHIER_REFUSE');
    }
    writeFileSync(path.join(root, 'docs', 'a.exe'), 'x');
    await refus(preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: ['docs/a.exe'] }, contexte(root)), 'FICHIER_REFUSE');
    await refus(preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: ['docs/absent.md'] }, contexte(root)), 'FICHIER_REFUSE');
    writeFileSync(path.join(root, 'docs', 'gros.md'), 'x'.repeat(70_000));
    await refus(preparer({ ...base, alias: 'sol', donnees: 'client', fichiers: ['docs/gros.md'] }, contexte(root)), 'FICHIER_REFUSE');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('photos : métadonnées retirées, dossier imposé, classe client, modèle qui voit les images', async () => {
  const root = projet();
  try {
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe1, 0x00, 0x12]), Buffer.from('Exif\0\0GPS-12.3,-1.5'), // EXIF avec position
      Buffer.from([0xff, 0xdb, 0x00, 0x04, 0x01, 0x02]),
      Buffer.from([0xff, 0xda, 0x00, 0x04, 0x03, 0x04, 0x99, 0x98, 0xff, 0xd9]),
    ]);
    const bloc = (type, data) => {
      const l = Buffer.alloc(4);
      l.writeUInt32BE(data.length);
      return Buffer.concat([l, Buffer.from(type, 'latin1'), data, Buffer.alloc(4)]);
    };
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloc('IHDR', Buffer.alloc(13)), bloc('tEXt', Buffer.from('GPS=12.3')), bloc('IDAT', Buffer.from('pixels')), bloc('IEND', Buffer.alloc(0))]);
    mkdirSync(path.join(root, 'photos-clients', 'sasoma'), { recursive: true });
    writeFileSync(path.join(root, 'photos-clients', 'sasoma', 'bidon.jpg'), jpeg);
    writeFileSync(path.join(root, 'photos-clients', 'sasoma', 'bidon.png'), png);
    writeFileSync(path.join(root, 'photos-clients', 'sasoma', 'faux.jpg'), Buffer.from('pas une image'));
    writeFileSync(path.join(root, 'docs', 'hors.jpg'), jpeg);

    const p = await preparer({ ...base, alias: 'sol', donnees: 'public', images: ['photos-clients/sasoma/bidon.jpg', 'photos-clients/sasoma/bidon.png'] }, contexte(root));
    assert.equal(p.classe, 'client', 'une photo impose la classe client');
    const parts = p.messages[1].content;
    assert.equal(parts[0].type, 'text');
    assert.equal(parts.filter((x) => x.type === 'image_url').length, 2);
    const dec = parts.filter((x) => x.type === 'image_url').map((x) => Buffer.from(x.image_url.url.split(',')[1], 'base64'));
    for (const b of dec) assert.ok(!b.includes('GPS'), 'les métadonnées sont retirées');
    assert.ok(dec[0].subarray(0, 2).equals(Buffer.from([0xff, 0xd8])) && dec[0].subarray(-2).equals(Buffer.from([0xff, 0xd9])), 'JPEG intact');
    assert.ok(dec[1].includes('IDAT') && dec[1].includes('IEND'), 'PNG intact');
    assert.match(await estimer({ ...base, alias: 'sol', donnees: 'client', images: ['photos-clients/sasoma/bidon.jpg'] }, contexte(root)), /Photos envoyées/);

    await refus(preparer({ ...base, alias: 'sol', images: ['docs/hors.jpg'] }, contexte(root)), 'IMAGE_REFUSEE');
    await refus(preparer({ ...base, alias: 'sol', images: ['photos-clients/sasoma/faux.jpg'] }, contexte(root)), 'IMAGE_REFUSEE');
    await refus(preparer({ ...base, alias: 'sol', images: ['photos-clients/absente.jpg'] }, contexte(root)), 'IMAGE_REFUSEE');
    await refus(preparer({ ...base, alias: 'sol', images: ['../x.jpg'] }, contexte(root)), 'IMAGE_REFUSEE');
    await refus(preparer({ ...base, alias: 'texte', images: ['photos-clients/sasoma/bidon.jpg'] }, contexte(root)), 'IMAGE_NON_SUPPORTEE');
    await refus(preparer({ ...base, alias: 'kimi', images: ['photos-clients/sasoma/bidon.jpg'] }, contexte(root)), 'ZONE_REFUSEE');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('plafonds : par appel, par jour (journal), annonce obligatoire au-dessus du seuil', async () => {
  const root = projet();
  try {
    const gros = { alias: 'opus', donnees: 'client', tache: 'Écris un long texte', contexte: 'y'.repeat(30_000), max_tokens: 2000 };
    await refus(preparer(gros, contexte(root, { plafonds: { par_appel_usd: 0.01 } })), 'PLAFOND_APPEL');
    // un très long texte sans arobase ne doit pas ralentir le nettoyage
    const t0 = Date.now();
    for (const piege of ['x'.repeat(120_000), '1 '.repeat(60_000), 'a.'.repeat(60_000), '+1 '.repeat(40_000), 'ab-'.repeat(40_000), 'a@'.repeat(60_000)]) nettoyer(piege);
    assert.ok(Date.now() - t0 < 6000, 'nettoyage trop lent');
    await refus(deleguer(gros, contexte(root)), 'ANNONCE_REQUISE');
    const e = await estimer(gros, contexte(root));
    assert.match(e, /à annoncer à Ben/);
    const sim = await deleguer({ ...gros, cout_annonce_usd: 0.2 }, contexte(root));
    assert.match(sim, /SIMULATION/);

    // journal : 1,99 $ déjà dépensés aujourd'hui, un appel de ~0,0X $ dépasse 2 $
    mkdirSync(path.join(root, 'production'), { recursive: true });
    writeFileSync(journalChemin(root), JSON.stringify({ t: '2026-11-13T08:00:00Z', cout_usd: 1.995 }) + '\n');
    await refus(preparer({ ...base, alias: 'sonnet', donnees: 'client', max_tokens: 1000 }, contexte(root)), 'PLAFOND_JOUR');
    writeFileSync(journalChemin(root), JSON.stringify({ t: '2026-11-02T08:00:00Z', cout_usd: 14.999 }) + '\n');
    await refus(preparer({ ...base, alias: 'sonnet', donnees: 'client', max_tokens: 1000 }, contexte(root)), 'PLAFOND_MOIS');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('sans clé : simulation, aucun appel réseau vers OpenRouter', async () => {
  const root = projet();
  try {
    const appels = [];
    const sortie = await deleguer({ ...base, alias: 'sol', donnees: 'client' }, contexte(root, { appels }));
    assert.match(sortie, /SIMULATION/);
    assert.ok(!appels.some((a) => a.url.includes('/chat/completions')));
    assert.equal(lireJournal(root).length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('avec clé : appel complet, réponse marquée, journal sans contenu, routage sans conservation', async () => {
  const root = projet();
  try {
    const appels = [];
    const sortie = await deleguer({ ...base, alias: 'sol', donnees: 'client', tache: 'Légende pour le post de Mme Test' }, contexte(root, { cle: 'sk-or-v1-secretsecretsecret', appels }));
    assert.match(sortie, /RÉPONSE D'UNE AUTRE IA/);
    assert.match(sortie, /Texte rendu/);
    assert.match(sortie, /FournisseurTest/);
    const appel = appels.find((a) => a.url.endsWith('/chat/completions'));
    const corps = JSON.parse(appel.opts.body);
    assert.equal(corps.model, 'openai/gpt-6.1-sol');
    assert.equal(corps.provider.zdr, true);
    assert.equal(appel.opts.headers.Authorization, 'Bearer sk-or-v1-secretsecretsecret');
    assert.deepEqual(Object.keys(appel.opts.headers).sort(), ['Authorization', 'Content-Type'], "aucun en-tête qui identifie le projet");
    const j = lireJournal(root);
    assert.equal(j.length, 1);
    assert.equal(j[0].cout_usd, 0.0012);
    assert.ok(!JSON.stringify(j).includes('Légende'), 'le journal ne garde pas le contenu');
    assert.match(await budget(contexte(root, { cle: 'sk-or-v1-secretsecretsecret' })), /Aujourd'hui : 0\.0012/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refus d’OpenRouter : message utile, la clé n’apparaît jamais', async () => {
  const root = projet();
  try {
    const cle = 'sk-or-v1-secretsecretsecret';
    const reponse = { ok: false, status: 404, json: async () => ({ error: { message: `No endpoints found (clé ${cle})` } }) };
    await assert.rejects(deleguer({ ...base, alias: 'sol', donnees: 'client' }, contexte(root, { cle, reponse })), (e) => {
      assert.equal(e.code, 'APPEL_ECHOUE');
      assert.ok(!e.message.includes(cle));
      assert.match(e.message, /sans conservation/);
      return true;
    });
    assert.equal(lireJournal(root).length, 0, 'un appel refusé ne coûte rien et ne se journalise pas');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('serveur MCP : initialize, liste des outils, appel simulé, erreur claire', async () => {
  const enfant = spawn(process.execPath, [path.join(ROOT, 'scripts', 'delegue-ia', 'serveur.mjs')], { env: { ...process.env, OPENROUTER_API_KEY: '' }, stdio: ['pipe', 'pipe', 'inherit'] });
  const lignes = createInterface({ input: enfant.stdout });
  const attentes = new Map();
  lignes.on('line', (l) => {
    const m = JSON.parse(l);
    attentes.get(m.id)?.(m);
  });
  let n = 0;
  const demander = (method, params) =>
    new Promise((resolve) => {
      const id = ++n;
      attentes.set(id, resolve);
      enfant.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  try {
    const init = await demander('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(init.result.serverInfo.name, 'delegue-ia');
    enfant.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const liste = await demander('tools/list', {});
    assert.deepEqual(liste.result.tools.map((t) => t.name).sort(), ['budget', 'deleguer', 'estimer', 'lister_modeles']);
    const ok = await demander('tools/call', { name: 'deleguer', arguments: { alias: 'luna', donnees: 'public', tache: 'Trois idées de légendes générales.' } });
    assert.match(ok.result.content[0].text, /SIMULATION/);
    const ko = await demander('tools/call', { name: 'deleguer', arguments: { alias: 'kimi', donnees: 'client', tache: 'x' } });
    assert.equal(ko.result.isError, true);
    assert.match(ko.result.content[0].text, /ZONE_REFUSEE/);
    const inconnu = await demander('methode/inconnue', {});
    assert.equal(inconnu.error.code, -32601);
  } finally {
    enfant.kill();
  }
  assert.ok(readFileSync(path.join(ROOT, 'config', 'delegation.json'), 'utf8').includes('"par_jour_usd"'));
});
