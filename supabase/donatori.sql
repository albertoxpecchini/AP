-- ============================================================================
-- Sostieni / Donazioni — Libro dei donatori e sponsor · setup Supabase (idempotente)
-- ============================================================================
-- Esegui tutto in: Supabase → SQL Editor → New query → Run.
-- Usa le STESSE chiavi (env condivise) dei giochi e della festa: non serve altro.
-- Una riga = una firma nel libro. tipo='donatore' (firma libera dopo il bonifico)
-- oppure tipo='sponsor' (chi prosegue per €4,99 via WhatsApp/email).
-- ----------------------------------------------------------------------------

-- 1) Tabella del libro dei donatori/sponsor
create table if not exists public.donatori (
  id         bigint generated always as identity primary key,
  nome       text not null check (char_length(nome) between 1 and 40),
  tipo       text not null default 'donatore' check (tipo in ('donatore','sponsor')),
  frequenza  text check (frequenza in ('tantum','settimanale','mensile')),
  importo    text check (char_length(importo) <= 20),
  messaggio  text check (char_length(messaggio) <= 280),
  link       text check (char_length(link) <= 200),
  created_at timestamptz not null default now()
);

-- 2) Indice per ordinare in fretta dal più recente (newest-first)
create index if not exists donatori_created_idx
  on public.donatori (created_at desc);

-- 3) Row Level Security: lettura + inserimento pubblici (no update/delete)
alter table public.donatori enable row level security;

-- Le policy non supportano "if not exists": le ricreo in modo sicuro.
drop policy if exists "leggi donatori"     on public.donatori;
drop policy if exists "inserisci donatore" on public.donatori;

create policy "leggi donatori"
  on public.donatori for select using (true);

create policy "inserisci donatore"
  on public.donatori for insert with check (true);

-- 4) Realtime: pubblica gli INSERT della tabella (libro live senza reload)
do $$
begin
  alter publication supabase_realtime add table public.donatori;
exception
  when duplicate_object then null;  -- già pubblicata: ok
end $$;

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa):
-- select * from pg_policies where tablename = 'donatori';
-- select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'donatori';
-- ============================================================================
