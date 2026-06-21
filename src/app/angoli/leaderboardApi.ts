// ─── Leaderboard Angoli — wrapper sul motore condiviso (src/app/_game) ───────
//
// Schema tabella (SQL in ANGOLI-LEADERBOARD.md): angoli_scores
//   id, nick, score, mode (int: 20|10|5|2|1), best_streak, created_at
import { createScoreApi, sumBestByGroup, leaderboardConfigured } from "../_game/leaderboardApi";
export { leaderboardConfigured } from "../_game/leaderboardApi";
export type { Unsubscribe } from "../_game/leaderboardApi";

export interface ScoreRow {
  id?: number;
  nick: string;
  score: number;
  mode: number;        // step della modalità (20|10|5|2|1)
  best_streak: number;
  created_at?: string;
}

const api = createScoreApi<ScoreRow>({
  table: "angoli_scores",
  localKey: "angoli-scores-local",
  partitionKey: "mode",
  sanitize: (row) => ({
    nick: row.nick.slice(0, 10),
    score: Math.max(0, Math.round(row.score)),
    mode: row.mode,
    best_streak: Math.max(0, Math.round(row.best_streak)),
  }),
});

export const { submitScore, fetchTop, subscribeToScores } = api;

// Punteggio TOTALE del giocatore: somma del best per modalità (badge menu).
export async function fetchPlayerScore(nick: string): Promise<number> {
  const key = nick.trim().toLowerCase();
  if (!key) return 0;

  let rows: ScoreRow[];
  if (!leaderboardConfigured) {
    rows = api.readLocal().filter(r => r.nick.trim().toLowerCase() === key);
  } else {
    try {
      rows = (await api.fetchRows({ select: "nick,score,mode", limit: 2000 }))
        .filter(r => r.nick.trim().toLowerCase() === key);
    } catch { rows = []; }
  }
  return sumBestByGroup(rows, "mode");
}
