-- ============================================================================
-- Trivia — Pagella per argomento (voti per argomento × tipo, record + ultimo)
-- ============================================================================
-- Esegui in: Supabase → SQL Editor → New query → Run. È idempotente.
-- Usa le STESSE chiavi (env condivise) dei giochi: non serve altro.
--
-- Modello: un voto per (nick, argomento, tipo di domanda). Per ogni pacchetto
-- teniamo SIA il record (miglior accuracy di sempre) SIA l'ultimo risultato, con
-- i tempi (somma dei ms delle domande di quel pacchetto). La UI mostra il record
-- e, se l'ultimo è diverso, la differenza in punti percentuali (+%/−%).
--
-- Un pacchetto viene votato solo se completato al 100% in una partita (logica
-- lato client, vedi packageGrades.ts). Qui si limita a conservare i risultati.
-- ----------------------------------------------------------------------------

-- 1) Tabella voti per pacchetto
create table if not exists public.trivia_grades (
  id             bigint generated always as identity primary key,
  nick           text not null check (char_length(nick) <= 10),
  nick_key       text not null,                       -- nick normalizzato (lower)
  arg_key        text not null,                       -- argomento normalizzato (lower/trim)
  argomento      text not null,                       -- argomento leggibile
  type           text not null,                       -- 'multipla' | 'vero-falso' | 'aperta'

  -- Record (migliore di sempre)
  best_accuracy  int  not null check (best_accuracy between 0 and 100),
  best_correct   int  not null default 0,
  best_total     int  not null default 0,
  best_ms        int  not null default 0,             -- tempo del pacchetto nella partita-record
  best_at        timestamptz not null default now(),

  -- Ultimo risultato ottenuto
  last_accuracy  int  not null check (last_accuracy between 0 and 100),
  last_correct   int  not null default 0,
  last_total     int  not null default 0,
  last_ms        int  not null default 0,
  last_at        timestamptz not null default now(),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Unicità: un solo voto per (giocatore, argomento, tipo)
create unique index if not exists trivia_grades_uidx
  on public.trivia_grades (nick_key, arg_key, type);

create index if not exists trivia_grades_nick_idx
  on public.trivia_grades (nick_key);

-- 2) RLS: lettura pubblica + insert/update pubblici (no delete)
alter table public.trivia_grades enable row level security;

drop policy if exists "leggi voti"     on public.trivia_grades;
drop policy if exists "crea voto"       on public.trivia_grades;
drop policy if exists "aggiorna voto"   on public.trivia_grades;

create policy "leggi voti"
  on public.trivia_grades for select using (true);
create policy "crea voto"
  on public.trivia_grades for insert with check (true);
create policy "aggiorna voto"
  on public.trivia_grades for update using (true) with check (true);

-- 3) Funzione RPC: registra un risultato di pacchetto in modo ATOMICO.
--    Aggiorna sempre last_*; aggiorna best_* solo se la nuova accuracy è ≥ del
--    record (a parità, vince il tempo minore). Crea la riga se non esiste.
create or replace function public.trivia_grade_record(
  p_nick     text,
  p_arg_key  text,
  p_arg      text,
  p_type     text,
  p_correct  int,
  p_total    int,
  p_ms       int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick text := left(coalesce(p_nick, ''), 10);
  v_key  text := lower(trim(coalesce(p_nick, '')));
  v_acc  int  := case when p_total > 0
                      then round((p_correct::numeric / p_total) * 100)::int
                      else 0 end;
  v_ms   int  := greatest(0, coalesce(p_ms, 0));
begin
  if v_nick = '' or coalesce(p_total, 0) <= 0 then
    return;
  end if;

  insert into public.trivia_grades (
    nick, nick_key, arg_key, argomento, type,
    best_accuracy, best_correct, best_total, best_ms, best_at,
    last_accuracy, last_correct, last_total, last_ms, last_at,
    updated_at
  ) values (
    v_nick, v_key, p_arg_key, p_arg, p_type,
    v_acc, p_correct, p_total, v_ms, now(),
    v_acc, p_correct, p_total, v_ms, now(),
    now()
  )
  on conflict (nick_key, arg_key, type) do update set
    nick      = excluded.nick,
    argomento = excluded.argomento,
    -- ultimo: sempre
    last_accuracy = excluded.last_accuracy,
    last_correct  = excluded.last_correct,
    last_total    = excluded.last_total,
    last_ms       = excluded.last_ms,
    last_at       = now(),
    updated_at    = now(),
    -- record: solo se migliora (accuracy maggiore, o pari accuracy ma più veloce)
    best_accuracy = case
      when excluded.last_accuracy > trivia_grades.best_accuracy
        or (excluded.last_accuracy = trivia_grades.best_accuracy
            and excluded.last_ms < trivia_grades.best_ms)
      then excluded.last_accuracy else trivia_grades.best_accuracy end,
    best_correct = case
      when excluded.last_accuracy > trivia_grades.best_accuracy
        or (excluded.last_accuracy = trivia_grades.best_accuracy
            and excluded.last_ms < trivia_grades.best_ms)
      then excluded.last_correct else trivia_grades.best_correct end,
    best_total = case
      when excluded.last_accuracy > trivia_grades.best_accuracy
        or (excluded.last_accuracy = trivia_grades.best_accuracy
            and excluded.last_ms < trivia_grades.best_ms)
      then excluded.last_total else trivia_grades.best_total end,
    best_ms = case
      when excluded.last_accuracy > trivia_grades.best_accuracy
        or (excluded.last_accuracy = trivia_grades.best_accuracy
            and excluded.last_ms < trivia_grades.best_ms)
      then excluded.last_ms else trivia_grades.best_ms end,
    best_at = case
      when excluded.last_accuracy > trivia_grades.best_accuracy
        or (excluded.last_accuracy = trivia_grades.best_accuracy
            and excluded.last_ms < trivia_grades.best_ms)
      then now() else trivia_grades.best_at end;
end;
$$;

-- Permessi: l'utente anonimo (anon) può chiamare la funzione.
grant execute on function public.trivia_grade_record(text, text, text, text, int, int, int) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Verifica (facoltativa):
-- select * from pg_policies where tablename = 'trivia_grades';
-- select * from public.trivia_grades order by updated_at desc;
-- ============================================================================
