// ─────────────────────────────────────────────────────────────────────────────
// Sottodomini canonici — una pagina = un sottodominio.
//   sostieni.albertopecchini.it  SERVE la pagina Sostieni alla root "/".
//   www.albertopecchini.it       resta il "hub": home + àncore (#curriculum…).
//
// In PRODUZIONE (host *.albertopecchini.it) i link tra pagine sono cross-origin
// (<a>, con reload). In DEV/preview (localhost, *.vercel.app) restano <Link> di
// React Router, così tutto continua a funzionare come una SPA su una sola
// origine. <SiteLink> incapsula questa scelta ed è un drop-in di <Link>.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router";
import type { ReactNode } from "react";

const APEX = "albertopecchini.it";

// sottodominio → path interno servito alla root del sottodominio
export const SUB_TO_PATH: Record<string, string> = {
  bio: "/bio",
  trivia: "/trivia",
  pcto: "/pcto",
  "me-stesso": "/me-stesso",
  dubliners: "/dubliners",
  gattopardo: "/gattopardo",
  letteratura: "/letteratura",
  archivio: "/archivio",
  sostieni: "/sostieni",
  festa: "/festa",
};

// path interno → sottodominio (mappa inversa)
const PATH_TO_SUB: Record<string, string> = Object.fromEntries(
  Object.entries(SUB_TO_PATH).map(([sub, path]) => [path, sub]),
);

/** Sottodominio (label) per un path interno mappato, o null (asset/non mappato). */
export function subForPath(path: string): string | null {
  return PATH_TO_SUB[path] ?? null;
}

/** Siamo su un host di produzione albertopecchini.it (apex, www o sottodominio)? */
export function isProdHost(host: string = location.hostname): boolean {
  return host === APEX || host.endsWith(`.${APEX}`);
}

/**
 * Il path (rotta interna) da servire per un dato host:
 *   sostieni.albertopecchini.it → "/sostieni"
 *   www / apex / localhost / *.vercel.app → null (routing a path normale)
 */
export function pathForHost(host: string = location.hostname): string | null {
  if (!host.endsWith(`.${APEX}`)) return null; // apex esatto, localhost, vercel.app
  const label = host.slice(0, host.length - APEX.length - 1); // toglie ".albertopecchini.it"
  return SUB_TO_PATH[label] ?? null; // "www" → undefined → null
}

/**
 * URL canonico da usare per un link a una rotta interna:
 *   dev/preview          → il path invariato (SPA interna, <Link>)
 *   "/bio"               → https://bio.albertopecchini.it
 *   "/" o "/#ancora"     → https://www.albertopecchini.it[/#ancora]  (hub)
 *   non-path (mailto, …) → invariato
 */
export function urlForPath(to: string): string {
  if (!to.startsWith("/")) return to; // esterni, mailto, tel, ancore locali "#x"
  if (!isProdHost()) return to; // dev/preview: resta interno
  const hashIdx = to.indexOf("#");
  const path = hashIdx >= 0 ? to.slice(0, hashIdx) : to;
  const hash = hashIdx >= 0 ? to.slice(hashIdx) : "";
  const clean = path || "/";
  const sub = PATH_TO_SUB[clean];
  if (sub) return `https://${sub}.${APEX}${hash}`;
  // "/" o path non mappato → hub www (con lo slash prima dell'eventuale #)
  return `https://www.${APEX}${clean === "/" ? "/" : clean}${hash}`;
}

/**
 * Drop-in di <Link>: stessa firma (`to`, children, className, onClick, …).
 * In produzione diventa un <a> cross-origin verso il sottodominio giusto;
 * in dev/preview resta un <Link> di React Router (navigazione istantanea).
 */
export function SiteLink({
  to,
  children,
  ...rest
}: { to: string; children?: ReactNode; [key: string]: unknown }) {
  if (!isProdHost()) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={urlForPath(to)} {...rest}>
      {children}
    </a>
  );
}
