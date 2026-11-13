# Jeu de test maison : choisir le modèle de chaque agent sur nos vraies tâches

Aucun benchmark public ne mesure le community management, le français du Burkina, ni les langues locales (voir `docs/19`). Ce jeu de test les remplace : il compare **des modèles sur nos tâches**, avec **ta** note.

## Lancement automatique (une fois la clé OpenRouter posée, `docs/20`)
1. `node scripts/delegue-ia/lancer-eval.mjs` : estime le coût maximal des 27 appels (environ 0,66 $) sans rien envoyer.
2. Après l'accord de Ben sur ce montant : `node scripts/delegue-ia/lancer-eval.mjs --oui 0.70` (ou `--agent <nom>` pour un seul agent).
3. Les réponses arrivent **sans nom de modèle** (A, B, C mélangées) dans `evals/resultats/<agent>/`, avec une fiche `notes.md` à remplir. Ben note, puis seulement après ouvre `_CLE.json`.
Les tâches et leurs données d'exercice sont dans `taches.json`. `veilleur` et `programmateur` n'y sont pas : ils ont besoin d'outils (recherche web, Metricool) que la délégation ne donne pas, ils restent sur Claude. Le dossier `resultats/` n'est pas poussé sur GitHub (données de clients).

## Méthode à la main (une heure, coût de quelques centimes)
1. Pour un agent, prends sa tâche dans `jeu-de-test.md`.
2. Lance la même tâche avec 2 ou 3 modèles (profil `eco`, `equilibre`, `max` : `node scripts/profil-modele.mjs <profil>`, ou un autre outil généré par `node scripts/exporter-agents.mjs`). Enregistre chaque réponse dans `evals/resultats/<agent>-<modele>.md`.
3. **À l'aveugle** : renomme les fichiers A, B, C avant de noter, pour ne pas juger sur le nom.
4. Note chaque réponse de 0 à 2 sur les 5 critères ci-dessous. Le total sur 10 décide.
5. Le modèle **le moins cher** dont le total est à **1 point ou moins** du meilleur gagne. Il est inscrit dans `config/modeles.json`.

## Les 5 critères (0 = non, 1 = en partie, 2 = oui)
1. **Faits** : rien d'inventé, tout est dans les documents fournis, un trou signalé plutôt qu'une invention.
2. **Règles** : vraie photo, pas de logo ni de texte de marque IA, aucun avis négatif, aucune promesse de résultat, rien envoyé.
3. **Langue et ton** : français naturel, au ton de la fiche client, phrases adaptées au public.
4. **Utilité** : directement utilisable, complet, au bon format.
5. **Sobriété** : pas de remplissage, pas de répétition ; tient dans la longueur demandée.

## Règles du jeu
- Le contrôleur (Opus) peut préparer une première notation, mais **c'est toi qui décides** (porte 2 de l'évaluation).
- Un modèle qui viole une règle absolue (critère 2 à 0) est éliminé pour cet agent, quel que soit son total.
- Refaire le test quand un nouveau modèle sort ou quand les prix changent (la date du dernier test est dans `resultats/DATE.md`).
- Ne jamais envoyer de données confidentielles d'un client à un service dont les conditions n'ont pas été lues (voir `docs/19`, section confidentialité).
