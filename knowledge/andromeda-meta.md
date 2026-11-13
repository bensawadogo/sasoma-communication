# Andromeda (Meta) : ce qui est confirmé et ce qui ne l'est pas

Lu le 13/11/2026 sur les pages officielles de Meta (billets d'ingénierie et pages « Meta for Business »). À relire avant chaque campagne : Meta change vite, et Andromeda est en évolution.
Légende : **[Meta]** écrit par Meta · **[Tiers]** avis de praticiens ou d'agences, jamais une règle de Meta · **[Inconnu]** introuvable.

## Ce que c'est [Meta]
- Andromeda est le système de Meta pour la **première étape de la diffusion** (la « récupération », *retrieval*). Elle choisit **quelques milliers de publicités** parmi **des dizaines de millions** de candidates, **avant** le classement et l'enchère. Une annonce qui n'est pas retenue à cette étape ne passe pas à l'enchère.
  Source : [Meta Andromeda, 02/12/2024](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/).
- Elle remplace des étapes séparées et de nombreuses règles écrites à la main par un réseau de neurones profond avec un index hiérarchique. But affiché : des publicités plus personnalisées.
- Gains annoncés : **+6 % de rappel** (déploiement Instagram et Facebook) et **+8 % de qualité des publicités** sur des **segments sélectionnés** (2024). Billet d'octobre 2026 : **+2,4 % de conversions sur Facebook depuis 2025**, attribués à Andromeda, **sans méthode de mesure indiquée**.
  Source : [Meta Andromeda, 28/10/2026](https://engineering.fb.com/2026/10/28/ml-applications/meta-andromeda-next-gen-ads-retrieval-gpu-co-design/).
- Le billet de 2026 dit que les annonceurs en profitent **automatiquement** et que l'IA générative et Advantage+ ont fait grossir le nombre d'annonces candidates. Il ne contient **aucune règle précise sur les créations**.
- Chiffres qui **ne sont pas ceux d'Andromeda** : le +22 % de ROAS du billet de 2024 concerne des annonceurs qui n'utilisaient pas Advantage+ creative et ont activé le ciblage par IA ; le +7 % de conversions avec génération d'images est une **estimation** de Meta.

## Ce que Meta recommande aux annonceurs (diversification créative) [Meta]
- Définition : une large gamme de créations aux **thèmes, messages et visuels variés**, pour toucher différents segments ; importer plusieurs créations aux messages différents pour que l'IA de Meta les teste. Source : [The Creative Advantage](https://web.facebook.com/business/news/the-creative-advantage-unlocking-the-power-of-diversification-with-meta-andromeda?_rdc=1&_rdr).
- Trois étapes ([Three steps](https://web.facebook.com/business/news/three-steps-to-optimize-your-performance-with-creative-diversification?_rdc=1&_rdr)) :
  1. **Lancer de nouvelles annonces chaque semaine** (rythme adaptable à ses moyens) ; garder **au moins 20 annonces diversifiées** et consacrer **20 à 30 % du budget** aux tests. **Attention : ces chiffres sont écrits pour les campagnes Advantage+ shopping (ventes en ligne avec catalogue).** Ils ne sont pas écrits pour une page de distributeur avec des messages WhatsApp.
  2. **Réunion et brief créatif chaque semaine** : quelles annonces marchent, pourquoi, quelle nouvelle audience, quelle direction.
  3. **Plusieurs variantes** plutôt qu'une annonce parfaite ; **personas** selon les besoins et les freins à l'achat ; annonces partenaires avec un créateur (−19 % de coût par acquisition en moyenne selon une étude citée par Meta).
- Les pourcentages cités par Meta (−9 % de coût par action, +11 % de clics avec génération d'images, etc.) sont des **moyennes sans méthode** : on ne les promet jamais à un client.

## Avis de praticiens [Tiers] (utiles, jamais présentés comme des règles de Meta)
- Deux images quasi identiques n'apportent pas de diversité ; varier le **message, le problème traité, le persona, le format** (vidéo courte, image, carrousel ; 9:16 et 4:5).
- Ne pas multiplier les annonces sans raison : aucun nombre optimal n'est publié. Des guides parlent de 10 à 15 créations vraiment distinctes ; c'est leur repère, pas celui de Meta.
- Commencer petit, regrouper les campagnes plutôt que les multiplier. Un « score de diversité » dans le Gestionnaire de publicités est cité par un blog : **non confirmé** par la documentation de Meta.
- Source de lecture : [Jon Loomer](https://www.jonloomer.com/meta-andromeda-creative-diversification/) (annonceur reconnu, son texte distingue ce que Meta confirme de ce qu'il interprète).

## Inconnu au 13/11/2026
- Nombre minimal ou optimal de créations pour une **petite campagne** (messages WhatsApp, génération de contacts) : aucun chiffre officiel.
- Comportement d'Andromeda **au Burkina Faso** ou en Afrique de l'Ouest : rien d'écrit par Meta.
- Façon dont le système juge que deux annonces « se ressemblent » : Meta ne l'explique pas.
- Effet de chaque amélioration automatique d'Advantage+ sur une image réelle de produit.

## Conséquences pour le studio (règles du studio, pas de Meta)
1. **La diversité vient des scènes, personnes, lieux, messages et formats, générés par IA ou réels** (Ben n'a pas de caméra). Limite absolue : jamais un bidon, une étiquette, un logo ou un texte de marque généré par IA ; le produit est incrusté depuis une vraie image.
2. **Les améliorations génératives d'Advantage+ (arrière-plan généré, retouche d'image, génération de texte)** : désactivées par défaut sur toute image où le produit apparaît (risque de déformer l'étiquette). Ben décide après un essai qu'il a regardé.
3. Pas de promesse de performance ni de portée à un client : les chiffres de Meta sont des moyennes publiées par Meta.
4. Une campagne payante sans plan de suivi du traceur n'est pas lancée.
