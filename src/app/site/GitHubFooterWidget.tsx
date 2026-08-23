import { useEffect, useState, type CSSProperties } from "react";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";

// ─────────────────────────────────────────────────────────────────────────────
// Il polso GitHub — mini-dashboard del footer, numeri REALI (niente inventato).
//  · Profilo, chip statistiche (repo · follower · seguiti · ⭐ stelle totali ·
//    fork · gist), «su GitHub dal …» e località.
//  · Ultima attività pubblica (dal feed eventi — l'unico uso in cui è affidabile).
//  · ISTOGRAMMA delle contribuzioni REALI (i «quadratini verdi» del profilo) via
//    un proxy pubblico gratuito e senza token (jogruber v4), con totale
//    dell'ultimo anno e streak 🔥 / record calcolati dalla vera serie giornaliera.
//  · Barra dei linguaggi più usati, colori ufficiali linguist.
//
// Perché il feed eventi non conta i commit: /events/public è limitato a ~100
// eventi / ~90 giorni, esclude i repo privati ed è cachato in ritardo → il
// totale «a 14 giorni» era un artefatto (spesso saturava al cap).
//
// ── Cos'è cambiato in questo giro ───────────────────────────────────────────
// ① Il CSS non sta più qui dentro. C'erano cinquecento righe in un <style> in
//    fondo al JSX: un elemento di stile ricreato a ogni montaggio del footer,
//    cioè su ogni pagina del sito. Adesso è site/foot.css, che il browser
//    analizza una volta sola.
// ② L'istogramma disegna 91 giorni invece di 30, e non decide più niente in
//    JavaScript: altezza e livello escono come due numeri in una custom
//    property, il colore lo compone il foglio con color-mix(in oklab) a
//    partire dal token --sb-brand (invece delle cinque hsla() fisse che
//    stavano qui e andavano tenute in fase a mano con la palette), e quanti
//    giorni si vedano lo decide una @container query.
// ③ Via `data-puddle`: l'effetto acqua riscriveva una custom property su ogni
//    cella a ogni fotogramma. L'onda adesso è tutta in CSS, coi fratelli e
//    :has() — vedi foot.css.
// ④ Il contatore non è più un tween GSAP con osservatore delle mutazioni: è
//    un @property <integer> animato su animation-timeline: view(). Qui resta
//    solo il numero d'arrivo, passato come variabile.
//
// ⑤ Le due fonti non si trascinano più a fondo a vicenda. Il calendario delle
//    contribuzioni sta su un proxy senza quota, il resto su api.github.com,
//    che di quota ne ha 60/ora per IP e la esaurisce sul serio. Prima un 403
//    sul profilo faceva `throw` e portava via tutto, grafico compreso — che
//    era arrivato benissimo dall'altro servizio. Adesso ogni fonte risponde
//    per sé, dove manca si ripiega sulla copia locale anche scaduta, e se il
//    problema è la quota il widget dice fra quanti minuti passa.
//
// Multilingua senza motore i18n (è marcato `data-no-i18n`: si traduce da sé
// leggendo la lingua attiva), cache locale per non martellare le API: il logo
// è il marchio del sito servito in locale, quindi resta sempre visibile.
// ─────────────────────────────────────────────────────────────────────────────

// ── CONFIG ───────────────────────────────────────────────────────────────────
const GITHUB_USERNAME = "albertoxpecchini";
// Il marchio del sito al posto della foto profilo di GitHub: qui il widget parla
// per conto del sito, non per conto dell'account. In più è un file locale — non
// dipende da nessuna richiesta esterna né dalla quota API (60 richieste/ora per
// IP), quindi resta visibile anche quando il resto del widget fallisce.
const AVATAR_URL = "/favicon.svg";
const PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const FEATURED_REPO = "AP"; // repo in evidenza (owner = username). "" per nasconderlo.
const CONTRIB_API = (u: string) => `https://github-contributions-api.jogruber.de/v4/${u}?y=last`;
const CACHE_KEY = "ap-gh-widget-v4"; // v4: serie a 91 giorni per il nuovo istogramma
const CACHE_TTL = 60 * 60 * 1000; // 60 min (cold load = 3 chiamate GitHub + 1 proxy)
// Tredici settimane. Non è un numero tondo per caso: con 91 colonne il grafico
// mostra un trimestre intero, che è il periodo in cui su questo repo si vede
// davvero un andamento — a trenta giorni si vedeva solo l'ultima settimana
// buona o l'ultima settimana storta. Quante colonne restino a schermo lo
// decide la @container query in foot.css, che taglia sempre le più vecchie.
const SPARK_DAYS = 91;
const TOP_LANGS = 4; // linguaggi mostrati nella barra

// Colori ufficiali dei linguaggi (GitHub linguist), sottoinsieme + fallback viola.
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", HTML: "#e34c26", CSS: "#563d7c",
  SCSS: "#c6538c", Less: "#1d365d", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", Shell: "#89e051",
  PHP: "#4F5D95", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  Vue: "#41b883", Svelte: "#ff3e00", Kotlin: "#A97BFF", Swift: "#F05138",
  Dart: "#00B4AB", Markdown: "#083fa1", Dockerfile: "#384d54", Astro: "#ff5a03",
  Jupyter: "#DA5B0B", "Jupyter Notebook": "#DA5B0B", MDX: "#fcb32c", Lua: "#000080",
  MATLAB: "#e16737", Makefile: "#427819", Batchfile: "#C1F12E", PowerShell: "#012456",
};
const LANG_FALLBACK = "#00b3fa";
const langColor = (name: string | null) => (name && LANG_COLORS[name]) || LANG_FALLBACK;

// Locale per le date del grafico (tooltip delle colonne), come nel footer.
const DATE_LOCALE: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
};

// ── Tipi minimi delle risposte GitHub / proxy ────────────────────────────────
interface GhProfile {
  login: string; avatar_url: string; html_url: string;
  public_repos: number; followers: number; following: number;
  public_gists: number; created_at: string; location: string | null;
}
interface GhRepo { name: string; html_url: string; stargazers_count: number; forks_count: number; language: string | null; fork?: boolean; message?: string }
interface GhEvent { type: string; created_at: string; repo?: { name?: string }; payload?: { size?: number; commits?: unknown[] } }
interface DayCount { day: string; count: number; level: number }
interface LangStat { name: string; pct: number; color: string }
interface RepoAgg { totalStars: number; totalForks: number; langs: LangStat[] }
interface Contrib { series: DayCount[]; yearTotal: number; streak: number; longest: number }
interface Data { profile: GhProfile | null; event: GhEvent | null; repo: GhRepo | null; agg: RepoAgg | null; contrib: Contrib | null }

// Risposta del proxy jogruber v4
interface JogruberDay { date: string; count: number; level: number }
interface JogruberResp { total?: Record<string, number>; contributions?: JogruberDay[] }

// ── Stringhe localizzate (il widget si traduce da sé: è marcato data-no-i18n) ─
const STR: Record<Lang, {
  loading: string; none: string; latest: string; offline: string; limited: (m: number) => string;
  repos: string; followers: string; following: string;
  stars: string; forks: string; gists: string;
  commits: string; lastYear: string; less: string; more: string; today: string;
  sinceYear: (y: number) => string; streak: (n: number) => string; record: (n: number) => string;
  now: string; min: string; hour: string; day: string; month: string;
  rel: (n: number, w: string) => string;
  push: (n: number, r: string) => string; create: (r: string) => string;
  pr: (r: string) => string; issue: (r: string) => string;
  star: (r: string) => string; fork: (r: string) => string; other: (r: string) => string;
}> = {
  it: {
    offline: "statistiche GitHub non disponibili adesso",
    limited: (m) => `quota GitHub esaurita — torna fra ${m} min`,
    loading: "carico l'attività GitHub…", none: "nessuna attività pubblica recente", latest: "Ultima attività",
    repos: "repo", followers: "follower", following: "seguiti",
    stars: "stelle", forks: "fork", gists: "gist",
    commits: "commit", lastYear: "ultimo anno", less: "meno", more: "più", today: "oggi",
    sinceYear: (y) => `su GitHub dal ${y}`, streak: (n) => `🔥 ${n} giorni di fila`, record: (n) => `record ${n}`,
    now: "adesso", min: "min", hour: "h", day: "g", month: "mesi", rel: (n, w) => `${n} ${w} fa`,
    push: (n, r) => `push di ${n} commit su ${r}`, create: (r) => `nuovo elemento su ${r}`,
    pr: (r) => `PR su ${r}`, issue: (r) => `issue su ${r}`,
    star: (r) => `star a ${r}`, fork: (r) => `fork di ${r}`, other: (r) => `attività su ${r}`,
  },
  en: {
    offline: "GitHub stats unavailable right now",
    limited: (m) => `GitHub rate limit reached — back in ${m} min`,
    loading: "loading GitHub activity…", none: "no recent public activity", latest: "Latest activity",
    repos: "repos", followers: "followers", following: "following",
    stars: "stars", forks: "forks", gists: "gists",
    commits: "commits", lastYear: "last year", less: "less", more: "more", today: "today",
    sinceYear: (y) => `on GitHub since ${y}`, streak: (n) => `🔥 ${n}-day streak`, record: (n) => `best ${n}`,
    now: "just now", min: "min", hour: "h", day: "d", month: "mo", rel: (n, w) => `${n} ${w} ago`,
    push: (n, r) => `pushed ${n} commit${n > 1 ? "s" : ""} to ${r}`, create: (r) => `created on ${r}`,
    pr: (r) => `PR on ${r}`, issue: (r) => `issue on ${r}`,
    star: (r) => `starred ${r}`, fork: (r) => `forked ${r}`, other: (r) => `activity on ${r}`,
  },
  fr: {
    offline: "statistiques GitHub indisponibles pour le moment",
    limited: (m) => `quota GitHub atteint — de retour dans ${m} min`,
    loading: "chargement de l'activité GitHub…", none: "aucune activité publique récente", latest: "Dernière activité",
    repos: "dépôts", followers: "abonnés", following: "abonnements",
    stars: "étoiles", forks: "forks", gists: "gists",
    commits: "commits", lastYear: "l'an dernier", less: "moins", more: "plus", today: "aujourd'hui",
    sinceYear: (y) => `sur GitHub depuis ${y}`, streak: (n) => `🔥 ${n} jours d'affilée`, record: (n) => `record ${n}`,
    now: "à l'instant", min: "min", hour: "h", day: "j", month: "mois", rel: (n, w) => `il y a ${n} ${w}`,
    push: (n, r) => `push de ${n} commit sur ${r}`, create: (r) => `création sur ${r}`,
    pr: (r) => `PR sur ${r}`, issue: (r) => `issue sur ${r}`,
    star: (r) => `étoile à ${r}`, fork: (r) => `fork de ${r}`, other: (r) => `activité sur ${r}`,
  },
  de: {
    offline: "GitHub-Statistiken gerade nicht verfügbar",
    limited: (m) => `GitHub-Kontingent erschöpft — in ${m} Min. wieder da`,
    loading: "GitHub-Aktivität wird geladen…", none: "keine aktuelle öffentliche Aktivität", latest: "Letzte Aktivität",
    repos: "Repos", followers: "Follower", following: "folgt",
    stars: "Sterne", forks: "Forks", gists: "Gists",
    commits: "Commits", lastYear: "letztes Jahr", less: "weniger", more: "mehr", today: "heute",
    sinceYear: (y) => `auf GitHub seit ${y}`, streak: (n) => `🔥 ${n} Tage in Folge`, record: (n) => `Rekord ${n}`,
    now: "gerade eben", min: "Min.", hour: "Std.", day: "T", month: "Mon.", rel: (n, w) => `vor ${n} ${w}`,
    push: (n, r) => `${n} Commit${n > 1 ? "s" : ""} zu ${r} gepusht`, create: (r) => `erstellt in ${r}`,
    pr: (r) => `PR in ${r}`, issue: (r) => `Issue in ${r}`,
    star: (r) => `${r} markiert`, fork: (r) => `${r} geforkt`, other: (r) => `Aktivität in ${r}`,
  },
};

function timeAgo(dateString: string, lang: Lang): string {
  const s = STR[lang];
  const mins = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
  if (mins < 1) return s.now;
  if (mins < 60) return s.rel(mins, s.min);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return s.rel(hours, s.hour);
  const days = Math.floor(hours / 24);
  if (days < 30) return s.rel(days, s.day);
  return s.rel(Math.floor(days / 30), s.month);
}

function describeEvent(ev: GhEvent, lang: Lang): string {
  const s = STR[lang];
  const repo = ev.repo?.name?.split("/")[1] ?? ev.repo?.name ?? "repo";
  switch (ev.type) {
    case "PushEvent": return s.push(ev.payload?.size ?? ev.payload?.commits?.length ?? 1, repo);
    case "CreateEvent": return s.create(repo);
    case "PullRequestEvent": return s.pr(repo);
    case "IssuesEvent": return s.issue(repo);
    case "WatchEvent": return s.star(repo);
    case "ForkEvent": return s.fork(repo);
    default: return s.other(repo);
  }
}

// Aggrega i repo pubblici: stelle e fork totali (solo repo propri, no fork) e
// classifica i linguaggi principali con la loro percentuale.
function aggregateRepos(repos: GhRepo[]): RepoAgg {
  const owned = repos.filter((r) => !r.fork);
  let totalStars = 0;
  let totalForks = 0;
  const tally: Record<string, number> = {};
  for (const r of owned) {
    totalStars += r.stargazers_count || 0;
    totalForks += r.forks_count || 0;
    if (r.language) tally[r.language] = (tally[r.language] || 0) + 1;
  }
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  const langs: LangStat[] = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LANGS)
    .map(([name, n]) => ({ name, pct: Math.round((n / total) * 100), color: langColor(name) }));
  return { totalStars, totalForks, langs };
}

// Streak (giorni consecutivi con contributi) dalla vera serie giornaliera.
// `days` è l'intero anno, ordinato dal più vecchio al più recente.
function computeStreaks(days: JogruberDay[]): { streak: number; longest: number } {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) { run += 1; if (run > longest) longest = run; }
    else run = 0;
  }
  // Streak corrente: dalla fine. Regola GitHub: se OGGI è ancora a 0, lo streak
  // conta fino a ieri (la giornata è appena iniziata).
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  let streak = 0;
  for (; i >= 0; i -= 1) {
    if (days[i].count > 0) streak += 1;
    else break;
  }
  return { streak, longest };
}

// Costruisce i dati del grafico dalla risposta del proxy: serie reale degli
// ultimi SPARK_DAYS giorni, totale ultimo anno e streak.
function buildContrib(j: JogruberResp): Contrib | null {
  const all = Array.isArray(j.contributions) ? j.contributions : [];
  if (!all.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const past = all
    .filter((d) => d.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!past.length) return null;
  const series: DayCount[] = past.slice(-SPARK_DAYS).map((d) => ({ day: d.date, count: d.count, level: d.level }));
  const yearTotal = j.total?.lastYear ?? past.reduce((a, d) => a + d.count, 0);
  const { streak, longest } = computeStreaks(past);
  return { series, yearTotal, streak, longest };
}

/** La copia locale, con la sua età. Chi legge decide cosa farne: `fresca` vuol
 *  dire «non serve uscire in rete», scaduta vuol dire «riprova, ma tienila da
 *  parte» — vedi la rete di sicurezza nell'effetto qui sotto. */
function readCache(): { fresca: boolean; data: Data } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as { at: number } & Data;
    if (!c.at || !c.profile) return null;
    return {
      fresca: Date.now() - c.at <= CACHE_TTL,
      data: { profile: c.profile, event: c.event, repo: c.repo, agg: c.agg ?? null, contrib: c.contrib ?? null },
    };
  } catch { return null; }
}
function writeCache(d: Data): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), ...d })); } catch { /* storage non disponibile */ }
}

/** Minuti che mancano al ripristino della quota, letti dall'intestazione della
 *  risposta 403. Serve a dire QUANDO invece di dire «adesso no». */
function minutiAlRipristino(r: Response): number | null {
  const reset = Number(r.headers.get("x-ratelimit-reset"));
  if (!reset) return null;
  return Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000));
}

/** Data locale a mezzanotte: `new Date("2026-08-23")` sarebbe letta come UTC e
 *  a ovest di Greenwich mostrerebbe il giorno prima. */
const atMidnight = (iso: string) => new Date(`${iso}T00:00:00`);

export default function GitHubFooterWidget() {
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Minuti al ripristino della quota GitHub; null = non è quello il problema.
  const [limite, setLimite] = useState<number | null>(null);

  useEffect(() => subscribeLang(setLang), []);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    // Copia fresca: non si esce nemmeno in rete. È il modo principale con cui
    // questo widget non consuma la quota (60 richieste/ora per IP, e una
    // visita ne spende tre).
    if (cached?.fresca) { setData(cached.data); setStatus("ready"); return; }

    const gh = (path: string) =>
      fetch(`https://api.github.com${path}`, { headers: { Accept: "application/vnd.github+json" } })
        .catch(() => null);

    (async () => {
      // ── Le fonti sono DUE, e indipendenti ────────────────────────────────
      // Il calendario delle contribuzioni sta su un proxy pubblico che non ha
      // quota; profilo, eventi e repo stanno su api.github.com, che ce l'ha e
      // che si esaurisce davvero. Prima un 403 sul profilo faceva `throw` e
      // buttava via TUTTO — istogramma compreso, che però era arrivato benissimo
      // dall'altro servizio. Da fuori sembrava che il footer fosse rotto,
      // mentre il pezzo che conta era lì pronto da disegnare.
      // Adesso ogni fonte risponde per sé e si mostra quello che è arrivato.
      const contribP: Promise<JogruberResp | null> = fetch(CONTRIB_API(GITHUB_USERNAME))
        .then((r) => (r.ok ? (r.json() as Promise<JogruberResp>) : null))
        .catch(() => null);

      const [pRes, eRes, rRes, cj] = await Promise.all([
        gh(`/users/${GITHUB_USERNAME}`),
        gh(`/users/${GITHUB_USERNAME}/events/public?per_page=100`),
        gh(`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`),
        contribP,
      ]);
      if (cancelled) return;

      // Quota esaurita: GitHub risponde 403 con l'ora del ripristino. Vale la
      // pena distinguerlo da un guasto — è una cosa che passa da sola, e si
      // può dire fra quanto.
      const quotaFinita = !!pRes && pRes.status === 403;
      if (quotaFinita && pRes) setLimite(minutiAlRipristino(pRes));

      const jsonOk = async <T,>(r: Response | null): Promise<T | null> => {
        if (!r || !r.ok) return null;
        try { return (await r.json()) as T; } catch { return null; }
      };

      const profileVivo = await jsonOk<GhProfile>(pRes);
      const events = (await jsonOk<GhEvent[]>(eRes)) ?? [];
      const repos = (await jsonOk<GhRepo[]>(rRes)) ?? [];
      const list = Array.isArray(events) ? events : [];
      const repoList = Array.isArray(repos) ? repos : [];

      let contribVivo: Contrib | null = null;
      try { if (cj) contribVivo = buildContrib(cj); } catch { contribVivo = null; }

      if (cancelled) return;

      // La rete di sicurezza: dove la chiamata non ha risposto si ripiega sulla
      // copia locale scaduta. Numeri di ieri sono infinitamente meglio di una
      // scusa — e il grafico, che viene dall'altra fonte, resta di oggi.
      const vecchio = cached?.data ?? null;
      const profile = profileVivo ?? vecchio?.profile ?? null;
      const contrib = contribVivo ?? vecchio?.contrib ?? null;
      const agg = repoList.length ? aggregateRepos(repoList) : vecchio?.agg ?? null;
      const featured = repoList.length
        ? (FEATURED_REPO
            ? repoList.find((r) => r.name.toLowerCase() === FEATURED_REPO.toLowerCase()) ?? null
            : null)
        : vecchio?.repo ?? null;
      const event = list[0] ?? vecchio?.event ?? null;

      // «Pronto» vuol dire che c'è qualcosa da mostrare, non che è arrivato
      // tutto: col profilo scaduto e l'istogramma fresco il footer ha comunque
      // il suo pezzo forte.
      if (!profile && !contrib) { setStatus("error"); return; }
      const next: Data = { profile, event, repo: featured, agg, contrib };
      setData(next);
      setStatus("ready");

      // Si riscrive la copia SOLO se il profilo è arrivato davvero: rinfrescare
      // la data su dati ripescati dalla cache vecchia vorrebbe dire dichiararli
      // freschi e non riprovare per un'altra ora.
      if (profileVivo) writeCache(next);
    })();

    return () => { cancelled = true; };
  }, []);

  const s = STR[lang];
  const p = data?.profile ?? null;
  const agg = data?.agg ?? null;
  const contrib = data?.contrib ?? null;
  const series = contrib?.series ?? [];
  const sinceYear = p ? new Date(p.created_at).getFullYear() : null;

  // Il massimo è la scala del grafico; la media è la riga tratteggiata. Sono
  // gli unici due numeri che il JavaScript calcola per il disegno: tutto il
  // resto (colore, sagoma, quanti giorni si vedono) lo fa il foglio di stile.
  //
  // La scala è la RADICE, non lineare, e non è un abbellimento: i commit al
  // giorno sono una distribuzione con la coda lunga — quasi tutti i giorni
  // stanno fra 1 e 3, e una giornata di lavoro grosso da trenta fa da massimo.
  // Su scala lineare quella giornata si prende tutta l'altezza e tutte le
  // altre diventano indistinguibili da zero: il grafico dice «un giorno ho
  // lavorato», che non è l'informazione. Con la radice un giorno da 1 su un
  // massimo di 30 vale il 18% dell'altezza invece del 3%, e i giorni normali
  // tornano a essere leggibili senza che il picco smetta di essere il picco.
  const sparkMax = Math.max(1, ...series.map((d) => d.count));
  const scala = (n: number) => Math.sqrt(Math.max(0, n) / sparkMax);
  const avg = series.length
    ? scala(series.reduce((a, d) => a + d.count, 0) / series.length)
    : 0;

  // Le tre date d'inizio possibili: il grafico ne mostra 91, 60 o 30 colonne a
  // seconda di quanto è largo, e l'etichetta a sinistra deve dire il giorno da
  // cui parte QUELLO che si sta vedendo. Le rende tutte e tre; a scegliere è la
  // @container query, che è la sola a sapere quante colonne sono a schermo.
  const fmtDay = (iso: string) =>
    atMidnight(iso).toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "short" });
  const spans: { span: number; label: string }[] = [91, 60, 30]
    .filter((n) => series.length >= n)
    .map((n) => ({ span: n, label: fmtDay(series[series.length - n].day) }));

  return (
    <div className="sb-gh" data-no-i18n>
      {/* ── Riga 1: identità — logo + username SEMPRE visibili (URL diretto,
          non passa dalla API REST, quindi non sparisce per rate limit) ── */}
      <div className="sb-gh__id">
        <a className="sb-gh__profile" href={p?.html_url ?? PROFILE_URL} target="_blank" rel="noreferrer noopener">
          <img
            className="sb-gh__avatar"
            src={AVATAR_URL}
            alt={`GitHub — @${GITHUB_USERNAME}`}
            width={22}
            height={22}
            loading="lazy"
          />
          <span>@{GITHUB_USERNAME}</span>
        </a>

        {status === "loading" && <span className="sb-gh__skeleton">{s.loading}</span>}
        {/* La quota non autenticata di GitHub è 60 richieste/ora per IP, e una
            visita ne spende tre: capita davvero di arrivare a quota. Se è
            quello, si dice anche fra quanto passa — è un'attesa, non un
            guasto. Il messaggio compare anche quando il grafico c'è, perché
            spiega perché mancano le chip. */}
        {(status === "error" || (status === "ready" && !p)) && (
          <span className="sb-gh__since">{limite ? s.limited(limite) : s.offline}</span>
        )}

        {p && (
          <>
            <span className="sb-gh__since">
              {sinceYear ? s.sinceYear(sinceYear) : ""}
              {p.location ? ` — ${p.location}` : ""}
            </span>

            <span className="sb-gh__act" title={s.latest}>
              <i className="sb-gh__dot" aria-hidden="true" />
              {data?.event ? `${describeEvent(data.event, lang)} — ${timeAgo(data.event.created_at, lang)}` : s.none}
            </span>
          </>
        )}
      </div>

      {status === "ready" && data && (
        <>
          {/* ── Riga 2: l'istogramma. Sta PRIMA delle chip, e non è un
              dettaglio d'ordine: è il pezzo con dentro l'informazione, le chip
              sono il contorno. Prima veniva dopo, e la cosa che si guarda per
              ultima non è mai quella che conta.

              Il suo `if` guarda SOLO contrib, e non il profilo: i due dati
              vengono da servizi diversi, e il calendario delle contribuzioni
              arriva da uno che non ha quota. Prima bastava un 403 su
              api.github.com — che qui capita per davvero — perché sparisse
              anche il grafico, che era lì pronto. ── */}
          {contrib && (
            <figure className="sb-gh__chart">
              <figcaption className="sb-gh__cap">
                <span>
                  {/* Il numero sale da 0 mentre il footer entra in scena. Il
                      valore d'arrivo è qui, come variabile; a muoverlo è una
                      keyframe su timeline di scroll (foot.css). */}
                  <b
                    className="sb-gh__count"
                    style={{ "--sb-foot-n": contrib.yearTotal } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="sb-foot-sr">{contrib.yearTotal}</span>
                  {" "}{s.commits} — {s.lastYear}
                </span>
                {contrib.streak > 0 && <span>{s.streak(contrib.streak)}</span>}
                {contrib.longest > 0 && <span>{s.record(contrib.longest)}</span>}
              </figcaption>

              <div
                className="sb-gh__plot"
                role="img"
                aria-label={`${contrib.yearTotal} ${s.commits} — ${s.lastYear}`}
                style={{ "--sb-gh-avg": avg.toFixed(3) } as CSSProperties}
              >
                {series.map((d, i) => {
                  const date = atMidnight(d.day);
                  const wd = date.getDay(); // 0 = domenica, 6 = sabato
                  const label = date.toLocaleDateString(DATE_LOCALE[lang], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <i
                      key={d.day}
                      className="sb-gh__bar"
                      style={{
                        "--sb-gh-v": scala(d.count).toFixed(3),
                        "--sb-gh-l": d.level,
                      } as CSSProperties}
                      data-tip={`${d.count} ${s.commits} — ${label}`}
                      data-wk={wd === 0 || wd === 6 ? "" : undefined}
                      data-today={i === series.length - 1 ? "" : undefined}
                    />
                  );
                })}
              </div>

              <div className="sb-gh__axis">
                <span>
                  {spans.map(({ span, label }) => (
                    <span key={span} className="sb-gh__from" data-span={span}>{label}</span>
                  ))}
                </span>
                <span className="sb-gh__scale">
                  {s.less}
                  {[0, 1, 2, 3, 4].map((l) => (
                    <i key={l} style={{ "--sb-gh-l": l } as CSSProperties} />
                  ))}
                  {s.more}
                </span>
                <span>{s.today}</span>
              </div>
            </figure>
          )}

          {/* ── Riga 3: chip statistiche reali + repo in evidenza.
              Queste sì che dipendono dal profilo: sono i suoi numeri. ── */}
          {p && (
            <div className="sb-gh__chips">
              <span className="sb-gh__chip"><b>{p.public_repos}</b> {s.repos}</span>
              <span className="sb-gh__chip"><b>{p.followers}</b> {s.followers}</span>
              <span className="sb-gh__chip"><b>{p.following}</b> {s.following}</span>
              {agg && (
                <span className="sb-gh__chip"><span className="sb-gh__star" aria-hidden="true">★</span> <b>{agg.totalStars}</b> {s.stars}</span>
              )}
              {agg && agg.totalForks > 0 && (
                <span className="sb-gh__chip"><b>{agg.totalForks}</b> {s.forks}</span>
              )}
              {p.public_gists > 0 && (
                <span className="sb-gh__chip"><b>{p.public_gists}</b> {s.gists}</span>
              )}
              {data.repo && (
                <a className="sb-gh__chip" href={data.repo.html_url} target="_blank" rel="noreferrer noopener">
                  <span className="sb-gh__star" aria-hidden="true">★</span> {data.repo.name}
                  {data.repo.language && (
                    <>
                      {" — "}
                      <i className="sb-gh__langdot" style={{ background: langColor(data.repo.language) }} aria-hidden="true" />
                      {" "}{data.repo.language}
                    </>
                  )}
                </a>
              )}
            </div>
          )}

          {/* ── Riga 4: linguaggi più usati ── */}
          {agg && agg.langs.length > 0 && (
            <div className="sb-gh__langs">
              <span
                className="sb-gh__langbar"
                role="img"
                aria-label={agg.langs.map((l) => `${l.name} ${l.pct}%`).join(", ")}
              >
                {agg.langs.map((l) => (
                  <i
                    key={l.name}
                    className="sb-gh__langseg"
                    style={{ width: `${l.pct}%`, background: l.color }}
                    title={`${l.name} — ${l.pct}%`}
                  />
                ))}
              </span>
              <span className="sb-gh__langlegend">
                {agg.langs.map((l) => (
                  <span key={l.name} className="sb-gh__langitem">
                    <i className="sb-gh__langdot" style={{ background: l.color }} aria-hidden="true" />
                    {l.name} <b>{l.pct}%</b>
                  </span>
                ))}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
