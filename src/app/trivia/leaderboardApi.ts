// ─── Leaderboard Trivia — wrapper sul motore condiviso (src/app/_game) ───────
//
// Schema tabella (SQL in TRIVIA-LEADERBOARD.md): trivia_scores
//   id, nick, score, chapter (text: id capitolo o "all"),
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
  chapter: string;     // id capitolo (es. "gotico") oppure "all"
  accuracy: number;    // 0–100
  best_streak: number;
  created_at?: string;
}

const api = createScoreApi<ScoreRow>({
  table: "trivia_scores",
  localKey: "trivia-scores-local",
  partitionKey: "chapter",
  sanitize: (row) => ({
    nick: row.nick.slice(0, 10),
    score: Math.max(0, Math.round(row.score)),
    chapter: row.chapter,
    accuracy: Math.min(100, Math.max(0, Math.round(row.accuracy))),
    best_streak: Math.max(0, Math.round(row.best_streak)),
  }),
});

export const { submitScore, fetchTop, subscribeToScores } = api;

// ─── Record personali PER ACCOUNT (miglior voto + streak record) ────────────
export interface PlayerBests { bestAccuracy: number; bestStreak: number }

export async function fetchPlayerBests(nick: string): Promise<PlayerBests> {
  const key = nick.trim().toLowerCase();
  if (!key) return { bestAccuracy: 0, bestStreak: 0 };

  let rows: ScoreRow[];
  if (!leaderboardConfigured) {
    rows = api.readLocal().filter(r => r.nick.trim().toLowerCase() === key);
  } else {
    try {
      rows = (await api.fetchRows({ select: "nick,accuracy,best_streak", limit: 2000 }))
        .filter(r => r.nick.trim().toLowerCase() === key);
    } catch { rows = []; }
  }
  let bestAccuracy = 0, bestStreak = 0;
  for (const r of rows) {
    bestAccuracy = Math.max(bestAccuracy, r.accuracy || 0);
    bestStreak = Math.max(bestStreak, r.best_streak || 0);
  }
  return { bestAccuracy, bestStreak };
}

// ─── Classifica "Totale" (somma del miglior punteggio per capitolo) ─────────
export interface TotalRow {
  nick: string;
  score: number;        // somma dei best per capitolo
  chapters: number;     // quanti capitoli distinti ha giocato
  accuracy: number;     // media (sui best) — indicativa
}

export async function fetchTotals(chapterIds: string[], limit = 50): Promise<TotalRow[]> {
  const chapSet = new Set<string>(chapterIds);

  let all: ScoreRow[];
  if (!leaderboardConfigured) {
    all = api.readLocal().filter(r => chapSet.has(r.chapter));
  } else {
    try {
      all = await api.fetchRows({
        select: "nick,score,chapter,accuracy",
        filter: { chapter: `in.(${chapterIds.join(",")})` },
        limit: 2000,
      });
    } catch { all = []; }
  }

  return aggregateTotals(all, "chapter", chapSet as Set<ScoreRow[keyof ScoreRow]>, limit)
    .map(t => ({ nick: t.nick, score: t.score, chapters: t.count, accuracy: t.accuracy }));
}
