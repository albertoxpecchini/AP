-- ============================================================================
-- Account giocatori — "login col nome" condiviso fra Trivia / Angoli / Parole
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → Run. È idempotente.
-- Usa le STESSE chiavi (env condivise) dei giochi: non serve altro.
--
-- Cos'è: un "account leggero" senza password. Scegliendo un nome viene creato
-- un record qui; da qualunque dispositivo basta riselezionare il nome dalla
-- lista per "loggarsi". Il nome è UNICO (case-insensitive).
-- ----------------------------------------------------------------------------

-- 1) Tabella giocatori
create table if not exists public.players (
  id         bigint generated always as identity primary key,
  nick       text   not null check (char_length(nick) <= 10),
  nick_key   text   not null,                 -- nick normalizzato (lower) per unicità
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

-- Unicità case-insensitive sul nome
create unique index if not exists players_nick_key_uidx
  on public.players (nick_key);

-- 2) Row Level Security: lettura pubblica + insert/update pubblici (no delete)
alter table public.players enable row level security;

drop policy if exists "leggi giocatori"     on public.players;
drop policy if exists "crea giocatore"       on public.players;
drop policy if exists "aggiorna giocatore"   on public.players;

create policy "leggi giocatori"
  on public.players for select using (true);

create policy "crea giocatore"
  on public.players for insert with check (true);

create policy "aggiorna giocatore"
  on public.players for update using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa):
-- select * from pg_policies where tablename = 'players';
-- ============================================================================
