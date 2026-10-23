// Le icone della chat col bot (chat.js): niente emoji di sistema, solo le nostre, disegnate da gpt-image-2 su Replicate
// (tools/pzkko/fogli.js, i fogli «chat-*») e scontornate in art/chat-<foglio>/<nome>.webp. Nel testo del bot si scrive
// «:canna:» e diventa <img class="emo">. Questo elenco è l'unica lista dei pezzi: fogli.js lo importa per sapere cosa
// disegnare in ogni cella, così un'icona nuova si aggiunge qui e basta (poi `node tools/pzkko/immagini.mjs genera chat-…`).

export const FOGLI_CHAT = {
  // il bot: la chiocciola della banca $pzk (quella delle banconote) con gli occhiali da sole, in otto umori
  'chat-bot': ['bot', 'bot-ride', 'bot-arrabbiato', 'bot-morto', 'bot-occhiolino', 'bot-triste', 'bot-pensa', 'bot-ricco'],
  // gli attrezzi e le cose del negozio
  'chat-attrezzi': ['canna', 'esca', 'fionda', 'fucile', 'pala', 'telefono', 'cornetto', 'caffe', 'lattina', 'mortadella', 'gratta', 'cassa-comune', 'cassa-rara', 'cassa-gonzaga', 'zaino', 'sacco'],
  // quello che si pesca nel Mincio
  'chat-pesci': ['alborella', 'cavedano', 'persico', 'carpa', 'luccio', 'pescegatto', 'anguilla', 'gambero', 'siluro', 'scarpa', 'carpa-oro', 'trota', 'tinca', 'lucioperca', 'rana', 'bottiglia'],
  // quello che si caccia
  'chat-animali': ['nutria', 'piccione', 'fagiano', 'lepre', 'anatra', 'cinghiale', 'zanzara', 'drago', 'volpe', 'riccio', 'cervo', 'cornacchia'],
  // quello che si scava
  'chat-reperti': ['verme', 'formica', 'moneta-virgilio', 'anfora', 'osso', 'bottone', 'chiave-vecchia', 'tappo', 'fossile', 'tesoro', 'radice', 'sasso'],
  // stati e reazioni
  'chat-stati': ['pzk', 'eur', 'xp', 'livello', 'clessidra', 'teschio', 'trofeo', 'regalo', 'si', 'no', 'fuoco', 'sirena', 'lucchetto', 'cuore', 'banconota', 'fulmine'],
  // la slot
  'chat-slot': ['ciliegia', 'limone', 'sette', 'campana', 'diamante', 'chiocciola-oro', 'bar', 'trifoglio', 'anguria', 'uva', 'stella', 'dado'],
  // i giochi
  'chat-giochi': ['carte', 'roulette', 'mina', 'gemma', 'testa', 'croce', 'dadi', 'quiz'],
  // lo shop (23.10), pezzi citati da Alberto nelle chat: il cibo e le bevande…
  'chat-cibo': ['pzk-kola', 'estathe', 'frutti-bosco', 'zucca', 'tortelli', 'grissini', 'ramen', 'sbrisolona', 'mostarda', 'pomodoro'],
  // …le cose (i volantini, gli annunci, gli scontrini)…
  'chat-roba': ['eastpak', 'ciao-px', 'landini', 'stampante', 'iphone-duo', 'stufa', 'bonsai', 'penne-bic', 'tucson', 'manuale-landini'],
  // …e le cose di pzk (la spazzatura del brand, la porta, il neon, il wallet)
  'chat-pzk': ['luckypzkko', 'gomma', 'tombino', 'lucchettone', 'citofono', 'pzkkonet', 'portachiavi', 'petizione', 'neon', 'portafoglio', 'pager', 'peluche'],
  // le app del cercapersone grande (telefono/): piastrelle adesivo intere, e i tre tasti della barra del cellulare
  'chat-app': ['app-chat', 'app-shop', 'app-sfide', 'app-quiz', 'app-quest', 'app-giocatori', 'app-zaino', 'app-foto', 'app-banca', 'app-home', 'app-indietro', 'app-chiudi'],
  // i mestieri
  'chat-mestieri': ['rider', 'cameriere', 'barista', 'bidello', 'salumiere', 'tatuatore', 'streamer', 'sviluppatore', 'prof', 'influencer', 'avvocato', 'sindaco'],
}

/** nome → foglio (cartella in art/). */
export const DOVE = Object.fromEntries(Object.entries(FOGLI_CHAT).flatMap(([f, pezzi]) => pezzi.map((p) => [p, f])))

export const esiste = (nome) => nome in DOVE
export const src = (nome) => `/art/${DOVE[nome]}/${nome}.webp`
/** L'icona come <img> (classe emo: alta come una riga di testo; «grande» per le vignette). */
export const icona = (nome, classe = 'emo') => (esiste(nome) ? `<img class="${classe}" src="${src(nome)}" alt="${nome}" draggable="false">` : `<span class="emo manca" title="${nome}">${nome[0] ?? '?'}</span>`)
/** Il testo del bot con le :icone: al posto dei nomi fra due punti. */
export const conIcone = (testo) => String(testo).replace(/:([a-z0-9-]+):/g, (m, n) => (esiste(n) ? icona(n) : m))
