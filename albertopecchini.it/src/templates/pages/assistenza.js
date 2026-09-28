// «Better Call Pekko» — /assistenza/ e /contatti/assistenza/.
//
// Due pagine autonome, fuori dal guscio del portfolio (route.standalone in
// routes.js): niente testata, piè di pagina, font o bundle del sito. Tutto ciò
// che serve sta qui dentro — stile e script in linea — perché la pagina deve
// sembrare il sito americano del 2008 di Pekko, «the computer guy»: 960 px
// fissi, colonna blu a sinistra con i tasti gialli in rilievo, pannello giallo
// dei «video di consulenza», manifesto a destra, striscia «WELCOME», colonne
// pubblicitarie ai lati dello schermo, annunci di aziende che non esistono,
// profilo in stile MySpace, listino, forum phpBB, telefonini e provider del
// 2009, pagamenti e donazioni PayPal, coupon, commenti in stile SMS, webcam
// con i filtri brutti, pop-up d'ingresso. Tutto in inglese, come chiede Alberto,
// che qui si chiama Pekko. Sui telefoni la pagina si vede rimpicciolita
// (viewport a 960 px), come nel 2008. Le Impact sono bianche con i bordi
// colorati e l'estrusione in 3D, sempre. Le stesse pagine sono il sito intero di
// bettercallpekko.it (progetto Vercel a parte, build con SITE=bcp: vedi routes.js).
//
// Contenuti in src/data/assistenza.js; immagini di tools/assistenza (ingredienti
// di gpt-image-2 e annunci composti da rendi.mjs) con le misure nel manifest
// generato src/data/assistenza-media.js. Un'immagine elencata ma non ancora
// resa diventa un riquadro di testo (`.fake`). Il modulo della pagina contatti
// parla con api/contatti.js come quello di /contatti/ (stesse trappole antibot,
// stesso Turnstile), con `modulo: 'assistenza'`.

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { assistenza as A } from '../../data/assistenza.js'
import { media } from '../../data/assistenza-media.js'

const src = (name) => media[name]?.src || ''

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
  `<ul class="nav">${A.menu.map((v) => `<li><a href="${v.href.startsWith('#') ? prefisso + v.href : v.href}"${v.href === attiva ? ' class="on"' : ''}>${esc(v.label)}</a></li>`).join('')}</ul>`

const sec = (id, title, inner, sub) => `<section class="sec" id="${id}"><h2>${i3(title, 'r', 34)}${sub ? `<small>${esc(sub)}</small>` : ''}</h2>${inner}</section>`

const chips = (lista, cls = '') => `<div class="chips ${cls}">${lista.map((w) => `<span>${esc(w)}</span>`).join('')}</div>`

const EULA = `<p><b>END USER LICENSE AGREEMENT — IMPORTANT, READ CAREFULLY.</b> By calling, e-mailing, thinking about, or standing near Pekko ("the Computer Guy") you agree to be bound by this Agreement.</p><p><b>1. GRANT OF LICENSE.</b> The Computer Guy grants you a non-exclusive, non-transferable right to have your computer looked at, sighed over, and eventually fixed.</p><p><b>2. RESTRICTIONS.</b> You may not download "free" screensavers, install seventeen toolbars, or click YES on anything that says YOUR PC IS INFECTED in red letters.</p><p><b>3. DUPLICATE FILES.</b> All copies of copies of copies of your holiday photos remain your responsibility until proven otherwise.</p><p><b>4. PRINTERS.</b> The Computer Guy makes no warranty, express or implied, that any printer will ever print again; printers are governed by separate, older laws.</p><p><b>5. WINDOWS VISTA.</b> See section 4.</p><p><b>6. GOVERNING LAW.</b> This Agreement is governed by the laws of Rivalta sul Mincio and the ancient customs of the Mincio river.</p><p><b>7. ENTIRE AGREEMENT.</b> Any other agreement is a duplicate and will be deleted with your permission. Si parla italiano. kthxbai.</p>`

// ── Pezzi comuni ─────────────────────────────────────────────────────────────

const strip = () => `<div class="strip" aria-hidden="true"><span>${(esc(A.striscia) + ' &nbsp;●&nbsp; ').repeat(6)}</span></div>`

const sides = (prefisso = '') => html`
  <div class="side sl" aria-label="Advertisements (fake)">
    ${ad('ad-sky-outfit', 'Pekko’s Outfit: menswear since 2006, 50% off all suits, dress like Pekko!', { w: 160, h: 600 })}
    ${ad('ad-sky-donate', 'Buy Pekko a coffee: donate via PayPal', { w: 160, h: 300, href: A.paypal, ext: true, title: 'Donate via PayPal (opens PayPal)' })}
  </div>
  <div class="side sr" aria-label="Advertisements (fake)">
    ${ad('ad-sky-mac', 'Think different? Think cheaper. PC & Mac repair from €25, no Genius required', { w: 160, h: 600 })}
    ${ad('ad-sky-forum', 'Pekko’s forum: 1,337 members, register free', { w: 160, h: 300, href: `${prefisso}#forum` })}
  </div>
`

function satisfied() {
  const soc = [
    { t: 'ig', href: A.instagram || A.contatti, title: 'Instagram', bg: '#c13584' },
    { t: 'gh', href: A.github || A.contatti, title: 'GitHub', bg: '#333' },
    { t: 'my', href: A.contatti, title: 'MySpace (we miss you)', bg: '#0a5ea8' },
    { t: 'f', href: A.contatti, title: 'Facebook (ask Pekko)', bg: '#3b5998' },
    { t: 'd', href: A.contatti, title: 'Digg it! (Digg is gone. Pekko is not.)', bg: '#1b6fb6' },
  ]
  return `<div class="sat">${i3('ANOTHER SATISFIED CUSTOMER?', 'w', 22)}<ul class="soc">${soc.map((s) => `<li><a href="${s.href}" title="${esc(s.title)}" style="background:${s.bg}"${s.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${s.t}</a></li>`).join('')}</ul>${i3('TELL YOUR VIRUS-INFECTED FRIENDS!!!!', 'y', 19)}<div style="margin-top:14px">${logo(true)}</div>${i3('BETTERCALLPEKKO.IT', 'y', 12)}<br><span class="aptv">AP tv</span></div>`
}

function foot() {
  return html`
    <footer class="foot">
      <p class="cause"><a href="#donate">${esc(A.piede.cause)}</a></p>
      <p class="addr"><b>PEKKO</b> · <a href="${esc(A.dominio)}/">bettercallpekko.it</a> · ${esc(A.indirizzo)} · <a href="${A.tel}">${esc(A.telefono)}</a> · <a href="mailto:${A.email}">${esc(A.email)}</a> · <a href="${A.mappa}" target="_blank" rel="noopener">map</a> · SI PARLA ITALIANO</p>
      <p><a href="${A.contatti}">About &amp; Contact</a> &nbsp;|&nbsp; <a href="#" data-eula>Terms of Use</a> &nbsp;|&nbsp; <a href="${esc(site.url)}/privacy/">Privacy Policy</a> &nbsp;|&nbsp; <a href="${esc(site.url)}/crediti/">Image credits</a> &nbsp;|&nbsp; <a href="${A.paypal}" target="_blank" rel="noopener">Donate</a> &nbsp;|&nbsp; <a href="${esc(site.url)}/">The serious website</a></p>
      <p>${esc(A.piede.legale)}</p>
      <p>${esc(A.piede.ia)}</p>
      <p>${esc(A.piede.aggiornato)} · ${esc(A.piede.visitatore)}<span class="counter" data-counter>0001337</span> · Copyright © 2006–${new Date().getFullYear()} Pekko. All rights reserved. No rights reversed.</p>
      <p class="credit"><a href="${esc(site.url)}" rel="author">Site by ${esc(site.name)}</a> · ${esc(site.location.city)} (${esc(site.location.province)}), Italy</p>
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
  `
}

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
      <div class="facts">
        <div><b>WHO IS PEKKO?</b><br>I'm the computer guy. I repair computers. Born ${esc(A.nascita)}.</div>
        <div><b>WHERE?</b><br>${esc(A.indirizzo)}. House calls, remote help, 3 AM on channel 47.</div>
        <div><b>WHAT?</b><br>PC · Mac · phones · printers · Wi-Fi · Windows · Office · viruses · duplicates · sighs. <a href="#about">More about Pekko »</a></div>
      </div>
      <p class="special">Today's special: a free sigh with every consultation. Ask about our duplicate-file amnesty program. w00t!</p>
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
        ${ad('ad-fashion', 'Pekko’s Outfit, menswear since 2006: 50% off all suits. Dress like Pekko! Fashion show', { w: 486, h: 205 })}
      </div>
      <div class="br">${satisfied()}</div>
    </div>
  `
}

function consultations() {
  const s = A.servizi
  const rows = []
  for (let i = 0; i < s.length; i += 2) rows.push(`<tr>${[s[i], s[i + 1]].filter(Boolean).map(([t, d]) => `<td><b>${esc(t)}</b> — ${esc(d)}</td>`).join('')}</tr>`)
  return sec(
    'consultations',
    'CONSULTATIONS',
    html`
      <div class="in cols">
        <div class="c1">
          <p class="h3">What Pekko can do for you (free consultation · si parla italiano)</p>
          <table class="svc">${rows.join('')}</table>
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
          <p class="h3">Pekko's top 8</p>
          <div class="top8">${B.top8.map((t, i) => `<span><b>${i + 1}.</b> ${esc(t)}</span>`).join('')}</div>
          <p class="h3">Sites by Pekko</p>
          <p>${B.siti.map((s) => `<a href="${s.href}"${s.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a>`).join(' · ')} · <a href="${A.contatti}">yours?</a></p>
        </div>
        <div class="c340">
          <p class="h3">${esc(B.albumTitolo)}</p>
          <div class="album">${B.album.map((n, i) => `<a href="${A.contatti}" title="Outfit #${i + 1}">${img(n, `Pekko’s outfit #${i + 1}`, { w: 100, h: 100 })}</a>`).join('')}</div>
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
            <p style="font:9px Verdana,sans-serif;color:#555;margin:4px 0 0">Plays through your speakers. If your speakers are mute, you know who to call.</p>
          </div>
          ${ad('ad-toolbar', 'Download the Better Call Pekko toolbar — free! Contains 0 viruses (probably)', { w: 468, h: 60, attrs: 'data-toolbar' })}
          <p data-toolbar-msg hidden style="margin:6px 0 0;padding:6px;border:2px solid #003c74;background:#fff;font:bold 11px Tahoma,sans-serif"></p>
        </div>
      </div>
    `,
    'Channel 47 · every night at 3 AM',
  )
}

function testimonials() {
  const S = A.sondaggio
  return sec(
    'testimonials',
    'TESTIMONIALS',
    html`
      <div class="in cols">
        <div class="c1">
          <p class="h3">Pekko worked for me!!!! (${A.commenti.length} comments)</p>
          ${A.commenti.map(
            (c) => html`
              <div class="cmt${c.comic ? ' comic' : ''}${c.moderato ? ' mod' : ''}">
                ${c.avatar ? img(c.avatar, `${c.chi}'s webcam photo`, { w: 48, h: 48 }) : '<span class="noav">no photo</span>'}
                <div><b>${esc(c.chi)}</b> <small>${esc(c.quando)}</small><p>${esc(c.testo)}</p></div>
              </div>
            `,
          )}
          <div class="frmk">
            <p class="h3">Leave a comment</p>
            <p style="font:11px Verdana,sans-serif">Comments are moderated by Pekko's turtle. Expect delays. (The button takes you to the contact page, where comments actually arrive.)</p>
            <p><input placeholder="Your name" size="18"> <input placeholder="Your e-mail" size="26"></p>
            <p><textarea rows="3" cols="58" placeholder="omg pekko…"></textarea></p>
            <a class="red" href="${A.contatti}">SUBMIT COMMENT</a>
          </div>
        </div>
        <div class="c340">
          <div class="poll" data-poll data-grazie="${esc(S.grazie)}">
            <p class="h3">Poll</p>
            <p><b>${esc(S.domanda)}</b></p>
            ${S.voci.map((v, i) => `<label><input type="radio" name="poll" value="${i}"> ${esc(v)}</label><div class="bar" data-bar="${S.risultati[i]}" hidden></div>`)}
            <p style="margin:6px 0 0"><button class="xp" type="button" data-vote>Vote</button> <span data-poll-msg></span></p>
          </div>
          <div class="game" data-game data-vinto="${esc(A.gioco.vinto)}" data-href="${A.contatti}">
            <p class="h3">${esc(A.gioco.titolo)}</p>
            <p style="font:10px Verdana,sans-serif;margin:0 0 4px">${esc(A.gioco.aiuto)}</p>
            <div class="arena">${img('prop-virus', 'A green virus. Punch it.', { w: 56, h: 60 })}<span class="ouch">OUCH!</span></div>
            <p style="margin:6px 0 0"><b>HITS: <span data-hits>0</span>/3</b> <span data-game-msg></span></p>
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
    'Real comments from real people who do not exist',
  )
}

function ecards() {
  const E = A.ecard
  return sec(
    'ecards',
    'E-CARDS',
    html`
      <form class="ecform" data-ecard data-fatto="${esc(E.fatto)}" data-nota="${esc(E.fattoNota)}">
        <span>To:</span><input name="to" placeholder="friend's name" maxlength="40">
        <span>From:</span><input name="from" placeholder="your name" maxlength="40">
        <span>E-card #</span><select name="n">${E.carte.map((_, i) => `<option>${i + 1}</option>`)}</select>
        <button class="red" type="submit">Submit</button>
      </form>
      <div class="ecdone" data-ecard-done hidden></div>
      <div class="ecgrid">
        ${E.carte.map((c, i) => `<div class="ec"><span class="num">#${i + 1}</span>${ad(c.ad, c.alt, { w: 390, h: 270 })}</div>`)}
      </div>
    `,
    E.intro,
  )
}

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
          <p class="status" data-cam-status>Viewers online: 3 · Stream quality: 56k</p>
          <div class="shot" data-cam-shotbox hidden></div>
        </div>
        <div class="c1">
          <p class="h3">${esc(W.titolo)}</p>
          <p>${esc(W.aiuto)}</p>
          <div class="chat" data-chat data-risposte="${esc(JSON.stringify(W.risposte))}">
            <div class="log" data-chat-log>${W.chat.map(([who, t]) => `<p><b${who === 'pekko' ? ' class="me"' : ''}>${esc(who)}:</b> ${esc(t)}</p>`)}</div>
            <form data-chat-form><input placeholder="say something to pekko…" maxlength="120" aria-label="Chat message"><button class="xp" type="submit">Send</button></form>
          </div>
          <div class="wid" style="margin-top:8px">
            <h4>Webcam schedule</h4>
            Mon–Fri 9–18: Pekko at his desk (sometimes) · Sat: turtle patrol · Sun: offline (church, salami) · 3 AM: on TV, channel 47
          </div>
        </div>
      </div>
    `,
    'Cam 1 · Pekko’s office · Via Belvedere 1, Rivalta sul Mincio',
  )
}

function forum() {
  const F = A.forum
  return sec(
    'forum',
    F.titolo,
    html`
      <div class="in">
        <table class="fr">
          <tr><th style="width:52%">Topic</th><th>Author</th><th>Replies</th><th>Last post</th></tr>
          ${F.argomenti.map(
            (t) => `<tr class="${t.sticky ? 'sticky' : ''}${t.chiuso ? ' locked' : ''}"><td><span class="ico">${t.chiuso ? '🔒' : t.sticky ? '📌' : t.hot ? '🔥' : '📄'}</span> <a href="${A.contatti}">${esc(t.titolo)}</a>${t.hot ? ' <em>HOT</em>' : ''}</td><td>${esc(t.chi)}</td><td class="n">${t.risposte.toLocaleString('en-US')}</td><td>${esc(t.quando)}<br><small>by ${esc(t.ultimo)}</small></td></tr>`,
          )}
        </table>
        <p style="font:10px Verdana,sans-serif;color:#555;margin:6px 0 0">${esc(F.nota)} · <a href="${A.contatti}">Register</a> · <a href="${A.contatti}">Log in</a> · <a href="${A.contatti}">FAQ</a> · <a href="${A.contatti}">Memberlist</a> · <a href="${A.contatti}">Usergroups</a></p>
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
        <p style="text-align:center;margin:0 0 8px"><button class="red" type="button" data-print>PRINT THIS PAGE</button> <span style="font:10px Verdana,sans-serif">(coupons only, we’re not monsters)</span></p>
        <div class="coupons">
          ${lista.map(
            (c) => html`
              <div class="cp">
                <span class="scis">✂ CUT HERE</span>
                <span class="code">${esc(c.codice)}</span>
                ${i3(c.titolo, 'r', 24)}
                <p>${esc(c.testo)}</p>
                <small>${esc(c.scade)} · Not valid with other offers · Limit one per customer · Pekko reserves the right to sigh.</small>
                <span class="bc" aria-hidden="true"></span>
              </div>
            `,
          )}
        </div>
      </div>
    `,
    'Print them. Screenshot them. Just call.',
  )
}

function donate() {
  const P = A.pagamenti
  const S = A.social
  return sec(
    'donate',
    'PAYMENTS, DONATIONS & SOCIAL',
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
          <p class="h3">Share this page</p>
          <div class="share">${S.condividi.map((s) => `<a href="${A.contatti}" title="${esc(s)} (2009)">${esc(s)}</a>`).join('')}</div>
        </div>
        <div class="c340">
          <p class="h3">${esc(S.titolo)}</p>
          <div class="soc2">${S.reti.map((r) => `<a href="${r.href}" style="background:${r.colore}"${r.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''} title="${esc(r.nota || r.nome)}"><b>${esc(r.nome)}</b>${r.nota ? `<small>${esc(r.nota)}</small>` : '<small>real!</small>'}</a>`).join('')}</div>
          <p style="font:10px Verdana,sans-serif;color:#555;margin:6px 0 0">Instagram, GitHub and the e-mail are real. The rest is 2009.</p>
        </div>
      </div>
    `,
    'Cash, cards, PayPal, salami',
  )
}

function extras() {
  return sec(
    'extras',
    'MORE STUFF!!!',
    html`
      <div class="in extras">
        <div class="wid"><h4>Webring</h4>« <a href="${A.contatti}">prev</a> | ${esc(A.webring)} | <a href="${A.contatti}">next</a> »<br><br><h4>Guestbook</h4><a href="${A.contatti}">Sign my guestbook!</a><br>Add me on MSN: <a href="mailto:${A.email}">${esc(A.email)}</a><br>Bookmark this page (CTRL+D)</div>
        <div class="wid"><h4>Hit counter</h4><span class="counter" data-counter>0001337</span> visitors since 2006<br><br><h4>Badges</h4><div class="badges">${A.badges.map((b) => `<span${/construction/i.test(b) ? ' class="uc"' : ''}>${esc(b)}</span>`)}</div></div>
        <div class="wid"><h4>Philanthropic causes</h4>The Save the Floppy Disk Foundation: 1.44 MB of hope. <a href="${A.paypal}" target="_blank" rel="noopener">Donate a floppy »</a><br><br><h4>Site map</h4>${A.menu.map((v) => `<a href="${v.href}">${esc(v.label)}</a>`).join(' · ')}</div>
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
      <div class="adhead">${ad('ad-million', 'Congratulations!!! You are the 1,000,000th visitor! Click here to claim your prize', { w: 468, h: 60, eager: true })}</div>
      <a class="hdr" href="${A.contatti}">${img('ad-header', 'Better Call Pekko! Pekko, I’m the computer guy. Want emails from Pekko? Click here!!!', { w: 960, h: 234, eager: true })}</a>
      <div class="content">
        <div class="left">
          ${nav()}
          ${ad('ad-fixed-my-pc', 'Pekko fixed my PC!!!!', { w: 158, h: 155, href: '#testimonials' })}
          ${ad('ad-ambulance', 'PC ambulance', { w: 150, h: 70 })}
          <p class="sm">SI PARLA ITALIANO<br>${esc(A.telefono)}<br>VIA BELVEDERE 1</p>
        </div>
        ${mid()}
        <div class="right">
          ${ad('ad-poster', 'Better Call Pekko: every night at 3 AM on channel 47', { w: 152, h: 378 })}
          <a class="red blink" href="${A.tel}" style="display:block;margin:8px 0 0;width:152px;text-align:center;padding:6px 0">CALL NOW!</a>
          <p class="sm" style="color:#000;text-align:center;width:152px;margin-top:8px">Via Belvedere 1<br>Rivalta sul Mincio (MN)<br><a href="${A.mappa}" target="_blank" rel="noopener">map »</a></p>
        </div>
      </div>
      ${img('ad-welcome', 'Welcome, PC abusers!', { w: 960, h: 86, cls: 'welcome' })}
      ${bottom()}
      ${strip()}
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
    ${sides(A.path)}
    <div class="wrap">
      <div class="adhead">${ad('ad-toolbar', 'Download the Better Call Pekko toolbar — free!', { w: 468, h: 60, eager: true, attrs: 'data-toolbar' })}<p data-toolbar-msg hidden style="margin:0 0 0 10px;padding:6px;border:2px solid #003c74;background:#fff;font:bold 11px Tahoma,sans-serif;max-width:300px"></p></div>
      <a class="hdr" href="${A.path}">${img('ad-header', 'Better Call Pekko! Pekko, I’m the computer guy', { w: 960, h: 234, eager: true })}</a>
      <div class="content">
        <div class="left">
          ${nav(A.contatti, A.path)}
          ${ad('ad-fixed-my-pc', 'Pekko fixed my PC!!!!', { w: 158, h: 155, href: `${A.path}#testimonials` })}
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
          <p style="text-align:center"><a href="mailto:${A.email}">${esc(A.email)}</a> · ${esc(site.contact.reply)} · si parla italiano</p>
          <div class="office">
            <div>
              <p class="h3">${esc(C.ufficio)}</p>
              <p><b>PEKKO — I'm the computer guy</b><br>${esc(A.indirizzo)}<br>${esc(A.telefono)} · <a href="${A.mappa}" target="_blank" rel="noopener">Get directions (opens a map)</a></p>
              <p style="font:11px Verdana,sans-serif;color:#7a0000">${esc(C.ufficioNota)}</p>
            </div>
            <a class="map" href="${A.mappa}" target="_blank" rel="noopener" title="Open the map"><span class="river"></span><span class="road"></span><span class="pin">★</span><span class="lbl">PEKKO<br>Via Belvedere 1</span><span class="you">YOU ARE HERE →</span></a>
          </div>
          <p class="h3">How it works</p>
          <ol class="steps">${C.passi.map((p) => `<li>${esc(p)}</li>`)}</ol>
          <p class="h3">Windows &amp; Office versions handled</p>
          ${chips(A.windows)}
          ${chips(A.office, 'off')}
          <p style="font:11px Verdana,sans-serif;color:#7a0000;margin:8px 0 0">Windows or Office installed and set up free with your first repair over €50 (with your own licence — no pirate copies).</p>
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
                <textarea id="as-messaggio" name="messaggio" required aria-required="true" minlength="20" maxlength="2000" aria-describedby="as-messaggio-err" placeholder="What computer it is, since when, what you already tried, whether it’s on fire…"></textarea>
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
          ${ad('ad-fashion', 'Pekko’s Outfit: dress like Pekko!', { w: 486, h: 205, href: A.path })}
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
.fr tr.locked td a{color:#777;text-decoration:line-through}
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
`

// ── Script ───────────────────────────────────────────────────────────────────
// Ogni pezzo si attiva solo se trova i propri elementi: pop-up d'ingresso,
// termini d'uso, contavisite, toolbar finta, e-card, sondaggio, gioco del virus,
// suonerie (sintetizzate con WebAudio, niente file), webcam (falso ufficio con
// Pekko che passa; con il permesso, la webcam del visitatore, che non lascia
// mai il suo computer), chat finta, stampa, modulo dei contatti.

const JS = `
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var pop = $('[data-popup]');
  if (pop) {
    var KEY = 'ap:bcp-popup';
    var visto = false;
    try { visto = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
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

  var n = 1337;
  try { n = Number(localStorage.getItem('ap:bcp-visite') || 1337) + 1; localStorage.setItem('ap:bcp-visite', String(n)); } catch (e) { n = 1338; }
  $$('[data-counter]').forEach(function (c) { c.textContent = ('0000000' + n).slice(-7); });

  $$('[data-toolbar]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var m = $('[data-toolbar-msg]');
      if (!m) return;
      m.textContent = 'Toolbar installed successfully! Restart your computer 4 times to complete. (Nothing was installed. Better call Pekko.)';
      m.hidden = false;
      m.scrollIntoView({ block: 'nearest' });
    });
  });

  var ec = $('[data-ecard]');
  if (ec) ec.addEventListener('submit', function (e) {
    e.preventDefault();
    var to = (ec.elements.to.value || '').trim() || 'your friend';
    var box = $('[data-ecard-done]');
    box.textContent = 'E-card #' + ec.elements.n.value + ' ' + ec.getAttribute('data-fatto') + ' ' + to + '! ' + ec.getAttribute('data-nota');
    box.hidden = false;
    box.scrollIntoView({ block: 'nearest' });
  });

  var poll = $('[data-poll]');
  if (poll) $('[data-vote]', poll).addEventListener('click', function () {
    var sel = $('input[name=poll]:checked', poll);
    if (!sel) { $('[data-poll-msg]', poll).textContent = 'Pick one! Any one.'; return; }
    $$('[data-bar]', poll).forEach(function (b) { b.hidden = false; b.title = b.getAttribute('data-bar') + '%'; setTimeout(function () { b.style.width = b.getAttribute('data-bar') + '%'; }, 30); });
    $('[data-poll-msg]', poll).textContent = poll.getAttribute('data-grazie');
    $('[data-vote]', poll).disabled = true;
  });

  var game = $('[data-game]');
  if (game) {
    var arena = $('.arena', game), virus = $('img, .fake', arena), ouch = $('.ouch', arena), hitsEl = $('[data-hits]', game), msg = $('[data-game-msg]', game), hits = 0;
    var muovi = function () { virus.style.left = Math.floor(Math.random() * (arena.clientWidth - 60)) + 'px'; virus.style.top = Math.floor(Math.random() * (arena.clientHeight - 60)) + 'px'; };
    var timer = setInterval(muovi, 700);
    virus.addEventListener('click', function () {
      if (hits >= 3) return;
      hits++;
      hitsEl.textContent = hits;
      ouch.style.display = 'block';
      setTimeout(function () { ouch.style.display = 'none'; }, 350);
      muovi();
      if (hits === 3) {
        clearInterval(timer);
        virus.style.transform = 'rotate(180deg)';
        msg.innerHTML = game.getAttribute('data-vinto') + ' <a href="' + game.getAttribute('data-href') + '">FREE CONSULTATION »</a>';
      }
    });
  }

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
      if (!c) { b.textContent = 'No sound. Have you tried turning it off and on again?'; return; }
      try { SUONI[b.getAttribute('data-suono')](c); } catch (e) {}
      var nome = b.textContent.replace(/^[▶♪] /, '');
      b.textContent = '♪ ' + nome;
      setTimeout(function () { b.textContent = '▶ ' + nome; }, 4500);
    });
  });

  var cam = $('[data-cam]');
  if (cam) {
    var screen = $('[data-cam-screen]', cam), still = $('.still', cam), walk = $('[data-cam-walk]', cam), video = $('[data-cam-video]', cam), canvas = $('[data-cam-canvas]', cam), status = $('[data-cam-status]', cam), clock = $('[data-cam-clock]', cam), live = $('[data-cam-live]', cam), shotbox = $('[data-cam-shotbox]', cam);
    var walkers = (cam.getAttribute('data-cam-walkers') || '').split(',').filter(Boolean);
    var stream = null, filter = 'normal', raf = 0;
    var FILTERS = { normal: '', sepia: 'sepia(1) contrast(1.2)', negative: 'invert(1)', thermal: 'hue-rotate(200deg) saturate(4) contrast(1.4)', mirror: '', 'night vision': 'grayscale(1) sepia(1) hue-rotate(60deg) saturate(3) brightness(1.2) contrast(1.3)', '2009': 'contrast(1.3) saturate(1.7) brightness(1.1) blur(.6px)', pixelate: '' };
    var tick = function () { var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; }, h = d.getHours(); clock.textContent = '06/28/2006 ' + p(h % 12 || 12) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + (h < 12 ? ' AM' : ' PM'); };
    tick(); setInterval(tick, 1000);
    setInterval(function () { if (!stream) status.textContent = 'Viewers online: ' + (1 + Math.floor(Math.random() * 7)) + ' · Stream quality: 56k'; }, 6000);
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
    var render = function () {
      if (filter !== 'pixelate') return;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      disegna(ctx, canvas.width / 320);
      raf = requestAnimationFrame(render);
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
      if (pix) render();
    };
    $$('[data-filter]', cam).forEach(function (b) { b.addEventListener('click', function () { setFilter(b.getAttribute('data-filter')); }); });
    $('[data-cam-on]', cam).addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status.textContent = 'Webcam not supported by this browser. Have you tried Internet Explorer 6? (Please don’t.)'; return; }
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false }).then(function (s) {
        stream = s; video.srcObject = s;
        live.textContent = 'LIVE FROM YOUR ROOM';
        status.textContent = 'You are now in Pekko’s office. The picture never leaves your computer.';
        setFilter(filter);
      }).catch(function () { status.textContent = 'Webcam not found. Have you tried turning it off and on again?'; });
    });
    $('[data-cam-off]', cam).addEventListener('click', function () {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      video.srcObject = null;
      live.textContent = 'LIVE · 56k';
      status.textContent = 'Viewers online: 3 · Stream quality: 56k';
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
      try { url = c.toDataURL('image/jpeg', 0.6); } catch (e) { status.textContent = 'Snapshot failed. The camera is shy.'; return; }
      shotbox.hidden = false;
      shotbox.innerHTML = '<img src="' + url + '" alt="Snapshot"><a href="' + url + '" download="pekko-office-cam.jpg" style="color:#ffe600;font:10px Verdana,sans-serif">Save to My Documents</a>';
    });
  }

  var chat = $('[data-chat]');
  if (chat) {
    var log = $('[data-chat-log]', chat), cform = $('form', chat), risposte = [], k = 0;
    try { risposte = JSON.parse(chat.getAttribute('data-risposte') || '[]'); } catch (e) {}
    var aggiungi = function (who, t, me) { var p = document.createElement('p'), b = document.createElement('b'); if (me) b.className = 'me'; b.textContent = who + ':'; p.appendChild(b); p.appendChild(document.createTextNode(' ' + t)); log.appendChild(p); log.scrollTop = log.scrollHeight; };
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = $('input', cform), t = inp.value.trim();
      if (!t) return;
      aggiungi('you', t, false);
      inp.value = '';
      if (risposte.length) setTimeout(function () { aggiungi('pekko', risposte[k++ % risposte.length], true); }, 900 + Math.random() * 1200);
    });
  }

  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  var form = $('[data-saul-form]');
  if (!form) return;
  var box = $('[data-turnstile]', form), fstatus = $('[data-status]', form), done = $('[data-done]', form), frm = form.closest('.frm');
  var apertoAlle = Date.now(), token = '', widget = null;
  var rendi = function () { if (!box || widget !== null || !window.turnstile) return; widget = window.turnstile.render(box, { sitekey: box.getAttribute('data-sitekey'), language: 'en', appearance: 'interaction-only', callback: function (t) { token = t; }, 'expired-callback': function () { token = ''; }, 'error-callback': function () { token = ''; } }); };
  if (box) { var giri = 0, iv = setInterval(function () { rendi(); if (widget !== null || ++giri > 100) clearInterval(iv); }, 150); }
  var gettone = function () { return new Promise(function (ok) { if (!box || token) return ok(token); var t = 0, w = setInterval(function () { if (token || ++t > 50) { clearInterval(w); ok(token); } }, 160); }); };
  var REGOLE = {
    nome: function (v) { return v.trim().length < 2 ? 'Tell Pekko your name.' : ''; },
    email: function (v) { return !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v.trim()) ? 'A real e-mail address, so Pekko can answer.' : ''; },
    telefono: function (v) { return v.trim() && !/^[+0-9 ()./-]{6,20}$/.test(v.trim()) ? 'Digits, spaces and the country code only (e.g. +39 333 000 0000).' : ''; },
    tipo: function (v) { return v ? '' : 'Pick your trouble.'; },
    messaggio: function (v) { return v.trim().length < 20 ? 'A couple more words: at least 20 characters (now ' + v.trim().length + ').' : ''; },
    privacy: function (v, el) { return el.checked ? '' : 'Pekko needs your consent to answer.'; }
  };
  var campi = $$('input, select, textarea', form).filter(function (el) { return REGOLE[el.name]; });
  var controlla = function (el) {
    var m = REGOLE[el.name](el.value, el), f = el.closest('[data-f]'), err = $('small', f);
    f.classList.toggle('bad', !!m);
    el.setAttribute('aria-invalid', m ? 'true' : 'false');
    err.textContent = m; err.hidden = !m;
    return !m;
  };
  campi.forEach(function (el) {
    el.addEventListener('blur', function () { controlla(el); });
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () { if (el.closest('[data-f]').classList.contains('bad')) controlla(el); });
  });
  var stato = function (s, testo) { frm.classList.toggle('is-loading', s === 'loading'); form.setAttribute('aria-busy', s === 'loading' ? 'true' : 'false'); fstatus.textContent = testo || (s === 'loading' ? 'Sending…' : ''); };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var cattivi = campi.filter(function (el) { return !controlla(el); });
    if (cattivi.length) { stato('error', cattivi.length === 1 ? 'Check the highlighted field.' : 'Check the ' + cattivi.length + ' highlighted fields.'); cattivi[0].focus(); return; }
    if (form.elements.sito.value) return;
    var dati = {};
    new FormData(form).forEach(function (v, key) { dati[key] = v; });
    delete dati.sito;
    stato('loading');
    gettone().then(function (t) {
      dati.privacy = true; dati.modulo = 'assistenza'; dati._t = apertoAlle; dati._turnstile = t;
      var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(form.getAttribute('data-endpoint'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(dati), signal: ctrl.signal })
        .then(function (r) { clearTimeout(timer); return r.json().catch(function () { return null; }).then(function (p) { return { ok: r.ok, p: p }; }); });
    }).then(function (res) {
      if (!res.ok) {
        if (widget !== null && window.turnstile) window.turnstile.reset(widget);
        token = '';
        if (res.p && res.p.fields && res.p.fields.length) {
          var primo = campi.filter(function (el) { return res.p.fields.indexOf(el.name) !== -1; })[0];
          stato('error', 'Check the highlighted fields.');
          if (primo) { primo.closest('[data-f]').classList.add('bad'); primo.focus(); }
          return;
        }
        stato('error', (res.p && res.p.error) || 'It didn’t go through. Call Pekko, it’s faster.');
        return;
      }
      stato('idle');
      frm.classList.add('is-done');
      done.hidden = false;
      done.focus();
    }).catch(function () {
      stato('error', navigator.onLine ? 'It didn’t go through. Try again in a minute, or call Pekko, or write to ' + form.getAttribute('data-mail') + '.' : 'You seem to be offline. Which, to be fair, is a computer problem.');
    });
  });
})();
`

// ── La 404 di bettercallpekko.it ─────────────────────────────────────────────
// Solo nella build SITE=bcp (routes.js → bcpRoutes): il sito serio ha la sua.

export function assistenzaNotFoundPage() {
  const body = html`
    <div class="wrap" style="padding:40px 0">
      <div class="sec" style="text-align:center;padding:30px 20px">
        ${i3('404?!', 'r', 90)}<br>
        ${i3('PAGE NOT FOUND. BETTER CALL PEKKO!', 'b', 30)}
        <p style="margin:16px 0;font:14px/1.5 Arial,sans-serif">This page doesn’t exist. It never did. Not even in 2006.<br>The computer guy can’t fix a link, but he can fix your computer.</p>
        <p><a class="red" href="${A.path}">BACK TO THE HOME PAGE</a> &nbsp; <a class="red" href="${A.contatti}">CONTACT PEKKO</a> &nbsp; <a class="red" href="${A.tel}">CALL ${esc(A.telefono)}</a></p>
        <p style="margin-top:14px"><a href="${esc(site.url)}/">The serious website</a> · SI PARLA ITALIANO</p>
      </div>
      ${foot()}
    </div>
  `
  return shell({ path: '/404/', title: '404 — Better Call Pekko', description: 'Page not found. Better call Pekko.', body, image: 'ad-header' })
}
