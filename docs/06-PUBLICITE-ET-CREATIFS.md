# 06. Publicité et créatifs : outils et règles

Priorité décidée par Ben le 12/11/2026. Ce fichier part de l'**état réel** des outils connectés, relevé le 12/11/2026
par des appels en lecture seule (aucune dépense, aucune création).

## 1. État réel des outils (12/11/2026)

| Outil | Ce qu'il fait pour nous | État constaté | Ce qui manque |
|---|---|---|---|
| **Supermetrics** (connecté à Claude) | Lire les chiffres pub et créer ou modifier des campagnes Facebook/Instagram (FA) et TikTok (TIK), aussi Google Ads | Tous les connecteurs (FA, TIK, Facebook Insights, Instagram Insights, TikTok Organic) sont **NOT_AUTHENTICATED** | Que Ben connecte ses comptes (lien de connexion fourni par l'outil), puis active l'accès en écriture dans le Hub Supermetrics, par compte pub |
| **Metricool** | Programmation des posts organiques, statistiques | Une marque existe mais **aucun réseau n'y est connecté** | Que Ben connecte au moins une page (lien : https://app.metricool.com/brands/connections?blogId=7138443) |
| **Higgsfield** | Images et vidéos générées, TikTok | Plan **gratuit, 0 crédit** | Tout usage exige un achat de crédits |
| **Orshot** | Modèles d'image et de vidéo rendus en série, publication | Plan **gratuit : 100 crédits par mois, 0 utilisé** ; vidéo incluse ; 1 membre, 1 espace de travail | Rien pour démarrer (1 image = 1 crédit, 1 seconde de vidéo = 1 crédit) |
| ElevenLabs, Adobe Express, HyperFrames, VidIQ, Descript | Voix, retouche, montage, mots-clés | **Non vérifiés ce jour** (crédits et plan inconnus) | Vérifier le solde de chacun avant usage |
| Connecteurs demandant une autorisation (Adspirer, Ryze AI Meta/Google Ads, TikTok for Business, Motion Creative Analytics) | Gestion pub et analyse de créatifs | **Non autorisés**, impossible depuis cette session | Autorisation par Ben dans les réglages de connecteurs claude.ai si on les veut |

## 2. Gestion de la publicité

### Ce que Supermetrics permet (d'après son guide officiel lu le 12/11/2026)

- Créer et modifier campagnes, ensembles de publicités et publicités sur Meta (Facebook + Instagram) et TikTok.
- **Toute nouvelle campagne est créée en pause.** Chaque modification est montrée pour confirmation avant d'être
  appliquée, et un historique avec annulation est tenu.
- Objectifs Meta : trafic, engagement, prospects, ventes, notoriété. Les publicités « click-to-message » ouvrant
  **WhatsApp**, Messenger ou Instagram Direct sont supportées (destination `WHATSAPP`), ce qui peut convenir à des clients
  dont le contact passe par WhatsApp (à confirmer client par client).
- Simulations : `forecast`, `reach_estimate` et `campaign_planner` (ce dernier en euros seulement, d'après l'outil).
- Rapports : performance par campagne, créatif et audience, utilisables pour le bilan mensuel.

### Coûts et conditions de Supermetrics

- Plans Starter et Growth payants (carte), Enterprise sur devis. Le prix dépend du nombre de sources de données, de
  comptes par source, d'utilisateurs et de destinations, **pas du nombre de clients**. Prix à lire sur
  https://supermetrics.com/pricing (je ne cite aucun montant).
- **Essai de 14 jours sans carte**, fin sans prélèvement.
- Chaque compte publicitaire connecté compte comme un compte (par source). Les connecteurs de données publiques sont
  illimités.
- L'accès en écriture est activé par l'équipe, dans le Hub, avec le **même e-mail** que celui de la connexion Claude.
- Ben doit avoir un rôle d'édition sur le compte pub et sur la Page (au moins « Annonceur » côté Meta).

### Règles pour toute publicité (à respecter pour chaque client)

1. **Le compte publicitaire et le moyen de paiement appartiennent au client.** Le budget est payé directement par lui.
2. Aucune campagne n'est activée sans l'**accord écrit de Ben**. Claude crée en pause, décrit, puis Ben active.
3. **Plafond de budget quotidien et total fixé par écrit** avec le client avant création.
4. Mêmes règles qu'en organique : vraie photo du produit, aucun fait inventé, aucun avis négatif, aucun logo généré.
5. Objectif unique par campagne, mesure choisie avant le lancement (messages reçus, clics, appels).
6. Bilan à la fin de chaque campagne avec les chiffres réels du compte (jamais d'estimation présentée comme résultat).
7. Catégories spéciales (logement, emploi, crédit, social) : déclaration obligatoire côté Meta ; ne s'applique pas à
   SASOMA (lubrifiants), à confirmer pour d'autres clients.

### Processus d'une campagne

```
Brief client -> Objectif + budget plafonné -> Créatifs validés (porte 2) -> Création en PAUSE -> Revue de Ben -> Activation (accord écrit) -> Suivi à J+3 et J+7 -> Bilan
```

## 3. Créatifs

### Règle absolue

Le bidon Petrovöll (et tout produit client) est une **vraie photo**. L'IA ne le génère ni ne le redessine. Conséquence :
le « Ads Studio » de Higgsfield, qui refabrique le produit à partir de photos, **ne sert pas** pour les bidons ni pour les
produits de nos clients. Il peut servir pour de l'ambiance sans produit, après annonce du coût.

### Chaîne de production

| Besoin | Outil | Coût connu | Remarque |
|---|---|---|---|
| Photo réelle du produit | Ben (appareil photo) | 0 | Obligatoire |
| Détourage, fond, retouche | PhotoCraft (local), Adobe Express/Firefly | 0 en local ; Adobe : plan à vérifier | La photo reste la vraie photo |
| Visuels en série et variantes de format | **Orshot** (modèles) | 100 crédits gratuits par mois | 100 images, ou environ 6 vidéos de 15 s par mois |
| Motion, logo animé, vidéo courte | Studio de Ben (EffectCraft, FilmCraft, VectorCraft, skills motion) | 0 | Priorité : déjà maîtrisé et gratuit |
| Voix off | ElevenLabs | Crédits (solde inconnu) | Texte validé d'abord |
| Sous-titres, clips courts | Descript, CapCut | Plan gratuit rapporté | À vérifier |
| Décor sans produit | Unsplash (gratuit), Higgsfield (0 crédit aujourd'hui) | Unsplash 0 | Source des photos notée |
| Mesure des créatifs | Supermetrics (rapport par créatif), Metricool | Selon plan | Après connexion des comptes |

### Formats

- Carré 1:1 (fil), vertical 9:16 (stories, Reels, TikTok), portrait 3:4 (fil). 4:5 n'est pas proposé par Higgsfield Ads
  Studio ; on produit les formats dans le studio de Ben ou avec Orshot.
- Une version par format, pas de recadrage forcé d'un format à l'autre.

### Génération vidéo/image par IA : coût Higgsfield et alternatives (relevé du 12/11/2026)

Higgsfield (prix en dollars, hors taxes, plan actuel de Ben : gratuit, 0 crédit) :

| Plan | Crédits par mois | Prix | En FCFA (580 FCFA/$) |
|---|---|---|---|
| Plus | 1 000 | 39 $ par mois, ou 29 $ par mois facturé à l'année | ~22 600 ou ~16 800 |
| Ultra | 3 000 | 129 $ par mois (79 $ le 1er mois en promo), ou 65 $ par mois facturé à l'année | ~74 800 (~45 800 le 1er mois) ou ~37 700 |
| Essai | 3 jours | 0 $ avec carte, puis prélèvement automatique de 79 $ puis 129 $ par mois si non annulé | |

Coût par génération : Seedance 2.0 5 s 720p = 30 crédits ; Seedance 2.5 5 s 720p = 35 crédits (30 s = 210) ; image Nano
Banana Pro = 2 crédits. Avec 1 000 crédits et 3 essais par clip utilisable, il reste environ 11 clips de 5 s par mois.

Alternatives (sources tierces, à confirmer dans chaque appli) :

| Option | Origine | Gratuit | Limites |
|---|---|---|---|
| Dreamina (Seedance) | ByteDance / CapCut | Crédits quotidiens (120 par jour rapporté pour comptes américains) | Disponibilité au Burkina inconnue ; filigrane non précisé ; usage commercial « selon conditions » |
| Kling | Kuaishou | Rapporté 66 crédits par jour, mais une source de novembre 2026 dit que l'allocation a été supprimée | Gratuit : filigrane, 720p, non commercial |
| Hailuo (MiniMax) | MiniMax | Crédits de bienvenue à durée limitée | Filigrane ; données possiblement traitées en Chine |
| Vidu | Shengshu | Petits crédits d'inscription | Filigrane, non commercial |
| Wan 2.2 (local) | Alibaba, licence Apache 2.0 | Illimité, sans filigrane, commercial permis | Exige une carte NVIDIA (8 Go minimum avec le modèle 5B, 24 Go pour le 14B). **Le PC de Ben a seulement une Intel UHD 620** : impossible en local ; GPU loué en ligne ≈ 0,89 $ de l'heure (RTX 4090) |
| Qwen-Image | Alibaba, Apache 2.0 | Gratuit en local | 16 Go de VRAM minimum ; fort pour le texte dans l'image, mais notre règle interdit le texte de marque généré par IA |
| Google Flow (non chinois) | Google | 50 crédits par jour | Environ 5 clips par jour avec Veo 3.1 Lite |

Higgsfield revend lui-même des modèles chinois (Seedance, Kling, Seedream, Wan) : passer directement par leurs offres
gratuites évite la marge, mais fait perdre l'interface unique et la connexion TikTok.

Règle liée : animer la photo d'un bidon avec une IA image vers vidéo fait redessiner le bidon et son texte. Interdit
pour le produit ; autorisé seulement pour décor, ambiance et transitions, le produit réel étant ajouté par les outils du studio.

### Test de créatifs

Pour chaque campagne : 2 ou 3 variantes d'accroche sur le même visuel validé, budget partagé, comparaison à J+3 puis
décision. Les seuils de décision sont à fixer avec le premier jeu de données réel.

## 4. Coûts à prévoir (aucun montant inventé)

| Poste | Qui paie | Montant |
|---|---|---|
| Budget pub (Meta, TikTok) | Le client | Fixé par campagne |
| Supermetrics (après essai de 14 jours) | Ben, intégré au prix du service | À lire sur la page de prix |
| Crédits Higgsfield | Ben, si utilisé | À acheter, solde 0 |
| Crédits ElevenLabs, Adobe, Descript | Ben | À vérifier |
| Orshot | Ben | 0 tant que moins de 100 crédits par mois |

## 5. Recommandation de démarrage

1. **Créatifs d'abord avec le studio de Ben et Orshot** (coût 0 connu).
2. **Pub avec Supermetrics en essai de 14 jours**, lancé seulement la semaine où une première campagne est prête,
   pour ne pas gaspiller l'essai.
3. Avant cela, **créer les comptes SASOMA** et connecter Metricool et Supermetrics.
4. Décider de payer Supermetrics, ou de gérer les pubs à la main dans Meta Ads Manager (gratuit, mais sans l'aide de
   Claude pour créer et rapporter), après le premier bilan.

## 6. Questions ouvertes

- Budget pub réel de SASOMA et de chaque client, et devise du compte pub (le planificateur est en euros).
- SASOMA possède-t-elle un compte publicitaire Meta et un moyen de paiement valide ?
- Les clients veulent-ils des messages WhatsApp, des appels, des visites en magasin ou du trafic site ?
- Acceptation de Ben pour acheter des crédits Higgsfield, et pour quel usage précis.
