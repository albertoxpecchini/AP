// Contatore visite di Better Call Pekko letto dal terminale, senza aprire la
// pagina (una GET all'API non conta come visita). Stampa totale, persone online
// (chi ha aperto la pagina negli ultimi 5 minuti), visite di oggi, gli ultimi
// giorni e da dove arrivano i visitatori (nome del sito di provenienza, 'direct'
// = indirizzo scritto a mano o segnalibro).
//
//   node tools/bcp/visite.mjs              ogni 30 s, finché non si ferma con Ctrl+C
//   node tools/bcp/visite.mjs --once       una lettura sola
//   node tools/bcp/visite.mjs --ogni 10    ogni 10 s
//   BCP_API=http://localhost:5180/api/bcp/ node tools/bcp/visite.mjs   (dev server locale)

const API = process.env.BCP_API || 'https://www.bettercallpekko.it/api/bcp/'
const args = process.argv.slice(2)
const once = args.includes('--once')
const ogni = Math.max(5, Number(args[args.indexOf('--ogni') + 1]) || 30)

let prima = null

async function leggi() {
  const r = await fetch(API, { headers: { accept: 'application/json' }, cache: 'no-store' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const j = await r.json()
  if (j.offline || j.visits === undefined) throw new Error(j.error || 'database spento')
  return j
}

const ora = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const elenco = (o, n) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n)

function stampa(j) {
  const nuovi = prima ? j.visits - prima.visits : 0
  const righe = [`${ora()}  visite ${String(j.visits).padStart(7, '0')}${nuovi > 0 ? `  +${nuovi}` : ''}  ·  online ${j.online}  ·  oggi ${j.today ?? '?'}`]
  // provenienze e giorni: la prima volta e ogni volta che cambiano
  const refs = JSON.stringify(j.refs || {})
  if (!prima || refs !== JSON.stringify(prima.refs || {})) {
    const r = elenco(j.refs, 10)
    righe.push('  da: ' + (r.length ? r.map(([k, n]) => `${k} ${n}`).join(' · ') : 'ancora niente (si conta dal deploy di oggi)'))
  }
  const giorni = Object.entries(j.days || {}).slice(-7)
  if (giorni.length && (!prima || JSON.stringify(j.days) !== JSON.stringify(prima.days))) righe.push('  giorni: ' + giorni.map(([d, n]) => `${d.slice(5)} ${n}`).join(' · '))
  console.log(righe.join('\n'))
  prima = j
}

async function giro() {
  try {
    stampa(await leggi())
  } catch (e) {
    console.log(`${ora()}  errore: ${e.message}`)
  }
}

console.log(`Better Call Pekko · ${API}${once ? '' : ` · ogni ${ogni} s (Ctrl+C per fermare)`}`)
await giro()
if (!once) setInterval(giro, ogni * 1000)
