// Parole italiane di 5 lettere (senza accenti, solo A-Z).
// Usate sia come soluzioni possibili sia come tentativi validi.
// La lista si può ampliare liberamente: ogni voce deve essere lunga 5 lettere.

export const WORDS: string[] = [
  "amore", "amica", "amico", "amare", "avere", "altro", "altra", "anche", "animo",
  "acqua", "aereo", "arena", "aroma", "astro", "atomo", "orata", "ombra", "opera",
  "ostia", "obeso", "odore", "oliva", "osare", "ozono", "ovest", "ebano", "etica",
  "banca", "barca", "bocca", "borsa", "bagno", "bello", "bella", "bravo", "breve",
  "brodo", "bruno", "burro", "campo", "canto", "carta", "carne", "carro", "casse",
  "cento", "cielo", "circo", "corpo", "corsa", "corso", "costa", "crema", "croce",
  "cuore", "calza", "chilo", "cifra", "clima", "colle", "collo", "corda", "calma",
  "calmo", "dente", "dolce", "donna", "delta", "denso", "ditta", "festa", "fiume",
  "fiore", "folla", "fondo", "forma", "forno", "forte", "frase", "fuoco", "fango",
  "fauna", "felce", "ferro", "fetta", "fiaba", "fibra", "firma", "fisso", "folle",
  "fonte", "fossa", "frana", "fungo", "furto", "gamba", "gatto", "gente", "gioco",
  "gioia", "gomma", "gonna", "gradi", "grado", "grano", "greco", "guida", "gallo",
  "gemma", "genio", "gesto", "ghiro", "globo", "gnomo", "grido", "isola", "lampo",
  "latte", "legno", "letto", "libro", "linea", "lista", "lotta", "lungo", "ladro",
  "largo", "lardo", "legge", "lemma", "lento", "leone", "lepre", "lieve", "lince",
  "lordo", "lutto", "madre", "mamma", "mappa", "massa", "matto", "medio", "mente",
  "merce", "messa", "metro", "mezzo", "miele", "mondo", "monte", "morte", "mosca",
  "mossa", "motto", "magia", "magro", "malto", "marca", "marmo", "merlo", "mezza",
  "mille", "mirto", "mista", "misto", "molla", "molto", "morbo", "museo", "norma",
  "nonna", "nonno", "notte", "nuovo", "nuova", "nulla", "nuoto", "paese", "palla",
  "panca", "panno", "parco", "parte", "passo", "pasta", "patto", "pazzo", "pelle",
  "penna", "pesce", "pezzo", "piano", "piede", "pieno", "pizza", "ponte", "porta",
  "porto", "posta", "posto", "pozzo", "prato", "presa", "prete", "primo", "prima",
  "punto", "pacco", "padre", "palco", "panna", "parto", "pasto", "pazza", "perla",
  "pesca", "peste", "pezza", "picco", "pieve", "pinna", "pinza", "pista", "piuma",
  "plico", "poema", "pollo", "polso", "pompa", "porco", "porro", "preda", "prova",
  "pugno", "pulce", "punta", "quota", "quale", "quasi", "radio", "ragno", "rango",
  "razza", "reale", "regno", "resto", "ricco", "ricca", "ritmo", "rogna", "rombo",
  "rospo", "rossa", "rosso", "rotta", "rotto", "ruota", "ruolo", "sacco", "salto",
  "santo", "sasso", "scala", "scena", "scopo", "scuro", "secco", "segno", "selva",
  "senso", "serie", "serpe", "servo", "sesto", "sette", "sfida", "sogno", "soldi",
  "solco", "sonno", "sopra", "sorso", "sosta", "spada", "spesa", "sposa", "stato",
  "stile", "suono", "salsa", "scopa", "secca", "sedia", "selce", "sella", "serra",
  "sfera", "siepe", "soldo", "somma", "sonda", "sorte", "sotto", "spago", "spina",
  "spira", "stelo", "stima", "stiva", "succo", "suolo", "suora", "tasca", "tasto",
  "tempo", "tenda", "terra", "testa", "testo", "tetto", "tigre", "tomba", "torre",
  "torta", "tosse", "treno", "trono", "trota", "turno", "talpa", "tappo", "targa",
  "tarlo", "tasso", "tatto", "terme", "terzo", "tinta", "tizio", "tonno", "tordo",
  "torto", "trama", "trave", "tuono", "turbo", "tutto", "ugola", "ulivo", "umile",
  "umore", "unico", "unire", "usare", "uscio", "usato", "usura", "vacca", "valle",
  "vampa", "vanga", "varco", "vario", "vasca", "vento", "verde", "verso", "vetro",
  "viale", "vista", "volpe", "volto", "vuoto", "verbo", "verme", "vespa", "vetta",
  "vigna", "villa", "viola", "vizio", "zaino", "zampa", "zebra", "zucca", "zanna",
  "zappa", "zinco", "zitto", "zolla", "zuppa",
].filter((w) => w.length === 5);

// Insieme per la validazione dei tentativi (lookup O(1)).
export const WORD_SET = new Set(WORDS);

export function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}
