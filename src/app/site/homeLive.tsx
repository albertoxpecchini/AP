// ─────────────────────────────────────────────────────────────────────────────
// I disegni della griglia prodotti.
//
// ── Due giri, e questo è il terzo ────────────────────────────────────────────
// Prima erano sette finte schermate — una finestra che si riempiva, un
// terminale che digitava, un tabellone che contava punti. Tutte la stessa idea
// («mettiamo dentro la card una miniatura della cosa»), e sette miniature di
// cose diverse non fanno una famiglia: fanno sette schermate.
//
// Poi sono diventate sette figure a tratto sulla stessa tavola, come le tavole
// di un manuale. Quello era il giro giusto sulla FAMIGLIA — stessa area, stesso
// spessore, si leggevano come una collezione — e sbagliato su tutto il resto:
// erano tratti sospesi nel vuoto, e nel vuoto un disegno tecnico sembra una
// clipart.
//
// Adesso stanno su un TERRENO, che è quello che hanno le quattro tavole di
// Supabase da cui vengono (Realtime, Vector, Storage, Postgres Database) e che
// era la sola cosa che mancava. Tre strati, sempre gli stessi:
//
//   ① la carta millimetrata, che sfuma ai bordi;
//   ② l'alone della tinta della card, che dà un centro alla figura;
//   ③ la figura, con sopra pezzi di interfaccia veri — pillole, riquadri,
//      cursori, righe con il marchio.
//
// Il terzo strato è quello che separa un'illustrazione da un pezzo di prodotto:
// un cursore e una bollicina «sta scrivendo» sono cose che il lettore ha già
// visto succedere davvero, e non le deve decifrare.
//
//   ① Siti web          → una finestra e tre echi di sé stessa       (gli echi si aprono)
//   ② Rivalta e Cascina → un piano di tre quarti, due spilli,
//                          e sotto i due domini che sono online      (gli spilli saltano)
//   ③ Sviluppo con l'IA → due cursori e tre bollicine, una accesa    (i puntini battono)
//   ④ Fotografia        → un provino a contatto, un fotogramma solo
//                          cerchiato — e nessun volto, perché non si
//                          pubblicano                                (l'anello salta)
//   ⑤ Il geometra       → un volume in assonometria, vertici e quota (i vertici si agganciano)
//   ⑥ Auto              → un contagiri con la scia della lancetta    (la lancetta sale)
//
// Da quale tavola loro viene ciascuna, e perché quella lì, sta scritto sopra
// ogni figura.
//
// ── Le regole del movimento ──────────────────────────────────────────────────
// Una cosa sola in movimento per riquadro, e quella cosa è un GESTO: qualcosa
// che comincia, finisce e ricomincia — non un oggetto che vibra.
//
// E il gesto NON parte da solo: da fermo la griglia è ferma, e ogni figura si
// anima solo mentre il puntatore è sulla sua card. È la regola della griglia
// prodotti di Supabase, da cui questa sezione è presa: lì i nastri stanno in
// `pause` e ripartono con `group-hover:run`, e il terminale delle Edge
// Functions aspetta 200 ms prima di digitare. Sei figure che si agitano tutte
// insieme sono un albero di Natale; sei figure ferme di cui una si muove sotto
// la tua mano sono un meccanismo. Il come sta in home.css, nel blocco «Il gesto
// parte al passaggio» — e il come non è ovvio, perché mettere in pausa queste
// animazioni le congelerebbe sul primo fotogramma, che è quello vuoto.
//
// Le proprietà animate sono tre, e sono tutte a buon mercato: transform e
// opacity, che il compositore muove senza ricalcolare niente, e fill su cerchi
// da 3 px (i vertici del volume). L'unica animazione di layout è la pillola del
// comando, che cresce di un carattere alla volta: perché lì si possa fare sta
// scritto in home.css, sopra .sb-typebar.
//
// Qui dentro NON c'è JavaScript. Il moto sta tutto in home.css, in keyframe che
// il browser mette in pausa da sé quando la scheda passa in secondo piano.
//
// Ogni disegno è fermo sul suo fotogramma FINITO: i valori base del CSS sono
// quelli di fine corsa, non di inizio. Così con prefers-reduced-motion basta
// spegnere le animazioni e resta il disegno completo, non uno a metà.
//
// Convenzione i18n: i contenuti che non sono prosa (numeri, nomi di progetto,
// domini, comandi da terminale) portano data-no-i18n + translate="no".
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
   LA TAVOLA COMUNE — adesso è una tavola, non un foglio trasparente

   Tutte e sei le figure stanno su 280×132 e passano di qui. Fin qui la tavola
   era vuota e il disegno galleggiava; le figure di Supabase da cui viene
   questa griglia — Realtime, Vector, Storage, Postgres — non galleggiano, e la
   ragione è che sotto hanno un TERRENO. Sono tre strati, sempre gli stessi:

     ① la carta millimetrata, che sfuma ai bordi e dice «qui si progetta»;
     ② un alone della tinta della card, che dà un centro alla figura;
     ③ la figura, in tratto pieno, con sopra pezzi di interfaccia veri —
        pillole, riquadri, cursori, righe con il marchio.

   Il terzo strato è quello che fa la differenza fra un'illustrazione e un
   prodotto: un cursore e una bollicina «sta scrivendo» sono cose che il
   lettore ha già visto succedere sul serio, quindi la figura non la deve
   decifrare. Le quattro tavole loro sono fatte tutte così, e da qui in giù
   lo sono anche queste.

   ── La sfumatura, e perché è una maschera ───────────────────────────────────
   La griglia non può finire di netto: un rettangolo di quadretti dentro una
   card è una texture applicata, e si vede che è incollata. Sfuma con una
   maschera radiale — bianco pieno al centro, trasparente ai bordi — che è
   l'unico modo di far sparire un pattern SVG senza disegnargli sopra un velo
   del colore del fondo. Quel velo qui non funzionerebbe: sotto c'è vetro, e
   dietro al vetro c'è la pagina che scorre, non una tinta piatta.

   ── L'alone prende la tinta da sé ───────────────────────────────────────────
   Lo stop del gradiente è `currentColor`, e il colore della tavola è
   --sb-accent (vedi .sb-ill nel foglio). Quindi l'alone della card blu è blu e
   quello della card rosa è rosa senza che qui dentro ci sia scritto un colore:
   la tinta arriva dal data-acc della card, come tutto il resto.
   ═══════════════════════════════════════════════════════════════════════════ */

function Plate({ name, children }: { name: string; children: React.ReactNode }) {
  // Gli id devono essere unici nel documento: sei tavole, sei prefissi.
  const grid = `sb-pg-${name}`;
  const fade = `sb-pf-${name}`;
  const glow = `sb-pw-${name}`;
  return (
    <svg
      className={`sb-ill sb-ill--${name}`}
      viewBox="0 0 280 170"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={grid} width="11" height="11" patternUnits="userSpaceOnUse">
          <path className="sb-ill-gridline" d="M11,0 L0,0 L0,11" />
        </pattern>
        <radialGradient id={fade} cx="50%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="58%" stopColor="#fff" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${fade}-m`}>
          <rect width="280" height="170" fill={`url(#${fade})`} />
        </mask>
        <radialGradient id={glow} cx="50%" cy="54%" r="54%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask={`url(#${fade}-m)`}>
        <rect width="280" height="170" fill={`url(#${grid})`} />
      </g>
      <rect className="sb-ill-glow" width="280" height="170" fill={`url(#${glow})`} />
      {children}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① Card «Siti web» — la finestra e i suoi echi

   Rifatta sulla tavola Postgres Database di Supabase: un glifo grande, in
   tratto pieno, e dietro tre copie di sé stesso ruotate di pochi gradi e quasi
   trasparenti. Le copie non sono un'ombra — sono la stessa forma stampata più
   volte, e quello che dicono è «non è un esemplare, è un mestiere»: di
   finestre come questa ne escono a ripetizione.

   Il gesto: al passaggio gli echi si aprono un altro po', come un mazzo di
   carte che si sventaglia, e tornano. Una transform sola per copia.
   ═══════════════════════════════════════════════════════════════════════════ */

/** I tre echi dietro alla finestra: rotazione e opacità, dal più lontano. */
const ECHOES: [number, number][] = [
  [-9, 0.16],
  [-4.5, 0.26],
  [4.5, 0.38],
];

export function BlueprintPage() {
  return (
    <Plate name="win">
      <defs>
        {/* La finestra, disegnata una volta sola all'origine: le quattro copie
            sono quattro <use>, cioè quattro riferimenti, non quattro disegni. */}
        <g id="sb-win">
          <rect className="sb-ill-frame" x="1" y="1" width="208" height="130" rx="11" />
          <path className="sb-ill-line" d="M1,29 L209,29" />
          <circle className="sb-ill-dot" cx="16" cy="14" r="3" />
          <circle className="sb-ill-dot" cx="27" cy="14" r="3" />
          <circle className="sb-ill-dot" cx="38" cy="14" r="3" />
          <rect className="sb-ill-block" x="16" y="43" width="52" height="72" rx="5" />
          <rect className="sb-ill-block sb-ill-block--hi" x="78" y="43" width="114" height="34" rx="5" />
          <rect className="sb-ill-block" x="78" y="85" width="114" height="12" rx="4" />
          <rect className="sb-ill-block" x="78" y="103" width="72" height="12" rx="4" />
        </g>
      </defs>
      {ECHOES.map(([rot, op], i) => (
        <use
          key={rot}
          className="sb-ill-echo"
          href="#sb-win"
          x={35}
          y={20}
          style={{ "--r": `${rot}deg`, "--o": op, "--i": i } as React.CSSProperties}
        />
      ))}
      <use className="sb-ill-front" href="#sb-win" x={35} y={20} />
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ② Card «Rivalta e Cascina Fontana» — il piano e i due spilli

   Rifatta sulla tavola Vector di Supabase, che è fatta di due pezzi: un
   oggetto in assonometria al centro e, in basso, le righe con il marchio di
   chi ci sta dentro (lì OpenAI e Hugging Face). Qui l'oggetto è il terreno —
   un piano quadrettato visto di tre quarti — e le due righe sono i due domini
   che stanno online davvero. È la stessa impaginazione, e dice una cosa vera
   invece di una categoria.

   I due spilli stanno piantati nel piano, uno acceso della tinta della card e
   uno no: sono due, e sono due perché i clienti sono due.

   Il gesto: gli spilli fanno un saltello, sfalsato.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le sei righe del piano: tre per verso, interpolate sui lati del rombo. */
const PLANE_LINES = [
  "M115,56 L215,99",
  "M90,67 L190,109",
  "M65,78 L165,120",
  "M165,56 L65,99",
  "M190,67 L90,109",
  "M215,78 L115,120",
];

/** Il marchietto delle due righe: un mappamondo da 16px. */
function RowMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M1.8,8 L14.2,8 M8,1.8 C10.4,4.2 10.4,11.8 8,14.2 C5.6,11.8 5.6,4.2 8,1.8" />
    </svg>
  );
}

/** Uno spillo: ombra sul piano, gambo, testa. `on` = quello acceso. */
function Pin({ x, y, h, on, i }: { x: number; y: number; h: number; on?: boolean; i: number }) {
  return (
    <g className={`sb-ill-pin${on ? " sb-ill-pin--on" : ""}`} style={{ "--i": i } as React.CSSProperties}>
      <ellipse className="sb-ill-pinshadow" cx={x} cy={y} rx={7} ry={2.6} />
      <path className="sb-ill-pinstem" d={`M${x},${y} L${x},${y - h}`} />
      <circle className="sb-ill-pinhead" cx={x} cy={y - h - 5} r={5.5} />
      <circle className="sb-ill-pincore" cx={x} cy={y - h - 5} r={2} />
    </g>
  );
}

export function GlobeOrbit() {
  return (
    <div className="sb-ill-stage">
      <Plate name="iso">
        <path className="sb-ill-plane" d="M140,46 L240,88 L140,130 L40,88 Z" />
        {PLANE_LINES.map((d) => (
          <path key={d} className="sb-ill-planeline" d={d} />
        ))}
        <Pin x={108} y={80} h={34} on i={0} />
        <Pin x={176} y={98} h={26} i={1} />
      </Plate>

      {/* Le due righe con il marchio. Sono HTML e non SVG perché sono testo
          vero — due domini, che si leggono — e perché il carattere dev'essere
          quello del sito, non un'approssimazione dentro un <text>.
          translate="no": un nome a dominio non si traduce. */}
      <span className="sb-illrows" aria-hidden="true" translate="no" data-no-i18n>
        <span className="sb-illrow">
          <RowMark />
          rivaltasulmincio.it
        </span>
        <span className="sb-illrow">
          <RowMark />
          cascinafontana.xyz
        </span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ③ Card «Sviluppo assistito dall'IA» — due cursori e tre bollicine

   Rifatta sulla tavola Realtime di Supabase: due cursori su un foglio a
   quadretti e le bollicine dei tre puntini, quelle di «sta scrivendo», una
   sola accesa. Lì dicono «più persone sullo stesso documento»; qui la seconda
   persona è la macchina, ed è esattamente il mestiere della card — si scrive
   in due, e uno dei due non è umano.

   Il prisma che c'era prima era una bella figura di ottica e non diceva
   questo: diceva «una domanda entra, cinque risposte escono», che è come uno
   immagina l'IA prima di lavorarci.

   La pillola col comando resta dov'era, ed è ancora il pezzo più onesto della
   tavola: dice che questa roba la si guida da riga di comando.

   Il gesto: i tre puntini della bollicina accesa battono a turno.
   ═══════════════════════════════════════════════════════════════════════════ */

/** La sagoma del cursore, disegnata all'origine e portata sul posto da CSS. */
const CURSOR_D = "M0,0 L0,15 L4.2,11.2 L6.8,17 L9.6,15.8 L7,10.2 L12,10.2 Z";

/** Una bollicina «sta scrivendo»: pillola e tre puntini. */
function Bubble({ x, y, on }: { x: number; y: number; on?: boolean }) {
  return (
    <g className={`sb-ill-bubble${on ? " sb-ill-bubble--on" : ""}`}>
      <rect x={x} y={y} width={52} height={24} rx={12} />
      {[16, 26, 36].map((dx, i) => (
        <circle
          key={dx}
          className="sb-ill-bdot"
          cx={x + dx}
          cy={y + 12}
          r={2.7}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </g>
  );
}

export function PrismFan() {
  return (
    <div className="sb-ill-stage">
      <Plate name="live">
        <Bubble x={74} y={14} />
        <path
          className="sb-ill-cursor"
          d={CURSOR_D}
          style={{ "--x": "46px", "--y": "36px" } as React.CSSProperties}
        />
        <Bubble x={112} y={64} on />
        <Bubble x={186} y={96} />
        <path
          className="sb-ill-cursor sb-ill-cursor--b"
          d={CURSOR_D}
          style={{ "--x": "166px", "--y": "66px" } as React.CSSProperties}
        />
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
   ④ Card «Fotografia» — la provinatura

   Rifatta sulla tavola Storage di Supabase: una griglia di riquadri con dentro
   il glifo del tipo di file, uno solo evidenziato dall'anello. Lì sono
   immagini, documenti e video; qui sono tutti fotogrammi, perché è un provino
   a contatto — la striscia che il fotografo guarda per scegliere.

   E ha la stessa ragione della riga di testo della card: i volti non si
   pubblicano. Un provino di riquadri vuoti è la figura esatta di «ci sono, e
   non ve li faccio vedere».

   L'ultima colonna esce dal bordo destro apposta: la griglia continua fuori
   dalla card, e una griglia tagliata dal bordo è più grande di una che ci sta
   dentro tutta.

   Il gesto: l'anello salta a un altro fotogramma, come si scorre un provino.
   ═══════════════════════════════════════════════════════════════════════════ */

const TILE_W = 56;
const TILE_H = 34;
const TILE_X = [14, 78, 142, 206, 270];
const TILE_Y = [12, 54, 96, 138];

/** Tre glifi, a rotazione: paesaggio, diaframma, ritratto. */
function TileGlyph({ kind, cx, cy }: { kind: number; cx: number; cy: number }) {
  if (kind === 0) {
    return (
      <g className="sb-ill-tileglyph">
        <path d={`M${cx - 9},${cy + 5} L${cx - 2},${cy - 3} L${cx + 2},${cy + 1} L${cx + 5},${cy - 2} L${cx + 9},${cy + 5} Z`} />
        <circle cx={cx + 4.5} cy={cy - 5.5} r={1.8} />
      </g>
    );
  }
  if (kind === 1) {
    return (
      <g className="sb-ill-tileglyph">
        <circle cx={cx} cy={cy} r={7.5} />
        <path
          d={`M${cx},${cy - 7.5} L${cx + 4},${cy + 1} M${cx + 6.5},${cy + 3.7} L${cx - 3},${cy + 3.7} M${cx - 6.5},${cy + 3.7} L${cx - 1},${cy - 6}`}
        />
      </g>
    );
  }
  return (
    <g className="sb-ill-tileglyph">
      <circle cx={cx} cy={cy - 3} r={4} />
      <path d={`M${cx - 7},${cy + 8} a7,7 0 0,1 14,0`} />
    </g>
  );
}

export function IrisPlate() {
  return (
    <Plate name="film">
      {TILE_Y.map((y, r) =>
        TILE_X.map((x, c) => (
          <g key={`${x}-${y}`}>
            <rect className="sb-ill-tile" x={x} y={y} width={TILE_W} height={TILE_H} rx={7} />
            <TileGlyph kind={(r + c) % 3} cx={x + TILE_W / 2} cy={y + TILE_H / 2} />
          </g>
        )),
      )}
      {/* Il fotogramma scelto: anello della tinta della card. Sta sopra a tutti
          gli altri perché è l'ultimo disegnato. */}
      <rect className="sb-ill-tilesel" x={TILE_X[1]} y={TILE_Y[1]} width={TILE_W} height={TILE_H} rx={7} />
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ Card «Il geometra e l'università» — il volume in assonometria

   Rifatta sulla tavola Vector di Supabase — il cubo a filo con i punti intorno
   — perché quella figura, per una volta, è più vera nel mio mestiere che nel
   loro: un volume in assonometria con i vertici agganciati è quello che si
   disegna in AutoCAD, ed è quello che ho fatto per tre anni sulle tettoie in
   legno del reparto di Caem.

   Le curve di livello che c'erano prima erano una bella carta, ma erano il
   rilievo di un terreno; questa card parla di modellazione e di misura, e la
   misura qui c'è — la linea di quota a sinistra, con i trattini agli estremi.

   Il gesto: i vertici si accendono uno dopo l'altro, come quando il disegno
   aggancia i punti notevoli.
   ═══════════════════════════════════════════════════════════════════════════ */

const CUBE_TOP = "M140,28 L208,68 L140,108 L72,68 Z";
const CUBE_EDGES = "M72,68 L72,106 M208,68 L208,106 M140,108 L140,146";
const CUBE_BOTTOM = "M72,106 L140,146 L208,106";
const VERTICES: [number, number][] = [
  [140, 28],
  [208, 68],
  [140, 108],
  [72, 68],
  [72, 106],
  [140, 146],
  [208, 106],
];
/** Quattro punti sospesi: il pulviscolo intorno al modello. */
const MOTES: [number, number][] = [
  [246, 44],
  [258, 98],
  [28, 56],
  [40, 124],
];

export function ContourPlate() {
  return (
    <Plate name="cube">
      <path className="sb-ill-cubeface" d={CUBE_TOP} />
      <path className="sb-ill-cubeline" d={CUBE_TOP} />
      <path className="sb-ill-cubeline" d={CUBE_EDGES} />
      <path className="sb-ill-cubeline" d={CUBE_BOTTOM} />
      {/* Gli spigoli nascosti, tratteggiati: è la convenzione del disegno
          tecnico, e da sola dice che il volume è pieno e non una scatola
          aperta. */}
      <path className="sb-ill-cubehidden" d="M72,68 L208,68 M140,68 L140,108" />
      {VERTICES.map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          className="sb-ill-vertex-dot"
          cx={cx}
          cy={cy}
          r={3}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {MOTES.map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          className="sb-ill-mote"
          cx={cx}
          cy={cy}
          r={1.8}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {/* La linea di quota: quella che su una tavola dice quanto è alto. */}
      <path className="sb-ill-quote" d="M52,68 L52,106 M47,68 L57,68 M47,106 L57,106" />
    </Plate>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ Card «Auto» — il quadrante

   Il contagiri resta: è già uno strumento, cioè la stessa famiglia delle
   altre. Quello che cambia è che adesso sta su una tavola invece che nel
   vuoto, e che la lancetta si porta dietro due copie sbiadite di sé stessa —
   la scia. È lo stesso trucco degli echi della finestra, applicato a una cosa
   che si muove invece che a una che si ripete.

   Il gesto: la lancetta sale da fondo scala. Da ferma sta in alto, cioè al
   massimo — il fotogramma finito.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le nove tacche del quadrante, dal minimo al massimo: fra 60 e 50 di raggio,
 *  ogni 22,5° sul mezzo giro alto. Le tre finali sono la zona rossa. */
const DIAL = [
  "M70,124 L82,124",
  "M75.3,97.2 L86.4,101.8",
  "M90.5,74.5 L99.0,83.0",
  "M113.2,59.3 L117.8,70.4",
  "M140,54 L140,66",
  "M166.8,59.3 L162.2,70.4",
  "M189.5,74.5 L181.0,83.0",
  "M204.7,97.2 L193.6,101.8",
  "M210,124 L198,124",
];

export function GaugePlate() {
  return (
    <Plate name="gauge">
      <path className="sb-ill-dial" d="M70,124 A70,70 0 0,1 210,124" />
      {DIAL.map((d, i) => (
        <path key={d} className={i >= 6 ? "sb-ill-tickmark sb-ill-tickmark--red" : "sb-ill-tickmark"} d={d} />
      ))}
      {/* La scia: due lancette identiche, dietro, in ritardo di qualche grado.
          La lancetta vera è l'ultima. */}
      <g className="sb-ill-needle sb-ill-needle--ghost" style={{ "--d": "17deg", "--o": 0.14 } as React.CSSProperties}>
        <path d="M140,124 L140,58" />
      </g>
      <g className="sb-ill-needle sb-ill-needle--ghost" style={{ "--d": "8.5deg", "--o": 0.26 } as React.CSSProperties}>
        <path d="M140,124 L140,58" />
      </g>
      <g className="sb-ill-needle">
        <path d="M140,124 L140,58" />
      </g>
      <circle className="sb-ill-hub" cx={140} cy={124} r={5} />
    </Plate>
  );
}

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

/** I commit del repository. Il numero NON è scritto qui: sta in commits.json,
 *  che lo rigenera scripts/build-commits.mjs a ogni build con la storia
 *  completa sotto mano. Prima era un 1200 messo a mano — il conto vero era 400,
 *  cioè il sito dichiarava il triplo dei commit che aveva davvero, e nessuno
 *  poteva accorgersene perché non c'era niente con cui confrontarlo.
 *
 *  Il file è generato E versionato, con lo stesso patto di
 *  src/app/trivia/version.json — e dalla stessa forma di script, che ne è la
 *  copia: su Vercel il clone è troncato e `git rev-list` conterebbe dieci
 *  commit, quindi il valore buono dev'essere già nel repo quando la build
 *  parte, e non può mai tornare indietro. Vedi la nota lunga in
 *  build-commits.mjs per le tre regole e le due fonti. */
import commitsData from "./commits.json";
/** Esportato perché lo legge anche la hero (App.tsx): il numero resta uno,
 *  letto da un file solo, e non c'è modo che due punti della pagina ne
 *  dichiarino due diversi. */
export const COMMITS: number = commitsData.count;

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
