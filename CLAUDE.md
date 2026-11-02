# Regole del progetto

## Crediti nei siti dei clienti

Ogni sito realizzato da Alberto (Rivalta sul Mincio, Cascina Fontana, Ing. Dario
Donelli e i prossimi) firma il piè di pagina di tutte le pagine con un link
esattamente a `https://www.albertopecchini.it` (https, www, senza slash finale).
Mai il dominio senza www né indirizzi `*.vercel.app`. Il testo visibile è il nome
«Alberto Pecchini», non il dominio.

## Le app di pzk os (il cercapersone zero di pzkko)

Prima di creare o cambiare un'app di pzk os si leggono per intero le regole in
`albertopecchini.it/pzkko/telefono/zero/os/REGOLE.md` (tasti, schermo, icone,
animazioni, suoni, dati, il modello da copiare). Un'app è finita solo quando
`node tools/pzkko/zero/prova.mjs --giorno --suoni --app=<id>` dice «tutto a
posto», le foto `prova-app-<id>-*.png` sono state guardate tutte, e Alberto ha
detto ok.

## La wiki di pzkko (pzkkopedia) si aggiorna a ogni push

`albertopecchini.it/pzkko/wiki/` è pzkkopedia, l'enciclopedia del sito: una voce
per ogni cosa (il muro, la scena 3D, i giochi, i soldi, il cercapersone zero e le
app, la chat, gli strumenti, il repository, il server in casa, gli altri siti, la
memoria di Claude), tutte collegate. Regola di Alberto del 2.11.2026: «ad ogni push
nuovo bisogna aggiornarla». Prima di ogni push su `main`:

1. `node tools/pzkko/wiki/aggiorna.mjs` (da `albertopecchini.it/`): dice quali file
   sono cambiati e quali voci li dichiarano fra le `fonti`;
2. si correggono quelle voci in `pzkko/wiki/voci/*.js` (formato e titoli canonici in
   `tools/pzkko/wiki/README.md`; `dati.js` e `cronologia.js` sono generati);
3. di nuovo `aggiorna.mjs`, che rigenera dati, cronologia e stato e controlla link
   rossi, immagini e fonti; una cosa nuova nel sito vuole una voce nuova.

Il gancio di Claude Code (`.claude/settings.json`) ferma `git push` se la wiki è
indietro; il workflow Build mette la ❌ al commit.
