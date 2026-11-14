#!/usr/bin/env node
// Planche d'inspiration (moodboard) locale, pour Ben seulement.
// Usage : node scripts/moodboard.mjs <client> <theme>
// Lit    production/inspirations/<client>/<theme>-references.json  (écrit par l'agent inspirateur)
// Écrit  production/inspirations/<client>/<theme>-moodboard.html   (une seule page, images incluses)
// Rien n'est téléchargé : seules les images que Ben a rapportées lui-même (captures glissées dans le popup du
// Studio, ou déposées dans le dossier du thème) sont lues. Aucun réseau, aucune collecte sur Pinterest.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_IMAGE_OCTETS = 4_000_000;
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const VERDICTS = ['garder', 'écarter', 'non vérifié'];

export function echapper(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Un lien n'est affiché que s'il est http(s) : jamais javascript:, data:, file:. */
export function lienSur(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Les images ne se lisent que dans les dossiers prévus (jamais ailleurs sur l'ordinateur). */
export function cheminImageAutorise(racine, chemin, dossierTheme) {
  if (!chemin || typeof chemin !== 'string') return null;
  const abs = path.resolve(racine, chemin);
  const permis = [path.resolve(racine, 'photos-clients'), path.resolve(dossierTheme)];
  const ok = permis.some((d) => abs === d || abs.startsWith(d + path.sep));
  return ok && TYPES[path.extname(abs).toLowerCase()] ? abs : null;
}

export function construirePage({ racine = ROOT, client, theme, references }) {
  const dossierTheme = path.join(racine, 'production', 'inspirations', client);
  const avertissements = [];
  const items = references.map((r, i) => {
    const verdict = VERDICTS.includes(r.verdict) ? r.verdict : 'non vérifié';
    let data = null;
    if (r.image) {
      const abs = cheminImageAutorise(racine, r.image, dossierTheme);
      if (!abs) avertissements.push(`#${i + 1} : chemin d'image refusé ou format inconnu (${r.image})`);
      else if (!fs.existsSync(abs)) avertissements.push(`#${i + 1} : image introuvable (${r.image})`);
      else if (fs.statSync(abs).size > MAX_IMAGE_OCTETS) avertissements.push(`#${i + 1} : image trop lourde (> 4 Mo)`);
      else data = `data:${TYPES[path.extname(abs).toLowerCase()]};base64,${fs.readFileSync(abs).toString('base64')}`;
    }
    const lien = r.lien ? lienSur(r.lien) : null;
    if (r.lien && !lien) avertissements.push(`#${i + 1} : lien refusé (seuls http et https sont acceptés)`);
    if (!r.source) avertissements.push(`#${i + 1} : aucune source d'origine (agence, marque, photographe) : à écarter ou à chercher`);
    return { n: i + 1, data, lien, verdict, source: r.source || '', groupe: r.groupe || 'Sans groupe', note: r.note || '' };
  });

  const groupes = [...new Set(items.map((x) => x.groupe))];
  const carte = (x) => `
    <figure class="carte ${x.verdict === 'écarter' ? 'ecartee' : ''}">
      ${x.data ? `<img src="${x.data}" alt="Référence ${x.n}">` : '<div class="vide">image non fournie</div>'}
      <figcaption>
        <span class="badge ${x.verdict === 'garder' ? 'ok' : x.verdict === 'écarter' ? 'non' : 'doute'}">${echapper(x.verdict)}</span>
        <strong>#${x.n}</strong> ${x.source ? echapper(x.source) : '<em>source inconnue</em>'}
        ${x.lien ? `<br><a href="${echapper(x.lien)}" rel="noopener noreferrer" target="_blank">page d'origine</a>` : ''}
        ${x.note ? `<p>${echapper(x.note)}</p>` : ''}
      </figcaption>
    </figure>`;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Planche d'inspiration ${echapper(client)} ${echapper(theme)}</title>
<style>
  :root { --fond:#F4F7FB; --texte:#0B2544; --marine:#00244A; --accent:#BF560C; --carte:#fff; --bord:#d5dde8; }
  @media (prefers-color-scheme: dark) { :root { --fond:#0e1a2b; --texte:#e8eef7; --carte:#16263c; --bord:#2a3d57; --accent:#f08a4b; } }
  body { margin:0; background:var(--fond); color:var(--texte); font:16px/1.5 system-ui, sans-serif; }
  header, section { padding:16px; max-width:1200px; margin:auto; }
  h1 { color:var(--marine); } @media (prefers-color-scheme: dark) { h1 { color:var(--texte); } }
  .avis { border-left:4px solid var(--accent); padding:8px 12px; background:var(--carte); }
  .grille { column-width:240px; column-gap:12px; }
  .carte { break-inside:avoid; margin:0 0 12px; background:var(--carte); border:1px solid var(--bord); border-radius:8px; overflow:hidden; }
  .carte img { width:100%; display:block; } .vide { padding:40px 8px; text-align:center; opacity:.6; }
  .ecartee { opacity:.45; } figcaption { padding:8px 10px; font-size:14px; } figcaption p { margin:6px 0 0; }
  .badge { font-size:12px; padding:1px 8px; border-radius:99px; margin-right:6px; border:1px solid currentColor; }
  .ok { color:#0a7a3d; } .non { color:#b3261e; } .doute { color:#8a6100; }
  a { color:var(--accent); }
</style></head><body>
<header>
  <h1>Planche d'inspiration : ${echapper(client)} / ${echapper(theme)}</h1>
  <p class="avis">Document interne pour Ben. Chaque image appartient à son auteur : elle se regarde, elle ne se copie pas, et elle n'est jamais publiée ni envoyée. Une référence sans source d'origine reste « non vérifiée ».</p>
  ${avertissements.length ? `<p class="avis"><strong>À corriger :</strong></p><ul>${avertissements.map((a) => `<li>${echapper(a)}</li>`).join('')}</ul>` : ''}
</header>
${groupes.map((g) => `<section><h2>${echapper(g)}</h2><div class="grille">${items.filter((x) => x.groupe === g).map(carte).join('')}</div></section>`).join('\n')}
</body></html>`;
  return { html, avertissements, total: items.length };
}

function principal() {
  const [client, theme] = process.argv.slice(2);
  if (!client || !theme || /[^a-z0-9-]/i.test(client + theme)) {
    console.error('Usage : node scripts/moodboard.mjs <client> <theme>   (lettres, chiffres et tirets seulement)');
    process.exit(2);
  }
  const dossier = path.join(ROOT, 'production', 'inspirations', client);
  const entree = path.join(dossier, `${theme}-references.json`);
  if (!fs.existsSync(entree)) {
    console.error(`Fichier introuvable : ${entree}\nL'inspirateur l'écrit quand Ben a rapporté des références.`);
    process.exit(1);
  }
  const references = JSON.parse(fs.readFileSync(entree, 'utf8'));
  if (!Array.isArray(references)) {
    console.error('Le fichier doit contenir une liste de références.');
    process.exit(1);
  }
  const { html, avertissements, total } = construirePage({ client, theme, references });
  const sortie = path.join(dossier, `${theme}-moodboard.html`);
  fs.writeFileSync(sortie, html);
  console.log(`Planche écrite : ${sortie} (${total} références)`);
  for (const a of avertissements) console.log(`  ! ${a}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
