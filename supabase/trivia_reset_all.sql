-- ============================================================================
-- Trivia — RESET TOTALE (one-shot)  ⚠️ IRREVERSIBILE ⚠️
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → incolla TUTTO → Run.
--
-- Azzera COMPLETAMENTE tutti i dati del gioco, per TUTTI gli account:
--   • trivia_grades   → pagelle (voti per capitolo × tipo)
--   • trivia_progress → progressi (domande viste/giuste, le "25/25")
--   • trivia_scores   → punteggi e classifica
--   • players         → i NOMI degli account registrati
--
-- Dopo il reset il gioco riparte come appena installato: nessun voto, nessun
-- progresso, classifica vuota, nessun nome memorizzato. `truncate` azzera anche
-- i contatori id (restart identity).
--
-- NB: NON tocca lo schema (tabelle, RPC, RLS restano). Solo i dati.
-- ----------------------------------------------------------------------------

truncate table
  public.trivia_grades,
  public.trivia_progress,
  public.trivia_scores,
  public.players
restart identity;

-- ----------------------------------------------------------------------------
-- VERIFICA (lancia dopo: devono essere TUTTI 0):
--   select 'grades'   as t, count(*) from public.trivia_grades
--   union all select 'progress', count(*) from public.trivia_progress
--   union all select 'scores',   count(*) from public.trivia_scores
--   union all select 'players',  count(*) from public.players;
-- ============================================================================
