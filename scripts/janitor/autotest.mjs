#!/usr/bin/env node
// ── Le prove di sicurezza ────────────────────────────────────────────────────
//
//   node scripts/janitor/autotest.mjs
//
// Un programma che cancella roba da solo ogni due giorni deve poter dimostrare
// che sa quello che fa. Qui si piantano file veri nel repo, si guarda cosa
// decide l'analisi, e poi si rimette tutto com'era.
//
// Le quattro prove non sono simmetriche di proposito. Due controllano che lo
// sporco venga TROVATO; le altre due — le più importanti — che il pulito NON
// venga toccato. Un falso negativo costa qualche kB; un falso positivo rompe
// una pagina.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { analizza } from './analisi.mjs'
import { metti, ripristina, cartellaQuarantena } from './quarantena.mjs'
import { C } from './rapporto.mjs'

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ── Perché i nomi sono casuali ───────────────────────────────────────────────
// Prima erano scritti per esteso qui dentro, e le prove passavano per il motivo
// sbagliato: l'analisi cerca il nome di un file in TUTTO il testo del repo, e
// questo file fa parte del repo. Bastava nominare `__test_orfano.ts` in una
// riga di codice perché l'analisi lo dichiarasse "citato da qualche parte" e
// quindi vivo — la prova sull'orfano falliva, e quelle sulla protezione
// passavano senza aver verificato niente. Composto a pezzi, il nome non compare
// per esteso da nessuna parte e le prove misurano quello che dicono di misurare.
const MARCHIO = '__prova-janitor-'
const TOKEN = MARCHIO + crypto.randomBytes(5).toString('hex') + '-'
const nomeTest = (prefisso, estensione) => `${TOKEN}${prefisso}${estensione}`

// ── Spazzata iniziale ────────────────────────────────────────────────────────
// Su Windows un processo ucciso da fuori non esegue né `finally` né gli
// handler dei segnali: SIGTERM non è un vero segnale, il processo viene
// terminato e basta. E ucciso da fuori succede davvero — /cleaning lancia
// queste prove come processo figlio e lo ammazza se si chiude la scheda.
// È già capitato che un file piantato sopravvivesse e finisse dritto in un
// commit. Quindi non ci si affida al morire con grazia: si pulisce all'inizio
// quello che una corsa precedente può aver lasciato indietro. Il marchio nel
// nome li rende riconoscibili senza possibilità di equivoco, ed è anche in
// .gitignore, così nel frattempo non possono essere committati per sbaglio.
function spazzaResidui() {
  const trovati = []
  const gira = (dir) => {
    let voci
    try { voci = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const v of voci) {
      if (v.name === 'node_modules' || v.name === '.git') continue
      const p = path.join(dir, v.name)
      if (v.isDirectory()) gira(p)
      else if (v.name.includes(MARCHIO)) {
        try { fs.rmSync(p, { force: true }); trovati.push(path.relative(RADICE, p)) } catch {}
      }
    }
  }
  gira(RADICE)

  // Una versione precedente di queste prove infilava l'import di prova dentro
  // src/main.tsx e lo toglieva alla fine: interrotta a metà, lasciava lì un
  // import verso un file cancellato e l'app non partiva. Adesso non succede più
  // (la prova 2 pianta una radice usa e getta in scripts/), ma se un repo si
  // trascina ancora quel danno, qui si ripara da solo invece di lasciare in
  // giro un errore incomprensibile.
  const main = path.join(RADICE, 'src/main.tsx')
  try {
    const testo = fs.readFileSync(main, 'utf8')
    if (testo.includes(MARCHIO) || /^import ".\/app\/(orfano|usato|ripristino)__t/m.test(testo)) {
      const ripulito = testo
        .split('\n')
        .filter((r) => !(r.startsWith('import "') && (r.includes(MARCHIO) || /__t[0-9a-f]{10}/.test(r))))
        .join('\n')
      fs.writeFileSync(main, ripulito)
      trovati.push('src/main.tsx (import di prova rimosso)')
    }
  } catch {}

  return trovati
}

let passate = 0
let fallite = 0

// ── I file piantati devono sparire anche se qualcuno ci stacca la spina ──────
// `finally` copre l'errore dentro la prova, non il processo ucciso da fuori: e
// da fuori succede davvero, perché /cleaning lancia queste prove come processo
// figlio e lo ammazza se si chiude la scheda. È già capitato — un
// `orfano__<random>.ts` è sopravvissuto a un'interruzione ed è finito
// dritto in un commit. Qui si tiene il conto di tutto ciò che è stato piantato
// e lo si toglie anche su SIGTERM/SIGINT.
const piantatiOra = new Set()

function spazza() {
  for (const rel of piantatiOra) {
    try { fs.rmSync(path.join(RADICE, rel), { force: true }) } catch {}
  }
  piantatiOra.clear()
}

for (const segnale of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(segnale, () => { spazza(); process.exit(130) })
}
process.on('exit', spazza)

function prova(nome, fn) {
  const daPulire = []
  const pianta = (rel, contenuto) => {
    const p = path.join(RADICE, rel)
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, contenuto)
    daPulire.push(rel)
    piantatiOra.add(rel)
    return rel
  }
  try {
    fn(pianta)
    console.log(`  ${C.verde('✓')} ${nome}`)
    passate++
  } catch (err) {
    console.log(`  ${C.rosso('✗')} ${nome}`)
    console.log(`      ${C.rosso(err.message)}`)
    fallite++
  } finally {
    // Il repo deve tornare esattamente com'era, comunque sia andata.
    for (const rel of daPulire) {
      try { fs.rmSync(path.join(RADICE, rel), { force: true }) } catch {}
      piantatiOra.delete(rel)
    }
  }
}

const assert = (cond, messaggio) => { if (!cond) throw new Error(messaggio) }
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')

console.log(C.forte('\n  Prove di sicurezza del programma di pulizia\n'))

const residui = spazzaResidui()
if (residui.length) {
  console.log(C.giallo(`  (tolti ${residui.length} file lasciati da una corsa interrotta)\n`))
}

// ── 1. Trova un modulo orfano ────────────────────────────────────────────────
prova('riconosce un modulo che nessuno importa', (pianta) => {
  const rel = pianta(`src/app/${nomeTest('orfano', '.ts')}`, 'export const nulla = 1\n')
  const a = analizza(RADICE)
  assert(a.orfaniSrc.some((v) => v.path === rel), 'l\'orfano piantato non è stato trovato')
})

// ── 2. NON tocca un modulo importato ─────────────────────────────────────────
prova('lascia stare un modulo che qualcuno importa', (pianta) => {
  // Serve un modulo raggiungibile da una radice del grafo. La versione di prima
  // infilava l'import in cima a src/main.tsx e lo toglieva nel `finally` — e
  // quando il processo veniva ucciso a metà, in main.tsx restava un import
  // verso un file appena cancellato: l'app non partiva più. Due interruzioni
  // ne hanno lasciati due, uno sopra l'altro.
  //
  // Adesso non si tocca niente di esistente: si piantano DUE file. Uno sta in
  // scripts/, che è già una radice del grafo (li invoca npm, non un import), e
  // importa l'altro. La catena radice → modulo è vera quanto prima, ma vive
  // tutta dentro roba usa e getta.
  const nome = nomeTest('usato', '.ts')
  const rel = pianta(`src/app/${nome}`, 'export const usato = 1\n')
  pianta(`scripts/${nomeTest('radice', '.mjs')}`, `import "../src/app/${nome}"\n`)

  const a = analizza(RADICE)
  assert(
    !a.orfaniSrc.some((v) => v.path === rel),
    'un modulo importato è stato scambiato per orfano',
  )
})

// ── 3. NON tocca una cartella indirizzata a runtime ──────────────────────────
prova('protegge gli asset chiamati per nome costruito (/emoji/, /models/tex/)', (pianta) => {
  // Nessun file del repo nomina questo .webp: per la ricerca testuale è orfano.
  // Ma sta in models/tex/, cartella che il codice indirizza con `/models/tex/${...}`,
  // quindi deve essere protetta in blocco. È il falso positivo più pericoloso
  // che questo programma possa produrre.
  const rel = pianta(`public/models/tex/${nomeTest('auto-', '.webp')}`, 'finto contenuto binario')
  const a = analizza(RADICE)
  assert(
    !a.assetOrfani.some((v) => v.path === rel),
    'un asset in una cartella dinamica è stato marcato come orfano — falso positivo grave',
  )
})

// ── 3b. Un asset fuori dalle cartelle dinamiche invece si trova ──────────────
prova('trova un asset in public/ che nessuno nomina', (pianta) => {
  const rel = pianta(`public/${nomeTest('scarto-', '.png')}`, 'finto png mai citato')
  const a = analizza(RADICE)
  assert(
    a.assetOrfani.some((v) => v.path === rel),
    'un asset davvero inutilizzato non è stato trovato',
  )
})

// ── 4. La quarantena è davvero reversibile ───────────────────────────────────
prova('mette da parte e rimette a posto, byte per byte', (pianta) => {
  const rel = pianta(`src/app/${nomeTest('ripristino', '.ts')}`, 'export const x = "contenuto da conservare"\n')
  const assoluto = path.join(RADICE, rel)
  const primaSha = sha(assoluto)

  const etichetta = '__autotest'
  metti(RADICE, [{ path: rel, bytes: fs.statSync(assoluto).size, motivo: 'prova' }], etichetta)
  assert(!fs.existsSync(assoluto), 'il file non è stato spostato via')
  assert(
    fs.existsSync(path.join(cartellaQuarantena(RADICE, etichetta), rel)),
    'il file non è arrivato in quarantena',
  )

  const esito = ripristina(RADICE, etichetta)
  assert(esito.tornati === 1, `ripristinati ${esito.tornati} file invece di 1`)
  assert(fs.existsSync(assoluto), 'il file non è tornato al suo posto')
  assert(sha(assoluto) === primaSha, 'il file è tornato diverso da com\'era')
  assert(
    !fs.existsSync(cartellaQuarantena(RADICE, etichetta)),
    'la cartella di quarantena non è stata ripulita dopo il ripristino',
  )
})

// ── 5. Le dipendenze vere non vengono dichiarate inutili ─────────────────────
prova('non dichiara inutile una dipendenza davvero importata', () => {
  const a = analizza(RADICE)
  const pkg = JSON.parse(fs.readFileSync(path.join(RADICE, 'package.json'), 'utf8'))
  const usateDavvero = ['react-router', 'gsap', 'maplibre-gl', 'clsx']
    .filter((n) => pkg.dependencies?.[n])
  for (const nome of usateDavvero) {
    assert(
      !a.dipendenzeInutili.some((d) => d.nome === nome),
      `${nome} è usata nel sito ma è stata segnalata come inutile`,
    )
  }
})

console.log('')
if (fallite) {
  console.log(C.rosso(`  ${fallite} prove fallite, ${passate} passate\n`))
  process.exitCode = 1
} else {
  console.log(C.verde(`  Tutte e ${passate} le prove passate.\n`))
}
