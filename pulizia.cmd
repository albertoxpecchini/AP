@echo off
rem ── Il programma di pulizia, dal Prompt dei comandi ──────────────────────────
rem
rem   pulizia              guarda e riferisce, non tocca niente
rem   pulizia applica      pulisce, verifica, e se serve annulla da solo
rem   pulizia bench        solo benchmark, confrontato con l'ultima volta
rem   pulizia prove        le prove di sicurezza
rem   pulizia elenco       le quarantene esistenti
rem   pulizia ripristina   rimette a posto l'ultima quarantena
rem   pulizia pianifica    registra il compito ogni due giorni
rem   pulizia togli        toglie il compito pianificato
rem   pulizia stato        quando ha girato e quando girera'
rem
rem Quello che scrivi in piu' passa dritto al programma:
rem   pulizia applica --tutto --rami
rem   pulizia bench --veloce --pagine /,/trivia

setlocal EnableExtensions

rem ── Codepage ────────────────────────────────────────────────────────────────
rem A schermo la codepage non serve: per una console vera node converte in
rem UTF-16 e chiama WriteConsoleW, quindi accenti e cornici escono giusti anche
rem a 850 (verificato). Serve quando l'uscita viene REDIRETTA — pulizia >
rem rapporto.txt — perche' li' node scrive byte UTF-8 grezzi e a 850 il file
rem poi si rilegge sbagliato. E' un'assicurazione da due righe, non una toppa a
rem un guaio che si vede: la codepage si rimette com'era prima di uscire, perche'
rem cambiarla e lasciarla cambiata sarebbe un dispetto a chi usa la stessa
rem finestra dopo.
set "CP_PRIMA="
for /f "tokens=2 delims=:" %%a in ('chcp') do set "CP_PRIMA=%%a"
if defined CP_PRIMA set "CP_PRIMA=%CP_PRIMA: =%"
chcp 65001 >nul 2>&1

set "RADICE=%~dp0"
set "COMANDO=%~1"
if not "%COMANDO%"=="" shift

rem ── Argomenti che avanzano ──────────────────────────────────────────────────
rem %* non si aggiorna dopo shift: la coda va raccolta a mano, un pezzo per
rem volta. Si usa %1 e non %~1 per non perdere le virgolette di chi ne mette.
set "RESTO="
:raccogli
if "%~1"=="" goto pronti
set "RESTO=%RESTO% %1"
shift
goto raccogli
:pronti

if "%COMANDO%"==""            goto analisi
if /i "%COMANDO%"=="analisi"  goto analisi
if /i "%COMANDO%"=="applica"  goto applica
if /i "%COMANDO%"=="bench"    goto bench
if /i "%COMANDO%"=="prove"    goto prove
if /i "%COMANDO%"=="elenco"   goto elenco
if /i "%COMANDO%"=="ripristina" goto ripristina
if /i "%COMANDO%"=="pianifica"  goto pianifica
if /i "%COMANDO%"=="togli"      goto togli
if /i "%COMANDO%"=="stato"      goto stato
if /i "%COMANDO%"=="aiuto"      goto aiuto
if /i "%COMANDO%"=="-h"         goto aiuto
if /i "%COMANDO%"=="--help"     goto aiuto

rem Non è un sottocomando: allora è un'opzione, e il comando è l'analisi.
rem Così `pulizia --elenco` funziona come `pulizia elenco`.
set "RESTO= %COMANDO%%RESTO%"
goto analisi

:analisi
node "%RADICE%scripts\janitor\pulisci.mjs"%RESTO%
goto fine

:applica
node "%RADICE%scripts\janitor\pulisci.mjs" --applica%RESTO%
goto fine

:bench
node "%RADICE%scripts\janitor\bench-cli.mjs"%RESTO%
goto fine

:prove
node "%RADICE%scripts\janitor\autotest.mjs"%RESTO%
goto fine

:elenco
node "%RADICE%scripts\janitor\pulisci.mjs" --elenco
goto fine

:ripristina
node "%RADICE%scripts\janitor\pulisci.mjs" --ripristina ultima
goto fine

:pianifica
powershell -NoProfile -ExecutionPolicy Bypass -File "%RADICE%scripts\janitor\pianifica.ps1"%RESTO%
goto fine

:togli
powershell -NoProfile -ExecutionPolicy Bypass -File "%RADICE%scripts\janitor\pianifica.ps1" -Rimuovi
goto fine

:stato
powershell -NoProfile -ExecutionPolicy Bypass -File "%RADICE%scripts\janitor\pianifica.ps1" -Stato
goto fine

:aiuto
echo.
echo   Pulizia del repo — comandi
echo.
echo     pulizia              guarda e riferisce, non tocca niente
echo     pulizia applica      pulisce, verifica, e se serve annulla da solo
echo     pulizia bench        solo benchmark, confrontato con l'ultima volta
echo     pulizia prove        le prove di sicurezza
echo     pulizia elenco       le quarantene esistenti
echo     pulizia ripristina   rimette a posto l'ultima quarantena
echo     pulizia pianifica    registra il compito ogni due giorni
echo     pulizia togli        toglie il compito pianificato
echo     pulizia stato        quando ha girato e quando girera'
echo.
echo   Quello che scrivi in piu' passa dritto al programma:
echo     pulizia applica --tutto --rami
echo     pulizia bench --veloce --pagine /,/trivia
echo     pulizia applica --niente-bench      (piu' rapido, salta i fotogrammi)
echo.
goto fine

:fine
rem L'esito va letto SUBITO: chcp qui sotto lo sovrascriverebbe, e chi lancia
rem `pulizia` da uno script si ritroverebbe sempre "tutto bene".
set "ESITO=%ERRORLEVEL%"
if defined CP_PRIMA chcp %CP_PRIMA% >nul 2>&1
exit /b %ESITO%
