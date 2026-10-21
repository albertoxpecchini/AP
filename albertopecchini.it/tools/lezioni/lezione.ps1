# Lezioni - avvia la registrazione di una lezione.
#
#   powershell -ExecutionPolicy Bypass -File lezione.ps1 [-Cartella <percorso>] [-Schermo auto] [-Materia "..."] [-Lingua it]
#
# Parte il registratore (audio del PC + schermo), il trascrittore (Whisper) e la barra; se c'e'
# la chiave ANTHROPIC_API_KEY anche la lettura automatica della lavagna. Registratore,
# trascrittore e lettura hanno ciascuno un guardiano che li rilancia se cadono. Si chiude con
# fine.ps1. La cartella e' <Documenti>\Lezioni\AAAA-MM-GG (o AAAA-MM-GG_hhmm se quella del
# giorno e' gia' chiusa). Le impostazioni fisse stanno in %LOCALAPPDATA%\Lezioni\config.json.
# Di Alberto Pecchini - https://www.pzkko.it/tools/lezioni/
param([string]$Cartella = '', [string]$Schermo = '', [string]$Materia = '', [string]$Lingua = '')

$t = $PSScriptRoot
$casa = Join-Path $env:LOCALAPPDATA 'Lezioni'
$py = Join-Path $casa 'venv\Scripts\python.exe'
$pyw = Join-Path $casa 'venv\Scripts\pythonw.exe'
if (-not (Test-Path $py)) {
    Write-Host "Lezioni non e' installato: prima lancia installa.ps1 (in $t)." -ForegroundColor Yellow
    Read-Host 'Invio per chiudere'
    exit 1
}
$cfg = $null
if (Test-Path (Join-Path $casa 'config.json')) { $cfg = Get-Content (Join-Path $casa 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json }
function Scelta($dato, $nome, $predefinito) {
    if ($dato) { return $dato }
    if ($cfg -and $cfg.$nome) { return $cfg.$nome }
    return $predefinito
}
$Schermo = Scelta $Schermo 'schermo' 'auto'
$Materia = Scelta $Materia 'materia' ''
$Lingua = Scelta $Lingua 'lingua' 'it'
$base = Scelta $env:LEZIONI_DIR 'cartella' (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Lezioni')

# gia' in registrazione? (meta.json aggiornato da poco e niente FINE): non si raddoppia
$corrente = Join-Path $casa 'corrente.txt'
if (-not $Cartella -and (Test-Path $corrente)) {
    $c = (Get-Content $corrente -Encoding UTF8 -Raw).Trim()
    $m = Join-Path $c 'meta.json'
    if ((Test-Path $m) -and -not (Test-Path (Join-Path $c 'FINE')) -and ((Get-Date) - (Get-Item $m).LastWriteTime).TotalSeconds -lt 15) {
        Write-Host "Sta gia' registrando in $c" -ForegroundColor Green
        Start-Sleep 3
        exit 0
    }
}
if (-not $Cartella) {
    $Cartella = Join-Path $base (Get-Date -Format 'yyyy-MM-dd')
    if (Test-Path (Join-Path $Cartella 'FINE')) { $Cartella += '_' + (Get-Date -Format 'HHmm') }
}
New-Item -ItemType Directory -Force $Cartella, (Join-Path $Cartella 'log') | Out-Null
Set-Content -Path $corrente -Value $Cartella -Encoding UTF8
$log = Join-Path $Cartella 'log'
$stop = Join-Path $Cartella 'STOP'
$env:PYTHONUTF8 = '1'  # i log vanno su file: senza, Python scriverebbe in cp1252 e cadrebbe sui caratteri come la freccia

function Guardiano($nome, $comando) {
    # PowerShell nascosto che rilancia il comando se cade. Il registratore gira finche' non c'e'
    # STOP; trascrittore e lettura finiscono da soli (uscita 0) dopo FINE, quando hanno finito tutto.
    if ($nome -eq 'registra') {
        $giro = "while (-not (Test-Path '$stop')) { & $comando *>> '$log\$nome.log'; Start-Sleep 2 }"
    } else {
        $giro = "do { & $comando *>> '$log\$nome.log'; `$rc = `$LASTEXITCODE; if (`$rc -ne 0) { Start-Sleep 2 } } while (`$rc -ne 0)"
    }
    Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "Set-Location '$t'; $giro"
}
Guardiano 'registra' "'$py' registra.py '$Cartella' --schermo '$Schermo'"
Guardiano 'trascrivi' "'$py' trascrivi.py '$Cartella' --lingua '$Lingua' --materia '$Materia'"
if ($env:ANTHROPIC_API_KEY -and (Test-Path (Join-Path $t 'ocr_claude.py'))) {
    Guardiano 'ocr' "'$py' ocr_claude.py '$Cartella'"
    $ocr = 'lettura della lavagna con Claude: accesa'
} else {
    $ocr = 'lettura della lavagna: in Claude Code (scrivi "lezione") o con ANTHROPIC_API_KEY'
}
Start-Process $pyw -WorkingDirectory $t -ArgumentList 'barra.py', "`"$Cartella`""

Write-Host "Lezione in registrazione in $Cartella" -ForegroundColor Green
Write-Host "Schermo: $Schermo - lingua: $Lingua - $ocr"
Write-Host 'Per chiudere: fine.ps1 (il collegamento "Fine lezione" sul desktop).'
Start-Sleep 4
