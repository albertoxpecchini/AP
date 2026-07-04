# ✅ Checklist Pre-Commit / Pre-Push

> Da rileggere **prima di ogni `git push`**. Su questo progetto il push va **diretto su `main`** e **Vercel deploya da `main`**: quindi ogni push finisce in produzione. Assicurati che il build passi.
>
> Le voci con 🤖 sono automatizzate da `npm run check` (vedi in fondo). Le altre restano controlli manuali.

---

## 1. 🧹 Pulizia del codice
- [ ] 🤖 Nessun `console.log` / `debugger` dimenticato
- [ ] 🤖 Nessun `.env`, chiave o secret finito in staging
- [ ] `git status` pulito: niente file inutili staged (`dev.log`, script di debug, `dist/`, `node_modules/`)
- [ ] Nessun import inutilizzato o variabile morta
- [ ] Solo font **Titillium Web** (Design System Italia) — mai Segoe UI o altri

## 2. 🧪 Build
- [ ] 🤖 `npm run build` completato **senza errori**
- [ ] `npm run dev` provato a mano almeno una volta
- [ ] Console del browser (F12) pulita durante l'uso normale
- [ ] Nessun warning React critico (chiavi mancanti nelle liste, hook usati male)

## 3. 🌗 Tema chiaro / scuro
- [ ] Il toggle funziona in entrambe le direzioni e la scelta persiste dopo il refresh
- [ ] Testi leggibili (contrasto sufficiente) in entrambe le modalità
- [ ] Modalità "auto" (`prefers-color-scheme`) verificata

## 4. 🌍 Multilingua IT / EN / FR / DE
- [ ] Testo nuovo aggiunto al dizionario (`src/app/i18n/dictionary.ts`) nelle 4 lingue
- [ ] Cambio lingua provato: nessuna stringa resta nella lingua sbagliata
- [ ] Le stringhe **dinamiche** (date, contatori, esiti) sono localizzate a mano o in zona `data-no-i18n`

## 5. 📱💻 Compatibilità
- [ ] Layout provato su Safari iOS (safe-area / `100vh` / zoom input ok)
- [ ] Layout provato su Chrome/Edge desktop (Windows)
- [ ] Responsive su mobile / tablet / desktop, nessun overflow orizzontale

## 6. ⚡ Performance & PWA
- [ ] Immagini pesanti compresse (`scripts/compress-images.mjs`)
- [ ] Service worker / cache PWA non serve una versione vecchia (hard refresh per verificare)
- [ ] Nessuna dipendenza aggiunta a `package.json` e non usata

## 7. 🌳 Commit & Git
- [ ] Messaggio in [Conventional Commits](https://www.conventionalcommits.org/it/) (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
- [ ] Commit atomico: una modifica logica per commit
- [ ] `git diff --staged` riletto per intero
- [ ] Consapevole che stai per pushare su `main` → deploy Vercel automatico

## 8. 🚀 Dopo il push
- [ ] Deploy Vercel andato a buon fine (build verde)
- [ ] Pagina in produzione controllata al volo (soprattutto se hai toccato asset o i18n)

---

### 🤖 Automatizzare la parte verificabile
```bash
npm run check            # controlli statici + build di produzione
npm run check -- --quick # solo controlli statici (salta la build, veloce)
```
Esce con codice ≠ 0 se un controllo **bloccante** fallisce (build o secret in staging).
Il resto (tema, lingue, iOS/desktop, rilettura del diff) resta manuale: nessuno script può sostituirlo.
