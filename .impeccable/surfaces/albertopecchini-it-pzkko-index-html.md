---
version: 1
slug: "albertopecchini-it-pzkko-index-html"
primary_target: "albertopecchini.it/pzkko/index.html"
related_targets: ["albertopecchini.it/pzkko/404.html","albertopecchini.it/tools/pzkko/genera-404.mjs"]
---

# pzkko.it — home

Scope: the whole home of pzkko.it (`albertopecchini.it/pzkko/index.html`) and its 404, static files with no build. Visitor mode: Experience (a personal hub; the work is the page itself).

Audience and job: someone who followed a handle (Instagram, GitHub, a friend told them «cerca pzkko»), on a phone, for a few seconds. Job: understand who pzkko is and tap the right social. Later: use a tool or play a game.

Action: open one of five socials (Instagram, GitHub, WhatsApp, e-mail, PayPal). Secondary: discover that tools and games are coming.

Proof and content: the five real handles; nothing else exists yet. Tools and games are empty and must read as honest empty states, never as fake content.

Constraints: brief-pinned Apple design language (WWDC principles for the web); Italian; lowercase copy; system font; follows the system theme; credit link to https://www.albertopecchini.it in the footer of every page; no skeuomorphic literal objects (the iPhone + MagSafe wallet version was rejected on 2026-10-07).

Chosen direction and memorable moment: «la scrivania di pzkko»: the five socials and the two zones live as app icons in a dock at the bottom edge of the full-screen first viewport (visible on open, as the user asked on 2026-10-07: «quando apro devo vedere sempre in basso la barra icone»; it scrolls away with the hero, as the user then asked: «se scorro giù via la barra, non mi serve») that magnifies under the pointer with critically damped springs (macOS on desktop) and becomes a labeled 3+3+1 grid on the phone (rows of at most three apps, the user's request). Under the full-screen hero, Apple-style bento tiles explain each social (github listing the three sites it hosts; the others neutral with a brand glow); tools and games are two empty-state tiles shaped like what they will become (a folder, a row of app slots).

Unresolved: whether tools/games become pages (they do when the first item exists).

## Direction contract

THESIS: pzkko.it is a desktop, not a list. Seven app icons in one dock say «this is a person who makes things» before any text is read; the page refuses the link-in-bio column of equal buttons and the hero-over-mesh with three cards.

OWN-WORLD: Apple's web grammar, committed: system font stack, display tight (-0.035em), 17px body; light #fff with #f5f5f7 tiles, dark #000 with #1d1d1f tiles, link blue #0066cc / #2997ff, no other accent; brand color appears only inside squircle icons (true superellipse clip) and as a faint glow in the neutral tiles; the one exception is the github tile, GitHub graphite #24292f, which earns its size by listing the three sites it hosts; glass tray with backdrop blur over a soft wallpaper field; 28px tile radius, 22% squircle icons; springs damping 1.0, response 0.32; press scale .92 on pointer-down; one authored motion moment (hero entrance + dock), no scroll reveals.

STORY: «ah, è alberto»; the icons are familiar, so the visitor taps without reading; scrolling, they learn each handle and that tools and games are on the way; they leave with the feeling of an Apple page made by one person.

FIRST VIEWPORT: translucent 48px nav (pzkko left; social, tools, games right). Full-screen hero (100svh minus nav) that adapts to any window («adattatore automatico», the user's request): «pzkko» display at clamp(2.75rem, min(9vw, 13svh), 6rem) centred in the space above the dock, one line under it at clamp(1rem, min(1.5vw, 2.6svh), 1.3125rem) (single line at desktop). The dock sits at the bottom edge of the hero and scrolls away with it: five brand squircles sized clamp(44px, min(4.6vw, 7.5svh), 64px), a separator, two graphite icons (tools, games), in a glass tray over the blurred color field. Primary action = the dock icons themselves. On the phone the dock is the same tray as a 3+3+1 grid of clamp(48px, 14vw, 56px) icons with 11px labels (the user's words, 2026-10-07: «da mobile righe da massimo 3 app nella barra»). The 404 carries the same hero and dock, generated from index.html by tools/pzkko/genera-404.mjs.

FORM: dock + bento, first on my list of structures (dock/bento, launchpad grid, control-center stack, single column, sidebar). Brief-pinned direction (Apple design); no concept-seed roll, seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
