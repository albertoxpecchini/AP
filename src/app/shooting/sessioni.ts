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

/** Un'impronta sfocata da 24 px: la sagoma di uno scatto, non lo scatto. */
export interface Anteprima {
  blur: string;
  w: number;
  h: number;
}

export interface SessionePubblica {
  /** Progressivo — "s1", "s2". È il nome della cartella a NON essere pubblico. */
  id: string;
  /** Come si chiama la sessione. */
  titolo: string;
  /** Sei impronte sfocate distribuite lungo la sessione: si vede il ritmo, non le facce. */
  anteprime: Anteprima[];
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
  /** Ci sono nel manifesto locale; l'album firmato di un ospite non li porta. */
  quando?: string;
  giorno?: string;
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

/**
 * Due casi in cui il manifesto locale va IGNORATO anche stando in locale:
 *
 *  · `?accesso=…` — sto aprendo il link di un ospite. Deve vedersi quello che
 *    vede lui, non la mia copia: altrimenti il link non lo si può controllare.
 *  · `?pubblico` — voglio guardare la pagina com'è da fuori, lucchetti e
 *    modulo compresi, senza spegnere il server o cercare un altro computer.
 */
function scavalcato(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  return q.has("accesso") || q.has("pubblico");
}

export function useAlbumPrivato(): StatoAlbum {
  const [album, setAlbum] = useState<StatoAlbum>(() =>
    isLocalhost() && !scavalcato() ? { stato: "attesa" } : { stato: "chiuso" },
  );

  useEffect(() => {
    if (!isLocalhost() || scavalcato()) return;
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

// ── L'ospite autorizzato ─────────────────────────────────────────────────────
//
// L'altra metà del meccanismo: chi ha chiesto di vedere una sessione, e ha
// ricevuto il link. Il token sta nell'indirizzo (`/shooting?accesso=…`), vale
// 24 ore, e da solo non basta — è il server a decidere, guardando la tabella,
// e a firmare uno per uno gli indirizzi delle immagini. Qui non c'è nessun
// controllo da aggirare: senza una risposta del server non esiste nemmeno un
// URL da chiedere.

export interface AlbumOspite {
  titolo: string;
  /** Il nome di chi ha chiesto: serve a dire «questo link è tuo». */
  nome: string;
  sessione: string;
  /** Quando muore l'accesso, ISO. */
  scade: string;
  /** Quanto vale la firma delle immagini, in secondi. */
  firmaSecondi: number;
  foto: Scatto[];
}

export type StatoOspite =
  | { stato: "niente" }
  | { stato: "attesa" }
  | { stato: "aperto"; album: AlbumOspite }
  | { stato: "scaduto" }
  | { stato: "chiuso" };

/** Il token dall'indirizzo, se c'è. */
function tokenDallUrl(): string | null {
  if (typeof window === "undefined") return null;
  const t = new URLSearchParams(window.location.search).get("accesso");
  return t && t.length > 20 ? t : null;
}

export function useAccessoOspite(): StatoOspite {
  const [stato, setStato] = useState<StatoOspite>(() =>
    tokenDallUrl() ? { stato: "attesa" } : { stato: "niente" },
  );

  useEffect(() => {
    const t = tokenDallUrl();
    if (!t) return;
    let vivo = true;

    const chiedi = () =>
      fetch(`/api/scatti-accesso?album=${encodeURIComponent(t)}`, { cache: "no-store" })
        .then(async (r) => {
          const dati = await r.json().catch(() => ({}));
          if (!vivo) return;
          if (r.ok && dati?.ok) {
            setStato({ stato: "aperto", album: dati as AlbumOspite });
            return;
          }
          setStato({ stato: dati?.errore === "scaduto" ? "scaduto" : "chiuso" });
        })
        .catch(() => {
          if (vivo) setStato({ stato: "chiuso" });
        });

    void chiedi();

    // Gli indirizzi delle immagini sono firmati e scadono. Chi lascia la pagina
    // aperta un pomeriggio si ritroverebbe una griglia di riquadri vuoti: il
    // manifesto si richiede da solo poco prima, e le firme tornano fresche.
    const ogni = 50 * 60_000;
    const timer = window.setInterval(() => void chiedi(), ogni);
    return () => {
      vivo = false;
      window.clearInterval(timer);
    };
  }, []);

  return stato;
}

/** Le sessioni per cui ha senso chiedere: quelle davvero caricate nel bucket. */
export function useSessioniAperte(): Set<string> | null {
  const [aperte, setAperte] = useState<Set<string> | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch("/api/scatti-accesso?disponibili=1")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (vivo) setAperte(new Set<string>(Array.isArray(d?.sessioni) ? d.sessioni : []));
      })
      // Se l'endpoint non c'è (o non risponde) non si promette niente a nessuno:
      // insieme vuoto, e il modulo non compare.
      .catch(() => { if (vivo) setAperte(new Set<string>()); });
    return () => { vivo = false; };
  }, []);
  return aperte;
}

/** Quanto manca, detto come lo direbbe una persona: «22 ore», «40 minuti». */
export function quantoManca(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "scaduto";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} minut${min === 1 ? "o" : "i"}`;
  const ore = Math.round(min / 60);
  return `${ore} or${ore === 1 ? "a" : "e"}`;
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
