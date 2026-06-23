// ─────────────────────────────────────────────────────────────────────────────
// Schemi di studio · Letteratura italiana — Maturità 2026 (classe 5T).
//
// Un modulo per ogni autore / argomento del programma. Ogni modulo raccoglie:
//  · lead      → sintesi in 3 righe ("la cosa principale")
//  · facts     → fatti chiave (date, opere, movimento)
//  · concetti  → i termini-chiave da saper definire all'orale
//  · testi     → i testi effettivamente in programma
//  · collegamenti → ponti con altri autori per il colloquio
//  · domande   → le domande che la prof può fare all'orale, con risposta-modello
//
// Nei testi si può usare **grassetto** (reso da <strong> dal componente).
// Contenuti fedeli al programma; eventuali precisazioni sono nelle "note".
// ─────────────────────────────────────────────────────────────────────────────

export type QA = { q: string; a: string };
export type Fact = { value: string; label: string };
export type Concetto = { term: string; def: string };
export type Testo = { title: string; opera?: string; note?: string };

export type Modulo = {
  id: string;
  n: string;
  kicker: string;        // "Movimento" | "Autore" | "Avanguardia" | ...
  title: string;
  meta?: string;         // date / sottotitolo
  icon: string;          // chiave glyph (vedi Letteratura.tsx)
  lead: string;
  facts?: Fact[];
  concetti?: Concetto[];
  testi?: Testo[];
  collegamenti?: string[];
  domande: QA[];
};

export const MODULI: Modulo[] = [
  // ── 01 · Naturalismo ──────────────────────────────────────────────────────
  {
    id: "naturalismo",
    n: "01",
    kicker: "Movimento francese",
    title: "Naturalismo",
    meta: "Émile Zola · Francia, 1870–1880",
    icon: "flask",
    lead:
      `Corrente francese che applica al **romanzo** il **metodo scientifico**: lo scrittore osserva la realtà ` +
      `come uno **scienziato** e mostra come l'uomo sia determinato da **ereditarietà** e **ambiente sociale**. ` +
      `Ha una chiara **finalità sociale**: denunciare le condizioni delle classi popolari, con fiducia nel progresso.`,
    facts: [
      { value: "1840–1902", label: "Émile Zola, teorico del movimento" },
      { value: "Positivismo", label: "Base filosofica (Comte, Darwin, Taine)" },
      { value: "Rougon-Macquart", label: "Ciclo di 20 romanzi su una famiglia" },
      { value: "L'Assommoir", label: "1877 · il mondo degli operai parigini" },
    ],
    concetti: [
      { term: "Positivismo", def: "Fiducia assoluta nella scienza e nel progresso: solo ciò che è osservabile e sperimentabile è vero." },
      { term: "Determinismo", def: "Teoria di Taine: l'uomo è determinato da «razza, ambiente, momento». Non è libero, è il prodotto delle sue condizioni." },
      { term: "Romanzo sperimentale", def: "Zola: il romanziere è come uno scienziato che fa un esperimento — mette i personaggi in un ambiente e osserva gli effetti." },
      { term: "Finalità sociale", def: "Il Naturalismo denuncia le ingiustizie per spingere a riformarle: ha fede nel progresso e nella riforma della società." },
    ],
    testi: [
      { title: "Il romanzo sperimentale", opera: "saggio teorico (p. 32)", note: "Manifesto del metodo: lo scrittore-scienziato." },
      { title: "Gervasia all'Assommoir", opera: "da L'Assommoir", note: "Gervaise nell'osteria-distilleria: degrado e alcolismo del proletariato urbano." },
    ],
    collegamenti: [
      "→ Verismo: stesso metodo (impersonalità, ambienti popolari), ma Verga è pessimista e senza fiducia nel progresso",
      "→ Positivismo / Darwin: la base scientifica del movimento",
    ],
    domande: [
      { q: "Che cos'è il Naturalismo e da quale clima culturale nasce?", a: "È la corrente letteraria francese che nasce dal **Positivismo**: la fede nella scienza e nel progresso. Applica al romanzo il metodo scientifico e il **determinismo** di Taine (l'uomo è prodotto di razza, ambiente e momento)." },
      { q: "Spiega il «metodo sperimentale» applicato al romanzo.", a: "Per Zola il romanziere è come uno **scienziato**: osserva la realtà, colloca i personaggi in un ambiente e ne studia gli effetti, come in un esperimento di laboratorio. L'obiettivo è far emergere le leggi che governano l'uomo in società." },
      { q: "Qual è la funzione sociale del Naturalismo?", a: "Denunciare le condizioni delle **classi popolari** (operai, poveri) per spingere la società a riformarle. C'è fiducia che il progresso e la scienza possano migliorare la vita degli uomini." },
      { q: "Che cos'è il ciclo dei Rougon-Macquart?", a: "Un ciclo di 20 romanzi in cui Zola segue una **famiglia** attraverso le generazioni durante il Secondo Impero, per mostrare come ereditarietà e ambiente ne determinino i destini." },
      { q: "Presenta il brano «Gervasia all'Assommoir».", a: "Tratto da *L'Assommoir*, racconta la parabola di **Gervaise**, lavandaia parigina, e il degrado del mondo operaio segnato dall'**alcolismo** (l'*assommoir* è l'osteria-distilleria). Zola mostra l'ambiente senza filtri morali." },
    ],
  },

  // ── 02 · Verismo ──────────────────────────────────────────────────────────
  {
    id: "verismo",
    n: "02",
    kicker: "Movimento · Autore",
    title: "Verismo — Giovanni Verga",
    meta: "Catania, 1840 – 1922",
    icon: "anchor",
    lead:
      `Il Verismo è la versione **italiana** del Naturalismo, ambientata nel **Sud rurale**. Verga ne è il maestro: ` +
      `narra il mondo dei **vinti** con la tecnica dell'**impersonalità**. A differenza di Zola, però, non ha ` +
      `**fiducia nel progresso**: è profondamente **pessimista**.`,
    facts: [
      { value: "Verismo", label: "Versione italiana del Naturalismo (anni 1880)" },
      { value: "Impersonalità", label: "L'autore scompare: l'opera «si fa da sé»" },
      { value: "Ciclo dei Vinti", label: "5 romanzi previsti, 2 completati" },
      { value: "Pessimismo", label: "L'ideale dell'ostrica · la «fiumana» del progresso" },
    ],
    concetti: [
      { term: "Impersonalità", def: "L'autore non commenta e non giudica: l'opera deve sembrare «essersi fatta da sé». Il narratore scompare (eclissi dell'autore)." },
      { term: "Regressione del narratore", def: "Il narratore si «abbassa» al livello dei personaggi e ne assume il punto di vista, la mentalità e la lingua popolare." },
      { term: "Straniamento", def: "Capovolgimento dei valori: ciò che per noi è normale (la bontà) appare strano agli occhi del popolo, e viceversa. Es. Rosso Malpelo è «cattivo» perché è rosso." },
      { term: "Discorso indiretto libero", def: "I pensieri e le parole dei personaggi entrano nel racconto senza virgolette né «disse», fondendosi con la voce narrante." },
      { term: "Ideale dell'ostrica", def: "Chi si stacca dal «nido» (famiglia, tradizioni, paese) come l'ostrica dallo scoglio, viene divorato. Bisogna restare al proprio posto." },
      { term: "Ciclo dei Vinti", def: "Progetto di 5 romanzi sulla lotta per la vita in ogni classe sociale: I Malavoglia, Mastro-don Gesualdo, La Duchessa di Leyra, L'Onorevole Scipioni, L'Uomo di lusso (solo i primi due completati)." },
    ],
    testi: [
      { title: "Rosso Malpelo", opera: "da Vita dei campi", note: "Il ragazzo che lavora in cava; lo straniamento sulla bontà/cattiveria." },
      { title: "Il ritorno e l'addio di 'Ntoni", opera: "da I Malavoglia", note: "Il paesaggio partecipa allo stato d'animo del personaggio." },
      { title: "La roba", opera: "da Novelle rusticane", note: "Mazzarò e l'ossessione dell'accumulo: «roba mia, vientene con me!»." },
    ],
    collegamenti: [
      "→ Naturalismo: stesso metodo scientifico, ma Verga è pessimista e non crede nel progresso",
      "→ Scapigliatura: il «vero» di Praga (provocatorio, soggettivo) vs il «vero» oggettivo di Verga",
    ],
    domande: [
      { q: "Quali sono le differenze tra Naturalismo e Verismo?", a: "In comune: l'impersonalità, gli ambienti popolari, l'attenzione al «vero». Differenze: Zola crede nel **progresso** e ha una **finalità sociale** riformatrice; Verga è **pessimista**, non crede che la società possa migliorare. Inoltre Verga ambienta nel **Sud rurale** e usa la **regressione** linguistica nel mondo dei vinti." },
      { q: "Che cos'è l'impersonalità e con quali tecniche la realizza Verga?", a: "È la scomparsa dell'autore: l'opera deve sembrare «essersi fatta da sé». Verga la ottiene con la **regressione del narratore** (assume il punto di vista del popolo), lo **straniamento**, il **discorso indiretto libero** e l'**eclissi** della voce narrante." },
      { q: "Spiega l'ideale dell'ostrica e il pessimismo di Verga.", a: "Come l'ostrica muore se si stacca dallo scoglio, l'uomo che abbandona il «nido» (famiglia, tradizione, paese) viene travolto. Il progresso è una **«fiumana»** che porta avanti l'umanità ma lascia sul fondo i **vinti**: non c'è riscatto possibile." },
      { q: "Che cos'è il Ciclo dei Vinti?", a: "Un progetto di **5 romanzi** sulla «lotta per la vita» a tutti i livelli sociali, dal basso verso l'alto. Verga completò solo i primi due: **I Malavoglia** (i poveri pescatori) e **Mastro-don Gesualdo** (la roba e la scalata sociale)." },
      { q: "Analizza «Rosso Malpelo»: tema e tecnica dello straniamento.", a: "Racconta il lavoro disumano del ragazzo in una **cava di rena**. Lo **straniamento**: Malpelo è considerato cattivo solo perché ha i capelli rossi; il narratore popolare giustifica la crudeltà come legge naturale del mondo. Verga non commenta: lascia parlare quella mentalità." },
      { q: "I Malavoglia: la trama e la funzione del paesaggio nel brano del ritorno di 'Ntoni.", a: "La famiglia Toscano (i Malavoglia) è rovinata dal naufragio della *Provvidenza* e dai debiti. **'Ntoni**, il giovane che aveva lasciato il paese, torna ma ormai è un estraneo e riparte per sempre. Il **paesaggio** (la casa del nespolo, il mare) **partecipa** alla malinconia del personaggio: è lo specchio del suo stato d'animo." },
      { q: "«La roba»: il personaggio di Mazzarò e il finale.", a: "Mazzarò accumula terre e beni per tutta la vita: la **roba** diventa una vera ossessione, sostituisce ogni affetto. Nel finale, capendo di non poterla portare con sé nella morte, esce gridando «roba mia, vientene con me!» e ammazza i suoi animali: la roba lo ha posseduto, non viceversa." },
    ],
  },

  // ── 03 · Scapigliatura ──────────────────────────────────────────────────
  {
    id: "scapigliatura",
    n: "03",
    kicker: "Movimento",
    title: "Scapigliatura",
    meta: "Milano · 1860–1880 · Tarchetti, Praga, Boito",
    icon: "split",
    lead:
      `Gruppo di artisti **ribelli** e anticonformisti (la «bohème» italiana). Vivono il **dualismo** tra ideale e ` +
      `reale, attratti tanto dal bello quanto dal **brutto** e dal **malato**. Sono un **ponte** tra il Romanticismo ` +
      `e il Decadentismo, in polemica con la tradizione borghese e manzoniana.`,
    facts: [
      { value: "«Bohème»", label: "Scapigliatura = vita disordinata e ribelle" },
      { value: "Milano / Torino", label: "Centri del movimento" },
      { value: "Dualismo", label: "Lacerazione tra ideale e reale, bene e male" },
      { value: "Modelli", label: "Baudelaire, Poe, Hoffmann, Heine" },
    ],
    concetti: [
      { term: "Dualismo scapigliato", def: "Lacerazione interiore tra aspirazione all'ideale e attrazione per il vero, l'orrido, il proibito. L'artista è diviso, inquieto." },
      { term: "Estetica del brutto", def: "Rifiuto del bello classico: fascino per la malattia, la morte, il deforme — come provocazione contro la morale borghese." },
      { term: "Movimento di transizione", def: "Anticipa temi e gusti del Decadentismo europeo; rinnova la poesia italiana contro la tradizione manzoniana e romantica." },
    ],
    testi: [
      { title: "Fosca", opera: "I. U. Tarchetti (p. 135)", note: "L'amore morboso per una donna brutta e malata: il fascino del brutto." },
      { title: "Preludio", opera: "E. Praga, da Penombre", note: "Manifesto del movimento; polemica contro il Romanticismo manzoniano." },
    ],
    collegamenti: [
      "→ Verga: confronto sul «vero» (oggettivo in Verga, provocatorio e soggettivo in Praga)",
      "→ Decadentismo / D'Annunzio e Pascoli: di cui la Scapigliatura è anticipazione",
    ],
    domande: [
      { q: "Cosa significa «Scapigliatura» e quali sono i suoi caratteri?", a: "È la traduzione dell'idea di **bohème**: artisti ribelli che vivono in modo disordinato e anticonformista, in polemica con la società borghese. Cercano il **vero** e il **moderno** contro la tradizione." },
      { q: "Perché si parla di movimento «di transizione»?", a: "Perché fa da **ponte** tra il Romanticismo che tramonta e il **Decadentismo** che arriva: introduce in Italia i gusti europei (Baudelaire, Poe) e prepara la sensibilità decadente di Pascoli e D'Annunzio." },
      { q: "In che cosa consiste il dualismo scapigliato?", a: "Nella **lacerazione** dell'artista, diviso tra l'aspirazione all'**ideale** e l'attrazione per il **reale**, il brutto, il malato. È un'anima inquieta che non trova pace né nell'uno né nell'altro." },
      { q: "Tarchetti e «Fosca»: di cosa parla?", a: "È un romanzo sull'amore **morboso** del protagonista per **Fosca**, una donna brutta e malata. Rovescia il modello romantico della bellezza: incarna l'**estetica del brutto** e il fascino della malattia e della morte." },
      { q: "Confronta il «vero» di Verga e il «vero» di Praga.", a: "Per **Verga** il vero è **oggettivo, scientifico e sociale**: rappresentato con impersonalità. Per **Praga** il vero è **soggettivo e provocatorio**: una ribellione che si compiace del brutto e dello scandaloso. Verga descrive, Praga provoca." },
    ],
  },

  // ── 04 · Futurismo ────────────────────────────────────────────────────────
  {
    id: "futurismo",
    n: "04",
    kicker: "Avanguardia",
    title: "Futurismo",
    meta: "F. T. Marinetti · Manifesto del 1909",
    icon: "zap",
    lead:
      `Prima **avanguardia** italiana. Esalta la **velocità**, la **macchina**, la **modernità** e perfino la **guerra** ` +
      `(«sola igiene del mondo»). Rivoluziona la lingua con le **«parole in libertà»**: via la sintassi, la ` +
      `punteggiatura e il verso tradizionale.`,
    facts: [
      { value: "20 feb 1909", label: "Manifesto del Futurismo su «Le Figaro»" },
      { value: "Marinetti", label: "F. T. Marinetti, fondatore e teorico" },
      { value: "Velocità · macchina", label: "I miti del movimento; antipassatismo" },
      { value: "Parole in libertà", label: "Rivoluzione del linguaggio poetico" },
    ],
    concetti: [
      { term: "Antipassatismo", def: "Rifiuto totale del passato: «distruggere i musei e le biblioteche», rompere con la tradizione." },
      { term: "Parole in libertà / paroliberismo", def: "Abolizione di sintassi, punteggiatura e verso; verbo all'infinito, analogie, onomatopee, impaginazione visiva (tavole parolibere)." },
      { term: "Mito della modernità", def: "Esaltazione di velocità, automobile, città industriale, dinamismo, energia della macchina." },
      { term: "«Guerra sola igiene del mondo»", def: "Provocatoria esaltazione della guerra e della violenza come forze di rinnovamento (posizione poi tragicamente smentita dalla storia)." },
    ],
    testi: [
      { title: "Manifesto del Futurismo", opera: "F. T. Marinetti, 1909 (p. 420)", note: "I punti programmatici dell'avanguardia." },
      { title: "Il bombardamento di Adrianopoli", opera: "da Zang Tumb Tumb (p. 425)", note: "Parole in libertà e onomatopee dell'assedio." },
    ],
    collegamenti: [
      "→ Avanguardie europee del primo '900 (Cubismo, Dadaismo)",
      "→ Ungaretti: anche lui rompe la metrica tradizionale, ma per ragioni opposte (essenzialità, non rumore)",
    ],
    domande: [
      { q: "Quando e dove esce il Manifesto del Futurismo? Chi è l'autore?", a: "Esce il **20 febbraio 1909** sul quotidiano francese **«Le Figaro»**; l'autore è **Filippo Tommaso Marinetti**, fondatore e teorico del movimento." },
      { q: "Quali sono i temi e i miti del Futurismo?", a: "L'esaltazione della **velocità**, della **macchina** e dell'industria, il **dinamismo**, il coraggio, l'**antipassatismo** (distruzione di musei e biblioteche) e la provocatoria esaltazione della **guerra**." },
      { q: "Che cosa sono le «parole in libertà»?", a: "La rivoluzione linguistica futurista: si **aboliscono** sintassi, punteggiatura e metrica tradizionale; il verbo va all'**infinito**, si usano **analogie** ardite, **onomatopee** e un'impaginazione visiva (tavole parolibere)." },
      { q: "Analizza «Il bombardamento di Adrianopoli».", a: "Tratto da *Zang Tumb Tumb*, riproduce con **onomatopee** e **parole in libertà** i rumori dell'assedio di Adrianopoli (guerra balcanica). Il linguaggio imita il caos della battaglia: niente sintassi, solo suono ed energia." },
      { q: "Cosa intende Marinetti con «la guerra sola igiene del mondo»?", a: "Una provocazione: la guerra come forza che «pulisce» e rinnova, distruggendo il vecchio. È l'aspetto più inquietante del movimento, smentito poi dall'orrore reale della Prima guerra mondiale." },
    ],
  },

  // ── 05 · D'Annunzio ─────────────────────────────────────────────────────
  {
    id: "dannunzio",
    n: "05",
    kicker: "Autore · Decadentismo",
    title: "Gabriele D'Annunzio",
    meta: "Pescara, 1863 – Vittoriale, 1938",
    icon: "crown",
    lead:
      `Il grande **esteta** del Decadentismo italiano: la vita come **opera d'arte**. Attraversa tre fasi — ` +
      `**estetismo**, **superomismo** e **panismo** — e fa di se stesso un personaggio pubblico, **poeta-vate** e ` +
      `combattente. La sua è una poesia sontuosa, musicale, sensuale.`,
    facts: [
      { value: "Decadentismo", label: "Estetismo, superuomo, panismo" },
      { value: "Il piacere", label: "1889 · l'eroe esteta Andrea Sperelli" },
      { value: "Laudi / Alcyone", label: "La grande stagione lirica del panismo" },
      { value: "Poeta-vate", label: "Guida e profeta della nazione; le imprese" },
    ],
    concetti: [
      { term: "Estetismo", def: "Culto assoluto della bellezza: la vita va vissuta come un'opera d'arte, al di sopra di morale e utilità." },
      { term: "Superuomo", def: "Da Nietzsche (frainteso): l'individuo eccezionale, al di sopra della massa e della morale comune, destinato a dominare." },
      { term: "Panismo", def: "Fusione totale dell'io con la Natura: il poeta si fa pioggia, albero, vento, dissolvendosi nel «tutto» (pan)." },
      { term: "Poeta-vate", def: "Il poeta come guida, profeta e voce della nazione; D'Annunzio lo incarna anche nella vita (le imprese militari)." },
    ],
    testi: [
      { title: "Il ritratto di un esteta", opera: "da Il piacere", note: "Andrea Sperelli, l'eroe decadente: esteta raffinato ma inetto." },
      { title: "La sera fiesolana", opera: "da Alcyone (Laudi)", note: "Panismo; sinestesie, metafore, personificazioni; rimandi francescani." },
      { title: "Deserto di cenere", opera: "da Notturno", note: "Scritto durante la cecità: nuova percezione, fragilità, opposta al superuomo." },
    ],
    collegamenti: [
      "→ Pascoli: stesso Decadentismo, ma D'Annunzio è sontuoso e «superuomo», Pascoli umile e «fanciullino»",
      "→ Scapigliatura: che aveva anticipato la sensibilità decadente",
    ],
    domande: [
      { q: "Chi è D'Annunzio e cosa intendiamo per «poeta-vate»?", a: "È il massimo **esteta** del Decadentismo italiano. Il **poeta-vate** è il poeta visto come guida, profeta e voce della nazione: D'Annunzio lo incarna anche nella vita pubblica, con le imprese militari e politiche (Fiume, il volo su Vienna)." },
      { q: "Spiega estetismo, superomismo e panismo.", a: "**Estetismo**: la vita come opera d'arte, il culto del bello sopra ogni cosa. **Superomismo**: l'uomo eccezionale al di sopra della morale comune (da Nietzsche). **Panismo**: la fusione totale dell'io con la Natura, il farsi pioggia, albero, elemento del «tutto»." },
      { q: "Il piacere: chi è Andrea Sperelli?", a: "È l'**eroe decadente** per eccellenza: un nobile esteta raffinatissimo, che vive di sensazioni e bellezza, ma incapace di agire davvero — un **inetto**. Incarna la crisi e il vuoto dell'estetismo." },
      { q: "Analizza «La sera fiesolana»: a chi si rivolge l'io poetico e con quali figure?", a: "L'io poetico si rivolge alla **sera** (e a una donna), lodandola in un paesaggio toscano. Usa **sinestesie**, **metafore** e **personificazioni**; le antifone «Laudata sii» richiamano il **Cantico delle creature** di San Francesco. Restituisce un senso di **mistero** e sacralità della Natura: è il panismo." },
      { q: "«Deserto di cenere» dal Notturno: cosa lo distingue dal resto della sua opera?", a: "È scritto durante la **cecità temporanea** (ferita all'occhio): prosa frammentaria, fatta di sensazioni e incertezza dovuta alla vista precaria. C'è un **nuovo modo di percepire** il mondo: emerge la **fragilità** dell'uomo, in netto contrasto col **superuomo** della giovinezza." },
      { q: "Cosa ricordi delle imprese di D'Annunzio combattente?", a: "Partecipò attivamente alla Prima guerra mondiale e al dopoguerra: il **volo su Vienna**, la **beffa di Buccari**, l'**impresa di Fiume** (1919–20). Visse il «poeta-vate» fino in fondo, traducendo l'estetismo in azione politica e militare." },
    ],
  },

  // ── 06 · Sibilla Aleramo ─────────────────────────────────────────────────
  {
    id: "aleramo",
    n: "06",
    kicker: "Autrice",
    title: "Sibilla Aleramo",
    meta: "Alessandria, 1876 – Roma, 1960",
    icon: "venus",
    lead:
      `Pseudonimo di **Rina Faccio**. Con **«Una donna»** (1906) firma il primo grande romanzo ` +
      `**femminista** italiano: il racconto autobiografico di una **presa di coscienza**, fino alla scelta ` +
      `dolorosa di lasciare marito e figlio per riconquistare **dignità** e **libertà**.`,
    facts: [
      { value: "Una donna", label: "1906 · romanzo autobiografico femminista" },
      { value: "Rina Faccio", label: "Vero nome dell'autrice" },
      { value: "Emancipazione", label: "Presa di coscienza di sé come donna" },
      { value: "Violenza di genere", label: "Tema centrale, attualissimo" },
    ],
    concetti: [
      { term: "Romanzo autobiografico", def: "La storia rispecchia la vita reale dell'autrice: matrimonio imposto, violenza, maternità, fuga." },
      { term: "Presa di coscienza", def: "Il percorso con cui la protagonista capisce di essere una persona, non solo «moglie» o «madre», e rivendica la propria libertà." },
      { term: "Femminismo", def: "Rivendicazione della dignità e dei diritti della donna, contro un ruolo sociale subordinato e una violenza accettata come normale." },
    ],
    testi: [
      { title: "Una donna", opera: "brano antologizzato (p. 346)", note: "Confronto sul tema della violenza di genere." },
    ],
    collegamenti: [
      "→ Attualità: la violenza di genere e sui social (un tema del colloquio)",
      "→ Verga / Pirandello: la donna e la «trappola» dei ruoli sociali",
    ],
    domande: [
      { q: "Chi è Sibilla Aleramo e perché «Una donna» è importante?", a: "È lo pseudonimo di **Rina Faccio**. *Una donna* (1906) è considerato il primo grande **romanzo femminista** italiano: racconta in forma autobiografica la presa di coscienza di una donna e la sua ribellione a un destino di sottomissione." },
      { q: "Qual è il tema centrale del romanzo?", a: "L'**emancipazione femminile** e la **violenza di genere**: la protagonista vive un matrimonio infelice e violento e, attraverso una dolorosa presa di coscienza, decide di rivendicare la propria dignità." },
      { q: "Perché la protagonista lascia marito e figlio?", a: "È la scelta più dolorosa: per salvare se stessa come **persona** deve liberarsi da un ruolo che la annienta. Rinunciare al figlio è il prezzo terribile della propria **libertà** e dignità — una denuncia della condizione femminile dell'epoca." },
      { q: "Come collegheresti questo testo all'attualità?", a: "Direttamente al tema della **violenza di genere** trattato anche in classe (realtà e social): Aleramo mostra, già nel 1906, una violenza «normalizzata» dentro la famiglia, lo stesso meccanismo che oggi denunciamo." },
    ],
  },

  // ── 07 · Ungaretti ────────────────────────────────────────────────────────
  {
    id: "ungaretti",
    n: "07",
    kicker: "Autore · Ermetismo",
    title: "Giuseppe Ungaretti",
    meta: "Alessandria d'Egitto, 1888 – Milano, 1970",
    icon: "feather",
    lead:
      `La sua poesia nasce nelle **trincee** della Prima guerra mondiale. In **«L'Allegria»** la parola si fa ` +
      `**essenziale**, ridotta all'osso: versi liberi, **una parola per verso**, spazi bianchi. Temi: la ` +
      `**guerra**, la **fragilità** dell'uomo, la **fratellanza** e il valore della vita.`,
    facts: [
      { value: "L'Allegria", label: "Prima del fronte: Il porto sepolto (1916), Allegria di naufragi (1919)" },
      { value: "Carso · 1915–18", label: "La poesia come diario di guerra" },
      { value: "Una parola/verso", label: "Versi liberi, spazi bianchi, niente punteggiatura" },
      { value: "Analogia", label: "Accostamento immediato di immagini lontane" },
    ],
    concetti: [
      { term: "Folgorazione / illuminazione", def: "La poesia è un attimo di rivelazione: poche parole essenziali che illuminano un senso." },
      { term: "Parola-verso", def: "Ogni parola isolata su un verso e circondata da spazi bianchi acquista un peso e un silenzio assoluti." },
      { term: "Analogia", def: "Accostamento diretto di due immagini lontane, senza nessi logici (es. «Si sta come d'autunno...»)." },
      { term: "Date topiche e croniche", def: "Ogni poesia porta luogo e data come in un diario: la poesia è radicata in un momento preciso della guerra." },
    ],
    testi: [
      { title: "Veglia", opera: "da L'Allegria", note: "Una notte accanto a un compagno morto: l'attaccamento alla vita." },
      { title: "Fratelli", opera: "da L'Allegria", note: "La parola «fratelli» nella notte; ossimoro e analogia." },
      { title: "Sono una creatura", opera: "da L'Allegria", note: "Il dolore pietrificato, duro come la pietra del Carso." },
      { title: "I fiumi", opera: "da L'Allegria", note: "Isonzo, Serchio, Nilo, Senna: l'identità del poeta nei fiumi della sua vita." },
    ],
    collegamenti: [
      "→ Futurismo: anche Ungaretti rompe la metrica, ma per essenzialità, non per «rumore»",
      "→ Montale: altro grande del Novecento, ma con poetica opposta (oggettiva, del «male di vivere»)",
    ],
    domande: [
      { q: "La biografia di Ungaretti e il rapporto con la guerra.", a: "Nato ad **Alessandria d'Egitto** (1888), combatte come **fante sul Carso** nella Prima guerra mondiale. È lì, nelle trincee, che nasce *L'Allegria*: la guerra gli rivela la fragilità e il valore assoluto della vita." },
      { q: "Quali sono i temi de «L'Allegria» e i suoi titoli precedenti?", a: "I temi: la **guerra**, la **morte**, la **fratellanza**, il valore della **vita**. La raccolta ebbe due titoli precedenti: **Il porto sepolto** (1916) e **Allegria di naufragi** (1919)." },
      { q: "Spiega le tecniche compositive di Ungaretti.", a: "**Versi liberi**, spesso una sola **parola per verso**, **spazi bianchi**, niente punteggiatura, **analogie**. Ogni poesia ha **data e luogo** (date topiche e croniche), come un diario di guerra: la parola è ridotta all'essenziale." },
      { q: "Analizza «Veglia».", a: "Il poeta passa una notte di guerra accanto al **cadavere** di un compagno. Proprio davanti alla morte, scrive «lettere piene d'amore»: dall'orrore nasce un **attaccamento violento alla vita**. Datata Cima Quattro, 23 dicembre 1915." },
      { q: "«Fratelli»: le figure retoriche e il significato.", a: "Nella notte, la parola «fratelli» rivolta a un altro reparto rivela la **fragilità** e la solidarietà tra gli uomini in guerra. Vi si trovano l'**ossimoro** e l'**analogia**: «Fratelli» è definita «parola tremante nella notte / foglia appena nata»." },
      { q: "«Sono una creatura»: spiega l'analogia centrale.", a: "Il dolore del poeta è duro e arido come la **pietra del Carso** del San Michele: «Come questa pietra / è il mio pianto / che non si vede». Il dolore è così grande da essersi **pietrificato**, non può più sfogarsi in lacrime." },
      { q: "«I fiumi»: perché i fiumi? Cosa rappresentano?", a: "Il poeta ripercorre la propria **identità** attraverso quattro fiumi: il **Serchio** (le radici familiari), il **Nilo** (l'infanzia in Egitto), la **Senna** (la formazione a Parigi) e l'**Isonzo** (la guerra, dove si riconosce «una docile fibra dell'universo»)." },
    ],
  },

  // ── 08 · Pascoli ───────────────────────────────────────────────────────────
  {
    id: "pascoli",
    n: "08",
    kicker: "Autore · Decadentismo",
    title: "Giovanni Pascoli",
    meta: "San Mauro di Romagna, 1855 – Bologna, 1912",
    icon: "moon",
    lead:
      `Poeta del **Decadentismo** segnato da una tragedia familiare (l'**assassinio del padre**) che diventa ` +
      `ossessione del **«nido»**. La sua poetica del **«fanciullino»** guarda il mondo con stupore; il suo ` +
      `**simbolismo** trasforma le piccole cose in segni di un mistero più grande.`,
    facts: [
      { value: "Myricae", label: "Le piccole cose della campagna" },
      { value: "Canti di Castelvecchio", label: "Il gelsomino notturno, Nebbia" },
      { value: "Il fanciullino", label: "La poetica: lo sguardo stupito del bambino" },
      { value: "Il «nido»", label: "L'ossessione della famiglia e del rifugio" },
    ],
    concetti: [
      { term: "Poetica del fanciullino", def: "Dentro ogni uomo vive un fanciullo che guarda il mondo con stupore e dà nomi nuovi alle cose. Il poeta è chi sa ascoltarlo: la poesia è intuizione, non utilità." },
      { term: "Il «nido»", def: "Simbolo della famiglia e del rifugio chiuso e protettivo, nato dal trauma per la morte del padre. C'è paura del mondo esterno e del «lontano»." },
      { term: "Simbolismo", def: "Le cose hanno un significato nascosto oltre l'apparenza: il poeta coglie analogie e corrispondenze segrete." },
      { term: "Fonosimbolismo", def: "I suoni delle parole (onomatopee, voci di uccelli) evocano significati e sensazioni: il «chiù» dell'assiuolo, ad esempio." },
    ],
    testi: [
      { title: "Il gelsomino notturno", opera: "da Canti di Castelvecchio", note: "La notte, il «nido», la fecondità nuziale velata; sinestesie." },
      { title: "L'assiuolo", opera: "da Myricae", note: "Il «chiù» come voce di morte; enjambement, sinestesia, fonosimbolismo." },
      { title: "Nebbia", opera: "da Canti di Castelvecchio", note: "Il desiderio di chiudersi nel piccolo mondo del nido, rifiuto del lontano." },
    ],
    collegamenti: [
      "→ D'Annunzio: stesso Decadentismo, ma Pascoli è umile e delle «piccole cose», D'Annunzio sontuoso e superuomo",
      "→ Simbolismo francese (Baudelaire, Verlaine): le «corrispondenze» segrete tra le cose",
    ],
    domande: [
      { q: "La vita di Pascoli e il tema del «nido».", a: "La sua vita è segnata dall'**assassinio del padre** (1867) e da una serie di lutti familiari. Da qui nasce l'ossessione del **«nido»**: la famiglia come rifugio chiuso e protettivo, e la paura del mondo esterno e del «lontano»." },
      { q: "In che cosa consiste la poetica del «fanciullino»?", a: "Dentro ogni uomo c'è un **fanciullo** che guarda il mondo con **stupore** e dà nomi nuovi alle cose. Il **poeta** è colui che sa ancora ascoltare questa voce: la poesia è intuizione e scoperta, non ha fini pratici o utilitaristici." },
      { q: "Spiega il simbolismo e il fonosimbolismo di Pascoli.", a: "Per Pascoli le cose nascondono un **significato segreto** oltre l'apparenza: il poeta ne coglie le corrispondenze. Il **fonosimbolismo** è l'uso dei suoni (onomatopee, versi di uccelli, come il «chiù») per evocare sensazioni e significati." },
      { q: "«Il gelsomino notturno»: tema e simboli.", a: "Descrive una **notte** in cui, mentre il fiore si apre, si allude alla **prima notte di nozze** di amici (il poeta resta escluso, fuori dal «nido»). Compaiono il simbolo del nido, i fiori, le stelle; lo stile è ricco di **sinestesie** e simboli della vita e della morte." },
      { q: "«L'assiuolo»: il simbolo e le figure retoriche.", a: "Il verso dell'assiuolo, il «**chiù**», risuona come una **voce di morte** nella notte. Pascoli usa **fonosimbolismo**, **sinestesie** ed **enjambement** per creare un'atmosfera misteriosa e angosciosa, tipica del suo simbolismo." },
      { q: "«Nebbia»: cosa esprime?", a: "Il desiderio del poeta di **chiudersi nel piccolo mondo** del nido: la nebbia nasconde il «lontano», ciò che fa male e ricorda la morte. È un inno al rifugio domestico, contro tutto ciò che è esterno e minaccioso." },
      { q: "Confronta i motivi decadenti di Pascoli e D'Annunzio.", a: "Entrambi sono **decadenti** e **simbolisti**: cercano il mistero oltre le cose. Ma Pascoli è **umile**, intimista, poeta delle **piccole cose** e del nido; D'Annunzio è **sontuoso**, sensuale, poeta del **superuomo** e del panismo." },
    ],
  },

  // ── 09 · Pirandello ──────────────────────────────────────────────────────
  {
    id: "pirandello",
    n: "09",
    kicker: "Autore",
    title: "Luigi Pirandello",
    meta: "Agrigento, 1867 – Roma, 1936 · Nobel 1934",
    icon: "masks",
    lead:
      `Il grande indagatore della **crisi dell'io**. Le sue parole-chiave: **maschera**, **relativismo** ` +
      `(nessuna verità è unica), **umorismo** (il «sentimento del contrario») e **follia** come via di fuga. ` +
      `Rivoluziona il teatro col **«teatro nel teatro»**.`,
    facts: [
      { value: "Nobel 1934", label: "Per il teatro; rapporto complesso col fascismo" },
      { value: "L'umorismo", label: "1908 · saggio sulla poetica" },
      { value: "Il fu Mattia Pascal", label: "1904 · l'impossibile «seconda vita»" },
      { value: "Sei personaggi", label: "1921 · il teatro nel teatro" },
    ],
    concetti: [
      { term: "Umorismo", def: "Il «sentimento del contrario»: non si ride e basta (comicità = «avvertimento del contrario»), ma si riflette e si compatisce. Es. la vecchia signora imbellettata." },
      { term: "Maschera", def: "Il ruolo che la società ci impone (padre, marito, impiegato...). Indossiamo «cento, mille» maschere, ma nessuna è il nostro vero io." },
      { term: "Relativismo gnoseologico", def: "Non esiste una verità unica e oggettiva: ognuno ha la propria, e nessuno può conoscere davvero l'altro." },
      { term: "Vita vs forma", def: "La vita è un flusso continuo; la «forma» (i ruoli, le convenzioni) la imprigiona e la blocca. Vivere è essere ingabbiati." },
      { term: "Follia come fuga", def: "Impazzire (o fingersi pazzi) è l'unico modo per sfuggire alle maschere sociali e dire la verità impunemente (Enrico IV, Così è se vi pare)." },
    ],
    testi: [
      { title: "Io e l'ombra mia", opera: "da Il fu Mattia Pascal (p. 515)", note: "L'uomo senza identità ridotto a pura ombra." },
      { title: "Il treno ha fischiato", opera: "da Novelle per un anno", note: "Belluca e l'evasione immaginaria: la follia come liberazione." },
      { title: "La signora Frola e il signor Ponza, suo genero", opera: "da Novelle per un anno", note: "Base di «Così è (se vi pare)»: la verità inconoscibile." },
      { title: "Sei personaggi in cerca d'autore", opera: "teatro, 1921", note: "Il teatro nel teatro; l'impossibilità di rappresentare il reale." },
    ],
    collegamenti: [
      "→ Svevo: stessa crisi dell'io e dell'uomo moderno (l'inetto ↔ la maschera)",
      "→ Decadentismo: la perdita delle certezze positivistiche",
    ],
    domande: [
      { q: "Pirandello e il fascismo.", a: "Si iscrisse al partito fascista nel 1924, ma il suo rapporto col regime fu **complesso e ambiguo**: la sua opera, tutta basata sul **relativismo** e sulla crisi delle certezze, è in fondo l'opposto dell'ideologia totalitaria." },
      { q: "Spiega l'umorismo: avvertimento e sentimento del contrario.", a: "Davanti a una vecchia signora imbellettata, l'**avvertimento del contrario** mi fa ridere (è comica). Ma se rifletto sul perché (vuole trattenere il marito), provo il **sentimento del contrario**: non rido più, **compatisco**. Questo è l'umorismo." },
      { q: "Che cos'è il relativismo gnoseologico?", a: "L'idea che **non esista una verità unica e oggettiva**: ognuno vede la realtà a modo suo e nessuno può conoscere davvero l'altro. È il cuore di *Così è (se vi pare)*." },
      { q: "Spiega la «maschera» e il contrasto vita/forma.", a: "La società ci impone dei **ruoli** (le maschere): non siamo mai un solo «io», ma «uno, nessuno e centomila». La **vita** è un flusso continuo, ma la **forma** (i ruoli, le convenzioni) la imprigiona: vivere è restare ingabbiati in una maschera." },
      { q: "«Il fu Mattia Pascal»: trama e significato. Perché non può rinascere?", a: "Mattia, creduto morto, tenta una **nuova vita** come Adriano Meis. Ma scopre che senza **identità sociale** (documenti, ruolo) non può amare, sposare, esistere davvero. Torna, ma ormai è «il fu»: né vivo né morto. Lezione: non si può vivere fuori dalla «forma» sociale." },
      { q: "«Il treno ha fischiato»: cosa accade a Belluca?", a: "Belluca, un impiegato oppresso da una vita grigia, una notte sente il **fischio di un treno** e «impazzisce»: scopre con la fantasia il **mondo intero** che esiste oltre la sua gabbia. La «follia» è in realtà una **liberazione**." },
      { q: "Le innovazioni teatrali e «Sei personaggi in cerca d'autore».", a: "Pirandello inventa il **«teatro nel teatro»**: sei personaggi irrompono sul palco chiedendo a una compagnia di rappresentare il loro dramma. Ma gli **attori non riescono** a restituire il loro vissuto reale: il teatro **non può** rappresentare la verità della vita. Chi ha vissuto davvero non si riconosce nella finzione scenica." },
      { q: "La follia come via di fuga: «Enrico IV» e «Così è (se vi pare)».", a: "In *Enrico IV* il protagonista si **finge pazzo** per rifugiarsi in un ruolo e sfuggire alle maschere sociali; in *Così è (se vi pare)* la verità resta inconoscibile. La follia diventa l'unico spazio di **libertà** dall'oppressione dei ruoli." },
    ],
  },

  // ── 10 · Svevo ─────────────────────────────────────────────────────────────
  {
    id: "svevo",
    n: "10",
    kicker: "Autore",
    title: "Italo Svevo",
    meta: "Trieste, 1861 – 1928",
    icon: "cigarette",
    lead:
      `Lo scrittore della **Trieste** mitteleuropea, che porta nel romanzo italiano la **psicoanalisi** di Freud. ` +
      `Crea la figura dell'**inetto**: l'uomo incapace di vivere. In **«La coscienza di Zeno»** la malattia ` +
      `diventa la condizione stessa dell'uomo moderno.`,
    facts: [
      { value: "Ettore Schmitz", label: "Vero nome; formazione mitteleuropea, amico di Joyce" },
      { value: "L'inetto", label: "Una vita, Senilità, La coscienza di Zeno" },
      { value: "La coscienza di Zeno", label: "1923 · il memoriale dello psicanalizzato" },
      { value: "Psicoanalisi", label: "Freud entra nel romanzo italiano" },
    ],
    concetti: [
      { term: "Inetto", def: "Il protagonista incapace di agire, decidere e «vivere»: inadatto alla vita. Zeno è però un inetto ambiguo, quasi «vincente»." },
      { term: "Narratore inattendibile", def: "Zeno scrive il proprio memoriale ma mente (anche a se stesso): non possiamo fidarci di ciò che racconta." },
      { term: "Malattia / salute", def: "La «malattia» di Zeno è in realtà la condizione dell'uomo moderno. Nessuno è davvero «sano»: la salute piena è un'illusione." },
      { term: "Psicoanalisi", def: "Il romanzo è scritto su invito dello psicanalista (il dottor S.): l'inconscio, i lapsus, i ricordi d'infanzia entrano nella narrazione." },
    ],
    testi: [
      { title: "L'inizio del romanzo / il fumo", opera: "da La coscienza di Zeno", note: "L'«ultima sigaretta» sempre rimandata." },
      { title: "La morte del padre", opera: "da La coscienza di Zeno", note: "Lo schiaffo del padre morente: senso di colpa e ambiguità." },
      { title: "La conclusione", opera: "da La coscienza di Zeno", note: "La «guarigione» e la profezia finale sull'umanità malata." },
    ],
    collegamenti: [
      "→ Pirandello: stessa crisi dell'io moderno (l'inetto ↔ la maschera)",
      "→ Joyce e il romanzo europeo del Novecento (flusso di coscienza, tempo interiore)",
    ],
    domande: [
      { q: "Svevo: vita, Trieste e formazione.", a: "Pseudonimo di **Ettore Schmitz**, nasce a **Trieste** (1861), crocevia di culture italiana, tedesca ed ebraica. La sua formazione **mitteleuropea** e l'amicizia con **James Joyce** lo aprono al grande romanzo europeo." },
      { q: "Quale influenza ha la psicoanalisi sulla sua opera?", a: "Decisiva: *La coscienza di Zeno* è costruito come un **memoriale** scritto su invito di uno psicanalista. Entrano nel romanzo l'**inconscio**, i lapsus, i ricordi d'infanzia, il rapporto col padre — i temi di **Freud**." },
      { q: "Spiega la figura dell'inetto.", a: "È il protagonista **incapace di vivere**: indeciso, passivo, inadatto all'azione e al successo. Compare in tutti i romanzi di Svevo (Alfonso, Emilio, Zeno), ma **Zeno** è un inetto ambiguo, che alla fine sembra quasi «vincere»." },
      { q: "La struttura de «La coscienza di Zeno».", a: "È il **memoriale** che Zeno scrive per la sua terapia; il dottor S., per vendetta, lo pubblica. Non è cronologico ma per **temi** (il fumo, il padre, il matrimonio...). Zeno è un **narratore inattendibile**: mente, anche a se stesso." },
      { q: "Il significato dell'episodio dell'«ultima sigaretta».", a: "Zeno fuma «l'**ultima** sigaretta» da sempre, ma non smette mai. Il vizio e i continui propositi falliti rivelano la sua **incapacità di volere** e la natura nevrotica del personaggio: la malattia è interiore." },
      { q: "L'episodio della morte del padre.", a: "Il padre, morente, alza la mano e colpisce Zeno con uno **schiaffo**: gesto ambiguo, forse involontario, ma che lascia in Zeno un enorme **senso di colpa** irrisolto. È un nodo centrale del suo conflitto interiore." },
      { q: "La conclusione del romanzo: la visione dell'uomo.", a: "Zeno si dichiara **guarito** — non grazie alla psicoanalisi, ma perché capisce che **tutta la società è malata**, non solo lui. Il romanzo si chiude con una **profezia apocalittica**: un'esplosione distruggerà la Terra. La «salute» è impossibile: la malattia è la condizione dell'**uomo moderno**." },
    ],
  },

  // ── 11 · Saba ──────────────────────────────────────────────────────────────
  {
    id: "saba",
    n: "11",
    kicker: "Autore",
    title: "Umberto Saba",
    meta: "Trieste, 1883 – Roma, 1957",
    icon: "book-heart",
    lead:
      `Poeta della **«poesia onesta»**: chiara, sincera, lontana dalle avanguardie. La sua opera è **«Il ` +
      `Canzoniere»**, il libro di una vita intera. Canta gli **affetti**, gli animali, la sua **Trieste** e ` +
      `l'umanità umile dei vicoli, con forme tradizionali ma profondità psicologica.`,
    facts: [
      { value: "Il Canzoniere", label: "Opera unica, in continua crescita per tutta la vita" },
      { value: "Poesia onesta", label: "Chiarezza e sincerità contro l'oscurità novecentista" },
      { value: "Trieste", label: "La città-musa; la libreria antiquaria del poeta" },
      { value: "Psicoanalisi", label: "Indagine degli affetti e dell'inconscio" },
    ],
    concetti: [
      { term: "Poesia onesta", def: "Una poesia chiara, sincera e diretta, che non cerca effetti né oscurità: dice la verità degli affetti con parole semplici." },
      { term: "Antinovecentismo", def: "Saba resta fuori dalle avanguardie: usa forme tradizionali (rime, metri classici) mentre gli altri le rompono." },
      { term: "Il Canzoniere", def: "Il titolo (come Petrarca) indica un'unica grande raccolta autobiografica, ordinata e accresciuta lungo tutta la vita." },
    ],
    testi: [
      { title: "A mia moglie", opera: "da Il Canzoniere", note: "La moglie paragonata agli animali femmina: una lode simile al Cantico dei Cantici." },
      { title: "Trieste", opera: "da Il Canzoniere", note: "Il legame intimo tra il poeta e la sua città." },
      { title: "Città vecchia", opera: "da Il Canzoniere", note: "L'amore per l'umanità umile dei vicoli: «l'infinito nell'umiltà»." },
    ],
    collegamenti: [
      "→ Ungaretti e Montale: i tre grandi del Novecento, ma Saba è l'«antinovecentista» (chiarezza vs ermetismo)",
      "→ Petrarca: il modello del «Canzoniere» come libro di una vita",
    ],
    domande: [
      { q: "Saba: vita e rapporto con Trieste.", a: "Nasce a **Trieste** (1883), città a cui resterà legatissimo (vi tenne una libreria antiquaria). La sua infanzia (la madre, la balia Peppa) e la **psicoanalisi** segnano profondamente la sua poesia degli affetti." },
      { q: "Che cos'è «Il Canzoniere» e la «poesia onesta»?", a: "È l'**opera unica** della sua vita, accresciuta di continuo (come il *Canzoniere* di Petrarca). La sua poetica è la **«poesia onesta»**: chiara, sincera, diretta, che canta la verità degli affetti senza oscurità né artifici." },
      { q: "Perché Saba è detto «antinovecentista»?", a: "Perché resta **fuori dalle avanguardie**: mentre gli altri rompono metro e sintassi, lui usa **forme tradizionali** (rime, endecasillabi) e un linguaggio chiaro. La novità è nei **contenuti** psicologici, non nelle forme." },
      { q: "Analizza «A mia moglie».", a: "Il poeta paragona la moglie a diversi **animali femmina** (la gallina, la giovenca, la cagna, la coniglia...), lodandone l'istinto materno e la naturalezza. È una **preghiera** d'amore che ricorda il **Cantico dei Cantici** della Bibbia; importanti gli aspetti **fonici, linguistici e metrici**." },
      { q: "Cosa esprimono «Trieste» e «Città vecchia»?", a: "Il profondo **legame** del poeta con la sua città. In *Città vecchia*, tra i vicoli poveri e l'umanità umile (operai, prostitute, marinai), Saba sente «l'infinito nell'umiltà»: l'amore per tutte le creature, anche le più misere." },
    ],
  },

  // ── 12 · Montale ───────────────────────────────────────────────────────────
  {
    id: "montale",
    n: "12",
    kicker: "Autore",
    title: "Eugenio Montale",
    meta: "Genova, 1896 – Milano, 1981 · Nobel 1975",
    icon: "waves",
    lead:
      `Il poeta del **«male di vivere»**: nessuna certezza, nessuna formula salvifica. Inventa il **«correlativo ` +
      `oggettivo»**, oggetti concreti che dicono gli stati d'animo. Il paesaggio **ligure**, aspro e arido, è lo ` +
      `specchio del disagio dell'uomo moderno.`,
    facts: [
      { value: "Ossi di seppia", label: "1925 · il male di vivere, il paesaggio ligure" },
      { value: "Le occasioni · La bufera", label: "Le grandi raccolte centrali" },
      { value: "Satura", label: "1971 · gli Xenia, in memoria della moglie" },
      { value: "Correlativo oggettivo", label: "La sua tecnica fondamentale (da T. S. Eliot)" },
    ],
    concetti: [
      { term: "Male di vivere", def: "La sofferenza e l'aridità dell'esistenza, senza consolazione né senso: la condizione dell'uomo del Novecento." },
      { term: "Correlativo oggettivo", def: "Un oggetto o un'immagine concreta che «traduce» uno stato d'animo: invece di dire l'emozione, la si mostra attraverso una cosa (il muro coi cocci, i limoni)." },
      { term: "Il «varco» / il «miracolo»", def: "La speranza, sempre cercata e quasi mai trovata, di un'apertura nel muro dell'esistenza, di un senso nascosto." },
      { term: "Poetica negativa", def: "La poesia non offre verità né formule: può dire solo «ciò che non siamo, ciò che non vogliamo»." },
    ],
    testi: [
      { title: "I limoni", opera: "da Ossi di seppia", note: "Il programma poetico: contro i «poeti laureati», la poesia delle cose umili." },
      { title: "Non chiederci la parola", opera: "da Ossi di seppia", note: "La poesia non dà certezze: «ciò che non siamo, ciò che non vogliamo»." },
      { title: "Meriggiare pallido e assorto", opera: "da Ossi di seppia", note: "Il male di vivere: il muro «con cocci aguzzi di bottiglia»." },
      { title: "Ho sceso le scale dandoti il braccio", opera: "da Satura (Xenia)", note: "In memoria della moglie «Mosca»: l'amore e la vista miope." },
    ],
    collegamenti: [
      "→ Ungaretti e Saba: i tre grandi del Novecento, ciascuno con una poetica diversa",
      "→ T. S. Eliot: da cui Montale riprende il «correlativo oggettivo»",
    ],
    domande: [
      { q: "Montale: vita e raccolte principali.", a: "Nasce a **Genova** (1896), legato alla **Liguria** delle Cinque Terre; antifascista, riceve il **Nobel** nel 1975. Le raccolte: **Ossi di seppia** (1925), **Le occasioni**, **La bufera e altro**, **Satura** (1971)." },
      { q: "Che cos'è il «male di vivere»?", a: "È la **sofferenza** e l'aridità dell'esistenza, priva di senso e di consolazione: la condizione dell'uomo del Novecento. Si esprime nel paesaggio ligure **aspro e arido** e in immagini di disagio." },
      { q: "Definisci il «correlativo oggettivo» con un esempio.", a: "È un **oggetto concreto** che esprime uno stato d'animo: invece di dire l'emozione, Montale la **mostra** attraverso una cosa. Es. il **muro «con cocci aguzzi di bottiglia»** in *Meriggiare* è il male di vivere reso visibile. La tecnica viene da **T. S. Eliot**." },
      { q: "«I limoni»: qual è il programma poetico?", a: "Montale rifiuta i **«poeti laureati»** e la poesia aulica: sceglie le cose **umili**, come i **limoni** di un orto ligure. Tra esse spera di cogliere un **«varco»**, un «errore di Natura» che riveli un senso nascosto." },
      { q: "«Non chiederci la parola»: cosa può e non può dire la poesia?", a: "La poesia **non offre certezze** né formule per vivere. Può dire solo, in negativo, «**ciò che non siamo, ciò che non vogliamo**». È la dichiarazione di una poetica della crisi e dell'incertezza." },
      { q: "«Meriggiare pallido e assorto»: il significato.", a: "In un meriggio assolato e arido, il poeta osserva la natura faticosa (le formiche, il mare lontano) e capisce che la vita è «travaglio»: davanti c'è un **muro «con cocci aguzzi»**, simbolo dell'impossibilità di superare il limite. È il **male di vivere**." },
      { q: "«Ho sceso le scale dandoti il braccio»: di cosa parla?", a: "Appartiene agli **Xenia** (in *Satura*) ed è dedicata alla moglie morta, **«Mosca»**, così chiamata per la forte miopia. Con tono colloquiale, Montale scopre che proprio lei, che «vedeva» poco, aveva la **vera vista**: l'amore come unica forma di conoscenza." },
    ],
  },

  // ── 13 · Letture integrali (a scelta) ─────────────────────────────────────
  {
    id: "letture",
    n: "13",
    kicker: "Metodo · Colloquio",
    title: "Le letture a scelta",
    meta: "Due libri dalla bibliografia · da novembre 2025",
    icon: "library",
    lead:
      `All'orale la prof può chiederti dei **due libri** che hai scelto e letto. Non serve riassumere tutto: ` +
      `serve **una scaletta solida** per parlarne con sicurezza. Usa questo schema come «traccia» da riempire ` +
      `con i tuoi titoli.`,
    concetti: [
      { term: "Scheda-libro (5 punti)", def: "1) Autore e contesto · 2) Trama in 4 frasi · 3) Personaggi principali · 4) Temi e messaggio · 5) Perché l'ho scelto / cosa mi ha colpito." },
      { term: "Il collegamento", def: "Il vero punto forte: collega il libro a un autore o tema del programma (es. crisi dell'io ↔ Svevo/Pirandello; guerra ↔ Ungaretti; donna ↔ Aleramo)." },
      { term: "La citazione", def: "Tieni pronta una frase o una scena che ti è rimasta: dimostra che il libro l'hai letto davvero." },
    ],
    domande: [
      { q: "Parlami di uno dei libri che hai letto quest'anno.", a: "Segui la **scheda in 5 punti**: autore e contesto → trama in 4 frasi → personaggi → temi e messaggio → perché l'hai scelto. Chiudi con un **collegamento** al programma e una **scena** che ti ha colpito. Evita di raccontare il finale per filo e per segno: punta sui temi." },
      { q: "Perché hai scelto proprio questo libro?", a: "Risposta personale e sincera: un tema che ti tocca, un'epoca che ti interessa, un consiglio, un collegamento con le tue passioni. Mostra che è stata una **scelta tua**, non casuale." },
      { q: "Che cosa lega questo libro a un autore del programma?", a: "Prepara **in anticipo** un ponte: ad es. un romanzo sulla guerra ↔ **Ungaretti**; un personaggio inetto o in crisi ↔ **Svevo/Pirandello**; una protagonista femminile ↔ **Aleramo**; un tema sociale ↔ **Verga**." },
      { q: "Qual è il tema o il messaggio principale del libro?", a: "Riassumilo in **una frase** chiara («è un libro su...»), poi spiega con un esempio concreto preso dal testo. Il messaggio è ciò che resta quando dimentichi la trama." },
    ],
  },

  // ── 14 · Attualità ─────────────────────────────────────────────────────────
  {
    id: "attualita",
    n: "14",
    kicker: "Colloquio · Attualità",
    title: "Temi di attualità",
    meta: "Spunti per il colloquio interdisciplinare",
    icon: "globe",
    lead:
      `Argomenti di attualità affrontati in classe: servono al **colloquio** per mostrare spirito critico e ` +
      `capacità di **collegamento**. Per ognuno: tieni pronti **due fatti**, un'**opinione argomentata** e un ` +
      `**ponte** con la letteratura.`,
    concetti: [
      { term: "Violenza e social", def: "La violenza (anche di genere) amplificata dai social: odio online, dipendenza, perdita di empatia. Ponte → Sibilla Aleramo, e le tipologie B svolte in classe." },
      { term: "La famiglia nel bosco", def: "Il caso della famiglia che vive isolata fuori dalle istituzioni: libertà individuale vs diritti e doveri (scuola, salute). Ponte → eco-villaggi, utopia di comunità." },
      { term: "Iran e il conflitto", def: "La situazione in Iran e le fasi del conflitto: diritti, libertà, ruolo della donna, informazione. Mostra di saper distinguere le fasi e le cause." },
      { term: "Eco-villaggi e comunità", def: "Documentario su comunità fuori dalle istituzioni: la ricerca di un'unità tra aspirazioni individuali, lavoro e «famiglia allargata». Tema: utopia e ritorno alla natura." },
      { term: "Mafia — «I cento passi»", def: "Il film su Peppino Impastato: legalità, coraggio civile, lotta alla mafia. Ponte → impegno civile, il «vero» raccontato (Verga, giornalismo)." },
    ],
    domande: [
      { q: "Come la violenza viene amplificata dai social?", a: "I social danno **anonimato** e velocità: l'odio si diffonde senza filtri, cala l'**empatia**, si normalizza l'aggressività (anche di genere). Va distinta la violenza **reale** da quella mediata, ma le due si alimentano. Collega a **Sibilla Aleramo** e alla tipologia B svolta in classe." },
      { q: "La «famiglia nel bosco»: libertà o irresponsabilità?", a: "È il conflitto tra **libertà individuale** (vivere come si vuole, fuori dalle istituzioni) e i **diritti dei figli** (istruzione, salute, socialità). Argomenta una posizione equilibrata, riconoscendo le ragioni di entrambe le parti." },
      { q: "Cosa sai della situazione in Iran?", a: "Mostra di conoscerne le **fasi** e le cause: le proteste, la questione dei **diritti** e della libertà (in particolare delle donne), il ruolo dell'informazione. Evita semplificazioni: distingui popolo e regime." },
      { q: "Il documentario sugli eco-villaggi: quale tema solleva?", a: "La **ricerca di comunità** alternative, fuori dalle istituzioni, che provano a unire aspirazioni individuali, lavoro e «famiglia allargata». È un tema di **utopia** e ritorno alla natura: ne valuti potenzialità e limiti." },
      { q: "Perché avete visto «I cento passi»?", a: "Per parlare di **mafia** e **legalità** attraverso la storia di **Peppino Impastato**: il coraggio civile di chi denuncia, anche a costo della vita. Si collega all'**impegno** dell'intellettuale e al raccontare la verità." },
    ],
  },

  // ── 15 · Scritti svolti (Prima prova) ──────────────────────────────────────
  {
    id: "scritti",
    n: "15",
    kicker: "Prima prova",
    title: "Gli scritti svolti",
    meta: "Le tre tipologie dell'Esame di Stato",
    icon: "pen",
    lead:
      `Riepilogo delle **tre tipologie** della Prima prova e dei testi svolti in classe. Utile sia per lo ` +
      `**scritto** sia perché all'orale la prof può chiederti dei testi analizzati (es. Verga, «La pentolaccia»).`,
    concetti: [
      { term: "Tipologia A — Analisi del testo", def: "Analisi di un testo letterario (poesia o prosa): comprensione, analisi (lingua, stile, figure retoriche), interpretazione e contestualizzazione. Svolta: Verga, «La pentolaccia» (da Vita dei campi)." },
      { term: "Tipologia B — Testo argomentativo", def: "Analisi e produzione su un testo dato: si individua la tesi, si argomenta una propria posizione con coerenza. Svolte: violenza realtà/social; «se internet smettesse di funzionare»." },
      { term: "Tipologia C — Tema di attualità", def: "Riflessione su un tema d'attualità o personale, a partire da una traccia: tesi chiara, esempi, struttura ordinata (introduzione, sviluppo, conclusione)." },
    ],
    testi: [
      { title: "La pentolaccia", opera: "Verga, da Vita dei campi — Tipologia A", note: "Analisi del testo svolta in classe." },
      { title: "Giovani e violenza tra realtà e social", opera: "A. Appignanesi, Centropagina, 23 nov 2025 — Tipologia B", note: "Lo psichiatra Volpe." },
      { title: "Se internet smettesse di funzionare per un giorno", opera: "G. Rotondi, Focus, 12 feb 2018 — Tipologia B", note: "Testo argomentativo." },
    ],
    domande: [
      { q: "Quali sono le tre tipologie della Prima prova?", a: "**A** — analisi del testo (letterario); **B** — analisi e produzione di un **testo argomentativo**; **C** — riflessione critica su un **tema di attualità**. Ogni tipologia ha consegne e competenze diverse." },
      { q: "Come si imposta una Tipologia A (analisi del testo)?", a: "Tre fasi: **comprensione** (di cosa parla), **analisi** (lingua, stile, figure retoriche, struttura) e **interpretazione/contestualizzazione** (significato, legame con autore e movimento). Esempio svolto: Verga, *La pentolaccia*." },
      { q: "Cosa richiede una Tipologia B?", a: "Prima **comprendere** il testo dato e individuarne la **tesi**; poi produrre un testo **argomentativo** in cui sostieni una tua posizione con argomenti **coerenti** e ordinati. Es. svolti: la violenza tra realtà e social; internet che smette di funzionare." },
      { q: "Parlami del testo «La pentolaccia» di Verga.", a: "È una novella di *Vita dei campi*, analizzata in classe come Tipologia A. Si riconducono i caratteri **veristi** (impersonalità, mondo popolare siciliano, fatalismo) all'analisi di lingua e stile, collegandola alla poetica di **Verga**." },
    ],
  },
];
