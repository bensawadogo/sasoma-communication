# 09. Orchestration : Claude répartit le travail entre plusieurs IA (DeepSeek, Kimi, autres)

Demande de Ben (12/11/2026) : pouvoir utiliser plusieurs autres IA (Kimi, DeepSeek) dans le Studio, **mais que ce soit Claude
qui attribue les tâches**. Projet solide, qui marche aussi sur mobile.

## 1. Ce que dit la recherche (relevé du 12/11/2026)

| Sujet | Constat | Source |
|---|---|---|
| DeepSeek compatible Claude Code | Oui, **documenté par DeepSeek lui-même** : endpoint Anthropic `https://api.deepseek.com/anthropic`, avec variables d'environnement pour Claude Code | api-docs.deepseek.com |
| Kimi (Moonshot) compatible Claude Code | Oui via `https://api.moonshot.ai/anthropic` (modèle `kimi-k3`). **Kimi K2 est fermé aux nouvelles inscriptions depuis le 31/10/2026** | requesty.ai (tiers), à confirmer sur platform.kimi.ai |
| Prix DeepSeek Flash (direct) | Rapporté : 0,15 $ par million de jetons en entrée, 0,60 $ en sortie hors pointe (0,30 et 1,20 en pointe) | requesty.ai (tiers), à confirmer sur la page de prix de DeepSeek |
| Facture réelle | Un test tiers mesure la même tâche à 0,32 $ avec Claude Opus, 0,25 $ avec Kimi K3, 0,005 $ avec DeepSeek Flash : l'écart est très grand, mais c'est **un test, pas une garantie** | genaiunplugged (tiers) |
| Position d'Anthropic | **Anthropic ne prend pas en charge** l'usage de modèles non-Claude via des passerelles tierces | requesty.ai |
| Le compte DeepSeek/Kimi | Facturation **séparée** de l'abonnement Claude, avec solde à recharger | requesty.ai |

### Les projets solides trouvés

| Projet | Licence | Solidité | Rôle possible |
|---|---|---|---|
| **claude-code-router** (musistudio) | MIT | ~38 100 étoiles, dernier commit 10/10/2026 | Passerelle locale : fait parler Claude Code à DeepSeek, Kimi, OpenRouter… avec des règles de routage par type de requête |
| PAL MCP server (BeehiveInnovations) | Licence non déclarée | ~11 800 étoiles mais **dernier commit 15/12/2025** (près d'un an) | Idée de départ (Claude appelle d'autres modèles comme outils), mais pas assez maintenu pour s'y fier |
| Passerelles hébergées (OpenRouter, Requesty, Opper) | Services payants | Actives | Une seule clé pour de nombreux modèles ; mais les données passent par un intermédiaire de plus |

## 2. Décision d'architecture : Claude reste le répartiteur

Deux façons de brancher d'autres IA. Nous prenons la première comme base.

**A. Outil de délégation (retenu)** : un petit serveur MCP local, `delegue-ia`, que le `chef-de-studio` (Claude, session
normale, abonnement intact) appelle comme un outil : `deleguer(tache, modele)`. Le serveur appelle l'API du modèle choisi
et renvoie le texte à Claude, qui **relit toujours** avant d'utiliser. Avantages :
- Claude décide qui fait quoi, et garde la responsabilité du résultat.
- Aucune passerelle ne s'intercale entre Claude Code et Anthropic (pas de zone grise sur l'abonnement).
- La politique de sécurité est dans notre code : liste des tâches autorisées par modèle, plafond de dépense par jour,
  journal de chaque délégation avec son coût.

**B. Session entière sur un autre modèle (option)** : lancer un agent « ouvrier » dans un dossier séparé dont les réglages
de projet pointent vers DeepSeek (variables `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`…), ou passer par claude-code-router.
Utile pour de gros volumes de tâches simples. Le réglage doit rester **limité à ce dossier**, jamais global : un test tiers
décrit un cas où tout le poste avait été redirigé par erreur vers un modèle moins bon.

### Politique d'attribution des tâches (proposition, c'est Claude qui applique)

| Type de tâche | Modèle | Pourquoi |
|---|---|---|
| Valider la logique métier, relire à la porte 2, tout ce qui touche aux règles (bidon, faits) | **Claude** | Le moins risqué ; responsabilité finale |
| Brouillons en volume : 20 légendes, variantes d'accroche, mots-clés | DeepSeek Flash | Très bon marché |
| Traductions, reformulations, idées en plusieurs langues locales | Kimi ou DeepSeek, relu par Claude | À tester sur le moré, le dioula, etc. (qualité inconnue) |
| Résumés de longs documents (fiches techniques) | Modèle à grand contexte | À mesurer |
| **Données privées du client** (contacts, chiffres internes, mots de passe, photos non publiées) | **Jamais** envoyées à un modèle hébergé à l'étranger sans accord écrit du client | Confidentialité |

Règles qui ne changent pas : le bidon n'est jamais généré ; faits vérifiés seulement ; aucune sortie d'un autre modèle n'est
publiée sans relecture de Claude **et** validation de Ben (les 3 portes).

## 3. Points d'attention

- **Coût** : DeepSeek et Kimi se paient à part (clé d'API, solde prépayé). Rien n'est acheté sans accord de Ben. Un plafond
  quotidien codé dans `delegue-ia` limitera la dépense.
- **Confidentialité** : le contenu envoyé quitte le Burkina et va chez le fournisseur choisi. D'après une source tierce, le
  modèle chinois peut aussi traiter les données en Chine : à dire aux clients.
- **Image de marque des fournisseurs** : Anthropic a accusé DeepSeek, Moonshot et MiniMax d'avoir créé de faux comptes pour
  distiller Claude (rapporté sur un forum, non vérifié ici). À connaître avant d'en parler à un client.
- **Qualité en langues locales** : inconnue. Test obligatoire avant d'en dépendre.
- **Autres IA gratuites** : voir `docs/06` (Dreamina, Google Flow) pour l'image et la vidéo.

## 4. Mobile

- Le Studio se consulte déjà sur téléphone (Tailscale, jeton dans l'URL).
- Le panneau « Quêtes » est écrit pour téléphone : une colonne, zones tactiles de 44 pixels, aucune action cachée au survol,
  bouton « Quêtes » dans le menu du téléphone.
- Pour les secrétaires : un jeton à rôle limité (fichier `~/.pixel-agents/quest-actors.json`) leur permet de jouer sans
  jamais ouvrir une porte. Une vraie mise à disposition en dehors du réseau de Ben demande un accès distant : voir les questions.

## 5. À faire

1. Écrire le serveur MCP `delegue-ia` (mode sans clé : simulation qui renvoie un texte factice, pour tester la politique).
2. Quand Ben a ouvert un compte DeepSeek (et recharge un petit solde), brancher la vraie API et mesurer le coût réel.
3. Tester la qualité en français local, puis en langues locales, avant toute promesse.
4. Journaliser chaque délégation (modèle, coût, relu par qui) dans le même journal que les quêtes.

Questions pour Ben : veut-il ouvrir un compte DeepSeek (et lequel de Kimi) ; accepte-t-il que les brouillons sans donnée
privée passent par des serveurs à l'étranger ; comment les secrétaires accèdent-elles au Studio à distance (Tailscale sur
leur téléphone, ou une page publique protégée, ce qui est un autre projet).
