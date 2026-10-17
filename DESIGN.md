---
name: pzkko.it
description: il muro di pzkko, i social di Alberto Pecchini come volantini attaccati a una saracinesca coperta di graffiti
colors:
  pietra: "#665d56"
  pietra-2: "#58504a"
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
  portale: "clamp(18px, 3.2vw, 40px) 0 0"
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
> Fonte di verità: i token stanno in `:root` e nel blocco `@media (prefers-color-scheme:dark)` di `index.html`; il CSS e lo script sono in linea nelle pagine, non c'è build. La 404 è generata dalla home da `tools/pzkko/genera-404.mjs` e ne eredita tutto. Le immagini del muro sono in `art/` (prompt in `tools/pzkko/fogli.js`, pipeline `immagini.mjs`); ogni WebP porta dentro il prompt con cui è nato. Le pagine dei due giochi fatti il 7–8.10 sono state tolte il 2026-10-17; la sera stessa la roulette è tornata, rifatta da zero, come finestra sopra il muro (`games/roulette/`, vedi «La finestra della roulette»). Il blackjack resta chiuso; mine, dado e moneta «in arrivo».

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
- **Muro del palazzo** (`--pietra` `#665d56`, sotto `art/intonaco.svg`): l'intonaco intorno alla saracinesca e il fondo dell'`html`, disegnato in SVG (piastrella da 640 px), con un'ombra sotto la gronda e una luce dall'alto in CSS. È anche il `theme-color`.
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

La pagina è la strada: `.strada` (il muro del palazzo, `art/intonaco.svg`) con `padding: 0 var(--stipite)` (`clamp(10px, 3vw, 40px)`: gli stipiti), il portale `.portale` (padding `clamp(18px, 3.2vw, 40px) 0 0`) con l'insegna centrata larga `min(100%, 840px)`, poi la saracinesca `.muro` (larghezza massima 1280 px, centrata, `container-type: inline-size`, `isolation: isolate`, ombra incassata).

**La parete.** `.parete` è un rettangolo a misure fisse, alto `calc(2258 * var(--u))` con `--u = calc(100cqw / 1280)`: tutto ciò che sta sul muro è `position: absolute` con `left`, `top` e `width` in unità della parete (`--x`, `--y`, `--w`) e una rotazione `--r` di pochi gradi (da −8° a +6°; i nastri sciolti fino a ±50°). L'ordine di profondità è `z-index`: graffiti 0 (`.tag`), manifesti e resti 1 (`.man`, `.pezzo`), volantini 3 (2 per quelli «sotto»), nastri sciolti sopra i fogli 4, il foglio o il manifesto sotto il puntatore 20 (sul telefono quello toccato, `.sopra`): i fogli nuovi coprono i vecchi, ma passandoci sopra viene fuori quello di sotto. Dal 2026-10-17 la saracinesca è più alta e le cose nuove stanno in cima: i volantini dei siti (zona `#siti`) mescolati alla roba degli altri (meme, pubblicità, cose attaccate con lo scotch); sotto, presentazione e social, poi giochi e strumenti. La composizione è a pile: cinque colonne da ~250 unità (x 12, 262, 512, 762, 1012; due a telefono, x 6 e 198), ogni pezzo con la sua larghezza, un piccolo scarto e una sovrapposizione di 10–40 unità con quello sopra; i graffiti, i nastri e i pezzi piccoli sono ancorati a un foglio vicino. Le pile stanno in `tools/pzkko/disposizione.js`; `tools/pzkko/disponi.mjs` misura le altezze vere e scrive le variabili nella pagina. Qualche sovrapposizione voluta ai bordi dei fogli, mai sul testo che conta.

**Il volantino cresce.** `.vol` ha `aspect-ratio: var(--ar)` (la proporzione del foglio) ed è una colonna flex con il testo in flusso (`.testo`, padding `--pad` dai bordi veri della carta): se il testo è più lungo della carta il foglio si allunga, perché l'immagine è in `background-size: 100% 100%`. Le posizioni tengono conto delle altezze reali misurate: dopo ogni cambio di testo si rilancia `disponi.mjs tutto`.

**Telefono (≤ 899 px).** `--u = calc(min(100cqw, 600px) / 390)`, la parete alta `3777` unità e larga al massimo 600 px centrata (su un tablet la lamiera riempie i lati): ogni elemento passa a `--mx`, `--my`, `--mw`, `--mr`. Due colonne di volantini (≈ 190 px l'uno), i manifesti un po' più stretti (150–180) fra i fogli, i graffiti dietro. I titoli scendono a `max(22px, 16cqw)`, i tagliandi salgono a `max(46px, 17cqw)`.

**Ritmo.** Non c'è un ritmo di sezioni: ci sono righe di fogli con 20–60 unità d'aria o di sovrapposizione, e le quattro parole sprayate come intestazioni di zona (`#siti`, `#social`, `#games`, `#tools`, con `scroll-margin-top: 24px`). Sotto la saracinesca resta la pietra, `padding-bottom: clamp(28px, 4vw, 56px)`.

**Soglie.** `max-width: 899px` (parete in 390esimi), i 600 px di larghezza massima della parete stretta, `(hover: hover)` per il sollevamento e il tagliando che si abbassa, `prefers-color-scheme: dark` per la notte, `prefers-reduced-motion: reduce` per togliere transizioni e caduta.

### Named Rules
**La regola della parete.** Sul muro non esiste il flusso: ogni cosa ha le sue coordinate in unità della parete, su due disposizioni (1280 e 390), e le si cambia leggendo i rettangoli reali (`tools` di prova: `getBoundingClientRect` con `transform: none`) prima di spostare un foglio. Un nuovo volantino prende un posto libero, non si aggiunge in coda.

## Elevation & Depth

La profondità è quella della carta sul metallo. Ogni volantino e ogni manifesto porta la propria ombra come `filter: drop-shadow` (segue il contorno strappato, non il rettangolo): una corta e una lunga, entrambe verso il basso. Al passaggio il foglio si solleva (`translateY` di 1,6 unità, `scale(1.015)`) e l'ombra si allunga. I graffiti non hanno ombra: sono vernice sulla lamiera (`mix-blend-mode: multiply` per i neri e i colori, `normal` per il cromato e il bianco). La saracinesca è incassata nel portale con due ombre interne. Di notte le ombre si scuriscono e l'insegna emette luce.

### Shadow Vocabulary
- **Foglio** (`.vol`: `drop-shadow(0 2px 3px rgba(0,0,0,.28)) drop-shadow(0 10px 16px rgba(0,0,0,.3))`; di notte `.4` / `.45`): il volantino attaccato al muro.
- **Foglio sollevato** (`.vol:has(h3 a:hover)`: `drop-shadow(0 4px 5px rgba(0,0,0,.3)) drop-shadow(0 26px 30px rgba(0,0,0,.36))`): il foglio staccato dal muro sotto il puntatore, in `.32s var(--eo)`.
- **Manifesto** (`.man`: `drop-shadow(0 2px 3px rgba(0,0,0,.3)) drop-shadow(0 8px 14px rgba(0,0,0,.28))`): i manifesti degli altri, un po' più piatti dei volantini.
- **Insegna**: niente ombre in CSS: l'ombra del cassonetto sul muro è disegnata dentro `insegna.svg` (due rettangoli sfocati, luce dall'alto a sinistra), come l'ombra delle lettere sul pannello.
- **Saracinesca** (`.muro`: `inset 0 10px 14px -8px rgba(0,0,0,.7), inset 0 -8px 10px -8px rgba(0,0,0,.5), 0 0 0 1px rgba(0,0,0,.5)`): la lamiera incassata fra architrave e soglia.
- **Lampioni** (`.lampioni`, `mix-blend-mode: screen`, opacità `--lampioni · --f-lampioni`: sodio `radial-gradient(46% 24% at 3% 0%, rgba(255,158,40,.95)…)`, neon `radial-gradient(44% 22% at 97% 0%, rgba(196,255,232,.85)…)`): non ombre ma luci, sopra tutto, `pointer-events: none`; **velo della sera** (`.buio`, `multiply`, `#0a0d1c` a `--notte · .64`) sotto di loro.

### Vetro
Nella home non c'è vetro: niente `backdrop-filter`, niente trasparenze d'interfaccia. L'unica traslucenza è quella fotografata dello scotch (alfa vero nel WebP).

### Named Rules
**La regola dell'ombra della carta.** Hanno ombra solo le cose di carta e l'insegna, e l'ombra è sempre `drop-shadow` sul contorno, mai `box-shadow` su un rettangolo. La vernice (graffiti, parole sprayate) non ha ombra. Non si aggiunge ombra per «far risaltare».

## Shapes

Nessuna forma geometrica: i bordi della home sono quelli fotografati (fogli strappati, nastro con le estremità frastagliate, adesivo rotondo con l'angolo sollevato, lettere a scatola) e il CSS non applica raggi (`rounded.nessuno`). L'unica forma disegnata dal CSS è la linea tratteggiata dei tagliandi (`1px dashed rgba(0,0,0,.45)` sopra, `.4` fra un tagliando e l'altro: la perforazione). La freccia a pennarello è un piccolo SVG in linea (`.freccia`, tratto 3 arrotondato, `currentColor`), non un glifo di carattere. Ogni volantino è ruotato di pochi gradi e i fogli sono specchiabili (`.flip`, `scaleX(-1)` sulla sola carta) per riusare lo stesso foglio senza che si noti.

## Components

### Muro e insegna (`.strada` / `.portale` / `.insegna`)
La sola foto vera della pagina è la lamiera; il muro e l'insegna sono disegnati in SVG in modo che non si veda (17.10.2026: prima una foto della facciata con lampioni e cavi, prima ancora ritagli attaccati alla pietra).
- **Muro:** `art/intonaco.svg`, piastrella 640 × 640: tre `feTurbulence` con `stitchTiles` (sabbia .75, grumi .09, ondulazioni .006) fanno l'altezza, `feDiffuseLighting` (luce distante, azimut 235°, elevazione 58°, `surfaceScale` 1.25) il rilievo, un quarto rumore largo le chiazze di colore.
- **Insegna:** `h1 > img.insegna` (`art/insegna.svg`, 1080 × 450, `alt="pzkko"`, precaricata), larga `min(100%, 840px)`: telaio, pannello, polvere, colature (rumore fitto in orizzontale, solo in alcune colonne), ruggine a soglia, grana fine, viti, adesivo con la chiocciola; le lettere sono un unico `path` arrotondato (`#tratto`, `stroke-width` 46) ripetuto per ombra, fianchi (cinque passi verso il basso a destra), bordo e faccia. Di sera `brightness(calc(1 - .55 * var(--notte)))`.
- **Notte:** `img.insegna.notte` (`art/insegna-notte.svg`, stessa tela): la stessa traccia come tubo al neon, la faccia calda e la luce sul pannello; opacità `--insegna · --f-insegna`. Intorno `.insegna-luce` e `.insegna-cono` in `screen`.

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

### La strada di notte (`.fari`, `.goccia`, `.formica`)
I lampioni della strada sono fuori vista: decidono solo quando passano le auto (`--lampioni`). La condensa dei condizionatori sul tetto, fuori vista: la goccia cade dal bordo alto della pagina sulla lamiera, Web Animations, ogni 3–9 s, con lo spruzzo dove batte e il rivolo stampato sulla lamiera. Le auto: `.fari` (fari che spazzano, `--auto-x`, `--auto-l`, colore `--auto-c`), `.freni` (fanali rossi dal lato d'uscita, `--freno`), `.neonauto` (neon sotto la scocca), tutte in `screen` sopra tutto; la lamiera riflette con `.muro::after` (la foto della lamiera a contrasto alto in `screen`, mascherata sotto i lampioni e sotto i fari). Le formiche (`.formica`, 11 px, cinque) camminano sul bordo basso della lamiera a 12–30 px/s, con pause e inversioni, aggiornate 12 volte al secondo.


### Parole sprayate (`.spray`)
Le intestazioni delle zone sono graffiti veri (`art/scritte/social.webp`, `games.webp`, `tools.webp`: spray nero, bianco, rosso-arancio; dal 2026-10-17 `art/scritte2/siti.webp`, giallo bordato di nero), dentro `h2.it.spray` con `id` `siti`, `social`, `games`, `tools` (gli anchor della 404); l'`img` porta `alt` con la parola. Stanno sulla lamiera (z 0, `mix-blend-mode: multiply` per il nero e il rosso, `normal` per il bianco e il giallo, `.bianco`/`.chiaro`), mai sopra un foglio.

### Manifesti e graffiti degli altri (`.man`, `.tag`, `.pezzo`)
Il disordine del muro: otto manifesti inventati (`art/manifesti1/`, `art/manifesti2/`: concerto della chiocciola, lezioni di roulette, teatro del browser, sagra del volantino, cercasi gatto, torneo di dadi, il manifesto punk «pzkko», testa o croce), nove graffiti (`art/tag/`), i resti di manifesti strappati, nastri sciolti, graffette, la puntina, l'adesivo (`art/nastro/`). Dal 2026-10-17, in cima, la roba degli altri attaccata dopo (`art/manifesti3/`, `art/manifesti4/`): il meme «unimore vs unibo» (vergine contro chad), il manifesto da incontro di boxe «lyca mobile vs tim», l'«avvistamento» di una fila di luci sopra rodigo («non sono ufo: è starlink»), la pubblicità moncler, il foglio verde acido di «brat», la cartolina di piazza tre torri, le frisk attaccate con lo scotch, il biglietto del parcheggio di milano; e due scritte (`art/scritte2/`: «brat summer», «unimore ≥ unibo»). Sono `img` con `alt=""` e `loading="lazy"`, posizionate come i volantini; i graffiti e i resti `pointer-events: none`. Non sono link: i marchi sono quelli della strada, il resto è finzione dichiarata (README). I manifesti vengono in primo piano al passaggio come i volantini.

### La finestra della roulette (`games/roulette/`)
Un `<dialog>` 800 × 600 che è il foglio: la carta fotografata (`art/roulette/carta.webp`, nastro ai quattro angoli) sta in `::before` e sborda dal riquadro (left −8,66 %, right −9,04 %, top −12,6 %, bottom −12,49 %: i bordi veri della carta misurati), così il riquadro è la carta; fondo `rgba(12,10,8,.62)` con un filo di sfocatura. Si attacca come un foglio (translateY 18 px, −1,4°, scala .97 → 0 in .32 s `--eo`) e si stacca al contrario. Sotto gli 820 px di larghezza o i 640 di altezza: a tutto schermo, la carta ingrandita senza nastro, la ruota sopra (minimo 220 px, 38svh), il saldo e le fiches, il tavolo sotto (le righe ~28 px), tutto scorre.
- **Testata:** «roulette» in Anton 44 px (32 al telefono), la voce in Permanent Marker 19 px `--rosso` (#b3121f) ruotata −1,5° (aria-live: dice cosa paga la puntata sotto il puntatore, «rien ne va plus», il numero e la vincita), la X a pennarello (SVG, tratto 4,2) per chiudere; Esc e il clic sul fondo chiudono.
- **Tavolo:** SVG in `multiply` sul foglio, geometria ricalcolata dallo spazio (dozzine e semplici 12,5 % ciascuna, tre colonne di numeri, zero 30–44 px, colonne «2:1» 26–34 px); filtro `#rl-ink` (feTurbulence + spostamento 1,6 + grana) su tutto quello che è stampato: celle piene rosse (#b3121f, .92) e nere (#161616, .9) col numero bianco in Anton, lo zero verde (#0b5d2b) a frontone, i rombi rosso e nero. Le zone cliccabili sopra: celle, bordi (cavalli, terzine), incroci (quartine, sestine, terzine con lo zero); le celle e le puntate esterne sono anche `role="button"` con `tabindex` e `aria-label` («pieno 17, paga 35 a 1»). L'evidenziatore è `rgba(255,212,0,.55)` sulle celle coperte (lo stesso giallo della selezione del sito). Sul numero uscito il cerchio a pennarello (un'ellisse che non si chiude, `--rosso`, tratto 2,4, disegnato in .42 s) e il segnaposto di cristallo (`art/fiches/dolly.webp`, cade da 60 px in .36 s con un rimbalzo).
- **Fiches:** fotografie viste dall'alto (`art/fiches/f1…f500.webp`), 28 px sul tavolo, 38 px nel mucchio da scegliere (quella scelta si alza di 7 px con l'ombra più lunga); le pile salgono di 2,6 px a fiche (al massimo 10 visibili), ogni fiche un po' storta. Il volo: arco con la fiche che si ingrandisce a 1,3 a metà strada e l'ombra che si allarga, .38 s `cubic-bezier(.3,.7,.4,1)`, poi il colpetto della pila (scala .9 → 1 in .16 s). Le perse scivolano verso il banco (in cima al tavolo) rimpicciolendo e svanendo, .52 s, una pila ogni 70 ms; la vincita arriva dal banco accanto alla pila (.46 s), dopo .65 s tutto vola al saldo, che conta in .9 s.
- **Banco:** «hai» a pennarello sopra il saldo in Anton 26 px, «sul tavolo: …» in Special Elite 11 px, i tasti «togli», «rifai», «×3» a pennarello blu sottolineati (#1446a0) e «gira» in Anton 26 px bianco su nero, ruotato −2°, con l'ombra piena di 3 px; disabilitato grigio #8a847c. Sotto il tavolo gli ultimi 12 numeri in tondini colorati (il più recente cerchiato) e «soldi finti: niente premi, niente pagamenti.».
- **Ruota 3D:** three.js con Rapier (vedi README di pzkko): luce di una lampada sopra (2,4, ombre PCF morbide 2048) e RoomEnvironment per i riflessi, toni `NeutralToneMapping` 1,05; materiali: mogano laccato (`art/roulette/legno.webp`, venatura lungo il giro, clearcoat 1), ebano per il piano dei rombi, cromo per rombi e torretta, ottone per le palette, l'anello dei numeri disegnato su una tela 4096 × 128 (rosso #a8121d, nero #141313, verde #0b6a32, filo d'oro #d8b56a, cifre in Anton strette di 2,1 volte perché sulla ruota lo spicchio si allarga), le caselle più cupe con la grana del feltro. Camera a 54°, la ruota riempie lo spazio. L'annuncio del numero è un timbro in Anton 40 px bianco su rosso/nero/verde, −3°, che cade da 1,8 a 1 con un rimbalzo.

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
