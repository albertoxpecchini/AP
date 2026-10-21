// npm run online — i tre dev server, raggiungibili anche da fuori con indirizzi fissi
// (dev tunnels di Microsoft, lo stesso servizio delle porte inoltrate di VS Code):
//
//   albertopecchini.it   :5173   npm run dev
//   bettercallpekko.it   :5181   npm run dev:bcp
//   pzkko.it             :5182   npm run dev:pzkko
//
// Accende i server che non sono già accesi, poi ospita il tunnel «pzkko» e stampa i tre
// indirizzi. Il tunnel è anonimo: chi ha il link entra (alla prima visita Microsoft mostra un
// avviso: «Continue»). Gli indirizzi restano gli stessi finché il tunnel esiste: scade dopo
// 30 giorni; se manca lo si ricrea da qui, ma allora cambiano. Ctrl+C spegne tunnel e server
// accesi da qui. In VS Code: Ctrl+Alt+O (attività «online» in .vscode/tasks.json).
// La prima volta su un computer: devtunnel (winget install Microsoft.devtunnel) e
// `devtunnel user login -g`; se manca il login lo apre da sé nel browser.
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TUNNEL = 'pzkko'
const SITI = [
  { nome: 'albertopecchini.it', tag: 'ap', port: 5173, args: ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'] },
  { nome: 'bettercallpekko.it', tag: 'bcp', port: 5181, args: ['tools/dev.mjs', 'bcp'] },
  { nome: 'pzkko.it', tag: 'pzk', port: 5182, args: ['tools/dev.mjs', 'pzkko'] },
]

const devtunnel = (() => {
  if (spawnSync('devtunnel', ['--version'], { stdio: 'ignore' }).status === 0) return 'devtunnel'
  const winget = path.join(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Packages')
  const pkg = fs.existsSync(winget) && fs.readdirSync(winget).find((d) => d.startsWith('Microsoft.devtunnel'))
  if (pkg) return path.join(winget, pkg, 'devtunnel.exe')
  console.error('manca devtunnel: winget install Microsoft.devtunnel')
  process.exit(1)
})()
const dt = (...args) => spawnSync(devtunnel, args, { encoding: 'utf8' })

console.log('online: tre dev server e il tunnel «%s»\n', TUNNEL)

// 1. login (una volta per computer) e tunnel con le tre porte
// («Not logged in» contiene anche lui «logged in»: prima passava per un accesso, e il tunnel si chiedeva da anonimo)
const utente = dt('user', 'show').stdout
if (/not logged in/i.test(utente) || !/logged in/i.test(utente)) {
  console.log('devtunnel: accedi con GitHub nel browser che si apre…')
  if (spawnSync(devtunnel, ['user', 'login', '-g'], { stdio: 'inherit' }).status !== 0) process.exit(1)
}
let info = dt('show', TUNNEL, '--json')
if (info.status !== 0) {
  console.log(`devtunnel: il tunnel «${TUNNEL}» non c'è più, lo ricreo (gli indirizzi cambiano)`)
  const c = dt('create', TUNNEL, '--allow-anonymous', '--expiration', '30d', '--labels', 'ap-dev', '--description', 'dev server di albertopecchini.it, bettercallpekko.it e pzkko.it')
  if (c.status !== 0) { console.error(c.stdout, c.stderr); process.exit(1) }
  info = dt('show', TUNNEL, '--json')
}
const porte = new Set((JSON.parse(info.stdout || '{}').tunnel?.ports || []).map((p) => p.portNumber))
for (const s of SITI) if (!porte.has(s.port)) dt('port', 'create', TUNNEL, '--port-number', String(s.port), '--protocol', 'http')

// 2. i server: quelli già accesi restano come sono, gli altri li accende questo processo
const acceso = (port) =>
  new Promise((ok) => {
    const c = net.connect(port, '127.0.0.1')
    c.once('connect', () => { c.destroy(); ok(true) })
    c.once('error', () => ok(false))
  })
const figli = []
const conPrefisso = (tag, stream) => {
  let resto = ''
  stream.setEncoding('utf8')
  stream.on('data', (d) => {
    const righe = (resto + d).split(/\r?\n/)
    resto = righe.pop()
    for (const r of righe) if (r.trim()) console.log(`[${tag}] ${r}`)
  })
}
for (const s of SITI) {
  if (await acceso(s.port)) {
    console.log(`[${s.tag}] già acceso su :${s.port}`)
    continue
  }
  const p = spawn(process.execPath, s.args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, FORCE_COLOR: '1' } })
  conPrefisso(s.tag, p.stdout)
  conPrefisso(s.tag, p.stderr)
  p.on('exit', (code) => code && console.log(`[${s.tag}] uscito (${code})`))
  figli.push(p)
}
const spegni = () => {
  for (const p of figli) p.kill()
  process.exit(0)
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) process.on(sig, spegni)

for (let t = 0; !(await Promise.all(SITI.map((s) => acceso(s.port)))).every(Boolean); t++) {
  if (t > 120) { console.error('i server non partono: guarda le righe sopra'); spegni() }
  await new Promise((r) => setTimeout(r, 500))
}

// 3. il tunnel: quando ha aperto le tre porte, gli indirizzi
const host = spawn(devtunnel, ['host', TUNNEL], { stdio: ['ignore', 'pipe', 'pipe'] })
figli.push(host)
const pubblici = new Map()
let stampati = false
const leggi = (stream) => {
  stream.setEncoding('utf8')
  let resto = ''
  stream.on('data', (d) => {
    const righe = (resto + d).split(/\r?\n/)
    resto = righe.pop()
    for (const r of righe) {
      for (const [, url, port] of r.matchAll(/(https:\/\/[a-z0-9]+-(\d+)\.[a-z0-9]+\.devtunnels\.ms)/g)) pubblici.set(+port, url + '/')
      if (/error|fail|expired/i.test(r)) console.log(`[tunnel] ${r}`)
      if (!stampati && SITI.every((s) => pubblici.has(s.port))) {
        stampati = true
        const rete = Object.values(os.networkInterfaces()).flat().find((i) => i.family === 'IPv4' && !i.internal)?.address
        console.log('\n  pronti\n')
        for (const s of SITI) {
          console.log(`  ${s.nome.padEnd(20)} ${pubblici.get(s.port)}`)
          console.log(`  ${''.padEnd(20)} http://localhost:${s.port}/${rete ? `  ·  http://${rete}:${s.port}/` : ''}\n`)
        }
        console.log('  Ctrl+C spegne il tunnel e i server accesi da qui.\n')
      }
    }
  })
}
leggi(host.stdout)
leggi(host.stderr)
host.on('exit', (code) => {
  console.error(`[tunnel] devtunnel host è uscito (${code})`)
  spegni()
})
