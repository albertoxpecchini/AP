// La disposizione del muro della storia (pzkko/storia/index.html), usata da disponi.mjs --pagina=storia: come
// quella della home (../disposizione.js, lì le regole), cinque pile sul computer e due sul telefono. Le chiavi sono
// gli id dei fogli ('#storia-…') e, per le immagini, il percorso sotto art/ senza .webp.
// L'ordine si legge come la storia: in alto a sinistra il ritorno al muro, il volantino d'apertura e la prima foto,
// poi i quattro fogli di com'è andata con gli altri due scatti, in mezzo cosa è finito su pzkko, a destra bologna 2.0
// coi meme, lo scontrino e le curiosità, in fondo la fine.
// Qui i fogli si leggono fino in fondo (le didascalie delle foto, le scritte dei meme): il passo è 1 e si
// sovrappongono solo dove sotto c'è il margine bianco della carta (gap negativi piccoli).

export const DESK = {
  gap: -10,
  // manopole (serranda.mjs): spazio in cima e in fondo, altezza minima, passo delle pile, larghezza dei pezzi
  top: 0, bottom: 40, minimo: 2000, passo: 1, scala: 1,
  cols: [
    { x: 12, items: [
      { k: '#storia-torna', w: 190, dx: 30, gap: 10, r: -3 },
      { k: '#storia-muro', w: 300, gap: -22, r: -1.5 },
      { k: '#storia-com-e-andata', w: 240, dx: 25, gap: 0, r: -4 },
      { k: '#storia-bologna', w: 275, gap: -4, r: -2 },
      { k: '#storia-saracinesca', w: 280, gap: -24, r: -1.5 },
    ] },
    { x: 262, items: [
      { k: '#storia-scatto-1', w: 320, dx: 5, gap: 30, r: 1.5 },
      { k: '#storia-iphone', w: 270, gap: -6, r: 2 },
      { k: '#storia-scatto-3', w: 245, dx: 8, gap: -22, r: 2 },
      { k: '#storia-lo-sapevi', w: 285, gap: -6, r: -1 },
    ] },
    { x: 512, items: [
      { k: 'manifesti3/unimore', w: 255, dx: 40, gap: 14, r: 2 },
      { k: '#storia-scatto-2', w: 245, dx: 15, gap: -25, r: -1 },
      { k: '#storia-due-anni-dopo', w: 275, gap: -6, r: 1.5 },
      { k: '#storia-cosa-e-finito', w: 250, dx: 18, gap: 0, r: -3 },
      { k: '#storia-insegna', w: 285, gap: -4, r: -0.5 },
    ] },
    { x: 762, items: [
      { k: '#storia-bologna-2-0', w: 262, gap: 50, r: 0.5 },
      { k: '#storia-meme-spaghetti', w: 245, dx: 10, gap: -6, r: -1.5 },
      { k: '#storia-adesivo', w: 270, gap: -6, r: 1 },
      { k: '#storia-roba-degli-altri', w: 265, gap: -16, r: -1 },
      { k: '#storia-scontrino', w: 245, dx: 10, gap: -10, r: 0.6 },
    ] },
    { x: 1012, items: [
      { k: '#storia-meme-nonna', w: 235, dx: 22, gap: 20, r: 1.5 },
      { k: '#storia-meme-ragu', w: 225, dx: 30, gap: -6, r: 2 },
      { k: '#storia-ragu', w: 255, dx: 8, gap: -6, r: 2 },
      { k: '#storia-meme-torri', w: 230, dx: 20, gap: -24, r: -1 },
      { k: '#storia-meme-mortadella', w: 230, dx: 26, gap: -6, r: 1.5 },
      { k: '#storia-meme-iphone', w: 230, dx: 16, gap: -6, r: -2 },
      { k: '#storia-fine', w: 255, dx: 8, gap: -6, r: 1 },
    ] },
  ],
  rel: [
    // graffiti e resti degli altri, sotto i fogli
    { k: 'tag/tag-nero', to: '#storia-muro', fx: 0.55, fy: 0.85, w: 300, r: -3 },
    { k: 'tag/throwup-argento', to: '#storia-due-anni-dopo', fx: -0.35, fy: 0.7, w: 250, r: -6 },
    { k: 'tag/scarabocchio', to: '#storia-meme-torri', fx: -0.6, fy: 0.2, w: 230, r: 0 },
    { k: 'tag/faccia', to: '#storia-roba-degli-altri', fx: 0.85, fy: 0.9, w: 95, r: 6 },
    { k: 'tag/stencil-chiocciola', to: '#storia-saracinesca', fx: 0.1, fy: 1.0, w: 110, r: 0 },
    { k: 'tag/tag-verde', to: '#storia-lo-sapevi', fx: -0.3, fy: 0.55, w: 330, r: 2 },
    { k: 'tag/ciao-bianco', to: '#storia-meme-spaghetti', fx: -0.35, fy: 0.75, w: 250, r: -8 },
    { k: 'scritte2/unimore', to: 'manifesti3/unimore', fx: 0.75, fy: 0.75, w: 120, r: -4 },
    { k: 'strada2/qui', to: '#storia-insegna', fx: 0.75, fy: 0.95, w: 120, r: 0 },
    { k: 'strada1/gomme', to: '#storia-meme-iphone', fx: -0.15, fy: 0.85, w: 48, r: 0 },
    { k: 'bestiole/gomme2', to: '#storia-meme-ragu', fx: 0.9, fy: 0.3, w: 30, r: 20 },
    { k: 'nastro/resto-bianco', to: '#storia-insegna', fx: 0.15, fy: 1.02, w: 180, r: -4 },
    { k: 'nastro/resto-giallo', to: '#storia-adesivo', fx: 0.9, fy: 0.95, w: 170, r: 6 },
    // sopra: graffette, l'adesivo, il nastro nero
    { k: 'nastro/graffette', to: '#storia-bologna-2-0', fx: -0.08, fy: 0.9, w: 70, r: 30 },
    { k: 'nastro/adesivo', to: '#storia-fine', fx: 0.8, fy: 0.85, w: 90, r: -10 },
    { k: 'nastro/nastro-nero', to: '#storia-scontrino', fx: 0.62, fy: -0.045, w: 90, r: -8 },
  ],
  abs: [
    { k: 'bestiole/rivolo', x: 1215, y: 0, w: 36, r: 0 },
  ],
}

export const MOB = {
  gap: -8,
  // manopole (serranda.mjs): spazio in cima e in fondo, altezza minima, passo delle pile, larghezza dei pezzi
  top: 0, bottom: 40, minimo: 0, passo: 1, scala: 1,
  cols: [
    { x: 6, items: [
      { k: '#storia-torna', w: 150, dx: 20, gap: 8, r: -3 },
      { k: '#storia-muro', w: 200, gap: -16, r: -2 },
      { k: '#storia-scatto-1', w: 188, gap: -16, r: 1.5 },
      { k: '#storia-com-e-andata', w: 160, dx: 15, gap: 0, r: -4 },
      { k: '#storia-bologna', w: 185, gap: -2, r: -2 },
      { k: '#storia-saracinesca', w: 188, gap: -18, r: -1.5 },
      { k: '#storia-cosa-e-finito', w: 180, dx: 5, gap: -6, r: -3 },
      { k: '#storia-insegna', w: 188, gap: 4, r: -0.5 },
      { k: '#storia-roba-degli-altri', w: 188, gap: -14, r: -1 },
      { k: '#storia-lo-sapevi', w: 190, gap: -10, r: -1 },
      { k: '#storia-meme-torri', w: 175, dx: 8, gap: -4, r: -1 },
      { k: '#storia-meme-iphone', w: 175, dx: 4, gap: -4, r: -2 },
      { k: '#storia-fine', w: 188, gap: -4, r: 1 },
    ] },
    { x: 198, items: [
      { k: 'manifesti3/unimore', w: 170, dx: 10, gap: 18, r: 2 },
      { k: '#storia-iphone', w: 185, gap: -14, r: 2 },
      { k: '#storia-scatto-2', w: 180, dx: 4, gap: -18, r: -1 },
      { k: '#storia-scatto-3', w: 180, dx: 4, gap: -4, r: 2 },
      { k: '#storia-due-anni-dopo', w: 188, gap: -4, r: 1.5 },
      { k: '#storia-adesivo', w: 188, gap: -14, r: 1 },
      { k: '#storia-scontrino', w: 180, dx: 4, gap: -12, r: 0.6 },
      { k: '#storia-bologna-2-0', w: 182, dx: 2, gap: 24, r: 0.5 },
      { k: '#storia-meme-spaghetti', w: 182, dx: 2, gap: -4, r: -1.5 },
      { k: '#storia-meme-nonna', w: 175, dx: 6, gap: -4, r: 1.5 },
      { k: '#storia-meme-ragu', w: 175, dx: 6, gap: -4, r: 2 },
      { k: '#storia-ragu', w: 185, gap: -4, r: 2 },
      { k: '#storia-meme-mortadella', w: 175, dx: 6, gap: -4, r: 1.5 },
    ] },
  ],
  rel: [
    { k: 'tag/tag-nero', to: '#storia-muro', fx: 0.1, fy: 0.86, w: 230, r: -6 },
    { k: 'tag/throwup-argento', to: '#storia-due-anni-dopo', fx: -0.4, fy: 0.3, w: 200, r: -5 },
    { k: 'tag/scarabocchio', to: '#storia-meme-torri', fx: -0.6, fy: 0.4, w: 170, r: -5 },
    { k: 'tag/faccia', to: '#storia-roba-degli-altri', fx: 0.8, fy: 0.95, w: 70, r: 8 },
    { k: 'tag/stencil-chiocciola', to: '#storia-saracinesca', fx: 0.1, fy: 1.0, w: 110, r: 0 },
    { k: 'tag/tag-verde', to: '#storia-lo-sapevi', fx: 0.3, fy: 0.85, w: 240, r: 3 },
    { k: 'tag/ciao-bianco', to: '#storia-meme-ragu', fx: -0.6, fy: 0.6, w: 180, r: -7 },
    { k: 'scritte2/unimore', to: 'manifesti3/unimore', fx: 0.5, fy: 0.8, w: 95, r: -4 },
    { k: 'strada2/qui', to: '#storia-fine', fx: 0.75, fy: 0.55, w: 80, r: 0 },
    { k: 'strada1/gomme', to: '#storia-meme-mortadella', fx: 0.1, fy: 1.02, w: 34, r: 0 },
    { k: 'bestiole/gomme2', to: '#storia-meme-mortadella', fx: 0.92, fy: 0.95, w: 22, r: 20 },
    { k: 'nastro/resto-bianco', to: '#storia-scontrino', fx: 0.1, fy: 1.0, w: 120, r: -8 },
    { k: 'nastro/resto-giallo', to: '#storia-adesivo', fx: 0.6, fy: -0.1, w: 120, r: 10 },
    { k: 'nastro/graffette', to: '#storia-bologna-2-0', fx: -0.08, fy: 0.9, w: 50, r: 30 },
    { k: 'nastro/adesivo', to: '#storia-fine', fx: 0.75, fy: 0.85, w: 70, r: -12 },
    { k: 'nastro/nastro-nero', to: '#storia-scontrino', fx: 0.6, fy: -0.035, w: 70, r: -10 },
  ],
  abs: [
    { k: 'bestiole/rivolo', x: 352, y: 0, w: 22, r: 0 },
  ],
}
