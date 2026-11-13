# 03. Processus CM : de l'idée au bilan

Le même processus sert pour SASOMA et pour tout client. Chaque étape a un responsable et une porte de validation.
**Rien ne sort sans la validation de Ben (porte 2).**

## Vue d'ensemble

```
1. Thème  ->  2. Idées  ->  3. Calendrier  ->  4. Production  ->  5. Contrôle  ->  6. Programmation  ->  7. Bilan
  Ben          Claude        Claude + Ben       Ben + outils      Ben (porte 2)    Claude (relecture)   Claude + Ben
```

| # | Étape | Responsable | Résultat | Porte |
|---|---|---|---|---|
| 1 | **Thème** : Ben envoie un thème (produit, saison, événement, objectif) | Ben | Un thème en une phrase | |
| 2 | **Idées d'histoires** : 8 à 12 idées avec accroche, angle et format | Claude | Liste d'idées | Ben choisit |
| 3 | **Calendrier** : jour, heure, réseau, format. Heure issue de `getBestTimeToPostByNetwork` quand disponible | Claude | Calendrier du mois | **Porte 1 : Ben approuve le calendrier** |
| 4 | **Production** : photos réelles, motion, visuels, voix, sous-titres | Ben (studio) + outils | Fichiers finaux | |
| 5 | **Contrôle qualité** : checklist ci-dessous | Ben | Pièces validées | **Porte 2 : Ben valide chaque publication** |
| 6 | **Programmation** en mode relecture dans Metricool | Claude | Posts en attente de revue | **Porte 3 : Ben envoie en revue puis confirme** |
| 7 | **Bilan** : statistiques réelles, ce qui a marché, quoi changer | Claude + Ben | Bilan du mois | Alimente le thème du mois suivant |

## Checklist de contrôle qualité (porte 2)

- [ ] Le produit montré est une **vraie photo** du client (jamais généré).
- [ ] Aucun logo ni texte de marque généré par IA dans l'image finale.
- [ ] Chaque fait (produit, chiffre, claim) est vérifié ; pour SASOMA, source dans les fiches techniques du site.
- [ ] Aucun avis négatif cité ; aucune promesse que le client ne peut pas tenir.
- [ ] Orthographe et ton relus ; langue adaptée au public du client.
- [ ] Format correct pour le réseau (ratio, durée, sous-titres si vidéo).
- [ ] Lien, numéro ou appel à l'action corrects.
- [ ] Droits OK pour les photos de décor (Unsplash : source notée) et la musique.
- [ ] Coût des crédits d'outils noté pour la facturation interne.

## Variante avec secrétaire formée

1. Ben prépare et approuve le **calendrier du mois** (étapes 1 à 3).
2. La secrétaire produit ou adapte les posts à partir de **modèles fixes** et de prompts du carnet (`docs/04`).
3. Elle les saisit dans l'outil de programmation **en mode relecture**.
4. Ben applique la porte 2 sur chaque post, puis valide.
5. Bilan mensuel fait par Ben avec elle.

## Gestion des incidents

| Situation | Action |
|---|---|
| Post publié avec une erreur de fait | Retirer ou corriger tout de suite, prévenir le client, noter dans le bilan |
| Compte client bloqué ou limité | Ne pas multiplier les tentatives, vérifier la notification officielle, informer le client |
| Outil indisponible | Reporter la programmation, jamais publier à la main sans validation |

## Mesure

À fixer avec Ben, parmi les mesures que fournit Metricool : portée, interactions, clics, messages reçus, évolution des
abonnés. Aucun objectif chiffré n'est posé tant qu'on n'a pas de point de départ réel (premier mois).
