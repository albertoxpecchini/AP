#!/usr/bin/env node
// La piastrella dell'app Virtual del cercapersone, disegnata a mano in SVG e scritta in pzkko/art/chat-app2/app-virtual.webp
// (194 × 184 come le altre di art/chat-app/, con l'alfa). È il ripiego finché non si genera con gpt-image-2 come le altre:
// `node tools/pzkko/immagini.mjs genera chat-app2` (il prompt è in fogli-chat.js) la sostituisce.
//
//   node tools/pzkko/virtual/icona.mjs
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const OUT = join(QUI, '../../../pzkko/art/chat-app2/app-virtual.webp')
// la piastrella: il bordo bianco di carta, il contorno nero grosso, il verde erba; dentro la porta con la rete, il pallone
// e il fischietto giallo. Un po' storta come gli adesivi veri
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 194 184" width="194" height="184">
<g transform="rotate(-2 97 92)">
  <rect x="14" y="10" width="166" height="164" rx="22" fill="#fff"/>
  <rect x="21" y="17" width="152" height="150" rx="17" fill="#111"/>
  <rect x="29" y="25" width="136" height="134" rx="12" fill="#3fae4a"/>
  <!-- la porta con la rete, in fondo -->
  <g stroke="#111" stroke-width="5" fill="#eef5e9">
    <path d="M48 62 h98 v44 h-98 z"/>
  </g>
  <g stroke="#111" stroke-width="2.4" opacity=".55">
    <path d="M60 62v44M72 62v44M84 62v44M96 62v44M108 62v44M120 62v44M132 62v44"/>
    <path d="M48 73h98M48 84h98M48 95h98"/>
  </g>
  <rect x="44" y="104" width="106" height="6" rx="2" fill="#fff" stroke="#111" stroke-width="3"/>
  <!-- il pallone -->
  <circle cx="97" cy="118" r="30" fill="#fff" stroke="#111" stroke-width="6"/>
  <path d="M97 98 l12 9 l-5 14 h-14 l-5 -14 z" fill="#111"/>
  <path d="M97 98 l0 -9 M109 107 l9 -5 M104 121 l6 8 M90 121 l-6 8 M85 107 l-9 -5" stroke="#111" stroke-width="5" stroke-linecap="round"/>
  <path d="M118 102 q9 10 6 24 M76 102 q-9 10 -6 24 M90 129 q7 3 14 0" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/>
  <!-- il fischietto giallo -->
  <g transform="translate(118 36) rotate(18)">
    <rect x="0" y="4" width="30" height="12" rx="4" fill="#ffd400" stroke="#111" stroke-width="4"/>
    <circle cx="6" cy="18" r="9" fill="#ffd400" stroke="#111" stroke-width="4"/>
    <circle cx="6" cy="18" r="2.5" fill="#111"/>
  </g>
</g>
</svg>`
await sharp(Buffer.from(svg)).webp({ quality: 92, alphaQuality: 90 }).toFile(OUT)
console.log('scritto', OUT)
