# Accès à distance et plusieurs clients (13/11/2026)

Remarque de Ben : le projet n'est pas pour SASOMA seulement. Donc le lien iPhone ne doit pas être pensé comme « mon Wi-Fi à la maison », et les entreprises clientes ne doivent jamais se voir entre elles.

## Deux publics, deux surfaces
| Public | Ce qu'il lui faut | Surface |
|---|---|---|
| **Ben** (chef) | Tout : agents, 3D, discussion, quêtes, tokens, tous les clients | Le **Studio**, privé, accessible de partout |
| **Secrétaires des entreprises clientes** | Leurs missions à elles, leur formation, leurs portes en attente | Un **espace client**, séparé, limité à **leur** entreprise (n'existe pas encore) |

**Le Studio ne doit jamais être ouvert aux secrétaires.** D'après la documentation du projet d'origine (`studio/CLAUDE.md`), un visiteur sans jeton peut déjà *regarder* le bureau en lecture seule (agents, états, activité des outils) ; je ne l'ai pas vérifié par un essai, mais il verrait alors l'activité faite pour les autres clients. La discussion avec les agents (`/api/chat`), les tokens et le terminal exigent le jeton de Ben et restent fermés aux autres.

## Ce qui est fait dans le code (isolement entre entreprises)
Avant : un jeton secrétaire voyait **toutes** les missions de **tous** les clients, et pouvait agir dessus. Après (tests : 34 verts) :
- Un jeton secrétaire est lié à **une seule entreprise** (`clientId` dans `~/.pixel-agents/quest-actors.json`). Une entrée de secrétaire **sans** entreprise est ignorée (pas de client, pas d'accès).
- Elle ne voit que les missions et les personnes de son entreprise. Le chef voit tout.
- Elle ne peut créer de mission que pour son entreprise (`OTHER_CLIENT`). Une mission d'une autre entreprise lui répond « introuvable », comme si elle n'existait pas.
- Le rôle et l'entreprise viennent du fichier du serveur, jamais de la requête.
Exemple : `{ "<jeton-long-et-secret>": { "id": "awa", "role": "secretary", "clientId": "sasoma" } }`.

## Le lien de Ben (le Studio, de n'importe où)
Comparatif détaillé et à jour (ngrok, Cloudflare, Tailscale, zrok…) : `docs/18-TUNNELS-COMPARATIF.md`. **Correction** : Tailscale gratuit est réservé à un usage non commercial (page officielle de Tailscale) : pas pour l'activité de Ben sans payer.

| Moyen | État de la vérification | À savoir |
|---|---|---|
| **Port relayé par VS Code, visibilité Private** | Documentation officielle lue (`docs/12`, chemin C) | Seul le compte GitHub de Ben y accède ; il faut que VS Code reste ouvert sur le PC ; débit limité ; pas testé sur iPhone |
| **Tailscale** (réseau privé chiffré) | Procédure fournie par le projet d'origine (pixel-agents) ; conditions et prix du compte **non lus** | Une application à installer sur le PC et l'iPhone de Ben |
| **Cloudflare Tunnel + Cloudflare Access** | Cloudflare dit : accès refusé par défaut, autorisation par adresse e-mail, code à usage unique envoyé par e-mail valable 10 minutes (documentation officielle lue). Plan gratuit « moins de 50 utilisateurs » selon la page des plans de Cloudflare (lue via une recherche, à reconfirmer). **Non confirmé** : qu'un nom de domaine soit obligatoire, et la gratuité exacte du tunnel | Le plus adapté si un jour des secrétaires doivent se connecter sans installer d'application |
| Pare-feu Windows (`docs/12`) | Cause trouvée, commande fournie | Marche seulement sur le Wi-Fi de la maison |

Recommandation : **maintenant, VS Code privé** (rien à acheter, rien à installer en plus) pour que Ben soit autonome. Cloudflare Access plus tard, seulement si un espace client est construit.

## Les secrétaires : deux voies
1. **Sans hébergement (recommandée pour démarrer, cohérente avec `docs/01` : « pas de plateforme à nous »)** : la secrétaire travaille dans **ses propres outils** (le compte Metricool au nom de son entreprise, le carnet de prompts, WhatsApp avec Ben). Rien n'est exposé ; il n'y a aucun accès à protéger.
2. **Un espace client** (Académie de `docs/08`) : une page légère, séparée du Studio, qui n'affiche que les missions et la formation de **leur** entreprise (le jeton lié à une entreprise, déjà prêt, en est la base), derrière Cloudflare Access (e-mails autorisés par entreprise). Ce serait **une plateforme à héberger** : il faudrait un hébergement allumé en permanence, ce que `docs/01` a écarté. **Décision de Ben.**

## Le PC de Ben comme serveur : la limite à connaître
Si le PC s'éteint (coupure de courant, veille), le Studio et un éventuel espace client ne répondent plus. Les publications déjà programmées dans Metricool partent quand même, puisque Metricool les garde chez lui. Pour des clients qui paient, il faut donc : soit accepter ces coupures, soit un petit serveur allumé en permanence (coût et maintenance à décider).

## Décisions de Ben
1. Lien de Ben : VS Code privé maintenant (recommandé), Tailscale, ou Cloudflare.
2. Les secrétaires utilisent-elles le Studio ? Recommandation : **non**, voie 1 d'abord ; un espace client seulement quand 2 ou 3 entreprises le demandent.
3. Possède-t-il un nom de domaine à lui (utile pour Cloudflare) ?
