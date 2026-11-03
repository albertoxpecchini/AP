// I siti della macchina del tempo (3.11.2026). All'inizio c'era solo albertopecchini.it;
// Alberto: «fai anche tutti i commit di cascina fontana e rivalta sul mincio con stesse
// funzioni attuali e senza bug + anche pzk e bcp che sono dentro al repo AP», con un
// selettore del repository nella barra in alto.
//
// Per ogni sito:
//   id        il nome breve: indirizzi (/tempo/<id>/<sha>/, tranne ap che resta a
//             /tempo/<sha>/ come prima), foto (public/media/tempo/<id>/), manifesto
//   repo      il repository su GitHub, scaricato «mirror» in lavoro/repo/<id>.git
//             (scarica.mjs); null = il repository AP, questo
//   ramo      il ramo di cui si ripercorre la storia (quello che va in produzione)
//   percorsi  quali file contano per dire «quel giorno il sito è cambiato» (pathspec di git)
//   da        il primo giorno (prima il sito non c'era, o stava altrove)
//   costruisci(dir) → la cartella da servire: 'npm' (npm ci + build, la cartella dist),
//             oppure una funzione che sceglie da sé (pzkko non ha build)

import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
export const SITO = resolve(QUI, '../..') // albertopecchini.it/
export const REPO = resolve(SITO, '..') // AP/
export const LAVORO = join(QUI, 'lavoro')
export const REPOS = join(LAVORO, 'repo')

// albertopecchini.it: fuori pzkko, Better Call Pekko, i workflow e i documenti di radice, e fuori
// quello che produce la macchina del tempo stessa (foto, manifesto, strumento): altrimenti ogni
// aggiornamento delle foto diventava il «giorno di oggi» da fotografare, all'infinito
const FUORI_AP = [':!albertopecchini.it/src/data/tempo.js', ':!albertopecchini.it/src/data/tempo', ':!albertopecchini.it/public/media/tempo', ':!albertopecchini.it/tools/tempo', ':!albertopecchini.it/pzkko', ':!albertopecchini.it/tools/pzkko', ':!albertopecchini.it/public/bcp', ':!albertopecchini.it/src/data/assistenza.js', ':!albertopecchini.it/src/templates/pages/assistenza.js', ':!albertopecchini.it/api/bcp.js', ':!.github', ':!README.md', ':!CLAUDE.md', ':!PRODUCT.md', ':!DESIGN.md', ':!.claude']

export const SITI = [
  {
    id: 'ap',
    ordine: 1,
    nome: 'albertopecchini.it',
    url: 'https://www.albertopecchini.it',
    github: 'https://github.com/ygpzk/AP',
    repo: null,
    ramo: 'HEAD',
    // l'ultimo commit di ogni giorno fra tutti quelli del ramo (com'era fino al 3.11.2026: le 108 versioni già fatte restano quelle)
    linea: ['HEAD'],
    cima: ['albertopecchini.it/'],
    percorsi: ['.', ...FUORI_AP],
    da: '2026-05-24',
    // fino al 17.9.2026 il sito stava alla radice del repository, dopo in albertopecchini.it/
    radice: (casa) => (existsSync(join(casa, 'albertopecchini.it/package.json')) ? join(casa, 'albertopecchini.it') : casa),
    costruisci: 'npm',
  },
  {
    id: 'rivalta',
    ordine: 2,
    nome: 'rivaltasulmincio.it',
    url: 'https://www.rivaltasulmincio.it',
    github: 'https://github.com/ygpzk/rivaltasulmincio',
    repo: 'https://github.com/ygpzk/rivaltasulmincio',
    ramo: 'main',
    // la storia di main: lo stato del sito a fine giornata (i rami delle PR contano nei commit, non nelle versioni)
    linea: ['--first-parent', 'main'],
    tutti: ['main'],
    cima: ['rivaltasulmincio.it/'],
    percorsi: ['.', ':!*.md', ':!.github', ':!.claude', ':!.vscode'],
    radice: (casa) => (existsSync(join(casa, 'rivaltasulmincio.it/package.json')) ? join(casa, 'rivaltasulmincio.it') : casa),
    costruisci: 'npm',
  },
  {
    id: 'cascina',
    ordine: 3,
    nome: 'cascinafontana.xyz',
    url: 'https://www.cascinafontana.xyz',
    github: 'https://github.com/ygpzk/cascinafontana',
    repo: 'https://github.com/ygpzk/cascinafontana',
    ramo: 'main',
    // main ricomincia da zero il 16.7.2026: i commit di aprile e maggio (il sito statico, Next.js, il «RESET»)
    // stanno solo sui rami di allora. Si prendono tutti i rami: di ogni giorno l'ultimo commit, dovunque sia
    linea: ['--all'],
    cima: [],
    percorsi: ['.', ':!*.md', ':!.github', ':!.claude', ':!.vscode'],
    radice: (casa) => casa,
    costruisci: 'npm',
  },
  {
    id: 'pzkko',
    ordine: 4,
    nome: 'pzkko.it',
    url: 'https://www.pzkko.it',
    github: 'https://github.com/ygpzk/AP',
    repo: null,
    ramo: 'HEAD',
    linea: ['HEAD'],
    cima: ['albertopecchini.it/pzkko/'],
    // dal 7.10.2026 pzkko.it è la cartella albertopecchini.it/pzkko, file statici senza build
    percorsi: ['albertopecchini.it/pzkko'],
    da: '2026-10-07',
    radice: (casa) => join(casa, 'albertopecchini.it/pzkko'),
    // le funzioni di Vercel e il codice del server di casa non sono pagine: nell'archivio non vanno
    escludi: ['api', 'server', 'tools', 'vercel.json'],
    costruisci: (dir) => (existsSync(join(dir, 'index.html')) ? dir : null),
  },
  {
    id: 'bcp',
    ordine: 5,
    nome: 'bettercallpekko.it',
    url: 'https://www.bettercallpekko.it',
    github: 'https://github.com/ygpzk/AP',
    repo: null,
    ramo: 'HEAD',
    linea: ['HEAD'],
    cima: ['albertopecchini.it/'],
    // dal 28.9.2026 Better Call Pekko è un progetto a parte: lo stesso Vite del sito con SITE=bcp
    // fuori quello che produce la macchina del tempo: le foto di BCP stanno in public/media/tempo/bcp/,
    // e ogni loro commit diventava un «giorno» nuovo di Better Call Pekko (3.11.2026)
    percorsi: [':(glob)albertopecchini.it/**/*bcp*', ':(glob)albertopecchini.it/**/*bcp*/**', ':(glob)albertopecchini.it/**/*assistenza*', ':(glob)albertopecchini.it/**/*assistenza*/**', ':!albertopecchini.it/public/media/tempo', ':!albertopecchini.it/src/data/tempo', ':!albertopecchini.it/tools/tempo'],
    da: '2026-09-28',
    radice: (casa) => join(casa, 'albertopecchini.it'),
    costruisci: 'npm',
    env: { SITE: 'bcp' },
  },
]

export const sito = (id) => SITI.find((s) => s.id === id)
export const cartellaGit = (s) => (s.repo ? join(REPOS, `${s.id}.git`) : REPO)
// l'indirizzo di una versione nell'archivio: ap resta dov'era (/tempo/<sha>/), gli altri hanno il loro nome davanti
export const prefisso = (s, short) => (s.id === 'ap' ? `/tempo/${short}` : `/tempo/${s.id}/${short}`)
export const cartellaDeposito = (deposito, s, short) => (s.id === 'ap' ? join(deposito, 'versioni', short) : join(deposito, 'versioni', s.id, short))
