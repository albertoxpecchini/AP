-- ============================================================================
-- Shooting · richieste di accesso alle foto
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → Run. È idempotente.
--
-- Cos'è: /shooting mostra a tutti le schede delle sessioni (data, luogo, quanti
-- scatti) ma non le foto. Chi vuole vederle compila un modulo — e serve un
-- codice che consegni tu a voce, quindi il modulo non è aperto al mondo. La
-- richiesta finisce qui, a te arriva un'email con chi ha chiesto e da dove, e
-- decidi con due bottoni. Se autorizzi, al richiedente arriva un link che vale
-- 24 ore.
--
-- PRIVACY / SICUREZZA
--   · La tabella è PRIVATA: RLS attiva SENZA policy per anon → la anon key
--     pubblica non la legge né la scrive. Passa solo la SERVICE_ROLE, che
--     vive nelle funzioni /api e non esce mai dal server.
--   · I token NON stanno qui in chiaro: in tabella c'è il loro SHA-256. Il
--     valore vero esiste solo dentro le due email. Chi leggesse la tabella non
--     potrebbe comunque né autorizzare né aprire un album.
--   · L'IP e il dispositivo di chi chiede NON vengono archiviati: finiscono
--     solo nell'email che ricevi tu (stessa linea di /api/notify e /api/d).
--   · I dati personali di chi chiede (nome, email, motivo) si cancellano da
--     soli dopo 30 giorni — il cron in /api/cron-cleanup.
-- ----------------------------------------------------------------------------

-- 1) Tabella
create table if not exists public.shooting_richieste (
  id                text        primary key,          -- slug nell'URL della decisione
  sessione          text        not null,             -- "s1", "s2", … (mai il nome della cartella)
  nome              text        not null,
  email             text        not null,
  rapporto          text,                             -- che rapporto ha con chi è ritratto
  motivo            text,
  stato             text        not null default 'in_attesa',
                                                      -- in_attesa | autorizzata | rifiutata | revocata
  -- SHA-256 dei token, mai i token. Vedi la nota sopra.
  admin_hash        text        not null,
  admin_scade_il    timestamptz not null default (now() + interval '7 days'),
  accesso_hash      text,
  accesso_scade_il  timestamptz,
  creata_il         timestamptz not null default now(),
  decisa_il         timestamptz,
  aperture          integer     not null default 0,
  ultima_apertura   timestamptz
);

create index if not exists shooting_richieste_accesso_idx on public.shooting_richieste (accesso_hash);
create index if not exists shooting_richieste_creata_idx  on public.shooting_richieste (creata_il);

-- Gli stati possibili sono quattro, e non è una convenzione: è un vincolo.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shooting_richieste_stato_ck') then
    alter table public.shooting_richieste
      add constraint shooting_richieste_stato_ck
      check (stato in ('in_attesa', 'autorizzata', 'rifiutata', 'revocata'));
  end if;
end $$;

-- 2) RLS attiva, NESSUNA policy: default-deny per anon. Solo service_role passa.
alter table public.shooting_richieste enable row level security;

-- ----------------------------------------------------------------------------
-- 3) Il secchio delle foto — da creare a mano, UNA volta
--
--    Supabase → Storage → New bucket
--      nome: scatti
--      Public bucket: NO  ← è tutto qui il punto
--
--    Dentro ci finiscono solo le sessioni che carichi tu, con
--      npm run scatti -- --carica s1
--    e solo le funzioni /api possono farsi dare un indirizzo firmato, che
--    scade in un'ora. Senza firma il bucket risponde 400: non c'è un URL da
--    indovinare.
--
--    Un bucket pubblico qui vanificherebbe tutto il resto del meccanismo.
-- ----------------------------------------------------------------------------
