// ─────────────────────────────────────────────────────────────────────────────
// I disegni della griglia prodotti.
//
// ── Cos'erano ────────────────────────────────────────────────────────────────
// Sette finti pezzi di interfaccia: una finestra di browser che si riempiva, un
// terminale che digitava, un tabellone che contava punti, due colonne di righe
// colorate, un grafo con due fili, un cubo su un piano, una tendina chiaro/scuro.
// Funzionavano, ma erano tutti la stessa idea — "mettiamo dentro la card una
// versione in miniatura della cosa" — e sette miniature di cose diverse non
// fanno una famiglia: fanno sette schermate.
//
// ── Cosa sono adesso ─────────────────────────────────────────────────────────
// Sette DISEGNI, tutti a tratto, tutti sulla stessa tavola (viewBox 280×132),
// stesso spessore di linea, stesso azzurro. Non sono più schermate: sono le
// figure di un manuale. Guardando la griglia da lontano si vede una collezione,
// e ogni figura si legge da sé senza etichette:
//
//   ① Sviluppo web      → il progetto di una pagina, con le quote          (si disegna)
//   ② Web design        → un saggio tipografico sulla griglia delle linee   (si inchiostra)
//   ③ Sviluppo con l'AI → un prisma: un raggio entra, ne escono cinque      (si apre a ventaglio)
//   ④ Giochi web        → una traiettoria a tre rimbalzi                    (la palla corre)
//   ⑤ Strumenti web     → due insiemi e la loro intersezione                (l'intersezione si accende)
//   ⑥ Siti per clienti  → un globo a filo con due satelliti                 (i satelliti orbitano)
//   ⑦ Area tecnica CAT  → curve di livello e un punto trigonometrico        (le quote salgono)
//
// ── Le regole del movimento ──────────────────────────────────────────────────
// Una cosa sola in movimento per riquadro, e quella cosa è un GESTO: qualcosa
// che comincia, finisce e ricomincia — non un oggetto che vibra.
//
// E il gesto NON parte da solo: da fermo la griglia è ferma, e ogni figura si
// anima solo mentre il puntatore è sulla sua card. È la regola della griglia
// prodotti di Supabase, da cui questa sezione è presa: lì i nastri stanno in
// `pause` e ripartono con `group-hover:run`, e il terminale delle Edge
// Functions aspetta 200 ms prima di digitare. Sette figure che si agitano
// tutte insieme sono un albero di Natale; sette figure ferme di cui una si
// muove sotto la tua mano sono un meccanismo. Il come sta in home.css, nel
// blocco «Il gesto parte al passaggio» — e il come non è ovvio, perché mettere
// in pausa queste animazioni le congelerebbe sul fotogramma VUOTO.
//
// Le proprietà animate sono quattro, e sono tutte a buon mercato:
//   · transform e opacity, che muove il compositore senza ricalcolare niente;
//   · offset-distance, che il browser risolve in una transform;
//   · stroke-dashoffset, che ridisegna — ma qui ridisegna filetti da 1,5 px su
//     tavole di 280×132, non gradienti grandi quanto la card. È la stessa
//     eccezione che il grafo dei clienti si prendeva già prima.
//
// Qui dentro NON c'è più JavaScript. Il tabellone dei giochi era rimasto
// l'unico visual con del codice — una timeline GSAP in ciclo infinito che
// scriveva textContent a ogni frame per far salire un punteggio — e con lui se
// n'è andata l'ultima animazione della griglia che girava sul thread
// principale. Adesso il moto sta tutto in home.css, in keyframe che il browser
// mette in pausa da sé quando la scheda passa in secondo piano.
//
// Ogni disegno è fermo sul suo fotogramma FINITO: i valori base del CSS sono
// quelli di fine corsa, non di inizio. Così con prefers-reduced-motion basta
// spegnere le animazioni e resta il disegno completo, non uno mezzo tracciato.
//
// Convenzione i18n: i contenuti che non sono prosa (numeri, nomi di progetto,
// comandi da terminale) portano data-no-i18n + translate="no".
// ─────────────────────────────────────────────────────────────────────────────
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SiteLink } from "./nav";
import { IcArrowUpRight } from "./homeIcons";

/** Il movimento decorativo si accende solo se l'utente non l'ha disattivato. */
function motionOK() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero — bottoni dei progetti in corso

   Qui c'era anche una riga di stato "in diretta" ("Available for new projects"
   + l'orologio di Mantova, al secondo). È stata tolta: un cartello di
   disponibilità sopra al nome dice quanto lavoro manca, non quanto se ne fa, e
   l'orologio costava un render al secondo per un'informazione che nessuno era
   venuto a cercare. La hero adesso apre sul titolo.
   ═══════════════════════════════════════════════════════════════════════════ */

/* I lavori in corso. Se ne vede uno alla volta: per aggiungerne un altro basta
   una riga qui sotto — la giostra si adatta da sola, e con una voce sola sta
   ferma. `route: true` per le pagine di casa (SiteLink gestisce i
   sottodomini), altrimenti il sito del cliente si apre in una scheda nuova. */
const BUILDING: { name: string; href: string; route?: boolean }[] = [
  { name: "Cascina Fontana", href: "https://cascinafontana.xyz" },
  { name: "Rivalta sul Mincio", href: "https://rivaltasulmincio.it" },
];

/** Quanto resta fermo un nome prima di dare il cambio. */
const BUILD_HOLD = 4200;

/* Un bottone vero alla volta: entra da sotto la finestrella, resta il tempo di
   leggerlo e di premerlo, esce da sopra. Nel DOM ce n'è sempre uno solo —
   niente pile in position:absolute, niente turni da sincronizzare: il bersaglio
   è pieno e premibile per intero. E finché il puntatore (o il focus) sta
   dentro, il turno salta: un bersaglio che scappa mentre lo miri non è un
   bersaglio. */
export function NowBuilding() {
  const [i, setI] = useState(0);
  const itemRef = useRef<HTMLSpanElement>(null);
  const held = useRef(false);
  const first = useRef(true);
  const cur = BUILDING[i];

  // useLayoutEffect e non useEffect: il nome nuovo deve trovarsi già fuori
  // dalla finestrella al primo frame, altrimenti lampeggia al suo posto prima
  // di saltare giù.
  useLayoutEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const anim = motionOK();
    let alive = true;
    let timer = 0;

    // Il primo nome è già al suo posto: si anima solo chi arriva dopo.
    if (first.current) first.current = false;
    else if (anim) {
      gsap.fromTo(
        item,
        { yPercent: 115, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
      );
    }

    if (BUILDING.length > 1) {
      const advance = () => {
        if (alive) setI((v) => (v + 1) % BUILDING.length);
      };
      const turn = () => {
        if (!alive) return;
        if (held.current) {
          timer = window.setTimeout(turn, BUILD_HOLD);
          return;
        }
        if (anim) {
          gsap.to(item, {
            yPercent: -115,
            autoAlpha: 0,
            duration: 0.32,
            ease: "power2.in",
            onComplete: advance,
          });
        } else advance();
      };
      timer = window.setTimeout(turn, BUILD_HOLD);
    }

    return () => {
      alive = false;
      window.clearTimeout(timer);
      gsap.killTweensOf(item);
    };
  }, [i]);

  const hold = (on: boolean) => () => {
    held.current = on;
  };

  return (
    <div className="sb-nowbuild">
      <span className="sb-nowbuild-label">Currently building</span>
      <span
        className="sb-nowbuild-slot"
        data-no-i18n
        translate="no"
        onPointerEnter={hold(true)}
        onPointerLeave={hold(false)}
        onFocus={hold(true)}
        onBlur={hold(false)}
      >
        {/* key sul nome: il turno smonta il vecchio e monta il nuovo, così la
            fromTo di entrata parte sempre da un nodo pulito. */}
        <span className="sb-nowbuild-item" key={cur.name} ref={itemRef}>
          {cur.route ? (
            <SiteLink to={cur.href} className="sb-nowbuild-btn">
              {cur.name}
              <IcArrowUpRight size={13} aria-hidden="true" />
            </SiteLink>
          ) : (
            <a
              href={cur.href}
              target="_blank"
              rel="noreferrer noopener"
              className="sb-nowbuild-btn"
            >
              {cur.name}
              <IcArrowUpRight size={13} aria-hidden="true" />
            </a>
          )}
        </span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   La tavola comune

   Tutti e sette i disegni stanno su una tavola di 280×132 e passano di qui.
   Non è pigrizia: è la ragione per cui la griglia si legge come una collezione
   invece che come sette schermate. Stessa area, stesso margine, stesso tratto —
   quello che cambia è solo la figura.
   ═══════════════════════════════════════════════════════════════════════════ */

function Plate({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <svg
      className={`sb-ill sb-ill--${name}`}
      viewBox="0 0 280 132"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① Card "Web development" — il progetto di una pagina

   Un disegno tecnico: il telaio della pagina, la testata, il blocco grande e
   le due colonne, e ai lati le linee di quota con i trattini agli estremi —
   quelle che su una tavola dicono quanto è lungo un pezzo. È il modo in cui
   questo sito guarda una pagina web: come un manufatto da progettare, non come
   uno screenshot.

   Il gesto: si disegna. Ogni tratto ha pathLength="1" e un tratteggio lungo
   quanto sé stesso, quindi scoprirlo è solo questione di far scorrere
   stroke-dashoffset da 1 a 0 — senza sapere niente di quanto è lungo davvero.
   I ritardi in cascata (--i) fanno il resto: prima le quote, poi il telaio,
   poi il contenuto, come li metterebbe una mano.
   ═══════════════════════════════════════════════════════════════════════════ */

/** I tratti, in ordine di disegno. --i diventa il ritardo della cascata. */
const BLUEPRINT: string[] = [
  // quote: verticale a sinistra, orizzontale in basso (linea + trattini)
  "M22,18 L22,114 M17,18 L27,18 M17,114 L27,114",
  "M48,124 L262,124 M48,119 L48,129 M262,119 L262,129",
  // telaio della pagina
  "M54,18 L256,18 A6,6 0 0,1 262,24 L262,108 A6,6 0 0,1 256,114 L54,114 A6,6 0 0,1 48,108 L48,24 A6,6 0 0,1 54,18 Z",
  // testata
  "M48,38 L262,38",
  // blocco grande, con la diagonale che sulle tavole vuol dire "immagine"
  "M64,50 L246,50 L246,80 L64,80 Z",
  "M64,80 L246,50",
  // due colonne in fondo
  "M64,90 L150,90 L150,104 L64,104 Z",
  "M160,90 L246,90 L246,104 L160,104 Z",
];

export function BlueprintPage() {
  return (
    <Plate name="blue">
      {BLUEPRINT.map((d, i) => (
        <path
          key={d}
          className="sb-ill-draw"
          d={d}
          pathLength="1"
          strokeDasharray="1"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {/* I tre bollini della testata: fermi, e ci vogliono — sono il dettaglio
          che dice "finestra" senza doverci disegnare una finestra intorno. */}
      {[66, 78, 90].map((cx) => (
        <circle key={cx} className="sb-ill-dot" cx={cx} cy={28} r={3} />
      ))}
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ② Card "Web design" — il saggio tipografico

   Le due lettere in contorno sulla griglia del disegnatore di caratteri: linea
   di base, altezza della x, altezza delle maiuscole. È l'immagine che un
   tipografo ha davanti tutto il giorno, ed è anche la risposta più onesta a
   "cosa vuol dire progettare un'interfaccia": decidere dove passano le righe.

   Il gesto: si inchiostra. Il contorno resta sempre, e sotto compare il pieno
   — la stessa lettera, ripetuta e riempita, che sfuma dentro e fuori. Una sola
   proprietà (opacity) per una cosa che sembra un cambio di materia.
   ═══════════════════════════════════════════════════════════════════════════ */

export function TypeSpecimen() {
  return (
    <Plate name="type">
      {/* La griglia: tre rette e le loro etichette. Tratteggiata, perché una
          guida che si confonde col disegno smette di essere una guida. */}
      <g className="sb-ill-guide">
        <path d="M18,34 L262,34" />
        <path d="M18,57 L262,57" />
        <path d="M18,112 L262,112" />
      </g>
      <g className="sb-ill-tick" data-no-i18n>
        <text x="18" y="30">cap</text>
        <text x="18" y="53">x</text>
        <text x="18" y="124">base</text>
      </g>
      {/* Le lettere. Due nodi sovrapposti: il contorno sempre acceso, il pieno
          che va e viene. Stesso testo, stessa posizione — il disegno non si
          muove di un pixel, cambia solo di che pasta è fatto. */}
      <text className="sb-ill-glyph-ink" x="140" y="112" data-no-i18n translate="no">
        Aa
      </text>
      <text className="sb-ill-glyph" x="140" y="112" data-no-i18n translate="no">
        Aa
      </text>
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ③ Card "AI-assisted development" — il prisma

   Un raggio entra, dentro il vetro piega, ed esce aperto in cinque. È esatta-
   mente il mestiere: una richiesta sola da una parte, e dall'altra cinque
   strade che prima non c'erano. Nessuna scintilla, nessun cervello stilizzato,
   nessun robot — la figura di un libro di ottica.

   Un solo azzurro, come tutto il resto del sito: il ventaglio non si apre in
   arcobaleno, si apre in cinque intensità dello stesso colore.

   Il gesto: il raggio arriva, attraversa, e il ventaglio si apre a rastrello
   (--i sui cinque raggi). Tutto su stroke-dashoffset, quindi un tratto che
   cresce dalla sua origine e basta.

   ── E la riga di comando che si riscrive ────────────────────────────────────
   Sotto al prisma c'è una pillola con dentro un comando. Viene dalla card
   Edge Functions di Supabase, dove al centro del globo sta `$ supabase
   functions deploy` e l'ultima parola, al passaggio del puntatore, si cancella
   e si riscrive in `serve`. È il modo più breve che conosca per dire "questa
   cosa la guidi da riga di comando" senza disegnare un terminale.

   Loro lo fanno con typed.js: una libreria che scrive textContent lettera per
   lettera. Qui non serve, e infatti non c'è — la card AI un terminale a
   JavaScript ce l'aveva già avuto, ed era stato tolto proprio per quello. Le
   due parole sono due span, e a scriverle è la LARGHEZZA che cresce a scatti
   di un carattere (steps(), misure in ch): la stessa resa, zero JavaScript.

   Sì, la larghezza è una proprietà di layout — la sola di tutta la griglia.
   Costa poco lo stesso per due motivi: con steps() i fotogrammi veri sono
   dieci in tutto invece di uno per frame, e la pillola è in posizione assoluta,
   quindi il ricalcolo si ferma dentro di lei e non tocca la card.
   ═══════════════════════════════════════════════════════════════════════════ */

/** I cinque raggi in uscita: stessa origine sulla faccia destra del prisma. */
const FAN = [
  "M152,78 L266,40",
  "M152,78 L266,56",
  "M152,78 L266,72",
  "M152,78 L266,88",
  "M152,78 L266,104",
];

export function PrismFan() {
  return (
    <div className="sb-ill-stage">
      <Plate name="prism">
        {/* Il prisma. La velatura interna è ferma: è il vetro, non un effetto. */}
        <path className="sb-ill-glass" d="M128,20 L164,100 L92,100 Z" />
        <path className="sb-ill-edge" d="M128,20 L164,100 L92,100 Z" />

        {/* Il raggio in arrivo, e il tratto che dentro al vetro piega verso il
            basso: due segmenti, in fila. */}
        <path className="sb-ill-beam" d="M14,64 L106,64" pathLength="1" strokeDasharray="1" />
        <path className="sb-ill-beam sb-ill-beam--in" d="M106,64 L152,78" pathLength="1" strokeDasharray="1" />

        {FAN.map((d, i) => (
          <path
            key={d}
            className="sb-ill-ray"
            d={d}
            pathLength="1"
            strokeDasharray="1"
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </Plate>

      {/* Il comando. data-no-i18n perché è un comando, non prosa: il motore
          i18n non lo tocca, e non deve — "review" tradotto smetterebbe di
          essere lungo sei caratteri e la larghezza in ch andrebbe a farsi
          benedire. */}
      <span className="sb-typebar" aria-hidden="true" data-no-i18n translate="no">
        <span className="sb-typebar-p">$</span> claude code{" "}
        <span className="sb-typebar-w sb-typebar-w--a">review</span>
        <span className="sb-typebar-w sb-typebar-w--b">ship</span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ④ Card "Web games" — la traiettoria

   Tre rimbalzi che si abbassano, disegnati come li disegnerebbe un manuale di
   fisica: la linea del terreno, la curva, e i punti di contatto. Un gioco non
   è un tabellone di punti — è una cosa che si muove come ci si aspetta e poi
   un pochino di più.

   Prima qui c'era un punteggio che saliva: l'unico visual della griglia con
   del JavaScript, una timeline in ciclo infinito che scriveva testo a ogni
   frame per far girare tre cifre. Quello che raccontava — "i giochi hanno un
   punteggio" — lo dice già la card a parole.

   Il gesto: la palla corre. Si muove su offset-path, cioè il browser la fa
   scivolare lungo il tracciato risolvendolo in una transform; ai contatti,
   sotto, si apre un anello. Gli anelli sono quattro perché i contatti sono
   quattro, e partono ai millesimi in cui la palla ci arriva davvero (le
   frazioni sono misurate sulla lunghezza degli archi, non sulla x — un arco
   alto è più lungo di uno basso a parità di distanza percorsa).
   ═══════════════════════════════════════════════════════════════════════════ */

/** Il tracciato, condiviso da tre posti: la linea disegnata, l'offset-path
 *  della palla (in home.css) e la posizione degli anelli. */
const RUN_PATH = "M14,112 Q54,16 94,112 Q127,44 160,112 Q186,70 212,112 Q233,90 254,112";

/** I contatti col terreno, con la frazione di corsa in cui la palla ci arriva.
 *  Le frazioni sono misurate sulla LUNGHEZZA degli archi, non sulla x: il
 *  primo salto è alto il quadruplo dell'ultimo, quindi a parità di distanza
 *  percorsa la palla ci mette molto di più. */
const HITS: [number, number][] = [
  [94, 0.37],
  [160, 0.65],
  [212, 0.86],
  [254, 1],
];

export function BounceRun() {
  return (
    <Plate name="run">
      <path className="sb-ill-ground" d="M8,112 L272,112" />
      {/* Il tracciato resta acceso: è la traccia del salto, e una traiettoria
          senza traccia è solo un pallino che si sposta. */}
      <path className="sb-ill-arc" d={RUN_PATH} />

      {HITS.map(([cx, at]) => (
        <circle
          key={cx}
          className="sb-ill-hit"
          cx={cx}
          cy={112}
          r={8}
          style={{ "--at": at } as React.CSSProperties}
        />
      ))}

      {/* Il traguardo, dove la palla si ferma. Fermo anche lui. */}
      <path className="sb-ill-flag" d="M256,112 L256,72 L276,80 L256,88" />

      <circle className="sb-ill-ball" cx={0} cy={0} r={7} />
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ Card "Web tools" — due insiemi

   Il diagramma di Venn, disegnato come si deve: due cerchi, i puntini dentro,
   e la lente in mezzo. È letteralmente quello che fa lo strumento della card —
   prendere due elenchi e tenere quello che sta in mezzo — ed è anche l'icona
   che quella card ha già in testa (IcVenn), quindi la figura e il titolo si
   dicono la stessa cosa.

   Il gesto: l'intersezione si accende. La lente compare crescendo dal centro e
   i puntini che le stanno dentro si illuminano insieme a lei; gli altri
   restano dove sono. Nessun cerchio scivola: le due lenti dovrebbero
   ridisegnarsi a ogni frame, e la forma dell'intersezione è un dato del
   disegno, non un'animazione.
   ═══════════════════════════════════════════════════════════════════════════ */

/** I due archi che formano la lente. I punti (140, 26.7) e (140, 105.3) sono
 *  le intersezioni vere di due cerchi di raggio 52 a distanza 68. */
const LENS = "M140,26.7 A52,52 0 0,1 140,105.3 A52,52 0 0,1 140,26.7";

/** Puntini: [x, y, dentro la lente?] */
const DOTS: [number, number, boolean][] = [
  [82, 44, false], [66, 68, false], [88, 92, false], [104, 34, false], [76, 56, false],
  [198, 46, false], [212, 70, false], [196, 94, false], [176, 36, false],
  [134, 50, true], [146, 68, true], [136, 88, true], [147, 40, true],
];

export function VennSets() {
  return (
    <Plate name="venn">
      <circle className="sb-ill-set" cx={106} cy={66} r={52} />
      <circle className="sb-ill-set" cx={174} cy={66} r={52} />
      <path className="sb-ill-lens" d={LENS} />
      {DOTS.map(([cx, cy, inside]) => (
        <circle
          key={`${cx}-${cy}`}
          className={inside ? "sb-ill-seed sb-ill-seed--in" : "sb-ill-seed"}
          cx={cx}
          cy={cy}
          r={inside ? 3.2 : 2.6}
        />
      ))}
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ Card "Client websites" — il globo

   Un globo a filo (meridiani e paralleli) con due satelliti che gli girano
   intorno: i due siti dei clienti, online. Prima qui c'era un grafo con un
   nodo centrale e due fili che si accendevano a turno; diceva la stessa cosa
   con la grammatica di uno schema di rete, che è la meno bella delle
   grammatiche disponibili per dire "sono nel mondo".

   Il gesto: i satelliti orbitano. Una sola animazione per tutti e due — al
   secondo basta mezzo giro di ritardo per stare dalla parte opposta — e
   passando DIETRO al globo si smorzano. È quello smorzarsi che dà la
   profondità: senza, l'ellisse resta un anello piatto disegnato sopra.
   ═══════════════════════════════════════════════════════════════════════════ */

export function GlobeOrbit() {
  return (
    <Plate name="globe">
      <circle className="sb-ill-globe" cx={140} cy={66} r={56} />
      {/* Meridiani: ellissi sempre più strette, tutte centrate. */}
      <ellipse className="sb-ill-globe" cx={140} cy={66} rx={19} ry={56} />
      <ellipse className="sb-ill-globe" cx={140} cy={66} rx={38} ry={56} />
      {/* Paralleli: corde orizzontali, tagliate alla misura del cerchio. */}
      <path className="sb-ill-globe" d="M90.4,40 L189.6,40" />
      <path className="sb-ill-globe" d="M84,66 L196,66" />
      <path className="sb-ill-globe" d="M90.4,92 L189.6,92" />

      {/* L'orbita, inclinata. Il gruppo porta la rotazione così il tracciato
          resta un'ellisse dritta: quello che ci corre sopra non deve sapere
          niente dell'inclinazione. */}
      <g className="sb-ill-orbit">
        <ellipse className="sb-ill-track" cx={140} cy={66} rx={88} ry={28} />
        <circle className="sb-ill-sat" r={5} />
        <circle className="sb-ill-sat sb-ill-sat--b" r={5} />
      </g>
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑦ Card "CAT · Technical area" — le curve di livello

   Il terreno visto da sopra: sei curve di livello annidate e, al centro, il
   simbolo del punto trigonometrico — triangolo con il punto dentro, quello
   che sulle carte dell'IGM segna un vertice misurato. Questa è la card
   dell'area tecnica del geometra: prima c'era un cubo che galleggiava su un
   piano cartesiano, che è la topografia come se la immagina un programmatore.
   Una carta a curve di livello è la topografia come la disegna chi la fa.

   Le sei curve sono la STESSA curva, scalata e ruotata di poco: annidate in
   modo troppo regolare sembrerebbero un bersaglio, e le curve di livello di un
   rilievo vero non sono mai concentriche.

   Due movimenti, e stavolta sono due perché sono di due nature diverse:
    · la quota che sale — le curve si accendono una dopo l'altra dall'esterno
      verso il centro, che è poi come si legge un rilievo;
    · la tavola che si orienta verso il puntatore, con --vis-x/--vis-y (le
      scrive site/GlassMotion.tsx sul riquadro sotto il cursore). È l'unico
      posto della griglia dove il puntatore comanda ancora qualcosa, ed è
      rimasto qui perché agisce DENTRO una transform — dove costa quanto le
      altre. Era la stessa concessione che aveva il cubo di prima.
   ═══════════════════════════════════════════════════════════════════════════ */

/** La curva base, irregolare come dev'essere. Le altre sono questa in scala. */
const CONTOUR =
  "M140,14 C176,14 208,30 210,56 C212,82 190,104 158,112 C126,120 92,110 78,88 C64,66 74,36 100,22 C113,15 127,14 140,14 Z";

/** Scala e rotazione di ciascuna curva, dalla più esterna alla più interna.
 *  Le rotazioni non sono un vezzo: sei copie in scala pura si leggono come un
 *  bersaglio, e le curve di livello di un rilievo vero non sono concentriche —
 *  un versante è più ripido dell'altro, e le curve si stringono da quella
 *  parte. Bastano pochi gradi, diversi di segno, per toglierle dal centro. */
const LEVELS: [number, number][] = [
  [1.12, 0],
  [0.94, -4],
  [0.76, 3],
  [0.6, -6],
  [0.44, 4],
  [0.29, -3],
];

export function ContourPlate() {
  return (
    <div className="sb-ill-plate">
      <Plate name="topo">
        {LEVELS.map(([scale, rot], i) => (
          <path
            key={scale}
            className="sb-ill-level"
            d={CONTOUR}
            style={
              {
                "--i": i,
                transform: `rotate(${rot}deg) scale(${scale})`,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Punto trigonometrico: triangolo, punto al centro, croce di
            collimazione. Fermo — è la quota misurata, l'unica cosa della
            tavola che non è un'interpolazione. */}
        <path className="sb-ill-vertex" d="M138,50 L151,72 L125,72 Z" />
        <circle className="sb-ill-vertex-dot" cx={138} cy={65} r={2.6} />
        <path className="sb-ill-cross" d="M138,40 L138,50 M138,72 L138,82 M115,65 L125,65 M151,65 L161,65" />
      </Plate>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sezione open source — muro dei commit.

   Da fermo resta fermo: l'onda di calore che lo attraversava in continuazione
   (119 celle in animazione perenne, un ridisegno a ogni frame anche mentre si
   scorreva dall'altra parte della pagina) non è tornata e non torna.

   Quello che c'è adesso vive solo sotto il puntatore: data-puddle accende la
   pozza d'acqua di site/puddle.ts, che esiste finché il cursore è dentro la
   griglia e si spegne uscendo. Ferma, non costa niente. È il posto dove questa
   idea era già stata messa alla prova prima di portarla su tutte le card.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   IL MURO DEI COMMIT — il numero scritto coi quadratini

   Preso dalla sezione "Open source from day one" di supabase.com, che è la
   stessa sezione di questa pagina. Lì il fondale della metà destra è un finto
   grafo delle contribuzioni dove le celle accese compongono il conteggio delle
   stelle del repo (108.2K). È l'unico pezzo grosso della loro home che è tutto
   codice, senza un solo SVG disegnato a mano: il numero non è un'immagine, è
   una maschera di pixel accesi dentro una griglia di rumore.

   Qui il numero è quello che il sito conta già: i commit di questo repository.
   Vive in COMMITS, una volta sola — lo leggono sia il muro sia la riga sotto
   al grafico del profilo, che prima si portava lo stesso 1200 scritto a mano
   in due posti diversi.

   ── Perché sta DIETRO alla lastra, non accanto ──────────────────────────────
   Il muro passa sotto al pannello del profilo GitHub. La regola sta scritta in
   testa a site/GlassMotion.tsx: una lastra semitrasparente si legge come
   lastra solo se dietro c'è qualcosa che cambia, perché sfocare una tinta
   piatta dà lo stesso risultato che non sfocare niente. Fin qui, dietro quel
   pannello, c'era il fondo della pagina e basta. Adesso c'è una griglia, e il
   vetro ha finalmente qualcosa da sfocare.

   ── Il carattere ────────────────────────────────────────────────────────────
   Cinque colonne per sette righe a glifo, un pixel di spazio fra uno e
   l'altro: la misura minima in cui una cifra resta una cifra — sotto le cinque
   colonne lo zero e l'otto diventano lo stesso disegno.
   ═══════════════════════════════════════════════════════════════════════════ */

/** I commit del repository. Un numero solo, letto da due posti. */
const COMMITS = 1200;

/** 1200 → "1.2K". La stessa forma abbreviata che Supabase usa per le stelle:
 *  sotto il migliaio il numero si scrive per intero, sopra si accorcia. */
function kFormat(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
}

/** Il carattere a pixel: 5 colonne × 7 righe per glifo, "1" = acceso. */
const GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["01110", "10001", "00001", "00110", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10001", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "10001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
};

/** Le celle accese del testo, in coordinate del testo (0,0 = il suo angolo
 *  alto a sinistra). Un Set di "x,y": la griglia poi chiede a lui, cella per
 *  cella, se le tocca far parte del numero. */
function pixelMask(text: string): Set<string> {
  const mask = new Set<string>();
  let x = 0;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (g) {
      for (let r = 0; r < g.length; r++) {
        for (let c = 0; c < g[r].length; c++) {
          if (g[r][c] === "1") mask.add(x + c + "," + r);
        }
      }
    }
    x += 6; // 5 di glifo + 1 di spazio
  }
  return mask;
}

/* ── La griglia ──────────────────────────────────────────────────────────────
   Misure in unità di viewBox: cella 3, spazio 0,5. Le colonne sono meno di
   quelle di Supabase (44 contro 72) perché il numero è più corto — "1.2K" sono
   quattro glifi contro sei — e la proporzione fra testo e fondo va tenuta, o
   il numero galleggia in mezzo al rumore invece di riempirlo. */
const CELL = 3;
const GAP = 0.5;
const COLS = 44;
const ROWS = 25;

const WALL_TEXT = kFormat(COMMITS);
const WALL_MASK = pixelMask(WALL_TEXT);
const TEXT_X = Math.floor((COLS - (WALL_TEXT.length * 6 - 1)) / 2);
const TEXT_Y = Math.floor((ROWS - 7) / 2);

/** Rumore di fondo ripetibile: xorshift con seme fisso, così il muro è lo
 *  stesso disegno a ogni render e a ogni ricarica. Un fondale che cambia da
 *  solo a ogni visita è un fondale che si fa notare. */
function makeWall() {
  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  };
  const cells: { c: number; r: number; lv: number; on: boolean }[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const v = rand();
      cells.push({
        c,
        r,
        lv: v < 0.45 ? 0 : v < 0.65 ? 1 : v < 0.8 ? 2 : v < 0.92 ? 3 : 4,
        on: WALL_MASK.has(c - TEXT_X + "," + (r - TEXT_Y)),
      });
    }
  }
  return cells;
}

const WALL = makeWall();
const WALL_W = COLS * (CELL + GAP) - GAP;
const WALL_H = ROWS * (CELL + GAP) - GAP;

export function CommitWall() {
  return (
    <svg
      className="sb-cwall"
      viewBox={"0 0 " + WALL_W + " " + WALL_H}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {WALL.map(({ c, r, lv, on }) => (
        <rect
          key={c + "-" + r}
          className={on ? "sb-cwall-cell sb-cwall-cell--on" : "sb-cwall-cell"}
          x={c * (CELL + GAP)}
          y={r * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={1}
          data-lv={lv}
          /* Il ritardo dell'accensione: il fondo si apre da sinistra a destra,
             il numero arriva dopo che il fondo è passato di lì. Due tempi e non
             uno — accendendoli insieme il numero nascerebbe già dentro il
             rumore, invece di emergerne. */
          style={{ "--d": (on ? 0.3 : 0) + c * 0.02 + r * 0.01 + "s" } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

const WEEKS = 17;
const DAYS = 7;

export function ContribGraph() {
  // Intensità pseudo-casuale ma stabile: stesso disegno a ogni render.
  const level = (i: number) => [0, 1, 1, 2, 0, 3, 2, 1, 4, 0, 2, 3, 1, 0][i % 14];

  return (
    <div className="sb-contrib" aria-hidden="true">
      <div className="sb-contrib-grid" data-puddle>
        {Array.from({ length: WEEKS * DAYS }, (_, i) => (
          <span key={i} className="sb-cell" data-lv={level(i)} />
        ))}
      </div>
      <div className="sb-contrib-foot">
        <span>
          {/* Il valore finale è già nel markup: se il conteggio non parte
              (movimento ridotto), il numero resta comunque giusto. */}
          <b data-count-to={COMMITS} data-count-suffix="+" data-no-i18n translate="no">
            {COMMITS.toLocaleString("it-IT")}+
          </b>{" "}
          commits
        </span>
        <span className="sb-contrib-legend" data-puddle>
          <i data-lv="0" />
          <i data-lv="1" />
          <i data-lv="2" />
          <i data-lv="3" />
          <i data-lv="4" />
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Riga "trusted by" — stato di servizio accanto a ogni cliente.

   Il pallino non pinga più ogni 2,6 secondi (per riga, con delay scaglionati:
   quattro anelli che si allargavano a turno in eterno). Sta acceso e fermo —
   che è poi quello che vuol dire "live" — e l'anello parte sulla riga che
   punti, una volta. Il CSS sta in home.css.
   ═══════════════════════════════════════════════════════════════════════════ */

export function TrustedDot() {
  return <i className="sb-chip-dot sb-chip-dot--sm" aria-hidden="true" />;
}
