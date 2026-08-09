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
const TOKEN = '__t' + crypto.randomBytes(5).toString('hex')
const nomeTest = (prefisso, estensione) => `${prefisso}${TOKEN}${estensione}`

let passate = 0
let fallite = 0

function prova(nome, fn) {
  const daPulire = []
  const pianta = (rel, contenuto) => {
    const p = path.join(RADICE, rel)
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, contenuto)
    daPulire.push(rel)
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
    }
  }
}

const assert = (cond, messaggio) => { if (!cond) throw new Error(messaggio) }
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')

console.log(C.forte('\n  Prove di sicurezza del programma di pulizia\n'))

// ── 1. Trova un modulo orfano ────────────────────────────────────────────────
prova('riconosce un modulo che nessuno importa', (pianta) => {
  const rel = pianta(`src/app/${nomeTest('orfano', '.ts')}`, 'export const nulla = 1\n')
  const a = analizza(RADICE)
  assert(a.orfaniSrc.some((v) => v.path === rel), 'l\'orfano piantato non è stato trovato')
})

// ── 2. NON tocca un modulo importato ─────────────────────────────────────────
prova('lascia stare un modulo che qualcuno importa', (pianta) => {
  // Piantato E importato da un file già raggiungibile: deve risultare vivo.
  const nome = nomeTest('usato', '.ts')
  const rel = pianta(`src/app/${nome}`, 'export const usato = 1\n')
  const mainPath = path.join(RADICE, 'src/main.tsx')
  const originale = fs.readFileSync(mainPath, 'utf8')
  try {
    fs.writeFileSync(mainPath, `import "./app/${nome}"\n` + originale)
    const a = analizza(RADICE)
    assert(
      !a.orfaniSrc.some((v) => v.path === rel),
      'un modulo importato è stato scambiato per orfano',
    )
  } finally {
    fs.writeFileSync(mainPath, originale)
  }
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
