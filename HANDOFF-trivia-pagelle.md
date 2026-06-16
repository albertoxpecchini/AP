# Handoff — Fix Trivia: pagelle, statistiche, record per account

Data: 2026-06-16
Branch: `main`

---

## 1. Problema riportato dall'utente

Cambiando account nel gioco Trivia (online/Supabase):

- **Miglior voto**, **Streak record**, **DB esplorato** risultano UGUALI per tutti gli account.
- I **progressi dei capitoli** invece sono correttamente individuali per account. ✅
- Le **pagelle** non si aggiornano correttamente:
  - Account "vero": il voto delle domande Vero/Falso mostra il voto delle Risposte Multiple.
  - Account "alberto": le Risposte Multiple non sembrano valutate.
- Esempio concreto: completata l'unità **"Marsiglia" 25/25** (tutte corrette) → **NON compare in pagella**. In statistiche compare "Miglior voto: 24" invece di 25.

Sospetto dell'utente: dati letti da localStorage/cache invece che dal DB dell'account.

---

## 2. Diagnosi REALE (la causa NON è il localStorage cross-account)

Tutte le letture sono già filtrate per `nick`/`nick_key` correttamente:
- `progressApi.ts` → legge da `trivia_progress` per `nick_key`. ✅ (per questo i capitoli funzionano)
- `gradesApi.ts` → legge da `trivia_grades` per `nick_key`. ✅
- `fetchPlayerBests` (`leaderboardApi.ts`) → filtra `trivia_scores` per nick lato client. ✅

### Causa radice n.1 — pacchetti raggruppati per ARGOMENTO condiviso (BUG PRINCIPALE)

Il voto della pagella è un "pacchetto" = `(argomento × tipo)`, con chiave
`` `${argomento} ${type}` `` in:
- `src/app/trivia/questionStats.ts` → `cumulativePackageGrades` (autorevole, salvato su DB)
- `src/app/trivia/packageGrades.ts` → `computePackageGrades` (schermata risultati)

MA **molti capitoli condividono lo stesso `argomento`** (vedi
`content/trivia/*.md`, header `argomento:`):
- "Movimento moderno": `unite-marsiglia`, `movimento-moderno`, `ronchamp`, `padiglione-barcellona` (4 unità)
- "Architettura contemporanea": 8 unità
- "Modernismo catalano": 4 unità
- + "Architettura del ferro", "Architettura organica", "Razionalismo italiano",
  "Art Nouveau", "Neoclassicismo", "Eclettismo", "Architettura high-tech" (tutti duplicati)

Inoltre `parseTrivia.ts:142`: se l'header non ha `argomento:`, usa il titolo del capitolo.
E l'argomento è ereditato UGUALE da tutte le domande del capitolo.

**Conseguenza**: completando solo Marsiglia (10 multiple), il pacchetto
"Movimento moderno · multipla" contiene le multiple di tutti e 4 i capitoli (~40 domande)
→ `seenCount(10) < total(40)` → pacchetto MAI votabile → **niente voto in pagella**.
Questo spiega TUTTI i sintomi delle pagelle (incluso "V/F mostra il voto delle multiple":
celle miste cross-capitolo).

### Causa radice n.2 — "Miglior voto: 24" invece di 25

`fetchPlayerBests` legge `accuracy` da `trivia_scores`, che è la precisione della
PARTITA INTERA (tutti i tipi mischiati, salvata in `Trivia.tsx:272`), non del pacchetto.
→ **Decisione utente: LASCIARE COM'È** (consapevole che non coinciderà con le pagelle).

### Causa radice n.3 — statistiche "appiccicate" al cambio account

`Trivia.tsx:95-105`: l'effetto che ricarica `bestStreak`/`bestGrade`/`progress`
dipende solo da `[nick]` ed è async con `.catch(() => {})` che NON resetta lo stato.
Se la fetch del nuovo account fallisce/è vuota, restano i valori vecchi a schermo.
→ **DA SISTEMARE** (vedi punto 5).

---

## 3. Decisioni prese con l'utente (via AskUserQuestion)

1. **Granularità voto = PER UNITÀ/CAPITOLO** (non per argomento).
   → Chiave pacchetto deve diventare `(chapterId × tipo)`.
2. **Miglior voto = resta dalla miglior partita (com'è ora).** Nessuna modifica a `fetchPlayerBests`.

---

## 4. Strategia di implementazione scelta

Usare il **capitolo** come chiave dei pacchetti, RIUSANDO le colonne DB esistenti
(niente migrazione di schema/RPC):
- `arg_key` (DB) ← ci si mette il `chapterId` (es. "unite-marsiglia")
- `argomento` (DB, etichetta) ← ci si mette il **titolo del capitolo** (es. "Unità di abitazione di Marsiglia")

Così la pagella mostra una riga per capitolo e i voti non collassano più.
I dati storici (aggregati per argomento) restano come righe "fantasma" nel DB:
problema di dati, non di codice — opzionale ripulirli (vedi punto 6).

---

## 5. STATO LAVORO — ✅ COMPLETATO (2026-06-16)

Tutti i punti chiusi. La chiave dei pacchetti è ora il **capitolo** (`chapterId`),
non l'argomento condiviso. Build `npm run build` OK.

1. ✅ **`packageGrades.ts`** — interface `PackageGrade.chapterId` + NUL byte rimosso +
   `computePackageGrades` ora `keyOf(chapterId,type)`, etichetta = `q.chapter`.
2. ✅ **`questionStats.ts`** — `cumulativePackageGrades` (autorevole, salvata su DB) ora
   `keyOf(chapterId,type)`, etichetta = `c.title`, emette `chapterId`.
3. ✅ **`gradesApi.ts`** — `saveGrades` usa `p_arg_key = argKey(p.chapterId)`,
   `p_arg = p.argomento` (titolo). `recordLocal` e `fetchSubject` aggiornati alla
   chiave-capitolo. `argKey` ora documentata come "slug del capitolo".
4. ✅ **`SubjectBadge.tsx`** — prende `chapterId` + `label` (non più `argomento`);
   `Trivia.tsx` passa `current.chapterId` / `current.chapter`.
5. ✅ **`Trivia.tsx`** — reset SUBITO di `progress/bestStreak/bestGrade` al cambio nick.
6. ⏭️ Pulizia dati storici Supabase: NON necessaria. Il backfill (sotto) ignora le righe
   storiche per-argomento (`arg_key`/`best_total` non combaciano con nessun capitolo×tipo).

### Extra richiesti dall'utente — ✅ fatti

- **Voto immediato in pagella**: `finishGame` salva i pacchetti completati appena finito il
  quiz (`cumulativePackageGrades(optimistic)`) senza aspettare il giro su Supabase.
- **Recupero progressi dalle pagelle**: `backfillProgressFromGrades` (in `questionStats.ts`)
  ricostruisce le domande viste/giuste dai voti già esistenti (`fetchGradeRows`) e li
  ri-salva su `trivia_progress`. Caricato all'avvio account in `Trivia.tsx`. Dati coerenti
  con la pagella (mai downgrade, mai sovrascrive un "ok" reale).
- **Progressi 0/25 → 25/25 come iconcina grande**: `progressRing` in `TriviaMenu.tsx` ora è
  una pastiglia col numero GRANDE (`.trm-progbadge`), verde mentre esplori / viola a 100%.

---

## 6. Diff voluto per `computePackageGrades` (riferimento, punto 1 sopra)

```ts
// Chiave = CAPITOLO + tipo (NON argomento: condiviso da più capitoli).
const keyOf = (chapterId: string, type: QType) => `${chapterId} ${type}`;

// in computePackageGrades:
for (const q of pool) {
  const k = keyOf(q.chapterId, q.type);
  totalByKey.set(k, (totalByKey.get(k) || 0) + 1);
}

type Agg = { chapterId: string; label: string; type: QType; played: number; correct: number; ms: number };
// ...
const k = keyOf(q.chapterId, q.type);
let a = aggByKey.get(k);
if (!a) { a = { chapterId: q.chapterId, label: q.chapter, type: q.type, played: 0, correct: 0, ms: 0 }; aggByKey.set(k, a); }
// ...
out.push({ chapterId: a.chapterId, argomento: a.label, type: a.type, correct: a.correct, total, accuracy, grade: gradeFromPct(accuracy), ms: a.ms });
```

---

## 7. File coinvolti (mappa rapida)

| File | Ruolo | Stato |
|---|---|---|
| `src/app/trivia/packageGrades.ts` | tipo `PackageGrade` + voti risultati | interface fatta; `computePackageGrades` DA FARE; NUL byte rimosso |
| `src/app/trivia/questionStats.ts` | `cumulativePackageGrades` (DB autorevole) | DA FARE — priorità |
| `src/app/trivia/gradesApi.ts` | save/fetch pagella su Supabase | DA FARE (saveGrades + fetchSubject + recordLocal) |
| `src/app/trivia/Pagella.tsx` | UI pagella | probabilmente OK (mostra `argomento` = etichetta) |
| `src/app/trivia/SubjectBadge.tsx` | badge voto in-quiz | DA FARE (cerca per capitolo) |
| `src/app/trivia/Trivia.tsx` | orchestrazione, stato menu | DA FARE (reset stato al cambio nick, righe 95-105) |
| `src/app/trivia/leaderboardApi.ts` | classifica + `fetchPlayerBests` | NESSUNA modifica (scelta utente) |
| `supabase/trivia_grades.sql` | schema/RPC | NESSUNA modifica (riuso colonne) |
| `content/trivia/*.md` | dati domande | NESSUNA modifica |

---

## 8. Note importanti

- **Regola utente**: dopo ogni modifica funzionante → commit + push automatici su `main`
  (Vercel deploya solo da main), senza chiedere.
- **Attenzione ai caratteri corrotti**: trovato 1 byte NUL in `packageGrades.ts`.
  Se gli `Edit` falliscono con "string not found" su testo apparentemente identico,
  sospettare byte invisibili: `sed -n 'Np' file | od -c` per ispezionare.
- La modifica NON tocca il DB schema → deploy sicuro, ma i voti vecchi (per argomento)
  restano nel DB finché non ripuliti.
