// Dentro il negozio (21.10): sul bancone, dietro la porta a vetri, un PC da
// ufficio di vent'anni fa, acceso, con Ubuntu che si pianta e si riavvia in
// loop: il BIOS che fa il conto della memoria, l'errore del CMOS e la schermata
// blu del Setup, GRUB col conto alla rovescia, i puntini di plymouth, la
// scrivania con il terminale in cui qualcuno ha scritto il comando che manda in
// crash il kernel, il kernel panic, lo schermo morto, il nero, e da capo. Lo
// schermo è una tela 2D (320 × 240) disegnata al massimo dieci volte al secondo
// e solo quando cambia qualcosa, e solo se la porta è nell'inquadratura; sul
// bancone il bagliore dello schermo (un piano sommato, col colore della fase)
// e sulla torre il led verde e quello arancione del disco. Niente luci vere:
// ognuna costerebbe a ogni pixel di tutta la scena. Un easter egg: nessuno lo
// dice, si vede guardando dentro la porta.
import * as T from './lib/three.js'
import { tela } from './materiali.js'

// le fasi del loop e quanto durano (ms)
const FASI = [['post', 3200], ['errore', 2000], ['setup', 2800], ['grub', 2600], ['plymouth', 3600], ['desktop', 6400], ['panic', 1900], ['morto', 3200], ['nero', 1500]]
const TOTALE = FASI.reduce((s, [, d]) => s + d, 0)
// il bagliore sul bancone, per fase: colore (lineare) e quanto
const GRIGIO = [0.28, 0.28, 0.3, 0.22]
const BAGLIORE = { post: GRIGIO, errore: GRIGIO, setup: [0.08, 0.08, 0.7, 0.45], grub: GRIGIO, plymouth: [0.45, 0.03, 0.25, 0.45], desktop: [0.85, 0.35, 0.28, 0.75], panic: GRIGIO, morto: GRIGIO, nero: [0, 0, 0, 0] }
const MONO = '10px "Courier New", Courier, monospace', SANS = '"Ubuntu", "DejaVu Sans", Arial, sans-serif'
const PANIC = [
  '[   42.133742] sysrq: Trigger a crash', '[   42.133790] BUG: kernel NULL pointer dereference, address: 0000000000000000',
  '[   42.133812] #PF: supervisor write access in kernel mode', '[   42.133830] #PF: error_code(0x0002) - not-present page',
  '[   42.133850] Oops: 0002 [#1] PREEMPT SMP NOPTI', '[   42.133868] CPU: 0 PID: 1337 Comm: bash Not tainted 6.8.0-pzkko #1',
  '[   42.133890] Hardware name: pzkko negozio/MS-6570, BIOS 08.00.10 08/14/2004', '[   42.133910] RIP: 0010:sysrq_handle_crash+0x16/0x20',
  '[   42.133930] Call Trace:', '[   42.133940]  <TASK>', '[   42.133950]  __handle_sysrq+0xd0/0x1a0', '[   42.133960]  write_sysrq_trigger+0x2b/0x40',
  '[   42.133970]  proc_reg_write+0x5a/0xa0', '[   42.133980]  vfs_write+0xc5/0x3a0', '[   42.133990]  ksys_write+0x6f/0xf0',
  '[   42.134000]  do_syscall_64+0x5d/0x90', '[   42.134010]  </TASK>', '[   42.134020] ---[ end trace 0000000000000000 ]---',
  '[   42.134100] Kernel panic - not syncing: Fatal exception', '[   42.134200] Kernel Offset: 0x1a000000 from 0xffffffff81000000',
  '[   42.134300] ---[ end Kernel panic - not syncing: Fatal exception ]---',
]
const ORA = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// bancone: il centro del suo piano (x, y, z); porta: x0, x1 (per sapere se è nell'inquadratura)
export function negozio(scene, { bancone, porta }) {
  const { x, y, z } = bancone
  // ── il PC: il monitor LCD beige, la torre di fianco, la tastiera davanti; una mesh per materiale ──
  const mPlastica = new T.MeshStandardMaterial({ color: 0xcfc9b8, roughness: 0.75 })
  const mScuro = new T.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.6 })
  const parti = []
  const box = (w, h, d, m, px, py, pz) => { const g = new T.BoxGeometry(w, h, d); g.translate(px, py, pz); parti.push([g, m]) }
  const mx = x + 0.1, mz = z + 0.02, tx = x + 0.42
  box(0.2, 0.015, 0.16, mPlastica, mx, y + 0.0075, mz) // la base del monitor
  box(0.06, 0.07, 0.05, mPlastica, mx, y + 0.05, mz - 0.03) // il collo
  box(0.38, 0.31, 0.045, mPlastica, mx, y + 0.24, mz - 0.03) // il corpo
  box(0.35, 0.265, 0.004, mScuro, mx, y + 0.24, mz - 0.006) // la cornice nera
  box(0.18, 0.4, 0.42, mPlastica, tx, y + 0.2, z - 0.02) // la torre
  box(0.16, 0.12, 0.004, mScuro, tx, y + 0.3, z + 0.191) // il pannello dei lettori
  box(0.44, 0.022, 0.15, mPlastica, mx - 0.02, y + 0.011, z + 0.17) // la tastiera
  box(0.42, 0.006, 0.12, mScuro, mx - 0.02, y + 0.025, z + 0.17) // i tasti
  for (const m of [mPlastica, mScuro]) {
    const mesh = new T.Mesh(T.mergeGeometries(parti.filter(([, mm]) => mm === m).map(([g]) => g)), m)
    mesh.receiveShadow = true; scene.add(mesh)
  }
  // ── lo schermo: una tela disegnata qui, come una trama; il colore oltre l'1 lo fa brillare (di notte col bagliore) ──
  const c = tela(320, 240), ctx = c.getContext('2d')
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4
  const mSchermo = new T.MeshBasicMaterial({ map: tex, color: new T.Color(1.4, 1.4, 1.4) })
  const schermo = new T.Mesh(new T.PlaneGeometry(0.34, 0.255), mSchermo)
  schermo.position.set(mx, y + 0.24, mz - 0.0035); scene.add(schermo)
  // i led sulla torre: acceso (verde) e il disco (arancione)
  const led = (col, py) => { const m = new T.Mesh(new T.PlaneGeometry(0.006, 0.006), new T.MeshStandardMaterial({ color: 0x111111, emissive: col, emissiveIntensity: 0 })); m.position.set(tx - 0.055, py, z + 0.1935); scene.add(m); return m.material }
  const ledAcceso = led(0x40ff60, y + 0.33), ledDisco = led(0xff9020, y + 0.315)
  // il bagliore dello schermo sul bancone
  const g = tela(64), gc = g.getContext('2d'), gr = gc.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gc.fillStyle = gr; gc.fillRect(0, 0, 64, 64)
  const texG = new T.CanvasTexture(g); texG.colorSpace = T.SRGBColorSpace
  const mBagliore = new T.MeshBasicMaterial({ map: texG, transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: 0x000000 })
  const bagliore = new T.Mesh(new T.PlaneGeometry(0.8, 0.5), mBagliore)
  bagliore.rotation.x = -Math.PI / 2; bagliore.position.set(mx, y + 0.003, z + 0.1); scene.add(bagliore)

  // ── le schermate: ognuna disegna la sua fase al tempo t (ms dall'inizio della fase) e dice se si muove ──
  const W = 320, H = 240
  const nero = () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H) }
  const testo = (righe, x0, y0, { font = MONO, colore = '#c8c8c8', passo = 11 } = {}) => { ctx.font = font; ctx.fillStyle = colore; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; righe.forEach((r, i) => { if (r != null) ctx.fillText(r, x0, y0 + i * passo) }) }
  const schermate = {
    post: (t) => {
      nero()
      const mem = Math.min(1, t / 2300), k = Math.round(mem * 2097152)
      testo(['PZKKO BIOS (C) 2004 Pzkko Megatrends, Inc.', 'BIOS Date: 08/14/04  Ver: 08.00.10', 'CPU : pzkko(R) core 2 @ 3.00GHz', null,
        t > 400 ? 'Press DEL to run Setup' : null, t > 400 ? 'Press F8 for BBS POPUP' : null, t > 500 ? `Memory Test :  ${String(k).padStart(7, ' ')}K OK` : null, null,
        t > 2400 ? 'Detecting IDE Primary Master  ... ST380011A' : null, t > 2700 ? 'Detecting IDE Primary Slave   ... None' : null, t > 2950 ? 'Detecting IDE Secondary Master... None' : null], 8, 8)
      // il marchio in alto a destra
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(258, 8, 54, 30)
      testo(['pzkko', 'energy'], 265, 11, { font: `bold 9px ${SANS}`, colore: '#9a9a9a', passo: 12 })
      return t < 3100
    },
    errore: (t) => {
      nero()
      testo(['CMOS checksum error - Defaults loaded', null, 'Warning! Now system is in Safe Mode.', 'Please re-setting CPU frequency in CMOS setup', null,
        t > 900 ? 'Press F1 to Run SETUP' : null, t > 900 ? 'Press F2 to load default values and continue' : null], 8, 48)
      return t < 1000
    },
    setup: (t) => {
      ctx.fillStyle = '#0000a8'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#a8a8a8'; ctx.fillRect(0, 0, W, 13); ctx.fillRect(0, H - 13, W, 13)
      testo(['CMOS Setup Utility - Copyright (C) 1985-2004 Pzkko Megatrends, Inc.'], 4, 2, { colore: '#0000a8', font: '8px "Courier New", monospace' })
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1; ctx.strokeRect(6.5, 20.5, 307, 180); ctx.beginPath(); ctx.moveTo(160.5, 20.5); ctx.lineTo(160.5, 200.5); ctx.stroke()
      const voci = ['Standard CMOS Features', 'Advanced BIOS Features', 'Advanced Chipset Features', 'Integrated Peripherals', 'Power Management Setup', 'PnP/PCI Configurations', 'PC Health Status']
      const destra = ['Frequency/Voltage Control', 'Load Fail-Safe Defaults', 'Load Optimized Defaults', 'Set Supervisor Password', 'Set User Password', 'Save & Exit Setup', 'Exit Without Saving']
      // il cursore rosso scende piano e si ferma su «Load Optimized Defaults»
      const sel = Math.min(9, Math.floor(t / 280))
      voci.forEach((v, i) => { if (sel === i) { ctx.fillStyle = '#a80000'; ctx.fillRect(10, 27 + i * 16, 148, 12) } })
      destra.forEach((v, i) => { if (sel === i + 7 || (sel >= 9 && i === 2)) { ctx.fillStyle = '#a80000'; ctx.fillRect(164, 27 + i * 16, 148, 12) } })
      testo(voci.map((v) => '> ' + v), 12, 29, { colore: '#ffff55', passo: 16, font: '9px "Courier New", Courier, monospace' }); testo(destra.map((v) => '> ' + v), 166, 29, { colore: '#ffff55', passo: 16, font: '9px "Courier New", Courier, monospace' })
      testo(['Esc : Quit       ↑ ↓ → ← : Select Item', 'F10 : Save & Exit Setup'], 10, 208, { colore: '#e8e8e8' })
      testo(['Load Optimized Defaults'], 100, H - 11, { colore: '#0000a8', font: '8px "Courier New", monospace' })
      return t < 2800
    },
    grub: (t) => {
      nero()
      testo(['                 GNU GRUB  version 2.12'], 8, 10, { colore: '#e8e8e8' })
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1; ctx.strokeRect(12.5, 30.5, 295, 120); ctx.strokeRect(14.5, 32.5, 291, 116)
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(16, 36, 288, 12)
      testo(['*Ubuntu'], 18, 37, { colore: '#000' })
      testo([' Advanced options for Ubuntu', ' Memory test (memtest86+x64.efi)', ' Memory test (memtest86+x64.efi, serial console)'], 18, 50, { colore: '#e8e8e8', passo: 13 })
      const n = Math.max(0, Math.ceil((2600 - t) / 1000))
      testo(['Use the ↑ and ↓ keys to select which entry', 'is highlighted. Press enter to boot the', 'selected OS, `e\' to edit the commands', 'before booting or `c\' for a command-line.',
        'The highlighted entry will be executed', `automatically in ${n}s.`], 14, 160, { colore: '#e8e8e8' })
      return true
    },
    plymouth: (t) => {
      ctx.fillStyle = '#2c001e'; ctx.fillRect(0, 0, W, H)
      ctx.font = `bold 30px ${SANS}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ubuntu', 160, 108)
      // il cerchietto del marchio: tre pallini
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(232, 97, 8, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = '#2c001e'; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.arc(232 + Math.cos(a) * 8, 97 + Math.sin(a) * 8, 2.2, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.arc(232 + Math.cos(a) * 8, 97 + Math.sin(a) * 8, 1.5, 0, Math.PI * 2); ctx.fill() }
      // i puntini: uno alla volta diventa arancione
      const acceso = Math.floor(t / 330) % 5
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i < acceso ? '#e95420' : '#aea79f'; ctx.beginPath(); ctx.arc(142 + i * 12, 138, 3, 0, Math.PI * 2); ctx.fill() }
      return true
    },
    desktop: (t) => {
      const gradiente = ctx.createLinearGradient(0, 0, W, H)
      gradiente.addColorStop(0, '#4a1232'); gradiente.addColorStop(0.55, '#772953'); gradiente.addColorStop(1, '#e95420')
      ctx.fillStyle = gradiente; ctx.fillRect(0, 0, W, H)
      // la barra in alto, la dock a sinistra
      ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(0, 0, W, 14)
      testo(['Attività'], 6, 2, { font: `bold 9px ${SANS}`, colore: '#eee' })
      ctx.font = `bold 9px ${SANS}`; ctx.fillStyle = '#eee'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(ORA.format(new Date()).replace(',', ''), 160, 2)
      ctx.fillStyle = '#eee'; ctx.fillRect(294, 4, 7, 6); ctx.fillRect(304, 4, 10, 6); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.strokeRect(282.5, 4.5, 7, 6)
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 14, 26, H - 14)
      ;['#e95420', '#2c7fd6', '#7a7a7a', '#5fb53f', '#d8d8d8', '#c23b3b'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(5, 22 + i * 24, 16, 16) })
      // il terminale, con quello che qualcuno ci ha scritto
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(58, 46, 230, 150)
      ctx.fillStyle = '#3c3b37'; ctx.fillRect(56, 42, 230, 14); ctx.fillStyle = '#300a24'; ctx.fillRect(56, 56, 230, 136)
      ;['#f25d52', '#f9b84a', '#5fcb52'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(64 + i * 10, 49, 3, 0, Math.PI * 2); ctx.fill() })
      ctx.font = `9px ${SANS}`; ctx.fillStyle = '#ddd'; ctx.textAlign = 'center'; ctx.fillText('pzkko@negozio: ~', 171, 44)
      const scritto = (s, da, per) => { const n = Math.max(0, Math.min(s.length, Math.floor(((t - da) / per) * s.length))); return s.slice(0, n) }
      const righe = [
        '$ sudo apt full-upgrade', t > 1500 ? '[sudo] password di pzkko:' : null, t > 2200 ? 'Lettura elenco dei pacchetti... Fatto' : null,
        t > 2500 ? 'Generazione albero delle dipendenze... Fatto' : null, t > 2800 ? '0 aggiornati, 0 installati, 0 da rimuovere.' : null,
        t > 3300 ? '$ ' + scritto('echo c | sudo tee /proc/sysrq-trigger', 3300, 2200) : null,
      ]
      testo(righe, 60, 60, { font: `9px "Ubuntu Mono", "Courier New", monospace`, colore: '#eee', passo: 12 })
      // il cursore che lampeggia alla fine dell'ultima riga
      if (Math.floor(t / 400) % 2 === 0) { const ultima = righe.filter(Boolean).length - 1; ctx.font = `9px "Ubuntu Mono", "Courier New", monospace`; ctx.fillStyle = '#eee'; ctx.fillRect(60 + ctx.measureText(righe.filter(Boolean).at(-1)).width + 2, 60 + ultima * 12, 5, 10) }
      return true
    },
    panic: (t) => { nero(); testo(PANIC.slice(0, Math.floor(t / 85)), 4, 4, { colore: '#e8e8e8', font: '7px "Courier New", Courier, monospace', passo: 10.5 }); return true },
    morto: () => { nero(); testo(PANIC, 4, 4, { colore: '#e8e8e8', font: '7px "Courier New", Courier, monospace', passo: 10.5 }); return false },
    nero: () => { nero(); return false },
  }

  // ── a ogni fotogramma: la fase dall'orologio, la tela ridisegnata al più a 10 Hz e solo se la porta si vede ──
  const t0 = performance.now() - 6000 // (si parte dalla scrivania: entrando si vede Ubuntu che va, poi si pianta)
  let fase = null, ultimo = -1e9, animata = true
  const aggiorna = (now, vista) => {
    if (vista && (vista.x1 < porta.x0 - 0.3 || vista.x0 > porta.x1 + 0.3)) return
    let t = (now - t0) % TOTALE, nome = 'nero'
    for (const [n, d] of FASI) { if (t < d) { nome = n; break } t -= d }
    if (nome !== fase || (animata && now - ultimo > 100)) {
      animata = schermate[nome](t)
      tex.needsUpdate = true; ultimo = now
      if (nome !== fase) { const [r, g, b, k] = BAGLIORE[nome]; mBagliore.color.setRGB(r * k, g * k, b * k); fase = nome }
    }
    // i led: verde acceso tranne nel nero (il riavvio), arancione a scatti quando il disco lavora
    ledAcceso.emissiveIntensity = nome === 'nero' && t < 700 ? 0 : 2.5
    const disco = (nome === 'post' && t > 2300) || nome === 'grub' || nome === 'plymouth' || (nome === 'desktop' && t < 3000)
    ledDisco.emissiveIntensity = disco && Math.sin(now * 0.021) * Math.sin(now * 0.0073) > -0.2 ? 2.5 : 0
  }
  return { aggiorna, schermo: c }
}
