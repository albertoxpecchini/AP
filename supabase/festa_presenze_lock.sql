-- ─── Blindatura RSVP festa (festa_presenze) ─────────────────────────────────
-- Le presenze ora si inseriscono SOLO dal server (/api/festa-rsvp, service-role).
-- Qui togliamo all'anon l'insert diretto con la anon key pubblica. La LETTURA
-- pubblica della lista resta invariata (RLS select using(true)).
--
-- PRIMA di lanciare:
--   1) su Vercel dev'esserci SUPABASE_SERVICE_ROLE_KEY (già aggiunta).
--   2) dev'essere fatto il deploy con /api/festa-rsvp attivo.
--   3) verifica che un RSVP dal sito funzioni.
-- ⚠️ Se revochi PRIMA, e l'endpoint usa ancora l'anon key, gli RSVP si bloccano.

revoke insert on public.festa_presenze from anon;
revoke insert on public.festa_presenze from authenticated;

-- Se esiste una policy RLS di INSERT per anon, rimuovila:
-- drop policy if exists festa_presenze_insert on public.festa_presenze;
