// ─── Leaderboard Parole — wrapper sul motore condiviso (src/app/_game) ───────
//
// Schema tabella (SQL in PAROLE-LEADERBOARD.md): parole_scores
//   id, nick, score, mode (ModeId: "5-normale"|"5-sfida"|"6-normale"|"6-sfida"),
//   best_streak, created_at
//
// Per Parole si gioca sul TEMPO (più basso = migliore). Per restare coerenti col
// vincolo "ordinamento sempre decrescente" (query order=score.desc condivisa),
// salviamo un valore DERIVATO decrescente: score = max(0, SCORE_BASE - secondi).
// In classifica si mostra il tempo reale = SCORE_BASE - score.
import { createScoreApi, sumBestByGroup, leaderboardConfigured } from "../_game/leaderboardApi";
export { leaderboardConfigured } from "../_game/leaderboardApi";
export type { Unsubscribe } from "../_game/leaderboardApi";

export interface ScoreRow {
  id?: number;
  nick: string;
  score: number;
  mode: string;        // ModeId della modalità Parole
  best_streak: number;
  created_at?: string;
}

// Base per derivare lo score decrescente dal tempo (in secondi). 600s = 10 min.
export const SCORE_BASE = 600;
export const scoreFromSeconds = (s: number) => Math.max(0, SCORE_BASE - Math.round(s));
export const secondsFromScore = (score: number) => Math.max(0, SCORE_BASE - Math.round(score));

const api = createScoreApi<ScoreRow>({
  table: "parole_scores",
  localKey: "parole-scores-local",
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
