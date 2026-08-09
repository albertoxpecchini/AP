# ── Registra (o toglie) il compito ogni due giorni ───────────────────────────
#
# ATTENZIONE: questo file va salvato in UTF-8 CON BOM. Windows PowerShell 5.1,
# senza BOM, legge il file come ANSI: il trattino lungo "—" (UTF-8 E2 80 94)
# diventa "â€"", e quell'ultimo carattere è una virgoletta tipografica che
# PowerShell accetta come delimitatore di stringa. Risultato: le virgolette
# vanno in disequilibrio e lo script non parte più, con un errore che indica una
# riga che non c'entra niente. Se un editor toglie il BOM, o si rimette, o si
# tolgono gli accenti e i trattini lunghi da qui dentro.
#
#   powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Ora 09:30
#   powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Rimuovi
#   powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Stato
#
# Il compito è dell'utente, non di sistema: niente diritti di amministratore e
# niente password da conservare da qualche parte.

param(
  [string]$Ora = '13:00',
  [switch]$Rimuovi,
  [switch]$Stato
)

$ErrorActionPreference = 'Stop'
$nome = 'Pulizia repo AP'
$radice = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script = Join-Path $radice 'scripts\janitor\esegui-pianificato.ps1'

if ($Rimuovi) {
  $esistente = Get-ScheduledTask -TaskName $nome -ErrorAction SilentlyContinue
  if ($esistente) {
    Unregister-ScheduledTask -TaskName $nome -Confirm:$false
    Write-Host "Compito '$nome' rimosso." -ForegroundColor Green
  } else {
    Write-Host "Nessun compito '$nome' da rimuovere."
  }
  return
}

if ($Stato) {
  $t = Get-ScheduledTask -TaskName $nome -ErrorAction SilentlyContinue
  if (-not $t) { Write-Host "Non registrato."; return }
  $info = Get-ScheduledTaskInfo -TaskName $nome
  Write-Host "Compito:        $nome"
  Write-Host "Stato:          $($t.State)"
  Write-Host "Ultima volta:   $($info.LastRunTime)  (esito $($info.LastTaskResult))"
  Write-Host "Prossima volta: $($info.NextRunTime)"
  return
}

if (-not (Test-Path $script)) { throw "non trovo $script" }

# -DaysInterval 2 = ogni due giorni. -StartWhenAvailable recupera l'esecuzione
# se a quell'ora il computer era spento: su un portatile è la norma, e senza
# quel flag il compito salterebbe il turno e basta.
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 2 -At $Ora
$azione = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`"" `
  -WorkingDirectory $radice
$impostazioni = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 45) `
  -MultipleInstances IgnoreNew

# L'Utilità di pianificazione fa partire i compiti a priorità 7, "sotto il
# normale": va benissimo per una manutenzione che non deve disturbare, ma qui
# dentro c'è anche un benchmark, e misurare i fotogrammi con la CPU concessa col
# contagocce allunga la corsa senza renderla più vera. 5 è il compromesso: sopra
# la manutenzione, sotto quello che si sta facendo in primo piano.
# (Il confronto prima/dopo resterebbe valido comunque — entrambe le misure
# girano nello stesso turno e con la stessa priorità — ma i numeri assoluti non
# sarebbero paragonabili a quelli di `npm run bench` lanciato a mano.)
$impostazioni.Priority = 5

Register-ScheduledTask -TaskName $nome -Trigger $trigger -Action $azione `
  -Settings $impostazioni -Description 'Pulisce e alleggerisce il repo, con benchmark prima/dopo e ripristino automatico.' `
  -Force | Out-Null

$info = Get-ScheduledTaskInfo -TaskName $nome
Write-Host ""
Write-Host "  Compito registrato: '$nome'" -ForegroundColor Green
Write-Host "  Ogni 2 giorni alle $Ora — prossima volta: $($info.NextRunTime)"
Write-Host "  I log finiscono in .janitor\log\"
Write-Host ""
Write-Host "  Provalo subito:  Start-ScheduledTask -TaskName '$nome'"
Write-Host "  Toglilo:         powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Rimuovi"
Write-Host ""
