# 02. Outils

Légende : ✔ connecté et confirmé dans `CLAUDE.md` (11/11/2026) · ? à vérifier avant d'en dépendre · ✗ écarté (raison dite).
Taux de conversion utilisé : 1 $ ≈ 580 FCFA, 1 € ≈ 656 FCFA (hypothèses, à actualiser).

## Noyau du projet

| Fonction | Outil | Statut | Remarque |
|---|---|---|---|
| Idées, calendrier, scénarios, bilans | Claude (cette session) | ✔ | Sans coût supplémentaire connu |
| Programmation et statistiques | **Metricool** | ✔ | Mode relecture (`createScheduledPostForReview`), meilleure heure (`getBestTimeToPostByNetwork`). Plan gratuit **vérifié le 13/11/2026** : 1 marque, 20 posts par mois au total, 1 seul utilisateur (pas d'invité). Starter : 5 marques, 20 €/mois (25 $ au mois). Invités et clients : plan Advanced seulement. Voir `docs/05`. |
| Motion, montage, logos | Studio de Ben (EffectCraft, FilmCraft, PhotoCraft, VectorCraft, SoundCraft, FigCraft, skills motion) | ✔ local | Gratuit, sans jeton |

## Publicité payante

Voir `docs/06-PUBLICITE-ET-CREATIFS.md` : Supermetrics (connecté mais aucun compte relié, essai de 14 jours sans
carte, campagnes créées en pause) et les connecteurs Meta/TikTok qui demandent une autorisation.

## Outils IA connectés (usage à la demande, coût à annoncer avant)

| Outil | Usage | Statut | Coût |
|---|---|---|---|
| Higgsfield | Images et vidéos pub, décor, publication TikTok | ✔ | Crédits. Jamais pour le bidon ni un logo |
| ElevenLabs | Voix off, image/vidéo | ✔ | Crédits |
| HyperFrames (HeyGen) | Montage programmable | ✔ | À confirmer |
| Adobe Express / Firefly | Retouche photo, export, vectorisation | ✔ | À confirmer selon plan |
| Orshot | Modèles image/vidéo, publication directe | ✔ | Essai gratuit limité, à vérifier |
| Descript | Montage, transcription, clips courts | ✔ | Plan gratuit rapporté, à confirmer |
| VidIQ | Mots-clés, tendances, idées | ✔ (connecté) | Solde de crédits à vérifier |
| Unsplash | Photos libres de décor | ✔ | Gratuit |
| Gamma | Diaporamas (support de formation) | ✔ (connecté) | Crédits Gamma |

## Alternatives et options étudiées

| Option | Statut | Ce qu'on sait |
|---|---|---|
| Publer (plan gratuit) | ? | Rapporté : 3 comptes, 10 posts programmés (Zapier). Alternative gratuite à Metricool, à tester |
| Buffer (plan gratuit) | ? | Rapporté : 3 comptes sociaux |
| **Postiz Cloud** | ? | Pas de plan gratuit, essai 7 jours. Standard 29 $ (5 canaux), Team 39 $ (10), Pro 49 $ (30), Ultimate 99 $ (100). Pro ≈ 28 400 FCFA par mois pour 30 canaux. À vérifier : usage d'agence autorisé ? combien de comptes secrétaires ? |
| Postiz auto-hébergé | ✗ pour l'instant | Logiciel gratuit mais : domaine public en HTTPS exigé par TikTok, machine allumée en continu, validation d'application Meta, serveur estimé 15 à 65 $ par mois par un comparatif tiers. Dépense non supprimée |
| n8n | ? utile ailleurs | Beaucoup de modèles de publication existent, mais ils ont besoin d'un publieur (Meta direct, Buffer, Blotato, Postiz). Voir plus bas |
| Chatwoot, LibreChat, Mixpost | ✗ | Hors périmètre actuel (plateforme et chatbot) |
| API Meta en direct | ? | Gratuit mais exige une application Meta. Selon la doc n8n, la revue n'est pas requise si tous les utilisateurs ont un rôle sur l'application ou le Business. Non vérifié pour des pages clientes |
| Meta Ads (MCP) | ? | Seulement pour les campagnes payantes, pas pour les posts organiques. Peut exiger une autorisation non faite |

## Rôle précis de n8n

- **Pas pour publier** tant que Metricool en mode relecture suffit.
- **Utile pour** (1) un tableau de validation Google Sheets pour les secrétaires (modèle n8n n°13301 : programmation
  Facebook depuis Sheets avec approbation), (2) la prospection : `C:\AI-MASTER-MARKETING` décrit 17 workflows (découverte
  de prospects, audit de site, notation, propositions). Seul le README a été lu, rien n'a été testé.
- Licence n8n : « Sustainable Use ». Usage interne ou agence sans accès client : en général accepté. Instance partagée
  avec accès client ou revente : licence commerciale nécessaire (à confirmer avec n8n).

## Règles d'usage des outils

1. Un outil à crédits n'est lancé qu'après annonce du coût à Ben.
2. Une IA ne génère jamais le produit, le logo ni le texte de marque d'une image finale.
3. Chaque client garde la propriété de ses comptes ; Ben y accède par rôle partenaire ou invitation, jamais par mot
   de passe partagé (pratique courante, à confirmer côté Meta et TikTok).
4. Avant de dépendre d'un outil marqué ?, le vérifier à la source officielle.

## Décisions de bascule

| Condition | Action |
|---|---|
| Plus de 3 clients en Metricool gratuit | Comparer Metricool multi-marques (environ 20 à 25 $ par mois rapporté) et Postiz Cloud Pro |
| Environ 5 clients payants | Réévaluer Postiz Cloud Pro (≈ 28 400 FCFA par mois, couvert par un client à 50 000) |
| Les secrétaires ne tiennent pas le mode relecture | Tester le modèle n8n n°13301 sur une page de test |
