# Continuer sans abonnement Claude : plusieurs outils, plusieurs fournisseurs, une seule mémoire (13/11/2026)

**But de Ben** : que le projet ne dépende d'aucun outil ni d'aucun abonnement. Si l'abonnement Claude s'arrête ou atteint sa limite, il ouvre le même dossier dans un autre outil, avec un autre fournisseur, et le travail continue avec le même contexte.

## La solution en trois couches
| Couche | Où | Rôle |
|---|---|---|
| **Mémoire commune** | `ETAT-DU-PROJET.md` (+ `AGENTS.md`, `TODO.md`, `docs/`) | qui est Ben, comment travailler, décisions, ce qui est fait, **section « Reprise »** mise à jour à chaque fin de session ; `node scripts/relais.mjs` rafraîchit la partie automatique (profil, agents, derniers changements, tâches ouvertes, dépenses) |
| **Règles et agents** | `.claude/skills/regles-cm/` → `AGENTS.md` et `.agents/skills/` ; agents générés par `node scripts/exporter-agents.mjs` | les mêmes règles absolues et les mêmes 11 agents dans tous les outils |
| **Accès aux IA** | OpenRouter (une clé, un plafond), `delegue-ia` pour les envois contrôlés | un seul compte donne GPT, Gemini, Claude, DeepSeek, Kimi, Qwen, GLM... ; DeepSeek aussi en direct |

La mémoire propre à Claude Code (`~/.claude/.../memory`) n'est lue par aucun autre outil : l'essentiel a été recopié dans `ETAT-DU-PROJET.md`.

## Les outils (ce qui est vérifié dans leur documentation officielle, 13/11/2026)
| Outil | Lit nos règles | MCP (`delegue-ia`) | Fournisseurs | Sur ton PC |
|---|---|---|---|---|
| **Claude Code** | `CLAUDE.md`, agents, skills, hooks (garde-fou matériel) | oui (`.mcp.json`) | abonnement Claude ; passerelle possible, mais Anthropic ne prend pas en charge les modèles non-Claude ; **DeepSeek documente lui-même** l'usage de Claude Code (`ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic`) | installé |
| **OpenCode** | `AGENTS.md` (puis `CLAUDE.md` à défaut), lit aussi les skills de `.claude/skills` | oui, **vérifié : « delegue-ia connected »** | `/connect` : OpenRouter, DeepSeek (V4 Flash, OpenCode 1.18.30 ou plus)... | **installé (1.19.5)** |
| **Kilo CLI** | `AGENTS.md`, skills | oui (`kilo.jsonc`) | OpenRouter, DeepSeek, compatible OpenAI | non installé ; fork d'OpenCode ; **`kilo` peut importer les sessions de Claude Code et de Codex**, donc reprendre « les fils » |
| **Codex CLI** | `AGENTS.md` | oui (`[mcp_servers.…]` dans `.codex/config.toml`) | OpenAI ; autres via `[model_providers.…]` (valeurs OpenRouter/DeepSeek non données par la page lue) | non installé |
| **Gemini CLI** | `GEMINI.md` (pointe vers `AGENTS.md`) | oui (`.gemini/settings.json`, **vu par l'outil**, désactivé tant que le dossier n'est pas « de confiance ») | Gemini ; niveau gratuit : jamais de données de clients | **installé (0.68.0)** |
| **Hermes Agent** (Nous Research ; je suppose que c'est « Arnes ») | « fichiers de contexte du projet », pas `AGENTS.md` d'après la page lue | oui | Nous Portal, OpenRouter, tout point d'accès ; DeepSeek documenté | non installé ; Windows : la page DeepSeek ne donne que WSL2, la documentation Hermes parle d'un installateur PowerShell « expérimental » ; **WSL2 (Ubuntu) est déjà là** |

DeepSeek documente aussi Codex, OpenCode, Hermes, OpenClaw. Kilo n'est pas dans leur liste.

## Ce que j'ai testé en vrai sur ton PC
- **OpenCode 1.19.5** : j'ai découvert que cette version refuse la nouvelle syntaxe de droits décrite dans la documentation en ligne (`permissions`, erreur « V2 not supported ») : mon premier `opencode.json` et les agents exportés auraient été **ignorés ou cassés**. Corrigé : l'export et `opencode.json` utilisent la syntaxe `permission` de la version 1.x ; `--format-opencode v2` produit l'autre. Résultat vérifié : les 11 agents sont chargés, et le programmateur a bien « écriture refusée sauf sa mémoire » et « bash refusé » ; hors du dossier du projet, refus.
- **`delegue-ia`** est connecté dans OpenCode. Gemini CLI le voit (désactivé : dossier non approuvé).
- **Jamais lancé** : aucune conversation réelle dans OpenCode, Gemini, Kilo, Codex ni Hermes (pas de clé OpenRouter). Les réglages de Codex (`approval_policy`, sandbox) et de Gemini sont écrits d'après la documentation, non essayés.

## Comment basculer quand Claude s'arrête
1. Ouvre un terminal dans `C:\SASOMA-COMMUNICATION` et lance `opencode`.
2. `/connect`, choisis **OpenRouter** (ta clé plafonnée) ou **DeepSeek**.
3. `/models` : choisis un modèle (voir `docs/19` pour le profil). Les 11 agents sont dans `.opencode/agents/`.
4. Écris : « Lis ETAT-DU-PROJET.md et reprends à la section Reprise. » En fin de session, l'outil met à jour cette section.
5. Pour recommencer avec Kilo : `kilo` dans le même dossier ; `/sessions` permet d'importer une session Claude Code.
Les agents exportés prennent par défaut les modèles du profil actif **via OpenRouter** (`openrouter/anthropic/...`) ; `--fournisseur anthropic|openai|deepseek` donne les identifiants directs.

## « Relié à tout mon ordinateur » : non, volontairement
Un agent qui peut lire et lancer n'importe quoi sur l'ordinateur est le plus gros risque du projet (documents personnels, jetons, mots de passe, ordinateur de famille). Constats officiels :
- **OpenCode** : par défaut les écritures et les commandes sont autorisées sans demander ; les commandes tournent avec **tous tes droits**, et la détection des dossiers est « au mieux ». D'où `opencode.json` : accès hors du projet refusé, commandes sur demande, jetons et `.env` illisibles, `git push` refusé, `production/` et les photos sur demande.
- **Hermes** : par défaut les commandes dangereuses sont évaluées par une IA ; en local il tourne avec tes droits ; son propre guide recommande une isolation (Docker) et `HERMES_WRITE_SAFE_ROOT` sur le dossier du projet. Docker Desktop est installé chez toi.
- **Codex** : mode `workspace-write` et réseau coupé dans `.codex/config.toml`.
Si tu veux qu'un agent accède à un autre dossier (par exemple ton dossier de photos), on l'ajoute **dossier par dossier**, pas l'ordinateur entier.
Les règles écrites sont dans `ETAT-DU-PROJET.md` : elles valent pour tout outil, mais **seuls les réglages de l'outil les font respecter** (Claude Code, avec ses hooks, est le seul à bloquer par le matériel les écritures hors rôle).

## Limites à connaître
- **Le Studio ne voit que les agents Claude Code** (ses hooks sont ceux de Claude). Les agents d'OpenCode ou de Kilo ne bougent pas dans le bureau 3D ; la suite logique serait un fournisseur de plus dans le Studio (non fait).
- Un outil sans les hooks de Claude n'a pas le garde-fou d'écriture matériel ; la version 1.x d'OpenCode applique celui de `permission` par agent (testé).
- **Skills** : OpenCode charge aussi tes autres skills de la machine (Azure, etc.) : sans danger mais bruyant.
- Hermes et Kilo : à installer et tester avant de compter dessus.
- Changements fréquents de ces outils : relis leur documentation avant de dépendre d'un détail.

## Sources
OpenCode : https://opencode.ai/docs/rules/ · /mcp-servers/ · /permissions/ · Kilo : https://kilo.ai/docs/cli · Codex : https://learn.chatgpt.com/docs/config-file/config-advanced · https://learn.chatgpt.com/docs/extend/mcp · Gemini CLI : https://geminicli.com/docs/tools/mcp-server/ · Hermes : https://hermes-agent.nousresearch.com/docs/index.html · https://hermes-agent.nousresearch.com/docs/user-guide/security · DeepSeek : https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code · Claude Code et passerelles : https://code.claude.com/docs/en/llm-gateway
