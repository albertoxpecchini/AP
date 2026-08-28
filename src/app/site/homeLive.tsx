// ─────────────────────────────────────────────────────────────────────────────
// I disegni della griglia prodotti — il mosaico.
//
// ── Quattro giri, e questo è il quinto ───────────────────────────────────────
// Prima erano finte schermate. Poi figure a tratto sospese nel vuoto. Poi le
// stesse figure su un TERRENO — carta millimetrata e alone — che le teneva su
// ma le lasciava grigie: sei tavole a matita in fila tornavano a essere «tutto
// molto uguale», il difetto per cui erano nate le sei tinte. Il quarto giro ha
// acceso la tinta e ci ha messo sopra pezzi di interfaccia e un fatto vero per
// tavola: funzionava, e costava sei disegni tecnici da mantenere uno per uno —
// un globo con dodici ellissi calcolate, un provino con la revisione a otto
// secondi, un contagiri con le mezze tacche. Sei meccanismi diversi dietro sei
// riquadri larghi 280 px.
//
// Il mosaico butta via i sei meccanismi e ne tiene UNO. La tavola è una griglia
// di tessere della tinta, a opacità sparse, che si posano in diagonale quando
// la card entra in scena; una sola tessera è PIENA, e quella cambia posto —
// parte da casa, fa due scatti su celle vere della griglia e torna. Dentro alla
// tessera piena c'è un modulo su misura, il solo pezzo che dice di che card si
// tratta:
//
//   ① Archivio progetti → una pila di schede                (traiettoria a)
//   ② Rivalta e Cascina → una finestra col puntino          (traiettoria b)
//   ③ Sviluppo con l'IA → l'asterisco a otto raggi di Claude (traiettoria c)
//   ④ Fotografia        → una macchina con l'obiettivo       (traiettoria d)
//   ⑤ Il geometra       → la A monogramma di AutoCAD         (traiettoria e)
//
// Un accento a testa, mai due nella stessa scheda: la tinta arriva dal data-acc
// della card, come per le vecchie tavole. Le cinque traiettorie della tessera
// accesa sono cinque keyframe (mo-lit-a … mo-lit-e in home.css); qual è la sua
// la scheda lo dice con una custom property, --mo-lit, scritta dal modificatore
// .sb-mosaic--<tema>.
//
// ── Le regole del movimento, invariate ───────────────────────────────────────
// Una cosa sola in movimento per riquadro, ed è un GESTO: le tessere si posano,
// quella accesa fa il suo giro, e tutto torna fermo. Il gesto NON parte da solo
// — da fermo la griglia è ferma. Si anima solo mentre il puntatore è sulla card
// (home.css, «Il gesto parte al passaggio»), o una volta sola quando la card
// entra a vista sul telefono (site/homeMotion.ts ③, che mette e toglie
// [data-play] dopo --sb-gesto ms).
//
// Le proprietà animate sono due, e tutte e due a buon mercato: transform e
// opacity, che il compositore muove senza ricalcolare niente. Niente filtri,
// niente tratteggi, niente animazioni di layout. Qui dentro NON c'è
// JavaScript.
//
// Ogni tavola è ferma sul suo fotogramma FINITO: i valori base del CSS sono
// quelli di fine corsa — tessere posate, tessera accesa a casa. Le regole base
// non hanno animation-name; il nome lo aggiunge l'hover (o [data-play]). Così
// con prefers-reduced-motion basta non aggiungere il nome e resta il mosaico
// completo, non uno a metà.
//
// Da dove viene: il canvas «Sistema blueprint tecnico animato», Turno 3. Le
// cinque schede stanno anche come artboard .dc.html a sé, una per tema.
//
// Convenzione i18n: qui non c'è prosa da tradurre — il mosaico è tutto forme.
// ─────────────────────────────────────────────────────────────────────────────
import { memo, useLayoutEffect, useRef, useState } from "react";
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
export const NowBuilding = memo(function NowBuilding() {
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
});

/* ═══════════════════════════════════════════════════════════════════════════
   IL MOSAICO — una griglia di tessere, una sola accesa

   Cinque schede, un solo componente. La griglia di tessere è identica per
   tutte; cambiano tre cose, e solo quelle:

     · l'accento          → currentColor, dal data-acc della card;
     · la traiettoria     → --mo-lit, scritta da .sb-mosaic--<tema> in home.css,
                             sceglie fra mo-lit-a … mo-lit-e;
     · il modulo          → il disegnino dentro la tessera accesa, uno switch
                             qui sotto.

   ── La geometria ───────────────────────────────────────────────────────────
   viewBox 596×360, lo stesso del canvas da cui il mosaico viene. È la
   proporzione esatta delle vecchie tavole (280×170 = 1,647; 596×360 = 1,656):
   la card non se n'è accorta. Le tessere stanno su una maglia da 80×82 con
   qualche buco; due sono larghe il doppio. La tessera accesa parte da (190,108)
   e le cinque keyframe la portano su celle vere della griglia — mai in un
   buco, mai fuori dai bordi.

   ── Il fotogramma di riposo ────────────────────────────────────────────────
   Le regole base in home.css (.sb-mosaic-tile, .sb-mosaic-lit) hanno durata e
   curva ma NIENTE animation-name: l'elemento resta sui valori di fine corsa —
   tessere posate all'opacità piena, tessera accesa a casa. Il nome arriva solo
   con [data-play] o :hover. Vedi la nota lunga in testa al file.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le tessere della griglia: x, y, larghezza, opacità, ritardo di posa (s).
 *  L'altezza è sempre 74. Ricopiate dal canvas, Turno 3. */
const MOSAIC_FIELD: [number, number, number, number, number][] = [
  [30, 26, 72, 0.9, 0], [110, 26, 72, 0.35, 0.11], [190, 26, 152, 1, 0.22], [350, 26, 72, 0.5, 0.44], [430, 26, 72, 0.2, 0.55],
  [30, 108, 72, 0.5, 0.11], [110, 108, 72, 0.95, 0.22], [270, 108, 72, 0.25, 0.44], [350, 108, 72, 0.75, 0.55], [430, 108, 72, 0.3, 0.66], [510, 108, 72, 0.9, 0.77],
  [30, 190, 72, 0.25, 0.22], [110, 190, 72, 0.85, 0.33], [190, 190, 72, 0.4, 0.44], [270, 190, 72, 1, 0.55], [350, 190, 152, 0.3, 0.66], [510, 190, 72, 0.6, 0.88],
  [30, 272, 72, 0.7, 0.33], [110, 272, 72, 0.2, 0.44], [190, 272, 72, 0.45, 0.55], [350, 272, 72, 0.9, 0.77], [430, 272, 72, 0.25, 0.88], [510, 272, 72, 0.55, 0.99],
];

/** La tessera avorio in alto a destra: è quella su cui SIEDE il marchio. Sta
 *  fuori dalla griglia colorata perché ha un fill suo, e le sue coordinate
 *  sono le stesse che il marchio usa per posarcisi sopra (vedi .sb-mocard-mark
 *  in home.css: top 7 %, right 4 %, cioè questa tessera). */
const MOSAIC_PAPER: [number, number, number, number, number] = [510, 26, 72, 0.94, 0.66];

/** La casa della tessera accesa, prima che la keyframe la porti in giro. */
const LIT = { x: 190, y: 108, w: 72, h: 74 };

type MosaicTopic = "archive" | "web" | "claude" | "photo" | "autocad";

/** Il modulo dentro la tessera accesa. Coordinate in coordinate del riquadro,
 *  con la tessera a casa (190,108). I ritagli — quelli che devono lasciar
 *  vedere la tinta sotto — portano la classe --cut e prendono currentColor. */
function MosaicModule({ topic }: { topic: MosaicTopic }) {
  switch (topic) {
    case "archive":
      return (
        <>
          <rect className="sb-mosaic-mod" x={206} y={124} width={16} height={8} />
          <rect className="sb-mosaic-mod" x={206} y={132} width={40} height={12} opacity={0.7} />
          <rect className="sb-mosaic-mod" x={206} y={146} width={40} height={12} opacity={0.45} />
        </>
      );
    case "web":
      return (
        <>
          <rect className="sb-mosaic-mod" x={204} y={126} width={44} height={8} />
          <rect className="sb-mosaic-mod" x={204} y={136} width={44} height={26} opacity={0.55} />
          <circle className="sb-mosaic-mod sb-mosaic-mod--cut" cx={210} cy={130} r={1.6} />
        </>
      );
    case "claude":
      return (
        <g className="sb-mosaic-mod">
          <rect x={222} y={123} width={8} height={44} rx={4} />
          <rect x={222} y={123} width={8} height={44} rx={4} transform="rotate(45 226 145)" />
          <rect x={222} y={123} width={8} height={44} rx={4} transform="rotate(90 226 145)" />
          <rect x={222} y={123} width={8} height={44} rx={4} transform="rotate(135 226 145)" />
        </g>
      );
    case "photo":
      return (
        <>
          <rect className="sb-mosaic-mod" x={210} y={124} width={12} height={7} />
          <rect className="sb-mosaic-mod" x={203} y={131} width={46} height={30} rx={3} opacity={0.72} />
          <circle className="sb-mosaic-mod sb-mosaic-mod--cut" cx={226} cy={146} r={9} />
          <circle cx={226} cy={146} r={9} fill="none" stroke="#f7f4ec" strokeWidth={2} opacity={0.85} />
        </>
      );
    case "autocad":
      return (
        <>
          <polygon className="sb-mosaic-mod" points="226,118 248,170 236,170 226,148 216,170 204,170" />
          <rect className="sb-mosaic-mod sb-mosaic-mod--cut" x={213} y={150} width={26} height={6} />
        </>
      );
  }
}

/* memo: le cinque schede vivono dentro App insieme al resto della home, e non
   prendono prop che cambiano. Senza, ogni setState della pagina le
   ridisegnava — e sono ventiquattro <rect> più il modulo, per cinque. */
export const Mosaic = memo(function Mosaic({ topic }: { topic: MosaicTopic }) {
  return (
    <svg
      className={`sb-mosaic sb-mosaic--${topic}`}
      viewBox="0 0 596 360"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* il fondo: una campitura sola della tinta, appena percettibile */}
      <rect className="sb-mosaic-bg" width="596" height="360" />

      <g className="sb-mosaic-field">
        {MOSAIC_FIELD.map(([x, y, w, o, d]) => (
          <rect
            key={`${x}-${y}`}
            className="sb-mosaic-tile"
            x={x}
            y={y}
            width={w}
            height={74}
            style={{ "--o": o, animationDelay: `${d}s` } as React.CSSProperties}
          />
        ))}
        <rect
          className="sb-mosaic-paper"
          x={MOSAIC_PAPER[0]}
          y={MOSAIC_PAPER[1]}
          width={MOSAIC_PAPER[2]}
          height={74}
          style={{ "--o": MOSAIC_PAPER[3], animationDelay: `${MOSAIC_PAPER[4]}s` } as React.CSSProperties}
        />
      </g>

      {/* la tessera accesa: l'unica piena, e l'unica che cambia posto */}
      <g className="sb-mosaic-lit">
        <rect className="sb-mosaic-lit-cell" x={LIT.x} y={LIT.y} width={LIT.w} height={LIT.h} />
        <MosaicModule topic={topic} />
      </g>
    </svg>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LA SCHEDA — il mosaico al vivo, il marchio e la targa

   Questa è la card della griglia prodotti, 1:1 col canvas «Sistema blueprint
   tecnico animato», Turno 3. Non è «una card con dentro un disegno»: è la
   regola dichiarata al Turno 2 del canvas — 90 % grafica, 10 % targa e
   marchio. Quindi qui NON c'è né una descrizione né un elenco di spunte: la
   grafica prende la scheda intera al vivo, e a parlare restano due righe.

   Le tre cose sopra al mosaico, e perché ognuna:

     · IL MARCHIO. Un quadrato di carta avorio in alto a destra, con dentro
       il `.ap` della tinta della scheda. Non galleggia: cade esattamente sulla
       tessera avorio del mosaico (quella a 510,26), che è lì apposta per
       reggerlo — è il marchio stampato su un tassello, non un adesivo.
     · LA TARGA. In basso a sinistra, su un velo quasi nero, con l'angolo alto
       a destra tagliato: due righe, il nome e cos'è. Il taglio è la sagoma del
       sito in piccolo, e serve a non farla leggere come una didascalia
       incollata.
     · LA CORNICE. Non è disegnata qui: è .sb-panel + .sb-panel-inner, cioè la
       stessa lastra di tutto il sito — ed è da lì che il canvas l'aveva presa
       (stessa formula di gradiente, stesso 1 px di rim, stesso smusso). Va in
       versione `--solid`: dietro al mosaico non c'è niente da sfocare, e un
       backdrop-filter si pagherebbe a vuoto.

   Il mosaico sta dentro .sb-card-visual, che è il riquadro che
   site/GlassMotion.tsx muove in controtendenza allo scroll. Sborda di 8 px per
   lato apposta: la deriva è di tre o quattro pixel, e senza il margine
   scoprirebbe un filo di fondo sul bordo alto.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Il marchio `.ap`, lo stesso tracciato di public/favicon.svg. La tinta è
 *  quella della scheda: fill currentColor, e il colore lo mette il CSS. */
function ApMark() {
  return (
    <svg viewBox="50 185 310 190" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M58.44 315.0V275.16H93.0V315.0Z M213.24 232.44V282.36Q213.72 288.12 215.16 290.4Q216.6 292.68 221.16 293.64L220.2 317.88Q207.96 317.88 200.64 316.2Q193.32 314.52 185.88 309.48Q168.6 317.88 150.6 317.88Q113.4 317.88 113.4 278.52Q113.4 259.32 123.72 251.28Q134.04 243.24 155.4 241.8L181.08 239.88V232.44Q181.08 225.0 177.72 222.24Q174.36 219.48 166.92 219.48L121.8 221.4L120.84 199.08Q146.52 192.12 169.68 192.12Q192.84 192.12 203.04 201.72Q213.24 211.32 213.24 232.44ZM159.24 264.12Q145.8 265.32 145.8 278.52Q145.8 291.72 157.56 291.72Q166.68 291.72 177.48 288.84L181.08 287.88V262.2Z M243.96 365.4V195.0H275.88V201.48Q291.48 192.12 303.24 192.12Q327.48 192.12 339.0 206.64Q350.52 221.16 350.52 255.96Q350.52 290.76 337.8 304.32Q325.08 317.88 296.04 317.88Q288.12 317.88 279.0 316.44L276.12 315.96V365.4ZM297.0 220.92Q288.12 220.92 279.0 224.52L276.12 225.72V288.6Q286.92 290.04 293.64 290.04Q307.56 290.04 312.72 281.88Q317.88 273.72 317.88 254.04Q317.88 220.92 297.0 220.92Z"
      />
    </svg>
  );
}

/** Il contenuto di una scheda. Chi la usa ci mette intorno il suo <Link> o la
 *  sua <a> con className="sb-card" e il data-acc della tinta — la scheda non sa
 *  dove porta, e non deve. `sub` è la riga piccola in mono. */
export const MosaicCard = memo(function MosaicCard({
  topic,
  title,
  sub,
  noI18n,
}: {
  topic: MosaicTopic;
  title: string;
  sub: string;
  /** Per i nomi propri — «Rivalta e Cascina Fontana», «Claude Code» — che il
   *  motore i18n non deve toccare. */
  noI18n?: boolean;
}) {
  return (
    <div className="sb-panel">
      <div className="sb-panel-inner sb-panel--solid sb-mocard">
        <div className="sb-card-visual">
          <Mosaic topic={topic} />
        </div>
        <span className="sb-mocard-mark" aria-hidden="true">
          <ApMark />
        </span>
        <span className="sb-mocard-plate">
          <h3 {...(noI18n ? { "data-no-i18n": true, translate: "no" as const } : {})}>{title}</h3>
          <span className="sb-mocard-sub">{sub}</span>
        </span>
      </div>
    </div>
  );
});

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

/** Una cella già pronta da dare a React.
 *
 *  Tutto quello che serve al <rect> è calcolato QUI, una volta sola al primo
 *  caricamento del modulo: classe, coordinate, livello e — soprattutto —
 *  l'oggetto `style`. Sono 1.100 celle, e con lo `style` costruito dentro il
 *  render erano 1.100 oggetti nuovi a ogni giro, quindi 1.100 confronti che
 *  fallivano sempre. Adesso il riferimento è lo stesso e React non tocca
 *  niente. */
type Cell = {
  key: string;
  cls: string;
  x: number;
  y: number;
  lv: number;
  style: React.CSSProperties;
};

/** Rumore di fondo ripetibile: xorshift con seme fisso, così il muro è lo
 *  stesso disegno a ogni render e a ogni ricarica. Un fondale che cambia da
 *  solo a ogni visita è un fondale che si fa notare. */
function makeWall(): Cell[] {
  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  };
  const cells: Cell[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const v = rand();
      const on = WALL_MASK.has(c - TEXT_X + "," + (r - TEXT_Y));
      cells.push({
        key: c + "-" + r,
        cls: on ? "sb-cwall-cell sb-cwall-cell--on" : "sb-cwall-cell",
        x: c * (CELL + GAP),
        y: r * (CELL + GAP),
        lv: v < 0.45 ? 0 : v < 0.65 ? 1 : v < 0.8 ? 2 : v < 0.92 ? 3 : 4,
        /* Il ritardo dell'accensione: il fondo si apre da sinistra a destra,
           il numero arriva dopo che il fondo è passato di lì. Due tempi e non
           uno — accendendoli insieme il numero nascerebbe già dentro il
           rumore, invece di emergerne. */
        style: { "--d": (on ? 0.3 : 0) + c * 0.02 + r * 0.01 + "s" } as React.CSSProperties,
      });
    }
  }
  return cells;
}

const WALL = makeWall();
const WALL_W = COLS * (CELL + GAP) - GAP;
const WALL_H = ROWS * (CELL + GAP) - GAP;

/* memo, e qui pesa: il muro è 1.100 <rect> e non prende nessuna prop, ma vive
   dentro App insieme a tutto il resto della home. Senza, ogni setState della
   pagina — la scheda dell'archivio, la tecnologia dello stack — lo faceva
   ridisegnare per intero. */
export const CommitWall = memo(function CommitWall() {
  return (
    <svg
      className="sb-cwall"
      viewBox={"0 0 " + WALL_W + " " + WALL_H}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {WALL.map((cell) => (
        <rect
          key={cell.key}
          className={cell.cls}
          x={cell.x}
          y={cell.y}
          width={CELL}
          height={CELL}
          rx={1}
          data-lv={cell.lv}
          style={cell.style}
        />
      ))}
    </svg>
  );
});

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
