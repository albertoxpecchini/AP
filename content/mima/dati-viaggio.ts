// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVIO — dati del viaggio MiMa (Milano Marittima, 13–17 agosto 2026:
// Pekko, Jonny, Mok).
//
// Il viaggio è finito il 17 agosto 2026 e le pagine che leggevano questo file
// (/mima, /mima/veicoli, /mima/luoghi: console di viaggio, conto alla rovescia,
// meteo, lista alcolici condivisa, confronto veicoli) sono state cancellate il
// 18 agosto 2026. Restano i DATI, perché al posto del piano vacanza va un
// album fotografico con mappa: le foto verranno posizionate e messe in ordine
// cronologico leggendo i loro metadati EXIF (GPS + DateTimeOriginal), e i punti
// qui sotto — ostello, spiaggia, locali, tracciato del viaggio — servono da
// riferimento per la mappa e da etichetta per gli scatti che ci cadono vicino.
//
// Nessun modulo dell'app importa più questo file: sta in content/ come fonte,
// non in src/. Il codice delle vecchie pagine è nella storia di git (ultimo
// commit che le conteneva: quello prima della cancellazione).
//
// Vedi anche: content/mima/luoghi.ts — la selezione di ristoranti, piadinerie,
// gelaterie e locali notturni che stava dentro /mima/luoghi.
//
// ── Regola d'onestà ──────────────────────────────────────────────────────────
// Ogni valore qui dentro è di uno di questi tipi, e l'interfaccia lo dichiara:
//   CERTO      — dalla mail di conferma o dalla prenotazione (BOOKING, INFO)
//   CALCOLATO  — derivato dagli altri (split spese, punteggi, distanze, litri)
//   STIMA      — ipotesi dichiarata, marcata in pagina con .sb-mima-tbd
// Niente numeri inventati che si spacciano per certi.
// ─────────────────────────────────────────────────────────────────────────────

export const TRIP_START = new Date("2026-08-13T00:00:00+02:00");
export const TRIP_END = new Date("2026-08-17T00:00:00+02:00");

// Le stesse date come stringhe, e non ricavate dalle Date qui sopra: un
// `toISOString().slice(0,10)` le riporterebbe in UTC e, essendo mezzanotte a
// +02:00, tornerebbe indietro di un giorno (12 agosto invece del 13). Servono
// a open-meteo, che vuole giorni di calendario, non istanti.
export const TRIP_FIRST_DAY = "2026-08-13";
export const TRIP_LAST_DAY = "2026-08-17";

export const PEOPLE = ["Pekko", "Jonny", "Mok"];

// ── CERTO: prenotazione Hostelworld ──────────────────────────────────────────
export const BOOKING = {
  hostel: "Meet Hostel Cervia",
  address: "Viale Italia 310, Cervia, Italia",
  room: "Basic 3 letti · privata, bagno in camera — 1 camera",
  nights: 4,
  guests: 3,
  freeCancellation: "11 agosto 2026",
  pricePerNight: 142.32,
  nightsTotal: 569.28,
  taxes: 12.0,
  total: 569.28,
  paidNow: 85.39,
  payAtProperty: 495.89,
};

// ── CERTO: info pratiche dalla mail di conferma della reception ──────────────
export interface InfoRow { label: string; text: string }
export const INFO: InfoRow[] = [
  { label: "Acconto e saldo", text: "L'acconto è gestito da Hostelworld — la struttura può verificare che sia stato effettuato. Il saldo si paga in loco, in contanti o con carta." },
  { label: "Parcheggio", text: "Circa 40 posti auto, gratuiti fino a esaurimento e non prenotabili." },
  { label: "Colazione", text: "Non inclusa: 3 € a persona al giorno. Colazione semplice, solo dolce." },
  { label: "Reception", text: "Aperta fino alle 22:00. Dopo quell'orario c'è il guardiano notturno, disponibile per i rientri tardivi." },
  { label: "Chiavi", text: "Se ne possono avere due, ma vanno sempre lasciate in reception. In caso di smarrimento: 10 €." },
];

// ── STIMA: colazione facoltativa, 3 € a testa al giorno per 4 giorni ─────────
export const BREAKFAST_PER_PERSON_DAY = 3;
export const BREAKFAST_TOTAL = BREAKFAST_PER_PERSON_DAY * PEOPLE.length * BOOKING.nights;

// ─────────────────────────────────────────────────────────────────────────────
// Geografia. Coordinate in [lon, lat] perché è l'ordine che vuole MapLibre.
// Ostello, spiaggia e Indie Club sono punti RILEVATI (mandati da Pekko dalla
// mappa), non stime: niente marcatore "posizione approssimata" su quelli.
// Cervia centro e Milano Marittima restano il centro nominale del paese.
//
// Nota: la prima versione di questo file metteva l'ostello a 44.254, 12.351 —
// tre chilometri più a nord del vero. Da lì veniva la frase "Milano Marittima
// a un passo": in realtà sono ~5 km, e si fanno in auto.
// ─────────────────────────────────────────────────────────────────────────────
export interface Place {
  key: string;
  name: string;
  role: string;
  lon: number;
  lat: number;
  approx?: boolean;
  /** Solo per i locali: scheda da mappa. */
  rating?: number;
  reviews?: number;
  price?: string;
  kind?: string;
}

export const PLACES: Record<string, Place> = {
  rivalta: { key: "rivalta", name: "Rivalta sul Mincio", role: "Partenza", lon: 10.6764, lat: 45.1897 },
  hostel: { key: "hostel", name: "Meet Hostel Cervia", role: "Alloggio", lon: 12.375560185600417, lat: 44.23236610163408 },
  mare: { key: "mare", name: "Spiaggia", role: "Mare", lon: 12.378030630862366, lat: 44.23297202897218 },
  indie: {
    key: "indie",
    name: "Indie Club",
    role: "Discoteca",
    lon: 12.370273861096353,
    lat: 44.22673814520583,
    rating: 3.8,
    reviews: 1231,
    price: "20-30 €",
    kind: "Discoteca",
  },
  king: {
    key: "king",
    name: "King",
    role: "Discoteca",
    lon: 12.360395599639139,
    lat: 44.23982823911774,
    rating: 3.8,
    reviews: 230,
    price: "10-20 €",
    kind: "Discoteca",
  },
  beijaflor: {
    key: "beijaflor",
    name: "Pousada Beijaflor",
    role: "Ristorante",
    lon: 12.348606911714686,
    lat: 44.27540408679956,
    rating: 4.1,
    reviews: 2280,
    price: "10-20 €",
    kind: "Ristorante brasiliano",
  },
  cocorico: {
    key: "cocorico",
    name: "Cocoricò",
    role: "Discoteca",
    lon: 12.65674024858653,
    lat: 43.98739720875558,
    rating: 4.5,
    reviews: 2387,
    price: "20-70 €",
    kind: "Discoteca",
  },
  cervia: { key: "cervia", name: "Cervia centro", role: "Centro", lon: 12.3547, lat: 44.2603 },
  mima: { key: "mima", name: "Milano Marittima", role: "La vacanza", lon: 12.348254184857065, lat: 44.277396039270975 },

  // ── Due posti aggiunti dopo, sull'evidenza delle foto ──────────────────────
  // Questi due non arrivano da una scheda di mappa come i locali qui sopra: il
  // punto è la posizione GPS di uno scatto fatto sul posto, cioè dove si era
  // davvero. È una coordinata più onesta di un centroide cercato a tavolino —
  // dice dove stava chi teneva il telefono, che è esattamente la domanda a cui
  // l'etichetta di un album deve rispondere.
  //
  // Senza queste due voci le foto della notte del 15 finivano sotto il
  // Beijaflor, che è il posto noto più vicino ma sta novanta metri più in là, e
  // quelle del tardo pomeriggio restavano senza nome perché non cadevano nel
  // raggio di nessuno.
  pineta: {
    key: "pineta",
    name: "Pineta",
    role: "Discoteca",
    lon: 12.348730555555557,
    lat: 44.27621388888889,
    kind: "Discoteca",
  },
  centrale: {
    key: "centrale",
    name: "Hotel Centrale",
    role: "Alloggio",
    lon: 12.351075,
    lat: 44.28290833333333,
  },
};

// I punti della mappa panoramica, da sud a nord. Il Cocoricò NON c'è: sta a
// Riccione, ~35 km in linea d'aria, e tenerlo dentro l'inquadratura
// schiaccerebbe ostello, spiaggia e Indie Club — che stanno in ottocento metri
// — in un unico puntino. Lo si trova nel modulo dei locali, con la sua
// distanza.
export const TRIP_PLACES: Place[] = [
  PLACES.hostel, PLACES.mare, PLACES.indie, PLACES.king,
  PLACES.cervia, PLACES.mima, PLACES.beijaflor,
];

/** Locali con la scheda presa dalla mappa: voto, recensioni, fascia di prezzo. */
export const VENUES: Place[] = [PLACES.indie, PLACES.king, PLACES.cocorico, PLACES.beijaflor];

/** Oltre questa distanza dall'ostello un locale è "una serata in auto". */
export const FAR_KM = 10;

// Centro e zoom della mappa panoramica: deve tenere dentro l'Indie Club a sud
// (44.227) e Milano Marittima a nord (44.276), quindi è sceso più in basso e
// si è allargato rispetto a prima.
export const MIMA_CENTER: [number, number] = [12.363, 44.252];
export const MIMA_ZOOM = 12.4;

// Tracciato SCHEMATICO del viaggio (A22 → A1 → A14), non una rotta calcolata:
// serve a far vedere la direzione sulla mappa, non a navigare.
export const ROUTE: [number, number][] = [
  [10.6764, 45.1897], // Rivalta sul Mincio
  [10.7914, 45.1564], // Mantova
  [10.9252, 44.6471], // Modena
  [11.3426, 44.4949], // Bologna
  [11.7137, 44.3531], // Imola
  [11.883, 44.2856], // Faenza
  [12.0407, 44.2227], // Forlì
  [12.2431, 44.1391], // Cesena
  [12.3547, 44.2603], // Cervia
  [12.375560185600417, 44.23236610163408], // Meet Hostel, a sud verso Pinarella
];

/** Distanza in linea d'aria fra due punti, in km (formula dell'emisenoverso). */
export function haversineKm(a: Place, b: Place): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ── STIMA: percorso su strada ────────────────────────────────────────────────
// Attenzione: la versione precedente della pagina dichiarava "~150 km a tratta".
// È impossibile — la sola distanza in linea d'aria fra Rivalta sul Mincio e
// Cervia è ~168 km (la calcola haversineKm qui sopra), e su strada si passa da
// Mantova, Modena, Bologna e la A14. La stima realistica è ~230 km / ~2h35.
// Tutte le stime carburante della pagina partono da qui, quindi correggere qui
// corregge anche il simulatore e le card veicolo.
export const ROAD_KM_ONE_WAY = 230;
export const ROAD_MIN_ONE_WAY = 155;
export const ROUND_TRIP_KM = ROAD_KM_ONE_WAY * 2;

// ─────────────────────────────────────────────────────────────────────────────
// Distributori entro 10 km da Rivalta sul Mincio, rilevati il 5 agosto 2026.
// Prezzi REALI (dall'Osservaprezzi), non stime: per questo la data dell'ultima
// comunicazione sta accanto a ognuno — un prezzo di tre giorni fa è un prezzo
// di tre giorni fa, e ad agosto si muove.
//
// La stima precedente diceva 1,75 €/L. Era bassa di quasi il 17%: il gasolio
// self qui intorno sta fra 2,049 e 2,159, e su un pieno andata-ritorno fa una
// decina di euro di differenza.
// ─────────────────────────────────────────────────────────────────────────────
// Due insiemi, non uno: i distributori entro 10 km da casa (Rivalta sul
// Mincio) e quelli in zona vacanza (Cervia / Cesenatico). Serve tenerli
// separati perché il pieno di andata e quello di ritorno si fanno in posti
// diversi — e, a sorpresa, giù costa meno.
//
// GPL, metano, HVO e i gasoli "premium" non sono qui: nessuno dei tre mezzi in
// ballo li usa, e in tabella sarebbero solo rumore.
export type Zone = "casa" | "vacanza";

export interface Station {
  name: string;
  zone: Zone;
  /** Ultima comunicazione rilevata (Osservaprezzi). */
  updated: string;
  benzinaSelf: number;
  gasolioSelf: number;
  /** Solo dove il servito è dichiarato e costa più del self. */
  benzinaServito?: number;
  gasolioServito?: number;
}

export const STATIONS: Station[] = [
  // ── Entro 10 km da Rivalta sul Mincio ──────────────────────────────────────
  { name: "1290", zone: "casa", updated: "03/08 12:23", benzinaSelf: 1.969, gasolioSelf: 2.049 },
  { name: "AGEF Immobiliare", zone: "casa", updated: "03/08 09:54", benzinaSelf: 1.979, gasolioSelf: 2.049 },
  { name: "Il Gigante Self 24H", zone: "casa", updated: "03/08 17:22", benzinaSelf: 1.975, gasolioSelf: 2.055 },
  { name: "Ranzato Antonio", zone: "casa", updated: "05/08 07:24", benzinaSelf: 2.005, gasolioSelf: 2.074, benzinaServito: 2.215, gasolioServito: 2.284 },
  { name: "Tamoil", zone: "casa", updated: "05/08 07:10", benzinaSelf: 1.999, gasolioSelf: 2.079 },
  { name: "6912", zone: "casa", updated: "03/08 13:38", benzinaSelf: 1.999, gasolioSelf: 2.079 },
  { name: "AGIP Ercoli Gilberto", zone: "casa", updated: "05/08 07:42", benzinaSelf: 2.005, gasolioSelf: 2.079, benzinaServito: 2.215, gasolioServito: 2.289 },
  { name: "2074 Goito", zone: "casa", updated: "04/08 21:51", benzinaSelf: 2.009, gasolioSelf: 2.079, benzinaServito: 2.229, gasolioServito: 2.299 },
  { name: "Costantin Castellucchio", zone: "casa", updated: "03/08 07:25", benzinaSelf: 1.987, gasolioSelf: 2.087 },
  { name: "Keropetrol Gazoldo d. Ippoliti", zone: "casa", updated: "02/08 06:27", benzinaSelf: 1.969, gasolioSelf: 2.089 },
  { name: "Distributore Tamoil", zone: "casa", updated: "03/08 08:13", benzinaSelf: 1.999, gasolioSelf: 2.099 },
  { name: "Goito - Marsiletti", zone: "casa", updated: "05/08 09:04", benzinaSelf: 2.019, gasolioSelf: 2.099 },
  { name: "Italia Global (Hussain Sajjad)", zone: "casa", updated: "04/08 17:50", benzinaSelf: 2.039, gasolioSelf: 2.159, benzinaServito: 2.289, gasolioServito: 2.429 },

  // ── Zona vacanza: Cervia e Cesenatico ──────────────────────────────────────
  { name: "Savio Enilive Station", zone: "vacanza", updated: "05/08 07:28", benzinaSelf: 1.964, gasolioSelf: 2.019 },
  { name: "Cesenatico CPB Energia Italiana", zone: "vacanza", updated: "04/08 06:54", benzinaSelf: 1.964, gasolioSelf: 2.019 },
  { name: "PV 5908 Cesenatico", zone: "vacanza", updated: "04/08 21:55", benzinaSelf: 1.969, gasolioSelf: 2.024 },
  { name: "Eni di Paganelli Nerio", zone: "vacanza", updated: "04/08 21:54", benzinaSelf: 1.969, gasolioSelf: 2.024 },
  { name: "Cervia SS16 km 170+616 (Madonna del Pino)", zone: "vacanza", updated: "05/08 01:39", benzinaSelf: 1.949, gasolioSelf: 2.029 },
  { name: "Cervia SS16 km 172+211", zone: "vacanza", updated: "05/08 09:13", benzinaSelf: 1.989, gasolioSelf: 2.059 },
  { name: "IP", zone: "vacanza", updated: "03/08 18:56", benzinaSelf: 1.947, gasolioSelf: 2.075 },
  { name: "EGO Cervia — Viale Oriani", zone: "vacanza", updated: "04/08 09:52", benzinaSelf: 1.968, gasolioSelf: 2.078 },
  { name: "GEP Celli Giuliano", zone: "vacanza", updated: "05/08 07:31", benzinaSelf: 1.959, gasolioSelf: 2.079, benzinaServito: 2.189, gasolioServito: 2.309 },
  { name: "Agip Eni Galbucci", zone: "vacanza", updated: "04/08 16:22", benzinaSelf: 1.989, gasolioSelf: 2.079, benzinaServito: 2.209, gasolioServito: 2.299 },
  { name: "Paganelli Marcello", zone: "vacanza", updated: "05/08 09:26", benzinaSelf: 1.969, gasolioSelf: 2.089 },
  { name: "Retitalia Cesenatico", zone: "vacanza", updated: "04/08 10:22", benzinaSelf: 1.959, gasolioSelf: 2.095 },
  { name: "Paganelli Maria Grazia", zone: "vacanza", updated: "04/08 17:16", benzinaSelf: 1.967, gasolioSelf: 2.097 },
  { name: "Calabrina", zone: "vacanza", updated: "05/08 09:00", benzinaSelf: 1.989, gasolioSelf: 2.099 },
  { name: "Shell Cervia — Via Romea Sud 9", zone: "vacanza", updated: "05/08 07:39", benzinaSelf: 1.999, gasolioSelf: 2.099 },
  { name: "IP Cervia", zone: "vacanza", updated: "04/08 09:07", benzinaSelf: 2.019, gasolioSelf: 2.099, benzinaServito: 2.199, gasolioServito: 2.279 },
  { name: "7082", zone: "vacanza", updated: "03/08 12:22", benzinaSelf: 1.999, gasolioSelf: 2.099 },
  { name: "Vulcan Tantlon", zone: "vacanza", updated: "31/07 10:40", benzinaSelf: 1.999, gasolioSelf: 2.099, benzinaServito: 2.189, gasolioServito: 2.289 },
  { name: "Casalboni Luca", zone: "vacanza", updated: "02/08 12:28", benzinaSelf: 1.989, gasolioSelf: 2.109 },
  { name: "ERG", zone: "vacanza", updated: "04/08 17:19", benzinaSelf: 2.019, gasolioSelf: 2.119, benzinaServito: 2.219, gasolioServito: 2.339 },
  { name: "Autolavaggio Bargellini Elio", zone: "vacanza", updated: "05/08 07:23", benzinaSelf: 2.019, gasolioSelf: 2.119, benzinaServito: 2.319, gasolioServito: 2.419 },
  { name: "106736 Cesenatico", zone: "vacanza", updated: "05/08 07:14", benzinaSelf: 1.999, gasolioSelf: 2.129 },
  { name: "Alessi Luciano", zone: "vacanza", updated: "05/08 06:12", benzinaSelf: 1.999, gasolioSelf: 2.139, benzinaServito: 2.199, gasolioServito: 2.339 },
  { name: "Esso Malp Bollana", zone: "vacanza", updated: "31/07 18:04", benzinaSelf: 1.999, gasolioSelf: 2.139, benzinaServito: 2.239, gasolioServito: 2.379 },
  { name: "Esso Tipiko", zone: "vacanza", updated: "31/07 18:03", benzinaSelf: 1.999, gasolioSelf: 2.139, benzinaServito: 2.239, gasolioServito: 2.379 },
];

export const stationsIn = (zone: Zone) =>
  STATIONS.filter((s) => s.zone === zone).sort((a, b) => a.gasolioSelf - b.gasolioSelf);

const dieselIn = (zone: Zone) => STATIONS.filter((s) => s.zone === zone).map((s) => s.gasolioSelf);
const petrolIn = (zone: Zone) => STATIONS.filter((s) => s.zone === zone).map((s) => s.benzinaSelf);

/** CALCOLATO: il gasolio self più basso e più alto, per zona. */
export const DIESEL_MIN_CASA = Math.min(...dieselIn("casa"));
export const DIESEL_MAX_CASA = Math.max(...dieselIn("casa"));
export const DIESEL_MIN_VAC = Math.min(...dieselIn("vacanza"));
export const DIESEL_MAX_VAC = Math.max(...dieselIn("vacanza"));
export const PETROL_MIN_CASA = Math.min(...petrolIn("casa"));
export const PETROL_MIN_VAC = Math.min(...petrolIn("vacanza"));

export const CHEAPEST_CASA = stationsIn("casa")[0];
export const CHEAPEST_VAC = stationsIn("vacanza")[0];

// Il simulatore parte dal gasolio self più basso VICINO A CASA: è il pieno con
// cui si parte davvero. Che giù costi ancora meno è un'informazione a sé, e la
// pagina la dice invece di nasconderla dentro una media.
export const FUEL_PRICE_DEFAULT = DIESEL_MIN_CASA;

/** Quanto si risparmia a fare il pieno giù invece che qui, per litro. */
export const DIESEL_GAP = DIESEL_MIN_CASA - DIESEL_MIN_VAC;

// ─────────────────────────────────────────────────────────────────────────────
// Veicoli. Consumi, emissioni e misure sono STIME su modello e allestimento più
// comuni: non sostituiscono la carta di circolazione. Servono a confrontare le
// opzioni fra loro, e per quello l'ordine di grandezza basta.
// ─────────────────────────────────────────────────────────────────────────────
export type VehicleKey = "gla" | "tucson" | "transit";

export interface Vehicle {
  key: VehicleKey;
  short: string;
  name: string;
  trim: string;
  fuel: string;
  gearbox: string;
  seats: number;
  boot: string;
  /** metri */
  length: number;
  width: number;
  height: number;
  /** L/100 km, intervallo */
  lPer100: [number, number];
  /** g CO₂/km, intervallo */
  co2: [number, number];
  /** litri di serbatoio */
  tank: number;
}

export const VEHICLES: Record<VehicleKey, Vehicle> = {
  gla: {
    key: "gla",
    short: "GLA",
    name: "Mercedes-Benz GLA",
    trim: "2021 (H247)",
    fuel: "non specificato",
    gearbox: "non specificato",
    seats: 5,
    boot: "435 L",
    length: 4.41,
    width: 1.83,
    height: 1.61,
    lPer100: [6.0, 7.0],
    co2: [150, 165],
    tank: 51,
  },
  tucson: {
    key: "tucson",
    short: "Tucson",
    name: "Hyundai Tucson",
    trim: "1.6 CRDI 48V DCT Excellence",
    fuel: "Diesel mild-hybrid 48V",
    gearbox: "DCT 7 rapporti",
    seats: 5,
    boot: "546 L",
    length: 4.5,
    width: 1.865,
    height: 1.65,
    lPer100: [5.3, 5.7],
    co2: [139, 149],
    tank: 54,
  },
  transit: {
    key: "transit",
    short: "Transit",
    name: "Ford Transit Custom",
    trim: "270 2.0 TDCi PC Furgone Trend",
    fuel: "Diesel",
    gearbox: "Manuale 6 rapporti",
    seats: 3,
    boot: "~6 m³",
    length: 4.97,
    width: 1.986,
    height: 1.97,
    lPer100: [7.5, 8.5],
    co2: [195, 215],
    tank: 70,
  },
};

/** Le quattro opzioni sul tavolo, ognuna con i veicoli che metterebbe in strada. */
export const OPTION_VEHICLES: Record<string, VehicleKey[]> = {
  a: ["gla", "tucson"],
  b: ["gla"],
  c: ["tucson"],
  d: ["transit"],
};

const avg = (r: [number, number]) => (r[0] + r[1]) / 2;

/** Autonomia stimata con un pieno: serbatoio ÷ consumo medio. CALCOLATO. */
export function rangeKm(v: Vehicle): number {
  return Math.round((v.tank / avg(v.lPer100)) * 100);
}

export interface TripEstimate {
  liters: number;
  cost: number;
  perPerson: number;
  co2kg: number;
}

/** CALCOLATO: litri, costo, costo a testa e CO₂ di un'opzione su `km`. */
export function estimateOption(optionKey: string, km: number, pricePerLiter: number): TripEstimate {
  const keys = OPTION_VEHICLES[optionKey] ?? [];
  let liters = 0;
  let co2g = 0;
  for (const k of keys) {
    const v = VEHICLES[k];
    liters += (km / 100) * avg(v.lPer100);
    co2g += km * avg(v.co2);
  }
  const cost = liters * pricePerLiter;
  return {
    liters,
    cost,
    perPerson: PEOPLE.length ? cost / PEOPLE.length : 0,
    co2kg: co2g / 1000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Spese del gruppo — un rigo per voce. Vuoto finché non arrivano i numeri veri:
// il riepilogo (totale, quota a testa, chi deve dare e chi avere) si calcola da
// solo appena l'array si riempie.
// ─────────────────────────────────────────────────────────────────────────────
export interface Expense { person: string; item: string; amount: number }
export const EXPENSES: Expense[] = [];

// Album ricordo — metti i file in /public/images/mima/ e aggiungi la riga qui
// sotto: { src: "/images/mima/nome-file.jpg", alt: "..." }.
export interface Photo { src: string; alt: string }
export const PHOTOS: Photo[] = [];

export function euro(n: number) {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function num(n: number, decimals = 0) {
  return n.toLocaleString("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Da minuti a "2h35". */
export function hhmm(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** CALCOLATO: quanto ha anticipato ognuno e quanto deve dare o avere. */
export function splitExpenses(expenses: Expense[], people: string[]) {
  const totalsByPerson = new Map(people.map((p) => [p, 0]));
  let grandTotal = 0;
  for (const e of expenses) {
    totalsByPerson.set(e.person, (totalsByPerson.get(e.person) ?? 0) + e.amount);
    grandTotal += e.amount;
  }
  const share = people.length ? grandTotal / people.length : 0;
  return {
    grandTotal,
    share,
    rows: people.map((p) => {
      const paid = totalsByPerson.get(p) ?? 0;
      return { person: p, paid, balance: paid - share };
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Programma: 5 giorni × 4 fasce. `tbd: true` = proposta da confermare insieme,
// e in pagina si porta dietro l'etichetta "da verificare".
// ─────────────────────────────────────────────────────────────────────────────
export interface Slot { text: string; tbd?: boolean }
export interface Day {
  date: string;
  weekday: string;
  label: string;
  slots: [Slot, Slot, Slot, Slot];
}

export const SLOT_NAMES = ["Mattina", "Pomeriggio", "Sera", "Notte"] as const;

export const DAYS: Day[] = [
  {
    date: "13 ago",
    weekday: "Giovedì",
    label: "Arrivo",
    slots: [
      { text: "Partenza da Rivalta sul Mincio", tbd: true },
      { text: "Check-in al Meet Hostel Cervia" },
      { text: "Primo giro a Cervia, cena leggera", tbd: true },
      { text: "Street bar sul viale a MiMa", tbd: true },
    ],
  },
  {
    date: "14 ago",
    weekday: "Venerdì",
    label: "Primo giorno pieno",
    slots: [
      { text: "Spiaggia", tbd: true },
      { text: "Spiaggia o pineta di MiMa", tbd: true },
      { text: "Aperitivo a Milano Marittima", tbd: true },
      { text: "Vigilia di Ferragosto in centro", tbd: true },
    ],
  },
  {
    date: "15 ago",
    weekday: "Sabato",
    label: "Ferragosto",
    slots: [
      { text: "Spiaggia presto, prima della folla", tbd: true },
      { text: "Bagno e relax", tbd: true },
      { text: "Cena di Ferragosto", tbd: true },
      { text: "La serata clou — da decidere insieme", tbd: true },
    ],
  },
  {
    date: "16 ago",
    weekday: "Domenica",
    label: "Ultimo giorno pieno",
    slots: [
      { text: "Spiaggia", tbd: true },
      { text: "Salina di Cervia o centro storico", tbd: true },
      { text: "Piadina sul viale", tbd: true },
      { text: "Ultima uscita", tbd: true },
    ],
  },
  {
    date: "17 ago",
    weekday: "Lunedì",
    label: "Partenza",
    slots: [
      { text: "Colazione, valigie e check-out" },
      { text: "Rientro a Rivalta sul Mincio", tbd: true },
      { text: "—" },
      { text: "—" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Numeri utili. I nazionali sono certi; quelli locali NO — vanno cercati prima
// di partire, e la pagina lo dice.
// ─────────────────────────────────────────────────────────────────────────────
export interface UsefulNumber { label: string; value: string; note: string; tbd?: boolean }
export const NUMBERS: UsefulNumber[] = [
  { label: "Emergenze", value: "112", note: "Numero unico europeo" },
  { label: "Emergenza sanitaria", value: "118", note: "Ambulanza" },
  { label: "Vigili del fuoco", value: "115", note: "Incendi e soccorso tecnico" },
  { label: "Emergenza in mare", value: "1530", note: "Guardia Costiera" },
  { label: "Meet Hostel Cervia", value: "da cercare", note: "Sta nella conferma Hostelworld", tbd: true },
  { label: "Guardia medica turistica", value: "da cercare", note: "Attiva a Cervia in alta stagione", tbd: true },
  { label: "Farmacia di turno", value: "da cercare", note: "Cambia ogni settimana", tbd: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Valigia. Lista di partenza: si spunta in pagina e lo stato resta nel browser
// di chi la spunta (localStorage, non è condivisa fra noi tre).
// ─────────────────────────────────────────────────────────────────────────────
export interface PackGroup { key: string; title: string; items: string[] }
export const PACKING: PackGroup[] = [
  {
    key: "documenti",
    title: "Documenti e soldi",
    items: [
      "Carta d'identità",
      "Tessera sanitaria",
      "Patente (chi guida)",
      "Conferma Hostelworld",
      "Contanti o carta per il saldo",
    ],
  },
  {
    key: "spiaggia",
    title: "Spiaggia",
    items: ["Costume (×2)", "Telo mare", "Crema solare", "Occhiali da sole", "Ciabatte", "Cappello"],
  },
  {
    key: "sera",
    title: "Sera e notte",
    items: ["Cambio per uscire", "Felpa leggera", "Scarpe comode", "Powerbank", "Caricabatterie"],
  },
  {
    key: "farmacia",
    title: "Farmacia",
    items: ["Doposole", "Cerotti", "Antidolorifico", "Repellente zanzare", "Salviette"],
  },
];

const PACK_KEY = "mima:valigia";

export function loadPacked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PACK_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function savePacked(state: Record<string, boolean>) {
  try {
    localStorage.setItem(PACK_KEY, JSON.stringify(state));
  } catch {
    /* storage non disponibile: si spunta lo stesso, non si ricorda */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Link esterni. Costruiti da MAP_QUERY così restano coerenti con l'indirizzo.
// ─────────────────────────────────────────────────────────────────────────────
/** Il gruppo WhatsApp del viaggio: è lì che si decide davvero. */
export const WHATSAPP = "https://chat.whatsapp.com/IfEXiXbj0iP1kdpQvu1O2C";
export const WHATSAPP_NAME = "MilanoMarittima (JMA)";

const MAP_QUERY = `${BOOKING.hostel}, ${BOOKING.address}`;
export const GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
export const AMAPS = `https://maps.apple.com/?q=${encodeURIComponent(MAP_QUERY)}`;
export const GSEARCH = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
