// ─── Lo stile delle email ────────────────────────────────────────────────────
//
// Tutte le email che partono di qui hanno la stessa faccia, ed è quella della
// home: grigi neutri, un solo azzurro, l'angolo tagliato a 45° in alto a
// sinistra e in basso a destra. Prima ognuna aveva la sua, e nessuna era più
// quella del sito — il verde della festa in api/notify.ts, l'arancio Ubuntu in
// api/d.ts, il beige della diagnostica qui accanto in serverSecurity.ts: le
// vesti di skin che il sito non ha più.
//
// ── I colori sono una copia, e va detto ─────────────────────────────────────
// I token --sb-* di src/app/home.css qui non si possono leggere: nelle email le
// custom property non arrivano (Outlook le butta via) e nemmeno hsl() è dato
// per scontato. Quindi i colori sono GLI STESSI, tradotti in esadecimale a
// mano. Se cambia la palette in home.css, cambia anche qui — stesso patto già
// dichiarato in cima a src/styles/theme.css.
//
// ── L'angolo tagliato ───────────────────────────────────────────────────────
// La sagoma del sito è un clip-path, e nelle email clip-path è un di più: lo
// applicano i client moderni (Apple Mail, i webmail aperti nel browser), lo
// ignorano i vecchi (Outlook, che impagina col motore di Word). Ignorarlo però
// non rompe niente: resta un rettangolo con la stessa palette e la stessa
// cornice. Il filo da 1px infatti NON è un `border`: è una lastra di fondo con
// un pixel di padding, esattamente come .sb-panel nella home. Un border lo
// taglierebbe via la diagonale; uno sfondo no, perché il taglio ritaglia lui.
//
// ── Chiaro e scuro ──────────────────────────────────────────────────────────
// Il sito nasce nei due temi e l'email fa lo stesso. I colori del chiaro stanno
// in riga, perché in riga arrivano dappertutto; quelli dello scuro stanno in un
// <style> con prefers-color-scheme e !important, perché una regola !important
// di foglio batte una dichiarazione inline — è l'unico modo di scavalcare gli
// stili in riga. Dove il <style> viene buttato via resta il chiaro, che è il
// default del sito.
// ─────────────────────────────────────────────────────────────────────────────

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** La palette chiara, gemella di .sb-home in src/app/home.css. */
export const C = {
  bg: "#fcfcfc",            // --sb-bg
  bgAlt: "#f8f8f8",         // --sb-bg-alt
  superficie: "#fbfbfb",    // --sb-surface-75
  superficie100: "#f6f6f6", // --sb-surface-100
  superficie200: "#f0f0f0", // --sb-surface-200
  bordo: "#e8e8e8",         // --sb-border
  bordoForte: "#dbdbdb",    // --sb-border-strong
  fg: "#171717",            // --sb-fg
  fgLight: "#525252",       // --sb-fg-light
  fgLighter: "#6f6f6f",     // --sb-fg-lighter
  fgMuted: "#8f8f8f",       // --sb-fg-muted
  brand: "#00b3fa",         // --sb-brand       hsl(197 100% 49%)
  brandTesto: "#0a6285",    // --sb-brand-text  hsl(197 86% 28%)
  btnBg: "#72c7e3",         // --sb-btn-bg      hsl(195 67% 67%)
  btnBd: "#2d8fbe",         // --sb-btn-bd      hsla(199 78% 40% / .75), appiattito
  btnFg: "#101010",         // --sb-btn-fg
};

export const FONT = "'Titillium Web',-apple-system,'Segoe UI',Geneva,Tahoma,Arial,sans-serif";
export const MONO = "'Roboto Mono',ui-monospace,Consolas,monospace";

/** Le due misure del taglio: la lastra e la pillola (--sb-cut-lg, --sb-cut). */
const CUT_LG = 18;
const CUT = 10;

const sagoma = (t: number) =>
  `polygon(${t}px 0,100% 0,100% calc(100% - ${t}px),calc(100% - ${t}px) 100%,0 100%,0 ${t}px)`;

/**
 * La lastra: un fondo colorato con 1px di padding attorno al contenuto. Il
 * taglio interno è più stretto di 0.586px perché fra le due diagonali resti
 * esattamente un pixel, come sui lati dritti — la stessa aritmetica di
 * --sb-shape-lg-in (su una retta a 45° un pixel in perpendicolare vale √2, e
 * 2 − √2 = 0.586).
 */
function lastra(
  corpo: string,
  { taglio = CUT_LG, rim = C.bordoForte, fondo = C.superficie, classe = "e-card" } = {},
): string {
  return `<div class="e-rim" style="padding:1px;background:${rim};clip-path:${sagoma(taglio)}">` +
    `<div class="${classe}" style="background:${fondo};clip-path:${sagoma(taglio - 0.586)}">${corpo}</div></div>`;
}

/** Lo scuro: la stessa palette di html.dark .sb-home, e nient'altro. */
const SCURO = `
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .e-bg    { background:#141414 !important; }
      .e-rim   { background:#343434 !important; }  /* --sb-border-strong */
      .e-card  { background:#1c1c1c !important; }  /* --sb-surface-75 */
      .e-slab  { background:#222222 !important; }  /* --sb-surface-100 */
      .e-sep   { border-color:#2a2a2a !important; }
      .e-fg    { color:#ededed !important; }
      .e-body  { color:#b4b4b4 !important; }       /* --sb-fg-light */
      .e-mut   { color:#707070 !important; }       /* --sb-fg-muted */
      .e-link  { color:#1abeff !important; }       /* --sb-brand-text */
      .e-btn-p { background:#004261 !important; border-color:#006472 !important; color:#ffffff !important; }
      .e-btn-s { background:#181818 !important; border-color:#343434 !important; color:#ededed !important; }
    }`;

/**
 * Il documento completo. Il <style> serve solo allo scuro e ai caratteri del
 * sito: tolto quello, ogni colore è già in riga e il testo scala sui fallback.
 *
 * Il fondo e il carattere stanno DUE volte, sul <body> e su un div dentro,
 * perché Gmail il <body> lo butta via e tiene solo quello che c'è dentro: la
 * pagina resterebbe bianca col carattere di sistema.
 */
function documento(titolo: string, dentro: string, padding: string): string {
  const veste = `background:${C.bg};font-family:${FONT};font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased`;
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>${esc(titolo)}</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600&family=Roboto+Mono&display=swap');
${SCURO}
</style></head>
<body class="e-bg" style="margin:0;padding:0;${veste}">
<div class="e-bg" style="padding:${padding};${veste}">
${dentro}
</div>
</body></html>`;
}

/** L'intestazione della lastra: occhiello in monospaziato, titolo sotto. */
function testa(titolo: string, occhiello: string): string {
  return `
      <div class="e-sep" style="padding:18px 22px;border-bottom:1px solid ${C.bordo}">
        <p class="e-mut" style="margin:0 0 5px;font-family:${MONO};font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:${C.fgMuted}">${esc(occhiello)}</p>
        <h1 class="e-fg" style="margin:0;font-size:20px;font-weight:600;line-height:1.3;color:${C.fg}">${esc(titolo)}</h1>
      </div>`;
}

/** Il guscio di ogni email: il fondo, la lastra centrata da 560px, la firma. */
export function guscio(titolo: string, occhiello: string, corpo: string): string {
  const dentro = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse">
  <tr><td style="padding:0">
    ${lastra(`${testa(titolo, occhiello)}<div style="padding:20px 22px">${corpo}</div>`)}
  </td></tr>
  <tr><td style="padding:12px 6px 0">
    <p class="e-mut" style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:.06em;color:${C.fgMuted}">albertopecchini.it</p>
  </td></tr>
</table>`;
  return documento(titolo, dentro, "24px 12px");
}

/** Una pagina vera (le decisioni, gli errori dei link): stessa lastra, stessa
 *  palette, nessuna dipendenza. Qui il taglio si vede sempre: è un browser. */
export function pagina(titolo: string, corpo: string, occhiello = "albertopecchini.it"): string {
  const dentro = `
<div style="max-width:560px;margin:0 auto;padding:8vh 0">
  ${lastra(`${testa(titolo, occhiello)}<div class="e-body" style="padding:20px 22px;font-size:15px;line-height:1.65;color:${C.fgLight}">${corpo}</div>`)}
</div>`;
  return documento(titolo, dentro, "0 16px");
}

/** La tabellina etichetta → valore. */
export function righe(dati: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;font-size:14px">${dati
    .map(
      ([k, v]) =>
        `<tr><td class="e-mut" style="padding:5px 12px 5px 0;color:${C.fgMuted};white-space:nowrap;vertical-align:top">${esc(k)}</td>` +
        `<td class="e-fg" style="padding:5px 0;color:${C.fg};word-break:break-word">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Il paragrafo del corpo, e la nota piccola in fondo. */
export const testo = (html: string) =>
  `<p class="e-body" style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${C.fgLight}">${html}</p>`;

export const nota = (html: string) =>
  `<p class="e-mut" style="margin:0;font-size:12px;line-height:1.6;color:${C.fgMuted}">${html}</p>`;

/** Il pezzo di frase che deve pesare come un valore, non come prosa. */
export const forte = (s: string) =>
  `<strong class="e-fg" style="color:${C.fg};font-weight:600">${esc(s)}</strong>`;

/** Il bottone della home: alto 38px, raggio 6px. Il raggio resta anche qui,
 *  perché su un controllo alto 38px un taglio da 10 sarebbe più della metà del
 *  lato corto — è la regola scritta nel blocco «Lo smusso» di home.css. */
const vesteBottone = (primario: boolean) =>
  `display:inline-block;padding:9px 16px;border-radius:6px;font-family:${FONT};font-size:14px;line-height:20px;` +
  (primario
    ? `background:${C.btnBg};border:1px solid ${C.btnBd};color:${C.btnFg}`
    : `background:${C.bgAlt};border:1px solid ${C.bordoForte};color:${C.fg}`);

export function bottone(href: string, etichetta: string, primario = true): string {
  return `<a class="${primario ? "e-btn-p" : "e-btn-s"}" href="${esc(href)}" style="${vesteBottone(primario)};margin:0 8px 8px 0;text-decoration:none">${esc(etichetta)}</a>`;
}

/** Lo stesso bottone dentro un modulo: le decisioni si prendono in POST. */
export function bottoneModulo(nome: string, valore: string, etichetta: string, primario = true): string {
  return `<button class="${primario ? "e-btn-p" : "e-btn-s"}" name="${esc(nome)}" value="${esc(valore)}" style="${vesteBottone(primario)};margin:0 8px 8px 0;cursor:pointer">${esc(etichetta)}</button>`;
}

/** Il link azzurro del sito (.sb-link). */
export const link = (href: string, etichetta: string) =>
  `<a class="e-link" href="${esc(href)}" style="color:${C.brandTesto};text-decoration:none">${esc(etichetta)}</a>`;

/**
 * La lastra piccola dentro il corpo (la diagnostica, i riquadri di servizio).
 * Taglio da 10px e non da 18: la misura si sceglie dall'altezza, non dal ruolo.
 */
export function riquadro(titolo: string, corpo: string): string {
  const dentro = `<div style="padding:14px 16px">
      <p class="e-mut" style="margin:0 0 8px;font-family:${MONO};font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:${C.fgMuted}">${esc(titolo)}</p>
      ${corpo}
    </div>`;
  return `<div style="margin-top:18px">${lastra(dentro, {
    taglio: CUT,
    rim: C.bordo,
    fondo: C.superficie100,
    classe: "e-slab",
  })}</div>`;
}
