-- ============================================================================
-- Festa Alberto — Sondaggio presenze live · setup Supabase (idempotente)
-- ============================================================================
-- Esegui tutto in: Supabase → SQL Editor → New query → Run.
-- Usa le STESSE chiavi (env condivise) dei giochi: non serve altro.
-- Tabella delle adesioni alla festa (20 anni + diploma): nome, presenza, cibo.
-- ----------------------------------------------------------------------------

-- 1) Tabella delle presenze
create table if not exists public.festa_presenze (
  id         bigint generated always as identity primary key,
  nome       text not null check (char_length(nome) between 1 and 40),
  presenza   text not null check (presenza in ('pomeriggio','sera','no')),
  cibo       text check (char_length(cibo) <= 200),
  created_at timestamptz not null default now()
);

-- 2) Indice per ordinare in fretta dal più recente
create index if not exists festa_presenze_created_idx
  on public.festa_presenze (created_at desc);

-- 3) Row Level Security: lettura + inserimento pubblici (no update/delete)
alter table public.festa_presenze enable row level security;

-- Le policy non supportano "if not exists": le ricreo in modo sicuro.
drop policy if exists "leggi presenze"     on public.festa_presenze;
drop policy if exists "inserisci presenza" on public.festa_presenze;

create policy "leggi presenze"
  on public.festa_presenze for select using (true);

create policy "inserisci presenza"
  on public.festa_presenze for insert with check (true);

-- 4) Realtime: pubblica gli INSERT della tabella (live senza reload)
do $$
begin
  alter publication supabase_realtime add table public.festa_presenze;
exception
  when duplicate_object then null;  -- già pubblicata: ok
end $$;

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa):
-- select * from pg_policies where tablename = 'festa_presenze';
-- select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'festa_presenze';
-- ============================================================================
