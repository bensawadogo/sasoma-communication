# État du projet : à lire en premier, par tout outil et toute IA

Ce fichier est la **mémoire commune** du projet. Il ne dépend d'aucun outil : Claude Code, OpenCode, Kilo, Codex, Gemini CLI, Hermes ou n'importe quel autre doivent pouvoir reprendre le travail en le lisant.
- **Début de session** : lis ce fichier, puis `AGENTS.md` (règles), puis `TODO.md`.
- **Fin de session** : mets à jour la section « Reprise » ci-dessous (3 à 10 lignes : ce qui est fait, ce qui est en cours, le prochain pas, ce qui attend Ben) puis lance `node scripts/relais.mjs`. Ne mets jamais de clé, de jeton ni de mot de passe ici.

## Qui et comment travailler
- **Ben**, Burkina Faso. Il écrit toujours en **français** : réponds en français, simplement, sans jargon inutile.
- Il gère les réseaux sociaux d'entreprises clientes (premier client : SASOMA, distributeur des lubrifiants Petrovöll) et vise « le meilleur community manager d'Afrique de l'Ouest ». Il forme aussi leurs secrétaires.
- Il veut des **décisions et des actes**, pas des listes d'options sans recommandation. Il veut aussi l'honnêteté : ce qui est vérifié, ce qui ne l'est pas, ce qui n'a pas été testé.
- **Faits vérifiés seulement** (sources officielles ou fichiers du projet), jamais de chiffre inventé.
- **Coût annoncé avant** tout outil payant. Rien n'est publié, envoyé ni créé chez un tiers sans l'accord de Ben (3 portes : calendrier, chaque post, programmation).
- **Le bidon Petrovöll n'est jamais généré par IA** : uniquement de vraies photos.
- Aucune plateforme ni abonnement imposé aux clients (`docs/01`).
- Ne jamais copier un jeton, une clé ou un lien du Studio dans un message, un fichier ou un envoi à une autre IA.

## Sécurité de l'ordinateur de Ben (valable pour tous les outils)
- Travaille **dans le dossier du projet** (`C:\SASOMA-COMMUNICATION`). Ne lis, n'écris et n'exécute rien en dehors sans l'accord de Ben dans la conversation.
- Ne lis jamais `.env`, `~/.pixel-agents/standalone-token`, `~/.claude/`, les clés SSH ni les gestionnaires de mots de passe.
- Commandes système : propose-les, Ben les valide. Pas de suppression en masse, pas d'installation globale, pas de modification du pare-feu sans demande explicite.
- Les données de clients ne vont à une autre IA que par l'outil `delegue-ia` (classe des données, nettoyage, plafonds : `docs/20`).

## Ce qui existe (13/11/2026)
- **Studio** (`studio/`) : bureau d'agents en 2D/3D, conversation avec chaque agent (photos possibles), quêtes et portes de Ben, accès par lien à jeton (`docs/07`, `docs/15`, `docs/17`).
- **11 agents** (`.claude/agents/`, exportés pour OpenCode, Codex et Gemini CLI) avec règles communes (`.claude/skills/regles-cm/`, `AGENTS.md`) et garde-fou d'écriture (matériel dans Claude Code seulement).
- **Modèles par agent** (`config/modeles.json`, `docs/19`) et **autres IA via OpenRouter** (`scripts/delegue-ia/`, `docs/20`). Jeu de test à l'aveugle (`evals/`).
- **Passage d'un outil à l'autre** : `docs/21-AUTONOMIE-MULTI-OUTILS.md`.
- Dépôt GitHub : bensawadogo/sasoma-communication (public pour l'instant, Ben le rendra privé).

## Décisions de Ben à ne pas rouvrir
- Prix SASOMA : 50 000 à 80 000 FCFA par mois, budget pub séparé. Les prix des autres clients ne sont pas fixés (à laisser entre crochets).
- OpenRouter comme porte unique vers les autres IA (il achètera environ 5 $ de crédit). Modèles chinois : textes publics seulement.
- Profil de modèles actif : `equilibre` (Opus pour le chef de studio et le contrôleur, Haiku pour le programmateur, Sonnet pour les autres).

## Reprise (à mettre à jour à chaque fin de session)
- Fait : serveur `delegue-ia` (OpenRouter, photos, plafonds, simulation sans clé), jeu de test `evals/` prêt, photos dans le popup du Studio, mémoire commune (ce fichier + `scripts/relais.mjs`), réglages OpenCode (vérifiés : agents chargés, `delegue-ia` connecté), Codex et Gemini CLI (écrits, non essayés), recherche sur les outils de secours (`docs/21`).
- En cours : agent `traceur` (pixels sur mesure) créé ; Meta Ads pas encore connecté (`docs/22`). Le jeton OpenRouter déjà enregistré dans OpenCode chez Ben est **expiré** (« API key expired ») : en créer un nouveau.
- Prochain pas : quand Ben a posé sa clé OpenRouter (variable `OPENROUTER_API_KEY`), appel d'essai à moins de 0,01 $, puis `node scripts/delegue-ia/lancer-eval.mjs` (coût maximal 0,66 $, accord de Ben d'abord).
- Attend Ben : clé OpenRouter plafonnée, notation à l'aveugle de `evals/`, choix du tunnel pour l'iPhone, rendre le dépôt privé.

<!-- AUTO:DEBUT -->
## État automatique (`node scripts/relais.mjs`)
- Profil de modèles actif : **equilibre** (opus : chef-de-studio, controleur ; sonnet : veilleur, stratege, scenariste, createur-visuel, publicitaire, analyste, formateur, commercial, traceur ; haiku : programmateur)
- Agents : analyste, chef-de-studio, commercial, controleur, createur-visuel, formateur, programmateur, publicitaire, scenariste, stratege, traceur, veilleur
- Autres IA via OpenRouter : 0 appel(s), 0.0000 $ dépensés au total (journal sans contenu)
- Derniers changements :
- caa5a9c Agent traceur (pixel Meta sur mesure), OpenCode: motifs de droits ancres (testes avec un vrai modele), docs
- dbd7ae7 Autonomie multi-outils : memoire commune (ETAT-DU-PROJET), reglages OpenCode 1.x/Codex/Gemini, export V1, docs/21
- f684d85 Studio : photos dans le popup de conversation (reduites, metadonnees retirees, enregistrees pour l'agent)
- 4eb1364 delegue-ia : photos (metadonnees retirees, classe client), doc terminal OpenCode
- 731594a Jeu de test automatise : taches, lanceur a l'aveugle, estimation avant envoi
- 5318ef9 delegue-ia : nettoyage des e-mails en temps lineaire
- 61606c7 Serveur MCP delegue-ia (OpenRouter) : classes de donnees, nettoyage, plafonds, simulation
- 2246ffa IA chinoises : recherche, prix, confidentialite, decision (DeepSeek Flash au lieu de Pro)
- Tâches ouvertes dans TODO.md (12 affichées) :
  - B : donner ses heures disponibles par mois et son revenu visé (pour calculer les prix).
  - B : donner la liste des entreprises ayant reçu un logo animé (secteur, taille, présence Facebook).
  - B : confirmer la définition de « meilleur projet CM » dans `README.md` (qualité, régularité, local, contrôle, coûts, mesure).
  - B : choisir l'outil de programmation de départ (recommandé : Metricool gratuit par client, Publer en test).
  - B : connecter au moins une page à Metricool (la marque existe mais n'a aucun réseau relié).
  - B : connecter Facebook Ads et TikTok Ads à Supermetrics (liens fournis par l'outil) ; garder l'essai de 14 jours pour la semaine de la première campagne.
  - B : vérifier que SASOMA a (ou peut ouvrir) un compte publicitaire Meta avec moyen de paiement du client.
  - B : dire quels crédits payants il accepte (Higgsfield est à 0 crédit, plan gratuit).
  - C : vérifier le solde et le plan d'ElevenLabs, Adobe, Descript, VidIQ, HyperFrames (lecture seule).
  - C : créer 3 gabarits Orshot (post carré, story 9:16, portrait 3:4) avec la charte SASOMA, sans produit généré (100 crédits gratuits par mois).
  - C : écrire le modèle de brief de campagne (objectif, budget plafonné, mesure, accord écrit).
  - C + B : définir le plafond de budget et l'objectif de la première campagne SASOMA.
<!-- AUTO:FIN -->
