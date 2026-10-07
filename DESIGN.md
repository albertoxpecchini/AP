---
name: pzkko.it
description: la scrivania di pzkko, i social di Alberto Pecchini come icone in un dock di vetro, nella grammatica web di Apple
colors:
  bg: "#fff"
  tile: "#f5f5f7"
  fg: "#1d1d1f"
  fg2: "#6e6e73"
  link: "#0066cc"
  hair: "rgba(0,0,0,.1)"
  nav: "rgba(255,255,255,.72)"
  tray: "rgba(255,255,255,.55)"
  tray-edge: "rgba(255,255,255,.75)"
  tray-in: "rgba(255,255,255,.6)"
  tip: "rgba(255,255,255,.94)"
  slot: "rgba(0,0,0,.06)"
  slot-edge: "rgba(0,0,0,.08)"
  f1: "rgba(10,132,255,.17)"
  f2: "rgba(255,45,85,.13)"
  f3: "rgba(255,159,10,.16)"
  gh-a: "#3d4450"
  gh-b: "#1b1f24"
  gm-a: "#48484a"
  gm-b: "#1c1c1e"
  github-graphite: "#24292f"
  github-graphite-text: "#f5f5f7"
  github-graphite-muted: "#a1a1a6"
  github-graphite-link: "#2997ff"
  glyph: "#fff"
  selection: "rgba(0,113,227,.28)"
  bg-dark: "#000"
  tile-dark: "#1d1d1f"
  fg-dark: "#f5f5f7"
  fg2-dark: "#a1a1a6"
  link-dark: "#2997ff"
  hair-dark: "rgba(255,255,255,.14)"
  nav-dark: "rgba(0,0,0,.62)"
  tray-dark: "rgba(255,255,255,.08)"
  tray-edge-dark: "rgba(255,255,255,.16)"
  tray-in-dark: "rgba(255,255,255,.1)"
  tip-dark: "rgba(44,44,46,.96)"
  slot-dark: "rgba(255,255,255,.07)"
  slot-edge-dark: "rgba(255,255,255,.1)"
  f1-dark: "rgba(10,132,255,.42)"
  f2-dark: "rgba(255,45,85,.32)"
  f3-dark: "rgba(255,159,10,.28)"
  gh-a-dark: "#5a6270"
  gh-b-dark: "#24292f"
  gm-a-dark: "#6e6e73"
  gm-b-dark: "#2c2c2e"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2.75rem, min(9vw, 13svh), 6rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-.035em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-.02em"
  lede:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1rem, min(1.5vw, 2.6svh), 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.38
    letterSpacing: "-.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-.01em"
  brand:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-.02em"
  list:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.47
  tooltip:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "-.01em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "-.01em"
  label-dock-mobile:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "-.01em"
rounded:
  tip: "9px"
  focus: "10px"
  icon: "22%"
  tile-mobile: "24px"
  tile: "28px"
  dock: "28px"
spacing:
  dock-gap: "8px"
  dock-pad: "10px"
  bento-gap-mobile: "12px"
  bento-gap: "16px"
  wrap-mobile: "16px"
  wrap: "22px"
  tile-pad-mobile: "24px"
  tile-pad: "28px"
  nav-gap: "28px"
  hero-bottom: "calc(28px + env(safe-area-inset-bottom))"
  intro: "clamp(12px, 3svh, 32px) 0 clamp(16px, 4svh, 40px)"
  intro-mobile: "clamp(8px, 2svh, 24px) 0 clamp(12px, 3svh, 32px)"
  section-mobile: "64px"
  section: "88px"
  section-end: "96px"
  icon: "clamp(44px, min(4.6vw, 7.5svh), 64px)"
  icon-mobile: "clamp(48px, 14vw, 56px)"
  icon-tile: "60px"
  nav-height: "48px"
components:
  nav:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.fg}"
    typography: "{typography.label}"
    height: "48px"
  nav-brand:
    textColor: "{colors.fg}"
    typography: "{typography.brand}"
  dock-tray:
    backgroundColor: "{colors.tray}"
    rounded: "{rounded.dock}"
    padding: "10px"
    height: "calc(var(--sz) + 20px)"
  dock-tray-mobile:
    backgroundColor: "{colors.tray}"
    rounded: "{rounded.dock}"
    padding: "14px 10px 10px"
    width: "min(100%, 360px)"
  dock-icon:
    rounded: "{rounded.icon}"
    size: "{spacing.icon}"
  dock-icon-mobile:
    rounded: "{rounded.icon}"
    size: "{spacing.icon-mobile}"
  dock-tooltip:
    backgroundColor: "{colors.tip}"
    textColor: "{colors.fg}"
    typography: "{typography.tooltip}"
    rounded: "{rounded.tip}"
    padding: "5px 10px"
  tile:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.fg}"
    rounded: "{rounded.tile}"
    padding: "28px"
  tile-mobile:
    backgroundColor: "{colors.tile}"
    rounded: "{rounded.tile-mobile}"
    padding: "24px"
  tile-github:
    backgroundColor: "{colors.github-graphite}"
    textColor: "{colors.github-graphite-text}"
    rounded: "{rounded.tile}"
    padding: "28px"
  tile-title:
    textColor: "{colors.fg}"
    typography: "{typography.title}"
  tile-handle:
    textColor: "{colors.fg2}"
    typography: "{typography.body}"
  tile-go:
    textColor: "{colors.link}"
    typography: "{typography.body}"
  tile-app-icon:
    rounded: "{rounded.icon}"
    size: "60px"
  empty-folder:
    backgroundColor: "{colors.slot}"
    rounded: "{rounded.icon}"
    size: "128px"
    padding: "16px"
  empty-slot:
    backgroundColor: "{colors.slot}"
    rounded: "{rounded.icon}"
    size: "60px"
  empty-slot-label:
    textColor: "{colors.fg2}"
    typography: "{typography.label}"
  footer:
    textColor: "{colors.fg2}"
    typography: "{typography.label}"
    padding: "22px 0 max(22px, env(safe-area-inset-bottom))"
---

# Design System: pzkko.it

> **Perimetro.** Questo documento descrive **solo pzkko.it**, la cartella statica `albertopecchini.it/pzkko/` (index.html, 404.html e le icone accanto). Gli altri due siti dello stesso repository, albertopecchini.it (portfolio, `albertopecchini.it/src/`) e bettercallpekko.it (`SITE=bcp`), hanno ciascuno la propria identità già nel codice e **non** la condividono con questa: niente di quanto segue va applicato a loro, e niente di loro va portato qui.
>
> Fonte di verità: i token stanno in `:root` e nel blocco `@media (prefers-color-scheme:dark)` di `index.html`; il CSS e lo script sono in linea nelle pagine, non c'è build. La 404 è generata dalla home da `tools/pzkko/genera-404.mjs` e ne eredita tutto, dock compreso.

## Overview

**Creative North Star: "La scrivania di pzkko"**

pzkko.it è una scrivania, non un elenco. I cinque social e le due zone (tools, games) vivono come icone di app in un dock di vetro posato in fondo al primo schermo: l'hero occupa tutta la finestra, con il solo nome e una riga al centro e il dock sul bordo inferiore, e scorre via con il resto («se scorro giù via la barra, non mi serve», 2026-10-07). Sotto, schede bento spiegano ogni social. La grammatica è quella del web di Apple, presa per intero e non citata: carattere di sistema, display stretto, 17 px di corpo, materiali traslucidi con sfocatura, superellissi vere, molle criticamente smorzate che si possono interrompere in ogni istante.

Il primo schermo si adatta a qualunque finestra su entrambi gli assi: nome, riga, icone e respiri verticali sono `clamp()` con un `min(vw, svh)` in mezzo, così la scrivania intera sta sempre in vista senza scorrere, da un telefono stretto a una finestra bassa e larga. La densità è bassa e la gerarchia è data dalla dimensione e dal peso di un unico carattere (sempre 600 per i titoli, 400 per il resto), mai dal colore: tutta la pagina è neutra (bianco e #f5f5f7 in chiaro, nero e #1d1d1f in scuro) e il colore di marca compare solo dentro le icone squircle e come alone tenue nelle schede. Il sito segue il tema del sistema con `color-scheme: light dark`, è tutto in minuscolo e parla in prima persona.

Rifiuti confermati dal percorso di progetto: la colonna link-in-bio di tasti uguali; l'hero su mesh gradient con tre card; gli oggetti skeuomorfici letterali (la prima versione con iPhone e portafoglio MagSafe, bocciata il 2026-10-07); il dock fissato alla finestra che segue lo scorrimento (provato e tolto lo stesso giorno); le rivelazioni allo scorrimento e qualunque movimento decorativo che giri da solo.

**Key Characteristics:**
- Un dock in fondo al primo schermo (`.dockwrap` / `.dock`) come azione primaria: sette icone, separatore, vetro con `backdrop-filter: blur(30px) saturate(1.6)`; scorre via con l'hero.
- Primo schermo «adattatore automatico»: `--sz: clamp(44px, min(4.6vw, 7.5svh), 64px)` e le stesse curve a due assi per nome, riga e respiri.
- Una sola famiglia tipografica, quella di sistema, in due tagli (`--fd` display, `--ft` testo); tutto minuscolo.
- Neutri puri più un solo accento, il blu link (`--link`); il colore di marca vive solo nelle icone e negli aloni `--glow`.
- Superellisse vera (clipPath `#sq`) per ogni icona e per gli stati vuoti; raggio 28 px per schede e dock.
- Un solo momento di movimento autoriale (ingresso dell'hero e del dock), poi solo movimento in risposta al puntatore o al dito.
- Ripieghi dichiarati per `prefers-reduced-motion` e `prefers-reduced-transparency`.

## Colors

Una tavolozza di neutri Apple in due temi, con il blu link come unico accento e il colore di marca confinato nelle icone.

### Primary
- **Blu link** (`--link`, chiaro `#0066cc`, scuro `#2997ff`): il solo accento della pagina. Colora la riga «apri …» (`.go`) in fondo a ogni scheda, l'anello di fuoco (`:focus-visible`, 2 px, offset 3 px) e la selezione del testo (`::selection`, `rgba(0,113,227,.28)`). Dentro la scheda grafite di GitHub il blu è fissato a `#2997ff` in entrambi i temi, perché quella scheda è scura sempre.

### Neutral
- **Fondo** (`--bg`, `#fff` / `#000`): la carta della pagina e dell'`html`, anche come ripiego opaco della striscia di navigazione quando la trasparenza è ridotta.
- **Scheda** (`--tile`, `#f5f5f7` / `#1d1d1f`): il grigio delle schede bento e dei due stati vuoti; anche ripiego opaco del dock senza trasparenza.
- **Testo** (`--fg`, `#1d1d1f` / `#f5f5f7`): titoli, nome nel dock mobile, testo dell'etichetta a comparsa.
- **Testo secondario** (`--fg2`, `#6e6e73` / `#a1a1a6`): la riga sotto il nome (`.lede`), gli handle (`.hd`), le descrizioni degli stati vuoti, il piè di pagina, le etichette degli slot; anche il colore della barra di scorrimento.
- **Filo** (`--hair`, `rgba(0,0,0,.1)` / `rgba(255,255,255,.14)`): l'unica linea della pagina: il bordo sotto la nav quando si scorre (`.nav.scrolled`), il separatore del dock (`.sep`), il bordo alto del piè di pagina, l'anello da 1 px intorno all'etichetta.
- **Vetro della nav** (`--nav`, `rgba(255,255,255,.72)` / `rgba(0,0,0,.62)`): la striscia traslucida in alto, sempre con `blur(20px) saturate(1.8)`.
- **Vetro del dock** (`--tray`, `rgba(255,255,255,.55)` / `rgba(255,255,255,.08)`) con bordo (`--tray-edge`) e luce interna (`--tray-in`): il materiale del dock. In scuro il vetro è bianco a bassa opacità, non nero: è il dock di macOS in modalità scura.
- **Etichetta** (`--tip`, `rgba(255,255,255,.94)` / `rgba(44,44,46,.96)`): il fumetto che compare sopra l'icona col puntatore.
- **Slot** (`--slot`, `rgba(0,0,0,.06)` / `rgba(255,255,255,.07)`) con bordo interno (`--slot-edge`): la forma di ciò che arriverà nei due stati vuoti (cartella e caselle).
- **Grafite GitHub** (`#24292f`, testo `#f5f5f7`, secondario `#a1a1a6`, righe `rgba(255,255,255,.12)`): la sola scheda colorata, identica nei due temi, fissata in CSS e non in token perché non cambia col tema.
- **Icone grafite** (`--gh-a`/`--gh-b` per GitHub, `--gm-a`/`--gm-b` per games): sfumature verticali da chiaro a scuro, più luminose in tema scuro perché l'icona resti leggibile sul vetro.

### Campo di colore (sfondo dell'hero)
- **Tre aloni** (`--f1` blu `rgba(10,132,255,…)`, `--f2` rosa `rgba(255,45,85,…)`, `--f3` arancio `rgba(255,159,10,…)`): tre `radial-gradient` posizionati nella metà bassa dell'hero (`.field`), dietro il dock. In chiaro sono quasi impercettibili (.13–.17 di alpha), in scuro salgono (.28–.42) perché su nero il vetro ha bisogno di qualcosa da sfocare. Sono lo «sfondo della scrivania»: non vanno usati altrove.

### Colori di marca (solo dentro le icone)
Le superfici delle icone sono sfumature verticali `linear-gradient(180deg, var(--ia), var(--ib))` con i colori dichiarati in linea sull'elemento: WhatsApp `#60d66a → #20b038`, e-mail `#1fb6ff → #0a6cff`, PayPal `#009cde → #003087`, tools `#9a9aa0 → #636366`; Instagram ha il suo gradiente radiale di marca (`#fdf497`, `#fd5949`, `#d6249f`, `#285aeb`). Il glifo è sempre bianco (`#fff`). Ogni scheda porta un alone `--glow` dello stesso colore di marca a bassa alpha (per esempio `rgba(214,36,159,.34)` per Instagram, `rgba(37,211,102,.26)` per WhatsApp, `rgba(120,120,128,.14)` per gli stati vuoti), disegnato come `radial-gradient` nell'angolo in alto a sinistra della scheda.

### Named Rules
**La regola del blu unico.** L'unico accento della pagina è `--link`. Non esistono altri colori di interfaccia: niente verde di conferma, niente rosso di errore, niente bottoni pieni colorati. Se serve attenzione, si usa peso o dimensione, non tinta.

**La regola del colore dentro l'icona.** Il colore di marca di un servizio vive in due posti soltanto: la superficie della sua icona squircle e l'alone `--glow` della sua scheda. Mai nel testo, mai nel bordo, mai nel fondo di una scheda.

**La regola della grafite che si guadagna.** La sola scheda a fondo pieno è quella di GitHub (`#24292f`), e lo è perché porta contenuto in più: l'elenco dei tre siti che ospita. Una scheda non si colora per decorazione; si colora quando ha qualcosa da dire che le altre non hanno.

## Typography

**Display Font:** il carattere di sistema in taglio display (`--fd`: SF Pro Display su Apple, Segoe UI Variable Display su Windows, poi Roboto, Helvetica, Arial)
**Body Font:** il carattere di sistema in taglio testo (`--ft`: SF Pro Text, Segoe UI Variable Text, poi Roboto, Helvetica, Arial)
**Label/Mono Font:** nessuno; le etichette usano `--ft` a 11–13 px. I numeri (telefono, handle) usano `font-variant-numeric: tabular-nums`.

**Character:** una sola famiglia, quella che il visitatore ha già sul dispositivo; la gerarchia nasce dalla dimensione, dal peso 600 contro 400 e dalla spaziatura negativa che si stringe salendo di corpo (da -.01em a -.035em). Nel primo schermo le dimensioni seguono la finestra su entrambi gli assi; dal secondo schermo in giù seguono solo la larghezza. Tutto il testo visibile è minuscolo, scritto così nel sorgente e non con `text-transform`. Nessun carattere viene scaricato.

### Hierarchy
- **Display** (600, `clamp(2.75rem, min(9vw, 13svh), 6rem)`, interlinea 1, `-.035em`): solo il nome «pzkko» nell'hero; il `min(9vw, 13svh)` lo tiene nel primo schermo anche in finestre basse. Nella 404 il titolo scende a `clamp(2.25rem, 6vw, 4rem)`, interlinea 1.05, `-.03em` (`.p404 h1`), perché è una frase e non un marchio.
- **Headline** (600, `clamp(2rem, 4vw, 2.5rem)`, interlinea 1.1, `-.02em`): i titoli di sezione «social», «tools», «games» (`.sec h2`), con 28 px sotto.
- **Title** (600, 24 px, interlinea 1.2, `-.02em`): il nome del servizio nella scheda (`.tx strong`) e il titolo degli stati vuoti (`.empty h3`).
- **Lede** (400, `clamp(1rem, min(1.5vw, 2.6svh), 1.3125rem)`, interlinea 1.38, colore `--fg2`): la riga sotto il nome, `max-width: 68ch`, `text-wrap: balance`, su una riga sola a desktop.
- **Body** (400, 17 px, interlinea 1.47, `-.01em`): il corpo di tutto, compresi handle (`.hd`), note (`.nt`, max 32ch), riga «apri …» (`.go`) e descrizioni degli stati vuoti (max 40ch).
- **Brand** (600, 17 px, interlinea 1, `-.02em`): «pzkko» nella striscia di navigazione.
- **List** (400, 15 px): l'elenco dei siti nella scheda GitHub (`.sites`), numeri tabulari.
- **Tooltip** (400, 13 px, `-.01em`): l'etichetta sopra l'icona del dock col puntatore.
- **Label** (400, 12 px, `-.01em`): voci della nav, piè di pagina, nomi dei giochi sotto gli slot. Nel dock mobile le etichette sotto le icone scendono a 11 px.

### Named Rules
**La regola del sistema.** Non si aggiungono webfont. Il carattere è quello del dispositivo, nei due tagli `--fd` e `--ft`; se una piattaforma non ha il taglio display, la catena di ripiego lo risolve da sola.

**La regola del minuscolo.** Tutto il testo visibile è minuscolo nel sorgente, nomi propri compresi («alberto pecchini», «instagram»). Non si usa `text-transform`, né in un verso né nell'altro. Titolo e meta della pagina conservano le maiuscole.

## Layout

La pagina è una colonna centrata di larghezza massima 1024 px (`.wrap`, `max-width: 1024px`, padding laterale 22 px, 16 px sotto i 640 px). Il `body` è una colonna flex a `min-height: 100svh` con `main` che si allarga, così il piè di pagina sta in fondo anche con poco contenuto.

**Primo schermo.** Una nav sticky alta 48 px e sotto un hero che occupa il resto della finestra: `min-height: calc(100svh - 48px)`, con `svh` e non `vh` perché su iPhone la barra dell'indirizzo non faccia saltare nulla; padding `24px 16px calc(28px + env(safe-area-inset-bottom))` (12 px sopra a telefono). L'hero è una colonna flex: `.intro` (flex 1) centra nome e riga nello spazio disponibile con respiri `clamp(12px, 3svh, 32px) 0 clamp(16px, 4svh, 40px)` (`clamp(8px, 2svh, 24px) 0 clamp(12px, 3svh, 32px)` a telefono), e `.dockwrap`, una riga flex centrata a larghezza piena, chiude l'hero in basso. Il dock fa parte del flusso: scorre via con il primo schermo, non segue la finestra.

**Adattatore automatico.** Tutto ciò che sta nel primo schermo si misura su entrambi gli assi con `clamp(min, min(Xvw, Ysvh), max)`: l'icona del dock `--sz: clamp(44px, min(4.6vw, 7.5svh), 64px)`, il nome, la riga, i respiri di `.intro`. Il risultato è che hero e dock stanno sempre interi nella finestra, qualunque sia il rapporto fra larghezza e altezza. Sotto i 640 px l'icona si misura sulla sola larghezza, `clamp(48px, 14vw, 56px)`.

**Dock.** A desktop una riga di icone da `--sz` allineate in basso, gap 8 px, padding 10 px, alto `calc(var(--sz) + 20px)`. Sotto i 640 px diventa una schermata home: `flex-wrap: wrap`, al massimo tre app per riga (`flex: 0 0 calc(33.333% - 10px)`, quindi 3+3+1 con sette icone), icone `clamp(48px, 14vw, 56px)` con etichetta da 11 px sotto, larghezza 100% fino a 360 px, padding `14px 10px 10px`, il separatore sparisce.

**Bento.** Griglia a 6 colonne (`.bento`, gap 16 px). Instagram e GitHub occupano 3 colonne ciascuna con `min-height: 280px`; WhatsApp, e-mail e PayPal 2 colonne ciascuna con `min-height: 230px`. Sotto i 1024 px WhatsApp ed e-mail salgono a 3 colonne e PayPal prende la riga intera; sotto i 640 px tutto a colonna piena, gap 12 px, altezza minima libera. Gli stati vuoti sono una scheda a due colonne (`.empty`, `minmax(0,1fr) auto`, gap `32px 48px`) con testo a sinistra e forma a destra; a telefono diventano una colonna sola (gap 28 px) con la forma allineata a sinistra.

**Ritmo verticale.** Le sezioni distano 88 px dal contenuto sopra (`.sec`, 64 px a telefono) e l'ultima aggiunge 96 px sotto; `scroll-margin-top: 72px` per gli anchor della nav. Il piè di pagina ha 22 px sopra e `max(22px, env(safe-area-inset-bottom))` sotto.

**Soglie.** `max-width: 1023px` (bento a due per riga), `max-width: 640px` (telefono: dock a griglia, colonna singola), `(hover: hover) and (pointer: fine)` per le etichette a comparsa, `(hover: hover) and (pointer: fine) and (min-width: 641px)` per la fisica del dock nello script.

### Named Rules
**La regola dei due assi.** Nel primo schermo nessuna misura dipende dalla sola larghezza: ogni dimensione fluida è `clamp(min, min(vw, svh), max)`, perché la scrivania deve stare intera in vista anche in una finestra bassa. Dal secondo schermo in giù basta `vw`.

## Elevation & Depth

Il sistema è ibrido: le superfici appoggiate (schede, stati vuoti, piè di pagina) sono piatte e si distinguono per tono (`--tile` su `--bg`), mentre gli oggetti che fluttuano sopra la pagina (dock, icone, etichetta) hanno ombre morbide e larghe. Il vetro (`backdrop-filter`) è il terzo mezzo: la nav lascia vedere, sfocato e saturato, il contenuto che le scorre sotto; il dock lascia vedere il campo di colore dell'hero. Ogni ombra ha una direzione dall'alto (y positivo) e un alpha basso; non esistono ombre dure, nette o colorate.

### Shadow Vocabulary
- **Dock** (`--shadow: 0 30px 60px -30px rgba(0,0,0,.35)`, scuro `rgba(0,0,0,.9)`, più `inset 0 1px 0 var(--tray-in)`): il dock si solleva dalla pagina con un'ombra lunga e spinta in basso e una luce sul filo superiore, come un vassoio di vetro.
- **Icona del dock** (`filter: drop-shadow(0 5px 10px rgba(0,0,0,.18))`, mobile `.16` sulla `.face`): segue il contorno della superellisse, non il rettangolo; per questo è `filter` e non `box-shadow`.
- **Icona nella scheda** (`.app`: `filter: drop-shadow(0 8px 16px rgba(0,0,0,.16))`): un po' più alta della sorella nel dock perché sta su un fondo chiaro e fermo.
- **Etichetta** (`0 2px 10px rgba(0,0,0,.14), 0 0 0 1px var(--hair)`): ombra breve più anello da 1 px, il fumetto di macOS.
- **Filo della nav** (`.nav.scrolled`: `0 1px 0 var(--hair)`): non un'ombra ma una linea di 1 px, che compare solo quando il contenuto scorre sotto (IntersectionObserver sulla `.sentinel`).
- **Slot vuoti** (`inset 0 0 0 1px var(--slot-edge)`): un bordo interno appena visibile, la forma di un'icona che non c'è ancora.

### Vetro
- **Nav**: `backdrop-filter: blur(20px) saturate(1.8)` su `--nav`.
- **Dock**: `backdrop-filter: blur(30px) saturate(1.6)` su `--tray`, bordo 1 px `--tray-edge`.
- Con `prefers-reduced-transparency: reduce` la nav diventa `--bg` opaco e il dock `--tile` opaco, senza sfocatura.

### Named Rules
**La regola del vetro che poggia.** Hanno ombra solo le cose che stanno sopra la pagina: il dock, le icone, l'etichetta. Le schede non hanno ombra né bordo, mai: si staccano dal fondo solo per tono. Non si aggiunge un'ombra a una scheda per farla «risaltare».

**La regola della linea sola.** L'unica linea del sistema è `--hair` a 1 px: sotto la nav quando si scorre, come separatore nel dock, sopra il piè di pagina, tra le righe dell'elenco GitHub. Non esistono bordi di scheda, divisori di sezione o cornici.

## Shapes

Due famiglie di forme, entrambe continue e senza spigoli. Le **superfici** (schede, stati vuoti, dock) hanno raggio 28 px (`.tile`, `.dock`), che scende a 24 px per le schede sotto i 640 px; l'etichetta a comparsa ha raggio 9 px e l'anello di fuoco 10 px. Le **icone** sono superellissi vere: ogni `.face`, la cartella `.folder` e le caselle `.slots i` sono tagliate con `clip-path: url(#sq)`, un `clipPath` in `objectBoundingBox` definito in fondo alla pagina (il contenitore `.dk` porta anche `border-radius: 22%` per l'ombra e il fuoco). Il glifo dentro l'icona occupa il 54% del lato (50–60% per i glifi che hanno bisogno di correzione ottica, dichiarato in linea). Non esistono cerchi, pillole, né rettangoli ad angolo vivo; l'unica eccezione geometrica è il separatore verticale di 1 px nel dock.

## Components

### Navigazione (`.nav`)
Una striscia traslucida sotto cui scorre il contenuto.
- **Forma:** `position: sticky`, alta 48 px, nessun raggio, nessun bordo a riposo.
- **Materiale:** `--nav` con `blur(20px) saturate(1.8)`; opaca `--bg` senza trasparenza.
- **Contenuto:** marchio «pzkko» a sinistra (`.brand`, 600 17 px `--fd`, `-.02em`); a destra tre voci (`social`, `tools`, `games`) a 12 px, gap 28 px (20 px a telefono), `opacity: .82` che sale a 1 al passaggio (`.15s ease`).
- **Scorrimento:** quando la `.sentinel` esce dalla vista compare `.nav.scrolled` con il filo `0 1px 0 var(--hair)`, transizione `.3s var(--eo)`.
- **Mobile:** uguale, senza menu a scomparsa: sono tre voci.

### Dock (`.dockwrap` / `.dock`)
Il componente firma: le sette app della scrivania in un vassoio di vetro in fondo al primo schermo.
- **Posizione:** `.dockwrap` è una riga flex centrata (`display: flex; justify-content: center; width: 100%`) in coda all'hero, dopo `.intro`. Non è fissa: scorre via con il primo schermo.
- **Vassoio:** `--tray`, bordo 1 px `--tray-edge`, raggio 28 px, padding 10 px, gap 8 px, alto `calc(var(--sz) + 20px)`, `--shadow` più luce interna, `blur(30px) saturate(1.6)`; `--tile` opaco senza trasparenza. `aria-label="collegamenti rapidi"`.
- **Icona (`.dk` / `.face`):** lato `--sz` = `clamp(44px, min(4.6vw, 7.5svh), 64px)`, superellisse `#sq`, sfumatura verticale `--ia → --ib`, glifo bianco al 54%, `drop-shadow(0 5px 10px rgba(0,0,0,.18))`. Ordine fisso: instagram, github, whatsapp, e-mail, paypal, separatore `.sep` (1 px, alto il 78% dell'icona, margine 6 px), tools, games.
- **Pressione:** `.dk:active .face { transform: scale(.92) }` in `.1s var(--eo)`.
- **Fuoco:** anello `--link` 2 px con offset 4 px (`.dk:focus-visible`), e l'etichetta compare come al passaggio.
- **Etichetta (`.lbl`):** sopra l'icona a `calc(100% + 12px)`, `--tip`, raggio 9 px, padding 5 px 10 px, 13 px, ombra breve più anello `--hair`; a riposo `opacity: 0` e `translate(-50%, 4px)`, compare in `.12s` solo con `(hover: hover) and (pointer: fine)` o col fuoco.
- **Fisica (script in linea):** ogni icona è una molla criticamente smorzata (damping 1.0, response 0.32 s, `OMEGA = 2π / 0.32`) verso una scala bersaglio `1 + (MAG - 1) · exp(-(d²)/(SPREAD²))` con `MAG = 1.5`, `SPREAD = 1.25` larghezze d'icona e `d` la distanza del puntatore dal centro dell'icona; si aggiorna a ogni `pointermove`, torna a 1 su `pointerleave`, `dt` limitato a 1/30 s. La larghezza di riposo si legge dal layout (`items[0].getBoundingClientRect().width`, ripiego 64) e si rimisura su `resize` quando le molle sono ferme, azzerando prima gli stili in linea, così la fisica segue `--sz` a qualunque finestra. Attiva solo con `(hover: hover) and (pointer: fine) and (min-width: 641px)` e senza `prefers-reduced-motion: reduce`; gli eventi `touch` sono ignorati. Quando la condizione cambia lo script rimuove gli stili in linea, l'ascoltatore di `resize` e ferma il frame.
- **Mobile (≤ 640 px):** vassoio a larghezza piena fino a 360 px, padding `14px 10px 10px`, gap `10px 14px`, icone `clamp(48px, 14vw, 56px)` con etichetta da 11 px sotto (padding `0 2px`, ellissi se stretta), tre per riga (3+3+1), nessun separatore, nessuna fisica.
- **404:** stesso dock nello stesso hero, generato dalla home.

### Schede bento (`.tile`)
Schede neutre che spiegano un social; una sola è grafite.
- **Forma:** raggio 28 px (24 px a telefono), `overflow: hidden`, nessun bordo, nessuna ombra.
- **Fondo:** `--tile`, con alone `--glow` (dichiarato in linea per scheda) come `radial-gradient(58% 60% at 16% 10%, var(--glow), transparent 72%)` nel `::before`.
- **Padding interno:** 28 px (24 px a telefono); testo spinto in fondo con `margin-top: auto` e 28 px sopra (40 px a telefono).
- **Contenuto:** icona `.app` da 60 px (stessa superellisse del dock, ombra più alta), nome in Title (`.tx strong`), handle in Body `--fg2` con numeri tabulari (`.hd`), nota a 32ch (`.nt`), riga d'azione `.go` in `--link` con chevron da 16 px (`stroke-width: 2`).
- **Stati:** al passaggio la riga `.go` si sottolinea (`text-underline-offset: 3px`) e il chevron scorre di 2 px (`.2s var(--eo)`); alla pressione la scheda intera `scale(.985)` (`.16s var(--eo)`) e l'icona `scale(.92)`.
- **Variante GitHub (`.tile.gh`):** fondo `#24292f`, testo `#f5f5f7`, `.hd` `#a1a1a6`, `.go` `#2997ff`; in più l'elenco `.sites` (15 px, `#a1a1a6`, righe separate da `1px solid rgba(255,255,255,.12)`, padding 8 px) con i tre siti ospitati. È l'unica scheda che non segue il tema.

### Stati vuoti (`.tile.empty`)
La forma di quello che arriverà, senza contenuto finto.
- **Forma e fondo:** una `.tile` con `--glow: rgba(120,120,128,.14)`, griglia testo + forma.
- **Testo:** titolo in Title (`.empty h3`), descrizione in Body `--fg2` a 40ch con 10 px sopra.
- **Cartella (tools, `.folder`):** 128 px (112 px a telefono), superellisse `#sq`, fondo `--slot`, dentro una griglia 3×3 di nove superellissi `--slot` con bordo interno `--slot-edge`, gap 8 px, padding 16 px.
- **Caselle (games, `.slots`):** cinque caselle da 60 px (56 px a telefono) in superellisse `--slot` con bordo `--slot-edge`, gap 24 px, ognuna con il nome del gioco sotto a 12 px `--fg2`; tre per riga a telefono. Quando un gioco esiste prende il posto della sua casella.

### Piè di pagina (`.foot`)
- **Forma:** bordo alto 1 px `--hair`, padding `22px 0 max(22px, env(safe-area-inset-bottom))`.
- **Testo:** 12 px `--fg2`, due estremi (`space-between`): a sinistra il credito «sito di alberto pecchini» con link esatto a `https://www.albertopecchini.it` e `rel="author"`, a destra «pzkko.it». Al passaggio il link passa a `--fg`.

### Movimento
- **Ingresso (una volta sola, solo con `prefers-reduced-motion: no-preference`):** `h1` e `.lede` entrano con `rise` (`.7s var(--eo)`, da `opacity: 0; translateY(12px)`), la lede con 70 ms di ritardo; il dock con `materialize` (`.8s`, ritardo 140 ms, da `translateY(16px) scale(.96) blur(10px)`); la nav con `fade` (`.6s ease`).
- **Risposta:** fisica del dock (sopra), pressione `.1s`, chevron `.2s`, scheda `.16s`, opacità delle voci nav `.15s`, filo della nav `.3s`; tutte con `--eo: cubic-bezier(.23,1,.32,1)` salvo le dissolvenze.
- **Niente allo scorrimento:** nessuna rivelazione, nessun parallasse, nessun elemento che segue la finestra; l'unico effetto legato allo scroll è il filo sotto la nav. `scroll-behavior: smooth` solo senza riduzione del movimento.

## Do's and Don'ts

### Do:
- **Do** tenere il dock in fondo all'hero a tutto schermo, nel flusso, dopo `.intro`: la scrivania è il primo schermo e scorre via con esso.
- **Do** misurare ogni cosa del primo schermo su due assi, `clamp(min, min(Xvw, Ysvh), max)`, come `--sz`, il nome e la riga, così hero e dock stanno interi in qualunque finestra.
- **Do** tagliare ogni nuova icona con `clip-path: url(#sq)` e colorarla con `--ia`/`--ib` dichiarati in linea; il glifo resta bianco al 54% del lato.
- **Do** dare a ogni nuova scheda il fondo `--tile`, raggio 28 px, padding 28 px e un alone `--glow` del colore del servizio a bassa alpha (.14–.34).
- **Do** usare `--fd` 600 per titoli e nomi, `--ft` 400 per tutto il resto, e la spaziatura negativa prevista per il corpo (da `-.01em` a `-.035em`).
- **Do** prevedere il ripiego per `prefers-reduced-transparency` (fondo opaco `--bg` o `--tile`) e per `prefers-reduced-motion` (nessun ingresso, nessuna fisica) in ogni nuovo vetro o movimento.
- **Do** aggiungere un nuovo strumento o gioco al posto della sua casella negli stati vuoti e come nuova icona nel dock, rispettando le righe da tre a telefono.
- **Do** scrivere tutto il testo visibile in minuscolo nel sorgente e firmare il piè di pagina con il link esatto a `https://www.albertopecchini.it`.

### Don't:
- **Don't** fissare il dock alla finestra (`position: fixed`) né riservargli spazio nel piè di pagina: provato e tolto il 2026-10-07.
- **Don't** introdurre un secondo colore d'interfaccia oltre `--link`, né un colore di marca fuori dall'icona e dal suo `--glow`.
- **Don't** dare ombre o bordi alle schede: si staccano dal fondo solo per tono (`--tile` su `--bg`).
- **Don't** aggiungere webfont, `text-transform` o maiuscole nel testo visibile.
- **Don't** usare `100vh` per l'hero: il sistema usa `100svh` ed `env(safe-area-inset-bottom)`.
- **Don't** animare allo scorrimento, né far girare movimenti da soli: dopo l'ingresso si muove solo ciò che risponde al puntatore o al dito.
- **Don't** usare oggetti skeuomorfici letterali (telefoni, portafogli, scrivanie disegnate) né la colonna di tasti uguali del link-in-bio.
- **Don't** colorare a fondo pieno una scheda che non porta contenuto in più: la grafite di GitHub è un'eccezione guadagnata, non un modello.
- **Don't** riempire tools e games con contenuto finto: lo stato vuoto è la forma dell'oggetto futuro, non una promessa illustrata.
