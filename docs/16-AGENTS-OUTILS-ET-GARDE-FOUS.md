# Agents, outils et garde-fous (état au 13/11/2026)

## Les outils : ce qui est branché, et à qui
| Outil | État | Qui l'utilise |
|---|---|---|
| Metricool | Connecté par MCP, **aucun réseau relié** (aucun compte SASOMA n'existe) | programmateur (création en **revue** seulement, pas de publication directe), analyste (lecture), stratège (meilleure heure) |
| Supermetrics | Connecté mais **non authentifié** sur les comptes pub | analyste, publicitaire (lecture) |
| Orshot, Unsplash | Connectés | créateur visuel (gabarits, décor sans produit) |
| Firecrawl + recherche web | Connectés | veilleur, stratège, commercial |
| Higgsfield | Connecté, plan à 0 crédit | créateur visuel : **lecture du solde et du plan seulement** (pas de génération) |
| ElevenLabs, HyperFrames, Adobe, Descript | Connectés | **aucun agent** : le rendu payant reste fait par Ben dans son studio, avec coût annoncé |
| Postiz | **Non installé, volontairement** : il demande de créer ses propres applications Meta et TikTok (revue de plusieurs semaines côté Meta) et un domaine HTTPS | personne |
| n8n, Publer | Non branchés (voir `docs/02`) | personne |
| REM, social-auto-upload | Audités, **non retenus** (`docs/14`) | personne |

Donner un outil de rendu payant à un agent revient à lui laisser dépenser des crédits et à risquer un produit généré : ce n'est pas fait sans décision de Ben.

## Ce qui spécialise chaque agent
1. **Un rôle écrit** (`.claude/agents/<nom>.md`) : ce qu'il fait, ce qu'il ne fait pas.
2. **Une liste d'outils fermée** : seuls ceux de son métier. Personne n'a d'outil de publication ni d'envoi.
3. **Les règles communes, une seule source** : le skill `.claude/skills/regles-cm/`, chargé d'office par les 11 agents (bidon jamais généré, faits sourcés, rien sans accord de Ben, coûts annoncés, 3 portes, checklist des 9 points, niveaux de preuve).
4. **Un garde-fou d'écriture** : un hook (`scripts/garde-fou-ecriture.mjs`) bloque toute écriture hors du périmètre de l'agent. Exemples : le contrôleur n'écrit que ses rapports (`*-controle*`), il ne corrige pas le travail des autres ; le programmateur n'écrit que dans sa mémoire ; personne ne touche aux agents, aux réglages, au code, à `CLAUDE.md` ni au site livré.
5. **Une mémoire par agent** (`memory: project`).

## Ce qui est testé, et ce qui ne l'est pas
- Testé : le garde-fou seul (8 tests `node --test scripts/garde-fou-ecriture.test.mjs` : périmètres, chemins qui remontent, agent inconnu, vrai code de sortie 2).
- **Pas testé en situation réelle** : les définitions d'agents sont lues au démarrage d'une session Claude. Il faut **relancer** (`lancer-manager.ps1`) pour qu'elles s'appliquent, puis faire une vraie mission de test. Les hooks des agents du projet ne s'exécutent que si le dossier est approuvé (« trust ») dans Claude Code.
- Limite de fond : « pas de produit généré par IA » reste une règle écrite plus la porte 2 de Ben. Aucun outil ne détecte une image générée.
- Les agents ne peuvent pas lancer Bash : ils n'ont donc que Write et Edit pour écrire, ce que le garde-fou couvre.

## Le modèle d'IA par agent
Source unique : `config/modeles.json` (profils eco, equilibre, max). Profil actif : **equilibre** (Opus pour chef-de-studio et contrôleur, Haiku pour le programmateur, Sonnet pour les 8 autres). Changer : `node scripts/profil-modele.mjs eco|equilibre|max`. Recherche, benchmarks, prix et autres outils : `docs/19-MODELES-BENCHMARKS-ET-ECONOMIE.md`.

## Vérification automatique des agents
`node scripts/verifier-agents.mjs` contrôle les 11 agents : en-tête YAML lisible, nom, outils (aucun Bash ni outil de publication, d'envoi ou de suppression), skill `regles-cm`, garde-fou d'écriture, modèle, mémoire.
Elle a trouvé un vrai défaut le 13/11/2026 : l'agent **contrôleur** avait un « : » dans sa description, ce qui rend son en-tête YAML illisible, et Claude Code l'a retiré de la liste des agents sans rien dire. Corrigé. À relancer après toute modification d'un agent.
