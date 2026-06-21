// Validazione nickname condivisa con gli altri giochi (fonte unica nel motore
// src/app/_game). Qui resta solo la chiave di storage propria del gioco.
import { makeNickStorage } from "../_game/nickname";
export { checkNickname, type NickCheck, type NickError } from "../_game/nickname";

export const { getStoredNick, storeNick } = makeNickStorage("mappa-nick");
