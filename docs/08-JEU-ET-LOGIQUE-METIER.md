# 08. Le jeu : apprendre en jouant, sans trahir la logique métier

Demande de Ben (12/11/2026) : en Afrique, les agents (secrétaires et assistants des entreprises clientes) veulent **jouer
en apprenant**. L'interface doit être vraiment excellente et ludique ; la logique métier doit être respectée ; ce doit être
un jeu **et** un outil puissant.

## 1. Existe-t-il un skill ou un agent « officiel » pour créer des jeux ?

Recherche du 12/11/2026. **Je n'ai trouvé aucun skill ni agent de création de jeux publié par Anthropic.**
Ce qui existe :

| Ressource | Origine | Licence / activité | Intérêt pour nous |
|---|---|---|---|
| Plugin Unity pour Claude Code | **Unity** (éditeur officiel du moteur), annoncé le 09/09/2026 | Propriétaire Unity | Pour des jeux Unity ; trop lourd pour notre besoin |
| Claude-Code-Game-Studios | Communauté (Donchitos) | MIT, ~38 700 étoiles, 49 agents + 72 skills, dernier commit 09/11/2026 | Une « équipe de studio de jeu » complète (producteur, designer, programmeur, QA). Utile pour **concevoir** un mini-jeu ; surdimensionné pour notre usage |
| game-creator (Phaser 2D, Three.js 3D) | PlayableIntelligence | **Licence non précisée**, ~363 étoiles | Bons skills Phaser ; licence à clarifier avant tout usage commercial |
| game-studio | OpenAI (plugins) | Dépôt OpenAI | Format de skill portable, mais écrit pour Codex |
| `website-builder-flow` avec `type: "game"` | **Higgsfield** (déjà connecté) | Crédits Higgsfield | Jeu de navigateur multijoueur ; coûte des crédits, plan actuel à 0 |

Conclusion : ne pas chercher un outil magique de plus. Nous **n'avons pas à créer un jeu**, nous avons à **gamifier un
vrai outil de travail**. Cela se fait dans le fork pixel-agents (déjà installé), et, pour l'apprentissage, avec un petit jeu
de navigateur écrit à la demande (Phaser n'est pas indispensable : du HTML/Canvas suffit).

## 2. Principe : le jeu est une peau sur le vrai processus

Règle de conception : **le jeu ne crée jamais de progression qui n'existe pas dans le travail réel.**
Chaque point d'expérience (XP) vient d'une étape réelle du processus (`docs/03-PROCESSUS-CM.md`), acceptée par des règles, et
enregistrée dans un journal qu'on ne peut qu'allonger.

| Élément du jeu | Élément métier réel |
|---|---|
| Mission | Une publication (de l'idée au bilan) |
| Quête, étape | Les 7 étapes du processus |
| Porte (boss de fin d'étape) | Les 3 portes de validation de Ben |
| Contrôle qualité | La checklist de 9 points de la porte 2 |
| Niveau, titre | XP gagnée par des étapes réellement validées |
| Badge | Premier envoi, trois posts sans retouche, premier bilan |
| Retour de Ben | Un refus de porte, avec un motif obligatoire |

### Niveaux (gagnés par le travail validé)

Recrue (0) → Pousse (40) → Talent (120) → Pilier (250) → Étoile (450) → Légende (700 XP).

### Récompenses

| Événement | XP | Pour qui |
|---|---|---|
| Idée proposée | 10 | L'auteur |
| Calendrier approuvé (porte 1) | 10 | L'auteur de l'idée |
| Production terminée | 30 (une seule fois par mission) | L'auteur |
| Contrôle qualité réussi (porte 2) | 40, **+25 si du premier coup** | L'auteur de la production |
| Programmation en relecture | 20 | L'auteur |
| Envoi validé (porte 3) | 30 | L'auteur de la programmation |
| Bilan fait | 25 | L'auteur |
| Passer une porte | 5 | Le chef |

Refaire une étape refusée ne rapporte pas une deuxième fois ; il n'y a pas de pénalité pour un refus (il enseigne), mais le
bonus « du premier coup » est perdu.

## 3. Les règles métier que le jeu fait respecter (moteur de quêtes)

Elles sont codées côté serveur dans `studio/server/src/quests/`, pas dans l'interface : l'interface ne peut donc pas les
contourner.

1. **Ordre imposé** : on ne peut pas sauter d'étape.
2. **Les 3 portes sont réservées au chef** (Ben). Une secrétaire ou un agent IA ne peut ni les passer ni refuser.
3. **Règle du bidon** : une production déclarée avec un produit généré par IA est refusée. Une vraie photo est obligatoire.
4. **Coût annoncé** : un outil à crédits sans coût annoncé à Ben est refusé.
5. **Porte 2 = 9 points cochés** (vraie photo, pas de texte de marque IA, faits vérifiés, aucun avis négatif, relecture,
   format, appel à l'action, droits, coût noté). Un seul manque et la porte reste fermée.
6. **Aucun XP pour une action refusée**, et le journal ne contient jamais une action refusée.
7. **Le journal fait foi** : le serveur reconstruit tout (XP, niveaux, badges) en relisant le journal. Une ligne abîmée ou
   inventée est ignorée et comptée, jamais crue ; un événement pour une mission inexistante est ignoré.

Limite à connaître : les déclarations de l'étape de production (vraie photo, pas de produit IA, coût annoncé) sont
**déclaratives**. Ce n'est pas un détecteur d'images. Le vrai garde-fou reste la porte 2 de Ben ; le moteur rend la règle
visible, répétée et traçable.

## 4. Deux produits, deux publics

| Produit | Pour qui | Où | État |
|---|---|---|---|
| **Studio** (bureau pixel-art) | Ben et ses agents IA | Sur la machine de Ben (pixel-agents) | Installé et lancé ; moteur de quêtes écrit et testé ; **interface de quêtes à construire** |
| **Académie** (petit jeu d'apprentissage) | Les secrétaires des entreprises clientes | Page web légère, utilisable sur téléphone, sans abonnement | À concevoir après le Studio |

### Académie : idées de mini-jeux alignés sur `docs/04-FORMATION-SECRETAIRES.md`

- **Vrai ou faux bidon** : on montre des visuels, la secrétaire dit s'ils violent la règle de la vraie photo.
- **Atelier de légendes** : elle écrit une légende à partir d'une fiche produit ; une grille vérifie ce qui est sourcé.
- **Chasse aux erreurs** : trouver 5 problèmes dans un post (fait inventé, avis négatif, mauvais format).
- **Le calendrier du mois** : placer les posts aux bonnes heures et réseaux.
- **Le boss de la porte 2** : la checklist de 9 points, à cocher sur un post piégé.

Le score alimente le même système de niveaux. Les contenus de test sont écrits par Ben ou validés par lui (faits vérifiés).

## 5. Ce que l'interface doit faire (cahier des charges du Studio)

- Bureau pixel-art déjà fourni : zones nommées (salle des idées, atelier visuel, bureau de programmation, salle des chiffres).
- **Tableau des quêtes** : chaque mission est une carte qui avance de zone en zone ; la carte s'arrête devant une **porte**.
- **Porte de Ben** : écran de validation avec la checklist de 9 points ; boutons « Passer » et « Refuser (motif) ».
- **Barre d'XP, titre, badges** de chaque joueur (humain ou agent). Animation de montée de niveau. Sons doux.
- Les agents IA du Studio sont aussi des joueurs : leur XP se gagne par des étapes réellement acceptées.
- Textes en français ; vocabulaire simple ; icônes plutôt que longs textes (usage téléphone, connexion lente).
- Mode lecture seule (sans jeton) pour montrer le bureau à un client sans qu'il puisse agir.

## 6. Prochaines étapes

1. Brancher le moteur au serveur : routes `/api/quests` protégées par le jeton, rôle déduit de l'authentification (jamais du
   corps de la requête).
2. Panneau « Quêtes » dans l'interface (React) : tableau, porte de validation, barre d'XP.
3. Lier les agents du Studio : chaque étape terminée par un agent est envoyée au moteur.
4. Rôle secrétaire : jeton séparé à droits limités (n'ouvre aucune porte).
5. Académie : un premier mini-jeu (« Vrai ou faux bidon ») dès que Ben a fourni 10 vraies photos et 10 cas de test.

Questions ouvertes pour Ben : sur quel appareil jouent les secrétaires (téléphone ?) ; langue(s) de l'Académie ; veut-il un
classement entre secrétaires d'un même client, ou entre entreprises (attention : un classement public peut démotiver).
