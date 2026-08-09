// ── Driver del browser, senza dipendenze ─────────────────────────────────────
//
// Per misurare gli fps serve un browser vero che disegni frame veri. La strada
// normale sarebbe Playwright, ma questo è un programma che deve ALLEGGERIRE il
// repo: aggiungere ~40 MB di dipendenza per pesare il peso è una barzelletta.
//
// Quindi si parla direttamente col browser nella sua lingua, il Chrome DevTools
// Protocol: si lancia Edge (già installato su questa macchina) con
// --remote-debugging-port, gli si chiede su HTTP l'indirizzo WebSocket della
// scheda, e da lì si comanda tutto. Node ha WebSocket globale dalla v22, quindi
// non serve nemmeno il pacchetto `ws`. Dipendenze aggiunte al repo: zero.

import { spawn } from 'node:child_process'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const CANDIDATI = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
]

export function trovaBrowser() {
  for (const c of CANDIDATI) if (fs.existsSync(c)) return c
  return null
}

function portaLibera() {
  return new Promise((res, rej) => {
    const s = net.createServer()
    s.on('error', rej)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => res(port))
    })
  })
}

const dormi = (ms) => new Promise((r) => setTimeout(r, ms))

async function attendiEndpoint(porta, timeoutMs = 20000) {
  const scadenza = Date.now() + timeoutMs
  while (Date.now() < scadenza) {
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/json/list`)
      const lista = await r.json()
      const pagina = lista.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (pagina) return pagina.webSocketDebuggerUrl
    } catch {
      /* il browser non è ancora in ascolto */
    }
    await dormi(150)
  }
  throw new Error('il browser non ha aperto la porta di debug entro il tempo massimo')
}

class Sessione {
  constructor(ws) {
    this.ws = ws
    this.contatore = 0
    this.inAttesa = new Map()
    this.ascoltatori = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id != null) {
        const p = this.inAttesa.get(msg.id)
        if (!p) return
        this.inAttesa.delete(msg.id)
        clearTimeout(p.timer)
        if (msg.error) p.rej(new Error(`${msg.error.message} (${msg.error.code})`))
        else p.res(msg.result)
        return
      }
      const cb = this.ascoltatori.get(msg.method)
      // Un ascoltatore che solleva un'eccezione qui la farebbe uscire dentro il
      // gestore della WebSocket, dove nessuno la raccoglie: il benchmark
      // morirebbe per una URL malformata in un evento di rete. Che un evento
      // vada perso è molto meno grave che perdere l'intera misura.
      if (cb) {
        try {
          cb(msg.params)
        } catch {
          /* evento ignorato */
        }
      }
    })
  }

  invia(metodo, params = {}) {
    const id = ++this.contatore
    return new Promise((res, rej) => {
      // Un comando che non torna mai bloccherebbe l'intero benchmark: meglio
      // fallire con un messaggio leggibile che restare appesi per sempre.
      // Il timer si annulla alla risposta ed è unref: un timer vivo tiene in
      // piedi il ciclo di eventi di Node, e il programma resterebbe aperto a
      // non fare niente anche dopo aver finito e stampato tutto.
      const timer = setTimeout(() => {
        if (this.inAttesa.delete(id)) rej(new Error(`CDP: nessuna risposta da ${metodo}`))
      }, 120000)
      timer.unref?.()
      this.inAttesa.set(id, { res, rej, timer })
      this.ws.send(JSON.stringify({ id, method: metodo, params }))
    })
  }

  su(metodo, cb) {
    this.ascoltatori.set(metodo, cb)
  }

  /** Valuta codice nella pagina e riporta indietro il risultato come dato JSON. */
  async valuta(codice) {
    const r = await this.invia('Runtime.evaluate', {
      expression: codice,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails) {
      throw new Error(
        `errore nella pagina: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`,
      )
    }
    return r.result.value
  }
}

/**
 * Apre il browser e restituisce { sessione, chiudi }.
 *
 * `headless: false` è il default perché in modalità headless Windows spesso
 * ripiega su SwiftShader (WebGL via CPU) e i frame del garage 3D verrebbero
 * misurati su un rendering che nessun visitatore vedrà mai. La finestra vera usa
 * la GPU vera. Il compito pianificato, che gira da solo, passa `headless: true`:
 * i numeri sono comunque confrontabili perché nella stessa esecuzione il "prima"
 * e il "dopo" si misurano sempre nella stessa modalità.
 */
export async function apriBrowser({ headless = false } = {}) {
  const eseguibile = trovaBrowser()
  if (!eseguibile) throw new Error('nessun browser Chromium trovato (Edge o Chrome)')

  const porta = await portaLibera()
  const profilo = fs.mkdtempSync(path.join(os.tmpdir(), 'janitor-bench-'))

  const flag = [
    `--remote-debugging-port=${porta}`,
    `--user-data-dir=${profilo}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-features=Translate,OptimizationHints',
    // Senza queste tre il browser rallenta timer e rendering quando la finestra
    // non è in primo piano: misureremmo il risparmio energetico, non gli fps.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--window-size=1440,900',
    ...(headless ? ['--headless=new'] : []),
    'about:blank',
  ]

  const proc = spawn(eseguibile, flag, { stdio: 'ignore', detached: false })
  const wsUrl = await attendiEndpoint(porta)

  const ws = new WebSocket(wsUrl)
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', () => rej(new Error('WebSocket CDP non aperta')), { once: true })
  })

  const sessione = new Sessione(ws)
  await sessione.invia('Page.enable')
  await sessione.invia('Runtime.enable')

  const chiudi = async () => {
    try {
      await sessione.invia('Browser.close')
    } catch {
      /* già chiuso */
    }
    try {
      ws.close()
    } catch {}
    try {
      proc.kill()
    } catch {}
    // Un browser è un albero di processi: killare il capofila non porta via i
    // figli (renderer, GPU, rete), che restano in giro come processi orfani.
    // Su Windows si chiude l'albero intero, altrimenti dopo qualche esecuzione
    // ci si ritrova la memoria piena di msedge fantasma — e chi ci aspetta
    // sopra, come il compito pianificato, non riparte più.
    if (process.platform === 'win32' && proc.pid) {
      try {
        spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' })
      } catch {}
    }
    // Il profilo temporaneo può restare agganciato per un attimo dopo la
    // chiusura: se non si cancella non è un problema, è in %TEMP%.
    await dormi(300)
    try {
      fs.rmSync(profilo, { recursive: true, force: true })
    } catch {}
  }

  return { sessione, chiudi }
}

/** Naviga e aspetta che la pagina sia carica (o che scada il tempo). */
export async function vai(sessione, url, timeoutMs = 30000) {
  const caricata = new Promise((res) => {
    const timer = setTimeout(res, timeoutMs)
    timer.unref?.()
    sessione.su('Page.loadEventFired', () => { clearTimeout(timer); res() })
  })
  await sessione.invia('Page.navigate', { url })
  await caricata
}
