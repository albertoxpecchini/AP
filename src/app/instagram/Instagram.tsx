import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  ArrowLeft, Instagram as IgIcon, Upload, Copy, Download, Check,
  UserX, UserPlus, Heart, RotateCcw, AlertTriangle, ArrowDownAZ, Clock,
  UserMinus, Sparkles, HelpCircle,
} from "lucide-react";
import SiteFooter from "../site/SiteFooter";
import Tutorial from "./Tutorial";
import Particles from "./Particles";
import { ShieldCheck, Lock, WifiOff } from "lucide-react";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import { getPref, setPref } from "../utils/prefs";

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
// Stessa struttura/stile delle altre pagine del sito (it-page-wrapper + header
// brand + hero + SiteFooter, accento arancio Ubuntu che segue il tema globale).
// I testi sono in italiano e il motore i18n del sito li traduce (voci nel
// dizionario).
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

// ── Avatar a monogramma (offline, privacy-safe, colori caldi Ubuntu) ─────────
const AV_COLORS = ["#e95420", "#c2410c", "#dd4814", "#a8481f", "#b5651d", "#cc5500", "#c25e00", "#bf5b1a"];
function avatarColor(u: string): string {
  let h = 0;
  for (let i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

// Avatar a monogramma: iniziale su cerchio in colori caldi. Offline, istantaneo,
// privacy-safe. (Le foto profilo vere non sono ottenibili in modo affidabile:
// Instagram blocca via fingerprint TLS sia i servizi terzi sia un proxy Node.)
function Avatar({ user }: { user: string }) {
  return (
    <span className="ig-avatar" style={{ background: avatarColor(user) }} aria-hidden="true">
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

// Report HTML autonomo, nello STILE del sito (Ubuntu, arancio caldo, card), con
// riepilogo dettagliato. Apribile offline, con link cliccabili ai profili.
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
    : `<p class="empty">${esc(L.empty)} 🎉</p>`;

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
  :root { --accent:#e95420; --accent-2:#c2410c; --bg:#faf8f6; --card:#fff; --ink:#14121c; --sub:#55535f; --bd:rgba(24,12,60,.10); --soft:rgba(233,84,32,.08); }
  @media (prefers-color-scheme: dark) { :root { --bg:#1b151a; --card:#241c22; --ink:#fff; --sub:#b3aca6; --bd:rgba(255,255,255,.12); --accent-2:#f6a583; --soft:rgba(233,84,32,.12); } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Ubuntu",system-ui,-apple-system,sans-serif; padding:clamp(16px,4vw,40px); }
  .wrap { max-width:720px; margin:0 auto; }
  .head { background:linear-gradient(140deg,var(--accent),#bc3d10); color:#fff; border-radius:16px; padding:1.5rem 1.6rem; box-shadow:0 14px 40px rgba(233,84,32,.3); }
  .brand { font-size:.8rem; letter-spacing:.16em; text-transform:uppercase; opacity:.9; margin:0 0 .35rem; }
  .head h1 { margin:0 0 .8rem; font-size:clamp(1.5rem,4vw,2rem); font-weight:700; }
  .meta { display:flex; flex-wrap:wrap; gap:.4rem 1.2rem; font-size:.9rem; opacity:.95; }
  .meta b { font-weight:700; }
  .summary { background:var(--card); border:1px solid var(--bd); border-radius:16px; padding:1.1rem 1.2rem; margin-top:1.1rem; box-shadow:0 14px 36px rgba(60,30,12,.10); }
  .summary h2 { margin:0 0 .9rem; font-size:1rem; letter-spacing:.04em; text-transform:uppercase; color:var(--sub); }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:.7rem; }
  .tile { background:var(--soft); border:1px solid var(--bd); border-radius:12px; padding:.7rem .8rem; display:flex; flex-direction:column; gap:.15rem; }
  .tile.strong { background:linear-gradient(140deg,rgba(233,84,32,.14),rgba(233,84,32,.06)); border-color:rgba(233,84,32,.4); }
  .tv { font-size:1.5rem; font-weight:700; color:var(--accent-2); }
  .tl { font-size:.8rem; color:var(--sub); }
  .list { background:var(--card); border:1px solid var(--bd); border-radius:16px; padding:.5rem; margin-top:1.1rem; box-shadow:0 14px 36px rgba(60,30,12,.10); }
  .list h2 { margin:.4rem .6rem .5rem; font-size:1rem; color:var(--ink); }
  .row { display:flex; align-items:center; gap:.7rem; padding:.45rem .55rem; border-radius:10px; text-decoration:none; color:var(--ink); }
  .row:hover { background:var(--soft); }
  .av { flex:0 0 auto; width:34px; height:34px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-weight:700; }
  .u { flex:1 1 auto; color:var(--accent-2); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .row:hover .u { text-decoration:underline; }
  .d { flex:0 0 auto; font-size:.8rem; color:var(--sub); }
  .empty { color:var(--sub); padding:1rem; text-align:center; }
  .foot { color:var(--sub); font-size:.8rem; text-align:center; margin-top:1.3rem; line-height:1.6; }
  .foot a { color:var(--accent-2); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <p class="brand">${esc(APP_NAME)}</p>
      <h1>${esc(title)}</h1>
      <div class="meta">
        <span><b>${items.length}</b> ${esc(L.profiles)}</span>
        <span>${esc(L.generated)} ${esc(date)} ${esc(L.at)} ${esc(time)}</span>
      </div>
    </div>
    <div class="summary">
      <h2>${esc(L.summary)}</h2>
      <div class="tiles">
      ${tiles}
      </div>
    </div>
    <div class="list">
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

// ── Card di risultato (componente stabile: non si rimonta a ogni copia) ──────
function ResultCard({
  title, icon, items, primary, fileName, copied, sort, locale, onCopy, onDownload,
}: {
  title: string;
  icon: React.ReactNode;
  items: Rel[];
  primary?: boolean;
  fileName: string;
  copied: boolean;
  sort: SortMode;
  locale: string;
  onCopy: (items: Rel[]) => void;
  onDownload: (fileName: string, title: string, items: Rel[]) => void;
}) {
  const sorted = useMemo(
    () => [...items].sort(sort === "recent" ? byRecent : byName),
    [items, sort],
  );
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={"ig-result" + (primary ? " ig-result--primary" : "")}>
      <div className="ig-result-head">
        <span className="ig-result-icon" aria-hidden="true">{icon}</span>
        <h3 className="ig-result-title">{title}</h3>
        <span className="ig-result-count">{items.length}</span>
      </div>
      <div className="ig-result-actions">
        <button type="button" className="ig-mini" onClick={() => onCopy(sorted)} disabled={!items.length}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? "Copiato" : "Copia"}</span>
        </button>
        <button type="button" className="ig-mini" onClick={() => onDownload(fileName, title, sorted)} disabled={!items.length}>
          <Download size={15} />
          <span>Scarica</span>
        </button>
      </div>
      {sorted.length ? (
        <ul className="ig-list">
          {sorted.map((r) => (
            <li key={r.user}>
              <a href={`https://instagram.com/${encodeURIComponent(r.user)}`} target="_blank" rel="noopener noreferrer" className="ig-row">
                <Avatar user={r.user} />
                <span className="ig-uname">@{r.user}</span>
                {r.ts != null && <span className="ig-date" translate="no">{fmt(r.ts)}</span>}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ig-empty">Nessuno qui 🎉</p>
      )}
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

  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
    setPref(TUTORIAL_PREF, "seen");
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
  const downloadList = (_base: string, title: string, items: Rel[]) => {
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
    <div className="it-page-wrapper ig-page">
      <Particles />
      {showTutorial && <Tutorial onClose={closeTutorial} />}

      {/* Header — marchio del portfolio + ritorno alla home */}
      <header className="ig-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="ig-brand text-decoration-none d-inline-flex align-items-center">
              <span className="ig-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="ig-brand-text">
                <span className="ig-brand-title">Alberto Pecchini</span>
                <span className="ig-brand-tagline">Designer &amp; Front-end Developer</span>
              </span>
            </Link>
            <Link to="/" className="btn btn-outline-light btn-sm fw-semibold d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" />
              <span>Torna alla home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="ig-hero">
        <div className="container">
          <span className="ig-hero-badge" aria-hidden="true"><IgIcon size={42} /></span>
          <h1 className="ig-hero-title">Chi ti ha tolto il follow? 👀</h1>
          <span className="ig-hero-rule" aria-hidden="true" />
          <p className="ig-hero-lead">Scopri in 10 secondi chi segui che non ti ricambia.</p>
          <p className="ig-hero-sub">
            Carica i due file <b>following.html</b> e <b>followers.html</b> che scarichi da Instagram
            (vanno bene anche i .json), oppure incolla le liste. Resta tutto nel tuo browser:
            nessun login, nessun dato inviato.
          </p>
          <button type="button" className="ig-guide" onClick={() => setShowTutorial(true)}>
            <HelpCircle size={16} /><span>Come scarico i file da Instagram?</span>
          </button>
        </div>
      </section>

      {/* Strumento — a sinistra i seguiti, a destra i follower */}
      <section className="ig-tool">
        <div className="container">
          <div className="ig-inputs">
            <div className="ig-card">
              <div className="ig-card-top">
                <h2 className="ig-card-title">I miei seguiti</h2>
                <span className="ig-card-file" translate="no">{nameFollowing}</span>
              </div>
              <p className="ig-card-hint">Il file following.html — chi segui tu</p>
              <button type="button" className="ig-upload" onClick={() => fileFollowing.current?.click()}>
                <Upload size={16} /><span>Scegli file</span>
              </button>
              <input ref={fileFollowing} type="file" accept=".html,.htm,.txt,.json" hidden
                onChange={(e) => readFile(e.target.files?.[0], setFollowing, setNameFollowing)} />
              <textarea className="ig-textarea" value={following} spellCheck={false}
                onChange={(e) => { setFollowing(e.target.value); setNameFollowing(""); }}
                placeholder="…oppure incolla qui la lista" />
            </div>

            <div className="ig-card">
              <div className="ig-card-top">
                <h2 className="ig-card-title">I miei follower</h2>
                <span className="ig-card-file" translate="no">{nameFollowers}</span>
              </div>
              <p className="ig-card-hint">Il file followers.html — chi ti segue</p>
              <button type="button" className="ig-upload" onClick={() => fileFollowers.current?.click()}>
                <Upload size={16} /><span>Scegli file</span>
              </button>
              <input ref={fileFollowers} type="file" accept=".html,.htm,.txt,.json" hidden
                onChange={(e) => readFile(e.target.files?.[0], setFollowers, setNameFollowers)} />
              <textarea className="ig-textarea" value={followers} spellCheck={false}
                onChange={(e) => { setFollowers(e.target.value); setNameFollowers(""); }}
                placeholder="…oppure incolla qui la lista" />
            </div>
          </div>

          {/* Confronto nel tempo: chi ti ha tolto il follow rispetto a un export vecchio */}
          <div className="ig-old">
            <button type="button" className="ig-old-toggle" onClick={() => setShowOld((v) => !v)} aria-expanded={showOld}>
              <Clock size={16} />
              <span>Chi mi ha tolto il follow di recente? Confronta con un export vecchio</span>
              <span className="ig-old-caret" style={{ transform: showOld ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            {showOld && (
              <div className="ig-old-body">
                <p className="ig-old-hint">
                  Metti qui i follower di un export più vecchio (il followers.html di settimane fa): chi c'era allora e ora non c'è più ti ha tolto il follow.
                </p>
                <div className="ig-card-top">
                  <h2 className="ig-card-title">I miei follower di prima</h2>
                  <span className="ig-card-file" translate="no">{nameOld}</span>
                </div>
                <button type="button" className="ig-upload" onClick={() => fileOld.current?.click()}>
                  <Upload size={16} /><span>Scegli file</span>
                </button>
                <input ref={fileOld} type="file" accept=".html,.htm,.txt,.json" hidden
                  onChange={(e) => readFile(e.target.files?.[0], setOldFollowers, setNameOld)} />
                <textarea className="ig-textarea" value={oldFollowers} spellCheck={false}
                  onChange={(e) => { setOldFollowers(e.target.value); setNameOld(""); }}
                  placeholder="…oppure incolla qui la lista dei follower di prima" />
              </div>
            )}
          </div>

          <div className="ig-controls">
            <button type="button" className="ig-go" onClick={compare} disabled={!canCompare}>Confronta</button>
            <button type="button" className="ig-reset" onClick={reset}>
              <RotateCcw size={16} /><span>Cancella e ricomincia</span>
            </button>
          </div>
        </div>
      </section>

      {/* Risultati */}
      {ran && (
        <section className="ig-results-wrap" ref={resultsRef}>
          <div className="container">
            {/* Banner d'avviso: il numero che conta davvero */}
            <div className="ig-banner" role="alert">
              <span className="ig-banner-ico" aria-hidden="true"><AlertTriangle size={22} /></span>
              <p className="ig-banner-text">
                <b translate="no">{result.iFollow.length}</b>{" "}
                <span>profili che segui non ti ricambiano.</span>{" "}
                <span>Li trovi nella lista in evidenza qui sotto.</span>
              </p>
            </div>

            {/* Ordinamento */}
            <div className="ig-sort">
              <span className="ig-sort-label">Ordina:</span>
              <button type="button" className={"ig-chip" + (sort === "az" ? " is-on" : "")} onClick={() => setSort("az")}>
                <ArrowDownAZ size={15} /><span>Nome (A-Z)</span>
              </button>
              <button type="button" className={"ig-chip" + (sort === "recent" ? " is-on" : "")}
                onClick={() => setSort("recent")} disabled={!result.hasDates}
                title={result.hasDates ? "" : "Le date non sono presenti in questo export"}>
                <Clock size={15} /><span>Follow più recenti</span>
              </button>
            </div>

            <div className="ig-results">
              <ResultCard title="Chi mi segue ma io non seguo" icon={<UserPlus size={18} />}
                items={result.theyFollow} fileName="chi-mi-segue-ma-non-seguo.txt"
                copied={copied === "theyFollow"} sort={sort} locale={locale}
                onCopy={(i) => copyList("theyFollow", i)} onDownload={downloadList} />
              <ResultCard primary title="Io seguo ma non mi segue" icon={<UserX size={18} />}
                items={result.iFollow} fileName="io-seguo-ma-non-mi-segue.txt"
                copied={copied === "iFollow"} sort={sort} locale={locale}
                onCopy={(i) => copyList("iFollow", i)} onDownload={downloadList} />
              <ResultCard title="Chi seguo e mi risegue" icon={<Heart size={18} />}
                items={result.mutual} fileName="reciproci.txt"
                copied={copied === "mutual"} sort={sort} locale={locale}
                onCopy={(i) => copyList("mutual", i)} onDownload={downloadList} />
            </div>

            {/* Confronto nel tempo (solo se hai caricato un export vecchio) */}
            {result.hasOld && (
              <>
                <h2 className="ig-section-title">Rispetto al tuo export vecchio</h2>
                <div className="ig-results ig-results--two">
                  <ResultCard primary title="Ti hanno tolto il follow" icon={<UserMinus size={18} />}
                    items={result.unfollowed} fileName="ti-hanno-tolto-il-follow.txt"
                    copied={copied === "unfollowed"} sort={sort} locale={locale}
                    onCopy={(i) => copyList("unfollowed", i)} onDownload={downloadList} />
                  <ResultCard title="Nuovi follower" icon={<Sparkles size={18} />}
                    items={result.newFollowers} fileName="nuovi-follower.txt"
                    copied={copied === "newFollowers"} sort={sort} locale={locale}
                    onCopy={(i) => copyList("newFollowers", i)} onDownload={downloadList} />
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Privacy — rassicurazione: nulla viene salvato, lo vedi solo tu */}
      <section className="ig-privacy">
        <div className="container">
          <div className="ig-privacy-card">
            <div className="ig-privacy-head">
              <span className="ig-privacy-badge" aria-hidden="true"><ShieldCheck size={22} /></span>
              <h2 className="ig-privacy-title">La tua privacy, davvero</h2>
            </div>
            <p className="ig-privacy-lead">
              Questo strumento gira interamente nel tuo browser: i file e le liste che carichi non vengono inviati da nessuna parte, non passano da alcun server e non vengono salvati. Il confronto lo vedi solo tu, su questo dispositivo.
            </p>
            <ul className="ig-privacy-list">
              <li><span aria-hidden="true"><WifiOff size={17} /></span> Nessun caricamento su internet: tutto resta in locale.</li>
              <li><span aria-hidden="true"><Lock size={17} /></span> Nessun login, nessun account, nessun cookie di tracciamento.</li>
              <li><span aria-hidden="true"><ShieldCheck size={17} /></span> Niente database: appena chiudi o ricarichi la pagina, i dati spariscono.</li>
            </ul>
            <p className="ig-privacy-fine">
              L'unica cosa memorizzata sul tuo dispositivo è se hai già visto il tutorial (una preferenza locale),
              così non ti viene riproposto. Nient'altro.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        /* Stile Ubuntu/Yaru caldo che segue il TEMA GLOBALE (come le altre pagine). */
        .ig-page {
          --accent: #dd4814; --accent-2: #c2410c; --accent-deep: #bc3d10; --ink: #c2410c;
          --glow: rgba(221, 72, 20, 0.35);
          --heading: #14121c; --text: #2a2833; --sub: #55535f;
          --surface: #ffffff; --surface-2: #faf8f6; --surface-bd: rgba(24, 12, 60, 0.10);
          --soft: rgba(194, 65, 12, 0.07); --soft-bd: rgba(194, 65, 12, 0.22);
          --panel: linear-gradient(160deg, #f7f2ee 0%, #f2ede9 45%, #ffffff 100%);
          --page-bg: radial-gradient(120% 70% at 50% -10%, rgba(221, 72, 20, 0.14) 0%, transparent 55%),
            linear-gradient(180deg, #faf8f6 0%, #f4f0ec 100%);
          --header-bg: rgba(250, 248, 246, 0.82); --input-bg: #ffffff;
          --btn-bd: rgba(24, 12, 60, 0.24); --btn-fg: #2a2833;
          --card-shadow: 0 14px 36px rgba(60, 30, 12, 0.10);
          --warn-bg: #fff4ec; --warn-bd: rgba(233, 84, 32, 0.35);
          min-height: 100vh; font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
          color: var(--text); background: var(--page-bg);
        }
        html.dark .ig-page {
          --accent: #e95420; --accent-2: #dd4814; --accent-deep: #bc3d10; --ink: #f6a583;
          --glow: rgba(233, 84, 32, 0.45);
          --heading: #ffffff; --text: #f5f3f1; --sub: #b3aca6;
          --surface: rgba(255, 255, 255, 0.05); --surface-2: rgba(255, 255, 255, 0.03);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --soft: rgba(233, 84, 32, 0.10); --soft-bd: rgba(233, 84, 32, 0.28);
          --panel: linear-gradient(160deg, #221a20 0%, #2a1e26 45%, #241c22 100%);
          --page-bg: radial-gradient(120% 70% at 50% -10%, rgba(233, 84, 32, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #241c22 0%, #1b151a 100%);
          --header-bg: rgba(28, 22, 27, 0.82); --input-bg: rgba(0, 0, 0, 0.22);
          --btn-bd: rgba(255, 255, 255, 0.34); --btn-fg: #ffffff;
          --card-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
          --warn-bg: rgba(233, 84, 32, 0.10); --warn-bd: rgba(233, 84, 32, 0.4);
        }

        /* Campo particelle dietro tutto; il contenuto resta sopra e leggibile. */
        .ig-particles { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .ig-page > *:not(.ig-particles) { position: relative; z-index: 1; }

        .ig-header {
          background: var(--header-bg); position: sticky; top: 0; z-index: 10;
          backdrop-filter: blur(14px) saturate(120%); -webkit-backdrop-filter: blur(14px) saturate(120%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .ig-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
          background: var(--soft); border: 1px solid var(--soft-bd);
        }
        .ig-brand-mark img { width: 100%; height: 100%; display: block; }
        .ig-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .ig-brand-title { color: var(--heading); font-weight: 700; font-size: 1.05rem; }
        .ig-brand-tagline { color: var(--sub); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .ig-brand-tagline { display: none; } }
        .ig-page .btn-outline-light { border-color: var(--btn-bd); color: var(--btn-fg); }
        .ig-page .btn-outline-light:hover, .ig-page .btn-outline-light:focus {
          background-color: var(--accent); border-color: var(--accent); color: #fff !important;
        }

        .ig-hero {
          position: relative; overflow: hidden; text-align: center;
          padding: clamp(2.75rem, 6vw, 4.5rem) 0 clamp(2rem, 4vw, 3rem);
          background: radial-gradient(90% 120% at 50% 0%, var(--soft) 0%, transparent 60%), var(--panel);
          border-bottom: 1px solid var(--surface-bd);
        }
        .ig-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 22px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28); color: #fff; margin-bottom: 1.25rem;
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .ig-hero-title {
          font-size: clamp(2.1rem, 6vw, 3.75rem); line-height: 1.05; letter-spacing: -0.02em;
          margin: 0 0 1rem; color: var(--heading); font-weight: 700;
        }
        .ig-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px; margin: 0 auto 1.1rem;
          background: var(--accent); box-shadow: 0 0 18px var(--glow);
        }
        .ig-hero-lead {
          font-size: clamp(1.2rem, 2.6vw, 1.6rem); font-style: italic; font-weight: 600;
          color: var(--heading); margin: 0 auto 0.85rem; max-width: 40rem;
        }
        .ig-hero-sub { color: var(--sub); font-size: 1.02rem; line-height: 1.6; max-width: 42rem; margin: 0 auto; }
        .ig-hero-sub b { color: var(--heading); }
        .ig-guide {
          display: inline-flex; align-items: center; gap: 0.45rem; margin-top: 1.1rem;
          background: var(--surface); color: var(--accent-2); border: 1px solid var(--soft-bd);
          border-radius: 999px; padding: 0.5rem 1rem; font-family: inherit; font-size: 0.9rem;
          font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        html.dark .ig-guide { color: var(--ink); }
        .ig-guide:hover { background: var(--soft); border-color: var(--accent); transform: translateY(-1px); }
        .ig-guide:active { transform: translateY(0); }

        .ig-tool { padding: clamp(2rem, 4vw, 3rem) 0; }
        .ig-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(1rem, 3vw, 1.75rem); }
        @media (max-width: 767.98px) { .ig-inputs { grid-template-columns: 1fr; } }

        .ig-card {
          background: var(--surface); border: 1px solid var(--surface-bd);
          border-radius: 14px; padding: 1.15rem; box-shadow: var(--card-shadow);
        }
        .ig-card-top { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; }
        .ig-card-title { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--heading); }
        .ig-card-file {
          font-family: "Ubuntu", sans-serif; font-size: 0.78rem; color: var(--sub);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 50%;
        }
        .ig-card-hint { margin: 0.15rem 0 0.9rem; font-size: 0.86rem; color: var(--sub); }
        .ig-upload {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--soft); color: var(--accent-2); border: 1px solid var(--soft-bd);
          border-radius: 10px; padding: 0.55rem 0.95rem; font-weight: 600; font-size: 0.9rem;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
        }
        html.dark .ig-upload { color: var(--ink); }
        .ig-upload:hover { background: rgba(233, 84, 32, 0.16); }
        .ig-upload:active { transform: scale(0.97); }
        .ig-textarea {
          width: 100%; margin-top: 0.8rem; min-height: 92px; resize: vertical;
          background: var(--input-bg); color: var(--text);
          border: 1px solid var(--surface-bd); border-radius: 10px; padding: 0.7rem 0.8rem;
          font-family: "Ubuntu", sans-serif; font-size: 0.85rem; line-height: 1.45;
        }
        .ig-textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }

        .ig-controls { display: flex; gap: 0.75rem; align-items: center; margin-top: 1.5rem; flex-wrap: wrap; }
        .ig-go {
          flex: 1 1 auto; min-width: 200px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border: none; border-radius: 12px; padding: 0.95rem; font-size: 1.1rem;
          font-weight: 700; cursor: pointer; box-shadow: 0 12px 30px var(--glow);
          transition: filter 0.15s, transform 0.1s, opacity 0.15s;
        }
        .ig-go:hover:not(:disabled) { filter: brightness(1.06); }
        .ig-go:active:not(:disabled) { transform: scale(0.99); }
        .ig-go:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
        .ig-reset {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: transparent; color: var(--text); border: 1px solid var(--btn-bd);
          border-radius: 12px; padding: 0.85rem 1.1rem; font-weight: 600; font-size: 0.95rem; cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .ig-reset:hover { border-color: var(--accent); color: var(--accent-2); background: var(--soft); }
        html.dark .ig-reset:hover { color: var(--ink); }

        /* Sezione "export vecchio" (confronto nel tempo) */
        .ig-old { margin-top: 1rem; }
        .ig-old-toggle {
          display: flex; align-items: center; gap: 0.6rem; width: 100%; text-align: left;
          background: var(--surface); color: var(--text); border: 1px dashed var(--soft-bd);
          border-radius: 12px; padding: 0.8rem 1rem; font-weight: 600; font-size: 0.95rem; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .ig-old-toggle:hover { border-color: var(--accent); background: var(--soft); }
        .ig-old-toggle > span:nth-child(2) { flex: 1 1 auto; }
        .ig-old-caret { color: var(--sub); transition: transform 0.2s; }
        .ig-old-body {
          margin-top: 0.75rem; padding: 1.1rem; border: 1px solid var(--surface-bd);
          border-radius: 12px; background: var(--surface); box-shadow: var(--card-shadow);
          animation: ig-rise 0.3s ease both;
        }
        .ig-old-hint { margin: 0 0 0.9rem; font-size: 0.9rem; color: var(--sub); line-height: 1.5; }
        .ig-old-hint b { color: var(--heading); }

        /* Banner d'avviso */
        .ig-results-wrap { padding: 0 0 clamp(2.5rem, 5vw, 4rem); }
        .ig-banner {
          display: flex; align-items: center; gap: 0.85rem;
          background: var(--warn-bg); border: 1px solid var(--warn-bd); border-left: 4px solid var(--accent);
          border-radius: 12px; padding: 0.9rem 1.1rem; margin-bottom: 1.25rem;
          animation: ig-rise 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .ig-banner-ico { color: var(--accent-2); display: inline-flex; flex: 0 0 auto; }
        html.dark .ig-banner-ico { color: var(--ink); }
        .ig-banner-text { margin: 0; color: var(--text); font-size: 1rem; line-height: 1.4; }
        .ig-banner-text b { color: var(--accent-2); font-size: 1.2rem; }
        html.dark .ig-banner-text b { color: var(--ink); }

        /* Ordinamento */
        .ig-sort { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .ig-sort-label { color: var(--sub); font-size: 0.9rem; margin-right: 0.15rem; }
        .ig-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--surface); color: var(--text); border: 1px solid var(--surface-bd);
          border-radius: 999px; padding: 0.4rem 0.85rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .ig-chip:hover:not(:disabled) { border-color: var(--accent); }
        .ig-chip.is-on { background: var(--accent); border-color: var(--accent); color: #fff; }
        .ig-chip:disabled { opacity: 0.45; cursor: not-allowed; }
        .ig-section-title {
          margin: clamp(1.5rem, 3vw, 2.25rem) 0 1rem; font-size: 1.25rem; font-weight: 700; color: var(--heading);
        }
        .ig-results--two { grid-template-columns: 1fr 1fr; }
        @media (max-width: 767.98px) { .ig-results--two { grid-template-columns: 1fr; } }

        .ig-results { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: clamp(1rem, 2.5vw, 1.5rem); align-items: start; }
        @media (max-width: 900px) { .ig-results { grid-template-columns: 1fr; } }
        .ig-result {
          background: var(--surface); border: 1px solid var(--surface-bd); border-radius: 14px;
          padding: 1.1rem; box-shadow: var(--card-shadow);
          animation: ig-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .ig-result--primary { border-color: var(--accent); box-shadow: 0 14px 36px var(--glow); }
        .ig-result--primary .ig-result-icon { background: var(--accent); color: #fff; border-color: var(--accent); }
        @keyframes ig-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

        .ig-result-head { display: flex; align-items: center; gap: 0.6rem; }
        .ig-result-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 9px; flex: 0 0 auto;
          background: var(--soft); color: var(--accent-2); border: 1px solid var(--soft-bd);
        }
        html.dark .ig-result-icon { color: var(--ink); }
        .ig-result-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--heading); flex: 1 1 auto; }
        .ig-result-count { font-family: "Ubuntu", sans-serif; font-weight: 700; font-size: 1.15rem; color: var(--accent-2); }
        html.dark .ig-result-count { color: var(--ink); }

        .ig-result-actions { display: flex; gap: 0.5rem; margin: 0.8rem 0; }
        .ig-mini {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: var(--surface-2); color: var(--text); border: 1px solid var(--surface-bd);
          border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.8rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .ig-mini:hover:not(:disabled) { border-color: var(--accent); color: var(--accent-2); }
        html.dark .ig-mini:hover:not(:disabled) { color: var(--ink); }
        .ig-mini:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Lista — SOLO font Ubuntu, con avatar e data */
        .ig-list {
          list-style: none; margin: 0; padding: 0.35rem;
          max-height: 340px; overflow: auto;
          background: var(--surface-2); border: 1px solid var(--surface-bd); border-radius: 10px;
          font-family: "Ubuntu", sans-serif;
        }
        .ig-list li { margin: 0; }
        .ig-row {
          display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0.4rem; border-radius: 8px;
          text-decoration: none; color: var(--text); transition: background 0.12s;
        }
        .ig-row:hover { background: var(--soft); }
        .ig-avatar {
          flex: 0 0 auto; width: 30px; height: 30px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 0.85rem; font-family: "Ubuntu", sans-serif;
        }
        .ig-uname {
          flex: 1 1 auto; font-size: 0.92rem; color: var(--accent-2); font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        html.dark .ig-uname { color: var(--ink); }
        .ig-row:hover .ig-uname { text-decoration: underline; }
        .ig-date { flex: 0 0 auto; font-size: 0.76rem; color: var(--sub); font-variant-numeric: tabular-nums; }
        .ig-empty { margin: 0.6rem 0.2rem; color: var(--sub); font-size: 0.95rem; }

        /* ── Vita: riflessi, sheen e micro-animazioni ─────────────────────── */
        /* Vetro + riflesso sottile in cima alle card. */
        .ig-card, .ig-result, .ig-old-body, .ig-privacy-card {
          position: relative; overflow: hidden;
          backdrop-filter: blur(6px) saturate(115%);
          -webkit-backdrop-filter: blur(6px) saturate(115%);
        }
        .ig-card::before, .ig-result::before, .ig-privacy-card::before {
          content: ""; position: absolute; inset: 0 0 auto 0; height: 40%;
          background: linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0));
          opacity: 0.6; pointer-events: none;
        }
        html.dark .ig-card::before, html.dark .ig-result::before, html.dark .ig-privacy-card::before {
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0));
        }
        /* Le card salgono un filo al passaggio del mouse (comfort, non salto). */
        .ig-card, .ig-result { transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease; }
        .ig-card:hover, .ig-result:hover { transform: translateY(-3px); box-shadow: 0 20px 46px rgba(60,30,12,.16); }
        html.dark .ig-card:hover, html.dark .ig-result:hover { box-shadow: 0 20px 46px rgba(0,0,0,.4); }

        /* Sheen luminoso che attraversa il bottone Confronta. */
        .ig-go { position: relative; overflow: hidden; }
        .ig-go::after {
          content: ""; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-18deg); transition: none;
        }
        .ig-go:not(:disabled)::after { animation: ig-sheen 3.4s ease-in-out infinite; }
        .ig-go:hover:not(:disabled)::after { animation-duration: 1.1s; }
        @keyframes ig-sheen { 0%, 15% { left: -60%; } 55%, 100% { left: 130%; } }

        /* Badge hero con alone che respira. */
        .ig-hero-badge { animation: ig-breath 4.5s ease-in-out infinite; }
        @keyframes ig-breath {
          0%, 100% { box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255,255,255,.25); }
          50% { box-shadow: 0 14px 54px var(--glow), 0 0 0 6px rgba(233,84,32,.10), inset 0 1px 0 rgba(255,255,255,.25); }
        }
        /* Entrata morbida dei due riquadri input. */
        .ig-inputs .ig-card { animation: ig-rise .5s cubic-bezier(.22,1,.36,1) both; }
        .ig-inputs .ig-card:nth-child(2) { animation-delay: .08s; }

        @media (prefers-reduced-motion: reduce) {
          .ig-go::after, .ig-hero-badge, .ig-inputs .ig-card { animation: none !important; }
          .ig-card:hover, .ig-result:hover { transform: none; }
        }

        /* ── Sezione privacy ──────────────────────────────────────────────── */
        .ig-privacy { padding: 0 0 clamp(2.5rem, 5vw, 4rem); }
        .ig-privacy-card {
          background: var(--surface); border: 1px solid var(--surface-bd);
          border-left: 4px solid var(--accent); border-radius: 16px;
          padding: clamp(1.2rem, 3vw, 1.8rem); box-shadow: var(--card-shadow);
        }
        .ig-privacy-head { display: flex; align-items: center; gap: .7rem; margin-bottom: .8rem; }
        .ig-privacy-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 11px; flex: 0 0 auto;
          background: var(--accent); color: #fff;
          box-shadow: 0 8px 22px var(--glow);
        }
        .ig-privacy-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--heading); }
        .ig-privacy-lead { margin: 0 0 1rem; color: var(--text); line-height: 1.6; font-size: 1.02rem; }
        .ig-privacy-lead b { color: var(--heading); }
        .ig-privacy-list { list-style: none; margin: 0 0 1rem; padding: 0; display: grid; gap: .55rem; }
        .ig-privacy-list li { display: flex; align-items: center; gap: .6rem; color: var(--text); font-size: .95rem; }
        .ig-privacy-list li span {
          display: inline-flex; flex: 0 0 auto; color: var(--accent-2);
        }
        html.dark .ig-privacy-list li span { color: var(--ink); }
        .ig-privacy-fine { margin: 0; color: var(--sub); font-size: .85rem; line-height: 1.5; }
      `}</style>
    </div>
  );
}
