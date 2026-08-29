// ─── Filtro del testo pubblico · parolacce, insulti e spam (client + server) ──
//
// Lista UNICA del sito. Nasce nel motore giochi (la validazione dei nickname del
// Trivia) e vive qui perché adesso la usano in due:
//
//   · src/app/_game/nickname.ts  → nickname di gioco (una parola, max 10 lettere)
//   · api/sponsor.ts             → firme del libro di /sostieni (testo libero)
//
// Sta in /lib e non in /src per lo stesso motivo di serverSecurity.ts: /api la
// deve poter importare (le funzioni Vercel non guardano dentro il bundle del
// client). A differenza di quello, però, questo file non ha dipendenze — né di
// Node né del browser — quindi gira da tutt'e due le parti.
//
// Perché due funzioni diverse e non una:
//   · nel NICKNAME non ci sono spazi, quindi la parolaccia si cerca come
//     sottostringa dell'intero nick ("xXcazzoXx" va preso);
//   · in un TESTO libero la stessa regola diventa un disastro — "significa"
//     contiene "fica", "reputazione" contiene "puta", "computer" contiene
//     "pute", "conoscere" contiene "cono". Lì si guarda parola per parola, con
//     tolleranza per le desinenze (cazzi, merde, stronzate, fucking).
//
// Una lista "perfetta e completa" in tutte le lingue non esiste, e non è quello
// che serve: serve che il libro dei donatori non diventi un muro di insulti.

// ─── Normalizzazione ─────────────────────────────────────────────────────────
// Minuscolo, niente accenti, leet → lettere, via tutto ciò che non è a-z, e
// lettere ripetute collassate (caaazzo → cazo), così le scritture "furbe"
// arrivano al confronto nella stessa forma di quelle normali.
export function normalizza(s: string): string {
  let t = s.toLowerCase();
  // toglie accenti / diacritici
  t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // leetspeak comune
  const leet: Record<string, string> = {
    "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
    "8": "b", "9": "g", "@": "a", "$": "s", "!": "i", "+": "t",
    "€": "e", "£": "l",
  };
  t = t.replace(/[013457894@$!+€£]/g, (c) => leet[c] ?? c);
  // solo lettere
  t = t.replace(/[^a-z]/g, "");
  // collassa ripetizioni (aaa → a) per evitare l'aggiramento con doppie lettere
  t = t.replace(/(.)\1{1,}/g, "$1");
  return t;
}

// ─── Le liste ────────────────────────────────────────────────────────────────
// Forma già "collassata"/normalizzata dove utile. Nel nickname si cercano come
// SOTTOSTRINGA; nel testo libero come parola intera (vedi più sotto).
export const PAROLACCE: string[] = [
  // ── Italiano ──
  "cazo", "cazzo", "stronzo", "stronza", "merda", "minchia", "mincia", "fica", "figa",
  "puttana", "putana", "troia", "vafanculo", "vaffanculo", "fanculo", "culo", "coglione",
  "coglion", "bastardo", "porcodio", "diocane", "dio cane", "porco", "frocio", "froci",
  "negro", "ricchione", "zoccola", "pompino", "sega", "scopare", "inculo", "incula",
  "tette", "pirla", "bocchino", "sborra", "cesso", "merdoso", "stronz",
  // ── Inglese ──
  "fuck", "fuk", "fck", "shit", "sht", "bitch", "btch", "bich", "asshole", "ashole",
  "ass", "dick", "dik", "cock", "cunt", "pussy", "pusy", "whore", "slut", "bastard",
  "nigger", "niger", "nigga", "niga", "fag", "faggot", "fagot", "retard", "rape",
  "rapist", "cum", "jizz", "boob", "tits", "tit", "penis", "vagina", "wank", "twat",
  "bollocks", "bugger", "prick", "douche", "motherfuker", "motherfucker", "mofo",
  "nazi", "hitler", "kkk", "isis", "terorist", "terrorist",
  // ── Spagnolo ──
  "mierda", "puta", "puto", "cabron", "cabrun", "joder", "coño", "cono", "verga",
  "pendejo", "pendeja", "chinga", "chingar", "pinche", "marica", "maricon", "polla",
  "gilipollas", "zorra", "culero", "concha", "pija",
  // ── Francese ──
  "merde", "putain", "putin", "salope", "connard", "conard", "conasse", "enculer",
  "encule", "bite", "couille", "salaud", "pute", "nique", "niquer", "batard", "pd",
  "tapete", "negre",
  // ── Tedesco ──
  "scheise", "scheisse", "scheiss", "arschloch", "arsch", "fotze", "wichser", "hure",
  "hurensohn", "schwul", "schwuchtel", "miststuck", "schlampe", "fick", "ficken",
  "schwanz",
  // ── Portoghese ──
  "merda", "caralho", "caralo", "porra", "puta", "buceta", "cu", "foder", "viado",
  "viadinho", "piroca", "caceta", "vagabunda", "corno", "boceta", "fudido", "bosta",
  // ── Vari (russo translit, arabo translit, ecc.) ──
  "blyat", "blyad", "suka", "pizdec", "pizda", "khuy", "huy", "yebat", "ebat",
  "kurwa", "chuj", "jebac", "kutas", "skurwysyn", "sharmuta", "kus", "zamel",
  "gandu", "madarchod", "behenchod", "chutiya", "lund", "randi", "kutta",
  "anjing", "kontol", "memek", "bangsat", "ngentot", "babi",
  "puki", "kanina", "lanjiao",
];

// Parole corte o ambigue: vietate solo se coincidono con TUTTA la parola (nel
// nickname: con tutto il nick). "sex" dentro "sexteto" non è un insulto.
export const PAROLACCE_ESATTE: string[] = [
  "ass", "cu", "pd", "kkk", "sex", "xxx", "porn", "gay", "fck", "wtf", "stfu",
  "fu", "fuk", "fk", "nig", "neg",
];

// ─── Nickname: sottostringa su tutta la parola ───────────────────────────────
/** Vero se il nickname contiene una parolaccia, anche nascosta ("xXcazzoXx"). */
export function nicknameHaParolacce(nick: string): boolean {
  const norm = normalizza(nick);
  if (!norm) return false;
  if (PAROLACCE_ESATTE.includes(norm)) return true;
  return PAROLACCE.some((bad) => norm.includes(bad));
}

// ─── Testo libero: parola per parola ─────────────────────────────────────────
//
// Radice = la parola senza la vocale finale. Serve a far combaciare le
// desinenze senza scrivere nella lista tutte le forme flesse (cazzi→caz come
// cazzo, merde→merd come merda, troie→troi come troia, coglioni→coglion). Il
// confronto è per UGUAGLIANZA, mai per sottostringa: è quello che salva
// "specifico", "significa", "computer" e compagnia.
//
// Si confrontano solo parole che finiscono TUTT'E DUE per vocale, cioè due
// forme flesse: senza questa condizione "con" (radice "con") finiva addosso a
// "cono" e mezza lingua italiana diventava una parolaccia.
const finisceInVocale = (x: string) => /[aeiou]$/.test(x);
const radice = (x: string) => x.replace(/[aeiou]$/, "");

// Sotto le tre lettere una parolaccia non è più distinguibile da una parola
// qualunque ("as" da "ass", "cu", "pd", "fu"): nel testo libero si lasciano
// perdere, nel nickname continuano a valere.
// Due termini stranieri che in italiano sono parole di tutti i giorni: nel
// testo libero si rinuncia a loro (nel nickname restano vietati). Sono lo
// spagnolo "coño" → "cono" (che porta con sé "coni") e "polla" → "pola" (che
// porta con sé "polo"): un gelato o Marco Polo valgono più di un insulto in
// spagnolo su un sito scritto in italiano.
const AMBIGUI = new Set(["cono", "pola"]);

const TERMINI_TESTO = [...new Set([...PAROLACCE, ...PAROLACCE_ESATTE].map(normalizza))]
  .filter((b) => b.length >= 3 && !AMBIGUI.has(b));

// Seconda rete, per le parolacce spezzate a mano ("v a f f a n c u l o"): sul
// testo intero normalizzato, e solo con i termini lunghi — sotto le sei lettere
// un pezzo può ricadere a cavallo di due parole vere.
const TERMINI_LUNGHI = TERMINI_TESTO.filter((b) => b.length >= 6);

function parolaVietata(parola: string): boolean {
  const n = normalizza(parola);
  if (!n) return false;
  const inVocale = finisceInVocale(n);
  const rn = radice(n);
  for (const b of TERMINI_TESTO) {
    if (n === b) return true;
    // desinenza attaccata: cazzone, merdoso, fucking, bitches (max 3 lettere in più)
    if (b.length >= 4 && n.startsWith(b) && n.length - b.length <= 3) return true;
    // stessa radice: cazzi/cazzo, merde/merda, troie/troia
    if (inVocale && finisceInVocale(b)) {
      const rb = radice(b);
      if (rb.length >= 3 && rn === rb) return true;
    }
  }
  return false;
}

/** Vero se in un testo libero (nome, messaggio) c'è una parolaccia. */
export function testoHaParolacce(testo: string): boolean {
  if (!testo) return false;
  const parole = testo.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (parole.some(parolaVietata)) return true;
  const tutto = normalizza(testo);
  return TERMINI_LUNGHI.some((b) => tutto.includes(b));
}

// ─── Spam: link dove non devono esserci ──────────────────────────────────────
// Il nome e il messaggio del libro sono testo, non una vetrina: chi vuole
// lasciare un indirizzo ha il campo "Link" degli sponsor. Senza questo controllo
// il libro diventa in un pomeriggio una bacheca di pubblicità.
const LINK_RE = new RegExp(
  [
    "https?://",                       // indirizzo esplicito
    "www\\.",                          // www.qualcosa
    "\\b[a-z0-9-]{2,}\\.[a-z]{2,}/",   // dominio con percorso: bit.ly/xyz
    "\\b[a-z0-9-]+\\.(com|net|org|it|io|ru|xyz|top|shop|info|biz|link|click|online|site)\\b",
    "\\bt\\.me\\b",                    // telegram
    "@[a-z0-9_]{3,}",                  // menzione / handle
  ].join("|"),
  "i",
);

/** Vero se il testo contiene un indirizzo web, un dominio o una menzione. */
export function testoHaLink(testo: string): boolean {
  return Boolean(testo) && LINK_RE.test(testo);
}

/**
 * Ripulisce il link di uno sponsor: solo http/https, mai javascript: o data:
 * (finirebbe in un href della pagina). Ritorna l'indirizzo normalizzato, o null
 * se non è un indirizzo valido.
 */
export function linkPulito(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const candidato = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(candidato);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
