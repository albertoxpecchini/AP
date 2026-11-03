// La diretta della macchina del tempo è la diretta della regia di Claude (tools/cruscotto/):
// dal 3.11.2026 sera tutti i lavori scrivono in C:\Users\Alberto\.cruscotto e una sola finestra
// li mostra. Qui resta il nome di prima, per tempo.mjs, scarica.mjs, giro.mjs e prova.mjs.
//
//   node tools/tempo/diretta.mjs "testo"     la nota in cima alla regia

export { stato, log, nota, DIRETTA, CARTELLA } from '../cruscotto/diretta.mjs'
import { nota } from '../cruscotto/diretta.mjs'
import { fileURLToPath } from 'node:url'

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv[2]) nota(process.argv.slice(2).join(' '))
