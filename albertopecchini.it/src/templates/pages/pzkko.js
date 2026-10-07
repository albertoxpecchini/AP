// ─────────────────────────────────────────────────────────────────────────────
//  pzkko.it — pagina autonoma (documento intero, CSS e JS in linea, come quelle
//  di bettercallpekko.it). Un iPhone bianco ghiaccio visto da dietro con il
//  portafoglio MagSafe: le carte sono i social (src/data/pzkko.js).
//
//  Movimento (regole di Emil Kowalski): solo transform e opacity; curve ease-out
//  forti per ciò che entra, ease-in-out per ciò che si sposta; molle per ciò che
//  segue il dito (inclinazione, portafoglio trascinato, giro del telefono), così
//  si può interrompere a metà; hover solo con puntatore fine; con «riduci
//  movimento» restano le dissolvenze e sparisce tutto ciò che si muove.
// ─────────────────────────────────────────────────────────────────────────────

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { pzkko as P } from '../../data/pzkko.js'

const svg = (d, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`

// Il fiocco di neve del marchio (portafoglio, favicon, 404).
const FIOCCO = `<svg class="fiocco" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M12 2l-2.2 2.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2M3.34 7l3 .8M3.34 7l.8-3M20.66 17l-3-.8M20.66 17l-.8 3M3.34 17l.8 3M3.34 17l3-.8M20.66 7l-.8-3M20.66 7l-3 .8"/></svg>`

// Icone delle app dei giochi (tratto, 24 × 24, disegnate qui).
const GIOCO = {
  blackjack: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M12 8.2c-1.7 2-3.1 2.9-3.1 4.3a1.6 1.6 0 0 0 3.1.7 1.6 1.6 0 0 0 3.1-.7c0-1.4-1.4-2.3-3.1-4.3ZM12 13.6v2.6"/>',
  roulette: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3"/>',
  mine: '<circle cx="12" cy="13" r="5.5"/><path d="M12 4.5v3M12 18.5v2M3.5 13h3M17.5 13h3M6 7l2.1 2.1M15.9 16.9 18 19M18 7l-2.1 2.1M8.1 16.9 6 19"/><circle cx="10.2" cy="11.2" r=".9" fill="currentColor" stroke="none"/>',
  dado: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><g fill="currentColor" stroke="none"><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="8.5" cy="15.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/></g>',
  moneta: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.3"/><path d="M10.3 15.5v-7h2.4a2 2 0 0 1 0 4h-2.4"/>',
}

const N = P.carte.length

function carta(c, i) {
  return `<button class="card" type="button" data-i="${i}" style="--i:${i};--n:${N};--bg:${c.bg}" aria-label="${esc(c.nome)}: ${esc(c.handle)}">
    <span class="card-in">
      <span class="strip">${svg(c.icon)}<b>${esc(c.nome)}</b><i>${esc(c.handle)}</i></span>
      <span class="chip" aria-hidden="true"></span>
      ${svg(c.icon, 'big')}
      <span class="num" aria-hidden="true">•••• •••• •••• ${String(2026 + i * 7).slice(-4)}</span>
    </span>
  </button>`
}

function retro() {
  return `<div class="face back">
    <div class="cam" aria-hidden="true">
      <span class="lens l1"></span><span class="lens l2"></span><span class="lens l3"></span>
      <span class="flash"></span><span class="lidar"></span><span class="mic"></span>
    </div>
    <span class="ring" aria-hidden="true"></span>
    <div class="wallet" data-wallet>
      <div class="cards">${P.carte.map(carta).join('')}</div>
      <div class="pocket" data-pocket aria-hidden="true">${FIOCCO}<span>pzkko</span></div>
    </div>
    <span class="engrave" aria-hidden="true">designed in rivalta sul mincio</span>
  </div>`
}

function fronte() {
  return `<div class="face front" aria-label="schermo del telefono">
    <div class="screen">
      <span class="island" aria-hidden="true"></span>
      <p class="date" data-date>&nbsp;</p>
      <p class="time" data-time>--:--</p>
      <div class="apps">
        <p class="apps-t">giochi finti, senza soldi · presto</p>
        <ul>${P.giochi.map((g) => `<li><button type="button" class="app" data-app><span class="tile"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GIOCO[g]}</svg></span><span class="app-n">${esc(g)}</span></button></li>`).join('')}</ul>
      </div>
      <span class="home" aria-hidden="true"></span>
    </div>
  </div>`
}

const credito = () =>
  `<footer class="foot"><span>© ${new Date().getFullYear()} pzkko</span><span class="dot">·</span><a href="${esc(site.url)}" rel="author">sito di Alberto Pecchini</a><span class="dot">·</span><a href="https://www.bettercallpekko.it/">better call pekko</a></footer>`

const FAVICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#eef5fb"/><g fill="none" stroke="#3d7fc6" stroke-width="3.6" stroke-linecap="round" transform="translate(8 8)">${FIOCCO.replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/<path d="/, '<path transform="scale(2)" d="')}</g></svg>`)}`

function shell({ path, title, description, body, noindex = false }) {
  const canon = P.dominio + path
  return html`<!doctype html>
<html lang="${P.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(canon)}">`}
<meta name="author" content="${esc(site.name)}">
<link rel="author" href="${esc(site.url)}">
<meta name="theme-color" content="#eef5fb">
<meta name="color-scheme" content="light">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="pzkko">
<meta property="og:locale" content="it_IT">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canon)}">
<link rel="icon" href="${FAVICON}" type="image/svg+xml">
<style>${CSS}</style>
</head>
<body>
<canvas class="snow" aria-hidden="true"></canvas>
${body}
</body>
</html>`
}

export function pzkkoPage() {
  const dati = JSON.stringify({ carte: P.carte.map(({ nome, handle, nota, azione, href }) => ({ nome, handle, nota, azione, href })) }).replace(/</g, '\\u003c')
  const body = `
<main class="page">
  <header class="top"><span class="brand">${FIOCCO}pzkko</span><span class="season">inverno 2026</span></header>
  <h1 class="sr">pzkko — il portafoglio di Alberto Pecchini: i miei social</h1>
  <div class="box" data-box>
    <div class="stage"><div class="phone" data-phone>${retro()}${fronte()}</div></div>
  </div>
  <div class="controls">
    <p class="hint" data-hint>tocca una carta per tirarla fuori · trascina il portafoglio</p>
    <button class="flip" type="button" data-flip><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.4 6.4L3 16M3 21v-5h5"/></svg><span data-flip-label>gira il telefono</span></button>
  </div>
  ${credito()}
</main>
<div class="overlay" data-overlay hidden>
  <div class="scrim" data-close></div>
  <div class="pass" role="dialog" aria-modal="true" aria-labelledby="pass-t">
    <div class="pass-card" data-pass-card></div>
    <div class="pass-info">
      <h2 id="pass-t" data-pass-t></h2>
      <p data-pass-n></p>
      <div class="pass-b"><a class="cta" data-pass-a href="#"></a><button class="ghost" type="button" data-close>rimetti nel portafoglio</button></div>
    </div>
  </div>
</div>
<script type="application/json" id="pzk-data">${dati}</script>
<script>(${main.toString()})()</script>`
  return shell({ path: '/', title: P.titolo, description: P.descrizione, body })
}

export function pzkkoNotFoundPage() {
  const body = `
<main class="page nf">
  <header class="top"><span class="brand">${FIOCCO}pzkko</span><span class="season">404</span></header>
  <div class="nf-in">
    <div class="nf-card">${FIOCCO}</div>
    <h1>questa carta non è nel portafoglio</h1>
    <p>la pagina che cerchi non c'è, o si è sciolta.</p>
    <p><a class="cta" href="/">torna al portafoglio</a></p>
  </div>
  ${credito()}
</main>`
  return shell({ path: '/404/', title: '404 — pzkko', description: 'Pagina non trovata.', body, noindex: true })
}

// ── Stile ────────────────────────────────────────────────────────────────────

const CSS = `
:root{
  --ink:#16324c;--ink-2:#4d6a86;--ink-3:#8aa2b8;
  --ice-0:#ffffff;--ice-1:#f4f8fc;--ice-2:#e8f0f7;--ice-3:#d7e4ef;
  --ease-out:cubic-bezier(.23,1,.32,1);--ease-io:cubic-bezier(.77,0,.175,1);--ease-drawer:cubic-bezier(.32,.72,0,1);
  --fit:1;
  color-scheme:light;
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{
  background:
    radial-gradient(1200px 700px at 15% -10%,#ffffff 0%,transparent 60%),
    radial-gradient(900px 600px at 110% 20%,#dcebf8 0%,transparent 55%),
    radial-gradient(800px 500px at 50% 120%,#d9e8f5 0%,transparent 60%),
    linear-gradient(180deg,#f3f8fc 0%,#e9f1f8 100%);
  background-attachment:fixed;
  color:var(--ink);
  font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI Variable Text","Segoe UI",Inter,Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
  -webkit-tap-highlight-color:transparent;
}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.snow{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
.page{position:relative;z-index:1;min-height:100svh;display:flex;flex-direction:column;align-items:center;padding:0 16px}
.top{width:100%;max-width:1080px;display:flex;justify-content:space-between;align-items:center;padding:18px 4px 0;font-weight:600;letter-spacing:-.01em}
.brand{display:inline-flex;align-items:center;gap:8px;font-size:17px}
.brand .fiocco{width:18px;height:18px;color:#3d7fc6}
.season{font-size:13px;color:var(--ink-3);font-weight:500}

/* telefono */
.box{margin:clamp(8px,3vh,28px) auto 0;width:calc(320px * var(--fit));height:calc(660px * var(--fit));perspective:1600px;animation:rise .9s var(--ease-out) backwards}
/* nel contesto 3D i piani vuoti (stage, phone) ruberebbero i clic alle facce inclinate */
.stage{width:320px;height:660px;transform:scale(var(--fit));transform-origin:0 0;transform-style:preserve-3d;pointer-events:none;user-select:none;-webkit-user-select:none}
.phone{position:relative;width:320px;height:660px;transform-style:preserve-3d;--lx:50%;--ly:30%}
.face{position:absolute;inset:0;border-radius:56px;pointer-events:auto;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.back{
  background:
    radial-gradient(420px 320px at var(--lx) var(--ly),rgba(255,255,255,.95),rgba(255,255,255,0) 60%),
    linear-gradient(160deg,#fdfeff 0%,#f0f5fa 45%,#e2eaf2 100%);
  box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.95),inset 0 0 0 5px #dfe7ef,inset 0 0 0 6px rgba(150,170,190,.35),inset 0 2px 14px rgba(255,255,255,.9);
}
.back::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:.35;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .62 0 0 0 0 .7 0 0 0 .18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.phone{border-radius:56px;box-shadow:0 50px 90px -40px rgba(40,75,115,.55),0 18px 36px -18px rgba(40,75,115,.35)}

/* fotocamere */
.cam{position:absolute;left:16px;top:16px;width:134px;height:134px;border-radius:38px;
  background:linear-gradient(150deg,#ffffff,#e6eef5);
  box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 -1px 2px rgba(120,145,170,.25) inset,0 10px 22px -10px rgba(50,80,115,.45),0 2px 4px rgba(50,80,115,.15)}
.lens{position:absolute;width:52px;height:52px;border-radius:50%;
  background:radial-gradient(circle at 36% 32%,#7d93ab 0 5%,#1a2633 14%,#0a0f15 32%,#1f2b38 46%,#05080b 62%,#2a3a4a 66%,#0b1016 72%);
  box-shadow:0 0 0 3px #e9eff5,0 0 0 4px rgba(140,160,180,.6),0 4px 8px rgba(20,40,60,.45)}
.lens::after{content:"";position:absolute;left:22%;top:18%;width:22%;height:14%;border-radius:50%;background:rgba(255,255,255,.55);filter:blur(1px);transform:rotate(-30deg)}
.l1{left:12px;top:12px}.l2{left:12px;top:70px}.l3{left:70px;top:41px}
.flash{position:absolute;left:84px;top:14px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff7df,#e6dcc0 70%);box-shadow:0 0 0 2px #edf2f7}
.lidar{position:absolute;left:86px;top:100px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#2b3846,#0c1117);box-shadow:0 0 0 2px #edf2f7}
.mic{position:absolute;left:112px;top:66px;width:5px;height:5px;border-radius:50%;background:#9fb1c2}

/* anello MagSafe */
.ring{position:absolute;left:50%;top:420px;width:190px;height:190px;margin:-95px 0 0 -95px;border-radius:50%;
  border:3px solid rgba(255,255,255,.95);box-shadow:0 0 24px 6px rgba(140,195,245,.65),inset 0 0 24px 4px rgba(140,195,245,.55);opacity:0;pointer-events:none}

/* portafoglio */
.wallet{position:absolute;left:53px;top:350px;width:214px;height:146px;touch-action:none;animation:snap .75s var(--ease-out) .55s backwards}
.cards{position:absolute;left:12px;top:0;width:190px;height:146px}
.card{all:unset;position:absolute;left:0;top:calc((var(--n) - var(--i)) * -21px);width:190px;height:120px;font-size:10px;cursor:pointer;
  border-radius:1.25em;transition:transform .22s var(--ease-out);animation:insert .6s var(--ease-out) backwards;animation-delay:calc(.95s + var(--i) * 60ms)}
.card-in{position:absolute;inset:0;border-radius:inherit;background:var(--bg);color:#fff;overflow:hidden;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.12),0 -3px 10px -4px rgba(10,30,50,.35)}
.card-in::after{content:"";position:absolute;inset:-40%;pointer-events:none;
  background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.28) 45%,rgba(255,255,255,0) 55%);
  transform:translateX(calc((var(--sx,.5) - .5) * 60%));transition:transform .5s var(--ease-out)}
.strip{position:absolute;left:1.15em;right:1.15em;top:.55em;display:flex;align-items:center;gap:.55em;line-height:1;white-space:nowrap}
.strip svg{width:1.15em;height:1.15em;fill:currentColor;flex:none}
.strip b{font-weight:650;font-size:1.05em;letter-spacing:-.01em}
.strip i{margin-left:auto;font-style:normal;font-size:.88em;opacity:.82;overflow:hidden;text-overflow:ellipsis}
.chip{position:absolute;left:1.4em;top:3.9em;width:2.9em;height:2.2em;border-radius:.45em;
  background:linear-gradient(135deg,#f5f8fb,#c7d2dc 45%,#eef3f7 70%,#b8c5d1);box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
.chip::before{content:"";position:absolute;inset:28% 0;border-top:1px solid rgba(0,0,0,.18);border-bottom:1px solid rgba(0,0,0,.18)}
.big{position:absolute;right:1.1em;bottom:1em;width:3.6em;height:3.6em;fill:currentColor;opacity:.92}
.num{position:absolute;left:1.4em;bottom:1.25em;font:500 .95em/1 ui-monospace,"SF Mono","Cascadia Code",Consolas,monospace;letter-spacing:.06em;opacity:.85}
.card:focus-visible .card-in{outline:2px solid #fff;outline-offset:-4px}
.card.out{transform:translateY(-78px)!important;transition:transform .2s var(--ease-out)}
.card.gone{visibility:hidden}
.pocket{position:absolute;inset:0;border-radius:14px 14px 24px 24px;cursor:grab;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:rgba(110,140,170,.55);
  background:
    radial-gradient(260px 160px at var(--lx) 0%,rgba(255,255,255,.9),rgba(255,255,255,0) 70%),
    linear-gradient(180deg,#f9fbfd 0%,#ecf2f7 55%,#e1e9f1 100%);
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,1),inset 0 -2px 3px rgba(120,145,170,.18),0 16px 30px -14px rgba(40,70,110,.55),0 3px 8px -2px rgba(40,70,110,.25)}
.pocket::before{content:"";position:absolute;inset:7px;border-radius:9px 9px 18px 18px;border:1.5px dashed rgba(150,172,195,.45);pointer-events:none}
.pocket::after{content:"";position:absolute;inset:0;border-radius:inherit;opacity:.5;mix-blend-mode:multiply;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .58 0 0 0 0 .68 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.pocket .fiocco{width:30px;height:30px;filter:drop-shadow(0 1px 0 rgba(255,255,255,.9))}
.pocket span{font-size:11px;font-weight:600;letter-spacing:.32em;text-indent:.32em;text-shadow:0 1px 0 rgba(255,255,255,.9)}
.wallet.drag .pocket{cursor:grabbing}
.engrave{position:absolute;left:0;right:0;bottom:46px;text-align:center;font-size:10px;letter-spacing:.22em;color:rgba(120,145,170,.55);text-shadow:0 1px 0 rgba(255,255,255,.9)}

/* schermo */
.front{transform:rotateY(180deg);background:#0b1016;padding:7px}
.screen{position:relative;height:100%;border-radius:49px;overflow:hidden;color:var(--ink);
  background:
    radial-gradient(260px 220px at 20% 18%,rgba(255,255,255,.95),transparent 70%),
    radial-gradient(300px 260px at 90% 55%,#c6def3,transparent 70%),
    radial-gradient(280px 240px at 10% 90%,#d5e6f5,transparent 70%),
    linear-gradient(170deg,#f6fafd,#e3eef8)}
.island{position:absolute;left:50%;top:14px;width:100px;height:30px;margin-left:-50px;border-radius:20px;background:#05080b}
.date{margin:72px 0 0;text-align:center;font-size:15px;font-weight:600;color:var(--ink-2)}
.time{margin:0;text-align:center;font-size:84px;line-height:1;font-weight:700;letter-spacing:-.04em;color:var(--ink);font-variant-numeric:tabular-nums}
.apps{position:absolute;left:14px;right:14px;bottom:56px;padding:14px 10px 12px;border-radius:30px;background:rgba(255,255,255,.55);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 10px 30px -18px rgba(40,70,110,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.apps-t{margin:0 0 10px;text-align:center;font-size:11px;font-weight:600;color:var(--ink-2)}
.apps ul{list-style:none;margin:0;padding:0;display:flex;justify-content:space-between}
.app{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;width:52px;transition:transform .16s var(--ease-out)}
.app:active{transform:scale(.94)}
.tile{display:grid;place-items:center;width:48px;height:48px;border-radius:13px;background:linear-gradient(160deg,#ffffff,#e7f0f8);color:#2c5b88;box-shadow:inset 0 1px 0 #fff,0 4px 10px -4px rgba(40,70,110,.4)}
.tile svg{width:26px;height:26px}
.app-n{font-size:10px;font-weight:600;color:var(--ink-2)}
.app.nudge .tile{animation:nudge .42s var(--ease-out)}
.home{position:absolute;left:50%;bottom:9px;width:120px;height:5px;margin-left:-60px;border-radius:3px;background:rgba(22,50,76,.55)}

/* comandi */
.controls{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:6px}
.hint{margin:0;font-size:13px;color:var(--ink-2);text-align:center;transition:opacity .2s ease}
.flip,.cta,.ghost{all:unset;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 18px;border-radius:999px;font-size:14px;font-weight:600;transition:transform .16s var(--ease-out),background-color .2s ease,box-shadow .2s ease}
.flip{background:rgba(255,255,255,.75);color:var(--ink);box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(120,150,180,.22),0 6px 18px -10px rgba(40,70,110,.5)}
.flip svg{width:17px;height:17px}
.flip:active,.cta:active,.ghost:active{transform:scale(.97)}
.flip:focus-visible,.cta:focus-visible,.ghost:focus-visible,.app:focus-visible{outline:2px solid #3d7fc6;outline-offset:3px}
.cta{background:var(--ink);color:#fff;box-shadow:0 8px 20px -10px rgba(22,50,76,.8)}
.ghost{color:var(--ink-2)}
@media (hover:hover) and (pointer:fine){
  .card:hover{transform:translateY(-12px)}
  .flip:hover{background:#fff}
  .cta:hover{background:#0e2438}
  .ghost:hover{color:var(--ink)}
}

.foot{margin-top:auto;padding:28px 0 22px;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;font-size:12.5px;color:var(--ink-3)}
.foot a{color:var(--ink-2);text-decoration:none;border-bottom:1px solid rgba(77,106,134,.3);transition:color .2s ease,border-color .2s ease}
.foot a:hover{color:var(--ink);border-color:currentColor}

/* carta tirata fuori */
.overlay{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:16px}
.overlay[hidden]{display:none}
.scrim{position:absolute;inset:0;background:rgba(236,244,251,.6);backdrop-filter:blur(16px) saturate(1.15);-webkit-backdrop-filter:blur(16px) saturate(1.15);opacity:0;transition:opacity .25s ease}
.overlay.open .scrim{opacity:1}
.pass{position:relative;display:flex;flex-direction:column;align-items:center}
.pass-card{position:relative;width:19em;height:12em;border-radius:1.25em;font-size:min(17.9px,calc((100vw - 40px) / 19));
  box-shadow:0 30px 60px -24px rgba(22,50,76,.55),0 10px 20px -10px rgba(22,50,76,.35);transform-style:preserve-3d;will-change:transform}
.pass-card .card-in{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.12)}
.pass-info{margin-top:26px;text-align:center;opacity:0;transform:translateY(10px);transition:opacity .2s ease,transform .2s var(--ease-out)}
.overlay.open .pass-info{opacity:1;transform:none;transition:opacity .35s ease .18s,transform .45s var(--ease-out) .18s}
.pass-info h2{margin:0;font-size:22px;letter-spacing:-.02em}
.pass-info p{margin:6px 0 18px;color:var(--ink-2)}
.pass-b{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}

/* 404 */
.nf-in{margin:auto;text-align:center;padding:40px 0}
.nf-card{width:190px;height:120px;margin:0 auto 26px;border-radius:14px;display:grid;place-items:center;color:#3d7fc6;background:linear-gradient(160deg,#fff,#e4edf6);box-shadow:inset 0 1px 0 #fff,0 20px 40px -20px rgba(22,50,76,.5);animation:rise .8s var(--ease-out) backwards}
.nf-card .fiocco{width:48px;height:48px;animation:spin 14s linear infinite}
.nf h1{font-size:24px;letter-spacing:-.02em;margin:0 0 6px}
.nf p{color:var(--ink-2);margin:0 0 18px}

@keyframes rise{from{opacity:0;transform:translateY(40px)}}
@keyframes snap{0%{opacity:0;transform:translateY(-34px) scale(1.12)}55%{opacity:1;transform:translateY(3px) scale(.985)}78%{transform:translateY(-1px) scale(1.004)}100%{transform:none}}
@keyframes insert{from{opacity:0;transform:translateY(46px)}}
@keyframes nudge{30%{transform:translateY(-6px) rotate(-6deg)}60%{transform:translateY(0) rotate(4deg)}}
@keyframes spin{to{transform:rotate(360deg)}}

@media (prefers-reduced-motion:reduce){
  .box,.wallet,.card,.nf-card{animation:fade .4s ease backwards}
  .card,.card.out{transition:opacity .2s ease;transform:none!important}
  .nf-card .fiocco{animation:none}
  .card-in::after{transition:none}
  .pass-info,.overlay.open .pass-info{transform:none}
  @keyframes fade{from{opacity:0}}
}
`

// ── Comportamento ────────────────────────────────────────────────────────────
// Questa funzione viene scritta così com'è nella pagina (main.toString()): niente
// riferimenti a variabili di questo modulo.

function main() {
  const D = JSON.parse(document.getElementById('pzk-data').textContent)
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
  const root = document.documentElement
  const phone = $('[data-phone]')
  const wallet = $('[data-wallet]')
  const pocket = $('[data-pocket]')
  const ring = $('.ring')
  const cards = $$('.card')

  // Il telefono entra sempre per intero nello schermo.
  const fit = () => {
    const h = innerHeight - (innerWidth < 600 ? 190 : 200)
    const f = Math.max(0.52, Math.min(1.06, h / 660, (innerWidth - 32) / 320))
    root.style.setProperty('--fit', f.toFixed(3))
  }
  fit()
  addEventListener('resize', fit)

  // ── Molle: una sola integrazione per tutto ciò che si muove a mano ──
  const S = (k, c) => ({ x: 0, v: 0, t: 0, k, c })
  const rx = S(120, 18), ry = S(120, 18), flip = S(110, 15), wx = S(340, 17), wy = S(340, 17)
  const springs = [rx, ry, flip, wx, wy]
  let raf = 0, last = 0, dragging = false, passOpen = false

  const render = () => {
    phone.style.transform = `rotateX(${rx.x.toFixed(3)}deg) rotateY(${(ry.x + flip.x).toFixed(3)}deg)`
    // il riflesso segue l'inclinazione
    phone.style.setProperty('--lx', `${(50 - ry.x * 3.2).toFixed(1)}%`)
    phone.style.setProperty('--ly', `${(30 + rx.x * 3.2).toFixed(1)}%`)
    wallet.style.transform = wx.x || wy.x ? `translate(${wx.x.toFixed(2)}px,${wy.x.toFixed(2)}px) rotate(${(wx.x * 0.035).toFixed(3)}deg)` : ''
  }
  const tick = (now) => {
    const dt = Math.min(0.032, (now - (last || now)) / 1000 || 0.016)
    last = now
    let busy = dragging
    for (const s of springs) {
      if (s === wx || s === wy) if (dragging) continue
      for (let i = 0; i < 4; i++) {
        const h = dt / 4
        s.v += (-s.k * (s.x - s.t) - s.c * s.v) * h
        s.x += s.v * h
      }
      if (Math.abs(s.v) > 0.01 || Math.abs(s.x - s.t) > 0.01) busy = true
      else { s.x = s.t; s.v = 0 }
    }
    render()
    raf = busy ? requestAnimationFrame(tick) : 0
    if (!busy) last = 0
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
  const jump = (s, v) => { s.x = s.t = v; s.v = 0 }

  // ── Inclinazione col puntatore (decorativa: solo puntatore fine) ──
  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      if (passOpen) return
      const nx = e.clientX / innerWidth - 0.5
      const ny = e.clientY / innerHeight - 0.5
      ry.t = nx * 22
      rx.t = -ny * 14
      kick()
    }, { passive: true })
    document.addEventListener('pointerleave', () => { rx.t = ry.t = 0; kick() })
  }

  // ── Anello MagSafe ──
  const pulse = () => {
    if (reduce) return
    ring.animate(
      [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.28)' }],
      { duration: 900, easing: 'cubic-bezier(.23,1,.32,1)' },
    )
  }
  if (!reduce) setTimeout(pulse, 520)

  // ── Portafoglio: si trascina, la calamita lo riporta al suo posto ──
  // Oltre il bordo la resistenza cresce (rubber band), al rilascio una molla
  // rimbalzante lo riattacca; un tocco senza trascinare fa saltare le carte.
  const band = (d, L) => Math.sign(d) * L * (1 - 1 / (1 + (Math.abs(d) * 0.75) / L))
  let start = null, moved = false, lastPts = []
  pocket.addEventListener('pointerdown', (e) => {
    if (dragging || passOpen || e.button > 0) return
    e.preventDefault()
    pocket.setPointerCapture(e.pointerId)
    start = { x: e.clientX, y: e.clientY, id: e.pointerId }
    moved = false
    lastPts = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]
  })
  pocket.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return
    const dx = e.clientX - start.x, dy = e.clientY - start.y
    if (!moved && Math.hypot(dx, dy) < 5) return
    if (!moved) { moved = true; dragging = true; wallet.classList.add('drag'); kick() }
    if (reduce) return
    const f = parseFloat(getComputedStyle(root).getPropertyValue('--fit')) || 1
    jump(wx, band(dx / f, 120))
    jump(wy, band(dy / f, 120))
    lastPts.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
    if (lastPts.length > 5) lastPts.shift()
  })
  const release = (e) => {
    if (!start || (e && e.pointerId !== start.id)) return
    start = null
    if (!moved) return jiggle()
    dragging = false
    wallet.classList.remove('drag')
    const a = lastPts[0], b = lastPts[lastPts.length - 1]
    const dt = Math.max(16, b.t - a.t) / 1000
    wx.v = ((b.x - a.x) / dt) * 0.25
    wy.v = ((b.y - a.y) / dt) * 0.25
    const far = Math.hypot(wx.x, wy.x) > 24
    wx.t = wy.t = 0
    kick()
    if (far) setTimeout(pulse, 140)
  }
  pocket.addEventListener('pointerup', release)
  pocket.addEventListener('pointercancel', release)

  const jiggle = () => {
    if (reduce) return
    cards.forEach((c, i) => {
      c.animate([{ transform: 'none' }, { transform: 'translateY(-14px)', offset: 0.4 }, { transform: 'none' }], {
        duration: 420, delay: (cards.length - 1 - i) * 40, easing: 'cubic-bezier(.23,1,.32,1)',
      })
    })
  }

  // ── Riflesso sulle carte col puntatore ──
  if (fine && !reduce) {
    cards.forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect()
      c.style.setProperty('--sx', ((e.clientX - r.left) / r.width).toFixed(3))
    }))
  }

  // ── Carta tirata fuori ──
  const overlay = $('[data-overlay]')
  const passCard = $('[data-pass-card]')
  const passT = $('[data-pass-t]'), passN = $('[data-pass-n]'), passA = $('[data-pass-a]')
  let current = null, busy = false
  const EASE = 'cubic-bezier(.32,.72,0,1)'
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  const flyFrom = (r) => {
    const p = passCard.getBoundingClientRect()
    const s = r.width / p.width
    return `translate(${(r.left - p.left).toFixed(1)}px,${(r.top - p.top).toFixed(1)}px) scale(${s.toFixed(4)})`
  }

  async function openPass(i) {
    if (busy || passOpen) return
    busy = true
    const card = cards[i], d = D.carte[i]
    current = i
    passOpen = true
    rx.t = ry.t = 0
    kick()
    // 1. la carta sale fuori dal portafoglio
    if (!reduce) { card.classList.add('out'); await wait(190) }
    const r = card.getBoundingClientRect()
    // 2. vola al centro e diventa grande
    passCard.innerHTML = card.innerHTML
    passCard.style.setProperty('--bg', card.style.getPropertyValue('--bg'))
    passT.textContent = d.handle
    passN.textContent = d.nota
    passA.textContent = d.azione + ' ↗'
    passA.href = d.href
    if (d.href.startsWith('http')) { passA.target = '_blank'; passA.rel = 'noopener' } else { passA.removeAttribute('target'); passA.removeAttribute('rel') }
    overlay.hidden = false
    card.classList.add('gone')
    passCard.style.transformOrigin = '0 0'
    if (reduce) {
      passCard.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' })
    } else {
      passCard.animate(
        [
          { transform: flyFrom(r), boxShadow: '0 4px 10px -4px rgba(22,50,76,.3)' },
          { transform: 'translate(0,-14px) rotate(-1.5deg)', offset: 0.7 },
          { transform: 'none' },
        ],
        { duration: 620, easing: EASE },
      )
    }
    requestAnimationFrame(() => overlay.classList.add('open'))
    $('[data-hint]').style.opacity = '0'
    passA.focus({ preventScroll: true })
    busy = false
  }

  async function closePass() {
    if (busy || !passOpen) return
    busy = true
    const card = cards[current]
    overlay.classList.remove('open')
    const r = card.getBoundingClientRect()
    if (!reduce) {
      const a = passCard.animate([{ transform: 'none' }, { transform: flyFrom(r) }], { duration: 380, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'forwards' })
      await a.finished
      a.cancel()
    } else {
      await wait(200)
    }
    overlay.hidden = true
    card.classList.remove('gone')
    // 3. rientra nel portafoglio
    requestAnimationFrame(() => card.classList.remove('out'))
    $('[data-hint]').style.opacity = ''
    passOpen = false
    card.focus({ preventScroll: true })
    current = null
    busy = false
  }

  cards.forEach((c, i) => c.addEventListener('click', () => openPass(i)))
  $$('[data-close]').forEach((el) => el.addEventListener('click', closePass))
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePass() })

  // Inclinazione 3D della carta grande, come un pass del Wallet.
  if (fine && !reduce) {
    passCard.addEventListener('pointermove', (e) => {
      const r = passCard.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
      passCard.style.transform = `perspective(900px) rotateY(${((x - 0.5) * 14).toFixed(2)}deg) rotateX(${((0.5 - y) * 10).toFixed(2)}deg)`
      passCard.style.setProperty('--sx', x.toFixed(3))
    })
    passCard.addEventListener('pointerleave', () => { passCard.style.transform = '' })
    passCard.style.transition = 'transform .35s cubic-bezier(.23,1,.32,1)'
  }

  // ── Gira il telefono ──
  const flipBtn = $('[data-flip]'), flipLabel = $('[data-flip-label]')
  flipBtn.addEventListener('click', () => {
    const toFront = flip.t === 0
    flip.t = toFront ? 180 : 0
    flipLabel.textContent = toFront ? 'torna al portafoglio' : 'gira il telefono'
    $('.back').inert = toFront
    $('.front').inert = !toFront
    if (reduce) jump(flip, flip.t)
    kick()
  })
  $('.front').inert = true

  $$('[data-app]').forEach((a) => a.addEventListener('click', () => {
    a.classList.remove('nudge')
    void a.offsetWidth
    a.classList.add('nudge')
  }))

  // Orologio dello schermo.
  const tEl = $('[data-time]'), dEl = $('[data-date]')
  const clock = () => {
    const n = new Date()
    tEl.textContent = n.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    dEl.textContent = n.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  clock()
  setInterval(clock, 15000)

  // ── Neve ──
  const cv = $('.snow')
  if (cv && !reduce) {
    const ctx = cv.getContext('2d')
    let W = 0, H = 0, flakes = [], on = true
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      W = innerWidth; H = innerHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(Math.min(110, (W * H) / 14000))
      flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.7 + Math.random() * 2.3, s: 0.25 + Math.random() * 0.7, p: Math.random() * 6.28 }))
    }
    size()
    addEventListener('resize', size)
    let t0 = 0
    const draw = (now) => {
      if (!on) return
      const dt = Math.min(0.05, (now - (t0 || now)) / 1000)
      t0 = now
      ctx.clearRect(0, 0, W, H)
      for (const f of flakes) {
        f.y += f.s * 28 * dt * (0.6 + f.r / 3)
        f.p += dt * 0.9
        f.x += Math.sin(f.p) * 0.25
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W }
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, 6.283)
        ctx.fillStyle = `rgba(150,182,212,${(0.25 + f.r / 6).toFixed(2)})`
        ctx.fill()
      }
      requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
    document.addEventListener('visibilitychange', () => {
      on = !document.hidden
      if (on) { t0 = 0; requestAnimationFrame(draw) }
    })
  }

  render()
}
