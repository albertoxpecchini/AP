// pzkkopedia (26.10): la wiki di pzkko.it, per ora uno scheletro VUOTO. È una copia fedele, nella grafica e nella
// struttura, della skin Vector 2022 di Wikipedia in italiano (intestazione con menu, logo e ricerca; colonna a sinistra con
// il menu principale e i contenuti; linguette Voce/Discussione e Leggi/Modifica/Cronologia; piè di pagina), ma con un logo
// disegnato qui, un nome tutto suo e nessun testo preso da altri. Il tocco di pzkko sta in wiki.css.
// Il sito è statico: una pagina sola (index.html) e l’indirizzo della voce nell’hash: /wiki/#/Titolo_della_voce,
// /wiki/#/Speciale:Cerca?q=…, /wiki/#/Titolo?action=edit. Le voci stanno in voci.js (il formato è scritto lì). Il
// wikitesto lo interpreta wikitesto() qui sotto: grassetto, corsivo, titoli, link (rossi se la voce non esiste), elenchi,
// categorie, e l’indice con gli id dei titoli. Salvare ancora non si può: la wiki non è aperta alle modifiche.

import { VOCI } from './voci.js'

const NOME = 'pzkkopedia'
const SLOGAN = 'l’enciclopedia libera del muro'
const PRINCIPALE = 'Pagina principale'
const CREATA = '2026-10-26' // la nascita della wiki: la data delle pagine che non ne hanno una loro
const app = document.getElementById('app')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const maiuscola = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const dec = (s) => { try { return decodeURIComponent(s) } catch { return s } }
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const dataIt = (d) => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d))?/.exec(d || ''); return m ? `${+m[3]} ${MESI[m[2] - 1]} ${m[1]}${m[4] ? ` alle ${m[4]}:${m[5]}` : ''}` : '' }

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

function normalizza(t) {
  t = t.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  const i = t.indexOf(':')
  if (i > 0) {
    const pre = t.slice(0, i).trim().toLowerCase(), ns = NOMI.find((n) => n.toLowerCase() === pre)
    if (ns) return `${ns}:${maiuscola(t.slice(i + 1).trim())}`
  }
  return maiuscola(t)
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
const nomiVoci = () => Object.keys(VOCI).filter((k) => !spazioDi(k) && !k.startsWith(PRINCIPALE + '/'))
const catDi = (t) => [...testoDi(t).matchAll(/\[\[\s*Categoria\s*:\s*([^\]|\n]+?)\s*(?:\|[^\]\n]*)?\]\]/gi)].map((m) => normalizza('Categoria:' + m[1]))
const esisteVoce = (t) => Object.hasOwn(VOCI, t) || t === PRINCIPALE || (t.startsWith('Speciale:') && !!speciale(t))

// ---------------------------------------------------------------------------------------------------- il wikitesto
function testoSemplice(s) {
  return s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, '$1').replace(/'{2,5}/g, '').replace(/^[*#]+\s*/gm, '').replace(/^=+\s*|\s*=+$/gm, '').replace(/^-{4,}$/gm, '')
}

const RE_INLINE = /\[\[([^\[\]|]*?)(?:\|([^\[\]]*?))?\]\]|\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]*))?\]|'''''(.+?)'''''|'''(.+?)'''|''(.+?)''/g
function inline(s, qui) {
  let out = '', ultimo = 0
  for (const m of s.matchAll(RE_INLINE)) {
    out += esc(s.slice(ultimo, m.index))
    ultimo = m.index + m[0].length
    if (m[1] !== undefined) out += collega(m[1], m[2], qui)
    else if (m[3]) out += `<a class="esterno" href="${esc(m[3])}" rel="nofollow noopener">${m[4] ? inline(m[4], qui) : esc(m[3])}</a>`
    else if (m[5]) out += `<b><i>${inline(m[5], qui)}</i></b>`
    else if (m[6]) out += `<b>${inline(m[6], qui)}</b>`
    else out += `<i>${inline(m[7], qui)}</i>`
  }
  return out + esc(s.slice(ultimo))
}
function collega(bersaglio, etichetta, qui) {
  let t = bersaglio.trim(), sez = ''
  const k = t.indexOf('#')
  if (k >= 0) { sez = t.slice(k + 1).trim().replace(/ /g, '_'); t = t.slice(0, k).trim() }
  const testo = etichetta === undefined ? esc(bersaglio.trim().replace(/^:/, '')) : inline(etichetta, qui)
  if (!t) return `<a href="${percorso(qui)}#${encodeURIComponent(sez)}" data-sez="${esc(sez)}">${testo}</a>`
  t = normalizza(t.replace(/^:/, ''))
  const ok = esisteVoce(t)
  const qui_ = t === qui && sez ? ` data-sez="${esc(sez)}"` : ''
  return ok
    ? `<a href="${percorso(t)}${sez ? '#' + encodeURIComponent(sez) : ''}" title="${esc(t)}"${qui_}>${testo}</a>`
    : `<a class="new" href="${percorso(t)}?action=edit&amp;redlink=1" title="${esc(t)} (la pagina non esiste)">${testo}</a>`
}

/** Dal wikitesto all'HTML: { html, sezioni: [{ liv, testo, id }], categorie: ['Categoria:X'] }. */
function wikitesto(src, qui) {
  const categorie = []
  src = src.replace(/\r\n?/g, '\n').replace(/\[\[\s*Categoria\s*:\s*([^\]|\n]+?)\s*(?:\|[^\]\n]*)?\]\]/gi, (_, c) => {
    const n = normalizza('Categoria:' + c)
    if (!categorie.includes(n)) categorie.push(n)
    return ''
  })
  const sezioni = [], usati = new Set(), out = []
  let par = [], pila = []
  const chiudiPar = () => { if (par.length) out.push(`<p>${inline(par.join(' '), qui)}</p>`); par = [] }
  const chiudiListe = () => { while (pila.length) out.push(pila.pop() === '*' ? '</li></ul>' : '</li></ol>') }
  const lista = (pre) => {
    let i = 0
    while (i < pila.length && i < pre.length && pila[i] === pre[i]) i++
    while (pila.length > i) out.push(pila.pop() === '*' ? '</li></ul>' : '</li></ol>')
    if (pila.length === pre.length && i > 0) out.push('</li><li>')
    else while (pila.length < pre.length) { const c = pre[pila.length]; out.push(c === '*' ? '<ul><li>' : '<ol><li>'); pila.push(c) }
  }
  for (const riga of src.split('\n')) {
    let m
    if ((m = /^(={2,6})\s*(.+?)\s*\1\s*$/.exec(riga))) {
      chiudiPar(); chiudiListe()
      const liv = m[1].length, testo = testoSemplice(m[2]).trim(), base = testo.replace(/\s+/g, '_') || 'sezione'
      let id = base, n = 2
      while (usati.has(id)) id = `${base}_${n++}`
      usati.add(id)
      sezioni.push({ liv, testo, id })
      out.push(`<h${liv} id="${esc(id)}">${inline(m[2], qui)}</h${liv}>`)
    } else if ((m = /^([*#]+)\s*(.*)$/.exec(riga))) {
      chiudiPar(); lista(m[1]); out.push(inline(m[2], qui))
    } else if (/^-{4,}\s*$/.test(riga)) { chiudiPar(); chiudiListe(); out.push('<hr>') }
    else if (!riga.trim()) { chiudiPar(); chiudiListe() }
    else { chiudiListe(); par.push(riga.trim()) }
  }
  chiudiPar(); chiudiListe()
  return { html: out.join('\n'), sezioni, categorie }
}

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

// ---------------------------------------------------------------------------------------------------- le pagine speciali
const SPECIALI = {
  UltimeModifiche: { nome: 'Ultime modifiche', gruppo: 'Cambiamenti recenti e registri', vista: () => ({ corpo: `<div class="filtri"><p><b>Filtri.</b> Mostra le ultime <select aria-label="Quante modifiche"><option>50</option><option>100</option><option>250</option><option>500</option></select> modifiche degli ultimi <select aria-label="Quanti giorni"><option>1</option><option>3</option><option selected>7</option><option>14</option><option>30</option></select> giorni.</p><p class="filtri-v"><label><input type="checkbox"> nascondi le modifiche piccole</label> <label><input type="checkbox"> nascondi i bot</label> <button type="button" class="bottone">Aggiorna</button></p></div><p class="vuoto-lista">Nessuna modifica nel periodo indicato che corrisponda a questi criteri.</p>` }) },
  Registro: { nome: 'Registri', gruppo: 'Cambiamenti recenti e registri', vista: () => ({ corpo: `<form class="filtri" onsubmit="return false"><p><label>Tipo di registro: <select><option>Tutti i registri</option><option>Registro delle creazioni</option><option>Registro delle cancellazioni</option><option>Registro dei blocchi</option></select></label> <label>Utente: <input type="text"></label> <label>Titolo: <input type="text"></label> <button type="submit" class="bottone">Visualizza</button></p></form><p class="vuoto-lista">Non ci sono registri che corrispondano a questa ricerca.</p><ul class="registro"></ul>` }) },
  PaginaCasuale: { nome: 'Una voce a caso', gruppo: 'Strumenti per la ricerca', vista: () => {
    const v = nomiVoci()
    if (v.length) { location.replace(percorso(v[Math.floor(Math.random() * v.length)])); return null }
    return { corpo: `<div class="avviso avviso-info"><b>Nessuna voce da estrarre.</b> Per ora la wiki è vuota: non c’è niente da mostrare a caso.</div><p>Torna alla <a href="${percorso(PRINCIPALE)}">pagina principale</a>.</p>` }
  } },
  Cerca: { nome: 'Cerca', gruppo: 'Strumenti per la ricerca', vista: (arg, q) => vistaCerca((q.get('q') ?? q.get('search') ?? arg ?? '').trim()) },
  TutteLePagine: { nome: 'Tutte le pagine', gruppo: 'Elenchi di pagine', vista: () => {
    const v = Object.keys(VOCI).sort((a, b) => a.localeCompare(b, 'it'))
    return { corpo: `<form class="filtri" onsubmit="return false"><p><label>Mostra le pagine a partire da: <input type="text"></label> <label>Spazio: <select><option>(Principale)</option><option>Discussione</option><option>Categoria</option><option>Pzkkopedia</option></select></label> <button type="submit" class="bottone">Vai</button></p></form>${v.length ? `<ul class="colonne">${v.map((t) => `<li><a href="${percorso(t)}">${esc(t)}</a></li>`).join('')}</ul>` : '<p class="vuoto-lista">Non c’è ancora nessuna pagina.</p>'}` }
  } },
  NuovePagine: { nome: 'Pagine nuove', gruppo: 'Elenchi di pagine', vista: () => ({ corpo: '<p class="vuoto-lista">Nessuna pagina nuova nel periodo indicato.</p><ul class="registro"></ul>' }) },
  Categorie: { nome: 'Categorie', gruppo: 'Elenchi di pagine', vista: () => {
    const c = new Map()
    for (const k of Object.keys(VOCI)) for (const x of catDi(k)) c.set(x, (c.get(x) ?? 0) + 1)
    return { corpo: c.size ? `<ul class="colonne">${[...c].sort().map(([x, n]) => `<li><a class="new" href="${percorso(x)}">${esc(x.slice(10))}</a> (${n})</li>`).join('')}</ul>` : '<p class="vuoto-lista">Non esiste ancora nessuna categoria.</p>' }
  } },
  Statistiche: { nome: 'Statistiche', gruppo: 'Dati e strumenti', vista: () => ({ corpo: `<table class="wikitable tabella-stat"><caption>Numeri di pzkkopedia</caption><tbody><tr><th scope="row">Pagine in tutto</th><td>${Object.keys(VOCI).length + 1}</td></tr><tr><th scope="row">Voci</th><td>${nomiVoci().length}</td></tr><tr><th scope="row">Modifiche</th><td>0</td></tr><tr><th scope="row">Utenze registrate</th><td>0</td></tr><tr><th scope="row">File caricati</th><td>0</td></tr></tbody></table>` }) },
  CreaUtenza: { nome: 'Crea un’utenza', gruppo: 'Utenti e diritti', vista: () => ({ corpo: `<div class="avviso avviso-avvertenza">Le utenze non sono ancora aperte: il modulo c’è, ma non crea niente.</div>${modulo(['Nome utente', 'Password', 'Conferma la password'], 'Crea la tua utenza')}` }) },
  Entra: { nome: 'Accedi', gruppo: 'Utenti e diritti', vista: () => ({ corpo: `<div class="avviso avviso-avvertenza">Le utenze non sono ancora aperte: il modulo c’è, ma non fa entrare nessuno.</div>${modulo(['Nome utente', 'Password'], 'Accedi')}<p>Non hai un’utenza? <a href="#/Speciale:CreaUtenza">Creane una</a>.</p>` }) },
  PuntanoQui: { nome: 'Puntano qui', gruppo: null, vista: (arg) => ({ h1: `Puntano qui: ${esc(arg || '')}`, corpo: `<p>Pagine che contengono un collegamento a «<b>${esc(arg || '')}</b>».</p><p class="vuoto-lista">Nessuna pagina punta qui.</p>` }) },
  ModificheCollegate: { nome: 'Modifiche correlate', gruppo: null, vista: (arg) => ({ h1: `Modifiche correlate: ${esc(arg || '')}`, corpo: '<p class="vuoto-lista">Nessuna modifica nelle pagine collegate nel periodo indicato.</p>' }) },
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
    const ql = q.toLowerCase(), trovate = Object.keys(VOCI).filter((k) => k.toLowerCase().includes(ql) || testoSemplice(testoDi(k)).toLowerCase().includes(ql))
    if (trovate.length) corpo += `<p class="conto">Risultati: ${trovate.length}.</p><ul class="risultati">${trovate.map((k) => `<li><div class="ris-titolo"><a href="${percorso(k)}">${esc(k)}</a></div><div class="ris-testo">${snippet(testoDi(k), q)}</div></li>`).join('')}</ul>`
    else {
      const t = normalizza(q)
      corpo += `<div class="nessun-risultato"><p><b>Nessun risultato per «${esc(q)}».</b></p><p>Non c’è nessuna pagina con questo titolo né con questo testo.</p><ul><li>Puoi <a class="new" href="${percorso(t)}?action=edit&amp;redlink=1">creare la pagina «${esc(t)}»</a> su questa wiki.</li><li>Controlla di aver scritto bene, o prova con altre parole, più semplici.</li></ul></div>`
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
function vistaVoce(titolo, query) {
  const azione = query.get('action') || 'view', esiste = esisteVoce(titolo)
  if (azione === 'edit' || azione === 'submit') return vistaModifica(titolo, esiste, query)
  if (azione === 'history') return { titolo, vista: 'cronologia', esiste, h1: `${esc(titolo)}: cronologia delle modifiche`, corpo: esiste ? '<p>Legenda: <b>corr</b> = differenza con la versione attuale; <b>prec</b> = differenza con la versione precedente; <b>m</b> = modifica minore.</p><p class="vuoto-lista">Nessuna revisione registrata: la wiki non è ancora aperta alle modifiche.</p>' : '<div class="avviso avviso-info">Questa pagina non esiste, quindi non ha una cronologia.</div>' }
  if (azione === 'info') return vistaInfo(titolo, esiste)
  if (titolo === PRINCIPALE && !dati(titolo)) return vistaPrincipale()
  if (titolo.startsWith('Categoria:')) {
    const membri = Object.keys(VOCI).filter((k) => catDi(k).includes(titolo)).sort((a, b) => a.localeCompare(b, 'it'))
    if (esiste || membri.length) {
      const w = esiste ? wikitesto(testoDi(titolo), titolo) : { html: '', sezioni: [], categorie: [] }
      const nome = esc(titolo.slice(10))
      return { titolo, esiste, ...w, piede: esiste ? dataDi(titolo) : null, corpo: `${w.html}<h2 id="Pagine_nella_categoria">Pagine nella categoria «${nome}»</h2>${membri.length ? `<p>Questa categoria contiene ${membri.length === 1 ? 'una pagina' : membri.length + ' pagine'}.</p><ul class="colonne">${membri.map((k) => `<li><a href="${percorso(k)}">${esc(k)}</a></li>`).join('')}</ul>` : '<p class="vuoto-lista">Questa categoria non contiene nessuna pagina.</p>'}`, sezioni: [...w.sezioni, { liv: 2, testo: `Pagine nella categoria «${titolo.slice(10)}»`, id: 'Pagine_nella_categoria' }] }
    }
  }
  if (!esiste) return nonEsiste(titolo)
  return { titolo, esiste, ...wikitesto(testoDi(titolo), titolo), piede: dataDi(titolo) }
}
function nonEsiste(titolo) {
  const t = esc(titolo), p = percorso(titolo)
  return { titolo, esiste: false, corpo: `<div class="avviso avviso-info non-esiste"><p><b>Questa pagina non esiste.</b></p><p>Non esiste una pagina intitolata «<b>${t}</b>» in ${NOME}. Puoi:</p><ul><li><a href="${p}?action=edit">creare questa pagina</a>, scrivendola tu;</li><li><a href="#/Speciale:Cerca?q=${encodeURIComponent(titolo)}">cercare «${t}»</a> nel testo delle altre pagine;</li><li>vedere quali pagine <a href="#/Speciale:PuntanoQui/${encodeURIComponent(titolo.replace(/ /g, '_'))}">puntano qui</a>.</li></ul></div><p><a class="bottone bottone-blu" href="${p}?action=edit">Crea</a></p>` }
}
function vistaInfo(titolo, esiste) {
  const testo = testoDi(titolo)
  return { titolo, vista: 'info', esiste, h1: `Informazioni su «${esc(titolo)}»`, corpo: `<table class="wikitable tabella-stat"><caption>Informazioni di base</caption><tbody><tr><th scope="row">Titolo</th><td>${esc(titolo)}</td></tr><tr><th scope="row">La pagina esiste</th><td>${esiste ? 'sì' : 'no'}</td></tr><tr><th scope="row">Lunghezza (in caratteri)</th><td>${testo.length}</td></tr><tr><th scope="row">Categorie</th><td>${catDi(titolo).length}</td></tr><tr><th scope="row">Ultima modifica</th><td>${esiste ? esc(dataIt(dataDi(titolo))) : '—'}</td></tr></tbody></table>` }
}
function vistaPrincipale() {
  const n = nomiVoci().length
  const riquadro = (chiave, titolo, cl) => {
    const k = `${PRINCIPALE}/${chiave}`, id = 'mp-' + cl
    return `<section class="mp-riquadro ${cl}" aria-labelledby="${id}"><h2 id="${id}">${titolo}</h2><div class="mp-corpo wikitesto">${dati(k) ? wikitesto(testoDi(k), PRINCIPALE).html : '<p class="segnaposto">nessun contenuto ancora</p>'}</div></section>`
  }
  const benvenuti = dati(`${PRINCIPALE}/Benvenuti`) ? wikitesto(testoDi(`${PRINCIPALE}/Benvenuti`), PRINCIPALE).html : '<p class="segnaposto">nessun contenuto ancora</p>'
  return { titolo: PRINCIPALE, principale: true, esiste: true, piede: CREATA, corpo: `<div class="mp">
<section class="mp-benvenuti" aria-labelledby="mp-b"><h2 id="mp-b">Benvenuti in <span class="mp-nome">${NOME}</span></h2><p class="mp-sotto">${SLOGAN}. <b>${n}</b> ${n === 1 ? 'voce' : 'voci'}.</p><div class="wikitesto">${benvenuti}</div>
<p class="mp-porte"><a href="${percorso('Aiuto:Aiuto')}">Aiuto</a> · <a href="${percorso('Pzkkopedia:Portale comunità')}">Portale della comunità</a> · <a href="#/Speciale:UltimeModifiche">Ultime modifiche</a> · <a href="#/Speciale:PaginaCasuale">Una voce a caso</a></p></section>
<div class="mp-griglia"><div class="mp-col">${riquadro('Voce in vetrina', 'Una voce in vetrina', 'vetrina')}${riquadro('Lo sapevi che', 'Lo sapevi che…', 'sapevi')}</div><div class="mp-col">${riquadro('Ricorrenze', 'Ricorrenze', 'ricorrenze')}${riquadro('Eventi correnti', 'Eventi correnti', 'eventi')}</div></div>
${riquadro('Nelle altre lingue', 'Nelle altre lingue', 'lingue')}${riquadro('Portali', 'Portali', 'portali')}${riquadro('Progetti fratelli', 'Progetti fratelli', 'fratelli')}</div>` }
}

// ---------------------------------------------------------------------------------------------------- l'editor
const BARRA = [
  ['B', 'Grassetto (Ctrl+B)', 'b', "'''", "'''", 'testo in grassetto'],
  ['I', 'Corsivo (Ctrl+I)', 'i', "''", "''", 'testo in corsivo'],
  ['Link', 'Link a una voce (Ctrl+K)', 'k', '[[', ']]', 'titolo della voce'],
  ['Titolo', 'Titolo di sezione', '', '== ', ' ==', 'titolo', 'riga'],
  ['Elenco', 'Elenco puntato', '', '* ', '', '', 'riga'],
  ['1. Elenco', 'Elenco numerato', '', '# ', '', '', 'riga'],
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
<div class="avviso avviso-avvertenza"><b>${NOME} non è ancora aperta alle modifiche.</b> Puoi provare l’editor e l’anteprima, ma «Salva pagina» per ora non salva niente.</div>
${nuova && !spazioDi(titolo).startsWith('Speciale') ? `<div class="avviso avviso-info">${query.get('redlink') ? 'Hai seguito un link a una pagina che non esiste ancora. ' : ''}Stai creando una pagina nuova: scrivi qui sotto, poi guarda l’anteprima.</div>` : ''}
<div id="avvisi" aria-live="polite"></div>
<section id="anteprima" class="anteprima" hidden aria-labelledby="ant-t"><h2 id="ant-t">Anteprima</h2><div class="avviso avviso-avvertenza"><b>Questa è solo un’anteprima.</b> Le modifiche non sono ancora state salvate!</div><div class="ant-corpo"><div class="wikitesto" id="ant-testo"></div><div class="categorie" id="ant-cat"></div></div></section>
<form class="modifica" id="f-mod">
<div class="mod-barra" role="toolbar" aria-label="Strumenti di formattazione">${barra}<span class="mod-spazio"></span><a class="mod-aiuto" href="${percorso('Aiuto:Modificare una pagina')}">Aiuto</a></div>
<textarea id="testo-mod" name="testo" rows="22" lang="it" spellcheck="true" aria-label="Testo della pagina (wikitesto)">${esc(testoDi(titolo))}</textarea>
<p class="mod-campo"><label for="oggetto">Oggetto:</label> <input id="oggetto" name="oggetto" type="text" maxlength="200" placeholder="Una riga su cosa hai cambiato"></p>
<p class="mod-campo"><label><input type="checkbox" name="piccola"> Piccola modifica</label> <label><input type="checkbox" name="segui" checked> Segui questa pagina</label></p>
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
      document.getElementById('avvisi').innerHTML = `<div class="avviso avviso-errore" role="alert"><b>La wiki non è ancora aperta alle modifiche.</b> La pagina non è stata salvata; il testo qui sotto è rimasto com’era.</div>`
      document.getElementById('avvisi').scrollIntoView({ block: 'nearest' })
    })
  } }
}

// ---------------------------------------------------------------------------------------------------- la cornice
const catlinks = (c) => (c.length ? `<div class="catlinks"><b>${c.length === 1 ? 'Categoria' : 'Categorie'}</b>: <ul>${c.map((x) => `<li><a class="new" href="${percorso(x)}">${esc(x.slice(10))}</a></li>`).join('')}</ul></div>` : '')
const PIEDE = [['Informativa sulla privacy', percorso('Pzkkopedia:Informativa sulla privacy')], ['Informazioni su ' + NOME, percorso('Pzkkopedia:Informazioni')], ['Avvertenze', percorso('Pzkkopedia:Avvertenze')], ['Codice di condotta', percorso('Pzkkopedia:Codice di condotta')], ['Sviluppatori', '/info/'], ['Statistiche', '#/Speciale:Statistiche'], ['Dichiarazione sui cookie', percorso('Pzkkopedia:Dichiarazione sui cookie')]]

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
    <h3>Strumenti</h3>
    <ul><li><a href="#/Speciale:PagineSpeciali">Pagine speciali</a></li><li><a href="#/Speciale:TutteLePagine">Tutte le pagine</a></li><li><a href="#/Speciale:Registro">Registri</a></li><li><a href="#/Speciale:Statistiche">Statistiche</a></li></ul>
  </nav>
  <nav class="toc-lato" id="toc-lato" aria-label="Contenuti" hidden></nav>
  <div class="centro">
    <div class="linguette" id="linguette"></div>
    <main class="corpo" id="contenuto" tabindex="-1">
      <div class="titolo"><h1 id="h1" tabindex="-1"></h1><span class="btn-lingue" aria-disabled="true" title="Nessuna altra lingua">${ICONE.mondo} Aggiungi lingue</span></div>
      <div class="sottotitolo">Da ${NOME}, ${SLOGAN}.</div>
      <div id="toc-pagina"></div>
      <div class="wikitesto" id="testo"></div>
      <div class="categorie" id="categorie"></div>
    </main>
    <footer class="piede-wiki">
      <p id="ultima"></p>
      <ul>${PIEDE.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}<li><a href="#/" id="bt-mobile"></a></li></ul>
      <p class="piede-firma">Un pezzo di <a href="/">pzkko</a> · fatto da <a href="https://www.albertopecchini.it">Alberto Pecchini</a></p>
    </footer>
  </div>
</div>`
}

function linguette(p) {
  const base = percorso(p.titolo)
  const li = (h, t, o = {}) => `<li><a href="${h}" class="${o.nuovo ? 'new' : ''}"${o.sel ? ' aria-current="page"' : ''}>${t}</a></li>`
  let sx, dx = ''
  if (p.speciale) sx = li(base, 'Pagina speciale', { sel: true })
  else {
    const c = coppia(p.titolo), v = p.vista || 'leggi'
    sx = li(percorso(c.sog), ETICHETTA[c.sp] ?? 'Voce', { sel: !c.talk, nuovo: !esisteVoce(c.sog) }) + li(percorso(c.disc), 'Discussione', { sel: c.talk, nuovo: !esisteVoce(c.disc) })
    const esiste = esisteVoce(p.titolo)
    dx = li(base, 'Leggi', { sel: v === 'leggi' || v === 'info' }) + li(`${base}?action=edit`, esiste ? 'Modifica' : 'Crea', { sel: v === 'modifica' }) + li(`${base}?action=history`, 'Cronologia', { sel: v === 'cronologia' })
  }
  const s = encodeURIComponent(p.titolo.replace(/ /g, '_'))
  const strumenti = `<li class="tendina"><button type="button" class="bt-tendina bt-strumenti" data-tendina="tp-strumenti" aria-expanded="false" aria-haspopup="true" aria-controls="tp-strumenti">Strumenti ${ICONE.freccia}</button>
<ul id="tp-strumenti" class="pannello pannello-dx" hidden><li><a href="#/Speciale:PuntanoQui/${s}">Puntano qui</a></li><li><a href="#/Speciale:ModificheCollegate/${s}">Modifiche correlate</a></li><li><a href="#/Speciale:PagineSpeciali">Pagine speciali</a></li><li><a href="${base}">Link permanente</a></li><li><a href="${base}?action=info">Informazioni sulla pagina</a></li></ul></li>`
  return `<ul class="lin lin-sx" aria-label="Spazi">${sx}</ul><ul class="lin lin-dx" aria-label="Visualizzazioni">${dx}${strumenti}</ul>`
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
  el('testo').innerHTML = p.corpo
  el('testo').classList.toggle('wikitesto', !p.principale)
  el('categorie').innerHTML = catlinks(p.categorie ?? [])
  el('ultima').textContent = p.piede ? `Questa pagina è stata modificata l’ultima volta il ${dataIt(p.piede)}.` : ''
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
  const p = ind.titolo.startsWith('Speciale:') ? vistaSpeciale(ind.titolo, ind.query) : vistaVoce(ind.titolo, ind.query)
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
  const t = nomiVoci().filter((k) => k.toLowerCase().includes(vl)).sort((a, b) => Number(b.toLowerCase().startsWith(vl)) - Number(a.toLowerCase().startsWith(vl))).slice(0, 8)
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
  document.getElementById('mp-sposta').addEventListener('click', () => {
    fisso = !fisso
    try { localStorage.setItem('pzkkopedia-menu', fisso ? 'fisso' : 'nascosto') } catch {}
    html.classList.remove('menu-aperto'); document.getElementById('bt-menu').setAttribute('aria-expanded', 'false'); adatta()
  })
  document.getElementById('bt-mobile').addEventListener('click', (e) => {
    e.preventDefault(); forzato = !forzato
    try { localStorage.setItem('pzkkopedia-mobile', forzato ? '1' : '0') } catch {}
    adatta()
  })
  largo.addEventListener('change', adatta)
  document.addEventListener('click', (e) => {
    if (e.target.closest('#bt-menu')) return
    const b = e.target.closest('[data-tendina]')
    if (b) {
      const p = document.getElementById(b.dataset.tendina), aprire = p.hidden
      chiudiTutto(b); p.hidden = !aprire; b.setAttribute('aria-expanded', String(aprire)); return
    }
    const s = e.target.closest('a[data-sez]')
    if (s) { // i link alle sezioni scorrono sul posto (l'hash è l'indirizzo della voce)
      e.preventDefault()
      const id = s.dataset.sez
      scorri(id)
      if (document.getElementById('toc-lato').contains(s) || s.closest('#testo')) { const ind = indirizzo(); if (!ind.query.get('action')) history.replaceState(null, '', percorso(ind.titolo) + (id ? '#' + encodeURIComponent(id) : '')) }
      return
    }
    const ap = e.target.closest('.toc-apri')
    if (ap) { const u = ap.closest('li').querySelector(':scope > ul'), aperto = ap.getAttribute('aria-expanded') === 'true'; ap.setAttribute('aria-expanded', String(!aperto)); if (u) u.hidden = aperto; return }
    if (!e.target.closest('.pannello, .menu-principale, .ricerca') || e.target.closest('.pannello a, .menu-principale a')) chiudiTutto()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    const aperto = document.querySelector('[data-tendina][aria-expanded="true"]') ?? (html.classList.contains('menu-aperto') ? document.getElementById('bt-menu') : null)
    chiudiTutto(); aperto?.focus()
  })
  let attesa = 0
  addEventListener('scroll', () => { cancelAnimationFrame(attesa); attesa = requestAnimationFrame(segui) }, { passive: true })
  addEventListener('hashchange', () => vai())
}

scheletro()
impostaCornice()
adatta()
vai(true)
