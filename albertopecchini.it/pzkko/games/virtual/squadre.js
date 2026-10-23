// Le squadre di «Virtual», il campionato inventato di pzkko.it: tutte quelle di Serie A e Serie B 2026/27 coi nomi
// storpiati ma riconoscibili (stile videogioco senza licenza), la sigla, la città, i colori della maglia di casa e di
// trasferta (che si vedono addosso agli omini del campo), uno stemma originale disegnato qui in SVG (gli stessi colori
// sociali e lo stesso «spirito» del vero: una zebra, un biscione, un giglio; mai il logo vero) e una forza da 1 a 100
// presa dalla realtà. La forza decide SOLO le quote (partita.js): i risultati no.
//
// Niente nomi veri di giocatori: i cognomi li inventa cognome(rand), con sillabe italiane a caso.
//
// Il clima della città (per il meteo della partita, partita.js): 'nord' la pianura padana e il Veneto (nebbia e nevicate
// d'inverno), 'alpi' Bolzano, 'liguria' la costa ligure e toscana del nord (piove tanto, mai nebbia), 'centro' Toscana,
// Marche e Lazio, 'sud' il meridione e le isole (sereno e caldo).

export const SERIE_A = 'A', SERIE_B = 'B'

// colori: maglia casa [primo, secondo], disegno della maglia ('strisce' verticali, 'meta' due metà, 'pieno' tinta unita
// con dettagli del secondo colore, 'croce', 'fascia' orizzontale, 'quarti'); la trasferta [primo, secondo] sempre 'pieno'
const S = (id, nome, sigla, citta, serie, forza, clima, casa, disegno, fuori, stemma) => ({ id, nome, sigla, citta, serie, forza, clima, casa, disegno, fuori, stemma })

export const SQUADRE = [
  // ── Serie A 2026/27 ──
  S('atalanta', 'Atalanto', 'ATL', 'Bergamo', SERIE_A, 84, 'nord', ['#1b2a6b', '#161616'], 'strisce', ['#ffffff', '#1b2a6b'], { forma: 'scudo', simbolo: 'dea', fondo: '#1b2a6b', tinta: '#ffffff' }),
  S('bologna', 'Bolognese', 'BOL', 'Bologna', SERIE_A, 77, 'nord', ['#b3121f', '#1b2a6b'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'scudo', simbolo: 'croce', fondo: '#1b2a6b', tinta: '#b3121f' }),
  S('cagliari', 'Cagliaritas', 'CAG', 'Cagliari', SERIE_A, 56, 'sud', ['#b3121f', '#1b2a6b'], 'meta', ['#ffffff', '#b3121f'], { forma: 'tondo', simbolo: 'mori', fondo: '#ffffff', tinta: '#161616' }),
  S('como', 'Comodo', 'COM', 'Como', SERIE_A, 72, 'nord', ['#1e4fb5', '#ffffff'], 'pieno', ['#ffffff', '#1e4fb5'], { forma: 'ovale', simbolo: 'onde', fondo: '#1e4fb5', tinta: '#ffffff' }),
  S('fiorentina', 'Fiorentoina', 'FIO', 'Firenze', SERIE_A, 76, 'centro', ['#5a2d8e', '#ffffff'], 'pieno', ['#ffffff', '#5a2d8e'], { forma: 'rombo', simbolo: 'giglio', fondo: '#ffffff', tinta: '#b3121f' }),
  S('frosinone', 'Frosinoni', 'FRO', 'Frosinone', SERIE_A, 45, 'centro', ['#f2c230', '#1e4fb5'], 'pieno', ['#1e4fb5', '#f2c230'], { forma: 'scudo', simbolo: 'leone', fondo: '#f2c230', tinta: '#1e4fb5' }),
  S('genoa', 'Genova Grifo', 'GEN', 'Genova', SERIE_A, 62, 'liguria', ['#b3121f', '#1b2a6b'], 'meta', ['#ffffff', '#1b2a6b'], { forma: 'scudo', simbolo: 'grifone', fondo: '#b3121f', tinta: '#ffffff' }),
  S('inter', 'Inder', 'IND', 'Milano', SERIE_A, 92, 'nord', ['#161616', '#1e4fb5'], 'strisce', ['#ffffff', '#1e4fb5'], { forma: 'tondo', simbolo: 'biscione', fondo: '#161616', tinta: '#1e4fb5' }),
  S('juventus', 'Juvenclub', 'JUV', 'Torino', SERIE_A, 85, 'nord', ['#ffffff', '#161616'], 'strisce', ['#161616', '#ffffff'], { forma: 'scudo', simbolo: 'zebra', fondo: '#ffffff', tinta: '#161616' }),
  S('lazio', 'Lazzio', 'LAZ', 'Roma', SERIE_A, 78, 'centro', ['#7fc4ea', '#ffffff'], 'pieno', ['#ffffff', '#7fc4ea'], { forma: 'tondo', simbolo: 'aquila', fondo: '#7fc4ea', tinta: '#ffffff' }),
  S('lecce', 'Leccese', 'LEC', 'Lecce', SERIE_A, 52, 'sud', ['#f2c230', '#b3121f'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'scudo', simbolo: 'lupo', fondo: '#f2c230', tinta: '#b3121f' }),
  S('milan', 'Milano Rossonera', 'MIL', 'Milano', SERIE_A, 86, 'nord', ['#b3121f', '#161616'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'ovale', simbolo: 'tridente', fondo: '#161616', tinta: '#b3121f' }),
  S('monza', 'Monzese', 'MON', 'Monza', SERIE_A, 50, 'nord', ['#b3121f', '#ffffff'], 'pieno', ['#ffffff', '#b3121f'], { forma: 'scudo', simbolo: 'corona', fondo: '#b3121f', tinta: '#f2c230' }),
  S('napoli', 'Napule', 'NAP', 'Napoli', SERIE_A, 90, 'sud', ['#2e86d9', '#ffffff'], 'pieno', ['#ffffff', '#2e86d9'], { forma: 'tondo', simbolo: 'ciuccio', fondo: '#2e86d9', tinta: '#ffffff' }),
  S('parma', 'Parmigiano', 'PAR', 'Parma', SERIE_A, 58, 'nord', ['#ffffff', '#f2c230'], 'croce', ['#1b2a6b', '#f2c230'], { forma: 'scudo', simbolo: 'croce', fondo: '#f2c230', tinta: '#1b2a6b' }),
  S('roma', 'Romma', 'ROM', 'Roma', SERIE_A, 82, 'centro', ['#8e1a2b', '#f2c230'], 'pieno', ['#ffffff', '#8e1a2b'], { forma: 'scudo', simbolo: 'lupo', fondo: '#8e1a2b', tinta: '#f2c230' }),
  S('sassuolo', 'Sassolino', 'SAS', 'Sassuolo', SERIE_A, 55, 'nord', ['#161616', '#1a8a3a'], 'strisce', ['#ffffff', '#1a8a3a'], { forma: 'ovale', simbolo: 'foglia', fondo: '#1a8a3a', tinta: '#161616' }),
  S('torino', 'Toro Granata', 'TOR', 'Torino', SERIE_A, 66, 'nord', ['#8e1a2b', '#ffffff'], 'pieno', ['#ffffff', '#8e1a2b'], { forma: 'scudo', simbolo: 'toro', fondo: '#8e1a2b', tinta: '#ffffff' }),
  S('udinese', 'Udinesi', 'UDI', 'Udine', SERIE_A, 64, 'nord', ['#ffffff', '#161616'], 'strisce', ['#161616', '#ffffff'], { forma: 'scudo', simbolo: 'castello', fondo: '#161616', tinta: '#ffffff' }),
  S('venezia', 'Venexia', 'VEN', 'Venezia', SERIE_A, 48, 'nord', ['#161616', '#e8742a'], 'pieno', ['#e8742a', '#1a8a3a'], { forma: 'scudo', simbolo: 'leone', fondo: '#161616', tinta: '#e8742a' }),
  // ── Serie B 2026/27 ──
  S('arezzo', 'Aretini', 'ARE', 'Arezzo', SERIE_B, 24, 'centro', ['#8e1a2b', '#ffffff'], 'pieno', ['#ffffff', '#8e1a2b'], { forma: 'scudo', simbolo: 'cavallo', fondo: '#8e1a2b', tinta: '#f2c230' }),
  S('avellino', 'Avellinesi', 'AVE', 'Avellino', SERIE_B, 30, 'sud', ['#1a8a3a', '#ffffff'], 'pieno', ['#ffffff', '#1a8a3a'], { forma: 'scudo', simbolo: 'lupo', fondo: '#1a8a3a', tinta: '#ffffff' }),
  S('benevento', 'Beneventani', 'BEN', 'Benevento', SERIE_B, 31, 'sud', ['#f2c230', '#b3121f'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'tondo', simbolo: 'strega', fondo: '#f2c230', tinta: '#161616' }),
  S('carrarese', 'Carraresi', 'CAR', 'Carrara', SERIE_B, 27, 'liguria', ['#2e86d9', '#f2c230'], 'pieno', ['#f2c230', '#2e86d9'], { forma: 'scudo', simbolo: 'montagna', fondo: '#2e86d9', tinta: '#ffffff' }),
  S('catanzaro', 'Catanzarese', 'CTZ', 'Catanzaro', SERIE_B, 34, 'sud', ['#f2c230', '#b3121f'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'scudo', simbolo: 'aquila', fondo: '#b3121f', tinta: '#f2c230' }),
  S('cesena', 'Cesenati', 'CES', 'Cesena', SERIE_B, 35, 'nord', ['#ffffff', '#161616'], 'strisce', ['#161616', '#ffffff'], { forma: 'tondo', simbolo: 'cavalluccio', fondo: '#ffffff', tinta: '#161616' }),
  S('cremonese', 'Cremonata', 'CRE', 'Cremona', SERIE_B, 42, 'nord', ['#8a8a8a', '#b3121f'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'scudo', simbolo: 'violino', fondo: '#8a8a8a', tinta: '#b3121f' }),
  S('empoli', 'Empolesi', 'EMP', 'Empoli', SERIE_B, 43, 'centro', ['#2e86d9', '#ffffff'], 'pieno', ['#ffffff', '#2e86d9'], { forma: 'scudo', simbolo: 'castello', fondo: '#2e86d9', tinta: '#ffffff' }),
  S('verona', 'Verona Scaligera', 'VER', 'Verona', SERIE_B, 44, 'nord', ['#f2c230', '#1b2a6b'], 'strisce', ['#ffffff', '#1b2a6b'], { forma: 'scudo', simbolo: 'scala', fondo: '#1b2a6b', tinta: '#f2c230' }),
  S('juvestabia', 'Stabia Vespe', 'STB', 'Castellammare', SERIE_B, 30, 'sud', ['#f2c230', '#1b2a6b'], 'fascia', ['#ffffff', '#1b2a6b'], { forma: 'tondo', simbolo: 'vespa', fondo: '#f2c230', tinta: '#161616' }),
  S('mantova', 'Mantua', 'MAN', 'Mantova', SERIE_B, 29, 'nord', ['#ffffff', '#b3121f'], 'meta', ['#b3121f', '#ffffff'], { forma: 'scudo', simbolo: 'alloro', fondo: '#ffffff', tinta: '#b3121f' }),
  S('modena', 'Modenesi', 'MOD', 'Modena', SERIE_B, 36, 'nord', ['#f2c230', '#1b2a6b'], 'pieno', ['#1b2a6b', '#f2c230'], { forma: 'scudo', simbolo: 'torre', fondo: '#f2c230', tinta: '#1b2a6b' }),
  S('padova', 'Padovana', 'PAD', 'Padova', SERIE_B, 32, 'nord', ['#ffffff', '#b3121f'], 'croce', ['#b3121f', '#ffffff'], { forma: 'scudo', simbolo: 'croce', fondo: '#ffffff', tinta: '#b3121f' }),
  S('palermo', 'Palermitano', 'PAL', 'Palermo', SERIE_B, 40, 'sud', ['#e889b4', '#161616'], 'meta', ['#161616', '#e889b4'], { forma: 'scudo', simbolo: 'aquila', fondo: '#e889b4', tinta: '#161616' }),
  S('pisa', 'Pisa Torre', 'PIS', 'Pisa', SERIE_B, 39, 'liguria', ['#161616', '#2e86d9'], 'strisce', ['#ffffff', '#2e86d9'], { forma: 'scudo', simbolo: 'torrependente', fondo: '#2e86d9', tinta: '#ffffff' }),
  S('sampdoria', 'Sampdoriana', 'SAM', 'Genova', SERIE_B, 40, 'liguria', ['#1e4fb5', '#ffffff'], 'fascia', ['#ffffff', '#1e4fb5'], { forma: 'scudo', simbolo: 'ancora', fondo: '#1e4fb5', tinta: '#ffffff' }),
  S('sudtirol', 'Sudtirolo', 'SUD', 'Bolzano', SERIE_B, 28, 'alpi', ['#ffffff', '#b3121f'], 'pieno', ['#b3121f', '#ffffff'], { forma: 'scudo', simbolo: 'montagna', fondo: '#ffffff', tinta: '#b3121f' }),
  S('vicenza', 'Vicentini', 'VIC', 'Vicenza', SERIE_B, 27, 'nord', ['#b3121f', '#ffffff'], 'strisce', ['#ffffff', '#b3121f'], { forma: 'scudo', simbolo: 'leone', fondo: '#b3121f', tinta: '#ffffff' }),
  S('entella', 'Entella Virtuosa', 'ENT', 'Chiavari', SERIE_B, 25, 'liguria', ['#ffffff', '#7fc4ea'], 'strisce', ['#7fc4ea', '#ffffff'], { forma: 'ovale', simbolo: 'onde', fondo: '#7fc4ea', tinta: '#ffffff' }),
  S('ascoli', 'Ascolano', 'ASC', 'Ascoli Piceno', SERIE_B, 22, 'centro', ['#ffffff', '#161616'], 'strisce', ['#161616', '#ffffff'], { forma: 'scudo', simbolo: 'picchio', fondo: '#161616', tinta: '#ffffff' }),
]
export const PER_ID = new Map(SQUADRE.map((s) => [s.id, s]))

// ── i cognomi inventati ──────────────────────────────────────────────────────
const INIZI = ['Ber', 'Gra', 'Mon', 'Pel', 'Ros', 'Fer', 'Cas', 'Bal', 'Lom', 'Ven', 'Tor', 'Mar', 'Pic', 'Bru', 'Spa', 'Zan', 'Gal', 'Fab', 'Riz', 'Col', 'Ser', 'Pas', 'Tre', 'Buf', 'Can', 'Del', 'Mor', 'Pal', 'Sal', 'Vit']
const MEZZI = ['to', 'na', 'ri', 'lo', 'ga', 'mi', 'ne', 'ca', 'de', 'ti', 'bo', 'sa', 'vi', 'gu', 'ra', '']
const FINI = ['lazzi', 'nchetti', 'tolini', 'rdello', 'sconi', 'ttini', 'gnoli', 'relli', 'zzoni', 'vanti', 'ssini', 'ldi', 'nari', 'retti', 'cchi', 'sotti', 'melli', 'ndri', 'ttoni', 'gli']
/** Un cognome inventato (rand = una funzione che dà un numero fra 0 e 1). */
export function cognome(rand) {
  const i = INIZI[Math.floor(rand() * INIZI.length)], m = MEZZI[Math.floor(rand() * MEZZI.length)], f = FINI[Math.floor(rand() * FINI.length)]
  return i + m + f
}

// ── gli stemmi ───────────────────────────────────────────────────────────────
// Ogni stemma è una forma (scudo, tondo, ovale, rombo) col fondo del colore sociale, un bordo, il simbolo disegnato con
// forme semplici (in un quadrato 40 × 40) e sotto la sigla. Disegnati qui, non copiati: una zebra stilizzata, un biscione
// che è una esse, un giglio di tre petali… Lo stesso SVG si stampa sul tabellone in HTML e, piccolo, sullo schermino.
const FORME = {
  scudo: 'M50 6 L90 16 L88 56 Q86 84 50 96 Q14 84 12 56 L10 16 Z',
  tondo: 'M50 6 A44 44 0 1 1 49.9 6 Z',
  ovale: 'M50 4 Q92 4 92 50 Q92 96 50 96 Q8 96 8 50 Q8 4 50 4 Z',
  rombo: 'M50 4 L94 50 L50 96 L6 50 Z',
}
// i simboli, in un quadrato 40 × 40, come pezzi SVG (riempiti con currentColor = la tinta; «a» = il colore di accento)
const SIMBOLI = {
  // la zebra: la testa di profilo con le strisce
  zebra: '<path d="M8 36 L8 20 Q8 10 16 8 L20 2 L22 9 L28 8 Q36 10 36 20 L34 24 L30 25 L26 36 Z"/><path d="M12 18 h10 M12 24 h8 M12 30 h8 M26 14 h6" stroke="var(--a)" stroke-width="2.4"/>',
  // il biscione: una esse col capo e la lingua
  biscione: '<path d="M12 8 Q30 8 30 16 Q30 24 20 24 Q10 24 10 31 Q10 36 26 36" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="11" cy="8" r="4.5"/><path d="M6 8 L2 6 M6 8 L2 10" stroke="var(--a)" stroke-width="1.6"/>',
  giglio: '<path d="M20 2 Q25 10 22 18 L20 24 L18 18 Q15 10 20 2 Z"/><path d="M8 10 Q4 20 14 24 L18 20 Q12 16 8 10 Z M32 10 Q36 20 26 24 L22 20 Q28 16 32 10 Z"/><rect x="13" y="24" width="14" height="3.5"/><path d="M14 28 L12 38 L17 32 L20 38 L23 32 L28 38 L26 28 Z"/>',
  lupo: '<path d="M8 10 L12 4 L16 12 L24 12 L28 4 L32 10 L32 20 Q32 32 20 36 Q8 32 8 20 Z"/><circle cx="15" cy="19" r="2" fill="var(--a)"/><circle cx="25" cy="19" r="2" fill="var(--a)"/><path d="M17 28 L20 31 L23 28" fill="none" stroke="var(--a)" stroke-width="2"/>',
  aquila: '<path d="M20 10 L2 6 L8 14 L4 16 L12 20 L8 24 L18 26 L20 36 L22 26 L32 24 L28 20 L36 16 L32 14 L38 6 Z"/><circle cx="20" cy="8" r="4"/><path d="M20 10 L24 12 L20 13 Z" fill="var(--a)"/>',
  tridente: '<path d="M20 38 L20 14 M8 6 Q8 20 20 20 Q32 20 32 6 M20 4 L20 14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M6 2 L8 7 L10 2 M18 0 L20 5 L22 0 M30 2 L32 7 L34 2" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  toro: '<path d="M4 6 Q6 16 14 16 L26 16 Q34 16 36 6 Q30 12 26 10 L14 10 Q10 12 4 6 Z"/><path d="M12 14 L28 14 L30 26 Q30 36 20 38 Q10 36 10 26 Z"/><circle cx="16" cy="24" r="2" fill="var(--a)"/><circle cx="24" cy="24" r="2" fill="var(--a)"/><circle cx="17" cy="32" r="1.5" fill="var(--a)"/><circle cx="23" cy="32" r="1.5" fill="var(--a)"/>',
  grifone: '<path d="M6 30 Q2 14 14 8 L18 2 L22 8 L36 6 L28 14 L30 22 L24 24 L24 36 L18 36 L18 26 L12 28 L10 36 L6 36 Z"/><circle cx="18" cy="12" r="1.8" fill="var(--a)"/><path d="M22 8 L28 10" stroke="var(--a)" stroke-width="2"/>',
  ciuccio: '<path d="M10 2 L14 14 L26 14 L30 2 L26 4 L24 12 L16 12 L14 4 Z"/><path d="M12 14 L28 14 L30 24 L28 36 L12 36 L10 24 Z"/><circle cx="16" cy="22" r="2" fill="var(--a)"/><circle cx="24" cy="22" r="2" fill="var(--a)"/><path d="M16 31 h8" stroke="var(--a)" stroke-width="2.2"/>',
  dea: '<circle cx="23" cy="7" r="4"/><path d="M18 12 L26 12 L30 22 L26 22 L24 18 L22 26 L30 38 L26 38 L19 29 L12 38 L8 38 L17 24 L16 16 L8 20 L6 17 Z"/>',
  mori: '<path d="M19 2 h2 v36 h-2 Z M2 19 h36 v2 h-36 Z"/><circle cx="10" cy="10" r="5"/><circle cx="30" cy="10" r="5"/><circle cx="10" cy="30" r="5"/><circle cx="30" cy="30" r="5"/><path d="M5 8 h10 M25 8 h10 M5 28 h10 M25 28 h10" stroke="var(--a)" stroke-width="2"/>',
  onde: '<path d="M2 12 Q8 6 14 12 T26 12 T38 12 M2 22 Q8 16 14 22 T26 22 T38 22 M2 32 Q8 26 14 32 T26 32 T38 32" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
  leone: '<circle cx="20" cy="20" r="15"/><circle cx="20" cy="21" r="9" fill="var(--a)"/><circle cx="16" cy="19" r="1.6"/><circle cx="24" cy="19" r="1.6"/><path d="M20 23 L18 26 L22 26 Z"/><path d="M8 8 L12 12 M32 8 L28 12 M4 20 L8 20 M36 20 L32 20 M8 32 L12 28 M32 32 L28 28" stroke="currentColor" stroke-width="3"/>',
  corona: '<path d="M4 30 L4 12 L12 20 L20 6 L28 20 L36 12 L36 30 Z"/><rect x="4" y="30" width="32" height="5" fill="var(--a)"/><circle cx="4" cy="11" r="2.5" fill="var(--a)"/><circle cx="20" cy="5" r="2.5" fill="var(--a)"/><circle cx="36" cy="11" r="2.5" fill="var(--a)"/>',
  croce: '<path d="M15 4 h10 v11 h11 v10 h-11 v11 h-10 v-11 h-11 v-10 h11 Z"/>',
  foglia: '<path d="M20 2 Q38 10 32 28 Q26 40 20 38 Q6 32 8 16 Q10 6 20 2 Z"/><path d="M20 10 L20 36 M20 18 L13 14 M20 24 L28 19 M20 30 L14 26" fill="none" stroke="var(--a)" stroke-width="1.8"/>',
  castello: '<path d="M4 38 L4 12 L8 12 L8 8 L12 8 L12 12 L16 12 L16 6 L24 6 L24 12 L28 12 L28 8 L32 8 L32 12 L36 12 L36 38 Z"/><rect x="17" y="24" width="6" height="14" fill="var(--a)"/><rect x="8" y="18" width="4" height="5" fill="var(--a)"/><rect x="28" y="18" width="4" height="5" fill="var(--a)"/>',
  torre: '<path d="M14 38 L14 10 L12 10 L12 6 L16 6 L16 2 L24 2 L24 6 L28 6 L28 10 L26 10 L26 38 Z"/><rect x="18" y="14" width="4" height="5" fill="var(--a)"/><rect x="18" y="24" width="4" height="5" fill="var(--a)"/><path d="M20 2 L20 -2" stroke="currentColor" stroke-width="2"/>',
  torrependente: '<g transform="rotate(-9 20 38)"><path d="M14 38 L15 6 L25 6 L26 38 Z"/><rect x="15" y="4" width="10" height="3"/><path d="M14 12 h12 M14 18 h12 M14 24 h12 M14 30 h12" stroke="var(--a)" stroke-width="1.6"/></g>',
  cavallo: '<path d="M8 36 L8 20 Q8 10 16 8 L20 2 L22 9 L28 8 Q36 10 36 20 L34 24 L30 25 L26 36 Z"/><circle cx="29" cy="15" r="1.8" fill="var(--a)"/><path d="M10 14 Q6 20 10 26" fill="none" stroke="var(--a)" stroke-width="2.2"/>',
  strega: '<path d="M20 2 L28 24 L12 24 Z"/><path d="M4 24 L36 24 L36 28 L4 28 Z"/><path d="M8 28 L8 38 M8 38 L4 36 M8 38 L12 36 M20 30 L30 38" stroke="var(--a)" stroke-width="2.6" stroke-linecap="round" fill="none"/>',
  montagna: '<path d="M2 36 L14 10 L20 20 L26 6 L38 36 Z"/><path d="M14 10 L17 16 L11 16 Z M26 6 L30 14 L22 14 Z" fill="var(--a)"/>',
  cavalluccio: '<path d="M22 4 Q30 6 28 14 L24 18 Q30 24 26 32 Q22 38 14 36 Q20 32 18 26 Q14 22 16 16 L12 12 L16 10 L18 6 Z"/><circle cx="23" cy="9" r="1.5" fill="var(--a)"/><path d="M28 10 L34 8" stroke="currentColor" stroke-width="2"/>',
  violino: '<path d="M20 2 L20 14 M17 4 h6" stroke="currentColor" stroke-width="3" fill="none"/><path d="M12 14 Q4 14 6 22 Q8 26 8 30 Q8 38 20 38 Q32 38 32 30 Q32 26 34 22 Q36 14 28 14 Q24 18 20 18 Q16 18 12 14 Z"/><path d="M20 20 L20 34 M16 24 L16 30 M24 24 L24 30" stroke="var(--a)" stroke-width="1.6"/>',
  scala: '<path d="M10 2 L10 38 M30 2 L30 38" stroke="currentColor" stroke-width="4" fill="none"/><path d="M10 8 h20 M10 16 h20 M10 24 h20 M10 32 h20" stroke="currentColor" stroke-width="3"/>',
  vespa: '<ellipse cx="20" cy="26" rx="8" ry="11"/><circle cx="20" cy="11" r="5"/><path d="M14 20 h12 M13 26 h14 M14 32 h12" stroke="var(--a)" stroke-width="2.4"/><path d="M12 16 Q2 10 6 22 Q10 24 14 20 M28 16 Q38 10 34 22 Q30 24 26 20" fill="var(--a)" opacity=".7"/><path d="M17 6 L14 2 M23 6 L26 2" stroke="currentColor" stroke-width="1.6"/>',
  alloro: '<path d="M8 8 Q4 24 20 36 Q36 24 32 8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M8 10 Q4 12 6 16 Q10 14 8 10 Z M6 18 Q4 22 8 24 Q10 20 6 18 Z M8 26 Q8 30 12 31 Q13 27 8 26 Z M32 10 Q36 12 34 16 Q30 14 32 10 Z M34 18 Q36 22 32 24 Q30 20 34 18 Z M32 26 Q32 30 28 31 Q27 27 32 26 Z"/>',
  ancora: '<circle cx="20" cy="6" r="3.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 10 L20 36 M12 16 h16" stroke="currentColor" stroke-width="3.4" fill="none"/><path d="M6 24 Q6 36 20 38 Q34 36 34 24 L30 26 Q30 32 20 34 Q10 32 10 26 Z"/>',
  picchio: '<path d="M26 4 Q34 6 32 14 L26 18 L28 26 L24 36 L18 36 L20 28 L14 24 L10 14 Q10 6 18 4 Z"/><path d="M32 10 L40 12 L32 14" fill="var(--a)"/><circle cx="26" cy="9" r="1.6" fill="var(--a)"/><path d="M14 20 L8 30" stroke="var(--a)" stroke-width="2.4"/>',
}

/** Lo stemma di una squadra come SVG (stringa). `misura` in px; senza, scala col contenitore. */
export function stemmaSVG(sq, misura = null) {
  const { forma, simbolo, fondo, tinta } = sq.stemma
  const chiaro = fondo === '#ffffff'
  const bordo = chiaro ? tinta : '#161616'
  const accento = tinta === '#ffffff' ? fondo : fondo === '#ffffff' ? '#ffffff' : sq.casa.includes(tinta) ? (sq.casa.find((c) => c !== tinta) ?? '#ffffff') : fondo
  const sz = misura ? ` width="${misura}" height="${misura}"` : ''
  return `<svg viewBox="0 0 100 100"${sz} aria-hidden="true" class="vi-stemma" style="--a:${accento}"><path d="${FORME[forma]}" fill="${fondo}" stroke="${bordo}" stroke-width="4" stroke-linejoin="round"/><path d="${FORME[forma]}" fill="none" stroke="${chiaro ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.25)'}" stroke-width="1.5" transform="translate(50 50) scale(.86) translate(-50 -50)"/><g transform="translate(26 18) scale(1.2)" fill="${tinta}" color="${tinta}" style="color:${tinta}">${SIMBOLI[simbolo]}</g><text x="50" y="86" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="18" fill="${tinta}" letter-spacing="1">${sq.sigla}</text></svg>`
}
