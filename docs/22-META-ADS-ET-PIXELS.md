# Meta Ads et pixels sur mesure (13/11/2026)

**Demande de Ben** : un agent qui se connecte à Meta Ads pour les publicités, et qui crée des pixels personnalisés pour chaque client.

## Ce que j'ai trouvé (sources de seconde main : mcp.directory et un guide tiers ; les pages officielles de Meta citées n'ont pas été lues)
- Meta a ouvert en bêta (29/04/2026) un **serveur MCP officiel pour les publicités** : `https://mcp.facebook.com/ads`, gratuit pendant la bêta, 29 outils.
- **Connexion** : OAuth avec le compte Facebook qui a accès au Gestionnaire d'entreprise, sans application à déclarer ni révision. **Trois niveaux de droits à choisir à la connexion** : lecture seule, lecture/écriture, lecture/écriture/finances. On choisit les comptes publicitaires et les pages partagés ; l'accès se retire dans Business Suite > Intégrations.
- **Outils** : création de campagne, d'ensemble de publicités et de publicité (`ads_create_campaign`, `ads_create_ad_set`, `ads_create_ad`), modification (`ads_update_entity`), **activation (`ads_activate_entity`)**, comptes et pages, catalogues (10 outils), **qualité des jeux de données** (`ads_get_dataset_details`, `ads_get_dataset_quality`, `ads_get_dataset_stats`, `ads_get_errors`) et indicateurs/benchmarks (7).
- **Aucun outil ne crée un pixel, un jeu de données ou une conversion personnalisée.** Les outils « dataset » sont de la lecture et du diagnostic.
- Une source dit que les campagnes créées démarrent **en pause** et qu'un humain doit les activer ; l'autre avertit qu'il n'y a ni annulation ni brouillon : à prendre au sérieux, c'est de l'argent réel.
- Création d'un pixel : dans le **Gestionnaire d'événements du client** (à la main). L'API de conversions (envoi de données depuis un serveur) demande un jeton généré dans le Gestionnaire d'événements ; la page officielle lue dit que cette installation ne demande pas de révision d'application (cela ne vaut pas pour gérer les comptes d'autres entreprises par l'API).

## Ce qui est mis en place
| Rôle | Agent | Fait |
|---|---|---|
| Plan de suivi + **kit de pixel sur mesure** par client (code de base, événements standard et personnalisés, consentement, vérification) dans `production/pixels/<client>/` | **`traceur`** (nouveau) | prêt, **sans accès à Meta** : il écrit des fichiers, Ben les applique. Base : `knowledge/pixel-meta-modele.md` (code officiel lu le 13/11/2026) |
| Brief de campagne, lecture des chiffres | `publicitaire` | prêt (Supermetrics en lecture) |
| Connexion à Meta Ads | `publicitaire` | **à brancher après ta connexion** (voir ci-dessous) |

Chaîne de travail : veilleur (faits) → stratège → **traceur (mesure)** → publicitaire (brief, budget plafonné) → contrôleur → **Ben (porte)** → création **en pause** → Ben active dans Meta.

## Ce que tu fais pour connecter Meta Ads
1. Dans Claude Code : `claude mcp add --transport http meta-ads https://mcp.facebook.com/ads`, puis `/mcp` pour te connecter à Meta (OAuth, avec ton compte).
2. **Commence en lecture seule**, sur **un** compte publicitaire (celui de SASOMA ou un compte test), avec un plafond de dépense défini sur le compte publicitaire dans Meta.
3. Dis-moi « connecté » : je lis la liste réelle des outils, puis j'ajoute à `publicitaire` **seulement** la lecture (comptes, entités, insights, qualité du pixel). La création en pause viendra ensuite, sur ton ordre, et **sans** `ads_activate_entity` ni `ads_update_entity` pour l'agent : l'activation reste à toi, dans Meta.
Chaque client garde la **propriété** de son compte publicitaire, de son Gestionnaire d'entreprise et de son pixel ; tu y es ajouté avec un rôle retirable. Aucun mot de passe partagé.

## Pixels « pour tout »
- Un pixel **par client** (jamais un pixel à toi pour tous les clients), créé dans son Gestionnaire d'événements.
- Le traceur écrit, pour chaque client, les événements qui correspondent à son objectif : clic WhatsApp, appel, formulaire, vue de produit, achat... avec l'événement standard de Meta quand il existe (`Lead`, `Contact`, `ViewContent`, `Purchase`...).
- Il faut un **site ou une page où poser le code** : le site de SASOMA est le tien (livré). Pour les autres entreprises, il faut l'accès à leur site ; sinon seules les mesures côté Meta (messages reçus) sont possibles.
- Consentement et données personnelles : le plan les traite ; la loi du Burkina Faso n'a **pas** été vérifiée ici : à confirmer pour chaque pays.

## Limites
- Rien n'est connecté à Meta aujourd'hui : l'agent n'a jamais parlé à Meta.
- Les noms d'outils viennent de deux pages tierces concordantes, pas des pages officielles de Meta ; ils seront relus à la connexion.
- La syntaxe des événements personnalisés (`trackCustom`) et du consentement n'était pas dans les pages officielles lues : le traceur doit la vérifier avant de la livrer, sinon il écrit « non vérifié ».
- Meta peut changer le code de base ou les droits pendant la bêta.
