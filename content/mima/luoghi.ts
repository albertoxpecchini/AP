// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVIO — la selezione di locali di /mima/luoghi (Milano Marittima e Cervia,
// agosto 2026).
//
// Stava dentro src/app/mima/Luoghi.tsx, cancellata il 18 agosto 2026 insieme al
// resto del piano vacanza. I dati restano: servono all'album fotografico che
// prende il posto di /mima, per dare un nome ai posti in cui le foto sono state
// scattate (le coordinate dei quattro locali segnati stanno in PLACES, dentro
// content/mima/dati-viaggio.ts, sotto le stesse chiavi del campo `place`).
//
// Selezione fatta da ricerche online (recensioni, classifiche locali, sondaggi
// di zona) ad agosto 2026 — non recensioni di prima mano.
//
// Rispetto all'originale è cambiata una cosa sola: `icon`, che era un
// componente React importato da site/homeIcons, è diventato `icona`, il nome
// dell'icona come stringa. Così questo file non dipende da niente.
// ─────────────────────────────────────────────────────────────────────────────

export type Zona = "Milano Marittima" | "Cervia" | "Pinarella" | "Riccione";

export interface Luogo {
  nome: string;
  zona: Zona;
  indirizzo?: string;
  nota: string;
  /** Se presente, era la scelta consigliata della categoria. */
  top?: string;
  // ── Posti segnati da noi sulla mappa ────────────────────────────────────────
  // Questi quattro campi ci sono solo dove avevamo la scheda vera (voto,
  // recensioni, fascia di prezzo) e le coordinate: gli altri locali restano una
  // selezione da ricerche online, senza numeri inventati per pareggiare.
  voto?: number;
  recensioni?: number;
  prezzo?: string;
  /** Chiave in PLACES (content/mima/dati-viaggio.ts): dove ci sono le coordinate. */
  place?: string;
}

export interface Categoria {
  key: string;
  kicker: string;
  titolo: string;
  /** Nome dell'icona in src/app/site/homeIcons. */
  icona: string;
  intro: string;
  luoghi: Luogo[];
}

export const CATEGORIE: Categoria[] = [
  {
    key: "pesce",
    kicker: "01 — Ristoranti",
    titolo: "Ristoranti e bagni-ristorante",
    icona: "IcWaves",
    intro: "Cucina di pesce e ristorazione più curata, tra il lungomare di Milano Marittima e il Borgo Marina di Cervia — più la churrascaria brasiliana, l'unica della lista che col pesce non c'entra niente.",
    luoghi: [
      { nome: "Acqua e Sale", zona: "Milano Marittima", nota: "Tra i ristoranti più apprezzati della zona nelle classifiche online.", top: "Il più votato" },
      {
        nome: "Pousada Beijaflor",
        zona: "Milano Marittima",
        nota: "Churrascaria brasiliana in pieno centro a MiMa: carne alla brace servita al tavolo, non cucina di mare.",
        voto: 4.1,
        recensioni: 2280,
        prezzo: "10-20 €",
        place: "beijaflor",
      },
      { nome: "Mima Beach 272", zona: "Milano Marittima", nota: "Bagno-ristorante sulla spiaggia, tra i più frequentati per pranzo di pesce." },
      { nome: "Pino Beach 285", zona: "Milano Marittima", nota: "Pesce con terrazza vista mare, uno dei più citati per la cucina ittica." },
      { nome: "Zi Teresa", zona: "Milano Marittima", nota: "Storico dal 1947, cucina marinara informale — filetto di tonno e crudità di pesce." },
      { nome: "Marenita – Cucina e Cantina", zona: "Milano Marittima", nota: "Cucina e cantina, tra i nomi ricorrenti nei consigli di zona." },
      { nome: "Ristorante Capitano", zona: "Cervia", indirizzo: "Borgo Marina", nota: "Aperto tutto il giorno: colazione, aperitivo, pizza e piatti dolci e salati." },
    ],
  },
  {
    key: "aperitivo",
    kicker: "02 — Aperitivo & apericena",
    titolo: "Dove fare aperitivo",
    icona: "IcFlame",
    intro: "Buffet, cocktail e musica per l'ora dell'aperitivo, prima di uscire la sera.",
    luoghi: [
      { nome: "Ciberia Casablanca", zona: "Milano Marittima", nota: "Uno dei migliori apericena della zona: buffet ricco, barman preparati, musica commerciale.", top: "Il più consigliato" },
      { nome: "Open Space Lounge Bar", zona: "Milano Marittima", indirizzo: "Via Milano 7", nota: "Aperitivo con sushi, cocktail e musica dal vivo." },
    ],
  },
  {
    key: "piadina",
    kicker: "03 — Piadina & street food",
    titolo: "Le piadinerie",
    icona: "IcFork",
    intro: "Piadina romagnola, il classico da mangiare passeggiando sul viale.",
    luoghi: [
      { nome: "Chiosco delle Streghe", zona: "Milano Marittima", indirizzo: "Viale 2 Giugno 10", nota: "Eletta la miglior piadina di Cervia in un sondaggio di zona.", top: "Vincitrice del sondaggio locale" },
      { nome: "Alta Marea Piada Cafè", zona: "Milano Marittima", indirizzo: "Viale 2 Giugno 35", nota: "Piadine abbondanti, buon rapporto qualità-prezzo." },
      { nome: "Piadina del Mare", zona: "Milano Marittima", indirizzo: "Lungomare Grazia Deledda 11", nota: "Ripieno abbondante, ingredienti genuini." },
      { nome: "I Sapori della Piadina", zona: "Cervia", indirizzo: "Via Lesina 1", nota: "Ampia scelta di ingredienti, tra i più curati della zona." },
    ],
  },
  {
    key: "gelato",
    kicker: "04 — Gelato",
    titolo: "Le gelaterie",
    icona: "IcStore",
    intro: "Per chiudere la giornata di spiaggia con un gelato sul viale o sul lungomare.",
    luoghi: [
      { nome: "Puro & Bio", zona: "Cervia", indirizzo: "Via Nazario Sauro 136", nota: "Il gelato più votato in un sondaggio di zona.", top: "Il più votato" },
      { nome: "L'Ottocento", zona: "Milano Marittima", nota: "Gelateria storica e caratteristica, vasto menù di coppe." },
      { nome: "Crème de la crème", zona: "Milano Marittima", indirizzo: "Viale Antonio Gramsci", nota: "Gelato con latte bio delle colline romagnole." },
      { nome: "Mammacarla", zona: "Pinarella", nota: "Dal 1988: gelato e granite di frutta fresca." },
    ],
  },
  {
    key: "notturna",
    kicker: "05 — Vita notturna",
    titolo: "Discoteche e street bar",
    icona: "IcMoon",
    intro: "Il cuore della movida di Milano Marittima, tra street bar e discoteche storiche. Le tre col voto e la distanza sono quelle che ci siamo segnati sulla mappa.",
    luoghi: [
      {
        nome: "Indie Club",
        zona: "Pinarella",
        nota: "La più vicina all'ostello di tutte: ci si va e si torna a piedi, senza pensare a chi guida.",
        top: "A piedi dall'ostello",
        voto: 3.8,
        recensioni: 1231,
        prezzo: "20-30 €",
        place: "indie",
      },
      {
        nome: "King",
        zona: "Pinarella",
        nota: "Poco più su lungo la costa, ancora in zona: la fascia di prezzo più bassa fra le tre segnate.",
        voto: 3.8,
        recensioni: 230,
        prezzo: "10-20 €",
        place: "king",
      },
      {
        nome: "Cocoricò",
        zona: "Riccione",
        nota: "Il voto più alto del gruppo, ma è fuori zona: una serata lì vuol dire mettersi in auto, andata e ritorno, e chi guida non beve.",
        voto: 4.5,
        recensioni: 2387,
        prezzo: "20-70 €",
        place: "cocorico",
      },
      { nome: "Pineta", zona: "Milano Marittima", nota: "La discoteca storica di Milano Marittima, il locale più chic della riviera.", top: "La più storica", place: "pineta" },
      { nome: "Villa Papeete", zona: "Milano Marittima", nota: "Villa ottocentesca nel verde: privè, ristorante, palco live e pista centrale." },
      { nome: "Caino Fashion Club", zona: "Milano Marittima", nota: "Street bar più famoso dal 1999, a due passi dalla discoteca Pineta." },
      { nome: "Zouk Santana", zona: "Milano Marittima", nota: "Il più grande e storico street bar della zona, 14 postazioni bar." },
      { nome: "Idroscalo", zona: "Milano Marittima", nota: "Street bar per gli amanti del jazz, con un grande lampadario in Swarovski." },
    ],
  },
];
