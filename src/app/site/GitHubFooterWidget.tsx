import { useEffect, useState } from "react";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";

// ─────────────────────────────────────────────────────────────────────────────
// Riepilogo attività GitHub per il footer — avatar, @username, repo · follower,
// ultima attività pubblica e repo in evidenza. Usa SOLO le API pubbliche di
// GitHub (nessuna auth): limite 60 richieste/ora per IP, quindi teniamo una
// cache locale di 30 minuti per non martellarle.
//
// Coerente col resto del sito:
//  · stile "dark premium" (prefisso .apf-gh-, viola, Titillium ereditato dal footer);
//  · multilingua senza dipendere dal motore i18n — il widget è marcato
//    `data-no-i18n` e si traduce da sé leggendo la lingua attiva (come fa il
//    footer con la data), così i testi DINAMICI restano corretti in ogni lingua;
//  · in caso di errore o rate limit il widget sparisce: in un footer è più
//    elegante di un box d'errore.
// ─────────────────────────────────────────────────────────────────────────────

// ── CONFIG ───────────────────────────────────────────────────────────────────
const GITHUB_USERNAME = "albertoxpecchini";
const FEATURED_REPO = "AP"; // repo in evidenza (owner = username). "" per nasconderlo.
const CACHE_KEY = "ap-gh-widget-v2"; // v2: include la serie giornaliera dei commit
const CACHE_TTL = 30 * 60 * 1000; // 30 min
const SPARK_DAYS = 14; // giorni mostrati nel mini grafico dei commit

// Locale per le date del grafico (tooltip delle barre), come nel footer.
const DATE_LOCALE: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
};

// ── Tipi minimi delle risposte GitHub ────────────────────────────────────────
interface GhProfile { login: string; avatar_url: string; html_url: string; public_repos: number; followers: number }
interface GhRepo { name: string; html_url: string; stargazers_count: number; forks_count: number; language: string | null; message?: string }
interface GhEvent { type: string; created_at: string; repo?: { name?: string }; payload?: { size?: number; commits?: unknown[] } }
interface DayCount { day: string; count: number }
interface Data { profile: GhProfile; event: GhEvent | null; repo: GhRepo | null; series: DayCount[] }

// ── Stringhe localizzate (il widget si traduce da sé: è marcato data-no-i18n) ─
const STR: Record<Lang, {
  loading: string; none: string; latest: string;
  repos: string; followers: string; stars: string; forks: string;
  commits: string; days14: string;
  now: string; min: string; hour: string; day: string; month: string;
  rel: (n: number, w: string) => string;
  push: (n: number, r: string) => string; create: (r: string) => string;
  pr: (r: string) => string; issue: (r: string) => string;
  star: (r: string) => string; fork: (r: string) => string; other: (r: string) => string;
}> = {
  it: {
    loading: "carico l'attività GitHub…", none: "nessuna attività pubblica recente", latest: "Ultima attività",
    repos: "repo", followers: "follower", stars: "star", forks: "fork",
    commits: "commit", days14: "ultimi 14 giorni",
    now: "adesso", min: "min", hour: "h", day: "g", month: "mesi", rel: (n, w) => `${n} ${w} fa`,
    push: (n, r) => `push di ${n} commit su ${r}`, create: (r) => `nuovo elemento su ${r}`,
    pr: (r) => `PR su ${r}`, issue: (r) => `issue su ${r}`,
    star: (r) => `star a ${r}`, fork: (r) => `fork di ${r}`, other: (r) => `attività su ${r}`,
  },
  en: {
    loading: "loading GitHub activity…", none: "no recent public activity", latest: "Latest activity",
    repos: "repos", followers: "followers", stars: "stars", forks: "forks",
    commits: "commits", days14: "last 14 days",
    now: "just now", min: "min", hour: "h", day: "d", month: "mo", rel: (n, w) => `${n} ${w} ago`,
    push: (n, r) => `pushed ${n} commit${n > 1 ? "s" : ""} to ${r}`, create: (r) => `created on ${r}`,
    pr: (r) => `PR on ${r}`, issue: (r) => `issue on ${r}`,
    star: (r) => `starred ${r}`, fork: (r) => `forked ${r}`, other: (r) => `activity on ${r}`,
  },
  fr: {
    loading: "chargement de l'activité GitHub…", none: "aucune activité publique récente", latest: "Dernière activité",
    repos: "dépôts", followers: "abonnés", stars: "étoiles", forks: "forks",
    commits: "commits", days14: "14 derniers jours",
    now: "à l'instant", min: "min", hour: "h", day: "j", month: "mois", rel: (n, w) => `il y a ${n} ${w}`,
    push: (n, r) => `push de ${n} commit sur ${r}`, create: (r) => `création sur ${r}`,
    pr: (r) => `PR sur ${r}`, issue: (r) => `issue sur ${r}`,
    star: (r) => `étoile à ${r}`, fork: (r) => `fork de ${r}`, other: (r) => `activité sur ${r}`,
  },
  de: {
    loading: "GitHub-Aktivität wird geladen…", none: "keine aktuelle öffentliche Aktivität", latest: "Letzte Aktivität",
    repos: "Repos", followers: "Follower", stars: "Sterne", forks: "Forks",
    commits: "Commits", days14: "letzte 14 Tage",
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
    case "PushEvent": return s.push(ev.payload?.commits?.length ?? 1, repo);
    case "CreateEvent": return s.create(repo);
    case "PullRequestEvent": return s.pr(repo);
    case "IssuesEvent": return s.issue(repo);
    case "WatchEvent": return s.star(repo);
    case "ForkEvent": return s.fork(repo);
    default: return s.other(repo);
  }
}

// Aggrega i commit per giorno (dai PushEvent) sugli ultimi `days` giorni,
// riempiendo di zero i giorni senza push. `payload.size` = numero REALE di commit
// nel push (l'array commits[] è troncato a 20 dall'API, size no).
function buildSeries(events: GhEvent[], days = SPARK_DAYS): DayCount[] {
  const byDay: Record<string, number> = {};
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const key = e.created_at.slice(0, 10); // YYYY-MM-DD (UTC)
    byDay[key] = (byDay[key] || 0) + (e.payload?.size ?? e.payload?.commits?.length ?? 1);
  }
  const out: DayCount[] = [];
  const t = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: byDay[key] || 0 });
  }
  return out;
}

function readCache(): Data | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as { at: number } & Data;
    if (!c.at || Date.now() - c.at > CACHE_TTL) return null;
    return { profile: c.profile, event: c.event, repo: c.repo, series: c.series ?? [] };
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
        const reqs = [
          gh(`/users/${GITHUB_USERNAME}`),
          gh(`/users/${GITHUB_USERNAME}/events/public?per_page=100`),
        ];
        if (FEATURED_REPO) reqs.push(gh(`/repos/${GITHUB_USERNAME}/${FEATURED_REPO}`));
        const [pRes, eRes, rRes] = await Promise.all(reqs);
        if (!pRes.ok) throw new Error("GitHub profile unavailable");

        const profile = (await pRes.json()) as GhProfile;
        const events = eRes.ok ? ((await eRes.json()) as GhEvent[]) : [];
        const repoJson = rRes && rRes.ok ? ((await rRes.json()) as GhRepo) : null;
        const repo = repoJson && !repoJson.message ? repoJson : null;
        const list = Array.isArray(events) ? events : [];

        if (cancelled) return;
        const next: Data = { profile, event: list[0] ?? null, repo, series: buildSeries(list) };
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

  // Mini grafico: serie giornaliera dei commit (mostrato solo se c'è attività).
  const series = data?.series ?? [];
  const hasSpark = series.some((d) => d.count > 0);
  const sparkMax = Math.max(1, ...series.map((d) => d.count));
  const sparkTotal = series.reduce((a, d) => a + d.count, 0);

  return (
    <div className="apf-gh" data-no-i18n>
      {status === "loading" || !data ? (
        <span className="apf-gh__skeleton">{s.loading}</span>
      ) : (
        <>
          <a className="apf-gh__profile" href={data.profile.html_url} target="_blank" rel="noreferrer noopener">
            <img
              className="apf-gh__avatar"
              src={data.profile.avatar_url}
              alt={`GitHub · @${data.profile.login}`}
              width={22}
              height={22}
              loading="lazy"
            />
            <span className="apf-gh__user">@{data.profile.login}</span>
          </a>

          <span className="apf-gh__stat">
            <b>{data.profile.public_repos}</b> {s.repos} · <b>{data.profile.followers}</b> {s.followers}
          </span>

          <span className="apf-gh__act" title={s.latest}>
            <i className="apf-gh__dot" aria-hidden="true" />
            {data.event ? `${describeEvent(data.event, lang)} · ${timeAgo(data.event.created_at, lang)}` : s.none}
          </span>

          {data.repo && (
            <a className="apf-gh__repo" href={data.repo.html_url} target="_blank" rel="noreferrer noopener">
              ★ {data.repo.name}
              {data.repo.stargazers_count > 0 && <> · <b>{data.repo.stargazers_count}</b> {s.stars}</>}
              {data.repo.forks_count > 0 && <> · <b>{data.repo.forks_count}</b> {s.forks}</>}
              {data.repo.language && <> · {data.repo.language}</>}
            </a>
          )}

          {hasSpark && (
            <span className="apf-gh__spark">
              <span className="apf-gh__spark-cap">
                <b>{sparkTotal}</b> {s.commits} · {s.days14}
              </span>
              <span
                className="apf-gh__bars"
                role="img"
                aria-label={`${sparkTotal} ${s.commits} · ${s.days14}`}
              >
                {series.map((d, i) => {
                  const h = d.count === 0 ? 3 : Math.round(5 + (d.count / sparkMax) * 21);
                  // Data locale (mezzanotte locale → nessuno slittamento di giorno)
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
                      style={{ height: `${h}px` }}
                      data-tip={`${d.count} ${s.commits} · ${label}`}
                      data-zero={d.count === 0 ? "" : undefined}
                      data-today={i === series.length - 1 ? "" : undefined}
                    />
                  );
                })}
              </span>
            </span>
          )}
        </>
      )}

      <style>{`
        .apf-gh {
          display: flex; align-items: center; flex-wrap: wrap;
          gap: 0.4rem 0.9rem;
          margin-top: 1.4rem; padding-top: 1.2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.82rem; color: #8893a0; line-height: 1.45;
        }
        .apf-gh b { color: #cdd6e0; font-weight: 700; }
        .apf-gh__skeleton { opacity: 0.6; animation: apf-gh-pulse 1.5s ease-in-out infinite; }
        .apf-gh__profile { display: inline-flex; align-items: center; gap: 0.45rem; text-decoration: none; color: #cdd6e0; }
        .apf-gh__profile:hover .apf-gh__user { color: #c4a5ff; }
        .apf-gh__avatar {
          width: 22px; height: 22px; border-radius: 50%;
          border: 1px solid rgba(139, 123, 255, 0.35); flex-shrink: 0;
        }
        .apf-gh__user { font-weight: 700; }
        .apf-gh__stat { color: #8893a0; }
        .apf-gh__act { display: inline-flex; align-items: center; }
        .apf-gh__dot {
          width: 7px; height: 7px; border-radius: 50%; margin-right: 0.5rem; flex-shrink: 0;
          background: #57c98a; box-shadow: 0 0 0 0 rgba(87, 201, 138, 0.55);
          animation: apf-gh-live 2.4s ease-out infinite;
        }
        .apf-gh__repo { color: #a7b2bd; text-decoration: none; }
        .apf-gh__repo:hover { color: #c4a5ff; }

        /* ── Mini grafico dei commit giornalieri ── */
        /* Il grafico occupa TUTTO lo spazio residuo della riga, fino al margine
           destro del contenuto del footer (.apf-wrap → margini del sito). */
        .apf-gh__spark { display: flex; flex-direction: column; gap: 0.4rem; flex: 1 1 260px; min-width: 220px; }
        .apf-gh__spark-cap { font-size: 0.8rem; color: #8893a0; white-space: nowrap; }
        .apf-gh__spark-cap b { color: #cdd6e0; font-weight: 700; }
        .apf-gh__bars { display: flex; align-items: flex-end; justify-content: space-between; gap: 3px; height: 28px; width: 100%; }
        .apf-gh__bar {
          position: relative;
          flex: 1 1 0; min-width: 5px; max-width: 46px; height: 3px;
          border-radius: 3px 3px 0 0;
          background: rgba(139, 123, 255, 0.5);
          transition: background 0.15s;
        }
        .apf-gh__bar:hover { background: #a08cff; }
        .apf-gh__bar[data-today] { background: #8b7bff; }
        .apf-gh__bar[data-today]:hover { background: #a594ff; }
        .apf-gh__bar[data-zero] { background: rgba(255, 255, 255, 0.08); }
        .apf-gh__bar[data-zero]:hover { background: rgba(255, 255, 255, 0.16); }

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
