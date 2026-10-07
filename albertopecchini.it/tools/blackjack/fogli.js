// I fogli di immagini del tavolo di blackjack di pzkko.it, disegnati da
// openai/gpt-image-2 su Replicate (vedi tools/replicate.mjs e immagini.mjs).
// Ogni foglio porta più pezzi su fondo magenta pieno: la chiave cromatica li
// scontorna, `usa` li separa e li scrive in pzkko/games/blackjack/art/.
//
// I prompt sono in inglese perché il modello li segue meglio. Le figure sono
// pezzi di burattino (un fermacampioni dorato su ogni perno): la pagina li monta
// e li muove con la cinematica inversa (spalla → gomito → polso).

export const FONDO = 'a perfectly flat, uniform, solid pure magenta background (#FF00FF, a chroma-key backdrop: no texture, no gradient, no vignette, no shadow falls on it)'

export const STILE = `Style: photorealistic, like a frame of a high-end stop-motion cut-out animation: real human skin with pores and fine hair, real fabric weave, real matte plastic and leather; soft diffuse studio light from the upper left, gentle shading, no harsh cast shadows, no motion blur, no depth-of-field blur: every piece is sharp.
Every piece has a clean, crisp edge cut around its silhouette (no outline stroke, no sticker border, no halo).
Never use magenta, pink or purple anywhere on the pieces.
No labels, no numbers, no text, no arrows, no assembly diagram, no ground, no scenery, no watermark: nothing else on the magenta background.`

export const PERNO = 'At that joint there is ONE small round brass split-pin head: a flat golden disc (#c9a13b) about 2% of the sheet width, lying on the piece exactly at the pivot.'

const regole = (n) => `Rules for the pieces:
- The ${n} pieces are spread over the sheet in rows with generous empty magenta space between them: no piece touches or overlaps another piece, nothing is cropped by the edge.
- Every piece is complete and whole, drawn at the same scale.
- Each moving piece, at the end where it joins its parent, continues into a short rounded overlap tab (same material as the piece) that would slide under the parent piece. ${PERNO}
- Pieces that are hands, forearms and upper arms are drawn HORIZONTAL, the joint (and its pin) at the LEFT end and the free end to the RIGHT.`

export const FOGLI = {
  croupier: {
    titolo: 'il croupier (busto, braccio, avambraccio, due mani)',
    aspetto: '2048x2048',
    prompt: `The separate pieces of a cut-out puppet of a casino blackjack dealer (a croupier), laid out on ${FONDO}, for an animated card table seen from the players' side.
${regole(5)}
The pieces:
1. BUST: a friendly Italian man of about 30 with short dark hair and a short neat beard, seen from the FRONT and slightly from above, from the top of his head down to his belt: crisp white dress shirt, black waistcoat, black bow tie, black elastic sleeve garters at the top of each sleeve. He has NO ARMS: the shirt simply ends in a clean cut at each shoulder (the arms are separate pieces), and at each shoulder cut there is a brass split pin. He looks straight at the viewer with a calm half-smile.
2. UPPER ARM: his right upper arm from the shoulder to the elbow, white shirt sleeve with the black garter, horizontal, the shoulder joint (with its pin) at the left end, the elbow at the right end.
3. FOREARM: his right forearm from the elbow to the wrist, white sleeve with a buttoned cuff and the bare wrist showing at the right end, horizontal, the elbow joint (with its pin) at the left end.
4. HAND PINCHING: his right hand seen from ABOVE (back of the hand up), the thumb and the index finger pinched together as if holding a playing card by its edge, but WITHOUT the card; the wrist (with its pin) at the left end, fingers pointing right.
5. HAND OPEN: his right hand seen from ABOVE, flat, palm down, fingers together and relaxed; the wrist (with its pin) at the left end, fingers pointing right.

${STILE}`,
  },
  giocatori: {
    titolo: 'cinque giocatori di spalle',
    aspetto: '2048x2048',
    prompt: `Five different casino players seen from BEHIND, as the separate pieces of cut-out puppets laid out on ${FONDO}: each piece is one person from the top of the head down to just below the shoulder blades, seated, seen from behind and slightly from above (the camera is behind them, looking at a card table). Each person has NO ARMS: the shirt or jacket simply ends in a clean cut at each shoulder, and at each shoulder cut there is a brass split pin (the arms are separate pieces).
${regole(5)}
The five people, each a separate piece, all at the same scale:
1. a young woman with a long dark ponytail, in a plain red cotton t-shirt;
2. a young man with short blond hair, in a light blue linen shirt;
3. a man with a black baseball cap worn backwards, in a grey hoodie;
4. a woman with big curly brown hair, in a mustard yellow blouse;
5. an older bald man with a grey beard just visible, in a dark green polo shirt.

${STILE}`,
  },
  braccia: {
    titolo: 'braccio, avambraccio e cinque mani dei giocatori',
    aspetto: '2048x2048',
    prompt: `The separate arm pieces of a cut-out puppet of a casino player, laid out on ${FONDO}, seen from slightly above and behind (over the player's shoulder, looking down at a card table). Light skin, no sleeves (bare arm), no jewellery, no watch.
${regole(7)}
The pieces:
1. UPPER ARM: a right upper arm, bare skin, from the shoulder to the elbow, horizontal, the shoulder joint (with its pin) at the left end.
2. FOREARM: a right forearm, bare skin, from the elbow to the wrist, horizontal, the elbow joint (with its pin) at the left end, the wrist at the right end.
3. HAND FLAT: a right hand seen from ABOVE (back of the hand up), flat, palm down, fingers together and straight; the wrist (with its pin) at the left end, fingers pointing right.
4. HAND POINTING: the same right hand seen from above, the index finger extended straight to the right, the other fingers curled under, the thumb resting along the side; the wrist (with its pin) at the left end.
5. HAND TWO FINGERS: the same right hand seen from above, the index and middle fingers extended to the right in a V, the other fingers curled, the thumb tucked; the wrist (with its pin) at the left end.
6. HAND PINCHING: the same right hand seen from above, thumb and index finger pinched together as if holding a casino chip, but WITHOUT the chip, the other fingers relaxed; the wrist (with its pin) at the left end.
7. HAND FIST: the same right hand seen from above, loosely closed into a relaxed fist resting on its side; the wrist (with its pin) at the left end.

${STILE}`,
  },
  tavolo: {
    titolo: 'il tavolo in pianta',
    aspetto: '2048x1152',
    prompt: `A casino blackjack table seen exactly from ABOVE (orthographic top-down plan view), centred on ${FONDO}, filling the width of the image.
It is a classic half-moon (semicircular) blackjack table: the straight edge is at the TOP (the dealer's side), the curved edge sweeps around the bottom (the players' side). The playing surface is a dark green baize felt (#1b6847 in the centre, darker toward the edges) with a very fine fabric texture. Around the whole outline runs a padded black leather armrest rim, about 5% of the table width wide, with a thin stitched seam along its inner edge. Along the top straight edge, inside the rim, is a slightly recessed black rectangular chip-rack well in the centre.
The felt is completely PLAIN: no printed text, no lines, no betting circles, no logos, no cards, no chips, nothing on it (the markings are added later). The lighting is soft and even from above; no cast shadow on the magenta background.
Style: photorealistic, crisp, matte materials. Never use magenta, pink or purple on the table. No text anywhere.`,
  },
  oggetti: {
    titolo: 'sabot, rastrelliera, vaschetta degli scarti, sedia',
    aspetto: '2048x2048',
    prompt: `Four separate casino objects laid out on ${FONDO}, each complete, each seen from the players' side of a blackjack table in a three-quarter view from slightly above (the camera is in front of the table, looking down at about 35 degrees), all at the same scale, with generous empty magenta space between them, nothing cropped:
1. DEALING SHOE: a black acrylic blackjack dealing shoe (a wedge-shaped box holding six decks of cards), its mouth (the slot where the cards slide out) facing the FRONT-LEFT, the stack of white playing cards visible inside through the open top, one card half-way out of the mouth. No text on it.
2. CHIP RACK: a black acrylic dealer's chip rack (chip tray) seen from the front, with five rows of stacked casino chips lying on their side in the slots: white, blue, green, orange and red chips, plain, no printed values.
3. DISCARD TRAY: a clear acrylic discard holder with a small neat stack of white cards face down inside it.
4. CHAIR: a black leather casino stool with a tall padded backrest and a chrome footrest, seen from BEHIND and slightly above, empty.

${STILE}`,
  },
  'carte-rosse': {
    dir: 'carte',
    titolo: 'le carte rosse (cuori e quadri) e il retro',
    aspetto: '2048x2048',
    prompt: `A complete, accurate set of 27 playing cards laid out in a grid of 6 columns and 5 rows on ${FONDO}, every card the same size (portrait, standard poker proportions, rounded corners), with clear magenta gaps between cards, nothing cropped, nothing overlapping. Reading order, left to right, top to bottom:
Row 1: ace of hearts, 2 of hearts, 3 of hearts, 4 of hearts, 5 of hearts, 6 of hearts.
Row 2: 7 of hearts, 8 of hearts, 9 of hearts, 10 of hearts, jack of hearts, queen of hearts.
Row 3: king of hearts, ace of diamonds, 2 of diamonds, 3 of diamonds, 4 of diamonds, 5 of diamonds.
Row 4: 6 of diamonds, 7 of diamonds, 8 of diamonds, 9 of diamonds, 10 of diamonds, jack of diamonds.
Row 5: queen of diamonds, king of diamonds, the CARD BACK, then three empty magenta spaces.
Each card is EXACTLY correct: the right rank index in the top-left and (rotated 180°) bottom-right corners with a small suit symbol under it, and exactly the right number of large suit pips in the classic arrangement (the ace has one big central pip). Hearts and diamonds are a clear bright red (#ff3b30) on a clean white card with a thin light grey edge. The face cards (jack, queen, king) are modern minimal geometric half-length figures in red and dark grey, mirrored top and bottom like real cards, each with a small suit symbol: the jack wears a beret, the queen holds a flower, the king wears a simple three-point crown. The ace has ONE large pip in the centre. The card back is dark green (#0c3a29) with a thin white border and a fine repeated geometric pattern, with the word "pzkko" in white lowercase letters in the centre.
Style: photorealistic printed cards, slightly glossy coated paper, soft even light, perfectly flat, no shadows, no perspective. Never use magenta or pink on the cards. No other text anywhere.`,
  },
  'carte-nere': {
    dir: 'carte',
    titolo: 'le carte nere (fiori e picche) e un altro retro',
    aspetto: '2048x2048',
    prompt: `A complete, accurate set of 27 playing cards laid out in a grid of 6 columns and 5 rows on ${FONDO}, every card the same size (portrait, standard poker proportions, rounded corners), with clear magenta gaps between cards, nothing cropped, nothing overlapping. Reading order, left to right, top to bottom:
Row 1: ace of clubs, 2 of clubs, 3 of clubs, 4 of clubs, 5 of clubs, 6 of clubs.
Row 2: 7 of clubs, 8 of clubs, 9 of clubs, 10 of clubs, jack of clubs, queen of clubs.
Row 3: king of clubs, ace of spades, 2 of spades, 3 of spades, 4 of spades, 5 of spades.
Row 4: 6 of spades, 7 of spades, 8 of spades, 9 of spades, 10 of spades, jack of spades.
Row 5: queen of spades, king of spades, the CARD BACK, then three empty magenta spaces.
Each card is EXACTLY correct: the right rank index in the top-left and (rotated 180°) bottom-right corners with a small suit symbol under it, and exactly the right number of large suit pips in the classic arrangement (the ace has one big central pip). Clubs and spades are near-black (#1d1d1f) on a clean white card with a thin light grey edge. The ace of spades has one large ornate spade pip in the centre with the word "pzkko" in small white lowercase letters inside it. The face cards (jack, queen, king) are modern minimal geometric half-length figures in black and dark grey, mirrored top and bottom like real cards, each with a small suit symbol: the jack wears a beret, the queen holds a flower, the king wears a simple three-point crown. The card back is dark green (#0c3a29) with a thin white border and a fine repeated geometric pattern, with the word "pzkko" in white lowercase letters in the centre.
Style: photorealistic printed cards, slightly glossy coated paper, soft even light, perfectly flat, no shadows, no perspective. Never use magenta or pink on the cards. No other text anywhere.`,
  },
  fiche: {
    titolo: 'le fiche $pzk, da sopra e in pila',
    aspetto: '2048x2048',
    prompt: `Casino chips for a friendly home blackjack game, laid out on ${FONDO}, with generous magenta space between the pieces, nothing cropped:
Row 1, five single chips seen exactly from ABOVE (top-down), all the same size: a WHITE chip with the number 5, a BLUE chip with the number 10, a GREEN chip with the number 25, an ORANGE chip with the number 50 and a RED chip with the number 100. Each chip is a classic clay casino chip: a coloured rim with six small white edge spots, a dark graphite (#2c2c2e) centre inlay with the number in large white bold sans-serif digits and the small word "pzkko" under the number, no other text.
Row 2, the same five chips as small neat stacks of four chips each, seen in a three-quarter view from slightly above (the camera in front of the table looking down at about 35 degrees), the top chip showing its number.
Style: photorealistic, matte clay, soft even light from the upper left, no cast shadow on the background. Never use magenta, pink or purple on the chips.`,
  },
}
