#!/usr/bin/env node
// Le anteprime della scena 3D: le stesse immagini in piccolo (128 px di larghezza, pochi KB l'una), che la scena mette
// subito, prima che arrivino quelle vere (scena/fogli.js, scena/spazzatura.js): la strada si vede da lontano già tutta,
// leggerissima, e la telecamera si avvicina man mano che arriva la risoluzione piena.
//
//   node tools/pzkko/scena/anteprime.mjs
//       art/scena/vol/ → vol-lo/, vol-m/ → vol-m-lo/, terra/ → terra/lo/, fronte/ → fronte/lo/ (le mappe delle altezze no:
//       la griglia la vuole subito, ed è già piccola)
//
// Le rifà cattura.mjs alla fine di ogni giro di foto (e quindi `serranda.mjs rifai`); dopo un nuovo disegno per terra
// (disegni.mjs usa) si lanciano a mano.

import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const QUI = fileURLToPath(new URL('.', import.meta.url))
const ART = join(QUI, '../../../pzkko/art/scena')
const sharp = createRequire(join(QUI, '../../../package.json'))('sharp')
const LARGHEZZA = 128

export async function anteprime() {
  for (const [da, a, salta] of [['vol', 'vol-lo'], ['vol-m', 'vol-m-lo'], ['terra', 'terra/lo', /-alt\.webp$/], ['fronte', 'fronte/lo']]) {
    const dir = join(ART, a)
    await mkdir(dir, { recursive: true })
    for (const f of await readdir(dir)) await rm(join(dir, f))
    let n = 0, byte = 0
    for (const f of (await readdir(join(ART, da))).filter((f) => f.endsWith('.webp') && !salta?.test(f))) {
      const info = await sharp(join(ART, da, f)).resize(LARGHEZZA).webp({ quality: 62, alphaQuality: 70, effort: 6 }).toFile(join(dir, f))
      n++; byte += info.size
    }
    console.log(`anteprime: ${n} in ${a} (${(byte / 1024).toFixed(0)} KB)`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await anteprime()
