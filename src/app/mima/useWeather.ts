import { useEffect, useState } from "react";
import { PLACES, TRIP_FIRST_DAY, TRIP_LAST_DAY } from "./mimaData";

// ─────────────────────────────────────────────────────────────────────────────
// Meteo dei cinque giorni del viaggio, da open-meteo (gratis, senza chiave,
// già ammesso dalla CSP in vercel.json). Stesso schema del widget di /festa
// (src/app/festa/Festa.tsx), ma qui serve il riepilogo giornaliero e non l'ora
// singola, e serve a DUE consumatori: il ticker in cima e il modulo meteo.
// Da qui la cache a livello di modulo: una sola chiamata per sessione, non una
// per componente montato.
//
// La finestra di previsione di open-meteo è ~16 giorni. Se il viaggio è ancora
// lontano l'API risponde senza dati: in quel caso non si inventa niente, si
// mostrano le medie stagionali dichiarate come tali (vedi AUGUST_NORMALS).
// ─────────────────────────────────────────────────────────────────────────────

export interface WxDay {
  date: string; // ISO "2026-08-13"
  code: number;
  tmax: number;
  tmin: number;
  rain: number; // probabilità massima, %
  wind: number; // km/h
  uv: number;
  sunrise: string; // "06:12"
  sunset: string;
}

export interface Wx {
  current: { temp: number; code: number } | null;
  days: WxDay[];
}

export type WxState = "loading" | "ok" | "empty" | "error";

/** STIMA: medie climatiche di agosto sulla riviera romagnola. Solo di scorta. */
export const AUGUST_NORMALS = { tmax: 29, tmin: 20, rainDays: 4, seaTemp: 26 };

function buildUrl() {
  const { lat, lon } = PLACES.cervia;
  const p = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset",
    current: "temperature_2m,weather_code",
    timezone: "Europe/Rome",
    start_date: TRIP_FIRST_DAY,
    end_date: TRIP_LAST_DAY,
  });
  return `https://api.open-meteo.com/v1/forecast?${p.toString()}`;
}

const hhmm = (iso: string) => (iso?.length >= 16 ? iso.slice(11, 16) : "—");

let cached: Promise<Wx> | null = null;

function fetchWeather(): Promise<Wx> {
  if (cached) return cached;
  cached = fetch(buildUrl())
    .then((r) => {
      if (!r.ok) throw new Error(`open-meteo ${r.status}`);
      return r.json();
    })
    .then((j): Wx => {
      const d = j?.daily ?? {};
      const times: string[] = d.time ?? [];
      const days: WxDay[] = times.map((t, i) => ({
        date: t,
        code: d.weather_code?.[i] ?? 0,
        tmax: d.temperature_2m_max?.[i] ?? 0,
        tmin: d.temperature_2m_min?.[i] ?? 0,
        rain: d.precipitation_probability_max?.[i] ?? 0,
        wind: d.wind_speed_10m_max?.[i] ?? 0,
        uv: d.uv_index_max?.[i] ?? 0,
        sunrise: hhmm(d.sunrise?.[i] ?? ""),
        sunset: hhmm(d.sunset?.[i] ?? ""),
      }));
      const c = j?.current;
      return {
        current: c?.temperature_2m != null ? { temp: c.temperature_2m, code: c.weather_code ?? 0 } : null,
        days,
      };
    })
    .catch((e) => {
      // La cache viene svuotata così un rimontaggio può ritentare.
      cached = null;
      throw e;
    });
  return cached;
}

export function useWeather(): { wx: Wx | null; state: WxState } {
  const [wx, setWx] = useState<Wx | null>(null);
  const [state, setState] = useState<WxState>("loading");

  useEffect(() => {
    let alive = true;
    fetchWeather()
      .then((w) => {
        if (!alive) return;
        setWx(w);
        setState(w.days.length ? "ok" : "empty");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => { alive = false; };
  }, []);

  return { wx, state };
}

/** Codici WMO → etichetta italiana + famiglia, per scegliere l'icona di casa. */
export function weatherInfo(code: number): { label: string; kind: "sun" | "cloud" | "rain" | "storm" } {
  if (code === 0) return { label: "sereno", kind: "sun" };
  if (code === 1) return { label: "poco nuvoloso", kind: "sun" };
  if (code === 2) return { label: "parzialmente nuvoloso", kind: "cloud" };
  if (code === 3) return { label: "coperto", kind: "cloud" };
  if (code === 45 || code === 48) return { label: "nebbia", kind: "cloud" };
  if (code >= 51 && code <= 57) return { label: "pioviggine", kind: "rain" };
  if (code >= 61 && code <= 67) return { label: "pioggia", kind: "rain" };
  if (code >= 71 && code <= 77) return { label: "neve", kind: "rain" };
  if (code >= 80 && code <= 82) return { label: "rovesci", kind: "rain" };
  if (code >= 85 && code <= 86) return { label: "rovesci di neve", kind: "rain" };
  if (code >= 95) return { label: "temporale", kind: "storm" };
  return { label: "—", kind: "cloud" };
}
