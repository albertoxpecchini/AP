// ─────────────────────────────────────────────────────────────────────────────
// /soldi — i due numeri veri, e tutta l'aritmetica che ci sta in mezzo.
//
// La pagina non interroga nessuno: non c'è un'API della compagnia da chiamare,
// e un patrimonio non è un prezzo di borsa. Quello che c'è è un conto a TASSO
// FISSO, cioè l'unica cosa al mondo che si può davvero prevedere al secondo —
// basta conoscere un punto e il tasso, e il valore di ogni istante successivo
// è una formula, non una previsione.
//
// I punti noti sono due, e sono qui sotto. Tutto il resto — il contatore che
// scorre, il grafico, i traguardi — esce da loro.
// ─────────────────────────────────────────────────────────────────────────────

/** Un anno «gregoriano medio»: 365,2425 giorni. È il divisore di tutto. */
export const ANNO_MS = 365.2425 * 24 * 60 * 60 * 1000;

/**
 * I due rilevamenti veri, con il fuso scritto a mano.
 *
 * L'offset esplicito (+01:00 d'inverno, +02:00 d'ora legale) non è pignoleria:
 * `new Date(2026, 7, 24, 11, 41)` sarebbe «le 11:41 di chi guarda», e da Tokyo
 * l'ancora scivolerebbe di sette ore — cioè di qualche centesimo di euro. Con
 * l'offset il punto è lo stesso istante per tutto il pianeta.
 */
export const INIZIO = { t: Date.parse("2023-11-02T00:00:00+01:00"), v: 145000 };
export const ANCORA = { t: Date.parse("2026-08-24T11:41:00+02:00"), v: 154470.94 };

/**
 * Il tasso MISURATO, non dichiarato: quello che, applicato al primo punto, fa
 * uscire esattamente il secondo. Non è un'opinione sul futuro, è cos'è
 * successo — e infatti cade in mezzo fra il 2,10 e il 2,60 dichiarati, perché
 * il tasso retrocesso cambia di anno in anno.
 */
export const R_STORICO = Math.pow(ANCORA.v / INIZIO.v, ANNO_MS / (ANCORA.t - INIZIO.t)) - 1;

export type Tasso = { id: string; r: number; breve: string; titolo: string; nota: string };

/** Le quattro ipotesi selezionabili. La prima è quella che governa la pagina. */
export const TASSI: Tasso[] = [
  {
    id: "netto",
    r: 0.021,
    breve: "2,10 %",
    titolo: "netto di tutto",
    nota: "Il rendimento una volta tolto il trattenuto della compagnia e le imposte sul plusvalore in caso di riscatto. È quello che resta davvero in tasca, ed è l'ipotesi con cui la pagina conta.",
  },
  {
    id: "misurato",
    r: R_STORICO,
    breve: "2,28 %",
    titolo: "misurato",
    nota: "Non è una stima: è il tasso che, partito dai 145.000 € del 2 novembre 2023, fa arrivare esattamente ai 154.470,94 € del 24 agosto 2026. Quello che è successo, non quello che è stato promesso.",
  },
  {
    id: "l250",
    r: 0.025,
    breve: "2,50 %",
    titolo: "lordo imposte",
    nota: "Il minimo della forbice retrocessa all'assicurato per quest'anno: già al netto del trattenuto della compagnia, ancora al lordo delle imposte sull'eventuale plusvalore da riscatto.",
  },
  {
    id: "l260",
    r: 0.026,
    breve: "2,60 %",
    titolo: "lordo imposte",
    nota: "Il massimo della stessa forbice. Fra questa ipotesi e il 2,50 % ballano poco più di dodici euro al mese: la distanza fra le due è più piccola di quanto la forbice faccia sembrare.",
  },
];

export const TASSO_DEFAULT = "netto";

// ── Le formule ───────────────────────────────────────────────────────────────

/** Il valore all'istante `t` proiettando dall'ancora al tasso `r`. */
export const valore = (t: number, r: number) =>
  ANCORA.v * Math.pow(1 + r, (t - ANCORA.t) / ANNO_MS);

/** Il valore all'istante `t` risalendo dal primo punto al tasso misurato. */
export const valoreStorico = (t: number) =>
  INIZIO.v * Math.pow(1 + R_STORICO, (t - INIZIO.t) / ANNO_MS);

/**
 * La linea intera del grafico: fino all'ancora è il tratto misurato — passa per
 * i due punti veri, sempre, qualunque tasso si scelga sopra — e da lì in avanti
 * è la proiezione. Cambiare ipotesi non riscrive il passato.
 */
export const linea = (t: number, r: number) =>
  t <= ANCORA.t ? valoreStorico(t) : valore(t, r);

/** Quando il conto toccherà `obiettivo`, al tasso `r`. È la formula invertita. */
export const quando = (obiettivo: number, r: number) =>
  ANCORA.t + (Math.log(obiettivo / ANCORA.v) / Math.log(1 + r)) * ANNO_MS;

/** Quanto si guadagna in `ms` millisecondi partendo da `v`. Interesse composto. */
export const passo = (v: number, ms: number, r: number) =>
  v * (Math.pow(1 + r, ms / ANNO_MS) - 1);

// ── I ritmi ──────────────────────────────────────────────────────────────────

export const RITMI: { k: string; ms: number; dec: number }[] = [
  { k: "al secondo", ms: 1000, dec: 6 },
  { k: "al minuto", ms: 60_000, dec: 4 },
  { k: "all'ora", ms: 3_600_000, dec: 3 },
  { k: "al giorno", ms: 86_400_000, dec: 2 },
  { k: "alla settimana", ms: 7 * 86_400_000, dec: 2 },
  { k: "al mese", ms: ANNO_MS / 12, dec: 2 },
  { k: "all'anno", ms: ANNO_MS, dec: 2 },
];

// ── I traguardi ──────────────────────────────────────────────────────────────

export const DOPPIO = INIZIO.v * 2;

const SCALA = [
  155_000, 160_000, 165_000, 170_000, 175_000, 180_000, 190_000, 200_000,
  225_000, 250_000, DOPPIO, 300_000, 400_000, 500_000,
];

/** I prossimi traguardi ancora davanti al valore corrente. */
export const traguardi = (v: number, quanti = 6) =>
  SCALA.filter((s) => s > v)
    .sort((a, b) => a - b)
    .slice(0, quanti);

// ── Formattazione ────────────────────────────────────────────────────────────
//
// I formatter di Intl costano: costruirne uno nuovo a ogni fotogramma sarebbe
// il modo più elegante di far scaldare un telefono. Si costruiscono una volta
// sola e restano qui.

const NF_INT = new Intl.NumberFormat("it-IT");
const NF_EUR = new Map<number, Intl.NumberFormat>();

const eurFmt = (dec: number) => {
  let f = NF_EUR.get(dec);
  if (!f) {
    f = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
    NF_EUR.set(dec, f);
  }
  return f;
};

export const euro = (v: number, dec = 2) => eurFmt(dec).format(v);
export const numero = (v: number) => NF_INT.format(v);

const NF_PCT = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const percento = (r: number) => NF_PCT.format(r * 100) + " %";

/**
 * Il numero grande spezzato nei tre pezzi che la testata disegna con tre pesi
 * diversi: gli euro, i centesimi, e la coda di quattro decimali — l'unica parte
 * davvero visibile in movimento, perché sotto al centesimo si muove tutto e
 * sopra non si muove quasi niente.
 *
 * `toFixed` fa il riporto da sé: a 154470,9999996 restituisce 154471.000000, e
 * il caso limite non va rincorso a mano.
 */
export function pezzi(v: number) {
  const [i, d] = v.toFixed(6).split(".");
  return { intero: NF_INT.format(Number(i)), cent: d.slice(0, 2), coda: d.slice(2) };
}

const DATA_LUNGA = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });
const DATA_CORTA = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
const ORA = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });

export const dataLunga = (t: number) => DATA_LUNGA.format(t);
export const dataCorta = (t: number) => DATA_CORTA.format(t);
export const ora = (t: number) => ORA.format(t);

/** «fra 2 mesi», «fra 1 anno e 4 mesi», «fra 11 anni». Niente precisione finta. */
export function fra(ms: number): string {
  if (ms <= 0) return "già passato";
  const giorni = ms / 86_400_000;
  if (giorni < 1) return "entro oggi";
  if (giorni < 45) return `fra ${Math.round(giorni)} giorni`;
  const mesi = Math.round(ms / (ANNO_MS / 12));
  if (mesi < 24) return `fra ${mesi} mesi`;
  const anni = Math.floor(ms / ANNO_MS);
  const resto = Math.round((ms - anni * ANNO_MS) / (ANNO_MS / 12));
  if (resto === 0) return `fra ${anni} anni`;
  if (resto === 12) return `fra ${anni + 1} anni`;
  return `fra ${anni} anni e ${resto} ${resto === 1 ? "mese" : "mesi"}`;
}

/** Il conto alla rovescia del primo traguardo, già spezzato per essere disegnato. */
export function rovescio(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    gg: Math.floor(s / 86400),
    hh: Math.floor((s % 86400) / 3600),
    mm: Math.floor((s % 3600) / 60),
    ss: s % 60,
  };
}

/** Durata trascorsa, per il cronometro «da quando sei qui». */
export function trascorso(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const due = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${due(mm)}:${due(ss)}` : `${due(mm)}:${due(ss)}`;
}
