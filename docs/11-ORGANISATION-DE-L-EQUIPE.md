# 11. Organisation de l'équipe d'agents

Mise à jour du 12/11/2026. L'équipe compte 12 agents dans `.claude/agents/`. **Ben décide, le chef-de-studio coordonne, les spécialistes exécutent.**
Les définitions sont lues au démarrage : lancer avec `claude --agent chef-de-studio` pour que tout (outils et mémoire) soit actif.

## 1. Organigramme

```
                              BEN  (décideur : portes 1, 2, 3)
                                │
                        chef-de-studio  (Lead : découpe, délègue, assemble, consolide les leçons)
        ┌─────────────┬─────────┴──────────┬──────────────┬───────────────┐
     SAVOIR        CONTENU            QUALITÉ        DIFFUSION       DÉVELOPPEMENT
     veilleur      stratege           controleur     programmateur   formateur
                   scenariste                        publicitaire    commercial
                   createur-visuel                   analyste
```

## 2. Rôles, outils et limites

| Agent | Rôle en une phrase | Outils réels | Ce qu'il ne peut pas faire |
|---|---|---|---|
| **chef-de-studio** | Reçoit un thème, délègue, assemble, présente à Ben | Délégation aux 11 spécialistes, fichiers du projet | Publier, envoyer, valider à la place de Ben |
| **veilleur** | Vérifie les faits, suit plateformes et marché, source tout | Recherche web, Firecrawl, fichiers | Contacter, acheter, créer un compte |
| **stratege** | Idées, calendrier, heures | Web, Metricool (lecture), fichiers | Publier |
| **scenariste** | Scénarios, légendes, mots-clés | Fichiers | Générer, publier |
| **createur-visuel** | Briefs visuels, gabarits | Orshot (lecture, aperçu), Unsplash, fichiers | Générer un produit/logo, rendre des médias payants |
| **controleur** | Pré-contrôle de la porte 2 (9 points, sources) | Fichiers | Valider, corriger, publier |
| **programmateur** | Met en file dans Metricool **en relecture** | Metricool : création en relecture, lecture | Publication directe, modification |
| **traceur** | Plan de suivi et kit de pixel Meta sur mesure par client (fichiers dans `production/pixels/<client>/`) | Fichiers, pages officielles de Meta (lecture) | Créer quoi que ce soit chez Meta, installer sur un site, envoyer |
| **publicitaire** | Brief de campagne, lecture des chiffres pub | Supermetrics (lecture), fichiers | Créer ou modifier une campagne |
| **analyste** | Bilan mensuel avec chiffres réels | Metricool et Supermetrics (lecture), fichiers | Écrire sur les comptes |
| **formateur** | Carnet de prompts, leçons, mini-jeux | Fichiers | Envoyer quoi que ce soit |
| **commercial** | Propositions, grille de prix, contrat simple, fiches prospects | Web, fichiers | Envoyer, contacter, fixer un prix « décidé » |

Les limites sont des **limites d'outils** (le champ `tools`), donc elles tiennent même si une consigne est mal suivie. Activer la mémoire donne en plus à chaque agent
Read, Write et Edit sur les fichiers : ils n'ont toujours aucun outil de publication.

## 3. Flux de travail d'un thème (qui passe la main à qui)

| # | Étape | Qui | Entrée | Sortie | Porte |
|---|---|---|---|---|---|
| 1 | Thème | Ben | Une phrase | Brief du chef | |
| 2 | Faits et sources | veilleur | Brief, `knowledge/`, pages Petrovöll sauvegardées | Constat sur les sources, faits citables | |
| 3 | Idées et calendrier | stratege | Faits, fiche client | `brouillons/<client>-idees-vN.md` | **Porte 1 : Ben** |
| 4 | Scénarios et légendes | scenariste | Calendrier validé | Texte par post | |
| 5 | Briefs visuels | createur-visuel | Scénarios, vraies photos de Ben | Briefs et gabarits | |
| 6 | Pré-contrôle | controleur | Post complet | Rapport `-controle` (9 points, sources, verdict) | |
| 7 | Contrôle | Ben | Post + rapport | Validé, corrigé ou refusé (motif) | **Porte 2 : Ben** |
| 8 | Mise en file | programmateur | Post validé | Post en relecture dans Metricool | **Porte 3 : Ben** |
| 9 | Pub (option) | publicitaire | Objectif, budget plafonné | Brief ; création en pause par le chef sur ordre de Ben | Ben active |
| 10 | Bilan | analyste | Chiffres réels | Bilan dans la fiche client | Ben |
| 11 | Leçons | chef-de-studio | Rapports des agents | `knowledge/lecons.md`, mémoires des agents | |

Parallèle : formateur et commercial travaillent à part, à la demande de Ben, sur les autres entreprises et la formation.

## 4. Règles d'équipe

1. **Une tâche, un propriétaire.** Le chef donne à chaque agent un brief court : client, objectif, fichiers à lire, livrable attendu, ce qui est interdit.
2. **Rien n'avance sans la porte.** Le moteur de quêtes (`docs/08`) enregistre les passages ; seul Ben ouvre les trois portes.
3. **Un agent qui ne trouve pas une source l'écrit** (« constat sur les sources ») au lieu d'inventer.
4. **Le contrôleur cherche les défauts.** Un rapport « tout est bon » sans preuve est refusé par le chef.
5. **Les leçons se partagent** : chaque agent propose, le chef consolide dans `knowledge/lecons.md` ; la mémoire personnelle de chaque agent reste la sienne.
6. **Coûts** : tout outil à crédits est annoncé à Ben avant. Les modèles externes (DeepSeek, Kimi) ne reçoivent aucune donnée privée de client (`docs/09`).
7. **Relecture humaine de la mémoire** : les mémoires sont du texte écrit par des agents ; Ben (ou le chef) les relit régulièrement et supprime ce qui est faux.

## 5. Ce qui reste à faire

- Redémarrer en `claude --agent chef-de-studio` et vérifier que les mémoires `.claude/agent-memory/<agent>/` se remplissent.
- Premier cycle complet sur un vrai post de SASOMA (veilleur → … → contrôleur → Ben), dès qu'il y a une vraie photo du bidon.
- Connecter les passages d'étape des agents au moteur de quêtes (jeton « agent »).
- Mesurer la qualité des agents : taux de refus à la porte 2 par agent, par mois.
