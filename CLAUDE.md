# SASOMA-COMMUNICATION : gestion des réseaux sociaux de SASOMA

Projet séparé du site (`C:\SITE-SASOMA`, déjà livré et payé 150 000 FCFA). Ici : Facebook / Instagram /
TikTok de SASOMA (distributeur Petrovöll, lubrifiants, Burkina Faso), aucun compte créé encore.

## Comment on est arrivé là (contexte, 11/11/2026)
- Ben a offert un logo animé gratuit à SASOMA (stratégie du 06/11 : logo gratuit -> gestion de page payante).
- SASOMA a accepté que Ben gère sa page en échange.
- Prix décidé avec Ben : **50 000 à 80 000 FCFA/mois**, car le contenu est fait avec de vrais outils
  (motion, visuels soignés), pas juste un calendrier texte gratuit. Budget pub (boost Facebook) séparé,
  payé par SASOMA directement.
- Positionnement de Ben : « full IA » — utiliser les vraies IA génératives connectées, pas seulement des
  scripts gratuits, pour ce service payant.

## Outils IA disponibles (vérifiés le 11/11/2026, rien à installer : déjà connectés par MCP)
| Outil | Usage pour SASOMA |
|---|---|
| **Higgsfield** | Images/vidéos pub, product shots (bidons, moteurs), connexion directe TikTok pour publier |
| **ElevenLabs** | Génération image/vidéo + voix off pour une histoire racontée |
| **HyperFrames (HeyGen)** | Montage vidéo motion programmable (scènes, histoire) |
| **Adobe Express/Firefly** | Retouche photo, export vidéo, vectorisation |
| **Metricool** | Déjà connecté — calendrier, meilleure heure de publication, stats |
| **Orshot** | Templates image/vidéo + publication sociale directe |
| **Descript** | Montage/transcription, découpe de clips courts |
| **Unsplash** | Photos libres de décor |

**Postiz : pas installé.** Recherché le 27/10/2026 (AGPL-3.0 gratuit), mais nécessite de créer ses propres
apps Meta/TikTok (révision de plusieurs semaines côté Meta) — pas une solution immédiate.

**En local sur la machine de Ben (gratuit, sans token) :** EffectCraft, FilmCraft, PhotoCraft, VectorCraft,
SoundCraft, FigCraft + skills motion (hyperframes, gsap, three.js, motionmaxxing,
effectcraft-motion-designer, logo-animation, shot-composition...).

## Règle absolue : le bidon Petrovöll (héritée de BRIEF-MAITRE.md du site)
Le bidon n'est jamais généré par IA : uniquement de vraies photos. Aucune IA ne doit produire un bidon,
un logo ou du texte de marque dans une image/vidéo finale.

## Règles
- Faits vérifiés seulement : jamais d'avis Google négatif cité, jamais une donnée produit inventée
  (fiches techniques dans `C:\SITE-SASOMA\assets\tds\` si besoin).
- Rien n'est publié ou envoyé sans l'accord de Ben.
- Assets de marque existants : logos et motion-kit dans `C:\SITE-SASOMA\brag-output\`.

## Reprise et changement d'outil (13/11/2026)
Lis `ETAT-DU-PROJET.md` au début de chaque session et mets à jour sa section « Reprise » à la fin, puis `node scripts/relais.mjs` :
c'est la mémoire commune à tous les outils (Claude Code, OpenCode, Kilo, Codex, Gemini CLI, Hermes). Voir `docs/21-AUTONOMIE-MULTI-OUTILS.md`.

## Extension : service CM pour d'autres entreprises (12/11/2026)
Ben veut aussi gérer les réseaux d'autres entreprises (logos animés déjà offerts) et former leurs secrétaires.
Pas de plateforme maison, pas d'abonnement imposé. Documentation du projet : `README.md`, `TODO.md`,
`docs/01` à `docs/05`, fiches dans `clients/`. Les prix autres que SASOMA et les limites d'outils sont des
hypothèses : voir `docs/05-VERIFICATIONS-ET-HYPOTHESES.md` avant de les promettre à un client.

## À faire
La liste complète et à jour est dans `TODO.md`. En résumé :
- Créer les comptes Facebook / Instagram / TikTok de SASOMA (inexistants à ce jour).
- Premier calendrier de contenu (histoires/scénarios) avec les outils ci-dessus.
