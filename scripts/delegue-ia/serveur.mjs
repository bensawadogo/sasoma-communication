// Serveur MCP "delegue-ia" (stdio, sans dépendance). Permet au chef de studio d'appeler d'autres IA via OpenRouter,
// avec classification des données, nettoyage, routage sans conservation et plafonds de dépense.
// Protocole : JSON-RPC, un message par ligne sur stdin/stdout. Les journaux vont sur stderr, jamais sur stdout.
import { createInterface } from 'node:readline';

import { budget, contexteParDefaut, deleguer, ErreurDelegation, estimer, listerModeles } from './coeur.mjs';

const ctx = contexteParDefaut();

const entree = {
  agent: { type: 'string', description: "Nom de l'agent du studio dont le rôle guide la réponse (ex. scenariste). Facultatif." },
  alias: { type: 'string', description: 'Modèle (voir lister_modeles) : haiku, sonnet, opus, luna, terra, sol, hydrogen, carbon, argon, deepseek-flash, kimi, qwen-flash, glm, minimax-flash.' },
  donnees: { type: 'string', enum: ['public', 'interne', 'client'], description: "Nature des données envoyées. 'client' dès qu'il s'agit d'un client, de ses faits ou d'un brouillon ; en cas de doute, 'client'. Le serveur peut relever la classe, jamais la baisser." },
  tache: { type: 'string', description: 'Ce que le modèle doit produire.' },
  contexte: { type: 'string', description: 'Texte utile à la tâche (sera nettoyé : clés, e-mails, téléphones masqués).' },
  fichiers: { type: 'array', items: { type: 'string' }, description: 'Chemins relatifs au projet (clients/, knowledge/, brouillons/, docs/, recherches/, evals/, config/ seulement). Lus par le serveur.' },
  images: { type: 'array', items: { type: 'string' }, description: "Photos à montrer au modèle : chemins dans photos-clients/ (.jpg .png, 4 Mo, 4 maximum). Classe client imposée, métadonnées retirées. Modèles qui voient les images : haiku, sonnet, opus, luna, terra, sol, hydrogen, carbon, argon." },
  max_tokens: { type: 'integer', description: 'Longueur maximale de la réponse (défaut 3000, plafonné).' },
  temperature: { type: 'number', description: 'Facultatif, entre 0 et 1,5.' },
};

const OUTILS = [
  {
    name: 'estimer',
    description: "Prépare un envoi SANS l'effectuer : classe appliquée, ce qui est masqué, routage, coût maximal estimé. Avec apercu=true, montre le texte exact qui partirait. À appeler avant deleguer pour tout envoi qui dépasse le seuil d'annonce.",
    inputSchema: { type: 'object', properties: { ...entree, apercu: { type: 'boolean', description: 'Montrer le texte exact qui partirait.' } }, required: ['alias', 'donnees', 'tache'] },
  },
  {
    name: 'deleguer',
    description: "Envoie une tâche à une autre IA via OpenRouter et rend sa réponse, marquée comme donnée à contrôler. Refuse si les données ne peuvent pas aller vers ce modèle, si un plafond est dépassé, ou si le coût dépasse le seuil d'annonce sans cout_annonce_usd. La réponse passe ensuite par le contrôleur et les 3 portes de Ben.",
    inputSchema: { type: 'object', properties: { ...entree, cout_annonce_usd: { type: 'number', description: "Coût annoncé à Ben, obligatoire si l'estimation dépasse le seuil." } }, required: ['alias', 'donnees', 'tache'] },
  },
  { name: 'budget', description: "Dépenses d'aujourd'hui et du mois, plafonds, état de la clé OpenRouter.", inputSchema: { type: 'object', properties: {} } },
  { name: 'lister_modeles', description: 'Modèles disponibles, zone, données permises, prix de référence.', inputSchema: { type: 'object', properties: {} } },
];

async function appeler(nom, args) {
  const a = args && typeof args === 'object' ? args : {};
  switch (nom) {
    case 'estimer':
      return estimer(a, ctx, { apercu: a.apercu === true });
    case 'deleguer':
      return deleguer(a, ctx);
    case 'budget':
      return budget(ctx);
    case 'lister_modeles':
      return listerModeles(ctx.cfg);
    default:
      throw new ErreurDelegation('OUTIL_INCONNU', `Outil inconnu : ${nom}`);
  }
}

const envoyer = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');

async function traiter(requete) {
  const { id, method, params } = requete;
  const estRequete = id !== undefined && id !== null;
  try {
    switch (method) {
      case 'initialize':
        return envoyer({ id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'delegue-ia', version: '1.0.0' } } });
      case 'ping':
        return envoyer({ id, result: {} });
      case 'tools/list':
        return envoyer({ id, result: { tools: OUTILS } });
      case 'tools/call': {
        try {
          const texte = await appeler(params?.name, params?.arguments);
          return envoyer({ id, result: { content: [{ type: 'text', text: texte }] } });
        } catch (e) {
          const msg = e instanceof ErreurDelegation ? `${e.code} : ${e.message}` : `ERREUR_INTERNE : ${e.message}`;
          return envoyer({ id, result: { isError: true, content: [{ type: 'text', text: msg }] } });
        }
      }
      default:
        if (estRequete) envoyer({ id, error: { code: -32601, message: `Méthode inconnue : ${method}` } });
    }
  } catch (e) {
    if (estRequete) envoyer({ id, error: { code: -32603, message: e.message } });
  }
}

createInterface({ input: process.stdin }).on('line', (ligne) => {
  if (!ligne.trim()) return;
  let requete;
  try {
    requete = JSON.parse(ligne);
  } catch {
    return envoyer({ id: null, error: { code: -32700, message: 'JSON invalide' } });
  }
  void traiter(requete);
});
