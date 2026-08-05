-- ============================================================================
-- MiMa · lista alcolici da portare — condivisa e in diretta fra Pekko, Jonny e
-- Mok (13–17 agosto 2026, /mima).
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → Run. È idempotente.
-- Usa le STESSE env dei giochi e della festa: non serve altro.
--   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (lettura pubblica + realtime)
--   SUPABASE_SERVICE_ROLE_KEY                  (scritture, solo lato server)
--
-- Come funziona: la LETTURA è diretta e pubblica (serve al realtime via
-- WebSocket). Le SCRITTURE passano tutte da /api/mima-alcolici, che controlla
-- l'origine e mette un rate-limit — così la anon key pubblica non basta a
-- riempire o svuotare la lista di qualcuno.
-- ----------------------------------------------------------------------------

-- 1) Tabella
create table if not exists public.mima_alcolici (
  id         bigint generated always as identity primary key,
  chi        text        not null check (char_length(chi)  between 1 and 40),
  voce       text        not null check (char_length(voce) between 1 and 80),
  qta        text                 check (char_length(qta)  <= 30),
  note       text                 check (char_length(note) <= 200),
  preso      boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mima_alcolici_created_idx
  on public.mima_alcolici (created_at desc);

-- 2) Row Level Security
alter table public.mima_alcolici enable row level security;

drop policy if exists "leggi alcolici"     on public.mima_alcolici;
drop policy if exists "aggiungi alcolico"  on public.mima_alcolici;
drop policy if exists "spunta alcolico"    on public.mima_alcolici;
drop policy if exists "togli alcolico"     on public.mima_alcolici;

-- Lettura pubblica: serve al primo caricamento e al canale realtime.
create policy "leggi alcolici"
  on public.mima_alcolici for select using (true);

-- Insert / update / delete NON sono aperti all'anon: li fa la service-role
-- attraverso /api/mima-alcolici. Se preferisci tenerli aperti (nessun
-- endpoint, tutto dal client) scommenta le tre policy qui sotto — ma allora
-- chiunque conosca la pagina può anche cancellare.
-- create policy "aggiungi alcolico" on public.mima_alcolici for insert with check (true);
-- create policy "spunta alcolico"   on public.mima_alcolici for update using (true) with check (true);
-- create policy "togli alcolico"    on public.mima_alcolici for delete using (true);

-- 3) Realtime: la pagina ascolta INSERT, UPDATE e DELETE su questa tabella.
--    Serve anche `replica identity full`, altrimenti nel payload di DELETE
--    arriva solo la chiave primaria e la riga non si sa quale sia.
alter table public.mima_alcolici replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mima_alcolici'
  ) then
    alter publication supabase_realtime add table public.mima_alcolici;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa):
--   select * from pg_policies where tablename = 'mima_alcolici';
--   select * from pg_publication_tables where tablename = 'mima_alcolici';
-- ============================================================================
