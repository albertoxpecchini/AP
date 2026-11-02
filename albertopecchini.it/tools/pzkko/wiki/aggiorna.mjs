#!/usr/bin/env node
// Aggiorna pzkkopedia (2.11): la cosa da lanciare PRIMA DI OGNI PUSH (Alberto: «ricorda che ad ogni push nuovo bisogna
// aggiornarla»). Prima dice cosa è cambiato nel sito dall'ultima volta e quali voci lo dichiarano fra le fonti (così si
// sa cosa rileggere e correggere a mano), poi rigenera le voci dai dati (voci/dati.js), la cronologia dai commit
// (cronologia.js) e lo stato (stato.json), e infine controlla tutto.
//
//   node tools/pzkko/wiki/aggiorna.mjs            (dalla cartella albertopecchini.it)
//   node tools/pzkko/wiki/aggiorna.mjs --foto     anche le foto del sito (serve un browser: qualche minuto)
//   node tools/pzkko/wiki/aggiorna.mjs --copie    solo le copie delle foto di collaudo da tools/pzkko/lavoro/ (senza browser)
//
// Il giro completo, quando il sito è cambiato:
//   1. `node tools/pzkko/wiki/aggiorna.mjs` → legge la lista «file cambiati → voci»
//   2. si correggono a mano le voci in pzkko/wiki/voci/*.js (il formato: tools/pzkko/wiki/README.md)
//   3. di nuovo `aggiorna.mjs` (lo stato prende il commit di adesso), poi commit e push
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../../..')
const lancia = (file, args = [], opz = {}) => {
  const r = spawnSync(process.execPath, [join(QUI, file), ...args], { cwd: SITO, stdio: 'inherit', ...opz })
  return r.status ?? 1
}
console.log('── pzkkopedia: cosa è cambiato dall’ultima volta ──')
lancia('controlla.mjs', [])   // prima del rigenerare: dice i file cambiati e le voci da rileggere
if (process.argv.includes('--foto')) { console.log('── le foto del sito ──'); lancia('foto.mjs') }
else if (process.argv.includes('--copie')) { console.log('── le copie delle foto di collaudo ──'); lancia('foto.mjs', ['--solo-copie']) }
console.log('── le voci dai dati, la cronologia, lo stato ──')
if (lancia('genera.mjs') !== 0) { console.log('genera.mjs è fallito: la wiki NON è aggiornata'); process.exit(1) }
console.log('── il controllo ──')
const esito = lancia('controlla.mjs', ['--solo-voci'])
console.log(esito === 0 ? '\npzkkopedia aggiornata: ora commit e push (prima rileggi le voci segnate sopra, se ce n’erano).' : '\npzkkopedia aggiornata ma con problemi: guarda sopra.')
process.exit(esito)
