// ─── Trivia · Seed profilo LOCALE con dati random (solo test) ────────────────
//
// Genera un profilo giocatore finto in modalità "solo locale":
//   • account con nick + ID random (kit-account-nick, kit-players-local, trivia-nick)
//   • punteggi random in classifica (trivia-scores-local)
//   • pagelle random per argomento × tipo (trivia-grades-local)
//
// COME SI USA: apri il sito (dev o prod), F12 → Console, incolla TUTTO il file,
// Invio, poi ricarica la pagina. I dati locali si vedono solo se Supabase NON è
// configurato (VITE_SUPABASE_URL assente) — è il fallback "Solo locale".
// Per annullare: localStorage.removeItem(...) sulle 5 chiavi stampate in fondo.
//
// I formati replicano ESATTAMENTE ciò che scrivono/leggono:
//   src/lib/players.ts          (kit-account-nick, kit-players-local)
//   src/app/_game/leaderboardApi.ts  via trivia/leaderboardApi.ts (trivia-scores-local)
//   src/app/trivia/gradesApi.ts (trivia-grades-local, vedi recordLocal)
// Punteggio per domanda: BASE_POINTS 100 + bonus velocità 0–100 (Trivia.tsx).

(() => {
  // slug | titolo (da content/trivia/*.md). Ogni capitolo: 10 multipla, 10 V/F, 5 aperte.
  const CHAPTERS = [
    ["neoclassicismo", "Neoclassicismo"],
    ["teatro-alla-scala", "Teatro alla Scala di Milano"],
    ["padiglione-brighton", "Padiglione Reale di Brighton"],
    ["eclettismo", "Architettura eclettica"],
    ["architettura-del-ferro", "Architettura del ferro e ponti"],
    ["crystal-palace", "Crystal Palace"],
    ["torre-eiffel", "Torre Eiffel"],
    ["parigi-haussmann", "Parigi di Haussmann"],
    ["opera-parigi", "Opéra di Parigi (Palais Garnier)"],
    ["scuola-di-chicago", "Scuola di Chicago e grattacieli"],
    ["art-nouveau-bruxelles", "Art Nouveau a Bruxelles"],
    ["art-nouveau-francia", "Art Nouveau in Francia"],
    ["liberty-italia", "Liberty in Italia"],
    ["modernismo-catalano", "Modernismo catalano e Gaudí"],
    ["sagrada-familia", "Sagrada Família"],
    ["casa-batllo", "Casa Batlló"],
    ["casa-mila", "Casa Milà – La Pedrera"],
    ["fabbrica-aeg", "Fabbrica di turbine AEG"],
    ["bauhaus", "Stabilimento Fagus e Bauhaus"],
    ["movimento-moderno", "Movimento moderno"],
    ["villa-savoye", "Villa Savoye"],
    ["padiglione-barcellona", "Padiglione di Barcellona"],
    ["fallingwater", "Casa sulla cascata (Fallingwater)"],
    ["razionalismo-italia", "Razionalismo in Italia"],
    ["terragni-como", "Novocomum e Casa del Fascio"],
    ["unite-marsiglia", "Unità di abitazione di Marsiglia"],
    ["ronchamp", "Cappella di Notre-Dame du Haut (Ronchamp)"],
    ["alvar-aalto", "Architetture di Alvar Aalto"],
    ["guggenheim-ny", "Solomon R. Guggenheim Museum"],
    ["san-cataldo", "Cimitero di San Cataldo"],
    ["centre-pompidou", "Centre Georges Pompidou"],
    ["millennium-dome", "Millennium Dome"],
    ["auditorium-roma", "Auditorium Parco della Musica"],
    ["citta-arti-scienze", "Città delle Arti e delle Scienze"],
    ["maxxi", "MAXXI"],
    ["mediopadana", "Stazione Mediopadana e ponti di Calatrava"],
    ["bosco-verticale", "Bosco Verticale"],
    ["citylife", "Quartiere CityLife"],
    ["architettura-contemporanea", "Architettura contemporanea"],
  ];
  const TYPE_TOTALS = { "multipla": 10, "vero-falso": 10, "aperta": 5 };
  const TYPES = Object.keys(TYPE_TOTALS);

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[rnd(0, arr.length - 1)];
  const daysAgoIso = (d) => new Date(Date.now() - d * 864e5 - rnd(0, 864e5)).toISOString();

  // ── 1) Profilo: nick random (max 10 char, solo lettere/numeri) + ID random ──
  const nick = (pick(["Nova", "Gufo", "Lampo", "Perla", "Falco", "Vela", "Rondine", "Brina", "Sasso", "Nebbia"])
    + rnd(1, 99)).slice(0, 10);
  const playerId = rnd(1000, 999999);
  const nowIso = new Date().toISOString();

  localStorage.setItem("kit-account-nick", nick);
  localStorage.setItem("trivia-nick", nick);
  {
    let list = [];
    try { list = JSON.parse(localStorage.getItem("kit-players-local") || "[]"); } catch {}
    if (!Array.isArray(list)) list = [];
    list = list.filter(p => (p.nick || "").toLowerCase() !== nick.toLowerCase());
    list.unshift({ id: playerId, nick, created_at: daysAgoIso(rnd(10, 60)), last_seen: nowIso });
    localStorage.setItem("kit-players-local", JSON.stringify(list.slice(0, 200)));
  }

  // Capitoli "giocati" da questo profilo (sottoinsieme random).
  const played = [...CHAPTERS].sort(() => Math.random() - 0.5).slice(0, rnd(8, 16));

  // ── 2) Classifica: 1–3 partite random per capitolo giocato ──────────────────
  // ScoreRow: { id, nick, score, chapter, accuracy, best_streak, created_at }
  const scores = [];
  let rowId = Date.now();
  for (const [slug] of played) {
    for (let g = rnd(1, 3); g > 0; g--) {
      const total = 25;                                  // partita su tutto il capitolo
      const correct = rnd(Math.floor(total * 0.4), total);
      const accuracy = Math.round((correct / total) * 100);
      let score = 0;
      for (let i = 0; i < correct; i++) score += 100 + rnd(0, 100);  // base + bonus velocità
      scores.push({
        id: rowId++,
        nick, score, chapter: slug, accuracy,
        best_streak: rnd(Math.min(2, correct), correct),
        created_at: daysAgoIso(rnd(0, 30)),
      });
    }
  }
  {
    let prev = [];
    try { prev = JSON.parse(localStorage.getItem("trivia-scores-local") || "[]"); } catch {}
    if (!Array.isArray(prev)) prev = [];
    localStorage.setItem("trivia-scores-local", JSON.stringify([...scores, ...prev].slice(0, 100)));
  }

  // ── 3) Pagella: voti random per (capitolo × tipo), record + ultimo coerenti ─
  // GradeRow locale (vedi recordLocal in gradesApi.ts): niente nick_key.
  const result = (total) => {
    const correct = rnd(Math.floor(total * 0.3), total);
    return {
      correct, total,
      accuracy: Math.round((correct / total) * 100),
      ms: total * rnd(3000, 15000),                      // 3–15 s a domanda
    };
  };
  const grades = [];
  for (const [slug, title] of played) {
    const types = [...TYPES].sort(() => Math.random() - 0.5).slice(0, rnd(1, 3));
    for (const type of types) {
      const a = result(TYPE_TOTALS[type]);
      const b = result(TYPE_TOTALS[type]);
      // record = il migliore (accuracy più alta; a parità vince il tempo minore)
      const bestIsA = a.accuracy > b.accuracy || (a.accuracy === b.accuracy && a.ms <= b.ms);
      const best = bestIsA ? a : b;
      const last = pick([a, b]);                         // l'ultimo può anche essere il record
      const lastAt = daysAgoIso(rnd(0, 7));
      grades.push({
        nick, arg_key: slug, argomento: title, type,
        best_accuracy: best.accuracy, best_correct: best.correct, best_total: best.total,
        best_ms: best.ms, best_at: daysAgoIso(rnd(7, 30)),
        last_accuracy: last.accuracy, last_correct: last.correct, last_total: last.total,
        last_ms: last.ms, last_at: lastAt,
        updated_at: lastAt,
      });
    }
  }
  {
    let prev = [];
    try { prev = JSON.parse(localStorage.getItem("trivia-grades-local") || "[]"); } catch {}
    if (!Array.isArray(prev)) prev = [];
    prev = prev.filter(r => (r.nick || "").toLowerCase() !== nick.toLowerCase());
    localStorage.setItem("trivia-grades-local", JSON.stringify([...grades, ...prev].slice(0, 500)));
  }

  console.log(
    `✅ Profilo locale creato\n` +
    `   nick: ${nick}  ·  id: ${playerId}\n` +
    `   partite in classifica: ${scores.length} su ${played.length} capitoli\n` +
    `   voti in pagella: ${grades.length}\n` +
    `Chiavi scritte: kit-account-nick, trivia-nick, kit-players-local, trivia-scores-local, trivia-grades-local\n` +
    `Ricarica la pagina per vederlo (funziona in modalità "Solo locale").`
  );
})();
