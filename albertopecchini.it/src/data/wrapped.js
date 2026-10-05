// ─────────────────────────────────────────────────────────────────────────────
//  WRAPPED 5BT — contenuti della pagina /wrapped5BT/: le 35 slide verticali
//  che raccontano la chat del gruppo di classe attraverso dati reali.
//
//  IL PATTO: qui non entra nessun numero inventato. Ogni cifra viene da
//  tools/wrapped/lavoro/dati.json (prodotto da tools/wrapped/analizza.mjs
//  sugli export della chat) e ogni citazione va verificata parola per parola
//  su lavoro/chat_unificata.txt prima di finire in una slide. Se una metrica
//  non è calcolabile, la slide lo dice; non si approssima in silenzio.
//
//  Finché `slides` è vuoto la pagina mostra la tela in attesa, con le guide.
// ─────────────────────────────────────────────────────────────────────────────

export const wrapped = {
  // 'in-preparazione' → tela vuota con le guide; 'pronto' → si mostrano le slide.
  stato: 'in-preparazione',
  titolo: 'Wrapped 5BT',
  periodo: { dal: '15 dicembre 2022', al: '5 ottobre 2026' },

  // Ogni slide è un oggetto { tipo, tema?, ...campi del tipo }.
  // `tema` è uno dei temi del sito ('ink', 'paper', 'tint'): le slide scure e
  // chiare si alternano con i data-theme di tokens.css. I tipi disponibili,
  // tutti renderizzati da src/templates/pages/wrapped5bt.js:
  //
  //  copertina  { occhiello, titolo, sottotitolo }
  //  numero     { occhiello, valore, unita?, didascalia, secondari: [{ etichetta, valore }], nota? }
  //  classifica { occhiello, titolo, voci: [{ nome, valore, dettaglio? }], unita?, nota? }
  //  timeline   { occhiello, titolo, tappe: [{ data, testo }], nota? }
  //  citazione  { occhiello, testo, autore, data, nota? }
  //  confronto  { occhiello, titolo, lati: [{ etichetta, valore, dettaglio? }], nota? }
  //  griglia    { occhiello, titolo, celle: [{ etichetta, valore }], nota? }
  //  testo      { occhiello, titolo, paragrafi: [stringhe], nota? }
  //  finale     { occhiello, titolo, sottotitolo, firma? }
  //
  // `nota` è la riga piccola in fondo alla slide: la fonte del dato, la
  // definizione usata o il limite dichiarato («stima per adiacenza», ecc.).
  slides: [],
}
