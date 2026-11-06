# Le regole per fare un'app di pzk os

pzk os è il sistema del cercapersone zero: un lcd di 256 × 128 pixel a un bit sotto il vetro del modello 3D, coi sei
tasti del Flipper. Queste regole valgono per ogni app nuova e per ogni modifica a un'app che c'è già. Le ha volute
Alberto il 29.10.2026: «regole su come creare app in pzk os dentro al flipper senza bugs, usando i tasti presenti, senza
bugs grafici, con icone, animazioni e suoni tutti funzionanti». Ogni regola viene da un errore vero, che sta fra
parentesi.

Un'app è finita quando il collaudo dice «tutto a posto», le sue foto sono state guardate una per una, e Alberto ha
detto ok.

## 1. Prima di cominciare

1. **Un'app alla volta, e solo quando Alberto la chiede.** Le app che non ci sono aprono la vista «in arrivo».
2. **La logica è quella del sito, pzk os è solo la faccia.** Prezzi, premi, regole e soldi passano dai moduli che usa già
   il cercapersone vecchio (`chat/`, `games/pzk.js`, `chat/zaino.js`). Mai una seconda copia delle regole di un gioco, mai
   un nuovo posto dove salvare dati del server. La chat l'ha fatto così: usa i comandi veri di `chat/comandi/`.
3. **L'id dell'app è quello di `APP` in `telefono/telefono.js`** (chat, profilo, account, negozio, pzkstore, sfide, quiz,
   missioni, giocatori, zaino, miniera, foto, virtual, banca, rapina, lavatrice, decifratore, conversioni, calcolatrice, compilatore, cucina). Da lì vengono il nome e l'icona del menu.

## 2. Com'è fatta un'app

Un file `os/<id>.js` che esporta `vista(os)`. La vista è un oggetto:

| campo | obbligatorio | cosa fa |
|---|---|---|
| `nome`, `app` | sì | `app` è l'id: serve a non aprirla due volte |
| `disegna(l, t)` | sì | disegna tutto lo schermo sotto la barra, ogni volta da capo |
| `tasto(n)` | sì | `n` è su, giu, sx, dx, ok, indietro. Torna true se l'ha usato |
| `entra()`, `esci()` | se ascolta qualcosa | si mette in ascolto in entra, smette in esci |
| `tic(t)` | se si anima | dieci volte al secondo, solo per la vista in cima |
| `carattere`, `cancella`, `invio`, `scrivendo` | se si scrive | la tastiera vera del computer |
| `senzaBarra` | no | true: niente barra di stato (schermo intero) |

Si registra in UN posto solo: `PRONTE` in `os/os.js`, una riga. Il menu smette da sé di dire «presto».

I pezzi che le app si dividono stanno in `os/pezzi.js`: `txt` (il testo degli altri senza quadratini), `corto` (il taglio con
«…»), `destra`, `centro` (alla scala vera), `testata` (◀ icona nome · pallini ▶ delle app a pagine), `sposta` (la pagina che
scorre di lato), `striscia` (l'esito o la rotellina in fondo). Un pezzo che serve a due app va lì, non copiato.

`os` dà all'app: `BARRA` (12), `MARGINE` (6), `togli`, `spingi`, `ridisegna`, `corrente`, `apri`, `zona`, `dialogo`, `cifre`, `numero`, `dopoAccesso`,
`tastiera`, `suoni`.

## 3. I tasti

Ci sono solo i sei tasti del Flipper, più il clic del mouse sullo schermo (qui sotto). Niente doppio clic, niente tasti
tenuti premuti.

| tasto | dal 3D | dalla tastiera | cosa vuol dire in tutte le app |
|---|---|---|---|
| su, giu | la croce | ↑ ↓ | scorre, sceglie in una lista |
| sx, dx | la croce | ← → (e Tab per dx) | cambia un valore, cambia pagina, sceglie in fila |
| ok | il tasto in mezzo | Invio | conferma, apre, preme |
| indietro | il tasto tondo | Esc, Backspace a riga vuota | un passo indietro |

1. **INDIETRO va sempre preso.** Dalla radice dell'app si esce con `os.togli()` e si torna true. Se torna false sulla
   home, il cercapersone si chiude.
2. **INDIETRO tenuto tre secondi spegne.** È del sistema: nessuna app lo usa.
3. **Ogni scritta che nomina un tasto deve dire il vero.** («avanti ▶» nella guida andava solo con OK.) Se c'è ▶ sullo
   schermo, dx lo fa. In un dialogo con un tasto solo, OK e dx fanno la stessa cosa.
4. **I tasti si nominano per nome:** OK, INDIETRO, e ↑ ↓ ← → per la croce. ◀ e ▶ vogliono dire sx e dx, mai «indietro».
5. **Le liste girano in tondo:** su dalla prima va all'ultima, come il menu.
6. **Un tasto durante un'animazione non si perde:** la chiude o la salta, e fa la sua cosa.
7. **I numeri, i PIN e gli indirizzi si scrivono con `os.cifre`** (caselle grandi, ↑ ↓ cambiano la cifra, ← → si spostano, le
   cifre anche dalla tastiera vera; `nascoste` per un PIN). Un segreto scritto a lettere (la chiave di amministrazione) usa
   `os.tastiera({ nascosto: true })`: sullo schermo solo asterischi. Un PIN nuovo si chiede due volte.
   **Una misura** (un lato, una coordinata anche negativa, un angolo) si scrive con `os.numero`: i tasti grandi delle cifre,
   il meno che cambia il segno, la virgola, e con `gradi: true` anche ° ' ". La tastiera di lettere non ha né il meno né la
   virgola.
8. **Senza conto non si entra** (os.js, `LIBERE`): ogni app che non è account o impostazioni apre l'account, e dopo
   l'accesso (`os.dopoAccesso`) si apre quella voluta. Un'app nuova non deve fare niente: lo fa `apri`.
9. **Chi scrive testo usa la tastiera di sistema** (`os.tastiera`, con `simboli: true` le file di graffe, parentesi e
   operatori, come vuole il codice C) oppure implementa carattere, cancella, invio e scrivendo, come la chat. Backspace
   cancella solo se `scrivendo()` è true, se no è INDIETRO. Dove Invio va a capo (l'editor di «codice C»), il tasto OK della
   tastiera vera è Ctrl+Invio.
10. **Il tasto 3D che si abbassa e resta giù è del modello** (`zero.js`): le app non lo toccano.
11. **Quando i tasti di una scelta sono direzioni, le frecce li premono subito.** (Alberto, col turno da rider: «le freccie
   non vanno per la sequenza».) La chat lo fa da sola in `scegli` per i tasti sinistra, dritto o centro, destra, giù:
   ← ↑ → ↓ premono, il tasto porta la sua freccia, e sotto c'è scritto quali frecce premere. Un'app con un gioco a
   direzioni fa lo stesso: la freccia è l'azione, non uno spostamento del cursore seguito da OK.
12. **C'è sempre una cosa scelta, e OK preme quella.** (4.11, Alberto: «i tasti che premo danno comandi diversi da quel che
   hanno di nome».) Mai uno stato «niente di scelto» in cui OK fa altro (la chat apriva la tastiera), mai un tasto scelto
   fuori schermo, mai due cursori. Il cursore si ricorda per chiave, non per posto: se la lista cambia, resta sullo stesso
   tasto o torna al primo. Quello che un tasto manda lo dice il suo nome: nella chat il fumetto è il nome del tasto.
13. **Quello che non si preme non sembra un tasto.** Un tasto spento o vecchio ha la cornice a puntini e ignora OK e il
   clic; una scritta che dice «tocca» o «premi» deve avere un tasto vero sotto.

### Il clic del mouse

Alberto, 29.10: «metti per sicurezza anche il click del mouse». Il clic sullo schermo 3D è un in più: tutto quello che
si clicca si fa anche coi tasti.

1. **Mentre disegna, la vista segna con `os.zona(x, y, w, h, fn)` ogni cosa che si preme:** i tasti, le righe di una
   lista, le frecce ◀ ▶ di un valore, i tasti dei dialoghi. Il clic chiama `fn`, che fa la stessa cosa del tasto
   (scegliere la riga e premerla).
2. **Le zone sono in pixel dell'lcd** e si rifanno a ogni disegno. Vince l'ultima segnata: si segna prima la riga e poi le
   frecce che ci stanno dentro. Una zona che esce da una parte ritagliata si taglia anche lei (la chat: `zonaChat`).
3. **Il bip lo fa il sistema** (`os.tocca`), e la manina del mouse compare solo sopra una zona.
4. **Le cose già fatte non si premono:** un tasto disattivato o premuto ignora il clic.

## 4. Lo schermo

```
 0 ┌────────────────────────────────────────┐  la barra di stato (righe 0–11): è del sistema
12 ├─╮                                    ╭─┤
   │ │  l'area dell'app: x da 6 a 249     │ │  angoli stondati: un quarto d'ellisse 15 × 13 px
   │ │                                    │ │  per lato, lì l'inchiostro non si vede
122│ │   in basso solo cose centrate      │ │  le ultime righe: suggerimenti in mezzo (x 40–216)
127└─╯────────────────────────────────────╰─┘
```

1. **Tutto dentro il margine di 6 pixel, e niente negli angoli stondati.** (I pixel ai bordi sparivano sotto la cornice
   e con l'inclinazione.) Il suggerimento in fondo sta centrato, a `H - 9`.
2. **Il testo:** lettere 5 × 7, passo 6, una riga ogni 9 pixel. Ci stanno 40 caratteri in una riga a scala 1 e 20 a
   scala 2. La larghezza si misura con `Lcd.larghezza`, il testo lungo si va a capo con `Lcd.acapo`, quello che non sta
   si taglia con «…». Ogni scritta deve stare anche coi dati peggiori: niente, zero, 999.999.999 $pzk (`pzk.fmtCorto`),
   un nome di 20 lettere.
3. **Solo i caratteri che ha `font.js`.** Un carattere che non c'è esce come un quadratino. («›» del prompt della chat.)
   Se serve, si disegna il glifo 5 × 7 in `font.js` o si aggiunge un alias. Ci sono ← → ↑ ↓ ▶ ◀ ■ □ • … ✓ ⏎ ⌫ × ° € ♥, le
   accentate e i simboli ASCII, dal 29.10 (la borsa della banca) ▲ ▼ ≈, e dal 31.10 (le carte del blackjack, i lavori
   rischiosi) ♦ ♣ ♠ ⚠.
4. **La riga scelta è una fascia scura col testo rovesciato** (`riempi`, poi `testo` con `inv: true`). Tutto quello che
   è rovesciato deve stare dentro la fascia. (Il ▶ delle impostazioni stava fuori: arancione su arancione, invisibile.)
5. **Mai testo sopra altro testo.** Un bollino o un avviso sopra i contenuti prima pulisce il suo posto con un pixel
   d'aria attorno (`riempi(…, 0)`), poi si disegna. (Il «↓ 1» della chat finiva attaccato ai messaggi.)
6. **Un cursore non copre il testo:** il suggerimento grigio comincia dopo il cursore. (Copriva la «s» di «scrivi».)
7. **Le liste lunghe** usano `l.ritaglia([x, y, w, h])`, poi `l.ritaglia(null)` subito dopo, e la barra di scorrimento a
   destra come il menu.
8. **`disegna` disegna e basta.** Legge lo stato e lo disegna: non cambia lo stato, non aspetta niente, non fa partire
   timer. Una riga preparata prima e disegnata dopo copia i valori che usa: lo stato può essere diventato null nel
   frattempo. (La barra del tempo della chat leggeva `m.tempo.fermo` quando `m.tempo` era già null: l'errore
   «reading 'fermo'» a ogni fotogramma.)
9. **Un bit e basta.** Si disegna nel buffer (`px`, `riempi`, `testo`, `bitmap`…), mai sulla tela dell'lcd, mai a colori:
   la tavolozza e la luminosità le fa il sistema, e la stessa immagine va sul 3D e sul tasto del muro.

## 5. Le icone

1. **Le icone nuove sono tracciati SVG in `os/icone.js`** (la mappa `SVG`): viewBox 16 × 16, solo forme piene, niente
   contorni. Le forme stanno sulla griglia intera, e ogni dettaglio e ogni buco è largo almeno 1 unità. (Alberto: «rifai
   icone in svg consumando pochissimo».)
2. **L'icona di un'app si chiama `app-<id>`.** Si usa a 16 (liste, titoli) e a 32 (le viste grandi): si guardano tutte e
   due le misure. Sulla riga scelta va rovesciata (`inv: true`).
3. **Un nome che non c'è lascia un buco** (il collaudo lo segnala: «icone che non ci sono»).
4. **Le webp di Alberto** (`chat/icone.js`) restano solo come riserva per i nomi che non hanno ancora un SVG. Un'icona
   nuova non si fa mai così: la prima volta `icone.bitmap` torna null finché l'immagine non arriva, e lo schermo salta.
5. **Nella chat un'icona si VEDE solo col campo `icone` della scheda** (`icone: ['canna']`, `lato: 32`): una fila di
   riquadri. Quelle dentro il testo (`:canna:`, `<img>`) la chat le toglie, e un tasto con la sola icona in fila non ha
   disegno. (6.11, Bighurra: «non vedo cosa devo replicare»: al meccanico l'icona da ricordare non compariva, e i cinque
   tasti per rispondere erano cinque «?».) Accanto all'icona va sempre il nome: una webp di riserva può arrivare tardi.
6. **Lo schermo è a un bit: i colori si scrivono.** («i colori» del bidello: quattro parole colorate, tutte uguali.)

## 6. Le animazioni

1. **Solo col `tic(t)` della vista:** dieci al secondo. Si cambia lo stato e si chiama `os.ridisegna()`. Il fotogramma
   si sceglie con `Math.floor(t / k)`. Il cursore lampeggia con `t % 10 < 5`.
2. **Niente `setInterval` e niente `requestAnimationFrame` per disegnare.** Un `setTimeout` per la logica si spegne in
   `esci()`.
3. **Si ridisegna solo mentre si anima.** Quando l'animazione finisce, `tic` smette di chiamare `ridisegna`: ogni
   disegno rifà la tela 768 × 384, la trama del 3D e il tasto sul muro.
4. **Corte**, al massimo un secondo e mezzo, e mai di traverso ai tasti (3.6).
5. **Un tempo di gioco non è un'animazione.** Quello che il giocatore deve guardare o aspettare (quattro secondi per
   ricordare, il ritardo del «veloce») si aspetta con `aspetta` di `chat/minigiochi.js`, mai con `ctx.dormi` o
   `ctx.inVista(s, ms)`: con «riduci animazioni» quelli durano 150 ms, e le cinque parole da ricordare sparivano subito.
5. **La retroilluminazione** (`lcd.accendi`) è del sistema: accensione, spegnimento, saluto.

## 7. I suoni

1. **Il bip di ogni tasto e la sigla dell'app che si apre li fa il sistema** (`os.tasto`, `os.invio`, `os.apri` →
   `os/suoni.js`). Un'app non rifà il bip dei suoi tasti: suonerebbe due volte.
2. **Ogni app nuova ha la sua sigla** in `suono/interfaccia.js` (`MUSICHE`), col nome uguale all'id dell'app: chiptune
   sintetizzato, uno o due secondi. Senza, l'app si apre muta. (Le impostazioni si aprivano mute.)
3. **I suoni dei momenti** (una vincita, un errore, un conto alla rovescia) si suonano con `os.suoni.sigla(nome)` o
   `os.suoni.bip(tipo)`. Un suono nuovo si scrive in `suono/interfaccia.js`: mai un file audio, mai un `AudioContext` o un
   `new Audio` dentro un'app.
4. **L'interruttore dei suoni nelle impostazioni spegne tutto da sé.** Un'app non lo legge e non lo scavalca. Quando si
   accendono, si sente un bip di conferma.

## 8. I dati e le attese

1. **Si legge e si scrive coi moduli del sito.** I soldi si muovono solo con le funzioni che ci sono (`pzk.js`, quelle
   della chat). I dati del server stanno sul server di Alberto: nessun posto nuovo.
2. **Il localStorage** usa la chiave `pzkko-zero-<id>`, e `pzkko-zero-<id>:<ind>` se il dato è di un conto. Sempre
   dentro `try`/`catch`.
3. **Chi ascolta smette:** `zaino.ascolta`, `pzk.osserva` e `pzk.ascolta` tornano la funzione per smettere. Si chiamano
   in `entra()` e si spengono in `esci()`.
4. **Dopo ogni `await` si controlla di essere ancora in cima** (`os.corrente() === vista`) prima di disegnare, spingere
   una vista o aprire un dialogo. L'utente può essere già uscito.
5. **`os.dialogo` e `os.tastiera` tornano null con INDIETRO**, e il null va gestito.
6. **Mentre si aspetta il server**, in fondo c'è la rotellina (`striscia` di pezzi.js) e i tasti non fanno partire un'altra
   richiesta (niente doppi invii); l'esito resta in fondo qualche secondo. Un'azione che non si disfa (inviare ,
   cambiare l'indirizzo, uscire dal conto) si conferma con un dialogo che dice cosa succede.
7. **Una rete che non risponde non rompe l'app:** si scrive sullo schermo cosa non va, e i tasti continuano a funzionare.
   Nel collaudo le api del sito non ci sono: l'app deve stare in piedi lo stesso.

## 9. Il collaudo, prima di dire «fatto»

```
node --check pzkko/telefono/zero/os/<id>.js
node tools/pzkko/zero/prova.mjs --giorno --suoni --app=<id>
node tools/pzkko/zero/prova.mjs --app=<id>
```

1. **Il collaudo deve dire `COLLAUDO <id>: tutto a posto`.** Apre l'app come il menu, preme tutti e sei i tasti (OK due
   volte, così si conferma anche un dialogo), e a ogni passo controlla da solo gli angoli stondati, il margine, i
   caratteri senza glifo, le icone che non ci sono, gli errori della pagina e il bip. Coi suoni accesi conta solo i suoni
   di `suono/interfaccia.js`, non la musica.
2. **Poi si guardano tutte le foto dell'lcd**, `tools/pzkko/lavoro/zero/prova-app-<id>-*.png`. Sono 768 × 384, pixel per
   pixel. Il collaudo non vede il testo rovesciato fuori dalla fascia, le scritte sovrapposte e i suggerimenti che non
   dicono il vero: quelli si vedono solo guardando.
3. **Di giorno e di notte:** il secondo comando è la notte.
   **Tutte le viste, non solo la prima:** `--tasti=dx,dx,ok,giu,…` fa una sequenza a scelta (con `clic@80x121` un clic del
   mouse sul pixel 80, 121 dell'lcd, attraverso il 3D vero), così si fotografano ogni pagina, ogni dialogo e ogni
   sottovista. Il profilo ne ha usate quattro: le sei pagine, l'acquisto e la faccia chiusa, i clic, i dati peggiori.
   `okvero` nella sequenza è il tasto OK vero (Ctrl+Invio), per le viste dove Invio fa altro. `aspetta@3000` sta fermo tre
   secondi senza tasti e fotografa: per le cose che vanno da sole (il quiz che passa alla domanda dopo).
   **Le app che parlano col conto** si provano con `--server-finto` (anche la borsa finta e i colpi: `--rapina=presi`,
   `--rapina=galera`): un wallet finto dentro il collaudo (entra col PIN 1234, crea, sincronizza, converti, invia,
   chi è, PIN, indirizzo) e con `--senzaconto` (il cercapersone chiuso).
   Il collaudo segnala anche i **testi più larghi dello schermo**, pure quando il ritaglio li taglierebbe in silenzio.
   **Senza la banca** (nel collaudo non c'è) la chat si prova con `finta@direzioni`, `finta@griglia`, `finta@parola`,
   `finta@azioni` nella sequenza: una scelta finta, e alla fine il collaudo scrive cosa ha risposto. **Chi arriva per la
   prima volta**: `--guida --senzaconto` (la guida, poi il conto). **La croce 3D**: `--croce` la preme col mouse sui
   quattro bracci.
4. **I dati peggiori** (4.2): `--peggiori` dà un nome di 20 lettere, un motto di 60, quasi un miliardo di $pzk, i soldi
   sporchi e un livello sopra 100. (Nel profilo il bollino «liv 129» usciva dal riquadro.)
5. **Se l'app cambia il tasto sul muro**, anche `prova.mjs --muro`, che lo fotografa a 4×.
6. **Il clic si prova davvero:** col mouse sul 3D, su ogni cosa che si preme. `prova.mjs --rider` è l'esempio: un turno
   intero, con due frecce dalla tastiera e due clic del mouse sullo schermo, e il controllo che il turno sia contato.
7. **I comandi della chat non toccano la pagina:** niente `querySelector` sulla scheda, niente `appendChild`, niente
   `document.createElement`, niente tasti ascoltati sul documento. Nello zero la scheda è finta (`maniglia` in
   os/chat.js): `appendChild` non fa niente e un selettore che non conosce torna null. («[data-fatte]» della consegna del
   rider rompeva il gioco alla prima svolta; il 6.11 la tela con la frase da riscrivere e la scatola del nastro non
   comparivano mai.) Si usa quello che la scheda sa disegnare: `t`, `d`, `campi`, `pie`, `icone`, i tasti di `scegli`.
8. **Ogni risposta si dà coi sei tasti.** Una risposta che è un testo (una parola, una frase, un numero) è fatta di pezzi
   da premere in ordine (`componi` in `chat/minigiochi.js`), e la tastiera vera può scriverla intera; la parola che
   compare all'improvviso è un tasto (`scrivi` col `segnaposto`). Mai solo «scrivi»: con la croce in quindici secondi non
   si scrive una frase.
9. **Quello che apre la banca si collauda con la banca:** `prova.mjs --banca` la carica coi file in memoria, e
   `--turni` gioca i tredici minigiochi del turno coi sei tasti (`--sbaglia`, `--scade`: la risposta sbagliata e il tempo
   scaduto). Dal 31.10 al 6.11 nessun collaudo giocava un turno, e nessuno si è accorto che non si vedeva.
6. **Si scrive un paragrafo nel README** (`pzkko/README.md`, «Il cercapersone zero»), con le parole di Alberto. Si dice ad
   Alberto dove guardarla: http://localhost:5182/?zero.

## 10. Il modello da copiare

Questo modello passa il collaudo. Si copia, si rinomina, si cambia.

```js
// L'app «esempio» di pzk os (GG.MM, Alberto: «…»): cosa fa, in due righe. Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'

const VOCI = ['prima', 'seconda', 'terza', 'quarta', 'quinta', 'sesta', 'settima']
const RIGA = 12, VISIBILI = 6

export function vista(os) {
  let sel = 0, da = 0, lampo = 0, via = null
  const v = {
    nome: 'esempio', app: 'esempio',
    entra() { via = zaino.ascolta(() => os.ridisegna()) },
    esci() { via?.(); via = null },
    tic() { if (lampo > 0) { lampo--; os.ridisegna() } }, // (si ridisegna solo mentre lampeggia)
    disegna(l) {
      const x0 = os.MARGINE, y0 = os.BARRA + 3, yl = y0 + 20
      l.bitmap(icone.bitmap('app-esempio', 16), x0 + 2, y0)
      l.testo(x0 + 22, y0 + 1, 'esempio', { scala: 2 })
      // la lista: la riga scelta rovesciata, il ✓ dentro la sua fascia
      l.ritaglia([x0, yl, W - 2 * x0, VISIBILI * RIGA])
      for (let i = 0; i < VISIBILI && da + i < VOCI.length; i++) {
        const k = da + i, y = yl + i * RIGA, on = k === sel
        if (on) l.riempi(x0, y, W - 2 * x0 - 8, RIGA - 1)
        l.testo(x0 + 4, y + 2, VOCI[k], { inv: on })
        if (on && lampo % 2) l.testo(W - x0 - 20, y + 2, '✓', { inv: true })
        os.zona(x0, y, W - 2 * x0 - 8, RIGA - 1, () => { sel = k; conferma(VOCI[k]) }) // (il clic: sceglie e preme)
      }
      l.ritaglia(null)
      // la barra di scorrimento, come il menu
      const alta = VISIBILI * RIGA, h = Math.max(6, Math.round((alta * VISIBILI) / Math.max(VOCI.length, VISIBILI)))
      l.vert(W - x0 - 3, yl, alta)
      l.riempi(W - x0 - 5, yl + Math.round(((alta - h) * sel) / Math.max(1, VOCI.length - 1)), 5, h)
      // il suggerimento: centrato in fondo, coi tasti per nome
      const aiuto = '↑↓ scegli · OK conferma'
      l.testo(Math.round(W / 2 - Lcd.larghezza(aiuto) / 2), H - 9, aiuto)
    },
    tasto(n) {
      if (n === 'su') sel = (sel - 1 + VOCI.length) % VOCI.length
      else if (n === 'giu') sel = (sel + 1) % VOCI.length
      else if (n === 'ok') { conferma(VOCI[sel]); return true }
      else if (n === 'indietro') { os.togli(); return true } // (INDIETRO sempre preso)
      else return false
      if (sel < da) da = sel
      if (sel >= da + VISIBILI) da = sel - VISIBILI + 1
      return true
    },
  }
  async function conferma(voce) {
    const r = await os.dialogo({ titolo: voce, testo: 'La scegli?', icona: 'app-esempio', tasti: ['no', 'sì'] })
    if (r !== 'sì' || os.corrente() !== v) return // (INDIETRO dà null; e l'utente può essere già uscito)
    lampo = 6
    os.suoni.sigla('moneta')
  }
  return v
}
```

Poi una riga in `PRONTE` (`os/os.js`), la sigla in `suono/interfaccia.js`, l'icona `app-esempio` in `os/icone.js`, e
il collaudo.
