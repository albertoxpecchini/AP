// ─────────────────────────────────────────────────────────────────────────────
//  COPERTINE DEI PROGETTI — le illustrazioni che fanno da miniatura e da
//  copertina ai progetti con le tavole vere, al posto della tavola stessa.
//
//  Le disegna openai/gpt-image-2 su Replicate (genera.mjs). Ogni voce ha il
//  soggetto del progetto e le tavole da dare al modello come riferimento: il
//  modello ne prende l'impianto (dove sta la strada, dove l'edificio), non lo
//  stile. STILE è comune a tutte, così le copertine fanno serie tra loro e con
//  la palette del sito (carta, inchiostro, minio).
//
//  I prompt sono in inglese perché il modello li segue meglio.
// ─────────────────────────────────────────────────────────────────────────────

export const STILE = `Editorial architectural illustration, axonometric bird's-eye view (isometric, about 30 degrees). The subject is a single block of land cut out of the ground and floating on a plain, warm off-white paper background (#f3f1ec); the cut faces of the block show the soil in section, in thin layered warm greys and ochre.
Drawn with precise, fine, near-black ink outlines (#10110f) over flat matte colour fills, with a subtle hand-drafted feel, like a high-end architecture competition diagram. Restrained palette: paper whites, warm greys (#eae7e0, #dedad1, #5a5b55), muted sage and olive greens for vegetation, pale blue for water, and ONE strong accent colour, red-lead vermilion (#e5481f), reserved for the key element of the project.
Soft, short ambient shadows only; no heavy gradients, no photorealism, no depth of field, no lens effects.
Centred composition with a wide empty paper margin: the whole block, corners and cut faces included, stays inside the central 70% of the image width and the central 75% of its height, because the image will be cropped to 4:3 and to 16:9.
No text, no letters, no numbers, no labels, no legend, no title block, no north arrow, no logo, no watermark, no frame.
The attached drawings are the real project: use them only as a reference for layout and geometry, never copy their drafting style, colours, text or legend.`

export const copertine = {
  'progetto-stradale': {
    riferimenti: ['public/media/tavole/progetto-stradale/05.webp', 'public/media/tavole/progetto-stradale/06.webp'],
    alt: 'Illustrazione in assonometria: un blocco di collina a curve di livello con la strada di progetto in minio che scende nel fondovalle, attraversa il corso d’acqua e risale; sul fronte del blocco, il profilo longitudinale',
    soggetto: `The project: a 934 m road designed on a contour map, from point A (300 m) down into a valley (269 m) and up again to point B (286 m).
The block is hilly terrain modelled as stacked contour terraces, like a laser-cut contour model where every layer is a thin slab of card. Two slopes face each other across a valley; a small stream in pale blue winds along the valley floor from left to right, joined by a side stream coming down from the upper left.
The road is a 10 m wide ribbon in vermilion. It starts at A, high on the upper right hillside, descends diagonally across the slope with long straights and four smooth circular curves, crosses the stream on a small culvert bridge on the valley floor, and climbs through a wide curve to B on the lower left hillside, following the attached plan (A top right, B lower left, stream across the middle).
Where the road cuts into the hill, thin grey cut slopes; where it runs on fill, gentle embankments. A row of tiny survey stakes along the road axis. Two small farm buildings near the stream.
On the front cut face of the block, the long profile of the terrain with the road line drawn on it, as in the attached longitudinal profile.
The only lettering allowed in the whole image: a tiny flag with the letter A at the start of the road and one with the letter B at the end.`,
  },

  'bar-caffetteria-esame-di-stato': {
    riferimenti: ['public/media/tavole/bar-caffetteria-esame-di-stato/01.webp', 'public/media/tavole/bar-caffetteria-esame-di-stato/02.webp'],
    alt: 'Illustrazione in assonometria del parco: il bar-caffetteria a un piano con le travi di legno a vista, la terrazza con gli ombrelloni tra i due gazebo, la piazza a quadrifoglio con la fontana, gli alberi e l’orto didattico',
    soggetto: `The project: a single-storey bar-caffetteria inside a public park about farming and healthy food, with a didactic vegetable garden. Follow the attached site plan and elevations.
Lower right of the block: the compact building, about 14 by 14 m, flat roof; walls partly olive green and partly light grey, dark teal window frames, large glazed openings towards the park, and a row of exposed round timber beam ends projecting along the top of the walls like a pergola. Next to it two small light timber gazebos (about 4 by 3 m) with translucent white canopies, and an outdoor terrace with small tables under vermilion umbrellas.
Upper left of the block: a large four-lobed, clover-shaped paved plaza in pale grey with a round fountain pond at its centre, divided into three segments.
Between the plaza and the building, a diagonal band of round, dense trees; many more trees scattered irregularly on the lawns. Organic winding footpaths in pale gravel connect everything. A vegetable garden with neat raised beds near the building. A narrow service lane with a timber-coloured path along the right edge, a herringbone-paved square in the upper right, and a street along the front edge of the block.
Lawns in soft sage green. The building and its terrace are the focus.`,
  },

  'layout-cantiere': {
    riferimenti: ['public/media/tavole/layout-cantiere/02.webp'],
    alt: 'Illustrazione in assonometria del cantiere: l’edificio prefabbricato in montaggio, l’autogru in minio con il suo raggio d’azione, la recinzione, le baracche, i depositi e i mezzi',
    soggetto: `The project: the layout of a construction site for a two-storey building made of precast concrete elements (a warehouse with a portico, offices and a flat). Follow the attached site layout plan.
In the middle of the block: the building half assembled — precast columns and beams standing, some hollow-core floor slabs and wall panels already in place, the rest still missing.
A large mobile crane on tyres, painted vermilion, with its lattice boom extended, lifting a precast wall panel; its working radius traced on the ground as a thin dashed circle.
Around the building: a 2 m high perimeter fence of light grey mesh panels following the lot; a wide vehicle gate at the front right, reached by the access road, and a separate small pedestrian gate; an internal track of compacted gravel looping around the building for the trucks; a flatbed truck delivering a precast beam; a storage area with precast panels, beams and columns resting on timber bearers; pallets of bricks and of cement bags; a heap of sand and gravel and a skip for debris; two site cabins (site office with a small first-aid cross, contractor's office), a portable toilet and a changing-room container; a concrete mixer and a rebar bending bench with steel bars; a few parking bays; grass all around.
Tiny workers in hi-vis vests and white helmets for scale. Everything tidy, each zone clearly distinct and readable.`,
  },

  // Nessuna tavola vera da dare come riferimento: il soggetto descrive tutto.
  'tettoie-legno-lamellare': {
    riferimenti: [],
    alt: 'Illustrazione in assonometria: una tettoia in legno lamellare a falda unica addossata a una casa, con i pilastri, le travi e i travetti color miele e la copertura in lamiera minio posata solo in parte, sopra un’auto e un tavolo da giardino',
    soggetto: `The project: timber canopies in glued-laminated timber (glulam GL24h), modelled in 3D during an internship in the technical office of a timber construction company.
On the block: the corner of a residential garden next to a simple two-storey house with pale grey render (only its lower part and one corner, cut by the block edge). Attached to the house wall, a single-pitch lean-to canopy about 6 by 5 m: four square glulam columns on small dark steel base plates, two main glulam beams, a regular row of rafters at equal spacing, a ledger beam fixed to the wall, sloping gently away from the house. The glulam is warm honey-coloured wood with fine lamination lines visible on the beam ends.
The roof is a standing-seam metal sheet painted vermilion, laid only on the back two thirds of the canopy, so that on the front third the rafters stay bare and the structure can be read.
Under the canopy a small parked car and a garden table with chairs; a gravel driveway, a lawn in sage green, a low hedge, two small trees.`,
  },

  // Non è un progetto: l'illustrazione dell'area D dei servizi (assistenza
  // informatica), in /servizi/ e nella sua pagina. Niente terreno da tagliare:
  // `stile` usa il linguaggio `blocco` delle viste, `cartella` la manda fuori
  // dalle cartelle dei progetti.
  informatica: {
    riferimenti: [],
    stile: 'blocco',
    cartella: 'public/media/servizi/informatica',
    alt: 'Illustrazione in assonometria di un piccolo studio in ordine: una persona alla scrivania con monitor e portatile, accanto il computer fisso aperto e il suo pannello laterale in minio appoggiato alla gamba del tavolo; sul mobile basso la stampante, il router, il disco esterno e i raccoglitori',
    soggetto: `An isometric cut-away of a small, tidy home office: a square floor slab with two walls meeting at the back corner, like an architectural model cut out of a building; the cut edges of the floor and of the walls show their layers in section.
On a light timber desk against the back wall: a desktop computer tower with its side panel removed, showing the motherboard, the memory sticks and the fans inside; the removed side panel, painted vermilion, leans against the desk leg. Next to it a monitor and an open laptop, both showing only abstract shapes and a progress bar, a keyboard, a mouse and an open screwdriver set.
On a low shelf along the side wall: a compact printer with a sheet coming out, a wireless router with two antennas and tiny status lights, a portable external hard drive, and a row of neat file folders. A desk chair, a small potted plant, cables tidied with ties along the wall.
The vermilion side panel of the computer is the only vermilion element. Everything tidy, calm and readable, like a well-kept workshop.`,
  },

  'museo-mestieri-del-fiume': {
    riferimenti: ['public/media/progetti/museo-mestieri-del-fiume/01-full.webp', 'public/media/progetti/museo-mestieri-del-fiume/02-full.webp'],
    alt: 'Illustrazione in assonometria del museo sul Mincio: gli edifici rurali rossi intorno al prato, il pontile di legno con la barca da pesca, il canneto sull’altra sponda e le biciclette della classe all’ingresso',
    soggetto: `The project: a school visit report about a small ethnographic museum of the river crafts, on the bank of the Mincio river at Rivalta sul Mincio, in the wetlands of the Valli del Mincio nature reserve in northern Italy. The attached photographs show the museum wall and the river seen from its jetty.
On the block: along the back edge, the wide, slow Mincio river in pale blue, with a band of tall reed beds and willows on the far bank. On the near bank, the museum: two low rural buildings with pitched roofs of old terracotta tiles, set at right angles around a lawn; their walls are painted a deep brick red, drawn in vermilion, with barred windows as in the attached photograph. A long timber jetty runs from the lawn out onto the river, with a flat, narrow wooden fishing boat moored beside it. On the lawn two stone benches and a few trees; about fifteen bicycles parked in a row near the entrance (the class arrived by bike); a small group of tiny figures walking towards the door. A gravel lane along the front edge of the block, a line of poplars.
The museum walls are the only vermilion element.`,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  VISTE — le immagini della galleria dei progetti non web, al posto delle
//  tavole e delle pagine della relazione (26.09.2026, Alberto: «mai mostrare i
//  documenti»). Tre per progetto: la prima va a tutta larghezza, le altre due
//  in riga. 16:9 a 2048 × 1152, la misura più grande che il modello regge bene.
//
//  `stile` sceglie il linguaggio: `scena` è un'inquadratura piena (dal vero,
//  un interno), `blocco` un oggetto che galleggia sulla carta come le copertine,
//  `oggetti` una tavola da catalogo. Le viste `blocco` e `oggetti` ricevono il
//  margine di carta come le copertine (genera.mjs usa-vista).
// ─────────────────────────────────────────────────────────────────────────────

const LINGUAGGIO = `Drawn with precise, fine, near-black ink outlines (#10110f) over flat matte colour fills, with a subtle hand-drafted feel, like a high-end architecture competition board. Restrained palette: warm off-white paper (#f3f1ec), warm greys (#eae7e0, #dedad1, #5a5b55), muted sage and olive greens for vegetation, pale blue for water and sky, natural honey and walnut tones for timber, and ONE strong accent colour, red-lead vermilion (#e5481f), reserved for the key element named in the description.
Soft, short ambient shadows only; no heavy gradients, no photorealism, no depth of field, no lens effects, no bloom.`

const SENZA_TESTO = `No text, no letters, no numbers, no labels, no signs or screens with writing, no legend, no title block, no north arrow, no logo, no watermark, no frame.
Any people are small, simplified figures, seen from a distance, from behind or in three-quarter view, with no recognisable faces.
If drawings or photographs are attached, they are the real project: use them only as a reference for layout, geometry and materials, never copy their drafting style, colours, text or legend.`

export const STILI = {
  scena: `Editorial architectural illustration, a full-bleed scene that fills the whole frame edge to edge: no border, no floating block, no empty margin. Keep the key element well inside the frame.
${LINGUAGGIO}
${SENZA_TESTO}`,
  blocco: `Editorial architectural illustration, axonometric view (isometric, about 30 degrees). The subject floats on a plain, warm off-white paper background (#f3f1ec); where it is cut out of the ground, the cut faces show the soil in section, in thin layered warm greys and ochre.
${LINGUAGGIO}
Centred composition with a wide empty paper margin all around the subject.
${SENZA_TESTO}`,
  oggetti: `Editorial illustration, like a plate from a museum catalogue: objects isolated on a plain, warm off-white paper background (#f3f1ec), side by side at the same scale, each with a soft short shadow on the paper.
${LINGUAGGIO}
Centred composition with a wide empty paper margin all around.
${SENZA_TESTO}`,
}

const T = (slug, n) => `public/media/tavole/${slug}/${n}.webp`
const F = (n) => `public/media/progetti/museo-mestieri-del-fiume/${n}-full.webp`

export const viste = {
  'progetto-stradale': [
    {
      nome: 'vista-01',
      stile: 'scena',
      riferimenti: [T('progetto-stradale', '05'), T('progetto-stradale', '06')],
      didascalia: 'La strada nella valle',
      alt: 'Illustrazione a volo d’uccello della strada finita: scende il versante con lunghi rettifili e curve, attraversa il torrente nel fondovalle su un piccolo ponte e risale il pendio opposto, con la linea di mezzeria in minio',
      soggetto: `A high oblique aerial view, as from a drone about 80 m up, over quiet hilly farmland in late spring. A newly built country road, 10 m wide, in dark grey asphalt, descends the near hillside in long straights and four smooth circular curves, crosses a small stream on the valley floor on a short concrete culvert bridge, and climbs the opposite slope in one wide curve towards the top of the frame, following the attached plan and long profile.
Where the road cuts into the hill, fresh grass-covered cut slopes with a shallow ditch on the uphill side; where it runs on fill, gentle embankments. Fields, hedgerows, rows of poplars, a small farm with two buildings near the stream.
Key element in vermilion: the road's centre line and edge lines, so the whole alignment reads at a glance.`,
    },
    {
      nome: 'vista-02',
      stile: 'blocco',
      riferimenti: [T('progetto-stradale', '07')],
      didascalia: 'Sterro e riporto in una sezione',
      alt: 'Illustrazione in assonometria di una fetta di collina tagliata di traverso alla strada: la piattaforma di 10 metri incassata nel pendio, la cunetta dal lato a monte, la scarpata a valle, con lo scavo in minio e il riporto in giallo sulla faccia tagliata',
      soggetto: `A single thick slice of hillside, cut out across the road axis and floating on the paper, like a cross-section model. The natural ground slopes down from left to right. The 10 m road platform is set into the slope: on the uphill side a cut slope at 2 on 3 with a small concrete ditch at its foot, on the downhill side a fill embankment at 2 on 3. Grass on the terrain, the asphalt platform in dark grey with thin white edge lines, two small bushes.
On the front cut face of the slice, the section is coloured as in the attached drawing: the volume of earth dug away above the platform on the uphill side is a solid vermilion area (the key element), the volume of fill under the platform on the downhill side is a pale ochre-yellow area, and the soil layers below are thin warm greys. The original ground line is a thin dashed ink line across both.
Behind the slice, the road continues for a few metres as a faint thin outline.`,
    },
    {
      nome: 'vista-03',
      stile: 'scena',
      riferimenti: [T('progetto-stradale', '04')],
      didascalia: 'Il picchettamento dell’asse',
      alt: 'Illustrazione di un versante erboso: un topografo di spalle alla stazione totale sul treppiede e una fila di picchetti con la testa minio che scende a valle seguendo le curve della futura strada, oltre il torrente e su per il pendio opposto',
      soggetto: `Eye-level view on a grassy hillside in the morning, before the works start. In the foreground a surveyor, small and seen from behind, stands at a total station on a tripod. Ahead of him a long line of wooden survey stakes with vermilion painted tops (the key element) runs down the slope, following the smooth curves of the future road axis as in the attached drawing, crosses a small stream in the valley and climbs the far hillside, getting smaller in perspective. Far away a second small figure holds a prism pole.
Rolling hills with hedgerows and a few trees, a farm in the distance, a pale sky.`,
    },
  ],

  'bar-caffetteria-esame-di-stato': [
    {
      nome: 'vista-01',
      stile: 'scena',
      riferimenti: [T('bar-caffetteria-esame-di-stato', '02'), T('bar-caffetteria-esame-di-stato', '05')],
      didascalia: 'Il bar visto dal parco',
      alt: 'Illustrazione del bar-caffetteria visto dal prato: l’edificio a un piano verde oliva e grigio con le grandi vetrate e le travi di legno a vista, la terrazza con gli ombrelloni minio tra i due gazebo, le persone ai tavoli e l’orto a lato',
      soggetto: `Eye-level view from the park lawn towards a single-storey bar-caffetteria on a sunny late afternoon, following the attached elevations and furnished plan. A compact flat-roofed building about 14 m wide; walls partly olive green and partly light grey render; large glazed openings with slim dark teal frames; a row of exposed round timber beams projecting from the top of the walls like a pergola that shades the facade.
In front, a paved terrace with small round tables and chairs under vermilion parasols (the key element), between two light timber gazebos with translucent white canopies. A few people sitting at the tables and walking on the gravel paths. Round trees, lawns, and the raised beds of a vegetable garden at the side.`,
    },
    {
      nome: 'vista-02',
      stile: 'scena',
      riferimenti: [T('bar-caffetteria-esame-di-stato', '05'), T('bar-caffetteria-esame-di-stato', '08')],
      didascalia: 'Dentro la sala bar',
      alt: 'Illustrazione dell’interno della sala bar: il lungo bancone con il fronte minio e gli sgabelli, i tavolini, la parete di vetrate aperta sul parco con i gazebo e le teste delle travi di legno fuori',
      soggetto: `Interior view of the bar room, about 107 square metres. On the right, a long bar counter with a wooden top, an espresso machine and shelves with cups behind it; the front panel of the counter and the bar stools are vermilion (the key element). Small tables and chairs in the middle. On the left, a wall of tall windows opening onto the park: trees, lawns and a timber gazebo with a white canopy outside, and the ends of the timber roof beams visible above the glass. A simple flat white ceiling with slim linear lamps, a light terrazzo floor. A barista and two customers.`,
    },
    {
      nome: 'vista-03',
      stile: 'blocco',
      riferimenti: [T('bar-caffetteria-esame-di-stato', '05'), T('bar-caffetteria-esame-di-stato', '03')],
      didascalia: 'La pianta arredata, in volume',
      alt: 'Illustrazione in assonometria del bar senza tetto, con i muri tagliati a metà altezza: la sala con il bancone minio e i tavoli, la cucina, il laboratorio, i due blocchi di servizi, e fuori la terrazza con i gazebo',
      soggetto: `An axonometric cutaway of the bar-caffetteria with the roof removed, standing on a thin slab of its terrace and lawn that floats on the paper. The walls are cut at about 1.5 m high, so the furnished plan of the attached drawing reads from above like a doll's house: the large bar room with the long bar counter (vermilion, the key element) and small tables and chairs; the kitchen with steel worktops; the small laboratory; two blocks of toilets, for the public and for the staff, with basins and WCs; a storeroom. Big glazed openings on the park side.
Outside: the paved terrace with tables, two small timber gazebos with white canopies, a strip of lawn with a couple of round trees and a few raised vegetable beds.`,
    },
  ],

  'layout-cantiere': [
    {
      nome: 'vista-01',
      stile: 'scena',
      riferimenti: [T('layout-cantiere', '02')],
      didascalia: 'Il montaggio con l’autogru',
      alt: 'Illustrazione dentro il cantiere: l’autogru minio solleva un pannello prefabbricato di calcestruzzo guidato da due operai con il gilet ad alta visibilità, accanto a pilastri e travi già montati',
      soggetto: `Eye-level view inside the construction site on a clear morning. A large mobile crane on tyres, painted vermilion (the key element), with its telescopic boom raised, lifts a big grey precast concrete wall panel on slings; two workers in hi-vis vests and white helmets guide it with tag lines towards the precast columns and beams already standing. Behind them, the half-assembled two-storey precast building, with some hollow-core floor slabs in place.
Compacted gravel ground with tyre tracks, stacks of precast panels resting on timber bearers, the grey mesh perimeter fence and flat countryside beyond.`,
    },
    {
      nome: 'vista-02',
      stile: 'scena',
      riferimenti: [T('layout-cantiere', '01'), T('layout-cantiere', '02')],
      didascalia: 'L’arrivo di una trave',
      alt: 'Illustrazione dell’ingresso carrabile del cantiere: un autoarticolato con una lunga trave prefabbricata passa dal cancello aperto nella recinzione; dentro le baracche, il bagno chimico, i bancali e, davanti all’edificio in costruzione, l’autogru minio che solleva una trave',
      soggetto: `View from the access road at the vehicle gate of the construction site, following the attached site plans. An articulated flatbed truck carrying a long precast concrete beam turns in through the wide open gate in a 2 m high grey mesh fence; next to it, the separate small pedestrian gate.
Inside the fence: two white site cabins, one with a small green first-aid cross; a portable toilet; a few parked cars; pallets of bricks and of cement bags; a heap of sand. Beyond them, the precast building under construction and, rising above it, the boom of the vermilion mobile crane (the key element). A few workers in hi-vis vests and white helmets.`,
    },
    {
      nome: 'vista-03',
      stile: 'blocco',
      riferimenti: [T('layout-cantiere', '03'), T('layout-cantiere', '04')],
      didascalia: 'L’edificio finito',
      alt: 'Illustrazione in assonometria dell’edificio finito sul suo lotto: il magazzino alto al centro con il portico minio sul fronte, l’ala a due piani con l’abitazione, l’ala degli uffici, il piazzale, i parcheggi e gli alberi giovani',
      soggetto: `The building that the construction site was organised for, finished, on a block of land floating on the paper, following the attached floor plans. A building made of precast concrete elements: a tall single-volume warehouse in the middle with large sectional doors and a deep portico on slender precast columns along its front (the portico structure is vermilion, the key element); on the left a two-storey wing with the entrance, kitchen and laundry on the ground floor and two bedrooms above; on the right a single-storey wing with offices and toilets.
Flat roofs with thin parapets, light grey precast panels with a fine texture, dark window frames. Around it an asphalt yard, a few parking bays, lawns, a row of young trees and a low fence.`,
    },
  ],

  'tettoie-legno-lamellare': [
    {
      nome: 'vista-01',
      stile: 'blocco',
      riferimenti: [],
      didascalia: 'La tettoia in esploso',
      alt: 'Illustrazione in esploso assonometrico di una tettoia in legno lamellare: plinti, pilastri, travi principali, travetti, tavolato e lamiera sollevati uno sopra l’altro, con le piastre e le staffe d’acciaio in minio',
      soggetto: `An exploded axonometric of a single-pitch glulam timber canopy, like an assembly diagram. From bottom to top: a small patch of paved ground with four concrete plinths and steel base plates; the four square glulam columns; the two main glulam beams; the row of rafters at equal spacing; the timber roof boards; the standing-seam metal roof sheets. Every layer is lifted above the one below, with thin dashed vertical lines showing how the pieces fit together.
All the steel connectors (base plates, beam hangers, angle brackets) are vermilion, the key element. Honey-coloured glulam with fine lamination lines on the end grain; the roof sheets in light grey.`,
    },
    {
      nome: 'vista-02',
      stile: 'scena',
      riferimenti: [],
      didascalia: 'In magazzino, tra travi e pannelli',
      alt: 'Illustrazione dell’interno del magazzino di un’azienda del legno: cataste di travi lamellari e pannelli X-LAM, una macchina a controllo numerico sul fondo, un tirocinante e un tecnico che misurano la testa di una trave, un carrello elevatore minio',
      soggetto: `Interior of the warehouse of a timber construction company. Long stacks of glulam beams of different sections on steel racks, a tall stack of large cross-laminated timber wall panels, and a CNC joinery machine cutting a beam at the far end; daylight from roof lights.
In the foreground a young trainee and an older technician check the end of a beam with a tape measure and a tablet whose screen shows only a simple line drawing of a canopy. In the middle distance a vermilion forklift (the key element) carries a long beam.`,
    },
    {
      nome: 'vista-03',
      stile: 'scena',
      riferimenti: [],
      didascalia: 'La tettoia finita',
      alt: 'Illustrazione di una tettoia in legno lamellare addossata a una casa, vista dal giardino: pilastri e travetti color miele, il bordo della copertura in minio, sotto un’auto e un tavolo con le sedie',
      soggetto: `Eye-level view from a garden of a finished single-pitch glulam canopy attached to the side of a simple house with pale grey render, on a summer afternoon. Four square honey-coloured glulam columns on small steel base plates, two main beams, regular rafters and a timber board ceiling seen from below; the edge of the roof is a thin vermilion metal flashing (the key element).
Under the canopy a parked car and a garden table with chairs; gravel, lawn, a hedge, potted plants; soft shadows of the rafters on the ground.`,
    },
  ],

  'museo-mestieri-del-fiume': [
    {
      nome: 'vista-01',
      stile: 'scena',
      riferimenti: [F('08'), F('11')],
      didascalia: 'La cucina del cannaiolo',
      alt: 'Illustrazione della cucina d’epoca ricostruita nel museo: la stufa in ghisa minio al centro, il tavolo con la rete e la pentola, le mensole con il tostacaffè, il macinino e i fiaschi impagliati',
      soggetto: `Interior of the reconstructed kitchen of a reed-cutter and fisherman's family of the early twentieth century, inside the museum, as in the attached photographs. In the centre a large cast-iron stove with pots on it, drawn in vermilion (the key element). A wooden table with a fishing net, a straw brush, a pot and a glass dish. Wooden shelves on the whitewashed walls with a coffee grinder, a coffee roaster with a long wooden handle and straw-covered flasks; the chains of the fireplace hanging; rush-seated chairs; a dish rack with white plates; a terracotta tile floor. Quiet, warm, no people.`,
    },
    {
      nome: 'vista-02',
      stile: 'oggetti',
      riferimenti: [F('11')],
      didascalia: 'Il corno, il tostacaffè, il cardatore',
      alt: 'Illustrazione da catalogo dei tre oggetti descritti nella relazione: un grande corno con l’anello per appenderlo, un tostacaffè di inizio Novecento con il manico di legno e un cardatore per la lana, ciascuno con un cartellino legato da un filo minio',
      soggetto: `Three objects from the museum, the ones described in the report, drawn side by side: on the left, a large old cattle horn with a small metal ring at its tip for hanging, once used as a container and to call the livestock; in the middle, a domestic coffee roaster of the early 1900s, a small dark iron drum with a crank and a long wooden handle, as in the attached photograph; on the right, a pair of hand wool carders, two wooden paddles with handles, covered with fine bent metal teeth.
Each object has a small blank paper tag tied to it with a vermilion string (the key element).`,
    },
    {
      nome: 'vista-03',
      stile: 'scena',
      riferimenti: [F('46'), F('48')],
      didascalia: 'La barca e le nasse',
      alt: 'Illustrazione della sala della pesca del museo: la barca piatta e stretta di legno con remi, pertica e reti, le nasse con la rete minio appese alle travi del soffitto e le fascine di canna contro il muro',
      soggetto: `Interior of the museum hall of fishing, as in the attached photographs. On the tiled floor, a long, flat-bottomed, narrow wooden fishing boat of the Mincio wetlands, with oars, a punting pole, landing nets and fishing nets lying in it. Above, cone-shaped fish traps made of netting stretched on hoops hang from the dark wooden ceiling beams; their netting is vermilion (the key element). Bundles of reeds lean on the white walls; tall windows look onto a green lawn. No people.`,
    },
  ],
}
