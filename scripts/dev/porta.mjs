// ── Chi c'è sulla porta 5173 ─────────────────────────────────────────────────
//
// `strictPort: true` in vite.config.ts è una scelta voluta: il dev server deve
// stare SEMPRE sulla 5173, perché lì puntano il debug di Edge (.vscode),
// il benchmark del janitor, i link che ci si scambia. Un Vite che ripiega da
// solo sulla 5174 è peggio di uno che non parte: le pagine si aprono, ma su
// un server che non è quello che si sta guardando.
//
// Il prezzo di quella scelta è che un secondo `vite` sulla stessa porta muore
// con EADDRINUSE e una riga sola, senza dire CHI c'è dentro. Questo modulo
// risponde a quella domanda prima di lanciare Vite — e sa distinguere il caso
// «c'è un nostro dev server rimasto acceso» (si toglie di mezzo) da «c'è un
// programma che non conosco» (non si tocca, si spiega).

import { execFileSync } from 'node:child_process'
import net from 'node:net'

const WIN = process.platform === 'win32'

/**
 * Bussa alla porta e guarda chi risponde.
 *   'vite'   un dev server di Vite (ha /@vite/client, che nessun altro serve)
 *   'altro'  qualcosa risponde in HTTP, ma non è Vite
 *   'lento'  la connessione si apre e la risposta non arriva entro il tempo
 *   null     nessuno risponde: la porta è libera
 *
 * 'lento' e null sono due cose diverse e tenerle separate è il punto di tutta
 * la funzione. Chi deve decidere se la porta è occupata li tratta uguali (in
 * entrambi i casi qualcuno c'è). Chi sorveglia la salute no: un rifiuto secco
 * vuol dire che il server non c'è più, un ritardo vuol dire che sta lavorando
 * — magari sta trasformando duecento moduli per la prima pagina che si apre.
 * Confonderli significa spegnere un server sano proprio mentre serve.
 *
 * La sonda non è la home: `/` la servirebbe anche un `python -m http.server`
 * puntato per sbaglio sulla cartella. /@vite/client esiste solo se dall'altra
 * parte c'è il dev server vero, con il suo HMR attaccato.
 *
 * E si bussa a DUE indirizzi, non uno. `localhost` su Windows è sia 127.0.0.1
 * sia ::1, e un dev server può restare in ascolto solo sul secondo: chiedendo
 * al solo IPv4 si riceve un ECONNREFUSED e si conclude «porta libera», poi
 * Vite prova a mettersi lì e muore con «Port 5173 is already in use». È
 * successo davvero, ed è il motivo per cui questo pezzo esiste.
 */
export async function sonda(porta, { timeoutMs = 2000 } = {}) {
  const risposte = await Promise.all([
    bussa(`http://127.0.0.1:${porta}/@vite/client`, timeoutMs),
    bussa(`http://[::1]:${porta}/@vite/client`, timeoutMs),
  ])
  if (risposte.includes('vite')) return 'vite'
  if (risposte.includes('altro')) return 'altro'
  if (risposte.includes('lento')) return 'lento'
  return null
}

async function bussa(url, timeoutMs) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: '*/*' } })
    const tipo = res.headers.get('content-type') || ''
    return res.ok && /javascript/i.test(tipo) ? 'vite' : 'altro'
  } catch (e) {
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') return 'lento'
    return null // ECONNREFUSED e simili: da questa parte non c'è nessuno
  }
}

/** Occupata = c'è qualcuno, in qualunque stato. Serve prima di lanciare Vite. */
export const occupata = (esito) => esito !== null

/** Il pid (e il nome, dove si riesce) di chi tiene la porta in ascolto. */
export function chiOccupa(porta) {
  try {
    if (WIN) {
      // Niente '-p tcp': su Windows quel filtro mostra SOLO l'IPv4, e il caso
      // più insidioso è proprio l'altro — un Vite rimasto in ascolto su [::1].
      const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' })
      for (const riga of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(riga) || !/^\s*TCP/i.test(riga)) continue
        // Colonne: proto | locale | remoto | stato | pid. L'indirizzo locale è
        // "0.0.0.0:5173" o "[::]:5173": si guarda solo quello che sta dopo i
        // due punti finali, se no "15173" e ":51730" passerebbero per 5173.
        const p = riga.trim().split(/\s+/)
        const locale = p[1] || ''
        if (locale.slice(locale.lastIndexOf(':') + 1) !== String(porta)) continue
        const pid = Number(p[p.length - 1])
        if (Number.isFinite(pid) && pid > 0) return { pid, nome: nomeProcesso(pid) }
      }
      return null
    }
    const out = execFileSync('lsof', ['-nP', `-iTCP:${porta}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const pid = Number(out.split(/\s+/)[0])
    return Number.isFinite(pid) && pid > 0 ? { pid, nome: nomeProcesso(pid) } : null
  } catch {
    // netstat/lsof assenti o senza permessi: si sa che la porta è occupata
    // (lo dice la sonda), non si sa da chi. Meglio di un errore in faccia.
    return null
  }
}

function nomeProcesso(pid) {
  try {
    if (WIN) {
      const out = execFileSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      const m = out.match(/^"([^"]+)"/)
      return m ? m[1] : ''
    }
    return execFileSync('ps', ['-p', String(pid), '-o', 'comm='], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

/**
 * La porta è libera davvero? Provare a metterci un server è l'unica prova che
 * conta — ma va fatta sullo STESSO indirizzo su cui si metterà Vite. Con
 * `host: '127.0.0.1'` questa funzione rispondeva «libera» mentre su ::1 c'era
 * un server acceso: la domanda giusta è "localhost", che le comprende
 * entrambe, come fa Vite quando parte senza --host.
 */
export function libera(porta, host = 'localhost') {
  return new Promise((risolvi) => {
    const s = net.createServer()
    s.once('error', () => risolvi(false))
    s.once('listening', () => s.close(() => risolvi(true)))
    s.listen({ port: porta, host })
  })
}

/** La prima porta libera a partire da una data. Serve a `--porta auto`. */
export async function primaLibera(da, quante = 20) {
  for (let p = da; p < da + quante; p++) if (await libera(p)) return p
  return null
}
