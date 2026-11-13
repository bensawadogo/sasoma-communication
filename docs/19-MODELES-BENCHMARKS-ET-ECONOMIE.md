# Modèles d'IA, benchmarks, travail de chaque agent et économie (13/11/2026)

Demande de Ben : chercher dans les benchmarks les plus adaptés au community management, attribuer chaque travail à chaque agent, pouvoir changer d'IA et d'outil (autres « harnesses »), rester économique sans perdre en qualité.
Niveaux : **officiel** (page du fournisseur ou du classement lue), **rapporté** (blog, agrégateur), **non vérifié**. Les noms de modèles sont ceux des pages lues.

## 1. Ce que les benchmarks mesurent, et ce qu'ils ne mesurent pas
**Aucun benchmark public ne mesure le community management, les légendes de réseaux sociaux, ni le français du Burkina.** Une recherche dédiée n'a trouvé que des substituts (écriture créative). Pour les langues locales (mooré, dioula) : AfroBench et IrokoBench existent (64 langues africaines, tâches NLP), mais je n'ai trouvé **aucun résultat 2026** ni aucun résultat mooré/dioula ; les derniers chiffres lus datent de l'époque GPT-4o (59 de moyenne environ, écart avec le français jusqu'à 19 %, rapporté). Conséquence : pour nos tâches, le dernier mot revient à un **jeu de test maison** noté par Ben (`evals/`).

| Compétence utile au CM | Benchmark le plus proche | Ce que j'ai pu lire |
|---|---|---|
| Écriture créative (idées, scénarios, légendes) | **Arena, catégorie Creative Writing** (votes humains), EQ-Bench Creative Writing v3 | Arena du 11/11/2026 (officiel) : Gemini 4 Argon 1523, **Claude Opus 5.5 1517**, Gemini 4 Carbon 1516 (provisoire), Fable 5 1501, Opus 4.6 1499, Gemini 4 Hydrogen 1492 (prov.), Fable 5.1 1490, **Gemini 3.8 Flash 1488 (prov.)**. Sonnet 5.5 absent du top 15 (donc sous 1478 ou non classé). Aucune catégorie française visible. EQ-Bench : la page ne s'est pas chargée |
| Fidélité aux sources (pas d'invention) | **Vectara HHEM** (résumé d'un document) | 22/10/2026 (officiel) : les plus fidèles sont de petits modèles (finix 1,8 %, GPT-5.4 nano 3,1 %, Gemini 2.5 flash-lite 3,3 %, DeepSeek-V4.1-Flash 4,2 %). Mesure seulement la fidélité d'un **résumé**, pas la recherche ni toutes les inventions (avertissement de la page) |
| Appels d'outils, plan, délégation | **BFCL V4** (Berkeley) ; indice d'**Artificial Analysis** | BFCL : page chargée sans tableau (version V4, màj 12/04/2026). Artificial Analysis : voir §2 |
| Tâches professionnelles réelles | **GDPval** (OpenAI) | Existe ; je n'ai trouvé **aucune ventilation marketing/vente**, et les versions ne sont pas comparables entre elles |
| Recherche web | BrowseComp | Non lu |

## 2. Intelligence et coût par tâche (Artificial Analysis, 13/11/2026, lu sur leur classement)
Le **prix par token n'est pas le coût d'une tâche** : un modèle qui réfléchit moins coûte moins en tout.
| Modèle (effort) | Indice | Coût par tâche de l'indice |
|---|---|---|
| Claude Fable 5.2 (max) | 65 | 26,54 $ |
| Claude Fable 5.2 (high) | 62 | 9,08 $ |
| Gemini 4 Carbon (high) | 60 | 5,48 $ |
| **Claude Opus 5.5 (max)** | 59 | 10,04 $ |
| GPT-6 Astra (max) | 57 | 6,24 $ |
| **Claude Sonnet 5.5 (max)** | 55 | 10,02 $ |
| **GPT-6.1 Sol (max)** | 55 | **1,27 $** |
| GPT-6.1 Sol (medium) | 46 | 0,36 $ |
| GPT-6.1 Terra (high / medium) | 42 / 38 | 0,26 $ / 0,17 $ |
| Gemini 4 Hydrogen (medium) | 41 | 0,80 $ |
| **Claude Haiku 5.5 (high)** | 30 | **0,16 $** |
À lire : Opus 5.5 coûte autant par tâche que Sonnet 5.5 pour 4 points de plus ; GPT-6.1 Sol atteint le même indice que Sonnet 5.5 pour environ 8 fois moins. **C'est l'indice d'Artificial Analysis, pas nos tâches** : il indique où chercher, pas qui gagne chez nous.

## 3. Prix officiels par million de tokens (entrée / sortie)
| Fournisseur | Modèles | Cache | Batch |
|---|---|---|---|
| Anthropic | Haiku 5.5 0,10/0,50 $ (au-delà de 100 000 tokens de prompt : 0,50/2,50) · Sonnet 5.5 2/10 · Opus 5.5 4/20 · Fable 5.2 8/40 | lectures 0,05× (0,025× pour Fable 5.2) | −50 % |
| OpenAI | GPT-6 Luna 0,10/0,50 · GPT-6.1 Terra 1/5 · GPT-6.1 Sol 2/10 · GPT-6 Astra 10/50 | lectures 0,05× | −50 % |
| DeepSeek | V4.1 Flash 0,15/0,60 hors pointe (double en pointe : 01-04 h et 06-10 h UTC en semaine) · V4 Pro 0,66/1,98 | lectures 0,02× | — |
| Google | Gemini 4 Hydrogen 1,50/7,50 · Gemini 4 Carbon et Argon 2/10 **puis 4/20 dès le 01/12/2026** · Gemini 3.8 Flash 0,75/3,75 puis 1,50/7,50 dès le 01/01/2027 | oui | −50 % |
| Moonshot (Kimi K3.1 Pro) | 2/10 (**rapporté** par des agrégateurs, page officielle non lue) | 0,20 | — |
Opus 5.5 ne coûte que **2 fois** Sonnet 5.5 : l'utiliser pour décider et contrôler est abordable.

## 4. Le travail de chaque agent (liste d'attribution)
Source unique : `config/modeles.json` (3 profils : eco, equilibre, max). Profil **equilibre** recommandé, appliqué le 13/11/2026.
| Agent | Travail | Ce qui compte | Profil équilibré (Claude Code) | Autres IA possibles (autres outils) | À valider par |
|---|---|---|---|---|---|
| chef-de-studio | découper, déléguer, assembler | appels d'outils, suivi du plan | **Opus 5.5** | GPT-6.1 Sol | test maison (tâche n°1) |
| controleur | porte 2 : 9 points et sources | rigueur, fidélité, aucune complaisance | **Opus 5.5** | GPT-6.1 Sol | posts piégés |
| veilleur | recherche sourcée | sources, « inconnu » | Sonnet 5.5 | GPT-6.1 Terra ; DeepSeek V4 Pro pour résumer des textes non confidentiels | 10 questions à réponse connue |
| stratege | idées, calendrier | créativité, planification | Sonnet 5.5 | GPT-6.1 Terra | notation à l'aveugle |
| scenariste | scénarios, légendes en français | qualité d'écriture, ton | Sonnet 5.5 (Opus 5.5 si le test le justifie) | GPT-6.1 Sol ; Gemini 4 Hydrogen ou 3.8 Flash, proches de Opus 5.5 sur Arena pour 2 à 5 fois moins cher | 5 scénarios à l'aveugle |
| createur-visuel | briefs visuels | précision, règles de marque | Sonnet 5.5 | GPT-6.1 Terra | test maison |
| programmateur | créer les posts en revue | exécution exacte d'un appel d'outil | **Haiku 5.5** (la porte 3 de Ben rattrape une erreur) | GPT-6 Luna | 2 posts dont un à l'heure invalide |
| publicitaire | briefs de campagne, chiffres | chiffres exacts | Sonnet 5.5 | GPT-6.1 Terra | lecture d'un export |
| analyste | bilan mensuel | exactitude | Sonnet 5.5 | GPT-6.1 Terra | tableau avec une case vide |
| formateur | fiches pour secrétaires | clarté, français simple | Sonnet 5.5 | GPT-6.1 Terra | fiche de 10 lignes |
| commercial | propositions, contrats | persuasion honnête, aucun prix inventé | Sonnet 5.5 | GPT-6.1 Terra | proposition avec prix à laisser vides |
Changé par rapport au 13/11 matin : le programmateur passe de Sonnet à Haiku (tâche mécanique, 20 fois moins cher).

## 5. Changer d'IA et d'outil
**Une source, plusieurs outils.** Les règles communes sont dans un skill au format ouvert Agent Skills (`.claude/skills/regles-cm/`, copié dans `.agents/skills/`) et dans `AGENTS.md`. Les agents se génèrent pour les autres outils :
| Outil | Où | Commande | Ce qui est vérifié |
|---|---|---|---|
| Claude Code (natif) | `.claude/agents/` | `node scripts/profil-modele.mjs eco\|equilibre\|max` | Documentation officielle lue ; garde-fou d'écriture **matériel** (hook) |
| OpenCode | `.opencode/agents/*.md` | `node scripts/exporter-agents.mjs --cible opencode [--fournisseur openai]` | Format officiel lu ; droits d'écriture traduits en `permissions` (syntaxe des chemins à confirmer) |
| Codex CLI | `.codex/agents/*.toml` | `--cible codex` | Format officiel lu (nom, description, modèle, instructions) ; serveurs MCP et sandbox se règlent dans la session, pas par agent |
| Gemini CLI | `.gemini/agents/*.md` | `--cible gemini --modele-gemini <identifiant>` | Format officiel lu ; **sans liste d'outils** : l'agent hérite de tout (à restreindre dans Gemini CLI) ; identifiant d'API Gemini 4 non confirmé |
| Cursor, Copilot, autres | `AGENTS.md`, `.agents/skills/` | `--cible agents` | Support du format SKILL.md **rapporté** par des blogs, à vérifier outil par outil |
| Claude Code avec un autre modèle | variables d'environnement | passerelle (OpenRouter, LiteLLM) | OpenRouter : `ANTHROPIC_BASE_URL=https://openrouter.ai/api`, jeton dans `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY` vide ; OpenRouter prévient que Claude Code est optimisé pour les modèles Anthropic. Points d'accès Anthropic-compatibles de DeepSeek et Kimi : **non vérifiés** |
Limites à connaître : les 35 fichiers générés sont **des copies** (on modifie la source, puis on relance l'export) ; **hors Claude Code, le périmètre d'écriture n'est plus bloqué par le matériel** (règles écrites et permissions de l'outil) ; une équipe qui délègue (le chef appelle les autres) n'existe nativement que dans Claude Code et OpenCode, à tester dans les autres. Tous ces outils ont besoin de **tes propres clés d'API** (je n'en crée ni n'en saisis aucune).

## 6. Économie sans perdre la qualité
Ce qui est **vérifié** par les pages officielles : lecture de cache à 0,05× du prix d'entrée (Anthropic et OpenAI), Batch à −50 % (Anthropic, OpenAI, Google), grande différence de prix entre paliers (Haiku 5.5 est 20 fois moins cher que Sonnet 5.5), et coût par tâche très variable selon l'effort de réflexion (Fable 5.2 : 9 $ en « high » contre 26,5 $ en « max » pour 3 points de plus).
Règles :
1. **Le rédacteur peut être bon marché, le juge doit être fort** : le contrôleur (Opus) relit tout ce que produisent les autres, et toi, tu passes les 3 portes.
2. **Léger pour le mécanique** : programmateur sur Haiku ; autres tâches répétitives et de masse (calendrier mensuel) via l'API Batch (−50 %) quand ce n'est pas urgent. Claude Code n'utilise pas le Batch : cela demande un petit script (à construire si le volume le justifie).
3. **Pas d'effort maximal par défaut** : « high » plutôt que « max », sauf mission importante (profil `max`).
4. **Contexte court** : chaque agent ne lit que les fichiers de sa tâche ; le cache fait le reste.
5. **Mesurer** : barre des tokens du Studio, plafonds dans `production/budgets.json`, et refaire le jeu de test quand un modèle ou un prix change.
**Ordre de grandeur (hypothèse à mesurer)** : un appel d'agent typique de 30 000 tokens lus (en grande partie en cache) et 3 000 écrits coûte environ 0,04 $ avec Sonnet 5.5, 0,08 $ avec Opus 5.5, 0,002 $ avec Haiku 5.5. Douze posts par mois à raison de six appels par post : de l'ordre de **3 $ de tokens par client et par mois** avec Sonnet. À ce niveau, **la qualité compte plus que l'économie** : ne dégrade pas un agent pour gagner quelques centimes, dégrade seulement ceux dont la porte suivante rattrape l'erreur.

## 7. Confidentialité (à lire avant d'utiliser une autre IA)
- Les niveaux gratuits de Google (Gemini 4 Hydrogen, Gemini 3.x Flash) précisent que le contenu envoyé **peut servir à améliorer leurs produits** (page officielle) : **jamais de données de clients** sur ces niveaux.
- DeepSeek et Moonshot : conditions d'usage et lieu de traitement des données **non lus** ici : réserver à des textes non confidentiels tant que cela n'est pas vérifié.
- Les règles absolues (bidon jamais généré, faits sourcés, rien sans accord de Ben) valent pour **toute** IA : elles sont dans `AGENTS.md` et le skill commun.

## 8. Ce qui reste à faire (et par qui)
- **Ben** : donner ses propres clés (OpenAI, Google, DeepSeek) seulement s'il veut tester ces fournisseurs ; faire la notation à l'aveugle de `evals/` (une heure).
- **Claude** : lancer le jeu de test sur 2 ou 3 modèles par agent une fois les clés disponibles ; construire la passerelle `delegue-ia` (`docs/09`) si Ben veut mélanger les fournisseurs dans une même mission ; confirmer les identifiants d'API de Gemini 4.

## Sources
- Prix Anthropic : https://platform.claude.com/docs/en/about-claude/pricing · OpenAI : https://developers.openai.com/api/docs/pricing · DeepSeek : https://api-docs.deepseek.com/quick_start/pricing · Google : https://aistudio.google.com/docs/pricing
- Arena, creative writing : https://arena.ai/leaderboard/text/creative-writing · Artificial Analysis : https://artificialanalysis.ai/leaderboards/models · Vectara : https://github.com/vectara/hallucination-leaderboard · BFCL : https://gorilla.cs.berkeley.edu/leaderboard.html
- Formats d'agents : OpenCode https://opencode.ai/docs/agents/ · Codex https://learn.chatgpt.com/docs/agent-configuration/subagents · Gemini CLI https://geminicli.com/docs/core/subagents/ · Agent Skills https://agentskills.io/specification · Claude Code https://code.claude.com/docs/en/sub-agents
- Langues africaines : IrokoBench https://arxiv.org/abs/2406.03368 · AfroBench https://mcgill-nlp.github.io/AfroBench/
- GDPval : https://arxiv.org/abs/2510.04374 · OpenRouter + Claude Code : https://openrouter.ai/docs/cookbook/coding-agents/claude-code-integration
