// Il programma amministratore del blackjack di pzkko.it: dal terminale pzkko
// regala o toglie $pzk, registra gli amici, cambia limiti e tempi, guarda il
// tavolo. Parla con /api/blackjack/ come la pagina admin, con la chiave
// BJ_ADMIN_KEY di .env.local (la stessa impostata su Vercel).
//
//   node tools/blackjack/admin.mjs elenco                 giocatori, $pzk, codici
//   node tools/blackjack/admin.mjs dai mario 500          regala 500 $pzk
//   node tools/blackjack/admin.mjs togli mario 100
//   node tools/blackjack/admin.mjs imposta mario 1000     porta il saldo a 1000
//   node tools/blackjack/admin.mjs nuovo mario 500        registra mario con 500 $pzk e stampa il codice
//   node tools/blackjack/admin.mjs codice mario           il codice per rientrare da un altro telefono
//   node tools/blackjack/admin.mjs benvenuto 100          $pzk a chi entra la prima volta
//   node tools/blackjack/admin.mjs limiti 5 500           puntata minima e massima
//   node tools/blackjack/admin.mjs tempi 20 20            secondi per le puntate e per ogni decisione
//   node tools/blackjack/admin.mjs espelli mario          lo fa alzare
//   node tools/blackjack/admin.mjs elimina mario          lo cancella (i $pzk spariscono)
//   node tools/blackjack/admin.mjs messaggio "si gioca alle 21"
//   node tools/blackjack/admin.mjs azzera                 tavolo da capo, giocatori e $pzk restano
//   node tools/blackjack/admin.mjs stato                  il tavolo adesso
//   node tools/blackjack/admin.mjs guarda                 il tavolo in diretta, ogni secondo
//
// Opzioni: --locale (server di sviluppo su localhost:5190), BJ_API=… per un altro indirizzo.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
try {
  for (const riga of fs.readFileSync(path.join(radice, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(riga)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const locale = process.argv.includes('--locale')
const API = process.env.BJ_API || (locale ? 'http://localhost:5190/api/blackjack/' : 'https://www.pzkko.it/api/blackjack/')
const KEY = locale && !process.env.BJ_ADMIN_KEY ? 'prova-locale' : process.env.BJ_ADMIN_KEY
const [cmd, ...resto] = args

const fmt = (n) => Number(n || 0).toLocaleString('it-IT')
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const esci = (msg) => {
  console.error(msg)
  process.exit(1)
}

async function posta(body) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({ error: `risposta non valida (${r.status})` }))
  if (!j.ok) esci(`no: ${j.error || r.status}`)
  return j
}
async function leggi() {
  const r = await fetch(API, { headers: { accept: 'application/json' }, cache: 'no-store' })
  const j = await r.json().catch(() => ({ error: `risposta non valida (${r.status})` }))
  if (!j.ok) esci(`no: ${j.error || r.status}`)
  return j
}
const ammin = (c, extra = {}) => {
  if (!KEY) esci('manca BJ_ADMIN_KEY in .env.local')
  return posta({ a: 'ammin', key: KEY, cmd: c, ...extra })
}

const carta = (c) => c.slice(0, -1) + { c: '♥', q: '♦', f: '♣', p: '♠' }[c.slice(-1)]
function tavolo(st) {
  const righe = []
  const resta = st.fine ? Math.max(0, Math.round((st.fine - st.now) / 1000)) : null
  righe.push(`mano ${st.mano} · fase ${st.fase}${resta !== null ? ` (${resta} s)` : ''} · sabot ${st.sabot.carte} carte`)
  righe.push(`banco: ${st.banco.carte.map((x) => carta(x.c)).join(' ') || '—'}`)
  st.posti.forEach((p, i) => {
    if (!p) return righe.push(`posto ${i + 1}: libero`)
    const turno = st.turno && st.turno.posto === i ? ' ◀ tocca a lui' : ''
    const mani = p.mani.map((m) => `${m.carte.map((x) => carta(x.c)).join(' ')} [${m.stato}${m.esito ? ' ' + m.esito + ' ' + (m.delta > 0 ? '+' : '') + m.delta : ''}]`).join(' | ')
    righe.push(`posto ${i + 1}: ${p.nome} ${fmt(p.pzk)} $pzk${p.puntata ? ` punta ${p.puntata}` : ''}${p.salta ? ' (salta)' : ''}${p.online ? '' : ' (offline)'} ${mani}${turno}`)
  })
  righe.push('ultimi eventi:')
  for (const e of st.eventi.slice(-5)) righe.push(`  ${ora(e.t)} ${e.testo}`)
  return righe.join('\n')
}

function elenco(priv) {
  if (!priv.giocatori.length) return 'nessun giocatore registrato'
  const r = priv.giocatori.map((g) => `${g.nome.padEnd(15)} ${fmt(g.pzk).padStart(8)} $pzk  ${g.posto !== null ? 'posto ' + (g.posto + 1) : 'in piedi'}  mani ${g.stat.mani} (+${g.stat.vinte} −${g.stat.perse} =${g.stat.pari})  netto ${g.stat.netto > 0 ? '+' : ''}${fmt(g.stat.netto)}  codice ${g.tok}`)
  r.push(`benvenuto ${fmt(priv.config.benvenuto)} · puntate ${fmt(priv.config.min)}–${fmt(priv.config.max)} · tempi ${priv.config.tPuntate / 1000}/${priv.config.tDecisione / 1000} s`)
  return r.join('\n')
}

switch (cmd) {
  case 'elenco': {
    const j = await ammin('elenco')
    console.log(elenco(j.privato))
    break
  }
  case 'dai':
  case 'togli':
  case 'imposta': {
    const [chi, quanti] = resto
    if (!chi || !quanti) esci(`uso: ${cmd} <nome> <quanti>`)
    const j = await ammin(cmd, { chi, quanti: Number(quanti) })
    console.log(j.esito)
    break
  }
  case 'nuovo': {
    const [nome, quanti] = resto
    if (!nome) esci('uso: nuovo <nome> [quanti]')
    const j = await ammin('nuovo', { nome, quanti: Number(quanti || 0) })
    console.log(j.esito)
    console.log(`da mandare: «entra su https://www.pzkko.it/games/blackjack/ col codice ${j.io.tok}»`)
    break
  }
  case 'codice': {
    const [chi] = resto
    if (!chi) esci('uso: codice <nome>')
    const j = await ammin('elenco')
    const g = j.privato.giocatori.find((x) => x.nome.toLowerCase() === chi.toLowerCase() || x.id === chi)
    if (!g) esci('giocatore non trovato')
    console.log(`${g.nome}: codice ${g.tok}`)
    break
  }
  case 'benvenuto': {
    const j = await ammin('benvenuto', { quanti: Number(resto[0]) })
    console.log(j.esito)
    break
  }
  case 'limiti': {
    const j = await ammin('limiti', { min: Number(resto[0]), max: Number(resto[1]) })
    console.log(j.esito)
    break
  }
  case 'tempi': {
    const j = await ammin('tempi', { puntate: Number(resto[0]), decisione: Number(resto[1]) })
    console.log(j.esito)
    break
  }
  case 'espelli':
  case 'elimina': {
    if (!resto[0]) esci(`uso: ${cmd} <nome>`)
    const j = await ammin(cmd, { chi: resto[0] })
    console.log(j.esito)
    break
  }
  case 'messaggio': {
    const j = await ammin('messaggio', { testo: resto.join(' ') })
    console.log(j.esito)
    break
  }
  case 'azzera': {
    const j = await ammin('azzera')
    console.log(j.esito)
    break
  }
  case 'stato': {
    console.log(tavolo(await leggi()))
    break
  }
  case 'guarda': {
    for (;;) {
      const st = await leggi().catch((e) => e)
      console.clear()
      console.log(st instanceof Error ? st.message : tavolo(st))
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  default:
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 24).map((l) => l.slice(3)).join('\n'))
}
