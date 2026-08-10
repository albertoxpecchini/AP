// ── Niente si cancella: si mette da parte ────────────────────────────────────
//
// È questa la ragione per cui il programma può girare da solo ogni due giorni
// senza che nessuno guardi. Un file "sicuramente inutile" cancellato è un file
// perso; lo stesso file spostato in .janitor/quarantena/<data>/ è un file che
// torna al suo posto con un comando, e che intanto NON è più nella build — se
// mancava davvero a qualcuno, la build lo dice subito.
//
// La cartella conserva i percorsi originali, così il ripristino è una copia
// all'indietro senza indovinare niente. Un manifesto JSON accanto ai file dice
// cosa c'era, quanto pesava e perché era stato tolto.

import fs from 'node:fs'
import path from 'node:path'

export const DIR_JANITOR = '.janitor'

export function cartellaQuarantena(radice, etichetta) {
  return path.join(radice, DIR_JANITOR, 'quarantena', etichetta)
}

export function etichettaOra() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * Sposta i percorsi indicati in quarantena. Restituisce il manifesto.
 * `voci` = [{ path, bytes, motivo, categoria }]
 */
export function metti(radice, voci, etichetta) {
  const dest = cartellaQuarantena(radice, etichetta)
  const spostati = []
  for (const v of voci) {
    const sorgente = path.join(radice, v.path)
    if (!fs.existsSync(sorgente)) continue
    const arrivo = path.join(dest, v.path)
    fs.mkdirSync(path.dirname(arrivo), { recursive: true })
    try {
      fs.renameSync(sorgente, arrivo)
    } catch {
      // rename fallisce tra volumi diversi o su cartelle in uso: si copia.
      fs.cpSync(sorgente, arrivo, { recursive: true })
      fs.rmSync(sorgente, { recursive: true, force: true })
    }
    spostati.push(v)
  }
  const manifesto = {
    etichetta,
    quando: new Date().toISOString(),
    totaleByte: spostati.reduce((a, v) => a + (v.bytes || 0), 0),
    voci: spostati,
  }
  fs.mkdirSync(dest, { recursive: true })
  fs.writeFileSync(path.join(dest, '_manifesto.json'), JSON.stringify(manifesto, null, 2))
  return manifesto
}

/** Rimette tutto dove stava. Usato a mano, o da solo quando la build fallisce. */
export function ripristina(radice, etichetta) {
  const dest = cartellaQuarantena(radice, etichetta)
  const fileManifesto = path.join(dest, '_manifesto.json')
  if (!fs.existsSync(fileManifesto)) throw new Error(`quarantena "${etichetta}" non trovata`)
  const manifesto = JSON.parse(fs.readFileSync(fileManifesto, 'utf8'))
  let tornati = 0
  for (const v of manifesto.voci) {
    const daQui = path.join(dest, v.path)
    const aQui = path.join(radice, v.path)
    if (!fs.existsSync(daQui)) continue
    fs.mkdirSync(path.dirname(aQui), { recursive: true })
    try {
      fs.renameSync(daQui, aQui)
    } catch {
      fs.cpSync(daQui, aQui, { recursive: true })
      fs.rmSync(daQui, { recursive: true, force: true })
    }
    tornati++
  }
  fs.rmSync(dest, { recursive: true, force: true })
  return { tornati, totale: manifesto.voci.length }
}

export function elencoQuarantene(radice) {
  const base = path.join(radice, DIR_JANITOR, 'quarantena')
  if (!fs.existsSync(base)) return []
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((v) => v.isDirectory())
    .map((v) => {
      const f = path.join(base, v.name, '_manifesto.json')
      let m = { voci: [], totaleByte: 0 }
      try {
        m = JSON.parse(fs.readFileSync(f, 'utf8'))
      } catch {}
      return { etichetta: v.name, voci: m.voci.length, bytes: m.totaleByte, quando: m.quando }
    })
    .sort((a, b) => (a.etichetta < b.etichetta ? 1 : -1))
}

/**
 * Tiene gli ultimi `quanti` file .json di una cartella (i nostri nomi sono
 * date, quindi l'ordine alfabetico è quello cronologico).
 *
 * I log del compito pianificato erano già limitati a 20; storico e benchmark
 * no, e crescevano senza fine — in una sola giornata di lavoro erano diventati
 * 18 file di storico. Un programma che nasce per non far accumulare roba non
 * può essere lui la cosa che accumula.
 *
 * Sta qui e non in pulisci.mjs perché anche bench-cli.mjs ne ha bisogno, e
 * pulisci.mjs in fondo lancia `principale()`: importarlo da lì avrebbe fatto
 * partire una pulizia ogni volta che si chiede un benchmark.
 */
export function tieniGliUltimi(dir, quanti) {
  let file
  try {
    file = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  } catch {
    return 0
  }
  const daTogliere = file.slice(0, Math.max(0, file.length - quanti))
  for (const f of daTogliere) {
    try { fs.rmSync(path.join(dir, f), { force: true }) } catch {}
  }
  return daTogliere.length
}

/**
 * Svuota le quarantene più vecchie di `giorni`. Questo è l'unico punto del
 * programma che cancella davvero qualcosa — e lo fa solo su roba che è già
 * sopravvissuta a una build verde e a due settimane di sito funzionante.
 */
export function svuotaVecchie(radice, giorni = 14) {
  const limite = Date.now() - giorni * 86400_000
  const eliminate = []
  for (const q of elencoQuarantene(radice)) {
    const quando = Date.parse(q.quando || '')
    if (!Number.isFinite(quando) || quando > limite) continue
    fs.rmSync(cartellaQuarantena(radice, q.etichetta), { recursive: true, force: true })
    eliminate.push(q)
  }
  return eliminate
}
