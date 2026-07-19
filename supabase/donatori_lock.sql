-- ─── Blindatura firme sostieni (donatori) ───────────────────────────────────
-- Le firme ora si inseriscono SOLO dal server (/api/sponsor, service-role).
-- Qui togliamo all'anon la possibilità di inserire direttamente con la anon key
-- pubblica. La LETTURA pubblica del libro resta invariata.
--
-- PRIMA di lanciare:
--   1) su Vercel dev'esserci SUPABASE_SERVICE_ROLE_KEY (già aggiunta).
--   2) dev'essere fatto il deploy con /api/sponsor attivo.
--   3) verifica che una firma dal sito funzioni (usa la service-role).
-- ⚠️ Se revochi PRIMA, e l'endpoint sta usando l'anon key, le firme si bloccano.

revoke insert on public.donatori from anon;
revoke insert on public.donatori from authenticated;

-- Se le firme fossero gestite da una policy RLS di INSERT per anon, rimuovila:
-- (adatta il nome se diverso; ignora l'errore se non esiste)
-- drop policy if exists donatori_insert on public.donatori;
