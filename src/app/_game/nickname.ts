// ─── MOTORE GIOCHI · Validazione nickname (fonte unica) ─────────────────────
//
// Questo file è il MODELLO condiviso del motore giochi. Nato quando i giochi
// erano cinque (la stessa logica era copiata identica in più cartelle), oggi
// serve il solo Trivia, che re-esporta da qui.
//
// Regole:
//  • massimo 10 lettere
//  • vieta parolacce / cose scomode in QUALSIASI lingua (per quanto possibile)
//
// La LISTA delle parolacce non sta più qui: sta in lib/parolacce.ts, perché la
// usa anche /api/sponsor per le firme del libro dei donatori di /sostieni. Qui
// resta la regola del NICKNAME: una parola sola, senza spazi, quindi la
// parolaccia si cerca come sottostringa dell'intero nick.
import { normalizza, nicknameHaParolacce } from "../../../lib/parolacce";

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

  if (nicknameHaParolacce(value)) return fail("profanity", value);

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

export { normalizza as _normalizeForTest };
