# Angoli — Classifica live (gratis con Supabase)

La classifica di Angoli è **condivisa tra tutti i giocatori** e si aggiorna **in
tempo reale** (i nuovi punteggi appaiono senza ricaricare la pagina). Tutto questo
sul **piano gratuito** di Supabase.

Se non configuri nulla, il gioco resta perfettamente funzionante: la classifica
gira in modalità **solo locale** (i punteggi vivono solo nel browser di chi gioca).

---

## 1. Crea un progetto Supabase (gratis)

1. Vai su <https://supabase.com> → **Start your project** → accedi (GitHub va bene).
2. **New project** → scegli nome, password DB (qualsiasi), regione vicina. Free plan.
3. Aspetta ~1 minuto che il progetto sia pronto.

## 2. Crea la tabella + le policy

Nel progetto: **SQL Editor** → **New query** → incolla ed esegui:

```sql
-- Tabella dei punteggi
create table if not exists public.angoli_scores (
  id          bigint generated always as identity primary key,
  nick        text   not null check (char_length(nick) <= 10),
  score       int    not null check (score >= 0),
  mode        int    not null,
  best_streak int    not null default 0,
  created_at  timestamptz not null default now()
);

-- Indice per ordinare in fretta per punteggio
create index if not exists angoli_scores_score_idx on public.angoli_scores (score desc);

-- Row Level Security: chiunque (anon) può LEGGERE e INSERIRE, niente update/delete
alter table public.angoli_scores enable row level security;

create policy "leggi classifica"  on public.angoli_scores for select using (true);
create policy "inserisci punteggio" on public.angoli_scores for insert with check (true);
```

> Le policy sono volutamente "aperte" in inserimento perché è un gioco pubblico
> senza login. Il client limita comunque nick a 10 caratteri, filtra le parolacce
> e arrotonda i punteggi. Per irrigidire si possono aggiungere check/rate-limit.

## 3. Abilita il Realtime sulla tabella

**Database** → **Replication** (o **Realtime**) → abilita la pubblicazione
`supabase_realtime` per la tabella `public.angoli_scores` (eventi **INSERT**).
In alternativa, via SQL:

```sql
alter publication supabase_realtime add table public.angoli_scores;
```

## 4. Copia le chiavi pubbliche nel progetto

In Supabase: **Project Settings** → **API**. Copia:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

Crea un file `.env` (o `.env.local`) nella root del progetto (vedi `.env.example`):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Riavvia `npm run dev`. Fatto: la classifica è live e condivisa. 🎉

---

## Come funziona nel codice (niente SDK)

- `src/app/angoli/leaderboardApi.ts` parla con Supabase via **REST** (`fetch`) per
  leggere/scrivere e via **WebSocket Realtime** (protocollo Phoenix) per gli
  aggiornamenti in tempo reale. Nessuna dipendenza npm aggiunta.
- `submitScore()` invia il punteggio a fine minuto. `fetchTop()` carica i migliori.
  `subscribeToScores()` riceve i nuovi inserimenti live.
- Senza env configurate, `leaderboardConfigured === false` e tutto ricade su
  `localStorage` (chiave `angoli-scores-local`).

## Privacy / sicurezza

- La anon key è **pensata per stare nel client**: non è un segreto. La sicurezza
  vera è data dalle **policy RLS** (qui: lettura + inserimento pubblici).
- Nessun dato personale: solo nickname scelto dal giocatore (max 10 caratteri,
  filtrato), punteggio, modalità, timestamp.
