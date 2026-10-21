#!/usr/bin/env node
// La serranda di pzkko.it, da allungare, comprimere e riempire senza toccare a mano
// index.html e disposizione.js. Pensato per chi ci lavora (Alberto o Claude): ogni
// comando scrive i file e dice cosa ha fatto; poi `rifai` rimette in fila tutto
// (disposizione misurata, 404, foto dei volantini per la scena 3D, foto di prova).
// La scena 3D si adatta da sola: la saracinesca è alta quanto la parete del DOM.
//
//   node tools/pzkko/serranda.mjs [stato]
//       quanto è alta la parete (unità e metri), le manopole, le colonne: quanti
//       pezzi, dove finiscono, quanto spazio resta in fondo a ognuna
//   node tools/pzkko/serranda.mjs allunga [--sopra=N] [--sotto=N] [--minimo=N] [--telefono|--entrambi]
//       la allunga di N unità in cima (tutto scende: lo spazio nuovo è sopra, dove
//       si mette la roba nuova) o in fondo; --minimo fissa un'altezza minima
//   node tools/pzkko/serranda.mjs comprimi [P] [--scala=S] [--annulla] [--telefono|--entrambi]
//       stringe le pile: ogni pezzo spinge giù il successivo del P% in meno (si
//       sovrappongono di più: ci sta altra roba); --scala rimpicciolisce i pezzi
//       (0,9 = 90%); --annulla torna a 1 e 1
//   node tools/pzkko/serranda.mjs volantino --titolo="…" [--testo="…"] [--link=URL] [--handle="…"]
//       [--mano="in arrivo"] [--carta=giallo] [--arte=arte2/dadi] [--aw=44] [--marker=#a50d25]
//       [--zona=siti|social|games|tools] [--colonna=N] [--mcolonna=N] [--dopo=chiave] [--larg=260] [--mlarg=185]
//       scrive il volantino in index.html (nella sezione della zona) e lo mette nelle pile del computer e del
//       telefono: in fondo alla colonna più corta, o dopo il pezzo `dopo` (chiave: 'vol:titolo', '#id' o il
//       percorso dell'immagine sotto art/ senza .webp)
//   node tools/pzkko/serranda.mjs pezzo --img=manifesti2/x [--tipo=man|tag|pezzo] [--colonna=N] [--mcolonna=N]
//       [--dopo=chiave] [--larg=230] [--mlarg=150]
//       un manifesto (o un graffito, un resto di nastro) già in art/, nelle pile
//   node tools/pzkko/serranda.mjs rifai [--senza-foto]
//       disponi.mjs tutto, genera-404.mjs, genera-storia.mjs e disponi.mjs tutto --pagina=storia, scena/cattura.mjs,
//       scena/carico.mjs (le foto del caricamento, della home e della storia) e le foto della scena 3D in
//       tools/pzkko/lavoro/ (computer in cima, a metà e in fondo; telefono a un terzo; la storia in cima), da guardare
//       prima di pubblicare
//
//   --prova (con volantino, pezzo, allunga, comprimi): dice cosa farebbe e non scrive niente
//   --pagina=storia (con stato, allunga, comprimi): il muro della storia (pzkko/storia/, le sue pile in
//       storia/disposizione.js); i suoi fogli si scrivono a mano lì, volantino e pezzo sono solo per la home
//
// Dalla cartella albertopecchini.it. Servono `npm ci` lì (sharp) e in tools/catture (puppeteer-core), e un browser
// (Chromium di Playwright o Edge: browser.mjs).
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcola, PAGINE } from './disponi.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = join(QUI, '../..')
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
// la pagina col muro: la home, o con --pagina=storia la storia (disponi.mjs, PAGINE)
const pagina = arg('pagina', 'home')
if (!PAGINE[pagina]) { console.error(`serranda: --pagina=${Object.keys(PAGINE).join('|')}`); process.exit(1) }
const PAGINA = PAGINE[pagina].file, DISP = PAGINE[pagina].disp
const ha = (n) => process.argv.includes(`--${n}`)
const prova = ha('prova')
const [cmd = 'stato', primo] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
// metri per unità della parete: 2,048 m su 1280 sul computer, 0,95 m su 390 sul telefono (scena/scena.js)
const METRI = { desk: 2.048 / 1280, mob: 0.95 / 390 }
const CARTE = ['bianco', 'giallo', 'kraft', 'giornale', 'arancio', 'verde', 'crema', 'lucido', 'azzurro']
const ZONE = ['siti', 'social', 'games', 'tools']
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
// una stringa per disposizione.js, con gli apici singoli come le altre (doppi se dentro c'è un apostrofo)
const js = (s) => (s.includes("'") ? JSON.stringify(s) : `'${s}'`)

// ── disposizione.js: le manopole e le pile ───────────────────────────────────
// Il file resta scritto a mano (commenti, una riga per pezzo): qui si cambiano solo le righe che servono
const parti = (testo) => {
  const d = testo.indexOf('export const DESK = {'), m = testo.indexOf('export const MOB = {')
  if (d < 0 || m < 0) throw new Error('disposizione.js: non trovo DESK e MOB')
  return { desk: [d, m], mob: [m, testo.length] }
}
const MANOPOLE = { top: 0, bottom: 40, minimo: 0, passo: 1, scala: 1 }
// la riga delle manopole, subito dopo `gap:`; la scrive se non c'è
const manopole = (testo, vista, nuove = null) => {
  const [a, b] = parti(testo)[vista]
  let sez = testo.slice(a, b)
  const riga = sez.match(/\n  \/\/ manopole \(serranda\.mjs\)[^\n]*\n  (top: [^\n]*),\r?\n/)
  const attuali = { ...MANOPOLE }
  if (riga) for (const kv of riga[1].split(',')) { const [k, v] = kv.split(':').map((x) => x.trim()); if (k in attuali && v !== '') attuali[k] = Number(v) }
  if (!nuove) return { attuali, testo }
  const val = { ...attuali, ...nuove }
  const testoRiga = `\n  // manopole (serranda.mjs): spazio in cima e in fondo, altezza minima, passo delle pile, larghezza dei pezzi\n  ${Object.entries(val).map(([k, v]) => `${k}: ${Math.round(v * 1000) / 1000}`).join(', ')},\n`
  if (riga) sez = sez.replace(riga[0], testoRiga)
  else sez = sez.replace(/\n  gap: [^\n]*\n/, (g) => g + testoRiga.slice(1))
  return { attuali: val, testo: testo.slice(0, a) + sez + testo.slice(b) }
}
// mette una riga nella pila `colonna` (0, 1, …) della vista: dopo il pezzo `dopo`, o in fondo alla colonna
const inPila = (testo, vista, colonna, riga, dopo = null) => {
  const [a, b] = parti(testo)[vista]
  let sez = testo.slice(a, b)
  const cols = [...sez.matchAll(/\n    \{ x: -?\d+, items: \[\r?\n/g)]
  if (!cols[colonna]) throw new Error(`${vista}: non c'è la colonna ${colonna} (ce ne sono ${cols.length})`)
  const inizio = cols[colonna].index + cols[colonna][0].length, fine = sez.indexOf('\n    ] },', inizio)
  let dove = fine
  if (dopo) {
    const chiave = dopo.startsWith('vol:') ? `V(${js(dopo.slice(4))})` : js(dopo)
    const alt = dopo.startsWith('vol:') ? `V(${JSON.stringify(dopo.slice(4))})` : chiave
    const i = [sez.indexOf(`k: ${chiave}`, inizio), sez.indexOf(`k: ${alt}`, inizio)].filter((x) => x >= 0 && x < fine)[0]
    if (i === undefined) throw new Error(`${vista}: nella colonna ${colonna} non c'è ${dopo}`)
    dove = sez.indexOf('\n', i)
  }
  sez = sez.slice(0, dove) + '\n' + riga + sez.slice(dove)
  return testo.slice(0, a) + sez + testo.slice(b)
}
// la colonna più corta (che finisce più in alto) nella disposizione di adesso
const piuCorta = (fondi) => fondi.indexOf(Math.min(...fondi))
const giro = () => { const g = 1.5 + Math.random() * 2.5; return Math.round((Math.random() < 0.5 ? -g : g) * 2) / 2 }

// ── i comandi ────────────────────────────────────────────────────────────────
async function stato() {
  const { d, m, html } = await calcola(pagina)
  const testo = await readFile(DISP, 'utf8')
  for (const [vista, r, nome] of [['desk', d, 'computer (1280 unità di larghezza)'], ['mob', m, 'telefono (390 unità)']]) {
    const scritta = vista === 'desk' ? html.match(/\.parete\{position:relative;height:calc\((\d+) \* var/)?.[1] : html.match(/\.parete\{height:calc\((\d+) \* var\(--u\)\);max-width:600px/)?.[1]
    const { attuali } = manopole(testo, vista)
    console.log(`\n${nome}`)
    console.log(`  parete: ${scritta} unità in ${pagina === 'home' ? 'index.html' : 'storia/index.html'}, ${r.parete} dalle pile → saracinesca 3D alta ${(r.parete * METRI[vista]).toFixed(2)} m`)
    console.log(`  manopole: ${Object.entries(attuali).map(([k, v]) => `${k} ${v}`).join(', ')}`)
    r.spec.cols.forEach((c, i) => console.log(`  colonna ${i} (x ${c.x}): ${String(c.items.length).padStart(2)} pezzi, finisce a ${r.fondi[i]}, libere in fondo ${r.parete - r.fondi[i]} unità${i === piuCorta(r.fondi) ? '  ← la più corta' : ''}`))
  }
  console.log('\n(le altezze dei volantini sono quelle misurate l\'ultima volta: rettangoli.json, da disponi.mjs misura)')
}

async function allunga() {
  const vedi = ha('entrambi') ? ['desk', 'mob'] : ha('telefono') ? ['mob'] : ['desk']
  let testo = await readFile(DISP, 'utf8')
  for (const v of vedi) {
    const { attuali } = manopole(testo, v)
    const nuove = {}
    if (arg('sopra')) nuove.top = attuali.top + Number(arg('sopra'))
    if (arg('sotto')) nuove.bottom = attuali.bottom + Number(arg('sotto'))
    if (arg('minimo')) nuove.minimo = Number(arg('minimo'))
    if (!Object.keys(nuove).length) throw new Error('allunga: --sopra=N, --sotto=N o --minimo=N')
    testo = manopole(testo, v, nuove).testo
    console.log(`${v === 'desk' ? 'computer' : 'telefono'}: ${Object.entries(nuove).map(([k, x]) => `${k} ${attuali[k]} → ${x}`).join(', ')}`)
  }
  await scrivi(testo)
}

async function comprimi() {
  const vedi = ha('entrambi') ? ['desk', 'mob'] : ha('telefono') ? ['mob'] : ['desk']
  let testo = await readFile(DISP, 'utf8')
  for (const v of vedi) {
    const { attuali } = manopole(testo, v)
    const nuove = ha('annulla') ? { passo: 1, scala: 1 } : {}
    if (primo !== undefined && !ha('annulla')) nuove.passo = attuali.passo * (1 - Number(primo) / 100)
    if (arg('scala')) nuove.scala = Number(arg('scala'))
    if (!Object.keys(nuove).length) throw new Error('comprimi: una percentuale (es. comprimi 10), --scala=0.9 o --annulla')
    if (nuove.passo !== undefined && (nuove.passo < 0.5 || nuove.passo > 1.5)) throw new Error(`comprimi: passo ${nuove.passo.toFixed(2)} fuori misura (0,5–1,5): i fogli si coprirebbero tutti`)
    testo = manopole(testo, v, nuove).testo
    console.log(`${v === 'desk' ? 'computer' : 'telefono'}: ${Object.entries(nuove).map(([k, x]) => `${k} ${attuali[k]} → ${Math.round(x * 1000) / 1000}`).join(', ')}`)
  }
  await scrivi(testo)
}

// le misure di un'immagine sotto art/ (per width e height dell'<img>)
const misure = async (img) => {
  const sharp = createRequire(join(SITO, 'package.json'))('sharp')
  const m = await sharp(join(SITO, 'pzkko/art', `${img}.webp`)).metadata()
  return { w: m.width, h: m.height }
}

// (volantino e pezzo sanno dove si scrive nella home; i fogli della storia si scrivono a mano)
const soloHome = (cmd) => { if (pagina !== 'home') throw new Error(`${cmd}: solo per la home; i fogli della storia si scrivono in pzkko/storia/index.html e tools/pzkko/storia/disposizione.js`) }

async function volantino() {
  soloHome('volantino')
  const titolo = arg('titolo')
  if (!titolo) throw new Error('volantino: --titolo="…"')
  let html = await readFile(PAGINA, 'utf8'), testo = await readFile(DISP, 'utf8')
  const chiave = 'vol:' + titolo.trim()
  if (html.includes(`>${esc(titolo)}</a></h3>`) || html.includes(`<h3>${esc(titolo)}</h3>`)) throw new Error(`c'è già un volantino «${titolo}»`)
  // la carta: quella chiesta, o una delle meno usate
  const usate = Object.fromEntries(CARTE.map((c) => [c, (html.match(new RegExp(`vol it c-${c}\\b`, 'g')) ?? []).length]))
  const carta = arg('carta') ?? CARTE.sort((a, b) => usate[a] - usate[b] || Math.random() - 0.5)[0]
  if (!CARTE.includes(carta)) throw new Error(`carta: una di ${CARTE.join(', ')}`)
  const larg = Number(arg('larg', 260)), mlarg = Number(arg('mlarg', 185)), r = giro(), marker = arg('marker', '#a50d25')
  const righe = []
  if (arg('arte')) { const { w, h } = await misure(arg('arte')); righe.push(`<img class="arte" loading="lazy" src="/art/${arg('arte')}.webp" alt="" width="${w}" height="${h}" style="--aw:${arg('aw', 44)}%">`) }
  righe.push(arg('link') ? `<h3><a href="${esc(arg('link'))}" rel="noopener" target="_blank">${esc(titolo)}</a></h3>` : `<h3>${esc(titolo)}</h3>`)
  if (arg('testo')) righe.push(`<p>${esc(arg('testo'))}</p>`)
  if (arg('handle')) righe.push(`<p class="handle">${esc(arg('handle'))}</p>`)
  if (arg('mano')) righe.push(`<p class="mano${arg('link') ? ' vai' : ''}">${esc(arg('mano'))}</p>`)
  const zona = arg('zona')
  if (zona && !ZONE.includes(zona)) throw new Error(`zona: una di ${ZONE.join(', ')}`)
  const rientro = zona ? '        ' : '      '
  const articolo = `${rientro}<article class="vol it c-${carta}" style="--x:0;--y:0;--w:${larg};--r:${r}deg;--mx:0;--my:0;--mw:${mlarg};--mr:${r}deg;--marker-c:${marker}">
${rientro}  <div class="foglio" aria-hidden="true"></div>
${rientro}  <div class="testo">
${righe.map((x) => `${rientro}    ${x}`).join('\n')}
${rientro}  </div>
${rientro}</article>
`
  // nella sua zona (prima della fine della sezione), o fuori dalle zone, prima dei nastri attaccati sopra
  if (zona) {
    const s = html.indexOf(`<section class="gruppo" aria-labelledby="${zona}">`)
    const fine = html.indexOf('      </section>', s)
    if (s < 0 || fine < 0) throw new Error(`index.html: non trovo la sezione ${zona}`)
    html = html.slice(0, fine) + '\n' + articolo + html.slice(fine)
  } else {
    const i = html.indexOf('      <!-- attaccati sopra con lo scotch -->')
    if (i < 0) throw new Error('index.html: non trovo «attaccati sopra con lo scotch»')
    html = html.slice(0, i) + articolo + '\n' + html.slice(i)
  }
  testo = await nellePile(testo, `{ k: V(${js(titolo.trim())}), w: ${larg}, gap: -15, r: ${r} }`, `{ k: V(${js(titolo.trim())}), w: ${mlarg}, gap: -12, r: ${r} }`)
  if (prova) { console.log(articolo); return }
  await writeFile(PAGINA, html); await scrivi(testo)
  console.log(`volantino «${titolo}» (${chiave}, carta ${carta}) in index.html e nelle pile: ora node tools/pzkko/serranda.mjs rifai`)
}

async function pezzo() {
  soloHome('pezzo')
  const img = arg('img'), tipo = arg('tipo', 'man')
  if (!img) throw new Error('pezzo: --img=manifesti2/x (sotto art/, senza .webp)')
  let html = await readFile(PAGINA, 'utf8'), testo = await readFile(DISP, 'utf8')
  if (html.includes(`src="/art/${img}.webp"`)) throw new Error(`${img} è già sul muro`)
  const { w, h } = await misure(img)
  const larg = Number(arg('larg', 230)), mlarg = Number(arg('mlarg', 150)), r = giro()
  const tag = `      <img class="it ${tipo}" src="/art/${img}.webp" alt="" width="${w}" height="${h}" loading="lazy" style="--x:0;--y:0;--w:${larg};--r:${r}deg;--mx:0;--my:0;--mw:${mlarg};--mr:${r}deg">\n`
  // i graffiti stanno con quelli che c'erano già, i manifesti e il resto prima dei volantini dei siti (sotto di loro)
  const segno = tipo === 'tag' ? '      <img class="it man"' : '      <!-- i miei siti:'
  const i = html.indexOf(segno)
  if (i < 0) throw new Error(`index.html: non trovo «${segno.trim()}»`)
  html = html.slice(0, i) + tag + html.slice(i)
  testo = await nellePile(testo, `{ k: '${img}', w: ${larg}, gap: -15, r: ${r} }`, `{ k: '${img}', w: ${mlarg}, gap: -12, r: ${r} }`)
  if (prova) { console.log(tag); return }
  await writeFile(PAGINA, html); await scrivi(testo)
  console.log(`${img} (${tipo}) in index.html e nelle pile: ora node tools/pzkko/serranda.mjs rifai`)
}

// la riga nelle pile del computer e del telefono: nella colonna chiesta o nella più corta, dopo `dopo` o in fondo
async function nellePile(testo, rigaD, rigaM) {
  const { d, m } = await calcola(pagina)
  const cd = arg('colonna') !== undefined ? Number(arg('colonna')) : piuCorta(d.fondi)
  const cm = arg('mcolonna') !== undefined ? Number(arg('mcolonna')) : piuCorta(m.fondi)
  const dopo = arg('dopo') ?? null
  testo = inPila(testo, 'desk', cd, `      ${rigaD},`, dopo && d.spec.cols[cd].items.some((it) => it.k === dopo) ? dopo : null)
  testo = inPila(testo, 'mob', cm, `      ${rigaM},`, dopo && m.spec.cols[cm].items.some((it) => it.k === dopo) ? dopo : null)
  console.log(`nelle pile: computer colonna ${cd}, telefono colonna ${cm}${dopo ? `, dopo ${dopo} (dove c'è)` : ', in fondo'}`)
  return testo
}

const scrivi = async (testo) => { if (prova) console.log('(--prova: niente scritto)'); else await writeFile(DISP, testo) }

// Un rifai alla volta: due insieme (il 21.10, da due sessioni) si riscrivono a vicenda index.html, le foto dei
// volantini e quelle del caricamento, e le foto di uno vengono metà con la parete di prima e metà con quella nuova.
// Il lucchetto è il pid di chi lavora; se quel processo non c'è più (fermato a metà) il lucchetto non vale.
const LUCCHETTO = join(QUI, 'lavoro/rifai.lucchetto')
async function chiudi() {
  for (;;) {
    try { await writeFile(LUCCHETTO, String(process.pid), { flag: 'wx' }); return } catch (e) { if (e.code !== 'EEXIST') throw e }
    const pid = Number(await readFile(LUCCHETTO, 'utf8').catch(() => 0))
    let vivo = false
    try { process.kill(pid, 0); vivo = pid > 0 } catch {}
    if (vivo) throw new Error(`c'è già un rifai in corso (processo ${pid}): aspetta che finisca (se sei sicuro che non c'è, cancella ${LUCCHETTO})`)
    await unlink(LUCCHETTO).catch(() => {})
  }
}

async function rifai() {
  await chiudi()
  try { await rifaiTutto() } finally { await unlink(LUCCHETTO).catch(() => {}) }
}

async function rifaiTutto() {
  const passo = (titolo, args) => {
    console.log(`\n── ${titolo}`)
    const r = spawnSync(process.execPath, args, { cwd: SITO, stdio: 'inherit' })
    if (r.status !== 0) throw new Error(`${titolo}: non è andato (codice ${r.status})`)
  }
  passo('la disposizione, misurata nel browser', ['tools/pzkko/disponi.mjs', 'tutto', '--foto'])
  passo('la 404', ['tools/pzkko/genera-404.mjs'])
  // la storia: rifatta dalla home (il suo CSS e il suo script cambiano con lei), poi le sue pile, misurate
  passo('la storia', ['tools/pzkko/genera-storia.mjs'])
  passo('la disposizione della storia', ['tools/pzkko/disponi.mjs', 'tutto', '--foto', '--pagina=storia'])
  passo('le foto dei volantini per la scena 3D', ['tools/pzkko/scena/cattura.mjs'])
  // (la foto del caricamento è la strada da lontano: con la parete più alta o più bassa non coinciderebbe più)
  passo('le foto del caricamento', ['tools/pzkko/scena/carico.mjs'])
  if (!ha('senza-foto')) {
    for (const [nome, a] of [['serranda-cima', ['--scroll=0']], ['serranda-meta', ['--scroll=0.5']], ['serranda-fondo', ['--scroll=1']], ['serranda-telefono', ['--larg=390', '--alt=844', '--dpr=2', '--scroll=0.3']], ['serranda-storia', ['--pagina=/storia/', '--scroll=0']]]) {
      passo(`la scena 3D: ${nome}`, ['tools/pzkko/scena/foto.mjs', '--ora=12:00', `--nome=${nome}`, ...a])
    }
    console.log('\nguarda tools/pzkko/lavoro/scena-serranda-*.png (e muro-desk.png, muro-mob.png, storia-desk.png e storia-mob.png per le pagine senza 3D)')
  }
}

const COMANDI = { stato, allunga, comprimi, volantino, pezzo, rifai }
if (!COMANDI[cmd]) { console.error(`comandi: ${Object.keys(COMANDI).join(', ')} (vedi l'inizio di tools/pzkko/serranda.mjs)`); process.exit(1) }
try { await COMANDI[cmd]() } catch (e) { console.error('serranda:', e.message); process.exit(1) }
