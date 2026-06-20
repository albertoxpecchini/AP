-- ============================================================================
-- Mappa — Classifica live · setup Supabase (idempotente, eseguibile più volte)
-- ============================================================================
-- Esegui tutto in: Supabase → SQL Editor → New query → Run.
-- Usa le STESSE chiavi di Trivia/Angoli/Parole (env condivise): non serve altro.
-- ----------------------------------------------------------------------------

-- 1) Tabella dei punteggi
create table if not exists public.mappa_scores (
  id          bigint generated always as identity primary key,
  nick        text   not null check (char_length(nick) <= 10),
  score       int    not null check (score >= 0),
  mode        text   not null,                 -- livello di difficoltà (es. "esploratore")
  accuracy    int    not null check (accuracy between 0 and 100),
  best_streak int    not null default 0,
  created_at  timestamptz not null default now()
);

-- 2) Indice per ordinare in fretta per punteggio decrescente
create index if not exists mappa_scores_score_idx
  on public.mappa_scores (score desc);

-- 3) Row Level Security: lettura + inserimento pubblici (no update/delete)
alter table public.mappa_scores enable row level security;

-- Le policy non supportano "if not exists": le ricreo in modo sicuro.
drop policy if exists "leggi classifica"   on public.mappa_scores;
drop policy if exists "inserisci punteggio" on public.mappa_scores;

create policy "leggi classifica"
  on public.mappa_scores for select using (true);

create policy "inserisci punteggio"
  on public.mappa_scores for insert with check (true);

-- 4) Realtime: pubblica gli INSERT della tabella (live senza reload)
do $$
begin
  alter publication supabase_realtime add table public.mappa_scores;
exception
  when duplicate_object then null;  -- già pubblicata: ok
end $$;

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa): righe attese 2 policy + tabella nella publication
-- select * from pg_policies where tablename = 'mappa_scores';
-- select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'mappa_scores';
-- ============================================================================
