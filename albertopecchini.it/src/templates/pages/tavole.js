// Pagina /portfolio/tavole/: tutte le tavole vere del portfolio nel
// visualizzatore a tutto schermo, raggruppate per progetto. Un indirizzo come
// /portfolio/tavole/#progetto-stradale-03 apre direttamente quella tavola.

import { withSheets } from '../../data/projects.js'
import { sheetViewer } from '../components/viewer.js'

export function tavolePage() {
  const groups = withSheets().map((p) => ({ project: p, sheets: p.sheets }))
  return sheetViewer(groups, {
    page: true,
    label: 'Tavole',
    lead: 'I disegni dei miei progetti, come escono da AutoCAD: ingrandisci fino ai dettagli, spostati sul foglio, scarica il PDF.',
  })
}

export const sheetCount = () => withSheets().reduce((n, p) => n + p.sheets.length, 0)
export const hasSheets = () => withSheets().length > 0
