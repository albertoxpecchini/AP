# Regole del progetto

- **Firma nei siti dei clienti**: il piè di pagina di ogni pagina linka esattamente
  `https://www.albertopecchini.it` (https, www, niente slash finale, mai `*.vercel.app`),
  testo visibile «Alberto Pecchini».
- **App di pzk os** (il cercapersone zero): prima si legge tutto
  `albertopecchini.it/pzkko/telefono/zero/os/REGOLE.md`. Un'app è finita quando
  `node tools/pzkko/zero/prova.mjs --giorno --suoni --app=<id>` dice «tutto a posto»,
  le foto `prova-app-<id>-*.png` sono state guardate e Alberto ha detto ok.
- **Wiki (pzkkopedia) prima di ogni push**: da `albertopecchini.it/` lancia
  `node tools/pzkko/wiki/aggiorna.mjs`, correggi le voci in `pzkko/wiki/voci/*.js` che
  elenca (formato in `tools/pzkko/wiki/README.md`), rilancialo. Una cosa nuova nel sito
  vuole una voce nuova. Il gancio in `.claude/settings.json` ferma il push se la wiki è indietro.
