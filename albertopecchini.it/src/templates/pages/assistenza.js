// «Better Call Pekko» — bettercallpekko.it (e /assistenza/, /contatti/assistenza/
// nel sito serio, che su Vercel rimandano al dominio).
//
// Due pagine autonome, fuori dal guscio del portfolio (route.standalone in
// routes.js): niente testata, piè di pagina, font o bundle del sito. Tutto ciò
// che serve sta qui dentro — stile e script in linea — perché la pagina deve
// sembrare il sito americano del 2008 di Pekko, «the computer guy», alla Saul
// Goodman: 960 px fissi, colonna blu coi tasti gialli, pannello dei «video di
// consulenza», manifesto, striscia «WELCOME», colonne pubblicitarie ai lati,
// aziende che non esistono, profilo MySpace, listino, forum, telefonini e
// provider del 2009, pagamenti e donazioni PayPal, coupon, webcam coi filtri
// brutti, pop-up d'ingresso. Tutto in inglese, paragrafi in minuscolo
// sgrammaticato; le Impact sono bianche coi bordi colorati e l'estrusione in 3D.
//
// Le parti vive sono vere e passano da api/bcp.js (Vercel Blob): contavisite e
// persone online, like, condivisioni, sondaggio, record del gioco, forum con
// discussioni e risposte, guestbook, shoutbox, e-card con link da mandare. I
// testi degli utenti entrano nel DOM solo come testo (textContent), mai come
// HTML. L'HTML stampa già il contenuto iniziale (src/data/bcp-seed.js), così la
// pagina regge anche senza JavaScript o col database spento.
//
// Contenuti in src/data/assistenza.js; immagini di tools/assistenza con le
// misure nel manifest generato src/data/assistenza-media.js. Il modulo della
// pagina contatti parla con api/contatti.js come quello di /contatti/.

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { assistenza as A, BCP } from '../../data/assistenza.js'
import { media } from '../../data/assistenza-media.js'
import { seed } from '../../data/bcp-seed.js'

const S0 = seed()
const src = (name) => media[name]?.src || ''
const PAGINA = A.dominio + '/'

/** Un'immagine del manifest, o il riquadro di testo se non è ancora stata resa. */
function img(name, alt, { w, h, cls = '', eager = false } = {}) {
  const m = media[name]
  if (!m) return `<span class="fake ${cls}" style="${w ? `width:${w}px;` : ''}${h ? `height:${h}px;` : ''}" role="img" aria-label="${esc(alt)}">${esc(alt)}</span>`
  return `<img class="${cls}" src="${m.src}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`
}

/** Un annuncio: ogni annuncio porta ai contatti dell'assistenza, mai a quelli del portfolio. */
const ad = (name, alt, { href = A.contatti, title, attrs = '', ext = false, ...o } = {}) => `<a class="ad" href="${href}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}${attrs ? ` ${attrs}` : ''}>${img(name, alt, o)}</a>`

const i3 = (text, tone = 'r', size = 30) => `<span class="i3 ${tone}" style="font-size:${size}px">${text}</span>`

const logo = (dark = false) => `<span class="logo${dark ? ' dark' : ''}"><span class="s">"Better Call Pekko!"</span><span class="n">Pekko</span><span class="q">I'M THE COMPUTER GUY</span></span>`

const nav = (attiva = '', prefisso = '') =>
  `<ul class="nav">${A.menu.map((v) => `<li><a href="${v.href.startsWith('#') ? prefisso + v.href : v.href}"${v.href === attiva ? ' class="on"' : ''}>${esc(v.label)}${v.nuovo ? '<i class="nw blink">NEW!</i>' : ''}</a></li>`).join('')}</ul>`

const sec = (id, title, inner, sub) => `<section class="sec" id="${id}"><h2>${i3(title, 'r', 34)}${sub ? `<small>${esc(sub)}</small>` : ''}</h2>${inner}</section>`

const chips = (lista, cls = '') => `<div class="chips ${cls}">${lista.map((w) => `<span>${esc(w)}</span>`).join('')}</div>`

/** «Mi piace» vero: il conteggio arriva dall'API, il click si ricorda nel browser. */
const like = (k, label = 'Like') => `<span class="lk"><button type="button" data-like="${k}"><i>👍</i> ${esc(label)}</button> <b data-likes="${k}">0</b> <small>ppl like this</small></span>`

/** Data «all'americana» del 2009: 03/14/2009 11:52 PM. */
function quando(ts) {
  const d = new Date(ts)
  const p = (x) => String(x).padStart(2, '0')
  const h = d.getUTCHours() + 2
  return `${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}/${d.getUTCFullYear()} ${p(((h + 11) % 12) + 1)}:${p(d.getUTCMinutes())} ${h % 24 < 12 ? 'AM' : 'PM'}`
}

const shareHref = (k) => {
  const u = encodeURIComponent(PAGINA)
  const t = encodeURIComponent(A.shareTesto)
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    email: `mailto:?subject=${t}&body=${u}`,
    copy: PAGINA,
  }[k]
}

/** Barra delle condivisioni vere, con i contatori. */
const sharebar = (small = false) =>
  `<div class="sharebar${small ? ' sm' : ''}">${A.condividi
    .map((s) => `<a href="${shareHref(s.k)}" data-share="${s.k}" style="background:${s.colore}"${s.k === 'copy' || s.k === 'email' ? '' : ' target="_blank" rel="noopener"'}>${esc(s.nome)} <b data-shares="${s.k}">0</b></a>`)
    .join('')}</div>`

// Campi comuni dei moduli vivi: nome (ricordato nel browser), trappola per i bot.
const nomeCampo = (id) => `<input class="nm" name="name" id="${id}" maxlength="24" placeholder="ur name" autocomplete="nickname" required>`
const trappola = '<input class="hp" name="sito" tabindex="-1" autocomplete="off" aria-hidden="true">'

const EULA = `<p><b>END USER LICENSE AGREEMENT — IMPORTANT, READ CAREFULLY.</b> By calling, e-mailing, thinking about, or standing near Pekko ("the Computer Guy") you agree to be bound by this Agreement.</p><p><b>1. GRANT OF LICENSE.</b> The Computer Guy grants you a non-exclusive, non-transferable right to have your computer looked at, sighed over, and eventually fixed.</p><p><b>2. RESTRICTIONS.</b> You may not download "free" screensavers, install seventeen toolbars, or click YES on anything that says YOUR PC IS INFECTED in red letters.</p><p><b>3. DUPLICATE FILES.</b> All copies of copies of copies of your holiday photos remain your responsibility until proven otherwise.</p><p><b>4. PRINTERS.</b> The Computer Guy makes no warranty, express or implied, that any printer will ever print again; printers are governed by separate, older laws.</p><p><b>5. WINDOWS VISTA.</b> See section 4.</p><p><b>6. GOVERNING LAW.</b> This Agreement is governed by the laws of Rivalta sul Mincio and the ancient customs of the Mincio river.</p><p><b>7. PUBLIC POSTS.</b> What you write in the forum, guestbook and shoutbox is public. Don't post phone numbers, addresses or other people's data. The nutria eats what it doesn't like.</p><p><b>8. ENTIRE AGREEMENT.</b> Any other agreement is a duplicate and will be deleted with your permission. Si parla italiano. It's all good, man.</p>`

// ── Pezzi comuni ─────────────────────────────────────────────────────────────

const strip = () => `<div class="strip" aria-hidden="true"><span>${(esc(A.striscia) + ' &nbsp;●&nbsp; ').repeat(4)}</span></div>`

const sides = () => html`
  <div class="side sl" aria-label="Advertisements (fake)">
    ${ad('ad-sky-outfit', 'Pekko’s Outfit: menswear since 2006, 50% off all suits, dress like Pekko!', { w: 160, h: 600, href: `${A.path}#about` })}
    ${ad('ad-sky-donate', 'Buy Pekko a coffee: donate via PayPal', { w: 160, h: 300, href: A.paypal, ext: true, title: 'Donate via PayPal (opens PayPal)' })}
  </div>
  <div class="side sr" aria-label="Advertisements (fake)">
    ${ad('ad-sky-mac', 'Think different? Think cheaper. PC & Mac repair from €25, no Genius required', { w: 160, h: 600 })}
    ${ad('ad-sky-forum', 'Pekko’s forum: register free', { w: 160, h: 300, href: `${A.path}#forum` })}
  </div>
`

function satisfied() {
  const soc = [
    { t: 'ig', href: A.instagram || A.contatti, title: 'Instagram', bg: '#c13584' },
    { t: 'gh', href: A.github || A.contatti, title: 'GitHub', bg: '#333' },
    { t: 'wa', href: A.whatsapp, title: 'WhatsApp', bg: '#25a244' },
    { t: '@', href: `mailto:${A.email}`, title: 'E-mail', bg: '#2e5fb8' },
    { t: '$', href: A.paypal, title: 'PayPal', bg: '#003087' },
  ]
  return `<div class="sat">${i3('ANOTHER SATISFIED CUSTOMER?', 'w', 22)}<ul class="soc">${soc.map((s) => `<li><a href="${s.href}" title="${esc(s.title)}" style="background:${s.bg}"${s.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${s.t}</a></li>`).join('')}</ul>${i3('TELL YOUR VIRUS-INFECTED FRIENDS!!!!', 'y', 19)}<div style="margin-top:14px">${logo(true)}</div>${i3('BETTERCALLPEKKO.IT', 'y', 12)}<br><span class="aptv">AP tv</span></div>`
}

// Distintivo di FrogDR (Domain Rating di bettercallpekko.it): solo nella build
// SITE=bcp, perché misura quel dominio; la copia /assistenza/ del sito serio ne
// fa a meno. Il codice è quello dato da FrogDR (href e src non vanno cambiati).
const frogdr = () =>
  `<p class="fdr"><a href="https://frogdr.com/bettercallpekko.it?utm_source=bettercallpekko.it" target="_blank" rel="noopener" title="Domain Rating of bettercallpekko.it on FrogDR"><img src="https://frogdr.com/bettercallpekko.it/badge-white-tiny.svg" alt="Monitor your Domain Rating with FrogDR" width="224" height="20" loading="lazy" decoding="async"></a></p>`

function foot() {
  return html`
    <footer class="foot">
      <p class="cause"><a href="#donate">${esc(A.piede.cause)}</a></p>
      <p class="addr"><b>PEKKO</b> · <a href="${esc(A.dominio)}/">www.bettercallpekko.it</a> · ${esc(A.dove)} · <a href="${A.tel}">${esc(A.telefono)}</a> · <a href="mailto:${A.email}">${esc(A.email)}</a> · SI PARLA ITALIANO · ${esc(A.slogan)}</p>
      <p><a href="${A.contatti}">About &amp; Contact</a> &nbsp;|&nbsp; <a href="#" data-eula>Terms of Use</a> &nbsp;|&nbsp; <a href="${esc(site.url)}/privacy/">Privacy Policy</a> &nbsp;|&nbsp; <a href="${esc(site.url)}/crediti/">Image credits</a> &nbsp;|&nbsp; <a href="${A.paypal}" target="_blank" rel="noopener">Donate</a> &nbsp;|&nbsp; <a href="${esc(site.url)}/">The serious website</a></p>
      <p>${esc(A.piede.legale)}</p>
      <p>${esc(A.piede.ia)}</p>
      <p>${esc(A.piede.aggiornato)} · ${esc(A.piede.visitatore)}<span class="counter" data-counter>-------</span> · <span data-online>?</span> online now · Copyright © 2006–${new Date().getFullYear()} Pekko. All rights reserved. No rights reversed.</p>
      <p class="credit"><a href="${esc(site.url)}" rel="author">Site by ${esc(site.name)}</a> · ${esc(site.location.city)} (${esc(site.location.province)}), Italy</p>
      ${BCP && frogdr()}
    </footer>
    <div class="pop" data-eula-pop hidden role="dialog" aria-modal="true" aria-label="Terms of Use">
      <div class="win"><div class="bar"><span>Terms of Use — Better Call Pekko</span><button class="x" type="button" data-eula-close aria-label="Close">✕</button></div><div style="padding:10px"><div class="eula">${EULA}</div><p style="text-align:center;margin:10px 0 0"><button class="xp" type="button" data-eula-close>I Agree</button> <button class="xp" type="button" data-eula-close>I Agree (no choice)</button></p></div></div>
    </div>
  `
}

function popup() {
  return html`
    <div class="pop" data-popup hidden role="dialog" aria-modal="true" aria-labelledby="pop-t">
      <div class="win">
        <div class="bar"><span>⚠ ${esc(A.popup.barra)}</span><button class="x" type="button" data-popup-close aria-label="Close">✕</button></div>
        <div class="body">
          ${img('hero-punta', 'Pekko in a yellow suit, pointing at you', { w: 170, h: 228 })}
          <div>
            <h2 id="pop-t" class="i3 r">${esc(A.popup.titolo)}</h2>
            <p>${esc(A.popup.testo)}</p>
            <div class="acts"><button class="red" type="button" data-popup-close data-popup-focus>${esc(A.popup.si)}</button><a class="red" href="${A.tel}">${esc(A.popup.chiama)}</a></div>
            <button class="no" type="button" data-popup-close>${esc(A.popup.no)}</button>
          </div>
        </div>
      </div>
    </div>
    <div class="pop" data-ecard-pop hidden role="dialog" aria-modal="true" aria-labelledby="ec-t">
      <div class="win" style="width:440px">
        <div class="bar"><span>✉ You've got an e-card!!!</span><button class="x" type="button" data-ecard-close aria-label="Close">✕</button></div>
        <div style="padding:12px;text-align:center">
          <h2 id="ec-t" class="i3 r" style="font-size:26px" data-ecard-title>YOU'VE GOT AN E-CARD!</h2>
          <div data-ecard-img style="margin:8px auto;width:390px"></div>
          <p data-ecard-msg></p>
          <p><button class="red" type="button" data-ecard-close>LOL THX</button> <a class="red" href="#ecards" data-ecard-close>SEND ONE BACK</a></p>
        </div>
      </div>
    </div>
    <div class="pop" data-segreto hidden role="dialog" aria-modal="true" aria-labelledby="sg-t">
      <div class="win" style="width:480px">
        <div class="bar"><span>★ secret.exe — Pekko Mode</span><button class="x" type="button" data-segreto-close aria-label="Close">✕</button></div>
        <div class="body">
          <span class="dance">${img('ad-web-dance', 'Pekko dancing, in silhouette', { w: 160, h: 600 })}</span>
          <div>
            <h2 id="sg-t" class="i3 r" style="font-size:28px">${esc(W.segreto.titolo)}</h2>
            <p>${esc(W.segreto.testo)}</p>
            <p><b class="counter" data-likes="segreto">0</b> ${esc(W.segreto.conta)}</p>
            <p><button class="red" type="button" data-segreto-close>BACK 2 WORK</button></p>
          </div>
        </div>
      </div>
    </div>
  `
}

// I dati per lo script: API, immagini degli avatar e delle e-card, indirizzo pubblico.
const datiScript = () =>
  JSON.stringify({
    api: A.api,
    pagina: PAGINA,
    path: A.path,
    avatars: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, src(`avatar-${i + 1}`)])),
    ecards: A.ecard.carte.map((c) => src(c.ad)),
    shareTesto: A.shareTesto,
  }).replace(/</g, '\\u003c')

function shell({ path, title, description, body, image, head = '' }) {
  const m = media[image]
  const canon = A.dominio + (A.urlPubblici[path] || path)
  return html`<!doctype html>
<html lang="${A.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=960">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canon)}">
<meta name="author" content="${esc(site.name)}">
<link rel="author" href="${esc(site.url)}">
<meta name="theme-color" content="#eae41f">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(A.nome)}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canon)}">
${m && `<meta property="og:image" content="${esc(A.dominio + m.src)}"><meta property="og:image:width" content="${m.w}"><meta property="og:image:height" content="${m.h}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(A.dominio + m.src)}">`}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${CSS}</style>
${head}
</head>
<body>
${body}
<script type="application/json" id="bcp-data">${datiScript()}</script>
<script>${JS}</script>
</body>
</html>`
}

// ── /assistenza/ ─────────────────────────────────────────────────────────────

function mid() {
  return html`
    <div class="mid">
      <h1 class="i3 r">IN COMPUTER TROUBLE?</h1>
      <div class="vids">
        ${A.video.map((v) => `<a class="vid" href="${A.contatti}" title="${esc(A.videoNota)}">${img(v.ad, v.alt, { w: 160, h: 108 })}<b>${esc(v.label)}</b></a>`)}
      </div>
      <div class="watch">
        <span class="ab3">Watch Pekko's consultation videos</span>
        ${ad('ad-portrait', 'Pekko pointing at you', { w: 160, h: 190 })}
        ${logo()}
      </div>
      <div class="hot">
        ${i3('FREE CONSULTATION HOTLINE', 'r', 18)}
        <a class="i3 b tel" href="${A.tel}" style="font-size:38px">${esc(A.telefono)}</a>
        <span class="ab3" style="display:block;font-size:12px">SI PARLA ITALIANO · NOT TOLL FREE · <a class="blink" href="${A.contatti}">CALL NOW!!!</a></span>
      </div>
      <blockquote class="saul"><p>“${esc(A.monologo)}”</p><cite>— pekko, on channel 47 at 3 am</cite></blockquote>
      <div class="midlike">${like('page', 'Like Better Call Pekko')} · <a href="#donate">share it »</a></div>
      <div class="latest">
        <p class="ab3">NEW!!! pekko also makes websites. just launched:</p>
        <div class="lts">${W.siti.map((s, i) => [s, i]).filter(([s]) => s.anteprima && s.slug !== 'albertopecchini-it').map(([s, i]) => `<a href="#explorer" data-pex-open="${i}"><span class="bar"><i></i><i></i><i></i></span><img src="${s.anteprima.src}" width="186" height="116" alt="${esc(`The home page of ${s.dominio}`)}" loading="lazy" decoding="async"><b>${esc(s.tab)}</b></a>`)}</div>
      </div>
      <p class="special">${i3(A.slogan, 'r', 20)}</p>
    </div>
  `
}

function bottom() {
  return html`
    <div class="bottom">
      <div class="bl">${ad('ad-getspace', 'Get $pace now!!! I can prove that virus isn’t yours. Call today (not toll free). Better Call Pekko 351-035-5506', { w: 301, h: 389 })}</div>
      <div class="bm">
        <div class="row">
          ${ad('ad-vista', 'Have you or someone you know been affected by the tragedy of Windows Vista? Pekko can help!', { w: 264, h: 187 })}
          ${ad('ad-hermanos', 'Los Backups Hermanos — ¡Que seguro! (a company that does not exist)', { w: 222, h: 186 })}
        </div>
        ${ad('ad-fashion', 'Pekko’s Outfit, menswear since 2006: 50% off all suits. Dress like Pekko! Fashion show', { w: 486, h: 205, href: '#about' })}
      </div>
      <div class="br">${satisfied()}</div>
    </div>
  `
}

/** Righe a due colonne della tabella dei servizi: [titolo, testo] a coppie. */
function righe(s) {
  const rows = []
  for (let i = 0; i < s.length; i += 2) rows.push(`<tr>${[s[i], s[i + 1]].filter(Boolean).map(([t, d]) => `<td><b>${esc(t)}</b> — ${esc(d)}</td>`).join('')}</tr>`)
  return rows.join('')
}

// ── Websites: i siti veri di Alberto, raccontati da Pekko ────────────────────
// Gli annunci (ad-web-*, btn-*) nascono nel canvas di Claude Design e li rende
// tools/assistenza/design.mjs; le catture dei siti sono quelle vere del portfolio
// (public/media/web, rifatte ogni ora), più quella di questa pagina (shot-bcp).

const W = A.web
const urlBarra = (u) => u.replace(/^https:/, 'http:').replace(/\/?$/, '/')
const cattura = (s) => s.cattura || (media['shot-bcp'] && { src: media['shot-bcp'].src, width: media['shot-bcp'].w, height: media['shot-bcp'].h })
const ctaWeb = `${A.contatti}?tipo=${encodeURIComponent(W.ctaTipo)}#form`

/** Pekko Explorer 6: un browser del 2008 con una scheda per sito e la cattura vera da scorrere. */
function explorer() {
  const S = W.siti
  return html`
    <div class="pexwrap" id="explorer">
      <div class="pex" data-pex>
        <div class="pex-title"><span data-pex-title>${esc(S[0].nome)} — Pekko Explorer 6</span><i></i><i></i><i class="x"></i></div>
        <div class="pex-tabs" role="tablist" aria-label="Pekko’s websites">
          ${S.map((s, i) => `<button type="button" role="tab" id="pex-t${i}" aria-controls="pex-p${i}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" data-pex-tab data-url="${esc(urlBarra(s.url))}" data-href="${esc(s.url)}" data-title="${esc(s.nome)} — Pekko Explorer 6">${esc(s.tab)}</button>`)}
        </div>
        <div class="pex-bar"><button type="button" class="pex-nav" data-pex-step="-1" aria-label="Previous site">◀</button><button type="button" class="pex-nav" data-pex-step="1" aria-label="Next site">▶</button><span class="pex-url" data-pex-url>${esc(urlBarra(S[0].url))}</span><a class="pex-go" href="${esc(S[0].url)}" target="_blank" rel="noopener" data-pex-go>Go »</a></div>
        <div class="pex-view" data-pex-view tabindex="0" aria-label="Screenshot of the website: scroll it">
          ${S.map((s, i) => {
            const c = cattura(s)
            const dentro = c ? `<img src="${c.src}" width="${c.width}" height="${c.height}" alt="${esc(`The whole home page of ${s.dominio}`)}" loading="lazy" decoding="async">` : `<p class="here">${i3('U R ALREADY HERE!!!', 'r', 40)}</p>`
            return `<div role="tabpanel" id="pex-p${i}" aria-labelledby="pex-t${i}" data-pex-pane${i ? ' hidden' : ''}>${dentro}</div>`
          })}
        </div>
        <div class="pex-status">Done · real screenshot, redone every hour · Internet | Protected Mode: on (lol)</div>
      </div>
      ${S.map(
        (s, i) => html`
          <div class="pex-info" data-pex-info${i ? ' hidden' : ''}>
            <h3>${esc(s.nome)} <small>${esc(s.dominio)}${s.anno ? ` · ${s.anno}` : ''}</small></h3>
            <p>${esc(s.testo)}</p>
            <div class="nums">${s.numeri.map(([v, l]) => `<span><b>${esc(v)}</b>${esc(l)}</span>`).join('')}</div>
            ${chips(s.tech || [], 'net')}
            <p class="acts">${like(`site-${s.slug}`, 'Like this site')} <a class="red" href="${esc(s.url)}" target="_blank" rel="noopener">Visit ${esc(s.tab)} »</a></p>
          </div>
        `,
      )}
    </div>
  `
}

/** Il webring dei siti di Pekko: precedente, a caso, successivo (questa pagina è l'ultima). */
function webring() {
  const S = W.siti
  const altri = S.slice(0, -1).map((s) => s.url)
  const link = (href, testo, attrs = '') => `<a href="${esc(href)}" target="_blank" rel="noopener"${attrs}>${testo}</a>`
  return `<div class="ring2"><span>☆ PEKKO’S WEBRING ☆</span><span>${link(S[S.length - 2].url, '« prev')} | ${link(altri[0], 'random', ` data-ring-random="${esc(JSON.stringify(altri))}"`)} | ${link(S[0].url, 'next »')}</span><small>${S.length} sites · members since 2006*</small></div>`
}

/** I bottoncini 88×31, come nei webring del 2006: portano ai siti veri. */
function bottoni88() {
  const S = W.siti
  const lista = [
    ['btn-rivalta', S[0].url, 'rivaltasulmincio.it'],
    ['btn-cascina', S[1].url, 'cascinafontana.xyz'],
    ['btn-donelli', S[2].url, 'Ing. Dario Donelli'],
    ['btn-ap', site.url, 'Alberto Pecchini, the serious website'],
    ['btn-pzkko', S.find((s) => s.slug === 'pzkko-it').url, 'pzkko.it, the wall'],
    ['btn-bcp', `${A.dominio}/`, 'Better Call Pekko!!!'],
    ['btn-hand', '#websites', 'Hand coded'],
    ['btn-cookie', '#websites', '0 cookies, 0 trackers'],
    ['btn-vite', 'https://vite.dev/', 'Powered by Vite'],
    ['btn-html', `https://validator.w3.org/nu/?doc=${encodeURIComponent(`${A.dominio}/`)}`, 'HTML5, valid-ish (check it yourself)'],
    ['btn-ita', A.contatti, 'Si parla italiano'],
    ['btn-eyes', '', 'Best viewed with eyes'],
    ['btn-nutria', 'segreto', 'Secured by a nutria'],
  ]
  return `<div class="b88">${lista
    .map(([n, href, alt]) => {
      const im = img(n, alt, { w: 88, h: 31 })
      if (!href) return `<span>${im}</span>`
      if (href === 'segreto') return `<button type="button" data-nutria title="${esc(alt)}">${im}</button>`
      const fuori = href.startsWith('http')
      return `<a href="${esc(href)}" title="${esc(alt)}"${fuori ? ' target="_blank" rel="noopener"' : ''}>${im}</a>`
    })
    .join('')}</div>`
}

function websites() {
  const S = W.siti
  const [serio] = S.filter((s) => s.slug === 'albertopecchini-it')
  const [muro] = S.filter((s) => s.slug === 'pzkko-it')
  return html`
    <section class="sec" id="websites">
      <h2>${i3(W.titolo, 'b', 34)}<small>${esc(W.sotto)}</small></h2>
      <a class="ad full" href="#explorer">${img('ad-web-header', 'Pekko web design 2.0 (beta): websites that don’t suck!!! Pekko points at his real websites: rivaltasulmincio.it, cascinafontana.xyz, Ing. Dario Donelli, albertopecchini.it, pzkko.it', { w: 960, h: 200 })}</a>
      <div class="in">
        <p class="lead">${esc(W.intro)}</p>
        <div class="cols">
          <div class="c1">${explorer()}</div>
          <div class="c300">
            ${ad(serio.ad, serio.alt, { w: 300, h: 250, href: serio.url, ext: true, title: 'The serious website (opens in a new window)' })}
            <p class="note" style="text-align:center">same guy, different font · <a href="${esc(site.url)}" target="_blank" rel="noopener">the serious website »</a></p>
            ${ad(muro.ad, muro.alt, { w: 300, h: 250, href: muro.url, ext: true, title: `${muro.dominio} (opens in a new window)` })}
            <p class="note" style="text-align:center">same guy, on a wall · <a href="${esc(muro.url)}" target="_blank" rel="noopener">pzkko.it »</a></p>
            ${ad('ad-web-cantiere', 'No website? Pekko is already digging. Free consultation', { w: 300, h: 100, href: ctaWeb })}
            <div style="margin-top:8px">${webring()}</div>
            <div class="wid" style="margin-top:8px"><h4>Want one?</h4>free consultation, written quote item by item, 1 person from start 2 finish. <a href="${ctaWeb}">tell pekko about ur site »</a></div>
          </div>
        </div>
        <p class="h3">The real sites (click = visit 4 real)</p>
        <div class="webads">
          ${S.slice(0, 3).map((s) => `<div>${ad(s.ad, s.alt, { w: 300, h: 250, href: s.url, ext: true, title: `${s.dominio} (opens in a new window)` })}<div class="eclike">${like(`site-${s.slug}`, 'Like')}</div></div>`)}
        </div>
      </div>
      ${img('ad-web-howto', 'How Pekko makes a website, in 7 steps, no WordPress, no templates: 1 listen, 2 analyse, 3 design (2 or 3 ideas on paper), 4 build (HTML, CSS and JS written by hand), 5 review (2 rounds included), 6 launch (online on your domain, source files included), 7 help (first 30 days included)', { w: 960, h: 300, cls: 'full' })}
      <div class="in cols">
        <div class="c1">
          <p class="h3" style="margin-top:0">What Pekko does on the web</p>
          <table class="svc">${righe(W.servizi)}</table>
          <p class="h3">Frequently asked questions (by real ppl, probably)</p>
          <dl class="faq">${W.faq.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>
          <p class="cta"><a class="red" href="${ctaWeb}">${esc(W.cta)} ASK PEKKO »</a> <span class="note">free consultation · written quote · si parla italiano</span></p>
        </div>
        <div class="c160">${ad('ad-web-dance', '3 KB of JavaScript: that’s rivaltasulmincio.it on opening. Dance like nobody’s downloading. Pekko web design', { w: 160, h: 600, href: S[0].url, ext: true })}</div>
      </div>
      <div class="in cols" style="padding-top:0">
        <div class="c486">${img('ad-web-metro', 'What’s in a Pekko website: 3 KB of JavaScript on opening, 0 cookies and trackers, works on your phone from 320 to 1920 px, written by hand, your domain and hosting set up, the source files are yours', { w: 486, h: 280 })}</div>
        <div class="c1">
          <p class="h3" style="margin-top:0">${esc(W.altro.titolo)}</p>
          <table class="svc one">${W.altro.voci.map(([t, d]) => `<tr><td><b>${esc(t)}</b> — ${esc(d)}</td></tr>`).join('')}</table>
          <p style="margin:6px 0 0;font:11px Verdana,sans-serif">${esc(W.altro.nota)} <a href="${esc(site.url)}" target="_blank" rel="noopener">albertopecchini.it »</a></p>
          <p class="h3">Link 2 pekko (88×31 buttons)</p>
          ${bottoni88()}
        </div>
      </div>
    </section>
  `
}

/** «Lo sapevi?»: un fatto vero alla volta, nella colonna destra. */
const sapevi = () =>
  `<div class="dyk" data-dyk="${esc(JSON.stringify(W.sapevi))}"><h4 class="blink">DID U KNOW???</h4><p data-dyk-t>${esc(W.sapevi[0])}</p><button type="button" class="xp" data-dyk-next>next fact »</button></div>`

function consultations() {
  return sec(
    'consultations',
    'CONSULTATIONS',
    html`
      <div class="in cols">
        <div class="c1">
          <p class="h3">What Pekko can do for you (free consultation · si parla italiano)</p>
          <table class="svc">${righe(A.servizi)}</table>
          <p class="h3">Windows versions handled</p>
          ${chips(A.windows)}
          <p class="h3">Office versions handled</p>
          ${chips(A.office, 'off')}
          <div class="gift">
            ${i3(A.omaggio.titolo, 'r', 24)}
            <p>${esc(A.omaggio.testo)}</p>
            <a class="red" href="${A.contatti}">CLAIM IT NOW</a>
            <small>${esc(A.omaggio.nota)}</small>
          </div>
        </div>
        <div class="c300">
          ${ad('ad-mattress', 'Mincio Discount Mattress Barn: we won’t be undersold!!! Also: laptops. (does not exist)', { w: 300, h: 250 })}
          <div style="height:8px"></div>
          ${ad('ad-mac', 'Mac broken? Yes, it happens. We fix the ones with the bite too. No Genius required.', { w: 300, h: 250 })}
          <div style="height:8px"></div>
          ${ad('ad-gino', 'Crazy Gino’s Discount Laptops: prices so low they’re probably illegal (does not exist)', { w: 300, h: 100 })}
          <div class="wid" style="margin-top:8px"><h4>Weather</h4>${esc(A.meteo)}</div>
          <div class="wid" style="margin-top:8px"><h4>Free consultation hotline</h4><a class="i3 b" style="font-size:26px;text-decoration:none" href="${A.tel}">${esc(A.telefono)}</a><br><b>SI PARLA ITALIANO</b> · not toll free · <a href="${A.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
        </div>
      </div>
    `,
    `Free consultation hotline: ${A.telefono} · si parla italiano`,
  )
}

function about() {
  const B = A.about
  return sec(
    'about',
    B.titolo,
    html`
      <div class="in cols">
        <div class="c1">
          <p class="lead">${esc(B.intro)}</p>
          <table class="prof">${B.scheda.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
          <div class="cols" style="margin-top:8px">
            <div class="c1"><p class="h3">Likes</p><ul class="ul">${B.piace.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
            <div class="c1"><p class="h3">Dislikes</p><ul class="ul">${B.nonPiace.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
          </div>
          <p class="h3">Meet the staff</p>
          <div class="staff">
            ${B.staff.map((s) => `<div class="member">${s.img.startsWith('/') ? `<img src="${s.img}" alt="${esc(s.nome)}" width="96" height="96" loading="lazy">` : img(s.img, s.nome, { w: 96, h: 96 })}<b>${esc(s.nome)}</b><i>${esc(s.ruolo)}</i><span>${esc(s.nota)}</span></div>`).join('')}
          </div>
          <p class="h3">Sites by Pekko</p>
          <p>${B.siti.map((s) => `<a href="${s.href}"${s.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a>`).join(' · ')} · <a href="${ctaWeb}">yours?</a> · <a href="#websites">see them all »</a></p>
        </div>
        <div class="c340">
          <p class="h3">${esc(B.albumTitolo)}</p>
          <div class="album">${B.album.map((n, i) => `<div class="suit">${img(n, `Pekko’s outfit #${i + 1}`, { w: 100, h: 100 })}<button type="button" data-like="suit-${i + 1}" title="like this suit">👍 <b data-likes="suit-${i + 1}">0</b></button></div>`).join('')}</div>
          <p style="font:10px Verdana,sans-serif;color:#555;margin:4px 0 8px">${esc(B.albumNota)}</p>
          ${ad('ad-dairy', 'Mincio Dairy Call Center: press 1 for milk, 2 for tech support, 3 to moo (does not exist)', { w: 300, h: 250 })}
          <div style="height:8px"></div>
          ${ad('ad-scooter', 'Mincio Scooter Wireless: Wi-Fi that follows you, slowly (does not exist)', { w: 300, h: 100 })}
        </div>
      </div>
    `,
    B.sotto,
  )
}

function prices() {
  const P = A.prezzi
  return sec(
    'prices',
    P.titolo,
    html`
      <div class="in cols">
        <div class="c1">
          <table class="price">
            <tr><th>Service</th><th>Price</th><th>Notes</th></tr>
            ${P.voci.map(([s, p, n]) => `<tr><td>${esc(s)}</td><td class="p"><span class="i3 g" style="font-size:18px">${esc(p)}</span></td><td>${esc(n)}</td></tr>`)}
          </table>
          <p style="font:10px/1.4 Verdana,sans-serif;color:#555;margin:6px 0 0">${esc(P.nota)}</p>
        </div>
        <div class="c300">
          ${ad('ad-pizza', 'Gino’s Pizza & Data Recovery: free floppy with every margherita (does not exist)', { w: 300, h: 250 })}
          <div style="height:8px"></div>
          ${ad('ad-tan', 'Rivalta Tan & Toner: get a tan while we refill your cartridge (does not exist)', { w: 300, h: 100 })}
          <div class="wid" style="margin-top:8px"><h4>${esc(A.pagamenti.titolo)}</h4><div class="pay">${A.pagamenti.lista.map((p) => `<span>${esc(p)}</span>`).join('')}</div></div>
        </div>
      </div>
    `,
    P.sotto,
  )
}

function tv() {
  return sec(
    'tv',
    'AS SEEN ON TV',
    html`
      <div class="in cols">
        <div class="c400">
          <div class="tvset">
            <div class="scr">${img('ad-tv', 'TV commercial: Pekko in his office changing pose, call now 351-035-5506', { w: 320, h: 240 })}</div>
            <div class="knobs"><i></i><i></i><i></i></div>
            <span class="brand">PEKKOVISION</span>
          </div>
        </div>
        <div class="c1">
          <p class="h3">Channel 47</p>
          <p>${esc(A.tv.testo)}</p>
          <div class="ring">
            <p class="h3 blink">FREE RINGTONES!!!</p>
            ${A.suonerie.map((s) => `<button type="button" data-suono="${s.suono}">▶ ${esc(s.nome)}</button>`)}
            <p style="font:9px Verdana,sans-serif;color:#555;margin:4px 0 0">plays thru ur speakers. if ur speakers r mute, u know who 2 call.</p>
          </div>
          ${ad('ad-toolbar', 'Download the Better Call Pekko toolbar — free! Contains 0 viruses (probably)', { w: 468, h: 60, attrs: 'data-toolbar' })}
          <p data-toolbar-msg hidden style="margin:6px 0 0;padding:6px;border:2px solid #003c74;background:#fff;font:bold 11px Tahoma,sans-serif"></p>
        </div>
      </div>
    `,
    'Channel 47 · every night at 3 AM',
  )
}

// Il guestbook stampato dal server (l'archivio iniziale): lo script lo rifà coi dati veri.
const gbVoce = (g) => `<div class="cmt">${g.av ? img(`avatar-${g.av}`, `${g.by}'s webcam photo`, { w: 48, h: 48 }) : '<span class="noav">no photo</span>'}<div><b>${esc(g.by)}</b> <small>${esc(quando(g.ts))}</small><p>${esc(g.text)}</p></div></div>`

function testimonials() {
  const S = A.sondaggio
  const G = A.guestbook
  return sec(
    'testimonials',
    'TESTIMONIALS',
    html`
      <div class="in cols">
        <div class="c1">
          <p class="h3">${esc(G.titolo)} (<span data-gb-count>${S0.guestbook.length}</span> comments)</p>
          <form class="frmk" data-gb-form>
            <p class="h3">Leave a comment</p>
            <p class="note">${esc(G.nota)}</p>
            <p class="row2">${nomeCampo('gb-name')} <select name="av" data-av-select aria-label="Choose ur avatar"><option value="0">no photo</option>${Array.from({ length: 9 }, (_, i) => `<option value="${i + 1}">avatar #${i + 1}</option>`).join('')}</select> <span class="avprev" data-av-prev></span></p>
            <p><textarea name="text" rows="3" maxlength="300" placeholder="omg pekko…" required aria-label="Your comment"></textarea></p>
            ${trappola}
            <p><button class="red" type="submit">POST COMMENT</button> <span class="st" data-st></span></p>
          </form>
          <div data-gb-list>${S0.guestbook.map(gbVoce).join('')}</div>
        </div>
        <div class="c340">
          <div class="poll" data-poll data-grazie="${esc(S.grazie)}">
            <p class="h3">Poll</p>
            <p><b>${esc(S.domanda)}</b></p>
            ${S.voci.map((v, i) => `<label><input type="radio" name="poll" value="${i}"> ${esc(v)} <span class="pct" data-pct="${i}"></span></label><div class="bar" data-bar="${i}" hidden></div>`)}
            <p style="margin:6px 0 0"><button class="xp" type="button" data-vote>Vote</button> <span data-poll-msg></span></p>
            <p class="note"><span data-poll-tot>0</span> votes so far</p>
          </div>
          <div class="game" data-game data-vinto="${esc(A.gioco.vinto)}" data-href="${A.contatti}">
            <p class="h3">${esc(A.gioco.titolo)}</p>
            <p style="font:10px Verdana,sans-serif;margin:0 0 4px">${esc(A.gioco.aiuto)}</p>
            <div class="arena">${img('prop-virus', 'A green virus. Punch it.', { w: 56, h: 60 })}<span class="ouch">OUCH!</span></div>
            <p style="margin:6px 0 0"><b>HITS: <span data-hits>0</span>/3</b> · <b>TIME: <span data-time>0.00</span>s</b> <span data-game-msg></span></p>
            <p class="h3" style="margin-top:8px">Hall of fame</p>
            <ol class="scores" data-scores><li>no scores yet. be the first!!!</li></ol>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            ${ad('ad-turtle', 'Turtle Insurance Co. — slow, steady, insured (does not exist)', { w: 180, h: 150 })}
            ${ad('ad-snail', 'Snail Express Courier — it’ll get there (does not exist)', { w: 180, h: 150 })}
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            ${ad('ad-fish', 'Lake Garda Fish & Chips & Chips: RAM fresh daily (does not exist)', { w: 180, h: 150 })}
            ${ad('ad-phon', 'Blow-Dry PC: hair salon & fan repair (does not exist)', { w: 180, h: 150 })}
          </div>
        </div>
      </div>
    `,
    'real comments from real ppl (and some from 2009)',
  )
}

function ecards() {
  const E = A.ecard
  return sec(
    'ecards',
    'E-CARDS',
    html`
      <form class="ecform" data-ecard>
        <span>To:</span><input name="to" placeholder="friend's name" maxlength="30" required>
        <span>From:</span><input name="from" placeholder="ur name" maxlength="30" required>
        <span>E-card #</span><select name="n">${E.carte.map((_, i) => `<option>${i + 1}</option>`)}</select>
        <button class="red" type="submit">Submit</button>
      </form>
      <p class="note" style="margin:6px 10px 0">${esc(E.aiuto)} · <b data-ecards-tot>0</b> e-cards sent so far</p>
      <div class="ecdone" data-ecard-done hidden>
        <p><b>ur e-card is ready!!!</b> send this link 2 ur friend:</p>
        <p><input class="eclink" data-ecard-link readonly aria-label="E-card link"></p>
        <p class="sharebar sm" data-ecard-share></p>
      </div>
      <div class="ecgrid">
        ${E.carte.map((c, i) => `<div class="ec"><span class="num">#${i + 1}</span>${ad(c.ad, c.alt, { w: 390, h: 270, href: '#ecards' })}<div class="eclike">${like(`ecard-${i + 1}`)}</div></div>`)}
      </div>
    `,
    E.intro,
  )
}

const shoutVoce = (s) => `<p><b${s.by === 'pekko' ? ' class="me"' : ''}>${esc(s.by)}:</b> ${esc(s.text)} <small>${esc(quando(s.ts))}</small></p>`

function webcam() {
  const W = A.webcam
  const walkers = W.passanti.map(src).filter(Boolean).join(',')
  return sec(
    'webcam',
    'OFFICE WEBCAM',
    html`
      <div class="in cols">
        <div class="cam" data-cam data-cam-walkers="${walkers}">
          <div class="screen" data-cam-screen>
            ${img('bg-ufficio', 'Pekko’s office: a desk, a beige phone, a wall of old monitors and printers, an Italian flag', { cls: 'still', w: 360, h: 240 })}
            <img class="walk" data-cam-walk src="${src('cut-punta')}" alt="" width="150">
            <video data-cam-video hidden autoplay playsinline muted></video>
            <canvas data-cam-canvas hidden width="64" height="48"></canvas>
            <div class="osd">${esc(W.sotto)}<br><span data-cam-clock>06/28/2006 03:12:44 AM</span></div>
            <div class="rec"><span class="blink">●</span> REC</div>
            <div class="live" data-cam-live>LIVE · 56k</div>
          </div>
          <div class="bar"><button type="button" data-cam-on>USE MY WEBCAM</button><button type="button" data-cam-off>STOP</button><button type="button" data-cam-shot>SNAPSHOT</button></div>
          <div class="bar" data-cam-filters>${W.filtri.map((f, i) => `<button type="button" data-filter="${f.toLowerCase()}"${i === 0 ? ' class="on"' : ''}>${esc(f)}</button>`)}</div>
          <p class="status" data-cam-status><span data-online>?</span> ppl online now · stream quality: 56k</p>
          <div class="shot" data-cam-shotbox hidden></div>
        </div>
        <div class="c1">
          <p class="h3">${esc(W.titolo)}</p>
          <p>${esc(W.aiuto)}</p>
          <p class="h3">${esc(W.shoutTitolo)}</p>
          <div class="chat">
            <div class="log" data-shout-list>${S0.shout.map(shoutVoce).join('')}</div>
            <form data-shout-form>${nomeCampo('sh-name')}<input name="text" maxlength="140" placeholder="say something…" required aria-label="Shout">${trappola}<button class="xp" type="submit">Shout!</button></form>
          </div>
          <p class="note">${esc(W.shoutNota)} <span class="st" data-st-shout></span></p>
        </div>
      </div>
    `,
    'Cam 1 · Pekko’s office · Rivalta sul Mincio',
  )
}

// Il forum stampato dal server: righe della tabella (lo script le rifà coi dati veri).
const ultima = (t) => t.posts[t.posts.length - 1]
const forumRiga = (t) => {
  const u = ultima(t)
  const ico = t.locked ? '🔒' : t.sticky ? '📌' : t.hot ? '🔥' : '📄'
  return `<tr class="${t.sticky ? 'sticky' : ''}${t.locked ? ' locked' : ''}"><td><span class="ico">${ico}</span> <a href="#forum" data-thread-open="${esc(t.id)}">${esc(t.title)}</a>${t.hot ? ' <em>HOT</em>' : ''}</td><td>${esc(t.by)}</td><td class="n">${t.posts.length - 1}</td><td>${esc(quando(u.ts))}<br><small>by ${esc(u.by)}</small></td></tr>`
}

function forum() {
  const F = A.forum
  return sec(
    'forum',
    F.titolo,
    html`
      <div class="in">
        <table class="fr">
          <thead><tr><th style="width:52%">Topic</th><th>Author</th><th>Replies</th><th>Last post</th></tr></thead>
          <tbody data-forum>${S0.threads.map(forumRiga).join('')}</tbody>
        </table>
        <div class="thread" data-thread hidden></div>
        <form class="frmk" data-post-form>
          <p class="h3">Start a new topic</p>
          <p class="note">${esc(F.nota)}</p>
          <p class="row2">${nomeCampo('fo-name')} <input name="title" maxlength="80" placeholder="topic title (e.g. HELP my pc is possessed)" required style="width:420px" aria-label="Topic title"></p>
          <p><textarea name="text" rows="3" maxlength="600" placeholder="describe the drama…" required aria-label="Your post"></textarea></p>
          ${trappola}
          <p><button class="red" type="submit">POST NEW TOPIC</button> <span class="st" data-st></span></p>
        </form>
      </div>
    `,
    F.sotto,
  )
}

function phones() {
  const T = A.telefonini
  const P = A.provider
  return sec(
    'phones',
    'PHONES & NETWORKS',
    html`
      <div class="in cols">
        <div class="c1">
          <p class="h3">${esc(T.titolo)}</p>
          <p><b>Brands:</b></p>${chips(T.marche)}
          <p><b>Models we still remember:</b></p>${chips(T.modelli, 'off')}
          <p><b>Services:</b></p><ul class="ul">${T.servizi.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <p class="h3">${esc(P.titolo)}</p>
          ${chips(P.lista, 'net')}
          <p style="font:11px Verdana,sans-serif">${esc(P.nota)}</p>
        </div>
        <div class="c300">
          ${ad('ad-phones', 'Cell phone corner: contacts backup, ringtones, unlock, screens, chargers. All brands, even the bitten one.', { w: 300, h: 250 })}
          <div style="height:8px"></div>
          ${ad('ad-nonna', 'Nonna’s Tortellini & Tech Support: she will ask if you’ve eaten (does not exist)', { w: 234, h: 60 })}
          <div style="height:8px"></div>
          ${ad('ad-salami', 'Zio Beppe’s Salami & Web Hosting: 99.9% uptime, 100% pork (does not exist)', { w: 234, h: 60 })}
        </div>
      </div>
    `,
    'All brands, all providers, all of 2009',
  )
}

function coupons(lista = A.coupon) {
  return sec(
    'coupons',
    'COUPONS',
    html`
      <div class="in">
        <p style="text-align:center;margin:0 0 8px"><button class="red" type="button" data-print>PRINT THIS PAGE</button> <span style="font:10px Verdana,sans-serif">(coupons only, we r not monsters)</span></p>
        <div class="coupons">
          ${lista.map(
            (c) => html`
              <div class="cp">
                <span class="scis">✂ CUT HERE</span>
                <span class="code">${esc(c.codice)}</span>
                ${i3(c.titolo, 'r', 24)}
                <p>${esc(c.testo)}</p>
                <small>${esc(c.scade)} · not valid with other offers · limit one per customer · pekko reserves the right 2 sigh.</small>
                <span class="bc" aria-hidden="true"></span>
              </div>
            `,
          )}
        </div>
      </div>
    `,
    'print them. screenshot them. just call.',
  )
}

function donate() {
  const P = A.pagamenti
  const S = A.social
  return sec(
    'donate',
    'PAYMENTS, DONATIONS & SHARE',
    html`
      <div class="in cols">
        <div class="c1">
          <p class="h3">${esc(P.titolo)}</p>
          <div class="pay">${P.lista.map((p) => `<span>${esc(p)}</span>`).join('')}</div>
          <div class="dona">
            ${i3(P.donaTitolo, 'y', 28)}
            <p>${esc(P.donaTesto)}</p>
            <a class="pp" href="${A.paypal}" target="_blank" rel="noopener">${esc(P.donaTasto)}</a>
            <p style="font:10px Verdana,sans-serif;color:#555;margin:6px 0 0">${esc(P.donaNota)}</p>
          </div>
          <p class="h3">Share this page (4 real) · <span data-shares-tot>0</span> shares</p>
          ${sharebar()}
          <p class="h3">Link to us!!!</p>
          <p class="note">copy this code and paste it on ur myspace, ur blog or ur geocities page:</p>
          <textarea class="linkus" readonly rows="2" data-select-all aria-label="Banner code">&lt;a href="${esc(PAGINA)}"&gt;&lt;img src="${esc(A.dominio + src('ad-million'))}" alt="Better Call Pekko!" width="468" height="60"&gt;&lt;/a&gt;</textarea>
          <p class="note" style="display:flex;align-items:center;gap:6px">or the 88×31 button ${img('btn-bcp', 'Better Call Pekko!!! 88×31 button', { w: 88, h: 31 })}</p>
          <textarea class="linkus" readonly rows="2" data-select-all aria-label="88×31 button code">&lt;a href="${esc(PAGINA)}"&gt;&lt;img src="${esc(A.dominio + src('btn-bcp'))}" alt="Better Call Pekko!" width="88" height="31"&gt;&lt;/a&gt;</textarea>
        </div>
        <div class="c340">
          <p class="h3">${esc(S.titolo)}</p>
          <div class="soc2">${S.reti.map((r) => `<a href="${r.href}" style="background:${r.colore}"${r.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><b>${esc(r.nome)}</b><small>${esc(r.nota)}</small></a>`).join('')}</div>
          <div class="midlike" style="margin-top:10px">${like('page', 'Like Better Call Pekko')}</div>
        </div>
      </div>
    `,
    'cash, cards, paypal, salami',
  )
}

function extras() {
  return sec(
    'extras',
    'MORE STUFF!!!',
    html`
      <div class="in extras">
        <div class="wid"><h4>Guestbook</h4><a href="#testimonials">sign my guestbook!</a> (<span data-gb-count>${S0.guestbook.length}</span> signatures)<br>add me on msn: <a href="mailto:${A.email}">${esc(A.email)}</a> (its e-mail now lol)<br>bookmark this page (CTRL+D)<br><br><h4>Forum</h4><a href="#forum"><span data-forum-count>${S0.threads.length}</span> topics</a> · <a href="#webcam">shoutbox</a></div>
        <div class="wid"><h4>Hit counter (real)</h4><span class="counter" data-counter>-------</span> visitors since 2006*<br><span data-online>?</span> online now<br><small>*counting started in 2026, dont tell anyone</small><br><br><h4>Badges</h4><div class="badges">${A.badges.map((b) => `<span${/construction/i.test(b) ? ' class="uc"' : ''}>${esc(b)}</span>`)}</div></div>
        <div class="wid"><h4>Philanthropic causes</h4>the save the floppy disk foundation: 1.44 mb of hope. <a href="${A.paypal}" target="_blank" rel="noopener">donate a floppy »</a><br><br><h4>Site map</h4>${A.menu.map((v) => `<a href="${v.href}">${esc(v.label)}</a>`).join(' · ')}</div>
      </div>
      <div class="in" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding-top:0">
        ${ad('ad-million', 'Congratulations!!! You are the 1,000,000th visitor! Click here to claim your prize', { w: 468, h: 60 })}
        ${ad('ad-toolbar', 'Download the Better Call Pekko toolbar — free!', { w: 468, h: 60, attrs: 'data-toolbar' })}
      </div>
    `,
  )
}

export function assistenzaPage() {
  const body = html`
    ${sides()}
    <div class="wrap">
      <div class="adhead">${ad('ad-million', 'Congratulations!!! You are the 1,000,000th visitor! Click here to claim your prize', { w: 468, h: 60, eager: true })}${ad('ad-web-468', 'Need a website? Pekko makes them too!!! 4 real, see them', { w: 468, h: 60, eager: true, href: '#websites' })}</div>
      <a class="hdr" href="${A.contatti}">${img('ad-header', 'Better Call Pekko! Pekko, I’m the computer guy. Want emails from Pekko? Click here!!!', { w: 960, h: 234, eager: true })}</a>
      <div class="content">
        <div class="left">
          ${nav()}
          ${ad('ad-fixed-my-pc', 'Pekko fixed my PC!!!!', { w: 158, h: 155, href: '#testimonials' })}
          ${ad('ad-web-tile', 'Pekko makes websites!!!', { w: 158, h: 155, href: '#websites' })}
          ${ad('ad-ambulance', 'PC ambulance', { w: 150, h: 70 })}
          <p class="sm">SI PARLA ITALIANO<br>${esc(A.telefono)}<br>RIVALTA SUL MINCIO</p>
        </div>
        ${mid()}
        <div class="right">
          ${ad('ad-poster', 'Better Call Pekko: every night at 3 AM on channel 47', { w: 152, h: 378 })}
          <a class="red blink" href="${A.tel}" style="display:block;margin:8px 0 0;width:152px;text-align:center;padding:6px 0">CALL NOW!</a>
          <p class="sm" style="color:#000;text-align:center;width:152px;margin-top:8px">Rivalta sul Mincio (MN)<br>house calls &amp; remote<br><a href="${A.mappa}" target="_blank" rel="noopener">map »</a></p>
          <p class="sm" style="color:#000;text-align:center;width:152px">visitors: <span class="counter" data-counter style="font-size:11px">-------</span></p>
          ${sapevi()}
        </div>
      </div>
      ${img('ad-welcome', 'Welcome, PC abusers!', { w: 960, h: 86, cls: 'welcome' })}
      ${bottom()}
      ${strip()}
      ${websites()}
      ${consultations()}
      ${about()}
      ${prices()}
      ${tv()}
      ${testimonials()}
      ${ecards()}
      ${webcam()}
      ${forum()}
      ${phones()}
      ${coupons()}
      ${donate()}
      ${extras()}
      ${foot()}
    </div>
    ${popup()}
  `
  return shell({ path: A.path, title: A.titolo, description: A.descrizione, body, image: 'ad-header' })
}

// ── /contatti/assistenza/ ────────────────────────────────────────────────────

const field = ({ id, label, type = 'text', required = false, autocomplete, inputmode, hint }) => html`
  <div class="f" data-f>
    <label for="as-${id}">${esc(label)}${required ? ' <b aria-hidden="true">*</b>' : ' <i>(optional)</i>'}</label>
    <input id="as-${id}" name="${id}" type="${type}"${required ? ' required aria-required="true"' : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''} aria-describedby="as-${id}-err">
    ${hint && `<span style="font:10px Verdana,sans-serif;color:#555">${esc(hint)}</span>`}
    <small id="as-${id}-err" role="alert" hidden></small>
  </div>
`

const select = ({ id, label, options, required = false, placeholder }) => html`
  <div class="f" data-f>
    <label for="as-${id}">${esc(label)}${required ? ' <b aria-hidden="true">*</b>' : ' <i>(optional)</i>'}</label>
    <select id="as-${id}" name="${id}"${required ? ' required aria-required="true"' : ''} aria-describedby="as-${id}-err">
      <option value="">${esc(placeholder)}</option>
      ${options.map((o) => `<option>${esc(o)}</option>`)}
    </select>
    <small id="as-${id}-err" role="alert" hidden></small>
  </div>
`

export function assistenzaContattiPage() {
  const C = A.contattiPagina
  const body = html`
    ${sides()}
    <div class="wrap">
      <div class="adhead">${ad('ad-toolbar', 'Download the Better Call Pekko toolbar — free!', { w: 468, h: 60, eager: true, attrs: 'data-toolbar' })}<p data-toolbar-msg hidden style="margin:0 0 0 10px;padding:6px;border:2px solid #003c74;background:#fff;font:bold 11px Tahoma,sans-serif;max-width:300px"></p></div>
      <a class="hdr" href="${A.path}">${img('ad-header', 'Better Call Pekko! Pekko, I’m the computer guy', { w: 960, h: 234, eager: true })}</a>
      <div class="content">
        <div class="left">
          ${nav(A.contatti, A.path)}
          ${ad('ad-fixed-my-pc', 'Pekko fixed my PC!!!!', { w: 158, h: 155, href: `${A.path}#testimonials` })}
          ${ad('ad-web-tile', 'Pekko makes websites!!!', { w: 158, h: 155, href: `${A.path}#websites` })}
          ${ad('ad-ambulance', 'PC ambulance', { w: 150, h: 70, href: A.tel })}
          <p class="sm">SI PARLA ITALIANO</p>
        </div>
        <div class="mid cmid">
          <h1 class="i3 r">${esc(C.titolo)}</h1>
          <p class="ab3" style="text-align:center;font-size:13px">${esc(C.sotto)}</p>
          <a class="i3 b tel" href="${A.tel}">${esc(A.telefono)}</a>
          <div class="acts">
            <a class="red" href="${A.tel}">Call</a>
            <a class="red" href="${A.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
            <a class="red" href="mailto:${A.email}">E-mail</a>
            <a class="pp" href="${A.paypal}" target="_blank" rel="noopener">Donate</a>
          </div>
          <p style="text-align:center"><a href="mailto:${A.email}">${esc(A.email)}</a> · answers within 1 business day · si parla italiano</p>
          <div class="office">
            <div>
              <p class="h3">${esc(C.ufficio)}</p>
              <p><b>PEKKO — I'm the computer guy</b><br>${esc(C.ufficioTesto)}</p>
              <p>${esc(A.telefono)} · <a href="${A.mappa}" target="_blank" rel="noopener">see rivalta on the map</a></p>
            </div>
            <a class="map" href="${A.mappa}" target="_blank" rel="noopener" title="Open the map"><span class="river"></span><span class="road"></span><span class="pin">★</span><span class="lbl">PEKKO HQ<br>Rivalta sul Mincio</span><span class="you">YOU ARE HERE →</span></a>
          </div>
          <p class="h3">How it works</p>
          <ol class="steps">${C.passi.map((p) => `<li>${esc(p)}</li>`)}</ol>
          <p class="h3">Windows &amp; Office versions handled</p>
          ${chips(A.windows)}
          ${chips(A.office, 'off')}
          <p style="font:11px Verdana,sans-serif;color:#7a0000;margin:8px 0 0">windows or office installed and set up free with ur first repair over €50 (with ur own licence — no pirate copies).</p>
          <p class="h3">${esc(A.pagamenti.titolo)}</p>
          <div class="pay">${A.pagamenti.lista.map((p) => `<span>${esc(p)}</span>`).join('')}</div>
        </div>
        <div class="right">
          ${ad('ad-poster', 'Better Call Pekko: every night at 3 AM on channel 47', { w: 152, h: 378, href: A.path })}
          <a class="red blink" href="${A.tel}" style="display:block;margin:8px 0 0;width:152px;text-align:center;padding:6px 0">CALL NOW!</a>
        </div>
      </div>
      ${strip()}
      <section class="sec" id="form">
        <h2>${i3(C.modulo, 'r', 34)}<small>${esc(C.nota)}</small></h2>
        <div class="in frm">
          <form data-saul-form novalidate action="mailto:${A.email}" method="post" enctype="text/plain" data-endpoint="${esc(site.form.endpoint)}" data-mail="${A.email}">
            <div class="form">
              ${field({ id: 'nome', label: 'Your name', required: true, autocomplete: 'name' })}
              ${field({ id: 'email', label: 'Your e-mail', type: 'email', required: true, autocomplete: 'email', inputmode: 'email' })}
              ${field({ id: 'telefono', label: 'Phone', type: 'tel', autocomplete: 'tel', inputmode: 'tel', hint: 'So Pekko can call you back.' })}
              ${select({ id: 'tipo', label: 'What did the computer do?', options: A.tipi, required: true, placeholder: 'Pick your trouble' })}
              ${select({ id: 'urgenza', label: 'How urgent?', options: A.urgenze, placeholder: 'You decide' })}
              <div class="f full" data-f>
                <label for="as-messaggio">Tell Pekko what happened <b aria-hidden="true">*</b></label>
                <textarea id="as-messaggio" name="messaggio" required aria-required="true" minlength="20" maxlength="2000" aria-describedby="as-messaggio-err" placeholder="what computer it is, since when, what u already tried, whether its on fire…"></textarea>
                <small id="as-messaggio-err" role="alert" hidden></small>
              </div>
              <div class="hp" aria-hidden="true"><label for="as-sito">Leave this field empty</label><input id="as-sito" name="sito" type="text" tabindex="-1" autocomplete="off"></div>
              <div class="f full check" data-f>
                <input id="as-privacy" name="privacy" type="checkbox" required aria-required="true" aria-describedby="as-privacy-err">
                <label for="as-privacy">I have read the <a href="${esc(site.url)}/privacy/">privacy policy</a> (it’s in Italian — si parla italiano) and agree to be answered. <b aria-hidden="true">*</b><small id="as-privacy-err" role="alert" hidden></small></label>
              </div>
              ${site.form.turnstileSiteKey && `<div class="f full"><div class="cf-turnstile" data-turnstile data-sitekey="${esc(site.form.turnstileSiteKey)}" data-language="en" data-appearance="interaction-only" data-response-field="false"></div></div>`}
            </div>
            <div class="ffoot" style="display:flex;gap:10px;align-items:center;margin-top:8px">
              <button class="red" type="submit" data-submit style="font-size:16px;padding:8px 18px">${esc(C.invia)}</button>
              <p class="fstatus" data-status role="status" aria-live="polite"></p>
            </div>
            <div class="done" data-done hidden tabindex="-1">
              ${i3(C.fatto, 'r', 24)}
              <p>${esc(C.fattoTesto)} <a href="${A.tel}">${esc(A.telefono)}</a>.</p>
            </div>
          </form>
        </div>
      </section>
      <div style="display:flex;gap:6px;justify-content:space-between;margin:8px 0">
        ${ad('ad-getspace', 'Get $pace now!!! I can prove that virus isn’t yours', { w: 301, h: 389, href: A.path })}
        <div style="display:flex;flex-direction:column;gap:6px">
          ${ad('ad-fashion', 'Pekko’s Outfit: dress like Pekko!', { w: 486, h: 205, href: `${A.path}#about` })}
          <div style="display:flex;gap:6px">${ad('ad-vista', 'Affected by the tragedy of Windows Vista? Pekko can help', { w: 264, h: 187, href: A.tel })}${ad('ad-hermanos', 'Los Backups Hermanos (does not exist)', { w: 222, h: 186, href: A.path })}</div>
        </div>
        <div>${satisfied()}</div>
      </div>
      ${coupons(A.coupon.slice(0, 2))}
      ${foot()}
    </div>
  `
  const head = site.form.turnstileSiteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>' : ''
  return shell({ path: A.contatti, title: A.titoloContatti, description: A.descrizioneContatti, body, image: 'ad-header', head })
}

// ── La 404 di bettercallpekko.it ─────────────────────────────────────────────
// Solo nella build SITE=bcp (routes.js → bcpRoutes): il sito serio ha la sua.

export function assistenzaNotFoundPage() {
  const body = html`
    <div class="wrap" style="padding:40px 0">
      <div class="sec" style="text-align:center;padding:30px 20px">
        ${i3('404?!', 'r', 90)}<br>
        ${i3('PAGE NOT FOUND. BETTER CALL PEKKO!', 'b', 30)}
        <p style="margin:16px 0;font:14px/1.5 Arial,sans-serif">this page doesnt exist. it never did. not even in 2006.<br>the computer guy cant fix a link, but he can fix ur computer.</p>
        <p><a class="red" href="${A.path}">BACK TO THE HOME PAGE</a> &nbsp; <a class="red" href="${A.contatti}">CONTACT PEKKO</a> &nbsp; <a class="red" href="${A.tel}">CALL ${esc(A.telefono)}</a></p>
        <p style="margin-top:14px"><a href="${esc(site.url)}/">The serious website</a> · SI PARLA ITALIANO</p>
        <p style="margin:16px 0 6px;font:12px Verdana,sans-serif">or maybe u were looking 4 one of pekkos websites:</p>
        <div style="display:flex;justify-content:center">${bottoni88()}</div>
      </div>
      ${foot()}
    </div>
  `
  return shell({ path: '/404/', title: '404 — Better Call Pekko', description: 'Page not found. Better call Pekko.', body, image: 'ad-header' })
}

// ── Stile ────────────────────────────────────────────────────────────────────
// 960 px fissi come nel 2008, colori del riferimento: giallo #eae41f del fondo,
// giallo #fdea0a del pannello, blu #5e8eb1 della colonna, rosso #e21212.
// Tutte le Impact sono bianche, bordate del loro colore ed estruse in 3D (.i3).

const EX = (c) => `1px 1px 0 ${c},2px 2px 0 ${c},3px 3px 0 ${c},4px 4px 3px rgba(0,0,0,.45)`

const CSS = `
*{box-sizing:border-box}
html{background:#eae41f}
body{margin:0;min-width:960px;background:#eae41f;color:#000;font:12px/1.35 Arial,Helvetica,sans-serif}
a{color:#0000cc}a:hover{color:#e21212}
img{display:block;border:0}
ul{margin:0;padding:0;list-style:none}
p{margin:0 0 6px}
.wrap{width:960px;margin:0 auto;position:relative;z-index:1}
.i3{font-family:Impact,'Arial Black',sans-serif;text-transform:uppercase;line-height:1;display:inline-block;letter-spacing:.02em;color:#fff;paint-order:stroke fill}
.i3.r{-webkit-text-stroke:2px #e21212;text-shadow:${EX('#8a0000')}}
.i3.b{-webkit-text-stroke:2px #0a35d6;text-shadow:${EX('#001a66')}}
.i3.y{-webkit-text-stroke:2px #f0a500;text-shadow:${EX('#8a5a00')}}
.i3.g{-webkit-text-stroke:2px #1d8b2b;text-shadow:${EX('#0a4a14')}}
.i3.w{-webkit-text-stroke:2px #111;text-shadow:${EX('#000')}}
.ab{font-family:'Arial Black',Arial,sans-serif;font-weight:900}
.ab3{font-family:'Arial Black',Arial,sans-serif;font-weight:900;color:#fff;-webkit-text-stroke:1px #e21212;paint-order:stroke fill;text-shadow:1px 1px 0 #8a0000,2px 2px 0 #7a0000;text-transform:uppercase}
.ab3 a{color:#fff}
.blink{animation:bl 1s steps(2,start) infinite}
@keyframes bl{to{visibility:hidden}}
.fake{display:flex;align-items:center;justify-content:center;text-align:center;padding:6px;background:repeating-linear-gradient(45deg,#ffe83a 0 10px,#ffd400 10px 20px);border:3px double #111;color:#d10a0a;font:bold 11px/1.2 'Arial Black',Arial,sans-serif;text-transform:uppercase}
.ad{display:block}.ad:hover img{outline:2px solid #fff}
.side{position:fixed;top:8px;width:160px;z-index:0;display:flex;flex-direction:column;gap:8px}
.sl{left:calc(50% - 480px - 172px)}.sr{right:calc(50% - 480px - 172px)}
@media (max-width:1319px){.side{display:none}}
.adhead{height:126px;display:flex;align-items:center;justify-content:center}
.hdr{display:block;width:960px;height:234px;background:#fdea0a}
.content{display:flex;width:960px}
.left{width:157px;flex:none;background:#5e8eb1;padding:4px 0 10px;text-align:center}
.nav a{display:block;width:157px;height:34px;margin:0 0 3px;font:19px/32px Impact,'Arial Black',sans-serif;color:#1a1000;text-transform:uppercase;text-decoration:none;text-align:center;background:linear-gradient(#fff36b,#f7d117 50%,#dcae00);border-top:2px solid #fff9c4;border-bottom:3px solid #8a6d00;text-shadow:1px 1px 0 #fff;letter-spacing:.01em;white-space:nowrap;overflow:hidden}
.nav a:hover,.nav a.on{background:linear-gradient(#ffd1d1,#ff6a6a 50%,#c00000);color:#fff;text-shadow:1px 1px 0 #000;border-top-color:#ffb3b3;border-bottom-color:#600}
.left .ad{margin:8px auto 0;width:158px}
.left .ad img,.left .ad .fake{margin:0 auto}
.left .sm{margin:10px 4px 0;font:bold 10px/1.3 Verdana,sans-serif;color:#fff}
.mid{width:640px;flex:none;position:relative;min-height:390px;background:#fdea0a;overflow:hidden}
.mid h1{position:absolute;left:0;top:14px;width:640px;margin:0;text-align:center;font-size:36px}
.vids{position:absolute;left:30px;top:66px;width:350px;display:grid;grid-template-columns:160px 160px;gap:10px 26px}
.vid{display:block;width:160px;text-decoration:none;text-align:center}
.vid img,.vid .fake{border:2px solid #fff;box-shadow:2px 2px 0 rgba(0,0,0,.4)}
.vid b{display:block;margin-top:4px;font:15px/1 Impact,'Arial Black',sans-serif;color:#fff;-webkit-text-stroke:1px #e21212;paint-order:stroke fill;text-shadow:1px 1px 0 #8a0000,2px 2px 0 #7a0000;text-transform:uppercase}
.watch{position:absolute;left:420px;top:66px;width:200px;text-align:center}
.watch .ab3{font-size:13px;line-height:1.2;display:block}
.watch .ad{width:160px;margin:8px auto 6px}
.mid .hot{position:absolute;left:0;top:392px;width:640px;text-align:center}
.mid .hot .i3{display:block}
.mid .hot .tel{text-decoration:none}
.mid .facts{position:absolute;left:20px;top:486px;width:600px;display:flex;gap:10px;font:10px/1.35 Verdana,sans-serif}
.mid .facts div{flex:1;background:#fff8c6;border:1px solid #c9a800;padding:6px}
.mid .facts b{color:#e21212}
.mid .special{position:absolute;left:0;bottom:8px;width:640px;text-align:center;font:italic 13px/1.3 'Comic Sans MS',cursive;color:#7a0000}
.right{width:163px;flex:none;padding:6px 0 0 8px;background:#eae41f}
.logo{display:inline-block;text-align:left}
.logo .s{display:block;font:italic 26px/1 'Brush Script MT',cursive;color:#000;transform:rotate(-3deg);padding-left:6px}
.logo .n{display:block;font:34px/1 Impact,'Arial Black',sans-serif;color:#fff;-webkit-text-stroke:2px #e21212;paint-order:stroke fill;text-shadow:1px 1px 0 #8a0000,2px 2px 0 #8a0000,3px 3px 0 #7a0000;margin-top:2px;text-transform:uppercase;letter-spacing:.03em}
.logo .q{display:block;font:8px/1 'Arial Black',Arial,sans-serif;letter-spacing:.28em;margin-top:4px;padding-left:2px}
.logo.dark .s,.logo.dark .q{color:#fff}
.logo.dark .s{-webkit-text-stroke:1px #000;paint-order:stroke fill}
.welcome{display:block;width:960px;height:86px}
.bottom{display:flex;gap:6px;padding:8px 0 6px}
.bottom .bl{width:301px;flex:none}.bottom .bm{width:486px;flex:none;display:flex;flex-direction:column;gap:6px}.bottom .bm .row{display:flex;justify-content:space-between}.bottom .br{width:159px;flex:none}
.sat{width:159px;height:385px;background:linear-gradient(#111,#2a2a2a 55%,#b08800);padding:10px 6px;text-align:center;border:1px solid #000}
.sat .i3{display:block}
.soc{display:flex;justify-content:center;gap:4px;margin:8px 0}
.soc a{display:block;width:26px;height:26px;font:bold 11px/26px Arial,sans-serif;color:#fff;text-decoration:none;text-align:center;border-radius:3px;border:1px solid rgba(255,255,255,.4)}
.sat .aptv{display:inline-block;margin-top:10px;padding:3px 8px;background:#fff;color:#000;font:bold 10px/1 'Arial Black',Arial,sans-serif}
.strip{margin:2px 0 0;height:30px;overflow:hidden;white-space:nowrap;background:#e21212;color:#ffe600;font:bold 14px/30px 'Arial Black',Arial,sans-serif;letter-spacing:.06em}
.strip span{display:inline-block;padding-left:100%;animation:mq 60s linear infinite}
@keyframes mq{to{transform:translateX(-100%)}}
.sec{background:#fff;border:2px solid #111;margin:8px 0}
.sec h2{margin:0;padding:8px 10px;text-align:center;background-color:#f3c400;background-image:linear-gradient(rgba(0,0,0,.18) 2px,transparent 2px),linear-gradient(90deg,rgba(0,0,0,.18) 2px,transparent 2px),linear-gradient(90deg,rgba(0,0,0,.18) 2px,transparent 2px);background-size:60px 24px,60px 48px,60px 48px;background-position:0 0,0 0,30px 24px;border-bottom:2px solid #111}
.sec h2 small{display:block;margin-top:4px;font:bold 11px/1.2 'Arial Black',Arial,sans-serif;color:#fff;text-shadow:1px 1px 0 #000,2px 2px 0 #000;text-transform:uppercase}
.in{padding:10px}
.cols{display:flex;gap:10px;align-items:flex-start}
.c1{flex:1;min-width:0}.c300{width:300px;flex:none}.c340{width:340px;flex:none}.c400{width:400px;flex:none}
.h3{margin:8px 0 4px;font:17px/1 Impact,'Arial Black',sans-serif;color:#fff;-webkit-text-stroke:1.2px #e21212;paint-order:stroke fill;text-transform:uppercase;text-shadow:1px 1px 0 #8a0000,2px 2px 0 #7a0000;letter-spacing:.02em}
.lead{font:13px/1.4 Arial,sans-serif;margin:0 0 8px}
.ul{margin:0 0 6px 16px;list-style:square;font:11px/1.4 Verdana,sans-serif}
.svc{width:100%;border-collapse:collapse;font:11px/1.3 Verdana,sans-serif}
.svc td{width:50%;padding:3px 6px;border:1px solid #ccc;vertical-align:top}
.svc td:nth-child(odd){background:#fff8c6}
.svc b{color:#e21212;text-transform:uppercase;font-size:11px}
.chips{display:flex;flex-wrap:wrap;gap:3px;margin:4px 0 8px}
.chips span{padding:2px 6px;border:1px solid #000;background:linear-gradient(#fff,#d9e6ff);font:bold 10px/1.2 Arial,sans-serif;color:#0d2560;text-transform:uppercase}
.chips.off span{background:linear-gradient(#fff,#ffd9d9);color:#7a0000}
.chips.net span{background:linear-gradient(#fff,#d9ffd9);color:#0a4a14}
.gift{margin:8px 0 0;padding:8px;border:3px dashed #e21212;background:#fff4b8}
.gift p{margin:6px 0}
.gift small{display:block;margin-top:6px;font:9px/1.3 Verdana,sans-serif;color:#444}
.prof{width:100%;border-collapse:collapse;font:11px/1.35 Verdana,sans-serif;background:#f4f8ff;border:1px solid #6c86b8}
.prof th{width:120px;text-align:left;padding:4px 6px;background:#c9d6ee;border-bottom:1px solid #fff;color:#0d2560;vertical-align:top}
.prof td{padding:4px 6px;border-bottom:1px solid #dde}
.staff{display:flex;gap:8px}
.member{flex:1;text-align:center;border:2px solid #000;background:#fffbd0;padding:8px 4px;font:10px/1.3 Verdana,sans-serif}
.member img,.member .fake{width:96px;height:96px;object-fit:contain;margin:0 auto 4px;background:#fff;border:1px solid #000}
.member b{display:block;font:bold 12px 'Arial Black',Arial,sans-serif;color:#e21212}
.member i{display:block;color:#0d2560}
.top8{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.top8 span{padding:6px;border:1px solid #6c86b8;background:#eef3ff;font:10px/1.3 Verdana,sans-serif;text-align:center}
.top8 b{color:#0000cc}
.album{display:grid;grid-template-columns:repeat(3,100px);gap:6px;justify-content:start}
.album a{display:block;border:2px solid #000;background:#fff;padding:2px}
.album img,.album .fake{width:96px;height:96px;object-fit:contain;object-position:top}
.price{width:100%;border-collapse:collapse;font:11px/1.3 Verdana,sans-serif}
.price th{text-align:left;padding:4px 6px;background:#e21212;color:#fff;font:bold 11px 'Arial Black',Arial,sans-serif;text-transform:uppercase}
.price td{padding:4px 6px;border-bottom:1px dotted #999;vertical-align:middle}
.price tr:nth-child(even) td{background:#fff8c6}
.price td.p{white-space:nowrap;width:90px}
.pay{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}
.pay span{padding:4px 8px;border:1px solid #003c74;border-radius:3px;background:linear-gradient(#fff,#cfe0ff);font:bold 10px/1.2 Verdana,sans-serif;color:#003087;box-shadow:inset 0 0 0 1px #fff}
.dona{margin:8px 0;padding:10px;border:3px solid #003087;background:linear-gradient(#fff,#eef3ff);text-align:center}
.dona p{font:12px/1.4 Arial,sans-serif;margin:6px 0}
.pp{display:inline-block;font:bold italic 16px/1 Verdana,sans-serif;color:#003087;background:linear-gradient(#ffe89a,#ffc439 50%,#f0a500);border:1px solid #c98a00;border-radius:14px;padding:8px 26px;text-decoration:none;box-shadow:0 1px 0 #fff inset,1px 1px 2px rgba(0,0,0,.4)}
.pp:hover{filter:brightness(1.08);color:#003087}
.share{display:flex;flex-wrap:wrap;gap:4px}
.share a{padding:3px 8px;border:1px solid #666;border-radius:3px;background:linear-gradient(#fff,#ddd);font:bold 10px/1.2 Verdana,sans-serif;color:#000;text-decoration:none}
.soc2{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.soc2 a{display:block;padding:6px 8px;border-radius:4px;color:#fff;text-decoration:none;font:bold 12px/1.1 'Trebuchet MS',Verdana,sans-serif;box-shadow:inset 0 12px 0 rgba(255,255,255,.18),1px 1px 0 #000;border:1px solid rgba(0,0,0,.4)}
.soc2 a small{display:block;font:9px/1.2 Verdana,sans-serif;opacity:.9;font-weight:normal}
.tvset{width:392px;padding:22px 36px 30px 30px;background:linear-gradient(#7a4b1e,#5a3512);border:2px solid #2b1a0a;border-radius:8px;position:relative;box-shadow:4px 4px 0 #000}
.tvset .scr{border:6px solid #111;border-radius:12px;background:#000;box-shadow:inset 0 0 20px #000;overflow:hidden}
.tvset .knobs{position:absolute;right:8px;top:30px;width:20px}
.tvset .knobs i{display:block;width:16px;height:16px;margin:0 0 10px;border-radius:50%;background:radial-gradient(#ddd,#666);border:2px solid #222}
.tvset .brand{position:absolute;left:30px;bottom:8px;font:10px/1 'Arial Black',Arial,sans-serif;color:#e8d9b0;letter-spacing:.2em}
.ring{border:2px solid #000;background:#eef;padding:6px;margin:8px 0}
.ring button{display:block;width:100%;margin:3px 0;text-align:left;font:bold 11px/1.2 Tahoma,Verdana,sans-serif;background:linear-gradient(#fff,#dcdcdc);border:1px solid #003c74;border-radius:3px;padding:4px 8px;cursor:pointer}
.ring button:hover{background:#ffe600}
.cmt{display:flex;gap:8px;padding:6px 0;border-bottom:1px dotted #999;font:12px/1.35 Tahoma,Verdana,sans-serif}
.cmt img,.cmt .noav,.cmt .fake{width:48px;height:48px;flex:none;border:1px solid #000;background:#ddd;padding:0;font-size:8px}
.cmt .noav{display:flex;align-items:center;justify-content:center;font:bold 8px Verdana,sans-serif;color:#666;text-align:center}
.cmt b{color:#0000cc}.cmt small{color:#777;font-size:10px}.cmt p{margin:2px 0 0}
.cmt.comic p{font-family:'Comic Sans MS',cursive;color:#800080}
.cmt.mod{background:#fffbd0;padding:6px 4px}.cmt.mod p{font-style:italic}
.xp{font:bold 11px/1 Tahoma,Verdana,sans-serif;color:#000;background:linear-gradient(#fdfdfd,#e3e3e3);border:1px solid #003c74;border-radius:3px;padding:5px 12px;cursor:pointer;box-shadow:inset 0 0 0 1px #fff,1px 1px 0 #888}
.xp:hover{background:linear-gradient(#fff,#fbe58a)}
.red{font:bold 12px/1 'Arial Black',Arial,sans-serif;color:#fff;background:linear-gradient(#ff6a6a,#c00000);border:2px outset #ff9d9d;padding:6px 14px;cursor:pointer;text-transform:uppercase;box-shadow:2px 2px 0 #000;text-decoration:none;display:inline-block;text-shadow:1px 1px 0 #5a0000}
.red:hover{filter:brightness(1.15);color:#fff}
.frmk{margin-top:8px;border:2px solid #000;background:#f4f4f4;padding:8px}
.frmk input,.frmk textarea{font:12px Arial,sans-serif;border:2px inset #999;padding:3px;background:#fff}
.poll{border:2px solid #000;background:#fffbd0;padding:8px;font:11px/1.4 Verdana,sans-serif}
.poll label{display:block}.poll .bar{height:10px;background:linear-gradient(#ff6a6a,#c00000);border:1px solid #000;margin:2px 0 4px;width:0;transition:width .8s}.poll .bar[hidden]{display:none}
.game{border:2px solid #000;background:#e8ffe8;padding:8px;margin:8px 0;text-align:center}
.arena{position:relative;height:130px;background:#dff5df;background-image:linear-gradient(rgba(0,0,0,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.06) 1px,transparent 1px);background-size:20px 20px;border:1px inset #999;overflow:hidden;cursor:crosshair}
.arena img,.arena .fake{position:absolute;width:56px;height:auto;left:120px;top:36px;cursor:pointer;transition:left .2s,top .2s}
.arena .ouch{position:absolute;left:0;top:0;width:100%;text-align:center;font:26px/130px Impact,'Arial Black',sans-serif;color:#fff;-webkit-text-stroke:1.5px #e21212;paint-order:stroke fill;text-shadow:2px 2px 0 #8a0000;pointer-events:none;display:none}
.ecform{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;background:#e21212;color:#fff;font:bold 12px/1 'Arial Black',Arial,sans-serif;text-transform:uppercase;margin:0}
.ecform input,.ecform select{font:12px Arial,sans-serif;border:2px inset #999;padding:3px;width:130px}
.ecform select{width:60px}
.ecgrid{display:grid;grid-template-columns:390px 390px;gap:10px;justify-content:center;padding:14px 10px 10px}
.ec{position:relative}.ec .num{position:absolute;left:-10px;top:-10px;width:38px;height:38px;border-radius:50%;background:#fff;border:2px solid #000;font:bold 16px/34px 'Arial Black',Arial,sans-serif;text-align:center;z-index:1}
.ecdone{margin:10px 10px 0;padding:8px;border:2px solid #000;background:#e6ffd6;font:bold 12px/1.4 Verdana,sans-serif}
.ecdone[hidden]{display:none}
.cam{width:324px;flex:none;border:2px solid #000;background:#333;padding:2px}
.cam .screen{position:relative;width:320px;height:240px;background:#000;overflow:hidden}
.cam .screen img,.cam .screen video,.cam .screen canvas,.cam .screen .fake{position:absolute;display:block}
.cam .still{width:360px;height:240px;left:-20px;top:0}
.cam .walk{width:150px;bottom:0;left:-200px;transition:left 3.2s linear}
.cam video,.cam canvas{left:0;top:0;width:320px;height:240px;object-fit:cover}
.cam canvas{image-rendering:pixelated}
.cam video[hidden],.cam canvas[hidden]{display:none}
.cam .osd{position:absolute;left:6px;top:6px;font:bold 10px/1.3 'Courier New',monospace;color:#fff;text-shadow:1px 1px 0 #000}
.cam .rec{position:absolute;right:8px;top:6px;font:bold 10px/1 Arial,sans-serif;color:#f33;text-shadow:1px 1px 0 #000}
.cam .live{position:absolute;left:6px;bottom:6px;font:bold 10px/1 'Courier New',monospace;color:#0f0;text-shadow:1px 1px 0 #000}
.cam .bar{display:flex;flex-wrap:wrap;gap:3px;padding:4px 2px 2px}
.cam .bar button{font:bold 10px/1 Tahoma,Verdana,sans-serif;background:linear-gradient(#fdfdfd,#cfcfcf);border:1px solid #333;border-radius:2px;padding:4px 6px;cursor:pointer}
.cam .bar button.on{background:#ffe600}
.cam .status{padding:2px 4px 4px;margin:0;font:10px/1.3 Verdana,sans-serif;color:#ffe600}
.cam .shot{padding:4px;background:#222;display:flex;gap:6px;align-items:center}.cam .shot img{width:100px;border:1px solid #fff}.cam .shot[hidden]{display:none}
.chat{border:2px solid #000;background:#fff;font:11px/1.35 Verdana,sans-serif}
.chat .log{height:170px;overflow:auto;padding:6px;background:#f4f8ff}
.chat .log p{margin:0 0 3px}.chat .log b{color:#0000cc}.chat .log b.me{color:#e21212}
.chat form{display:flex;gap:4px;padding:4px;border-top:1px solid #000;background:#ddd;margin:0}
.chat input{flex:1;font:11px Verdana,sans-serif;border:2px inset #999;padding:3px}
.fr{width:100%;border-collapse:collapse;font:11px/1.3 Verdana,sans-serif;background:#f4f8ff;border:1px solid #6c86b8}
.fr th{text-align:left;padding:5px 6px;background:linear-gradient(#c9d6ee,#a4b8dc);border-bottom:1px solid #6c86b8;color:#0d2560;font:bold 11px Verdana,sans-serif}
.fr td{padding:5px 6px;border-bottom:1px solid #dde;vertical-align:top}
.fr tr:nth-child(even) td{background:#e8eef7}
.fr td.n{text-align:center}
.fr .ico{font-size:12px}
.fr em{font:bold 9px Verdana,sans-serif;color:#fff;background:#e21212;padding:1px 4px;border-radius:2px;font-style:normal}
.fr tr.sticky td{background:#fff8c6}
.fr tr.locked:not(.sticky) td a{color:#777;text-decoration:line-through}
.fr small{color:#777;font-size:9px}
.coupons{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cp{position:relative;border:3px dashed #000;background:#fff;padding:12px 140px 10px 14px;min-height:150px}
.cp p{margin:4px 0;font:12px/1.3 Arial,sans-serif}.cp small{display:block;font:9px/1.3 Verdana,sans-serif;color:#555}
.cp .code{position:absolute;right:12px;top:10px;padding:3px 6px;border:1px solid #000;font:bold 12px 'Courier New',monospace;background:#ffe600}
.cp .bc{position:absolute;right:12px;bottom:10px;width:120px;height:28px;background:repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 4px,#000 4px 5px,#fff 5px 8px,#000 8px 11px,#fff 11px 13px)}
.cp .scis{position:absolute;left:8px;top:-9px;font:10px Arial,sans-serif;background:#fff;padding:0 4px}
.extras{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.wid{border:2px solid #000;background:#f4f4f4;padding:8px;font:11px/1.4 Verdana,sans-serif}
.wid h4{margin:0 0 4px;font:bold 12px/1 'Arial Black',Arial,sans-serif;color:#0d2560;text-transform:uppercase}
.badges{display:flex;flex-wrap:wrap;gap:4px}
.badges span{display:inline-block;padding:2px 6px;border:1px solid #000;font:bold 8px/1.4 Verdana,sans-serif;background:linear-gradient(#fff,#ccc);text-transform:uppercase}
.badges span.uc{background:repeating-linear-gradient(45deg,#ffe600 0 8px,#000 8px 16px);color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000}
.counter{display:inline-block;padding:3px 6px;background:#000;color:#3f3;font:bold 14px/1 'Courier New',monospace;letter-spacing:.15em;border:2px inset #666}
.foot{margin:8px 0 20px;padding:10px;background:#e21212;color:#fff;text-align:center;font:11px/1.5 Verdana,sans-serif;border:2px solid #000}
.foot a{color:#ffe600}.foot .cause{font:bold 13px/1.3 'Arial Black',Arial,sans-serif;text-transform:uppercase}.foot .cause a{color:#fff}
.foot .addr{font-weight:bold}
.foot .credit{margin-top:6px;font-weight:bold}
.foot .fdr{margin-top:8px}.foot .fdr img{display:inline-block;vertical-align:middle;width:224px;height:20px}
.pop{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7)}
.pop[hidden]{display:none}
.win{width:560px;max-width:96vw;background:#ece9d8;border:1px solid #0831d9;border-radius:8px 8px 0 0;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden;font-family:Tahoma,Verdana,sans-serif}
.win .bar{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;background:linear-gradient(#3b78e7,#0a49d4 40%,#0a3fb8);color:#fff;font:bold 12px/1 Tahoma,Verdana,sans-serif;text-shadow:1px 1px 0 #0a2a7a}
.win .bar span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.win .x{width:21px;height:21px;border:1px solid #fff;border-radius:3px;background:linear-gradient(#e8836a,#c93a17);color:#fff;font:bold 13px/1 Tahoma,sans-serif;cursor:pointer;padding:0}
.win .body{display:flex;gap:12px;padding:12px;align-items:center}
.win .body img,.win .body .fake{width:170px;height:auto;flex:none}
.win h2{margin:0 0 6px;font-size:40px}
.win p{font:12px/1.4 Tahoma,Verdana,sans-serif;margin:0 0 10px}
.win .acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.win .no{display:block;margin-top:10px;font:10px Tahoma,Verdana,sans-serif;color:#555;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}
.win .eula{max-height:300px;overflow:auto;font:11px/1.4 'Times New Roman',serif;padding:10px;background:#fff;border:1px inset #999}
.win .eula p{margin:0 0 6px}
.has-popup{overflow:hidden}
.mid.cmid{height:auto;padding:14px 20px}
.cmid h1{position:static;width:auto;font-size:34px;display:block;margin:0 0 4px}
.cmid .tel{display:block;text-align:center;font-size:44px;text-decoration:none;margin:6px 0}
.cmid .acts{display:flex;gap:8px;justify-content:center;align-items:center;margin:8px 0}
.office{display:flex;gap:10px;align-items:stretch;margin:8px 0;padding:8px;border:2px solid #000;background:#fff8c6;font:12px/1.4 Arial,sans-serif}
.office>div{flex:1}
.map{position:relative;width:220px;flex:none;border:2px solid #000;background:#e9f0d8;background-image:linear-gradient(rgba(0,0,0,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.08) 1px,transparent 1px);background-size:22px 22px;overflow:hidden;text-decoration:none;display:block;min-height:150px}
.map .river{position:absolute;left:-20px;top:20px;width:300px;height:26px;background:#7fbfff;transform:rotate(-12deg);border:1px solid #3a8ad8}
.map .road{position:absolute;left:100px;top:-10px;width:10px;height:200px;background:#ddd;border-left:2px dashed #999;transform:rotate(18deg)}
.map .pin{position:absolute;left:96px;top:70px;font:28px/1 Arial,sans-serif;color:#e21212;text-shadow:1px 1px 0 #000}
.map .lbl{position:absolute;left:124px;top:78px;font:bold 10px/1.2 Verdana,sans-serif;color:#000;background:#fff;border:1px solid #000;padding:2px 4px}
.map .you{position:absolute;left:8px;bottom:8px;font:bold 9px Verdana,sans-serif;color:#e21212}
.steps{margin:6px 0 0 20px;padding:0;font:12px/1.4 Arial,sans-serif}.steps li{margin:0 0 4px}
.frm{background:#eef}
.form{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
.f label{display:block;font:bold 11px/1.2 Verdana,sans-serif;margin:0 0 2px}.f label i{font-weight:normal;color:#555}.f label b{color:#e21212}
.f input,.f select,.f textarea{width:100%;font:12px Arial,sans-serif;border:2px inset #999;padding:4px;background:#fff}
.f textarea{min-height:100px;resize:vertical}
.f.full{grid-column:1/-1}
.f.bad input,.f.bad select,.f.bad textarea{border-color:#e21212;background:#fff0f0}
.f small{display:block;color:#b00000;font:bold 10px Verdana,sans-serif;margin-top:2px}.f small[hidden]{display:none}
.f.check{display:flex;gap:6px;align-items:flex-start}.f.check input{width:auto;margin-top:2px}.f.check label{font-weight:normal}
.hp{position:absolute;left:-9999px}
.fstatus{font:bold 11px Verdana,sans-serif;color:#b00000;margin:0}
.done{padding:10px;border:3px double #000;background:#e6ffd6;font:12px/1.4 Verdana,sans-serif}
.done[hidden]{display:none}
.frm.is-loading .red{opacity:.7;pointer-events:none}
.frm.is-done .form,.frm.is-done .ffoot{display:none}
@media print{.left,.right,.side,.adhead,.hdr,.bottom,.strip,.pop,.welcome,.foot,.sec:not(#coupons){display:none!important}body{background:#fff}.wrap{width:auto}}
@media (prefers-reduced-motion:reduce){.blink,.strip span{animation:none}.strip span{padding-left:0}.cam .walk{transition:none}}
.mid{min-height:880px}
.saul{position:absolute;left:20px;top:484px;width:600px;margin:0;padding:10px 14px;background:#fff8c6;border:2px solid #c9a800;box-shadow:3px 3px 0 rgba(0,0,0,.25);font:italic 13px/1.45 Georgia,'Times New Roman',serif;color:#3a2600}
.saul p{margin:0 0 4px}.saul cite{font:bold 10px Verdana,sans-serif;color:#7a0000;font-style:normal}
.mid .midlike{position:absolute;left:20px;top:612px;width:600px;text-align:center;font:11px Verdana,sans-serif}
.mid .latest{position:absolute;left:20px;top:650px;width:600px}
.mid .latest .ab3{margin:0 0 6px;text-align:center;font-size:14px}
.lts{display:flex;gap:8px}
.lts a{display:block;flex:1;min-width:0;padding:3px;border:1px solid #23466f;border-radius:5px 5px 2px 2px;background:#eef1f5;box-shadow:2px 2px 0 rgba(0,0,0,.3);text-decoration:none;text-align:center}
.lts a:hover{outline:2px solid #e21212}
.lts .bar{display:flex;justify-content:flex-end;gap:2px;height:10px;margin:-3px -3px 3px;padding:2px 3px;border-radius:5px 5px 0 0;background:linear-gradient(#7fa3cc,#23466f)}
.lts .bar i{width:8px;height:6px;border-radius:1px;background:#cfe0f5}.lts .bar i:last-child{background:#e2553a}
.lts img{display:block;width:100%;height:auto;aspect-ratio:186/116;object-fit:cover;object-position:top;border:1px solid #9fb3cc}
.lts b{display:block;margin-top:3px;font:bold 11px Tahoma,Verdana,sans-serif;color:#0a35d6}
.mid .special{bottom:10px}
.lk{display:inline-flex;align-items:center;gap:4px;font:11px 'Lucida Grande',Tahoma,Verdana,sans-serif;color:#333}
.lk button,.suit button{font:bold 11px 'Lucida Grande',Tahoma,sans-serif;color:#3b5998;background:linear-gradient(#fff,#e6eaf2);border:1px solid #9aa9c8;border-radius:2px;padding:2px 6px;cursor:pointer}
.lk button:hover,.suit button:hover{background:#d8dfea}
.lk button.on,.suit button.on{background:#3b5998;color:#fff;border-color:#29447e}
.lk b{color:#3b5998}.lk small{font-size:10px;color:#666}
.album .suit{border:2px solid #000;background:#fff;padding:2px;text-align:center}
.album .suit img,.album .suit .fake{width:96px;height:96px;object-fit:contain;object-position:top;display:block}
.album .suit button{margin:2px 0 1px;width:100%}
.album .suit button b{color:inherit}
.sharebar{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}
.sharebar a{display:inline-block;padding:5px 8px;border-radius:3px;color:#fff;text-decoration:none;font:bold 11px Tahoma,Verdana,sans-serif;box-shadow:inset 0 10px 0 rgba(255,255,255,.15),1px 1px 0 #000;border:1px solid rgba(0,0,0,.35)}
.sharebar a:hover{filter:brightness(1.15);color:#fff}
.sharebar a b{display:inline-block;margin-left:2px;padding:0 4px;background:#fff;color:#000;border-radius:2px;font-size:10px}
.note{font:10px/1.35 Verdana,sans-serif;color:#555;margin:2px 0 6px}
.st{font:bold 11px Verdana,sans-serif}.st.ok{color:#1d8b2b}.st.err{color:#c00}
.frmk{margin:0 0 8px}
.frmk .row2{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.frmk input.nm{width:150px}
.frmk textarea{width:100%;font:12px Arial,sans-serif;border:2px inset #999;padding:3px}
.frmk select{font:12px Arial,sans-serif}
.avprev img{width:32px;height:32px;border:1px solid #000;vertical-align:middle}
input.hp{position:absolute;left:-9999px;width:1px;height:1px}
.thread{margin:8px 0;border:2px solid #6c86b8;background:#fff}
.thread h3{margin:0;padding:6px 8px;background:linear-gradient(#c9d6ee,#a4b8dc);font:bold 13px Verdana,sans-serif;color:#0d2560;display:flex;justify-content:space-between;align-items:center;gap:8px}
.post{display:flex;border-top:1px solid #dde}
.post .who{width:140px;flex:none;padding:6px;background:#e8eef7;font:bold 11px Verdana,sans-serif;color:#0000cc;word-break:break-word}
.post .who small{display:block;font-weight:normal;color:#777;font-size:9px}
.post .who small.mod{color:#c00;font-weight:bold}
.post .txt{padding:6px 8px;font:12px/1.45 Verdana,sans-serif;white-space:pre-wrap;word-break:break-word}
.thread form{padding:6px 8px;border-top:1px solid #dde;background:#f4f8ff;margin:0}
.thread form p{margin:4px 0}
.thread form textarea{width:100%;font:12px Arial,sans-serif;border:2px inset #999;padding:3px}
.thread form input.nm{width:150px;font:12px Arial,sans-serif;border:2px inset #999;padding:3px}
.thread .note{padding:6px 8px;margin:0}
.fr em.new{background:#1d8b2b}
.scores{margin:4px 0 0 22px;padding:0;font:11px Verdana,sans-serif;text-align:left}
.scores li{margin:0 0 2px}
.poll .pct{color:#c00;font-weight:bold}
.chat .log p small{color:#999;font-size:9px}
.chat input.nm{flex:0 0 90px;width:90px}
.eclink{width:100%;font:12px 'Courier New',monospace;border:2px inset #999;padding:3px}
.eclike{background:#fff;padding:3px 6px;border:1px solid #ccc;border-top:0}
.ecdone .sharebar{margin:6px 0 0}
.linkus{width:100%;font:11px 'Courier New',monospace;border:2px inset #999;padding:4px;resize:none}
.bcp-off .frmk,.bcp-off [data-shout-form],.bcp-off [data-post-form]{opacity:.55}
.adhead{gap:10px}
.nav a{position:relative}
.nav .nw{position:absolute;right:3px;top:1px;padding:1px 3px;border-radius:2px;background:#e21212;color:#fff;font:bold 8px/1.2 Verdana,sans-serif;font-style:normal;text-shadow:none;transform:rotate(8deg)}
.nav a:hover .nw,.nav a.on .nw{background:#ffe600;color:#000}
.dyk{width:152px;margin-top:8px;border:2px solid #000;background:#fff;padding:6px;font:10px/1.35 Verdana,sans-serif;text-align:left}
.dyk h4{margin:0 0 4px;font:bold 11px 'Arial Black',Arial,sans-serif;color:#e21212}
.dyk p{margin:0 0 6px;min-height:68px}
.dyk .xp{padding:3px 8px;font-size:10px}
.ad.full img,img.full{width:100%;height:auto}
.c160{width:160px;flex:none}.c486{width:486px;flex:none}
.pex{border:1px solid #23466f;border-radius:7px 7px 3px 3px;background:#eef1f5;box-shadow:3px 3px 0 rgba(0,0,0,.35);overflow:hidden;font:11px Tahoma,Verdana,sans-serif}
.pex-title{display:flex;align-items:center;gap:4px;height:24px;padding:0 5px 0 10px;background:linear-gradient(#7fa3cc,#3b6394 48%,#23466f 52%,#3a6aa0);color:#fff;font:bold 12px Tahoma,Verdana,sans-serif;text-shadow:0 1px 1px #0b2340}
.pex-title span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pex-title i{width:22px;height:15px;border:1px solid #1c3a63;border-radius:3px;background:linear-gradient(#e2edfa,#7fa3cc)}
.pex-title i.x{background:linear-gradient(#ff9d8a,#d42a12);border-color:#6b0f0f}
.pex-tabs{display:flex;gap:2px;padding:4px 6px 0;background:linear-gradient(#dfe7f1,#c9d6e6);border-bottom:1px solid #8aa0bd}
.pex-tabs button{max-width:132px;padding:4px 9px;border:1px solid #8aa0bd;border-bottom:0;border-radius:4px 4px 0 0;background:linear-gradient(#f4f7fb,#d5e0ee);font:11px Tahoma,Verdana,sans-serif;color:#000;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pex-tabs button:hover{background:linear-gradient(#fff,#e6eef8)}
.pex-tabs button[aria-selected=true]{position:relative;top:1px;background:#fff;font-weight:bold}
.pex-bar{display:flex;align-items:center;gap:4px;padding:4px 6px;background:linear-gradient(#fff,#e6edf5);border-bottom:1px solid #9fb3cc}
.pex-nav{width:24px;height:24px;padding:0;border:1px solid #0b3a7d;border-radius:50%;background:radial-gradient(circle at 40% 30%,#bfe3ff,#3d8ee0 45%,#0f4fa8);color:#fff;font:bold 10px/22px Tahoma,sans-serif;text-align:center;cursor:pointer}
.pex-url{flex:1;height:22px;padding:0 6px;border:1px solid #7f9db9;background:#fff;font:12px/20px Tahoma,Verdana,sans-serif;white-space:nowrap;overflow:hidden}
.pex-go{padding:3px 10px;border:1px solid #1d6b10;border-radius:3px;background:linear-gradient(#9df08a,#3fbf2a 48%,#2a9c18 52%,#4ccb35);color:#fff;font:bold 11px Tahoma,Verdana,sans-serif;text-decoration:none;text-shadow:0 1px 1px #1d6b10}
.pex-go:hover{color:#fff;filter:brightness(1.1)}
.pex-view{height:360px;overflow:auto;background:#fff}
.pex-view img{width:100%;height:auto}
.pex-view [hidden]{display:none}
.pex-view .here{margin:0;padding:140px 10px;text-align:center;background:#fdea0a}
.pex-status{padding:3px 8px;background:#dfe7f1;border-top:1px solid #9fb3cc;font:10px Tahoma,Verdana,sans-serif;color:#333}
.pex-info{margin-top:8px;padding:8px 10px;border:2px solid #000;background:#f4f8ff;font:12px/1.4 Verdana,sans-serif}
.pex-info[hidden]{display:none}
.pex-info h3{margin:0 0 4px;font:bold 17px 'Trebuchet MS',Verdana,sans-serif;color:#0a35d6}
.pex-info h3 small{font:11px Verdana,sans-serif;color:#555}
.pex-info .acts{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 0}
.nums{display:flex;gap:6px;margin:6px 0}
.nums span{flex:1;padding:4px;border:1px solid #6c86b8;background:#fff;text-align:center;font:10px/1.2 Verdana,sans-serif;color:#0d2560}
.nums b{display:block;margin-bottom:2px;font:24px/1 Impact,'Arial Black',sans-serif;color:#e21212}
.webads{display:flex;justify-content:space-between}
.webads>div{width:300px}
.ring2{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px;border:2px ridge #bbb;background:linear-gradient(#fff,#ddd);font:bold 11px Verdana,sans-serif;text-align:center}
.ring2 small{font:9px Verdana,sans-serif;color:#555}
.faq{margin:0;font:11px/1.4 Verdana,sans-serif}
.faq dt{margin-top:6px;font-weight:bold;color:#0a35d6}
.faq dt::before{content:'Q: ';color:#e21212}
.faq dd{margin:2px 0 0 18px}
.cta{display:flex;align-items:center;gap:10px;margin:12px 0 0}
.cta .red{font-size:15px;padding:8px 16px}
.svc.one td{width:auto}
.b88{display:flex;flex-wrap:wrap;gap:6px}
.b88 a,.b88 span,.b88 button{display:block;width:88px;height:31px;padding:0;border:0;background:none}
.b88 button{cursor:pointer}
.b88 a:hover img,.b88 button:hover img{outline:2px solid #e21212}
.win .body .dance{width:160px;height:330px;flex:none;overflow:hidden;border:2px solid #000}
.win .body .dance img{width:160px;height:auto;margin-top:-110px}

`

// ── Script ───────────────────────────────────────────────────────────────────
// Ogni pezzo si attiva solo se trova i propri elementi. Le parti vive parlano con
// api/bcp.js: una visita all'apertura (nuova solo la prima volta nella scheda),
// un aggiornamento ogni 30 s, e ogni azione restituisce lo stato intero. Nomi,
// like e voto si ricordano nel browser; i testi degli utenti entrano nel DOM solo
// con textContent. Pop-up d'ingresso, termini d'uso, toolbar finta, suonerie
// sintetizzate, webcam (che non lascia mai il computer), stampa, modulo contatti.

const JS = `
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = {};
  try { D = JSON.parse(document.getElementById('bcp-data').textContent); } catch (e) {}
  var API = D.api || '/api/bcp';
  var aperta = Date.now();
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var S = null, offline = false, filoAperto = null;

  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var quando = function (ts) { var d = new Date(ts), h = d.getHours(); return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear() + ' ' + pad(h % 12 || 12) + ':' + pad(d.getMinutes()) + ' ' + (h < 12 ? 'AM' : 'PM'); };

  // ── L'API: ogni risposta porta lo stato intero, e la pagina si ridisegna
  function call(body) {
    var opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true } : { method: 'GET' };
    return fetch(API, opt)
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'the server said something weird' }; }); })
      .then(function (j) {
        if (j.offline) { offline = true; document.documentElement.classList.add('bcp-off'); }
        if (j.visits !== undefined) { S = j; render(); }
        return j;
      })
      .catch(function () { return { ok: false, error: 'no internet?? (or the server is on fire)' }; });
  }

  function render() {
    if (!S) return;
    $$('[data-counter]').forEach(function (c) { c.textContent = ('0000000' + S.visits).slice(-7); });
    $$('[data-online]').forEach(function (c) { c.textContent = S.online; });
    $$('[data-likes]').forEach(function (b) { b.textContent = S.likes[b.getAttribute('data-likes')] || 0; });
    var tot = 0;
    for (var k in S.shares) tot += S.shares[k];
    $$('[data-shares]').forEach(function (b) { b.textContent = S.shares[b.getAttribute('data-shares')] || 0; });
    $$('[data-shares-tot]').forEach(function (b) { b.textContent = tot; });
    $$('[data-ecards-tot]').forEach(function (b) { b.textContent = S.ecards; });
    $$('[data-gb-count]').forEach(function (b) { b.textContent = S.guestbook.length; });
    $$('[data-forum-count]').forEach(function (b) { b.textContent = S.threads.length; });
    renderPoll(); renderScores(); renderGb(); renderForum(); renderShout(); segnaLike();
  }

  // ── Nome ricordato nel browser, stato dei moduli, invio
  var nome = LS.get('bcp-name') || '';
  $$('input.nm').forEach(function (i) { if (nome) i.value = nome; });
  function stato(form, testo, ok) {
    var s = $('[data-st]', form) || $('[data-st-shout]');
    if (!s) return;
    s.textContent = testo;
    s.className = 'st ' + (ok ? 'ok' : 'err');
  }
  function invia(form, extra, fatto) {
    var dati = { _t: aperta };
    new FormData(form).forEach(function (v, k) { dati[k] = v; });
    for (var k in extra) dati[k] = extra[k];
    if (dati.name) { nome = dati.name; LS.set('bcp-name', nome); $$('input.nm').forEach(function (i) { if (!i.value) i.value = nome; }); }
    var btn = $('button[type=submit]', form);
    if (btn) btn.disabled = true;
    stato(form, 'sending…', true);
    call(dati).then(function (j) {
      if (btn) btn.disabled = false;
      if (j.ok) { stato(form, 'posted!!! w00t', true); if (fatto) fatto(j); }
      else stato(form, j.error || 'error. better call pekko', false);
    });
  }

  // ── Like (veri) e condivisioni (vere)
  function segnaLike() { $$('[data-like]').forEach(function (b) { b.classList.toggle('on', LS.get('bcp-like-' + b.getAttribute('data-like')) === '1'); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-like]') : null;
    if (b) {
      var k = b.getAttribute('data-like'), chiave = 'bcp-like-' + k, gia = LS.get(chiave) === '1';
      LS.set(chiave, gia ? '0' : '1'); segnaLike();
      call({ a: 'like', k: k, undo: gia }).then(function (j) { if (!j.ok) { LS.set(chiave, gia ? '1' : '0'); segnaLike(); } });
      return;
    }
    var a = e.target.closest ? e.target.closest('[data-share]') : null;
    if (a) {
      var net = a.getAttribute('data-share');
      call({ a: 'share', k: net });
      if (net === 'copy') {
        e.preventDefault();
        var u = a.getAttribute('href');
        var ok = function () { var b2 = a.querySelector('b'); a.firstChild.textContent = 'Copied!!! '; if (b2) a.appendChild(b2); };
        if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok, function () { window.prompt('copy this link:', u); });
        else window.prompt('copy this link:', u);
      }
    }
  });
  $$('[data-select-all]').forEach(function (t) { t.addEventListener('focus', function () { t.select(); }); });

  // ── Sondaggio vero
  var poll = $('[data-poll]');
  function renderPoll() {
    if (!poll || !S) return;
    var tot = 0; S.poll.forEach(function (n) { tot += n; });
    $('[data-poll-tot]', poll).textContent = tot;
    if (LS.get('bcp-voted') === null) return;
    $$('[data-bar]', poll).forEach(function (b) { var i = +b.getAttribute('data-bar'); b.hidden = false; b.style.width = (tot ? Math.round(S.poll[i] * 100 / tot) : 0) + '%'; });
    $$('[data-pct]', poll).forEach(function (s) { var i = +s.getAttribute('data-pct'); s.textContent = (tot ? Math.round(S.poll[i] * 100 / tot) : 0) + '% (' + S.poll[i] + ')'; });
    $('[data-vote]', poll).disabled = true;
    $('[data-poll-msg]', poll).textContent = poll.getAttribute('data-grazie');
  }
  if (poll) $('[data-vote]', poll).addEventListener('click', function () {
    var sel = $('input[name=poll]:checked', poll);
    if (!sel) { $('[data-poll-msg]', poll).textContent = 'pick one! any one.'; return; }
    LS.set('bcp-voted', sel.value);
    call({ a: 'vote', i: +sel.value }).then(function (j) {
      if (!j.ok) { LS.del('bcp-voted'); $('[data-poll-msg]', poll).textContent = j.error || 'vote failed. the nutria ate it'; }
      renderPoll();
    });
  });

  // ── Punch the virus, con la classifica vera
  var game = $('[data-game]');
  function renderScores() {
    var ol = $('[data-scores]');
    if (!ol || !S) return;
    ol.textContent = '';
    if (!S.scores.length) { ol.appendChild(el('li', '', 'no scores yet. be the first!!!')); return; }
    S.scores.forEach(function (s) { var li = el('li'); li.appendChild(el('b', '', s.by)); li.appendChild(document.createTextNode(' — ' + (s.ms / 1000).toFixed(2) + 's')); ol.appendChild(li); });
  }
  if (game) {
    var arena = $('.arena', game), virus = $('img, .fake', arena), ouch = $('.ouch', arena), hitsEl = $('[data-hits]', game), timeEl = $('[data-time]', game), msg = $('[data-game-msg]', game);
    var hits = 0, inizio = 0, orologio = 0, fine = false;
    var muovi = function () { virus.style.left = Math.floor(Math.random() * (arena.clientWidth - 60)) + 'px'; virus.style.top = Math.floor(Math.random() * (arena.clientHeight - 60)) + 'px'; };
    var salta = setInterval(muovi, 700);
    var nuovaPartita = function () { hits = 0; inizio = 0; fine = false; hitsEl.textContent = '0'; timeEl.textContent = '0.00'; msg.textContent = ''; virus.style.transform = ''; clearInterval(salta); salta = setInterval(muovi, 700); };
    arena.addEventListener('click', function (e) {
      if (fine) return;
      if (!inizio) { inizio = Date.now(); orologio = setInterval(function () { timeEl.textContent = ((Date.now() - inizio) / 1000).toFixed(2); }, 50); }
      if (e.target !== virus) return;
      hits++;
      hitsEl.textContent = hits;
      ouch.style.display = 'block';
      setTimeout(function () { ouch.style.display = 'none'; }, 300);
      muovi();
      if (hits < 3) return;
      fine = true;
      var ms = Date.now() - inizio;
      clearInterval(orologio); clearInterval(salta);
      timeEl.textContent = (ms / 1000).toFixed(2);
      virus.style.transform = 'rotate(180deg)';
      msg.textContent = game.getAttribute('data-vinto') + ' ';
      var premio = el('a', '', 'FREE CONSULTATION »'); premio.href = game.getAttribute('data-href'); msg.appendChild(premio);
      msg.appendChild(document.createTextNode(' · '));
      var ancora = el('button', 'xp', 'play again'); ancora.type = 'button'; ancora.addEventListener('click', nuovaPartita); msg.appendChild(ancora);
      setTimeout(function () {
        var n = window.prompt('U DID IT IN ' + (ms / 1000).toFixed(2) + 's!!! enter ur name 4 the hall of fame:', nome);
        if (!n) return;
        nome = n.slice(0, 24); LS.set('bcp-name', nome);
        call({ a: 'score', name: nome, ms: ms }).then(function (j) { if (!j.ok) msg.appendChild(document.createTextNode(' (' + (j.error || 'score not saved') + ')')); });
      }, 350);
    });
  }

  // ── Guestbook vero
  var gbList = $('[data-gb-list]');
  function renderGb() {
    if (!gbList || !S) return;
    gbList.textContent = '';
    S.guestbook.forEach(function (g) {
      var c = el('div', 'cmt');
      if (g.av && D.avatars && D.avatars[g.av]) { var im = el('img'); im.src = D.avatars[g.av]; im.alt = g.by + "'s webcam photo"; im.width = 48; im.height = 48; im.loading = 'lazy'; c.appendChild(im); }
      else c.appendChild(el('span', 'noav', 'no photo'));
      var d = el('div');
      d.appendChild(el('b', '', g.by)); d.appendChild(document.createTextNode(' ')); d.appendChild(el('small', '', quando(g.ts)));
      d.appendChild(el('p', '', g.text));
      c.appendChild(d); gbList.appendChild(c);
    });
  }
  var gbForm = $('[data-gb-form]');
  if (gbForm) {
    var avSel = $('[data-av-select]', gbForm), avPrev = $('[data-av-prev]', gbForm);
    var anteprima = function () { avPrev.textContent = ''; var v = avSel.value; if (v !== '0' && D.avatars && D.avatars[v]) { var im = el('img'); im.src = D.avatars[v]; im.alt = ''; avPrev.appendChild(im); } };
    avSel.addEventListener('change', anteprima);
    gbForm.addEventListener('submit', function (e) { e.preventDefault(); invia(gbForm, { a: 'gb', av: +avSel.value }, function () { gbForm.elements.text.value = ''; }); });
  }

  // ── Forum vero: discussioni, risposte, argomenti nuovi
  var tbody = $('[data-forum]'), filo = $('[data-thread]');
  var ultima = function (t) { return t.posts[t.posts.length - 1]; };
  function renderForum() {
    if (!tbody || !S) return;
    var lista = S.threads.slice().sort(function (a, b) { if (!!b.sticky !== !!a.sticky) return b.sticky ? 1 : -1; return ultima(b).ts - ultima(a).ts; });
    tbody.textContent = '';
    lista.forEach(function (t) {
      var tr = el('tr', (t.sticky ? 'sticky' : '') + (t.locked ? ' locked' : ''));
      var td = el('td');
      td.appendChild(el('span', 'ico', t.locked ? '🔒' : t.sticky ? '📌' : t.hot ? '🔥' : '📄'));
      td.appendChild(document.createTextNode(' '));
      var a = el('a', '', t.title); a.href = '#forum'; a.setAttribute('data-thread-open', t.id); td.appendChild(a);
      if (t.hot) { td.appendChild(document.createTextNode(' ')); td.appendChild(el('em', '', 'HOT')); }
      if (Date.now() - ultima(t).ts < 86400000) { td.appendChild(document.createTextNode(' ')); td.appendChild(el('em', 'new', 'NEW!')); }
      tr.appendChild(td);
      tr.appendChild(el('td', '', t.by));
      tr.appendChild(el('td', 'n', String(t.posts.length - 1)));
      var ul = el('td'); ul.appendChild(document.createTextNode(quando(ultima(t).ts))); ul.appendChild(el('br')); ul.appendChild(el('small', '', 'by ' + ultima(t).by)); tr.appendChild(ul);
      tbody.appendChild(tr);
    });
    if (filoAperto) apriFilo(filoAperto, true);
  }
  function apriFilo(id, silenzioso) {
    if (!filo) return;
    var fonte = S ? S.threads : [];
    var t = null;
    fonte.forEach(function (x) { if (x.id === id) t = x; });
    if (!t) return;
    filoAperto = id;
    var bozza = filo.querySelector('textarea') ? filo.querySelector('textarea').value : '';
    filo.textContent = '';
    filo.hidden = false;
    var h = el('h3', '', t.title + '  '); var chiudi = el('button', 'xp', 'close ✕'); chiudi.type = 'button'; chiudi.addEventListener('click', function () { filo.hidden = true; filoAperto = null; }); h.appendChild(chiudi); filo.appendChild(h);
    t.posts.forEach(function (p) {
      var r = el('div', 'post');
      var w = el('div', 'who', p.by); w.appendChild(el('small', '', quando(p.ts))); if (p.by === 'pekko') w.appendChild(el('small', 'mod', '★ admin'));
      r.appendChild(w); r.appendChild(el('div', 'txt', p.text)); filo.appendChild(r);
    });
    if (t.locked) filo.appendChild(el('p', 'note', '🔒 topic locked. call pekko instead.'));
    else {
      var f = el('form');
      var n = el('input', 'nm'); n.name = 'name'; n.maxLength = 24; n.placeholder = 'ur name'; n.required = true; n.value = nome;
      var ta = el('textarea'); ta.name = 'text'; ta.rows = 3; ta.maxLength = 600; ta.placeholder = 'reply…'; ta.required = true; ta.value = bozza;
      var hp = el('input', 'hp'); hp.name = 'sito'; hp.tabIndex = -1; hp.setAttribute('aria-hidden', 'true'); hp.autocomplete = 'off';
      var b = el('button', 'red', 'POST REPLY'); b.type = 'submit';
      var st = el('span', 'st'); st.setAttribute('data-st', '');
      var p1 = el('p'); p1.appendChild(n); f.appendChild(p1); f.appendChild(ta); f.appendChild(hp);
      var p2 = el('p'); p2.appendChild(b); p2.appendChild(document.createTextNode(' ')); p2.appendChild(st); f.appendChild(p2);
      f.addEventListener('submit', function (e) { e.preventDefault(); invia(f, { a: 'reply', id: id }, function () { var t2 = filo.querySelector('textarea'); if (t2) t2.value = ''; }); });
      filo.appendChild(f);
    }
    if (!silenzioso) filo.scrollIntoView({ block: 'nearest' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-thread-open]') : null;
    if (!a) return;
    e.preventDefault();
    if (!S) { window.alert('the forum is loading… (or the database is on vacation)'); return; }
    apriFilo(a.getAttribute('data-thread-open'));
  });
  var postForm = $('[data-post-form]');
  if (postForm) postForm.addEventListener('submit', function (e) {
    e.preventDefault();
    invia(postForm, { a: 'post' }, function (j) {
      postForm.elements.title.value = ''; postForm.elements.text.value = '';
      var nuovo = null; j.threads.forEach(function (t) { if (!t.sticky && (!nuovo || t.ts > nuovo.ts)) nuovo = t; });
      if (nuovo) apriFilo(nuovo.id);
    });
  });

  // ── Shoutbox vera
  var shout = $('[data-shout-list]');
  function renderShout() {
    if (!shout || !S) return;
    var giu = shout.scrollTop + shout.clientHeight >= shout.scrollHeight - 20;
    shout.textContent = '';
    S.shout.forEach(function (s) {
      var p = el('p'); var b = el('b', s.by === 'pekko' ? 'me' : '', s.by + ':');
      p.appendChild(b); p.appendChild(document.createTextNode(' ' + s.text + ' ')); p.appendChild(el('small', '', quando(s.ts)));
      shout.appendChild(p);
    });
    if (giu) shout.scrollTop = shout.scrollHeight;
  }
  if (shout) shout.scrollTop = shout.scrollHeight;
  var shForm = $('[data-shout-form]');
  if (shForm) shForm.addEventListener('submit', function (e) { e.preventDefault(); invia(shForm, { a: 'shout' }, function () { shForm.elements.text.value = ''; shout.scrollTop = shout.scrollHeight; }); });

  // ── E-card vere: un link da mandare, che all'amico apre la cartolina
  var ec = $('[data-ecard]');
  if (ec) ec.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = ec.elements.n.value, to = ec.elements.to.value.trim(), from = ec.elements.from.value.trim();
    var url = (D.pagina || location.origin + '/') + '?ecard=' + n + '&to=' + encodeURIComponent(to) + '&from=' + encodeURIComponent(from);
    var box = $('[data-ecard-done]');
    $('[data-ecard-link]', box).value = url;
    var t = from + ' sent u an e-card from Better Call Pekko!!! open it: ';
    var reti = [
      ['whatsapp', 'WhatsApp', '#25a244', 'https://wa.me/?text=' + encodeURIComponent(t + url)],
      ['email', 'E-mail', '#666', 'mailto:?subject=' + encodeURIComponent('u got an e-card!!!') + '&body=' + encodeURIComponent(t + url)],
      ['telegram', 'Telegram', '#2aa3df', 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(t)],
      ['facebook', 'Facebook', '#3b5998', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)],
      ['copy', 'Copy link', '#111', url]
    ];
    var bar = $('[data-ecard-share]', box); bar.textContent = '';
    reti.forEach(function (r) { var a = el('a', '', r[1] + ' '); a.href = r[3]; a.style.background = r[2]; a.setAttribute('data-share', r[0]); if (r[0] !== 'copy' && r[0] !== 'email') { a.target = '_blank'; a.rel = 'noopener'; } bar.appendChild(a); });
    box.hidden = false;
    box.scrollIntoView({ block: 'nearest' });
    call({ a: 'ecard' });
  });
  var q = null;
  try { q = new URLSearchParams(location.search); } catch (e) {}
  var ecPop = $('[data-ecard-pop]');
  var ecN = q ? parseInt(q.get('ecard'), 10) : 0;
  if (ecPop && ecN >= 1 && ecN <= 6) {
    var da = (q.get('from') || 'someone').slice(0, 30), a2 = (q.get('to') || 'u').slice(0, 30);
    $('[data-ecard-title]', ecPop).textContent = da + ' SENT U AN E-CARD!!!';
    var box2 = $('[data-ecard-img]', ecPop);
    if (D.ecards && D.ecards[ecN - 1]) { var im2 = el('img'); im2.src = D.ecards[ecN - 1]; im2.alt = 'E-card #' + ecN; im2.width = 390; im2.height = 270; box2.appendChild(im2); }
    $('[data-ecard-msg]', ecPop).textContent = 'to: ' + a2 + ' · from: ' + da + ' · delivered by Better Call Pekko (faster than snail express)';
    ecPop.hidden = false;
    $$('[data-ecard-close]', ecPop).forEach(function (b) { b.addEventListener('click', function () { ecPop.hidden = true; }); });
  }

  // ── Pop-up d'ingresso: una volta per scheda (non se si arriva da una e-card)
  var pop = $('[data-popup]');
  if (pop) {
    var KEY = 'ap:bcp-popup';
    var visto = !!(ecPop && !ecPop.hidden);
    try { visto = visto || sessionStorage.getItem(KEY) === '1'; } catch (e) {}
    var apri = function () { pop.hidden = false; document.body.classList.add('has-popup'); var f = $('[data-popup-focus]', pop); if (f) f.focus(); };
    var chiudi = function () { pop.hidden = true; document.body.classList.remove('has-popup'); try { sessionStorage.setItem(KEY, '1'); } catch (e) {} };
    if (!visto) apri();
    $$('[data-popup-close]', pop).forEach(function (b) { b.addEventListener('click', chiudi); });
    pop.addEventListener('click', function (e) { if (e.target === pop) chiudi(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) chiudi(); });
  }

  var eula = $('[data-eula-pop]');
  if (eula) {
    $$('[data-eula]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); eula.hidden = false; }); });
    $$('[data-eula-close]', eula).forEach(function (b) { b.addEventListener('click', function () { eula.hidden = true; }); });
    eula.addEventListener('click', function (e) { if (e.target === eula) eula.hidden = true; });
  }

  $$('[data-toolbar]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var m = $('[data-toolbar-msg]');
      if (!m) return;
      m.textContent = 'toolbar installed successfully! restart ur computer 4 times 2 complete. (nothing was installed. better call pekko.)';
      m.hidden = false;
      m.scrollIntoView({ block: 'nearest' });
    });
  });

  // ── Suonerie: sintetizzate al volo
  var actx = null;
  var audio = function () { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; if (!actx) actx = new C(); if (actx.state === 'suspended') actx.resume(); return actx; };
  var gain = function (c, v) { var g = c.createGain(); g.gain.value = v; g.connect(c.destination); return g; };
  var tone = function (c, g, f, t0, d, type) { var o = c.createOscillator(); o.type = type || 'sine'; o.frequency.value = f; o.connect(g); o.start(t0); o.stop(t0 + d); };
  var noise = function (c, g, t0, d, fq) { var b = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), data = b.getChannelData(0); for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6; var s = c.createBufferSource(); s.buffer = b; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = 0.7; s.connect(f); f.connect(g); s.start(t0); s.stop(t0 + d); };
  var SUONI = {
    modem: function (c) { var t = c.currentTime, g = gain(c, 0.12); tone(c, g, 350, t, 0.7); tone(c, g, 440, t, 0.7); [[697, 1209], [770, 1336], [852, 1477], [941, 1336], [697, 1477], [770, 1209]].forEach(function (p, i) { tone(c, g, p[0], t + 0.8 + i * 0.16, 0.11); tone(c, g, p[1], t + 0.8 + i * 0.16, 0.11); }); tone(c, g, 2100, t + 2, 0.9); tone(c, g, 1800, t + 3, 0.25, 'square'); tone(c, g, 2250, t + 3.3, 0.25, 'square'); tone(c, g, 1200, t + 3.6, 0.5, 'sawtooth'); noise(c, g, t + 4.2, 2.2, 1500); },
    printer: function (c) { var t = c.currentTime, g = gain(c, 0.15); for (var i = 0; i < 14; i++) tone(c, g, 60 + Math.random() * 40, t + i * 0.12, 0.08, 'sawtooth'); tone(c, g, 1000, t + 1.8, 0.4, 'square'); tone(c, g, 1000, t + 2.4, 0.4, 'square'); },
    fax: function (c) { var t = c.currentTime, g = gain(c, 0.12); for (var i = 0; i < 6; i++) { tone(c, g, 1100, t + i * 0.6, 0.3); tone(c, g, 2100, t + i * 0.6 + 0.3, 0.3); } },
    error: function (c) { var t = c.currentTime, g = gain(c, 0.15); for (var i = 0; i < 6; i++) tone(c, g, 800, t + i * 0.35, 0.15, 'square'); }
  };
  $$('[data-suono]').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = audio();
      if (!c) { b.textContent = 'no sound. have u tried turning it off and on again?'; return; }
      try { SUONI[b.getAttribute('data-suono')](c); } catch (e) {}
      var n = b.textContent.replace(/^[▶♪] /, '');
      b.textContent = '♪ ' + n;
      setTimeout(function () { b.textContent = '▶ ' + n; }, 4500);
    });
  });

  // ── Office webcam: finto ufficio con Pekko che passa, o la webcam vera (che resta sul computer)
  var cam = $('[data-cam]');
  if (cam) {
    var screen = $('[data-cam-screen]', cam), still = $('.still', cam), walk = $('[data-cam-walk]', cam), video = $('[data-cam-video]', cam), canvas = $('[data-cam-canvas]', cam), status = $('[data-cam-status]', cam), clock = $('[data-cam-clock]', cam), live = $('[data-cam-live]', cam), shotbox = $('[data-cam-shotbox]', cam);
    var walkers = (cam.getAttribute('data-cam-walkers') || '').split(',').filter(Boolean);
    var stream = null, filter = 'normal', raf = 0;
    var statoCam = function (t) { status.textContent = t || ((S ? S.online : '?') + ' ppl online now · stream quality: 56k'); };
    var FILTERS = { normal: '', sepia: 'sepia(1) contrast(1.2)', negative: 'invert(1)', thermal: 'hue-rotate(200deg) saturate(4) contrast(1.4)', mirror: '', 'night vision': 'grayscale(1) sepia(1) hue-rotate(60deg) saturate(3) brightness(1.2) contrast(1.3)', '2009': 'contrast(1.3) saturate(1.7) brightness(1.1) blur(.6px)', pixelate: '' };
    var tick = function () { var d = new Date(), h = d.getHours(); clock.textContent = '06/28/2006 ' + pad(h % 12 || 12) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + (h < 12 ? ' AM' : ' PM'); };
    tick(); setInterval(tick, 1000);
    var passa = function () {
      if (stream || !walkers.length || !walk) return;
      var dir = Math.random() < 0.5;
      walk.src = walkers[Math.floor(Math.random() * walkers.length)];
      walk.style.transition = 'none';
      walk.style.left = dir ? '-200px' : '380px';
      walk.style.transform = dir ? '' : 'scaleX(-1)';
      void walk.offsetWidth;
      walk.style.transition = 'left ' + (2.5 + Math.random() * 2).toFixed(1) + 's linear';
      walk.style.left = dir ? '380px' : '-200px';
    };
    var giro = function () { passa(); setTimeout(giro, 4000 + Math.random() * 5000); };
    setTimeout(giro, 1500);
    var disegnaWalk = function (ctx, k) {
      if (!walk || !walk.naturalWidth) return;
      var l = parseFloat(getComputedStyle(walk).left) || -200, w = 150, h = w * walk.naturalHeight / walk.naturalWidth;
      ctx.save();
      if (walk.style.transform.indexOf('-1') !== -1) { ctx.translate((l + w) * k, (240 - h) * k); ctx.scale(-1, 1); ctx.drawImage(walk, 0, 0, w * k, h * k); }
      else ctx.drawImage(walk, l * k, (240 - h) * k, w * k, h * k);
      ctx.restore();
    };
    var disegna = function (ctx, k) {
      if (stream) ctx.drawImage(video, 0, 0, 320 * k, 240 * k);
      else { if (still && still.naturalWidth) ctx.drawImage(still, -20 * k, 0, 360 * k, 240 * k); disegnaWalk(ctx, k); }
    };
    var render2 = function () {
      if (filter !== 'pixelate') return;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      disegna(ctx, canvas.width / 320);
      raf = requestAnimationFrame(render2);
    };
    var setFilter = function (f) {
      filter = f;
      $$('[data-filter]', cam).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-filter') === f); });
      var pix = f === 'pixelate';
      screen.style.filter = pix ? '' : (FILTERS[f] || '');
      screen.style.transform = f === 'mirror' ? 'scaleX(-1)' : '';
      canvas.hidden = !pix;
      if (still) still.style.visibility = (pix || stream) ? 'hidden' : '';
      if (walk) walk.style.visibility = (pix || stream) ? 'hidden' : '';
      video.hidden = !(stream && !pix);
      cancelAnimationFrame(raf);
      if (pix) render2();
    };
    $$('[data-filter]', cam).forEach(function (b) { b.addEventListener('click', function () { setFilter(b.getAttribute('data-filter')); }); });
    $('[data-cam-on]', cam).addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { statoCam('webcam not supported by this browser. have u tried internet explorer 6? (plz dont.)'); return; }
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false }).then(function (s) {
        stream = s; video.srcObject = s;
        live.textContent = 'LIVE FROM UR ROOM';
        statoCam('u r now in pekkos office. the picture never leaves ur computer.');
        setFilter(filter);
      }).catch(function () { statoCam('webcam not found. have u tried turning it off and on again?'); });
    });
    $('[data-cam-off]', cam).addEventListener('click', function () {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      video.srcObject = null;
      live.textContent = 'LIVE · 56k';
      statoCam();
      setFilter(filter);
    });
    $('[data-cam-shot]', cam).addEventListener('click', function () {
      var c = document.createElement('canvas'); c.width = 320; c.height = 240;
      var ctx = c.getContext('2d');
      try { ctx.filter = screen.style.filter || 'none'; } catch (e) {}
      if (filter === 'mirror') { ctx.translate(320, 0); ctx.scale(-1, 1); }
      if (filter === 'pixelate') { ctx.imageSmoothingEnabled = false; ctx.drawImage(canvas, 0, 0, 320, 240); } else disegna(ctx, 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      try { ctx.filter = 'none'; } catch (e) {}
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Courier New'; ctx.fillText(clock.textContent, 6, 232);
      var url;
      try { url = c.toDataURL('image/jpeg', 0.6); } catch (e) { statoCam('snapshot failed. the camera is shy.'); return; }
      shotbox.hidden = false;
      shotbox.textContent = '';
      var im = el('img'); im.src = url; im.alt = 'Snapshot'; shotbox.appendChild(im);
      var dl = el('a', '', 'Save to My Documents'); dl.href = url; dl.download = 'pekko-office-cam.jpg'; dl.style.cssText = 'color:#ffe600;font:10px Verdana,sans-serif'; shotbox.appendChild(dl);
    });
  }

  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // ── Pekko Explorer: una scheda per sito, la barra dell'indirizzo e il tasto Go veri
  $$('[data-pex]').forEach(function (px) {
    var tabs = $$('[data-pex-tab]', px), panes = $$('[data-pex-pane]', px), infos = $$('[data-pex-info]', px.parentNode);
    var url = $('[data-pex-url]', px), go = $('[data-pex-go]', px), title = $('[data-pex-title]', px), view = $('[data-pex-view]', px), cur = 0;
    var apri = function (i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === cur ? 'true' : 'false'); t.tabIndex = j === cur ? 0 : -1; });
      panes.forEach(function (p, j) { p.hidden = j !== cur; });
      infos.forEach(function (p, j) { p.hidden = j !== cur; });
      var t = tabs[cur];
      url.textContent = t.getAttribute('data-url'); go.href = t.getAttribute('data-href'); title.textContent = t.getAttribute('data-title');
      view.scrollTop = 0;
      if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { apri(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); apri(cur + (e.key === 'ArrowRight' ? 1 : -1), true); }
      });
    });
    $$('[data-pex-step]', px).forEach(function (b) { b.addEventListener('click', function () { apri(cur + (+b.getAttribute('data-pex-step'))); }); });
    $$('[data-pex-open]').forEach(function (a) { a.addEventListener('click', function () { apri(+a.getAttribute('data-pex-open')); }); });
  });

  // ── Lo sapevi? Un fatto vero alla volta
  var dyk = $('[data-dyk]');
  if (dyk) {
    var fatti = [];
    try { fatti = JSON.parse(dyk.getAttribute('data-dyk')); } catch (e) {}
    var fn = Math.floor(Math.random() * fatti.length), ft = $('[data-dyk-t]', dyk);
    var mostraFatto = function () { if (fatti.length) ft.textContent = fatti[fn % fatti.length]; };
    mostraFatto();
    $('[data-dyk-next]', dyk).addEventListener('click', function () { fn++; mostraFatto(); });
    setInterval(function () { if (!document.hidden) { fn++; mostraFatto(); } }, 12000);
  }

  // ── Webring: «random» sceglie un sito vero a caso
  $$('[data-ring-random]').forEach(function (a) {
    a.addEventListener('click', function () { try { var l = JSON.parse(a.getAttribute('data-ring-random')); a.href = l[Math.floor(Math.random() * l.length)]; } catch (e) {} });
  });

  // ── Il segreto: il codice Konami, o cinque colpi alla nutria (per chi non ha le frecce)
  var segreto = $('[data-segreto]');
  var apriSegreto = function () {
    if (!segreto) { window.alert('U FOUND THE SECRET!!! (the good part is on the home page)'); return; }
    segreto.hidden = false; document.body.classList.add('has-popup');
    if (LS.get('bcp-segreto') !== '1') { LS.set('bcp-segreto', '1'); call({ a: 'like', k: 'segreto' }); }
    var c = $('[data-segreto-close]', segreto); if (c) c.focus();
  };
  if (segreto) $$('[data-segreto-close]', segreto).forEach(function (b) { b.addEventListener('click', function () { segreto.hidden = true; document.body.classList.remove('has-popup'); }); });
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kpos = 0;
  document.addEventListener('keydown', function (e) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; apriSegreto(); }
    if (e.key === 'Escape' && segreto && !segreto.hidden) { segreto.hidden = true; document.body.classList.remove('has-popup'); }
  });
  var colpi = 0;
  $$('[data-nutria]').forEach(function (b) {
    b.addEventListener('click', function () { if (++colpi >= 5) { colpi = 0; b.title = 'Secured by a nutria'; apriSegreto(); } else b.title = 'the nutria felt that. ' + (5 - colpi) + ' more…'; });
  });

  // ── Il giro vero: una visita (nuova solo la prima volta nella scheda), poi un aggiornamento ogni 30 s
  var nuovoVisitatore = false;
  try { nuovoVisitatore = sessionStorage.getItem('bcp-seen') !== '1'; sessionStorage.setItem('bcp-seen', '1'); } catch (e) {}
  // da dove arriva (solo il nome del sito, e solo se non è questo): così si vede se chi ci sponsorizza porta gente
  var provenienza = '';
  try { var rh = document.referrer ? new URL(document.referrer).hostname : ''; if (rh && rh !== location.hostname) provenienza = rh; } catch (e) {}
  call({ a: 'hit', nuovo: nuovoVisitatore, ref: provenienza });
  setInterval(function () { if (!document.hidden && !offline) call(); }, 30000);

  // ── Modulo dei contatti: stesse regole di /contatti/, messaggi in inglese
  var form = $('[data-saul-form]');
  if (!form) return;
  // ?tipo=… (dai tasti «ur website next?») sceglie già la voce giusta
  try {
    var qTipo = new URLSearchParams(location.search).get('tipo'), sTipo = form.elements.tipo;
    if (qTipo && sTipo) for (var oi = 0; oi < sTipo.options.length; oi++) if (sTipo.options[oi].value === qTipo) sTipo.selectedIndex = oi;
  } catch (e) {}
  var box = $('[data-turnstile]', form), fstatus = $('[data-status]', form), done = $('[data-done]', form), frm = form.closest('.frm');
  var token = '', widget = null;
  var rendi = function () { if (!box || widget !== null || !window.turnstile) return; widget = window.turnstile.render(box, { sitekey: box.getAttribute('data-sitekey'), language: 'en', appearance: 'interaction-only', callback: function (t) { token = t; }, 'expired-callback': function () { token = ''; }, 'error-callback': function () { token = ''; } }); };
  if (box) { var giri = 0, iv = setInterval(function () { rendi(); if (widget !== null || ++giri > 100) clearInterval(iv); }, 150); }
  var gettone = function () { return new Promise(function (ok) { if (!box || token) return ok(token); var t = 0, w = setInterval(function () { if (token || ++t > 50) { clearInterval(w); ok(token); } }, 160); }); };
  var REGOLE = {
    nome: function (v) { return v.trim().length < 2 ? 'tell pekko ur name.' : ''; },
    email: function (v) { return !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v.trim()) ? 'a real e-mail address, so pekko can answer.' : ''; },
    telefono: function (v) { return v.trim() && !/^[+0-9 ()./-]{6,20}$/.test(v.trim()) ? 'digits, spaces and the country code only (e.g. +39 333 000 0000).' : ''; },
    tipo: function (v) { return v ? '' : 'pick ur trouble.'; },
    messaggio: function (v) { return v.trim().length < 20 ? 'a couple more words: at least 20 characters (now ' + v.trim().length + ').' : ''; },
    privacy: function (v, el2) { return el2.checked ? '' : 'pekko needs ur consent 2 answer.'; }
  };
  var campi = $$('input, select, textarea', form).filter(function (x) { return REGOLE[x.name]; });
  var controlla = function (x) {
    var m = REGOLE[x.name](x.value, x), f = x.closest('[data-f]'), err = $('small', f);
    f.classList.toggle('bad', !!m);
    x.setAttribute('aria-invalid', m ? 'true' : 'false');
    err.textContent = m; err.hidden = !m;
    return !m;
  };
  campi.forEach(function (x) {
    x.addEventListener('blur', function () { controlla(x); });
    x.addEventListener(x.type === 'checkbox' || x.tagName === 'SELECT' ? 'change' : 'input', function () { if (x.closest('[data-f]').classList.contains('bad')) controlla(x); });
  });
  var statoF = function (s, testo) { frm.classList.toggle('is-loading', s === 'loading'); form.setAttribute('aria-busy', s === 'loading' ? 'true' : 'false'); fstatus.textContent = testo || (s === 'loading' ? 'sending…' : ''); };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var cattivi = campi.filter(function (x) { return !controlla(x); });
    if (cattivi.length) { statoF('error', cattivi.length === 1 ? 'check the highlighted field.' : 'check the ' + cattivi.length + ' highlighted fields.'); cattivi[0].focus(); return; }
    if (form.elements.sito.value) return;
    var dati = {};
    new FormData(form).forEach(function (v, key) { dati[key] = v; });
    delete dati.sito;
    statoF('loading');
    gettone().then(function (t) {
      dati.privacy = true; dati.modulo = 'assistenza'; dati._t = aperta; dati._turnstile = t;
      var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(form.getAttribute('data-endpoint'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(dati), signal: ctrl.signal })
        .then(function (r) { clearTimeout(timer); return r.json().catch(function () { return null; }).then(function (p) { return { ok: r.ok, p: p }; }); });
    }).then(function (res) {
      if (!res.ok) {
        if (widget !== null && window.turnstile) window.turnstile.reset(widget);
        token = '';
        if (res.p && res.p.fields && res.p.fields.length) {
          var primo = campi.filter(function (x) { return res.p.fields.indexOf(x.name) !== -1; })[0];
          statoF('error', 'check the highlighted fields.');
          if (primo) { primo.closest('[data-f]').classList.add('bad'); primo.focus(); }
          return;
        }
        statoF('error', (res.p && res.p.error) || 'it didnt go thru. call pekko, its faster.');
        return;
      }
      statoF('idle');
      frm.classList.add('is-done');
      done.hidden = false;
      done.focus();
    }).catch(function () {
      statoF('error', navigator.onLine ? 'it didnt go thru. try again in a minute, or call pekko, or write to ' + form.getAttribute('data-mail') + '.' : 'u seem to be offline. wich, to be fair, is a computer problem.');
    });
  });
})();
`
