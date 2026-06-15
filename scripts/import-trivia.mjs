// ─── Convertitore: file "formato libro" → capitoli del gioco Trivia ──────────
//
// Legge i sorgenti in content/trivia/raw/*.md (formato del libro: numeri,
// opzioni "- A)/B)", "**Risposta corretta:** X", V/F con risposta "**Vero**/
// **Falso**" e completamenti col buco) e genera in content/trivia/<slug>.md i
// capitoli nello schema che il gioco legge (vedi parseTrivia.ts).
//
// Regole di questa fase (decise con l'utente, giugno 2026):
//  • Ogni capitolo emette un HEADER di contesto: argomento + autore + edificio,
//    così la UI mostra SEMPRE di cosa/chi/quale opera si parla (niente più
//    "di che materiale è la chiesa?" → "QUALE chiesa?").
//  • MULTIPLE   → importate tutte (10 per capitolo).
//  • VERO/FALSO → importate tutte (10 per capitolo): la risposta è nel raw
//                 ("**Vero**"/"**Falso**"). Per Neoclassicismo (placeholder
//                 "**Vero/Falso**") e per gli errori di trascrizione individuati
//                 verificando i fatti, la risposta corretta è in VF_FIX.
//  • COMPLETAMENTI → testo e risposta AUTOREVOLI nella tabella COMPLETIONS
//                 (5 per capitolo): il testo è reso autosufficiente (cita
//                 edificio/autore) e la risposta è verificata, non più dedotta.
//
// Eseguire:  node scripts/import-trivia.mjs
// Niente dipendenze esterne: solo Node (fs/path).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "content", "trivia", "raw");
const OUT_DIR = join(ROOT, "content", "trivia");
const REPORT_PATH = join(RAW_DIR, "_IMPORT_REPORT.md");

// ── Anagrafica capitoli ──────────────────────────────────────────────────────
// `order`  = ordine cronologico di caricamento dei .md raw (per numero domande):
//            Neoclassicismo (1) → CityLife (40). Emesso nel file e usato dal
//            loader per ordinare i capitoli nella home.
// `argomento/autore/edificio` = contesto SEMPRE mostrato sopra ogni domanda.
//            `autore`/`edificio` vuoti ("") quando non c'è un soggetto unico.
const CHAPTER_META = {
  "neoclassicismo_domande":                { order: 1,  slug: "neoclassicismo",          title: "Neoclassicismo",                          photo: "Architettura neoclassica",                  argomento: "Neoclassicismo", autore: "", edificio: "" },
  "continuazione_scala_milano":            { order: 2,  slug: "teatro-alla-scala",        title: "Teatro alla Scala di Milano",             photo: "Teatro alla Scala Milano",                  argomento: "Neoclassicismo", autore: "Giuseppe Piermarini", edificio: "Teatro alla Scala, Milano" },
  "continuazione_architettura_eclettica":  { order: 3,  slug: "eclettismo",              title: "Architettura eclettica",                  photo: "Galleria Vittorio Emanuele II Milano",      argomento: "Eclettismo", autore: "", edificio: "" },
  "padiglione_brighton_31_40":             { order: 4,  slug: "padiglione-brighton",      title: "Padiglione Reale di Brighton",            photo: "Royal Pavilion Brighton",                   argomento: "Eclettismo / Orientalismo", autore: "John Nash", edificio: "Padiglione Reale, Brighton" },
  "opera_parigi_41_50":                    { order: 5,  slug: "opera-parigi",             title: "Opéra di Parigi (Palais Garnier)",        photo: "Palais Garnier Opéra Paris",                argomento: "Eclettismo", autore: "Charles Garnier", edificio: "Opéra di Parigi (Palais Garnier)" },
  "urbanistica_ottocento_51_60":           { order: 6,  slug: "parigi-haussmann",         title: "Parigi di Haussmann",                     photo: "Boulevard Haussmann Parigi",                argomento: "Urbanistica dell'Ottocento", autore: "Georges-Eugène Haussmann", edificio: "Parigi (piano di Haussmann)" },
  "architettura_ferro_ponti_61_70":        { order: 7,  slug: "architettura-del-ferro",   title: "Architettura del ferro e ponti",          photo: "Forth Bridge Scotland",                     argomento: "Architettura del ferro", autore: "", edificio: "" },
  "continuazione_71_80":                   { order: 8,  slug: "crystal-palace",           title: "Crystal Palace",                          photo: "Crystal Palace London",                     argomento: "Architettura del ferro", autore: "Joseph Paxton", edificio: "Crystal Palace, Londra" },
  "continuazione_81_90":                   { order: 9,  slug: "torre-eiffel",             title: "Torre Eiffel",                            photo: "Torre Eiffel Parigi",                       argomento: "Architettura del ferro", autore: "Gustave Eiffel", edificio: "Torre Eiffel, Parigi" },
  "continuazione_91_100":                  { order: 10, slug: "art-nouveau-bruxelles",    title: "Art Nouveau a Bruxelles",                 photo: "Hôtel Tassel Bruxelles",                    argomento: "Art Nouveau", autore: "Victor Horta", edificio: "Casa Tassel / Casa Solvay, Bruxelles" },
  "continuazione_101_110":                 { order: 11, slug: "art-nouveau-francia",      title: "Art Nouveau in Francia",                  photo: "Métro Paris Guimard entrance",              argomento: "Art Nouveau", autore: "Hector Guimard", edificio: "Métro di Parigi / Castel Béranger" },
  "continuazione_111_120":                 { order: 12, slug: "modernismo-catalano",      title: "Modernismo catalano e Gaudí",             photo: "Park Güell Barcellona",                     argomento: "Modernismo catalano", autore: "Antoni Gaudí", edificio: "Barcellona (Palau Güell, Park Güell)" },
  "continuazione_121_130":                 { order: 13, slug: "casa-batllo",             title: "Casa Batlló",                             photo: "Casa Batlló Barcelona",                     argomento: "Modernismo catalano", autore: "Antoni Gaudí", edificio: "Casa Batlló, Barcellona" },
  "continuazione_131_140":                 { order: 14, slug: "casa-mila",               title: "Casa Milà – La Pedrera",                  photo: "Casa Milà La Pedrera",                      argomento: "Modernismo catalano", autore: "Antoni Gaudí", edificio: "Casa Milà – La Pedrera, Barcellona" },
  "sagrada_familia_141_150":               { order: 15, slug: "sagrada-familia",         title: "Sagrada Família",                         photo: "Sagrada Família Barcelona",                 argomento: "Modernismo catalano", autore: "Antoni Gaudí", edificio: "Sagrada Família, Barcellona" },
  "liberty_in_italia_151_160":             { order: 16, slug: "liberty-italia",          title: "Liberty in Italia",                       photo: "Palazzo Castiglioni Milano",                argomento: "Liberty", autore: "Giuseppe Sommaruga / Pietro Fenoglio", edificio: "Palazzo Castiglioni / Villa Fenoglio" },
  "scuola_di_chicago_grattacieli_161_170": { order: 17, slug: "scuola-di-chicago",       title: "Scuola di Chicago e grattacieli",         photo: "Reliance Building Chicago",                 argomento: "Scuola di Chicago", autore: "William Le Baron Jenney", edificio: "Grattacieli di Chicago" },
  "movimento_moderno_171_180":             { order: 18, slug: "movimento-moderno",       title: "Movimento moderno",                       photo: "Robie House Chicago",                       argomento: "Movimento moderno", autore: "Frank Lloyd Wright", edificio: "Robie House, Chicago" },
  "fabbrica_turbine_aeg_181_190":          { order: 19, slug: "fabbrica-aeg",            title: "Fabbrica di turbine AEG",                 photo: "AEG Turbine Factory Berlin",                argomento: "Movimento moderno (precursori)", autore: "Peter Behrens", edificio: "Fabbrica di turbine AEG, Berlino" },
  "stabilimento_fagus_bauhaus_191_200":    { order: 20, slug: "bauhaus",                 title: "Stabilimento Fagus e Bauhaus",            photo: "Bauhaus Dessau",                            argomento: "Movimento moderno / Bauhaus", autore: "Walter Gropius", edificio: "Stabilimento Fagus / Bauhaus di Dessau" },
  "villa_savoye_201_210":                  { order: 21, slug: "villa-savoye",            title: "Villa Savoye",                            photo: "Villa Savoye Poissy",                       argomento: "Movimento moderno / Razionalismo", autore: "Le Corbusier", edificio: "Villa Savoye, Poissy" },
  "unita_abitazione_marsiglia_211_220":    { order: 22, slug: "unite-marsiglia",        title: "Unità di abitazione di Marsiglia",        photo: "Unité d'Habitation Marseille",              argomento: "Movimento moderno", autore: "Le Corbusier", edificio: "Unité d'Habitation, Marsiglia" },
  "cappella_notre_dame_du_haut_221_230":   { order: 23, slug: "ronchamp",               title: "Cappella di Notre-Dame du Haut (Ronchamp)", photo: "Notre-Dame du Haut Ronchamp",             argomento: "Movimento moderno", autore: "Le Corbusier", edificio: "Cappella di Notre-Dame du Haut, Ronchamp" },
  "padiglione_barcellona_231_240":         { order: 24, slug: "padiglione-barcellona",   title: "Padiglione di Barcellona",                photo: "Barcelona Pavilion Mies van der Rohe",      argomento: "Movimento moderno", autore: "Ludwig Mies van der Rohe", edificio: "Padiglione di Barcellona" },
  "architetture_alvar_aalto_241_250":      { order: 25, slug: "alvar-aalto",            title: "Architetture di Alvar Aalto",             photo: "Paimio Sanatorium Aalto",                   argomento: "Architettura organica", autore: "Alvar Aalto", edificio: "Sanatorio di Paimio / Chiesa di Riola" },
  "casa_sulla_cascata_251_260":            { order: 26, slug: "fallingwater",           title: "Casa sulla cascata (Fallingwater)",       photo: "Fallingwater Frank Lloyd Wright",           argomento: "Architettura organica", autore: "Frank Lloyd Wright", edificio: "Fallingwater (Casa Kaufmann), Mill Run" },
  "solomon_r_guggenheim_museum_261_270":   { order: 27, slug: "guggenheim-ny",          title: "Solomon R. Guggenheim Museum",            photo: "Solomon R. Guggenheim Museum New York",     argomento: "Architettura organica", autore: "Frank Lloyd Wright", edificio: "Solomon R. Guggenheim Museum, New York" },
  "razionalismo_in_italia_271_280":        { order: 28, slug: "razionalismo-italia",     title: "Razionalismo in Italia",                  photo: "Palazzo della Civiltà Italiana Roma",       argomento: "Razionalismo italiano", autore: "Gruppo 7 / Giuseppe Pagano", edificio: "Casa elettrica / Palazzo della Civiltà Italiana" },
  "novocomum_casa_del_fascio_281_290":     { order: 29, slug: "terragni-como",          title: "Novocomum e Casa del Fascio",             photo: "Casa del Fascio Como Terragni",             argomento: "Razionalismo italiano", autore: "Giuseppe Terragni", edificio: "Novocomum e Casa del Fascio, Como" },
  "architettura_contemporanea_291_300":    { order: 30, slug: "architettura-contemporanea", title: "Architettura contemporanea",          photo: "Centre Pompidou Paris",                     argomento: "Architettura contemporanea", autore: "", edificio: "" },
  "centre_georges_pompidou_301_310":       { order: 31, slug: "centre-pompidou",         title: "Centre Georges Pompidou",                 photo: "Centre Georges Pompidou Paris",             argomento: "Architettura high-tech", autore: "Renzo Piano e Richard Rogers", edificio: "Centre Pompidou (Beaubourg), Parigi" },
  "nuovo_cimitero_san_cataldo_311_320":    { order: 32, slug: "san-cataldo",            title: "Cimitero di San Cataldo",                 photo: "Cimitero San Cataldo Modena Aldo Rossi",    argomento: "Architettura contemporanea", autore: "Aldo Rossi e Gianni Braghieri", edificio: "Cimitero di San Cataldo, Modena" },
  "piramide_del_louvre_321_330":           { order: 33, slug: "piramide-louvre",         title: "Piramide del Louvre",                     photo: "Louvre Pyramid Paris",                      argomento: "Architettura contemporanea", autore: "Ieoh Ming Pei", edificio: "Piramide del Louvre, Parigi" },
  "citta_delle_arti_e_delle_scienze_331_340": { order: 34, slug: "citta-arti-scienze",   title: "Città delle Arti e delle Scienze",        photo: "Ciudad de las Artes y las Ciencias Valencia", argomento: "Architettura contemporanea", autore: "Santiago Calatrava", edificio: "Città delle Arti e delle Scienze, Valencia" },
  "auditorium_parco_della_musica_341_350": { order: 35, slug: "auditorium-roma",         title: "Auditorium Parco della Musica",           photo: "Auditorium Parco della Musica Roma",        argomento: "Architettura contemporanea", autore: "Renzo Piano", edificio: "Auditorium Parco della Musica, Roma" },
  "millennium_dome_351_360":               { order: 36, slug: "millennium-dome",        title: "Millennium Dome",                         photo: "Millennium Dome O2 London",                 argomento: "Architettura high-tech", autore: "Richard Rogers", edificio: "Millennium Dome (The O2), Londra" },
  "maxxi_museo_delle_arti_del_xxi_secolo_361_370": { order: 37, slug: "maxxi",            title: "MAXXI",                                   photo: "MAXXI Museo Roma Zaha Hadid",               argomento: "Architettura contemporanea", autore: "Zaha Hadid", edificio: "MAXXI, Roma" },
  "stazione_mediopadana_e_ponti_371_380":  { order: 38, slug: "mediopadana",            title: "Stazione Mediopadana e ponti di Calatrava", photo: "Stazione Mediopadana Reggio Emilia Calatrava", argomento: "Architettura contemporanea", autore: "Santiago Calatrava", edificio: "Stazione Mediopadana, Reggio Emilia" },
  "bosco_verticale_381_390":               { order: 39, slug: "bosco-verticale",        title: "Bosco Verticale",                         photo: "Bosco Verticale Milano",                    argomento: "Architettura sostenibile", autore: "Stefano Boeri", edificio: "Bosco Verticale, Milano" },
  "quartiere_citylife_391_400":            { order: 40, slug: "citylife",               title: "Quartiere CityLife",                      photo: "CityLife Milano Tre Torri",                 argomento: "Architettura contemporanea", autore: "Hadid · Isozaki · Libeskind", edificio: "Quartiere CityLife, Milano" },
};

// ── Correzioni alle risposte Vero/Falso del raw ───────────────────────────────
// Chiave "<slug>#<numeroDomanda>" → "vero" | "falso". Due usi:
//  1) Neoclassicismo: nel raw i V/F sono placeholder "**Vero/Falso**" senza
//     risposta → qui la risposta corretta (verificata sul testo del capitolo).
//  2) Eventuali errori di trascrizione del raw individuati verificando i fatti.
// Tutto il resto delle 400 risposte è preso fedelmente dal raw (è la risposta
// "del libro" che lo studente sta studiando).
const VF_FIX = {
  // Neoclassicismo (placeholder nel raw): risposte dedotte dal testo del capitolo.
  "neoclassicismo#1": "vero",   // si sviluppa tra '700 e primi '800 → Vero
  "neoclassicismo#2": "falso",  // l'Illuminismo NON diffida del progresso → Falso
  "neoclassicismo#3": "vero",   // la ragione libera da pregiudizi → Vero
  "neoclassicismo#4": "vero",   // la scienza si basa su prove empiriche → Vero
  "neoclassicismo#5": "falso",  // la razionalità NON celebra il Medioevo → Falso
  "neoclassicismo#6": "vero",   // Grecia di Pericle = modello di perfezione → Vero
  "neoclassicismo#7": "vero",   // ritorno al classico come reazione al Barocco → Vero
  "neoclassicismo#8": "falso",  // i neoclassici NON approvano gli eccessi barocchi → Falso
  "neoclassicismo#9": "vero",   // forme semplici e razionali → Vero
  "neoclassicismo#10": "falso", // esiste corrispondenza forma-funzione → l'affermazione opposta è Falsa
};

// ── Completamenti: testo autosufficiente + risposta verificata ────────────────
// Chiave "<slug>#<numeroDomanda>" (la numerazione dei completamenti del raw).
// `q` = testo mostrato (riscritto per essere chiaro e citare l'opera/autore).
// `a` = risposta canonica · `acc` = varianti extra accettate (oltre ad `a`).
const COMPLETIONS = {
  // Neoclassicismo (1-5)
  "neoclassicismo#1":  { q: "Il Neoclassicismo si sviluppa tra la seconda metà del __________ e i primi decenni dell'Ottocento.", a: "Settecento", acc: ["1700", "XVIII secolo"] },
  "neoclassicismo#2":  { q: "L'Illuminismo è caratterizzato dalla fiducia nel progresso dell'umanità, reso possibile dalla __________.", a: "ragione", acc: ["scienza"] },
  "neoclassicismo#3":  { q: "Nel Neoclassicismo il culto della razionalità porta a disprezzare il __________ (l'età considerata oscura).", a: "Medioevo" },
  "neoclassicismo#4":  { q: "Gli scavi archeologici che alimentano il gusto neoclassico sono quelli di Ercolano, Pompei e __________.", a: "Paestum" },
  "neoclassicismo#5":  { q: "Tra i caratteri dell'architettura neoclassica vi è la riduzione degli elementi __________.", a: "decorativi", acc: ["di decorazione", "ornamentali"] },

  // Teatro alla Scala (6-10)
  "teatro-alla-scala#6":  { q: "Il Teatro alla Scala di Milano (Piermarini) è il primo edificio teatrale neoclassico costruito in __________.", a: "Europa" },
  "teatro-alla-scala#7":  { q: "Il Teatro alla Scala fu costruito tra il __________ e il 1778.", a: "1776" },
  "teatro-alla-scala#8":  { q: "Il nome del Teatro alla Scala deriva dalla Chiesa di Santa Maria alla __________.", a: "Scala" },
  "teatro-alla-scala#9":  { q: "La sala del Teatro alla Scala ha una pianta a __________ di cavallo.", a: "ferro" },
  "teatro-alla-scala#10": { q: "Alla Scala il quinto ordine di palchi era riservato ai __________ (ceto cittadino).", a: "borghesi", acc: ["borghesia"] },

  // Eclettismo (11-15)
  "eclettismo#11": { q: "Nell'architettura eclettica le rielaborazioni di forme e tipologie del passato sono indicate dal prefisso __________.", a: "neo" },
  "eclettismo#12": { q: "Il Caffè Pedrocchi, opera di Giuseppe Jappelli, si trova a __________.", a: "Padova" },
  "eclettismo#13": { q: "Il Monumento a Vittorio Emanuele II (Sacconi) è detto anche Vittoriano o Altare della __________.", a: "Patria" },
  "eclettismo#14": { q: "Il termine \"eclettico\" deriva dal verbo greco __________ (\"scegliere\").", a: "eklegein", acc: ["eklégein"] },
  "eclettismo#15": { q: "La Galleria Vittorio Emanuele II di Milano fu progettata da Giuseppe __________.", a: "Mengoni" },

  // Padiglione di Brighton (16-20)
  "padiglione-brighton#16": { q: "Il Padiglione Reale di Brighton sorse trasformando la costruzione preesistente nota come __________ Pavilion.", a: "Marine" },
  "padiglione-brighton#17": { q: "La trasformazione del Padiglione di Brighton, ad opera di John Nash, fu eseguita tra il __________ e il 1823.", a: "1815" },
  "padiglione-brighton#18": { q: "A Brighton molti elementi strutturali furono realizzati con la tecnologia della fusione di __________.", a: "ghisa" },
  "padiglione-brighton#19": { q: "Nel Padiglione di Brighton, dall'atrio si accede alla Galleria __________.", a: "Lunga" },
  "padiglione-brighton#20": { q: "La grande cucina del Padiglione di Brighton è illuminata da ben __________ finestre.", a: "12", acc: ["dodici"] },

  // Opéra di Parigi (21-25)
  "opera-parigi#21": { q: "Il Teatro dell'Opéra di Parigi (Charles Garnier) è detto anche Opéra Garnier e Palais __________.", a: "Garnier" },
  "opera-parigi#22": { q: "L'autore del progetto dell'Opéra di Parigi fu l'architetto francese Charles __________.", a: "Garnier" },
  "opera-parigi#23": { q: "L'Opéra di Parigi fu realizzata tra il 1862 e il __________.", a: "1875" },
  "opera-parigi#24": { q: "All'Opéra di Parigi il grand foyer era il luogo di incontro della società __________ (l'alta società del tempo).", a: "borghese", acc: ["aristocratica", "altolocata", "elegante"] },
  "opera-parigi#25": { q: "Il palcoscenico dell'Opéra di Parigi può ospitare fino a __________ artisti.", a: "450" },

  // Parigi di Haussmann (26-30)
  "parigi-haussmann#26": { q: "La trasformazione di Parigi voluta da Napoleone III fu realizzata a partire dal __________.", a: "1853" },
  "parigi-haussmann#27": { q: "Il prefetto della Senna incaricato del piano di Parigi era Georges-Eugène __________.", a: "Haussmann" },
  "parigi-haussmann#28": { q: "Il piano di rinnovamento di Parigi elaborato da Haussmann era noto come Grands __________.", a: "travaux" },
  "parigi-haussmann#29": { q: "Tra i nuovi spazi verdi di Parigi furono sistemati il Bois de Boulogne e il Bois de __________.", a: "Vincennes" },
  "parigi-haussmann#30": { q: "Nei palazzi privati della Parigi di Haussmann la servitù abitava nelle __________ (l'ultimo piano sottotetto).", a: "mansarde" },

  // Architettura del ferro (31-35)
  "architettura-del-ferro#31": { q: "Tra la fine del Settecento e l'inizio dell'Ottocento si affermò l'utilizzo delle strutture in __________.", a: "ferro" },
  "architettura-del-ferro#32": { q: "Nell'architettura dell'Ottocento il ferro venne spesso abbinato al __________, per realizzare coperture trasparenti.", a: "vetro" },
  "architettura-del-ferro#33": { q: "Il ponte sul fiume Severn (Pritchard), in Inghilterra, fu costruito tra il 1775 e il __________.", a: "1779" },
  "architettura-del-ferro#34": { q: "Il primo ponte interamente in acciaio fu il __________ Railway Bridge, in Scozia.", a: "Forth" },
  "architettura-del-ferro#35": { q: "Il Forth Bridge aveva una lunghezza totale di __________ metri.", a: "2467" },

  // Crystal Palace (36-40)
  "crystal-palace#36": { q: "La prima Esposizione universale fu la Great Exhibition __________ of the Works of Industry of All Nations.", a: "Great Exhibition", acc: ["of the Works of Industry of All Nations", "Great"] },
  "crystal-palace#37": { q: "Il progetto scelto per il Crystal Palace di Londra fu elaborato da __________ Paxton.", a: "Joseph" },
  "crystal-palace#38": { q: "Il Crystal Palace occupava una superficie di circa __________ m².", a: "92000", acc: ["92.000", "92 000"] },
  "crystal-palace#39": { q: "Il Crystal Palace fu costruito nel grande parco londinese di __________ Park.", a: "Hyde" },
  "crystal-palace#40": { q: "Dopo aver ospitato mostre per anni, il Crystal Palace fu distrutto da un __________.", a: "incendio" },

  // Torre Eiffel (41-45)
  "torre-eiffel#41": { q: "Nel 1889 Parigi ospitò l'Esposizione universale che celebrava il centenario della __________ francese.", a: "Rivoluzione" },
  "torre-eiffel#42": { q: "La Torre Eiffel venne commissionata nel 1887 alla Maison Eiffel et __________.", a: "Compagnie" },
  "torre-eiffel#43": { q: "Per realizzare la Torre Eiffel furono prodotti in tutto circa __________ m² di disegni.", a: "1333" },
  "torre-eiffel#44": { q: "La struttura della Torre Eiffel era costituita sostanzialmente da quattro __________ curvi.", a: "piloni", acc: ["pilastri"] },
  "torre-eiffel#45": { q: "La terza piattaforma della Torre Eiffel si trovava a __________ m di altezza.", a: "276" },

  // Art Nouveau a Bruxelles (46-50)
  "art-nouveau-bruxelles#46": { q: "In Germania l'Art Nouveau era chiamato __________.", a: "Jugendstil" },
  "art-nouveau-bruxelles#47": { q: "L'Art Nouveau si presenta per la prima volta in forma ben definita tra il 1893 e il 1902 a __________ (con Horta e van de Velde).", a: "Bruxelles" },
  "art-nouveau-bruxelles#48": { q: "Casa Tassel, a Bruxelles, fu costruita da Victor Horta nel 1893 per il professore Émile __________.", a: "Tassel" },
  "art-nouveau-bruxelles#49": { q: "Casa Solvay, a Bruxelles, fu costruita da Victor Horta per l'industriale Armand __________.", a: "Solvay" },
  "art-nouveau-bruxelles#50": { q: "La facciata esterna di Casa Solvay è larga __________ metri.", a: "15" },

  // Art Nouveau in Francia (51-55)
  "art-nouveau-francia#51": { q: "Il nome \"Art Nouveau\" deriva dal negozio parigino __________ – La Maison Bing.", a: "L'Art Nouveau", acc: ["Art Nouveau"] },
  "art-nouveau-francia#52": { q: "L'architetto Hector Guimard, autore degli ingressi del Métro di Parigi, visse dal 1867 al __________.", a: "1942" },
  "art-nouveau-francia#53": { q: "A Parigi, tra il 1900 e il 1914 vennero aperte ben __________ stazioni della metropolitana.", a: "150" },
  "art-nouveau-francia#54": { q: "Le strutture del Métro progettate da Guimard sono realizzate in __________ (verniciata a imitazione del bronzo).", a: "ghisa" },
  "art-nouveau-francia#55": { q: "Castel Béranger, a Parigi (Guimard), è un edificio residenziale di __________ appartamenti.", a: "36", acc: ["trentasei"] },

  // Modernismo catalano (56-60)
  "modernismo-catalano#56": { q: "In Spagna l'Art Nouveau prende il nome di __________.", a: "Modernismo" },
  "modernismo-catalano#57": { q: "Il piano di espansione urbana di Barcellona (l'Eixample) fu affidato all'ingegnere Ildefonso __________.", a: "Cerdà" },
  "modernismo-catalano#58": { q: "Nella previsione di Cerdà per Barcellona la città è composta da circa __________ isolati.", a: "1200" },
  "modernismo-catalano#59": { q: "Nel 1883 Gaudí incontrò il suo principale mecenate, l'industriale Eusebi __________.", a: "Güell" },
  "modernismo-catalano#60": { q: "Dal 1912 fino alla morte Gaudí si dedicò esclusivamente alla costruzione della __________.", a: "Sagrada Família", acc: ["Sagrada Familia"] },

  // Casa Batlló (61-65)
  "casa-batllo#61": { q: "Casa Batlló, a Barcellona (Gaudí), venne realizzata tra il __________ e il 1906.", a: "1904" },
  "casa-batllo#62": { q: "Casa Batlló fu commissionata da Josep Batlló, un ricco industriale del settore __________.", a: "tessile" },
  "casa-batllo#63": { q: "Nella facciata di Casa Batlló, Gaudí usò dischi di maiolica frammentata e vetri __________.", a: "istoriati" },
  "casa-batllo#64": { q: "In Casa Batlló l'appartamento della famiglia si trova al piano __________.", a: "nobile" },
  "casa-batllo#65": { q: "In Casa Batlló due scale a __________ collegano il piano nobile alla terrazza.", a: "chiocciola" },

  // Casa Milà (66-70)
  "casa-mila#66": { q: "Casa Milà, a Barcellona (Gaudí), conosciuta come __________, fu costruita tra il 1906 e il 1912.", a: "La Pedrera", acc: ["Pedrera"] },
  "casa-mila#67": { q: "Casa Milà fu costruita per i coniugi Segimon __________.", a: "Milà", acc: ["Mila"] },
  "casa-mila#68": { q: "Nel 1905 Milà acquistò, per Casa Milà, un terreno di più di __________ m².", a: "1000", acc: ["1.000"] },
  "casa-mila#69": { q: "La struttura di Casa Milà è in pietra, laterizio e __________.", a: "ferro" },
  "casa-mila#70": { q: "La pianta di Casa Milà si articola intorno a due ampi __________ centrali.", a: "cortili" },

  // Sagrada Família (71-75)
  "sagrada-familia#71": { q: "La Sagrada Família è l'opera di una vita: Antoni Gaudí cominciò a lavorarvi nel __________.", a: "1883" },
  "sagrada-familia#72": { q: "La Sagrada Família è stata dichiarata Patrimonio dell'umanità dall'Unesco nel __________.", a: "1984" },
  "sagrada-familia#73": { q: "La torre centrale della Sagrada Família, quella di Gesù Cristo, raggiungerà i __________ m di altezza.", a: "170" },
  "sagrada-familia#74": { q: "La facciata della Gloria della Sagrada Família ospiterà l'ingresso principale con la scalinata __________.", a: "monumentale" },
  "sagrada-familia#75": { q: "L'interno della Sagrada Família è descritto come una sorta di foresta in __________.", a: "pietra" },

  // Liberty in Italia (76-80)
  "liberty-italia#76": { q: "In Italia lo stile Art Nouveau prende il nome di __________.", a: "Liberty" },
  "liberty-italia#77": { q: "Palazzo Castiglioni, a Milano (Sommaruga), fu costruito tra il 1901 e il __________.", a: "1904" },
  "liberty-italia#78": { q: "Villa Fenoglio-La Fleur, a Torino (Pietro Fenoglio), fu progettata nel __________.", a: "1902" },
  "liberty-italia#79": { q: "L'edificio di Villa Fenoglio, a Torino, è di __________ piani.", a: "tre", acc: ["3"] },
  "liberty-italia#80": { q: "I balconi di Villa Fenoglio hanno ringhiere in __________ battuto.", a: "ferro" },

  // Scuola di Chicago (81-85)
  "scuola-di-chicago#81": { q: "La Scuola di Chicago operò negli ultimi decenni del __________ secolo.", a: "XIX", acc: ["19", "diciannovesimo"] },
  "scuola-di-chicago#82": { q: "Il terribile incendio del 1871 distrusse più di __________ km² del centro di Chicago.", a: "8", acc: ["otto"] },
  "scuola-di-chicago#83": { q: "Nei grattacieli della Scuola di Chicago la struttura portante era in __________.", a: "acciaio" },
  "scuola-di-chicago#84": { q: "Il First Leiter Building, a Chicago (Jenney), fu costruito nel __________.", a: "1879" },
  "scuola-di-chicago#85": { q: "L'Auditorium Building di Chicago ospitava un auditorium da __________ posti.", a: "4000", acc: ["4.000"] },

  // Movimento moderno (86-90)
  "movimento-moderno#86": { q: "Il Movimento moderno nasce alla fine della __________ guerra mondiale.", a: "Prima", acc: ["prima", "1ª"] },
  "movimento-moderno#87": { q: "Il Movimento moderno prende anche il nome di __________.", a: "Razionalismo" },
  "movimento-moderno#88": { q: "Il funzionalismo fa coincidere la forma di un edificio con la __________ che deve svolgere.", a: "funzione" },
  "movimento-moderno#89": { q: "Frank Lloyd Wright è considerato il fondatore dell'Architettura __________.", a: "organica" },
  "movimento-moderno#90": { q: "La Robie House, a Chicago (Wright), fu completata nel __________.", a: "1910" },

  // Fabbrica AEG (91-95)
  "fabbrica-aeg#91": { q: "Peter Behrens, autore della Fabbrica di turbine AEG, fu un precursore del Movimento __________.", a: "moderno" },
  "fabbrica-aeg#92": { q: "Il Deutscher Werkbund nacque a Monaco nel __________.", a: "1907" },
  "fabbrica-aeg#93": { q: "La Fabbrica di turbine AEG, a Berlino (Behrens), fu realizzata nel __________.", a: "1909" },
  "fabbrica-aeg#94": { q: "La struttura della sala principale della Fabbrica AEG era formata da __________ archi.", a: "28", acc: ["ventotto"] },
  "fabbrica-aeg#95": { q: "Il pavimento della Fabbrica AEG era costituito da blocchi di __________.", a: "legno" },

  // Bauhaus / Fagus (96-100)
  "bauhaus#96":  { q: "Walter Gropius, padre del Bauhaus, nacque a Berlino nel __________.", a: "1883" },
  "bauhaus#97":  { q: "L'officina per stampi da scarpe progettata da Gropius nel 1911 era denominata stabilimento __________.", a: "Fagus" },
  "bauhaus#98":  { q: "Lo stabilimento Fagus è stato inserito nella lista del Patrimonio Unesco nel __________.", a: "2011" },
  "bauhaus#99":  { q: "La scuola Bauhaus fu fondata da Walter Gropius a Weimar nel __________.", a: "1919" },
  "bauhaus#100": { q: "Il complesso della sede della Bauhaus a Dessau si articola in __________ blocchi.", a: "cinque", acc: ["5"] },

  // Villa Savoye (101-105)
  "villa-savoye#101": { q: "Il vero nome di Le Corbusier, autore di Villa Savoye, era Charles-Édouard __________.", a: "Jeanneret" },
  "villa-savoye#102": { q: "Villa Savoye, a Poissy (Le Corbusier), fu costruita tra il 1929 e il __________.", a: "1931" },
  "villa-savoye#103": { q: "A Villa Savoye i __________ sollevano l'edificio dal suolo.", a: "pilotis" },
  "villa-savoye#104": { q: "A Villa Savoye il tetto piano a terrazza è adibito a solarium e __________.", a: "giardino" },
  "villa-savoye#105": { q: "L'interno di Villa Savoye si articola su __________ livelli.", a: "tre", acc: ["3"] },

  // Unità di abitazione di Marsiglia (106-110)
  "unite-marsiglia#106": { q: "L'unità di misura universale ideata da Le Corbusier si chiama __________.", a: "Modulor" },
  "unite-marsiglia#107": { q: "L'Unità di abitazione di Marsiglia (Le Corbusier) fu costruita tra il 1946 e il __________.", a: "1952" },
  "unite-marsiglia#108": { q: "L'Unità di abitazione di Marsiglia comprende __________ unità abitative.", a: "337" },
  "unite-marsiglia#109": { q: "L'Unità di abitazione di Marsiglia può ospitare una popolazione compresa tra 1500 e __________ persone.", a: "1700" },
  "unite-marsiglia#110": { q: "Le cucine dell'Unità di abitazione di Marsiglia furono disegnate da Charlotte __________.", a: "Perriand" },

  // Ronchamp (111-115)
  "ronchamp#111": { q: "La Cappella di Notre-Dame du Haut, a Ronchamp (Le Corbusier), fu costruita tra il 1950 e il __________.", a: "1955" },
  "ronchamp#112": { q: "La cappella di Le Corbusier si trova nei pressi di __________, in Francia.", a: "Ronchamp" },
  "ronchamp#113": { q: "Il tetto della cappella di Ronchamp ricorda una __________ gonfiata dal vento.", a: "vela" },
  "ronchamp#114": { q: "L'aula interna della cappella di Ronchamp può contenere circa __________ persone.", a: "200" },
  "ronchamp#115": { q: "L'espansione di Notre-Dame du Haut fu progettata dal Renzo Piano Building __________.", a: "Workshop" },

  // Padiglione di Barcellona (116-120)
  "padiglione-barcellona#116": { q: "Il Padiglione di Barcellona è una delle opere principali di Ludwig Mies van der __________.", a: "Rohe" },
  "padiglione-barcellona#117": { q: "Il Padiglione di Barcellona (Mies van der Rohe) fu commissionato per l'Esposizione universale del __________.", a: "1929" },
  "padiglione-barcellona#118": { q: "Il corpo principale del Padiglione di Barcellona è posto su un basamento in __________.", a: "travertino" },
  "padiglione-barcellona#119": { q: "La copertura del Padiglione di Barcellona è sostenuta da otto sottili pilastri __________.", a: "cruciformi", acc: ["a croce"] },
  "padiglione-barcellona#120": { q: "La celebre sedia Barcellona (Mies van der Rohe) è in acciaio lucido e pelle trapuntata color __________.", a: "avorio" },

  // Alvar Aalto (121-125)
  "alvar-aalto#121": { q: "Alvar Aalto è considerato il più importante architetto __________ del XX secolo.", a: "finlandese" },
  "alvar-aalto#122": { q: "Il principio ispiratore di tutta l'opera di Alvar Aalto è la __________.", a: "natura" },
  "alvar-aalto#123": { q: "Il Sanatorio di Paimio, in Finlandia, fu progettato da Aalto nel __________.", a: "1929" },
  "alvar-aalto#124": { q: "La Chiesa di Santa Maria Assunta di Aalto sorse a Riola di Vergato, in provincia di __________.", a: "Bologna" },
  "alvar-aalto#125": { q: "La copertura della chiesa di Riola (Aalto) è rivestita con lastre di __________.", a: "rame" },

  // Fallingwater (126-130)
  "fallingwater#126": { q: "Fallingwater (Frank Lloyd Wright) è detta anche Casa __________.", a: "Kaufmann" },
  "fallingwater#127": { q: "Fallingwater si trova nei pressi di Mill Run, in __________.", a: "Pennsylvania" },
  "fallingwater#128": { q: "Fallingwater fu progettata da Wright nel __________.", a: "1936" },
  "fallingwater#129": { q: "La Casa sulla cascata (Fallingwater) si articola su __________ piani.", a: "tre", acc: ["3"] },
  "fallingwater#130": { q: "A Fallingwater il primo piano è occupato per intero dal grande __________.", a: "soggiorno" },

  // Guggenheim NY (131-135)
  "guggenheim-ny#131": { q: "Il Solomon R. Guggenheim Museum (Frank Lloyd Wright) si trova a __________.", a: "New York" },
  "guggenheim-ny#132": { q: "Wright fu incaricato del progetto del Guggenheim di New York nel __________.", a: "1943" },
  "guggenheim-ny#133": { q: "La grande rotonda del Guggenheim di New York ha la forma di un tronco di cono __________.", a: "capovolto", acc: ["rovesciato"] },
  "guggenheim-ny#134": { q: "All'interno del Guggenheim di New York la rampa continua è lunga __________ metri.", a: "430" },
  "guggenheim-ny#135": { q: "Il lucernario del Guggenheim di New York è sovrastato da una cupola con __________ vele.", a: "12", acc: ["dodici"] },

  // Razionalismo in Italia (136-140)
  "razionalismo-italia#136": { q: "In Italia la corrente influenzata dal Movimento moderno prende il nome di __________.", a: "Razionalismo" },
  "razionalismo-italia#137": { q: "L'articolo del Gruppo 7, manifesto del Razionalismo italiano, comparve nel __________.", a: "1926" },
  "razionalismo-italia#138": { q: "Il movimento razionalista italiano fondato nel 1927 si chiamava __________.", a: "MIAR" },
  "razionalismo-italia#139": { q: "La Casa elettrica del Gruppo 7 fu presentata nel __________ alla IV Triennale di Monza.", a: "1930" },
  "razionalismo-italia#140": { q: "Il Palazzo della Civiltà Italiana si trova nel quartiere EUR di __________.", a: "Roma" },

  // Terragni: Novocomum e Casa del Fascio (141-145)
  "terragni-como#141": { q: "Giuseppe Terragni è considerato uno dei più importanti rappresentanti del __________ italiano.", a: "Razionalismo" },
  "terragni-como#142": { q: "Il Novocomum, a Como (Terragni), fu costruito tra il 1928 e il __________.", a: "1929" },
  "terragni-como#143": { q: "Il corpo maggiore del Novocomum (Terragni) è affiancato da __________ corpi minori.", a: "tre", acc: ["3"] },
  "terragni-como#144": { q: "La Casa del Fascio di Como (Terragni) fu costruita tra il 1933 e il __________.", a: "1936" },
  "terragni-como#145": { q: "Lungo il perimetro del piano terra della Casa del Fascio si aprono __________ porte.", a: "16", acc: ["sedici"] },

  // Architettura contemporanea (146-150)
  "architettura-contemporanea#146": { q: "L'architettura contemporanea viene fatta iniziare dalla metà degli anni __________ del Novecento.", a: "Sessanta", acc: ["60", "'60"] },
  "architettura-contemporanea#147": { q: "Tra i software citati per la progettazione architettonica c'è __________.", a: "AutoCAD" },
  "architettura-contemporanea#148": { q: "Il libro di riferimento del Postmodernismo è \"Imparare da __________\" (Venturi).", a: "Las Vegas" },
  "architettura-contemporanea#149": { q: "Il Centre Pompidou, esempio di high-tech, fu completato nel __________.", a: "1977" },
  "architettura-contemporanea#150": { q: "Il Decostruttivismo si sviluppò negli anni '80 negli Stati Uniti e in __________.", a: "Europa" },

  // Centre Pompidou (151-155)
  "centre-pompidou#151": { q: "Il Centre Pompidou di Parigi (Piano e Rogers) è comunemente chiamato __________.", a: "Beaubourg" },
  "centre-pompidou#152": { q: "Il concorso per il progetto del Centre Pompidou fu indetto nel __________.", a: "1971" },
  "centre-pompidou#153": { q: "Al concorso per il Centre Pompidou parteciparono __________ studi di architettura.", a: "681" },
  "centre-pompidou#154": { q: "I tralicci della struttura del Centre Pompidou raggiungono i __________ metri.", a: "48" },
  "centre-pompidou#155": { q: "Per il ventennale dell'inaugurazione, il Centre Pompidou fu ampliato di oltre __________ m².", a: "8000", acc: ["8.000"] },

  // San Cataldo (156-160)
  "san-cataldo#156": { q: "Aldo Rossi e Gianni Braghieri vinsero il concorso per il Cimitero di San Cataldo nel __________.", a: "1971" },
  "san-cataldo#157": { q: "Il nuovo Cimitero di San Cataldo (Aldo Rossi) si trova a __________.", a: "Modena" },
  "san-cataldo#158": { q: "Il complesso del Cimitero di San Cataldo venne aperto nel __________.", a: "1986" },
  "san-cataldo#159": { q: "Del Cimitero di San Cataldo (Aldo Rossi) finora è stato realizzato soltanto il __________.", a: "cubo" },
  "san-cataldo#160": { q: "Nel Cimitero di San Cataldo la costruzione a cielo aperto (il cubo) è dipinta di colore __________.", a: "mattone", acc: ["rosso mattone"] },

  // Piramide del Louvre (161-165)
  "piramide-louvre#161": { q: "La Piramide del Louvre, a Parigi, è opera di Ieoh Ming __________.", a: "Pei" },
  "piramide-louvre#162": { q: "La Piramide del Louvre fu commissionata (da Mitterrand) nel __________.", a: "1983" },
  "piramide-louvre#163": { q: "La struttura principale della Piramide del Louvre raggiunge i __________ metri di altezza.", a: "22" },
  "piramide-louvre#164": { q: "La Piramide del Louvre racchiude __________ triangoli di vetro.", a: "603" },
  "piramide-louvre#165": { q: "Nell'atrio del Louvre la piramide rovesciata di Pei è alta __________ metri.", a: "7" },

  // Città delle Arti e delle Scienze (166-170)
  "citta-arti-scienze#166": { q: "La Città delle Arti e delle Scienze (Calatrava) si trova a __________.", a: "Valencia" },
  "citta-arti-scienze#167": { q: "Il progetto della Città delle Arti e delle Scienze di Valencia venne avviato nel __________.", a: "1996" },
  "citta-arti-scienze#168": { q: "Il Planetario-Emisfero della Città delle Arti e delle Scienze fu realizzato tra il 1995 e il __________.", a: "1998" },
  "citta-arti-scienze#169": { q: "Il Museo della Scienza Principe Felipe, a Valencia, è lungo oltre __________ metri.", a: "400" },
  "citta-arti-scienze#170": { q: "I lavori dell'intera Città delle Arti e delle Scienze si conclusero nel __________.", a: "2009" },

  // Auditorium Parco della Musica (171-175)
  "auditorium-roma#171": { q: "L'Auditorium Parco della Musica (Renzo Piano) si trova a __________.", a: "Roma" },
  "auditorium-roma#172": { q: "La costruzione dell'Auditorium Parco della Musica avvenne tra il 1994 e il __________.", a: "2003" },
  "auditorium-roma#173": { q: "L'Auditorium Parco della Musica si articola in __________ sale concerto autonome.", a: "tre", acc: ["3"] },
  "auditorium-roma#174": { q: "La Sala Santa Cecilia dell'Auditorium di Roma conta __________ posti.", a: "2744" },
  "auditorium-roma#175": { q: "La Sala Petrassi dell'Auditorium di Roma è intitolata al compositore __________ Petrassi.", a: "Goffredo" },

  // Millennium Dome (176-180)
  "millennium-dome#176": { q: "Il Millennium Dome di Londra (Richard Rogers) fu costruito tra il 1997 e il __________.", a: "1999" },
  "millennium-dome#177": { q: "Il Millennium Dome sorge sulla riva del __________, a Londra.", a: "Tamigi" },
  "millennium-dome#178": { q: "Il sito del Millennium Dome corrisponde al punto di passaggio del meridiano di __________.", a: "Greenwich" },
  "millennium-dome#179": { q: "La struttura del Millennium Dome ha un diametro di __________ metri.", a: "365" },
  "millennium-dome#180": { q: "Dopo la ristrutturazione, l'arena del Millennium Dome è stata ribattezzata __________.", a: "The O2", acc: ["O2"] },

  // MAXXI (181-185)
  "maxxi#181": { q: "Il concorso per il MAXXI di Roma fu bandito nel __________.", a: "1998" },
  "maxxi#182": { q: "Il MAXXI (Zaha Hadid) si trova a __________.", a: "Roma" },
  "maxxi#183": { q: "Al bando per il MAXXI aderirono __________ architetti.", a: "273" },
  "maxxi#184": { q: "Il MAXXI di Roma (Hadid) fu costruito dal 2003 al __________.", a: "2010" },
  "maxxi#185": { q: "Nel MAXXI il punto di partenza del percorso è il grande __________ a tutta altezza.", a: "atrio" },

  // Stazione Mediopadana (186-190)
  "mediopadana#186": { q: "La Stazione Mediopadana (Calatrava) si trova a __________ Emilia.", a: "Reggio" },
  "mediopadana#187": { q: "La Stazione Mediopadana di Reggio Emilia fu inaugurata nel __________.", a: "2013" },
  "mediopadana#188": { q: "L'edificio principale della Stazione Mediopadana è lungo __________ metri.", a: "500" },
  "mediopadana#189": { q: "I tre ponti progettati da Calatrava a Reggio Emilia sono detti le __________.", a: "Vele" },
  "mediopadana#190": { q: "Il ponte centrale di Calatrava a Reggio Emilia scavalca l'autostrada __________.", a: "A1" },

  // Bosco Verticale (191-195)
  "bosco-verticale#191": { q: "Il Bosco Verticale (Stefano Boeri) si trova a __________.", a: "Milano" },
  "bosco-verticale#192": { q: "Il Bosco Verticale di Milano è stato progettato tra il 2007 e il __________.", a: "2014" },
  "bosco-verticale#193": { q: "Le due torri del Bosco Verticale ospitano complessivamente __________ appartamenti.", a: "113" },
  "bosco-verticale#194": { q: "La vegetazione del Bosco Verticale è costituita da circa __________ alberi.", a: "900" },
  "bosco-verticale#195": { q: "Il Bosco Verticale ha ottenuto la certificazione __________ Gold.", a: "LEED" },

  // CityLife (196-200)
  "citylife#196": { q: "Il quartiere CityLife si trova a __________.", a: "Milano" },
  "citylife#197": { q: "Il cuore del progetto CityLife è Piazza __________.", a: "Tre Torri", acc: ["Tre"] },
  "citylife#198": { q: "A CityLife la Torre Hadid è soprannominata \"Lo __________\".", a: "Storto" },
  "citylife#199": { q: "A CityLife la Torre Isozaki è alta __________ metri.", a: "209" },
  "citylife#200": { q: "A CityLife la Torre Libeskind è soprannominata \"Il __________\".", a: "Curvo" },
};

// ── Fix encoding mojibake (UTF-8 letto come Latin-1) ──
function fixEncoding(s) {
  if (/Ã|Â|â\x82|â\x80/.test(s)) {
    try {
      const redecoded = Buffer.from(s, "latin1").toString("utf8");
      if ((redecoded.match(/Ã|Â/g) || []).length < (s.match(/Ã|Â/g) || []).length) s = redecoded;
    } catch { /* ignora */ }
  }
  const map = {
    "Ã¨": "è", "Ã©": "é", "Ã ": "à", "Ã²": "ò", "Ã¹": "ù", "Ã¬": "ì",
    "Ã­": "í", "Ã¡": "á", "Ã³": "ó", "Ãº": "ú", "Ã±": "ñ", "Ã¼": "ü",
    "Ã€": "À", "Ã‰": "É", "Ãˆ": "È",
    "Â²": "²", "Â³": "³", "Â°": "°", "Â ": " ", "Â": "",
    "â‚¬": "€", "â€™": "'", "â€˜": "'", "â€œ": "\"", "â€": "\"",
    "â€“": "–", "â€”": "—", "â€¦": "…", "â": "",
  };
  for (const [k, v] of Object.entries(map)) s = s.split(k).join(v);
  return s;
}

// ── Parsing del file sorgente in sezioni e domande ──
function parseRaw(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let section = null; // "multipla" | "vf" | "compl" | null
  const multiple = []; // { n, text, options:[{letter,text}], correct }
  const vf = [];       // { n, text, answer? }
  const compl = [];    // { n, text }
  let cur = null;
  const flushMulti = () => { if (cur) { multiple.push(cur); cur = null; } };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    const h = line.match(/^#{1,3}\s+(.*)$/);
    if (h) {
      flushMulti();
      const t = h[1].toLowerCase();
      if (t.includes("risposta multipla")) section = "multipla";
      else if (t.includes("vero")) section = "vf";
      else if (t.includes("completamento")) section = "compl";
      continue;
    }
    if (section === "multipla") {
      const mQ = line.match(/^(\d+)\.\s+(.*)$/);
      if (mQ) { flushMulti(); cur = { n: +mQ[1], text: mQ[2].trim(), options: [], correct: null }; continue; }
      const mO = line.match(/^[-*]\s*([A-D])\)\s+(.*)$/);
      if (mO && cur) { cur.options.push({ letter: mO[1], text: mO[2].trim() }); continue; }
      const mR = line.match(/\*\*Risposta corretta:\*\*\s*([A-D])/i);
      if (mR && cur) { cur.correct = mR[1].toUpperCase(); continue; }
    } else if (section === "vf") {
      const mV = line.match(/^(\d+)\.\s+(.*)$/);
      if (mV) {
        let text = mV[2].trim();
        let answer = null;
        const ans = text.match(/\*\*(Vero|Falso)\*\*\s*$/i);
        if (ans) answer = ans[1].toLowerCase();
        text = text.replace(/\*\*Vero\/Falso\*\*\s*$/i, "").replace(/\*\*(Vero|Falso)\*\*\s*$/i, "").trim();
        vf.push({ n: +mV[1], text, answer });
      }
    } else if (section === "compl") {
      const mC = line.match(/^(\d+)\.\s+(.*)$/);
      if (mC) compl.push({ n: +mC[1], text: mC[2].trim() });
    }
  }
  flushMulti();
  return { multiple, vf, compl };
}

const esc = (s) => s.replace(/\s+/g, " ").trim();

// ── Emissione di un capitolo nel formato del parser ──
function emitChapter(meta, multiple, vf, completions) {
  const out = [`# ${meta.title}`, ""];
  // Header di contesto: ereditato da TUTTE le domande del capitolo.
  out.push(`ordine: ${meta.order}`); // posizione cronologica (caricamento raw)
  out.push(`argomento: ${meta.argomento}`);
  if (meta.autore) out.push(`autore: ${meta.autore}`);
  if (meta.edificio) out.push(`edificio: ${meta.edificio}`);
  out.push("");

  const photo = meta.photo || meta.edificio || meta.title;

  // Multiple
  for (const m of multiple) {
    out.push("## Domanda", "type: multipla", esc(m.text));
    for (const o of m.options) out.push(`- [${o.letter === m.correct ? "x" : " "}] ${esc(o.text)}`);
    out.push(`foto: ${photo}`);
    out.push("");
  }

  // Vero/Falso
  for (const v of vf) {
    out.push("## Domanda", "type: vero-falso", esc(v.text));
    out.push(`risposta: ${v.answer}`);
    out.push(`foto: ${photo}`);
    out.push("");
  }

  // Completamenti
  for (const c of completions) {
    out.push("## Domanda", "type: aperta", esc(c.q));
    out.push(`risposta: ${c.a}`);
    if (c.acc && c.acc.length) out.push(`accetta: ${c.acc.join("; ")}`);
    out.push(`foto: ${photo}`);
    out.push("");
  }

  return out.join("\n").trim() + "\n";
}

// ── Main ──
function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const files = readdirSync(RAW_DIR).filter(f => f.endsWith(".md") && !f.startsWith("_"));

  const report = [];
  let totMulti = 0, totVf = 0, totCompl = 0;
  const problems = [];
  // Ordina per `order` (cronologico di caricamento), così il report è leggibile.
  const ordered = files
    .map(f => ({ f, base: f.replace(/\.md$/, ""), meta: CHAPTER_META[f.replace(/\.md$/, "")] }))
    .sort((a, b) => (a.meta?.order ?? 999) - (b.meta?.order ?? 999));

  for (const { f: file, base, meta } of ordered) {
    if (!meta) { report.push(`⚠️  ${file}: nessun mapping titolo/slug — SALTATO`); continue; }

    const rawText = fixEncoding(readFileSync(join(RAW_DIR, file), "utf8"));
    const { multiple, vf, compl } = parseRaw(rawText);

    // Multiple valide (≥2 opzioni + corretta).
    const validMulti = multiple.filter(m => m.options.length >= 2 && m.correct);
    const badMulti = multiple.filter(m => !(m.options.length >= 2 && m.correct));
    if (badMulti.length) problems.push(`${meta.slug}: ${badMulti.length} multiple scartate`);

    // V/F: risposta dal raw, sovrascritta da VF_FIX dove serve.
    const vfOut = [];
    for (const v of vf) {
      const fix = VF_FIX[`${meta.slug}#${v.n}`];
      const answer = fix || v.answer;
      if (answer !== "vero" && answer !== "falso") { problems.push(`${meta.slug}#${v.n}: V/F senza risposta`); continue; }
      vfOut.push({ text: v.text, answer });
    }

    // Completamenti: SEMPRE dalla tabella autorevole (testo + risposta verificati).
    const complOut = [];
    for (const c of compl) {
      const data = COMPLETIONS[`${meta.slug}#${c.n}`];
      if (!data) { problems.push(`${meta.slug}#${c.n}: completamento senza override`); continue; }
      complOut.push(data);
    }

    const md = emitChapter(meta, validMulti, vfOut, complOut);
    writeFileSync(join(OUT_DIR, `${meta.slug}.md`), md, "utf8");

    totMulti += validMulti.length; totVf += vfOut.length; totCompl += complOut.length;
    report.push(`${String(meta.order).padStart(2, " ")}. ${meta.title}  →  ${meta.slug}.md\n    multiple ${validMulti.length} · vero/falso ${vfOut.length} · completamenti ${complOut.length}`);
  }

  const head = [
    `# Report import Trivia`,
    ``,
    `Generato da \`scripts/import-trivia.mjs\`. Rilancia con \`node scripts/import-trivia.mjs\`.`,
    ``,
    `**Totali:** ${totMulti} multiple · ${totVf} vero/falso · ${totCompl} completamenti · **${totMulti + totVf + totCompl} domande**`,
    ``,
    `Ogni capitolo emette un header di contesto (argomento/autore/edificio) mostrato sopra ogni domanda.`,
    `V/F: risposta dal raw, corretta in \`VF_FIX\` dove serve (incl. i 10 di Neoclassicismo).`,
    `Completamenti: testo e risposta dalla tabella \`COMPLETIONS\` (autosufficienti e verificati).`,
    problems.length ? `\n⚠️  Problemi:\n${problems.map(p => `  - ${p}`).join("\n")}` : `\n✅ Nessun problema rilevato.`,
    ``,
  ].join("\n");

  writeFileSync(REPORT_PATH, head + "\n" + report.join("\n\n") + "\n", "utf8");
  console.log(head);
  console.log(`Generati ${ordered.filter(o => o.meta).length} capitoli in content/trivia/.`);
}

main();
