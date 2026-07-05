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
// Coerente col resto del sito: dark premium (prefisso .apf-gh-, viola, Titillium
// ereditato dal footer), multilingua senza motore i18n (marcato `data-no-i18n`,
// si traduce da sé leggendo la lingua attiva), cache locale per non martellare le
// API (non-auth = 60 richieste/ora/IP) e sparizione elegante in caso di errore.
// ─────────────────────────────────────────────────────────────────────────────

// ── CONFIG ───────────────────────────────────────────────────────────────────
const GITHUB_USERNAME = "albertoxpecchini";
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
const LANG_FALLBACK = "#8b7bff";
const langColor = (name: string | null) => (name && LANG_COLORS[name]) || LANG_FALLBACK;

// Sfondo delle candele del grafico per livello di intensità (0-4), tono viola.
const LEVEL_BG = [
  "rgba(255, 255, 255, 0.07)",
  "rgba(139, 123, 255, 0.34)",
  "rgba(139, 123, 255, 0.55)",
  "rgba(139, 123, 255, 0.78)",
  "#a594ff",
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

  // API irraggiungibili o rate limit superato → il widget scompare silenziosamente.
  if (status === "error") return null;

  const s = STR[lang];
  const p = data?.profile ?? null;
  const agg = data?.agg ?? null;
  const contrib = data?.contrib ?? null;
  const series = contrib?.series ?? [];
  const sparkMax = Math.max(1, ...series.map((d) => d.count));
  const sinceYear = p ? new Date(p.created_at).getFullYear() : null;

  return (
    <div className="apf-gh" data-no-i18n>
      {status === "loading" || !data || !p ? (
        <span className="apf-gh__skeleton">{s.loading}</span>
      ) : (
        <>
          {/* ── Riga 1: profilo + "su GitHub dal …" + attività live ── */}
          <div className="apf-gh__row">
            <a className="apf-gh__profile" href={p.html_url} target="_blank" rel="noreferrer noopener">
              <img
                className="apf-gh__avatar"
                src={p.avatar_url}
                alt={`GitHub · @${p.login}`}
                width={22}
                height={22}
                loading="lazy"
              />
              <span className="apf-gh__user">@{p.login}</span>
            </a>

            <span className="apf-gh__since">
              {sinceYear ? s.sinceYear(sinceYear) : ""}
              {p.location ? ` · ${p.location}` : ""}
            </span>

            <span className="apf-gh__act" title={s.latest}>
              <i className="apf-gh__dot" aria-hidden="true" />
              {data.event ? `${describeEvent(data.event, lang)} · ${timeAgo(data.event.created_at, lang)}` : s.none}
            </span>
          </div>

          {/* ── Riga 2: chip statistiche reali + repo in evidenza ── */}
          <div className="apf-gh__row apf-gh__chips">
            <span className="apf-gh__chip"><b>{p.public_repos}</b> {s.repos}</span>
            <span className="apf-gh__chip"><b>{p.followers}</b> {s.followers}</span>
            <span className="apf-gh__chip"><b>{p.following}</b> {s.following}</span>
            {agg && (
              <span className="apf-gh__chip"><span className="apf-gh__star" aria-hidden="true">★</span> <b>{agg.totalStars}</b> {s.stars}</span>
            )}
            {agg && agg.totalForks > 0 && (
              <span className="apf-gh__chip"><b>{agg.totalForks}</b> {s.forks}</span>
            )}
            {p.public_gists > 0 && (
              <span className="apf-gh__chip"><b>{p.public_gists}</b> {s.gists}</span>
            )}
            {data.repo && (
              <a className="apf-gh__chip apf-gh__repo" href={data.repo.html_url} target="_blank" rel="noreferrer noopener">
                <span className="apf-gh__star" aria-hidden="true">★</span> {data.repo.name}
                {data.repo.language && (
                  <>
                    {" · "}
                    <i className="apf-gh__langdot" style={{ background: langColor(data.repo.language) }} aria-hidden="true" />
                    {" "}{data.repo.language}
                  </>
                )}
              </a>
            )}
          </div>

          {/* ── Riga 3: grafico contribuzioni REALE + streak ── */}
          {contrib && (
            <div className="apf-gh__spark">
              <span className="apf-gh__spark-cap">
                <b>{contrib.yearTotal}</b> {s.commits} · {s.lastYear}
                {contrib.streak > 0 && <> · {s.streak(contrib.streak)}</>}
                {contrib.longest > 0 && <> · {s.record(contrib.longest)}</>}
              </span>
              <span
                className="apf-gh__bars"
                role="img"
                aria-label={`${contrib.yearTotal} ${s.commits} · ${s.lastYear}`}
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
                      className="apf-gh__bar"
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
            <div className="apf-gh__langs">
              <span
                className="apf-gh__langbar"
                role="img"
                aria-label={agg.langs.map((l) => `${l.name} ${l.pct}%`).join(", ")}
              >
                {agg.langs.map((l) => (
                  <i
                    key={l.name}
                    className="apf-gh__langseg"
                    style={{ width: `${l.pct}%`, background: l.color }}
                    title={`${l.name} · ${l.pct}%`}
                  />
                ))}
              </span>
              <span className="apf-gh__langlegend">
                {agg.langs.map((l) => (
                  <span key={l.name} className="apf-gh__langitem">
                    <i className="apf-gh__langdot" style={{ background: l.color }} aria-hidden="true" />
                    {l.name} <b>{l.pct}%</b>
                  </span>
                ))}
              </span>
            </div>
          )}
        </>
      )}

      <style>{`
        .apf-gh {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 0.9rem;
          margin-top: 1.4rem; padding-top: 1.2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.82rem; color: #8893a0; line-height: 1.45;
        }
        .apf-gh b { color: #cdd6e0; font-weight: 700; }
        .apf-gh__skeleton { opacity: 0.6; animation: apf-gh-pulse 1.5s ease-in-out infinite; }
        .apf-gh__row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem 0.85rem; width: 100%; }

        .apf-gh__profile { display: inline-flex; align-items: center; gap: 0.45rem; text-decoration: none; color: #cdd6e0; }
        .apf-gh__profile:hover .apf-gh__user { color: #c4a5ff; }
        .apf-gh__avatar {
          width: 22px; height: 22px; border-radius: 50%;
          border: 1px solid rgba(139, 123, 255, 0.35); flex-shrink: 0;
        }
        .apf-gh__user { font-weight: 700; }
        .apf-gh__since { color: #8893a0; }
        .apf-gh__act { display: inline-flex; align-items: center; }
        .apf-gh__dot {
          width: 7px; height: 7px; border-radius: 50%; margin-right: 0.5rem; flex-shrink: 0;
          background: #57c98a; box-shadow: 0 0 0 0 rgba(87, 201, 138, 0.55);
          animation: apf-gh-live 2.4s ease-out infinite;
        }

        /* ── Chip statistiche ── */
        .apf-gh__chips { gap: 0.5rem 0.55rem; }
        .apf-gh__chip {
          display: inline-flex; align-items: center; gap: 0.32rem;
          padding: 0.16rem 0.6rem; border-radius: 999px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.09);
          font-size: 0.78rem; color: #97a2ae; white-space: nowrap;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .apf-gh__star { color: #e3b341; }
        a.apf-gh__repo { text-decoration: none; }
        a.apf-gh__repo:hover { color: #e6ebf1; border-color: rgba(139, 123, 255, 0.5); background: rgba(139, 123, 255, 0.12); }
        .apf-gh__langdot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

        /* ── Grafico dei contributi giornalieri (dati reali) ── */
        .apf-gh__spark { display: flex; flex-direction: column; gap: 0.45rem; width: 100%; max-width: 640px; }
        .apf-gh__spark-cap { font-size: 0.8rem; color: #8893a0; }
        .apf-gh__spark-cap b { color: #cdd6e0; font-weight: 700; }
        .apf-gh__bars { display: flex; align-items: flex-end; justify-content: space-between; gap: 3px; height: 32px; width: 100%; }
        .apf-gh__bar {
          position: relative;
          flex: 1 1 0; min-width: 4px; max-width: 40px; height: 3px;
          border-radius: 3px 3px 0 0;
          transition: filter 0.15s, transform 0.15s;
        }
        .apf-gh__bar:hover { filter: brightness(1.3); }
        .apf-gh__bar[data-today] { box-shadow: 0 0 0 1.5px rgba(197, 165, 255, 0.9); }

        /* Tooltip alla GitHub: data della candela + numero di commit del giorno */
        .apf-gh__bar::after,
        .apf-gh__bar::before {
          position: absolute; left: 50%;
          opacity: 0; pointer-events: none;
          transition: opacity 0.14s ease, transform 0.14s ease;
          z-index: 6;
        }
        .apf-gh__bar::after {
          content: attr(data-tip);
          bottom: calc(100% + 9px);
          transform: translateX(-50%) translateY(4px);
          padding: 5px 9px; border-radius: 7px;
          background: #1b2028; color: #eaeef3;
          font-size: 0.72rem; font-weight: 600; line-height: 1; white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5);
        }
        .apf-gh__bar::before {
          content: ""; bottom: calc(100% + 5px);
          width: 8px; height: 8px;
          transform: translateX(-50%) translateY(4px) rotate(45deg);
          background: #1b2028;
          border-right: 1px solid rgba(255, 255, 255, 0.14);
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }
        .apf-gh__bar:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); }
        .apf-gh__bar:hover::before { opacity: 1; transform: translateX(-50%) translateY(0) rotate(45deg); }
        /* Barre ai bordi: la bolla non esce dai margini del footer */
        .apf-gh__bar:first-child::after { left: 0; transform: translateX(0) translateY(4px); }
        .apf-gh__bar:first-child:hover::after { transform: translateX(0) translateY(0); }
        .apf-gh__bar:last-child::after { left: auto; right: 0; transform: translateX(0) translateY(4px); }
        .apf-gh__bar:last-child:hover::after { transform: translateX(0) translateY(0); }

        /* ── Barra dei linguaggi ── */
        .apf-gh__langs { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; max-width: 640px; }
        .apf-gh__langbar {
          display: flex; height: 8px; width: 100%; border-radius: 999px; overflow: hidden;
          gap: 2px; background: rgba(255, 255, 255, 0.05);
        }
        .apf-gh__langseg { height: 100%; min-width: 4px; }
        .apf-gh__langlegend { display: flex; flex-wrap: wrap; gap: 0.35rem 0.85rem; }
        .apf-gh__langitem { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; color: #97a2ae; }

        @keyframes apf-gh-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.75; } }
        @keyframes apf-gh-live {
          0% { box-shadow: 0 0 0 0 rgba(87, 201, 138, 0.55); }
          70% { box-shadow: 0 0 0 6px rgba(87, 201, 138, 0); }
          100% { box-shadow: 0 0 0 0 rgba(87, 201, 138, 0); }
        }
        @media (max-width: 640px) { .apf-gh { font-size: 0.8rem; } }
      `}</style>
    </div>
  );
}
