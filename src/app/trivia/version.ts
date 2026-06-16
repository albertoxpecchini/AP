// Versione del gioco Trivia, iniettata da Vite a build-time (vedi vite.config.ts
// → define.__TRIVIA_VERSION__). Formato "1.<n-commit-su-trivia>", es. "1.37".
// In ambienti senza il define (test isolati) ripiega su "1.0".
declare const __TRIVIA_VERSION__: string | undefined;

export const TRIVIA_VERSION: string =
  typeof __TRIVIA_VERSION__ !== "undefined" ? __TRIVIA_VERSION__ : "1.0";
