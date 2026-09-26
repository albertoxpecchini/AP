// ─────────────────────────────────────────────────────────────────────────────
//  MASCOTTE — la chiocciola gigante africana e la tartaruga di terra, gli
//  animali di Alberto, che custodiscono il sito dalla testata e dal piè di
//  pagina. Un'immagine di openai/gpt-image-2 per ciascuna, fondo trasparente;
//  gli occhi restano bianchi e tondi perché il codice ci disegna sopra le pupille
//  che seguono il puntatore (src/client/mascot.js).
//
//  I prompt sono in inglese perché il modello li segue meglio.
// ─────────────────────────────────────────────────────────────────────────────

export const STILE = `A single cute mascot character, centred and large, on a fully transparent background, for the website of a young Italian surveyor (geometra) who is also a web designer and a graphic designer.
Style: friendly cartoon illustration with precise fine near-black ink outlines (#10110f) over flat matte colour fills, a subtle hand-drafted feel, like the drawings of a high-end architecture studio's identity. Palette: paper white (#f3f1ec), warm greys, light wood and earth browns, muted sage and olive green, pale blue, and ONE red-lead vermilion accent (#e5481f) on a single detail.
The eyes are the most important part, because code will animate them: each eye is a big, perfectly round, plain white circle (#ffffff) with a clean ink outline and a single small solid black round pupil right in its centre. No highlight reflections in the eyes, no eyelashes, no eyebrows, nothing overlapping the eyes. Both eyes fully visible, the same size, clearly separated from each other, and the character faces the viewer (front three-quarter view, face turned to the camera) with a small friendly closed-mouth smile.
The character has a clean off-white die-cut border (#f3f1ec), about 12 px wide, all around its outer silhouette, like a sticker.
No cast shadow, no ground, no background, no scenery, no text, no letters, no logos, no watermark.`

export const mascotte = {
  lumaca: {
    titolo: 'La chiocciola gigante africana',
    soggetto: `A giant African land snail (Achatina fulica): a large, tall conical spiral shell with brown and cream stripes, whose pointed apex tip is vermilion; a plump grey-brown body on a softly textured foot; two long upper tentacles (eye stalks) rising from the head, each ending in one big round white eyeball with a small black pupil; two short lower tentacles; the head raised and turned toward the viewer. The snail is seen from its front-left and faces the viewer's right.`,
    alt: 'La chiocciola gigante africana, mascotte del sito',
  },
  tartaruga: {
    titolo: 'La tartaruga di terra',
    soggetto: `A Mediterranean land tortoise (Testudo hermanni): a high domed shell with a pattern of olive-yellow and dark brown scutes, scaly stubby legs with small claws, a rounded head with two big round white eyes with small black pupils on the front of the face, a small smiling beak; on its head a tiny vermilion construction hard hat (safety helmet), slightly tilted. The tortoise is seen from its front-right and faces the viewer's left.`,
    alt: 'La tartaruga di terra, mascotte del sito',
  },
}
