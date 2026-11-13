# Tunnels pour le lien du Studio : comparatif (13/11/2026)

Demande de Ben : ngrok, et les autres alternatives gratuites. Critères : gratuit, HTTPS, **accès limité à des personnes précises** (le Studio ne doit pas être ouvert à tous), WebSocket, adresse stable, usage commercial permis, Safari sur iPhone.
Niveaux : **officiel** (page du fournisseur lue), **rapporté** (comparatif ou blog, intéressé), **non vérifié**.

## Le besoin de Ben (lien du Studio, pour lui seul)
Le Studio lit le jeton dans l'adresse et vérifie le nom d'hôte (`--allowed-host`) : une adresse **stable** évite de relancer le Studio à chaque fois. `lancer-studio.ps1 tunnel -TunnelHost <nom>` marche avec **n'importe lequel** des fournisseurs ci-dessous.

| Fournisseur | Gratuit ? | Accès restreint | Adresse stable | À savoir |
|---|---|---|---|---|
| **Port relayé par VS Code (Private)** | Oui | Oui : même compte GitHub/Microsoft (officiel) | Tant que le port n'est pas recréé | VS Code doit rester ouvert ; débit limité ; **à privilégier** |
| **ngrok (plan gratuit)** | Oui, **mais** 1 Go de transfert et **20 000 requêtes par mois**, 3 adresses actives, 1 utilisateur (officiel) | OAuth possible : **3 personnes par mois** (officiel) ; comment limiter à ton compte Google : non vérifié | **Oui** : une adresse `*.ngrok-free.app` qui persiste (officiel) | Une page d'avertissement s'affiche avant le site (cookie de 7 jours, officiel). Usage commercial du plan gratuit : **non tranché** par les pages lues |
| **Cloudflare Quick Tunnel** | Oui, **sans compte ni domaine** (officiel) | Option `--allowed-mail` : connexion par e-mail (officiel) ; sans elle, **n'importe qui avec l'adresse entre** | **Non** : l'adresse change à chaque lancement (officiel) | « Pour test et développement », pas de garantie de disponibilité (officiel) ; pas de SSE (le Studio utilise des WebSocket, non cité par la page) |
| **Cloudflare Tunnel nommé + Access** | Rapporté : gratuit sous 50 utilisateurs ; **domaine à soi exigé** selon les comparatifs (non confirmé par les pages lues) | Oui, très bien (refus par défaut, e-mails autorisés, code à usage unique, officiel) | Oui | Le plus adapté pour **plusieurs entreprises**, mais il faut un nom de domaine |
| **Tailscale (plan Personal)** | Gratuit **pour un usage non commercial seulement** (officiel). Ton activité est commerciale : **non permis** sans payer (Standard 8 $ par utilisateur et par mois, officiel) | Oui (réseau privé) | Oui | Une application à installer sur le PC et l'iPhone |
| **zrok** (libre, hébergé gratuit) | Rapporté : 0 $, OAuth Google/GitHub avec filtre d'e-mail | Oui (rapporté) | Non vérifié | Un bogue de connexion Google sur le service hébergé était signalé comme ouvert ; limites gratuites non lues |
| localtunnel, Pinggy, frp, rathole… | localtunnel : serveur public peu fiable ; Pinggy : tunnels gratuits d'une heure (rapporté) ; frp et autres : **il faut un serveur à soi** | — | — | Écartés |

### Ce que coûte le plan gratuit de ngrok dans notre cas (calcul)
Le Studio ouvert interroge le serveur environ toutes les 8 s (noms des agents), 15 s (tokens) et 12 s (tableau des portes), uniquement quand la page est visible : environ **1 000 requêtes par heure**. Le quota de 20 000 requêtes est donc atteint après **environ 20 heures** d'écran ouvert par mois, sans compter les chargements de la page et les messages de discussion. Les WebSocket ne sont pas des requêtes HTTP au sens du quota (à confirmer chez ngrok). Les deux fréquences ont été allégées pour cette raison.

## Pour plusieurs entreprises (les secrétaires)
Aucune option **gratuite et sans condition** n'existe :
- ngrok gratuit : 3 personnes au total par mois, 1 Go : insuffisant.
- Tailscale gratuit : non commercial.
- Cloudflare nommé + Access : bon, mais demande **un nom de domaine** (coût à vérifier) et un hébergement allumé en permanence (`docs/17`).
- zrok : possible mais jeune pour du service payant, non éprouvé ici.
La bonne réponse reste la voie **sans hébergement** de `docs/17` tant qu'il y a peu d'entreprises.

## Recommandation
1. **Maintenant** : port relayé par VS Code en « Private » (`docs/12`, chemin C). Rien à acheter, rien à installer.
2. **Si Ben veut une adresse fixe sans VS Code** : ngrok gratuit pour lui seul, en connaissant ses plafonds (créer un compte ngrok et télécharger leur programme : à faire par Ben).
3. **Sans compte du tout** : Cloudflare Quick Tunnel avec `--allowed-mail` (l'adresse change à chaque lancement : il faut alors démarrer le tunnel, copier le nom, puis lancer le Studio en mode tunnel). Téléchargement de `cloudflared` à faire par Ben.
4. **Pas Tailscale gratuit** pour cette activité.
5. **Plus tard, pour les entreprises** : Cloudflare nommé + Access, si Ben a un domaine.

## Sources
- ngrok, limites du plan gratuit : https://ngrok.com/docs/pricing-limits/free-plan-limits (officiel) ; conditions : https://ngrok.com/tos
- Cloudflare Quick Tunnels : https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/ ; Access : https://developers.cloudflare.com/cloudflare-one/policies/access/ ; code à usage unique : https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- Tailscale, tarifs et usage non commercial : https://tailscale.com/pricing
- Port relayé par VS Code : https://code.visualstudio.com/docs/editor/port-forwarding
- zrok (rapporté) : https://zrok.io/pricing-2026/ et https://github.com/openziti/zrok/issues/1276
- Comparatifs de tiers (rapportés, intéressés) : pinggy.io, localxpose.io, webhookrelay.com
