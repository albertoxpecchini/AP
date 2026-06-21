// ─── Leaderboard Mappa — wrapper sul motore condiviso (src/app/_game) ────────
//
// Schema tabella (SQL in supabase/mappa_scores.sql): mappa_scores
//   id, nick, score, mode (text: livello di difficoltà o "all"),
//   accuracy (0–100), best_streak, created_at
import {
  createScoreApi, aggregateTotals, leaderboardConfigured,
} from "../_game/leaderboardApi";
export { leaderboardConfigured } from "../_game/leaderboardApi";
export type { Unsubscribe } from "../_game/leaderboardApi";

export interface ScoreRow {
  id?: number;
  nick: string;
  score: number;
  mode: string;        // livello di difficoltà oppure "all"
  accuracy: number;    // 0–100
  best_streak: number;
  created_at?: string;
}

const api = createScoreApi<ScoreRow>({
  table: "mappa_scores",
  localKey: "mappa-scores-local",
  partitionKey: "mode",
  sanitize: (row) => ({
    nick: row.nick.slice(0, 10),
    score: Math.max(0, Math.round(row.score)),
    mode: row.mode,
    accuracy: Math.min(100, Math.max(0, Math.round(row.accuracy))),
    best_streak: Math.max(0, Math.round(row.best_streak)),
  }),
});

export const { submitScore, fetchTop, subscribeToScores } = api;

// ─── Record personali PER ACCOUNT (miglior punteggio + streak record) ───────
export interface PlayerBests { bestScore: number; bestStreak: number }

export async function fetchPlayerBests(nick: string): Promise<PlayerBests> {
  const key = nick.trim().toLowerCase();
  if (!key) return { bestScore: 0, bestStreak: 0 };

  let rows: ScoreRow[];
  if (!leaderboardConfigured) {
    rows = api.readLocal().filter(r => r.nick.trim().toLowerCase() === key);
  } else {
    try {
      rows = (await api.fetchRows({ select: "nick,score,best_streak", limit: 2000 }))
        .filter(r => r.nick.trim().toLowerCase() === key);
    } catch { rows = []; }
  }
  let bestScore = 0, bestStreak = 0;
  for (const r of rows) {
    bestScore = Math.max(bestScore, r.score || 0);
    bestStreak = Math.max(bestStreak, r.best_streak || 0);
  }
  return { bestScore, bestStreak };
}

// ─── Classifica "Totale" (somma del miglior punteggio per livello) ──────────
export interface TotalRow {
  nick: string;
  score: number;        // somma dei best per livello
  modes: number;        // quanti livelli distinti ha giocato
  accuracy: number;     // media (sui best) — indicativa
}

export async function fetchTotals(modeIds: string[], limit = 50): Promise<TotalRow[]> {
  const modeSet = new Set<string>(modeIds);

  let all: ScoreRow[];
  if (!leaderboardConfigured) {
    all = api.readLocal().filter(r => modeSet.has(r.mode));
  } else {
    try {
      all = await api.fetchRows({
        select: "nick,score,mode,accuracy",
        filter: { mode: `in.(${modeIds.join(",")})` },
        limit: 2000,
      });
    } catch { all = []; }
  }

  return aggregateTotals(all, "mode", modeSet as Set<ScoreRow[keyof ScoreRow]>, limit)
    .map(t => ({ nick: t.nick, score: t.score, modes: t.count, accuracy: t.accuracy }));
}

// Punteggio TOTALE del giocatore (badge menu): riusa fetchTotals, nick case-insensitive.
export async function fetchPlayerScore(nick: string, modeIds: string[]): Promise<number> {
  const key = nick.trim().toLowerCase();
  if (!key) return 0;
  const totals = await fetchTotals(modeIds, 500);
  return totals.find(t => t.nick.trim().toLowerCase() === key)?.score ?? 0;
}
