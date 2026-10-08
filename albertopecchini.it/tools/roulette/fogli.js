// I fogli di immagini della roulette di pzkko.it, disegnati da openai/gpt-image-2
// su Replicate (vedi tools/replicate.mjs e immagini.mjs). Stesso metodo del
// blackjack: ogni foglio porta i pezzi su fondo magenta pieno, la chiave
// cromatica li scontorna, `usa` li separa e li scrive in pzkko/games/roulette/art/.
//
// La ruota è in due pezzi fotografati e una parte disegnata dalla pagina:
// - `ruota`: la conca fissa vista da sopra (bordo di legno, pista della pallina,
//   scivolo con gli otto deflettori); al centro un disco magenta, che sparisce:
//   lì gira il rotore;
// - `rotore`: il rotore da sopra SENZA numeri né caselle: la corona delle caselle
//   la disegna la pagina in SVG (37 caselle, ordine europeo, separatori in
//   rilievo) così la pallina cade dove dice la fisica; al centro il disco magenta
//   dove si posa la torretta in piedi;
// - `oggetti`: torretta, dolly (il segnalino) e pallina di tre quarti, in piedi.
// Il croupier, le fiche e la rastrelliera vengono dal blackjack (copiati).

import { FONDO, STILE } from '../blackjack/fogli.js'

export { FONDO, STILE }

export const FOGLI = {
  ruota: {
    titolo: 'la conca della ruota, da sopra, senza il rotore',
    aspetto: '2048x2048',
    prompt: `The fixed outer bowl of a European roulette wheel seen EXACTLY from above (orthographic top-down plan view), perfectly circular, centred on ${FONDO}, the wheel filling 96% of the image width.
From the outside inward: a wide outer rim of polished mahogany wood with a deep lacquer finish and a thin brass trim ring on its inner edge; then the BALL TRACK, a smooth shallow concave channel of pale polished maple wood where the ball rolls; then the sloping apron (the bowl) of dark walnut descending toward the centre, carrying EIGHT small polished chrome deflectors (diamond-shaped metal bumps) evenly spaced around the slope at 12, 1:30, 3, 4:30, 6, 7:30, 9 and 10:30 o'clock, alternating in orientation: four lie along the slope (pointing to the centre) and four lie across it.
The whole central turning part (the rotor with the numbered pockets, the cone and the turret) is MISSING: in its place there is a perfectly flat, perfectly circular disc of solid magenta (#FF00FF), the same magenta as the background, with a diameter of 56% of the wheel's diameter, exactly centred, with a crisp clean edge where the walnut slope ends.
No numbers, no ball, no text, no logo anywhere. Soft, even light from directly above with gentle reflections on the lacquer and the chrome; no cast shadow on the magenta background.
Style: photorealistic, crisp, sharp everywhere. Never use magenta, pink or purple on the wheel itself.`,
  },
  rotore: {
    titolo: 'il rotore da sopra, senza numeri: la corona la disegna la pagina',
    aspetto: '2048x2048',
    prompt: `The turning rotor of a European roulette wheel seen EXACTLY from above (orthographic top-down plan view), alone, perfectly circular, centred on ${FONDO}, filling 96% of the image width, drawn WITHOUT any numbers, pockets or dividers.
From the outside inward: a plain flat annulus of very dark, almost black polished lacquer (where the pockets would be, left completely plain and smooth) from the outer edge down to 68% of the radius, bounded on its inner edge by a thin raised polished brass ring; then the low conical centre of polished dark walnut with a sunburst grain pattern rising gently toward the middle; at the very centre a perfectly flat, perfectly circular disc of solid magenta (#FF00FF), the same magenta as the background, 26% of the rotor's diameter, exactly centred, with a crisp clean edge (the turret goes there later).
No numbers, no text, no logo. Soft, even light from directly above, gentle reflections on the lacquer and the brass; no cast shadow on the magenta background.
Style: photorealistic, crisp, sharp everywhere. Never use magenta, pink or purple on the rotor itself.`,
  },
  oggetti: {
    titolo: 'torretta, dolly e pallina, di tre quarti',
    aspetto: '2048x2048',
    prompt: `Three separate objects from a European roulette table laid out on ${FONDO}, each complete and whole, each seen from the players' side of the table in a three-quarter view from slightly above (the camera in front of the table, looking down at about 40 degrees), with generous empty magenta space between them, nothing cropped, nothing overlapping. Each object fills its own area of the sheet (they are NOT at the same scale):
1. TURRET: the chrome-plated turret of a roulette wheel (the spinner handle at the centre of the rotor), standing upright: a polished chrome central column with a round knob on top and four short chrome arms spreading out horizontally, each ending in a small round chrome knob, on a small round chrome base.
2. DOLLY: the croupier's marker, a small polished chrome cylinder about 7 cm tall with a rounded top and a slightly wider base ring, standing upright.
3. BALL: a single roulette ball, polished ivory white, perfectly spherical, with a soft specular highlight from the upper left and gentle shading, drawn large.

${STILE}`,
  },
  tavolo: {
    titolo: 'il tavolo in pianta, senza segni',
    aspetto: '2048x1152',
    prompt: `A roulette table seen EXACTLY from above (orthographic top-down plan view), centred on ${FONDO}, filling the width of the image: a long rectangle with softly rounded corners, about twice as wide as it is tall. The playing surface is a dark green baize felt (#1b6847 in the centre, darker toward the edges) with a very fine fabric texture, surrounded by a padded black leather armrest rim about 4% of the table width wide, with a thin stitched seam along its inner edge.
The felt is completely PLAIN: no printed numbers, no lines, no betting layout, no wheel, no chips, nothing on it (the markings and the wheel are added later). Lighting soft and even from directly above; no cast shadow on the magenta background.
Style: photorealistic, crisp, matte materials. Never use magenta, pink or purple on the table. No text anywhere.`,
  },
}
