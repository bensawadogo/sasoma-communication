# 10. Délégation, mémoire et savoir : comment l'équipe travaille vraiment

Question de Ben (12/11/2026) : est-ce que le travail est réellement délégué à chaque agent selon ses outils, et est-ce qu'ils ont une mémoire ?
Réponse après vérification dans la documentation officielle de Claude Code (page « Create custom subagents ») le 12/11/2026.

## 1. Délégation : ce qui est vrai

| Point | Constat |
|---|---|
| Lancer l'équipe | `claude --agent chef-de-studio` fait tourner le chef comme session principale. Pour que ce soit le choix par défaut du projet : `{ "agent": "chef-de-studio" }` dans `.claude/settings.json` |
| Qui peut déléguer à qui | Le champ `tools` du chef liste `Agent(stratege, scenariste, createur-visuel, programmateur, publicitaire, analyste)` : il ne peut déléguer qu'à ces six types |
| Imbrication | Un sous-agent peut lui-même en lancer d'autres, jusqu'à **3 niveaux** sous la conversation principale |
| Outils de chacun | Chaque agent n'a que les outils listés dans son champ `tools` : le programmateur n'a que la création **en relecture** dans Metricool, le publicitaire que la lecture Supermetrics, etc. |
| Chargement | Les définitions d'agents sont lues au **démarrage de la session** : toute modification demande un rechargement ou un redémarrage |
| Interface | Dans le Studio (pixel-agents), les sous-agents apparaissent comme des personnages à côté du chef |

Ce qui a été **réellement fait** le 12/11/2026 : une mission de test confiée au `stratege` (idées et calendrier SASOMA), voir `brouillons/`.
Les autres spécialistes n'ont pas encore travaillé : ils dépendent de la validation de Ben (portes) et de comptes qui n'existent pas encore.

## 2. Mémoire : trois niveaux

| Niveau | Où | Contenu | Qui écrit |
|---|---|---|---|
| **Mémoire personnelle de l'agent** (`memory: project`) | `.claude/agent-memory/<agent>/MEMORY.md` | Ce que cet agent a appris : refus de Ben et pourquoi, préférences de style, erreurs à éviter | L'agent lui-même |
| **Savoir partagé** | `knowledge/` | Chiffres sourcés, niveaux de preuve, leçons de toute l'équipe (`knowledge/lecons.md`) | Le chef, après relecture |
| **Fiches clients et journal** | `clients/`, `production/quests.jsonl` | Faits sur chaque client, état réel des missions et XP | Ben, le moteur de quêtes |

Détails vérifiés : à chaque lancement, l'agent reçoit **les 200 premières lignes ou 25 Ko** de son `MEMORY.md`, avec l'instruction de le tenir à jour.
La mémoire d'un agent est **cloisonnée** : un agent ne lit pas celle d'un autre. C'est pour cela que le savoir commun est dans `knowledge/`, lu par tous.

Points d'attention :
- Activer `memory` donne automatiquement à l'agent les outils Read, Write et Edit (pour gérer sa mémoire). Le programmateur et l'analyste, qui devaient
  être « presque en lecture seule », peuvent donc écrire des fichiers du projet. Le garde-fou reste que **rien ne part sans Ben** : ils n'ont toujours
  aucun outil de publication.
- La mémoire est du texte que l'agent écrit lui-même : elle peut contenir une erreur. Ben ou le chef la relit régulièrement. On n'y note jamais de fait de marché non sourcé.
- Les agents ne gardent rien d'une conversation à l'autre sans cette mémoire : c'est elle qui crée l'expérience cumulée.

## 3. « Le meilleur CM d'Afrique » : ce que la recherche impose

Le savoir est dans `knowledge/afrique-de-l-ouest.md`. Trois enseignements qui changent la façon de travailler :

1. **Facebook d'abord** : 4,25 millions d'audience publicitaire au Burkina contre 211 000 pour Instagram (DataReportal, 05/11/2026). Disperser l'énergie sur
   Instagram au départ serait une erreur.
2. **On mesure ce qu'on ignore** : l'audience de TikTok, de WhatsApp et de YouTube au Burkina n'est pas dans cette source. Le meilleur CM ne devine pas : il teste
   et lit Metricool. Cela rend urgente la connexion d'un premier réseau (TODO).
3. **Les affirmations d'agences ne sont pas des preuves** : « 3 à 5 fois plus d'engagement avec les langues locales » est une hypothèse à tester, pas une promesse.

Ce qui distinguera réellement le service : la rigueur (faits vérifiés, vraie photo), la régularité, des essais mesurés chaque mois et une mémoire qui s'améliore.

## 4. À faire
1. Redémarrer la session avec `claude --agent chef-de-studio` pour activer la mémoire des agents (les définitions modifiées ne sont pas relues en cours de route).
2. Vérifier après une vraie mission que `.claude/agent-memory/<agent>/MEMORY.md` est bien créé et relu.
3. Connecter un réseau de SASOMA à Metricool pour remplacer les hypothèses d'heures par des mesures.
4. Faire relire par Ben le brouillon d'idées (porte 1).
