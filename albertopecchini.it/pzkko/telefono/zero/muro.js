// Il cercapersone zero sul muro (29.10): il tasto sotto il wallet (index.html #cercapersone-muro, .chat-tasto) vestito da zero
// quando nello zaino c'è «zero» (chat/chat.js, prepara, lo chiama; e lo richiama appena lo compri). La foto è la scena 3D
// fotografata di tre quarti (art/zero/zero-piccolo.webp, tools/pzkko/zero/foto.mjs), col vetro vuoto: dentro il vetro ci va
// PZK OS VIVO (os/os.js, l'lcd 256 × 128 a un bit col desktop: la chiocciolina a tutto schermo e la barra di stato), la
// stessa tela che si vede aprendo. L'lcd prende una trasformazione prospettica (matrix3d) che porta il suo rettangolo sui
// quattro angoli dello schermo in foto (muro-dati.js), così sta «dentro» il vetro, di sbieco come lui; il led dov'è il
// tubicino. Il nastro adesivo (attacco.svg) al posto del chiodo: lo zero non ha la clip. Aprendo, telefono/zero/zero.js
// parte da questa stessa posa.
import dati from './muro-dati.js'

export const FOTO = '/art/zero/zero-piccolo.webp'
export const GLB = '/art/zero/zero.glb'

/** La trasformazione proiettiva che porta il rettangolo (0,0)-(w,h) sui quattro punti p (in alto a sinistra, in alto a
 *  destra, in basso a destra, in basso a sinistra), come stringa matrix3d. */
export function omografia(w, h, [p0, p1, p2, p3]) {
  // il quadrato unitario → i quattro punti (il metodo dell'aggiunta: Heckbert, «Fundamentals of texture mapping»)
  const sx = p0[0] - p1[0] + p2[0] - p3[0], sy = p0[1] - p1[1] + p2[1] - p3[1]
  const dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0], dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1]
  const det = dx1 * dy2 - dx2 * dy1
  const g = (sx * dy2 - dx2 * sy) / det, hh = (dx1 * sy - sx * dy1) / det
  const a = p1[0] - p0[0] + g * p1[0], b = p3[0] - p0[0] + hh * p3[0], c = p0[0]
  const d = p1[1] - p0[1] + g * p1[1], e = p3[1] - p0[1] + hh * p3[1], f = p0[1]
  // prima il rettangolo → il quadrato unitario (1/w, 1/h): H = Q · S
  const H = [a / w, b / h, c, d / w, e / h, f, g / w, hh / h, 1]
  return `matrix3d(${[H[0], H[3], 0, H[6], H[1], H[4], 0, H[7], 0, 0, 1, 0, H[2], H[5], 0, H[8]].map((v) => v.toFixed(6)).join(',')})`
}

/** Veste il tasto da zero. */
export function veste(tasto) {
  if (tasto.dataset.vestito) return // (una volta sola: lo chiamano l'html della pagina, appena letto il tasto, e la chat)
  tasto.dataset.vestito = '1'
  tasto.classList.add('zero')
  // le regole del tasto vestito stanno in zero.css, che il cercapersone carica solo aprendosi
  if (!document.querySelector('link[data-zero]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/telefono/zero/zero.css'; l.setAttribute('data-zero', ''); document.head.appendChild(l) }
  const img = tasto.querySelector('img:not(.attacco)')
  if (img) { img.src = FOTO; img.width = dati.w; img.height = dati.h }
  const attacco = tasto.querySelector('img.attacco')
  if (attacco) attacco.src = '/art/zero/attacco.svg'
  const lcd = tasto.querySelector('.ct-lcd'), led = tasto.querySelector('.ct-led')
  // il tubo catodico del tasto vecchio (games/crt.js) sull'lcd: via, lo zero è un lcd
  lcd?.querySelectorAll('[class*="crt-"]').forEach((e) => e.remove())
  if (led) {
    const r = dati.led.r
    Object.assign(led.style, { left: `${(dati.led.x - r) * 100}%`, top: `${(dati.led.y - (r * dati.w) / dati.h) * 100}%`, width: `${2 * r * 100}%`, height: 'auto', aspectRatio: '1' })
  }
  if (lcd) {
    // l'lcd sta nel riquadro che contiene i quattro angoli, e la matrix3d lo porta sugli angoli (dipende dalle misure in
    // pixel: si rifà quando il tasto cambia misura)
    const xs = dati.lcd.map((p) => p[0]), ys = dati.lcd.map((p) => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    Object.assign(lcd.style, { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%`, transformOrigin: '0 0' })
    const metti = () => {
      const W = tasto.offsetWidth, H = tasto.offsetHeight
      if (!W) return
      const w = (x1 - x0) * W, h = (y1 - y0) * H
      lcd.style.transform = omografia(w, h, dati.lcd.map(([x, y]) => [(x - x0) * W, (y - y0) * H]))
    }
    metti()
    new ResizeObserver(metti).observe(tasto)
  }
  tasto.classList.add('vestito') // (ora lcd e led stanno sul vetro: si vedono)
  // il 3D si scalda da sé appena la pagina è tranquilla (il modello, 1,2 MB, e three.js sono già in cache quando si tocca
  // il tasto), e pzk os si accende sul vetro
  ;(window.requestIdleCallback ?? setTimeout)(() => {
    fetch(GLB, { priority: 'low' }).catch(() => {})
    import('./zero.js').catch(() => {})
    import('./os/os.js').then((os) => vivo(tasto, os)).catch((e) => console.warn('pzk os non acceso sul muro', e))
  }, { timeout: 6000 })
}

/** pzk os sul vetro del tasto: l'lcd di pzk os ricopiato ogni volta che cambia su una tela grande quanto il vetro sullo
 *  schermo (in pixel veri: ridisegnata quando il tasto cambia misura), passando da una tela 256 × 128 a pixel netti; così
 *  nessuno ristringe niente dopo (Alberto, 29.10: «è storto lo schermo»: la tela a 256 stretta in 230 px con pixelated
 *  saltava delle righe e le scritte venivano a gradini). La
 *  chiocciolina (chat/tomodachi.js, la sua tela sta nell'lcd del tasto) resta sotto, nascosta (.os), ed è lei che il
 *  desktop di pzk os disegna a tutto schermo. */
function vivo(tasto, os) {
  const lcd = tasto.querySelector('.ct-lcd')
  if (!lcd || lcd.querySelector('.ct-os')) return
  const cv = document.createElement('canvas')
  cv.className = 'ct-os'
  lcd.appendChild(cv)
  tasto.classList.add('os')
  const g = cv.getContext('2d', { alpha: false })
  const mezzo = document.createElement('canvas')
  mezzo.width = 256; mezzo.height = 128
  const gm = mezzo.getContext('2d', { alpha: false })
  const misura = () => { const d = devicePixelRatio || 1, w = Math.max(1, Math.round(lcd.clientWidth * d)), h = Math.max(1, Math.round(lcd.clientHeight * d)); if (w !== cv.width || h !== cv.height) { cv.width = w; cv.height = h; return true } return false }
  const disegna = () => { gm.imageSmoothingEnabled = false; gm.drawImage(os.lcd.canvas, 0, 0, 256, 128); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(mezzo, 0, 0, cv.width, cv.height) }
  misura()
  os.lcd.ascolta(disegna)
  new ResizeObserver(() => { if (misura()) disegna() }).observe(lcd)
  const chiocciolina = () => lcd.querySelector('canvas:not(.ct-os)')
  os.configura({ tomodachi: chiocciolina() })
  const ora = () => { os.stato({ ora: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }); if (!chiocciolina()) return; os.configura({ tomodachi: chiocciolina() }) }
  ora(); setInterval(ora, 15_000)
  // la chiocciolina arriva con la chat, che può partire dopo pzk os: appena c'è, il desktop la disegna (non al giro dopo)
  new MutationObserver(() => { const t = chiocciolina(); if (t) os.configura({ tomodachi: t }) }).observe(lcd, { childList: true })
  import('../../games/pzk.js').then((pzk) => { const n = () => os.stato({ nome: pzk.conto()?.nome ?? '' }); n(); pzk.osserva(n) }).catch(() => {})
  // le impostazioni (os/impostazioni.js): la luminosità la applica pzk os da sé; il led rosso spento sparisce anche dal muro
  import('./os/impostazioni.js').then((imp) => { const led = tasto.querySelector('.ct-led'); const metti = (i) => { if (led) led.style.display = i.led ? '' : 'none' }; metti(imp.leggi()); imp.ascolta(metti) }).catch(() => {})
  os.avvia()
  disegna()
}
