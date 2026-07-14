// ─────────────────────────────────────────────────────────────────────────────
// README per ogni voce dell'archivio, mostrati nel "riquadro dettagli" di
// /archivio. Markdown minimale supportato dal renderer (vedi Archivio.tsx):
//   ## titolo · **grassetto** · `codice` · - elenco · > nota
// Lingua: italiano (chrome dell'esploratore in italiano).
// ─────────────────────────────────────────────────────────────────────────────

import type { Project } from "./projects";
import { typeLabel } from "./projects";

export const README: Record<string, string> = {
  pcto: `## PCTO — Caem Group S.p.A.
Tre anni di percorso per le competenze trasversali e l'orientamento (2023–2026) nell'ufficio tecnico del reparto legno della Caem Group S.p.A. a Castellucchio.

**Cosa ho fatto**
- Modellazione 3D di pensiline in AutoCAD
- Osservazione della progettazione strutturale
- Archiviazione e gestione dei preventivi

Il racconto del percorso è illustrato attraverso i boschi.

**Tecnologie:** AutoCAD 3D, strutture in legno.`,

  "me-stesso": `## About Me — presentazione personale
La mia presentazione per l'Esame di Maturità 2026: chi sono, le radici nell'azienda di famiglia a Rivalta, il percorso CAT, le passioni (web, viaggi, tiro, moto) e il futuro.

**Caratteristiche**
- Un unico scroll narrato
- Design system "neroverde"
- Nello stile di \`/pcto\`

**Tecnologie:** React, TypeScript, design system.`,

  dubliners: `## Dubliners — James Joyce
«Gente di Dublino» in 3 minuti: l'autore, la raccolta di 15 racconti, i personaggi (gente comune, nessun eroe), la trama in cui non accade quasi nulla e il vero tema: la **paralisi**.

**Caratteristiche**
- Scroll narrato in stile "dark premium" viola
- Chiusura sulle ultime righe di «The Dead»

**Tecnologie:** React, TypeScript, design system.`,

  gattopardo: `## Il Gattopardo — Tomasi di Lampedusa
«Il Gattopardo» in 3 minuti: l'autore (un solo romanzo, celebre dopo la morte), la Sicilia del 1860 e l'Unità d'Italia, i personaggi (il Principe Fabrizio, Tancredi, i Salina) e il tema.

> «Se vogliamo che tutto rimanga com'è, bisogna che tutto cambi.»

**Tecnologie:** React, TypeScript, design system "dark premium".`,

  trivia: `## Trivia — quiz di storia dell'architettura
Quiz sulla storia dell'architettura: domande a scelta multipla, vero/falso e a risposta aperta, organizzate in capitoli.

**Caratteristiche**
- Una foto per ogni domanda, punteggio con bonus velocità
- Serie con trofei, voto finale in stile americano (A–F), classifica live
- Pensato come un vero gioco, leggero e animato, per desktop e mobile

**Tecnologie:** React, TypeScript.`,

  rivalta: `## Rivalta sul Mincio — sito turistico
Sito responsive per la destinazione turistica di Rivalta sul Mincio.

**Caratteristiche**
- Design minimale con tipografia editoriale, palette monocromatica calda
- Griglie bento senza spazi, animazioni GSAP ScrollTrigger
- Composizione guidata dalle immagini

**Tecnologie:** Next.js, TypeScript, GSAP, Tailwind CSS.

> Lo ZIP viene scaricato dal repository GitHub.`,

  "cascina-fontana": `## Cascina Fontana — sito aziendale
Sito per Cascina Fontana: design curato e layout responsive ottimizzato per presentare l'attività e i servizi offerti.

**Tecnologie:** React, TypeScript, Tailwind CSS.

> Sito esterno: usa "Apri online".`,

  cv: `## Curriculum Vitae
Il mio curriculum: istruzione, esperienze, competenze e progetti.

**Tipo:** documento PDF.`,

  "attestato-sicurezza": `## Attestato sicurezza lavoratori
Attestato del corso sulla sicurezza dei lavoratori a rischio basso (Accordo Stato–Regioni 21/12/2011, D.Lgs. 81/08), 4 ore in e-learning.

**Tipo:** documento PDF.`,
};

/** README della voce, con fallback composto dai campi se non presente. */
export function readmeOf(p: Project): string {
  if (README[p.id]) return README[p.id];
  const tech = p.tags?.length ? `\n\n**Tecnologie:** ${p.tags.join(", ")}.` : "";
  return `## ${p.title}\n${p.desc}\n\n**Tipo:** ${typeLabel(p.kind)}.${tech}`;
}
