---
version: 1
slug: "chini-it-pzkko-games-blackjack-index-html-c83e0e53"
primary_target: "albertopecchini.it/pzkko/games/blackjack/index.html"
related_targets: ["albertopecchini.it/pzkko/games/blackjack/admin/index.html","albertopecchini.it/api/blackjack.js","albertopecchini.it/src/blackjack/motore.js","albertopecchini.it/tools/blackjack/immagini.mjs"]
---

# pzkko.it — blackjack

Scope: the game page `albertopecchini.it/pzkko/games/blackjack/index.html` (static, no build, CSS and JS inline), its admin page `admin/index.html`, and the state it renders from `api/blackjack.js` + `src/blackjack/motore.js`. Visitor mode: Experience (the table is the work; the visitor sits inside it). Controls keep Operate discipline: every phase has a named state, every button names its action.

Audience and job: four or five friends of Alberto, on the phone, invited by link or WhatsApp, in the evening. Job: enter a name once, sit, bet $pzk, play against the bot dealer in real time with the others, see who won. Alberto (pzkko) watches, plays, and hands out $pzk from the admin page or the terminal.

Action: sit and bet (first visit: pass the +18 gate, type a name). During a hand: carta / stai / raddoppia / dividi within 20 s, from the buttons printed on the padded rail in front of one's own seat. Secondary: read the rules, the last hands, the players' balances (below the stage).

Proof and content: real state from the server (one room, 6-deck shoe, European no-hole-card rules, dealer stands on 17); no invented players, no fake history; the empty table is an honest empty state. $pzk are tokens with no value; the page says so at the gate and in the footer note. Everything in Italian, lowercase. All imagery is generated with gpt-image-2 on Replicate (credited in the footer and in tools/blackjack/README.md).

Constraints: brief-pinned pzkko.it world (Apple web grammar: system font, dark room, pills and glass for the HUD, springs); credit to https://www.albertopecchini.it in the footer; +18 message on first visit; the user's explicit asks of 2026-10-07 evening: cards dealt by a hand at human speed, a dealer with arm and hand moving naturally, cards that bend under the finger, a dealing shoe next to the dealer, a near-fullscreen real table with chairs that show a humanoid when someone sits (with real limbs), action buttons near one's own cards on the table, one's own humanoid making the real blackjack hand signals for each move, images made with Replicate (the vector draft in Claude Design was rejected).

Chosen direction and memorable moment: «la sala»: a logical world (1600×1000 landscape, 1000×1500 portrait) scaled to the window; the photographed felt lies in CSS perspective, the croupier stands behind the far rim with his waist hidden by the table, five chairs around the arc with seated players seen from behind, the shoe, the chip rack and the discard tray on the far edge. The moment: the croupier pulls a card from the shoe and carries it to a seat on the server's clock, his torso leaning toward the seat, while the player's own hand taps the felt for a card or waves flat to stand.

Unresolved: whether to give the phone a closer camera (today seats 1 and 5 are cut at the edges in portrait); whether the lettering band should move up to make room for the near seats' cards.

## Direction contract

THESIS: the page is one room seen from the players' side, not a dashboard with a game in it: a real half-moon table in perspective, a croupier whose hands do the dealing, five chairs with people in them, and the controls printed on the rail in front of one's own seat; it refuses the category default (a flat felt rectangle with a bottom button bar and cards that pop in) and the old tile layout.

OWN-WORLD: photographic cut-out puppets (gpt-image-2) on a dark green room (#17221d → #000 radial), the pzkko.it HUD grammar on top (system stack, 15 px status pill with blur, 2 px timer hairline, 44 px glass buttons, white on #1a6fe0 for the primary); felt from the generated plan-view photo with the markings drawn by the page in white at 50–80 %; cards are the generated deck (250×350, 9 % radius) laid at 96×134 plan px with 1–5° random rotation and a drop shadow; chips as the generated clay chips; round 66 px rail buttons with a 2 px white border on black 55 %; arms assembled from three photographed pieces per arm on brass pivots, moved by two-bone IK with critically damped springs (response 0.26 s), the torso leaning with a slower spring (0.5 s).

STORY: «è un tavolo vero, siamo seduti insieme»: a friend passes the gate, types a name, takes a chair (a person appears in it), taps the chips on the rail and «punta», watches the croupier take each card from the shoe and lay it in front of each seat at a human pace, taps «carta» and sees their own hand tap the felt, bends a card's corner with a finger, and reads the result next to the cards.

FIRST VIEWPORT: the stage fills the window below the 48 px nav. Landscape: the dealer's head at the top centre, the table from x 300 to 1300 of a 1600 world, the shoe at the top right, the rack at the top centre, the discard tray at the top left, five seats along the near arc with chairs and name tags, my seat marked «(tu)», my rail console (4 round move buttons on my turn; 5 chip buttons + «punta»/«azzera»/«ripeti»/«salto» while betting) in front of my chair; the status pill at the top left, the last event at the top right, a light tray at the bottom only for secondary actions (name entry, sit, leave). Portrait: the same world at 1000×1500 with the table filling the width; seats 1 and 5 partly cut; my console clamped inside the screen.

FORM: a scene with a staged world, first of my list (staged room; flat felt + bottom bar; tile with seats; cards-only minimal; first-person hands). Pinned by the user's words (table, chairs, humanoids, dealer hand, shoe, buttons on the table) and by the Replicate pipeline; no concept-seed roll; seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Documentazione

Registrata l'8.10 in DESIGN.md (frontmatter: gettoni della sala, dei tasti del bordo, delle targhette, dell'HUD e della carta; prosa: «La sala e il feltro» nei colori, «Sala (giochi)» nel layout, «La sala» nei componenti, luce, ombre e vetri della sala, forme, movimento, do e don't) e in .impeccable/design.json (colorMeta, typographyMeta, shadows, glass, motion, breakpoints, sizes, shapes, quattro componenti della sala, narrativa). Il resto dei due file non è stato toccato.

Stato finale della scena, come spedita:
- la consolle delle mosse (4 tasti tondi da 64 px, bordo 2 px bianco su nero .55, «carta» primario su --btn) e delle puntate (5 fiche da 52 px, poi punta/azzera o ripeti, e salto da 56 px) è appesa sotto il proprio cerchio di puntata (arco a raggio 828 della pianta), davanti al proprio posto, sul bordo imbottito; in verticale è tenuta dentro lo schermo con un clamp sulla x. Il contratto diceva 66 px: la build ha chiuso a 64, ed è quello che DESIGN.md registra.
- telecamera del telefono: mondo alto 1000 × 1400 con scala max(W/w, H/h) (copre lo schermo e sborda ai lati) e --pan che, quando ci si siede, scorre a metà strada verso la propria sedia (.6s); i posti 1 e 5 restano in parte fuori quadro quando non sono i propri.
- maniche per ogni corpo: braccia2/sup1–5 (gomito in basso, perno in basso a sinistra, −0,35 rad di correzione), avambraccio e mani dal foglio braccia o, per il corpo 4, dal foglio scuro braccia2/*4; ai posti laterali la mano esterna resta vicina alla spalla (8 invece di 54 unità), con le mani di riposo sul bordo 34 unità sotto il bordo del posto.
- il croupier porta ogni carta dal sabot al posto sull'orologio del server (parte 1100 ms prima dello scoprimento); la carta si gira all'arrivo; le proprie carte si piegano sotto il dito e tornano con una molla.
- ogni raster è generato con openai/gpt-image-2 su Replicate (7–8.10.2026, prompt in tools/blackjack/fogli.js, pipeline immagini.mjs), accreditato nel piè di pagina e in tools/blackjack/README.md e design-prompts.md; i pezzi con i perni in games/blackjack/art/pezzi.json.

Aperto, non canonizzato: la scritta ad arco sul feltro non è stata spostata (vedi «Unresolved»); i vetri della sala (vassoio, pillola di stato, tasti del bordo) non dichiarano il ripiego prefers-reduced-transparency che il sistema chiede a ogni vetro (la pagina del pomeriggio lo aveva sul vassoio); --ok #30d158 / --no #ff6961 (punto di presenza e segno delle vincite nelle schede sotto la sala), già nella pagina del pomeriggio, restano fuori dai gettoni perché contraddicono la regola del blu unico.

Nota del 7.10 sera, superata:
La scena del 7.10 sera sostituisce la pagina a riquadro recensita nel pomeriggio: le immagini (tools/blackjack/lavoro/, non nel repository) sono generate da gpt-image-2 su Replicate con i prompt in tools/blackjack/fogli.js; i pezzi in pzkko/games/blackjack/art/ con pezzi.json. I gettoni del feltro, delle carte e delle fiche registrati in DESIGN.md nel pomeriggio restano validi per i colori; le misure delle carte sul piano (96×134 in pianta) e i tasti tondi da 66 px sul bordo sono nuovi.
