# Audit de deux outils vus sur Facebook (13/11/2026)

Code lu dans des copies isolées (rien exécuté, rien installé). Sources : dépôts GitHub, API GitHub, registre npm.

## 1. REM (Reverse Engineer Marketing) — dansugc/reverse-engineer-marketing
- MIT, 274 étoiles, créé le 18/10/2026 (projet très jeune), 0 issue ouverte, Node ≥ 22.
- Code : pas de script d'installation, 4 dépendances officielles (SDK Anthropic, SDK MCP, node-html-parser, zod), lockfile 100 % registre npm. Les clés ne sortent que vers leur service (ScrapeCreators) ou le SDK Anthropic. Le mode « rapport » lance `claude` sans outils, sans MCP, sans hooks, dans un dossier vide. Web app locale 127.0.0.1 uniquement. Aucune phrase d'injection trouvée dans les skills.
- **Point d'alerte : le paquet n'existe PAS sur npm (HTTP 404).** La commande `npx reverse-engineer-marketing …` du README ne fonctionne pas, et un inconnu pourrait publier un paquet piégé sous ce nom. Ne jamais la lancer telle quelle. Si on l'utilise : cloner le dépôt, `npm ci`, `npm run build`, lancer `node dist/cli.js`.
- Sans clé : site, pixels, SEO/sitemaps, Wayback, App Store, Hacker News. Avec clé ScrapeCreators (payante, ~25 à 50 crédits par analyse) : bibliothèques de pubs, stats sociales. Coût à annoncer à Ben avant tout usage.
- Limites pour nous : pensé pour des startups (App Store, Hacker News, Product Hunt). Les PME du Burkina ont peu de traces web : beaucoup de « inconnu ». Utile surtout pour les grandes marques (concurrents de Petrovöll) et pour préparer une proposition à un prospect qui a un site.
- Rôle possible : outil du **veilleur** (concurrents) et du **commercial** (fiche prospect), à la demande. Pas une dépendance du Studio.

## 2. social-auto-upload (sau) — dreammis/social-auto-upload
- MIT (skills MIT-0), 16,5 k étoiles, créé en 2023, dernier commit 22/10/2026, 87 issues ouvertes. Audit tiers « SAFE » (Gen Agent Trust Hub) sur le skill Douyin.
- Code : pas de porte dérobée repérée. `subprocess` sert à lancer le CLI et `biliup` ; installation du navigateur via le miroir chinois npmmirror ; les autres adresses sont des plateformes et des sponsors (README).
- Couvre Facebook, Page Facebook (avec programmation), Instagram (Reels, photos, carrousel, **publication immédiate seulement**) et TikTok (script Chrome, pas de commande sau).
- **Méthode : automatisation de navigateur avec cookies de session, pas les API officielles.** Les conditions de Meta et de TikTok interdisent en général l'automatisation non officielle : risque de blocage ou de suspension du compte, sur des comptes tout neufs qui sont justement ceux dont SASOMA a besoin. Documenté dans ses propres skills : pop-ups inconnus, états « résultat incertain ».
- Documentation et plateformes surtout en chinois, orientée Chine (Douyin, Xiaohongshu…), fuseau Asia/Shanghai pour la programmation Facebook.
- Contre nos règles : les cookies de connexion de SASOMA et des clients seraient stockés en clair sur la machine de Ben (`cookies/*.json`) ; le tool publie sans porte (c'est la discipline du skill, pas un verrou).
- Déjà couvert autrement : Metricool (connecté) programme en mode relecture via l'API officielle, avec la porte 3 de Ben.
- Verdict : **ne pas l'adopter pour la publication.** Garder comme plan B uniquement pour TikTok si les connecteurs officiels (Higgsfield, Orshot, Metricool) ne suffisent pas, avec compte de test et accord de Ben.
- À reprendre : les bonnes idées de ses skills (états « processing / submission_unknown », ne jamais re-publier sans vérifier, confirmer compte + texte avant chaque publication) pour notre agent programmateur.

## Essai de REM (13/11/2026, accord de Ben)
Clone construit en local (`npm ci --ignore-scripts`, 156 paquets), lancé sans aucune clé et avec `--no-ai` : aucun crédit dépensé, aucun appel à Claude.
- `totalenergies.bf` : le site ne répond pas (domaine probablement inexistant), 4 preuves, 15 inconnus.
- `totalenergies.com` : 11 preuves, 14 inconnus. Il retrouve le positionnement de la page d'accueil et les 4 réseaux liés, mais conclut « pas assez de preuves » (SEO, pubs, apps : rien). Normal pour un groupe pétrolier B2B.
- Conclusion : sans clé payante, REM apporte peu pour un concurrent de Petrovöll. Il ne vaut le coup qu'avec la clé ScrapeCreators (bibliothèque de pubs Meta), donc coût à annoncer. Pas retenu pour l'instant. Rapports d'essai conservés dans le dossier temporaire de la session, pas dans le projet.

## Décisions de Ben
1. Essai de REM : fait, résultat ci-dessus.
2. Confirmer qu'on ne publie pas par sau.
