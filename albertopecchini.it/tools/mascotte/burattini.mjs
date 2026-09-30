#!/usr/bin/env node
// Burattini del piè di pagina (chiocciola, tartaruga, airone, gazza, vespa) con
// openai/gpt-image-2 su Replicate, sempre in qualità high.
//
//   node tools/mascotte/burattini.mjs intero <nome|tutti> [--candidati=2]
//       l'animale completo (1536 × 1024, fondo magenta), con la chiocciola e la
//       tartaruga come riferimento di stile (o i `riferimenti` dell'animale), in
//       tools/mascotte/lavoro/<nome>/intero/; con --candidati il modello ne
//       disegna più d'uno, e si sceglie
//   node tools/mascotte/burattini.mjs pezzi <nome> [intero.png] [--candidati=2]
//       lo stesso animale smontato in pezzi di burattino (2048 × 2048), in lavoro/<nome>/pezzi/;
//       per la chiocciola l'intero è la mascotte (`intero` in burattini.js)
//   node tools/mascotte/burattini.mjs usa <nome> <pezzi.png> [corpo,testa,…]
//       separa i pezzi, trova i fermacampioni (i perni) e gli occhi, scrive
//       public/media/mascotte/<nome>/<pezzo>.webp e src/data/burattini-pezzi.js
//   node tools/mascotte/burattini.mjs recupera <nome> <intero|pezzi> <id-predizione>
//       scarica un'immagine già pagata (se l'attesa si è interrotta)
//
// Il montaggio (dove si attacca ogni pezzo, quanto gira, come reagisce al
// puntatore) si scrive a mano in src/data/burattini.js.

import { join } from 'node:path'
import { ROOT, die, predict, prediction, salva, upload } from '../replicate.mjs'
import { INTERO, PEZZI, STILE, burattini } from './burattini.js'

const LAVORO = join(ROOT, 'tools/mascotte/lavoro')
const RIFERIMENTI = ['public/media/mascotte/lumaca.webp', 'public/media/mascotte/tartaruga.webp']

// quante immagini per predizione (--candidati=2): se ne sceglie una
const CANDIDATI = Math.max(1, Math.min(4, Number(process.argv.find((x) => x.startsWith('--candidati='))?.split('=')[1]) || 1))

const burattino = (nome) => burattini[nome] || die(`nessun burattino «${nome}». Disponibili: ${Object.keys(burattini).join(', ')}`)

async function intero(nome) {
  const b = burattino(nome)
  if (b.intero) die(`${nome}: l'intero c'è già, è ${b.intero}: passa direttamente ai pezzi`)
  const input = {
    prompt: `${b.premessa || INTERO}\n\n${b.soggetto}\n\n${STILE}`,
    input_images: await Promise.all((b.riferimenti || RIFERIMENTI).map(upload)),
    aspect_ratio: '3:2',
    quality: 'high',
    number_of_images: CANDIDATI,
    output_format: 'png',
    background: 'opaque', // su fondo magenta: vedi FONDO in burattini.js
  }
  console.log(`→ ${nome}: ${b.titolo}, intero — qualità high, 3:2, attendo il modello…`)
  const p = await predict(input, `node tools/mascotte/burattini.mjs recupera ${nome} intero`)
  await salva(p, join(LAVORO, nome, 'intero'), { burattino: nome, fase: 'intero' })
}

async function pezzi(nome, file) {
  const b = burattino(nome)
  const elenco = b.pezzi.map((x, i) => `${i + 1}. ${x}`).join('\n')
  const input = {
    prompt: `${PEZZI}\n${elenco}\n\n${STILE}`,
    input_images: [await upload(file)],
    aspect_ratio: '2048x2048',
    quality: 'high',
    number_of_images: CANDIDATI,
    output_format: 'png',
    background: 'opaque', // su fondo magenta: vedi FONDO in burattini.js
  }
  console.log(`→ ${nome}: ${b.titolo}, ${b.pezzi.length} pezzi — qualità high, 2048 × 2048, attendo il modello…`)
  const p = await predict(input, `node tools/mascotte/burattini.mjs recupera ${nome} pezzi`)
  await salva(p, join(LAVORO, nome, 'pezzi'), { burattino: nome, fase: 'pezzi' })
}

const [cmd, nome, a, c] = process.argv.slice(2).filter((x) => !x.startsWith('--'))
if (cmd === 'intero' && nome) {
  await Promise.all((nome === 'tutti' ? Object.keys(burattini).filter((k) => !burattini[k].intero) : [nome]).map(intero))
} else if (cmd === 'pezzi' && nome && (a || burattino(nome).intero)) {
  await pezzi(nome, a || burattino(nome).intero)
} else if (cmd === 'usa' && nome && a) {
  const { usa } = await import('./burattini-usa.mjs')
  await usa(nome, a, c)
} else if (cmd === 'recupera' && nome && ['intero', 'pezzi'].includes(a) && c) {
  burattino(nome)
  await salva(await prediction(c), join(LAVORO, nome, a), { burattino: nome, fase: a })
} else {
  die('uso: burattini.mjs intero <nome|tutti> · pezzi <nome> [intero.png] · usa <nome> <pezzi.png> · recupera <nome> <intero|pezzi> <id>')
}
