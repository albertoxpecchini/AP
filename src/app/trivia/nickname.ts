// Validazione nickname condivisa con gli altri giochi (stesso filtro
// parolacce multilingua). Qui cambia solo la chiave di storage.
export { checkNickname, type NickCheck, type NickError } from "../angoli/nickname";

const NICK_KEY = "trivia-nick";

export function getStoredNick(): string {
  try { return (localStorage.getItem(NICK_KEY) || "").slice(0, 10); } catch { return ""; }
}
export function storeNick(nick: string) {
  try { localStorage.setItem(NICK_KEY, nick.slice(0, 10)); } catch {}
}
