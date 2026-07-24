-- ============================================================================
-- Link tracciabili "usa e getta" — wrapper di download che si auto-cancella
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → Run. È idempotente.
--
-- Cos'è: per ogni documento/URL che alleghi a un'email crei un link corto del
-- tipo  https://albertopecchini.it/d/<id> . Quando qualcuno lo apre, la funzione
-- /api/d registra SOLO il conteggio aperture (qui) e ti manda un'email con i
-- dettagli del "chi" (effimeri, non salvati). Dopo 7 giorni il link si cancella
-- da solo (cron giornaliero + cancellazione pigra alla prima apertura scaduta).
--
-- PRIVACY / SICUREZZA: questa tabella è PRIVATA. RLS è attiva SENZA policy per
-- anon → la anon key pubblica non la legge né la scrive. Tutto l'accesso passa
-- dalle funzioni /api con la SERVICE_ROLE (che bypassa RLS). Nessun dato del
-- destinatario finisce qui: solo il bersaglio del link e un contatore.
-- ----------------------------------------------------------------------------

-- 1) Tabella
create table if not exists public.tracked_links (
  id             text        primary key,            -- slug casuale nell'URL
  target_url     text        not null,               -- dove reindirizza (http/https)
  label          text,                               -- promemoria per te (oggetto email)
  storage_path   text,                               -- opz. "bucket/percorso" da cancellare a scadenza
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '7 days'),
  open_count     integer     not null default 0,
  last_opened_at timestamptz
);

create index if not exists tracked_links_expires_idx on public.tracked_links (expires_at);

-- 2) RLS attiva, NESSUNA policy: default-deny per anon. Solo service_role passa.
alter table public.tracked_links enable row level security;

-- ----------------------------------------------------------------------------
-- 3) (Facoltativo) Pulizia via pg_cron, alternativa al cron di Vercel.
--    Da abilitare solo se preferisci tenere tutto dentro Supabase:
--
--    create extension if not exists pg_cron;
--    select cron.schedule('purge-tracked-links', '0 3 * * *',
--      $$ delete from public.tracked_links where expires_at < now(); $$);
--
--    NB: pg_cron NON cancella gli oggetti in Storage (lo fa /api/cron-cleanup).
-- ----------------------------------------------------------------------------

-- Verifica (facoltativa):
-- select id, label, expires_at, open_count, last_opened_at from public.tracked_links order by created_at desc;
-- ============================================================================
