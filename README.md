# Projet CM : gestion des réseaux sociaux, Afrique de l'Ouest

Dernière mise à jour : 12/11/2026. Responsable : Ben. Assistant : Claude (voir `CLAUDE.md`).

## Mission

Offrir aux entreprises d'Afrique de l'Ouest un service de community management **de qualité studio**, sans abonnement
imposé et sans plateforme à installer : contenu soigné (motion, visuels, histoires), programmation fiable, et, si le
client le souhaite, formation de sa secrétaire pour qu'elle publie elle-même sous la validation de Ben.

Premier client : SASOMA (distributeur Petrovöll, lubrifiants, Burkina Faso). Les autres entreprises (logos animés
déjà offerts) viennent ensuite.

## Ce que « le meilleur projet CM de la région » doit vouloir dire

Définition de travail (à valider par Ben, voir `docs/05-VERIFICATIONS-ET-HYPOTHESES.md`) :

1. **Qualité visible** : vrais produits en photo, motion propre, charte respectée, aucune erreur de fait.
2. **Régularité** : un calendrier tenu chaque semaine, publié à la bonne heure.
3. **Contexte local** : histoires et ton adaptés au public réel de chaque client, pas du contenu générique.
4. **Autonomie sans perte de contrôle** : la secrétaire propose, Ben valide, rien ne part sans accord.
5. **Zéro charge cachée** : coûts d'outils connus, annoncés avant usage et inclus dans le prix.
6. **Résultats mesurés** : un bilan mensuel par client, avec chiffres réels tirés de Metricool.

## Organisation du dossier

| Fichier | Contenu |
|---|---|
| `TODO.md` | La liste de tâches, par phase, avec qui fait quoi |
| `docs/01-VISION-ET-OFFRE.md` | Positionnement, offres, modèle économique, règles |
| `docs/02-OUTILS.md` | Outils retenus, écartés, à vérifier, avec coûts |
| `docs/03-PROCESSUS-CM.md` | Le processus de l'idée à la publication et au bilan |
| `docs/04-FORMATION-SECRETAIRES.md` | Les IA par spécialité et le plan de formation |
| `docs/05-VERIFICATIONS-ET-HYPOTHESES.md` | Ce qui est vérifié, supposé, inconnu |
| `docs/06-PUBLICITE-ET-CREATIFS.md` | Outils et règles de la publicité payante et des créatifs (priorité du 12/11/2026) |
| `docs/07-STUDIO-INTERFACE.md` | Le Studio : interface pixel-art type Sims (fork de pixel-agents), équipe d'agents et risques |
| `docs/08-JEU-ET-LOGIQUE-METIER.md` | Gamification : le jeu comme peau du vrai processus, règles métier, Académie des secrétaires |
| `docs/09-ORCHESTRATION-MULTI-IA.md` | Claude répartit les tâches entre plusieurs IA (DeepSeek, Kimi) : recherche, politique, risques |
| `docs/10-DELEGATION-ET-MEMOIRE.md` | Comment la délégation et la mémoire des agents fonctionnent (vérifié), et ce que la recherche impose |
| `knowledge/` | Savoir partagé lu par tous les agents (chiffres sourcés, niveaux de preuve) |
| `studio/` | Copie locale de pixel-agents (MIT), à installer et personnaliser |
| `docs/11-ORGANISATION-DE-L-EQUIPE.md` | Organigramme des 11 agents, outils réels, flux de travail, règles d'équipe |
| `docs/12-TEST-IPHONE.md` + `lancer-studio.ps1` | Tester le Studio sur iPhone (Wi-Fi ou Tailscale) et script de lancement |
| `docs/22-META-ADS-ET-PIXELS.md` | Meta Ads (serveur MCP officiel, bêta), agent `traceur` pour les pixels sur mesure, ce que Ben connecte |
| `docs/21-AUTONOMIE-MULTI-OUTILS.md` | Continuer sans abonnement Claude : OpenCode, Kilo, Codex, Gemini CLI, Hermes ; mémoire commune `ETAT-DU-PROJET.md` ; sécurité de l'ordinateur |
| `docs/20-DELEGUE-IA-OPENROUTER.md` | Serveur MCP `delegue-ia` : faire travailler d'autres IA via OpenRouter (classe des données, nettoyage, plafonds, ce que Ben doit faire) |
| `docs/19-MODELES-BENCHMARKS-ET-ECONOMIE.md` | Benchmarks lus (Arena, Artificial Analysis, Vectara...), prix officiels, modèle de chaque agent, export vers OpenCode/Codex/Gemini CLI, économie, confidentialité |
| `docs/18-TUNNELS-COMPARATIF.md` | ngrok, Cloudflare, Tailscale, VS Code, zrok : limites officielles, usage commercial, recommandation |
| `docs/17-ACCES-A-DISTANCE-ET-PLUSIEURS-CLIENTS.md` | Accès de Ben de partout, secrétaires de plusieurs entreprises isolées entre elles, options Tailscale/Cloudflare/VS Code |
| `docs/16-AGENTS-OUTILS-ET-GARDE-FOUS.md` | Quel outil est branché à quel agent, ce qui spécialise chaque agent, garde-fous testés ou non, choix du modèle par agent |
| `docs/15-STUDIO-3D.md` | Le Studio en 3D : agents visibles, bureaux, salon où ils vont quand ils ont fini, limites et honnêteté sur le « AAA » |
| `docs/13-PASSAGE-EN-PRODUCTION.md` | État réel, manques et ordre de travail avant la production (HTTPS, démarrage auto, sauvegarde, tests, surveillance) |
| `recherches/` | Recherches sourcées (vendre le CM, WhatsApp, langues locales, académie et partenaires) |
| `.claude/agents/` | Les 11 agents du service CM (chef, veilleur, stratège, scénariste, créateur visuel, contrôleur, programmateur, publicitaire, analyste, formateur, commercial) |
| `clients/_MODELE-FICHE-CLIENT.md` | Fiche à remplir pour chaque nouveau client |
| `clients/sasoma.md` | Fiche de SASOMA (faits connus uniquement) |

## Règles absolues (héritées de `CLAUDE.md`)

- Le bidon Petrovöll n'est jamais généré par IA : seulement de vraies photos. Même règle pour tout produit client.
- Aucune IA ne produit un logo ou du texte de marque dans une image ou vidéo finale.
- Faits vérifiés seulement : pas de donnée produit inventée, pas d'avis négatif cité.
- **Rien n'est publié ni envoyé sans l'accord de Ben.** Programmation toujours en mode relecture.
- Aucun outil à crédits n'est lancé sans que le coût soit annoncé d'abord.
