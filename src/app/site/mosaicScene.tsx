// ─────────────────────────────────────────────────────────────────────────────
// Le scene della griglia prodotti — il mosaico, sesto giro.
//
// ── Da dove vengono ──────────────────────────────────────────────────────────
// Le cinque scene arrivano da altrettante tavole preparate a parte («Cover 1
// Archivio» … «Cover 5 Geometra»): schede 4:5 su fondo verde, con un oggetto di
// vetro al centro, un'aurora sfocata dietro, le bolle che salgono e una targa in
// basso. Il disegno degli oggetti è loro — la pila che sfoglia, il browser che
// scrive, gli anelli in orbita, l'iride che respira, il cubo che gira. Quello
// che segue non è un copia-incolla: è lo stesso disegno rimesso in casa, e le
// tre cose che sono cambiate sono cambiate perché DOVEVANO.
//
//   ① LA TINTA NON È PIÙ VERDE. Le tavole erano verdi tutte e cinque: fondo
//      #085239, accento #7dffc4, un gradiente cucito a mano per scheda. Ma la
//      griglia di questo sito ha cinque tinte, una per scheda (home.css, «La
//      tavolozza»), e il verde è già quella del geometra. Cinque schede verdi
//      avrebbero buttato via il sistema che regge anche sezioni, nav e pagine
//      interne. Quindi il fondo non è dipinto: è currentColor, cioè il data-acc
//      della card, e le cinque scene si ritingono da sole. I bianchi di vetro
//      restano bianchi — quelli sono LUCE, non tinta, e la luce non è viola.
//
//   ② IL FORMATO È ORIZZONTALE. Le tavole erano 4:5 in piedi; la card di questa
//      griglia è 460/278 sdraiata, e la prima riga la vuole larga il doppio.
//      L'oggetto quindi non sta più in una colonna alta con la targa sotto: sta
//      al centro di un riquadro basso, e l'aurora si allarga invece di salire.
//
//   ③ LA TARGA NON È QUI. Le tavole portavano eyebrow, titolo e blurb scritti
//      dentro. Questa griglia ha già una targa, e GIRA — tre righe a turno per
//      scheda, con lo stagger e il fermo sotto il puntatore (homeLive.tsx,
//      PLATE). Tenere anche quella delle tavole voleva dire due titoli nella
//      stessa scheda. Restano il numero 01…05 e il resto se ne va.
//
// ── Cosa NON è cambiato ──────────────────────────────────────────────────────
// Le keyframe delle tavole sono ricopiate come stavano — fa-aur, fa-rise,
// fa-gloss, fa-flip, fa-type, fa-orbit, fa-iris, fa-spin e compagnia — con i
// loro tempi e le loro curve, solo rinominate col prefisso di casa (mo-). I
// numeri dentro sono quelli: le percentuali dell'iride, i 780% delle bolle, i
// -22deg del cubo. Dove ho toccato un numero c'è scritto perché.
//
// ── Il costo, che qui è il vincolo vero ──────────────────────────────────────
// Le tavole erano UNA per pagina e potevano permettersi tutto. Qui sono CINQUE,
// tutte accese insieme, su una home che deve restare fluida mentre scorre. Le
// tavole usavano backdrop-filter su ogni carta di vetro e blur(46px) sull'aurora
// di ognuna: cinque volte quella roba è un buffer sfocato per scheda ridipinto a
// ogni fotogramma, ed è esattamente la spesa che home.css si era tolta dai
// riflessi («niente filter da nessuna parte», nota ai riflessi).
//
// Quindi:
//   · l'aurora tiene il suo blur — è UN elemento per scheda, fermo salvo una
//     transform lenta, e senza di lei la scena è piatta;
//   · le carte di vetro perdono il backdrop-filter e tengono il gradiente: il
//     vetro lo fanno il bordo chiaro e il filo specular, non la sfocatura di
//     quello che c'è sotto — che qui è tinta piatta, cioè non c'è niente da
//     sfocare;
//   · le bolle scendono da 14 a 7 per scheda. Trentacinque cerchi animati sulla
//     stessa pagina si vedono nel profiler, sette per scheda no, e a occhio la
//     differenza non c'è perché salgono sfalsate.
//
// Tutto si muove su transform e opacity soltanto.
//
// ── Il fotogramma di riposo ──────────────────────────────────────────────────
// Come il mosaico di prima: le keyframe cominciano e finiscono sullo stesso
// fotogramma, quindi con prefers-reduced-motion — che toglie i nomi in
// home.css — resta la scena intera e ferma, non una a metà.
//
// Il vestito sta in home.css, blocco «LE SCENE».
// ─────────────────────────────────────────────────────────────────────────────
import { memo } from "react";

export type MosaicTopic = "archive" | "web" | "claude" | "photo" | "autocad";

/** Il numero in alto a destra, come sulle tavole. L'ordine è quello della
 *  griglia in App.tsx, non quello dei file: la scheda dei siti è la prima. */
const NUM: Record<MosaicTopic, string> = {
  web: "01",
  archive: "02",
  claude: "03",
  photo: "04",
  autocad: "05",
};

/* ── Le bolle ────────────────────────────────────────────────────────────────
   Dalle tavole, stessa formula aritmetica: niente Math.random(), così la maglia
   è identica a ogni ricarica e due schede vicine non si ritrovano con le bolle
   nello stesso punto. Il seme lo dà la scheda.

   Sette e non quattordici: vedi la nota sul costo, in testa al file. */
type Bolla = { l: number; s: number; o: number; dur: number; d: number };

function bolle(seme: number): Bolla[] {
  return Array.from({ length: 7 }, (_, i) => {
    const k = i * 9 + seme;
    return {
      l: +(4 + ((k * 17) % 92)).toFixed(1),
      s: 7 + ((k * 7) % 23),
      o: +(0.2 + ((k * 13) % 46) / 100).toFixed(2),
      dur: 9 + ((k * 5) % 10),
      d: +(-((k * 19) % 130) / 10).toFixed(1),
    };
  });
}

/** Un seme per scheda: le cinque maglie di bolle sono diverse fra loro. */
const SEME: Record<MosaicTopic, number> = {
  web: 5,
  archive: 2,
  claude: 3,
  photo: 7,
  autocad: 11,
};

function Bolle({ topic }: { topic: MosaicTopic }) {
  return (
    <>
      {bolle(SEME[topic]).map((b, i) => (
        <span
          key={i}
          className="mo-bolla"
          style={
            {
              left: `${b.l}%`,
              width: b.s,
              height: b.s,
              opacity: b.o,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.d}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

/* ── ① ARCHIVIO — la pila che sfoglia ────────────────────────────────────────
   Quattro carte in prospettiva che entrano da destra, si mettono dritte e se ne
   vanno verso chi guarda (mo-flip). Sfasate di un quarto di giro l'una
   dall'altra, così ce n'è sempre una al centro e la pila non si svuota mai.

   Le righe dentro le carte sono quattro barre di larghezza scalata: da lontano
   leggono come testo, ed è tutto quello che devono fare. */
function ScenaArchivio({ loop }: { loop: number }) {
  return (
    <div className="mo-pila">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="mo-carta"
          style={{ animationDelay: `${-(i * loop) / 4}s` } as React.CSSProperties}
        >
          <i style={{ width: "44%" }} />
          <i style={{ width: "84%", opacity: 0.62 }} />
          <i style={{ width: "70%", opacity: 0.48 }} />
          <i style={{ width: "78%", opacity: 0.34 }} />
        </div>
      ))}
    </div>
  );
}

/* ── ② SITI WEB — la finestra che scrive ─────────────────────────────────────
   Il browser delle tavole: barra coi tre pallini, l'indirizzo che si scrive da
   solo (mo-type, steps) col caret che lampeggia, e sotto un'impaginazione finta
   — una fascia grande, tre colonne, un bottone. Tutto galleggia piano
   (mo-float).

   Il riflesso sotto la finestra è restato: è quello che la stacca dal fondo e
   la fa sembrare appoggiata su qualcosa invece che incollata. */
function ScenaWeb() {
  return (
    <div className="mo-browser-wrap">
      <div className="mo-browser">
        <div className="mo-browser-bar">
          <span className="mo-dots">
            <i /><i /><i />
          </span>
          <span className="mo-omni">
            <i className="mo-lock" />
            <span className="mo-type-slot">
              <i className="mo-type" />
            </span>
            <i className="mo-caret" />
          </span>
        </div>
        <div className="mo-browser-body">
          <div className="mo-hero" />
          <div className="mo-cols">
            <i /><i /><i />
          </div>
          <div className="mo-row">
            <span className="mo-btn">Apri</span>
            <i className="mo-rule" />
          </div>
        </div>
      </div>
      <div className="mo-browser-refl" />
    </div>
  );
}

/* ── ③ IA — gli anelli in orbita ─────────────────────────────────────────────
   Un nucleo di vetro che respira (mo-orb) dentro tre anelli inclinati a 72°
   che girano (mo-orbit), quello di mezzo al contrario. Ogni anello porta un
   punto di luce sul bordo: senza, un cerchio che ruota su sé stesso non si vede
   girare.

   L'alone dietro pulsa sul giro lungo (mo-pulse) ed è l'unico blur della scena
   dopo l'aurora. */
function ScenaIA({ loop }: { loop: number }) {
  const anelli = [
    { inset: 0, dur: loop, dir: "normal" },
    { inset: 14, dur: +(loop * 0.72).toFixed(1), dir: "reverse" },
    { inset: 28, dur: +(loop * 0.52).toFixed(1), dir: "normal" },
  ];
  return (
    <div className="mo-orbita">
      <div className="mo-orbita-alone" />
      {anelli.map((a, i) => (
        <div
          key={i}
          className="mo-anello"
          style={
            {
              inset: `${a.inset}%`,
              animationDuration: `${a.dur}s`,
              animationDirection: a.dir,
            } as React.CSSProperties
          }
        >
          <i />
        </div>
      ))}
      <div className="mo-nucleo">
        <i />
      </div>
    </div>
  );
}

/* ── ④ FOTOGRAFIA — l'iride che apre e chiude ────────────────────────────────
   Sei lamelle a spicchio su un anello, ognuna ruotata di 60° in più della
   precedente e tutte sulla stessa keyframe (mo-iride): si aprono, restano
   aperte per metà giro, si richiudono. Sfasate di pochissimo l'una dall'altra —
   un diaframma vero non scatta tutto insieme, si avvita.

   Il lampo bianco (mo-flash) arriva all'88% del giro, dura un fotogramma e se
   ne va: è lo scatto. Il bokeh dietro sono cerchi sfocati che respirano. */
function ScenaFoto() {
  return (
    <div className="mo-iride">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="mo-lamella"
          style={
            {
              "--r": `${i * 60}deg`,
              animationDelay: `${-(i * 0.06).toFixed(2)}s`,
            } as React.CSSProperties
          }
        />
      ))}
      <span className="mo-pupilla" />
      <span className="mo-flash" />
    </div>
  );
}

/** Il bokeh della scena fotografica: sta fuori dall'iride perché va sparso su
 *  tutta la scheda, non dentro all'obiettivo. */
function Bokeh() {
  const k = [
    { l: 12, t: 18, s: 44, dur: 11, d: 0 },
    { l: 68, t: 12, s: 30, dur: 9, d: -2.4 },
    { l: 82, t: 44, s: 52, dur: 13, d: -5.1 },
    { l: 28, t: 58, s: 26, dur: 10, d: -1.2 },
    { l: 52, t: 24, s: 36, dur: 12, d: -6.8 },
  ];
  return (
    <>
      {k.map((b, i) => (
        <span
          key={i}
          className="mo-bokeh"
          style={
            {
              left: `${b.l}%`,
              top: `${b.t}%`,
              width: b.s,
              height: b.s,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.d}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

/* ── ⑤ GEOMETRA — il cubo e il piano ─────────────────────────────────────────
   Sei facce di vetro in preserve-3d che girano su Y (mo-spin), inclinate di
   -22° su X perché si veda lo spigolo alto: un cubo frontale che gira si legge
   come un quadrato che si restringe.

   Sotto, il piano quadrettato in prospettiva che scorre verso di noi (mo-piano),
   sfumato ai bordi da una maschera. È il terreno — la stessa idea della carta
   millimetrata dei giri vecchi, ma che si muove.

   Le tacche a sinistra sono la scala graduata: nove trattini di lunghezza
   diversa che si accendono a turno. */
function ScenaGeometra() {
  const facce = ["mo-f-front", "mo-f-back", "mo-f-right", "mo-f-left", "mo-f-top", "mo-f-bottom"];
  return (
    <div className="mo-cubo-wrap">
      <div className="mo-cubo">
        {facce.map((f) => (
          <span key={f} className={`mo-faccia ${f}`} />
        ))}
      </div>
    </div>
  );
}

/** Il piano quadrettato e la scala graduata: stanno FUORI dal palco perché non
 *  sono l'oggetto, sono il terreno su cui sta — il piano prende la scheda in
 *  tutta la larghezza e la scala siede sul bordo sinistro. */
function FondoGeometra() {
  const tacche = [7, 12, 7, 7, 12, 7, 7, 12, 7];
  return (
    <>
      <div className="mo-piano-wrap">
        <div className="mo-piano" />
      </div>
      <div className="mo-scala">
        {tacche.map((w, i) => (
          <i
            key={i}
            style={
              {
                width: w,
                animationDuration: `${2.4 + (i % 3) * 0.6}s`,
                animationDelay: `${-(i * 0.3).toFixed(1)}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}

/* ── La scena ────────────────────────────────────────────────────────────────
   Il guscio comune a tutte e cinque — aurora, velo, bolle, numero, rifinitura —
   più l'oggetto di turno. È lo stesso impianto delle tavole, nello stesso
   ordine di sovrapposizione.

   --mo-loop: il giro lungo della scheda. Sulle tavole era una prop per file
   (13, 12, 14, 12, 15 s) ed è restata quella, scheda per scheda: cinque giri
   diversi vogliono dire che le schede non battono mai all'unisono, che è la
   stessa ragione per cui la targa ha lo stagger. */
const LOOP: Record<MosaicTopic, number> = {
  web: 12,
  archive: 13,
  claude: 14,
  photo: 12,
  autocad: 15,
};

/* memo: le cinque scene vivono dentro App insieme al resto della home e non
   prendono prop che cambiano. Senza, ogni setState della pagina — e ce n'è uno
   ogni volta che una targa gira — le ridisegnerebbe tutte e cinque. */
export const MosaicScene = memo(function MosaicScene({ topic }: { topic: MosaicTopic }) {
  const loop = LOOP[topic];
  return (
    <div
      className={`mo-scena mo-scena--${topic}`}
      style={{ "--mo-loop": `${loop}s` } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* Il fondo: la tinta della card, dal chiaro al pieno. Non è dipinto —
          è currentColor, vedi la nota ① in testa al file. */}
      <div className="mo-fondo" />
      {/* L'aurora: l'unico blur, e si muove pianissimo. */}
      <div className="mo-aurora" />
      {/* Il velo caldo dal basso, che dà profondità al piano. */}
      <div className="mo-velo" />

      {topic === "photo" && <Bokeh />}
      {topic === "autocad" && <FondoGeometra />}

      <div className="mo-palco">
        {topic === "archive" && <ScenaArchivio loop={loop} />}
        {topic === "web" && <ScenaWeb />}
        {topic === "claude" && <ScenaIA loop={loop} />}
        {topic === "photo" && <ScenaFoto />}
        {topic === "autocad" && <ScenaGeometra />}
      </div>

      <Bolle topic={topic} />

      {/* Il numero della tavola, in alto a destra: sulle tavole stava in basso
          accanto al titolo, ma lì la targa è nostra e occupa l'angolo. */}
      <span className="mo-num">{NUM[topic]}</span>

      {/* La rifinitura: il filo chiaro sul bordo interno e la passata di luce.
          Sono i due strati che le tavole avevano in fondo, e fanno lo stesso
          lavoro dei riflessi della lastra — vedi home.css. */}
      <span className="mo-rim" />
      <span className="mo-gloss" />
    </div>
  );
});

export default MosaicScene;
