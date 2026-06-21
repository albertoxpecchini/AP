// ─── MOTORE GIOCHI · Validazione nickname (fonte unica) ─────────────────────
//
// Questo file è il MODELLO condiviso da tutti i giochi (Trivia, Angoli, Mappa,
// Parole, Movimento, …). Prima la stessa logica era copiata identica in
// angoli/nickname.ts e parole/nickname.ts (127 righe × 2) e re-esportata da
// trivia/ e mappa/. Ora vive qui una volta sola: ogni gioco re-esporta da qui.
//
// Regole:
//  • massimo 10 lettere
//  • vieta parolacce / cose scomode in QUALSIASI lingua (per quanto possibile)
//
// Una lista "perfetta e completa" in tutte le lingue non esiste; qui usiamo un
// blocklist ampio (italiano, inglese, spagnolo, francese, tedesco, portoghese,
// e alcuni termini molto diffusi in altre lingue) + normalizzazione anti-furbi
// (leetspeak, lettere ripetute, accenti) + match su sottostringa, così becchiamo
// anche le parole "nascoste" dentro al nickname (es. "xXcazzoXx").

// Normalizza per il confronto: minuscolo, niente accenti, leet → lettere,
// rimuove tutto ciò che non è a-z, e collassa lettere ripetute (caaazzo→cazo…).
function normalize(s: string): string {
  let t = s.toLowerCase();
  // toglie accenti / diacritici
  t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // leetspeak comune
  const leet: Record<string, string> = {
    "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
    "8": "b", "9": "g", "@": "a", "$": "s", "!": "i", "+": "t",
    "€": "e", "£": "l",
  };
  t = t.replace(/[013457894@$!+€£]/g, c => leet[c] ?? c);
  // solo lettere
  t = t.replace(/[^a-z]/g, "");
  // collassa ripetizioni (aaa → a) per evitare l'aggiramento con doppie lettere
  t = t.replace(/(.)\1{1,}/g, "$1");
  return t;
}

// Blocklist (forma già "collassata"/normalizzata dove utile).
// Match su SOTTOSTRINGA della stringa normalizzata.
const BAD_SUBSTRINGS: string[] = [
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

// Parole "esatte" particolarmente corte/ambigue: vietate solo se il nick INTERO
// (normalizzato) coincide, per non bocciare nick legittimi che le contengono.
const BAD_EXACT: string[] = [
  "ass", "cu", "pd", "kkk", "sex", "xxx", "porn", "gay", "fck", "wtf", "stfu",
  "fu", "fuk", "fk", "nig", "neg",
];

export type NickError =
  | "empty"
  | "too-long"
  | "invalid-chars"
  | "profanity";

export interface NickCheck {
  ok: boolean;
  error?: NickError;
  message?: string;
  value: string; // valore "pulito" (trim) da usare se ok
}

const MESSAGES: Record<NickError, string> = {
  "empty": "Inserisci un nickname",
  "too-long": "Massimo 10 lettere",
  "invalid-chars": "Solo lettere e numeri",
  "profanity": "Nickname non consentito",
};

/**
 * Valida un nickname.
 *  • 1–10 caratteri
 *  • solo lettere/numeri (niente spazi/simboli → niente trucchi)
 *  • nessuna parolaccia (filtro multilingua su forma normalizzata)
 */
export function checkNickname(raw: string): NickCheck {
  const value = raw.trim();

  if (!value) return fail("empty", value);
  if (value.length > 10) return fail("too-long", value);
  // lettere (anche accentate/unicode) + numeri, niente spazi né simboli
  if (!/^[\p{L}\p{N}]+$/u.test(value)) return fail("invalid-chars", value);

  const norm = normalize(value);

  if (norm && BAD_EXACT.includes(norm)) return fail("profanity", value);
  for (const bad of BAD_SUBSTRINGS) {
    if (norm.includes(bad)) return fail("profanity", value);
  }

  return { ok: true, value };
}

function fail(error: NickError, value: string): NickCheck {
  return { ok: false, error, message: MESSAGES[error], value };
}

// ─── Storage del nickname (per-gioco, una sola implementazione) ──────────────
//
// Ogni gioco salva il proprio nick con una chiave diversa ("trivia-nick",
// "mappa-nick", …) ma la logica è identica. `makeNickStorage` la fabbrica una
// volta: il gioco passa solo la sua chiave.
export interface NickStorage {
  getStoredNick: () => string;
  storeNick: (nick: string) => void;
}

export function makeNickStorage(key: string): NickStorage {
  return {
    getStoredNick() {
      try { return (localStorage.getItem(key) || "").slice(0, 10); } catch { return ""; }
    },
    storeNick(nick: string) {
      try { localStorage.setItem(key, nick.slice(0, 10)); } catch {}
    },
  };
}

export { normalize as _normalizeForTest };
