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
// ── Le regole del movimento ──────────────────────────────────────────────────
// SEMPRE VIVE. Prima il gesto partiva solo al passaggio del puntatore, o una
// volta sola entrando a vista, e fuori di lì le schede stavano ferme: era la
// regola della griglia prodotti di Supabase, e per sei tavole tecniche era
// giusta — sei disegni al tratto che si agitano insieme sono un albero di
// Natale. Il mosaico non è un disegno tecnico: è un pannello, e un pannello
// fermo è un pannello spento. Adesso gira sempre, e il nome dell'animazione sta
// nella regola BASE del foglio (home.css, «Sempre vive»).
//
// Le cinque schede sono SFASATE di mezzo secondo l'una dall'altra, tessere e
// targa sullo stesso tempo: cinque mosaici che battono all'unisono sono un
// mosaico grande, cinque a giro sono cinque cose vive.
//
// Le proprietà animate sono due, e tutte e due a buon mercato: transform e
// opacity, che il compositore muove senza ricalcolare niente. Niente filtri,
// niente tratteggi, niente animazioni di layout. Il browser sospende da sé le
// animazioni CSS quando la scheda passa in secondo piano, e nessun JavaScript
// gira per tenerle in moto — il solo JS di questo file è il turno della targa.
//
// Chi ha chiesto meno movimento le trova ferme sul fotogramma finito: le
// keyframe cominciano e finiscono là, quindi «ferme» vuol dire il mosaico
// intero, non uno a metà, e la targa resta sulla sua prima riga.
//
// Da dove viene: il canvas «Sistema blueprint tecnico animato», Turno 3. Le
// cinque schede stanno anche come artboard .dc.html a sé, una per tema.
//
// Convenzione i18n: il mosaico è tutto forme e non ha prosa. Ce l'ha la targa,
// e le sue righe passano dal dizionario come tutto il resto — tranne i nomi
// propri, che portano noI18n.
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

   ── Il moto ────────────────────────────────────────────────────────────────
   Gira sempre, in loop da 4 s, e le cinque schede sono sfasate di mezzo
   secondo l'una dall'altra (home.css, «Sempre vive»). Le keyframe cominciano e
   finiscono sullo stesso fotogramma — tessere posate, tessera accesa a casa —
   quindi il giro si chiude, e con prefers-reduced-motion, che toglie il nome
   dell'animazione, resta il mosaico intero.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le tessere della griglia: x, y, larghezza, opacità, ritardo di posa (s).
 *  L'altezza è sempre 74. Ricopiate dal canvas, Turno 3. */
const MOSAIC_FIELD: [number, number, number, number, number][] = [
  [30, 26, 72, 0.9, 0], [110, 26, 72, 0.35, 0.11], [190, 26, 152, 1, 0.22], [350, 26, 72, 0.5, 0.44], [430, 26, 72, 0.2, 0.55],
  [510, 26, 72, 0.62, 0.66],
  [30, 108, 72, 0.5, 0.11], [110, 108, 72, 0.95, 0.22], [270, 108, 72, 0.25, 0.44], [350, 108, 72, 0.75, 0.55], [430, 108, 72, 0.3, 0.66], [510, 108, 72, 0.9, 0.77],
  [30, 190, 72, 0.25, 0.22], [110, 190, 72, 0.85, 0.33], [190, 190, 72, 0.4, 0.44], [270, 190, 72, 1, 0.55], [350, 190, 152, 0.3, 0.66], [510, 190, 72, 0.6, 0.88],
  [30, 272, 72, 0.7, 0.33], [110, 272, 72, 0.2, 0.44], [190, 272, 72, 0.45, 0.55], [350, 272, 72, 0.9, 0.77], [430, 272, 72, 0.25, 0.88], [510, 272, 72, 0.55, 0.99],
];

/* Qui c'era MOSAIC_PAPER: la tessera avorio in alto a destra, disegnata fuori
   dalla griglia colorata perché aveva un fill suo. Esisteva per un motivo solo
   — reggere il marchio .ap, che ci sedeva sopra. Tolto il marchio restava un
   quadrato bianco nello stesso angolo di tutte e cinque le schede, cioè
   esattamente il difetto per cui il marchio se n'era andato: un elemento
   chiaro, identico, ripetuto cinque volte, che si prende l'occhio prima del
   mosaico. Adesso quella cella è una tessera come le altre, ed è nel campo. */

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
   LA SCHEDA — mosaico al vivo, riflessi e targa viva

   La card della griglia prodotti. Viene dal canvas «Sistema blueprint tecnico
   animato», Turno 3, e ne tiene la regola: 90 % grafica, 10 % targa. Niente
   descrizioni, niente elenchi di spunte — la grafica prende la scheda intera
   al vivo, e a parlare restano due righe.

   ── Cos'è cambiato rispetto al canvas ──────────────────────────────────────
   IL MARCHIO NON C'È PIÙ. Sul canvas ogni scheda portava un quadrato di carta
   avorio in alto a destra col `.ap` dentro. Cinque marchi identici in una
   griglia sola sono un timbro ripetuto cinque volte sulla stessa pagina: chi
   guarda ha già letto il nome nell'header, e il quadrato bianco era la cosa
   più luminosa della scheda — cioè si prendeva l'occhio prima del mosaico. La
   tessera di carta del mosaico resta dov'era: adesso è solo un tassello di un
   altro materiale, un fermo per l'occhio in mezzo alle tinte.

   ── I riflessi ─────────────────────────────────────────────────────────────
   Tre, e sono tre cose diverse, non tre copie della stessa:

     · LA VELATURA. Un gradiente diagonale fisso, chiaro in alto a sinistra e
       trasparente in basso: è la luce ambientale sulla lastra, quella che c'è
       anche quando non succede niente. Ferma.
     · LA PASSATA. Una banda di luce stretta che attraversa la scheda in
       diagonale, in loop. È il riflesso vero — quello che dice «questa cosa è
       lucida». Sfasata per scheda, così non passano tutte insieme.
     · IL BORDO ACCESO. Un filo della tinta lungo il taglio in alto a sinistra,
       che respira. Sta sul bordo e non dentro: è la luce che prende lo spigolo
       di striscio, come sulle lastre grandi dello scaffale.

   Tutti e tre su transform e opacity, e nessuno è un filter: una scheda che
   sfoca costa un buffer per card ridipinto a ogni fotogramma, e qui le schede
   sono cinque, tutte accese insieme, su una pagina che deve restare fluida
   mentre scorre.

   ── La targa è VIVA ────────────────────────────────────────────────────────
   Il titolo e il sottotitolo non sono più due stringhe ferme: ogni scheda ha
   una LISTA di righe e le dà a turno, entrando da sotto e uscendo da sopra.
   Il titolo cambia con lei quando la voce ha un titolo suo — così la targa non
   è una didascalia ma un pannello che aggiorna.

   Un turno per scheda ogni ~4,6 s, sfasato di mezzo secondo l'una dall'altra:
   cinque targhe che cambiano allo stesso istante sono un tabellone
   dell'aeroporto, cinque che cambiano a giro sono un pannello vivo.

   E il turno SALTA finché il puntatore (o il focus) sta sulla scheda: un testo
   che cambia mentre lo stai leggendo è un testo che non si finisce di leggere.
   È la stessa regola di NowBuilding, qui sopra.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Una voce della targa: la riga grande e quella piccola in mono.
 *
 *  I due flag sono SEPARATI, e serve che lo siano: quasi tutte le voci hanno un
 *  titolo che è un nome proprio — un dominio, «Claude Code», un corpo macchina
 *  — e un sottotitolo che è prosa, da tradurre. Con un flag solo sulla riga
 *  intera la scheda dei siti restava con «websites» in inglese sotto a un nome
 *  italiano, e quella dell'IA con «AI-assisted development». */
type Riga = {
  title: string;
  sub: string;
  /** Il titolo è un nome proprio: il motore i18n non lo tocca. */
  noI18n?: boolean;
  /** Anche il sottotitolo lo è (sigle, misure, modelli di obiettivo). */
  subNoI18n?: boolean;
};

/** Gli attributi che spengono il motore i18n su un nodo. */
const FERMO = { "data-no-i18n": true, translate: "no" as const };

/** Quanto resta ferma una riga prima di dare il cambio. */
const PLATE_HOLD = 4600;

/** Il giro delle targhe. Ogni scheda ne ha tre: la prima è quella che si vede
 *  da ferma (e quella che resta con prefers-reduced-motion), le altre due
 *  dicono un FATTO — un numero, un nome, un dato vero — perché una targa che
 *  gira per dire tre volte la stessa cosa con parole diverse è un fastidio. */
const PLATE: Record<MosaicTopic, Riga[]> = {
  web: [
    { title: "Rivalta e Cascina Fontana", sub: "websites", noI18n: true },
    { title: "rivaltasulmincio.it", sub: "online, and the village in every datum", noI18n: true },
    { title: "cascinafontana.xyz", sub: "online, from the first word", noI18n: true },
  ],
  archive: [
    { title: "Project archive", sub: "all the works" },
    { title: "React and TypeScript", sub: "and never a page builder" },
    { title: "The source goes home with you", sub: "every project, open" },
  ],
  claude: [
    { title: "Claude Code", sub: "AI-assisted development", noI18n: true },
    { title: "Codex, Copilot", sub: "machines that write", noI18n: true },
    { title: "Not one line unread", sub: "my eye upon all of it" },
  ],
  photo: [
    { title: "Photography", sub: "shots" },
    { title: "Canon EOS 4000D", sub: "EF-S 18-55mm, ISO 3200", noI18n: true, subNoI18n: true },
    { title: "The faces stay mine alone", sub: "the number, never the image" },
  ],
  autocad: [
    { title: "Surveying", sub: "and university" },
    { title: "CAT diploma", sub: "Construction, Environment and Territory" },
    { title: "AutoCAD, topography", sub: "and weighing what a thing is worth" },
  ],
};

/** Di quanto parte sfasato il giro di ogni scheda, in millisecondi. */
const PLATE_STAGGER: Record<MosaicTopic, number> = {
  web: 0,
  archive: 520,
  claude: 1040,
  photo: 1560,
  autocad: 2080,
};

/** Il contenuto di una scheda. Chi la usa ci mette intorno il suo <Link> o la
 *  sua <a> con className="sb-card" e il data-acc della tinta — la scheda non sa
 *  dove porta, e non deve. */
export const MosaicCard = memo(function MosaicCard({ topic }: { topic: MosaicTopic }) {
  const righe = PLATE[topic];
  const [i, setI] = useState(0);
  const rowRef = useRef<HTMLSpanElement>(null);
  const held = useRef(false);
  const first = useRef(true);
  const cur = righe[i];

  // useLayoutEffect e non useEffect: la riga nuova deve trovarsi già fuori
  // dalla finestrella al primo frame, altrimenti lampeggia al suo posto prima
  // di salire.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || righe.length < 2) return;

    const anim = motionOK();
    // Con movimento ridotto la targa non gira affatto: resta la prima riga,
    // che è quella scritta per stare ferma.
    if (!anim) return;

    let alive = true;
    let timer = 0;

    // La prima riga è già al suo posto: si anima solo chi arriva dopo. E lo
    // sfasamento si paga UNA volta, al primo giro — dopo, il ritmo è quello di
    // tutte e la sfasatura resta perché resta il ritardo iniziale.
    const primo = first.current;
    if (primo) first.current = false;
    else {
      gsap.fromTo(
        row,
        { yPercent: 108, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.42, ease: "power3.out" },
      );
    }

    const advance = () => {
      if (alive) setI((v) => (v + 1) % righe.length);
    };
    const turn = () => {
      if (!alive) return;
      if (held.current) {
        timer = window.setTimeout(turn, PLATE_HOLD);
        return;
      }
      gsap.to(row, {
        yPercent: -108,
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: advance,
      });
    };
    timer = window.setTimeout(turn, PLATE_HOLD + (primo ? PLATE_STAGGER[topic] : 0));

    return () => {
      alive = false;
      window.clearTimeout(timer);
      gsap.killTweensOf(row);
    };
  }, [i, righe, topic]);

  const hold = (on: boolean) => () => {
    held.current = on;
  };

  return (
    <div className="sb-panel">
      <div className="sb-panel-inner sb-panel--solid sb-mocard">
        <div className="sb-card-visual">
          <Mosaic topic={topic} />
        </div>

        {/* I riflessi. Tre span vuoti e nessuna immagine: sono tre gradienti,
            e il CSS sa già dove metterli. aria-hidden perché non dicono
            niente — sono la lucidatura della lastra. */}
        <span className="sb-mocard-sheen" aria-hidden="true" />
        <span className="sb-mocard-sweep" aria-hidden="true" />
        <span className="sb-mocard-edge" aria-hidden="true" />

        <span
          className="sb-mocard-plate"
          onPointerEnter={hold(true)}
          onPointerLeave={hold(false)}
          onFocus={hold(true)}
          onBlur={hold(false)}
        >
          {/* La finestrella: overflow nascosto, e dentro una riga sola. key
              sull'indice, così la fromTo di entrata parte da un nodo pulito. */}
          <span className="sb-mocard-slot">
            <span className="sb-mocard-row" key={i} ref={rowRef}>
              <h3 {...(cur.noI18n ? FERMO : {})}>{cur.title}</h3>
              <span className="sb-mocard-sub" {...(cur.subNoI18n ? FERMO : {})}>
                {cur.sub}
              </span>
            </span>
          </span>
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
