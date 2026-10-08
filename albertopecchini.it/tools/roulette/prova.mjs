#!/usr/bin/env node
// La fisica della roulette messa alla prova senza browser: tanti giri con semi
// diversi, per vedere quanto durano, quanto rimbalza la pallina, se i numeri
// escono tutti e se la simulazione finisce sempre.
//
//   node tools/roulette/prova.mjs            # 1480 giri (40 per numero in media)
//   node tools/roulette/prova.mjs 200        # quanti giri
//   node tools/roulette/prova.mjs 1 --seme=7 # un giro raccontato passo passo

import { nuovaRuota, spingiRotore, giroIntero, SEQUENZA, N, passo, lancia } from '../../pzkko/games/roulette/fisica.js'

const args = process.argv.slice(2)
const quanti = Number(args.find((a) => !a.startsWith('--'))) || 1480
const seme = Number((args.find((a) => a.startsWith('--seme=')) || '').split('=')[1]) || 0

if (quanti === 1) {
  const S = nuovaRuota({ seme: seme || 7 })
  spingiRotore(S, -2.4)
  passo(S, 2)
  const g = giroIntero(S)
  console.log(`giro con seme ${seme || 7}: esce il ${g.numero} dopo ${g.durata.toFixed(2)} s, ${g.deflettori} deflettori, ${g.rimbalzi} rimbalzi sui separatori`)
  for (const e of g.traccia) console.log(`  ${String(e.t).padStart(6)} s  ${e.nome}  ${JSON.stringify({ ...e, t: undefined, nome: undefined }).replace(/"t":undefined,?|"nome":undefined,?/g, '')}`)
  process.exit(0)
}

const conteggio = new Array(N).fill(0)
const durate = [], rimbalzi = [], deflettori = []
let errori = 0, nonFinite = 0
const t0 = Date.now()
for (let k = 0; k < quanti; k++) {
  const S = nuovaRuota({ seme: seme ? seme + k : 1000 + k * 7919 })
  spingiRotore(S, -2.0 - S.rnd() * 0.8)
  passo(S, 1 + S.rnd() * 6) // il rotore gira da un po': il punto di lancio cambia
  const g = giroIntero(S)
  if (g.numero === null || !Number.isFinite(g.durata)) { nonFinite++; continue }
  if (g.durata >= 59) errori++
  conteggio[SEQUENZA.indexOf(g.numero)]++
  durate.push(g.durata); rimbalzi.push(g.rimbalzi); deflettori.push(g.deflettori)
}
const ms = Date.now() - t0
const stat = (v) => { const s = [...v].sort((a, b) => a - b); const m = s.reduce((a, b) => a + b, 0) / s.length; return `min ${s[0].toFixed(2)} · mediana ${s[s.length >> 1].toFixed(2)} · media ${m.toFixed(2)} · max ${s[s.length - 1].toFixed(2)}` }
console.log(`${quanti} giri in ${ms} ms (${(ms / quanti).toFixed(1)} ms a giro)`)
console.log(`durata (s):      ${stat(durate)}`)
console.log(`deflettori:      ${stat(deflettori)}`)
console.log(`rimbalzi:        ${stat(rimbalzi)}`)
const attesi = (quanti - nonFinite) / N
const chi2 = conteggio.reduce((s, c) => s + ((c - attesi) ** 2) / attesi, 0)
console.log(`numeri: min ${Math.min(...conteggio)} · max ${Math.max(...conteggio)} · attesi ${attesi.toFixed(1)} · chi² ${chi2.toFixed(1)} su 36 gradi (sotto ~51 è uniforme al 95 %)`)
console.log(`  ${SEQUENZA.map((n, i) => `${n}:${conteggio[i]}`).join(' ')}`)
if (nonFinite || errori) { console.log(`✗ ${nonFinite} giri senza esito, ${errori} oltre i 59 s`); process.exit(1) }
console.log('✓ tutti i giri finiscono con un numero')
