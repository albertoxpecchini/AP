-- ─── Contatore confronti dello strumento "Compare Two Lists" ────────────────
-- Un'unica riga con un contatore globale, incrementato in modo atomico da una
-- RPC (così due utenti insieme non si sovrascrivono). Lettura pubblica, nessuna
-- scrittura diretta: si può solo incrementare via bump_tool_stat().
--
-- Applica una volta sola nel SQL editor di Supabase.

create table if not exists public.tool_stats (
  id         text primary key,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.tool_stats (id, count)
values ('instagram_compare', 0)
on conflict (id) do nothing;

-- Incremento atomico: crea la riga se manca, altrimenti +1, e ritorna il totale.
create or replace function public.bump_tool_stat(p_id text)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.tool_stats (id, count, updated_at)
  values (p_id, 1, now())
  on conflict (id) do update
    set count = tool_stats.count + 1, updated_at = now()
  returning count;
$$;

-- RLS: lettura pubblica, nessuna UPDATE/INSERT diretta dal client anon.
alter table public.tool_stats enable row level security;

drop policy if exists tool_stats_read on public.tool_stats;
create policy tool_stats_read on public.tool_stats
  for select using (true);

-- L'anon key può SOLO eseguire la RPC (che gira in security definer).
grant execute on function public.bump_tool_stat(text) to anon;

-- Aggiornamenti live via Realtime.
alter publication supabase_realtime add table public.tool_stats;
