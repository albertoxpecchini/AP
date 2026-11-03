// Scarica in locale la storia intera dei repository della macchina del tempo (3.11.2026):
// i siti che non stanno nel repository AP (Rivalta sul Mincio, Cascina Fontana) diventano
// copie «mirror» in lavoro/repo/<id>.git, tutti i rami e tutti i commit; per AP basta
// `git fetch`. Le barre di download vanno nel cruscotto (diretta.mjs), lette dall'avanzamento
// che git scrive su stderr («Receiving objects:  45% (1234/2741), 3.20 MiB | 2.10 MiB/s»).
//
//   node tools/tempo/scarica.mjs            tutti
//   node tools/tempo/scarica.mjs cascina    solo quello

import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { SITI, REPO, REPOS, cartellaGit } from './siti.mjs'
import { stato, log } from './diretta.mjs'

const scelti = process.argv.slice(2).filter((a) => !a.startsWith('--'))

// i pesi delle fasi di git: la barra va da 0 a 100 una volta sola, non una per fase
const FASI = [
  [/Enumerating objects|Counting objects/i, 0, 4],
  [/Compressing objects/i, 4, 10],
  [/Receiving objects/i, 10, 85],
  [/Resolving deltas/i, 85, 100],
  [/Updating files|Checking out/i, 100, 100],
]

function git(args, cwd, chi, nome) {
  return new Promise((ok, ko) => {
    const p = spawn('git', args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' } })
    let ultima = ''
    let pct = 0
    const leggi = (buf) => {
      for (const r of buf.toString().split(/[\r\n]+/)) {
        const riga = r.replace(/^remote:\s*/, '').trim()
        if (!riga) continue
        const fase = FASI.find(([re]) => re.test(riga))
        const m = riga.match(/(\d+)%/)
        if (fase && m) pct = Math.max(pct, fase[1] + ((fase[2] - fase[1]) * Number(m[1])) / 100)
        const vel = riga.match(/\|\s*([\d.]+\s*[KMG]iB\/s)/)
        const peso = riga.match(/,\s*([\d.]+\s*[KMG]iB)\s*\|/)
        const conto = riga.match(/\((\d+)\/(\d+)\)/)
        const testo = [riga.split(':')[0], conto ? `${conto[1]}/${conto[2]}` : '', peso ? peso[1] : '', vel ? vel[1] : ''].filter(Boolean).join(' · ')
        stato(`scarico-${chi}`, { tipo: 'download', id: chi, nome, pct, testo })
        // nel log solo le righe che cambiano fase o finiscono, non ogni percento
        const chiave = riga.split(':')[0]
        if (chiave !== ultima || /done|fatto|100%/.test(riga)) {
          if (/done|100%|^From|->|Cloning/.test(riga) || chiave !== ultima) log(`scarico-${chi}`, riga)
          ultima = chiave
        }
      }
    }
    p.stdout.on('data', leggi)
    p.stderr.on('data', leggi)
    p.on('close', (code) => (code === 0 ? ok() : ko(new Error(`git ${args[0]} è uscito con ${code}`))))
  })
}

const conta = (dir, ref) => {
  try {
    return Number(execFileSync('git', ['rev-list', '--count', ref], { cwd: dir, encoding: 'utf8' }).trim())
  } catch {
    return 0
  }
}

mkdirSync(REPOS, { recursive: true })
const fatti = new Set()
for (const s of SITI) {
  if (scelti.length && !scelti.includes(s.id)) continue
  const dir = cartellaGit(s)
  if (fatti.has(dir)) continue // pzkko e Better Call Pekko stanno nel repository di AP: un fetch basta
  fatti.add(dir)
  const chi = s.repo ? s.id : 'ap'
  const nome = s.repo ? s.repo.replace('https://github.com/', '') : 'ygpzk/AP'
  stato(`scarico-${chi}`, { tipo: 'download', id: chi, nome, pct: 0, testo: 'comincio', inizio: Date.now() }, { subito: true })
  const t0 = Date.now()
  try {
    if (!s.repo) {
      log(`scarico-${chi}`, `git fetch di ${nome} (tutti i rami)`)
      await git(['fetch', '--progress', '--prune', 'origin'], REPO, chi, nome)
    } else if (!existsSync(join(dir, 'HEAD'))) {
      log(`scarico-${chi}`, `git clone --mirror ${s.repo}`)
      await git(['clone', '--mirror', '--progress', s.repo + '.git', dir], REPOS, chi, nome)
    } else {
      log(`scarico-${chi}`, `git remote update di ${nome}`)
      await git(['remote', 'update', '--prune'], dir, chi, nome)
    }
    const n = conta(dir, s.ramo)
    const testo = `${n} commit su ${s.ramo} · ${Math.round((Date.now() - t0) / 1000)} s`
    stato(`scarico-${chi}`, { tipo: 'download', id: chi, nome, pct: 100, testo, fine: true }, { subito: true })
    log(`scarico-${chi}`, `√ ${nome}: ${testo}`)
  } catch (e) {
    stato(`scarico-${chi}`, { tipo: 'download', id: chi, nome, pct: 0, testo: e.message, fine: false, errore: true }, { subito: true })
    log(`scarico-${chi}`, `× ${nome}: ${e.message}`)
    process.exitCode = 1
  }
}
