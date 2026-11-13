# 12. Tester le Studio sur iPhone

Demande de Ben (12/11/2026). **Non testé sur iOS par moi** : je n'ai pas d'iPhone. Le Studio a été vu à largeur de téléphone dans Chrome sur PC (panneau Quêtes lisible, boutons tactiles),
ce qui n'est pas la même chose que Safari sur iOS. Ce guide donne le chemin le plus court et le plus sûr pour que Ben le vérifie lui-même.

## État au 12/11/2026 (constaté)

- Le Studio est compilé (`studio\dist\cli.js`, `node_modules` présent) mais **le serveur ne tourne pas** : il s'est arrêté avec la session précédente.
- **Node.js n'est plus installé** sur ce PC : `nvm-windows` est présent, mais aucune version n'est active (le dossier `C:\nvm4w\nodejs` n'existe pas). Il faut le réinstaller (étape 1).
- Le Wi-Fi du PC porte l'adresse `192.168.11.104` et Windows le classe en réseau **Public** (pare-feu plus strict). Cette adresse peut changer.

## Cause trouvée le 13/11/2026 quand Safari n'ouvre pas le lien
Le Studio tourne avec `C:
vm4w
odejs
ode.exe`. Le pare-feu Windows a des règles d'entrée pour d'autres `node.exe` (Cursor, Studio_app, Program Files), **aucune pour celui-là**, et le Wi-Fi est en profil **Public** : Windows bloque donc l'iPhone (le PC, lui, atteint bien `192.168.11.104:3100`). Windows ne l'a pas demandé car le serveur a été lancé sans fenêtre.
Correction (à faire par Ben, PowerShell **en administrateur** ; je ne modifie pas le pare-feu à sa place) :
`New-NetFirewallRule -DisplayName "Studio CM 3100 (maison)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3100 -Program "C:
vm4w
odejs
ode.exe" -Profile Public -RemoteAddress LocalSubnet`
Cette règle n'ouvre que le port 3100, que pour ce programme, et seulement aux appareils du même réseau. Pour la retirer : `Remove-NetFirewallRule -DisplayName "Studio CM 3100 (maison)"`.
Vérifier aussi : l'iPhone est sur le même Wi-Fi (pas en 4G/5G), et le lien est celui du PC avec `127.0.0.1` remplacé par `192.168.11.104`.

## Chemin A : même Wi-Fi que le PC (le plus rapide, pour voir l'interface)

1. **Installer Node.js** (à faire par Ben : télécharge environ 30 Mo depuis nodejs.org et touche à l'installation du système). Ouvrir PowerShell **en administrateur** :
   `nvm install 24.14.0` puis `nvm use 24.14.0`. Fermer puis rouvrir PowerShell.
2. Dans PowerShell, dossier du projet :
   `cd C:\SASOMA-COMMUNICATION`
   `powershell -ExecutionPolicy Bypass -File .\lancer-studio.ps1 wifi`
3. Windows peut demander d'autoriser l'accès : coche **Réseaux privés** seulement. Si rien n'est proposé et que l'iPhone n'atteint pas le PC, le réseau est classé « Public » :
   à toi de décider de le passer en « Privé » (Paramètres → Réseau et Internet → Wi-Fi → propriétés). Je ne modifie pas ce réglage à ta place.
4. Le script affiche le lien `http://192.168.11.104:3100/?token=…`. L'ouvrir dans **Safari sur l'iPhone** (même Wi-Fi). Pour l'ajouter à l'écran d'accueil : bouton Partager → « Sur l'écran d'accueil ».
5. Tester : menu en haut à gauche → **Quêtes** → « Nouvelle mission » (mets « TEST » dans le titre) → « J'ai l'idée » → la porte 1 apparaît (orange), « en attente de Ben » ne s'affiche pas car tu es le chef.
   Les missions de test seront à effacer (`production\quests.jsonl`).

Dans ce mode **le terminal des agents est coupé** (`--no-terminal`) : on ne peut pas lancer d'agent depuis l'iPhone. C'est voulu : le lien circule en clair (http) sur le Wi-Fi ; avec le terminal actif,
quelqu'un qui le copierait pourrait exécuter des commandes sur ton PC.

## Chemin C : le port relayé par VS Code (sans toucher au pare-feu)
Source officielle : https://code.visualstudio.com/docs/editor/port-forwarding (vérifiée le 13/11/2026).
1. Dans VS Code, ouvre le dossier du projet, puis le panneau du bas, onglet **PORTS** (à côté du terminal). Clique **Forward a Port**, entre `3100`, connecte-toi à GitHub si on te le demande.
2. Clic droit sur le port > **Port Visibility** > **Private**. Private = seul le même compte GitHub (ou Microsoft) y accède, après connexion. **Ne mets jamais Public** : quiconque aurait le lien pourrait ouvrir le Studio.
3. Copie la **Forwarded Address** (elle se termine par `.devtunnels.ms` ; je ne sais pas à l'avance si elle est en https, regarde ce que VS Code affiche).
4. Lance le Studio en mode tunnel (terminal de VS Code, dossier du projet) : `powershell -ExecutionPolicy Bypass -File .\lancer-studio.ps1 tunnel -TunnelHost <adresse-sans-https>`. Le Studio n'écoute alors que sur le PC (127.0.0.1), accepte ce nom d'hôte, et **le terminal des agents reste coupé**.
5. Sur l'iPhone : ouvre l'adresse suivie de `/?token=...` (ton jeton), connecte-toi au même compte GitHub.
Limites (VS Code) : débit et nombre de machines limités ; certaines organisations bloquent le domaine des tunnels ; l'adresse peut changer si tu supprimes et recrées le port (il faut alors relancer en mode tunnel avec la nouvelle).
Non testé par moi : je ne peux pas piloter le panneau PORTS de VS Code ni l'iPhone.

## Chemin B : Tailscale (pour tout faire, y compris le terminal des agents)

Tailscale crée un réseau privé chiffré entre le PC et l'iPhone, de n'importe où. Il faut un compte et deux installations (PC + iPhone, App Store). À faire par Ben (compte, installation ; je ne crée aucun compte).
Ensuite, `pixel-agents --port 3100 --allowed-host <nom-du-pc>.<réseau>.ts.net` puis `tailscale serve --bg 3100` (procédure officielle du README de pixel-agents). Les conditions et le prix du compte Tailscale sont à lire sur leur site avant de s'inscrire.

## Ce que j'aimerais que tu regardes sur iPhone

- Le panneau Quêtes tient-il à l'écran ? Les boutons se touchent-ils sans erreur ?
- Le clavier cache-t-il le champ du titre ?
- Le bureau pixel-art (bandeau du haut, carte des agents) est-il lisible ?
- Les textes sont-ils trop petits ou trop longs pour une secrétaire ?
- Le lien gardé à l'écran d'accueil rouvre-t-il le Studio (le jeton persiste d'un redémarrage à l'autre) ?

## Après le test

- Arrêter le Studio (Ctrl+C dans la fenêtre PowerShell). Rien n'est exposé tant qu'il est arrêté.
- Si le lien a été partagé par erreur : `node studio\dist\cli.js --rotate-token` change le jeton et invalide tous les anciens liens.
