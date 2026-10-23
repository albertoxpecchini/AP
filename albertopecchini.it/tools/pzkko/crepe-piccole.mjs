#!/usr/bin/env node
// Le crepe del cercapersone scassato per il tasto piccolo (23.10). art/chat-pager-crepe/crepe.webp (1024 × 576, linee di
// 1–2 px) ridotta ai 74 px dell'lcd del tasto con la media sparisce: le linee diventano un decimo di pixel. Qui ogni pixel
// della piccola è il MASSIMO del blocco 8 × 8 che riassume (alfa e colore del pixel più pieno): le crepe sono le stesse,
// spesse un pixel. Va rilanciato se si rifanno le crepe (`immagini.mjs usa chat-pager-crepe`).
//
//   node tools/pzkko/crepe-piccole.mjs          (dalla cartella albertopecchini.it)
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(QUI, '../../package.json'))('sharp')
const ART = join(QUI, '../../pzkko/art/chat-pager-crepe')
const BLOCCO = 8

const { data, info } = await sharp(join(ART, 'crepe.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const [W, H] = [Math.ceil(info.width / BLOCCO), Math.ceil(info.height / BLOCCO)]
const out = Buffer.alloc(W * H * 4)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let migliore = -1
  for (let j = 0; j < BLOCCO; j++) for (let i = 0; i < BLOCCO; i++) {
    const [sx, sy] = [x * BLOCCO + i, y * BLOCCO + j]
    if (sx >= info.width || sy >= info.height) continue
    const k = (sy * info.width + sx) * 4
    if (migliore < 0 || data[k + 3] > data[migliore + 3]) migliore = k
  }
  data.copy(out, (y * W + x) * 4, migliore, migliore + 4)
}
const file = join(ART, 'crepe-piccola.webp')
await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(file)
console.log(`✓ ${file} ${W} × ${H} (massimo di blocchi ${BLOCCO} × ${BLOCCO} da ${info.width} × ${info.height})`)
