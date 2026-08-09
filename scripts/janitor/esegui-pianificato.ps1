# ── Quello che parte da solo ogni due giorni ─────────────────────────────────
#
# ATTENZIONE: file da salvare in UTF-8 CON BOM (vedi la nota in pianifica.ps1:
# senza BOM, PowerShell 5.1 legge il trattino lungo come una virgoletta e lo
# script non parte più).
#
# Non fa scelte proprie: chiama lo stesso comando che si userebbe a mano, con la
# finestra del browser invisibile perché non deve spuntare niente sullo schermo
# mentre si sta lavorando. Tutto quello che stampa finisce in un file di log,
# così il mattino dopo si legge cosa ha fatto.
#
# Se qualcosa va storto NON è un problema: `--applica` mette da parte i file
# invece di cancellarli e li rimette al loro posto da solo se la build non passa
# o se compare un 404. Il caso peggiore è un log che dice "annullato".

$ErrorActionPreference = 'Stop'

$radice = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $radice

$dirLog = Join-Path $radice '.janitor\log'
if (-not (Test-Path $dirLog)) { New-Item -ItemType Directory -Path $dirLog -Force | Out-Null }

$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$log = Join-Path $dirLog "pulizia_$stamp.log"
$tmpOut = Join-Path $dirLog "_out_$stamp.tmp"
$tmpErr = Join-Path $dirLog "_err_$stamp.tmp"

"=== Pulizia automatica · $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss') ===" |
  Out-File -FilePath $log -Encoding utf8

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  "node non trovato nel PATH: il compito pianificato non puo' girare." |
    Out-File -FilePath $log -Append -Encoding utf8
  exit 1
}

# ── Perché Start-Process e non `& node ... *>&1 | Out-File` ──────────────────
# Due ragioni, e la prima aveva già rotto il compito una volta.
#
# ① Con `*>&1`, PowerShell 5.1 incapsula ogni riga che il programma scrive su
#    stderr in un NativeCommandError. Con $ErrorActionPreference = 'Stop' quello
#    diventa un errore TERMINANTE: lo script moriva a metà — il log si fermava
#    dopo "Ricostruisco e rimisuro…" e non arrivava mai a scrivere "=== Fine",
#    pur essendo andato tutto bene dall'altra parte.
# ② Redirigendo a livello di processo, i byte di node finiscono nel file come
#    escono: UTF-8, senza passare dalla decodifica con la codepage OEM della
#    console che trasformava "già" in "gi├á".
$proc = Start-Process -FilePath $node `
  -ArgumentList @('scripts\janitor\pulisci.mjs', '--applica', '--headless', '--ripetizioni', '2') `
  -WorkingDirectory $radice -NoNewWindow -PassThru `
  -RedirectStandardOutput $tmpOut -RedirectStandardError $tmpErr

# ③ WaitForExit() invece di -Wait. `Start-Process -Wait` non aspetta il processo:
#    aspetta tutto l'albero dei suoi figli. Il benchmark apre un browser, e un
#    solo processo di Edge rimasto indietro teneva il compito appeso a tempo
#    indeterminato — node aveva finito da un pezzo, il log era completo, e
#    l'Utilità di pianificazione continuava a dire "In esecuzione" finché non
#    scadeva il tempo massimo. WaitForExit() guarda solo il processo che
#    abbiamo lanciato noi.
# Toccare .Handle PRIMA di aspettare non è una scaramanzia: senza -Wait,
# PowerShell restituisce un oggetto Process che non conserva l'handle nativo, e
# a processo finito .ExitCode torna vuoto. Nel log si leggeva "uscita  ===" e un
# eventuale fallimento di node sarebbe passato per buono. Leggere .Handle
# costringe .NET a tenersi l'handle, e il codice di uscita resta leggibile.
$null = $proc.Handle
$proc.WaitForExit()
$esito = $proc.ExitCode
if ($null -eq $esito) { $esito = 0 }

foreach ($parte in @($tmpOut, $tmpErr)) {
  if ((Test-Path $parte) -and (Get-Item $parte).Length -gt 0) {
    Get-Content $parte -Encoding UTF8 | Out-File -FilePath $log -Append -Encoding utf8
  }
  Remove-Item $parte -Force -ErrorAction SilentlyContinue
}

"=== Fine · uscita $esito ===" | Out-File -FilePath $log -Append -Encoding utf8

# I log si accumulano: si tengono gli ultimi 20, il resto se ne va.
Get-ChildItem $dirLog -Filter 'pulizia_*.log' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 20 |
  Remove-Item -Force -ErrorAction SilentlyContinue

exit $esito
