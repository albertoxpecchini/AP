// ─────────────────────────────────────────────────────────────────────────────
// I due manifesti degli shooting, e come si leggono.
//
// Sono due perché le foto sono ritratti di persone, e di quelle sessioni può
// diventare pubblico solo il fatto che siano esistite:
//
//   sessioni.json  ← QUESTO sta nel repo, e lo importa la pagina. Contiene date,
//                    luoghi, conteggi, attrezzatura. Nessun nome, nessuna foto.
//   il manifesto privato  arriva a runtime da /scatti-privati/manifesto.json,
//                    un indirizzo che esiste solo sotto `vite dev` (il plugin in
//                    scripts/shooting-api-dev.mjs). In produzione risponde 404,
//                    perché le immagini su quel server non ci sono proprio.
//
// Quindi la galleria non è "nascosta dietro un controllo": chi apre il sito
// pubblicato non ha modo di chiedere le foto, perché non sono state caricate.
// Il controllo su localhost qui sotto serve solo a non fare una richiesta
// inutile a ogni visita.
//
// Li scrive tutti e due `npm run scatti` (scripts/build-foto-shooting.mjs).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { isLocalhost } from "../utils/local";
import pubblico from "./sessioni.json";

// ── Il lato pubblico ─────────────────────────────────────────────────────────

export interface Estremi {
  min: number;
  max: number;
}

export interface SessionePubblica {
  /** Progressivo — "s1", "s2". È il nome della cartella a NON essere pubblico. */
  id: string;
  /** Giorno dello shooting, YYYY-MM-DD. */
  data: string;
  /** Lo stesso giorno scritto per esteso: "mercoledì 19 agosto 2026". */
  giorno: string;
  /** Più di un giorno solo se la sessione è finita oltre la mezzanotte. */
  giorni?: string[];
  ora: { da: string; a: string };
  luogo: string | null;
  n: number;
  macchina: string | null;
  obiettivo: string | null;
  iso: Estremi | null;
  focale: Estremi | null;
  apertura: Estremi | null;
}

export interface ManifestoPubblico {
  generato: string;
  fonte: string;
  totale: number;
  sessioni: SessionePubblica[];
}

export const SESSIONI = pubblico as ManifestoPubblico;

// ── Il lato privato ──────────────────────────────────────────────────────────

export interface Scatto {
  id: string;
  /** Miniatura, lato lungo 640 px: la cella della griglia. */
  mini: string;
  /** Lato lungo 1800 px: quello che il visore mostra subito. */
  medio: string;
  /** Il file come esce dalla macchina, non ricodificato: la qualità piena. */
  originale: string;
  /** Misure della versione media — quelle che servono a tenere il posto in griglia. */
  w: number;
  h: number;
  /** Misure dell'originale, dichiarate dal visore quando la qualità piena è arrivata. */
  wo: number;
  ho: number;
  /** Anteprima sfocata da 24 px, incorporata: riempie la cella all'istante zero. */
  blur: string;
  quando: string;
  giorno: string;
  ora: string;
  dataIncerta?: boolean;
  iso?: number;
  focale?: number;
  apertura?: number;
  tempo?: string;
  /** Peso dell'originale in byte. */
  peso: number;
  nome: string;
}

export interface SessionePrivata {
  id: string;
  titolo: string;
  cartella: string;
  nota: string | null;
  foto: Scatto[];
}

export interface ManifestoPrivato {
  generato: string;
  totale: number;
  sessioni: SessionePrivata[];
}

/**
 * Lo stato dell'album:
 *
 *   chiuso   non siamo in locale — è quello che vede chiunque altro
 *   attesa   in locale, il manifesto sta arrivando
 *   aperto   le foto ci sono
 *   manca    in locale, ma `npm run scatti` non è ancora stato lanciato
 */
export type StatoAlbum =
  | { stato: "chiuso" }
  | { stato: "attesa" }
  | { stato: "aperto"; sessioni: Map<string, SessionePrivata>; totale: number }
  | { stato: "manca" };

export function useAlbumPrivato(): StatoAlbum {
  const [album, setAlbum] = useState<StatoAlbum>(() =>
    isLocalhost() ? { stato: "attesa" } : { stato: "chiuso" },
  );

  useEffect(() => {
    if (!isLocalhost()) return;
    let vivo = true;
    fetch("/scatti-privati/manifesto.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: ManifestoPrivato) => {
        if (!vivo) return;
        setAlbum({
          stato: "aperto",
          sessioni: new Map(m.sessioni.map((s) => [s.id, s])),
          totale: m.totale,
        });
      })
      .catch(() => {
        // In locale senza manifesto (o senza server di sviluppo) l'album non
        // c'è: si dice, invece di lasciare la pagina in attesa per sempre.
        if (vivo) setAlbum({ stato: "manca" });
      });
    return () => {
      vivo = false;
    };
  }, []);

  return album;
}

// ── Formattine ───────────────────────────────────────────────────────────────

/** "18 – 55 mm", oppure "35 mm" se non c'è escursione. */
export function arco(e: Estremi | null, unita: string, decimali = 0): string | null {
  if (!e) return null;
  const f = (n: number) => n.toFixed(decimali).replace(".", ",");
  return e.min === e.max ? `${f(e.min)} ${unita}` : `${f(e.min)} – ${f(e.max)} ${unita}`;
}

/** "6,4 MB" — il peso dell'originale, per dire quanto pesa la qualità piena. */
export function pesoUmano(byte: number): string {
  return byte >= 1024 * 1024
    ? `${(byte / 1024 / 1024).toFixed(1).replace(".", ",")} MB`
    : `${Math.round(byte / 1024)} kB`;
}
