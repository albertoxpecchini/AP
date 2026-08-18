// ─────────────────────────────────────────────────────────────────────────────
// Il manifesto dell'album, e come si legge.
//
// foto.json lo scrive `npm run foto` (scripts/build-foto-mima.mjs) leggendo i
// metadati EXIF delle foto originali, che stanno in foto/mima/ e nel repo non
// ci sono. Qui c'è solo la forma di quel file, più le due o tre funzioni che
// servono a entrambe le metà della pagina — la griglia e la mappa — perché
// leggano gli stessi numeri.
//
// Niente di tutto questo si scrive a mano: rilanciare il comando dopo aver
// aggiunto foto rigenera il json, e la pagina si aggiorna da sé.
// ─────────────────────────────────────────────────────────────────────────────

import manifesto from "./foto.json";

export interface Foto {
  id: string;
  /** Versione grande (lato lungo 1600 px), per il visore. */
  src: string;
  /** Miniatura (lato lungo 480 px), per la griglia. */
  mini: string;
  w: number;
  h: number;
  /** Istante dello scatto, ISO. */
  quando: string;
  /** Giorno di calendario a Roma, YYYY-MM-DD. */
  giorno: string;
  /** Ora locale, HH:MM. */
  ora: string;
  /** L'ordine viene dalla data del file, non dallo scatto: da prendere con le pinze. */
  dataIncerta?: boolean;
  /** Da dove arriva la data: EXIF dello scatto, nome del file, o filesystem. */
  fonteData?: "exif" | "nome" | "file";
  lat?: number;
  lon?: number;
  /** La posizione è ereditata da uno scatto vicino nel tempo, non letta da questo. */
  posizioneStimata?: boolean;
  /** Nome del posto noto più vicino, se lo scatto ci cade dentro. */
  luogo?: string;
  luogoKey?: string;
  macchina?: string;
  originale: string;
}

export interface Giorno {
  data: string;
  n: number;
  indice: number;
}

export interface Manifesto {
  generato: string;
  fonte: string;
  totale: number;
  conPosizione: number;
  posizioneDedotta: number;
  senzaPosizione: number;
  bounds: { sw: [number, number]; ne: [number, number] } | null;
  giorni: Giorno[];
  foto: Foto[];
}

export const ALBUM = manifesto as Manifesto;

/** Le foto in ordine cronologico, spezzate per giornata. */
export function perGiornata(foto: Foto[]) {
  const mappa = new Map<string, Foto[]>();
  for (const f of foto) {
    const g = mappa.get(f.giorno);
    if (g) g.push(f);
    else mappa.set(f.giorno, [f]);
  }
  return [...mappa.entries()].map(([data, foto]) => ({ data, foto }));
}

const GIORNI_SETTIMANA = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/** "giovedì 13 agosto" — dalla stringa YYYY-MM-DD, senza passare da toISOString. */
export function etichettaGiorno(data: string) {
  const [a, m, g] = data.split("-").map(Number);
  // Mezzogiorno e non mezzanotte: a mezzanotte un fuso negativo riporterebbe
  // la data al giorno prima, e l'etichetta direbbe un giorno sbagliato.
  const d = new Date(a, m - 1, g, 12);
  return `${GIORNI_SETTIMANA[d.getDay()]} ${g} ${MESI[m - 1]}`;
}

/** Solo quelle che hanno un punto: sono le uniche che la mappa può disegnare. */
export const CON_POSIZIONE = ALBUM.foto.filter((f) => f.lat != null && f.lon != null);
