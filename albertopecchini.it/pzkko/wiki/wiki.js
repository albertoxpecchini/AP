// pzkkopedia (26.10, scheletro; 2.11 piena): la wiki di pzkko.it. È una copia fedele, nella grafica e nella struttura,
// della skin Vector 2022 di Wikipedia in italiano (intestazione con menu, logo e ricerca; colonna a sinistra con il menu
// principale e i contenuti; linguette Voce/Discussione e Leggi/Modifica/Cronologia; piè di pagina), ma con un logo
// disegnato qui, un nome tutto suo e nessun testo preso da altri. Il tocco di pzkko sta in wiki.css.
// Il sito è statico: una pagina sola (index.html) e l'indirizzo della voce nell'hash: /wiki/#/Titolo_della_voce,
// /wiki/#/Speciale:Cerca?q=…, /wiki/#/Titolo?action=history. Le voci stanno in voci.js (che unisce i moduli di voci/*.js;
// il formato è in tools/pzkko/wiki/README.md). Il wikitesto lo interpreta wikitesto() qui sotto: grassetto, corsivo,
// titoli, link (rossi se la voce non esiste), elenchi, definizioni, tabelle, immagini [[File:…]], i template
// {{Infobox}} {{Vedi anche}} {{Principale}} {{Citazione}} {{Avviso}} {{Versione}}, le note <ref>, i rinvii #RINVIA,
// le categorie, e l'indice con gli id dei titoli. Le modifiche non si salvano dal browser: le voci si scrivono nel
// repository (il tasto «Modifica» porta al file su GitHub), e la cronologia di ogni voce sono i commit veri che hanno
// toccato i suoi file (wiki/cronologia.js, generata da tools/pzkko/wiki/genera.mjs).

import { VOCI, FILE_DI } from './voci.js'

const NOME = 'pzkkopedia'
const SLOGAN = 'l’enciclopedia libera del muro'
const PRINCIPALE = 'Pagina principale'
const CREATA = '2026-10-26' // la nascita della wiki: la data delle pagine che non ne hanno una loro
const GITHUB = 'https://github.com/albertoxpecchini/AP'
const CARTELLA_VOCI = 'albertopecchini.it/pzkko/wiki/voci/'
const app = document.getElementById('app')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const maiuscola = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const dec = (s) => { try { return decodeURIComponent(s) } catch { return s } }
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const dataIt = (d) => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d))?/.exec(d || ''); return m ? `${+m[3]} ${MESI[m[2] - 1]} ${m[1]}${m[4] ? ` alle ${m[4]}:${m[5]}` : ''}` : '' }
const n_ = (n) => Number(n).toLocaleString('it-IT')

// ---------------------------------------------------------------------------------------------------- icone
const svg = (d, v = 20) => `<svg viewBox="0 0 ${v} ${v}" width="${v}" height="${v}" aria-hidden="true" focusable="false">${d}</svg>`
const ICONE = {
  menu: svg('<path d="M2 4h16v2H2zm0 5h16v2H2zm0 5h16v2H2z" fill="currentColor"/>'),
  lente: svg('<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12.4 12.4 18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  punti: svg('<circle cx="4" cy="10" r="1.8" fill="currentColor"/><circle cx="10" cy="10" r="1.8" fill="currentColor"/><circle cx="16" cy="10" r="1.8" fill="currentColor"/>'),
  freccia: svg('<path d="m4 8 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8"/>'),
  mondo: svg('<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 10h15M10 2.5c-3.5 3.5-3.5 11.500 0 15M10 2.5c3.5 3.5 3.5 11.5 0 15" fill="none" stroke="currentColor" stroke-width="1.3"/>'),
}
// il logo: una chiocciola con il guscio a pezzo di puzzle (la linguetta in cima), color ruggine e giallo
const LOGO = `<svg class="logo-svg" viewBox="0 0 64 64" width="38" height="38" aria-hidden="true" focusable="false">
<path d="M3 54C3 42 6 33 11 32c4-1 5 4 5 8v4h39c7 0 7 10 0 10z" fill="#665d56"/>
<path d="M7 34 5 25m7 8 2-9" stroke="#665d56" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="24.500" r="2.200" fill="#665d56"/><circle cx="14" cy="23.500" r="2.200" fill="#665d56"/>
<path d="M33.600 14.340 34 11.500A4.200 4.200 0 1 1 40 11.500L40.400 14.340A17 17 0 1 1 33.600 14.340Z" fill="#ffd400" stroke="#665d56" stroke-width="2.500" stroke-linejoin="round"/>
<path d="M37 31a3 3 0 0 1 6 0 6 6 0 0 1-12 0 9 9 0 0 1 18 0 12 12 0 0 1-24 0" fill="none" stroke="#665d56" stroke-width="2.200" stroke-linecap="round"/></svg>`

// ---------------------------------------------------------------------------------------------------- titoli e spazi
const SPAZI = [['', 'Discussione'], ['Utente', 'Discussioni utente'], ['Pzkkopedia', 'Discussioni Pzkkopedia'], ['File', 'Discussioni file'], ['Template', 'Discussioni template'], ['Aiuto', 'Discussioni aiuto'], ['Categoria', 'Discussioni categoria'], ['Portale', 'Discussioni portale']]
const NOMI = ['Speciale', ...SPAZI.flatMap(([s, d]) => (s ? [s, d] : [d]))]
const ETICHETTA = { '': 'Voce', Utente: 'Pagina utente', Pzkkopedia: 'Pagina di servizio', File: 'File', Template: 'Template', Aiuto: 'Pagina di aiuto', Categoria: 'Categoria', Portale: 'Portale' }

/** Il titolo come sta nelle chiavi di VOCI: gli spazi al posto dei trattini bassi, l'apostrofo tipografico, lo spazio dei nomi
 *  scritto giusto, e la prima lettera maiuscola; ma se una voce ha il titolo con la minuscola («three.js», «pzk os»,
 *  «albertopecchini.it») vale quella. */
function normalizza(t) {
  t = t.replace(/_/g, ' ').replace(/'/g, '’').replace(/\s+/g, ' ').trim()
  const i = t.indexOf(':')
  if (i > 0) {
    const pre = t.slice(0, i).trim().toLowerCase(), ns = NOMI.find((n) => n.toLowerCase() === pre)
    if (ns) return `${ns}:${primaLettera(t.slice(i + 1).trim())}`
  }
  return primaLettera(t)
}
const minuscola = (s) => s.charAt(0).toLowerCase() + s.slice(1)
function primaLettera(t) {
  const M = maiuscola(t), m = minuscola(t)
  if (Object.hasOwn(VOCI, M)) return M
  if (Object.hasOwn(VOCI, m)) return m
  return M
}
const spazioDi = (t) => { const i = t.indexOf(':'); return i > 0 && NOMI.includes(t.slice(0, i)) ? t.slice(0, i) : '' }
function coppia(t) {
  const sp = spazioDi(t), nome = sp ? t.slice(sp.length + 1) : t
  const i = SPAZI.findIndex(([s]) => s === sp)
  if (i >= 0) return { sog: t, disc: `${SPAZI[i][1]}:${nome}`, talk: false, sp }
  const j = SPAZI.findIndex(([, d]) => d === sp)
  return { sog: SPAZI[j][0] ? `${SPAZI[j][0]}:${nome}` : nome, disc: t, talk: true, sp: SPAZI[j][0] }
}
const percorso = (t) => '#/' + encodeURIComponent(t.replace(/ /g, '_')).replace(/%3A/gi, ':').replace(/%2F/gi, '/')

// ---------------------------------------------------------------------------------------------------- le voci
const dati = (t) => (Object.hasOwn(VOCI, t) ? VOCI[t] : null)
const testoDi = (t) => { const v = dati(t); return typeof v === 'string' ? v : v?.testo ?? '' }
const dataDi = (t) => { const v = dati(t); return typeof v === 'object' && v?.data ? v.data : CREATA }
const fontiDi = (t) => { const v = dati(t); return (typeof v === 'object' && Array.isArray(v?.fonti)) ? v.fonti : [] }
const nomiVoci = () => Object.keys(VOCI).filter((k) => !spazioDi(k) && !k.startsWith(PRINCIPALE + '/'))
const RE_CAT = /\[\[\s*Categoria\s*:\s*([^\]|\n]+?)\s*(?:\|[^\]\n]*)?\]\]/gi
const catDi = (t) => [...testoDi(t).matchAll(RE_CAT)].map((m) => normalizza('Categoria:' + m[1]))
const rinvioDi = (t) => { const m = /^\s*#(?:RINVIA|REDIRECT)\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/i.exec(testoDi(t)); return m ? normalizza(m[1]) : null }

// gli indici, calcolati una volta: chi sta in quale categoria, chi punta a chi, chi usa quale file
const IDX = { cat: new Map(), punta: new Map(), file: new Map(), link: new Map() }
function indicizza() {
  const RE_LINK = /\[\[([^\[\]|#]*?)(?:#[^\[\]|]*)?(?:\|[^\[\]]*?)?\]\]/g
  for (const k of Object.keys(VOCI)) {
    for (const c of catDi(k)) IDX.cat.set(c, [...(IDX.cat.get(c) ?? []), k])
    const testo = testoDi(k).replace(/<nowiki>[\s\S]*?<\/nowiki>/gi, ''), verso = new Set()
    for (const m of testo.matchAll(RE_LINK)) {
      const b = m[1].trim().replace(/^:/, '')
      if (!b || /^(Categoria|Categoria\s*)\s*:/i.test(b)) continue
      if (/^File\s*:/i.test(b)) { const f = nomeFile(b.replace(/^File\s*:\s*/i, '')); IDX.file.set(f, [...new Set([...(IDX.file.get(f) ?? []), k])]); continue }
      verso.add(normalizza(b))
    }
    for (const m of testo.matchAll(/\|\s*immagine\s*=\s*([^\n|]+)/gi)) if (m[1].trim()) { const f = nomeFile(m[1]); IDX.file.set(f, [...new Set([...(IDX.file.get(f) ?? []), k])]) }
    IDX.link.set(k, verso)
    for (const t of verso) IDX.punta.set(t, [...(IDX.punta.get(t) ?? []), k])
  }
  for (const [k, v] of IDX.punta) IDX.punta.set(k, [...new Set(v)].sort((a, b) => a.localeCompare(b, 'it')))
}
// (indicizza() si chiama in fondo, quando tutte le funzioni sono definite)
const membriDi = (cat) => (IDX.cat.get(cat) ?? []).slice().sort((a, b) => a.localeCompare(b, 'it'))
/** Il nome con cui un file sta nell'indice (i nomi sono minuscoli, ma il titolo «File:Zero-aperto.webp» arriva con la maiuscola). */
function chiaveFile(nome) {
  const n = nomeFile(nome)
  if (IDX.file.has(n)) return n
  const m = n.charAt(0).toLowerCase() + n.slice(1)
  if (IDX.file.has(m)) return m
  const M = n.charAt(0).toUpperCase() + n.slice(1)
  return IDX.file.has(M) ? M : null
}
const esisteVoce = (t) => Object.hasOwn(VOCI, t) || t === PRINCIPALE || (t.startsWith('Speciale:') && !!speciale(t)) || (t.startsWith('Categoria:') && membriDi(t).length > 0) || (t.startsWith('File:') && !!chiaveFile(t.slice(5)))

// la cronologia dei commit (wiki/cronologia.js, generata): si scarica solo quando serve
let cronP = null
const cronologia = () => (cronP ??= import('./cronologia.js').catch(() => null))

// ---------------------------------------------------------------------------------------------------- il wikitesto
/** Il testo nudo di un wikitesto (per la ricerca, gli snippet, gli alt). */
function testoSemplice(s) {
  return s
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/<references\s*\/?>/g, '')
    .replace(/\{\{[\s\S]*?\}\}/g, (t) => (/^\{\{\s*Citazione\s*\|/i.test(t) ? t.split('|')[1] ?? '' : ''))
    .replace(/\[\[\s*File\s*:[^\]]*\]\]/gi, '').replace(/\[\[\s*Categoria\s*:[^\]]*\]\]/gi, '')
    .replace(/^\{\|[\s\S]*?^\|\}/gm, (t) => t.replace(/^[|!][-+}]?|\|\||!!/gm, ' ').replace(/^\{\|.*$/gm, ''))
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, '$1').replace(/'{2,5}/g, '')
    .replace(/<[^>]+>/g, '').replace(/^[*#;:]+\s*/gm, '').replace(/^=+\s*|\s*=+$/gm, '').replace(/^-{4,}$/gm, '').replace(/^#RINVIA.*$/gmi, '')
}

/** Dove sta un'immagine: un indirizzo assoluto o di un altro sito resta com'è, un nome sta in /wiki/img/. */
const nomeFile = (nome) => { nome = nome.trim().replace(/ /g, '_'); return /^(https?:)?\/\//.test(nome) || nome.startsWith('/') || /\.[a-z0-9]{2,5}$/i.test(nome) ? nome : nome + '.webp' }
const srcFile = (nome) => { nome = nomeFile(nome); return /^(https?:)?\/\//.test(nome) || nome.startsWith('/') ? nome : '/wiki/img/' + nome }
const titoloFile = (nome) => 'File:' + nomeFile(nome)

/** Un'immagine [[File:nome|opzioni…|didascalia]]: inline, o in un riquadro (thumb) a destra/sinistra/centro. */
function immagine(dentro, ctx) {
  const parti = dentro.split('|').map((x) => x.trim())
  const nome = parti[0].replace(/^File\s*:\s*/i, ''), opz = parti.slice(1)
  let thumb = false, lato = '', larg = '', didascalia = '', alt = ''
  for (const o of opz) {
    if (/^(thumb|miniatura|frame|framed)$/i.test(o)) thumb = true
    else if (/^(left|sinistra)$/i.test(o)) lato = 'tleft'
    else if (/^(right|destra)$/i.test(o)) lato = 'tright'
    else if (/^(center|centro)$/i.test(o)) lato = 'tcenter'
    else if (/^none$/i.test(o)) lato = 'tnone'
    else if (/^upright$/i.test(o)) larg = '180px'
    else if (/^\d+px$/i.test(o)) larg = o
    else if (/^alt=/i.test(o)) alt = o.slice(4)
    else didascalia = o
  }
  const src = srcFile(nome), href = nome.startsWith('/') || /^https?:/.test(nome) ? src : percorso(titoloFile(nome))
  const alt_ = esc(alt || testoSemplice(didascalia).trim())
  const img = `<img src="${esc(src)}" alt="${alt_}" loading="lazy" decoding="async"${larg ? ` style="width:${esc(larg)}"` : ''}>`
  ctx?.immagini?.push(nomeFile(nome))
  if (!thumb) return `<a class="immagine" href="${esc(href)}">${img}</a>`
  return `<span class="thumb ${lato || 'tright'}"${larg ? ` style="width:calc(${esc(larg)} + 10px)"` : ''}><a class="thumb-img" href="${esc(href)}" title="${alt_}">${img}</a>${didascalia ? `<span class="thumbcaption">${inline(didascalia, ctx)}</span>` : ''}</span>`
}

/** I template {{…}}: il nome e gli argomenti (posizionali e con nome), rispettando i [[…]] dentro gli argomenti. */
function argomenti(dentro) {
  const parti = [], n = dentro.length
  let i = 0, inizio = 0, prof = 0
  while (i < n) {
    const c = dentro[i], d = dentro[i + 1]
    if (c === '[' && d === '[') { prof++; i += 2; continue }
    if (c === ']' && d === ']') { prof = Math.max(0, prof - 1); i += 2; continue }
    if (c === '{' && d === '{') { prof++; i += 2; continue }
    if (c === '}' && d === '}') { prof = Math.max(0, prof - 1); i += 2; continue }
    if (c === '|' && prof === 0) { parti.push(dentro.slice(inizio, i)); inizio = i + 1 }
    i++
  }
  parti.push(dentro.slice(inizio))
  const nome = parti[0].trim(), pos = [], nom = []
  for (const p of parti.slice(1)) {
    const m = /^\s*([^=\s][^=]*?)\s*=\s*([\s\S]*?)\s*$/.exec(p)
    if (m) nom.push([m[1], m[2]]); else pos.push(p.trim())
  }
  return { nome, pos, nom }
}
function template(dentro, ctx) {
  const { nome, pos, nom } = argomenti(dentro), n = nome.toLowerCase()
  const campo = (k) => nom.find(([a]) => a.toLowerCase() === k)?.[1] ?? ''
  if (n === 'infobox') {
    const titolo = campo('titolo') || ctx.qui, img = campo('immagine'), did = campo('didascalia')
    const righe = nom.filter(([k]) => !['titolo', 'immagine', 'didascalia'].includes(k.toLowerCase()))
    return `<table class="infobox"><caption>${inline(titolo, ctx)}</caption>${img ? `<tr><td colspan="2" class="infobox-img">${immagine(`${img}|260px|${did}`, ctx)}${did ? `<div class="infobox-did">${inline(did, ctx)}</div>` : ''}</td></tr>` : ''}${righe.map(([k, v]) => `<tr><th scope="row">${inline(k, ctx)}</th><td>${inline(v, ctx)}</td></tr>`).join('')}</table>`
  }
  // (7) «Vedi anche» a mattonelle (2.11): per ogni voce la sua immagine e la prima frase (ritrattoDi); quelle che non esistono
  // restano un link rosso in fondo
  if (n === 'vedi anche' || n === 'vedianche') {
    const ok = [], rossi = []
    for (const p of pos) { const t = normalizza(p.replace(/\|.*$/, '').replace(/#.*$/, '')); (esisteVoce(t) && !t.startsWith('Speciale:') ? ok : rossi).push([t, p]) }
    const tile = ([t, p]) => {
      const r = ritrattoDi(t), frase = r.frase.length > 110 ? r.frase.slice(0, 108).replace(/\s+\S*$/, '') + '…' : r.frase
      return `<a class="va-tile" href="${percorso(t)}" title="${esc(t)}"><span class="va-img">${r.img ? `<img src="${esc(srcFile(r.img))}" alt="" loading="lazy" decoding="async">` : LOGO}</span><span class="va-testo"><b>${esc(p.includes('|') ? p.split('|')[1] : t)}</b>${frase ? `<small>${esc(frase)}</small>` : ''}</span></a>`
    }
    return `<div class="vedi-anche"><h2 class="va-titolo" id="Vedi_anche">Vedi anche</h2><div class="va-griglia">${ok.map(tile).join('')}</div>${rossi.length ? `<p class="va-rossi">${rossi.map(([, p]) => collega(p, undefined, ctx)).join(' · ')}</p>` : ''}</div>`
  }
  if (n === 'principale' || n === 'vedi' || n === 'main') return `<div class="principale">${pos.length === 1 ? 'Voce principale' : 'Voci principali'}: ${pos.map((p) => collega(p, undefined, ctx)).join(', ')}.</div>`
  if (n === 'citazione' || n === 'cita' || n === 'quote') return `<blockquote class="citazione"><p>«${inline(pos[0] ?? '', ctx)}»</p>${pos[1] ? `<footer>— ${inline(pos[1], ctx)}</footer>` : ''}</blockquote>`
  if (n === 'avviso' || n === 'nota') return `<div class="avviso avviso-${campo('tipo') || 'info'}">${inline(pos[0] ?? '', ctx)}</div>`
  if (n === 'versione') return `<span class="versione"><b>${esc(pos[0] ?? '')}</b>${pos[1] ? ` «${esc(pos[1])}»` : ''}${pos[2] ? ` <small>· ${esc(pos[2])}</small>` : ''}</span>`
  if (n === 'data') return `<time datetime="${esc(pos[0] ?? '')}">${esc(dataIt(pos[0]) || pos[0] || '')}</time>`
  return `<span class="template-ignoto" title="template sconosciuto">{{${esc(nome)}}}</span>`
}
const BLOCCO = new Set(['infobox', 'vedi anche', 'vedianche', 'principale', 'vedi', 'main', 'citazione', 'cita', 'quote', 'avviso', 'nota'])

/** Trova il {{…}} che comincia a i (con eventuali template annidati): torna la fine, o -1. */
function fineGraffe(s, i) {
  let prof = 0
  for (let j = i; j < s.length - 1; j++) {
    if (s[j] === '{' && s[j + 1] === '{') { prof++; j++ } else if (s[j] === '}' && s[j + 1] === '}') { prof--; j++; if (prof === 0) return j + 1 }
  }
  return -1
}
function fineQuadre(s, i) {
  let prof = 0
  for (let j = i; j < s.length - 1; j++) {
    if (s[j] === '[' && s[j + 1] === '[') { prof++; j++ } else if (s[j] === ']' && s[j + 1] === ']') { prof--; j++; if (prof === 0) return j + 1 }
  }
  return -1
}

const TAG_OK = /^<(\/?)(code|kbd|br|small|sup|sub|s|u|abbr|span|tt|var)\b([^>]*)>$/i
const RE_INLINE = /\[\[([^\[\]|]*?)(?:\|([^\[\]]*?))?\]\]|\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]*))?\]|'''''(.+?)'''''|'''(.+?)'''|''(.+?)''/g
/** Dal wikitesto di una riga (o di un pezzo) all'HTML: link, grassetto, corsivo, immagini, template in linea, note, tag ammessi. */
function inline(s, ctx) {
  const pezzi = [] // i pezzi già pronti, messi da parte con un segnaposto
  const metti = (html) => { pezzi.push(html); return `\u0001${pezzi.length - 1}\u0001` }
  // <nowiki>…</nowiki>: testo letterale
  s = s.replace(/<nowiki>([\s\S]*?)<\/nowiki>/gi, (_, t) => metti(esc(t)))
  // le note <ref>…</ref>
  s = s.replace(/<ref(?:\s+name="?([^">]*)"?)?\s*>([\s\S]*?)<\/ref>/gi, (_, nome, t) => {
    const n = (ctx.note ??= []).push({ nome, testo: t })
    return metti(`<sup class="nota"><a href="${percorso(ctx.qui)}#nota-${n}" data-sez="nota-${n}" id="rif-${n}">[${n}]</a></sup>`)
  })
  // i template in linea ({{Versione|…}}, {{Data|…}}) e quelli di blocco capitati in mezzo a una riga
  for (let i = s.indexOf('{{'); i >= 0; i = s.indexOf('{{', i + 1)) {
    const f = fineGraffe(s, i)
    if (f < 0) break
    s = s.slice(0, i) + metti(template(s.slice(i + 2, f - 2), ctx)) + s.slice(f)
  }
  // le immagini [[File:…]] (possono avere [[link]] nella didascalia)
  for (;;) {
    const i = s.search(/\[\[\s*File\s*:/i)
    if (i < 0) break
    const f = fineQuadre(s, i)
    if (f < 0) break
    s = s.slice(0, i) + metti(immagine(s.slice(i + 2, f - 2), ctx)) + s.slice(f)
  }
  // i tag HTML ammessi (gli altri vengono mostrati come testo)
  s = s.replace(/<\/?[a-zA-Z][^<>]*>/g, (t) => {
    const m = TAG_OK.exec(t)
    if (!m) return t
    const tag = m[2].toLowerCase()
    if (tag === 'br') return metti('<br>')
    if (m[1]) return metti(`</${tag}>`)
    const titolo = /title="([^"]*)"/.exec(m[3])?.[1], classe = /class="([^"]*)"/.exec(m[3])?.[1]
    return metti(`<${tag}${titolo ? ` title="${esc(titolo)}"` : ''}${classe && tag === 'span' ? ` class="${esc(classe.replace(/[^\w -]/g, ''))}"` : ''}>`)
  })
  let out = '', ultimo = 0
  for (const m of s.matchAll(RE_INLINE)) {
    out += esc(s.slice(ultimo, m.index))
    ultimo = m.index + m[0].length
    if (m[1] !== undefined) out += collega(m[1], m[2], ctx)
    else if (m[3]) out += `<a class="esterno" href="${esc(m[3])}" rel="nofollow noopener">${m[4] ? inline(m[4], ctx) : esc(m[3])}</a>`
    else if (m[5]) out += `<b><i>${inline(m[5], ctx)}</i></b>`
    else if (m[6]) out += `<b>${inline(m[6], ctx)}</b>`
    else out += `<i>${inline(m[7], ctx)}</i>`
  }
  out += esc(s.slice(ultimo))
  return out.replace(/\u0001(\d+)\u0001/g, (_, i) => pezzi[+i])
}
function collega(bersaglio, etichetta, ctx) {
  let t = bersaglio.trim(), sez = ''
  const k = t.indexOf('#')
  if (k >= 0) { sez = t.slice(k + 1).trim().replace(/ /g, '_'); t = t.slice(0, k).trim() }
  const testo = etichetta === undefined ? esc(bersaglio.trim().replace(/^:/, '').replace(/^(Categoria|Portale|Aiuto|Pzkkopedia|File):/, (x) => x)) : inline(etichetta, ctx)
  if (!t) return `<a href="${percorso(ctx.qui)}#${encodeURIComponent(sez)}" data-sez="${esc(sez)}">${testo}</a>`
  t = normalizza(t.replace(/^:/, ''))
  const ok = esisteVoce(t)
  const qui_ = t === ctx.qui && sez ? ` data-sez="${esc(sez)}"` : ''
  return ok
    ? `<a href="${percorso(t)}${sez ? '#' + encodeURIComponent(sez) : ''}" title="${esc(t)}"${qui_}>${testo}</a>`
    : `<a class="new" href="${percorso(t)}?action=edit&amp;redlink=1" title="${esc(t)} (la pagina non esiste)">${testo}</a>`
}

const CONT = { '*': 'ul', '#': 'ol', ';': 'dl', ':': 'dl' }, VOCE = { '*': 'li', '#': 'li', ';': 'dt', ':': 'dd' }
/** Dal wikitesto all'HTML: { html, sezioni: [{ liv, testo, id }], categorie: ['Categoria:X'], immagini: [] }. */
function wikitesto(src, qui) {
  const ctx = { qui, note: [], immagini: [] }, categorie = []
  src = src.replace(/\r\n?/g, '\n').replace(RE_CAT, (_, c) => {
    const n = normalizza('Categoria:' + c)
    if (!categorie.includes(n)) categorie.push(n)
    return ''
  }).replace(/^#(?:RINVIA|REDIRECT)\s*(\[\[[^\]]+\]\])/im, 'Reindirizza a $1.')
  // i template di blocco su più righe diventano una riga sola (un segnaposto), così il parser a righe li vede interi
  const blocchi = []
  for (let i = src.indexOf('{{'); i >= 0; i = src.indexOf('{{', i + 1)) {
    const f = fineGraffe(src, i)
    if (f < 0) break
    const dentro = src.slice(i + 2, f - 2), nome = dentro.split('|')[0].trim().toLowerCase()
    if (!BLOCCO.has(nome)) continue
    blocchi.push(dentro)
    src = src.slice(0, i) + `\n\u0002${blocchi.length - 1}\u0002\n` + src.slice(f)
  }
  const sezioni = [], usati = new Set(), out = []
  let par = [], pila = [], tab = null
  const chiudiPar = () => { if (par.length) out.push(`<p>${inline(par.join(' '), ctx)}</p>`); par = [] }
  const chiudiListe = () => { while (pila.length) { const c = pila.pop(); out.push(`</${VOCE[c]}></${CONT[c]}>`) } }
  const lista = (pre) => {
    let i = 0
    while (i < pila.length && i < pre.length && CONT[pila[i]] === CONT[pre[i]]) i++
    while (pila.length > i) { const c = pila.pop(); out.push(`</${VOCE[c]}></${CONT[c]}>`) }
    if (pila.length === pre.length && i > 0) { const c = pila.pop(), d = pre[pre.length - 1]; out.push(`</${VOCE[c]}><${VOCE[d]}>`); pila.push(d) }
    else while (pila.length < pre.length) { const c = pre[pila.length]; out.push(`<${CONT[c]}><${VOCE[c]}>`); pila.push(c) }
  }
  const cella = (tag, s) => s.split(tag === 'th' ? '!!' : '||').map((c) => {
    // gli attributi della cella (colspan="2", style="…") stanno prima di una barra sola; un [[link|testo]] non è un attributo
    const m = /^s*([^|[]{}<>]*=[^|[]{}]*?)s*|(?!|)([sS]*)$/.exec(c), attr = m ? m[1] : '', testo = m ? m[2] : c
    const span = /colspan="?(\d+)/.exec(attr)?.[1], rspan = /rowspan="?(\d+)/.exec(attr)?.[1], al = /text-align:\s*(right|center)/.exec(attr)?.[1]
    return `<${tag}${span ? ` colspan="${span}"` : ''}${rspan ? ` rowspan="${rspan}"` : ''}${al ? ` style="text-align:${al}"` : ''}>${inline(testo.trim(), ctx)}</${tag}>`
  }).join('')
  for (const riga of src.split('\n')) {
    let m
    if (tab) { // dentro una tabella
      const r = riga.trim()
      if (r.startsWith('|}')) { if (tab.riga) out.push('</tr>'); out.push('</tbody></table>'); tab = null }
      else if (r.startsWith('|+')) out.push(`<caption>${inline(r.slice(2).trim(), ctx)}</caption>`)
      else if (r.startsWith('|-')) { if (tab.riga) out.push('</tr>'); out.push('<tr>'); tab.riga = true }
      else if (r.startsWith('!')) { if (!tab.riga) { out.push('<tr>'); tab.riga = true } out.push(cella('th', r.slice(1))) }
      else if (r.startsWith('|')) { if (!tab.riga) { out.push('<tr>'); tab.riga = true } out.push(cella('td', r.slice(1))) }
      else if (r) out.push(inline(r, ctx))
      continue
    }
    if ((m = /^\u0002(\d+)\u0002$/.exec(riga))) { chiudiPar(); chiudiListe(); out.push(template(blocchi[+m[1]], ctx)) }
    else if ((m = /^\{\|(.*)$/.exec(riga))) {
      chiudiPar(); chiudiListe()
      const classi = (/class="([^"]*)"/.exec(m[1])?.[1] ?? '').replace(/[^\w -]/g, '')
      tab = { riga: false }; out.push(`<table class="wikitable ${esc(classi)}"><tbody>`)
    } else if ((m = /^(={2,6})\s*(.+?)\s*\1\s*$/.exec(riga))) {
      chiudiPar(); chiudiListe()
      const liv = m[1].length, testo = testoSemplice(m[2]).trim(), base = testo.replace(/\s+/g, '_') || 'sezione'
      let id = base, n = 2
      while (usati.has(id)) id = `${base}_${n++}`
      usati.add(id)
      sezioni.push({ liv, testo, id })
      out.push(`<h${liv} id="${esc(id)}">${inline(m[2], ctx)}</h${liv}>`)
    } else if ((m = /^([*#;:]+)\s*(.*)$/.exec(riga))) {
      chiudiPar(); lista(m[1])
      if (m[1].endsWith(';') && / : /.test(m[2])) { const [dt, ...dd] = m[2].split(' : '); out.push(`${inline(dt, ctx)}</dt><dd>${inline(dd.join(' : '), ctx)}`); pila[pila.length - 1] = ':' }
      else out.push(inline(m[2], ctx))
    } else if (/^-{4,}\s*$/.test(riga)) { chiudiPar(); chiudiListe(); out.push('<hr>') }
    else if (/^<references\s*\/?>\s*$/i.test(riga.trim())) { chiudiPar(); chiudiListe(); out.push(note(ctx)); ctx.note = [] }
    else if (!riga.trim()) { chiudiPar(); chiudiListe() }
    else { chiudiListe(); par.push(riga.trim()) }
  }
  chiudiPar(); chiudiListe()
  if (tab) out.push('</tbody></table>')
  if (ctx.note.length) { out.push(`<h2 id="Note">Note</h2>`); sezioni.push({ liv: 2, testo: 'Note', id: 'Note' }); out.push(note(ctx)) }
  return { html: out.join('\n'), sezioni, categorie, immagini: ctx.immagini }
}
const note = (ctx) => (ctx.note.length ? `<ol class="note">${ctx.note.map((n, i) => `<li id="nota-${i + 1}"><a href="${percorso(ctx.qui)}#rif-${i + 1}" data-sez="rif-${i + 1}" title="torna al testo">↑</a> ${inline(n.testo, ctx)}</li>`).join('')}</ol>` : '')

// ---------------------------------------------------------------------------------------------------- l'indice
function albero(sez) {
  const radice = [], pila = [{ liv: 0, figli: radice }]
  for (const s of sez) {
    const n = { ...s, figli: [] }
    while (pila.at(-1).liv >= s.liv) pila.pop()
    pila.at(-1).figli.push(n); pila.push(n)
  }
  return radice
}
function tocHtml(sez, titolo) {
  const voci = (lista) => `<ul>${lista.map((n) => `<li><div class="toc-riga"><a data-sez="${esc(n.id)}" href="${percorso(titolo)}#${encodeURIComponent(n.id)}">${esc(n.testo)}</a>${n.figli.length ? `<button type="button" class="toc-apri" aria-expanded="true" aria-label="Mostra o nascondi le sezioni di «${esc(n.testo)}»">${ICONE.freccia}</button>` : ''}</div>${n.figli.length ? voci(n.figli) : ''}</li>`).join('')}</ul>`
  return `<h2 class="toc-titolo">Contenuti</h2><ul class="toc-inizio"><li><div class="toc-riga"><a data-sez="" class="attiva" href="${percorso(titolo)}">(Inizio)</a></div></li></ul>${voci(albero(sez))}`
}
function aggiornaToc(sez, titolo) {
  const html = sez.length ? tocHtml(sez, titolo) : ''
  document.getElementById('toc-lato').innerHTML = html
  document.getElementById('toc-lato').hidden = !html
  document.getElementById('toc-pagina').innerHTML = html ? `<details class="toc-box"><summary>Contenuti</summary>${html.replace('<h2 class="toc-titolo">Contenuti</h2>', '')}</details>` : ''
  segui()
}
function segui() { // l'indice evidenzia la sezione che si sta leggendo
  const tit = [...document.querySelectorAll('.wikitesto :is(h2,h3,h4,h5,h6)[id]')]
  const soglia = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barra')) || 72) + 40
  let id = ''
  for (const h of tit) if (h.getBoundingClientRect().top <= soglia) id = h.id
  for (const a of document.querySelectorAll('#toc-lato a[data-sez]')) {
    const su = a.dataset.sez === id
    a.classList.toggle('attiva', su)
    if (su) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current')
  }
}
function scorri(id) {
  const x = id && document.getElementById(id)
  if (x) x.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  else window.scrollTo(0, 0)
}

// ---------------------------------------------------------------------------------------------------- i commit
const commitUrl = (h) => `${GITHUB}/commit/${h}`
const rigaCommit = (c, voci) => `<li class="commit"><time>${esc(c[1])}</time> <a class="hash esterno" href="${commitUrl(c[0])}" rel="noopener">${esc(c[0])}</a> <span class="msg">${esc(c[2])}</span>${voci?.length ? `<span class="commit-voci"> · ${voci.slice(0, 6).map((v) => `<a href="${percorso(v)}">${esc(v)}</a>`).join(', ')}${voci.length > 6 ? ` e altre ${voci.length - 6}` : ''}</span>` : ''}</li>`
/** Il corpo di una lista di commit (con la cronologia caricata). */
async function listaCommit(filtra, { conVoci = true, max = 50 } = {}) {
  const cr = await cronologia()
  if (!cr) return '<p class="vuoto-lista">La cronologia non è disponibile (manca wiki/cronologia.js: la genera tools/pzkko/wiki/genera.mjs).</p>'
  const vociDi = new Map()
  if (conVoci) for (const [v, hs] of Object.entries(cr.PER_VOCE)) for (const h of hs) vociDi.set(h, [...(vociDi.get(h) ?? []), v])
  const lista = cr.COMMIT.filter(filtra).slice(0, max)
  return lista.length ? `<ul class="commits">${lista.map((c) => rigaCommit(c, vociDi.get(c[0]))).join('')}</ul>` : '<p class="vuoto-lista">Nessun commit.</p>'
}

// ---------------------------------------------------------------------------------------------------- le pagine speciali
const SPECIALI = {
  UltimeModifiche: { nome: 'Ultime modifiche', gruppo: 'Cambiamenti recenti e registri', vista: (arg, q) => {
    const n = +(q.get('n') || 50), giorni = +(q.get('g') || 30)
    return { corpo: `<p>Le modifiche di ${NOME} sono i commit del repository <a class="esterno" href="${GITHUB}" rel="noopener">albertoxpecchini/AP</a>: ogni voce elenca quelli che hanno toccato i suoi file (<a href="${percorso('Pzkkopedia:Come si aggiorna')}">come si aggiorna</a>).</p><form class="filtri" id="f-um"><p><b>Filtri.</b> Mostra gli ultimi <select name="n" aria-label="Quanti commit">${[50, 100, 250, 500, 1000].map((x) => `<option${x === n ? ' selected' : ''}>${x}</option>`).join('')}</select> commit degli ultimi <select name="g" aria-label="Quanti giorni">${[1, 3, 7, 14, 30, 90, 365, 3650].map((x) => `<option${x === giorni ? ' selected' : ''}>${x}</option>`).join('')}</select> giorni. <button type="submit" class="bottone">Aggiorna</button></p></form><div id="um-lista"><p class="vuoto-lista">Carico la cronologia…</p></div>`, async dopo() {
      document.getElementById('f-um').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); location.hash = `#/Speciale:UltimeModifiche?n=${f.get('n')}&g=${f.get('g')}` })
      const da = new Date(Date.now() - giorni * 864e5).toISOString().slice(0, 10)
      document.getElementById('um-lista').innerHTML = await listaCommit((c) => c[1] >= da, { max: n })
    } }
  } },
  Registro: { nome: 'Registri', gruppo: 'Cambiamenti recenti e registri', vista: () => {
    const v = Object.keys(VOCI).map((k) => [dataDi(k), k]).sort((a, b) => b[0].localeCompare(a[0]) || a[1].localeCompare(b[1], 'it'))
    return { corpo: `<p>Il registro delle creazioni: ogni pagina con la data dell’ultimo cambiamento vero della cosa che descrive (il campo <code>data</code> della voce).</p><ul class="registro">${v.map(([d, k]) => `<li><time>${esc(d)}</time> <a href="${percorso(k)}">${esc(k)}</a> <small>(${esc(FILE_DI[k] ?? '')}.js)</small></li>`).join('')}</ul>` }
  } },
  PaginaCasuale: { nome: 'Una voce a caso', gruppo: 'Strumenti per la ricerca', vista: () => {
    const v = nomiVoci().filter((k) => !rinvioDi(k))
    if (v.length) { location.replace(percorso(v[Math.floor(Math.random() * v.length)])); return null }
    return { corpo: `<div class="avviso avviso-info"><b>Nessuna voce da estrarre.</b></div>` }
  } },
  Cerca: { nome: 'Cerca', gruppo: 'Strumenti per la ricerca', vista: (arg, q) => vistaCerca((q.get('q') ?? q.get('search') ?? arg ?? '').trim()) },
  TutteLePagine: { nome: 'Tutte le pagine', gruppo: 'Elenchi di pagine', vista: (arg, q) => {
    const sp = q.get('sp') ?? '', da = (q.get('da') ?? '').toLowerCase()
    const v = Object.keys(VOCI).filter((t) => (sp === '' ? !spazioDi(t) : spazioDi(t) === sp) && (!da || t.toLowerCase() >= da)).sort((a, b) => a.localeCompare(b, 'it'))
    return { corpo: `<form class="filtri" id="f-tp"><p><label>Mostra le pagine a partire da: <input type="text" name="da" value="${esc(q.get('da') ?? '')}"></label> <label>Spazio: <select name="sp">${['', ...NOMI.filter((n) => n !== 'Speciale')].map((n) => `<option value="${esc(n)}"${n === sp ? ' selected' : ''}>${n || '(Principale)'}</option>`).join('')}</select></label> <button type="submit" class="bottone">Vai</button></p></form><p class="conto">${v.length} pagine.</p>${v.length ? `<ul class="colonne">${v.map((t) => `<li><a href="${percorso(t)}">${esc(t)}</a>${rinvioDi(t) ? ' <small>(rinvio)</small>' : ''}</li>`).join('')}</ul>` : '<p class="vuoto-lista">Nessuna pagina.</p>'}`, dopo() { document.getElementById('f-tp').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); location.hash = `#/Speciale:TutteLePagine?sp=${encodeURIComponent(f.get('sp'))}&da=${encodeURIComponent(f.get('da'))}` }) } }
  } },
  NuovePagine: { nome: 'Pagine nuove', gruppo: 'Elenchi di pagine', vista: () => {
    const v = nomiVoci().map((k) => [dataDi(k), k]).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 100)
    return { corpo: `<p>Le cento voci con la data più recente.</p><ul class="registro">${v.map(([d, k]) => `<li><time>${esc(d)}</time> <a href="${percorso(k)}">${esc(k)}</a></li>`).join('')}</ul>` }
  } },
  Categorie: { nome: 'Categorie', gruppo: 'Elenchi di pagine', vista: () => {
    const c = [...IDX.cat].sort((a, b) => a[0].localeCompare(b[0], 'it'))
    return { corpo: c.length ? `<p>${c.length} categorie.</p><ul class="colonne">${c.map(([x, l]) => `<li><a href="${percorso(x)}">${esc(x.slice(10))}</a> (${l.length})</li>`).join('')}</ul>` : '<p class="vuoto-lista">Non esiste ancora nessuna categoria.</p>' }
  } },
  Immagini: { nome: 'Elenco dei file', gruppo: 'Elenchi di pagine', vista: () => {
    const f = [...IDX.file].sort((a, b) => a[0].localeCompare(b[0], 'it'))
    return { corpo: `<p>${f.length} immagini usate nelle voci.</p><ul class="galleria">${f.map(([n, usi]) => `<li><a href="${percorso(titoloFile(n))}"><img src="${esc(srcFile(n))}" alt="" loading="lazy"></a><div><a href="${percorso(titoloFile(n))}">${esc(n.length > 48 ? '…' + n.slice(-45) : n)}</a><br><small>in ${usi.length} ${usi.length === 1 ? 'voce' : 'voci'}</small></div></li>`).join('')}</ul>` }
  } },
  LinkRossi: { nome: 'Pagine richieste', gruppo: 'Elenchi di pagine', vista: () => {
    const r = [...IDX.punta].filter(([t]) => !esisteVoce(t)).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'it'))
    return { corpo: r.length ? `<p>Le pagine che qualcuno linka e che non esistono: ${r.length}.</p><ul class="colonne">${r.map(([t, da]) => `<li><a class="new" href="${percorso(t)}?action=edit&amp;redlink=1">${esc(t)}</a> (${da.length})</li>`).join('')}</ul>` : '<p class="vuoto-lista">Nessun link rosso: ogni link porta a una pagina che esiste.</p>' }
  } },
  Statistiche: { nome: 'Statistiche', gruppo: 'Dati e strumenti', vista: () => ({ corpo: `<table class="wikitable tabella-stat"><caption>Numeri di ${NOME}</caption><tbody><tr><th scope="row">Pagine in tutto</th><td>${n_(Object.keys(VOCI).length + 1)}</td></tr><tr><th scope="row">Voci</th><td>${n_(nomiVoci().filter((k) => !rinvioDi(k)).length)}</td></tr><tr><th scope="row">Rinvii</th><td>${n_(nomiVoci().filter((k) => rinvioDi(k)).length)}</td></tr><tr><th scope="row">Categorie</th><td>${n_(IDX.cat.size)}</td></tr><tr><th scope="row">Immagini usate</th><td>${n_(IDX.file.size)}</td></tr><tr><th scope="row">Link fra le pagine</th><td>${n_([...IDX.link.values()].reduce((s, v) => s + v.size, 0))}</td></tr><tr><th scope="row">Link rossi</th><td>${n_([...IDX.punta].filter(([t]) => !esisteVoce(t)).length)}</td></tr><tr><th scope="row">Modifiche (i commit del repository)</th><td id="st-commit">…</td></tr><tr><th scope="row">La wiki è allineata al commit</th><td id="st-allineata">…</td></tr><tr><th scope="row">Utenze registrate</th><td>0 (le voci si scrivono nel repository)</td></tr></tbody></table>`, async dopo() {
    const cr = await cronologia()
    document.getElementById('st-commit').textContent = cr ? n_(cr.COMMIT.length) : 'non disponibile'
    document.getElementById('st-allineata').innerHTML = cr ? `<a class="esterno" href="${commitUrl(cr.ALLINEATA.commit)}" rel="noopener">${esc(cr.ALLINEATA.commit)}</a> (${esc(dataIt(cr.ALLINEATA.data))})` : '—'
  } }) },
  CreaUtenza: { nome: 'Crea un’utenza', gruppo: 'Utenti e diritti', vista: () => ({ corpo: `<div class="avviso avviso-avvertenza">Le utenze non ci sono: ${NOME} si scrive nel repository, e le modifiche sono i commit di Alberto. Il modulo c’è per fedeltà, ma non crea niente.</div>${modulo(['Nome utente', 'Password', 'Conferma la password'], 'Crea la tua utenza')}` }) },
  Entra: { nome: 'Accedi', gruppo: 'Utenti e diritti', vista: () => ({ corpo: `<div class="avviso avviso-avvertenza">Le utenze non ci sono: il modulo c’è, ma non fa entrare nessuno.</div>${modulo(['Nome utente', 'Password'], 'Accedi')}<p>Non hai un’utenza? <a href="#/Speciale:CreaUtenza">Creane una</a>.</p>` }) },
  PuntanoQui: { nome: 'Puntano qui', gruppo: null, vista: (arg) => {
    const t = normalizza(arg || ''), da = IDX.punta.get(t) ?? []
    return { h1: `Puntano qui: ${esc(t)}`, corpo: `<p>Pagine che contengono un collegamento a «<a href="${percorso(t)}">${esc(t)}</a>».</p>${da.length ? `<ul class="colonne">${da.map((k) => `<li><a href="${percorso(k)}">${esc(k)}</a>${rinvioDi(k) === t ? ' <small>(rinvio)</small>' : ''}</li>`).join('')}</ul>` : '<p class="vuoto-lista">Nessuna pagina punta qui.</p>'}` }
  } },
  ModificheCollegate: { nome: 'Modifiche correlate', gruppo: null, vista: (arg) => {
    const t = normalizza(arg || ''), vicine = [t, ...(IDX.link.get(t) ?? [])].filter((k) => Object.hasOwn(VOCI, k))
    return { h1: `Modifiche correlate: ${esc(t)}`, corpo: `<p>I commit che hanno toccato «${esc(t)}» e le ${vicine.length - 1} pagine a cui rimanda.</p><div id="mc-lista"><p class="vuoto-lista">Carico la cronologia…</p></div>`, async dopo() {
      const cr = await cronologia(), set = new Set(vicine.flatMap((k) => cr?.PER_VOCE[k] ?? []))
      document.getElementById('mc-lista').innerHTML = await listaCommit((c) => set.has(c[0]), { max: 200 })
    } }
  } },
  PagineSpeciali: { nome: 'Pagine speciali', gruppo: null, vista: () => {
    const g = new Map()
    for (const [k, s] of Object.entries(SPECIALI)) if (s.gruppo) g.set(s.gruppo, [...(g.get(s.gruppo) ?? []), [k, s.nome]])
    return { corpo: `<p>Le pagine speciali si generano da sole e non si possono modificare.</p>${[...g].map(([nome, l]) => `<h3>${esc(nome)}</h3><ul class="colonne">${l.map(([k, n]) => `<li><a href="#/Speciale:${k}">${esc(n)}</a></li>`).join('')}</ul>`).join('')}` }
  } },
}
SPECIALI.PagineSpeciali.nome = 'Pagine speciali'
function speciale(titolo) {
  const resto = titolo.slice(9), i = resto.indexOf('/'), nome = (i < 0 ? resto : resto.slice(0, i)).toLowerCase()
  const k = Object.keys(SPECIALI).find((x) => x.toLowerCase() === nome)
  return k ? { chiave: k, arg: i < 0 ? '' : resto.slice(i + 1).replace(/_/g, ' '), ...SPECIALI[k] } : null
}
const modulo = (campi, bottone) => `<form class="modulo" onsubmit="return false">${campi.map((c, i) => `<p><label>${c}<br><input type="${/Password|password/.test(c) ? 'password' : 'text'}" autocomplete="off" name="c${i}"></label></p>`).join('')}<p><button type="submit" class="bottone bottone-blu">${bottone}</button></p></form>`

function vistaSpeciale(titolo, query) {
  const s = speciale(titolo)
  if (!s) return { titolo, speciale: true, esiste: false, corpo: `<div class="avviso avviso-errore"><b>Pagina speciale non valida.</b> Non esiste una pagina speciale con questo nome. Le trovi tutte nell’<a href="#/Speciale:PagineSpeciali">elenco delle pagine speciali</a>.</div>` }
  const v = s.vista(s.arg, query)
  return v && { titolo, speciale: true, h1: esc(s.nome), ...v }
}

// ---------------------------------------------------------------------------------------------------- ricerca
function snippet(t, q) {
  const p = testoSemplice(t).replace(/\s+/g, ' '), i = p.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return esc(p.slice(0, 160))
  const a = Math.max(0, i - 70), b = Math.min(p.length, i + q.length + 90)
  return `${a ? '… ' : ''}${esc(p.slice(a, i))}<mark>${esc(p.slice(i, i + q.length))}</mark>${esc(p.slice(i + q.length, b))}${b < p.length ? ' …' : ''}`
}
function vistaCerca(q) {
  const form = `<form class="cerca-grande" role="search" id="f-cerca"><input type="search" name="q" value="${esc(q)}" aria-label="Testo da cercare" autocomplete="off"><button type="submit" class="bottone bottone-blu">Cerca</button></form>`
  let corpo = form
  if (!q) corpo += '<p class="aiuto-cerca">Scrivi qualcosa da cercare nei titoli e nel testo delle pagine.</p>'
  else {
    const ql = q.toLowerCase()
    const trovate = Object.keys(VOCI).filter((k) => !rinvioDi(k)).map((k) => [k, k.toLowerCase().includes(ql) ? 2 : testoSemplice(testoDi(k)).toLowerCase().includes(ql) ? 1 : 0]).filter((x) => x[1]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))
    if (trovate.length) corpo += `<p class="conto">Risultati: ${trovate.length}.</p><ul class="risultati">${trovate.map(([k]) => `<li><div class="ris-titolo"><a href="${percorso(k)}">${esc(k)}</a></div><div class="ris-testo">${snippet(testoDi(k), q)}</div></li>`).join('')}</ul>`
    else {
      const t = normalizza(q)
      corpo += `<div class="nessun-risultato"><p><b>Nessun risultato per «${esc(q)}».</b></p><p>Non c’è nessuna pagina con questo titolo né con questo testo.</p><ul><li>La pagina «${esc(t)}» <a class="new" href="${percorso(t)}?action=edit&amp;redlink=1">si scrive nel repository</a>.</li><li>Controlla di aver scritto bene, o prova con altre parole, più semplici.</li></ul></div>`
    }
  }
  return { corpo, dopo() { document.getElementById('f-cerca').addEventListener('submit', (e) => { e.preventDefault(); vaiRicerca(new FormData(e.target).get('q')) }) } }
}
function vaiRicerca(q, diretta = true) {
  q = String(q ?? '').trim()
  if (diretta && q && esisteVoce(normalizza(q))) location.hash = percorso(normalizza(q)) // come le altre wiki: un titolo esatto apre la voce
  else location.hash = '#/Speciale:Cerca?q=' + encodeURIComponent(q)
}

// ---------------------------------------------------------------------------------------------------- le viste delle voci
const urlSorgente = (titolo) => (FILE_DI[titolo] ? `${GITHUB}/blob/main/${CARTELLA_VOCI}${FILE_DI[titolo]}.js` : `${GITHUB}/tree/main/${CARTELLA_VOCI}`)
const urlFonte = (f) => `${GITHUB}/blob/main/${f.split('/').map(encodeURIComponent).join('/')}`
function vistaVoce(titolo, query) {
  const azione = query.get('action') || 'view', esiste = esisteVoce(titolo)
  if (azione === 'edit' || azione === 'submit') return vistaModifica(titolo, esiste, query)
  if (azione === 'history') return vistaCronologia(titolo, esiste)
  if (azione === 'info') return vistaInfo(titolo, esiste)
  if (titolo === PRINCIPALE && !dati(titolo)) return vistaPrincipale()
  if (titolo.startsWith('Categoria:')) return vistaCategoria(titolo, esiste)
  if (titolo.startsWith('File:')) return vistaFile(titolo)
  if (!esiste) return nonEsiste(titolo)
  const r = rinvioDi(titolo)
  if (r && query.get('redirect') !== 'no') {
    if (esisteVoce(r) && !rinvioDi(r)) return { ...vistaVoce(r, query), rinvioDa: titolo }
  }
  const w = wikitesto(testoDi(titolo), titolo)
  return { titolo, esiste, ...w, piede: dataDi(titolo), fonti: fontiDi(titolo) }
}
function vistaCategoria(titolo, esiste) {
  const membri = membriDi(titolo)
  if (!esiste && !membri.length) return nonEsiste(titolo)
  const w = dati(titolo) ? wikitesto(testoDi(titolo), titolo) : { html: '', sezioni: [], categorie: [], immagini: [] }
  const nome = esc(titolo.slice(10))
  return { titolo, esiste: true, ...w, piede: dati(titolo) ? dataDi(titolo) : null, corpo: `${w.html}<h2 id="Pagine_nella_categoria">Pagine nella categoria «${nome}»</h2>${membri.length ? `<p>Questa categoria contiene ${membri.length === 1 ? 'una pagina' : membri.length + ' pagine'}.</p><ul class="colonne">${membri.map((k) => `<li><a href="${percorso(k)}">${esc(k)}</a></li>`).join('')}</ul>` : '<p class="vuoto-lista">Questa categoria non contiene nessuna pagina.</p>'}`, sezioni: [...w.sezioni, { liv: 2, testo: `Pagine nella categoria «${titolo.slice(10)}»`, id: 'Pagine_nella_categoria' }] }
}
function vistaFile(titolo) {
  const nome = chiaveFile(titolo.slice(5)) ?? nomeFile(titolo.slice(5)), usi = IDX.file.get(nome) ?? []
  if (!usi.length && !dati(titolo)) return nonEsiste(titolo)
  const src = srcFile(nome), dove = /^https?:/.test(nome) ? `un’immagine di un altro sito di Alberto: <a class="esterno" href="${esc(src)}" rel="noopener">${esc(src)}</a>` : nome.startsWith('/') ? `un file di pzkko.it: <code>${esc(nome)}</code>` : `<code>pzkko/wiki/img/${esc(nome)}</code>, fatto da <code>tools/pzkko/wiki/foto.mjs</code> o copiato dalle foto di collaudo (<a href="${percorso('Pzkkopedia:Come si aggiorna')}">come si aggiorna</a>)`
  const w = dati(titolo) ? wikitesto(testoDi(titolo), titolo) : null
  return { titolo, esiste: true, vista: 'file', h1: esc(nome.length > 60 ? '…' + nome.slice(-57) : nome), piede: null, corpo: `<div class="file-grande"><a href="${esc(src)}"><img src="${esc(src)}" alt="${esc(nome)}"></a></div><p>${dove}.</p>${w ? w.html : ''}<h2 id="Pagine_che_usano_questo_file">Pagine che usano questo file</h2>${usi.length ? `<ul class="colonne">${usi.map((k) => `<li><a href="${percorso(k)}">${esc(k)}</a></li>`).join('')}</ul>` : '<p class="vuoto-lista">Nessuna.</p>'}`, sezioni: [{ liv: 2, testo: 'Pagine che usano questo file', id: 'Pagine_che_usano_questo_file' }] }
}
function nonEsiste(titolo) {
  const t = esc(titolo), p = percorso(titolo)
  return { titolo, esiste: false, corpo: `<div class="avviso avviso-info non-esiste"><p><b>Questa pagina non esiste.</b></p><p>Non esiste una pagina intitolata «<b>${t}</b>» in ${NOME}. Puoi:</p><ul><li><a href="${p}?action=edit">scriverla nel repository</a> (le voci stanno in <code>${CARTELLA_VOCI}</code>);</li><li><a href="#/Speciale:Cerca?q=${encodeURIComponent(titolo)}">cercare «${t}»</a> nel testo delle altre pagine;</li><li>vedere quali pagine <a href="#/Speciale:PuntanoQui/${encodeURIComponent(titolo.replace(/ /g, '_'))}">puntano qui</a>.</li></ul></div>` }
}
function vistaCronologia(titolo, esiste) {
  const fonti = fontiDi(titolo)
  return { titolo, vista: 'cronologia', esiste, h1: `${esc(titolo)}: cronologia delle modifiche`, corpo: esiste ? `<p>La cronologia di una voce di ${NOME} sono i <b>commit veri</b> del repository che hanno toccato i file di cui parla${fonti.length ? ` (${fonti.map((f) => `<a class="esterno" href="${urlFonte(f)}" rel="noopener"><code>${esc(f)}</code></a>`).join(', ')})` : ''}, dal più recente. Il testo della voce sta in <a class="esterno" href="${urlSorgente(titolo)}" rel="noopener"><code>${esc(CARTELLA_VOCI + (FILE_DI[titolo] ?? '…') + '.js')}</code></a>; la voce dice di valere dal <b>${esc(dataIt(dataDi(titolo)))}</b>.</p><div id="cr-lista"><p class="vuoto-lista">Carico la cronologia…</p></div>` : '<div class="avviso avviso-info">Questa pagina non esiste, quindi non ha una cronologia.</div>', async dopo() {
    if (!esiste) return
    const cr = await cronologia(), hs = new Set(cr?.PER_VOCE[titolo] ?? [])
    document.getElementById('cr-lista').innerHTML = cr ? (hs.size ? await listaCommit((c) => hs.has(c[0]), { conVoci: false, max: 500 }) : '<p class="vuoto-lista">Nessun commit ha ancora toccato i file di questa voce (o la voce non dichiara le sue fonti).</p>') : '<p class="vuoto-lista">La cronologia non è disponibile.</p>'
  } }
}
function vistaInfo(titolo, esiste) {
  const testo = testoDi(titolo), fonti = fontiDi(titolo), w = esiste && !spazioDi(titolo).startsWith('Speciale') ? wikitesto(testo, titolo) : null
  const riga = (k, v) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`
  return { titolo, vista: 'info', esiste, h1: `Informazioni su «${esc(titolo)}»`, corpo: `<table class="wikitable tabella-stat"><caption>Informazioni di base</caption><tbody>${riga('Titolo', esc(titolo))}${riga('La pagina esiste', esiste ? 'sì' : 'no')}${riga('Lunghezza (in caratteri)', n_(testo.length))}${riga('Lunghezza (in parole)', n_(testoSemplice(testo).split(/\s+/).filter(Boolean).length))}${riga('Categorie', catDi(titolo).length)}${riga('Immagini', w ? w.immagini.length : 0)}${riga('Link verso altre pagine', (IDX.link.get(titolo)?.size ?? 0))}${riga('Pagine che puntano qui', `<a href="#/Speciale:PuntanoQui/${encodeURIComponent(titolo.replace(/ /g, '_'))}">${(IDX.punta.get(titolo) ?? []).length}</a>`)}${riga('Ultima modifica dichiarata', esiste ? esc(dataIt(dataDi(titolo))) : '—')}${riga('Il file della voce', FILE_DI[titolo] ? `<a class="esterno" href="${urlSorgente(titolo)}" rel="noopener"><code>${esc(CARTELLA_VOCI + FILE_DI[titolo] + '.js')}</code></a>` : '—')}${riga('Le fonti nel repository', fonti.length ? `<ul>${fonti.map((f) => `<li><a class="esterno" href="${urlFonte(f)}" rel="noopener"><code>${esc(f)}</code></a></li>`).join('')}</ul>` : '—')}${riga('Commit che le hanno toccate', '<span id="info-commit">…</span>')}</tbody></table>`, async dopo() { const cr = await cronologia(); document.getElementById('info-commit').textContent = cr ? n_((cr.PER_VOCE[titolo] ?? []).length) : '—' } }
}
// la pagina principale (2.11, Alberto: «in home metti tutto ufficiale»): come quella di Wikipedia in italiano, la testata col
// logo e i numeri, due colonne bilanciate (la vetrina e gli eventi a sinistra; il «lo sapevi che», pescato a caso, e le
// ricorrenze con la data di oggi a destra), gli ultimi commit del repository, i portali e i progetti fratelli come
// mattonelle con la foto, le categorie come etichette. I testi stanno nelle sottopagine «Pagina principale/…» di
// voci/principale.js; le foto dei portali e dei fratelli qui sotto.
const PORTALI = [
  ['Il muro', 'home-giorno.webp', 'la home, i volantini, la sera, le pagine'],
  ['La scena 3D', 'scena-cima.webp', 'il posto, le luci, il meteo, le bestie, il suono'],
  ['I giochi', 'roulette.webp', 'roulette, blackjack, mine, dado, moneta, virtual'],
  ['I soldi', 'wallet.webp', 'i $pzk, il wallet, la borsa, la banca'],
  ['Il cercapersone', 'zero-aperto.webp', 'lo zero, pzk os, le app, la chat col bot'],
  ['Gli strumenti', 'lezioni.webp', 'quelli di pzkko e di albertopecchini.it'],
  ['Il repository', 'github.webp', 'AP, i rami, i workflow, il server in casa'],
  ['La memoria di Claude', 'memoria.webp', 'le memorie, CLAUDE.md, le skill'],
]
const FRATELLI = [
  ['albertopecchini.it', 'sito-ap.webp', 'il portfolio, statico e senza framework'],
  ['Better Call Pekko', 'sito-bcp.webp', 'l’assistenza informatica, anno 2008'],
  ['rivaltasulmincio.it', 'sito-rivalta.webp', 'la Pro Loco di Rivalta sul Mincio'],
  ['cascinafontana.xyz', 'sito-cascina.webp', 'la società agricola di famiglia'],
  ['Ing. Dario Donelli', 'sito-donelli.webp', 'il sito dell’ingegnere, in attesa del dominio'],
  ['Il repository AP', 'github.webp', 'su GitHub: i tre siti e questa wiki'],
]
const CATEGORIE_IN_HOME = ['Il muro', 'La scena 3D', 'Il suono', 'I giochi', 'I soldi', 'Il cercapersone', 'Le app di pzk os', 'La chat', 'Gli oggetti', 'I pesci', 'Le bestie', 'I reperti', 'I mestieri', 'Le side quest', 'Le squadre di virtual', 'La miniera', 'I traguardi', 'Gli strumenti', 'Il repository', 'Il server', 'Vercel', 'I siti di Alberto', 'La memoria di Claude', 'Le persone', 'I luoghi', 'Le versioni', 'Le immagini', 'Pzkkopedia']
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

/** Il ritratto di una voce: la sua immagine (quella dell'infobox, o la prima [[File:]]) e i primi paragrafi in wikitesto,
 *  senza template, immagini, titoli ed elenchi. Serve alla vetrina della pagina principale e alle mattonelle di «Vedi anche». */
function ritrattoDi(titolo) {
  let t = testoDi(rinvioDi(titolo) ?? titolo).replace(/<nowiki>[\s\S]*?<\/nowiki>/gi, '') // (gli esempi di Aiuto:Wikitesto non sono foto)
  const img = (/\|\s*immagine\s*=\s*([^\n|}]+)/i.exec(t)?.[1] ?? /\[\[\s*File\s*:\s*([^\]|]+)/i.exec(t)?.[1] ?? '').trim()
  for (let i = t.indexOf('{{'); i >= 0; i = t.indexOf('{{')) { const f = fineGraffe(t, i); if (f < 0) break; t = t.slice(0, i) + t.slice(f) }
  for (let i = t.search(/\[\[\s*File\s*:/i); i >= 0; i = t.search(/\[\[\s*File\s*:/i)) { const f = fineQuadre(t, i); if (f < 0) break; t = t.slice(0, i) + t.slice(f) }
  t = t.replace(RE_CAT, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  const paragrafi = t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 40 && !/^(=|\*|#|;|:|\{\||\||!)/.test(p))
  return { img, paragrafi, frase: paragrafi[0] ? testoSemplice(paragrafi[0]).replace(/\s+/g, ' ').trim() : '' }
}

// (1) la vetrina che ruota: una voce al giorno fra queste, nell'ordine (il giorno dell'anno decide quale)
const VETRINA = ['Il cercapersone zero', 'La scena 3D', 'Il caricamento è il pomodoro', 'La petizione', 'La lumachina', 'I lotti numerati', 'La banca sul server', 'Il lettore DWG', 'La roulette', 'La moneta', 'Virtual', 'La saracinesca di Bologna', 'La regia', 'Il suono della strada', 'Le regole per le app', 'La memoria di Claude']
function vetrinaDiOggi() {
  const lista = VETRINA.filter((t) => Object.hasOwn(VOCI, t))
  if (!lista.length) return null
  const oggi = new Date(), giorno = Math.floor((Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()) - Date.UTC(oggi.getFullYear(), 0, 0)) / 864e5)
  const titolo = lista[giorno % lista.length], r = ritrattoDi(titolo)
  let wt = '', parole = 0
  for (const p of r.paragrafi) { if (parole > 120) break; wt += p + '\n\n'; parole += testoSemplice(p).split(/\s+/).length }
  const foto = r.img ? `[[File:${r.img}|thumb|left|210px|${titolo}]]\n` : ''
  const altre = lista.filter((x) => x !== titolo)
  return { titolo, html: wikitesto(`${foto}${wt}'''[[${titolo}|Continua a leggere…]]'''`, PRINCIPALE).html + `<p class="mp-altre"><small>Le altre voci in vetrina, una al giorno: ${altre.map((x) => collega(x, undefined, { qui: PRINCIPALE, note: [], immagini: [] })).join(' · ')}</small></p>` }
}

function vistaPrincipale() {
  const voci = nomiVoci().filter((k) => !rinvioDi(k)), n = voci.length
  const sotto = (chiave) => (dati(`${PRINCIPALE}/${chiave}`) ? testoDi(`${PRINCIPALE}/${chiave}`) : '')
  const resa = (chiave) => (sotto(chiave) ? wikitesto(sotto(chiave), PRINCIPALE).html : '<p class="segnaposto">nessun contenuto ancora</p>')
  const riquadro = (chiave, titolo, cl, html, piede = '') => `<section class="mp-riquadro ${cl}" aria-labelledby="mp-${cl}"><h2 id="mp-${cl}">${titolo}</h2><div class="mp-corpo wikitesto">${html ?? resa(chiave)}</div>${piede ? `<div class="mp-piede">${piede}</div>` : ''}</section>`
  // «lo sapevi che»: sette righe a caso fra quelle della sottopagina, diverse a ogni visita
  const righeSapevi = sotto('Lo sapevi che').split('\n').filter((r) => r.startsWith('* '))
  const sapevi = righeSapevi.length > 7 ? righeSapevi.slice().sort(() => Math.random() - 0.5).slice(0, 7).join('\n') : righeSapevi.join('\n')
  const oggi = new Date(), dataOggi = `${GIORNI[oggi.getDay()]} ${oggi.getDate()} ${MESI[oggi.getMonth()]} ${oggi.getFullYear()}`
  const mattonella = (titolo, img, descr, href, extra = '') => `<a class="mp-tile" href="${esc(href)}"><span class="mp-tile-img"><img src="${esc(srcFile(img))}" alt="" decoding="async"></span><span class="mp-tile-testo"><b>${esc(titolo)}</b><small>${esc(descr)}</small>${extra}</span></a>`
  return { titolo: PRINCIPALE, principale: true, esiste: true, piede: null, corpo: `<div class="mp">
<section class="mp-benvenuti" aria-labelledby="mp-b">
  <a class="mp-banda" href="/" title="Torna al muro di pzkko.it"><span class="solo-lettori">il muro di pzkko.it</span></a>
  <div class="mp-logo">${LOGO}</div>
  <div class="mp-benv-testa">
    <h2 id="mp-b">Benvenuti in <span class="mp-nome">${NOME}</span></h2>
    <p class="mp-sotto">${SLOGAN}: una voce per ogni cosa di pzkko.it, tutte collegate, con la cronologia vera del repository.</p>
    <ul class="mp-numeri"><li><b>${n_(n)}</b> voci</li><li><b>${n_(IDX.cat.size)}</b> categorie</li><li><b>${n_(IDX.file.size)}</b> immagini</li><li><b id="mp-ncommit">…</b> commit</li><li>allineata al commit <b id="mp-commit">…</b></li></ul>
    <div class="wikitesto mp-intro">${resa('Benvenuti')}</div>
    <p class="mp-porte"><a href="${percorso('Aiuto:Aiuto')}">Aiuto</a> · <a href="${percorso('Pzkkopedia:Portale comunità')}">Portale della comunità</a> · <a href="#/Speciale:UltimeModifiche">Ultime modifiche</a> · <a href="#/Speciale:PaginaCasuale">Una voce a caso</a> · <a href="#/Speciale:Categorie">Categorie</a> · <a href="#/Speciale:TutteLePagine">Tutte le pagine</a> · <a href="#/Speciale:Immagini">Immagini</a> · <a href="${percorso('Pzkkopedia:Come si aggiorna')}">Come si aggiorna</a></p>
  </div>
</section>
<div class="mp-griglia">
  <div class="mp-col">
    ${riquadro('Voce in vetrina', `Una voce in vetrina <small>di ${esc(GIORNI[oggi.getDay()])}</small>`, 'vetrina', vetrinaDiOggi()?.html ?? null, `<a href="#/Speciale:PaginaCasuale">Un’altra voce a caso</a> · <a href="#/Speciale:NuovePagine">Le voci più nuove</a>`)}
    ${riquadro('Eventi correnti', 'Eventi correnti', 'eventi', null, `<a href="#/Speciale:NuovePagine">Le voci più nuove</a> · <a href="${percorso('Le versioni di pzkko')}">Le versioni</a>`)}
    ${riquadro('', 'Dal repository', 'commits', '<ul class="commits mp-commits" id="mp-lista-commit"><li class="vuoto-lista">Carico gli ultimi commit…</li></ul>', `<a href="#/Speciale:UltimeModifiche">Tutte le modifiche</a> · <a href="${percorso('Elenco dei commit')}">Per mese</a> · <a class="esterno" href="${GITHUB}/commits/main" rel="noopener">Su GitHub</a>`)}
  </div>
  <div class="mp-col">
    ${riquadro('Lo sapevi che', 'Lo sapevi che…', 'sapevi', wikitesto(sapevi, PRINCIPALE).html, `<a href="${percorso(PRINCIPALE + '/Lo sapevi che')}">Tutte le curiosità</a> (${righeSapevi.length})`)}
    ${riquadro('Ricorrenze', `Ricorrenze <small>oggi è ${esc(dataOggi)}</small>`, 'ricorrenze', null, `<a href="${percorso('La storia del repository')}">La storia del repository</a> · <a href="${percorso('La storia del muro')}">La storia del muro</a>`)}
  </div>
</div>
<section class="mp-riquadro portali" aria-labelledby="mp-portali"><h2 id="mp-portali">Portali</h2><div class="mp-tiles">${PORTALI.map(([t, img, d]) => mattonella(t, img, d, percorso('Portale:' + t), `<em>${n_((IDX.cat.get('Categoria:' + t) ?? []).length)} voci</em>`)).join('')}</div></section>
<section class="mp-riquadro categorie-home" aria-labelledby="mp-cat"><h2 id="mp-cat">Le categorie</h2><div class="mp-corpo"><p class="mp-chips">${CATEGORIE_IN_HOME.filter((c) => IDX.cat.has('Categoria:' + c)).map((c) => `<a class="chip" href="${percorso('Categoria:' + c)}">${esc(c)} <b>${n_(IDX.cat.get('Categoria:' + c).length)}</b></a>`).join('')}</p></div></section>
<section class="mp-riquadro fratelli" aria-labelledby="mp-fratelli"><h2 id="mp-fratelli">Progetti fratelli</h2><div class="mp-tiles mp-tiles-6">${FRATELLI.map(([t, img, d]) => mattonella(t, img, d, percorso(t))).join('')}</div></section>
<p class="mp-lingue">${ICONE.mondo} <span>${wikitesto("''Nelle altre lingue:'' pzkkopedia esiste solo in italiano, in minuscolo come [[pzkko.it]]. In inglese, dal 2008, c’è [[Better Call Pekko]]; la versione seria è [[albertopecchini.it]]. [[Pagina principale/Nelle altre lingue|Di più]]", PRINCIPALE).html.replace(/^<p>|<\/p>$/g, '')}</span></p>
</div>`, async dopo() {
    const cr = await cronologia()
    if (!cr) { document.getElementById("mp-lista-commit").innerHTML = '<li class="vuoto-lista">La cronologia non è disponibile.</li>'; return }
    document.getElementById('mp-ncommit').textContent = n_(cr.COMMIT.length)
    document.getElementById('mp-commit').innerHTML = `<a class="esterno" href="${commitUrl(cr.ALLINEATA.commit)}" rel="noopener">${esc(cr.ALLINEATA.commit)}</a> del ${esc(dataIt(cr.ALLINEATA.data))}`
    document.getElementById("mp-lista-commit").innerHTML = cr.COMMIT.slice(0, 6).map((c) => rigaCommit(c, null)).join('')
  } }
}

// ---------------------------------------------------------------------------------------------------- l'editor
const BARRA = [
  ['B', 'Grassetto (Ctrl+B)', 'b', "'''", "'''", 'testo in grassetto'],
  ['I', 'Corsivo (Ctrl+I)', 'i', "''", "''", 'testo in corsivo'],
  ['Link', 'Link a una voce (Ctrl+K)', 'k', '[[', ']]', 'titolo della voce'],
  ['Titolo', 'Titolo di sezione', '', '== ', ' ==', 'titolo', 'riga'],
  ['Elenco', 'Elenco puntato', '', '* ', '', '', 'riga'],
  ['1. Elenco', 'Elenco numerato', '', '# ', '', '', 'riga'],
  ['Immagine', 'Un’immagine di wiki/img/', '', '[[File:', '|thumb|didascalia]]', 'nome.webp'],
]
function inserisci(ta, testo, a, b) {
  ta.focus(); ta.setSelectionRange(a, b)
  if (!document.execCommand('insertText', false, testo)) ta.setRangeText(testo, a, b, 'end')
}
function formatta(ta, [, , , prima, dopo, esempio, modo]) {
  let a = ta.selectionStart, b = ta.selectionEnd
  if (modo === 'riga') { // lavora sulle righe intere
    a = ta.value.lastIndexOf('\n', a - 1) + 1
    b = ta.value.indexOf('\n', b) < 0 ? ta.value.length : ta.value.indexOf('\n', b)
    const righe = ta.value.slice(a, b).split('\n').map((r) => (prima === '== ' ? `${prima}${r.trim() || esempio}${dopo}` : prima + r))
    inserisci(ta, righe.join('\n'), a, b)
    return
  }
  const sel = ta.value.slice(a, b) || esempio
  inserisci(ta, prima + sel + dopo, a, b)
  ta.setSelectionRange(a + prima.length, a + prima.length + sel.length)
}
function vistaModifica(titolo, esiste, query) {
  const nuova = !dati(titolo)
  const barra = BARRA.map((b, i) => `<button type="button" class="mod-tasto" data-i="${i}" title="${b[1]}" aria-label="${b[1]}">${b[0] === 'B' ? '<b>B</b>' : b[0] === 'I' ? '<i>I</i>' : b[0]}</button>`).join('')
  return { titolo, vista: 'modifica', esiste, nuova, h1: `${nuova ? 'Creazione' : 'Modifica'} di ${esc(titolo)}`, corpo: `
<div class="avviso avviso-avvertenza"><b>Le voci di ${NOME} si scrivono nel repository, non qui.</b> ${nuova ? `Una pagina nuova si aggiunge a uno dei moduli di <a class="esterno" href="${GITHUB}/tree/main/${CARTELLA_VOCI}" rel="noopener"><code>${esc(CARTELLA_VOCI)}</code></a>` : `Questa voce sta in <a class="esterno" href="${urlSorgente(titolo)}" rel="noopener"><code>${esc(CARTELLA_VOCI + FILE_DI[titolo] + '.js')}</code></a>`} (il formato è in <a class="esterno" href="${GITHUB}/blob/main/albertopecchini.it/tools/pzkko/wiki/README.md" rel="noopener">tools/pzkko/wiki/README.md</a>), poi <code>node tools/pzkko/wiki/aggiorna.mjs</code> e un push. Qui puoi provare l’editor e l’anteprima: «Salva pagina» non salva niente.</div>
${nuova && !spazioDi(titolo).startsWith('Speciale') ? `<div class="avviso avviso-info">${query.get('redlink') ? 'Hai seguito un link a una pagina che non esiste ancora. ' : ''}Stai scrivendo una pagina nuova: scrivi qui sotto, poi guarda l’anteprima.</div>` : ''}
<div id="avvisi" aria-live="polite"></div>
<section id="anteprima" class="anteprima" hidden aria-labelledby="ant-t"><h2 id="ant-t">Anteprima</h2><div class="avviso avviso-avvertenza"><b>Questa è solo un’anteprima.</b> Le modifiche non sono state salvate!</div><div class="ant-corpo"><div class="wikitesto" id="ant-testo"></div><div class="categorie" id="ant-cat"></div></div></section>
<form class="modifica" id="f-mod">
<div class="mod-barra" role="toolbar" aria-label="Strumenti di formattazione">${barra}<span class="mod-spazio"></span><a class="mod-aiuto" href="${percorso('Aiuto:Wikitesto')}">Aiuto</a></div>
<textarea id="testo-mod" name="testo" rows="22" lang="it" spellcheck="true" aria-label="Testo della pagina (wikitesto)">${esc(testoDi(titolo))}</textarea>
<p class="mod-campo"><label for="oggetto">Oggetto:</label> <input id="oggetto" name="oggetto" type="text" maxlength="200" placeholder="Una riga su cosa hai cambiato (nel commit)"></p>
<p class="mod-nota">Cliccando su «Salva pagina» accetti di rilasciare il tuo contributo alle condizioni indicate in <a href="${percorso('Pzkkopedia:Informazioni')}">Informazioni su ${NOME}</a>.</p>
<p class="mod-bottoni"><button type="submit" class="bottone bottone-blu">Salva pagina</button> <button type="button" class="bottone" id="bt-anteprima">Visualizza anteprima</button> <a class="annulla" href="${percorso(titolo)}">Annulla</a></p>
</form>`,
  dopo() {
    const ta = document.getElementById('testo-mod')
    document.querySelector('.mod-barra').addEventListener('click', (e) => { const b = e.target.closest('.mod-tasto'); if (b) formatta(ta, BARRA[b.dataset.i]) })
    ta.addEventListener('keydown', (e) => {
      const b = (e.ctrlKey || e.metaKey) && BARRA.find((x) => x[2] && x[2] === e.key.toLowerCase())
      if (b) { e.preventDefault(); formatta(ta, b) }
    })
    const anteprima = () => {
      const w = wikitesto(ta.value, titolo), box = document.getElementById('anteprima')
      document.getElementById('ant-testo').innerHTML = w.html || '<p class="segnaposto">il testo è vuoto</p>'
      document.getElementById('ant-cat').innerHTML = catlinks(w.categorie)
      box.hidden = false
      aggiornaToc(w.sezioni, titolo)
      box.scrollIntoView({ block: 'start' })
    }
    document.getElementById('bt-anteprima').addEventListener('click', anteprima)
    document.getElementById('f-mod').addEventListener('submit', (e) => {
      e.preventDefault()
      document.getElementById('avvisi').innerHTML = `<div class="avviso avviso-errore" role="alert"><b>${NOME} non si salva dal browser.</b> Copia il testo nel file <code>${esc(CARTELLA_VOCI + (FILE_DI[titolo] ?? '<modulo>') + '.js')}</code> del repository: il testo qui sotto è rimasto com’era.</div>`
      document.getElementById('avvisi').scrollIntoView({ block: 'nearest' })
    })
  } }
}

// ---------------------------------------------------------------------------------------------------- la cornice
const catlinks = (c) => (c.length ? `<div class="catlinks"><b>${c.length === 1 ? 'Categoria' : 'Categorie'}</b>: <ul>${c.map((x) => `<li><a${esisteVoce(x) ? '' : ' class="new"'} href="${percorso(x)}">${esc(x.slice(10))}</a></li>`).join('')}</ul></div>` : '')
const PIEDE = [['Informativa sulla privacy', percorso('Pzkkopedia:Informativa sulla privacy')], ['Informazioni su ' + NOME, percorso('Pzkkopedia:Informazioni')], ['Avvertenze', percorso('Pzkkopedia:Avvertenze')], ['Codice di condotta', percorso('Pzkkopedia:Codice di condotta')], ['Come si aggiorna', percorso('Pzkkopedia:Come si aggiorna')], ['Sviluppatori', '/info/'], ['Statistiche', '#/Speciale:Statistiche'], ['Dichiarazione sui cookie', percorso('Pzkkopedia:Dichiarazione sui cookie')]]

function scheletro() {
  app.innerHTML = `<div class="fascia" aria-hidden="true"></div>
<a class="salta" href="#/" id="salta">Salta al contenuto</a>
<header class="intestazione">
  <div class="int-sx">
    <button type="button" class="hamburger" id="bt-menu" aria-label="Menu principale" aria-expanded="false" aria-controls="menu-principale">${ICONE.menu}</button>
    <a class="logo" href="${percorso(PRINCIPALE)}" title="Vai alla pagina principale">${LOGO}<span class="marchio"><span class="nome">${NOME}</span><span class="slogan">${SLOGAN}</span></span></a>
  </div>
  <form class="ricerca" role="search" id="f-ricerca" autocomplete="off">
    <div class="ricerca-box">${ICONE.lente}<input type="search" id="q" name="q" placeholder="Cerca in ${NOME}" aria-label="Cerca in ${NOME}" role="combobox" aria-expanded="false" aria-controls="suggerimenti" aria-autocomplete="list" accesskey="f">
    <button type="submit" class="bt-cerca">Cerca</button>
    <ul id="suggerimenti" role="listbox" aria-label="Suggerimenti" hidden></ul></div>
  </form>
  <nav class="int-dx" aria-label="Strumenti personali">
    <a href="#/Speciale:CreaUtenza" class="solo-largo">Crea un’utenza</a><a href="#/Speciale:Entra" class="solo-largo">Accedi</a>
    <div class="tendina"><button type="button" class="bt-tendina bt-icona" data-tendina="tp-pers" aria-expanded="false" aria-haspopup="true" aria-controls="tp-pers" aria-label="Strumenti personali" title="Strumenti personali">${ICONE.punti}</button>
    <ul id="tp-pers" class="pannello pannello-dx" hidden><li class="pannello-nota">Non hai fatto l’accesso</li><li><a href="#/Speciale:Entra">Discussioni</a></li><li><a href="#/Speciale:Entra">Contributi</a></li><li><a href="#/Speciale:CreaUtenza">Crea un’utenza</a></li><li><a href="#/Speciale:Entra">Accedi</a></li></ul></div>
  </nav>
</header>
<div class="pagina">
  <nav class="menu-principale" id="menu-principale" aria-label="Menu principale">
    <div class="mp-testa"><h2>Menu principale</h2><button type="button" class="mp-sposta" id="mp-sposta"></button></div>
    <h3>Navigazione</h3>
    <ul><li><a href="${percorso(PRINCIPALE)}">Pagina principale</a></li><li><a href="#/Speciale:UltimeModifiche">Ultime modifiche</a></li><li><a href="#/Speciale:PaginaCasuale">Una voce a caso</a></li><li><a href="${percorso('Aiuto:Aiuto')}">Aiuto</a></li><li><a href="${percorso('Pzkkopedia:Portale comunità')}">Portale della comunità</a></li></ul>
    <h3>Portali</h3>
    <ul>${['Il muro', 'La scena 3D', 'I giochi', 'I soldi', 'Il cercapersone', 'Gli strumenti', 'Il repository', 'La memoria di Claude'].map((p) => `<li><a href="${percorso('Portale:' + p)}">${esc(p)}</a></li>`).join('')}</ul>
    <h3>Strumenti</h3>
    <ul><li><a href="#/Speciale:PagineSpeciali">Pagine speciali</a></li><li><a href="#/Speciale:TutteLePagine">Tutte le pagine</a></li><li><a href="#/Speciale:Categorie">Categorie</a></li><li><a href="#/Speciale:Immagini">Elenco dei file</a></li><li><a href="#/Speciale:Registro">Registri</a></li><li><a href="#/Speciale:Statistiche">Statistiche</a></li><li><a class="esterno" href="${GITHUB}" rel="noopener">Il repository su GitHub</a></li></ul>
  </nav>
  <nav class="toc-lato" id="toc-lato" aria-label="Contenuti" hidden></nav>
  <div class="centro">
    <div class="linguette" id="linguette"></div>
    <main class="corpo" id="contenuto" tabindex="-1">
      <div class="titolo"><h1 id="h1" tabindex="-1"></h1><span class="btn-lingue" aria-disabled="true" title="Solo in italiano, minuscolo">${ICONE.mondo} Aggiungi lingue</span></div>
      <div class="sottotitolo" id="sottotitolo">Da ${NOME}, ${SLOGAN}.</div>
      <div id="toc-pagina"></div>
      <div class="wikitesto" id="testo"></div>
      <div class="categorie" id="categorie"></div>
    </main>
    <footer class="piede-wiki">
      <p id="ultima"></p>
      <ul>${PIEDE.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}<li><a href="#/" id="bt-mobile"></a></li><li><button type="button" class="bt-tema" id="bt-tema" aria-label="Aspetto: tema chiaro, scuro o come il sistema"></button></li></ul>
      <p class="piede-firma">Un pezzo di <a href="/">pzkko</a> · fatto da <a href="https://www.albertopecchini.it">Alberto Pecchini</a></p>
    </footer>
  </div>
</div>`
}

function linguette(p) {
  const base = percorso(p.titolo)
  const li = (h, t, o = {}) => `<li><a href="${h}" class="${o.nuovo ? 'new' : ''}"${o.sel ? ' aria-current="page"' : ''}${o.esterno ? ' rel="noopener"' : ''}>${t}</a></li>`
  let sx, dx = ''
  if (p.speciale) sx = li(base, 'Pagina speciale', { sel: true })
  else {
    const c = coppia(p.titolo), v = p.vista || 'leggi'
    sx = li(percorso(c.sog), ETICHETTA[c.sp] ?? 'Voce', { sel: !c.talk, nuovo: !esisteVoce(c.sog) }) + li(percorso(c.disc), 'Discussione', { sel: c.talk, nuovo: !esisteVoce(c.disc) })
    const esiste = esisteVoce(p.titolo)
    dx = li(base, 'Leggi', { sel: v === 'leggi' || v === 'info' || v === 'file' }) + li(`${base}?action=edit`, esiste ? 'Modifica' : 'Crea', { sel: v === 'modifica' }) + li(`${base}?action=history`, 'Cronologia', { sel: v === 'cronologia' })
  }
  const s = encodeURIComponent(p.titolo.replace(/ /g, '_'))
  const strumenti = `<li class="tendina"><button type="button" class="bt-tendina bt-strumenti" data-tendina="tp-strumenti" aria-expanded="false" aria-haspopup="true" aria-controls="tp-strumenti">Strumenti ${ICONE.freccia}</button>
<ul id="tp-strumenti" class="pannello pannello-dx" hidden><li><a href="#/Speciale:PuntanoQui/${s}">Puntano qui</a></li><li><a href="#/Speciale:ModificheCollegate/${s}">Modifiche correlate</a></li><li><a href="#/Speciale:PagineSpeciali">Pagine speciali</a></li><li><a href="${base}">Link permanente</a></li><li><a href="${base}?action=info">Informazioni sulla pagina</a></li>${FILE_DI[p.titolo] ? `<li><a class="esterno" href="${urlSorgente(p.titolo)}" rel="noopener">Il testo su GitHub</a></li>` : ''}${p.rinvioDa || rinvioDi(p.titolo) ? `<li><a href="${base}?redirect=no">La pagina del rinvio</a></li>` : ''}</ul></li>`
  return `<ul class="lin lin-sx" aria-label="Spazi">${sx}</ul><ul class="lin lin-dx" aria-label="Visualizzazioni">${dx}${strumenti}</ul>`
}

// (7) il colore di ogni categoria: [pennarello, carta] fra quelli di wiki.css (--p-*, --c-*), come i riquadri della home
const TINTE = {
  'Il muro': ['giallo', 'giallo'], 'Le versioni': ['giallo', 'giallo'], 'Pzkkopedia': ['giallo', 'giallo'], 'Le immagini': ['giallo', 'giallo'],
  'La scena 3D': ['teal', 'teal'], 'Il suono': ['teal', 'teal'],
  'I giochi': ['rosso', 'rosso'], 'Le squadre di virtual': ['rosso', 'rosso'],
  'I soldi': ['verde', 'verde'], 'La chat': ['verde', 'verde'], 'I mestieri': ['verde', 'verde'], 'Le side quest': ['verde', 'verde'], 'I traguardi': ['verde', 'verde'],
  'Il cercapersone': ['arancio', 'arancio'], 'Le app di pzk os': ['arancio', 'arancio'], 'La miniera': ['arancio', 'arancio'],
  'Gli oggetti': ['ruggine', 'kraft'], 'I pesci': ['ruggine', 'kraft'], 'Le bestie': ['ruggine', 'kraft'], 'I reperti': ['ruggine', 'kraft'],
  'Gli strumenti': ['blu', 'blu'], 'Il repository': ['blu', 'blu'], 'Il server': ['blu', 'blu'], 'Vercel': ['blu', 'blu'], 'I siti di Alberto': ['blu', 'blu'],
  'La memoria di Claude': ['ruggine', 'kraft'], 'Le persone': ['ruggine', 'kraft'], 'I luoghi': ['ruggine', 'kraft'],
}
function monta(p) {
  const el = (id) => document.getElementById(id)
  chiudiTutto()
  document.title = `${(p.h1 ? p.h1.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&') : p.titolo)} - ${NOME}`
  el('linguette').innerHTML = linguette(p)
  const h1 = el('h1')
  h1.innerHTML = p.h1 ?? esc(p.titolo)
  h1.classList.toggle('solo-lettori', !!p.principale)
  el('contenuto').classList.toggle('e-principale', !!p.principale)
  el('contenuto').classList.toggle('e-speciale', !!p.speciale)
  document.querySelector('.btn-lingue').hidden = !!(p.speciale || p.principale || p.vista === 'modifica')
  el('sottotitolo').innerHTML = `Da ${NOME}, ${SLOGAN}.${p.rinvioDa ? ` <span class="rinvio-da">(Reindirizzamento da <a href="${percorso(p.rinvioDa)}?redirect=no">${esc(p.rinvioDa)}</a>)</span>` : ''}`
  el('testo').innerHTML = p.corpo ?? p.html ?? ''
  el('testo').classList.toggle('wikitesto', !p.principale)
  el('categorie').innerHTML = catlinks(p.categorie ?? [])
  // (7) il colore della voce: quello della sua prima categoria che ne ha uno (lo usano l'infobox e «Vedi anche»)
  const c = (p.categorie ?? []).map((x) => TINTE[x.slice(10)]).find(Boolean) ?? ['ruggine', 'grigia']
  el('contenuto').style.setProperty('--filo-voce', `var(--p-${c[0]})`)
  el('contenuto').style.setProperty('--tinta-voce', `var(--c-${c[1]})`)
  el('ultima').innerHTML = p.piede ? `Questa pagina è stata modificata l’ultima volta il ${esc(dataIt(p.piede))}.${p.fonti?.length ? ` <span class="piede-fonti">Fonti nel repository: ${p.fonti.map((f) => `<a class="esterno" href="${urlFonte(f)}" rel="noopener"><code>${esc(f.replace(/^albertopecchini\.it\//, ''))}</code></a>`).join(', ')}.</span>` : ''}` : ''
  el('ultima').hidden = !p.piede
  aggiornaToc(p.sezioni ?? [], p.titolo)
  p.dopo?.()
}

// ---------------------------------------------------------------------------------------------------- il router
function indirizzo() {
  let h = location.hash.replace(/^#\/?/, ''), sez = ''
  const k = h.indexOf('#')
  if (k >= 0) { sez = dec(h.slice(k + 1)); h = h.slice(0, k) }
  const q = h.indexOf('?')
  const query = new URLSearchParams(q >= 0 ? h.slice(q + 1) : '')
  if (q >= 0) h = h.slice(0, q)
  return { titolo: normalizza(dec(h)) || PRINCIPALE, query, sez }
}
let ultima = null
function vai(primo) {
  const ind = indirizzo(), chiave = `${ind.titolo}?${ind.query}`
  if (chiave === ultima) { if (ind.sez) scorri(ind.sez); return } // è cambiata solo la sezione
  ultima = chiave
  let p
  try { p = ind.titolo.startsWith('Speciale:') ? vistaSpeciale(ind.titolo, ind.query) : vistaVoce(ind.titolo, ind.query) }
  catch (e) { console.error('[pzkkopedia]', e); p = { titolo: ind.titolo, esiste: false, corpo: `<div class="avviso avviso-errore"><b>Questa pagina non si lascia disegnare.</b> ${esc(e.message)}</div>` } }
  if (!p) return // (la voce a caso ha già cambiato indirizzo)
  monta(p)
  document.getElementById('q').value = p.titolo === 'Speciale:Cerca' ? ind.query.get('q') ?? '' : ''
  if (ind.sez) requestAnimationFrame(() => scorri(ind.sez))
  else { window.scrollTo(0, 0); if (!primo) document.getElementById('h1').focus({ preventScroll: true }) }
}

// ---------------------------------------------------------------------------------------------------- menu, tendine, ricerca
const html = document.documentElement
let fisso = true, forzato = false
try { fisso = localStorage.getItem('pzkkopedia-menu') !== 'nascosto'; forzato = localStorage.getItem('pzkkopedia-mobile') === '1' } catch {}
const largo = matchMedia('(max-width:1119px)')
function adatta() {
  const stretto = forzato || largo.matches
  html.classList.toggle('stretto', stretto)
  html.classList.toggle('menu-fisso', fisso && !stretto)
  document.getElementById('mp-sposta').textContent = fisso ? 'nascondi' : 'sposta nella barra laterale'
  document.getElementById('mp-sposta').hidden = stretto
  document.getElementById('bt-mobile').textContent = forzato ? 'Versione per computer' : 'Versione mobile'
  if (html.classList.contains('menu-fisso')) html.classList.remove('menu-aperto')
}
function chiudiTutto(tranne) {
  for (const b of document.querySelectorAll('[data-tendina][aria-expanded="true"]')) if (b !== tranne) { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.dataset.tendina).hidden = true }
  if (!tranne || tranne.id !== 'bt-menu') { html.classList.remove('menu-aperto'); document.getElementById('bt-menu')?.setAttribute('aria-expanded', 'false') }
  chiudiSuggerimenti()
}
function chiudiSuggerimenti() {
  const l = document.getElementById('suggerimenti'), q = document.getElementById('q')
  if (!l) return
  l.hidden = true; l.innerHTML = ''; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant')
}
function suggerisci() {
  const q = document.getElementById('q'), l = document.getElementById('suggerimenti'), v = q.value.trim()
  if (!v) return chiudiSuggerimenti()
  const vl = v.toLowerCase()
  const t = Object.keys(VOCI).filter((k) => !k.startsWith(PRINCIPALE + '/') && k.toLowerCase().includes(vl)).sort((a, b) => Number(b.toLowerCase().startsWith(vl)) - Number(a.toLowerCase().startsWith(vl)) || a.length - b.length).slice(0, 8)
  l.innerHTML = t.map((k, i) => `<li role="option" id="sg${i}"><a href="${percorso(k)}" tabindex="-1">${esc(k)}</a></li>`).join('') + `<li role="option" id="sgc" class="sg-cerca"><a href="#/Speciale:Cerca?q=${encodeURIComponent(v)}" tabindex="-1">Cerca pagine che contengono «${esc(v)}»</a></li>`
  l.hidden = false; q.setAttribute('aria-expanded', 'true')
}
function impostaCornice() {
  const q = document.getElementById('q'), lista = document.getElementById('suggerimenti')
  document.getElementById('f-ricerca').addEventListener('submit', (e) => {
    e.preventDefault()
    const sel = lista.querySelector('[aria-selected="true"] a')
    chiudiSuggerimenti()
    if (sel) location.hash = sel.getAttribute('href'); else vaiRicerca(q.value)
    q.blur()
  })
  q.addEventListener('input', suggerisci)
  q.addEventListener('keydown', (e) => {
    const o = [...lista.querySelectorAll('[role="option"]')]
    if (e.key === 'Escape') return chiudiSuggerimenti()
    if (!o.length || !['ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const i = o.findIndex((x) => x.getAttribute('aria-selected') === 'true'), n = e.key === 'ArrowDown' ? (i + 1) % o.length : (i - 1 + o.length) % o.length
    o.forEach((x, j) => x.setAttribute('aria-selected', String(j === n)))
    q.setAttribute('aria-activedescendant', o[n].id)
  })
  document.getElementById('salta').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('contenuto').focus(); document.getElementById('contenuto').scrollIntoView() })
  document.getElementById('bt-menu').addEventListener('click', (e) => {
    const b = e.currentTarget, aperto = !html.classList.contains('menu-aperto')
    chiudiTutto(b)
    html.classList.toggle('menu-aperto', aperto); b.setAttribute('aria-expanded', String(aperto))
  })
  document.getElementById('mp-sposta').addEventListener('click', () => { fisso = !fisso; try { localStorage.setItem('pzkkopedia-menu', fisso ? 'fisso' : 'nascosto') } catch {} adatta() })
  document.getElementById('bt-mobile').addEventListener('click', (e) => { e.preventDefault(); forzato = !forzato; try { localStorage.setItem('pzkkopedia-mobile', forzato ? '1' : '0') } catch {} adatta() })
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tendina]')
    if (b) { const aperto = b.getAttribute('aria-expanded') !== 'true'; chiudiTutto(b); b.setAttribute('aria-expanded', String(aperto)); document.getElementById(b.dataset.tendina).hidden = !aperto; return }
    if (e.target.closest('.toc-apri')) { const bt = e.target.closest('.toc-apri'), aperto = bt.getAttribute('aria-expanded') !== 'true'; bt.setAttribute('aria-expanded', String(aperto)); const ul = bt.closest('li').querySelector('ul'); if (ul) ul.hidden = !aperto; return }
    // un'immagine cliccata apre il visore (come il MediaViewer di Wikipedia), non la pagina del file
    const im = e.target.closest('.wikitesto a.thumb-img, .wikitesto a.immagine, .infobox a.immagine, .infobox a.thumb-img, .file-grande a, .galleria a')
    if (im && im.querySelector('img') && !e.ctrlKey && !e.metaKey && e.button === 0) { e.preventDefault(); apriVisore(im); return }
    if (!e.target.closest('.tendina, #menu-principale, #bt-menu, .ricerca')) chiudiTutto()
    const a = e.target.closest('a[data-sez]')
    if (a && a.getAttribute('href').startsWith(percorso(indirizzo().titolo))) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); scorri(a.dataset.sez); chiudiTutto() }
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.getElementById('mv')) chiudiTutto() })
  window.addEventListener('hashchange', chiudiVisore)
  largo.addEventListener('change', adatta)
  window.addEventListener('scroll', () => requestAnimationFrame(segui), { passive: true })
  window.addEventListener('hashchange', () => vai(false))
}

// (3) l'aspetto (2.11): automatico (come il sistema), chiaro o scuro, come «Aspetto» di Wikipedia; il tasto nel piè di pagina
// gira fra i tre e lo ricorda (localStorage pzkkopedia-tema). Lo script in testa a index.html lo applica prima del primo disegno
const TEMI = [['auto', 'automatico'], ['chiaro', 'chiaro'], ['scuro', 'scuro']]
function tema(scelta) {
  if (scelta) { try { localStorage.setItem('pzkkopedia-tema', scelta) } catch {} }
  let t = 'auto'
  try { t = localStorage.getItem('pzkkopedia-tema') || 'auto' } catch {}
  if (t === 'chiaro') document.documentElement.dataset.theme = 'light'
  else if (t === 'scuro') document.documentElement.dataset.theme = 'dark'
  else delete document.documentElement.dataset.theme
  const b = document.getElementById('bt-tema')
  if (b) b.textContent = `Aspetto: ${TEMI.find(([k]) => k === t)?.[1] ?? 'automatico'}`
  return t
}
function impostaTema() {
  tema()
  document.getElementById('bt-tema').addEventListener('click', () => { const t = tema(), i = TEMI.findIndex(([k]) => k === t); tema(TEMI[(i + 1) % TEMI.length][0]) })
}

indicizza()
scheletro()
adatta()
impostaCornice()
impostaTema()
vai(true)

// ---------------------------------------------------------------------------------------------------- il visore delle immagini
// (2.11, Alberto: «voglio che si apra il visualizzatore di Wikipedia per le immagini»): come il MediaViewer di Wikipedia,
// un'immagine cliccata si apre a tutto schermo su fondo scuro, con la didascalia, il contatore, le frecce per le altre
// immagini della stessa pagina (anche ← → dalla tastiera), Esc o il clic fuori per chiudere, e sotto i link alla pagina
// «File:» e all'originale. Non cambia l'indirizzo: cambiando pagina si chiude da sé.
const ICONA_X = svg('<path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')
const ICONA_SX = svg('<path d="M13 3 6 10l7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')
const ICONA_DX = svg('<path d="m7 3 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')
let visore = null // { lista: [{ src, alt, did, file }], i }
function immaginiDellaPagina() {
  const anc = [...document.querySelectorAll('.wikitesto a.thumb-img, .wikitesto a.immagine, .infobox a.immagine, .infobox a.thumb-img, .file-grande a, .galleria a')].filter((a) => a.querySelector('img'))
  return anc.map((a) => {
    const img = a.querySelector('img'), src = img.getAttribute('src')
    const did = a.closest('.thumb')?.querySelector('.thumbcaption')?.textContent ?? a.closest('.infobox-img')?.querySelector('.infobox-did')?.textContent ?? a.closest('.galleria li')?.querySelector('div')?.textContent ?? img.alt ?? ''
    const nome = src.startsWith('/wiki/img/') ? src.slice(10) : src
    return { a, src, alt: img.alt, did: did.trim(), file: percorso(titoloFile(nome)), originale: src }
  })
}
function apriVisore(a) {
  const lista = immaginiDellaPagina(), i = Math.max(0, lista.findIndex((x) => x.a === a))
  if (!lista.length) return
  visore = { lista, i }
  let mv = document.getElementById('mv')
  if (!mv) {
    mv = document.createElement('div')
    mv.id = 'mv'; mv.className = 'mv'; mv.setAttribute('role', 'dialog'); mv.setAttribute('aria-modal', 'true'); mv.setAttribute('aria-label', 'Visore delle immagini')
    mv.innerHTML = `<button type="button" class="mv-chiudi" aria-label="Chiudi (Esc)">${ICONA_X}</button>
<button type="button" class="mv-sx" aria-label="Immagine precedente (←)">${ICONA_SX}</button>
<div class="mv-quadro"><img class="mv-img" alt=""></div>
<button type="button" class="mv-dx" aria-label="Immagine successiva (→)">${ICONA_DX}</button>
<div class="mv-piede"><div class="mv-did"></div><div class="mv-info"><span class="mv-conto"></span> · <a class="mv-file" href="#">Pagina del file</a> · <a class="mv-orig" href="#" target="_blank" rel="noopener">Apri l’originale</a> · <span class="mv-misura"></span></div></div>`
    document.body.appendChild(mv)
    mv.addEventListener('click', (e) => {
      if (e.target.closest('.mv-chiudi') || e.target === mv || e.target.classList.contains('mv-quadro')) chiudiVisore()
      else if (e.target.closest('.mv-sx')) mostraVisore(-1)
      else if (e.target.closest('.mv-dx')) mostraVisore(1)
      else if (e.target.closest('.mv-file')) chiudiVisore()
    })
    mv.querySelector('.mv-img').addEventListener('load', (e) => { mv.querySelector('.mv-misura').textContent = `${e.target.naturalWidth} × ${e.target.naturalHeight}` })
  }
  document.documentElement.classList.add('con-visore')
  mv.hidden = false
  mostraVisore(0)
  mv.querySelector('.mv-chiudi').focus()
}
function mostraVisore(passo) {
  if (!visore) return
  const mv = document.getElementById('mv'), n = visore.lista.length
  visore.i = (visore.i + passo + n) % n
  const x = visore.lista[visore.i]
  const img = mv.querySelector('.mv-img')
  img.src = x.src; img.alt = x.alt
  mv.querySelector('.mv-misura').textContent = ''
  mv.querySelector('.mv-did').textContent = x.did || x.alt || ''
  mv.querySelector('.mv-conto').textContent = `${visore.i + 1} di ${n}`
  mv.querySelector('.mv-file').href = x.file
  mv.querySelector('.mv-orig').href = x.originale
  mv.querySelector('.mv-sx').hidden = mv.querySelector('.mv-dx').hidden = n < 2
}
function chiudiVisore() {
  const mv = document.getElementById('mv')
  if (!mv || mv.hidden) return
  mv.hidden = true
  document.documentElement.classList.remove('con-visore')
  const torna = visore?.lista[visore.i]?.a
  visore = null
  torna?.focus?.()
}
document.addEventListener('keydown', (e) => {
  if (!visore) return
  if (e.key === 'Escape') { e.preventDefault(); chiudiVisore() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); mostraVisore(-1) }
  else if (e.key === 'ArrowRight') { e.preventDefault(); mostraVisore(1) }
})
