# Affiche les liens du Studio avec ton jeton (PC, Wi-Fi de la maison, tunnel).
#   powershell -ExecutionPolicy Bypass -File .\scripts\liens-studio.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\liens-studio.ps1 -TunnelHost <adresse-du-tunnel-sans-https>
# Le jeton est lu sur CE PC et affiché dans CE terminal seulement. Ne copie ces liens que dans tes propres appareils.
param(
  [int]$Port = 3100,
  [string]$TunnelHost = ''
)

$fichier = Join-Path $env:USERPROFILE '.pixel-agents\standalone-token'
if (-not (Test-Path $fichier)) {
  Write-Host "Jeton introuvable ($fichier). Lance d'abord le Studio une fois (lancer-studio.ps1)." -ForegroundColor Red
  exit 1
}
$jeton = (Get-Content $fichier -Raw).Trim()

$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "Liens du Studio (secrets : ne les partage pas)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Sur ce PC          http://127.0.0.1:$Port/?token=$jeton"
if ($ip) {
  Write-Host "  iPhone (même Wi-Fi) http://${ip}:$Port/?token=$jeton   (demande la règle de pare-feu de docs/12 et le mode wifi)"
}
if ($TunnelHost) {
  $h = $TunnelHost -replace '^https?://', '' -replace '/.*$', ''
  Write-Host "  Par le tunnel       https://$h/?token=$jeton   (Studio lancé avec : .\lancer-studio.ps1 tunnel -TunnelHost $h)"
}
else {
  Write-Host "  Par un tunnel       relance avec -TunnelHost <adresse>  (voir docs/12, chemin C, et docs/18)"
}
Write-Host ""
Write-Host "Pour changer le jeton (invalide tous les anciens liens) :  node studio\dist\cli.js --rotate-token"
