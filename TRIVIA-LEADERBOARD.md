# Trivia — Classifica live (gratis con Supabase)

La classifica di **Trivia** (quiz sulla storia dell'architettura) è **condivisa tra
tutti i giocatori** e si aggiorna **in tempo reale** (i nuovi punteggi appaiono
senza ricaricare la pagina). Tutto sul **piano gratuito** di Supabase, con la
stessa infrastruttura di Angoli e Parole.

Se non configuri nulla, il gioco resta perfettamente funzionante: la classifica
gira in modalità **solo locale** (i punteggi vivono solo nel browser di chi gioca).

> Se hai **già** configurato Supabase per Angoli/Parole, le env sono le stesse:
> ti basta creare la tabella `trivia_scores` (passo 2) e abilitarne il Realtime
> (passo 3). Le chiavi del passo 4 sono condivise tra tutti i giochi.

---

## 1. Crea un progetto Supabase (gratis)

1. Vai su <https://supabase.com> → **Start your project** → accedi (GitHub va bene).
2. **New project** → scegli nome, password DB (qualsiasi), regione vicina. Free plan.
3. Aspetta ~1 minuto che il progetto sia pronto.

## 2. Crea la tabella + le policy

Nel progetto: **SQL Editor** → **New query** → incolla ed esegui:

```sql
-- Tabella dei punteggi del trivia
create table if not exists public.trivia_scores (
  id          bigint generated always as identity primary key,
  nick        text   not null check (char_length(nick) <= 10),
  score       int    not null check (score >= 0),
  chapter     text   not null,                 -- id capitolo (es. "gotico") o "all"
  accuracy    int    not null check (accuracy between 0 and 100),
  best_streak int    not null default 0,
  created_at  timestamptz not null default now()
);

-- Indice per ordinare in fretta per punteggio
create index if not exists trivia_scores_score_idx on public.trivia_scores (score desc);

-- Row Level Security: chiunque (anon) può LEGGERE e INSERIRE, niente update/delete
alter table public.trivia_scores enable row level security;

create policy "leggi classifica"   on public.trivia_scores for select using (true);
create policy "inserisci punteggio" on public.trivia_scores for insert with check (true);
```

> Le policy sono volutamente "aperte" in inserimento perché è un gioco pubblico
> senza login. Il client limita comunque nick a 10 caratteri, filtra le parolacce
> e arrotonda i punteggi. Per irrigidire si possono aggiungere check/rate-limit.

## 3. Abilita il Realtime sulla tabella

**Database** → **Replication** (o **Realtime**) → abilita la pubblicazione
`supabase_realtime` per la tabella `public.trivia_scores` (eventi **INSERT**).
In alternativa, via SQL:

```sql
alter publication supabase_realtime add table public.trivia_scores;
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

Riavvia `npm run dev`. Fatto: la classifica è live e condivisa. 🎓

---

## I contenuti: aggiungere domande (file .md)

Le domande vivono in **`content/trivia/*.md`**, **un file = un capitolo**. Per
aggiungere/modificare domande basta toccare il testo: il parser le converte al
build (`npm run build`) e se trova un errore di formato fa fallire il build con
un messaggio chiaro (es. `[trivia] gotico.md · Domanda 3: ...`).

Schema di ogni domanda (vedi gli esempi `content/trivia/gotico.md` e
`rinascimento.md`):

```markdown
# Titolo del Capitolo

## Domanda
type: multipla
Testo della domanda?
- [ ] opzione errata
- [x] opzione corretta
- [ ] altra opzione
> Spiegazione: testo opzionale

## Domanda
type: vero-falso
Affermazione da valutare.
risposta: vero            # oppure: falso
> Spiegazione: opzionale

## Domanda
type: aperta
Domanda a risposta libera?
risposta: risposta canonica
accetta: variante 1; variante 2   # opzionale, varianti separate da ;
foto: query foto opzionale        # opzionale, override della keyword foto
> Spiegazione: opzionale
```

Regole: `type` ∈ `multipla | vero-falso | aperta`. Multipla → almeno 2 opzioni con
**esattamente una** `- [x]`. Le domande **aperte** accettano la risposta canonica
e le varianti in `accetta`, ignorando maiuscole/accenti/spazi e con piccola
tolleranza ai refusi.

---

## Come funziona nel codice (niente SDK)

- `src/app/trivia/leaderboardApi.ts` parla con Supabase via **REST** (`fetch`) per
  leggere/scrivere e via **WebSocket Realtime** (protocollo Phoenix) per gli
  aggiornamenti live. Nessuna dipendenza npm aggiunta.
- `submitScore()` invia il punteggio a fine partita (nick, punti, capitolo,
  accuratezza %, miglior streak). `fetchTop()` carica i migliori, filtrabili per
  capitolo. `subscribeToScores()` riceve i nuovi inserimenti live.
- `src/app/trivia/coverage.ts` traccia in `localStorage` (chiave `trivia-seen`)
  quante domande uniche hai già visto, per la **percentuale di db esplorato**.
- Senza env configurate, `leaderboardConfigured === false` e tutto ricade su
  `localStorage` (chiave `trivia-scores-local`).

## Privacy / sicurezza

- La anon key è **pensata per stare nel client**: non è un segreto. La sicurezza
  vera è data dalle **policy RLS** (qui: lettura + inserimento pubblici).
- Le foto provengono dall'API pubblica di Wikipedia (licenze libere) e sono
  caricate lato client; nessun dato personale viene inviato a terzi.
- Nessun dato personale: solo nickname scelto dal giocatore (max 10 caratteri,
  filtrato), punteggio, capitolo, accuratezza, timestamp.
```
