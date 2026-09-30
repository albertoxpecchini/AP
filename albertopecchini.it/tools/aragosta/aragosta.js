// ─────────────────────────────────────────────────────────────────────────────
//  L'ARAGOSTA DI FIUME — il gambero rosso che dorme sopra «Disponibile per nuovi
//  incarichi», nella prima schermata della home, e che quando il visitatore sta
//  fermo si sveglia e riempie d'inchiostro PECCHINI con un annaffiatoio azzurro.
//
//  È un burattino di carta come gli animali del piè di pagina (tools/mascotte,
//  «Burattini»): stesso stile, stessi due passaggi di openai/gpt-image-2 in
//  qualità high, stesso fondo magenta tolto con la chiave cromatica. Sta in una
//  cartella sua perché il montaggio e il movimento sono diversi (li fa
//  src/client/ink.js, insieme all'inchiostro).
//
//  I prompt sono in inglese perché il modello li segue meglio. Lo stile è quello
//  dei burattini, tranne la tavolozza: qui il rosso è il colore dell'animale, non
//  un dettaglio.
// ─────────────────────────────────────────────────────────────────────────────

export const FONDO = 'a perfectly flat, uniform, solid pure magenta background (#FF00FF, a chroma-key backdrop: no texture, no gradient, no vignette, no shadow falls on it)'

export const STILE = `Style: friendly cartoon illustration with precise fine near-black ink outlines (#10110f) over flat matte colour fills with soft hand-drawn shading, a subtle hand-drafted feel, like the drawings of a high-end architecture studio's identity. Palette: warm crayfish reds (#c8321f, #a3241a, #e0553a) with a creamy underside (#f1dcc4), paper white (#f3f1ec), warm greys, and ONE sky blue (#7cc4e8, with #4f9fcb shading) for the watering can only.
The eyes are the most important part, because code will animate them: each eye is a big, perfectly round, plain white circle (#ffffff) with a clean ink outline and a single small solid black round pupil right in its centre. No highlight reflections in the eyes, no eyelashes, no eyebrows, nothing overlapping the eyes. Both eyes fully visible, the same size, clearly separated from each other: the head is turned toward the viewer even when the body is in profile.
Clean off-white die-cut border (#f3f1ec), about 12 px wide, all around the outer silhouette, like a sticker.
Never use magenta, pink or purple anywhere on the character or on its border.
No cast shadow, no ground, no scenery, no water, no text, no letters, no logos, no watermark.`

export const INTERO = `A single cute mascot character, centred and large, on ${FONDO}, for the website of a young Italian surveyor (geometra) who is also a web designer and a graphic designer. It joins the other mascots of the same site: the attached image, a giant African land snail, is a STYLE REFERENCE ONLY — match its drawing style, outline weight, colouring, eye design and sticker border exactly, but do NOT draw a snail and do NOT copy its backpack, camera or tools.`

export const SOGGETTO = `A red swamp crayfish (Procambarus clarkii), the bright red river crayfish of the Mincio near Mantua ("aragosta di fiume"): adorable, gentle and a little sleepy, with a sweet closed-mouth smile. Strict SIDE VIEW (profile) of the whole animal, low and horizontal, resting on its belly as if lying on a shelf, facing the viewer's LEFT:
- a smooth, rounded, glossy carapace in deep warm red with darker red-brown shading and tiny raised bumps, and a short pointed rostrum between the eyes;
- a long segmented abdomen stretched out straight and horizontal to the RIGHT, ending in a wide open fan-shaped tail;
- four pairs of thin jointed walking legs tucked under the body;
- two very long thin red antennae sweeping up and back over the body in elegant curves, and two pairs of short little antennules at the front of the head;
- TWO BIG BEAUTIFUL CLAWS (chelae), plump and glossy bright red with rows of small cream-tipped bumps along their edges, each on a jointed arm, held forward in front of the face. The near claw holds by its top handle a small SKY-BLUE enamelled metal watering can standing upright in front of the crayfish: a round belly, a handle arching over the top, and a long thin straight spout pointing to the LEFT and slightly upward, ending in a plain open tip (no sprinkler rose). The far claw rests open beside the can.
The head is turned three-quarters toward the viewer: two BIG round eyes on short thick red eye stalks at the front of the head, both clearly visible, the same size, well separated, above the small smile. No clothes, no accessories other than the watering can.`

export const PEZZI = `The attached image is a cartoon mascot. Redraw this exact character — same design, colours, proportions, line style and eye design — disassembled into the separate flat pieces of a cut-out paper puppet (a paper marionette whose pieces are joined by brass split pins), laid out on ${FONDO}.
Rules for the pieces:
- Every piece is drawn complete and whole, at the SAME SCALE as in the reference, with its own off-white die-cut sticker border (#f3f1ec, about 10 px) all around it.
- Pieces are spread over the sheet with generous empty magenta space between them: no piece touches or overlaps another piece.
- Every moving piece, at the end where it joins its parent, continues into a rounded overlap tab (the same colour as the piece) that would slide under the parent. On that tab, exactly at the pivot of the joint, is ONE small round brass split-pin head: a flat golden disc (#c9a13b) with a thin ink outline, about 2% of the sheet width.
- The main body piece has no pins and no holes; where a claw, the tail or an antenna used to be, the body simply ends in a clean closed outline.
- The eyes stay big, perfectly round, plain white circles with a small black pupil in the centre, both on the body piece, on their eye stalks.
- No labels, no numbers, no text, no arrows, no assembly diagram, no shadows, nothing else on the magenta background.
The pieces:`

// l'ordine conta solo per il prompt; i nomi li dà `usa`, guardando il foglio
export const PEZZI_ELENCO = [
  'BODY: the red carapace (head and thorax) with the rostrum, both eye stalks with the two big round eyes, the smile, the short antennules and the thin walking legs tucked under it, WITHOUT the abdomen and tail, WITHOUT the two claws and their arms, WITHOUT the two long antennae and WITHOUT the watering can. Where the abdomen, the arms and the antennae joined, the carapace simply ends in a clean closed outline.',
  'TAIL: the long segmented abdomen with the open fan-shaped tail, stretched out straight and horizontal; the pin tab is at its front end, the end that slides in under the back of the carapace.',
  // l'intero scelto (20260930-223947-2): la chela alta tiene l'annaffiatoio per il manico, la bassa è aperta accanto
  'HOLDING CLAW: the upper claw, the one that grips the watering can by its handle, with its whole jointed arm, WITHOUT the watering can: the pincer stays curled exactly as when it grips the handle; the pin tab is at the shoulder end of the arm.',
  'OTHER CLAW: the lower, bigger claw with its whole jointed arm, the pincer open; the pin tab is at the shoulder end of the arm.',
  'WATERING CAN: the sky-blue watering can alone, whole and upright, the long thin straight spout pointing to the LEFT and slightly up with a plain open tip, the handle arching over the top, nothing covering it; the pin tab is on the top of the handle arch, where the claw grips it.',
  'ANTENNA 1: one very long thin curved red antenna; the pin tab is at its base.',
  'ANTENNA 2: the other very long thin curved red antenna; the pin tab is at its base.',
]

export const ALT = 'L’aragosta di fiume rossa con l’annaffiatoio azzurro, mascotte del sito'
