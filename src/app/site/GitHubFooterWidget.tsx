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
const CACHE_KEY = "ap-gh-widget-v1";
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// ── Tipi minimi delle risposte GitHub ────────────────────────────────────────
interface GhProfile { login: string; avatar_url: string; html_url: string; public_repos: number; followers: number }
interface GhRepo { name: string; html_url: string; stargazers_count: number; forks_count: number; language: string | null; message?: string }
interface GhEvent { type: string; created_at: string; repo?: { name?: string }; payload?: { commits?: unknown[] } }
interface Data { profile: GhProfile; event: GhEvent | null; repo: GhRepo | null }

// ── Stringhe localizzate (il widget si traduce da sé: è marcato data-no-i18n) ─
const STR: Record<Lang, {
  loading: string; none: string; latest: string;
  repos: string; followers: string; stars: string; forks: string;
  now: string; min: string; hour: string; day: string; month: string;
  rel: (n: number, w: string) => string;
  push: (n: number, r: string) => string; create: (r: string) => string;
  pr: (r: string) => string; issue: (r: string) => string;
  star: (r: string) => string; fork: (r: string) => string; other: (r: string) => string;
}> = {
  it: {
    loading: "carico l'attività GitHub…", none: "nessuna attività pubblica recente", latest: "Ultima attività",
    repos: "repo", followers: "follower", stars: "star", forks: "fork",
    now: "adesso", min: "min", hour: "h", day: "g", month: "mesi", rel: (n, w) => `${n} ${w} fa`,
    push: (n, r) => `push di ${n} commit su ${r}`, create: (r) => `nuovo elemento su ${r}`,
    pr: (r) => `PR su ${r}`, issue: (r) => `issue su ${r}`,
    star: (r) => `star a ${r}`, fork: (r) => `fork di ${r}`, other: (r) => `attività su ${r}`,
  },
  en: {
    loading: "loading GitHub activity…", none: "no recent public activity", latest: "Latest activity",
    repos: "repos", followers: "followers", stars: "stars", forks: "forks",
    now: "just now", min: "min", hour: "h", day: "d", month: "mo", rel: (n, w) => `${n} ${w} ago`,
    push: (n, r) => `pushed ${n} commit${n > 1 ? "s" : ""} to ${r}`, create: (r) => `created on ${r}`,
    pr: (r) => `PR on ${r}`, issue: (r) => `issue on ${r}`,
    star: (r) => `starred ${r}`, fork: (r) => `forked ${r}`, other: (r) => `activity on ${r}`,
  },
  fr: {
    loading: "chargement de l'activité GitHub…", none: "aucune activité publique récente", latest: "Dernière activité",
    repos: "dépôts", followers: "abonnés", stars: "étoiles", forks: "forks",
    now: "à l'instant", min: "min", hour: "h", day: "j", month: "mois", rel: (n, w) => `il y a ${n} ${w}`,
    push: (n, r) => `push de ${n} commit sur ${r}`, create: (r) => `création sur ${r}`,
    pr: (r) => `PR sur ${r}`, issue: (r) => `issue sur ${r}`,
    star: (r) => `étoile à ${r}`, fork: (r) => `fork de ${r}`, other: (r) => `activité sur ${r}`,
  },
  de: {
    loading: "GitHub-Aktivität wird geladen…", none: "keine aktuelle öffentliche Aktivität", latest: "Letzte Aktivität",
    repos: "Repos", followers: "Follower", stars: "Sterne", forks: "Forks",
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

function readCache(): Data | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as { at: number } & Data;
    if (!c.at || Date.now() - c.at > CACHE_TTL) return null;
    return { profile: c.profile, event: c.event, repo: c.repo };
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
          gh(`/users/${GITHUB_USERNAME}/events/public?per_page=1`),
        ];
        if (FEATURED_REPO) reqs.push(gh(`/repos/${GITHUB_USERNAME}/${FEATURED_REPO}`));
        const [pRes, eRes, rRes] = await Promise.all(reqs);
        if (!pRes.ok) throw new Error("GitHub profile unavailable");

        const profile = (await pRes.json()) as GhProfile;
        const events = eRes.ok ? ((await eRes.json()) as GhEvent[]) : [];
        const repoJson = rRes && rRes.ok ? ((await rRes.json()) as GhRepo) : null;
        const repo = repoJson && !repoJson.message ? repoJson : null;

        if (cancelled) return;
        const next: Data = { profile, event: Array.isArray(events) ? events[0] ?? null : null, repo };
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
