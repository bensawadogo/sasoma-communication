# 05. Vérifications et hypothèses

Ce fichier sépare ce qui est **établi**, **supposé** et **inconnu**. À mettre à jour à chaque vérification.

## Établi (source : `CLAUDE.md`, décisions de Ben)

| Fait | Source |
|---|---|
| SASOMA est distributeur Petrovöll (lubrifiants) au Burkina Faso | CLAUDE.md |
| Site SASOMA livré et payé 150 000 FCFA | CLAUDE.md |
| Aucun compte Facebook, Instagram, TikTok de SASOMA n'existe encore | CLAUDE.md |
| Prix de gestion SASOMA : 50 000 à 80 000 FCFA par mois, boost payé séparément par SASOMA | CLAUDE.md |
| Le bidon Petrovöll n'est jamais généré par IA | CLAUDE.md |
| Outils IA connectés par MCP : Higgsfield, ElevenLabs, HyperFrames, Adobe, Metricool, Orshot, Descript, Unsplash | CLAUDE.md |
| Le bot WhatsApp (AfriBot) est traité par un autre agent | Ben, 12/11/2026 |
| Entreprises visées : refusent souvent l'abonnement ; pas de plateforme personnelle | Ben, 12/11/2026 |

## Vérifié à la source officielle le 13/11/2026

| Fait | Source | Conséquence |
|---|---|---|
| Metricool **Gratuit** : 1 marque, **20 posts programmés par mois au total** (une seule limite par plan, pas par réseau), 30 jours de statistiques, sans LinkedIn ni X | metricool.com/pricing | Un client = 20 posts par mois maximum en gratuit |
| Metricool **Starter** : 5 marques à 20 € (annuel 16 €) ou 25 $ par mois, 10 marques à 37 € (annuel 29 €) ; publication « illimitée » sous politique d'usage raisonnable ; statistiques sans limite | metricool.com/pricing | Le bon palier pour Ben dès 2 clients (≈ 13 000 FCFA par mois pour 5 marques, taux non vérifié) |
| **Inviter des personnes ou des clients dans une marque exige le plan Advanced ou Custom** (Advanced : 15 marques à 54 €, 43 € en annuel). Gratuit et Starter : un seul utilisateur | metricool.com/pricing, help.metricool.com (gestion des utilisateurs) | Impossible de donner un accès Metricool à un client ou à une secrétaire sans Advanced. Le client voit le contenu par WhatsApp ou par le calendrier de Ben |
| Pour connecter une page Facebook, le profil de Ben doit avoir le **contrôle total sur la page** (rôle Admin, ou contrôle total via Business Manager) ; l'accès au portefeuille seul ne suffit pas. Instagram : compte professionnel relié à la page | help.metricool.com (permissions Meta Business Manager) | Le client doit donner à Ben le contrôle total, pas un rôle limité |
| Un propriétaire de page peut donner accès à une agence partenaire (portefeuille Business, partenaire, tâches choisies, retrait possible à tout moment) | developers.facebook.com (business-to-business) | Le client reste propriétaire, Ben est partenaire |
| Pas de « revue d'application Meta » à faire pour ce circuit : c'est l'application Metricool (déjà validée par Meta) qui publie. La revue ne concerne que ceux qui construisent leur propre application (Postiz, n8n) | Déduction à partir des deux lignes précédentes ; la page d'aide Meta n'a pas pu être lue en entier | À reconfirmer avec la première page réelle (SASOMA) |

## Rapporté par des sources tierces (à confirmer à la source officielle)

| Affirmation | Source citée | Statut |
|---|---|---|
| Postiz Cloud : 29 / 39 / 49 / 99 $ par mois pour 5 / 10 / 30 / 100 canaux ; pas de plan gratuit ; essai 7 jours | postiz.com/pricing | ? Lu dans un extrait de recherche |
| Postiz auto-hébergé : 15 à 65 $ par mois d'infrastructure | Comparatif tiers (blotato.com) | ? |
| TikTok exige un domaine public en HTTPS pour Postiz, avec vérification par fichier | docs.postiz.com | ? |
| Publer gratuit : 3 comptes, 10 posts programmés | Zapier | ? |
| OpusClip gratuit : 60 crédits par mois, filigrane | Buffer (blog) | ? |
| Revue d'application Meta non requise si tous les utilisateurs ont un rôle sur l'application ou le Business | docs.n8n.io | ? Pas vérifié pour des pages de clients |
| Instagram : publication via l'API exige un compte professionnel relié à une page Facebook | Guide tiers (keyapi.ai) | ? |
| n8n : plus de 1 000 modèles de publication sociale ; n°13301 programme Facebook depuis Sheets avec approbation | n8n.io | Existence confirmée, fonctionnement non testé |
| WhatsApp : tarifs par message en « Reste de l'Afrique » (environ 0,0225 $ marketing, 0,004 $ utilité) | Sources tierces | ? Hors périmètre tant que le bot n'est pas fini |

## Hypothèses de travail

| Hypothèse | Pourquoi on la garde | Comment la tester |
|---|---|---|
| Un service mensuel sans engagement passe mieux qu'un abonnement | Retour de Ben sur ses prospects | Proposer le pack Lancement à 2 ou 3 clients |
| Une secrétaire formée peut produire une partie du contenu avec des modèles fixes | Idée de Ben | Premier client de formation, évaluation jour 2 |
| Le coût d'outil par client reste bas (≈ 2 850 FCFA par client pour 3 canaux sur Postiz Pro) | Calcul à partir du prix Pro, 30 canaux | Vérifier l'usage d'agence autorisé |
| « Full IA + vraie photo » est un argument de vente | Positionnement décidé le 11/11/2026 | Retour des prospects |
| WhatsApp est un canal important pour les clients | Contexte régional courant, non vérifié ici | Demander aux clients leurs canaux réels |

## Inconnus à lever (par ordre d'importance)

1. Heures de Ben disponibles par mois et revenu visé (nécessaires pour fixer les prix).
2. Liste réelle des entreprises : secteur, taille, présence actuelle sur Facebook, canal préféré des clients.
3. ~~Metricool : limites~~ fait le 13/11/2026 (voir tableau « Vérifié »). Reste : la politique d'usage raisonnable du « illimité » de Starter (texte non lu) et le taux FCFA réel.
4. Postiz Cloud : usage d'agence, nombre de comptes secrétaires.
5. Gérer des pages clientes avec le circuit Metricool : confirmé sur le papier, à reconfirmer avec la première page réelle (SASOMA).
6. Quelle langue et quel ton pour chaque public (français, langues locales).
7. Format de bilan et indicateurs retenus.
8. Statut du connecteur « Meta Ads » (autorisation non faite pour l'instant).

## Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 11/11/2026 | Prix SASOMA 50 000 à 80 000 FCFA par mois, positionnement « full IA » | Contenu fait avec de vrais outils |
| 12/11/2026 | Rôle de Claude : thème, idées, calendrier, programmation en relecture | Évite les charges et la plateforme |
| 12/11/2026 | Pas de plateforme maison, pas de serveur par défaut | Coût, licences, validations Meta/TikTok |
| 12/11/2026 | Offre multi-entreprises : packs ponctuels, mois à la carte sans engagement, formation | Les entreprises refusent l'abonnement |
| 12/11/2026 | n8n : pas pour publier maintenant ; prospection et tableau de validation en option | Il faut un publieur de toute façon |
| 13/11/2026 | « Un Metricool gratuit par client » écarté pour le service de Ben | Gratuit = 1 seul utilisateur et 20 posts par mois : Ben ne pourrait pas être invité. Plan retenu à proposer : Starter (5 marques) au nom de Ben, pages clientes données par rôle |
| 13/11/2026 | social-auto-upload non retenu ; REM sans clé peu utile | Voir `docs/14` |
