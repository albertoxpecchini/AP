#!/usr/bin/env node
// Il controllo di pzkkopedia (2.11; Alberto: «ricorda che ad ogni push nuovo bisogna aggiornarla»): dice se la wiki è
// in pari col repository e se le voci sono sane. Esce con 1 se qualcosa non va (e GitHub mette la ❌ al commit).
//
//   node tools/pzkko/wiki/controlla.mjs            (dalla cartella albertopecchini.it, o da dovunque)
//   node tools/pzkko/wiki/controlla.mjs --hook     il gancio di Claude Code prima di `git push` (.claude/settings.json):
//                                                  legge il comando dallo stdin e, se è un push e la wiki è indietro, lo ferma
//   node tools/pzkko/wiki/controlla.mjs --solo-voci   senza il confronto coi commit (per esempio nella CI senza storia)
//
// Cosa controlla:
//   1. la wiki è allineata: dal commit scritto in wiki/stato.json a oggi (HEAD più le modifiche non committate) non ci sono
//      file cambiati in albertopecchini.it/ e .github/ e CLAUDE.md senza che sia cambiata anche la wiki; e per ogni file
//      cambiato dice quali voci lo dichiarano fra le `fonti`, così si sa cosa rileggere;
//   2. ogni voce ha data e fonti, e ogni fonte esiste nel repository;
//   3. ogni [[File:…]] di wiki/img/ esiste; i percorsi assoluti del sito (/art/…) pure;
//   4. i link rossi: quanti sono e quali (un avviso, non un errore, sotto una soglia);
//   5. i moduli di voci/ sono JavaScript che si carica, nessun titolo doppio, niente apici inversi crudi nel testo.
import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../../..')
const REPO = resolve(SITO, '..')
const PZKKO = join(SITO, 'pzkko')
const WIKI = join(PZKKO, 'wiki')
const hook = process.argv.includes('--hook'), soloVoci = process.argv.includes('--solo-voci')
const git = (...args) => { try { return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20 }).trim() } catch { return '' } }
const errori = [], avvisi = []

// il gancio: se il comando non è un push, via libera subito
if (hook) {
  let stdin = ''
  try { stdin = await new Promise((r) => { let s = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', (d) => (s += d)); process.stdin.on('end', () => r(s)); setTimeout(() => r(s), 1500) }) } catch {}
  let comando = ''
  try { comando = JSON.parse(stdin)?.tool_input?.command ?? '' } catch { comando = stdin }
  if (!/\bgit\s+(-C\s+\S+\s+)?push\b/.test(comando)) process.exit(0)
}

// ---------------------------------------------------------------------------------------------------- 1. allineata?
const stato = existsSync(join(WIKI, 'stato.json')) ? JSON.parse(await readFile(join(WIKI, 'stato.json'), 'utf8')) : null
let cambiati = []
if (!soloVoci) {
  if (!stato) errori.push('manca pzkko/wiki/stato.json: lancia `node tools/pzkko/wiki/aggiorna.mjs`')
  else {
    const esiste = git('cat-file', '-t', stato.commit) === 'commit'
    if (!esiste) avvisi.push(`il commit ${stato.commit} di stato.json non è in questa copia del repository: confronto solo le modifiche non committate`)
    const committati = esiste ? git('diff', '--name-only', `${stato.commit}..HEAD`).split('\n') : []
    // (al push conta solo quello che parte, cioè i commit: le modifiche non committate, magari di un'altra sessione, restano qui)
    const nonCommittati = hook ? [] : git('status', '--porcelain', '--untracked-files=all').split('\n').map((r) => r.slice(3).trim()).filter(Boolean)
    const tutti = [...new Set([...committati, ...nonCommittati].filter(Boolean).map((f) => f.replace(/\\/g, '/').replace(/^"|"$/g, '')))]
    const conta = (f) => (f.startsWith('albertopecchini.it/') || f.startsWith('.github/') || f === 'CLAUDE.md' || f.startsWith('.claude/skills/') || f === 'README.md' || f === 'PRODUCT.md' || f === 'DESIGN.md') && !f.startsWith('albertopecchini.it/pzkko/wiki/') && !/\/lavoro\//.test(f) && !f.startsWith('albertopecchini.it/public/media/web/') && !f.startsWith('albertopecchini.it/src/data/catture.js') && !f.includes('node_modules') && !f.startsWith('albertopecchini.it/dist')
    cambiati = tutti.filter(conta)
    const wikiToccata = tutti.some((f) => f.startsWith('albertopecchini.it/pzkko/wiki/') && !f.startsWith('albertopecchini.it/pzkko/wiki/img/'))
    if (cambiati.length && !wikiToccata) errori.push(`la wiki è INDIETRO: ${cambiati.length} file del sito sono cambiati dal commit ${stato.commit} (${stato.data}) e nessuna voce è stata toccata. Rileggi le voci qui sotto e poi \`node tools/pzkko/wiki/aggiorna.mjs\`.`)
    else if (cambiati.length) avvisi.push(`${cambiati.length} file del sito sono cambiati dal commit ${stato.commit}: la wiki è stata toccata, controlla che le voci qui sotto dicano il vero, poi \`node tools/pzkko/wiki/aggiorna.mjs\` prima del push.`)
  }
}

// ---------------------------------------------------------------------------------------------------- 2-5. le voci
const VOCI = {}, FILE_DI = {}
for (const nome of (await readdir(join(WIKI, 'voci'))).filter((f) => f.endsWith('.js'))) {
  const f = join(WIKI, 'voci', nome)
  let m
  try { m = await import(pathToFileURL(f).href + `?t=${Date.now()}`) } catch (e) { errori.push(`voci/${nome} non si carica: ${e.message.split('\n')[0]}`); continue }
  for (const [t, v] of Object.entries(m.VOCI ?? {})) {
    if (Object.hasOwn(VOCI, t)) { errori.push(`«${t}» è scritta due volte: in ${FILE_DI[t]} e in ${nome}`); continue }
    const tt = t.replace(/'/g, '’').replace(/\s+/g, ' ').trim()
    VOCI[tt] = v; FILE_DI[tt] = nome
  }
}
const nomeFile = (nome) => { nome = nome.trim().replace(/ /g, '_'); return /^(https?:)?\/\//.test(nome) || nome.startsWith('/') || /\.[a-z0-9]{2,5}$/i.test(nome) ? nome : nome + '.webp' }
const normalizza = (t) => { t = t.replace(/_/g, ' ').replace(/'/g, '’').replace(/\s+/g, ' ').trim(); const M = t.charAt(0).toUpperCase() + t.slice(1), m = t.charAt(0).toLowerCase() + t.slice(1); return Object.hasOwn(VOCI, M) ? M : Object.hasOwn(VOCI, m) ? m : M }
const NS = ['Speciale', 'Discussione', 'Utente', 'Discussioni utente', 'Pzkkopedia', 'Discussioni Pzkkopedia', 'File', 'Discussioni file', 'Template', 'Discussioni template', 'Aiuto', 'Discussioni aiuto', 'Categoria', 'Discussioni categoria', 'Portale', 'Discussioni portale']
const normNs = (t) => { const i = t.indexOf(':'); if (i > 0) { const ns = NS.find((n) => n.toLowerCase() === t.slice(0, i).trim().toLowerCase()); if (ns) return `${ns}:${normalizza(t.slice(i + 1))}` } return normalizza(t) }
const cat = new Map(), file = new Map(), rossi = new Map(), fontiMancanti = [], senzaDati = [], apici = [], immaginiMancanti = []
const RE_LINK = /\[\[([^\[\]|#]*?)(?:#[^\[\]|]*)?(?:\|[^\[\]]*?)?\]\]/g
for (const [t, v] of Object.entries(VOCI)) {
  const testo = (typeof v === 'string' ? v : v?.testo ?? '').replace(/<nowiki>[\s\S]*?<\/nowiki>/gi, '')
  if (typeof v !== 'object' || !v.data) senzaDati.push(`${t} (data)`)
  if (typeof v !== 'object' || !Array.isArray(v.fonti) || !v.fonti.length) senzaDati.push(`${t} (fonti)`)
  for (const f of (typeof v === 'object' && Array.isArray(v.fonti) ? v.fonti : [])) if (!existsSync(join(REPO, f))) fontiMancanti.push(`${t}: ${f}`)
  if (/\$\{/.test(testo)) apici.push(t)
  for (const m of testo.matchAll(/\[\[\s*Categoria\s*:\s*([^\]|\n]+?)\s*(?:\|[^\]\n]*)?\]\]/gi)) cat.set(normNs('Categoria:' + m[1]), (cat.get(normNs('Categoria:' + m[1])) ?? 0) + 1)
  for (const m of testo.matchAll(RE_LINK)) {
    const b = m[1].trim().replace(/^:/, '')
    if (!b || /^Categoria\s*:/i.test(b)) continue
    if (/^File\s*:/i.test(b)) { file.set(nomeFile(b.replace(/^File\s*:\s*/i, '').split('|')[0]), t); continue }
    rossi.set(normNs(b), [...(rossi.get(normNs(b)) ?? []), t])
  }
  for (const m of testo.matchAll(/\[\[\s*File\s*:\s*([^\]|]+)/gi)) file.set(nomeFile(m[1]), t)
  for (const m of testo.matchAll(/\|\s*immagine\s*=\s*([^\n|]+)/gi)) if (m[1].trim()) file.set(nomeFile(m[1]), t)
}
const esiste = (t) => Object.hasOwn(VOCI, t) || t === 'Pagina principale' || t.startsWith('Speciale:') || (t.startsWith('Categoria:') && cat.has(t)) || (t.startsWith('File:') && file.has(nomeFile(t.slice(5))))
const linkRossi = [...rossi].filter(([t]) => !esiste(t)).sort((a, b) => b[1].length - a[1].length)
for (const [f] of file) {
  if (/^https?:/.test(f)) continue
  const p = f.startsWith('/') ? join(PZKKO, decodeURIComponent(f.split('?')[0])) : join(WIKI, 'img', f)
  if (!existsSync(p)) immaginiMancanti.push(f)
}
if (senzaDati.length) errori.push(`voci senza data o senza fonti: ${senzaDati.length} (${senzaDati.slice(0, 8).join(', ')}${senzaDati.length > 8 ? '…' : ''})`)
if (fontiMancanti.length) errori.push(`fonti che non esistono nel repository: ${fontiMancanti.length}\n    ${fontiMancanti.slice(0, 20).join('\n    ')}${fontiMancanti.length > 20 ? '\n    …' : ''}`)
if (apici.length) errori.push(`«$\{» nel testo (va scritto in <code>): ${apici.join(', ')}`)
if (immaginiMancanti.length) errori.push(`immagini che non esistono: ${immaginiMancanti.length}\n    ${[...new Set(immaginiMancanti)].slice(0, 30).join('\n    ')}`)
if (linkRossi.length) (linkRossi.length > 40 ? errori : avvisi).push(`link rossi (pagine linkate che non esistono): ${linkRossi.length}\n    ${linkRossi.slice(0, 60).map(([t, da]) => `${t} ← ${da.length} (${da.slice(0, 3).join(', ')}${da.length > 3 ? '…' : ''})`).join('\n    ')}${linkRossi.length > 60 ? '\n    …' : ''}`)

// ---------------------------------------------------------------------------------------------------- le voci da rileggere
let daRileggere = ''
if (cambiati.length) {
  const perFile = new Map()
  for (const [t, v] of Object.entries(VOCI)) for (const f of (Array.isArray(v?.fonti) ? v.fonti : [])) perFile.set(f, [...(perFile.get(f) ?? []), t])
  const righe = cambiati.map((f) => `    ${f}${perFile.has(f) ? ` → ${[...new Set(perFile.get(f))].slice(0, 8).join(', ')}` : ' → (nessuna voce lo dichiara fra le fonti: ne serve una?)'}`)
  daRileggere = `\n  file cambiati dal commit ${stato?.commit} e le voci che li dichiarano:\n${righe.join('\n')}`
}

// ---------------------------------------------------------------------------------------------------- l'esito
const n = Object.keys(VOCI).length
const righe = [`pzkkopedia: ${n} pagine, ${cat.size} categorie, ${file.size} immagini${stato ? `, allineata al commit ${stato.commit} (${stato.data})` : ''}`]
for (const a of avvisi) righe.push(`  avviso: ${a}`)
for (const e of errori) righe.push(`  ERRORE: ${e}`)
if (daRileggere) righe.push(daRileggere)
righe.push(errori.length ? `pzkkopedia: ${errori.length} ${errori.length === 1 ? 'problema' : 'problemi'}.` : 'pzkkopedia: tutto a posto.')
const testo = righe.join('\n')
if (hook) {
  if (errori.length) { process.stderr.write(`La wiki di pzkko (pzkkopedia) va aggiornata PRIMA del push (regola di Alberto, 2.11.2026).\n${testo}\n`); process.exit(2) }
  process.exit(0)
}
console.log(testo)
if (process.env.GITHUB_ACTIONS) for (const e of errori) console.log(`::error title=pzkkopedia::${e.split('\n')[0]}`)
process.exit(errori.length ? 1 : 0)
