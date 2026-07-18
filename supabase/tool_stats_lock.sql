-- ─── Blindatura TOTALE del contatore (opzionale) ────────────────────────────
-- Di default l'incremento passa già dall'endpoint /api/ig-stats (controllo
-- d'origine + rate-limit), ma la RPC resta chiamabile con la anon key pubblica.
-- Per chiudere anche quella porta, l'incremento deve avvenire SOLO dal server
-- con la service-role.
--
-- PRIMA di lanciare questo file:
--   1) aggiungi su Vercel (Project → Settings → Environment Variables) la env
--      SUPABASE_SERVICE_ROLE_KEY = <service_role key di Supabase>  (NON pubblica)
--   2) rifai il deploy, così /api/ig-stats usa la service-role.
-- Poi lancia il revoke qui sotto: da quel momento la RPC NON è più chiamabile
-- dalla anon key, solo dal nostro server.
--
-- ⚠️ Se revochi SENZA aver messo la service-role, il contatore smette di
--    incrementarsi (l'endpoint userebbe ancora l'anon key, ora senza permessi).

revoke execute on function public.bump_tool_stat(text) from anon;
revoke execute on function public.bump_tool_stat(text) from public;
