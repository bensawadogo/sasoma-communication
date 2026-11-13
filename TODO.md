# TODO : projet CM Afrique de l'Ouest

Mise à jour : 12/11/2026. Qui : **Ben** (B), **Claude** (C). Les cases `[ ]` sont à faire, `[x]` faites.
Rien ne se publie ni ne s'envoie sans l'accord de Ben. Tout outil à crédits : coût annoncé avant lancement.

## Phase 0 : Décisions de base (bloquantes)

- [ ] **B** : donner ses heures disponibles par mois et son revenu visé (pour calculer les prix).
- [ ] **B** : donner la liste des entreprises ayant reçu un logo animé (secteur, taille, présence Facebook).
- [ ] **B** : confirmer la définition de « meilleur projet CM » dans `README.md` (qualité, régularité, local, contrôle, coûts, mesure).
- [ ] **B** : choisir l'outil de programmation de départ (recommandé : Metricool gratuit par client, Publer en test).
- [x] **C** : écrire le README, les 5 documents, la fiche modèle et la fiche SASOMA.

## Phase 0 bis : Outils de publicité et de créatifs (priorité demandée par Ben le 12/11/2026)

Voir `docs/06-PUBLICITE-ET-CREATIFS.md`.

- [ ] **B** : connecter au moins une page à Metricool (la marque existe mais n'a aucun réseau relié).
- [ ] **B** : connecter Facebook Ads et TikTok Ads à Supermetrics (liens fournis par l'outil) ; garder l'essai de 14 jours pour la semaine de la première campagne.
- [ ] **B** : vérifier que SASOMA a (ou peut ouvrir) un compte publicitaire Meta avec moyen de paiement du client.
- [ ] **B** : dire quels crédits payants il accepte (Higgsfield est à 0 crédit, plan gratuit).
- [ ] **C** : vérifier le solde et le plan d'ElevenLabs, Adobe, Descript, VidIQ, HyperFrames (lecture seule).
- [ ] **C** : créer 3 gabarits Orshot (post carré, story 9:16, portrait 3:4) avec la charte SASOMA, sans produit généré (100 crédits gratuits par mois).
- [ ] **C** : écrire le modèle de brief de campagne (objectif, budget plafonné, mesure, accord écrit).
- [ ] **C + B** : définir le plafond de budget et l'objectif de la première campagne SASOMA.
- [ ] **C** : créer la première campagne **en pause**, la décrire ; **B** décide de l'activer.
- [ ] **C** : après la première campagne, bilan avec chiffres réels et décision : payer Supermetrics ou gérer à la main dans Meta Ads Manager.
- [ ] **B** : si besoin, autoriser les connecteurs Meta Ads (Ryze, Adspirer) ou TikTok for Business dans les réglages claude.ai.

## Phase 0 ter : Le Studio, interface ludique (demande de Ben le 12/11/2026)

Voir `docs/07-STUDIO-INTERFACE.md`.

- [x] **C** : comparer les projets à forker (retenu : pixel-agents, MIT) et cloner dans `studio/`.
- [x] **C** : écrire les 7 agents dans `.claude/agents/`.
- [x] **B** : a autorisé `npm install` dans `studio/` (12/11/2026). Reste : décider si on crée un fork GitHub sous son compte.
- [x] **C** : installé (698 paquets), compilé, lancé sur `http://127.0.0.1:3100` ; terminal intégré actif (`@lydell/node-pty`). Reste à tester un vrai lancement d'agent depuis l'interface.
- [ ] **B** : approuver (ou refuser) l'installation des crochets dans `~/.claude/settings.json` depuis l'écran du Studio.
- [ ] **B + C** : ajouter `C:\SASOMA-COMMUNICATION` comme Directory, peindre les zones, habiller un personnage par agent.
- [ ] **C** : tester le chef-de-studio avec un faux thème (sans rien publier) et vérifier que les sous-agents apparaissent.
- [x] **C** : `claude --agent <nom>` confirmé par la documentation officielle ; mémoire `memory: project` ajoutée aux 7 agents ; savoir partagé dans `knowledge/`.
- [ ] **B** : redémarrer avec `claude --agent chef-de-studio` (active la mémoire des agents) ; **C** : vérifier que `agent-memory/` se remplit après une vraie mission.
- [ ] **B** : relire le brouillon `brouillons/sasoma-idees-v1.md` (porte 1) et renseigner le public réel de SASOMA dans `clients/sasoma.md`.
- [ ] **C** : adaptations du fork : français, tableau des 3 portes de validation, compteur de crédits payants.
- [x] **C** : moteur de quêtes (`studio/server/src/quests/`) avec tests : ordre, portes réservées au chef, règle du bidon, coût annoncé, XP dérivée d'un journal.
- [x] **C** : moteur branché au serveur (`/api/quests`, rôle déduit du jeton, Host contrôlé) ; panneau « Quêtes » mobile-first (missions, portes, équipe) dans l'interface. Tests : 31 verts.
- [x] **C** : jeton secrétaire à droits limités (fichier `~/.pixel-agents/quest-actors.json`, aucune porte).
- [x] **C** : skill officiel Anthropic `frontend-design` installé dans `.claude/skills/` (Apache 2.0).
- [x] **C** : panneau Quêtes vu à largeur de téléphone dans Chrome (PC). Reste : test réel sur iPhone par Ben, voir `docs/12-TEST-IPHONE.md`.
- [x] **C** : Node.js 24.14.0 réinstallé le 13/11/2026 (accord de Ben, sans administrateur) ; Studio relancé en mode Wi-Fi (`192.168.11.104:3100`, répond 200 depuis le PC).
- [x] **C** : 5 skills installés le 13/11/2026 (dépôt gamedev-skills/awesome-gamedev-agent-skills, Apache 2.0, relus avant copie) : game-ui-ux, game-feel, create-game-assets, camera-systems, dialogue-systems. Panneau Quêtes refait en style Sims (`studio/webview-ui/src/quests/sims.css` + `QuestsModal.tsx`) ; lint, types et build OK. **Rendu non vu à l'écran** (navigateur de test instable) : à regarder par Ben sur iPhone.
- [ ] **C** : étape suivante du style Sims : bureau pixel-art (plumbob au-dessus de l'agent actif, besoins par agent, caméra), à faire après le retour de Ben sur le panneau.
- [x] **C** : fenêtre de discussion avec un agent (clic sur un personnage), barre des tokens par fournisseur, Agent Manager (chef-de-studio) avec plan partagé `production/plans/`, `lancer-manager.ps1`. Voir `docs/13-PASSAGE-EN-PRODUCTION.md`.
- [x] **C** : Studio en 3D (13/11/2026) : bureaux, salon, agents qui y vont quand ils ont fini, bouton 2D/3D, clic = discussion, `?demo3d`. Voir `docs/15-STUDIO-3D.md`. Rendu vu dans Chrome (PC et cadre téléphone) ; **fluidité réelle non mesurée**.
- [ ] **B** : regarder `http://127.0.0.1:3100/?demo3d=1` (équipe fictive), puis lancer un vrai agent et cliquer son personnage ; dire si c'est fluide sur le PC et sur l'iPhone.
- [ ] **B + C** : si Ben veut aller plus loin que la 3D stylisée : personnages et meubles glTF sur mesure (modèles à créer ou acheter, licence à vérifier).
- [x] **C** : skill commun `regles-cm` + garde-fou d'écriture par agent (8 tests) + Higgsfield en lecture pour le créateur visuel. Voir `docs/16-AGENTS-OUTILS-ET-GARDE-FOUS.md`. **Pas testé en vraie session** : relancer `lancer-manager.ps1` puis faire une mission de test.
- [x] **C** : modèle par agent réglé (Opus : chef-de-studio et contrôleur ; Sonnet : les 9 autres) ; `node scripts/verifier-agents.mjs` contrôle les 11 agents (a trouvé et fait corriger le contrôleur, qui avait disparu à cause d'un « : » dans sa description).
- [x] **C** : isolement entre entreprises dans le moteur de quêtes : jeton secrétaire lié à une seule entreprise (`clientId`), tests verts (34). Voir `docs/17-ACCES-A-DISTANCE-ET-PLUSIEURS-CLIENTS.md`.
- [x] **C** : comparatif des tunnels (ngrok, Cloudflare, Tailscale, VS Code, zrok) : `docs/18-TUNNELS-COMPARATIF.md`.
- [ ] **B** : décider l'accès (VS Code privé recommandé maintenant), si les secrétaires utilisent le Studio (recommandé : non, voie sans hébergement d'abord), et si tu as un nom de domaine à toi (`docs/17`).
- [ ] **B** : pare-feu (commande de `docs/12`) ou tunnel VS Code (« Chemin C » de `docs/12`) pour l'iPhone.
- [ ] **B** : entrer le code GitHub affiché pour que je pousse le projet ; **après le push, passer le dépôt en privé** (Settings > Danger Zone > Change visibility).
- [ ] **B** : recharger le Studio (Ctrl+F5) ; lancer un agent avec le bouton + (terminal actif sur le PC seulement) ; cliquer son personnage ; dire ce qui gêne.
- [ ] **B** : décider HTTPS (Tailscale ou Cloudflare Access), démarrage automatique, sauvegarde : tableau de `docs/13`.
- [ ] **B** : tester sur iPhone (voir `docs/12-TEST-IPHONE.md`) ; autoriser le pare-feu en « Privé » si l'iPhone n'atteint pas le PC ; noter ce qui gêne.
- [ ] **C** : relancer les recherches B (WhatsApp), C (langues locales) et D (académie) interrompues ; relire la recherche A (`recherches/A-vendre-le-cm.md`, non encore relue).
- [ ] **C** : serveur MCP `delegue-ia` (voir `docs/09`) ; **B** : ouvrir un compte DeepSeek si d'accord.
- [ ] **C** : les agents du Studio envoient leurs étapes terminées au moteur (jeton agent).
- [ ] **B** : dire sur quel appareil jouent les secrétaires, la langue de l'Académie, classement ou non.
- [ ] **C + B** : Académie, premier mini-jeu « Vrai ou faux bidon » (Ben fournit 10 vraies photos et 10 cas de test).
- [ ] **B** : vérifier les conditions d'usage commercial du pack de personnages « Metro City » avant de montrer le Studio à des clients.

## Phase 1 : SASOMA (premier client, priorité)

- [ ] **B** : créer les comptes SASOMA Facebook, Instagram, TikTok (propriétaire : SASOMA).
- [ ] **B** : donner à SASOMA l'accès de Ben par rôle partenaire ou invitation, sans mot de passe partagé.
- [ ] **B** : connecter les comptes à Metricool et confirmer que `getBrandSettings` les voit.
- [ ] **B** : collecter les vraies photos des bidons Petrovöll (dossier `clients/` ou lien).
- [ ] **B** : renseigner le public, la langue, le ton, les interdits dans `clients/sasoma.md`.
- [ ] **C** : relever dans les pages officielles Petrovöll sauvegardées (`C:\SITE-SASOMA\assets\catalogues\petrovoll\site\`) la liste des faits utilisables, avec page et date (il n'existe pas de dossier `assets\tds\`). **B** : demander les fiches techniques au représentant Petrovöll.
- [ ] **B** : envoyer le premier thème.
- [ ] **C** : proposer 10 idées d'histoires et un calendrier de 4 semaines (avec l'heure Metricool).
- [ ] **B** : approuver le calendrier (porte 1).
- [ ] **B** : produire les premiers visuels et motion (porte 2 avec la checklist).
- [ ] **C** : programmer en mode relecture ; **B** valide et envoie.
- [ ] **C + B** : premier bilan à la fin du premier mois.

## Phase 2 : Vérifications avant de promettre quoi que ce soit

- [x] **C** : limites Metricool confirmées à la source officielle le 13/11/2026 (20 posts au total en gratuit, 1 utilisateur ; invités = Advanced). Voir `docs/05`.
- [ ] **C** : confirmer l'usage d'agence et les comptes secrétaires de Postiz Cloud (conditions officielles).
- [x] **C** : pages clientes via rôle partenaire : circuit Metricool confirmé sur documents ; **à reconfirmer avec la page SASOMA réelle** (Ben doit avoir le contrôle total de la page).
- [ ] **C** : tester Publer gratuit sur une page de test et noter la limite réelle.
- [ ] **B** : valider quel outil de plan gratuit chaque secrétaire a le droit d'utiliser (compte au nom du client).
- [ ] **C** : relever les plans gratuits actuels de CapCut, Canva, OpusClip, Descript, VidIQ, Gamma.

## Phase 3 : Offre pour les autres entreprises

- [x] **C** : stratégie type de gestion de page pour une entreprise informatique : `brouillons/strategie-page-entreprise-informatique-v1.md` (**B** : donner le nom et les faits de l'entreprise pour la rendre réelle, section 9).

- [ ] **C** : remplir une fiche client par entreprise dès que Ben a donné la liste.
- [x] **C** : brouillon de la proposition d'une page : `brouillons/proposition-une-page-MODELE.md` (prix en [CROCHETS], **B** relit et remplit).
- [x] **C** : brouillon du contrat simple : `brouillons/contrat-simple-MODELE.md` (**B** : le faire relire par un juriste ou le CEFORE avant signature).
- [ ] **B** : décider quel plan Metricool il prend (Starter 5 marques recommandé) et l'ajouter au calcul des prix.
- [ ] **C** : produire la grille de prix chiffrée avec la formule de `docs/01` (dépend de la Phase 0).
- [ ] **B** : choisir 2 ou 3 entreprises pour tester l'offre.
- [ ] **B** : envoyer les propositions (Ben seul décide du contenu et de l'envoi).
- [x] **C** : modèle de contrat simple rédigé (voir ci-dessus).

## Phase 4 : Formation des secrétaires

- [ ] **C** : écrire le carnet de prompts (fiches `produit`, `mots-cles`, `scenario`, `legende`, `calendrier`, `bilan`).
- [ ] **C** : écrire les exercices et la grille d'évaluation du jour 2.
- [ ] **B** : décider durée, prix, langue de la formation.
- [ ] **C + B** : produire le support (Gamma, audio ElevenLabs, démos Descript) après annonce du coût.
- [ ] **B** : tester la formation avec une première secrétaire et noter les points qui bloquent.

## Phase 5 : Outillage et automatisation (après les premiers clients)

- [ ] **C** : lire en détail le modèle n8n n°13301 (identifiants requis, limites) et le comparer au mode relecture Metricool.
- [ ] **C** : relire les workflows de `C:\AI-MASTER-MARKETING` pour la prospection (README lu seulement, rien testé).
- [ ] **B + C** : décider du passage à Postiz Cloud Pro ou Metricool multi-marques quand il y a environ 5 clients payants.
- [ ] **C** : modèle de bilan mensuel (réutilisable pour tous les clients).

## Phase 6 : Mesure et amélioration

- [ ] **C** : définir 4 à 6 indicateurs avec Ben, à partir des données Metricool du premier mois.
- [ ] **B + C** : revue mensuelle de la qualité (erreurs de fait, retards, retours clients).
- [ ] **B** : revue trimestrielle du modèle économique (prix, heures, nombre de clients).

## Hors périmètre pour l'instant

- Bot WhatsApp AfriBot : autre agent. Quand Ben dit qu'il est fini, proposer une revue de code complète et un module FAQ sur les fiches techniques.
- Plateforme maison, serveur, Chatwoot, LibreChat : écartés.
- Campagnes payantes Meta : seulement si SASOMA ou un client en finance une ; autorisation du connecteur Meta Ads à faire alors.
