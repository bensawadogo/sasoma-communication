# 13. Passer le Studio en production

Demande de Ben (13/11/2026) : « le projet doit être vraiment mis au point pour passer en production ». Ce document dit **où on en est vraiment**, ce qui manque, et dans quel ordre le faire.
Rien ici n'est déjà « production » : le Studio tourne sur le PC de Ben, lancé à la main. Les cases cochées sont vérifiées, les autres sont à faire.

## Ce qui est en place (vérifié)
- [x] Moteur de quêtes : règles côté serveur, journal en ajout seul, 31 tests.
- [x] Accès protégé : jeton obligatoire, contrôle du nom d'hôte (anti DNS-rebinding), erreurs 401/403 testées.
- [x] Fenêtre de discussion avec un agent (lecture du transcript, écriture dans son terminal) : réservée au détenteur du jeton, message nettoyé (une ligne, sans caractère de contrôle), tests.
- [x] Barre des tokens : lecture des transcripts Claude (dernier message gardé par identifiant, sous-agents inclus), journal pour les autres fournisseurs, plafonds optionnels, tests.
- [x] 5 skills tiers relus avant installation (aucun appel réseau, aucune consigne piégée), voir `knowledge/lecons.md`.

## Ce qui manque avant de dire « production »

| Sujet | État réel aujourd'hui | À faire |
|---|---|---|
| Chiffrement | HTTP en clair sur le Wi-Fi ; le jeton est dans l'adresse (historique du navigateur) | Tailscale Serve (HTTPS privé, procédure du README de pixel-agents) **ou** tunnel Cloudflare avec Cloudflare Access devant. À décider par Ben : compte, prix et conditions à lire avant |
| Démarrage | Lancé à la main, fenêtre cachée ; plus rien après un redémarrage du PC | Tâche planifiée Windows (au démarrage, redémarrage automatique), `lancer-studio.ps1` comme point d'entrée |
| Adresse | IP Wi-Fi DHCP (`192.168.11.104`), peut changer | IP réservée dans la box ou nom Tailscale |
| Sauvegarde | `production/quests.jsonl` et `tokens.jsonl` sur un seul disque | Copie quotidienne vers un dossier synchronisé ; tester une restauration |
| Journaux | Sorties redirigées vers des fichiers temporaires, sans rotation | Dossier `logs/` avec rotation ; ne jamais y écrire le jeton |
| Surveillance | Aucune | Contrôle de `/api/health` toutes les 5 minutes, alerte à Ben si le Studio ne répond plus |
| Machine | Portable lent (Intel UHD 620) : les tests dépassent 10 s quand tout tourne | Garder le serveur de production sur une machine dédiée ou raisonnablement libre |
| Tests | Serveur et quêtes couverts ; interface (panneau, chat, barre) vue à la main seulement | Tests Playwright standalone (sans fenêtre) pour : ouvrir le chat, envoyer, barre des tokens |
| Accès des secrétaires | Un jeton « secrétaire » existe pour les quêtes, **pas** pour le chat (écrire à un agent = agir avec ses outils) | Décision de Ben : rôle limité, jamais de terminal |
| Terminal des agents | Coupé sur le Wi-Fi (`--no-terminal`), actif seulement en local | Ne l'ouvrir hors du PC qu'avec Tailscale/Access devant |
| Hooks dans `~/.claude/settings.json` | Installés par le Studio au démarrage ; consentement à confirmer par Ben | Ben confirme ou retire ; on garde la sauvegarde `.pixel-agents.backup` |
| Équipe d'agents | Le Manager (chef-de-studio) planifie et répartit, mais ses étapes ne remontent pas encore dans les Quêtes | Connecter l'avancement des agents au moteur de quêtes (jeton agent) |
| Autres IA | Pas de passerelle : DeepSeek et Kimi affichent « non connecté » | Serveur `delegue-ia` (docs/09) qui écrit son usage dans `/api/tokens/record` |
| Contenu réel | Aucun compte social créé, pas de vraies photos de bidons, public de SASOMA non renseigné | Phase 1 du TODO : sans cela, aucune publication ne part |

## Projets de référence (pour ne pas réinventer)
- **pixel-agents** (MIT) : base du Studio, déjà solide (sécurité du jeton, tests, mobile).
- **LiteLLM** : passerelle multi-fournisseurs avec budgets par fournisseur et par modèle ; un budget épuisé renvoie une erreur 429, ce qui permet de basculer. Le suivi sur plusieurs instances demande Redis ; certaines fonctions sont réservées à l'offre payante (à confirmer sur docs.litellm.ai avant de s'engager).
- **ccusage, ccstats, cctrack** : lisent les transcripts de Claude Code pour compter les tokens. Leçon reprise dans la barre : un message diffusé occupe plusieurs lignes du transcript avec le même identifiant, et c'est **la dernière** qui porte le vrai compte (les premières ont des valeurs provisoires) ; les sous-agents ont leurs propres fichiers. Ce sont des signalements de la communauté, pas une documentation officielle.
- **claude-code-router** (MIT) : envoyer certaines tâches vers d'autres modèles ; déjà étudié dans `docs/09`.

## Règle de décision « production »
On passe en production seulement quand : chiffrement en place, démarrage automatique et sauvegarde testés, surveillance active, et **Ben a validé** les 3 portes sur une vraie publication de test (non publiée). Tant qu'une ligne du tableau ci-dessus est ouverte, on dit « version de test ».
