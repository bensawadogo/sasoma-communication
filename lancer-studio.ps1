# Lance le Studio (interface type Sims + panneau Quêtes).
#   Sur le PC seulement :        powershell -ExecutionPolicy Bypass -File .\lancer-studio.ps1
#   Test sur iPhone (même Wi-Fi) : powershell -ExecutionPolicy Bypass -File .\lancer-studio.ps1 wifi
#   Par le tunnel privé de VS Code : powershell -ExecutionPolicy Bypass -File .\lancer-studio.ps1 tunnel -TunnelHost <nom>.devtunnels.ms
#     (nom = « Forwarded Address » de l'onglet PORTS de VS Code, sans https:// ; visibilité du port : Private, jamais Public)
# Le lien affiché contient un jeton secret : ne le partage pas.
param(
  [ValidateSet('local', 'wifi', 'tunnel')] [string]$Mode = 'local',
  [int]$Port = 3100,
  [string]$Ip = '',
  [string]$TunnelHost = ''
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js est introuvable sur ce PC." -ForegroundColor Red
  Write-Host "Ouvre PowerShell EN ADMINISTRATEUR puis lance :  nvm install 24.14.0   puis   nvm use 24.14.0"
  Write-Host "Ferme et rouvre PowerShell, puis relance ce script."
  exit 1
}
if (-not (Test-Path 'studio\dist\cli.js')) {
  Write-Host "Le Studio n'est pas compilé. Dans le dossier studio : npm install puis npm run build." -ForegroundColor Red
  exit 1
}

if ($Mode -eq 'wifi') {
  if (-not $Ip) {
    $Ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress
  }
  if (-not $Ip) {
    Write-Host "Adresse Wi-Fi introuvable. Relance avec :  .\lancer-studio.ps1 wifi -Ip 192.168.x.x" -ForegroundColor Red
    exit 1
  }
  Write-Host ""
  Write-Host "Mode Wi-Fi : le Studio écoute sur $Ip (réseau de la maison seulement)." -ForegroundColor Yellow
  Write-Host "Terminal des agents DÉSACTIVÉ dans ce mode (test de l'interface et des Quêtes)." -ForegroundColor Yellow
  Write-Host "Sur l'iPhone (même Wi-Fi), ouvre le lien http://$Ip`:$Port/?token=... affiché ci-dessous."
  Write-Host "Windows peut demander d'autoriser le pare-feu : coche « Réseaux privés » seulement."
  Write-Host ""
  node studio\dist\cli.js --host $Ip --port $Port --allowed-host $Ip --no-terminal
}
elseif ($Mode -eq 'tunnel') {
  if (-not $TunnelHost) {
    Write-Host "Donne le nom du tunnel :  .\lancer-studio.ps1 tunnel -TunnelHost <nom>.devtunnels.ms" -ForegroundColor Red
    Write-Host "Dans VS Code : onglet PORTS (à côté du terminal) > Forward a Port > $Port > clic droit > Port Visibility > Private. Copie la « Forwarded Address » sans https://."
    exit 1
  }
  $TunnelHost = $TunnelHost -replace '^https?://', '' -replace '/.*$', ''
  Write-Host ""
  Write-Host "Mode tunnel VS Code : le Studio n'écoute que sur ce PC (127.0.0.1) ; VS Code relaie le port." -ForegroundColor Yellow
  Write-Host "Le port doit rester en visibilité « Private » : seul ton compte GitHub (ou Microsoft) y accède. JAMAIS « Public »." -ForegroundColor Yellow
  Write-Host "Terminal des agents DÉSACTIVÉ dans ce mode. Sur l'iPhone : https://$TunnelHost/?token=... (connecte-toi au même compte)."
  Write-Host ""
  node studio\dist\cli.js --host 127.0.0.1 --port $Port --allowed-host $TunnelHost --no-terminal
}
else {
  node studio\dist\cli.js --host 127.0.0.1 --port $Port
}
