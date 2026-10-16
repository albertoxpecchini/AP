# Product

<!-- impeccable:product-schema 1 -->

Questo repository contiene i siti di Alberto Pecchini: il portfolio serio
(albertopecchini.it) e la parodia Better Call Pekko (bettercallpekko.it, `SITE=bcp`)
escono dallo stesso progetto Vite in `albertopecchini.it/`; **pzkko.it** è una
cartella di file statici, `albertopecchini.it/pzkko/`, senza build. Questo
documento riguarda **pzkko.it**: gli altri due hanno la loro identità già nel
codice e non la condividono con questo.

## Platform

web

## Users

Chi arriva da un handle: un follower di Instagram, chi ha trovato il profilo
GitHub, un amico o un cliente a cui Alberto ha detto «cerca pzkko». Arriva quasi
sempre dal telefono, resta pochi secondi, vuole sapere chi è pzkko e come
raggiungerlo. Più avanti tornerà per usare uno strumento o giocare.

## Product Purpose

pzkko.it è l'indirizzo personale di Alberto Pecchini (pzkko è il suo nome in
rete): raccoglie i suoi social in un posto solo e farà da casa a piccoli
strumenti web e a giochi da browser, da aggiungere uno alla volta. Il sito ha
successo se chi arriva capisce subito chi c'è dietro e tocca il social giusto
senza cercare.

## Positioning

Non è un link-in-bio generico: è il sito di una persona che progetta siti, e si
vede dalla cura. Le due zone «tools» e «games» sono la differenza rispetto a una
lista di link: pzkko.it crescerà come un piccolo ecosistema di cose fatte da
Alberto, non come una vetrina di link altrui.

## Operating Context

- File statici in `albertopecchini.it/pzkko/` (index.html, 404.html, robots,
  sitemap, vercel.json), niente build: CSS e JS stanno in linea nelle pagine.
  Progetto Vercel a parte con quella cartella come Root Directory, dominio
  principale `https://www.pzkko.it` (l'apice rimanda a www). In locale:
  `npx serve albertopecchini.it/pzkko`.
- Lingua: italiano (confermato il 2026-10-07).
- Ambiente d'uso: telefono in mano, luce qualsiasi; segue il tema del sistema.

## Capabilities and Constraints

- Social confermati (2026-10-07), nell'ordine: Instagram @albertoxpecchini,
  GitHub albertoxpecchini, WhatsApp +39 351 0355506 (wa.me), e-mail
  pzkko@yahoo.com, PayPal albertoxpecchini (paypal.biz).
- Zone «tools» e «games»: per ora **vuote**, vivono come sezioni della home con
  uno stato vuoto curato (scelta del 2026-10-07); quando arrivano i primi
  contenuti diventano pagine in `pzkRoutes`. Giochi in programma: mine,
  dado, moneta, senza soldi veri (blackjack e roulette sono stati fatti e poi
  tolti il 2026-10-17).
- Niente contenuti del portfolio serio: un dominio = un sito intero.
- Credito ad Alberto Pecchini: tolto dalla home e dalla 404 su sua richiesta il
  2026-10-09 (è il suo sito); se una pagina futura lo riporta, il link è
  esatto a `https://www.albertopecchini.it` e il nome come testo.
- Prima versione (iPhone + portafoglio MagSafe, commit 6d339dc) bocciata il
  2026-10-07: non riproporre oggetti skeuomorfici letterali.

## Brand Commitments

- Nome: «pzkko», minuscolo, è il marchio; Alberto Pecchini è l'autore.
- Richiesta vincolante del 2026-10-07: linguaggio visivo e di movimento di
  Apple (principi dei talk WWDC tradotti per il web): tipografia di sistema,
  materiali traslucidi, molle interrompibili, sobrietà.
- Testi in minuscolo, come sul sito principale.

## Evidence on Hand

- Tracciati delle icone dei marchi: Simple Icons (CC0) per Instagram, GitHub,
  WhatsApp, PayPal; Material Icons (Apache 2.0) per la busta e i glifi di
  sistema. Nessuna foto, nessun progetto da mostrare qui.
- Nessun contenuto per tools e games: non va inventato.

## Product Principles

1. Una persona, non un brand: la pagina parla in prima persona e in minuscolo.
2. Pochi oggetti, fatti bene: cinque social e due zone, niente riempitivi.
3. Il movimento risponde al dito e al puntatore; mai decorazione che gira da sola.
4. Cresce per aggiunta: ogni strumento o gioco futuro è una pagina in più, senza
   rifare la home.
