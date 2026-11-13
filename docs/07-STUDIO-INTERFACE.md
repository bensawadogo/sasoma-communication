# 07. Le Studio : interface ludique pour piloter les agents

Demande de Ben (12/11/2026) : une interface « comme dans les Sims », où l'on voit chaque agent travailler, où chacun
délègue son travail, et où l'on peut ouvrir l'IA d'un agent pour discuter avec elle. Optimisée, et basée sur un projet
solide à forker.

## 1. Recherche : projets comparés (relevé du 12/11/2026, GitHub)

| Projet | Licence | Étoiles / activité | Ce que c'est | Verdict |
|---|---|---|---|---|
| **pixel-agents** (pixel-agents-hq) | MIT | ~10 200 étoiles, 1 733 forks, dernier commit le 10/11/2026 | Bureau pixel-art où chaque session **Claude Code** est un personnage. Lance les agents dans un terminal intégré au navigateur (`npx pixel-agents`), éditeur de bureau (sols, murs, meubles, zones), éditeur de personnages, sous-agents et coéquipiers affichés comme personnages, bulles quand un agent attend, barres de contexte | **Retenu** |
| AI Town (a16z-infra) | MIT | ~10 800 étoiles, dernier commit 05/11/2026 | Petite ville de personnages IA qui bavardent entre eux (Convex) | Écarté : c'est une simulation sociale, pas un outil de travail ; les personnages ne pilotent pas nos outils |
| agent-office (harishkotra) | MIT | ~416 étoiles, un seul contributeur, dernier commit 25/09/2026 | Agents LLM locaux (Ollama) qui embauchent, se parlent, exécutent du code. Dérivé de pixel-agents | Écarté : exige un LLM local ; le PC de Ben (Intel UHD 620) ne peut pas le faire tourner |
| Star-Office-UI (ringhyacinth) | Code MIT, **art non commercial** | ~7 600 étoiles, dernier commit 11/03/2026 | Bureau pixel pour OpenClaw | Écarté : l'art ne peut pas servir à un service payant, projet pas mis à jour depuis mars |
| pixel-agent-desk (zep-ia) | Non précisée | ~138 étoiles, dernier commit 10/03/2026 | App Electron avec suivi de jetons | Écarté : licence floue, inactif |

## 2. Pourquoi pixel-agents correspond à la demande

| Demande de Ben | Ce que pixel-agents fait déjà |
|---|---|
| Interface ludique « type Sims » | Bureau pixel-art animé, personnages habillables, meubles, animaux, éditeur de décor |
| Chaque agent délègue son travail | Un agent qui lance des sous-agents ou des coéquipiers les fait apparaître comme des personnages à côté de lui (le « Lead » et son équipe) |
| Ouvrir son IA pour interagir | Clic sur un personnage : on atteint son terminal Claude Code intégré au navigateur, et on peut y écrire. Sessions reprises en un clic |
| Optimisé | Détection par crochets (hooks) plutôt que par scrutation, barres de contexte, serveur local léger (Fastify) |
| Mobile | Utilisable sur téléphone via Tailscale |

Pas de coût : MIT, tourne en local, pas d'abonnement. Il utilise Claude Code (déjà utilisé par Ben).

## 3. Le dossier

Le fork est cloné dans `C:\SASOMA-COMMUNICATION\studio\` (copie locale, dernière version seule). **Aucun fork n'a été
créé sur le compte GitHub de Ben** : voir « Décisions à prendre ».

Les agents du service CM sont définis dans `C:\SASOMA-COMMUNICATION\.claude\agents\`.

## 4. L'équipe du Studio (7 personnages)

| Agent | Rôle | Outils autorisés | Garde-fou |
|---|---|---|---|
| **chef-de-studio** (le Lead) | Reçoit le thème de Ben, découpe, délègue, assemble | Délégation, lecture/écriture des fichiers du projet | Ne publie rien ; renvoie toujours à Ben pour validation |
| **stratege** | Idées d'histoires, calendrier, heures de publication | Lecture, recherche web, Metricool en lecture (meilleure heure, stats) | Faits tirés des fiches client seulement |
| **scenariste** | Scénarios, légendes, mots-clés | Lecture/écriture | Aucun fait produit inventé, aucun avis négatif |
| **createur-visuel** | Prépare les briefs visuels et les gabarits (Orshot, studio local) | Lecture/écriture, Orshot en lecture et rendu de gabarits | **Jamais** de bidon, logo ou texte de marque généré par IA ; coût annoncé avant tout outil à crédits |
| **programmateur** | Met les posts validés en file dans Metricool | Metricool : création **en mode relecture seulement** | N'a pas l'outil de publication directe |
| **publicitaire** | Brief de campagne, lecture des chiffres pub | Supermetrics en lecture | N'a pas l'outil de création de campagne : Ben donne l'ordre, Claude principal crée en pause |
| **analyste** | Bilan mensuel avec chiffres réels | Lecture Metricool et Supermetrics | Jamais d'estimation présentée comme résultat |

Les trois portes de validation de `docs/03-PROCESSUS-CM.md` restent en vigueur : calendrier, chaque post, programmation.

## 5. Ce qui reste à faire (état au 12/11/2026)

1. **Installer et lancer le studio** : `npm install` puis `npm run build` dans `studio/`, puis `node dist/cli.js`.
   Bloqué ce jour : l'installation de dépendances externes demande l'accord explicite de Ben (voir plus bas).
2. Ajouter `C:\SASOMA-COMMUNICATION` comme **Directory** (dossier de lancement) et peindre des **zones** : salle des idées,
   atelier visuel, bureau de programmation, salle des chiffres.
3. Associer un personnage par agent (habillage aux couleurs SASOMA).
4. Adaptations de fork envisagées (après lancement à vide) : libellés en français, tableau de validation de Ben
   (les 3 portes) visible dans l'interface, compteur de crédits d'outils payants.
5. Tester sur un vrai thème avec SASOMA une fois les comptes créés.

## 6. Risques et points de vigilance

- **Modification des réglages Claude Code** : par défaut, pixel-agents installe des crochets dans `~/.claude/settings.json`
  (avec un écran de consentement et une sauvegarde). L'option « barres d'usage » enveloppe aussi la ligne d'état. À
  accepter ou refuser consciemment ; on peut les refuser et rester sur le mode heuristique (lecture des transcriptions).
- **Le lien affiché contient un jeton secret** (`?token=`) : quiconque l'a peut lancer des agents et lire les terminaux. Ne
  jamais le partager ni le publier. Sans jeton, le bureau est en lecture seule.
- **Téléphone** : Tailscale seulement, jamais d'exposition publique.
- **Permissions des agents** : ne pas activer « Skip Permissions » (`--dangerously-skip-permissions`) pour le Studio ; les
  agents ont accès aux outils connectés (Metricool, Supermetrics), la validation humaine est le garde-fou.
- **Terminal intégré sous Windows** : l'exécution du terminal intégré dépend d'une bibliothèque native ; à vérifier au premier
  lancement sur la machine de Ben (non testé).
- **Maintenance** : projet très actif (changements fréquents). Garder les modifications dans des dossiers séparés pour pouvoir
  récupérer les mises à jour du projet d'origine.
- **Licence** : MIT, notice de copyright à conserver (fichier `studio/LICENSE`). Les images de personnages sont basées sur le
  pack gratuit « Metro City » de JIK-A-4 : vérifier ses conditions d'usage commercial avant de montrer le Studio à des clients.
- **Deux projets Claude Code** : les agents du Studio sont des sessions Claude Code ; leur consommation suit le forfait de Ben.

## 7. Décisions à prendre par Ben

- Autoriser l'installation des dépendances du Studio sur sa machine (`npm install` télécharge du code tiers).
- Créer ou non un **fork GitHub** sous son compte (nécessaire seulement pour sauvegarder ses modifications en ligne ou
  récupérer proprement les mises à jour). Le clone local suffit pour commencer.
- Accepter ou refuser les crochets dans `~/.claude/settings.json` au premier lancement.
