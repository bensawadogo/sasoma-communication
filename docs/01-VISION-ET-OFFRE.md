# 01. Vision et offre

## Positionnement

« Full IA » : Ben utilise de vraies IA génératives connectées (pas seulement des modèles de texte gratuits) pour
produire du contenu à qualité de studio, avec une règle de confiance : **le produit du client est toujours une vraie
photo**. L'IA sert pour les idées, les scénarios, le décor, la voix, le montage et l'analyse.

Différence avec un CM classique : contenu motion et visuel déjà maîtrisé (studio de Ben), processus de validation
écrit, et option de formation pour que le client ne dépende pas d'une seule personne.

## Ce qu'on ne fait pas (décisions prises le 12/11/2026)

- **Pas de plateforme à nous.** Raisons : validations Meta et TikTok de plusieurs semaines, licences (AGPL pour
  Postiz, licence « Sustainable Use » pour n8n), hébergement et maintenance. Voir `docs/02-OUTILS.md`.
- **Pas d'abonnement imposé.** Les entreprises visées le refusent souvent. Le client paie un service, pas un logiciel.
- **Pas de serveur ni d'outil payant par défaut.**
- Le **bot WhatsApp (AfriBot)** est un projet séparé, géré par un autre agent. Ben dira quand il est fini.

## Les offres

Seul le prix SASOMA est décidé. Les autres sont des **hypothèses à tester avec 2 ou 3 clients**.

| Étape | Offre | Paiement | Prix |
|---|---|---|---|
| 0 | Logo animé offert | Gratuit | 0 |
| 1 | **Pack Lancement** : création des pages, charte, 1 mois de contenu (calendrier, histoires, visuels) | Une fois | À fixer |
| 2 | **Mois à la carte** : gestion complète d'un mois | Début de mois, sans engagement | SASOMA : 50 000 à 80 000 FCFA. Autres : à fixer |
| 3 | **Formation de la secrétaire** (voir `docs/04`) | Une fois par entreprise | À fixer |
| 4 | **Bilan et validation mensuelle** (relecture, conseils, calendrier du mois) | Petit montant mensuel | À fixer |

Le budget publicitaire (boost Facebook) est toujours séparé et payé directement par le client.

### Niveaux de service (pour le même client)

| Niveau | Contenu | Qui publie |
|---|---|---|
| Autonomie | Formation, modèles, calendrier du mois, bilan | La secrétaire |
| Accompagné | Idées, visuels et motion prêts, relecture avant mise en ligne | La secrétaire, avec validation de Ben |
| Complet | Tout est géré | Ben |

## Comment fixer les prix (méthode)

`prix = (heures de Ben × son tarif) + crédits d'outils + part d'outil de programmation + marge`

Il manque deux chiffres à Ben pour calculer : ses heures disponibles par mois, et son revenu visé.

## Le risque à surveiller

La formation peut rendre le client autonome et réduire les revenus récurrents. Réponse prévue : le calendrier du mois,
les visuels motion et le bilan restent le produit de Ben ; la secrétaire exécute dans un cadre que Ben prépare.

## Mode d'entrée des clients

Logo animé offert, puis proposition du pack Lancement. Le prospect doit voir un échantillon réel de ce qu'il aura.
La liste des entreprises concernées et leur situation actuelle sont à renseigner dans `clients/`.
