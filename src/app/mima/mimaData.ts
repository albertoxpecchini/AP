// ─────────────────────────────────────────────────────────────────────────────
// mimaData — unica fonte dei dati del viaggio MiMa (Milano Marittima, 13–17
// agosto 2026: Pekko, Jonny, Mok). Prima stavano duplicati dentro Mima.tsx e
// Veicoli.tsx; ora che le due pagine condividono ticker, mappa e stime
// carburante devono per forza leggere gli stessi numeri, altrimenti il totale
// scritto in cima alla pagina e quello calcolato in fondo divergono.
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

/** STIMA: prezzo del gasolio in autostrada, agosto 2026. */
export const FUEL_PRICE_DEFAULT = 1.75;

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
const MAP_QUERY = `${BOOKING.hostel}, ${BOOKING.address}`;
export const GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
export const AMAPS = `https://maps.apple.com/?q=${encodeURIComponent(MAP_QUERY)}`;
export const GSEARCH = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
