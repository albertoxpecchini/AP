-- ============================================================================
-- Trivia — Progresso per singola domanda (per ACCOUNT, sincronizzato)
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → Run. È idempotente.
-- Usa le STESSE env condivise (anon key) degli altri giochi.
--
-- Scopo: rendere la COPERTURA (25/25 per capitolo) e il "best per domanda"
-- legati al NOME dell'account (non al dispositivo). Così:
--   • ogni account ha i SUOI progressi, niente mischiamento tra giocatori;
--   • i progressi si vedono da qualunque dispositivo;
--   • la pagella può votare cumulativamente (giuste a tutte le domande del tipo).
--
-- Modello: una riga per (nick_key, question_id). `ok` = indovinata almeno una
-- volta; `best_ms` = miglior tempo su risposta giusta; `seen` = incontrata.
-- ----------------------------------------------------------------------------

create table if not exists public.trivia_progress (
  nick        text not null check (char_length(nick) <= 10),
  nick_key    text not null,                 -- nick normalizzato (lower/trim)
  question_id text not null,                 -- id stabile "<capitolo>-<indice>"
  seen        boolean not null default true, -- incontrata in partita
  ok          boolean not null default false,-- indovinata almeno una volta
  best_ms     int     not null default 0,    -- miglior tempo su risposta giusta
  updated_at  timestamptz not null default now(),
  primary key (nick_key, question_id)
);

create index if not exists trivia_progress_nick_idx
  on public.trivia_progress (nick_key);

-- RLS: lettura + insert + update pubblici (no delete)
alter table public.trivia_progress enable row level security;

drop policy if exists "leggi progresso"    on public.trivia_progress;
drop policy if exists "crea progresso"      on public.trivia_progress;
drop policy if exists "aggiorna progresso"  on public.trivia_progress;

create policy "leggi progresso"
  on public.trivia_progress for select using (true);
create policy "crea progresso"
  on public.trivia_progress for insert with check (true);
create policy "aggiorna progresso"
  on public.trivia_progress for update using (true) with check (true);

-- RPC: registra in BULK gli esiti di una partita (atomico). `p_rows` è un JSON
-- array di { id, ok, ms }. Tiene seen=true, ok in OR (una volta giusta = giusta),
-- best_ms = minimo tra i tempi delle risposte giuste.
create or replace function public.trivia_progress_record(
  p_nick text,
  p_rows jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick text := left(coalesce(p_nick, ''), 10);
  v_key  text := lower(trim(coalesce(p_nick, '')));
  r       jsonb;
  v_id    text;
  v_ok    boolean;
  v_ms    int;
begin
  if v_nick = '' or p_rows is null then
    return;
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    v_id := r->>'id';
    v_ok := coalesce((r->>'ok')::boolean, false);
    v_ms := greatest(0, coalesce((r->>'ms')::int, 0));
    if v_id is null or v_id = '' then
      continue;
    end if;

    insert into public.trivia_progress (nick, nick_key, question_id, seen, ok, best_ms, updated_at)
    values (v_nick, v_key, v_id, true, v_ok, case when v_ok then v_ms else 0 end, now())
    on conflict (nick_key, question_id) do update set
      nick       = excluded.nick,
      seen       = true,
      ok         = trivia_progress.ok or excluded.ok,
      best_ms    = case
                     when excluded.ok and (not trivia_progress.ok or excluded.best_ms < trivia_progress.best_ms or trivia_progress.best_ms = 0)
                       then excluded.best_ms
                     else trivia_progress.best_ms end,
      updated_at = now();
  end loop;
end;
$$;

grant execute on function public.trivia_progress_record(text, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa):
-- select nick, count(*) filter (where seen) seen, count(*) filter (where ok) ok
--   from public.trivia_progress group by nick;
-- ============================================================================
