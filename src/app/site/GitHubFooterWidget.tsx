import { useEffect, useState } from "react";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";

// ─────────────────────────────────────────────────────────────────────────────
// Mini-dashboard GitHub per il footer — numeri REALI (nessun dato inventato).
//  · Profilo, chip statistiche (repo · follower · following · ⭐ stelle totali ·
//    fork · gist), "su GitHub dal …" e location.
//  · Ultima attività pubblica (dal feed eventi — l'unico uso in cui è affidabile).
//  · Grafico contribuzioni REALE (i "quadratini verdi" del profilo) via un proxy
//    pubblico gratuito e senza token (jogruber v4), con totale ultimo anno e
//    streak 🔥 / record calcolati dalla vera serie giornaliera.
//  · Barra dei linguaggi più usati, colori ufficiali linguist.
//
// Perché non usiamo più il feed eventi per contare i commit: /events/public è
// limitato a ~100 eventi / ~90 giorni, esclude i repo privati ed è cachato in
// ritardo → il totale "a 14 giorni" era un artefatto (spesso saturava al cap).
//
// Coerente con il footer Supabase-style: prefisso .sb-gh, token .sb- della home
// (tema chiaro/scuro nativo), multilingua senza motore i18n (marcato
// `data-no-i18n`, si traduce da sé leggendo la lingua attiva), cache locale per
// non martellare le API (non-auth = 60 richieste/ora/IP): il logo è il marchio
// del sito servito in locale, quindi resta sempre visibile; solo le statistiche
// extra spariscono elegantemente se la fetch fallisce.
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
const CACHE_KEY = "ap-gh-widget-v3"; // v3: repo aggregati + calendario contribuzioni reale
const CACHE_TTL = 60 * 60 * 1000; // 60 min (cold load = 3 chiamate GitHub + 1 proxy)
const SPARK_DAYS = 30; // giorni mostrati nel grafico contribuzioni
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
const LANG_FALLBACK = "#3ecf8e";
const langColor = (name: string | null) => (name && LANG_COLORS[name]) || LANG_FALLBACK;

// Sfondo delle candele del grafico per livello di intensità (0-4), scala verde
// brand (i "quadratini" GitHub in salsa Supabase). Il livello 0 usa il token
// overlay così resta visibile su entrambi i temi.
const LEVEL_BG = [
  "var(--sb-overlay)",
  "hsla(153, 60%, 43%, 0.35)",
  "hsla(153, 60%, 45%, 0.6)",
  "hsla(153, 60%, 48%, 0.85)",
  "hsl(153, 60%, 53%)",
];
const levelBg = (lvl: number) => LEVEL_BG[Math.max(0, Math.min(4, lvl))];

// Locale per le date del grafico (tooltip delle barre), come nel footer.
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
interface Data { profile: GhProfile; event: GhEvent | null; repo: GhRepo | null; agg: RepoAgg | null; contrib: Contrib | null }

// Risposta del proxy jogruber v4
interface JogruberDay { date: string; count: number; level: number }
interface JogruberResp { total?: Record<string, number>; contributions?: JogruberDay[] }

// ── Stringhe localizzate (il widget si traduce da sé: è marcato data-no-i18n) ─
const STR: Record<Lang, {
  loading: string; none: string; latest: string;
  repos: string; followers: string; following: string;
  stars: string; forks: string; gists: string;
  commits: string; lastYear: string;
  sinceYear: (y: number) => string; streak: (n: number) => string; record: (n: number) => string;
  now: string; min: string; hour: string; day: string; month: string;
  rel: (n: number, w: string) => string;
  push: (n: number, r: string) => string; create: (r: string) => string;
  pr: (r: string) => string; issue: (r: string) => string;
  star: (r: string) => string; fork: (r: string) => string; other: (r: string) => string;
}> = {
  it: {
    loading: "carico l'attività GitHub…", none: "nessuna attività pubblica recente", latest: "Ultima attività",
    repos: "repo", followers: "follower", following: "seguiti",
    stars: "stelle", forks: "fork", gists: "gist",
    commits: "commit", lastYear: "ultimo anno",
    sinceYear: (y) => `su GitHub dal ${y}`, streak: (n) => `🔥 ${n} giorni di fila`, record: (n) => `record ${n}`,
    now: "adesso", min: "min", hour: "h", day: "g", month: "mesi", rel: (n, w) => `${n} ${w} fa`,
    push: (n, r) => `push di ${n} commit su ${r}`, create: (r) => `nuovo elemento su ${r}`,
    pr: (r) => `PR su ${r}`, issue: (r) => `issue su ${r}`,
    star: (r) => `star a ${r}`, fork: (r) => `fork di ${r}`, other: (r) => `attività su ${r}`,
  },
  en: {
    loading: "loading GitHub activity…", none: "no recent public activity", latest: "Latest activity",
    repos: "repos", followers: "followers", following: "following",
    stars: "stars", forks: "forks", gists: "gists",
    commits: "commits", lastYear: "last year",
    sinceYear: (y) => `on GitHub since ${y}`, streak: (n) => `🔥 ${n}-day streak`, record: (n) => `best ${n}`,
    now: "just now", min: "min", hour: "h", day: "d", month: "mo", rel: (n, w) => `${n} ${w} ago`,
    push: (n, r) => `pushed ${n} commit${n > 1 ? "s" : ""} to ${r}`, create: (r) => `created on ${r}`,
    pr: (r) => `PR on ${r}`, issue: (r) => `issue on ${r}`,
    star: (r) => `starred ${r}`, fork: (r) => `forked ${r}`, other: (r) => `activity on ${r}`,
  },
  fr: {
    loading: "chargement de l'activité GitHub…", none: "aucune activité publique récente", latest: "Dernière activité",
    repos: "dépôts", followers: "abonnés", following: "abonnements",
    stars: "étoiles", forks: "forks", gists: "gists",
    commits: "commits", lastYear: "l'an dernier",
    sinceYear: (y) => `sur GitHub depuis ${y}`, streak: (n) => `🔥 ${n} jours d'affilée`, record: (n) => `record ${n}`,
    now: "à l'instant", min: "min", hour: "h", day: "j", month: "mois", rel: (n, w) => `il y a ${n} ${w}`,
    push: (n, r) => `push de ${n} commit sur ${r}`, create: (r) => `création sur ${r}`,
    pr: (r) => `PR sur ${r}`, issue: (r) => `issue sur ${r}`,
    star: (r) => `étoile à ${r}`, fork: (r) => `fork de ${r}`, other: (r) => `activité sur ${r}`,
  },
  de: {
    loading: "GitHub-Aktivität wird geladen…", none: "keine aktuelle öffentliche Aktivität", latest: "Letzte Aktivität",
    repos: "Repos", followers: "Follower", following: "folgt",
    stars: "Sterne", forks: "Forks", gists: "Gists",
    commits: "Commits", lastYear: "letztes Jahr",
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

function readCache(): Data | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as { at: number } & Data;
    if (!c.at || Date.now() - c.at > CACHE_TTL) return null;
    return { profile: c.profile, event: c.event, repo: c.repo, agg: c.agg ?? null, contrib: c.contrib ?? null };
  } catch { return null; }
}
function writeCache(d: Data): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), ...d })); } catch { /* storage non disponibile */ }
}

export default function GitHubFooterWidget() {
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => subscribeLang(setLang), []);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    if (cached) { setData(cached); setStatus("ready"); return; }

    const gh = (path: string) =>
      fetch(`https://api.github.com${path}`, { headers: { Accept: "application/vnd.github+json" } });

    (async () => {
      try {
        // Il calendario contribuzioni è su un proxy esterno: se cade non deve
        // abbattere il resto → lo isoliamo con .catch(() => null).
        const contribP: Promise<JogruberResp | null> = fetch(CONTRIB_API(GITHUB_USERNAME))
          .then((r) => (r.ok ? (r.json() as Promise<JogruberResp>) : null))
          .catch(() => null);

        const [pRes, eRes, rRes, cj] = await Promise.all([
          gh(`/users/${GITHUB_USERNAME}`),
          gh(`/users/${GITHUB_USERNAME}/events/public?per_page=100`),
          gh(`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`),
          contribP,
        ]);
        if (!pRes.ok) throw new Error("GitHub profile unavailable");

        const profile = (await pRes.json()) as GhProfile;
        const events = eRes.ok ? ((await eRes.json()) as GhEvent[]) : [];
        const repos = rRes.ok ? ((await rRes.json()) as GhRepo[]) : [];
        const list = Array.isArray(events) ? events : [];
        const repoList = Array.isArray(repos) ? repos : [];

        const agg = repoList.length ? aggregateRepos(repoList) : null;
        const featured = FEATURED_REPO
          ? repoList.find((r) => r.name.toLowerCase() === FEATURED_REPO.toLowerCase()) ?? null
          : null;

        let contrib: Contrib | null = null;
        try { if (cj) contrib = buildContrib(cj); } catch { contrib = null; }

        if (cancelled) return;
        const next: Data = { profile, event: list[0] ?? null, repo: featured, agg, contrib };
        setData(next);
        setStatus("ready");
        writeCache(next);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const s = STR[lang];
  const p = data?.profile ?? null;
  const agg = data?.agg ?? null;
  const contrib = data?.contrib ?? null;
  const series = contrib?.series ?? [];
  const sparkMax = Math.max(1, ...series.map((d) => d.count));
  const sinceYear = p ? new Date(p.created_at).getFullYear() : null;

  return (
    <div className="sb-gh" data-no-i18n>
      {/* ── Riga 1: profilo — logo + username SEMPRE visibili (URL diretto,
          non passa dalla API REST, quindi non sparisce per rate limit) ── */}
      <div className="sb-gh__row">
        <a className="sb-gh__profile" href={p?.html_url ?? PROFILE_URL} target="_blank" rel="noreferrer noopener">
          <img
            className="sb-gh__avatar"
            src={AVATAR_URL}
            alt={`GitHub · @${GITHUB_USERNAME}`}
            width={22}
            height={22}
            loading="lazy"
          />
          <span className="sb-gh__user">@{GITHUB_USERNAME}</span>
        </a>

        {status === "loading" && <span className="sb-gh__skeleton">{s.loading}</span>}

        {p && (
          <>
            <span className="sb-gh__since">
              {sinceYear ? s.sinceYear(sinceYear) : ""}
              {p.location ? ` · ${p.location}` : ""}
            </span>

            <span className="sb-gh__act" title={s.latest}>
              <i className="sb-gh__dot" aria-hidden="true" />
              {data?.event ? `${describeEvent(data.event, lang)} · ${timeAgo(data.event.created_at, lang)}` : s.none}
            </span>
          </>
        )}
      </div>

      {status === "ready" && data && p && (
        <>

          {/* ── Riga 2: chip statistiche reali + repo in evidenza ── */}
          <div className="sb-gh__row sb-gh__chips">
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
              <a className="sb-gh__chip sb-gh__repo" href={data.repo.html_url} target="_blank" rel="noreferrer noopener">
                <span className="sb-gh__star" aria-hidden="true">★</span> {data.repo.name}
                {data.repo.language && (
                  <>
                    {" · "}
                    <i className="sb-gh__langdot" style={{ background: langColor(data.repo.language) }} aria-hidden="true" />
                    {" "}{data.repo.language}
                  </>
                )}
              </a>
            )}
          </div>

          {/* ── Riga 3: grafico contribuzioni REALE + streak ── */}
          {contrib && (
            <div className="sb-gh__spark">
              <span className="sb-gh__spark-cap">
                {/* data-count-to: il numero si "accende" salendo da 0 quando il
                    footer arriva a vista (regia in site/footMotion.ts). */}
                <b data-count-to={contrib.yearTotal}>{contrib.yearTotal}</b> {s.commits} · {s.lastYear}
                {contrib.streak > 0 && <> · {s.streak(contrib.streak)}</>}
                {contrib.longest > 0 && <> · {s.record(contrib.longest)}</>}
              </span>
              <span
                className="sb-gh__bars"
                role="img"
                aria-label={`${contrib.yearTotal} ${s.commits} · ${s.lastYear}`}
                data-puddle
              >
                {series.map((d, i) => {
                  const h = d.count === 0 ? 3 : Math.round(5 + (d.count / sparkMax) * 23);
                  // Data locale (mezzanotte locale → nessuno slittamento di giorno),
                  // con giorno della settimana, alla GitHub.
                  const label = new Date(`${d.day}T00:00:00`).toLocaleDateString(DATE_LOCALE[lang], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <i
                      key={d.day}
                      className="sb-gh__bar"
                      style={{ height: `${h}px`, background: levelBg(d.level) }}
                      data-tip={`${d.count} ${s.commits} · ${label}`}
                      data-today={i === series.length - 1 ? "" : undefined}
                    />
                  );
                })}
              </span>
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
                    title={`${l.name} · ${l.pct}%`}
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

      <style>{`
        /* Tutto su token .sb- (ereditati dal footer .sb-home.sb-foot):
           il widget segue il tema chiaro/scuro nativo come il resto. */
        .sb-gh {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 0.9rem;
          font-size: 0.82rem; color: var(--sb-fg-lighter); line-height: 1.45;
        }
        .sb-gh b { color: var(--sb-fg); font-weight: 500; }
        .sb-gh__skeleton { opacity: 0.6; animation: sb-gh-pulse 1.5s ease-in-out infinite; }
        .sb-gh__row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem 0.85rem; width: 100%; }

        .sb-gh__profile { display: inline-flex; align-items: center; gap: 0.45rem; text-decoration: none; color: var(--sb-fg); }
        .sb-gh__profile:hover .sb-gh__user { color: var(--sb-brand-text); }
        /* Raggio piccolo e non tondo: il marchio .ap è un quadrato pieno, e un
           ritaglio circolare gli mangerebbe i quattro angoli. */
        .sb-gh__avatar {
          width: 22px; height: 22px; border-radius: 5px;
          border: 1px solid var(--sb-border-stronger); flex-shrink: 0;
        }
        .sb-gh__user { font-weight: 500; }
        .sb-gh__since { color: var(--sb-fg-muted); }
        .sb-gh__act { display: inline-flex; align-items: center; }
        .sb-gh__dot {
          width: 7px; height: 7px; border-radius: 50%; margin-right: 0.5rem; flex-shrink: 0;
          background: var(--sb-brand); box-shadow: 0 0 0 0 hsla(153, 60%, 53%, 0.55);
          animation: sb-gh-live 2.4s ease-out infinite;
        }

        /* ── Chip statistiche (veste .sb-chip della home) ── */
        .sb-gh__chips { gap: 0.5rem 0.55rem; }
        .sb-gh__chip {
          display: inline-flex; align-items: center; gap: 0.32rem;
          padding: 0.16rem 0.6rem; border-radius: 999px;
          background: var(--sb-bg);
          border: 1px solid var(--sb-border-strong);
          font-size: 0.78rem; color: var(--sb-fg-light); white-space: nowrap;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .sb-gh__star { color: #e3b341; }
        a.sb-gh__repo { text-decoration: none; }
        a.sb-gh__repo:hover {
          color: var(--sb-fg);
          border-color: var(--sb-brand);
          background: hsla(153, 60%, 53%, 0.08);
        }
        .sb-gh__langdot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

        /* ── Grafico dei contributi giornalieri (dati reali) ── */
        .sb-gh__spark { display: flex; flex-direction: column; gap: 0.45rem; width: 100%; }
        .sb-gh__spark-cap { font-size: 0.8rem; color: var(--sb-fg-lighter); }
        .sb-gh__spark-cap b { color: var(--sb-fg); font-weight: 500; }
        .sb-gh__bars { display: flex; align-items: flex-end; justify-content: space-between; gap: 3px; height: 32px; width: 100%; }
        .sb-gh__bar {
          position: relative;
          flex: 1 1 0; min-width: 4px; max-width: 40px; height: 3px;
          border-radius: 3px 3px 0 0;
          transition: filter 0.15s, transform 0.15s;
        }
        .sb-gh__bar:hover { filter: brightness(1.15); }
        .sb-gh__bar[data-today] { box-shadow: 0 0 0 1.5px var(--sb-brand-text); }

        /* Tooltip alla GitHub: colori invertiti rispetto al tema → leggibile
           su entrambi (scuro su chiaro, chiaro su scuro). */
        .sb-gh__bar::after,
        .sb-gh__bar::before {
          position: absolute; left: 50%;
          opacity: 0; pointer-events: none;
          transition: opacity 0.14s ease, transform 0.14s ease;
          z-index: 6;
        }
        .sb-gh__bar::after {
          content: attr(data-tip);
          bottom: calc(100% + 9px);
          transform: translateX(-50%) translateY(4px);
          padding: 5px 9px; border-radius: 7px;
          background: var(--sb-fg); color: var(--sb-bg);
          font-size: 0.72rem; font-weight: 500; line-height: 1; white-space: nowrap;
          box-shadow: var(--sb-shadow-card);
        }
        .sb-gh__bar::before {
          content: ""; bottom: calc(100% + 5px);
          width: 8px; height: 8px;
          transform: translateX(-50%) translateY(4px) rotate(45deg);
          background: var(--sb-fg);
        }
        .sb-gh__bar:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); }
        .sb-gh__bar:hover::before { opacity: 1; transform: translateX(-50%) translateY(0) rotate(45deg); }
        /* Barre ai bordi: la bolla non esce dai margini del footer */
        .sb-gh__bar:first-child::after { left: 0; transform: translateX(0) translateY(4px); }
        .sb-gh__bar:first-child:hover::after { transform: translateX(0) translateY(0); }
        .sb-gh__bar:last-child::after { left: auto; right: 0; transform: translateX(0) translateY(4px); }
        .sb-gh__bar:last-child:hover::after { transform: translateX(0) translateY(0); }

        /* ── Barra dei linguaggi ── */
        .sb-gh__langs { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
        .sb-gh__langbar {
          display: flex; height: 8px; width: 100%; border-radius: 999px; overflow: hidden;
          gap: 2px; background: var(--sb-overlay);
        }
        .sb-gh__langseg { height: 100%; min-width: 4px; }
        .sb-gh__langlegend { display: flex; flex-wrap: wrap; gap: 0.35rem 0.85rem; }
        .sb-gh__langitem { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; color: var(--sb-fg-lighter); }

        @keyframes sb-gh-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.75; } }
        @keyframes sb-gh-live {
          0% { box-shadow: 0 0 0 0 hsla(153, 60%, 53%, 0.55); }
          70% { box-shadow: 0 0 0 6px hsla(153, 60%, 53%, 0); }
          100% { box-shadow: 0 0 0 0 hsla(153, 60%, 53%, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sb-gh__skeleton, .sb-gh__dot { animation: none; }
        }
        @media (max-width: 640px) { .sb-gh { font-size: 0.8rem; } }
      `}</style>
    </div>
  );
}
