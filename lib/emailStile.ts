// ─── Lo stile delle email e delle paginette ──────────────────────────────────
//
// Una faccia sola, ed è quella della home: stessi token, stessa lastra, stessa
// tipografia, stesso fondale. Non «ispirato a» — gli stessi valori, presi uno a
// uno da src/app/home.css, che resta l'unica fonte di verità.
//
// ── I colori sono una copia, e va detto ─────────────────────────────────────
// I token --sb-* qui non si possono leggere: nelle email le custom property non
// arrivano (Outlook le butta via) e nemmeno hsl() è dato per scontato. Quindi i
// colori sono GLI STESSI, tradotti in esadecimale a mano. Se cambia la palette
// in home.css, cambia anche qui — stesso patto dichiarato in styles/theme.css.
//
// ── Le due uscite non sono la stessa cosa ───────────────────────────────────
// `pagina()` finisce in un browser vero, quindi ha TUTTO: i due aloni azzurri
// alla deriva, la griglia tecnica che si dissolve, il fuoco azzurro, la
// selezione. `guscio()` finisce in una casella di posta, dove metà di quelle
// cose non esiste: niente fondale fisso, niente animazioni, e ogni colore
// scritto in riga perché è l'unica cosa che arriva dappertutto.
//
// ── La lastra ───────────────────────────────────────────────────────────────
// È .sb-panel, uguale: un rim da 1px che NON è un `border` ma lo sfondo a
// gradiente di un elemento con un pixel di padding, e dentro la superficie
// piena. È così anche nella home, e non per gusto: clip-path taglia via il
// border sulle diagonali, mentre uno sfondo lo ritaglia insieme all'elemento —
// e il filo resta anche sull'angolo tagliato. L'interno è più stretto di
// 0.586px per la stessa aritmetica di --sb-shape-lg-in (su una retta a 45° un
// pixel in perpendicolare vale √2, e 2 − √2 = 0.586).
//
// Il taglio lo ignorano i client di posta vecchi (Outlook impagina col motore
// di Word): resta un rettangolo con la stessa palette, e non si rompe niente.
//
// ── Chiaro e scuro ──────────────────────────────────────────────────────────
// Il sito nasce nei due temi. I colori del chiaro stanno in riga; quelli dello
// scuro in un <style> con prefers-color-scheme e !important, perché una regola
// !important di foglio è l'unico modo di scavalcare uno stile in riga. Dove il
// <style> viene buttato via resta il chiaro, che è il default del sito.
// ─────────────────────────────────────────────────────────────────────────────

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** I token di .sb-home, tema chiaro. */
export const C = {
  bg: "#f4f5f2",            // --sb-bg
  bgAlt: "#eff1ec",         // --sb-bg-alt
  superficie: "#f2f4f0",    // --sb-surface-75
  superficie100: "#ecefe8", // --sb-surface-100
  superficie200: "#e5e9e0", // --sb-surface-200
  bordo: "#dde2d7",         // --sb-border
  bordoForte: "#ced5c6",    // --sb-border-strong
  bordoPiuForte: "#b6c0ac", // --sb-border-stronger
  fg: "#12160f",            // --sb-fg
  fgLight: "#4a5145",       // --sb-fg-light
  fgLighter: "#666d60",     // --sb-fg-lighter
  fgMuted: "#878e80",       // --sb-fg-muted
  brand: "#00e62a",         // --sb-brand       hsl(132 100% 45%)
  brandTesto: "#077338",    // --sb-brand-text  hsl(140 88% 24%)
  btnBg: "#72c7e3",         // --sb-btn-bg      hsl(195 67% 67%)
  btnBd: "#3e9bc4",         // --sb-btn-bd      hsla(199 78% 40% / .75) appiattito
  // ATTENZIONE, non è --sb-btn-fg. Nella home i bottoni primari sono quasi
  // sempre <a>, e `.sb-home a { color: inherit }` ha più specificità di
  // `.sb-btn--primary { color: var(--sb-btn-fg) }`: il nero #101010 del token
  // non arriva mai a schermo, l'etichetta è --sb-fg. Misurato sulla home vera,
  // non dedotto dal CSS: rgb(23,23,23) sul chiaro, rgb(237,237,237) sullo scuro.
  btnFg: "#12160f",
};

// I caratteri e i pesi sono quelli caricati da index.html (font_italia.css):
// Titillium Web non ha il 500, quindi un titolo dichiarato 500 cade sul 400
// esattamente come nella home. Si tiene la stessa lista apposta.
export const FONT = "'Titillium Web',Geneva,Tahoma,sans-serif";
export const MONO = "'Roboto Mono',ui-monospace,Consolas,monospace";
const CARATTERI =
  "https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700&family=Roboto+Mono&display=swap";

/** Le misure dello smusso: la lastra e la pillola (--sb-cut-lg, --sb-cut). */
const CUT_LG = 18;
const CUT = 10;

const sagoma = (t: number) =>
  `polygon(${t}px 0,100% 0,100% calc(100% - ${t}px),calc(100% - ${t}px) 100%,0 100%,0 ${t}px)`;

/**
 * Il rim di .sb-panel, appiattito. Nella home è
 *   linear-gradient(160deg, --sb-glass-rim, --sb-border-strong 38%,
 *                   color-mix(in srgb, --sb-border 45%, transparent))
 * e le due estremità sono semitrasparenti: qui sono già fuse col fondo, perché
 * color-mix() e i canali alfa nei gradienti sono l'ultima cosa che si può
 * chiedere a un client di posta. Chi non capisce il gradiente vede la tinta
 * piena dichiarata prima — che è --sb-border-strong, cioè il colore del filo.
 */
const RIM = `background:${C.bordoForte};background-image:linear-gradient(160deg,#fefefe,${C.bordoForte} 38%,#f3f3f3)`;
const RIM_SCURO = "background:#31382e !important;background-image:linear-gradient(160deg,#272727,#31382e 38%,#1e1e1e) !important";
/** Nelle pagine i canali alfa ci sono davvero, quindi il rim è quello vero,
 *  copiato tale e quale: sopra i veli azzurri lascia passare il fondale, cosa
 *  che la versione appiattita non può fare. */
const RIM_PAGINA =
  `background:${C.bordoForte};background-image:linear-gradient(160deg,rgba(255,255,255,.55),${C.bordoForte} 38%,rgba(232,232,232,.45))`;

/** Il filo di luce sul bordo alto dell'interno (--sb-glass-spec). */
const SPEC = "box-shadow:inset 0 1px 0 rgba(255,255,255,.72)";

/**
 * La lastra: .sb-panel + .sb-panel-inner.
 *
 * Nelle email l'interno è a tinta piena — dietro non c'è niente da sfocare, ed è
 * il caso che nella home si chiama .sb-panel--solid. Nelle pagine invece dietro
 * c'è il fondale, quindi è vetro vero: --sb-glass-bg (la superficie al 58%),
 * blur 20px e saturate 150% per rimettere il colore che la sfocatura porta via.
 * La tinta piena resta dichiarata prima, e regge da sola dove color-mix() non
 * arriva.
 */
function lastra(
  corpo: string,
  { taglio = CUT_LG, rim = RIM, fondo = C.superficie, classe = "e-card", classeRim = "e-rim", vetro = false } = {},
): string {
  const dentro = vetro
    ? `background:${fondo};background:color-mix(in srgb, ${fondo} 58%, transparent);` +
      "-webkit-backdrop-filter:blur(20px) saturate(150%);backdrop-filter:blur(20px) saturate(150%);"
    : `background:${fondo};`;
  return `<div class="${classeRim}" style="padding:1px;${rim};clip-path:${sagoma(taglio)}">` +
    `<div class="${classe}${vetro ? " e-glass" : ""}" style="${dentro}${SPEC};clip-path:${sagoma(taglio - 0.586)}">${corpo}</div></div>`;
}

/** Lo scuro: gli stessi nomi ridichiarati, come html.dark .sb-home. */
const SCURO = `
    @media (prefers-color-scheme: dark) {
      .e-bg    { background:#0d0f0c !important; }   /* --sb-bg */
      .e-rim   { ${RIM_SCURO}; }
      .e-card  { background:#151814 !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.1) !important; }
      .e-slab  { background:#1b1f19 !important; }   /* --sb-surface-100 */
      .e-slab-rim { background:#262b24 !important; background-image:none !important; }
      .e-sep   { border-color:#262b24 !important; }
      .e-fg    { color:#eaeee7 !important; }        /* --sb-fg */
      .e-body  { color:#929a8c !important; }        /* --sb-fg-lighter */
      .e-mut   { color:#6b7266 !important; }        /* --sb-fg-muted */
      .e-link  { color:#1abeff !important; }        /* --sb-brand-text */
      .e-btn-p { background:#004261 !important; border-color:#00648f !important; color:#eaeee7 !important; }
      .e-btn-s { background:#111310 !important; border-color:#31382e !important; color:#eaeee7 !important; }
    }`;

/**
 * Il fondale della home, per le pagine che finiscono in un browser: due veli
 * radiali azzurri alla deriva e la griglia tecnica che si dissolve verso il
 * basso. Fissi, come nella home: nessun bordo di sezione può tagliarli mentre
 * si scorre. La deriva col puntatore no — quella la scrive GSAP a ogni frame, e
 * una pagina che esiste il tempo di premere un bottone non si porta dietro un
 * file di JavaScript per farsi seguire dal mouse.
 */
const FONDALE = `
    .p-velo, .p-velo2, .p-griglia { position:fixed; inset:0; z-index:-1; pointer-events:none; }
    .p-velo  { background:radial-gradient(58rem 32rem at 16% -8%, hsla(132, 100%, 47%,.14), transparent 62%);
               animation:deriva-a 74s ease-in-out infinite alternate; }
    .p-velo2 { background:radial-gradient(52rem 30rem at 88% 2%, hsla(192,72%,55%,.1), transparent 60%);
               animation:deriva-b 91s ease-in-out infinite alternate; }
    .p-griglia {
      opacity:.7;
      background:
        linear-gradient(${C.bordo} 1px, transparent 1px) 0 0 / 64px 64px,
        linear-gradient(90deg, ${C.bordo} 1px, transparent 1px) 0 0 / 64px 64px;
      -webkit-mask-image:radial-gradient(130% 96% at 50% -4%, #000 12%, transparent 68%);
      mask-image:radial-gradient(130% 96% at 50% -4%, #000 12%, transparent 68%);
    }
    @keyframes deriva-a { from { transform:translate3d(-3vw,-2vh,0) scale(1); }    to { transform:translate3d(4vw,3vh,0) scale(1.09); } }
    @keyframes deriva-b { from { transform:translate3d(3vw,2vh,0) scale(1.06); }   to { transform:translate3d(-4vw,-3vh,0) scale(1); } }
    @media (prefers-reduced-motion: reduce) { .p-velo, .p-velo2 { animation:none; } }
    @media (prefers-color-scheme: dark) {
      .p-velo  { background:radial-gradient(58rem 32rem at 16% -8%, hsla(132, 100%, 47%,.16), transparent 62%); }
      .p-velo2 { background:radial-gradient(52rem 30rem at 88% 2%, hsla(192,72%,55%,.12), transparent 60%); }
      .p-griglia { background:
        linear-gradient(#262b24 1px, transparent 1px) 0 0 / 64px 64px,
        linear-gradient(90deg, #262b24 1px, transparent 1px) 0 0 / 64px 64px; }
    }
    /* Lo scuro spegnerebbe il vetro con la tinta piena delle email (.e-card):
       qui la lastra sta sopra il fondale, quindi torna trasparente al 52%,
       che è --sb-glass-bg di html.dark. Questa regola sta dopo, e vince. */
    @media (prefers-color-scheme: dark) {
      .e-glass { background:color-mix(in srgb, #151814 52%, transparent) !important; }
    }
    /* Il fuoco e la selezione della home, uguali. Sulla lastra tagliata
       l'outline sparirebbe col clip-path, quindi lì diventa un'ombra interna. */
    ::selection { background:hsla(132, 100%, 47%,.35); }
    :focus-visible { outline:2px solid ${C.brand}; outline-offset:2px; border-radius:4px; }
    button:focus-visible { outline:none; box-shadow:inset 0 0 0 2px ${C.brand}; }`;

/**
 * Il documento. Il fondo e il carattere stanno DUE volte, sul <body> e su un
 * div dentro, perché Gmail il <body> lo butta via e tiene solo quello che c'è
 * dentro: la pagina resterebbe bianca col carattere di sistema.
 */
function documento(titolo: string, dentro: string, padding: string, fondale: boolean): string {
  const veste = `background:${C.bg};color:${C.fg};font-family:${FONT};font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased`;
  // Col fondale il div dentro deve restare TRASPARENTE: i veli sono fissi a
  // z-index -1, cioè sopra lo sfondo del <body> ma sotto qualunque blocco in
  // flusso — un div con una tinta piena se li mangerebbe tutti. Senza fondale
  // (le email) la tinta lì serve invece eccome: è l'unica che Gmail tiene.
  const dentroVeste = fondale
    ? `color:${C.fg};font-family:${FONT};font-size:16px;line-height:1.5`
    : veste;
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>${esc(titolo)}</title>
${fondale ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${CARATTERI}">` : ""}
<style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
${fondale ? "" : `    @import url('${CARATTERI}');`}
${SCURO}${fondale ? FONDALE : ""}
</style></head>
<body class="e-bg" style="margin:0;padding:0;${veste}">
${fondale ? '<div class="p-velo"></div><div class="p-velo2"></div><div class="p-griglia"></div>' : ""}
<div${fondale ? "" : ' class="e-bg"'} style="padding:${padding};${dentroVeste}">
${dentro}
</div>
</body></html>`;
}

/**
 * L'intestazione della lastra. L'occhiello è quello della home (.sb-nowbuild-label:
 * 0.68rem, spaziatura .11em, maiuscoletto, --sb-fg-muted) — e NON è
 * monospaziato: nella home il Roboto Mono è del codice, dei terminali e delle
 * targhette degli strumenti, non delle etichette. Il titolo è la scala di
 * .sb-sechead h2 al suo minimo: peso 500, spaziatura −0.015em, interlinea 1.25.
 */
function testa(titolo: string, occhiello: string): string {
  return `
      <div class="e-sep" style="padding:18px 22px;border-bottom:1px solid ${C.bordo}">
        <p class="e-mut" style="margin:0 0 6px;font-size:11.52px;letter-spacing:.12em;text-transform:uppercase;color:${C.fgMuted}">${esc(occhiello)}</p>
        <h1 class="e-fg" style="margin:0;font-size:23.2px;font-weight:500;letter-spacing:-.015em;line-height:29px;color:${C.fg}">${esc(titolo)}</h1>
      </div>`;
}

/** Il guscio di ogni email: fondo, lastra centrata, firma sotto. */
export function guscio(titolo: string, occhiello: string, corpo: string): string {
  const dentro = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse">
  <tr><td style="padding:0">
    ${lastra(`${testa(titolo, occhiello)}<div style="padding:20px 22px">${corpo}</div>`)}
  </td></tr>
  <tr><td style="padding:14px 6px 0">
    <p class="e-mut" style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:.06em;color:${C.fgMuted}">albertopecchini.it</p>
  </td></tr>
</table>`;
  return documento(titolo, dentro, "24px 12px", false);
}

/** Una pagina vera (le decisioni, gli errori dei link): la stessa lastra sopra
 *  il fondale della home, alla misura di .sb-sechead (40rem) e con lo stacco
 *  verticale di .sb-section. */
export function pagina(titolo: string, corpo: string, occhiello = "albertopecchini.it"): string {
  const dentro = `
<div style="max-width:40rem;margin:0 auto">
  ${lastra(
    `${testa(titolo, occhiello)}<div class="e-body" style="padding:20px 22px;font-size:15.2px;line-height:1.6;color:${C.fgLighter}">${corpo}</div>`,
    { rim: RIM_PAGINA, vetro: true },
  )}
</div>`;
  return documento(titolo, dentro, "clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,5rem)", true);
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

/** Il paragrafo (.sb-sechead p) e la nota piccola. */
export const testo = (html: string) =>
  `<p class="e-body" style="margin:0 0 14px;font-size:15.2px;line-height:1.6;color:${C.fgLighter}">${html}</p>`;

export const nota = (html: string) =>
  `<p class="e-mut" style="margin:0;font-size:12.5px;line-height:1.6;color:${C.fgMuted}">${html}</p>`;

/** Il pezzo di frase che deve pesare come un valore, non come prosa. */
export const forte = (s: string) =>
  `<strong class="e-fg" style="color:${C.fg};font-weight:600">${esc(s)}</strong>`;

/** Il bottone della home (.sb-btn): alto 38px, raggio 6px, peso 400, bordo
 *  sempre. Il raggio resta anche qui — su un controllo alto 38 un taglio da 10
 *  sarebbe più della metà del lato corto, ed è la regola scritta nel blocco
 *  «Lo smusso» di home.css: i comandi non si smussano. */
const vesteBottone = (primario: boolean) =>
  `display:inline-block;padding:8px 16px;border-radius:6px;font-family:${FONT};font-size:14px;font-weight:400;line-height:20px;` +
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

/** Il link azzurro del sito (.sb-link): niente sottolineato di riposo. */
export const link = (href: string, etichetta: string) =>
  `<a class="e-link" href="${esc(href)}" style="color:${C.brandTesto};text-decoration:none">${esc(etichetta)}</a>`;

/**
 * La lastra piccola dentro il corpo (la diagnostica, i riquadri di servizio).
 * Taglio da 10px e non da 18: la misura si sceglie dall'altezza, non dal ruolo.
 * Qui il rim è la tinta piena del bordo, non il gradiente: su un riquadro alto
 * un terzo della lastra la sfumatura non ha spazio per leggersi.
 */
export function riquadro(titolo: string, corpo: string): string {
  const dentro = `<div style="padding:14px 16px">
      <p class="e-mut" style="margin:0 0 10px;font-size:11.52px;letter-spacing:.12em;text-transform:uppercase;color:${C.fgMuted}">${esc(titolo)}</p>
      ${corpo}
    </div>`;
  return `<div style="margin-top:18px">${lastra(dentro, {
    taglio: CUT,
    rim: `background:${C.bordo}`,
    fondo: C.superficie100,
    classe: "e-slab",
    classeRim: "e-slab-rim",
  })}</div>`;
}
