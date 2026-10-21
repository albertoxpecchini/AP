# Lezioni - chiude la lezione avviata con lezione.ps1.
#
#   powershell -ExecutionPolicy Bypass -File fine.ps1 [-Cartella <percorso>]
#
# Ferma il registratore (che scrive FINE), aspetta che il trascrittore e la lettura della
# lavagna finiscano e rifa' grezzo.md. Con ANTHROPIC_API_KEY scrive anche gli appunti e il PDF;
# senza, gli appunti li fa Claude Code (scrivi "appunti"). La barra resta e mostra "finita".
# Di Alberto Pecchini - https://www.pzkko.it/tools/lezioni/
param([string]$Cartella = '')

$t = $PSScriptRoot
$casa = Join-Path $env:LOCALAPPDATA 'Lezioni'
$py = Join-Path $casa 'venv\Scripts\python.exe'
$env:PYTHONUTF8 = '1'
if (-not $Cartella) { $Cartella = (Get-Content (Join-Path $casa 'corrente.txt') -Encoding UTF8 -Raw -ErrorAction Stop).Trim() }
New-Item -ItemType File -Force (Join-Path $Cartella 'STOP') | Out-Null
Write-Host "Fermo la registrazione in $Cartella..."
$t0 = Get-Date
while (-not (Test-Path (Join-Path $Cartella 'FINE')) -and ((Get-Date) - $t0).TotalSeconds -lt 60) { Start-Sleep -Milliseconds 500 }

function Ancora($script) {
    @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like "*$script*" -and $_.CommandLine -like "*$Cartella*" }).Count -gt 0
}
Write-Host 'Registrazione chiusa. Aspetto la fine della trascrizione e della lettura della lavagna...'
$t0 = Get-Date
while ((Ancora 'trascrivi.py') -or (Ancora 'ocr_claude.py')) {
    if (((Get-Date) - $t0).TotalMinutes -gt 20) { Write-Host 'Ci mette troppo: lascio andare avanti in background.'; break }
    Start-Sleep 2
}
& $py (Join-Path $t 'componi.py') $Cartella
Write-Host "Fatto: $Cartella\grezzo.md" -ForegroundColor Green

if ($env:ANTHROPIC_API_KEY -and (Test-Path (Join-Path $t 'appunti_claude.py'))) {
    Write-Host 'Scrivo gli appunti con Claude...'
    & $py (Join-Path $t 'appunti_claude.py') $Cartella
    $pdf = Join-Path $Cartella 'appunti\appunti.pdf'
    if (Test-Path $pdf) { Start-Process $pdf }
} else {
    Write-Host 'Per gli appunti: in Claude Code scrivi "appunti" (o imposta ANTHROPIC_API_KEY).'
}
Start-Sleep 5
