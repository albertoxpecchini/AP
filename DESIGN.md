---
name: pzkko.it
description: il muro di pzkko, i social di Alberto Pecchini come volantini attaccati a una saracinesca coperta di graffiti
colors:
  pietra: "#2e2c29"
  pietra-2: "#1f1e1c"
  asfalto: "#3a3937"
  lamiera: "#8e8e8a"
  inchiostro: "#161616"
  inchiostro-2: "#3a3632"
  marker: "#111"
  marker-rosso: "#a50d25"
  marker-blu: "#1446a0"
  marker-teal: "#173f48"
  marker-verde: "#0b5d2b"
  giallo-fuoco: "#ffd400"
  bianco-carta: "#fff"
  marciapiede-testo: "#cfcbc4"
  marciapiede-link: "#f1eee8"
  marciapiede-testo-dark: "#b9b5ae"
  notte-sodio: "rgba(255,176,70,.22)"
  ombra: "rgba(0,0,0,.28)"
typography:
  titolo:
    fontFamily: "Anton, Impact, 'Arial Narrow Bold', sans-serif"
    fontSize: "max(26px, 18cqw)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: ".005em"
  titolo-mobile:
    fontFamily: "Anton, Impact, 'Arial Narrow Bold', sans-serif"
    fontSize: "max(22px, 16cqw)"
    fontWeight: 400
    lineHeight: 0.95
  forte:
    fontFamily: "'Archivo Black', 'Arial Black', sans-serif"
    fontSize: "max(12px, 5cqw)"
    fontWeight: 400
    letterSpacing: "-.01em"
  corpo:
    fontFamily: "'Special Elite', 'Courier New', monospace"
    fontSize: "max(12px, 5.4cqw)"
    fontWeight: 400
    lineHeight: 1.28
  mano:
    fontFamily: "'Permanent Marker', 'Comic Sans MS', cursive"
    fontSize: "max(14px, 7.2cqw)"
    fontWeight: 400
    lineHeight: 1.05
  handle:
    fontFamily: "'Permanent Marker', 'Comic Sans MS', cursive"
    fontSize: "max(13px, 6cqw)"
    fontWeight: 400
    lineHeight: 1.1
  tagliando:
    fontFamily: "'Permanent Marker', 'Comic Sans MS', cursive"
    fontSize: "max(9px, 3.6cqw)"
    fontWeight: 400
    lineHeight: 1
  copiato:
    fontFamily: "'Permanent Marker', 'Comic Sans MS', cursive"
    fontSize: "max(16px, 9cqw)"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "'Special Elite', 'Courier New', monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  marciapiede:
    fontFamily: "'Special Elite', 'Courier New', monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  nessuno: "0"
spacing:
  stipite: "clamp(10px, 3vw, 40px)"
  portale: "clamp(18px, 3.2vw, 40px) 0 clamp(14px, 2.4vw, 30px)"
  parete: "1280px"
  parete-unita: "calc(100cqw / 1280)"
  parete-unita-mobile: "calc(min(100cqw, 600px) / 390)"
  parete-altezza: "1700 unità"
  parete-altezza-mobile: "2900 unità"
  testo-gap: "2.2cqw"
  testo-lato: "5cqw"
  tagliandi: "max(44px, 17cqw)"
  tagliandi-mobile: "max(46px, 17cqw)"
  marciapiede: "22px 4px max(22px, env(safe-area-inset-bottom))"
components:
  volantino:
    textColor: "{colors.inchiostro}"
    typography: "{typography.corpo}"
    rounded: "{rounded.nessuno}"
  volantino-titolo:
    textColor: "{colors.inchiostro}"
    typography: "{typography.titolo}"
  volantino-mano:
    textColor: "{colors.marker}"
    typography: "{typography.mano}"
  volantino-handle:
    textColor: "{colors.marker}"
    typography: "{typography.handle}"
  tagliando:
    textColor: "{colors.marker}"
    typography: "{typography.tagliando}"
    height: "{spacing.tagliandi}"
  nota-copiato:
    backgroundColor: "rgba(255,255,255,.85)"
    textColor: "{colors.marker-rosso}"
    typography: "{typography.copiato}"
    padding: ".2em .4em"
  insegna:
    width: "min(100%, 840px)"
  marciapiede:
    textColor: "{colors.marciapiede-testo}"
    typography: "{typography.marciapiede}"
    padding: "{spacing.marciapiede}"
---

# Design System: pzkko.it

> **Perimetro.** Questo documento descrive **solo pzkko.it**, la cartella statica `albertopecchini.it/pzkko/` (index.html, 404.html, `art/`, `fonts/` e le icone accanto). Gli altri due siti dello stesso repository, albertopecchini.it (portfolio, `albertopecchini.it/src/`) e bettercallpekko.it (`SITE=bcp`), hanno ciascuno la propria identità già nel codice e **non** la condividono con questa: niente di quanto segue va applicato a loro, e niente di loro va portato qui.
>
> Fonte di verità: i token stanno in `:root` e nel blocco `@media (prefers-color-scheme:dark)` di `index.html`; il CSS e lo script sono in linea nelle pagine, non c'è build. La 404 è generata dalla home da `tools/pzkko/genera-404.mjs` e ne eredita tutto. Le immagini del muro sono in `art/` (prompt in `tools/pzkko/fogli.js`, pipeline `immagini.mjs`); ogni WebP porta dentro il prompt con cui è nato. Le pagine dei due giochi fatti il 7–8.10 sono state tolte il 2026-10-17: nella zona «games» restano solo i volantini «in arrivo» (mine, dado, moneta).

## Overview

**Creative North Star: "Il muro di pzkko"**

pzkko.it è un muro, non un elenco. La pagina è la saracinesca grigia di un negozio chiuso (il riferimento del 2026-10-09 è la serranda di un «coin» a Bologna: insegna sopra, graffiti e manifesti sotto): l'insegna del negozio ora dice «pzkko», e ogni social, gioco e strumento è un volantino di carta attaccato alla lamiera col nastro, storto, sovrapposto agli altri, stampato su una carta diversa con un inchiostro diverso. Niente è disegnato dal CSS dove può essere fotografato: la lamiera, i fogli con il loro nastro e le loro graffette, le illustrazioni, i graffiti, i manifesti degli «altri», l'insegna, le parole sprayate sono immagini generate con gpt-image-2 su Replicate, scontornate con una chiave cromatica e composte nella pagina; il CSS scrive sopra i fogli il testo vero, in quattro caratteri da tipografia di quartiere, e posiziona ogni cosa in 1280esimi della parete.

La densità è alta per scelta («volantini, street, caos, colori»): i fogli si coprono ai bordi, i graffiti stanno sotto, i manifesti inventati peggiorano il disordine, ma ogni volantino che conta resta intero e leggibile, e ogni link copre tutto il suo foglio. Il momento che si ricorda è il tagliando: i volantini dei social finiscono con la fila di tagliandi da strappare, e strapparne uno copia il contatto e lascia il buco sul muro. Il sito vive all'ora di Mantova: la pagina calcola alba e tramonto (NOAA, al minuto) e da 40 minuti prima del tramonto imbrunisce; al tramonto preciso i led dell'insegna si accendono con lo strobo dei tubi al neon, dodici minuti dopo i lampioni (sodio a sinistra, neon a destra), e le luci sfarfallano come tubi a 50 Hz; all'alba tutto a ritroso. Senza script vale il tema del sistema. Tutto il testo è minuscolo e in prima persona.

Rifiuti confermati dal percorso di progetto: la colonna link-in-bio di tasti uguali; l'hero su mesh gradient con tre card; la scrivania Apple con dock e bento (il mondo del 2026-10-07, sostituito e non rifinito); le imitazioni in CSS di materiali fotografabili (bordi strappati in `clip-path`, nastro in gradiente, spray in `text-shadow`: provati per le intestazioni di zona e sostituiti con le parole sprayate vere); le rivelazioni allo scorrimento e qualunque movimento decorativo che giri da solo.

**Key Characteristics:**
- La lamiera fotografata (`art/muro.webp`) come fondo di tutta la pagina, tagliata sul passo delle doghe e specchiata, così si ripete senza giunte.
- Ogni link è un volantino (`.vol`): un foglio fotografato con i bordi veri misurati (`.c-bianco`, `.c-giallo`, …), il testo vero in HTML sopra, misurato in `cqw` del foglio, l'illustrazione in `mix-blend-mode: multiply` come inchiostro sulla carta.
- Quattro caratteri serviti dal sito: Anton (titoli urlati), Archivo Black (seconda voce), Special Elite (corpo fotocopiato), Permanent Marker (note a mano, handle, tagliandi).
- I tagliandi da strappare (`.tagliandi`): fette della stessa carta, un tocco strappa e copia il contatto.
- Posizionamento assoluto in unità della parete (`--x`, `--y`, `--w`, `--r` su 1280; `--mx`, `--my`, `--mw`, `--mr` su 390), rotazioni di pochi gradi, ordine di profondità graffiti → manifesti → volantini → nastri sopra.
- Il colore è quello delle carte e degli inchiostri da stampa, mai dell'interfaccia; l'unico colore «di sistema» è il giallo del fuoco da tastiera.
- Niente raggi, niente vetro, niente linee: i bordi sono quelli strappati delle foto.
- Movimento solo in risposta: il foglio si solleva sotto il puntatore, il tagliando cade quando lo si strappa; `prefers-reduced-motion` rispettato.

## Colors

Una tavolozza di materiali: la pietra del portale, la lamiera, le carte dei volantini (fotografate: bianco, giallo canarino, kraft, carta da giornale, arancio fluo, verde pallido, crema, bianco lucido, azzurro) e gli inchiostri da stampa sopra. Il magenta non esiste: è il colore della chiave cromatica con cui si scontornano i pezzi, e non può comparire su nessuno di essi.

### Primary
- **Inchiostro** (`--inchiostro`, `#161616`): il nero del toner e della stampa: titoli (`.vol h3`, `.titolo`), corpo (`.vol p`), elenco dei siti. Sul kraft è anche il colore del pennarello (`--marker-c: #161616`), perché il rosso non legge sulla carta scura.
- **Pennarello** (`--marker`, `#111`) e i suoi colori di foglio: ogni volantino dichiara in linea `--marker-c` per le note a mano, l'handle e i tagliandi: teal `#173f48` sull'arancio (anche per il titolo «instagram»), verde `#0b5d2b` sul verde, blu `#1446a0` sul crema e sul giallo, rosso `--marker-rosso` `#a50d25` sui fogli bianchi, lucidi, azzurri e di giornale (la nota «in arrivo», le frecce dell'elenco GitHub, la nota «copiato»). Il rosso è scuro apposta: deve leggere anche sull'azzurro.
- **Giallo del fuoco** (`#ffd400`): l'anello di `:focus-visible` (3 px, offset 3 px; 4 px sul volantino intero) e la selezione del testo (`::selection`, con inchiostro `#111`). È il solo colore d'interfaccia e sta solo lì.

### Neutral
- **Pietra** (`--pietra` `#2e2c29` → `--pietra2` `#1f1e1c`): il portale intorno alla saracinesca e il fondo dell'`html`; `.strada` lo porta con una grana SVG (`feTurbulence`) e un riflesso dall'alto. È anche il `theme-color`.
- **Lamiera** (`#8e8e8a`, il colore medio di `art/muro.webp`): il fondo della parete, in `background-color` sotto la foto, e il colore che prendono i pixel trasparenti dei ritagli perché i bordi sfumati non restino rosa.
- **Carta**: non è un token ma nove fotografie (`art/carta/*.webp`), ciascuna con la sua proporzione `--ar` e i bordi veri (`--el`, `--er`, `--pad`, `--giu`) misurati sul ritaglio. Il bianco `#fff` resta solo nella nota «copiato» (`rgba(255,255,255,.85)`).
- **Marciapiede** (`--asfalto` `#3a3937`; testo `#cfcbc4`, link `#f1eee8`; di notte testo `#b9b5ae`): il piè di pagina sotto la saracinesca, con il credito.
- **La sera** (velo `#0a0d1c` in `multiply` fino a .64 di opacità, lamiera fino a `brightness(.5) saturate(.8)`; lampioni in `screen`: sodio `rgba(255,158,40,.95)` in alto a sinistra, neon `rgba(196,255,232,.85)` in alto a destra; insegna fino a `brightness(1.62)` con la luce `rgba(255,247,222,.9)` in `screen` e il cono `rgba(255,236,190,.42)` sul muro): la notte non cambia i colori, cambia la luce, e arriva all'ora del tramonto di Mantova (`--notte`, `--insegna`, `--lampioni` 0→1 regolati dallo script, `--f-*` lo sfarfallio).

### Named Rules
**La regola della carta fotografata.** Un volantino nuovo nasce da uno dei nove fogli di `art/carta/` (si riusano, anche specchiati con `.flip`): non si disegna una carta in CSS, non si imita un bordo strappato con `clip-path`, non si inventa un nastro con un gradiente. Se serve un materiale che manca, si genera un foglio nuovo con `tools/pzkko/immagini.mjs` e si scontorna.

**La regola del magenta.** Magenta, rosa e viola non esistono nel sistema: sono la chiave cromatica. Nessun inchiostro, nessun pennarello, nessun manifesto li usa, e un'immagine che li contenesse perderebbe quei pixel nel ritaglio.

**La regola dell'inchiostro.** I colori del testo sono inchiostri da stampa o da pennarello sopra una carta, dichiarati per foglio (`--marker-c`, `--titolo`), e si scelgono per leggere su quella carta (≥ 4,5:1 sul corpo). Non esistono colori d'interfaccia: niente blu dei link, niente verde di conferma, niente rosso d'errore. L'unica eccezione è il giallo del fuoco.

## Typography

**Display Font:** Anton (`--fa`; ripiego Impact, Arial Narrow Bold), OFL, servito da `fonts/anton.woff2`
**Body Font:** Special Elite (`--ft`; ripiego Courier New), Apache 2.0, `fonts/special-elite.woff2`
**Label/Mono Font:** Permanent Marker (`--fm`; ripiego Comic Sans MS), Apache 2.0, `fonts/permanent-marker.woff2`, per tutto ciò che è scritto a mano; Archivo Black (`--fb`), OFL, `fonts/archivo-black.woff2`, per la seconda voce urlata

**Character:** quattro voci di una tipografia di quartiere: il titolo condensato e pesante del manifesto (Anton), il grottesco nero della locandina (Archivo Black), la macchina da scrivere della fotocopia (Special Elite) e il pennarello di chi ha aggiunto il numero a mano (Permanent Marker). Dentro un volantino ogni misura è in `cqw` del volantino stesso (`container-type: inline-size` su `.vol`) con un pavimento in pixel, così il foglio si legge allo stesso modo a 300 px sul desktop e a 190 px sul telefono, e un foglio più stretto non scende mai sotto i 12 px di corpo. Tutto il testo visibile è minuscolo nel sorgente, nomi propri compresi; i caratteri usano `font-display: swap` e i due principali sono precaricati.

### Hierarchy
- **Titolo** (Anton 400, `max(26px, 18cqw)`, interlinea .95, `.005em`; `max(22px, 16cqw)` sotto i 900 px; `max(26px, 15cqw)` nella 404): il nome del servizio o del gioco (`.vol h3`, `.titolo`), bilanciato con `text-wrap: balance`. Quando il volantino è un link, il titolo è il link e al passaggio si sottolinea (`.08em`, offset `.1em`).
- **Forte** (Archivo Black 400, `max(12px, 5cqw)`, `-.01em`): la prima riga del volantino di presentazione («pzkko è il mio nome in rete.»).
- **Corpo** (Special Elite 400, `max(12px, 5.4cqw)`, interlinea 1.28; `max(12px, 5.6cqw)` sotto i 900 px): il testo del volantino; l'elenco dei siti (`.siti`, `max(12px, 5.2cqw)`, interlinea 1.3) con la freccia a pennarello davanti.
- **Mano** (Permanent Marker 400, `max(14px, 7.2cqw)`, interlinea 1.05, ruotato di −2°): le note a pennarello («strappa un tagliando: copia il contatto», «in arrivo»); `.vai` sta a destra, ruotato di −4°.
- **Handle** (Permanent Marker 400, `max(13px, 6cqw)`, interlinea 1.1, `overflow-wrap: anywhere`; `max(12px, 6cqw)` sotto i 900 px): il contatto scritto a mano in fondo al foglio, spinto giù con `margin-top: auto`.
- **Tagliando** (Permanent Marker 400, `max(9px, 3.6cqw)`, `writing-mode: vertical-rl` ruotato di 180°): il contatto ripetuto di traverso su ogni tagliando, tagliato se non entra (è decorazione: il nome accessibile del tasto dice cosa copia).
- **Copiato** (Permanent Marker 400, `max(16px, 9cqw)`, ruotato di −6°): la nota «copiato: …» che compare sul foglio dopo lo strappo.
- **Body / Marciapiede** (Special Elite 400, 16 px / 14 px, interlinea 1.4): il corpo di pagina e il piè di pagina.

### Named Rules
**La regola dei quattro caratteri.** Non si aggiunge un quinto carattere e non si usa il carattere di sistema per il testo visibile: ogni voce ha il suo (Anton urla, Archivo Black ribadisce, Special Elite spiega, Permanent Marker annota). I caratteri stanno in `fonts/` e si caricano con `@font-face`, mai da un host esterno.

**La regola del cqw.** Dentro un volantino il testo si misura in `cqw` del volantino con `max(px, cqw)`: la misura segue il foglio, il pavimento in pixel difende la leggibilità. Fuori dai volantini si usano i pixel.

**La regola del minuscolo.** Tutto il testo visibile è minuscolo nel sorgente, nomi propri compresi («alberto pecchini», «instagram»). Non si usa `text-transform`. Titolo e meta della pagina conservano le maiuscole.

## Layout

La pagina è la strada: `.strada` (pietra) con `padding: 0 var(--stipite)` (`clamp(10px, 3vw, 40px)`: gli stipiti del portale), dentro il portale `.portale` (padding `clamp(18px, 3.2vw, 40px) 0 clamp(14px, 2.4vw, 30px)`) con l'insegna centrata larga `min(100%, 840px)`, poi la saracinesca `.muro` (larghezza massima 1280 px, centrata, `container-type: inline-size`, `isolation: isolate`, ombra interna in alto e in basso e un filo scuro intorno) e sotto la soglia di pietra.

**La parete.** `.parete` è un rettangolo a misure fisse, alto `calc(1700 * var(--u))` con `--u = calc(100cqw / 1280)`: tutto ciò che sta sul muro è `position: absolute` con `left`, `top` e `width` in unità della parete (`--x`, `--y`, `--w`) e una rotazione `--r` di pochi gradi (da −8° a +6°; i nastri sciolti fino a ±50°). L'ordine di profondità è `z-index`: graffiti 0 (`.tag`), manifesti e resti 1 (`.man`, `.pezzo`), volantini 3 (2 per quelli «sotto»), nastri sciolti sopra i fogli 4, il foglio al passaggio 5. Le posizioni sono scritte a mano, per righe: presentazione + tre social in alto, e-mail e paypal in mezzo, strumenti e i tre giochi «in arrivo» sotto, i manifesti inventati e i graffiti negli spazi che restano, con qualche sovrapposizione voluta ai bordi dei fogli e mai sul testo.

**Il volantino cresce.** `.vol` ha `aspect-ratio: var(--ar)` (la proporzione del foglio) ed è una colonna flex con il testo in flusso (`.testo`, padding `--pad` dai bordi veri della carta): se il testo è più lungo della carta il foglio si allunga, perché l'immagine è in `background-size: 100% 100%`. Le posizioni sotto tengono conto delle altezze reali misurate (desktop: i social finiscono a y ≈ 520, la seconda riga parte da 480–560, la terza da 930–1000).

**Telefono (≤ 899 px).** `--u = calc(min(100cqw, 600px) / 390)`, la parete alta `2900` unità e larga al massimo 600 px centrata (su un tablet la lamiera riempie i lati): ogni elemento passa a `--mx`, `--my`, `--mw`, `--mr`. Due volantini per riga (≈ 190 px l'uno), la presentazione a riga piena in cima, i manifesti inventati a fianco o fra le righe, i graffiti dietro. I titoli scendono a `max(22px, 16cqw)`, i tagliandi salgono a `max(46px, 17cqw)`.

**Ritmo.** Non c'è un ritmo di sezioni: ci sono righe di fogli con 20–60 unità d'aria o di sovrapposizione, e le tre parole sprayate come intestazioni di zona (`#social`, `#games`, `#tools`, con `scroll-margin-top: 24px`). Sotto la saracinesca resta la pietra, `padding-bottom: clamp(28px, 4vw, 56px)`.

**Soglie.** `max-width: 899px` (parete in 390esimi), i 600 px di larghezza massima della parete stretta, `(hover: hover)` per il sollevamento e il tagliando che si abbassa, `prefers-color-scheme: dark` per la notte, `prefers-reduced-motion: reduce` per togliere transizioni e caduta.

### Named Rules
**La regola della parete.** Sul muro non esiste il flusso: ogni cosa ha le sue coordinate in unità della parete, su due disposizioni (1280 e 390), e le si cambia leggendo i rettangoli reali (`tools` di prova: `getBoundingClientRect` con `transform: none`) prima di spostare un foglio. Un nuovo volantino prende un posto libero, non si aggiunge in coda.

## Elevation & Depth

La profondità è quella della carta sul metallo. Ogni volantino e ogni manifesto porta la propria ombra come `filter: drop-shadow` (segue il contorno strappato, non il rettangolo): una corta e una lunga, entrambe verso il basso. Al passaggio il foglio si solleva (`translateY` di 1,6 unità, `scale(1.015)`) e l'ombra si allunga. I graffiti non hanno ombra: sono vernice sulla lamiera (`mix-blend-mode: multiply` per i neri e i colori, `normal` per il cromato e il bianco). La saracinesca è incassata nel portale con due ombre interne. Di notte le ombre si scuriscono e l'insegna emette luce.

### Shadow Vocabulary
- **Foglio** (`.vol`: `drop-shadow(0 2px 3px rgba(0,0,0,.28)) drop-shadow(0 10px 16px rgba(0,0,0,.3))`; di notte `.4` / `.45`): il volantino attaccato al muro.
- **Foglio sollevato** (`.vol:has(h3 a:hover)`: `drop-shadow(0 4px 5px rgba(0,0,0,.3)) drop-shadow(0 26px 30px rgba(0,0,0,.36))`): il foglio staccato dal muro sotto il puntatore, in `.32s var(--eo)`.
- **Manifesto** (`.man`: `drop-shadow(0 2px 3px rgba(0,0,0,.3)) drop-shadow(0 8px 14px rgba(0,0,0,.28))`): i manifesti degli altri, un po' più piatti dei volantini.
- **Insegna** (`.insegna`: `drop-shadow(0 6px 10px rgba(0,0,0,.5))`; di notte più `drop-shadow(0 0 28px rgba(255,236,190,.45)) drop-shadow(0 0 70px rgba(255,220,150,.3))`): il cassonetto sporge dal portale; di notte è acceso.
- **Saracinesca** (`.muro`: `inset 0 10px 14px -8px rgba(0,0,0,.7), inset 0 -8px 10px -8px rgba(0,0,0,.5), 0 0 0 1px rgba(0,0,0,.5)`): la lamiera incassata fra architrave e soglia.
- **Lampioni** (`.lampioni`, `mix-blend-mode: screen`, opacità `--lampioni · --f-lampioni`: sodio `radial-gradient(46% 24% at 3% 0%, rgba(255,158,40,.95)…)`, neon `radial-gradient(44% 22% at 97% 0%, rgba(196,255,232,.85)…)`): non ombre ma luci, sopra tutto, `pointer-events: none`; **velo della sera** (`.buio`, `multiply`, `#0a0d1c` a `--notte · .64`) sotto di loro.

### Vetro
Nella home non c'è vetro: niente `backdrop-filter`, niente trasparenze d'interfaccia. L'unica traslucenza è quella fotografata dello scotch (alfa vero nel WebP).

### Named Rules
**La regola dell'ombra della carta.** Hanno ombra solo le cose di carta e l'insegna, e l'ombra è sempre `drop-shadow` sul contorno, mai `box-shadow` su un rettangolo. La vernice (graffiti, parole sprayate) non ha ombra. Non si aggiunge ombra per «far risaltare».

## Shapes

Nessuna forma geometrica: i bordi della home sono quelli fotografati (fogli strappati, nastro con le estremità frastagliate, adesivo rotondo con l'angolo sollevato, lettere a scatola) e il CSS non applica raggi (`rounded.nessuno`). L'unica forma disegnata dal CSS è la linea tratteggiata dei tagliandi (`1px dashed rgba(0,0,0,.45)` sopra, `.4` fra un tagliando e l'altro: la perforazione). La freccia a pennarello è un piccolo SVG in linea (`.freccia`, tratto 3 arrotondato, `currentColor`), non un glifo di carattere. Ogni volantino è ruotato di pochi gradi e i fogli sono specchiabili (`.flip`, `scaleX(-1)` sulla sola carta) per riusare lo stesso foglio senza che si noti.

## Components

### Portale e insegna (`.strada` / `.portale` / `.insegna`)
La pietra intorno e il cassonetto sopra la porta.
- **Pietra:** `.strada` con `--pietra → --pietra2` e la grana SVG `feTurbulence` (`baseFrequency .9`, alfa .55) più un riflesso radiale dall'alto; padding laterale `--stipite`.
- **Insegna:** `h1 > img.insegna` (`art/insegna.webp`, 1719 × 604, `alt="pzkko"`, `fetchpriority="high"`, precaricata), larga `min(100%, 840px)`, con la sua ombra; di notte si accende. L'`h1` è il testo dell'insegna.

### Lamiera (`.muro::before`)
`url(/art/muro.webp) 0 0 / 2200px auto repeat` su `#8e8e8a`: la foto di una saracinesca (3200 × 1475, una doga ogni 114 px della tela a 1600, tagliata su 13 doghe e specchiata in larghezza), `z-index: -1` dentro `.muro` isolato. Di notte `brightness(.52) saturate(.85)`.

### Volantino (`.vol`)
Il componente firma: un foglio fotografato con il testo vero sopra; se è un link, tutto il foglio è il link.
- **Carta:** la classe `.c-<foglio>` (`.c-bianco`, `.c-giallo`, `.c-kraft`, `.c-giornale`, `.c-arancio`, `.c-verde`, `.c-crema`, `.c-lucido`, `.c-azzurro`) dichiara `--carta` (l'immagine), `--ar` (la proporzione), `--el`/`--er` (dove sono i bordi veri della carta, in % della larghezza), `--pad` (il margine di scrittura, in cqw) e `--giu` (il bordo basso). `.foglio` è un livello assoluto con `background: var(--carta) center/100% 100%`, specchiato con `.flip`.
- **Testo (`.testo`):** colonna flex in flusso, `padding: var(--pad)`, gap 2.2cqw: l'illustrazione (`.arte`, larga `--aw` 30–58%, `mix-blend-mode: multiply`, `align-self` `--aa`), il titolo (`h3`), il corpo, la nota a mano o l'handle (`margin-top: auto`), i tagliandi.
- **Link:** `h3 > a` con `::after` che copre tutto il foglio (`inset: 0`, z 1); i tagliandi stanno sopra (z 2). Al passaggio (`:has(h3 a:hover)`, solo `(hover: hover)`) il foglio si solleva e il titolo si sottolinea; alla pressione `scale(.99)`; col fuoco l'anello giallo da 3 px a 4 px dal foglio e `z-index: 5`.
- **Varianti:** `.sotto` (z 2, il foglio che sta sotto il vicino), `.flip`, l'adesivo `.adesivo` (la chiocciola, 34% del foglio, in basso a destra, −12°) sul volantino di presentazione.
- **Mobile:** stesse classi; cambiano le coordinate e i pavimenti dei caratteri.

### Tagliandi (`.tagliandi`)
La fila di tagliandi da strappare in fondo ai cinque volantini dei social.
- **Forma:** `display: flex`, alta `max(44px, 17cqw)` (`46px` a telefono), `margin-top: auto`, linea tratteggiata sopra; nel foglio con i tagliandi `.testo` scrive fra `--el` e `--er` e i figli rientrano di 5cqw, così i tagliandi vanno da bordo a bordo della carta.
- **Tagliando (`button`):** `flex: 1 1 0`, senza bordo tranne la perforazione a sinistra, sfondo = la stessa carta spostata (`--bgpos` / `--bgsize`, calcolati dallo script dai rettangoli non ruotati, rifatti al `resize` e quando i caratteri sono pronti), testo di traverso in `--marker-c`, `aria-label="strappa un tagliando e copia <cosa>"`; il gruppo ha `role="group"` e il suo `aria-label`.
- **Strappo:** al clic `.cade` (`translateY(60%) rotate(14deg)`, opacità 0, `.55s cubic-bezier(.55,0,1,.45)`), poi `.via` (`visibility: hidden`: il buco mostra il muro) e `aria-disabled`; il testo va negli appunti (`navigator.clipboard`), la nota `.copiato` compare sul foglio per 2,6 s (`opacity .25s`). Alcuni tagliandi nascono già strappati (`.via` nel sorgente). Quando sono finiti tutti, dopo 1,8 s il foglio «ristampa» i tagliandi. Con `prefers-reduced-motion: reduce` lo strappo è immediato.
- **Passaggio:** `(hover: hover)`: il tagliando si abbassa di 2 px e ruota di −1,5°.

### La strada intorno (`.fuori`, `.lampioni`, `.fari`, `.goccia`, `.formica`)
Le cose attaccate alla pietra intorno all'insegna, posizionate rispetto al centro (`left: calc(50% ± …px)`) e nascoste sotto i 900 px tranne i lampioni: la lanterna al sodio (`art/strada1/lampione-spento` e `-acceso` sovrapposti, l'acceso a opacità `--lampioni · --f-lampioni`) a sinistra e il tubo al neon a destra; i cavi lungo l'alto; la condensa dei condizionatori sul tetto, fuori vista (la goccia cade dal bordo alto della pagina sulla lamiera, Web Animations, ogni 3–9 s, con lo spruzzo dove batte e il rivolo stampato sulla lamiera); intonaco che si sfoglia, umidità, crepa, gomme, il topo a stencil e le scritte degli altri (`art/strada2/`). `.lampioni` disegna la luce vera dei due lampioni: un punto caldo sulla testa della lampada (`--sodio-x`, `--neon-x`, `--lampada-y`) e un alone che scende sul muro, in `screen`. Le auto: `.fari` (fari che spazzano, `--auto-x`, `--auto-l`, colore `--auto-c`), `.freni` (fanali rossi dal lato d'uscita, `--freno`), `.neonauto` (neon sotto la scocca), tutte in `screen` sopra tutto; la lamiera riflette con `.muro::after` (la foto della lamiera a contrasto alto in `screen`, mascherata sotto i lampioni e sotto i fari). Le formiche (`.formica`, 11 px, cinque) camminano sul bordo basso della lamiera a 12–30 px/s, con pause e inversioni, aggiornate 12 volte al secondo.

### Insegna di notte (`.insegna.notte`)
La seconda fotografia dell'insegna (`art/insegna-notte.webp`, generata dalla prima con il tubo al neon visibile dentro ogni lettera) sovrapposta a quella di giorno, opacità `--insegna · --f-insegna`, con i suoi aloni; quella di giorno sotto si scurisce con `--notte`.

### Parole sprayate (`.spray`)
Le intestazioni delle tre zone sono tre graffiti veri (`art/scritte/social.webp`, `games.webp`, `tools.webp`: spray nero, bianco, rosso-arancio, generati con lo stesso foglio magenta), dentro `h2.it.spray` con `id` `social`, `games`, `tools` (gli anchor della 404); l'`img` porta `alt` con la parola. Stanno sulla lamiera (z 0, `mix-blend-mode: multiply` per il nero e il rosso, `normal` per il bianco), mai sopra un foglio.

### Manifesti e graffiti degli altri (`.man`, `.tag`, `.pezzo`)
Il disordine del muro: otto manifesti inventati (`art/manifesti1/`, `art/manifesti2/`: concerto della chiocciola, lezioni di roulette, teatro del browser, sagra del volantino, cercasi gatto, torneo di dadi, il manifesto punk «pzkko», testa o croce), nove graffiti (`art/tag/`), i resti di manifesti strappati, nastri sciolti, graffette, la puntina, l'adesivo (`art/nastro/`). Sono `img` con `alt=""` e `loading="lazy"`, posizionate come i volantini; i graffiti e i resti `pointer-events: none`. Non sono link e non dicono niente di vero: sono finzione dichiarata (README).

### Sotto la saracinesca
Nessun piè di pagina: la home e la 404 finiscono con la soglia di pietra (`.strada` con `padding-bottom: clamp(28px, 4vw, 56px)`). Credito e badge FrogDR sono stati tolti su richiesta di Alberto il 2026-10-09.

### 404 (`.parete.p404`)
Lo stesso muro, alto 640 unità (720 a telefono): i resti strappati di un volantino (`resto-bianco`, `resto-giallo`, scotch, graffette), quattro graffiti e un foglio bianco con «questa pagina non c'è.» (`.titolo`, Anton `max(26px, 15cqw)`), il corpo e la nota a pennarello «torna a pzkko.it» con la freccia, link alla home. Generata da `tools/pzkko/genera-404.mjs`.

### Movimento
- **Nessun ingresso:** la pagina si mostra com'è; non c'è animazione di apertura. L'unico movimento autonomo è la sera: `--notte` sale con il tramonto di Mantova (un tick al secondo), le luci si accendono con uno strobo da 1,1–1,5 s e poi sfarfallano (un `requestAnimationFrame` solo mentre sono accese: 100 Hz campionati a 60 più i cali casuali dei tubi); con `prefers-reduced-motion` niente strobo né sfarfallio.
- **Risposta:** il foglio che si solleva al passaggio (`.32s var(--eo)`, `--eo: cubic-bezier(.22,1,.36,1)`), la pressione `scale(.99)`, il tagliando che si abbassa al passaggio e cade allo strappo (`.55s`), la nota «copiato» (`.25s ease`).
- **Niente allo scorrimento:** nessuna rivelazione, nessun parallasse, nessun elemento che segue la finestra.
- **Riduzione del movimento:** `.vol`, i tagliandi e la nota senza transizioni; il tagliando strappato sparisce sul posto.

## Do's and Don'ts

### Do:
- **Do** fare di ogni nuovo link un volantino: una classe `.c-<foglio>` di `art/carta/`, il testo in `.testo` (titolo Anton, corpo Special Elite, nota o handle Permanent Marker), l'illustrazione come inchiostro in `multiply`, il link che copre il foglio.
- **Do** dare a ogni volantino le due disposizioni (`--x --y --w --r` su 1280, `--mx --my --mw --mr` su 390) in un posto libero del muro, leggendo i rettangoli reali dei vicini prima di scegliere, e lasciare che i fogli si coprano solo ai bordi, mai sul testo.
- **Do** generare con `tools/pzkko/immagini.mjs` ogni materiale nuovo (carta, illustrazione, manifesto, graffito, nastro) su fondo magenta e scontornarlo con `usa`; registrare le misure in `art/pezzi.json` e lasciare il prompt dentro il WebP.
- **Do** scegliere il colore del pennarello per foglio (`--marker-c`) in modo che legga su quella carta (≥ 4,5:1 sul corpo): nero sul kraft, teal sull'arancio, verde sul verde, blu sul crema e sul giallo, `--marker-rosso` sui fogli chiari.
- **Do** misurare il testo dei volantini in `max(px, cqw)` e tenere i tagliandi ad almeno 44 px di altezza (46 a telefono).
- **Do** scrivere tutto il testo visibile in minuscolo; la home non ha piè di pagina (credito e badge tolti da Alberto il 2026-10-09).
- **Do** rigenerare la 404 (`node tools/pzkko/genera-404.mjs`) dopo ogni modifica alla home, e l'anteprima `og.jpg` quando il primo schermo cambia.
- **Do** dire nel README che i manifesti degli altri sono finzione, e tenere i fogli di lavoro fuori dal repository (`tools/pzkko/lavoro/`).

### Don't:
- **Don't** imitare un materiale in CSS: niente bordi strappati in `clip-path`, nastri in gradiente, spray in `text-shadow`, carta in `box-shadow`. Se manca, si fotografa (si genera).
- **Don't** usare magenta, rosa o viola su nessun pezzo né nel CSS: sono la chiave cromatica.
- **Don't** introdurre colori d'interfaccia (blu dei link, verdi, rossi di stato), raggi, vetro, linee o griglie: la home non ha componenti di sistema, ha fogli.
- **Don't** aggiungere un quinto carattere, usare il carattere di sistema nel testo visibile o caricare i caratteri da un host esterno.
- **Don't** usare glifi Unicode o emoji al posto di un'icona: le frecce sono l'SVG `.freccia` a pennarello.
- **Don't** tornare alla scrivania Apple (dock, bento, superellissi, `backdrop-filter`): è il mondo sostituito il 2026-10-09, non una variante.
- **Don't** animare allo scorrimento o far girare movimenti da soli nella home: si muove solo ciò che risponde al puntatore o al dito.
- **Don't** riempire tools e i giochi non fatti con contenuto finto: il volantino «in arrivo» e «cercasi strumenti» sono la forma onesta del vuoto.
- **Don't** mettere testo vero dentro le immagini (a parte l'insegna, il cui `h1` ha il suo `alt`): i contatti e i nomi restano HTML, selezionabili e copiabili.
