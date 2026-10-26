// Le icone della chat col bot (chat.js) e del cercapersone: niente emoji di sistema, solo le nostre, in art/chat-<foglio>/<nome>.webp.
// Dal 26.10 TUTTE a pixel, di retro-diffusion/rd-plus su Replicate, col bordo bianco dell'adesivo e pochi dettagli (Alberto:
// «tieni il modello per sempre»): tools/pzkko/pixel.mjs, una predizione per icona (prima erano fogli di gpt-image-2, di cui
// restano le descrizioni in tools/pzkko/fogli-chat.js, che pixel.mjs usa come prompt). Nel testo del bot si scrive «:canna:»
// e diventa <img class="emo">. Questo elenco è l'unica lista dei pezzi: un'icona nuova si aggiunge qui e in pixel.mjs (o
// nelle descrizioni di fogli-chat.js), poi `node tools/pzkko/pixel.mjs <nome>`.

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
  // la piastrella di virtual (23.10 sera; dal 26.10 a pixel come le altre: tools/pzkko/virtual/icona.mjs, il disegno a
  // mano di prima, non va più lanciato)
  'chat-app2': ['app-virtual'],
  // le piastrelle delle app nuove (26.10): il profilo, l'account e le app veloci (conversioni, calcolatrice da geometra,
  // il compilatore C, la cucina del Mincio). Queste e gli avatar NON sono di gpt-image-2: sono a pixel, di
  // retro-diffusion/rd-plus, una per una (tools/pzkko/pixel.mjs, che ha i prompt; fogli-chat.js non le rifà)
  'chat-app3': ['app-profilo', 'app-account', 'app-conversioni', 'app-calcolatrice', 'app-compilatore', 'app-cucina', 'app-rapina', 'app-lavatrice', 'app-decifratore'],
  // la roba degli uffici (26.10): quello che passa sul nastro dello spazzino (testi.js, UFFICIO)
  'chat-ufficio': ['cartaccia', 'lattina-vuota', 'graffette', 'tazza', 'mouse', 'cuffie', 'orologio', 'chiavetta', 'wallet-pzk'],
  // la cucina del Mincio (26.10, telefono/app/cucina.js): gli ingredienti, gli attrezzi e i piatti che non c'erano
  'chat-cucina': ['farina', 'uova', 'burro', 'mandorle', 'riso', 'salamella', 'amaretti', 'parmigiano', 'prezzemolo', 'coltello', 'mattarello', 'mestolo', 'pentola', 'forno', 'risotto', 'luccio-salsa'],
  // gli avatar del profilo (26.10): i personaggi fra cui scegliere la propria faccia (telefono/app/profilo.js)
  'chat-avatar': ['av-nutria', 'av-carpa', 'av-virgilio', 'av-rana', 'av-piccione', 'av-zanzara', 'av-zucca', 'av-gatto', 'av-gonzaga', 'av-tortello', 'av-pager', 'av-nonna'],
  // l'app Miniera (23.10; dal 26.10 di rd-plus come le altre: tools/pzkko/miniera-icona.mjs, il disegno in codice di
  // prima, non va più lanciato)
  'chat-miniera': ['app-miniera'],
  // i mestieri
  'chat-mestieri': ['rider', 'cameriere', 'barista', 'bidello', 'salumiere', 'tatuatore', 'streamer', 'sviluppatore', 'prof', 'influencer', 'avvocato', 'sindaco', 'imbianchino', 'pizzaiolo', 'meccanico', 'bagnino', 'spazzino', 'corriere', 'biscazziere', 'contrabbandiere'],
}

/** nome → foglio (cartella in art/). */
export const DOVE = Object.fromEntries(Object.entries(FOGLI_CHAT).flatMap(([f, pezzi]) => pezzi.map((p) => [p, f])))

export const esiste = (nome) => nome in DOVE
export const src = (nome) => `/art/${DOVE[nome]}/${nome}.webp`
/** L'icona come <img> (classe emo: alta come una riga di testo; «grande» per le vignette). */
export const icona = (nome, classe = 'emo') => (esiste(nome) ? `<img class="${classe}" src="${src(nome)}" alt="${nome}" draggable="false">` : `<span class="emo manca" title="${nome}">${nome[0] ?? '?'}</span>`)
/** Il testo del bot con le :icone: al posto dei nomi fra due punti. */
export const conIcone = (testo) => String(testo).replace(/:([a-z0-9-]+):/g, (m, n) => (esiste(n) ? icona(n) : m))
