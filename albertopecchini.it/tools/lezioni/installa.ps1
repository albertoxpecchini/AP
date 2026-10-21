# Lezioni - installazione (una volta sola; rilanciarlo aggiorna le dipendenze).
#
#   powershell -ExecutionPolicy Bypass -File installa.ps1 [-Modello large-v3|small|...] [-SenzaCollegamenti]
#
# Mette in %LOCALAPPDATA%\Lezioni un Python 3.12 tutto suo (con uv) e le librerie, scarica il
# modello di Whisper (large-v3 con una GPU NVIDIA, circa 3 GB; small senza, circa 0,5 GB), crea
# <Documenti>\Lezioni e i collegamenti "Lezione" e "Fine lezione" sul desktop. Non tocca il
# Python di sistema. Per togliere tutto: cancellare %LOCALAPPDATA%\Lezioni e i due collegamenti.
# Di Alberto Pecchini - https://www.pzkko.it/tools/lezioni/
param([string]$Modello = '', [switch]$SenzaCollegamenti)

$ErrorActionPreference = 'Stop'
$t = $PSScriptRoot
$casa = Join-Path $env:LOCALAPPDATA 'Lezioni'
$venv = Join-Path $casa 'venv'
$py = Join-Path $venv 'Scripts\python.exe'
New-Item -ItemType Directory -Force $casa | Out-Null
function Passo($testo) { Write-Host ''; Write-Host "== $testo" -ForegroundColor Cyan }

Passo 'uv (gestore di Python, di Astral)'
$uv = (Get-Command uv -ErrorAction SilentlyContinue).Source
if (-not $uv) { $uv = Join-Path $env:USERPROFILE '.local\bin\uv.exe' }
if (-not (Test-Path $uv)) {
    Write-Host 'uv non c''e'': lo scarico (https://astral.sh/uv, nella cartella utente, senza permessi da amministratore).'
    Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
    $uv = Join-Path $env:USERPROFILE '.local\bin\uv.exe'
}
& $uv --version

Passo "Python 3.12 e le librerie in $venv"
if (-not (Test-Path $py)) { & $uv venv --python 3.12 $venv }
& $uv pip install --python $py -r (Join-Path $t 'requisiti.txt')
$gpu = [bool](Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match 'NVIDIA' })
if ($gpu) {
    Write-Host 'GPU NVIDIA trovata: installo cuBLAS e cuDNN (circa 1,5 GB).'
    & $uv pip install --python $py -r (Join-Path $t 'requisiti-gpu.txt')
} else {
    Write-Host 'Nessuna GPU NVIDIA: Whisper girera'' sulla CPU con il modello small.'
}
if (Test-Path (Join-Path $t 'requisiti-claude.txt')) { & $uv pip install --python $py -r (Join-Path $t 'requisiti-claude.txt') }

Passo 'Il modello di Whisper'
if (-not $Modello) { $Modello = if ($gpu) { 'large-v3' } else { 'small' } }
& $py -c "from faster_whisper import download_model; print(download_model('$Modello'))"

Passo 'Prova: la GPU, l''audio del PC, gli schermi, Edge'
Push-Location $t
& $py controlla.py
Pop-Location

Passo 'Cartelle e collegamenti'
$lezioni = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Lezioni'
New-Item -ItemType Directory -Force $lezioni | Out-Null
Write-Host "Le lezioni andranno in $lezioni"
if (-not $SenzaCollegamenti) {
    $desk = [Environment]::GetFolderPath('Desktop')
    $sh = New-Object -ComObject WScript.Shell
    $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    foreach ($c in @(@('Lezione', 'lezione.ps1', 'lezione.ico', 'Registra e trascrive la lezione'),
                     @('Fine lezione', 'fine.ps1', 'fine.ico', 'Chiude la lezione e prepara il grezzo'))) {
        $l = $sh.CreateShortcut((Join-Path $desk "$($c[0]).lnk"))
        $l.TargetPath = $ps
        $l.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $t $c[1])`""
        $l.WorkingDirectory = $t
        $l.IconLocation = "$(Join-Path $t "barra\$($c[2])"),0"
        $l.Description = $c[3]
        $l.Save()
        Write-Host "collegamento: $($c[0])"
    }
}
Passo 'Fatto'
Write-Host 'Prima della lezione: apri Teams (o il video) sullo schermo da registrare e premi "Lezione".'
Write-Host 'Alla fine: "Fine lezione". Istruzioni complete nel README.md accanto a questo file.'
