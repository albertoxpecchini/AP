# Parole — Classifica live (gratis con Supabase)

La classifica di Parole è **condivisa tra tutti i giocatori** e si aggiorna **in
tempo reale** (i nuovi punteggi appaiono senza ricaricare la pagina). Identica
infrastruttura di Angoli: **riusa lo stesso progetto Supabase** (stesse env), cambia
solo la tabella (`parole_scores`).

Se non configuri nulla, il gioco resta perfettamente funzionante: la classifica
gira in modalità **solo locale** (i punteggi vivono solo nel browser di chi gioca).

> **Punteggio = tempo.** In Parole vince chi risolve **più in fretta**. Per restare
> coerenti col vincolo "ordinamento sempre decrescente", salviamo un valore
> derivato `score = max(0, 600 - secondi)`: chi ha lo `score` più alto ha il tempo
> più basso. In classifica viene mostrato il **tempo reale** (`600 - score`).

---

## 1. Progetto Supabase

Se hai già configurato la classifica di Angoli, **non serve un nuovo progetto**:
usa lo stesso, aggiungi solo la tabella di Parole (passo 2). Le env sono le stesse.

Altrimenti crea un progetto gratuito su <https://supabase.com> → **New project**.

## 2. Crea la tabella + le policy

Nel progetto: **SQL Editor** → **New query** → incolla ed esegui:

```sql
-- Tabella dei punteggi di Parole
create table if not exists public.parole_scores (
  id          bigint generated always as identity primary key,
  nick        text   not null check (char_length(nick) <= 10),
  score       int    not null check (score >= 0),
  mode        text   not null,   -- ModeId: "5-normale" | "5-sfida" | "6-normale" | "6-sfida"
  best_streak int    not null default 0,
  created_at  timestamptz not null default now()
);

-- Indice per ordinare in fretta per punteggio
create index if not exists parole_scores_score_idx on public.parole_scores (score desc);

-- Row Level Security: chiunque (anon) può LEGGERE e INSERIRE, niente update/delete
alter table public.parole_scores enable row level security;

create policy "leggi classifica"  on public.parole_scores for select using (true);
create policy "inserisci punteggio" on public.parole_scores for insert with check (true);
```

> Le policy sono volutamente "aperte" in inserimento perché è un gioco pubblico
> senza login. Il client limita comunque nick a 10 caratteri, filtra le parolacce
> e arrotonda i punteggi.

## 3. Abilita il Realtime sulla tabella

**Database** → **Replication** (o **Realtime**) → abilita la pubblicazione
`supabase_realtime` per la tabella `public.parole_scores` (eventi **INSERT**).
In alternativa, via SQL:

```sql
alter publication supabase_realtime add table public.parole_scores;
```

## 4. Env (le stesse di Angoli)

In Supabase: **Project Settings** → **API**. Copia **Project URL** e **anon public**
key nel file `.env` / `.env.local` (vedi `.env.example`):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Riavvia `npm run dev`. Fatto: la classifica di Parole è live e condivisa. 🎉

---

## Come funziona nel codice (niente SDK)

- `src/app/parole/leaderboardApi.ts` parla con Supabase via **REST** (`fetch`) e
  via **WebSocket Realtime** (protocollo Phoenix). Stessa logica di Angoli.
- `submitScore()` invia il punteggio a fine partita vinta. `fetchTop()` carica i
  migliori. `subscribeToScores()` riceve i nuovi inserimenti live.
- Senza env configurate, `leaderboardConfigured === false` e tutto ricade su
  `localStorage` (chiave `parole-scores-local`).

## Privacy / sicurezza

- La anon key è **pensata per stare nel client**: non è un segreto. La sicurezza
  vera è data dalle **policy RLS** (qui: lettura + inserimento pubblici).
- Nessun dato personale: solo nickname scelto dal giocatore (max 10 caratteri,
  filtrato), punteggio, modalità, timestamp.
