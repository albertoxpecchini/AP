---
version: 1
slug: "chini-it-pzkko-games-blackjack-index-html-c83e0e53"
primary_target: "albertopecchini.it/pzkko/games/blackjack/index.html"
related_targets: ["albertopecchini.it/pzkko/games/blackjack/admin/index.html","albertopecchini.it/api/blackjack.js","albertopecchini.it/src/blackjack/motore.js"]
---

# pzkko.it — blackjack

Scope: the game page `albertopecchini.it/pzkko/games/blackjack/index.html` (static, no build, CSS and JS inline), its admin page `admin/index.html`, and the state it renders from `api/blackjack.js` + `src/blackjack/motore.js`. Visitor mode: Experience (the table is the work; the visitor sits inside it). Controls keep Operate discipline: every phase has a named state, every button names its action.

Audience and job: four or five friends of Alberto, on the phone, invited by link or WhatsApp, in the evening. Job: enter a name once, sit, bet $pzk, play against the bot dealer in real time with the others, see who won. Alberto (pzkko) watches, plays, and hands out $pzk from the admin page or the terminal.

Action: sit and bet (first visit: pass the +18 gate, type a name). During a hand: carta / stai / raddoppia / dividi within 20 s. Secondary: read the rules, the last hands, the players' balances.

Proof and content: real state from the server (one room, 6-deck shoe, European no-hole-card rules, dealer stands on 17); no invented players, no fake history; the empty table is an honest empty state («il tavolo aspetta la prima puntata»). $pzk are tokens with no value; the page says so at the gate and in the footer note. Everything in Italian, lowercase.

Constraints: brief-pinned pzkko.it world (Apple web grammar: system font, light/dark by system, 28 px tiles, glass tray, springs); credit to https://www.albertopecchini.it in the footer; +18 message on first visit; the table artwork and the card deck will be drawn later in Claude Design, signed pzkko: the page must render well with CSS cards and a CSS felt now and accept the art later by flipping one flag (`ART`) without layout changes (art paths: `art/tavolo.svg` 1600×1000 for desktop and `art/tavolo-verticale.svg` 900×1400 for ≤640 px, `art/carte/<rango><seme>.svg`, `art/retro.svg`, `art/fiche-<valore>.svg`).

Chosen direction and memorable moment: «un oggetto solo, il tavolo»: one felt tile fills the first viewport, dealer on top, five seats at the bottom edge, the controls in the same glass tray as the home's dock. The moment: the deal, cards arriving one at a time on the server's clock, sliding in from the shoe with a damped spring, while the decision timer drains as a hairline under the tray.

Unresolved: whether the deck art will be SVG or PNG (the page accepts both by path); whether $pzk is written lowercase everywhere (built lowercase, as the rest of the site).

## Direction contract

THESIS: the page is one table, not a dashboard with a game in it. One committed felt field holds everything a player needs during a hand (dealer, seats, tray, timer), so the phone never scrolls while playing; it refuses the category default (green felt screenshot, neon action bar, chat sidebar, gold-on-black casino costume) and the lazy opposite (a form with a list of cards).

OWN-WORLD: pzkko.it tokens untouched (system stack, 17 px body, #fff/#000 page, #f5f5f7/#1d1d1f tiles, link blue #0066cc/#2997ff, 28 px tile radius, glass tray with blur, critically damped springs, press scale .96). The table adds one committed colour: felt verde pzkko, radial from #1e6f4e at the centre to #0d3d2b at the rim, same in light and dark; felt-tinted secondary text (rgba(255,255,255,.62)), never grey. Cards: #fff, 1:1.4, radius 8 % of width, corner index rank + drawn suit (SVG paths, red #ff3b30 / ink #1d1d1f), centre suit; dealt overlapped by 30 %. Chips: graphite discs with a dashed ring and the value in tabular numerals; $pzk always tabular. Buttons: pill 44 px, primary blue, secondary white glass on felt, disabled at 40 %. Timer: 2 px hairline on the tray's top edge draining left to right.

STORY: «è un tavolo vero, siamo seduti insieme»: a friend passes the gate, types a name, sits, taps a chip, and within a minute sees the cards come out one at a time for everyone, the bot dealer draw and stop at 17, and the $pzk move; they leave knowing pzkko made it and that no money was involved.

FIRST VIEWPORT: phone 390×844: 48 px nav (pzkko · blackjack · my $pzk tabular). The felt tile fills the rest (min-height = 100svh − nav − 16 px): dealer at the top centre («banco», cards, total badge, sabot count small); a one-line lettering band «blackjack paga 3 a 2 · il banco sta a 17 · pzkko» at 12 px felt-tinted in the middle; seats as a 3+2 grid (name, chip, overlapped cards, total/esito badge; my seat ringed white; empty seat = «posto libero» tap target); the glass tray at the bottom edge with the phase controls (chips 5/10/25/50/100 + «punta» primary; or carta/stai/raddoppia/dividi; or the phase line «tocca a mario · 12 s») and the hairline timer. Desktop 1280: the tile 1024 wide, 640 tall, five seats in a row along the bottom; a 300 px aside at ≥1100 px (al tavolo, eventi). Below the tile: ultime mani, regole, the +18/no-money note, footer credit.

FORM: one-object table with a tray, first of my list (one-object table + tray; split table/console; feed-first stack; sidebar operate layout; cards-only minimal). Brief-pinned world (pzkko.it) and brief-pinned art pipeline (Claude Design), no concept-seed roll; seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Documentazione (dopo la build, 2026-10-07)

Confronto fatto fra la build (`games/blackjack/index.html`, `admin/index.html`, la sezione games di `index.html`) e il sistema registrato (`DESIGN.md`, `.impeccable/design.json`); le catture in `.impeccable/review/` confermano il feltro, le carte CSS e il vassoio come nel CSS.

**Aggiunto al sistema (solo aggiunte, niente riscritto).** In `DESIGN.md` e nel sidecar: i token del feltro (`--felt1 #1b6847`, `--felt2 #0c3a29`, `--felt-rim #092b1f`, `--felt-fg`, `--felt-fg2 rgba(255,255,255,.78)`, `--felt-line`), il vetro sul feltro (`--glass`, `--glass-edge`, il `.14` dei tasti), i blu dei tasti pieni (`--btn #0066cc/#1a6fe0`, `--blue #1a6fe0` sul feltro, bianco sopra ≥ 4.78:1), carta (`--card`, `--ink`, `--red`), fiche (`--chip`), `--campo` della pagina del banco; i ruoli tipografici button, seat name, badge, card index, felt caption; raggi pillola/disco/carta/posto/vassoio; misure `--cw`/`--dw`; i componenti tavolo, posto, carta, fiche, badge, vassoio, tasti, campi; ombre, vetro, movimento (`dealt`, timer), soglie 480/900/1100 e la container query dei posti; la regola del feltro e due Do.

**Scostamenti dal contratto (vince la build).** Feltro `#1b6847 → #0c3a29 → #092b1f` invece di `#1e6f4e → #0d3d2b`; testo velato `.78` invece di `.62`; raggio della carta 9% invece di 8%; sovrapposizione delle carte 64% (fino a 80%) invece di 30%; il timer è `left/right: 18px` dentro il vassoio e non sul bordo intero.

**Valori della pagina non promossi a sistema.** `--ok #248a3d/#30d158` e `--no #d70015/#ff6961` (punto di presenza, netto delle ultime mani, messaggi `.msg.ok/.no` e tasto «azzera» del banco): sono il verde di conferma e il rosso di errore che «La regola del blu unico» esclude; restano fatti di queste due pagine, da decidere se diventano un'eccezione dei giochi. `.scheda` a padding `22px 22px 20px` con titolo a 20 px (la home ha 28 px e 24 px). Il gioco non è stato aggiunto come icona nel dock della home (il Do del sistema lo prevede): l'icona «games» porta alla sezione e lì il gioco ha preso la sua casella. Il vassoio appiccicoso (`position: sticky` sotto i 640 px) sta dentro il tavolo e non alla finestra: non contraddice il Don't sul dock fisso, ma è registrato come eccezione sua.
