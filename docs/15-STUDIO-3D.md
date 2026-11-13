# Le Studio en 3D (13/11/2026)

## Ce que c'est
Un bureau 3D dans le navigateur (three.js, licence MIT), à la place du bureau en pixels. Même données : ce sont les mêmes agents et les mêmes états que le bureau 2D. Le bouton « 2D / 3D » en haut à droite passe de l'un à l'autre (le choix est gardé par navigateur ; si le navigateur ne sait pas faire de WebGL, le 2D reste).

## Ce qu'on y voit
- Une salle de travail avec 12 bureaux, un couloir, une porte, un tableau de missions, et le **salon** (canapé, fauteuils, tapis, lampe, bar à café).
- **Chaque agent est un personnage** avec son nom au-dessus. Il entre par la porte, marche jusqu'à son bureau et tape (l'écran s'allume) tant qu'il travaille. **Quand son tour est fini, il quitte son bureau et va au salon** (il s'assoit ou se met au bar) et attend qu'on lui parle. Son étiquette dit « tour fini » (« au travail » sinon) et un losange orange apparaît au-dessus de lui (vert quand il travaille). **« Tour fini » n'est pas une porte de Ben** : une porte n'existe que dans le moteur de quêtes (voir plus bas). Si Ben lui écrit, il retourne à son bureau.
- Les aides (sous-agents) apparaissent à la porte, travaillent, puis vont au salon et repartent après 45 secondes.
- Clic ou toucher sur un personnage : la fenêtre de discussion s'ouvre (la même que dans le bureau 2D).
- Souris : clic gauche pour tourner, molette pour zoomer, clic droit pour déplacer. Téléphone : un doigt tourne, deux doigts zooment et déplacent. Un téléphone tenu droit voit la salle par son petit côté pour qu'elle tienne dans l'écran.
- `?demo3d` à la fin de l'adresse montre une équipe fictive de 11 personnes, sans lancer d'agent (pour regarder le rendu).

## Lien avec la logique métier (`docs/08`)
- Les règles (ordre des étapes, 3 portes réservées à Ben, règle du bidon, coût annoncé, journal qui fait foi) restent dans le serveur, `studio/server/src/quests/` : le 3D n'y touche pas et ne peut pas les contourner. Il n'écrit rien dans le moteur ; il le lit.
- **Le tableau sur le mur de gauche est le vrai tableau des missions** : il affiche, d'après le journal, combien de missions attendent à la porte 1 (calendrier), la porte 2 (contrôle qualité) et la porte 3 (envoi), en couleur quand il y en a. Toucher le tableau ouvre le panneau Quêtes. Sans jeton, il affiche « - ».
- **Pas encore fait** : les agents n'envoient pas leurs étapes terminées au moteur (donc pas d'XP gagnée par les agents), les zones nommées de `docs/08` §5 (salle des idées, atelier visuel…) n'existent pas dans la salle, et le niveau, l'XP et les badges ne sont pas affichés dans la scène (ils sont dans le panneau Quêtes).

## Honnêteté sur le « AAA »
C'est une 3D **stylisée** (personnages arrondis, éclairage doux, ombres, écrans qui s'allument), dans l'esprit des Sims. Ce n'est pas du rendu de jeu AAA : ceux-là demandent des moteurs lourds (Unreal, Unity), des modèles et animations faits par des équipes, et ne tournent pas dans Safari sur iPhone. Pour monter d'un cran sans changer de méthode : modèles de personnages et de meubles dessinés sur mesure (format glTF), textures, lumière plus travaillée. Cela demande de vrais fichiers 3D (à créer ou à acheter avec licence commerciale vérifiée).

## Limites connues
- Vérifié : rendu et déplacements sur le PC (Chrome/Brave), cadrage téléphone dans un cadre de 390 px de large. **Pas vérifié** : fluidité sur le PC de Ben et sur l'iPhone, clic sur un vrai agent (il faut un agent lancé avec « + »).
- Le navigateur de test tournait en arrière-plan (environ 1 image par seconde, donc mouvements au ralenti) : la vitesse réelle reste à voir. Le moteur baisse seul la résolution puis coupe les ombres si l'écran est lent.
- Les noms viennent du serveur : un agent lancé par « + » s'appelle « Agent N » tant qu'il n'a pas de nom d'équipe.
- Les personnages se croisent sans se contourner (pas de gestion des collisions entre eux).

## Fichiers
`studio/webview-ui/src/scene3d/` : `layout.ts` (plan, trajets, testé), `characterRig.ts` (personnage et animations), `officeBuilder.ts` (salle), `Studio3D.tsx` (scène, équipe, caméra, clic), `useStudioActors.ts` (données), `demoActors.ts`, `ViewToggle.tsx`. Serveur : `GET /api/chat` (liste des agents, derrière le jeton), test dans `chatRoutes.test.ts`.
