---
version: 1
slug: "albertopecchini-it-src-templates-pages-pzkko-js"
primary_target: "albertopecchini.it/src/templates/pages/pzkko.js"
related_targets: ["albertopecchini.it/src/data/pzkko.js"]
---

# pzkko.it — home

Scope: the whole home of pzkko.it (`/`) and its 404, built with `SITE=pzk`. Visitor mode: Experience (a personal hub; the work is the page itself).

Audience and job: someone who followed a handle (Instagram, GitHub, a friend told them «cerca pzkko»), on a phone, for a few seconds. Job: understand who pzkko is and tap the right social. Later: use a tool or play a game.

Action: open one of five socials (Instagram, GitHub, WhatsApp, e-mail, PayPal). Secondary: discover that tools and games are coming.

Proof and content: the five real handles; nothing else exists yet. Tools and games are empty and must read as honest empty states, never as fake content.

Constraints: brief-pinned Apple design language (WWDC principles for the web); Italian; lowercase copy; system font; follows the system theme; credit link to https://www.albertopecchini.it in the footer of every page; no skeuomorphic literal objects (the iPhone + MagSafe wallet version was rejected on 2026-10-07).

Chosen direction and memorable moment: «la scrivania di pzkko»: the five socials and the two zones live as app icons in a dock that magnifies under the pointer with critically damped springs (macOS on desktop) and becomes a labeled home-screen grid on the phone (iOS). Under it, Apple-style bento tiles explain each social; tools and games are two empty-state tiles shaped like what they will become (a folder, a row of app slots).

Unresolved: OG image; whether tools/games become pages (they do when the first item exists).

## Direction contract

THESIS: pzkko.it is a desktop, not a list. Seven app icons in one dock say «this is a person who makes things» before any text is read; the page refuses the link-in-bio column of equal buttons and the hero-over-mesh with three cards.

OWN-WORLD: Apple's web grammar, committed: system font stack, display tight (-0.035em), 17px body; light #fff with #f5f5f7 tiles, dark #000 with #1d1d1f tiles, link blue #0066cc / #2997ff, no other accent; brand color appears only inside squircle icons (true superellipse clip) and as a faint glow in their tile; glass tray with backdrop blur over a soft wallpaper field; 28px tile radius, 22% squircle icons; springs damping 1.0, response 0.3; press scale .94 on pointer-down.

STORY: «ah, è alberto»; the icons are familiar, so the visitor taps without reading; scrolling, they learn each handle and that tools and games are on the way; they leave with the feeling of an Apple page made by one person.

FIRST VIEWPORT: translucent 48px nav (pzkko left; social, tools, games right). Centered: «pzkko» display at clamp(3.5rem, 9vw, 6rem), one 21px line under it, then the dock: five brand squircles, a separator, two graphite icons (tools, games), in a glass tray over a blurred color field. Primary action = the dock icons themselves. On the phone the dock becomes a 4-column labeled grid.

FORM: dock + bento, first on my list of structures (dock/bento, launchpad grid, control-center stack, single column, sidebar). Brief-pinned direction (Apple design); no concept-seed roll, seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
