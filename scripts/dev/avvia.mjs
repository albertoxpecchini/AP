#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// La sala macchine del dev server — `npm run dev`
//
// Prima qui c'era `vite` e basta, con un `predev` davanti. Funziona finché
// tutto va bene, e questo repo ha tre modi ricorrenti di far andare male le
// cose in locale:
//
//  1. la porta. `strictPort: true` (voluto: il debug di Edge, il benchmark del
//     janitor e i link che ci si scambia puntano tutti alla 5173) fa morire il
//     secondo `vite` con un EADDRINUSE e nient'altro. Se il colpevole era un
//     dev server rimasto acceso da una sessione F5, la soluzione era andarlo a
//     cercare col Task Manager.
//  2. i crash. `vite dev` qui monta otto middleware /api/* scritti in casa
//     (vite.config.ts): un errore non gestito in uno di quelli, o un modulo
//     che non compila, e il processo se ne va. Chi stava guardando la pagina
//     vede solo che il sito «non risponde più».
//  3. le chiavi. I plugin leggono il .env una volta sola, all'avvio. Senza
//     ANTHROPIC_API_KEY /api/trivia risponde 500, senza RESEND le email si
//     stampano in console: cose normalissime in locale, ma scoprirle dalla
//     pagina costa mezz'ora di indagine ogni volta.
//
// Questo file è la risposta ai tre punti: prima di partire guarda chi c'è sulla
// porta e si prende il posto se è roba nostra, poi tiene Vite in piedi
// riavviandolo quando muore o quando smette di rispondere, e all'avvio dice in
// chiaro cosa funzionerà davvero e cosa girerà in finta.
//
// Comandi (vedi package.json):
//   npm run dev              in primo piano, con supervisione — Ctrl+C spegne tutto
//   npm run dev:sfondo       stacca il server e restituisce il terminale (lo usa F5)
//   npm run dev:stato        chi è acceso, su che porta, da quanto
//   npm run dev:ferma        spegne il server e i suoi figli
//   npm run dev:log          le ultime righe (con -- --segui resta in ascolto)
//
// Opzioni: --porta <n|auto>  --rete  --apri  --rigenera  --righe <n>  --segui
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { C, OK, FORSE, NO, voce, titolo, durata, orario, senzaColori } from './tinte.mjs'
import { RADICE, apriLog, ultimoLog, coda, leggiStato, scriviStato, scordaStato, uccidiAlbero, vivo } from './stato.mjs'
import { sonda, chiOccupa, primaLibera, libera } from './porta.mjs'
import { controlli, preparaArtefatti, preparaI18n, diagnosi, indirizzi } from './preparativi.mjs'

const WIN = process.platform === 'win32'
const PORTA_PREDEFINITA = 5173
const VITE = path.join(RADICE, 'node_modules', 'vite', 'bin', 'vite.js')

// Quanto si aspetta che Vite risponda dopo lo spawn. La prima volta deve
// compilare la config e i middleware: 40s è largo apposta, tanto appena
// risponde si va avanti.
const ATTESA_AVVIO_MS = 40_000
// La sonda di salute: ogni quanto si bussa, quanto si aspetta la risposta, e
// dopo quanti RIFIUTI di fila si conclude che il server non c'è più. Rifiuto,
// non ritardo: la differenza è tutta lì dentro (vedi `sorveglia`).
const SONDA_OGNI_MS = 5000
const SONDA_ATTESA_MS = 8000
const SILENZI_PER_RIAVVIO = 3
// Quanto si concede a un server che c'è ma è lento prima di considerarlo
// piantato. Due minuti sembrano tanti e non lo sono: al primo avvio Vite può
// restare fermo parecchio a pre-impacchettare le dipendenze, e in quel momento
// riavviarlo vuol dire ricominciare quel lavoro da capo.
const MUTO_MAX_MS = 120_000
// Crash a raffica: cinque partenze fallite in un minuto vuol dire che il
// problema è nel codice, non nella sfortuna. Riavviare all'infinito nasconde
// l'errore vero dietro un muro di stack trace uguali.
const CRASH_MAX = 5
const CRASH_FINESTRA_MS = 60_000

// ─── Argomenti ───────────────────────────────────────────────────────────────

function leggiArgomenti(argv) {
  const o = {
    comando: 'avvia',
    porta: PORTA_PREDEFINITA,
    portaAuto: false,
    sfondo: false,
    seServe: false,
    figlioSfondo: false,
    rete: false,
    apri: false,
    rigenera: false,
    segui: false,
    righe: 40,
  }
  const resto = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case 'stato': case 'ferma': case 'log': case 'avvia': o.comando = a; break
      case '--porta': case '-p': {
        const v = argv[++i]
        if (v === 'auto') o.portaAuto = true
        else o.porta = Number(v) || PORTA_PREDEFINITA
        break
      }
      case '--sfondo': o.sfondo = true; break
      case '--se-serve': o.seServe = true; o.sfondo = true; break
      case '--figlio-sfondo': o.figlioSfondo = true; break
      case '--rete': o.rete = true; break
      case '--apri': o.apri = true; break
      case '--rigenera': o.rigenera = true; break
      case '--segui': case '-f': o.segui = true; break
      case '--righe': o.righe = Number(argv[++i]) || 40; break
      case '--aiuto': case '-h': case '--help': o.comando = 'aiuto'; break
      default: resto.push(a)
    }
  }
  if (resto.length) console.log(C.grigio(`(ignoro: ${resto.join(' ')})`))
  return o
}

const opz = leggiArgomenti(process.argv.slice(2))

// ─── Log ─────────────────────────────────────────────────────────────────────
//
// In primo piano ci sono due destinazioni: il terminale (a colori) e il file
// (ripulito, con l'ora davanti a ogni riga). In background il processo È già
// agganciato al file, quindi si scrive una volta sola e senza colori.

let flussoLog = null
let fileLog = process.env.DEV_LOG_FILE || null

function scrivi(testo, { soloLog = false } = {}) {
  if (!soloLog) process.stdout.write(testo)
  if (flussoLog) flussoLog.write(senzaColori(testo))
}

/** Riga di servizio del supervisore: si riconosce dall'ora e dal prefisso. */
function nota(testo, tinta = C.ciano) {
  scrivi(`${C.grigio(orario())} ${tinta('dev')}  ${testo}\n`)
}

// ─── Comandi che non avviano niente ──────────────────────────────────────────

function comandoAiuto() {
  console.log(`
${C.forte('Sala macchine del dev server')}

  ${C.ciano('npm run dev')}                 avvia in primo piano (Ctrl+C spegne tutto)
  ${C.ciano('npm run dev:sfondo')}          stacca il server e restituisce il terminale
  ${C.ciano('npm run dev:stato')}           chi è acceso, su che porta, da quanto
  ${C.ciano('npm run dev:ferma')}           spegne il server e tutti i suoi figli
  ${C.ciano('npm run dev:log')}             le ultime righe del server acceso

${C.forte('Opzioni')}  (dopo ${C.grigio('--')}, es. ${C.grigio('npm run dev -- --porta auto')})

  --porta <n|auto>   porta fissa, o la prima libera dalla 5173 in su
  --rete             esponi anche sull'indirizzo di rete (telefono, tablet)
  --apri             apri il browser quando è pronto
  --rigenera         rifà i18n e versione di Trivia anche se non serve
  --segui            (con log) resta in ascolto e stampa le righe nuove
  --righe <n>        (con log) quante righe mostrare, default 40
`)
}

async function comandoStato() {
  const s = leggiStato()
  const porta = s?.porta ?? opz.porta
  const chi = await sonda(porta)
  titolo('Dev server')

  if (chi === 'vite' && s) {
    console.log(voce(OK(), 'acceso', `${s.url} — da ${durata(Date.now() - s.avviatoIl)}`))
    console.log(voce(OK(), 'processi', `supervisore ${s.pidSupervisore}, vite ${s.pidVite ?? '?'}`))
    console.log(voce(OK(), 'log', s.log || ultimoLog() || '—'))
  } else if (chi === 'vite') {
    const q = chiOccupa(porta)
    console.log(voce(FORSE(), 'acceso', `c'è un Vite sulla ${porta}, ma non l'ho avviato io${q ? ` (pid ${q.pid})` : ''}`))
  } else if (chi === 'lento') {
    console.log(voce(FORSE(), 'non risponde', `qualcosa tiene la ${porta} ma non risponde: guarda il log`))
  } else if (chi === 'altro') {
    const q = chiOccupa(porta)
    console.log(voce(NO(), 'porta occupata', `${porta} è di ${q ? `${q.nome || 'un processo'} (pid ${q.pid})` : 'qualcun altro'}`))
  } else {
    console.log(voce(NO(), 'spento', `niente in ascolto sulla ${porta}`))
    const vecchio = ultimoLog()
    if (vecchio) console.log(voce(FORSE(), 'ultimo log', vecchio))
  }

  titolo('Cosa funziona in locale')
  for (const r of diagnosi()) console.log(r)
  console.log('')
}

async function comandoFerma() {
  const s = leggiStato()
  if (s && vivo(s.pidSupervisore)) {
    uccidiAlbero(s.pidSupervisore)
    scordaStato()
    console.log(voce(OK(), 'fermato', `supervisore ${s.pidSupervisore} e figli, porta ${s.porta} libera`))
    return
  }
  // Nessuno stato: può esserci lo stesso un Vite orfano, avviato a mano o
  // sopravvissuto a un supervisore ucciso male. Si tocca solo se è Vite.
  const chi = await sonda(opz.porta)
  if (chi === 'vite') {
    const q = chiOccupa(opz.porta)
    if (q && uccidiAlbero(q.pid)) {
      console.log(voce(OK(), 'fermato', `Vite orfano (pid ${q.pid}) sulla ${opz.porta}`))
      return
    }
  }
  if (chi !== null) {
    const q = chiOccupa(opz.porta)
    console.log(voce(NO(), 'non tocco', `sulla ${opz.porta} c'è ${q ? `${q.nome || 'un processo'} (pid ${q.pid})` : 'qualcosa'} che non ho riconosciuto come Vite`))
    return
  }
  console.log(voce(OK(), 'già spento', 'niente da fermare'))
}

function comandoLog() {
  const file = leggiStato()?.log || ultimoLog()
  if (!file || !fs.existsSync(file)) {
    console.log(voce(NO(), 'niente log', 'il dev server non è mai partito da qui'))
    return
  }
  console.log(C.grigio(file + '\n'))
  console.log(coda(file, opz.righe).join('\n'))
  if (!opz.segui) return

  // Seguire il file: si guarda solo la coda nuova, per non rileggerlo intero a
  // ogni scrittura. watchFile (polling) invece di watch: su Windows watch non
  // scatta in modo affidabile quando a scrivere è un altro processo.
  let letto = fs.statSync(file).size
  console.log(C.grigio('\n… in ascolto (Ctrl+C per uscire)\n'))
  fs.watchFile(file, { interval: 400 }, (curr) => {
    if (curr.size < letto) letto = 0 // il file è stato ruotato sotto i piedi
    if (curr.size === letto) return
    const flusso = fs.createReadStream(file, { start: letto, end: curr.size - 1 })
    letto = curr.size
    flusso.pipe(process.stdout, { end: false })
  })
}

// ─── Porta: prendersi il posto, o spiegare perché non si può ─────────────────

async function assicuraPorta() {
  if (opz.portaAuto) {
    const p = await primaLibera(PORTA_PREDEFINITA)
    if (!p) {
      console.error(voce(NO(), 'nessuna porta', 'dalla 5173 alla 5192 sono tutte occupate'))
      process.exit(1)
    }
    if (p !== PORTA_PREDEFINITA) nota(`porta ${PORTA_PREDEFINITA} occupata, uso la ${p}`, C.giallo)
    return p
  }

  const porta = opz.porta
  const chi = await sonda(porta)
  if (chi === null) return porta

  if (chi === 'vite') {
    const s = leggiStato()
    const mio = s && s.porta === porta
    const q = chiOccupa(porta)
    nota(
      mio
        ? `c'era già un mio dev server sulla ${porta}: prendo il suo posto`
        : `c'è un Vite non mio sulla ${porta}${q ? ` (pid ${q.pid})` : ''}: lo fermo e prendo il posto`,
      C.giallo
    )
    if (mio) uccidiAlbero(s.pidSupervisore)
    if (q) uccidiAlbero(q.pid)
    scordaStato()
    if (await aspettaPortaLibera(porta, 8000)) return porta
    console.error(voce(NO(), 'porta bloccata', `la ${porta} non si è liberata: prova \`npm run dev -- --porta auto\``))
    process.exit(1)
  }

  // Sulla porta c'è qualcuno che non è Vite (o che non risponde nemmeno). Qui
  // non si spara a niente: potrebbe essere un altro progetto, un tunnel, un
  // servizio di sistema. Si dice chi è e si lascia decidere.
  const q = chiOccupa(porta)
  console.error(
    '\n' +
      voce(
        NO(),
        'porta occupata',
        `sulla ${porta} c'è ${q ? `${q.nome || 'un processo'} (pid ${q.pid})` : 'qualcosa'} che ${chi === 'lento' ? 'non risponde' : 'non è Vite'}`
      ) +
      '\n' +
      C.grigio(`     · liberala tu, oppure\n     · npm run dev -- --porta auto   (prende la prima libera)\n`)
  )
  process.exit(1)
}

async function aspettaPortaLibera(porta, entroMs) {
  const fine = Date.now() + entroMs
  while (Date.now() < fine) {
    if (await libera(porta)) return true
    await pausa(200)
  }
  return false
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Avvio in background ─────────────────────────────────────────────────────
//
// Si stacca una copia di questo stesso script, agganciata al file di log, e si
// aspetta che la porta risponda. Chi ha chiamato riottiene il terminale: è la
// forma che serve al tasto F5 di VS Code, che deve solo sapere che il server
// c'è prima di aprire Edge.

async function avviaInSfondo() {
  if (opz.seServe && (await sonda(opz.porta)) === 'vite') {
    console.log(voce(OK(), 'già acceso', `http://localhost:${opz.porta}/ — riuso quello che c'è`))
    return 0
  }

  const { file } = apriLog()
  const fd = fs.openSync(file, 'a')
  const args = [process.argv[1], '--figlio-sfondo']
  if (opz.portaAuto) args.push('--porta', 'auto')
  else args.push('--porta', String(opz.porta))
  if (opz.rete) args.push('--rete')
  if (opz.rigenera) args.push('--rigenera')

  const figlio = spawn(process.execPath, args, {
    cwd: RADICE,
    detached: true,
    stdio: ['ignore', fd, fd],
    windowsHide: true,
    // NO_COLOR: nel file gli escape sono solo sporcizia. DEV_LOG_FILE dice al
    // figlio di non aprirne un altro: il suo stdout È già quel file.
    env: { ...process.env, NO_COLOR: '1', DEV_LOG_FILE: file },
  })
  figlio.unref()

  // Si aspetta lo stato scritto DA QUESTO figlio, non una porta che risponde:
  // sulla 5173 può esserci ancora il server vecchio che il figlio deve ancora
  // togliere di mezzo, e prenderlo per buono vorrebbe dire dichiarare «acceso»
  // un secondo prima che venga spento.
  const fine = Date.now() + ATTESA_AVVIO_MS
  let s = null
  while (Date.now() < fine) {
    const forse = leggiStato()
    if (forse?.pidSupervisore === figlio.pid && (await sonda(forse.porta)) === 'vite') {
      s = forse
      break
    }
    if (!vivo(figlio.pid)) break
    await pausa(300)
  }
  if (s) {
    console.log(voce(OK(), 'acceso', `${s.url} (pid ${s.pidSupervisore}, in background)`))
    console.log(voce(OK(), 'log', s.log))
    return 0
  }
  console.error(voce(NO(), 'non parte', `il server non ha risposto. Log: ${file}`))
  console.error(coda(file, 20).join('\n'))
  return 1
}

// ─── Il supervisore ──────────────────────────────────────────────────────────

let vite = null
let porta = PORTA_PREDEFINITA
let fermandosi = false
let riavvioVoluto = false
// Mentre si riparte la sonda di salute deve stare zitta: quei secondi di
// silenzio li ha voluti lei, e contarli come «non risponde» porterebbe a un
// riavvio dentro l'altro.
let inRipartenza = false
let silenzi = 0
let mutoDa = 0
let sondaTimer = null
let crash = []
let avviatoIl = Date.now()
let riavvii = 0
let primaVolta = true
const guardie = []

async function avviaSupervisore() {
  const { fermi, avvisi } = controlli()
  if (fermi.length) {
    for (const f of fermi) console.error(voce(NO(), 'non si parte', f))
    process.exit(1)
  }

  // Il log si apre PRIMA di qualsiasi altra cosa: anche «ho tolto di mezzo un
  // Vite che occupava la porta» è una riga che si vorrà ritrovare domani.
  // (In background il file lo ha già aperto chi ci ha lanciati: vedi
  // DEV_LOG_FILE, il nostro stdout è già quello.)
  if (!fileLog) {
    const l = apriLog()
    fileLog = l.file
    flussoLog = l.flusso
  }

  for (const a of avvisi) nota(a, C.giallo)
  porta = await assicuraPorta()

  // Da qui in poi si scrive con `scrivi`, non con console.log: tutto quello
  // che si vede a schermo deve finire anche nel log, se no il file che si
  // guarda dopo un guaio comincia a metà storia.
  scrivi('\n' + C.forte('Preparativi') + '\n' + C.grigio('─'.repeat(24)) + '\n')
  for (const r of preparaArtefatti({ sempre: opz.rigenera })) scrivi(r + '\n')

  registraSpegnimento()
  accendiVite()
  sorveglia()
  guarda()
}

function accendiVite() {
  const args = [VITE, '--port', String(porta), '--strictPort']
  if (opz.rete) args.push('--host')

  vite = spawn(process.execPath, args, {
    cwd: RADICE,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Su Unix il gruppo di processi serve a poter uccidere anche i nipoti
    // (esbuild & co.). Su Windows detached aprirebbe una finestra: lì ci pensa
    // taskkill /T, che l'albero lo prende lo stesso.
    detached: !WIN,
    windowsHide: true,
    // I colori di Vite passano dalla nostra pipe: senza FORCE_COLOR li
    // spegnerebbe da sé vedendosi rediretto. Si accendono però solo se dopo di
    // noi c'è davvero un terminale — in background, o dentro un'altra pipe,
    // sarebbero escape appiccicati alle parole nel file di log.
    env: {
      ...process.env,
      FORCE_COLOR: process.stdout.isTTY && !process.env.NO_COLOR ? '1' : '0',
    },
  })

  const inoltra = (chunk) => scrivi(String(chunk))
  vite.stdout.on('data', inoltra)
  vite.stderr.on('data', inoltra)

  vite.on('error', (e) => {
    nota('non riesco a lanciare Vite: ' + (e?.message || e), C.rosso)
  })

  vite.on('exit', (codice, segnale) => {
    if (fermandosi) return
    if (riavvioVoluto) {
      riavvioVoluto = false
      riavvii++
      accendiVite()
      return
    }
    nota(`Vite è uscito (${segnale || 'codice ' + codice}).`, C.rosso)
    riparti()
  })

  aggiornaStato()
  aspettaPronto()
}

/** Riavvio dopo una morte non voluta: attesa crescente e freno anti-raffica. */
async function riparti() {
  inRipartenza = true
  const ora = Date.now()
  crash = crash.filter((t) => ora - t < CRASH_FINESTRA_MS)
  crash.push(ora)

  if (crash.length >= CRASH_MAX) {
    nota(`${CRASH_MAX} crash in un minuto: mi fermo, il problema non è passeggero.`, C.rosso)
    scrivi('\n' + C.grigio(coda(fileLog, 25).join('\n')) + '\n')
    scrivi(C.grigio(`\nLog completo: ${fileLog}\n`))
    fermaTutto(1)
    return
  }

  const attesa = Math.min(1000 * 2 ** (crash.length - 1), 15_000)
  nota(`riprovo tra ${Math.round(attesa / 1000)}s (tentativo ${crash.length}/${CRASH_MAX})`, C.giallo)
  await pausa(attesa)
  if (fermandosi) return
  riavvii++
  accendiVite()
}

/** Riavvio voluto (chiavi cambiate, sonda muta): niente attesa, niente conteggio. */
function riavvia(motivo) {
  if (fermandosi || riavvioVoluto) return
  nota(`riavvio: ${motivo}`, C.giallo)
  riavvioVoluto = true
  inRipartenza = true
  silenzi = 0
  mutoDa = 0
  if (vite?.pid) uccidiAlbero(vite.pid)
}

async function aspettaPronto() {
  const fine = Date.now() + ATTESA_AVVIO_MS
  while (Date.now() < fine) {
    if (fermandosi) return
    if ((await sonda(porta)) === 'vite') {
      silenzi = 0
      mutoDa = 0
      inRipartenza = false
      aggiornaStato()
      if (primaVolta) {
        primaVolta = false
        banner()
        if (opz.apri) apriBrowser(`http://localhost:${porta}/`)
      } else {
        nota(`di nuovo in piedi su http://localhost:${porta}/ (riavvio n. ${riavvii})`, C.verde)
      }
      return
    }
    await pausa(300)
  }
  if (fermandosi) return
  // Vite è vivo ma muto. Non si insiste qui: si passa la mano alla sonda di
  // salute, che sa riavviarlo (e contarlo) invece di aspettare all'infinito.
  primaVolta = false
  inRipartenza = false
  nota(`nessuna risposta entro ${ATTESA_AVVIO_MS / 1000}s: passo la mano alla sonda`, C.giallo)
}

/**
 * La sonda di salute. Un processo vivo non vuol dire un server che risponde:
 * un ciclo infinito in un middleware, o un import che non torna mai, lasciano
 * `node.exe` nella lista dei processi e il browser che gira a vuoto.
 *
 * Ma va misurata la cosa giusta, e la prima versione di questo pezzo misurava
 * quella sbagliata: contava come «morto» anche il server che ci metteva più di
 * quattro secondi a rispondere, e così ha spento un dev server sanissimo
 * proprio mentre trasformava i moduli della prima pagina aperta nel browser.
 * Un riavvio che arriva nel momento di massimo carico è esattamente il
 * contrario della stabilità che questo file dovrebbe dare.
 *
 * Quindi due misure separate:
 *   · connessione RIFIUTATA — il server non c'è più: tre di fila e si riparte;
 *   · risposta LENTA — sta lavorando: si annota e basta, e si riparte solo se
 *     va avanti così per due minuti buoni.
 * E si ribussa a intervalli, non a orologio: con un setInterval le sonde lente
 * si accavallerebbero l'una sull'altra.
 */
function sorveglia() {
  const giro = async () => {
    if (fermandosi) return
    if (!riavvioVoluto && !inRipartenza && !primaVolta) {
      const chi = await sonda(porta, { timeoutMs: SONDA_ATTESA_MS })
      if (chi === 'vite') {
        if (silenzi || mutoDa) nota('torna a rispondere', C.verde)
        silenzi = 0
        mutoDa = 0
      } else if (chi === null) {
        mutoDa ||= Date.now()
        silenzi++
        if (silenzi < SILENZI_PER_RIAVVIO) nota(`la porta non risponde (${silenzi}/${SILENZI_PER_RIAVVIO})`, C.giallo)
        else riavvia(`la ${porta} ha smesso di rispondere`)
      } else {
        // 'lento' o 'altro': qualcuno c'è. Pazienza, fino a un certo punto.
        if (!mutoDa) {
          mutoDa = Date.now()
          nota('risponde a rilento: sta lavorando, aspetto', C.grigio)
        } else if (Date.now() - mutoDa > MUTO_MAX_MS) {
          riavvia(`fermo da ${durata(Date.now() - mutoDa)}`)
        }
      }
    }
    if (fermandosi) return
    sondaTimer = setTimeout(giro, SONDA_OGNI_MS)
    sondaTimer.unref?.()
  }
  sondaTimer = setTimeout(giro, SONDA_OGNI_MS)
  sondaTimer.unref?.()
}

/**
 * Una sola sorveglianza, su translations.json: i pacchetti per lingua sono
 * artefatti generati (src/app/i18n/generated/), e senza rigenerarli una
 * traduzione appena scritta non compare finché non si riavvia tutto a mano.
 *
 * Il .env NON è qui: lo guarda già Vite, che al cambiamento si riavvia da solo
 * e rifà girare i `configureServer` dei plugin — cioè rilegge le chiavi. Un
 * secondo controllore avrebbe solo aggiunto un riavvio dentro l'altro.
 * Stessa cosa per vite.config.ts e per gli script che importa.
 */
function guarda() {
  vediFile(path.join(RADICE, 'src/app/i18n'), 'translations.json', () => {
    scrivi(preparaI18n({ sempre: true }) + '\n')
  })
}

function vediFile(cartella, nome, cosaFare) {
  try {
    // Si guarda la CARTELLA, non il file: un editor che salva scrivendo un
    // temporaneo e rinominandolo (quasi tutti) sostituisce l'inode, e un watch
    // agganciato al file smette di vedere qualsiasi cosa dopo il primo salvataggio.
    let attesa = null
    const g = fs.watch(cartella, { persistent: true }, (_ev, chi) => {
      if (chi !== nome) return
      clearTimeout(attesa)
      attesa = setTimeout(cosaFare, 250) // salvataggi doppi: uno vale l'altro
    })
    guardie.push(g)
  } catch {
    /* niente watch (rete, permessi): si perde solo la comodità */
  }
}

function aggiornaStato() {
  scriviStato({
    pidSupervisore: process.pid,
    pidVite: vite?.pid ?? null,
    porta,
    url: `http://localhost:${porta}/`,
    avviatoIl,
    log: fileLog,
    modalita: opz.figlioSfondo ? 'sfondo' : 'primo piano',
    riavvii,
  })
}

function banner() {
  scrivi('\n' + C.forte('  Dev server pronto') + '\n')
  for (const u of opz.rete ? indirizzi(porta) : [`http://localhost:${porta}/`]) {
    scrivi('  ' + C.verde('→') + '  ' + C.ciano(u) + '\n')
  }
  scrivi(C.grigio(`     officina: http://localhost:${porta}/cleaning\n`))
  scrivi('\n')
  for (const r of diagnosi()) scrivi(r + '\n')
  scrivi(
    '\n' +
      C.grigio(`  log: ${fileLog}\n`) +
      C.grigio(opz.figlioSfondo ? '  in background: `npm run dev:ferma` per spegnere\n' : '  Ctrl+C per spegnere tutto\n') +
      '\n'
  )
}

function apriBrowser(url) {
  try {
    if (WIN) spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
    else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
  } catch {
    /* il browser lo apre l'utente */
  }
}

// ─── Spegnimento ─────────────────────────────────────────────────────────────

function registraSpegnimento() {
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    try {
      process.on(s, () => fermaTutto(0))
    } catch {
      /* segnale non previsto su questa piattaforma */
    }
  }
  // Rete di sicurezza: se il supervisore stesso esplode, non deve lasciare in
  // giro un Vite orfano che poi occupa la porta al prossimo avvio.
  process.on('uncaughtException', (e) => {
    nota('errore nel supervisore: ' + (e?.message || e), C.rosso)
    fermaTutto(1)
  })
}

let giaFermo = false
function fermaTutto(codice) {
  if (giaFermo) return
  giaFermo = true
  fermandosi = true
  clearTimeout(sondaTimer)
  for (const g of guardie) {
    try {
      g.close()
    } catch {
      /* già chiusa */
    }
  }
  if (vite?.pid) uccidiAlbero(vite.pid)
  scordaStato()
  scrivi(
    '\n' +
      C.grigio(`  dev server spento — acceso per ${durata(Date.now() - avviatoIl)}, ${riavvii} riavvi${riavvii === 1 ? 'o' : 'i'}\n`)
  )
  // Un filo di tempo perché taskkill faccia il suo e il log si svuoti.
  setTimeout(() => process.exit(codice), 300)
}

// ─── Partenza ────────────────────────────────────────────────────────────────

if (opz.comando === 'aiuto') {
  comandoAiuto()
} else if (opz.comando === 'stato') {
  await comandoStato()
} else if (opz.comando === 'ferma') {
  await comandoFerma()
} else if (opz.comando === 'log') {
  comandoLog()
} else if (opz.sfondo && !opz.figlioSfondo) {
  process.exit(await avviaInSfondo())
} else {
  await avviaSupervisore()
}
