#!/usr/bin/env node
// Analizzatore del Wrapped 5BT: legge uno o più export di WhatsApp («Esporta chat»,
// senza media), li unisce, fonde i numeri della stessa persona e calcola le metriche
// che servono alle slide: volume, tempo, persone, linguaggio, sessioni, coppie,
// record, eventi, evoluzione e anomalie. Tutto in locale, niente rete.
//
// Uso:
//   node tools/wrapped/analizza.mjs <export.zip|_chat.txt> [altro export…] [opzioni]
//
// Opzioni:
//   --alias <file.json>   mappa alias → nome canonico (vedi alias.esempio.json)
//   --out <file.json>     dove scrivere i dati (predefinito: tools/wrapped/lavoro/dati.json)
//
// Il primo export passato è la fonte preferita quando lo stesso messaggio compare
// in più export. Gli input e gli output stanno in tools/wrapped/lavoro/, che è
// fuori dal repository: le chat non si committano mai.
//
// Formati capiti: iOS «[g/m/aa, hh:mm:ss] Nome: testo» e Android
// «g/m/aa, hh:mm - Nome: testo», in italiano e in inglese, anche a 12 ore
// (AM/PM); l'ordine giorno/mese viene dedotto per file. Un export che non
// produce nessuna riga ferma lo script: meglio un errore che un buco muto.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const LAVORO = join(QUI, 'lavoro')

// Gli export seminano caratteri invisibili (LRM, isolatori bidirezionali):
// si tolgono ovunque, tranne che nelle menzioni, che usano proprio gli isolatori.
// Il marcatore U+200E, però, prima di sparire fa da testimone: WhatsApp lo mette
// davanti alle righe che non ha scritto una persona (eventi di sistema, segnaposto
// dei media), ed è il segnale strutturale su cui si basa la classificazione.
const INVISIBILI = /[‎‏‪‫‬⁦⁧⁨⁩﻿]/g

// ---------------------------------------------------------------------------
// Riga di comando
// ---------------------------------------------------------------------------

const argomenti = process.argv.slice(2)
const percorsi = []
let fileAlias = null
let fileUscita = join(LAVORO, 'dati.json')

for (let i = 0; i < argomenti.length; i++) {
  const a = argomenti[i]
  if (a === '--alias') fileAlias = argomenti[++i]
  else if (a === '--out') fileUscita = argomenti[++i]
  else percorsi.push(a)
}

if (!percorsi.length) {
  console.error('uso: node tools/wrapped/analizza.mjs <export.zip|_chat.txt> [altro export…] [--alias alias.json] [--out dati.json]')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Alias: ogni persona può comparire con più nomi (numeri diversi, rubriche
// diverse nei due export). La mappa va da nome visto → nome canonico.
// ---------------------------------------------------------------------------

const alias = new Map()
if (fileAlias) {
  const config = JSON.parse(readFileSync(fileAlias, 'utf8'))
  for (const [canonico, visti] of Object.entries(config.persone || {})) {
    alias.set(normalizzaNome(canonico), canonico)
    for (const visto of visti) alias.set(normalizzaNome(visto), canonico)
  }
}

function normalizzaNome(nome) {
  return String(nome).replace(INVISIBILI, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function nomeCanonico(nome) {
  const chiave = normalizzaNome(nome)
  return alias.get(chiave) || chiave
}

// ---------------------------------------------------------------------------
// Lettura degli export: .zip (serve `unzip` di sistema) o direttamente .txt
// ---------------------------------------------------------------------------

function leggiExport(percorso) {
  if (!existsSync(percorso)) {
    console.error(`analizza: il file ${percorso} non esiste`)
    process.exit(1)
  }
  if (extname(percorso).toLowerCase() !== '.zip') return readFileSync(percorso, 'utf8')
  const destinazione = join(LAVORO, 'estratti', basename(percorso, '.zip'))
  mkdirSync(destinazione, { recursive: true })
  try {
    execFileSync('unzip', ['-o', '-q', percorso, '-d', destinazione])
  } catch {
    console.error(`analizza: non riesco a estrarre ${percorso} (serve il comando unzip); estrai a mano e passa il .txt`)
    process.exit(1)
  }
  const txt = readdirSync(destinazione).find((f) => f.endsWith('.txt'))
  if (!txt) {
    console.error(`analizza: nessun .txt dentro ${percorso}`)
    process.exit(1)
  }
  return readFileSync(join(destinazione, txt), 'utf8')
}

// ---------------------------------------------------------------------------
// Parsing. Formati di riga:
//   iOS      «[g/m/aa, hh:mm:ss] Mittente: testo»  (eventuale AM/PM; eventi di
//            sistema attribuiti al nome del gruppo come mittente)
//   Android  «g/m/aa, hh:mm - Mittente: testo»     (eventi di sistema senza
//            mittente: «g/m/aa, hh:mm - Marco ha aggiunto Luca»)
// Le righe che non combaciano sono continuazioni del messaggio precedente.
// ---------------------------------------------------------------------------

const RIGA_IOS = /^[‎‏]?\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})(?::(\d{2}))?[  ]?([AP]M)?\] ([^:]+): ?([\s\S]*)$/
const RIGA_ANDROID = /^[‎‏]?(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})(?::(\d{2}))?[  ]?([AP]M)? - ([^:]+): ?([\s\S]*)$/
const RIGA_ANDROID_SISTEMA = /^[‎‏]?(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})(?::(\d{2}))?[  ]?([AP]M)? - ([\s\S]*)$/
const MENZIONE = /@⁨([^⁩]+)⁩/g

// Segnaposto dei media, nei due formati. Con il marcatore di sistema basta che
// la riga finisca col segnaposto (i documenti hanno davanti il nome del file);
// senza marcatore il corpo deve ESSERE il segnaposto, così «guarda, image
// omitted» scritto da una persona resta un messaggio di testo.
const MEDIA = [
  ['foto', 'image omitted|immagine omessa'],
  ['video', 'video omitted|video omesso'],
  ['vocale', 'audio omitted|audio omesso'],
  ['sticker', 'sticker omitted|sticker non incluso'],
  ['gif', 'GIF omitted|GIF non inclusa'],
  ['videonota', 'video note omitted|nota video omessa'],
  ['documento', 'document omitted|documento omesso'],
  ['contatto', 'Contact card omitted|Scheda contatto omessa'],
  ['effimero', 'view once media omitted|media a visualizzazione singola omesso'],
].map(([tipo, alternativa]) => [
  tipo,
  new RegExp(`(^|\\s)(${alternativa})$`, 'i'),
  new RegExp(`^(${alternativa})$`, 'i'),
])
const POSIZIONE = /^(location:|posizione:)/i
const SONDAGGIO = /^(POLL:|SONDAGGIO:)/
const ELIMINATO = /^(This message was deleted\.?|Questo messaggio è stato eliminato\.?|You deleted this message\.?|Hai eliminato questo messaggio\.?|This message was deleted by admin .*|Questo messaggio è stato eliminato dall'admin .*)$/
const MODIFICATO = /\s*<(This message was edited|Questo messaggio è stato modificato)>\s*$/

// Eventi di sistema. Con il marcatore U+200E (o la forma Android senza mittente)
// basta riconoscere il verbo; SENZA marcatore valgono solo le forme a riga
// intera e a bassa ambiguità, perché «il nuovo album è uscito» scritto da una
// persona è un messaggio, non un'uscita dal gruppo.
const SISTEMA_VERBI = /(end-to-end encrypted|crittografat|created this group|created group|ha creato (il gruppo|questo gruppo)|\badded\b|ha aggiunto|hai aggiunto|\bremoved\b|ha rimosso|hai rimosso|\bleft$|è uscit|sei uscit|you left|ha abbandonato|joined using|è entrat|changed the subject|ha cambiato l'oggetto|hai cambiato l'oggetto|changed this group's (icon|settings)|ha (cambiato|eliminato) l'(icona|immagine)|hai (cambiato|eliminato) l'(icona|immagine)|pinned a message|ha fissato un messaggio|hai fissato un messaggio|unpinned|changed their phone number|ha cambiato (il )?numero|changed to|added you|ti ha aggiunto|is now an admin|è ora un admin|you're now an admin|changed the group description|ha cambiato la descrizione|ha modificato le impostazioni|deleted this group's icon|turned (on|off) disappearing|ha (attivato|disattivato) i messaggi effimeri|hai (attivato|disattivato) i messaggi effimeri|security code|codice di sicurezza)/i
const SISTEMA_RIGHE = [
  /^Messages and calls are end-to-end encrypted\./,
  /^I messaggi e le chiamate sono crittografat/,
  /^Group creator created this group$/,
  // le virgolette tipografiche le mette l'export, non chi scrive in chat
  /^.{1,60} (changed the subject|ha cambiato l'oggetto) .*[“”].*$/,
]

const NOME_GRUPPO = [
  /changed the subject (?:from .+ )?to [“"](.+)[”"]/,
  /ha cambiato l'oggetto (?:da .+ )?(?:in|a) [“"](.+)[”"]/,
]
const AGGIUNTA = [/^(.+?) added (.+)$/, /^(.+?) ha aggiunto (.+)$/]
const RIMOZIONE = [/^(.+?) removed (.+)$/, /^(.+?) ha rimosso (.+)$/]
const USCITA = [/^(.+?) left$/, /^(.+?) è uscit[oa]$/, /^(.+?) ha abbandonato il gruppo$/]
// Forme in seconda persona («Hai aggiunto Marco», «You removed Luca»): chi
// agisce è chi ha esportato, che qui non ha un nome; si conta solo chi subisce.
const AGGIUNTA_TU = /^(?:Hai aggiunto|You added) (.+)$/
const RIMOZIONE_TU = /^(?:Hai rimosso|You removed) (.+)$/

function classifica(testo, segnato) {
  if (ELIMINATO.test(testo)) return 'eliminato'
  if (SONDAGGIO.test(testo)) return 'sondaggio'
  for (const [tipo, conPrefisso, esatto] of MEDIA) {
    if (segnato ? conPrefisso.test(testo) : esatto.test(testo)) return tipo
  }
  if (segnato && POSIZIONE.test(testo)) return 'posizione'
  if (segnato && SISTEMA_VERBI.test(testo)) return 'sistema'
  if (!segnato && SISTEMA_RIGHE.some((re) => re.test(testo))) return 'sistema'
  return 'testo'
}

function analizzaFonte(grezzo, fonte) {
  const righe = grezzo.replace(/^﻿/, '').split('\n')

  // primo giro: raccoglie le teste di riga senza comporre le date, perché
  // l'ordine giorno/mese dipende dalla localizzazione dell'export e si può
  // dedurre solo guardando tutto il file (un campo sopra il 12 scioglie il dubbio)
  const grezzi = []
  let corrente = null
  let formato = null // 'ios' o 'android': si blocca al primo match, così una
  // continuazione che somiglia a una riga dell'altro formato non spezza nulla
  for (const riga of righe) {
    let m = null
    let mittente, corpo, sistemaSenzaMittente = false
    if (formato !== 'android' && (m = RIGA_IOS.exec(riga))) {
      formato = 'ios'
      mittente = m[8]
      corpo = m[9]
    } else if (formato !== 'ios' && (m = RIGA_ANDROID.exec(riga))) {
      formato = 'android'
      mittente = m[8]
      corpo = m[9]
    } else if (formato !== 'ios' && (m = RIGA_ANDROID_SISTEMA.exec(riga)) && (m[8] || '').trim()) {
      // riga Android senza «Mittente:»: è un evento di sistema
      formato = 'android'
      mittente = null
      corpo = m[8]
      sistemaSenzaMittente = true
    } else {
      m = null
    }
    if (!m) {
      if (corrente) corrente.corpo += '\n' + riga
      continue
    }
    if (corrente) grezzi.push(corrente)
    corrente = {
      n1: Number(m[1]),
      n2: Number(m[2]),
      anno: m[3].length === 2 ? '20' + m[3] : m[3],
      ore: Number(m[4]),
      minuti: m[5],
      secondi: m[6] || '00',
      meridiano: m[7] || null,
      mittenteVisto: mittente ? mittente.replace(INVISIBILI, '').trim() : null,
      corpo,
      segnatoRiga: /^[‎‏]/.test(riga),
      sistemaSenzaMittente,
      fonte,
    }
  }
  if (corrente) grezzi.push(corrente)
  analizzaFonte.ultimoFormato = formato

  // l'ordine delle date: se un primo campo supera 12 è giorno/mese (Italia),
  // se lo supera un secondo campo è mese/giorno (localizzazioni USA);
  // senza prove si assume giorno/mese
  const giornoPrima = grezzi.some((r) => r.n1 > 12) || !grezzi.some((r) => r.n2 > 12)

  const messaggi = []
  for (const r of grezzi) {
    let ore = r.ore
    if (r.meridiano === 'PM' && ore < 12) ore += 12
    if (r.meridiano === 'AM' && ore === 12) ore = 0
    const giorno = giornoPrima ? r.n1 : r.n2
    const mese = giornoPrima ? r.n2 : r.n1
    const ts = `${r.anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}T${String(ore).padStart(2, '0')}:${r.minuti}:${r.secondi}`

    const menzioni = []
    for (const m of r.corpo.matchAll(MENZIONE)) menzioni.push(nomeCanonico(m[1]))
    const segnato = r.segnatoRiga || r.sistemaSenzaMittente || /^[‎‏]/.test(r.corpo)
    let testo = r.corpo.replace(INVISIBILI, '').replace(/\n+$/, '')
    const modificato = MODIFICATO.test(testo)
    if (modificato) testo = testo.replace(MODIFICATO, '')
    const tipo = r.sistemaSenzaMittente ? 'sistema' : classifica(testo.trim(), segnato)
    messaggi.push({
      ts,
      mittente: r.mittenteVisto ? nomeCanonico(r.mittenteVisto) : '(sistema)',
      tipo,
      testo,
      menzioni,
      modificato,
      fonte,
    })
  }
  return messaggi
}

// ---------------------------------------------------------------------------
// Unione delle fonti. Lo stesso messaggio compare in più export con lo stesso
// orario; il testo può differire solo per i segnaposto (lingua dell'export),
// quindi la chiave usa il tipo per i non-testo e l'inizio del testo altrimenti.
// ---------------------------------------------------------------------------

const fonti = percorsi.map((p, i) => {
  const grezzi = analizzaFonte(leggiExport(p), i)
  if (!grezzi.length) {
    console.error(`analizza: da ${p} non è uscita nessuna riga: formato non riconosciuto o file vuoto. Mi fermo per non far sparire un periodo in silenzio.`)
    process.exit(1)
  }
  return { percorso: p, nome: basename(p), indice: i, messaggi: grezzi, formato: analizzaFonte.ultimoFormato }
})

const formatiMisti = new Set(fonti.map((f) => f.formato)).size > 1

const visti = new Map()
for (const fonte of fonti) {
  for (const msg of fonte.messaggi) {
    const base = `${msg.ts}|${msg.mittente}|${msg.tipo === 'testo' ? msg.testo.slice(0, 40) : msg.tipo}`
    // due messaggi della STESSA fonte possono condividere la chiave (stesso
    // secondo, stesso tipo): si tengono entrambi, la fusione vale solo tra fonti
    let chiave = base
    for (let doppione = 1; ; doppione++) {
      const gia = visti.get(chiave)
      if (!gia) {
        visti.set(chiave, { ...msg, fontiViste: [fonte.indice] })
        break
      }
      if (!gia.fontiViste.includes(fonte.indice)) {
        gia.fontiViste.push(fonte.indice)
        break
      }
      chiave = `${base}#${doppione}`
    }
  }
}

const tutti = [...visti.values()].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))

// ---------------------------------------------------------------------------
// Scomposizione del tempo e piccole utilità
// ---------------------------------------------------------------------------

const SETTIMANA = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

for (const msg of tutti) {
  msg.data = msg.ts.slice(0, 10)
  msg.mese = msg.ts.slice(0, 7)
  msg.anno = msg.ts.slice(0, 4)
  msg.ora = Number(msg.ts.slice(11, 13))
  msg.giornoSettimana = new Date(msg.data + 'T00:00:00Z').getUTCDay()
}

let REGEX_EMOJI
try {
  REGEX_EMOJI = new RegExp('\\p{RGI_Emoji}', 'gv')
} catch {
  REGEX_EMOJI = /\p{Extended_Pictographic}/gu
}

const conta = (mappa, chiave, quanto = 1) => mappa.set(chiave, (mappa.get(chiave) || 0) + quanto)
const inOrdine = (mappa, n = Infinity) =>
  [...mappa.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
const arrotonda = (x, cifre = 1) => Number(x.toFixed(cifre))
const mediana = (valori) => {
  if (!valori.length) return 0
  const v = [...valori].sort((a, b) => a - b)
  const m = v.length >> 1
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

const parole = (testo) =>
  testo
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}'’]+/gu, ' ')
    .split(' ')
    .filter(Boolean)

// Parole vuote: articoli, preposizioni, ausiliari e riempitivi della chat.
const VUOTE = new Set(('il lo la i gli le un uno una di a da in con su per tra fra e o ma se che chi cui non più mi ti si ci vi lu ne al allo alla ai agli alle dal dallo dalla dai dagli dalle del dello della dei degli delle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle è e sono sei siamo siete era eri erano sarà sarò sarebbe essere stato stata stati state ho hai ha abbiamo avete hanno avevo avevi aveva avevano avrà avrebbe avere fatto fare fa fai faccio facciamo fanno faceva vado vai va andiamo andate vanno andare venire vieni viene io tu lui lei noi voi loro me te sé questo questa questi queste quello quella quelli quelle qui qua lì là dove quando come perché perche cosa cose anche ancora già sempre mai oggi domani ieri poi prima dopo ora adesso così cosi tutto tutta tutti tutte niente nulla qualcosa qualcuno ogni altro altra altri altre molto molta molti molte poco poca pochi poche tanto tanta tanti tante troppo troppa troppi troppe bene male solo soltanto pure anzi cioè cioe quindi allora però pero infatti inoltre invece mentre durante senza sotto sopra dentro fuori contro verso presso oltre vabbè vabbe boh beh eh ah oh ok okay sì si no ni raga dai su ce lo l un’ dell all nell sull quest c è d e’ della').split(' '))

// ---------------------------------------------------------------------------
// Giro unico sui messaggi: accumula tutto quello che serve alle sezioni dopo.
// «Messaggio» = riga inviata da una persona (testo, media o sondaggio);
// gli eventi di sistema e i messaggi eliminati si contano a parte.
// ---------------------------------------------------------------------------

const TIPI_CONTENUTO = new Set(['testo', 'foto', 'video', 'vocale', 'sticker', 'gif', 'videonota', 'documento', 'contatto', 'posizione', 'effimero', 'sondaggio'])

const persone = new Map()
const perGiorno = new Map()
const perMese = new Map()
const perAnno = new Map()
const perOra = Array.from({ length: 24 }, () => 0)
const perGiornoSettimana = Array.from({ length: 7 }, () => 0)
const perSettimana = new Map()
const paroleTotali = new Map()
const emojiTotali = new Map()
const perOraPersona = new Map()
const frasi = new Map()
const paroleMese = new Map()
const nomiGruppo = []
const aggiunteFatte = new Map()
const aggiunteSubite = new Map()
const rimozioniFatte = new Map()
const rimozioniSubite = new Map()
const uscite = new Map()
const eliminatiPerPersona = new Map()
const messaggiIdentici = new Map()

let totaleContenuto = 0
let totaleSistema = 0
let totaleEliminati = 0
let msgPiuLungo = null

const personaDi = (nome) => {
  let p = persone.get(nome)
  if (!p) {
    p = {
      nome,
      messaggi: 0,
      soloTesto: 0,
      parole: 0,
      caratteri: 0,
      lunghezze: [],
      perTipo: new Map(),
      perOra: Array.from({ length: 24 }, () => 0),
      perGiornoSettimana: Array.from({ length: 7 }, () => 0),
      perMese: new Map(),
      perAnno: new Map(),
      perGiorno: new Map(),
      paroleProprie: new Map(),
      emoji: new Map(),
      link: 0,
      modificati: 0,
      menzioniFatte: new Map(),
      menzioniRicevute: 0,
      primo: null,
      ultimo: null,
    }
    persone.set(nome, p)
  }
  return p
}

const chiaveSettimana = (ts) => {
  // settimana ISO: giovedì della settimana → anno e numero. Si lavora sulla
  // sola data, a mezzanotte UTC: con l'orario dentro, la divisione per 86400000
  // porterebbe un resto e Math.ceil salterebbe di una settimana.
  const d = new Date(ts.slice(0, 10) + 'T00:00:00Z')
  const giovedi = new Date(d)
  giovedi.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7))
  const inizioAnno = new Date(Date.UTC(giovedi.getUTCFullYear(), 0, 1))
  const numero = Math.ceil(((giovedi - inizioAnno) / 86400000 + 1) / 7)
  return `${giovedi.getUTCFullYear()}-S${String(numero).padStart(2, '0')}`
}

for (const msg of tutti) {
  if (msg.tipo === 'sistema') {
    totaleSistema++
    const testo = msg.testo.trim()
    for (const re of NOME_GRUPPO) {
      const m = re.exec(testo)
      if (m) nomiGruppo.push({ data: msg.data, nome: m[1] })
    }
    for (const re of AGGIUNTA) {
      const m = re.exec(testo)
      if (m) {
        conta(aggiunteFatte, nomeCanonico(m[1]))
        conta(aggiunteSubite, nomeCanonico(m[2]))
      }
    }
    for (const re of RIMOZIONE) {
      const m = re.exec(testo)
      if (m) {
        conta(rimozioniFatte, nomeCanonico(m[1]))
        conta(rimozioniSubite, nomeCanonico(m[2]))
      }
    }
    for (const re of USCITA) {
      const m = re.exec(testo)
      if (m) conta(uscite, nomeCanonico(m[1]))
    }
    let m = AGGIUNTA_TU.exec(testo)
    if (m) conta(aggiunteSubite, nomeCanonico(m[1]))
    m = RIMOZIONE_TU.exec(testo)
    if (m) conta(rimozioniSubite, nomeCanonico(m[1]))
    continue
  }

  if (msg.tipo === 'eliminato') {
    totaleEliminati++
    conta(eliminatiPerPersona, msg.mittente)
    continue
  }

  if (!TIPI_CONTENUTO.has(msg.tipo)) continue

  totaleContenuto++
  const p = personaDi(msg.mittente)
  p.messaggi++
  conta(p.perTipo, msg.tipo)
  p.perOra[msg.ora]++
  p.perGiornoSettimana[msg.giornoSettimana]++
  conta(p.perMese, msg.mese)
  conta(p.perAnno, msg.anno)
  conta(p.perGiorno, msg.data)
  if (!p.primo) p.primo = msg.data
  p.ultimo = msg.data
  if (msg.modificato) p.modificati++

  conta(perGiorno, msg.data)
  conta(perMese, msg.mese)
  conta(perAnno, msg.anno)
  perOra[msg.ora]++
  perGiornoSettimana[msg.giornoSettimana]++
  conta(perSettimana, chiaveSettimana(msg.ts))
  conta(perOraPersona, `${msg.data} ${String(msg.ora).padStart(2, '0')}`)

  for (const menzionato of msg.menzioni) {
    conta(p.menzioniFatte, menzionato)
    personaDi(menzionato).menzioniRicevute++
  }

  if (msg.tipo !== 'testo') continue

  // da qui in poi: solo messaggi di testo veri e propri
  p.soloTesto++
  const testo = msg.testo
  const listaParole = parole(testo)
  p.parole += listaParole.length
  p.caratteri += testo.length
  p.lunghezze.push(listaParole.length)
  if (/https?:\/\//.test(testo)) p.link++
  if (!msgPiuLungo || listaParole.length > msgPiuLungo.parole) {
    msgPiuLungo = { mittente: msg.mittente, data: msg.data, parole: listaParole.length, caratteri: testo.length, inizio: testo.slice(0, 120) }
  }
  for (const parola of listaParole) {
    if (VUOTE.has(parola) || parola.length < 2) continue
    conta(paroleTotali, parola)
    conta(p.paroleProprie, parola)
    let perMeseParola = paroleMese.get(parola)
    if (!perMeseParola) paroleMese.set(parola, (perMeseParola = new Map()))
    conta(perMeseParola, msg.mese)
  }
  for (const pezzo of testo.match(REGEX_EMOJI) || []) {
    conta(emojiTotali, pezzo)
    conta(p.emoji, pezzo)
  }
  const normalizzato = testo.toLowerCase().trim()
  if (normalizzato.length >= 3 && normalizzato.length <= 60) conta(messaggiIdentici, normalizzato)
  if (listaParole.length >= 2 && listaParole.length <= 6 && normalizzato.length <= 40) conta(frasi, normalizzato)
}

if (!totaleContenuto) {
  console.error('analizza: gli export non contengono nessun messaggio di contenuto (solo righe di sistema?). Niente da analizzare.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Sessioni (conversazioni): una pausa di oltre 30 minuti chiude la sessione.
// Dentro le sessioni si stimano anche le adiacenze «chi scrive dopo chi».
// ---------------------------------------------------------------------------

const PAUSA_SESSIONE = 30 * 60 * 1000
const PAUSA_RISPOSTA = 3 * 60 * 1000

const contenuto = tutti.filter((m) => TIPI_CONTENUTO.has(m.tipo))
const sessioni = []
const adiacenze = new Map()
const coPresenza = new Map()
let sessione = null
let precedente = null

for (const msg of contenuto) {
  const t = new Date(msg.ts + 'Z').getTime()
  if (!sessione || t - sessione.fineMs > PAUSA_SESSIONE) {
    if (sessione) sessioni.push(sessione)
    sessione = { inizio: msg.ts, fine: msg.ts, inizioMs: t, fineMs: t, messaggi: 0, partecipanti: new Set(), apertaDa: msg.mittente, chiusaDa: msg.mittente }
    precedente = null
  }
  sessione.fine = msg.ts
  sessione.fineMs = t
  sessione.messaggi++
  sessione.partecipanti.add(msg.mittente)
  sessione.chiusaDa = msg.mittente
  if (precedente && precedente.mittente !== msg.mittente && t - precedente.ms <= PAUSA_RISPOSTA) {
    conta(adiacenze, [precedente.mittente, msg.mittente].sort().join(' ↔ '))
  }
  precedente = { mittente: msg.mittente, ms: t }
}
if (sessione) sessioni.push(sessione)

for (const s of sessioni) {
  if (s.partecipanti.size < 2) continue
  const nomi = [...s.partecipanti].sort()
  for (let i = 0; i < nomi.length; i++)
    for (let j = i + 1; j < nomi.length; j++) conta(coPresenza, `${nomi[i]} ↔ ${nomi[j]}`)
}

// ---------------------------------------------------------------------------
// Record, strisce e silenzi
// ---------------------------------------------------------------------------

const giorniOrdinati = [...perGiorno.keys()].sort()
const giornoRecord = inOrdine(perGiorno, 1)[0]
const oraRecord = inOrdine(perOraPersona, 1)[0]

const recordPersonaGiorno = (() => {
  let massimo = null
  for (const p of persone.values())
    for (const [data, n] of p.perGiorno)
      if (!massimo || n > massimo.messaggi) massimo = { nome: p.nome, data, messaggi: n }
  return massimo
})()

const raffica = (() => {
  // più messaggi consecutivi della stessa persona senza che scriva nessun altro
  let migliore = null
  let corsa = null
  for (const msg of contenuto) {
    if (corsa && corsa.nome === msg.mittente) {
      corsa.quanti++
      corsa.fine = msg.ts
    } else {
      if (corsa && (!migliore || corsa.quanti > migliore.quanti)) migliore = corsa
      corsa = { nome: msg.mittente, quanti: 1, inizio: msg.ts, fine: msg.ts }
    }
  }
  if (corsa && (!migliore || corsa.quanti > migliore.quanti)) migliore = corsa
  return migliore
})()

const strisce = (() => {
  // giorni consecutivi con almeno un messaggio, sul calendario del gruppo
  let migliore = { giorni: 0 }
  let inizio = null
  let prima = null
  for (const giorno of giorniOrdinati) {
    if (!(prima && new Date(giorno) - new Date(prima) === 86400000)) inizio = giorno
    const durata = Math.round((new Date(giorno) - new Date(inizio)) / 86400000) + 1
    if (durata > migliore.giorni) migliore = { giorni: durata, dal: inizio, al: giorno }
    prima = giorno
  }
  return migliore
})()

const silenzioPiuLungo = (() => {
  let migliore = null
  for (let i = 1; i < giorniOrdinati.length; i++) {
    const salto = Math.round((new Date(giorniOrdinati[i]) - new Date(giorniOrdinati[i - 1])) / 86400000) - 1
    if (salto > 0 && (!migliore || salto > migliore.giorni)) {
      migliore = { giorni: salto, dal: giorniOrdinati[i - 1], al: giorniOrdinati[i] }
    }
  }
  return migliore
})()

const sessionePiuLunga = sessioni.reduce((a, b) => (b.messaggi > (a?.messaggi || 0) ? b : a), null)

// ---------------------------------------------------------------------------
// Linguaggio: parole distintive (quota della persona ÷ quota del gruppo),
// parole esplose nel tempo, messaggi ripetuti identici.
// ---------------------------------------------------------------------------

const totaleParoleGruppo = [...paroleTotali.values()].reduce((a, b) => a + b, 0)

function paroleDistintive(p, quante = 15) {
  const proprie = [...p.paroleProprie.entries()].filter(([, n]) => n >= 5)
  const totaleProprie = [...p.paroleProprie.values()].reduce((a, b) => a + b, 0) || 1
  return proprie
    .map(([parola, n]) => {
      const quotaPersona = n / totaleProprie
      const quotaGruppo = (paroleTotali.get(parola) || n) / totaleParoleGruppo
      return { parola, volte: n, rapporto: arrotonda(quotaPersona / quotaGruppo, 1) }
    })
    .filter((v) => v.rapporto >= 2)
    .sort((a, b) => b.rapporto * Math.log(b.volte) - a.rapporto * Math.log(a.volte))
    .slice(0, quante)
}

const paroleEsplose = (() => {
  const esiti = []
  for (const [parola, mesi] of paroleMese) {
    const totale = [...mesi.values()].reduce((a, b) => a + b, 0)
    if (totale < 30) continue
    const [mesePicco, nPicco] = inOrdine(mesi, 1)[0]
    if (nPicco / totale >= 0.5 && mesi.size <= 18) {
      esiti.push({ parola, totale, mesePicco, quotaPicco: arrotonda((nPicco / totale) * 100, 0) })
    }
  }
  return esiti.sort((a, b) => b.totale - a.totale).slice(0, 30)
})()

// ---------------------------------------------------------------------------
// Anomalie: giorni e mesi fuori scala rispetto alla loro distribuzione.
// ---------------------------------------------------------------------------

function fuoriScala(mappa, soglia = 3, quanti = 15) {
  const valori = [...mappa.values()]
  const media = valori.reduce((a, b) => a + b, 0) / valori.length
  const scarto = Math.sqrt(valori.reduce((a, b) => a + (b - media) ** 2, 0) / valori.length) || 1
  return [...mappa.entries()]
    .map(([chiave, n]) => ({ chiave, messaggi: n, z: arrotonda((n - media) / scarto, 1) }))
    .filter((v) => v.z >= soglia)
    .sort((a, b) => b.z - a.z)
    .slice(0, quanti)
}

// ---------------------------------------------------------------------------
// Copertura: periodi coperti da una sola fonte, mesi quasi vuoti, definizioni.
// ---------------------------------------------------------------------------

const copertura = {
  periodo: { dal: tutti[0]?.data || null, al: tutti[tutti.length - 1]?.data || null },
  fonti: fonti.map((f) => ({
    file: f.nome,
    messaggi: f.messaggi.length,
    dal: f.messaggi[0]?.ts.slice(0, 10) || null,
    al: f.messaggi[f.messaggi.length - 1]?.ts.slice(0, 10) || null,
  })),
  soloUnaFonte: (() => {
    // mesi visti da una sola delle fonti (con più fonti caricate)
    if (fonti.length < 2) return []
    const mesiPerFonte = fonti.map((f) => new Set(f.messaggi.map((m) => m.ts.slice(0, 7))))
    const esiti = []
    for (const mese of new Set(tutti.map((m) => m.mese))) {
      const dove = mesiPerFonte.map((s, i) => (s.has(mese) ? i : -1)).filter((i) => i >= 0)
      if (dove.length === 1) esiti.push({ mese, fonte: fonti[dove[0]].nome })
    }
    return esiti.sort((a, b) => (a.mese < b.mese ? -1 : 1))
  })(),
  mesiQuasiVuoti: (() => {
    const valori = [...perMese.values()].sort((a, b) => a - b)
    const mediana_ = mediana(valori)
    return [...perMese.entries()]
      .filter(([, n]) => n < mediana_ * 0.1)
      .map(([mese, n]) => ({ mese, messaggi: n }))
      .sort((a, b) => (a.mese < b.mese ? -1 : 1))
  })(),
  note: [
    'Reaction e «rispondi a» non sono negli export di WhatsApp: le coppie sono stimate per adiacenza temporale.',
    'Di foto, video, vocali e sticker si vede solo il segnaposto: i conteggi sì, i contenuti no.',
    'I messaggi eliminati prima dell’export non esistono più: quelli contati sono solo gli «eliminati» rimasti visibili.',
    'Una riga di sistema senza il marcatore invisibile dell’export (raro) può restare contata come testo: meglio quello che inventare eventi da frasi normali.',
    ...(formatiMisti
      ? ['Gli export mescolano formato iOS e Android: Android non esporta i secondi, quindi la deduplica tra le fonti non li può confrontare e qualche doppione può sopravvivere nei periodi coperti da entrambe.']
      : []),
  ],
}

// ---------------------------------------------------------------------------
// Composizione del risultato
// ---------------------------------------------------------------------------

const elencoPersone = [...persone.values()]
  .filter((p) => p.messaggi > 0)
  .sort((a, b) => b.messaggi - a.messaggi)

const migliorOra = (lista) => lista.indexOf(Math.max(...lista))

const dati = {
  generato: {
    strumento: 'tools/wrapped/analizza.mjs',
    fonti: fonti.map((f) => f.nome),
    definizioni: {
      messaggio: 'riga inviata da una persona: testo, media (foto, video, vocale, sticker, gif, videonota, documento, contatto, posizione, effimero) o sondaggio; esclusi eventi di sistema ed eliminati, contati a parte',
      parola: 'sequenza di lettere o cifre nel solo testo, minuscola, senza link; le classifiche delle parole escludono le parole vuote (articoli, preposizioni, riempitivi)',
      sessione: 'conversazione chiusa da una pausa di oltre 30 minuti',
      adiacenza: 'B scrive entro 3 minuti dopo A nella stessa sessione: stima, non un vero «rispondi a»',
    },
  },
  copertura,
  volume: {
    totale: totaleContenuto,
    soloTesto: elencoPersone.reduce((a, p) => a + p.soloTesto, 0),
    sistema: totaleSistema,
    eliminati: totaleEliminati,
    parole: elencoPersone.reduce((a, p) => a + p.parole, 0),
    caratteri: elencoPersone.reduce((a, p) => a + p.caratteri, 0),
    giorniCoperti: giorniOrdinati.length,
    mediaAlGiorno: arrotonda(totaleContenuto / Math.max(giorniOrdinati.length, 1), 1),
    perAnno: Object.fromEntries([...perAnno.entries()].sort()),
    perMese: Object.fromEntries([...perMese.entries()].sort()),
    settimanaRecord: (() => {
      const [settimana, n] = inOrdine(perSettimana, 1)[0] || [null, 0]
      return { settimana, messaggi: n }
    })(),
  },
  tempo: {
    perOra,
    perGiornoSettimana: SETTIMANA.map((nome, i) => ({ giorno: nome, messaggi: perGiornoSettimana[i] })),
    oraPiuAttiva: migliorOra(perOra),
    giornoSettimanaPiuAttivo: SETTIMANA[perGiornoSettimana.indexOf(Math.max(...perGiornoSettimana))],
    mesePiuAttivo: (() => {
      const [mese, n] = inOrdine(perMese, 1)[0] || [null, 0]
      return { mese, messaggi: n }
    })(),
    meseMenoAttivo: (() => {
      const [mese, n] = [...perMese.entries()].sort((a, b) => a[1] - b[1])[0] || [null, 0]
      return { mese, messaggi: n, avvertenza: 'confronta con copertura.mesiQuasiVuoti: può essere un buco tecnico' }
    })(),
  },
  persone: elencoPersone.map((p) => ({
    nome: p.nome,
    messaggi: p.messaggi,
    quota: arrotonda((p.messaggi / totaleContenuto) * 100, 1),
    soloTesto: p.soloTesto,
    parole: p.parole,
    caratteri: p.caratteri,
    mediaParole: arrotonda(p.parole / Math.max(p.soloTesto, 1), 1),
    medianaParole: mediana(p.lunghezze),
    giorniAttivi: p.perGiorno.size,
    primo: p.primo,
    ultimo: p.ultimo,
    oraPreferita: migliorOra(p.perOra),
    giornoPreferito: SETTIMANA[p.perGiornoSettimana.indexOf(Math.max(...p.perGiornoSettimana))],
    mesePicco: (() => { const [mese, n] = inOrdine(p.perMese, 1)[0] || [null, 0]; return { mese, messaggi: n } })(),
    perAnno: Object.fromEntries([...p.perAnno.entries()].sort()),
    perTipo: Object.fromEntries(inOrdine(p.perTipo)),
    emojiTop: inOrdine(p.emoji, 8).map(([emoji, n]) => ({ emoji, volte: n })),
    paroleDistintive: paroleDistintive(p),
    link: p.link,
    modificati: p.modificati,
    eliminati: eliminatiPerPersona.get(p.nome) || 0,
    menzioniRicevute: p.menzioniRicevute,
    menzioniFatte: inOrdine(p.menzioniFatte, 5).map(([nome, n]) => ({ nome, volte: n })),
  })),
  linguaggio: {
    paroleTop: inOrdine(paroleTotali, 60).map(([parola, n]) => ({ parola, volte: n })),
    emojiTop: inOrdine(emojiTotali, 30).map(([emoji, n]) => ({ emoji, volte: n })),
    messaggiIdentici: inOrdine(messaggiIdentici, 30)
      .filter(([, n]) => n >= 10)
      .map(([testo, n]) => ({ testo, volte: n })),
    frasiRicorrenti: inOrdine(frasi, 40)
      .filter(([, n]) => n >= 8)
      .map(([testo, n]) => ({ testo, volte: n })),
    paroleEsplose,
    messaggioPiuLungo: msgPiuLungo,
  },
  sessioni: {
    totale: sessioni.length,
    mediaMessaggi: arrotonda(contenuto.length / Math.max(sessioni.length, 1), 1),
    piuLunga: sessionePiuLunga && {
      inizio: sessionePiuLunga.inizio,
      fine: sessionePiuLunga.fine,
      messaggi: sessionePiuLunga.messaggi,
      partecipanti: sessionePiuLunga.partecipanti.size,
      durataMinuti: Math.round((sessionePiuLunga.fineMs - sessionePiuLunga.inizioMs) / 60000),
    },
    aperteDa: inOrdine(sessioni.reduce((m, s) => conta(m, s.apertaDa) || m, new Map()), 10).map(([nome, n]) => ({ nome, volte: n })),
    chiuseDa: inOrdine(sessioni.reduce((m, s) => conta(m, s.chiusaDa) || m, new Map()), 10).map(([nome, n]) => ({ nome, volte: n })),
  },
  coppie: {
    adiacenza: inOrdine(adiacenze, 25).map(([coppia, n]) => ({ coppia, volte: n })),
    coPresenza: inOrdine(coPresenza, 25).map(([coppia, n]) => ({ coppia, sessioniInsieme: n })),
  },
  record: {
    giornoRecord: giornoRecord && { data: giornoRecord[0], messaggi: giornoRecord[1] },
    oraRecord: oraRecord && { quando: oraRecord[0], messaggi: oraRecord[1] },
    recordPersonaGiorno,
    raffica: raffica && { nome: raffica.nome, messaggi: raffica.quanti, dal: raffica.inizio, al: raffica.fine },
    striscia: strisce,
    silenzioPiuLungo,
    messaggioPiuLungo: msgPiuLungo,
  },
  eventi: {
    nomiGruppo,
    aggiunteFatte: inOrdine(aggiunteFatte).map(([nome, n]) => ({ nome, volte: n })),
    aggiunteSubite: inOrdine(aggiunteSubite).map(([nome, n]) => ({ nome, volte: n })),
    rimozioniFatte: inOrdine(rimozioniFatte).map(([nome, n]) => ({ nome, volte: n })),
    rimozioniSubite: inOrdine(rimozioniSubite).map(([nome, n]) => ({ nome, volte: n })),
    uscite: inOrdine(uscite).map(([nome, n]) => ({ nome, volte: n })),
    giorniFuoriScala: fuoriScala(perGiorno),
  },
  evoluzione: [...perAnno.keys()].sort().map((anno) => ({
    anno,
    messaggi: perAnno.get(anno),
    personeAttive: elencoPersone.filter((p) => p.perAnno.get(anno)).length,
    primi: elencoPersone
      .map((p) => ({ nome: p.nome, messaggi: p.perAnno.get(anno) || 0 }))
      .filter((v) => v.messaggi > 0)
      .sort((a, b) => b.messaggi - a.messaggi)
      .slice(0, 5),
  })),
}

// ---------------------------------------------------------------------------
// Scrittura e riepilogo
// ---------------------------------------------------------------------------

mkdirSync(dirname(fileUscita), { recursive: true })
writeFileSync(fileUscita, JSON.stringify(dati, null, 2))

const unificata = join(LAVORO, 'chat_unificata.txt')
mkdirSync(LAVORO, { recursive: true })
writeFileSync(
  unificata,
  tutti.map((m) => `${m.ts.replace('T', ' ')} ${m.mittente}: ${m.tipo === 'testo' ? m.testo : `[${m.tipo}]`}`).join('\n'),
)

console.log(`analizza: ${tutti.length} righe uniche da ${fonti.length} export (${copertura.periodo.dal} → ${copertura.periodo.al})`)
console.log(`  messaggi: ${totaleContenuto} · solo testo: ${dati.volume.soloTesto} · sistema: ${totaleSistema} · eliminati: ${totaleEliminati}`)
console.log(`  persone: ${elencoPersone.length}${alias.size ? '' : ' (nessun alias caricato: numeri e nomi doppi restano separati)'}`)
console.log(`  primi 5: ${elencoPersone.slice(0, 5).map((p) => `${p.nome} ${p.messaggi}`).join(' · ')}`)
console.log(`  dati in ${fileUscita}`)
console.log(`  chat unificata in ${unificata} (per verificare le citazioni)`)
