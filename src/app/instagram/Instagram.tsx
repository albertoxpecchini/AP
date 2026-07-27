import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { SiteLink as Link } from "../site/nav";
import { SiInstagram } from "react-icons/si";
import {
  IcArrowLeft, IcArrowRight, IcHelp, IcFile, IcUpload, IcPaste, IcRotate,
  IcAlert, IcCopy, IcCheck, IcDownload, IcClock, IcChevronDown, IcSortAz,
  IcUserPlus, IcUserX, IcUserMinus, IcHeart, IcSparkle,
  IcShield, IcLock, IcWifiOff,
} from "../site/homeIcons";
import SiteFooter from "../site/SiteFooter";
import Tutorial from "./Tutorial";
import { fetchCount, bumpCount, subscribeCount } from "./statsApi";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import { getPref, setPref } from "../utils/prefs";
import "../home.css";
import "./instagram.css";

const TUTORIAL_PREF = "ap-ig-tutorial"; // "seen" quando l'utente lo chiude

// ─────────────────────────────────────────────────────────────────────────────
// «Instagram» — "Chi ti ha tolto il follow".
//
// Carichi (o incolli) i due file esportati da Instagram — following.html (i tuoi
// seguiti) e followers.html (i tuoi follower) — e la pagina calcola all'istante:
//   · chi ti segue ma tu non segui;
//   · chi TU segui ma non ti ricambia  ← la lista che serve davvero;
//   · chi seguite entrambi (reciproci).
// Con avatar (monogramma), data del follow (se presente nell'export) e ordine
// per nome o cronologico. Tutto lato client: nessun dato lascia il dispositivo.
//
// Veste "piattaforma Supabase" della home (.sb-): nav sottile 64px, hero a due
// colonne col contatore live come pillola d'annuncio, due card-prodotto per le
// liste, fisarmonica per l'export vecchio, banner + chip d'ordinamento + tre
// pannelli-lista, chiusura sulla privacy a due colonne. Tema chiaro/scuro
// nativo via token --sb-* (home.css); stili propri in instagram.css.
// I testi sono in italiano e il motore i18n del sito li traduce.
// ─────────────────────────────────────────────────────────────────────────────

// Marchio dello strumento — finisce nell'intestazione dei report scaricati.
const APP_NAME = "Compare Two Lists";
const APP_AUTHOR = "Alberto Pecchini";
const APP_URL = "https://albertopecchini.it/instagram";

const DATE_LOCALE: Record<Lang, string> = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE" };

// ── Modello dati ─────────────────────────────────────────────────────────────
// Ogni relazione = username + data del follow (ms) se disponibile.
type Rel = { user: string; ts: number | null };

const IG_USER = /^[A-Za-z0-9._]{1,30}$/; // caratteri ammessi in uno username IG
// Prime "parole" di un percorso instagram.com che NON sono profili: pagine
// riservate + prefissi di redirect (/_u/username, /_n/username apre l'app).
const REDIRECT_SEG = new Set(["_u", "_n", "_e", "web", "accounts"]);
const RESERVED = new Set([
  "p", "reel", "reels", "stories", "story", "explore", "accounts", "tv", "directory",
  "about", "privacy", "terms", "legal", "developer", "web", "_u", "_n", "_e",
]);
// Nomi che NON esistono come profilo: pulsanti/etichette d'interfaccia e token di
// data che finiscono nel testo copiato dalla pagina renderizzata. Applicati a
// TUTTI i percorsi (JSON, HTML, testo), così file e copia-incolla coincidono e
// spariscono i falsi "@follow", "@follower", "@following"…
const BOGUS = new Set([
  "follow", "follower", "followers", "following", "followed", "follows", "followback",
  "segui", "segue", "seguiti", "seguaci", "followsyou", "unfollow",
  "remove", "rimuovi", "message", "messaggio", "verified", "verificato",
  "suggested", "suggeriti", "requested", "richiesto",
]);
const DATE_TOKEN = /^\d+\s*(s|m|h|d|w|y|mo|min|sec|ore|ora|giorni?|settiman\w*|mes\w*|ann\w*|week|day|hour|month|year)s?$/i;

// Estrae lo username reale da un href, saltando i prefissi di redirect (/_u/).
function userFromHref(href: string): string {
  try {
    const parts = new URL(href, "https://www.instagram.com").pathname.split("/").filter(Boolean);
    let seg = parts[0] || "";
    if (REDIRECT_SEG.has(seg) && parts[1]) seg = parts[1]; // /_u/username → username
    return seg;
  } catch {
    return "";
  }
}

// Validatore unico dello username: forma corretta e non è una pagina riservata
// né un nome "spazzatura" (follow/follower/…). Usato ovunque.
function validUser(u: string): boolean {
  if (!u) return false;
  const low = u.toLowerCase();
  return IG_USER.test(u) && !RESERVED.has(low) && !BOGUS.has(low);
}

// Estrae una data (ms) da un testo, provando i formati usati negli export IG.
function extractDate(text: string): number | null {
  if (!text) return null;
  const unix = text.match(/\b(1\d{9})\b/); // secondi unix (export JSON/alcuni HTML)
  if (unix) return parseInt(unix[1], 10) * 1000;
  const iso = text.match(/\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/);
  if (iso) { const d = Date.parse(iso[0]); if (!Number.isNaN(d)) return d; }
  const named = text.match(/[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}/); // "Sep 12, 2023"
  if (named) { const d = Date.parse(named[0]); if (!Number.isNaN(d)) return d; }
  return null;
}

// Cerca la data del follow vicino a un link (negli HTML la data sta in un
// elemento fratello/antenato dell'ancora).
function dateNearAnchor(a: HTMLAnchorElement): number | null {
  let el: HTMLElement | null = a.parentElement;
  const uname = (a.textContent || "").trim();
  for (let depth = 0; el && depth < 5; depth++, el = el.parentElement) {
    const cleaned = (el.textContent || "").replace(uname, " ");
    const d = extractDate(cleaned);
    if (d) return d;
  }
  return null;
}

// ── Parsing unificato: JSON export, HTML export/sorgente, oppure testo ────────
// Qualsiasi input passa da qui, così CARICARE il file e INCOLLARE danno lo
// stesso risultato (era il bug: il testo renderizzato prendeva date/parole come
// username; ora vengono filtrate come farebbe un umano che copia solo i nomi).
function parseAny(raw: string): Rel[] {
  const s = raw.trim();
  if (!s) return [];

  // 1) JSON esportato da Instagram (il più affidabile: ha i timestamp).
  if (s[0] === "{" || s[0] === "[") {
    try {
      const data = JSON.parse(s);
      const out: Rel[] = [];
      const eat = (arr: any[]) =>
        arr?.forEach((item) => {
          const sld = item?.string_list_data || (item?.href || item?.value ? [item] : []);
          sld.forEach((e: any) => {
            const user = (userFromHref(e?.href || "") || String(e?.value || "")).replace(/^@/, "");
            if (validUser(user)) out.push({ user, ts: e?.timestamp ? Number(e.timestamp) * 1000 : null });
          });
        });
      if (Array.isArray(data)) eat(data);
      else Object.values(data).forEach((v) => Array.isArray(v) && eat(v as any[]));
      if (out.length) return out;
    } catch { /* non era JSON valido → provo come HTML/testo */ }
  }

  // 2) HTML (file caricato o sorgente incollato): leggo i link ai profili.
  if (/<a\b/i.test(s)) {
    const out: Rel[] = [];
    const doc = new DOMParser().parseFromString(s, "text/html");
    doc.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      let user = /instagram\.com/i.test(href) ? userFromHref(href) : "";
      if (!user) {
        const txt = (a.textContent || "").trim().replace(/^@/, "");
        if (IG_USER.test(txt)) user = txt;
      }
      if (validUser(user)) out.push({ user, ts: dateNearAnchor(a) });
    });
    if (out.length) return out;
  }

  // 3) Testo semplice (nomi incollati o pagina renderizzata copiata).
  const out: Rel[] = [];
  s.split(/\r?\n/).forEach((line) => {
    let t = line.trim();
    if (!t || /profile picture/i.test(t) || /^\d+$/.test(t) || DATE_TOKEN.test(t)) return;
    if (/instagram\.com/i.test(t)) t = userFromHref(t) || t;
    t = t.replace(/^@/, "");
    if (validUser(t)) out.push({ user: t, ts: null });
  });
  return out;
}

// De-duplica per username (case-insensitive), tenendo la data se c'è.
function dedupe(rels: Rel[]): Map<string, Rel> {
  const m = new Map<string, Rel>();
  for (const r of rels) {
    const k = r.user.toLowerCase();
    const prev = m.get(k);
    if (!prev) m.set(k, r);
    else if (prev.ts == null && r.ts != null) m.set(k, r);
  }
  return m;
}

// ── Avatar a monogramma (offline, privacy-safe, famiglia verde del sito) ─────
const AV_COLORS = [
  "hsl(153, 45%, 34%)", "hsl(163, 42%, 32%)", "hsl(143, 40%, 33%)", "hsl(173, 40%, 31%)",
  "hsl(133, 36%, 34%)", "hsl(186, 38%, 30%)", "hsl(120, 32%, 33%)", "hsl(196, 36%, 32%)",
];
function avatarColor(u: string): string {
  let h = 0;
  for (let i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

// Avatar a monogramma: iniziale su cerchio nella palette del sito. Offline,
// istantaneo, privacy-safe. (Le foto profilo vere non sono ottenibili in modo
// affidabile: Instagram blocca via fingerprint TLS sia i servizi terzi sia un
// proxy Node.)
function Avatar({ user }: { user: string }) {
  return (
    <span className="sb-ig-avatar" style={{ background: avatarColor(user) }} aria-hidden="true">
      {user[0]?.toUpperCase()}
    </span>
  );
}

const byName = (a: Rel, b: Rel) => a.user.localeCompare(b.user);
const byRecent = (a: Rel, b: Rel) => (b.ts ?? -Infinity) - (a.ts ?? -Infinity);

// Slug per il nome file: "Io seguo ma non mi segue" → "io-seguo-ma-non-mi-segue".
function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

// Statistiche complete del confronto, per il riepilogo del report.
type ReportStats = {
  following: number; followers: number; mutual: number;
  iFollow: number; theyFollow: number;
  unfollowed: number; newFollowers: number; hasOld: boolean;
};

// Etichette del report nelle 4 lingue del sito.
const REPORT_L: Record<Lang, Record<string, string>> = {
  it: { profiles: "profili", generated: "Generato il", at: "alle", summary: "Riepilogo del confronto",
    following: "Seguiti", followers: "Follower", mutual: "Reciproci", notBack: "Non ti ricambiano",
    youDont: "Non li segui", rate: "Tasso di ricambio", ratio: "Follower / Seguiti",
    unfollowed: "Ti hanno tolto il follow", newFollowers: "Nuovi follower", thisList: "Questa lista",
    madeWith: "Confronto eseguito con", empty: "Nessuno qui" },
  en: { profiles: "profiles", generated: "Generated on", at: "at", summary: "Comparison summary",
    following: "Following", followers: "Followers", mutual: "Mutual", notBack: "Don't follow back",
    youDont: "You don't follow", rate: "Follow-back rate", ratio: "Followers / Following",
    unfollowed: "Unfollowed you", newFollowers: "New followers", thisList: "This list",
    madeWith: "Comparison made with", empty: "No one here" },
  fr: { profiles: "profils", generated: "Généré le", at: "à", summary: "Résumé de la comparaison",
    following: "Abonnements", followers: "Abonnés", mutual: "Mutuels", notBack: "Ne te suivent pas",
    youDont: "Tu ne les suis pas", rate: "Taux de réciprocité", ratio: "Abonnés / Abonnements",
    unfollowed: "T'ont unfollow", newFollowers: "Nouveaux abonnés", thisList: "Cette liste",
    madeWith: "Comparaison réalisée avec", empty: "Personne ici" },
  de: { profiles: "Profile", generated: "Erstellt am", at: "um", summary: "Vergleichsübersicht",
    following: "Gefolgt", followers: "Follower", mutual: "Gegenseitig", notBack: "Folgen nicht zurück",
    youDont: "Du folgst nicht", rate: "Rückfolge-Quote", ratio: "Follower / Gefolgt",
    unfollowed: "Sind dir entfolgt", newFollowers: "Neue Follower", thisList: "Diese Liste",
    madeWith: "Vergleich erstellt mit", empty: "Niemand hier" },
};

// Report HTML autonomo, nello STILE del sito (Ubuntu, palette neutra + verde
// brand, pannelli a bordo sottile), con riepilogo dettagliato. Apribile
// offline, con link cliccabili ai profili, chiaro e scuro come il sito.
function buildReportHtml(title: string, items: Rel[], lang: Lang, st: ReportStats): string {
  const L = REPORT_L[lang];
  const locale = DATE_LOCALE[lang];
  const now = new Date();
  const date = now.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const fmt = (ts: number) => new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 + "%" : "—");
  const ratio = st.following > 0 ? (st.followers / st.following).toFixed(2) : "—";

  const tile = (label: string, value: string | number, strong = false) =>
    `<div class="tile${strong ? " strong" : ""}"><span class="tv">${value}</span><span class="tl">${esc(label)}</span></div>`;

  const tiles = [
    tile(L.following, st.following),
    tile(L.followers, st.followers),
    tile(L.mutual, st.mutual),
    tile(L.notBack, st.iFollow, true),
    tile(L.youDont, st.theyFollow),
    tile(L.rate, pct(st.mutual, st.following)),
    tile(L.ratio, ratio),
    ...(st.hasOld ? [tile(L.unfollowed, st.unfollowed, true), tile(L.newFollowers, st.newFollowers)] : []),
  ].join("\n      ");

  const rows = items.length
    ? items.map((r) =>
        `<a class="row" href="https://instagram.com/${encodeURIComponent(r.user)}" target="_blank" rel="noopener noreferrer">`
        + `<span class="av" style="background:${avatarColor(r.user)}">${esc((r.user[0] || "?").toUpperCase())}</span>`
        + `<span class="u">@${esc(r.user)}</span>`
        + (r.ts != null ? `<span class="d">${esc(fmt(r.ts))}</span>` : "")
        + `</a>`).join("\n")
    : `<p class="empty">${esc(L.empty)}</p>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(APP_NAME)} — ${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:#fcfcfc; --bg-alt:#f8f8f8; --card:#fbfbfb; --soft:#f6f6f6;
    --bd:#e8e8e8; --bd2:#dbdbdb; --bd3:#c7c7c7;
    --ink:#171717; --sub:#6f6f6f; --muted:#8f8f8f;
    --brand:hsl(153,60%,53%); --brand-text:hsl(153,86%,28%);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#141414; --bg-alt:#181818; --card:#1c1c1c; --soft:#222;
      --bd:#2a2a2a; --bd2:#343434; --bd3:#414141;
      --ink:#ededed; --sub:#969696; --muted:#707070;
      --brand-text:hsl(155,100%,42%);
    }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Ubuntu",system-ui,-apple-system,sans-serif; font-size:16px; line-height:1.5; padding:clamp(16px,4vw,40px); -webkit-font-smoothing:antialiased; }
  .wrap { max-width:760px; margin:0 auto; }
  .panel { border:1px solid var(--bd); border-radius:12px; background:var(--card); padding:1.4rem 1.5rem; }
  .head { margin-bottom:1rem; }
  .brand { display:inline-flex; align-items:center; gap:.4rem; font-size:.72rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin:0 0 .8rem; }
  .brand i { width:7px; height:7px; border-radius:50%; background:var(--brand); display:inline-block; }
  .head h1 { margin:0 0 .9rem; font-size:clamp(1.4rem,4vw,2rem); font-weight:500; letter-spacing:-.02em; line-height:1.15; }
  .meta { display:flex; flex-wrap:wrap; gap:.35rem 1.4rem; font-size:.85rem; color:var(--sub); }
  .meta b { font-weight:500; color:var(--ink); }
  .summary { margin-top:1rem; }
  .summary h2 { margin:0 0 1rem; font-size:.72rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:500; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(126px,1fr)); gap:.7rem; }
  .tile { background:var(--bg-alt); border:1px solid var(--bd); border-radius:8px; padding:.7rem .85rem; display:flex; flex-direction:column; gap:.2rem; }
  .tile.strong { border-color:var(--bd3); background:var(--soft); }
  .tv { font-size:1.4rem; font-weight:500; color:var(--brand-text); font-variant-numeric:tabular-nums; }
  .tl { font-size:.78rem; color:var(--sub); }
  .list { margin-top:1rem; padding:.55rem; }
  .list h2 { margin:.4rem .6rem .7rem; font-size:.92rem; font-weight:500; color:var(--ink); }
  .row { display:flex; align-items:center; gap:.6rem; padding:.4rem .5rem; border-radius:6px; text-decoration:none; color:var(--sub); }
  .row:hover { background:var(--bg-alt); }
  .av { flex:0 0 auto; width:30px; height:30px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-weight:500; font-size:.82rem; }
  .u { flex:1 1 auto; color:var(--ink); font-size:.9rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .row:hover .u { color:var(--brand-text); }
  .d { flex:0 0 auto; font-size:.76rem; color:var(--muted); font-variant-numeric:tabular-nums; }
  .empty { color:var(--muted); padding:1rem; text-align:center; font-size:.9rem; }
  .foot { color:var(--muted); font-size:.78rem; text-align:center; margin-top:1.4rem; line-height:1.7; }
  .foot b { font-weight:500; color:var(--sub); }
  .foot a { color:var(--brand-text); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="panel head">
      <p class="brand"><i></i>${esc(APP_NAME)}</p>
      <h1>${esc(title)}</h1>
      <div class="meta">
        <span><b>${items.length}</b> ${esc(L.profiles)}</span>
        <span>${esc(L.generated)} ${esc(date)} ${esc(L.at)} ${esc(time)}</span>
      </div>
    </div>
    <div class="panel summary">
      <h2>${esc(L.summary)}</h2>
      <div class="tiles">
      ${tiles}
      </div>
    </div>
    <div class="panel list">
      <h2>${esc(L.thisList)}: ${esc(title)} (${items.length})</h2>
      ${rows}
    </div>
    <p class="foot">
      ${esc(L.madeWith)} <b>${esc(APP_NAME)}</b> — © ${now.getFullYear()} ${esc(APP_AUTHOR)}<br>
      <a href="${APP_URL}" target="_blank" rel="noopener">${esc(APP_URL.replace(/^https?:\/\//, ""))}</a>
    </p>
  </div>
</body>
</html>`;
}

type ResultKey = "theyFollow" | "iFollow" | "mutual" | "unfollowed" | "newFollowers";
type SortMode = "az" | "recent";

// ── Pannello di risultato (componente stabile: non si rimonta a ogni copia) ──
function ResultCard({
  title, icon, items, primary, copied, sort, locale, onCopy, onDownload,
}: {
  title: string;
  icon: React.ReactNode;
  items: Rel[];
  primary?: boolean;
  copied: boolean;
  sort: SortMode;
  locale: string;
  onCopy: (items: Rel[]) => void;
  onDownload: (title: string, items: Rel[]) => void;
}) {
  const sorted = useMemo(
    () => [...items].sort(sort === "recent" ? byRecent : byName),
    [items, sort],
  );
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={"sb-ig-card" + (primary ? " sb-ig-card--primary" : "")}>
      <div className="sb-panel">
        <div className="sb-panel-inner sb-ig-res-inner">
          <div className="sb-ig-res-head">
            {icon}
            <h3>{title}</h3>
            <span className="sb-ig-res-count" translate="no">{items.length}</span>
          </div>

          <div className="sb-ig-res-actions">
            <button
              type="button"
              className="sb-btn sb-btn--sm sb-btn--secondary"
              onClick={() => onCopy(sorted)}
              disabled={!items.length}
            >
              {copied ? <IcCheck size={14} /> : <IcCopy size={14} />}
              <span>{copied ? "Copiato" : "Copia"}</span>
            </button>
            <button
              type="button"
              className="sb-btn sb-btn--sm sb-btn--secondary"
              onClick={() => onDownload(title, sorted)}
              disabled={!items.length}
            >
              <IcDownload size={14} />
              <span>Scarica</span>
            </button>
          </div>

          {sorted.length ? (
            <ul className="sb-ig-list">
              {sorted.map((r) => (
                <li key={r.user}>
                  <a
                    href={`https://instagram.com/${encodeURIComponent(r.user)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sb-ig-row"
                  >
                    <Avatar user={r.user} />
                    <span className="sb-ig-uname" translate="no">@{r.user}</span>
                    {r.ts != null && <span className="sb-ig-date" translate="no">{fmt(r.ts)}</span>}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sb-ig-empty">Nessuno qui</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Instagram() {
  const [following, setFollowing] = useState("");   // i miei seguiti
  const [followers, setFollowers] = useState("");   // i miei follower
  const [oldFollowers, setOldFollowers] = useState(""); // follower di un export VECCHIO
  const [nameFollowing, setNameFollowing] = useState("");
  const [nameFollowers, setNameFollowers] = useState("");
  const [nameOld, setNameOld] = useState("");
  const [showOld, setShowOld] = useState(false);    // sezione "export vecchio" aperta
  const [ran, setRan] = useState(false);
  const [sort, setSort] = useState<SortMode>("az");
  const [copied, setCopied] = useState<ResultKey | null>(null);
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [showTutorial, setShowTutorial] = useState(false);
  const [analyses, setAnalyses] = useState<number | null>(null); // contatore globale live
  const [pasteErr, setPasteErr] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const fileFollowing = useRef<HTMLInputElement>(null);
  const fileFollowers = useRef<HTMLInputElement>(null);
  const fileOld = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeLang(setLang), []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const prev = document.title;
    document.title = "Compare Two Lists · Chi ti ha tolto il follow?";
    // Al primo accesso mostra il tutorial (poi ricordato via cookie/localStorage).
    if (getPref(TUTORIAL_PREF) !== "seen") setShowTutorial(true);
    return () => { document.title = prev; };
  }, []);

  // Nav "solida" dopo 60px di scroll (come la home).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
    setPref(TUTORIAL_PREF, "seen");
  }, []);

  // Contatore globale dei confronti: totale iniziale + aggiornamenti live.
  useEffect(() => {
    let alive = true;
    fetchCount().then((n) => { if (alive && n != null) setAnalyses(n); });
    const unsub = subscribeCount((n) => setAnalyses(n));
    return () => { alive = false; unsub(); };
  }, []);

  // Incolla dagli appunti nella textarea indicata.
  const pasteInto = useCallback(async (setText: (v: string) => void, setName: (v: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setText(text); setName(""); setPasteErr(false); }
    } catch {
      setPasteErr(true);
      window.setTimeout(() => setPasteErr(false), 2500);
    }
  }, []);

  const readFile = useCallback(
    (file: File | undefined, setText: (v: string) => void, setName: (v: string) => void) => {
      if (!file) return;
      setName(file.name);
      const r = new FileReader();
      r.onload = (e) => setText(String(e.target?.result ?? ""));
      r.readAsText(file);
    },
    [],
  );

  // Calcolo memoizzato: veloce (Map + filtri O(n)), ricalcola solo se cambiano gli input.
  const result = useMemo(() => {
    const A = dedupe(parseAny(following)); // seguiti
    const B = dedupe(parseAny(followers)); // follower (attuali)
    const O = dedupe(parseAny(oldFollowers)); // follower di un export vecchio
    const theyFollow: Rel[] = [];          // ti seguono ma tu no  (B \ A)
    const iFollow: Rel[] = [];             // tu segui ma non ti seguono (A \ B) ← la lista chiave
    const mutual: Rel[] = [];              // reciproci (A ∩ B)
    for (const [k, r] of A) (B.has(k) ? mutual : iFollow).push(r);
    for (const [k, r] of B) if (!A.has(k)) theyFollow.push(r);
    // Confronto nel tempo: chi c'era nei follower vecchi e ora non c'è = unfollow.
    const unfollowed: Rel[] = [];          // ti hanno tolto il follow (O \ B)
    const newFollowers: Rel[] = [];        // nuovi follower (B \ O)
    if (O.size) {
      for (const [k, r] of O) if (!B.has(k)) unfollowed.push(r);
      for (const [k, r] of B) if (!O.has(k)) newFollowers.push(r);
    }
    const hasDates = [...A.values(), ...B.values(), ...O.values()].some((r) => r.ts != null);
    return { theyFollow, iFollow, mutual, unfollowed, newFollowers, hasOld: O.size > 0, hasDates };
  }, [following, followers, oldFollowers]);

  const canCompare = following.trim().length > 0 && followers.trim().length > 0;
  const locale = DATE_LOCALE[lang];

  const compare = () => {
    if (!canCompare) return;
    setRan(true);
    // Conta il confronto (ottimistico + valore autoritativo dal server).
    setAnalyses((a) => (a == null ? a : a + 1));
    bumpCount().then((n) => { if (n != null) setAnalyses(n); });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })),
    );
  };

  const reset = () => {
    setFollowing(""); setFollowers(""); setOldFollowers("");
    setNameFollowing(""); setNameFollowers(""); setNameOld("");
    setRan(false); setSort("az"); setCopied(null);
    if (fileFollowing.current) fileFollowing.current.value = "";
    if (fileFollowers.current) fileFollowers.current.value = "";
    if (fileOld.current) fileOld.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyList = async (key: ResultKey, items: Rel[]) => {
    const text = items.map((r) => "@" + r.user).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
  };

  // Report HTML in stile sito. Nome file con marchio + lista + DATA:
  //   compare-two-lists_io-seguo-ma-non-mi-segue_2026-07-18.html
  const downloadList = (title: string, items: Rel[]) => {
    const isoDate = new Date().toISOString().slice(0, 10); // AAAA-MM-GG
    const fileName = `compare-two-lists_${slug(title)}_${isoDate}.html`;
    const stats: ReportStats = {
      following: result.iFollow.length + result.mutual.length,
      followers: result.theyFollow.length + result.mutual.length,
      mutual: result.mutual.length,
      iFollow: result.iFollow.length,
      theyFollow: result.theyFollow.length,
      unfollowed: result.unfollowed.length,
      newFollowers: result.newFollowers.length,
      hasOld: result.hasOld,
    };
    const html = buildReportHtml(title, items, lang, stats);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sb-home ig-page">
      {showTutorial && <Tutorial onClose={closeTutorial} />}

      {/* Skiplink — requisito di accessibilità (come la home) */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: brand del sito + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-ig-tagline">Designer &amp; Front-end Developer</span>
          </Link>
          <div className="sb-nav-right">
            <button
              type="button"
              className="sb-btn sb-btn--sm sb-btn--ghost"
              onClick={() => setShowTutorial(true)}
              aria-haspopup="dialog"
            >
              <IcHelp size={15} />
              <span>Come scarico i file da Instagram?</span>
            </button>
            <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-btn--keep">
              <IcArrowLeft size={15} />
              <span>Torna alla home</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero — titolo a sinistra, contatore + spiegazione a destra */}
        <section className="sb-ig-hero">
          <div className="sb-container">
            <span className="sb-ig-eyebrow" data-no-i18n translate="no">
              <SiInstagram size={14} aria-hidden="true" /> {APP_NAME}
            </span>
            <div className="sb-hero-grid">
              <div>
                <h1 className="sb-hero-title">Chi ti ha tolto il follow?</h1>
                <p className="sb-ig-hero-lead">Scopri in 10 secondi chi segui che non ti ricambia.</p>
              </div>
              <div className="sb-hero-copy sb-ig-hero-copy">
                {analyses != null && (
                  <p className="sb-ig-stat" role="status" aria-live="polite">
                    <span className="sb-ig-dot" aria-hidden="true" />
                    <span className="sb-ig-stat-num" translate="no">{analyses.toLocaleString(locale)}</span>
                    <span>confronti effettuati con questo strumento</span>
                  </p>
                )}
                <p>
                  Carica i due file following.html e followers.html che scarichi da Instagram
                  (vanno bene anche i .json), oppure incolla le liste. Resta tutto nel tuo browser:
                  nessun login, nessun dato inviato.
                </p>
                <button type="button" className="sb-link" onClick={() => setShowTutorial(true)} aria-haspopup="dialog">
                  <IcHelp size={15} />
                  <span>Come scarico i file da Instagram?</span>
                  <IcArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ② Strumento — a sinistra i seguiti, a destra i follower */}
        <section className="sb-container sb-ig-tool">
          <div className="sb-ig-inputs">
            <div className="sb-panel">
              <div className="sb-panel-inner sb-ig-card-inner">
                <div className="sb-ig-cardhead">
                  <IcFile size={18} />
                  <h2>I miei seguiti</h2>
                  <span className="sb-ig-file" translate="no">{nameFollowing}</span>
                </div>
                <p className="sb-ig-hint">Il file following.html — chi segui tu</p>
                <div className="sb-ig-btnrow">
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={() => fileFollowing.current?.click()}>
                    <IcUpload size={15} /><span>Scegli file</span>
                  </button>
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--ghost" onClick={() => pasteInto(setFollowing, setNameFollowing)}>
                    <IcPaste size={15} /><span>Incolla</span>
                  </button>
                </div>
                <input ref={fileFollowing} type="file" accept=".html,.htm,.txt,.json" hidden
                  onChange={(e) => readFile(e.target.files?.[0], setFollowing, setNameFollowing)} />
                <textarea className="sb-ig-textarea" value={following} spellCheck={false}
                  onChange={(e) => { setFollowing(e.target.value); setNameFollowing(""); }}
                  placeholder="…oppure incolla qui la lista" />
              </div>
            </div>

            <div className="sb-panel">
              <div className="sb-panel-inner sb-ig-card-inner">
                <div className="sb-ig-cardhead">
                  <IcFile size={18} />
                  <h2>I miei follower</h2>
                  <span className="sb-ig-file" translate="no">{nameFollowers}</span>
                </div>
                <p className="sb-ig-hint">Il file followers.html — chi ti segue</p>
                <div className="sb-ig-btnrow">
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={() => fileFollowers.current?.click()}>
                    <IcUpload size={15} /><span>Scegli file</span>
                  </button>
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--ghost" onClick={() => pasteInto(setFollowers, setNameFollowers)}>
                    <IcPaste size={15} /><span>Incolla</span>
                  </button>
                </div>
                <input ref={fileFollowers} type="file" accept=".html,.htm,.txt,.json" hidden
                  onChange={(e) => readFile(e.target.files?.[0], setFollowers, setNameFollowers)} />
                <textarea className="sb-ig-textarea" value={followers} spellCheck={false}
                  onChange={(e) => { setFollowers(e.target.value); setNameFollowers(""); }}
                  placeholder="…oppure incolla qui la lista" />
              </div>
            </div>
          </div>

          {/* Confronto nel tempo: chi ti ha tolto il follow rispetto a un export vecchio */}
          <div className="sb-ig-old">
            <div className="sb-panel sb-panel--hover">
              <div className="sb-panel-inner">
                <button type="button" className="sb-ig-disc" onClick={() => setShowOld((v) => !v)} aria-expanded={showOld}>
                  <IcClock size={16} />
                  <span className="lbl">Chi mi ha tolto il follow di recente? Confronta con un export vecchio</span>
                  <IcChevronDown size={16} className="sb-ig-caret" />
                </button>
                {showOld && (
                  <div className="sb-ig-disc-body">
                    <p className="sb-ig-hint">
                      Metti qui i follower di un export più vecchio (il followers.html di settimane fa): chi c'era allora e ora non c'è più ti ha tolto il follow.
                    </p>
                    <div className="sb-ig-cardhead">
                      <IcClock size={18} />
                      <h2>I miei follower di prima</h2>
                      <span className="sb-ig-file" translate="no">{nameOld}</span>
                    </div>
                    <div className="sb-ig-btnrow">
                      <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={() => fileOld.current?.click()}>
                        <IcUpload size={15} /><span>Scegli file</span>
                      </button>
                      <button type="button" className="sb-btn sb-btn--sm sb-btn--ghost" onClick={() => pasteInto(setOldFollowers, setNameOld)}>
                        <IcPaste size={15} /><span>Incolla</span>
                      </button>
                    </div>
                    <input ref={fileOld} type="file" accept=".html,.htm,.txt,.json" hidden
                      onChange={(e) => readFile(e.target.files?.[0], setOldFollowers, setNameOld)} />
                    <textarea className="sb-ig-textarea" value={oldFollowers} spellCheck={false}
                      onChange={(e) => { setOldFollowers(e.target.value); setNameOld(""); }}
                      placeholder="…oppure incolla qui la lista dei follower di prima" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {pasteErr && (
            <p className="sb-ig-alert" role="alert">
              <IcAlert size={16} />
              <span>Il browser ha bloccato l'incolla automatico. Clicca nell'area di testo e usa Ctrl+V (o ⌘V).</span>
            </p>
          )}

          <div className="sb-ig-actions">
            <button type="button" className="sb-btn sb-btn--primary sb-ig-go" onClick={compare} disabled={!canCompare}>
              Confronta
            </button>
            <button type="button" className="sb-btn sb-btn--secondary" onClick={reset}>
              <IcRotate size={15} /><span>Cancella e ricomincia</span>
            </button>
          </div>
        </section>

        {/* ③ Risultati */}
        {ran && (
          <section className="sb-container sb-ig-results-sec" ref={resultsRef} aria-label="Risultati del confronto">
            {/* Banner d'avviso: il numero che conta davvero */}
            <div className="sb-panel">
              <div className="sb-panel-inner sb-ig-banner-inner" role="alert">
                <IcAlert size={20} />
                <p className="sb-ig-banner-text">
                  <b translate="no">{result.iFollow.length}</b>{" "}
                  <span>profili che segui non ti ricambiano.</span>{" "}
                  <span>Li trovi nella lista in evidenza qui sotto.</span>
                </p>
              </div>
            </div>

            {/* Ordinamento */}
            <div className="sb-ig-sort">
              <span className="sb-ig-sort-label">Ordina:</span>
              <button type="button" className="sb-tab" aria-pressed={sort === "az"} onClick={() => setSort("az")}>
                <IcSortAz size={15} /> Nome (A-Z)
              </button>
              <button
                type="button"
                className="sb-tab"
                aria-pressed={sort === "recent"}
                onClick={() => setSort("recent")}
                disabled={!result.hasDates}
                title={result.hasDates ? "" : "Le date non sono presenti in questo export"}
              >
                <IcClock size={15} /> Follow più recenti
              </button>
            </div>

            <div className="sb-ig-results">
              <ResultCard title="Chi mi segue ma io non seguo" icon={<IcUserPlus size={18} />}
                items={result.theyFollow}
                copied={copied === "theyFollow"} sort={sort} locale={locale}
                onCopy={(i) => copyList("theyFollow", i)} onDownload={downloadList} />
              <ResultCard primary title="Io seguo ma non mi segue" icon={<IcUserX size={18} />}
                items={result.iFollow}
                copied={copied === "iFollow"} sort={sort} locale={locale}
                onCopy={(i) => copyList("iFollow", i)} onDownload={downloadList} />
              <ResultCard title="Chi seguo e mi risegue" icon={<IcHeart size={18} />}
                items={result.mutual}
                copied={copied === "mutual"} sort={sort} locale={locale}
                onCopy={(i) => copyList("mutual", i)} onDownload={downloadList} />
            </div>

            {/* Confronto nel tempo (solo se hai caricato un export vecchio) */}
            {result.hasOld && (
              <>
                <h2 className="sb-ig-subhead">Rispetto al tuo export vecchio</h2>
                <div className="sb-ig-results sb-ig-results--two">
                  <ResultCard primary title="Ti hanno tolto il follow" icon={<IcUserMinus size={18} />}
                    items={result.unfollowed}
                    copied={copied === "unfollowed"} sort={sort} locale={locale}
                    onCopy={(i) => copyList("unfollowed", i)} onDownload={downloadList} />
                  <ResultCard title="Nuovi follower" icon={<IcSparkle size={18} />}
                    items={result.newFollowers}
                    copied={copied === "newFollowers"} sort={sort} locale={locale}
                    onCopy={(i) => copyList("newFollowers", i)} onDownload={downloadList} />
                </div>
              </>
            )}
          </section>
        )}

        {/* ④ Privacy — rassicurazione: nulla viene salvato, lo vedi solo tu */}
        <section className="sb-section">
          <div className="sb-container">
            <div className="sb-open">
              <div>
                <h2>La tua privacy, davvero</h2>
                <p>
                  Questo strumento gira interamente nel tuo browser: i file e le liste che carichi non vengono inviati da nessuna parte, non passano da alcun server e non vengono salvati. Il confronto lo vedi solo tu, su questo dispositivo.
                </p>
              </div>

              <div className="sb-panel">
                <div className="sb-panel-inner sb-ig-priv-inner">
                  <ul className="sb-ig-checks">
                    <li><IcWifiOff size={17} /><span>Nessun caricamento su internet: tutto resta in locale.</span></li>
                    <li><IcLock size={17} /><span>Nessun login, nessun account, nessun cookie di tracciamento.</span></li>
                    <li><IcShield size={17} /><span>Niente database: appena chiudi o ricarichi la pagina, i dati spariscono.</span></li>
                  </ul>
                  <p className="sb-ig-fine">
                    L'unica cosa memorizzata sul tuo dispositivo è se hai già visto il tutorial (una preferenza locale),
                    così non ti viene riproposto. Nient'altro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
