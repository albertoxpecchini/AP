-- ============================================================================
-- Trivia — RIPARAZIONE progressi persi (one-shot)
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → incolla TUTTO → Run.
-- È IDEMPOTENTE (puoi rilanciarla): usa upsert, non duplica, non fa downgrade.
--
-- CONTESTO
--   • Bug "ultima risposta persa": finishGame salvava `played` STALE → 1 domanda
--     (l'ultima della partita) non finiva su trivia_progress. Già corretto nel
--     codice (playedRef). Qui ripariamo le righe GIÀ perse.
--   • Alcuni account hanno pagella ma progressi mancanti (es. "vero").
--
-- COSA RIPARA (solo dati CERTI — niente invenzioni):
--   1) Alberto · neoclassicismo-6  → la multipla persa di un 25/25 verificato.
--   2) vero · parigi-haussmann     → ricostruita dalla pagella "Urbanistica
--      dell'Ottocento" (argomento mappato a UN SOLO capitolo): V/F 10/10 e
--      multipla 6/10. Le 6 multiple giuste = le prime 6 (il conteggio combacia
--      ESATTAMENTE col voto; la pagella non dice QUALI, ma copertura e voto
--      ricalcolati restano identici).
--
-- COSA NON TOCCA (dati AMBIGUI → lasciati com'erano, per non falsare nulla):
--   • Le pagelle vecchie con arg_key = ARGOMENTO condiviso da più capitoli
--     ("movimento moderno", "architettura contemporanea"): impossibile sapere
--     QUALE capitolo fu completato (best_total=10 combacia con ognuno). NON si
--     ricostruisce: si rigiocherà il capitolo per registrarlo pulito.
-- ----------------------------------------------------------------------------

-- Helper: upsert "non distruttivo" di una riga progresso (ok in OR, seen=true).
-- Usa la stessa logica della RPC trivia_progress_record.
create or replace function public._repair_progress(
  p_nick text, p_id text, p_ok boolean
) returns void language plpgsql as $$
declare
  v_nick text := left(coalesce(p_nick,''), 10);
  v_key  text := lower(trim(coalesce(p_nick,'')));
begin
  if v_nick = '' or p_id is null or p_id = '' then return; end if;
  insert into public.trivia_progress (nick, nick_key, question_id, seen, ok, best_ms, updated_at)
  values (v_nick, v_key, p_id, true, p_ok, 0, now())
  on conflict (nick_key, question_id) do update set
    seen = true,
    ok   = trivia_progress.ok or excluded.ok,   -- mai downgrade
    updated_at = now();
end;
$$;

-- ── 1) Alberto · neoclassicismo: inserisci la multipla persa (-6), giusta ──
select public._repair_progress('Alberto', 'neoclassicismo-6', true);

-- ── 2) vero · parigi-haussmann: ricostruzione dalla pagella ──
--    V/F (idx 10–19): tutte viste e GIUSTE (best 10/10)
select public._repair_progress('vero', 'parigi-haussmann-' || g, true)
from generate_series(10, 19) g;
--    multipla (idx 0–9): tutte viste; 6 GIUSTE (le prime 6), 4 viste-ma-errate
select public._repair_progress('vero', 'parigi-haussmann-' || g, g < 6)
from generate_series(0, 9) g;
--    NB: le aperte (20–24) NON risultano in pagella per "vero" → non le tocco.

-- ── Pulizia: rimuovi l'helper temporaneo ──
drop function if exists public._repair_progress(text, text, boolean);

-- ----------------------------------------------------------------------------
-- VERIFICA (lancia separatamente dopo il Run):
--   select nick_key,
--          split_part(question_id,'-', case when question_id like 'parigi-%' then 2 else 1 end) as chap,
--          count(*) filter (where seen) seen, count(*) filter (where ok) ok
--     from public.trivia_progress
--    where question_id like 'neoclassicismo-%' or question_id like 'parigi-haussmann-%'
--    group by 1,2 order by 1,2;
-- Atteso:
--   alberto · neoclassicismo : seen 25, ok 25
--   vero    · parigi-haussmann: seen 20, ok 16   (10 V/F + 6 multiple giuste)
-- ============================================================================
