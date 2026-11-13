# Lance l'Agent Manager (chef de studio) : il orchestre les 10 spécialistes et partage le travail.
#   powershell -ExecutionPolicy Bypass -File .\lancer-manager.ps1
# Active aussi la mémoire de chaque agent (dossier .claude\agent-memory).
Set-Location $PSScriptRoot
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Write-Host "La commande claude est introuvable dans ce PowerShell." -ForegroundColor Red
  exit 1
}
claude --agent chef-de-studio
