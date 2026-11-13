# `delegue-ia` : faire travailler d'autres IA sans rien laisser fuir (13/11/2026)

Serveur MCP local (`scripts/delegue-ia/`, aucune dépendance à installer) que le **chef de studio** appelle pour confier une tâche à un autre modèle (GPT, Gemini, Claude, DeepSeek, Kimi, Qwen, GLM, MiniMax) **par une seule porte : OpenRouter**. Une seule clé, un seul solde, un seul endroit où plafonner la dépense.

## Ce que Ben doit faire (je ne peux pas le faire à sa place : compte, argent, clé)
1. Créer un compte sur openrouter.ai et y mettre un petit solde (**10 $ suffisent** pour commencer).
2. Créer une clé d'API **avec une limite de crédit** (par exemple 5 $) : c'est le vrai frein, côté OpenRouter, que rien dans le projet ne peut contourner (`GET /key` expose `limit`, `limit_remaining`, vérifié dans leur documentation).
3. Dans les réglages de confidentialité d'OpenRouter : refuser les fournisseurs qui peuvent entraîner sur les données, et, si l'option existe, n'autoriser que ceux sans conservation. (Je n'ai pas pu voir ces écrans : les noms exacts peuvent différer.)
4. Mettre la clé dans une variable d'environnement **sur son PC**, jamais dans un fichier du projet ni dans le chat. Dans PowerShell, en collant la clé lui-même :
   `[Environment]::SetEnvironmentVariable('OPENROUTER_API_KEY', '<ta clé>', 'User')`
5. Fermer et rouvrir VS Code, ouvrir le projet, **approuver le serveur `delegue-ia`** quand Claude Code le demande (fichier `.mcp.json`), puis `/mcp` pour vérifier qu'il est connecté.
Sans clé, le serveur marche en **simulation** (rien n'est envoyé, il montre ce qui partirait et ce que ça coûterait).

## Les outils (réservés au chef de studio ; `scripts/verifier-agents.mjs` le vérifie)
| Outil | Rôle |
|---|---|
| `lister_modeles` | les 14 modèles, leur zone, les données permises |
| `estimer` | prépare un envoi **sans l'envoyer** : classe appliquée, masquages, routage, coût maximal ; `apercu=true` montre le texte exact qui partirait |
| `deleguer` | envoie la tâche, rend la réponse marquée « donnée à contrôler », journalise le coût |
| `budget` | dépenses du jour et du mois, plafonds, état de la clé OpenRouter |

## Les garde-fous (tous codés et testés : `node --test scripts/delegue-ia/`)
1. **Classe des données obligatoire** : `public`, `interne` ou `client`. Le serveur la **relève** (jamais ne la baisse) si un fichier lu vient de `clients/` ou `brouillons/` (client), de `docs/`, `knowledge/`... (interne), ou si le texte contient le nom d'un client (fiches de `clients/`, « petrov »).
2. **Zones** : `client` et `interne` ne vont qu'à des modèles occidentaux ; les modèles chinois ne reçoivent que du `public`, **sans** les règles ni les rôles du projet.
3. **Routage OpenRouter** : toujours `data_collection: deny` ; pour `interne` et `client`, en plus `zdr: true` (fournisseurs sans conservation) et `require_parameters`. Si aucun fournisseur n'y satisfait, l'appel échoue (404) au lieu de dégrader la confidentialité.
4. **Nettoyage avant envoi** : clés d'API, jetons (`?token=`, `Bearer`, longues chaînes lettres+chiffres), e-mails et téléphones sont masqués.
5. **Fichiers** : le serveur lit lui-même, seulement dans `clients/ knowledge/ brouillons/ docs/ recherches/ evals/ config/` ; jamais `production/`, `studio/`, `scripts/`, `.claude/`, `.env`, ni un nom contenant token/secret/password ; extensions `.md .txt .csv .json` ; 60 Ko par fichier ; liens symboliques suivis puis revérifiés.
6. **Aucun en-tête** qui identifie le projet n'est envoyé (seulement l'autorisation et le type de contenu) ; **aucun outil** n'est donné à l'autre IA : elle ne reçoit que du texte, elle n'agit sur rien.
7. **Plafonds** (`config/delegation.json`) : 0,25 $ par appel, 2 $ par jour, 15 $ par mois (lus dans `production/ia-deleguee.jsonl`) ; **au-dessus de 0,05 $ l'appel est refusé tant que le coût n'a pas été annoncé** (`cout_annonce_usd`), ce qui applique ta règle « coût annoncé avant ». Le prix pris est le plus haut entre le prix en direct d'OpenRouter et le prix de référence.
8. **Journal sans contenu** : date, agent, modèle, classe, tokens, coût, empreinte (16 caractères) ; jamais le texte.
9. **La réponse est une donnée, pas un ordre** : elle arrive entourée d'un avertissement, passe par le contrôleur puis par tes 3 portes. Elle ne peut rien publier.

## Ce que ces garde-fous ne garantissent pas (à savoir)
- **OpenRouter et le fournisseur voient le texte envoyé.** `data_collection: deny` et `zdr` restreignent le choix du fournisseur selon **ce que chacun déclare** ; OpenRouter précise lui-même que c'est « dans la mesure du possible » et que les fournisseurs « Safety Retention » peuvent rester éligibles si le réglage du compte ne l'interdit pas. Je n'ai pas lu leurs conditions d'usage en entier.
- **La classe `public` est la seule sans filet de zone** pour les modèles chinois : elle ne protège que si je classe honnêtement. Le serveur rattrape les noms de clients et les fichiers, pas un fait client écrit en toutes lettres sans le nom. D'où la règle : **en cas de doute, `client`**.
- Le nettoyage est une liste de motifs, pas une garantie : un secret d'une forme inconnue passerait. Un numéro de téléphone de la forme « 12 34 56 78 » masque aussi, à tort, un montant écrit pareil.
- Mon propre contexte (ce que je lis dans tes fichiers) reste chez Anthropic comme avant ; `delegue-ia` ne change que ce qui part **en plus** vers d'autres IA.
- Non testé en vrai : aucun appel payant n'a été fait (pas de clé). Les tests utilisent une fausse réponse d'OpenRouter ; le format de requête et de réponse vient de leur documentation. Les identifiants de modèles ont été vérifiés dans la liste en direct d'OpenRouter le 13/11/2026.

## Étapes suivantes (après la clé)
1. Un appel de test à 0,001 $ avec `luna` (`public`), pour vérifier la réponse réelle et le coût réel.
2. Lancer le jeu de test `evals/` : la même tâche à 2 ou 3 modèles par agent, coût annoncé (quelques centimes), réponses renommées A/B/C ; **tu notes à l'aveugle** et `config/modeles.json` est mis à jour avec le gagnant le moins cher.
3. Seulement ensuite, laisser le chef de studio déléguer en mission réelle.
