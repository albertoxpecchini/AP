// ─────────────────────────────────────────────────────────────────────────────
//  ANNUNCI — gli storyboard dei banner di «Better Call Pekko», composti a
//  strati come si faceva nel 2008 con Photoshop 7: un fondo, le foto stock,
//  i ritagli di Pekko appoggiati al bordo basso, testo Impact estruso in 3D
//  (bianco con i bordi colorati, come vuole Alberto), starburst, nastri,
//  bottoni in rilievo. rendi.mjs fotografa ogni fotogramma con il browser
//  headless e lo salva come JPEG (fisso) o GIF (più fotogrammi: lo sfondo resta
//  fermo, cambiano solo Pekko e le scritte che lampeggiano).
//
//  Ingredienti: tools/assistenza/lavoro/scelte/<nome>.png (ritagli con alpha
//  pulita e sfondi). `richiede` elenca quelli che servono: se manca uno, rendi
//  salta l'annuncio. Le misure sono quelle dei banner del sito di riferimento;
//  gli «sky-*» sono i grattacieli 160 px delle colonne pubblicitarie laterali.
//  Tutto il testo è in inglese: la parodia è di un sito americano. Le aziende
//  non esistono. Su Apple si scherza, non si mente.
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from 'node:url'

export const SCELTE_DIR = fileURLToPath(new URL('./lavoro/scelte/', import.meta.url))
const SRC = new URL('./lavoro/scelte/', import.meta.url).href

export const TEL = '351-035-5506'

// ── Stile comune dei fotogrammi ──────────────────────────────────────────────

export const CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:#fff}
.f{position:relative;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#000;line-height:1}
.l{position:absolute;margin:0;line-height:1}
.t{white-space:nowrap}
.imp{font-family:Impact,'Arial Black',sans-serif;text-transform:uppercase}
.ab{font-family:'Arial Black',Arial,sans-serif;font-weight:900}
.scr{font-family:'Brush Script MT','Brush Script Std',cursive;font-style:italic}
.ser{font-family:'Times New Roman',Times,serif}
.cs{font-family:'Comic Sans MS',cursive}
.th{font-family:Tahoma,Verdana,sans-serif}
.vd{font-family:Verdana,Tahoma,sans-serif}
img.l{display:block}
.play{position:absolute;width:46px;height:32px;left:50%;top:50%;margin:-16px 0 0 -23px;background:rgba(0,0,0,.6);border:2px solid #fff;border-radius:5px;box-shadow:0 0 6px rgba(0,0,0,.6)}
.play::after{content:'';position:absolute;left:17px;top:7px;border-left:14px solid #fff;border-top:8px solid transparent;border-bottom:8px solid transparent}
.btn{position:absolute;font:bold 14px/1 'Arial Black',Arial,sans-serif;color:#000;background:linear-gradient(#fff36b,#f7d117 45%,#e0b100);border:2px outset #ffe66b;padding:6px 12px;text-transform:uppercase;box-shadow:2px 2px 0 #000;white-space:nowrap}
.btn.xp{font:bold 12px/1 Tahoma,Verdana,sans-serif;color:#000;background:linear-gradient(#fdfdfd,#e3e3e3);border:1px solid #003c74;border-radius:3px;padding:5px 12px;text-transform:none;box-shadow:inset 0 0 0 1px #fff,1px 1px 0 #888}
.btn.pp{font:bold italic 16px/1 Verdana,sans-serif;color:#003087;background:linear-gradient(#ffe89a,#ffc439 50%,#f0a500);border:1px solid #c98a00;border-radius:14px;padding:7px 22px;text-transform:none;box-shadow:0 1px 0 #fff inset,1px 1px 2px rgba(0,0,0,.4)}
.eula{position:absolute;font-family:'Times New Roman',serif;font-size:9px;line-height:1.22;color:rgba(70,45,10,.32);text-align:justify;white-space:normal;padding:4px 6px}
`

// ── Aiutanti ─────────────────────────────────────────────────────────────────

const UNITLESS = new Set(['opacity', 'z-index', 'line-height', 'font-weight'])
const st = (o = {}) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}:${typeof v === 'number' && !UNITLESS.has(k) ? `${v}px` : v}`)
    .join(';')

const pos = ({ x, y, bottom, right, w, h, z, rotate, op, flip } = {}) => ({
  left: x,
  top: y,
  bottom,
  right,
  width: w,
  height: h,
  'z-index': z,
  opacity: op,
  transform: rotate !== undefined || flip ? `${flip ? 'scaleX(-1) ' : ''}${rotate !== undefined ? `rotate(${rotate}deg)` : ''}`.trim() : undefined,
})

/** L'estrusione 3D: n ombre dure a scalare, più una sfumata. */
export const ex = (color = '#000', n = 4, blur = 6) =>
  Array.from({ length: n }, (_, i) => `${i + 1}px ${i + 1}px 0 ${color}`)
    .concat(blur ? [`${n + 2}px ${n + 3}px ${blur}px rgba(0,0,0,.55)`] : [])
    .join(',')

// I toni: lettere bianche, bordo colorato, estrusione più scura dello stesso colore.
export const TONI = {
  r: { stroke: '#e21212', exc: '#8a0000' },
  b: { stroke: '#0a35d6', exc: '#001a66' },
  y: { stroke: '#f0a500', exc: '#8a5a00' },
  k: { stroke: '#111111', exc: '#000000' },
  g: { stroke: '#1d8b2b', exc: '#0a4a14' },
  p: { stroke: '#7b2fbe', exc: '#3a0d66' },
  o: { stroke: '#ff6a00', exc: '#7a3300' },
  m: { stroke: '#ff2fd0', exc: '#7a0060' },
  n: { stroke: '#0b1f4d', exc: '#000000' },
}

/** Testo Impact estruso: bianco con il bordo del tono (`tone`), sempre in 3D. */
export const t3d = (text, { size = 40, tone = 'r', color = '#fff', stroke, exc, sw = 2, n = 4, blur = 6, font = 'imp', italic, spacing, w, align = 'left', lh = 1, ...p } = {}) => {
  const t = TONI[tone] || TONI.r
  const bordo = stroke === null ? undefined : stroke || t.stroke
  return `<div class="l ${font}${w ? '' : ' t'}" style="${st({ ...pos(p), width: w, 'font-size': size, color, 'text-shadow': ex(exc || t.exc, n, blur), '-webkit-text-stroke': bordo ? `${sw}px ${bordo}` : undefined, 'paint-order': bordo ? 'stroke fill' : undefined, 'font-style': italic ? 'italic' : undefined, 'letter-spacing': spacing, 'text-align': align, 'line-height': lh })}">${text}</div>`
}

/** Testo piatto (Arial Black, serif, Comic Sans…), con ombra facoltativa. */
export const txt = (text, { size = 14, color = '#000', font = 'ab', shadow, stroke, sw = 1, italic, spacing, w, align = 'left', lh = 1.1, weight, ...p } = {}) =>
  `<div class="l ${font}${w ? '' : ' t'}" style="${st({ ...pos(p), width: w, 'font-size': size, color, 'text-shadow': shadow, '-webkit-text-stroke': stroke ? `${sw}px ${stroke}` : undefined, 'paint-order': stroke ? 'stroke fill' : undefined, 'font-style': italic ? 'italic' : undefined, 'letter-spacing': spacing, 'text-align': align, 'line-height': lh, 'font-weight': weight })}">${text}</div>`

/** Un ingrediente (PNG di lavoro/scelte). Con `bottom` la figura poggia sul bordo basso. */
export const img = (nome, p = {}) => `<img class="l" src="${SRC}${nome}.png" style="${st(pos(p))}">`

export const box = (inner, { bg, style = {}, ...p } = {}) => `<div class="l" style="${st({ ...pos(p), background: bg, ...style })}">${inner}</div>`

export const frame = (w, h, bg, layers) => `<div class="f" style="${st({ width: w, height: h, background: bg })}">${layers.join('')}</div>`

/** Starburst «OFFERTA!»: un poligono a punte con il testo centrato. */
export const star = (text, { d = 90, color = '#ff0000', tcolor = '#fff', size = 13, rotate = -12, points = 16, font = 'ab', ...p } = {}) => {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? 0.37 : 0.5
    const a = (i / (points * 2)) * Math.PI * 2
    pts.push(`${(50 + Math.cos(a) * r * 100).toFixed(1)}% ${(50 + Math.sin(a) * r * 100).toFixed(1)}%`)
  }
  return `<div class="l" style="${st({ ...pos(p), width: d, height: d, transform: `rotate(${rotate}deg)` })}"><div style="position:absolute;inset:0;background:${color};clip-path:polygon(${pts.join(',')})"></div><div class="${font}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;color:${tcolor};font-size:${size}px;line-height:1.05;white-space:normal;padding:${Math.round(d * 0.2)}px">${text}</div></div>`
}

/** Testo ad arco (SVG textPath). `id` deve essere diverso per ogni arco dello stesso fotogramma. */
export const arc = (text, { id = 'a', w = 220, r = 170, size = 22, fill = '#fff', stroke = '#c8102e', sw = 3, font = 'Arial Black', ...p } = {}) => {
  const h = Math.round(size * 2.6)
  return `<svg class="l" style="${st(pos(p))}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><path id="${id}" d="M 4 ${h - 6} A ${r} ${r} 0 0 1 ${w - 4} ${h - 6}"/></defs><text font-family="${font}" font-size="${size}" font-weight="900" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" paint-order="stroke" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${text}</textPath></text></svg>`
}

/** Il nastro delle «cause»: due bande incrociate con le punte in basso. */
export const ribbon = ({ h = 80, color = '#3ec1d3', ...p } = {}) => {
  const bar = (rot) => `<div style="position:absolute;left:38%;top:0;width:24%;height:100%;background:${color};border-radius:50% 50% 0 0/40% 40% 0 0;transform:rotate(${rot}deg);transform-origin:50% 28%;box-shadow:1px 1px 2px rgba(0,0,0,.5)"></div>`
  return `<div class="l" style="${st({ ...pos(p), width: Math.round(h * 0.62), height: h })}">${bar(24)}${bar(-24)}</div>`
}

export const btn = (text, { xp, pp, size = 14, ...p } = {}) => `<div class="btn${xp ? ' xp' : ''}${pp ? ' pp' : ''}" style="${st({ ...pos(p), 'font-size': size })}">${text}</div>`

export const play = () => `<div class="play"></div>`

/** Il marchio: titolo in corsivo, PEKKO in Impact bianco bordato di rosso, la qualifica spaziata. */
export const logo = ({ scale = 1, dark = false, w = 230, ...p } = {}) =>
  box(
    `<div class="scr t" style="font-size:${Math.round(29 * scale)}px;line-height:1;color:${dark ? '#fffbe6' : '#000'};transform:rotate(-3deg);padding-left:${Math.round(8 * scale)}px;${dark ? '-webkit-text-stroke:1px #000;paint-order:stroke fill;' : ''}">"Better Call Pekko!"</div>
     <div class="imp t" style="font-size:${Math.round(36 * scale)}px;line-height:1;color:#fff;-webkit-text-stroke:${(2 * scale).toFixed(1)}px #e21212;paint-order:stroke fill;text-shadow:${ex('#8a0000', 3, 0)};margin-top:${Math.round(2 * scale)}px;letter-spacing:.02em">PEKKO</div>
     <div class="ab t" style="font-size:${Math.round(8.5 * scale)}px;line-height:1;letter-spacing:.28em;color:${dark ? '#fff' : '#000'};margin-top:${Math.round(4 * scale)}px;padding-left:${Math.round(3 * scale)}px">I'M THE COMPUTER GUY</div>`,
    { w: Math.round(w * scale), ...p },
  )

const EULA = `END USER LICENSE AGREEMENT. IMPORTANT — READ CAREFULLY: By calling, e-mailing, thinking about, or standing near Pekko ("the Computer Guy") you agree to be bound by the terms of this Agreement. 1. GRANT OF LICENSE. The Computer Guy grants you a non-exclusive, non-transferable right to have your computer looked at, sighed over, and eventually fixed. 2. RESTRICTIONS. You may not download "free" screensavers, install seventeen toolbars, or click "YES" on anything that says "YOUR PC IS INFECTED" in red letters. 3. DUPLICATE FILES. All copies of copies of copies of your holiday photos remain your responsibility until proven otherwise. 4. PRINTERS. The Computer Guy makes no warranty, express or implied, that any printer will ever print again; printers are governed by separate, older laws. 5. WINDOWS VISTA. See Section 4. 6. GOVERNING LAW. This Agreement shall be governed by the laws of Rivalta sul Mincio and the ancient customs of the Mincio river. 7. ENTIRE AGREEMENT. Any other agreement is a duplicate and will be deleted with your permission. Si parla italiano. kthxbai.`

const STRIP = 30 // il nastro rosso «want emails» in fondo alla testata
const BANDA = (testo = 'BETTER CALL PEKKO') => box(txt(testo, { x: 12, y: 8, size: 12, color: '#fff', spacing: '.1em' }) + txt(`${TEL} · SI PARLA ITALIANO`, { right: 12, y: 9, size: 9, color: '#fff', font: 'th', weight: 'bold' }), { x: 0, bottom: 0, w: 390, h: 26, bg: '#e21212' })

// ── Gli annunci ──────────────────────────────────────────────────────────────

export const annunci = {
  // La testata: esplosione a sinistra con Pekko fermo davanti, pergamena della
  // EULA al centro con il marchio, Pekko grande a destra che cambia posa.
  header: {
    w: 960,
    h: 234,
    fps: 1,
    richiede: ['bg-esplosione', 'full-sfilata-3', 'hero-punta', 'cut-pollici', 'cut-telefono'],
    frames: () =>
      [
        ['hero-punta', { w: 150, x: 792 }],
        ['cut-pollici', { w: 200, x: 770 }],
        ['cut-telefono', { w: 196, x: 772 }],
      ].map(([fig, p]) =>
        frame(960, 234, '#fdea0a', [
          box(img('bg-esplosione', { w: 400, x: -8, y: -14 }) + img('full-sfilata-3', { w: 72, x: 250, bottom: 0 }), { x: 0, y: 0, w: 385, h: 234 - STRIP, style: { overflow: 'hidden' } }),
          box(`<div class="eula" style="left:0;top:0;width:100%;height:100%">${EULA}</div>`, { x: 385, y: 0, w: 405, h: 234 - STRIP, bg: 'linear-gradient(90deg,#fff36b,#f9d423 40%,#f3c400)', style: { overflow: 'hidden' } }),
          t3d('"Better Call Pekko!"', { x: 400, y: 14, size: 50, font: 'scr', color: '#fffbe6', tone: 'k', sw: 1.5, n: 3, blur: 4, rotate: -4, w: 380, align: 'center' }),
          t3d('PEKKO', { x: 392, y: 84, size: 78, tone: 'r', sw: 3, n: 5, w: 392, align: 'center', spacing: '.03em' }),
          txt("I'M THE COMPUTER GUY", { x: 392, y: 166, size: 13, spacing: '.32em', w: 392, align: 'center' }),
          txt(`${TEL} &nbsp;·&nbsp; VIA BELVEDERE 1, RIVALTA SUL MINCIO (MN) &nbsp;·&nbsp; SI PARLA ITALIANO`, { x: 386, y: 186, size: 9, color: '#7a0000', w: 404, align: 'center', font: 'th', weight: 'bold' }),
          box('', { x: 790, y: 0, w: 170, h: 234 - STRIP, bg: 'radial-gradient(circle at 55% 35%,#fff27a,#f5c400 60%,#dda200)' }),
          img(fig, { ...p, bottom: STRIP }),
          box(txt('WANT EMAILS FROM PEKKO? CLICK HERE!!!', { x: 0, y: 6, w: 960, align: 'center', size: 17, color: '#ffe600', italic: true, shadow: '2px 2px 0 #000' }), { x: 0, bottom: 0, w: 960, h: STRIP, bg: '#e21212' }),
        ]),
      ),
  },

  welcome: {
    w: 960,
    h: 86,
    richiede: ['prop-bilancia'],
    frames: () => [
      frame(960, 86, 'linear-gradient(#ffe93a,#f9c800 55%,#ecb400)', [
        img('prop-bilancia', { w: 80, x: 60, bottom: 2 }),
        img('prop-bilancia', { w: 80, right: 60, bottom: 2, flip: true }),
        t3d('WELCOME, PC ABUSERS!', { x: 0, y: 12, w: 960, align: 'center', size: 62, tone: 'r', sw: 3, n: 5 }),
      ]),
    ],
  },

  'fixed-my-pc': {
    w: 158,
    h: 155,
    fps: 2,
    richiede: ['stock-urlo'],
    frames: () =>
      ['m', 'k'].map((tone) =>
        frame(158, 155, '#ff33cc', [
          img('stock-urlo', { w: 150, x: 4, y: 4 }),
          t3d('PEKKO FIXED', { x: 0, y: 98, w: 158, align: 'center', size: 22, tone, n: 3, blur: 0 }),
          t3d('MY PC!!!!', { x: 0, y: 124, w: 158, align: 'center', size: 24, tone, n: 3, blur: 0 }),
        ]),
      ),
  },

  ...Object.fromEntries(
    [
      ['thumb-1', 'cut-punta', 84],
      ['thumb-2', 'cut-stampante', 90],
      ['thumb-3', 'cut-telefono', 90],
      ['thumb-4', 'cut-boh', 92],
    ].map(([nome, fig, w]) => [
      nome,
      { w: 160, h: 108, q: 6, richiede: ['bg-ufficio', fig], frames: () => [frame(160, 108, '#000', [img('bg-ufficio', { w: 162, x: -1, y: -1 }), img(fig, { w, x: Math.round((160 - w) / 2), bottom: 0 }), play()])] },
    ]),
  ),

  portrait: {
    w: 160,
    h: 190,
    richiede: ['hero-punta'],
    frames: () => [frame(160, 190, 'radial-gradient(circle at 50% 30%,#fff27a,#f5c400 60%,#dda200)', [img('hero-punta', { w: 140, x: 10, bottom: 0 })])],
  },

  poster: {
    w: 152,
    h: 378,
    richiede: ['bg-campagna', 'full-appoggio', 'prop-tower'],
    frames: () => [
      frame(152, 378, '#000', [
        img('bg-campagna', { h: 378, x: -50, y: 0 }),
        t3d('"Better Call', { x: 0, y: 10, w: 152, align: 'center', size: 24, font: 'scr', color: '#fffbe6', tone: 'k', sw: 1, n: 2, blur: 3, rotate: -3 }),
        t3d('Pekko!"', { x: 0, y: 40, w: 152, align: 'center', size: 34, tone: 'r', n: 3 }),
        img('prop-tower', { w: 40, x: 12, bottom: 64 }),
        img('full-appoggio', { w: 92, x: 46, bottom: 62 }),
        box('', { x: 0, bottom: 0, w: 152, h: 62, bg: '#111' }),
        txt('EVERY NIGHT 3AM', { x: 0, y: 322, w: 152, align: 'center', size: 15, color: '#fff' }),
        t3d('CHANNEL 47', { x: 0, y: 342, w: 152, align: 'center', size: 15, tone: 'y', n: 2, blur: 0 }),
        box(txt('AP tv', { x: 0, y: 3, w: 36, align: 'center', size: 9, color: '#000' }), { right: 8, bottom: 6, w: 36, h: 15, bg: '#fff' }),
        txt('si parla italiano', { x: 8, bottom: 8, size: 7, color: '#aaa', font: 'th' }),
      ]),
    ],
  },

  getspace: {
    w: 301,
    h: 389,
    fps: 1,
    richiede: ['stock-bimbo', 'cut-pollici'],
    frames: () =>
      [
        ['#fff', '#0a35d6', 'b'],
        ['#0a35d6', '#ffe600', 'r'],
      ].map(([bandBg, bandFg, callTone]) =>
        frame(301, 389, '#fff', [
          img('stock-bimbo', { w: 301, x: 0, y: 40 }),
          box(txt('GET $PACE NOW !!!', { x: 0, y: 8, w: 301, align: 'center', size: 25, color: bandFg, italic: true, shadow: '2px 2px 0 rgba(0,0,0,.35)' }), { x: 0, y: 0, w: 301, h: 40, bg: bandBg }),
          t3d('I can prove', { x: 12, y: 46, size: 42, tone: 'k', n: 4 }),
          t3d("that virus isn't yours!", { x: 12, y: 96, size: 27, tone: 'k', n: 3, w: 280 }),
          t3d('CALL TODAY!', { x: 10, y: 244, size: 40, tone: callTone, n: 3, sw: 2.5 }),
          txt('(NOT TOLL FREE)', { x: 14, y: 290, size: 12, color: '#0a35d6' }),
          box('', { x: 0, y: 322, w: 301, h: 67, bg: '#fff' }),
          txt('Better Call Pekko', { x: 10, y: 324, size: 28, color: '#0a35d6', font: 'scr' }),
          t3d(TEL, { x: 10, y: 354, size: 30, tone: 'b', n: 3, blur: 0 }),
          img('cut-pollici', { w: 118, right: -6, bottom: 0 }),
        ]),
      ),
  },

  vista: {
    w: 264,
    h: 187,
    richiede: ['stock-tv'],
    frames: () => [
      frame(264, 187, 'radial-gradient(circle at 30% 30%,#1a3a80,#0b1f4d 70%)', [
        ribbon({ x: 22, y: 26, h: 90, color: '#2f7bff' }),
        txt('HAVE YOU OR<br>SOMEONE YOU KNOW<br>BEEN AFFECTED BY<br>THE TRAGEDY OF<br>WINDOWS VISTA?', { x: 100, y: 14, w: 156, align: 'center', size: 13, color: '#fff', lh: 1.25 }),
        t3d('PEKKO CAN HELP!', { x: 96, y: 138, size: 24, tone: 'y', n: 3, blur: 0 }),
        img('stock-tv', { w: 72, x: 12, bottom: 8 }),
      ]),
    ],
  },

  hermanos: {
    w: 222,
    h: 186,
    richiede: ['stock-hermanos'],
    frames: () => [
      frame(222, 186, 'repeating-linear-gradient(45deg,#d9a066 0 6px,#d3985c 6px 12px)', [
        arc('LOS BACKUPS HERMANOS', { id: 'h1', x: 0, y: 2, w: 222, r: 190, size: 14 }),
        img('stock-hermanos', { w: 132, x: 6, bottom: 6 }),
        star('¡QUE SEGURO!', { d: 82, x: 138, y: 78, color: '#ffd100', tcolor: '#c8102e', rotate: -14, size: 12 }),
        txt('since 1998', { x: 150, y: 160, size: 9, color: '#5a2b00', font: 'cs' }),
      ]),
    ],
  },

  // «McGill & McGill Menswear» → PEKKO'S OUTFIT: la sfilata, che cammina.
  fashion: {
    w: 486,
    h: 205,
    fps: 1,
    richiede: ['full-sfilata-1', 'full-sfilata-2', 'full-sfilata-3', 'full-sfilata-4'],
    frames: () =>
      [0, 1].map((k) =>
        frame(486, 205, 'radial-gradient(ellipse at 72% 40%,#4a4a4a 0,#000 70%)', [
          t3d("PEKKO'S", { x: 12, y: 8, size: 40, tone: 'r', n: 3, blur: 0 }),
          t3d('OUTFIT', { x: 12, y: 50, size: 40, tone: 'r', n: 3, blur: 0 }),
          txt('MENSWEAR · SINCE 2006', { x: 14, y: 96, size: 11, color: '#fff', spacing: '.12em' }),
          star('50% OFF ALL SUITS', { d: 72, x: 186, y: 6, color: '#ffd100', tcolor: '#000', rotate: 10, size: 11 }),
          t3d('DRESS LIKE PEKKO!', { x: 12, y: 128, size: 24, tone: 'k', n: 3, blur: 0 }),
          btn('FASHION SHOW', { x: 12, y: 162 }),
          img('full-sfilata-1', { w: 70, x: 254 - k * 18, bottom: 0 }),
          img('full-sfilata-2', { w: 70, x: 310 - k * 12, bottom: 0 }),
          img('full-sfilata-3', { w: 66, x: 366 - k * 8, bottom: 0, flip: k === 1 }),
          img('full-sfilata-4', { w: 88, x: 410 - k * 4, bottom: 0 }),
        ]),
      ),
  },

  // Le e-card: sei cartoline da mandare agli amici con problemi.
  ...Object.fromEntries(
    [
      {
        nome: 'ecard-1',
        bg: 'linear-gradient(#6fb3ff,#ffffff 70%)',
        fig: ['cut-punta', { w: 150, x: -4, bottom: 26 }],
        strati: [
          txt('VIRUS PROBLEM?', { x: 16, y: 14, size: 26, color: '#000' }),
          txt("I'LL TURN THAT MALWARE<br>INTO A SCREENSAVER!", { x: 146, y: 54, w: 240, align: 'center', size: 15, color: '#e21212', lh: 1.15 }),
          logo({ x: 166, y: 146, scale: 0.8 }),
          star('CALL NOW!', { d: 70, x: 312, y: 176, color: '#ffd100', tcolor: '#e21212', rotate: 12, size: 12 }),
        ],
      },
      {
        nome: 'ecard-2',
        bg: 'linear-gradient(#ff8c00,#ffd400)',
        fig: ['cut-pistole', { w: 172, right: -14, bottom: 26 }],
        strati: [
          txt('DUPLICATE FILES?', { x: 16, y: 14, size: 24, color: '#fff', shadow: '2px 2px 0 #000' }),
          txt('"Better Call Pekko"', { x: 18, y: 52, size: 26, color: '#000', font: 'scr' }),
          txt('I CAN MAKE THEM<br>DISAPPEAR!', { x: 16, y: 92, w: 230, size: 20, color: '#e21212', lh: 1.15, shadow: '1px 1px 0 #fff' }),
          logo({ x: 16, y: 146, scale: 0.8 }),
          t3d('CALL RISK FREE NOW!', { x: 16, y: 212, size: 18, tone: 'k', n: 2, blur: 0 }),
        ],
      },
      {
        nome: 'ecard-3',
        bg: 'linear-gradient(#e21212,#ff7b00)',
        fig: ['cut-stampante', { w: 172, right: -10, bottom: 26 }],
        strati: [
          txt('PRINTER PROBLEMS?', { x: 16, y: 12, size: 24, color: '#fff', shadow: '2px 2px 0 #000' }),
          txt('"Better Call Pekko"', { x: 18, y: 50, size: 26, color: '#fff', font: 'scr' }),
          txt("I'LL PROVE IT'S<br>NOT YOUR FAULT", { x: 16, y: 84, w: 220, size: 17, color: '#ffe600', lh: 1.15, shadow: '1px 1px 0 #000' }),
          txt('(AND HELP YOU FIND ANOTHER PRINTER)', { x: 16, y: 128, w: 210, size: 10, color: '#fff' }),
          logo({ x: 16, y: 158, scale: 0.75, dark: true }),
          t3d('CALL PEKKO NOW!', { x: 16, y: 218, size: 17, tone: 'k', n: 2, blur: 0 }),
        ],
      },
      {
        nome: 'ecard-4',
        bg: 'linear-gradient(#f3cf4a 0,#f3cf4a 42%,#1a1a1a 43%)',
        fig: ['cut-braccia', { w: 150, right: 0, bottom: 26 }],
        strati: [
          txt('WARRANT OUT<br>FOR YOUR HARD DRIVE?', { x: 16, y: 14, w: 250, size: 22, color: '#000', font: 'ser', spacing: '.04em', lh: 1.2 }),
          txt('I KNOW A GUY<br>WHO KNOWS A GUY<br>WHO WILL TAKE CARE OF IT.', { x: 16, y: 122, w: 220, size: 16, color: '#f3cf4a', font: 'ser', lh: 1.3 }),
          txt('BETTER CALL PEKKO', { x: 16, y: 200, size: 18, color: '#fff', font: 'ser', spacing: '.12em' }),
          txt(`Pekko — I'm the computer guy · ${TEL}`, { x: 16, y: 226, size: 11, color: '#f3cf4a', font: 'ser', italic: true }),
        ],
        senzaBanda: true,
      },
      {
        nome: 'ecard-5',
        bg: 'linear-gradient(#b8e986,#2e8b57)',
        fig: ['cut-boh', { w: 160, right: -10, bottom: 26 }],
        strati: [
          txt('SLOW PC?', { x: 16, y: 14, size: 30, color: '#fff', shadow: '2px 2px 0 #1a3d1a' }),
          txt("I'LL TURN THAT PENTIUM INTO A…<br>SLIGHTLY FASTER PENTIUM!", { x: 16, y: 56, w: 224, size: 15, color: '#1a3d1a', lh: 1.15 }),
          logo({ x: 16, y: 136, scale: 0.8 }),
          txt('*results may vary. results usually vary.', { x: 16, y: 218, size: 9, color: '#1a3d1a', font: 'cs' }),
        ],
      },
      {
        nome: 'ecard-6',
        bg: 'linear-gradient(#f5e6ff,#c06cff)',
        fig: ['cut-cartello', { w: 168, right: -4, bottom: 26 }],
        strati: [
          txt('FORGOT YOUR PASSWORD?', { x: 16, y: 14, w: 210, size: 22, color: '#4b0082', lh: 1.1 }),
          txt("I'LL GUESS IT.<br>(IT'S YOUR CAT'S NAME.)", { x: 16, y: 78, w: 210, size: 16, color: '#000', lh: 1.25 }),
          logo({ x: 16, y: 140, scale: 0.8 }),
          t3d('CALL NOW!!!', { x: 16, y: 208, size: 18, tone: 'p', n: 2, blur: 0 }),
          txt('hunter2', { right: 22, y: 178, w: 118, align: 'center', size: 22, color: '#000', font: 'cs', rotate: -2 }),
        ],
      },
    ].map(({ nome, bg, fig, strati, senzaBanda }) => [
      nome,
      { w: 390, h: 270, richiede: [fig[0]], frames: () => [frame(390, 270, bg, [img(fig[0], fig[1]), ...strati, ...(senzaBanda ? [] : [BANDA()])])] },
    ]),
  ),

  million: {
    w: 468,
    h: 60,
    fps: 3,
    colori: 32,
    richiede: [],
    frames: () =>
      [
        ['#0000ff', '#ffff00', 'b'],
        ['#ffff00', '#ff0000', 'r'],
        ['#ff0000', '#ffffff', 'k'],
      ].map(([bg, fg, tone]) =>
        frame(468, 60, bg, [
          box('', { x: 2, y: 2, w: 464, h: 56, style: { border: '2px dotted #fff' } }),
          txt('CONGRATULATIONS!!! YOU ARE THE 1,000,000th VISITOR!', { x: 0, y: 9, w: 468, align: 'center', size: 14, color: fg }),
          t3d('CLICK HERE TO CLAIM YOUR PRIZE &gt;&gt;&gt;', { x: 0, y: 30, w: 468, align: 'center', size: 20, tone, n: 2, blur: 0 }),
        ]),
      ),
  },

  toolbar: {
    w: 468,
    h: 60,
    q: 4,
    richiede: [],
    frames: () => [
      frame(468, 60, 'linear-gradient(#f4f4f4,#c9c9c9)', [
        box(txt('BCP', { x: 0, y: 12, w: 44, align: 'center', size: 14, color: '#fff', font: 'imp' }), { x: 8, y: 8, w: 44, h: 44, bg: 'linear-gradient(#3b78e7,#0a49d4)', style: { border: '1px solid #003c74', 'border-radius': '4px' } }),
        txt('DOWNLOAD THE BETTER CALL PEKKO TOOLBAR — FREE!', { x: 62, y: 10, size: 13, color: '#003399' }),
        txt('*Contains 0 viruses (probably). Works with Internet Explorer 6 and above. Cannot be uninstalled.', { x: 62, y: 32, size: 9, color: '#333', font: 'th', weight: 'normal' }),
        btn('Download now', { xp: true, right: 10, y: 16 }),
      ]),
    ],
  },

  // ── Le aziende che non esistono ────────────────────────────────────────────
  mattress: {
    w: 300,
    h: 250,
    richiede: ['stock-materasso'],
    frames: () => [
      frame(300, 250, '#000', [
        img('stock-materasso', { w: 300, x: 0, y: -20 }),
        t3d('MINCIO DISCOUNT', { x: 10, y: 8, size: 30, tone: 'r', n: 3 }),
        t3d('MATTRESS BARN', { x: 10, y: 42, size: 34, tone: 'r', n: 3 }),
        star("WE WON'T BE UNDERSOLD!!!", { d: 98, right: 4, y: 76, color: '#ffd100', tcolor: '#e21212', rotate: -12, size: 11 }),
        box(txt('NO CREDIT? NO PROBLEM! NO MATTRESS? BIG PROBLEM.', { x: 0, y: 8, w: 300, align: 'center', size: 11, color: '#fff' }) + txt('ALSO: LAPTOPS.', { x: 0, y: 30, w: 300, align: 'center', size: 10, color: '#ffe600' }), { x: 0, bottom: 0, w: 300, h: 50, bg: 'rgba(0,0,0,.78)' }),
      ]),
    ],
  },
  salami: {
    w: 234,
    h: 60,
    richiede: ['stock-salame'],
    frames: () => [
      frame(234, 60, '#7a1a1a', [
        img('stock-salame', { w: 80, x: 0, y: -8 }),
        t3d("ZIO BEPPE'S", { x: 88, y: 6, size: 16, tone: 'y', n: 2, blur: 0 }),
        t3d('SALAMI &amp; WEB HOSTING', { x: 88, y: 24, size: 15, tone: 'k', n: 2, blur: 0 }),
        txt('99.9% UPTIME · 100% PORK', { x: 88, y: 45, size: 8, color: '#ffe600' }),
      ]),
    ],
  },
  turtle: {
    w: 180,
    h: 150,
    richiede: ['stock-tartaruga'],
    frames: () => [
      frame(180, 150, '#000', [
        img('stock-tartaruga', { w: 180, x: 0, y: -14 }),
        t3d('TURTLE INSURANCE CO.', { x: 0, y: 8, w: 180, align: 'center', size: 19, tone: 'g', n: 2 }),
        box(txt('SLOW. STEADY. INSURED.', { x: 0, y: 6, w: 180, align: 'center', size: 11, color: '#1d8b2b' }) + txt('est. 1897 · claims processed in 4–6 decades', { x: 0, y: 22, w: 180, align: 'center', size: 7, color: '#333', font: 'th', weight: 'normal' }), { x: 0, bottom: 0, w: 180, h: 36, bg: 'rgba(255,255,255,.88)' }),
      ]),
    ],
  },
  snail: {
    w: 180,
    h: 150,
    richiede: ['stock-lumaca'],
    frames: () => [
      frame(180, 150, '#000', [
        img('stock-lumaca', { w: 180, x: 0, y: -14 }),
        t3d('SNAIL EXPRESS', { x: 0, y: 6, w: 180, align: 'center', size: 22, tone: 'o', n: 2 }),
        t3d('COURIER', { x: 0, y: 30, w: 180, align: 'center', size: 15, tone: 'k', n: 2, blur: 0 }),
        box(txt("IT'LL GET THERE.", { x: 0, y: 6, w: 180, align: 'center', size: 11, color: '#ff6a00' }) + txt('4–6 weeks, guaranteed*', { x: 0, y: 22, w: 180, align: 'center', size: 7, color: '#333', font: 'th', weight: 'normal' }), { x: 0, bottom: 0, w: 180, h: 36, bg: 'rgba(255,255,255,.88)' }),
      ]),
    ],
  },
  gino: {
    w: 300,
    h: 100,
    richiede: [],
    frames: () => [
      frame(300, 100, 'radial-gradient(circle at 30% 40%,#ff5a5a,#c00000 70%)', [
        t3d("CRAZY GINO'S", { x: 10, y: 6, size: 26, tone: 'y', n: 3 }),
        t3d('DISCOUNT LAPTOPS', { x: 10, y: 36, size: 22, tone: 'k', n: 3 }),
        txt("PRICES SO LOW THEY'RE PROBABLY ILLEGAL!!!", { x: 10, y: 68, w: 210, size: 9, color: '#ffe600', lh: 1.2 }),
        star('€199!!!', { d: 76, right: 6, y: 10, color: '#ffd100', tcolor: '#c00000', rotate: 8, size: 15 }),
      ]),
    ],
  },
  pizza: {
    w: 300,
    h: 250,
    richiede: ['stock-pizza'],
    frames: () => [
      frame(300, 250, '#000', [
        img('stock-pizza', { w: 300, x: 0, y: -20 }),
        t3d("GINO'S PIZZA", { x: 10, y: 8, size: 32, tone: 'r', n: 3 }),
        t3d('&amp; DATA RECOVERY', { x: 10, y: 44, size: 22, tone: 'g', n: 3 }),
        star('FREE FLOPPY WITH EVERY MARGHERITA', { d: 96, right: 4, y: 80, color: '#ffd100', tcolor: '#c00000', rotate: 12, size: 10 }),
        box(txt('WE RECOVER YOUR FILES. AND YOUR APPETITE.', { x: 0, y: 8, w: 300, align: 'center', size: 11, color: '#fff' }) + txt('delivery in 30 minutes or your data is free*', { x: 0, y: 28, w: 300, align: 'center', size: 9, color: '#ffe600', font: 'cs' }), { x: 0, bottom: 0, w: 300, h: 48, bg: 'rgba(0,0,0,.78)' }),
      ]),
    ],
  },
  tan: {
    w: 300,
    h: 100,
    richiede: ['stock-lettino'],
    frames: () => [
      frame(300, 100, 'linear-gradient(90deg,#ffb347,#ff7a00)', [
        img('stock-lettino', { w: 116, x: -4, y: -8 }),
        t3d('RIVALTA TAN', { x: 118, y: 6, size: 24, tone: 'o', n: 3, blur: 0 }),
        t3d('&amp; TONER', { x: 118, y: 34, size: 24, tone: 'k', n: 3, blur: 0 }),
        txt('GET A TAN WHILE WE REFILL YOUR CARTRIDGE', { x: 118, y: 66, w: 176, size: 9, color: '#fff', lh: 1.2 }),
        txt('UV &amp; CMYK · walk-ins welcome', { x: 118, y: 88, size: 8, color: '#5a2b00', font: 'th', weight: 'bold' }),
      ]),
    ],
  },
  dairy: {
    w: 300,
    h: 250,
    richiede: ['stock-mucca'],
    frames: () => [
      frame(300, 250, '#000', [
        img('stock-mucca', { w: 300, x: 0, y: -20 }),
        t3d('MINCIO DAIRY', { x: 10, y: 8, size: 34, tone: 'k', n: 3 }),
        t3d('CALL CENTER', { x: 10, y: 46, size: 30, tone: 'b', n: 3 }),
        box(txt('PRESS 1 FOR MILK · 2 FOR TECH SUPPORT', { x: 0, y: 7, w: 300, align: 'center', size: 10, color: '#fff' }) + txt('3 TO MOO · average wait: 4 minutes and 1 cow', { x: 0, y: 26, w: 300, align: 'center', size: 9, color: '#ffe600', font: 'cs' }), { x: 0, bottom: 0, w: 300, h: 46, bg: 'rgba(0,0,0,.78)' }),
      ]),
    ],
  },
  nonna: {
    w: 234,
    h: 60,
    richiede: ['stock-tortellini'],
    frames: () => [
      frame(234, 60, '#8b0000', [
        img('stock-tortellini', { w: 80, x: 0, y: -8 }),
        t3d("NONNA'S TORTELLINI", { x: 86, y: 5, size: 15, tone: 'y', n: 2, blur: 0 }),
        t3d('&amp; TECH SUPPORT', { x: 86, y: 23, size: 15, tone: 'k', n: 2, blur: 0 }),
        txt("she will ask if you've eaten", { x: 86, y: 44, size: 8, color: '#ffe600', font: 'cs' }),
      ]),
    ],
  },
  scooter: {
    w: 300,
    h: 100,
    richiede: ['stock-scooter'],
    frames: () => [
      frame(300, 100, 'linear-gradient(#dff1ff,#7fbfff)', [
        img('stock-scooter', { w: 116, x: -4, y: -8 }),
        t3d('MINCIO SCOOTER', { x: 116, y: 6, size: 21, tone: 'b', n: 3, blur: 0 }),
        t3d('WIRELESS', { x: 116, y: 32, size: 24, tone: 'r', n: 3, blur: 0 }),
        txt('WI-FI THAT FOLLOWS YOU (SLOWLY)', { x: 116, y: 64, w: 180, size: 9, color: '#001a66', lh: 1.2 }),
        txt('range: one village · helmet included', { x: 116, y: 86, size: 8, color: '#001a66', font: 'th', weight: 'bold' }),
      ]),
    ],
  },
  fish: {
    w: 180,
    h: 150,
    richiede: ['stock-pesce'],
    frames: () => [
      frame(180, 150, '#000', [
        img('stock-pesce', { w: 180, x: 0, y: -14 }),
        t3d('LAKE GARDA', { x: 0, y: 6, w: 180, align: 'center', size: 20, tone: 'b', n: 2 }),
        t3d('FISH &amp; CHIPS &amp; CHIPS', { x: 0, y: 28, w: 180, align: 'center', size: 15, tone: 'k', n: 2, blur: 0 }),
        box(txt('RAM FRESH DAILY', { x: 0, y: 6, w: 180, align: 'center', size: 11, color: '#0a35d6' }) + txt('DDR2 · DDR3 · cod', { x: 0, y: 22, w: 180, align: 'center', size: 7, color: '#333', font: 'th', weight: 'normal' }), { x: 0, bottom: 0, w: 180, h: 36, bg: 'rgba(255,255,255,.88)' }),
      ]),
    ],
  },
  phon: {
    w: 180,
    h: 150,
    richiede: ['stock-phon'],
    frames: () => [
      frame(180, 150, '#000', [
        img('stock-phon', { w: 180, x: 0, y: -14 }),
        t3d('BLOW-DRY PC', { x: 0, y: 8, w: 180, align: 'center', size: 24, tone: 'p', n: 2 }),
        box(txt('HAIR SALON &amp; FAN REPAIR', { x: 0, y: 6, w: 180, align: 'center', size: 10, color: '#7b2fbe' }) + txt('walk-ins welcome · no perm for PCs', { x: 0, y: 22, w: 180, align: 'center', size: 7, color: '#333', font: 'th', weight: 'normal' }), { x: 0, bottom: 0, w: 180, h: 36, bg: 'rgba(255,255,255,.88)' }),
      ]),
    ],
  },

  // Apple, presa in giro con giudizio: opinioni, niente marchi, niente bugie.
  mac: {
    w: 300,
    h: 250,
    richiede: ['stock-morso'],
    frames: () => [
      frame(300, 250, '#f4f4f4', [
        img('stock-morso', { w: 300, x: 0, y: 20 }),
        t3d('MAC BROKEN?', { x: 10, y: 8, size: 40, tone: 'k', n: 3 }),
        box(txt('YES. IT HAPPENS.', { x: 0, y: 6, w: 150, align: 'center', size: 13, color: '#000' }), { x: 10, y: 56, w: 150, h: 26, bg: '#fff', style: { border: '2px solid #000', 'border-radius': '13px' } }),
        box(t3d('WE FIX THE ONES WITH THE BITE TOO', { x: 0, y: 6, w: 300, align: 'center', size: 17, tone: 'r', n: 2, blur: 0 }) + txt('NO GENIUS REQUIRED · BRING YOUR OWN DONGLE', { x: 0, y: 30, w: 300, align: 'center', size: 9, color: '#fff' }) + txt('not affiliated with any fruit', { x: 0, y: 44, w: 300, align: 'center', size: 7, color: '#ccc', font: 'th' }), { x: 0, bottom: 0, w: 300, h: 58, bg: 'rgba(0,0,0,.82)' }),
      ]),
    ],
  },
  phones: {
    w: 300,
    h: 250,
    richiede: ['stock-telefonini'],
    frames: () => [
      frame(300, 250, '#000', [
        img('stock-telefonini', { w: 300, x: 0, y: -20 }),
        t3d('CELL PHONE CORNER', { x: 0, y: 8, w: 300, align: 'center', size: 28, tone: 'b', n: 3 }),
        star('FROM €10', { d: 74, right: 6, y: 56, color: '#ffd100', tcolor: '#0a35d6', rotate: 10, size: 13 }),
        box(txt('BACKUP · RINGTONES · UNLOCK · SCREENS · CHARGERS', { x: 0, y: 7, w: 300, align: 'center', size: 8, color: '#fff' }) + txt('ALL BRANDS. EVEN THE BITTEN ONE.', { x: 0, y: 24, w: 300, align: 'center', size: 11, color: '#ffe600' }), { x: 0, bottom: 0, w: 300, h: 46, bg: 'rgba(0,0,0,.82)' }),
      ]),
    ],
  },

  tv: {
    w: 320,
    h: 240,
    fps: 1,
    richiede: ['bg-ufficio', 'cut-punta', 'cut-pollici', 'cut-telefono', 'cut-stampante'],
    frames: () =>
      [
        ['cut-punta', 150, 85, true],
        ['cut-pollici', 165, 78, false],
        ['cut-telefono', 160, 80, true],
        ['cut-stampante', 160, 80, false],
      ].map(([fig, w, x, scritta]) =>
        frame(320, 240, '#000', [
          img('bg-ufficio', { w: 360, x: -20, y: 0 }),
          img(fig, { w, x, bottom: 0 }),
          star('AS SEEN ON TV', { d: 76, right: 6, y: 6, color: '#e21212', tcolor: '#fff', rotate: 12, size: 11 }),
          scritta ? t3d(`CALL NOW! ${TEL}`, { x: 0, y: 200, w: 320, align: 'center', size: 24, tone: 'y', n: 3, blur: 0 }) : '',
        ]),
      ),
  },

  ambulance: {
    w: 150,
    h: 70,
    fps: 2,
    richiede: ['prop-furgone'],
    frames: () =>
      ['#ff1a1a', '#1a6bff'].map((c) =>
        frame(150, 70, '#5e8eb1', [
          img('prop-furgone', { w: 140, x: 5, bottom: 4 }),
          txt('PC AMBULANCE', { x: 34, y: 33, size: 9, color: '#e21212' }),
          box('', { x: 66, y: 4, w: 14, h: 14, bg: c, style: { 'border-radius': '50%', 'box-shadow': `0 0 10px 4px ${c}` } }),
        ]),
      ),
  },

  // ── I grattacieli delle colonne laterali (160 px) ──────────────────────────
  'sky-outfit': {
    w: 160,
    h: 600,
    fps: 1,
    richiede: ['full-sfilata-1', 'full-sfilata-2'],
    frames: () =>
      [
        ['full-sfilata-2', false],
        ['full-sfilata-1', true],
      ].map(([fig, flip]) =>
        frame(160, 600, 'radial-gradient(ellipse at 50% 60%,#4a4a4a 0,#000 70%)', [
          t3d("PEKKO'S", { x: 0, y: 10, w: 160, align: 'center', size: 34, tone: 'r', n: 3, blur: 0 }),
          t3d('OUTFIT', { x: 0, y: 48, w: 160, align: 'center', size: 34, tone: 'r', n: 3, blur: 0 }),
          txt('MENSWEAR · SINCE 2006', { x: 0, y: 92, w: 160, align: 'center', size: 9, color: '#fff', spacing: '.12em' }),
          star('50% OFF', { d: 64, x: 92, y: 104, color: '#ffd100', tcolor: '#000', rotate: 12, size: 13 }),
          img(fig, { w: 122, x: 12, bottom: 62, flip }),
          box(t3d('DRESS LIKE PEKKO!', { x: 0, y: 6, w: 160, align: 'center', size: 15, tone: 'k', n: 2, blur: 0 }) + btn('SHOP NOW', { x: 40, y: 30, size: 12 }), { x: 0, bottom: 0, w: 160, h: 62, bg: '#e21212' }),
        ]),
      ),
  },
  'sky-mac': {
    w: 160,
    h: 600,
    richiede: ['stock-morso'],
    frames: () => [
      frame(160, 600, 'linear-gradient(#ffffff,#d9d9d9)', [
        txt('THINK DIFFERENT?', { x: 0, y: 14, w: 160, align: 'center', size: 13, color: '#000' }),
        t3d('THINK CHEAPER.', { x: 0, y: 36, w: 160, align: 'center', size: 22, tone: 'r', n: 3, blur: 0 }),
        img('stock-morso', { w: 150, x: 5, y: 76 }),
        t3d('PC &amp; MAC', { x: 0, y: 236, w: 160, align: 'center', size: 26, tone: 'b', n: 3, blur: 0 }),
        t3d('REPAIR', { x: 0, y: 266, w: 160, align: 'center', size: 26, tone: 'b', n: 3, blur: 0 }),
        t3d('FROM €25', { x: 0, y: 304, w: 160, align: 'center', size: 30, tone: 'g', n: 3, blur: 0 }),
        txt('NO GENIUS REQUIRED', { x: 0, y: 352, w: 160, align: 'center', size: 10, color: '#000' }),
        txt("WE WON'T JUDGE", { x: 0, y: 370, w: 160, align: 'center', size: 10, color: '#000' }),
        txt('(much)', { x: 0, y: 386, w: 160, align: 'center', size: 11, color: '#555', font: 'cs' }),
        txt('BRING YOUR OWN DONGLE', { x: 0, y: 408, w: 160, align: 'center', size: 9, color: '#000' }),
        txt('SI PARLA ITALIANO', { x: 0, y: 426, w: 160, align: 'center', size: 9, color: '#e21212' }),
        t3d(TEL, { x: 0, y: 486, w: 160, align: 'center', size: 20, tone: 'b', n: 2, blur: 0 }),
        btn('CALL PEKKO', { x: 30, y: 528, size: 13 }),
        txt('not affiliated with any fruit', { x: 0, y: 582, w: 160, align: 'center', size: 7, color: '#777', font: 'th' }),
      ]),
    ],
  },
  'sky-donate': {
    w: 160,
    h: 300,
    richiede: [],
    frames: () => [
      frame(160, 300, '#f7f7f7', [
        box(txt('SUPPORT PEKKO', { x: 0, y: 12, w: 160, align: 'center', size: 12, color: '#fff' }), { x: 0, y: 0, w: 160, h: 36, bg: 'linear-gradient(#3b78e7,#0a49d4)' }),
        t3d('BUY PEKKO', { x: 0, y: 46, w: 160, align: 'center', size: 24, tone: 'o', n: 2, blur: 0 }),
        t3d('A COFFEE', { x: 0, y: 74, w: 160, align: 'center', size: 24, tone: 'o', n: 2, blur: 0 }),
        txt('every €1 buys one (1) sigh of relief', { x: 10, y: 112, w: 140, align: 'center', size: 10, color: '#333', font: 'cs', lh: 1.25 }),
        btn('Donate', { pp: true, x: 34, y: 158 }),
        txt('via PayPal · secure · 2009 style', { x: 0, y: 202, w: 160, align: 'center', size: 8, color: '#003087', font: 'th', weight: 'bold' }),
        txt('or bring salami', { x: 0, y: 220, w: 160, align: 'center', size: 9, color: '#555', font: 'cs' }),
        t3d('THANK YOU!!! ^_^', { x: 0, y: 256, w: 160, align: 'center', size: 16, tone: 'b', n: 2, blur: 0 }),
      ]),
    ],
  },
  'sky-forum': {
    w: 160,
    h: 300,
    richiede: [],
    frames: () => [
      frame(160, 300, '#e8eef7', [
        box(t3d("PEKKO'S FORUM", { x: 0, y: 8, w: 160, align: 'center', size: 18, tone: 'b', n: 2, blur: 0 }), { x: 0, y: 0, w: 160, h: 38, bg: 'linear-gradient(#c9d6ee,#a4b8dc)', style: { 'border-bottom': '1px solid #6c86b8' } }),
        txt('1,337 members', { x: 8, y: 48, size: 10, color: '#0a35d6' }),
        txt('12,003 posts', { x: 8, y: 64, size: 10, color: '#0a35d6' }),
        txt('0 spam (lol)', { x: 8, y: 80, size: 10, color: '#0a35d6' }),
        txt('» [SOLVED] printer prints blank<br>» HELP my msn wont login!!<br>» Vista or XP???? (1,204 replies)<br>» is limewire safe? [LOCKED]<br>» best antivirus 2009 (poll)<br>» how 2 burn dvd', { x: 8, y: 104, w: 146, size: 8, color: '#000', font: 'vd', weight: 'normal', lh: 1.5 }),
        btn('REGISTER FREE', { x: 22, y: 218, size: 12 }),
        txt('newest member: xXx_D4rk_L0rd_xXx', { x: 0, y: 258, w: 160, align: 'center', size: 7, color: '#555', font: 'vd', weight: 'normal' }),
        txt('kthxbai', { x: 0, y: 276, w: 160, align: 'center', size: 10, color: '#0a35d6', font: 'cs' }),
      ]),
    ],
  },
}
