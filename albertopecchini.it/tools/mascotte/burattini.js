// ─────────────────────────────────────────────────────────────────────────────
//  BURATTINI — gli animali del piè di pagina: la chiocciola e la tartaruga,
//  l'airone, la gazza e la vespa. Non sono un'immagine sola ma burattini di
//  carta: pezzi separati (corpo, testa, ali, zampe…) uniti da fermacampioni, che
//  il sito rimonta e muove col puntatore.
//
//  Due passaggi per animale, tutti e due con openai/gpt-image-2 in qualità high:
//  1. «intero»: l'animale completo, con la chiocciola e la tartaruga come
//     riferimento di stile, così la famiglia resta una;
//  2. «pezzi»: lo stesso animale smontato nei pezzi elencati qui sotto, con
//     l'intero come riferimento (stesso disegno, stessa scala).
//
//  I prompt sono in inglese perché il modello li segue meglio.
//
//  Il fondo: fino al 29.09.2026 il modello li disegnava su fondo trasparente;
//  dal 30.09 sera rifiuta `background: 'transparent'` («Transparent background
//  is not supported for this model»). I fogli si fanno quindi su un magenta
//  pieno, colore che nella tavolozza degli animali non c'è, e `usa` lo toglie
//  con una chiave cromatica (chiave() in immagine.mjs).
// ─────────────────────────────────────────────────────────────────────────────

export const FONDO = 'a perfectly flat, uniform, solid pure magenta background (#FF00FF, a chroma-key backdrop: no texture, no gradient, no vignette, no shadow falls on it)'

export const STILE = `Style: friendly cartoon illustration with precise fine near-black ink outlines (#10110f) over flat matte colour fills, a subtle hand-drafted feel, like the drawings of a high-end architecture studio's identity. Palette: paper white (#f3f1ec), warm greys, earth browns, muted sage and olive green, pale blue, and ONE red-lead vermilion accent (#e5481f) on a single detail.
The eyes are the most important part, because code will animate them: each eye is a big, perfectly round, plain white circle (#ffffff) with a clean ink outline and a single small solid black round pupil right in its centre. No highlight reflections in the eyes, no eyelashes, nothing overlapping the eyes. Both eyes fully visible on the front of the face, the same size, clearly separated from each other: the head is turned toward the viewer even when the body is in profile.
Clean off-white die-cut border (#f3f1ec), about 12 px wide, all around the outer silhouette, like a sticker.
Never use magenta or pink anywhere on the character or on its border.
No cast shadow, no ground, no scenery, no text, no letters, no logos, no watermark.`

export const INTERO = `A single cute mascot character, centred and large, on ${FONDO}, for the website of a young Italian surveyor (geometra) who is also a web designer and a graphic designer. It joins two existing mascots of the same site, a giant African land snail and a Mediterranean tortoise: the attached images are STYLE REFERENCES ONLY — match their drawing style, outline weight, colouring, eye design and sticker border exactly, but do NOT draw a snail or a tortoise.`

export const PEZZI = `The attached image is a cartoon mascot. Redraw this exact character — same design, colours, proportions, line style and eye design — disassembled into the separate flat pieces of a cut-out paper puppet (a paper marionette whose pieces are joined by brass split pins), laid out on ${FONDO}.
Rules for the pieces:
- Every piece is drawn complete and whole, at the SAME SCALE as in the reference, with its own off-white die-cut sticker border (#f3f1ec, about 10 px) all around it.
- Pieces are spread over the sheet with generous empty magenta space between them: no piece touches or overlaps another piece.
- Every moving piece, at the end where it joins its parent, continues into a rounded overlap tab (the same colour as the piece) that would slide under the parent. On that tab, exactly at the pivot of the joint, is ONE small round brass split-pin head: a flat golden disc (#c9a13b) with a thin ink outline, about 2% of the sheet width.
- The main body piece has no pins and no holes; where a limb, wing, neck or tail used to be, the body simply ends in a clean closed outline.
- The eyes stay big, perfectly round, plain white circles with a small black pupil in the centre, both on the head piece.
- No labels, no numbers, no text, no arrows, no assembly diagram, no shadows, nothing else on the magenta background.
The pieces:`

export const burattini = {
  // La chiocciola e la tartaruga c'erano già (mascotte.mjs): il loro «intero» è
  // la mascotte stessa, quindi basta il secondo passaggio, i pezzi, con
  // public/media/mascotte/<nome>.webp come riferimento. Così restano identiche.
  lumaca: {
    titolo: 'La chiocciola gigante africana',
    intero: 'public/media/mascotte/lumaca.webp',
    pezzi: [
      // i peduncoli si ritirano quando li tocchi, come nelle chiocciole vere: stanno dietro alla testa
      'BODY: the whole grey-brown snail body — the long textured foot and the raised head with the friendly smile and the two short lower tentacles — together with the camera hanging on its strap and the yellow surveying total station on its tripod standing beside the head, WITHOUT the shell (and without the backpack on it) and WITHOUT the two long upper eye stalks: the top of the head is a smooth closed outline where the eye stalks were.',
      'SHELL: the tall conical brown and cream striped spiral shell with its vermilion apex, with the green surveyor backpack full of tools (rolled drawings, ruler, pencils, tablet, colour swatches) strapped on it; the pin tab is at the bottom of the shell, where it rests on the body.',
      'EYE STALK 1: the left long upper tentacle, a slender grey-brown stalk ending in one big round white eyeball with a small black pupil in the centre; the pin tab is at the bottom (base) end of the stalk.',
      'EYE STALK 2: the right long upper tentacle, the same slender stalk ending in the other big round white eyeball with a small black pupil in the centre; the pin tab is at the bottom (base) end of the stalk.',
    ],
    alt: 'La chiocciola gigante africana, burattino del sito',
  },
  // Rifatta da zero il 1°.10.2026 (prima era la mascotte del 26.09 smontata in
  // tre pezzi, con la testa che rimpiccioliva in un buco del guscio). Ora è
  // pensata subito come burattino: di profilo, collo lungo che scorre sotto il
  // guscio, zampe che ci rientrano, la mascella per sbadigli e morsi, l'elmetto a
  // parte, che salta quando si spaventa e le scivola sugli occhi quando dorme.
  // Per riferimento di stile solo la chiocciola: la vecchia tartaruga no.
  tartaruga: {
    titolo: 'La tartaruga di terra',
    riferimenti: ['public/media/mascotte/lumaca.webp'],
    premessa: `A single cute mascot character, centred and large, on ${FONDO}, for the website of a young Italian surveyor (geometra) who is also a web designer and a graphic designer. It joins the other mascots of the same site: the attached image, a giant African land snail, is a STYLE REFERENCE ONLY — match its drawing style, outline weight, colouring, eye design and sticker border exactly, but do NOT draw a snail and do NOT copy its backpack, camera or tools.`,
    soggetto: `A Hermann's tortoise (Testudo hermanni), the land tortoise of the gardens along the Mincio: slow, wise, a little sleepy and very greedy. Strict SIDE VIEW (profile) of the whole animal, standing calmly on its four legs and facing the viewer's LEFT:
- a high, rounded, domed carapace with the typical Hermann pattern: warm olive-yellow scutes, each with a bold black blotch and fine concentric growth lines, a slightly flared rim along the bottom edge, and the pale yellow edge of the plastron just visible under it;
- a long, wrinkled, grey-brown scaly neck stretched forward and slightly up from under the front of the shell;
- a rounded head with a small hooked beak and a clearly drawn mouth line with a small friendly closed-mouth smile: the lower jaw is clearly separate from the upper beak;
- four thick, stumpy, elephant-like legs covered in grey-brown and ochre scales, with short blunt claws: two front legs and two hind legs, the far legs just visible behind the near ones;
- a short pointed tail at the back.
On its head it wears a small vermilion construction hard hat (safety helmet), tipped slightly back so the brim stays well above the eyes: its only vermilion detail. No backpack, no bag, no tools, no clothes.
The head is turned three-quarters toward the viewer so both big round eyes are visible above the beak; the rest of the body stays in profile.`,
    // le zampe lontane riusano le immagini di quelle vicine (più scure in CSS):
    // meno pezzi nel foglio, pezzi più grandi
    pezzi: [
      'BODY: the domed carapace with all its scutes and the plastron edge under it, WITHOUT head, WITHOUT neck, WITHOUT legs and WITHOUT tail. Where the neck and the legs came out from under the shell, the shell simply ends in its clean, closed lower rim: no holes, no openings, no stumps.',
      'NECK: the long wrinkled grey-brown neck alone, straight and fully stretched out, WITHOUT the head; the pin tab is at its back (shoulder) end, the end that slides in under the front of the shell; the other end is a clean rounded end, where the head is pinned.',
      'HEAD: the head with both big round eyes and the hooked upper beak, WITHOUT the lower jaw and WITHOUT the hard hat: the bottom edge of the head is the upper edge of the mouth, and the top of the head is a complete rounded outline where the hat sits. The pin tab is at the back of the head, where it joins the neck.',
      'LOWER JAW: the lower jaw alone, the lower half of the beak and the chin, the same colour as the head; the pin tab is at its back end, the hinge under the head.',
      'HARD HAT: the small vermilion hard hat alone; the pin tab is at the back end of its brim.',
      'FRONT LEG: one thick scaly front leg with its short blunt claws, pointing straight down; the pin tab is at the top (shoulder) end, which slides in under the shell.',
      'HIND LEG: one stumpy elephant-like hind leg with its claws, pointing straight down; the pin tab is at the top (hip) end, which slides in under the shell.',
      'TAIL: the short pointed tail; the pin tab is at its base.',
    ],
    // del collo si tiene la parte davanti (500 px del foglio, 250 nel WebP): il
    // resto starebbe dentro il guscio e uscirebbe da dietro quando la testa rientra
    ritaglia: { collo: { w: 500 } },
    alt: 'La tartaruga di terra, burattino del sito',
  },
  airone: {
    titolo: "L'airone elegante",
    soggetto: `A grey heron (Ardea cinerea), the elegant heron of the Mincio river marshes near Mantua: tall and slender, standing gracefully on ONE long straight thin leg, the other leg lifted and bent at the knee in front of the body; a long elegant S-curved neck; pale grey plumage, a slate-grey folded wing with darker flight feathers, white face and neck with a thin black stripe down the front, a long black crest plume flowing back from the head; a long closed dagger-like ochre-yellow beak. At the base of its neck a small vermilion bow tie, its only vermilion detail. Poised, refined, a little haughty but kind. The body is in side view facing the viewer's right; the head is turned three-quarters toward the viewer so both big round eyes are visible above the beak.`,
    pezzi: [
      // l'intero ha preso dalla chiocciola lo zaino da geometra con gli attrezzi: resta sul corpo
      'BODY: the torso with the white chest and the short tail, with the green surveyor backpack full of tools on its back and the camera on its strap, WITHOUT neck, WITHOUT legs and WITHOUT the near folded wing (the torso outline is closed where they were).',
      'NECK: the long S-curved white neck with the black stripe and the vermilion bow tie at its base, WITHOUT the head; the pin tab is at the bottom (shoulder) end.',
      'HEAD: the head with both big round eyes, the black crest plume and the long closed ochre beak; the pin tab is at the back of the head, where it joins the top of the neck.',
      'WING: the near folded slate-grey wing, long and pointed; the pin tab is at its front shoulder end.',
      'STANDING LEG: the long straight thin ochre leg with the foot and its long toes; the pin tab is at the top (hip) end.',
      'LIFTED LEG: the other leg, bent at the knee with the foot tucked up; the pin tab is at the top (hip) end.',
    ],
    alt: "L'airone elegante, burattino del sito",
  },
  gazza: {
    titolo: 'La gazza furbissima',
    soggetto: `A Eurasian magpie (Pica pica), very clever, cheeky and sly: crisp black and white plumage with an iridescent blue-green sheen on the folded wing and on its very long wedge-shaped tail; standing upright on two thin dark legs with small claws; head cocked with a knowing, mischievous look and a smug little grin at the corner of the beak; in its beak it holds a small shiny brass key with a tiny vermilion tag tied to it, its only vermilion detail (it has just stolen it). The body is in side view facing the viewer's left; the head is turned three-quarters toward the viewer so both big round eyes are visible above the beak.`,
    pezzi: [
      'BODY: the round torso with the white belly and the black chest, WITHOUT head, WITHOUT legs, WITHOUT the near wing and WITHOUT the tail (the outline is closed where they were).',
      'HEAD: the black head with both big round eyes, the beak with the smug grin and the brass key with its vermilion tag held in the beak; the pin tab is at the back of the neck.',
      'WING: the near folded wing, black with the white shoulder patch and the blue-green sheen; the pin tab is at its front shoulder end.',
      'TAIL: the very long wedge-shaped iridescent blue-green tail; the pin tab is at its base.',
      'LEG 1: one thin dark leg with its foot and small claws; the pin tab is at the top.',
      'LEG 2: the other thin dark leg with its foot and small claws; the pin tab is at the top.',
    ],
    alt: 'La gazza furbissima, burattino del sito',
  },
  vespa: {
    titolo: 'La vespa cattiva ma precisa',
    soggetto: `A European paper wasp (Polistes), mean but meticulously precise: glossy black and bright yellow stripes, a very narrow wasp waist, a pointed striped abdomen ending in a sharp stinger whose tip is vermilion, its only vermilion detail; four wings held up and open, drawn OPAQUE in very pale blue-grey with fine ink veins (not transparent); six thin jointed black-and-yellow legs; two long curled antennae; a grumpy scowl: thick angry slanted black eyebrows drawn ABOVE the eyes without touching them, and a tight frowning mouth with small mandibles. Big round cartoon eyes, not compound eyes. Flying pose, the body in side view facing the viewer's left, the head turned toward the viewer so both big round eyes are visible.`,
    pezzi: [
      'THORAX: the striped thorax with the six thin legs attached to it, WITHOUT head, WITHOUT abdomen and WITHOUT wings (the outline is closed where they were).',
      'HEAD: the head with both big round eyes, the angry eyebrows above them, the frowning mouth and the mandibles, WITHOUT antennae; the pin tab is at the back of the head, where it joins the thorax.',
      'ABDOMEN: the pointed striped abdomen with the stinger and its vermilion tip; the pin tab is at the narrow waist end.',
      'FRONT WING: the larger front wing, opaque very pale blue-grey with fine ink veins; the pin tab is at its root.',
      'HIND WING: the smaller hind wing, same look; the pin tab is at its root.',
      'ANTENNA 1: one long curled antenna; the pin tab is at its base.',
      'ANTENNA 2: the other long curled antenna; the pin tab is at its base.',
    ],
    alt: 'La vespa cattiva ma precisa, burattino del sito',
  },
}
