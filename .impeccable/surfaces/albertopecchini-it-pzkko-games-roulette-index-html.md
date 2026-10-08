---
version: 1
slug: "albertopecchini-it-pzkko-games-roulette-index-html"
primary_target: "albertopecchini.it/pzkko/games/roulette/index.html"
related_targets: ["albertopecchini.it/pzkko/games/roulette/gioco.js","albertopecchini.it/pzkko/games/roulette/scena.js","albertopecchini.it/pzkko/games/roulette/ruota.js","albertopecchini.it/pzkko/games/roulette/tavolo.js","albertopecchini.it/pzkko/games/roulette/fisica.js","albertopecchini.it/tools/roulette/immagini.mjs"]
---

# pzkko.it — roulette

Scope: the game page `albertopecchini.it/pzkko/games/roulette/index.html` (static, no build; CSS inline, JS in five ES modules next to it) and the art in `art/`. Visitor mode: Experience (the table is the work; the visitor stands at it). Controls keep Operate discipline: every phase has a named state in the status pill, every button names its action.

Audience and job: a friend of Alberto, alone, on the phone or at the desk, in the evening. Job: pick a chip, touch the layout, press «gira», watch the croupier spin the rotor and throw the ball, see where it stops, get paid or swept. No account, no server: the $pzk balance lives in the browser (1000 to start, 1000 again when they run out).

Action: bet by touching the printed layout (straight, split, street, corner, six line, trio, 0-1-2-3, dozens, columns, even chances); «gira» closes the bets. Secondary: «annulla», «azzera», «ripeti», chip choice; keyboard: space, 1–5, backspace, r. Below the stage: how to play, the payouts, the last spins, «ricomincia con 1000 $pzk».

Proof and content: the number is read from the pocket where the simulated ball really stops (fisica.js, seeded; `tools/roulette/prova.mjs` runs 1480 spins: 11–16 s each, chi² on the 37 numbers below the 95 % threshold). No invented history: the last-spins strip starts empty. $pzk are tokens with no value; the page says so at the +18 gate and in the footer note. Everything in Italian, lowercase. All imagery generated with gpt-image-2 on Replicate (credited in the footer and in tools/roulette/README.md); croupier, chips and rack are the blackjack pieces.

Constraints: brief-pinned pzkko.it world (Apple web grammar: system font, dark room, pills and glass for the HUD); credit to https://www.albertopecchini.it in the footer; +18 message on first visit; the user's explicit asks of 2026-10-08: single player, the table only (no rooms), European wheel with a single zero, the wheel as real images that rotate by code, a realistic ball that bounces correctly on raised frets and deflectors, the croupier and chips from blackjack, the croupier throwing the ball, collecting the lost chips and pushing the winnings to the player, the arms rethought so they move like arms and not like a compass.

Chosen direction and memorable moment: «la sala», as in blackjack, seen from the long side on the desk (world 1600×1000, plane 1400×657 at 40°) and from the head of the table on the phone (900×1800, plane 829×1766 at 24°, the croupier at the side). The moment: the croupier's hand pinches the turret and the rotor speeds up under it, then takes the ball out of its pocket, carries it to the top of the track and lets it go; ten seconds later the ball drops off the track, kicks on a deflector, hops over the frets and settles; the dolly lands on the number, the lost chips are gathered by hand and the winnings arrive next to the winning chips and are pushed down to the player.

Unresolved: whether a stronger hop (bigger z kicks) reads better on the phone, where the ball is a few pixels; whether the number band on the rotor should be taller on small screens; whether to let bets stay open for the first seconds of the spin, as in a real pit.

## Direction contract

THESIS: one room with a wheel that is a machine, not an animation: the photographed bowl and rotor turn by code, the 37 pockets are drawn in the physics' own centimetres, and the croupier's hands do the three things a croupier does (throw, sweep, pay); it refuses the category default (a flat top-down wheel with a tweened ball and a results popup) and the blackjack arms-as-compass.

OWN-WORLD: the blackjack room (#17221d → #000 radial), the pzkko.it HUD grammar (system stack, 15 px status pill with blur, 44 px glass buttons, white on #1a6fe0 primary, 52 px rail buttons with 2 px white border on black 55 %, 58 px chip buttons that lift 8 px when chosen); felt from the generated plan-view photo with the layout printed by the page (red rgba(205,30,50,.88), black rgba(14,14,16,.82), green rgba(22,135,72,.9), white lines at 85 %, 0.35 px blur so it reads as print); the rotor ring in SVG centimetres (pockets #e4303f/#b3121f, #2a2a2e/#0d0d0f, #2aa35c/#146b3a with an inner shadow, metallic frets with a light blade and a drop shadow, white 700 numbers standing outward); the ball is the generated ivory ball as a billboard above the plane with a soft shadow on it; the turret drawn in chrome gradients so its four arms can turn with the rotor; the croupier's arm pieces drawn between projected 3D joints (foreshortening) with minimum-jerk hand paths and a 0.35 s lean.

STORY: «la pallina cade dove cade»: a friend passes the gate, picks the 10 chip, touches 17 and «rosso», presses space, watches the croupier push the turret and throw the ball, follows the ball along the track, sees it drop, hit a diamond, rattle and stop on 9, sees the dolly land on 9, the 17 chip pulled away by hand and the red bet paid and pushed toward them while the balance ticks up.

FIRST VIEWPORT: the stage fills the window below the 48 px nav. Landscape: the dealer's head top centre, the table from x 100 to 1500 of a 1600 world with the wheel at the left (centre 330,326 of the plane) and the layout at the right (x 596–1246), the rack top right, the dolly resting on the far rail, the status pill top left, the last numbers top right, the console (5 chips + gira/annulla/azzera/ripeti) on the near rail. Portrait: the table from its end with the wheel at the top, the layout in three columns below it, the croupier at the right side, the console scaled 1/K at the bottom.

FORM: a scene with a staged world, as in blackjack (pinned by the user's words: table, wheel as real images, ball, croupier, chips); no concept-seed roll; seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the batched inspection (desktop and phone, every phase of a spin), the fixes it showed, DESIGN.md's games notes and every shipping raster carrying its provenance in tools/roulette/README.md.
