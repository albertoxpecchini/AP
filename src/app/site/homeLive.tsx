// ─────────────────────────────────────────────────────────────────────────────
// I disegni della griglia prodotti.
//
// ── Tre giri, e questo è il quarto ───────────────────────────────────────────
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
// Al terzo giro hanno preso un TERRENO — la carta millimetrata e l'alone che
// hanno le quattro tavole di Supabase da cui vengono (Realtime, Vector,
// Storage, Postgres Database) — e hanno smesso di galleggiare.
//
// Restava un difetto, ed era il più grosso: erano GRIGIE. Il 95 % dell'inchio-
// stro era il colore del testo diluito, e la tinta della card faceva da
// guarnizione — un anello qui, un puntino là. Sei tavole grigie in fila
// tornavano a essere «tutto molto uguale», che è esattamente il difetto per cui
// erano nate le sei tinte.
//
// Adesso la tinta è la LUCE della tavola, e gli strati sono quattro:
//
//   ① la carta millimetrata, che sfuma ai bordi;
//   ② l'alone della tinta, a due fermate;
//   ③ lo stesso quadretto, ma della tinta, dentro una macchia stretta al
//      centro: il colore non è steso sopra la carta, esce da sotto;
//   ④ la figura, accesa dove è il soggetto e grigia dove è contorno, con sopra
//      pezzi di interfaccia veri — e un FATTO vero, uno per tavola.
//
// Il quarto strato è quello che separa un'illustrazione da un pezzo di
// prodotto, e il fatto vero è quello che separa un pezzo di prodotto da un
// pezzo di prodotto QUALUNQUE: un indirizzo che è questo indirizzo, il nome di
// chi muove il cursore, il corpo macchina con cui sono scattate le foto, la
// quota di un modello che ho disegnato davvero.
//
//   ① Siti web          → una finestra con la sagoma della casa e il suo
//                          indirizzo, e tre echi di sé stessa        (gli echi si aprono)
//   ② Rivalta e Cascina → un globo illuminato, due punti e la linea
//                          che li unisce, con sopra i due domini     (un impulso passa e arriva)
//   ③ Sviluppo con l'IA → due cursori con la targhetta del nome —
//                          «Alberto» e «Claude» — e le bollicine     (i puntini battono)
//   ④ Fotografia        → un provino a contatto rivisto con la matita:
//                          quattro fermate, tre croci e un cerchio —
//                          e nessun volto, perché non si pubblicano  (la revisione, otto secondi)
//   ⑤ Il geometra       → la tettoia in legno in assonometria, con
//                          l'ingombro a terra e la quota             (i punti si agganciano)
//   ⑥ Auto              → un contagiri intero: mezze tacche, cifre,
//                          zona rossa, le tre spie di controllo e la
//                          freccia del cambio                        (la lancetta sale)
//
// Da quale tavola loro viene ciascuna, e perché quella lì, sta scritto sopra
// ogni figura.
//
// ── Le regole del movimento ──────────────────────────────────────────────────
// Una cosa sola in movimento per riquadro, e quella cosa è un GESTO: qualcosa
// che comincia, finisce e ricomincia — non un oggetto che vibra.
//
// Una cosa sola non vuol dire un elemento solo. La tavola ④ ne muove tre —
// la lente, i segni della matita e la riga della targhetta — ma sono tre parti
// dello stesso gesto, la revisione di un provino, tenute insieme da un unico
// orologio da otto secondi con la battuta a due. La prova che è un gesto e non
// tre è che nessuna delle tre, da sola, si capirebbe.
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
// Al passaggio, oltre al gesto, la tavola si ACCENDE: alone e bagliori salgono
// al massimo e la figura si avvicina di un soffio. Sono transizioni su opacity
// e transform — le due proprietà che il compositore muove da solo — e scattano
// una volta entrando e una uscendo, non a ogni fotogramma.
//
// Le proprietà animate sono tre, e sono tutte a buon mercato: transform e
// opacity, che il compositore muove senza ricalcolare niente; fill su otto
// quadratini da 6 px (i punti di aggancio della tettoia); e lo scostamento di
// un tratteggio, che ridipinge il tracciato che ha sotto e nient'altro —
// l'impulso del globo, che è un trattino da tredici unità, e i quattro segni
// di matita del provino, che sono tre croci e un cerchio grandi quanto un
// fotogramma. L'unica animazione di layout è la pillola del comando, che cresce
// di un carattere alla volta: perché lì si possa fare sta scritto in home.css,
// sopra .sb-typebar.
//
// E niente filtri SVG: la luce delle figure sono due passate di tracciato (una
// larga e trasparente, una fine e piena), non un feGaussianBlur. Un filtro
// costa un buffer sfocato per tavola, ridipinto ogni volta che qualcosa dentro
// si muove; per sei tavole in una griglia che deve restare fluida mentre la
// pagina scorre, non vale il cambio.
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
   LA TAVOLA COMUNE — carta, LUCE, figura

   Tutte e sei le figure stanno su 280×170 e passano di qui. Gli strati erano
   tre — carta millimetrata, un alone della tinta, la figura — e la tavola si
   leggeva come un disegno a matita: il 95 % dell'inchiostro era grigio, e la
   tinta della card faceva da guarnizione. Sei tavole grigie una accanto
   all'altra tornavano a essere «tutto molto uguale», che è esattamente il
   difetto per cui erano nate le sei tinte.

   Adesso gli strati sono QUATTRO, e quello nuovo è la luce:

     ① la carta millimetrata, che sfuma ai bordi;
     ② l'alone della tinta, più forte di prima e a due fermate;
     ③ lo STESSO quadretto, ma della tinta, dentro una macchia stretta al
        centro: è quello che fa sembrare la carta illuminata invece che
        colorata — il colore non è steso sopra, esce da sotto;
     ④ la figura, accesa dove è il soggetto e grigia dove è contorno, con
        sopra pezzi di interfaccia veri (pillole, targhette, quote, EXIF).

   ── L'alone e il bagliore: perché non c'è un solo filtro ────────────────────
   La luce di una figura sottile si fa in due passate: lo stesso tracciato
   disegnato una prima volta largo e quasi trasparente (il bagliore), e una
   seconda volta fine e pieno (il tratto). È il trucco delle insegne al neon, e
   costa due tracciati invece di uno. Un feGaussianBlur darebbe una luce più
   morbida e costerebbe un buffer sfocato per tavola, ridipinto a ogni
   fotogramma in cui qualcosa dentro si muove: su sei tavole, per una griglia
   che deve restare fluida mentre la pagina scorre, non vale il cambio.

   ── I quattro id di ogni tavola ─────────────────────────────────────────────
   Gli id devono essere unici nel documento, quindi ognuno porta il nome della
   tavola come coda. La forma è sempre la stessa, e le figure li chiamano per
   nome senza che Plate() glieli passi:

     sb-pg-<nome>    il quadretto          sb-pw-<nome>   l'alone della tinta
     sb-pf-<nome>    la sfumatura ai bordi sb-ps-<nome>   la macchia di luce
     sb-ag-<nome>    il gradiente della tinta, per i tratti e i pieni accesi

   La scorciatoia `acc("nome")` scrive l'ultimo, che è quello che serve dentro
   le figure.

   ── L'alone prende la tinta da sé ───────────────────────────────────────────
   Gli stop dei gradienti sono `currentColor`, e il colore della tavola è
   --sb-accent (vedi .sb-ill nel foglio). Quindi la tavola della card blu è blu
   e quella della card rosa è rosa senza che qui dentro ci sia scritto un
   colore: la tinta arriva dal data-acc della card, come tutto il resto.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Il gradiente della tinta di una tavola: acceso in alto, affondato in basso.
 *  Va nei `fill` e negli `stroke` della figura — mai un colore scritto a mano. */
const acc = (name: string) => `url(#sb-ag-${name})`;

function Plate({ name, children }: { name: string; children: React.ReactNode }) {
  const grid = `sb-pg-${name}`;
  const fade = `sb-pf-${name}`;
  const glow = `sb-pw-${name}`;
  const spot = `sb-ps-${name}`;
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
        {/* Il quadretto della tinta. Stesso passo e stessa origine dell'altro:
            i due reticoli devono cadere sulla stessa riga, o si vedrebbero due
            carte sovrapposte invece di una carta accesa in mezzo. */}
        <pattern id={`${grid}-a`} width="11" height="11" patternUnits="userSpaceOnUse">
          <path className="sb-ill-gridline sb-ill-gridline--acc" d="M11,0 L0,0 L0,11" />
        </pattern>

        {/* La sfumatura ai bordi. Una maschera e non un velo del colore del
            fondo: sotto c'è vetro, e dietro al vetro la pagina che scorre. */}
        <radialGradient id={fade} cx="50%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="58%" stopColor="#fff" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${fade}-m`}>
          <rect width="280" height="170" fill={`url(#${fade})`} />
        </mask>

        {/* La macchia di luce: stretta, centrata sul soggetto. */}
        <radialGradient id={spot} cx="50%" cy="52%" r="40%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${spot}-m`}>
          <rect width="280" height="170" fill={`url(#${spot})`} />
        </mask>

        {/* L'alone. Due fermate e non una: la prima dà il centro caldo, la
            seconda la campitura larga che stacca la figura dalla card. */}
        <radialGradient id={glow} cx="50%" cy="52%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
          <stop offset="46%" stopColor="currentColor" stopOpacity="0.13" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>

        {/* Il gradiente dei tratti accesi. Scende in diagonale, come la luce
            delle lastre grandi dello scaffale: una figura di un colore solo è
            una figura ritagliata, una che sfuma è una figura illuminata. */}
        <linearGradient id={`sb-ag-${name}`} x1="0" y1="0" x2="0.45" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <g mask={`url(#${fade}-m)`}>
        <rect width="280" height="170" fill={`url(#${grid})`} />
      </g>
      <rect className="sb-ill-glow" width="280" height="170" fill={`url(#${glow})`} />
      <g mask={`url(#${spot}-m)`}>
        <rect width="280" height="170" fill={`url(#${grid}-a)`} />
      </g>
      {children}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① Card «Siti web» — la finestra e i suoi echi

   Rifatta sulla tavola Postgres Database di Supabase: un glifo grande, in
   tratto pieno, e dietro tre copie di sé stesso ruotate di pochi gradi. Le
   copie non sono un'ombra — sono la stessa forma stampata più volte, e quello
   che dicono è «non è un esemplare, è un mestiere».

   ── Due cose che prima non c'erano, e sono il punto ─────────────────────────
   LA SAGOMA. La finestra non ha più gli angoli tondi: ha l'angolo tagliato a
   45° in alto a sinistra e in basso a destra, che è la forma del sito (vedi
   «La forma» in home.css). La miniatura della card «Siti web» adesso è
   riconoscibilmente una pagina fatta qui, e non una finestra qualunque.

   L'INDIRIZZO. Nella barra c'è la pillola con albertopecchini.it. È lo stesso
   pezzo della finestra di FreshWork, ed è quello che trasforma un disegno di
   browser in QUESTA pagina: la card grande della griglia contiene la miniatura
   della pagina che la sta mostrando.

   Gli echi sono la sola SAGOMA, non la finestra intera: tre profili della
   tinta, sventagliati. Ripetere anche il contenuto voleva dire tre pagine
   sfocate una sull'altra; il profilo solo è una risma, che è quello che si
   voleva dire.

   Il gesto: al passaggio gli echi si aprono un altro po', come un mazzo di
   carte, e tornano. Una transform sola per copia.
   ═══════════════════════════════════════════════════════════════════════════ */

/** La finestra: 208×130, con i due tagli a 45° della casa. Il taglio è 12, in
 *  proporzione lo stesso che le lastre grandi portano a schermo. */
const WIN_D = "M13,1 L209,1 L209,119 L197,131 L1,131 L1,13 Z";

/** I tre echi dietro alla finestra: rotazione e opacità, dal più lontano. */
const ECHOES: [number, number][] = [
  [-9, 0.3],
  [-4.5, 0.45],
  [4.5, 0.62],
];

export const BlueprintPage = memo(function BlueprintPage() {
  return (
    <Plate name="win">
      <defs>
        {/* La sola sagoma: la percorrono il bagliore, i tre echi e la cornice
            della finestra vera. Un tracciato, quattro usi. */}
        <path id="sb-win-sil" d={WIN_D} />

        {/* La finestra intera, disegnata una volta all'origine e portata sul
            posto dal <use>: così la geometria resta leggibile in coordinate
            sue, che partono da zero. */}
        <g id="sb-win">
          <use className="sb-ill-frame" href="#sb-win-sil" />
          <path className="sb-ill-line" d="M1,31 L209,31" />
          <circle className="sb-ill-dot" cx="17" cy="16" r="3" />
          <circle className="sb-ill-dot" cx="28" cy="16" r="3" />
          <circle className="sb-ill-dot" cx="39" cy="16" r="3" />
          {/* La pillola dell'indirizzo. Il testo è un <text> e non HTML perché
              deve viaggiare col <use>: è dentro la finestra, e la finestra è
              un riferimento che si sposta. */}
          <rect className="sb-ill-urlbar" x="58" y="8.5" width="112" height="15" rx="7.5" />
          <text className="sb-ill-url" x="114" y="19" textAnchor="middle" data-no-i18n>
            albertopecchini.it
          </text>

          <rect className="sb-ill-block" x="16" y="45" width="50" height="70" rx="5" />
          {/* Il riquadro acceso: è la hero della pagina disegnata, ed è l'unico
              pieno della tinta di tutta la finestra. Dentro, le due righe del
              titolo — la prima piena, la seconda smorzata: è il ritmo di una
              hero vera, non due barre a caso. */}
          <rect className="sb-ill-hero" x="76" y="45" width="117" height="38" rx="6" />
          <rect className="sb-ill-brand" x="86" y="55" width="66" height="7" rx="3.5" fill={acc("win")} />
          <rect
            className="sb-ill-brand sb-ill-brand--dim"
            x="86"
            y="67"
            width="44"
            height="5"
            rx="2.5"
            fill={acc("win")}
          />

          <rect className="sb-ill-block" x="76" y="91" width="117" height="11" rx="4" />
          <rect className="sb-ill-block" x="76" y="107" width="68" height="11" rx="4" />
          {/* Il bottone: la stessa sagoma della casa, in piccolo. */}
          <path className="sb-ill-cta" d="M154,105 L193,105 L193,114 L188,119 L149,119 L149,110 Z" fill={acc("win")} />
        </g>
      </defs>

      {/* Il bagliore: la sagoma percorsa una prima volta larga e trasparente.
          Sta sotto agli echi, così la luce esce da dietro la risma intera. */}
      <use className="sb-ill-bloom" href="#sb-win-sil" x={35} y={20} />

      {ECHOES.map(([rot, op], i) => (
        <use
          key={rot}
          className="sb-ill-echo"
          href="#sb-win-sil"
          x={35}
          y={20}
          style={{ "--r": `${rot}deg`, "--o": op, "--i": i } as React.CSSProperties}
        />
      ))}
      <use href="#sb-win" x={35} y={20} />
    </Plate>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   ② Card «Rivalta e Cascina Fontana» — il globo, e la linea fra i due

   È la tavola della card Edge Functions di Supabase — la stessa da cui viene
   la pillola del comando della card ③: una sfera a reticolo più grande della
   card e tagliata dai suoi bordi, e sopra una rete di segmenti dritti e
   diagonali a 45° che cala da un pezzo di interfaccia e finisce su dei punti.
   Lì i punti sono le regioni in cui gira una funzione; qui sono due, sono i
   due clienti, e fra loro c'è la linea che li unisce — l'unica cosa che questa
   card deve dire.

   Le due righe con i domini stanno in alto, dove nella tavola loro sta la
   pillola: da sotto di loro cala il filo che entra nella sfera e arriva sul
   primo punto.

   ── Il reticolo, senza una curva calcolata a mano ───────────────────────────
   Un cerchio disegnato su una sfera — parallelo o meridiano — visto in
   proiezione ortografica è SEMPRE un'ellisse. Quindi il globo non è una
   collezione di curve campionate punto per punto: sono dodici <ellipse> con
   rx, ry e una rotazione — sette paralleli e cinque meridiani — più il cerchio
   del bordo, e il conto che le trova sta qui sotto in una dozzina di righe. Il
   guadagno non è la brevità: è che la sfera si può girare, perché si sposta il
   polo e il reticolo si rifà da sé.

   ── La sfera adesso è ILLUMINATA ────────────────────────────────────────────
   Prima era un reticolo grigio: un disegno di sfera. Adesso ha addosso tre
   cose che una palla nello spazio ha davvero — una calotta di luce in alto a
   sinistra, il bordo acceso dove la luce lo prende di striscio, e il reticolo
   che si spegne scendendo. Sono tre gradienti e nessun filtro: la sfera non è
   dipinta, è accesa dalla tinta della card.

   Il gesto: un impulso parte da Rivalta e arriva a Cascina lungo la linea che
   le unisce, e all'arrivo l'anello di Cascina si allarga una volta. Due tempi,
   ma un gesto solo — è la stessa cosa che succede, vista partire e arrivare.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Il globo: il centro cade sotto il bordo basso della tavola e il raggio è
    più largo della tavola stessa, così se ne vede la calotta, tagliata da tre
    lati. Un globo che ci sta tutto dentro è un mappamondo da scrivania. */
const GLOBE = { cx: 146, cy: 214, r: 172 };

/* Dove punta l'asse polare, e sono i due soli numeri da toccare per girare la
   sfera: quanto lontano dal centro cade il polo (in raggi: 0 in mezzo, 1 sul
   bordo) e con che angolo sopra l'orizzonte. Quanto l'asse venga verso di noi
   si ricava da sé, ed è quello che schiaccia i paralleli — più il polo va
   verso il bordo, più le ellissi si chiudono. */
const POLE_D = 0.86;
const POLE_A = 52;

const rad = (deg: number) => (deg * Math.PI) / 180;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** L'asse polare in coordinate schermo: x a destra, y in su, z verso di noi. */
const POLE = {
  x: POLE_D * Math.cos(rad(POLE_A)),
  y: POLE_D * Math.sin(rad(POLE_A)),
  z: Math.sqrt(1 - POLE_D * POLE_D),
};

type Ellisse = { cx: number; cy: number; rx: number; ry: number; rot: number };

/* I paralleli. Quello alla latitudine φ è un cerchio di raggio cos φ su un
   piano perpendicolare all'asse, scostato di sin φ lungo l'asse: proiettato
   diventa un'ellisse centrata sull'ombra di quello scostamento, larga cos φ
   per il verso perpendicolare all'asse e schiacciata dalla z per il verso
   dell'asse. La rotazione è la stessa per tutti, perché l'asse è uno solo. */
const PARALLELI: Ellisse[] = [72, 54, 36, 18, 0, -18, -36].map((lat) => {
  const s = Math.sin(rad(lat));
  const c = Math.cos(rad(lat));
  return {
    cx: r2(GLOBE.cx + GLOBE.r * s * POLE.x),
    cy: r2(GLOBE.cy - GLOBE.r * s * POLE.y),
    rx: r2(GLOBE.r * c),
    ry: r2(GLOBE.r * c * POLE.z),
    rot: 90 - POLE_A,
  };
});

/* I meridiani. Il piano di un meridiano contiene l'asse, quindi la sua normale
   è perpendicolare all'asse e gira con l'angolo del meridiano. Un cerchio
   massimo proiettato è un'ellisse centrata sul centro della sfera, larga
   quanto il raggio nel verso perpendicolare all'ombra della normale e
   schiacciata di quanto la normale punta verso di noi.

   Gli angoli partono da 18 e non da 0 per un motivo pratico: a 0 la normale
   sta tutta nel piano dello schermo, il meridiano si vede di taglio ed è un
   segmento — cioè un'ellisse con ry a zero, che nessun browser disegna. */
const MERIDIANI: Ellisse[] = [18, 54, 90, 126, 162].map((ang) => {
  const ct = Math.cos(rad(ang));
  const st = Math.sin(rad(ang));
  const nx = -ct * Math.sin(rad(POLE_A)) - st * POLE.z * Math.cos(rad(POLE_A));
  const ny = ct * Math.cos(rad(POLE_A)) - st * POLE.z * Math.sin(rad(POLE_A));
  const nz = st * POLE_D;
  return {
    cx: GLOBE.cx,
    cy: GLOBE.cy,
    rx: GLOBE.r,
    ry: r2(GLOBE.r * Math.abs(nz)),
    // Il meno è il salto fra le due convenzioni: in matematica la y va in su,
    // in SVG in giù, e con lei cambia verso anche l'angolo.
    rot: r2((-Math.atan2(nx, -ny) * 180) / Math.PI),
  };
});

/** La linea fra i due clienti: giù di 45°, poi dritta. È scritta una volta
    sola perché la percorrono in tre — la linea, il suo bagliore e l'impulso,
    che sono la stessa `d` disegnata tre volte. */
const LINK = "M64,88 L88,112 H178";

/** Un filo del reticolo. La rotazione è un attributo transform e non una
    proprietà CSS: sull'ellisse ci sono già cx e cy, e girarla dal foglio
    vorrebbe dire dichiarare anche un transform-origin per ognuna. */
function Filo({ e }: { e: Ellisse }) {
  return <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} transform={`rotate(${e.rot} ${e.cx} ${e.cy})`} />;
}

/** Il marchietto delle due righe: un mappamondo da 16px. */
function RowMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M1.8,8 L14.2,8 M8,1.8 C10.4,4.2 10.4,11.8 8,14.2 C5.6,11.8 5.6,4.2 8,1.8" />
    </svg>
  );
}

export const GlobeOrbit = memo(function GlobeOrbit() {
  return (
    <div className="sb-ill-stage sb-ill-stage--globe">
      <Plate name="globe">
        <defs>
          {/* La luce sulla palla: il centro sta in alto a sinistra rispetto al
              globo, non al riquadro, ed è per questo che i due numeri sono
              così spostati — il centro della sfera cade sotto la tavola. */}
          <radialGradient id="sb-globe-lit" cx="34%" cy="22%" r="52%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.07" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          {/* Il bordo: acceso dove la luce lo prende di striscio, spento
              dall'altra parte. Un cerchio con un gradiente lineare sopra fa
              esattamente questo, e costa un tracciato. */}
          <linearGradient id="sb-globe-rim" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Il reticolo si prende la stessa maschera della carta millimetrata —
            quella che Plate() dichiara con il prefisso del suo nome — così i
            fili svaniscono ai bordi invece di finire tagliati di netto, e la
            sfera non litiga con i quadretti che ha sotto. */}
        <g mask="url(#sb-pf-globe-m)">
          <circle className="sb-ill-ball" cx={GLOBE.cx} cy={GLOBE.cy} r={GLOBE.r} fill="url(#sb-globe-lit)" />
          <g className="sb-ill-mesh">
            {PARALLELI.map((e) => (
              <Filo key={`p${e.cy}`} e={e} />
            ))}
            {MERIDIANI.map((e) => (
              <Filo key={`m${e.ry}-${e.rot}`} e={e} />
            ))}
          </g>
          <circle className="sb-ill-limb" cx={GLOBE.cx} cy={GLOBE.cy} r={GLOBE.r} />
        </g>

        {/* Il filo che cala da sotto le righe, e le due code della rete: una
            finisce su un puntino, l'altra esce dal bordo destro e non finisce
            affatto. La rete non comincia e non finisce dentro la card. */}
        <path className="sb-ill-wire" d="M64,42 V88" />
        <path className="sb-ill-wire" d="M64,88 L44,108 H20" />
        <path className="sb-ill-wire" d="M178,112 L200,90 H280" />
        <circle className="sb-ill-tip" cx={20} cy={108} r={2.6} />

        {/* La linea fra i due: il bagliore sotto, il tratto sopra, e l'impulso
            che la percorre. */}
        <path className="sb-ill-bloom" d={LINK} />
        <path className="sb-ill-link" d={LINK} stroke={acc("globe")} />
        <path className="sb-ill-pulse" d={LINK} />

        {/* Rivalta, accesa della tinta della card; Cascina, in tratto, con
            l'anello che si allarga quando l'impulso arriva. Due punti e non
            due bandierine: su una sfera un punto è un posto. */}
        <circle className="sb-ill-halo" cx={64} cy={88} r={11} />
        <circle className="sb-ill-node sb-ill-node--on" cx={64} cy={88} r={4.6} />
        <circle className="sb-ill-ping" cx={178} cy={112} r={4.6} />
        <circle className="sb-ill-node" cx={178} cy={112} r={4.6} />
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
});

/* ═══════════════════════════════════════════════════════════════════════════
   ③ Card «Sviluppo assistito dall'IA» — due cursori, e i loro nomi

   È la tavola Realtime di Supabase: due cursori su un foglio a quadretti e le
   bollicine dei tre puntini, quelle di «sta scrivendo». Lì dicono «più persone
   sullo stesso documento»; qui la seconda persona è la macchina, ed è
   esattamente il mestiere della card — si scrive in due, e uno dei due non è
   umano.

   ── I nomi, che sono la cosa nuova ──────────────────────────────────────────
   Nella tavola loro ogni cursore porta la targhetta con il nome di chi lo
   muove, ed è quella targhetta a dire che le persone sono due e diverse. Senza,
   erano due frecce. Adesso ci sono: «Alberto» in grigio e «Claude» nella tinta
   della card. Non c'è una didascalia che spieghi la figura — la figura si
   spiega da sé, ed è la cosa più specifica che questa tavola potesse dire.

   Le bollicine sono scese da tre a due, una per cursore. Tre erano una in più
   di quanti erano quelli che scrivevano: una bollicina senza nessuno sotto è
   una decorazione.

   La pillola col comando resta, ed è il pezzo più onesto della tavola: dice
   che questa roba la si guida da riga di comando.

   Il gesto: i tre puntini della bollicina accesa battono a turno, e i due
   cursori derivano — come due mani vere su un documento.
   ═══════════════════════════════════════════════════════════════════════════ */

/** La sagoma del cursore, disegnata all'origine e portata sul posto da CSS. */
const CURSOR_D = "M0,0 L0,15 L4.2,11.2 L6.8,17 L9.6,15.8 L7,10.2 L12,10.2 Z";

/** Un cursore con la sua targhetta. La larghezza della targhetta è scritta a
 *  mano perché dentro un SVG il testo non misura la scatola che lo contiene:
 *  sono 6,2px per carattere del mono a 10px, più il respiro ai lati. */
function Caret({ name, x, y, on }: { name: string; x: number; y: number; on?: boolean }) {
  const w = name.length * 6.2 + 13;
  return (
    <g
      className={`sb-ill-cursor${on ? " sb-ill-cursor--b" : ""}`}
      style={{ "--x": `${x}px`, "--y": `${y}px` } as React.CSSProperties}
    >
      <path className="sb-ill-caret" d={CURSOR_D} />
      <rect className="sb-ill-tag" x={9} y={13} width={w} height={19} rx={5} />
      <text className="sb-ill-tagtext" x={9 + w / 2} y={26.5} textAnchor="middle" data-no-i18n>
        {name}
      </text>
    </g>
  );
}

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

export const LiveCursors = memo(function LiveCursors() {
  return (
    <div className="sb-ill-stage">
      <Plate name="live">
        <Bubble x={30} y={10} />
        <Caret name="Alberto" x={44} y={40} />
        <Bubble x={158} y={30} on />
        <Caret name="Claude" x={162} y={62} on />
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
});

/* ═══════════════════════════════════════════════════════════════════════════
   ④ Card «Fotografia» — il provino a contatto, e la revisione

   È la tavola Storage di Supabase: una griglia di riquadri con dentro il glifo
   del tipo di file, uno solo evidenziato. Lì sono immagini, documenti e video;
   qui sono tutti fotogrammi, perché è un provino a contatto — la striscia che
   il fotografo guarda per scegliere.

   E ha la stessa ragione della riga di testo della card: i volti non si
   pubblicano. Un provino di riquadri vuoti è la figura esatta di «ci sono, e
   non ve li faccio vedere».

   ── La revisione, che è il giro nuovo ───────────────────────────────────────
   Qui succedeva una cosa sola e durava due secondi: la cornice del fotogramma
   scelto saltava su un altro riquadro e tornava indietro. Era il gesto giusto
   per la tavola sbagliata — un provino a contatto non serve a guardare UN
   fotogramma, serve a sceglierne uno fra tanti, e quella scelta è un lavoro
   che dura.

   Adesso la tavola fa il lavoro intero, e ci mette otto secondi:

     · la lente si ferma su quattro fotogrammi, uno dopo l'altro, due secondi
       per fermata;
     · a ogni fermata il fotogramma riceve il suo segno di matita, tirato lì
       per lì — tre croci agli scarti e un cerchio a quello che si tiene;
     · e la targhetta viaggia con la lente cambiando riga a ogni fermata: il
       corpo macchina, l'obiettivo, l'apertura, l'ISO.

   È il gesto vero della matita dermografica sui provini: si guarda, si segna,
   e alla fine sul foglio resta scritto quale si stampa. Il cerchio sborda dal
   fotogramma e non chiude il giro dov'era partito, perché una mano non lo
   chiude mai — un cerchio perfetto sarebbe stampato, non tirato.

   Tre cose che si muovono sono due più di quante ne ammetta la regola in testa
   al file. Non è uno strappo: la regola dice una cosa sola per riquadro e
   quella cosa è un GESTO, e qui il gesto è uno — la revisione. Lente, segni e
   targhetta stanno tutti e tre sullo stesso orologio da otto secondi con la
   battuta a due, e nessuno dei tre si capirebbe da solo.

   ── I quattro dati della targhetta sono VERI ────────────────────────────────
   Non sono EXIF inventati per fare atmosfera: li ha scritti negli scatti la
   macchina, e li rilegge scripts/build-foto-shooting.mjs quando genera
   shooting/sessioni.json. Le sessioni di questo sito sono ottantanove scatti
   fatti tutti con lo stesso corpo e lo stesso obiettivo — Canon EOS 4000D ed
   EF-S 18-55mm f/3.5-5.6 III — e l'ISO più alto che c'è dentro è 3200.

   L'ultima colonna e l'ultima riga escono dal bordo apposta: la griglia
   continua fuori dalla card, e una griglia tagliata dal bordo è più grande di
   una che ci sta tutta dentro. Per questo le quattro fermate stanno tutte
   nelle colonne e nelle righe INTERE — una lente ferma su un fotogramma
   tagliato a metà è una lente fuori posto.

   Il fotogramma di riposo è la revisione FINITA: la lente parcheggiata sul
   fotogramma tenuto, i quattro segni sul foglio, la targhetta sul corpo
   macchina. Chi ha chiesto meno movimento vede il provino già scelto, e non
   una scelta a metà.
   ═══════════════════════════════════════════════════════════════════════════ */

const TILE_W = 56;
const TILE_H = 34;
const TILE_X = [14, 78, 142, 206, 270];
const TILE_Y = [12, 54, 96, 138];

/** Il fotogramma che si tiene. La lente parte di qui e ci torna, ed è l'unico
 *  che prende il cerchio invece della croce. */
const KEEP: [number, number] = [TILE_X[2], TILE_Y[1]];

/** Le tre fermate, nell'ordine in cui la lente le fa: in alto a sinistra, in
 *  alto a destra, in basso a sinistra — e poi a casa. Gli scostamenti da KEEP
 *  sono ricopiati in home.css dentro @keyframes sb-ill-sel, che è il posto in
 *  cui il movimento si scrive: se sposti una fermata, spostala anche là. */
const STOPS: [number, number][] = [
  [TILE_X[0], TILE_Y[0]],
  [TILE_X[3], TILE_Y[0]],
  [TILE_X[1], TILE_Y[2]],
];

/** Le quattro righe della targhetta, una per fermata. Ci stanno tutte dentro i
 *  52 px della targhetta: dieci caratteri del mono a 8 px sono 48. */
const EXIF = ["EOS 4000D", "EF-S 18-55", "f/3.5-5.6", "ISO 3200"];

/** La croce di uno scarto. I due tratti non si incrociano precisi e sbordano
 *  di un pelo dal fotogramma: una croce simmetrica sembra un glifo, questa
 *  sembra una matita. */
function cross(x: number, y: number): string {
  return `M${x + 10},${y + 7} L${x + 47},${y + 28} M${x + 45},${y + 6} L${x + 9},${y + 27}`;
}

/** Il cerchio di quello che si tiene: due mezzi giri di ellisse e una coda che
 *  passa oltre il punto di partenza.
 *
 *  Tre numeri, e nessuno dei tre è a occhio. È largo 7 px più del fotogramma
 *  per parte: sotto, il giro passava esattamente per i due angoli bassi della
 *  targhetta, e siccome sono della stessa tinta si leggevano come una macchia
 *  sola invece che come una riga sopra a un cerchio. Ed è storto di sei gradi,
 *  che è la cosa che lo fa sembrare tirato invece che stampato — un'ellisse in
 *  bolla, per quanto sbilenca la si disegni, resta un ovale di clipart. */
const LOOP_ROT = -6;

function loop(x: number, y: number): string {
  const cx = x + TILE_W / 2;
  const cy = y + TILE_H / 2;
  const rx = 35;
  const ry = 25;
  const cf = Math.cos(rad(LOOP_ROT));
  const sf = Math.sin(rad(LOOP_ROT));
  /* Il punto a θ gradi sull'ellisse, girata di LOOP_ROT intorno al centro. Il
     giro va scritto due volte — qui nei punti e nel terzo numero del comando A
     — perché l'arco SVG vuole gli estremi in coordinate del foglio e
     l'inclinazione a parte. */
  const p = (deg: number) => {
    const a = rad(deg);
    const c = Math.cos(a);
    const s = Math.sin(a);
    return `${r2(cx + rx * c * cf - ry * s * sf)},${r2(cy + rx * c * sf + ry * s * cf)}`;
  };
  const A = `A${rx},${ry} ${LOOP_ROT}`;
  return `M${p(100)} ${A} 1 1 ${p(280)} ${A} 1 1 ${p(100)} ${A} 0 1 ${p(118)}`;
}

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

export const ContactSheet = memo(function ContactSheet() {
  const [kx, ky] = KEEP;
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

      {/* I segni della matita. Ognuno si disegna da sé nel momento in cui la
          lente arriva sul suo fotogramma, e a tenerli in fila è --i: è il
          numero della fermata, e in home.css diventa il ritardo — due secondi
          a fermata.

          pathLength=100 su tutti e quattro: così il tratteggio che li scopre
          si scrive una volta sola nel foglio (dasharray 100, offset da 100 a
          zero) e vale tanto per la croce, che è lunga un'ottantina di unità,
          quanto per il cerchio, che ne misura duecento. Senza, ogni segno
          avrebbe voluto la sua lunghezza vera scritta a mano. */}
      <path
        className="sb-ill-mark sb-ill-mark--keep"
        d={loop(kx, ky)}
        pathLength={100}
        style={{ "--i": 0 } as React.CSSProperties}
      />
      {STOPS.map(([x, y], i) => (
        <path
          key={`${x}-${y}`}
          className="sb-ill-mark"
          d={cross(x, y)}
          pathLength={100}
          style={{ "--i": i + 1 } as React.CSSProperties}
        />
      ))}

      {/* La lente: cornice, bagliore e targhetta si spostano insieme, quindi
          la transform sta sul gruppo. È l'ultima disegnata, quindi sta sopra a
          tutto — anche ai segni, che sono sul foglio. */}
      <g className="sb-ill-tilesel">
        <rect className="sb-ill-selbloom" x={kx} y={ky} width={TILE_W} height={TILE_H} rx={7} />
        <rect className="sb-ill-selbox" x={kx} y={ky} width={TILE_W} height={TILE_H} rx={7} />
        <rect className="sb-ill-seltag" x={kx + 2} y={ky + TILE_H - 13} width={TILE_W - 4} height={11} rx={3} />
        {/* Le quattro righe sono impilate una sull'altra e si danno il turno
            con l'opacità. La prima è quella accesa da ferma: il corpo
            macchina, che è il dato che questa tavola porta da sempre. */}
        {EXIF.map((riga, i) => (
          <text
            key={riga}
            className={i === 0 ? "sb-ill-seltext sb-ill-seltext--on" : "sb-ill-seltext"}
            x={kx + TILE_W / 2}
            y={ky + TILE_H - 4.5}
            textAnchor="middle"
            style={{ "--i": i } as React.CSSProperties}
            data-no-i18n
          >
            {riga}
          </text>
        ))}
      </g>
    </Plate>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ Card «Il geometra e l'università» — la tettoia

   Qui c'era un cubo in assonometria con i vertici agganciati. Diceva la cosa
   giusta a metà — «si modella in tre dimensioni» — ma la diceva con la figura
   che un cubo ha in ogni manuale di ogni mestiere: un solido di riferimento.
   Il mio PCTO non è stato un cubo. Sono stati tre anni all'ufficio tecnico del
   reparto legno del Caem Group a modellare in AutoCAD delle TETTOIE: pilastri,
   travi, travetti e falda.

   Quindi adesso la tavola disegna una tettoia a falda unica, in assonometria
   isometrica, con le convenzioni che quel disegno ha davvero:

     · l'ingombro a terra tratteggiato — la proiezione in pianta, che sul
       foglio si tira sempre;
     · la falda in tinta e trasparente, con i quattro travetti sopra;
     · la linea di quota con il numero, che è la ragione per cui una tavola è
       una tavola e non un'illustrazione;
     · i vertici che si agganciano, uno dopo l'altro, come fa lo snap quando il
       cursore passa sui punti notevoli.

   Le coordinate non sono a occhio: sono la proiezione isometrica standard
   (X = (x−y)·cos30, Y = (x+y)/2 − z) di una tettoia da 4,4 × 2,8 metri, alta
   2,10 al colmo e 1,45 alla gronda, con 35 cm di sporto. Il conto sta in
   scripts/, non serve rifarlo: quello che conta è che il disegno è misurato,
   e che il numero della quota è l'altezza vera di quel modello.

   Il gesto: i vertici si agganciano uno dopo l'altro.
   ═══════════════════════════════════════════════════════════════════════════ */

/** La falda, con lo sporto: il quadrilatero che si vede per primo.

    ── Perché la vista è BASSA e non isometrica pura ───────────────────────────
    Con l'isometrica da manuale (la y di schermo pesata 0,5) la falda si mangia
    la tavola: si guarda la tettoia dall'alto, si vede quasi solo il piano, e
    quattro pilastri sotto un piano largo sono un tavolo. Qui la y pesa 0,34 —
    l'occhio è più basso — e allora si vede il PROSPETTO: pilastri alti, falda
    di scorcio, e sotto ci si passa. È la stessa vista con cui si presenta una
    tettoia al cliente, e non è un vezzo grafico: è quello che la fa leggere.

    Le coordinate vengono dalla proiezione X = (x−y)·cos30·s, Y = (x+y)·0,34·s −
    z·s di una tettoia da 3,80 × 2,40 metri, alta 2,50 al colmo e 1,90 alla
    gronda, con 30 cm di sporto e s = 22 px/m. */
const ROOF = "M128.7,34.2 L212.5,67.2 L155.3,106.1 L71.5,73.2 Z";
/** Lo SPESSORE della falda, sui due bordi bassi: la faccia di gronda e la
 *  costa di lato. Senza, il piano inclinato resta il ripiano di un tavolo; con
 *  quattro pixel e mezzo di spessore diventa quello che è — una copertura. */
const EAVE =
  "M71.5,73.2 L155.3,106.1 L155.3,110.6 L71.5,77.7 Z M155.3,106.1 L212.5,67.2 L212.5,71.7 L155.3,110.6 Z";
/** I quattro travetti, dalla gronda al colmo. */
const RAFTERS =
  "M148.9,42.2 L91.7,81.1 M163.3,47.9 L106.2,86.8 M177.8,53.5 L120.7,92.5 M192.3,59.2 L135.1,98.2";
/** I tre pilastri che si vedono. */
const POSTS = "M201.1,123.8 L201.1,68.8 M155.3,141.8 L155.3,100 M82.9,113.3 L82.9,71.5";
/** Il quarto, quello lontano: passa dietro alla falda, quindi è nascosto — e
 *  un tratto nascosto, sul foglio, si tratteggia. */
const POST_HIDDEN = "M128.7,95.4 L128.7,40.4";
/** Le due travi che portano i travetti, in testa ai pilastri. */
const BEAMS = "M128.7,40.4 L201.1,68.8 M82.9,71.5 L155.3,100";
/** L'ingombro a terra: la pianta della tettoia, tratteggiata. Sul foglio si
 *  tira sempre, ed è quello che appoggia la figura per terra invece di
 *  lasciarla galleggiare. */
const FOOTPRINT = "M128.7,95.4 L201.1,123.8 L155.3,141.8 L82.9,113.3 Z";
/** I punti notevoli che lo snap aggancia: i quattro angoli della falda e i tre
 *  piedi dei pilastri che si vedono. Le teste dei pilastri sono escluse
 *  apposta: cadono a una decina di pixel dagli angoli della falda, e due
 *  quadratini appaiati si leggono come un errore di disegno. */
const SNAPS: [number, number][] = [
  [128.7, 34.2],
  [212.5, 67.2],
  [155.3, 106.1],
  [71.5, 73.2],
  [201.1, 123.8],
  [155.3, 141.8],
  [82.9, 113.3],
];

export const CanopyPlate = memo(function CanopyPlate() {
  return (
    <Plate name="cad">
      {/* L'ingombro a terra sta sotto a tutto: è il piano su cui la tettoia
          appoggia, e il disegno tecnico lo mette per primo. */}
      <path className="sb-ill-cadhidden" d={FOOTPRINT} />
      <path className="sb-ill-cadhidden" d={POST_HIDDEN} />

      <path className="sb-ill-bloom sb-ill-bloom--roof" d={ROOF} />
      <path className="sb-ill-roof" d={ROOF} fill={acc("cad")} />
      <path className="sb-ill-rafter" d={RAFTERS} />
      <path className="sb-ill-cadline" d={ROOF} />
      <path className="sb-ill-cadline" d={BEAMS} />
      <path className="sb-ill-eave" d={EAVE} />
      <path className="sb-ill-post" d={POSTS} />

      {SNAPS.map(([cx, cy], i) => (
        <rect
          key={`${cx}-${cy}`}
          className="sb-ill-snap"
          x={cx - 3.2}
          y={cy - 3.2}
          width={6.4}
          height={6.4}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}

      {/* La quota dell'altezza. Sta sul pilastro ALTO — quello davanti a
          destra, dal piede alla trave — e non su uno degli altri: la falda è
          unica, quindi i quattro pilastri non sono alti uguale, e quotare il
          più basso vorrebbe dire scrivere un numero che non è l'altezza della
          tettoia. Sono i 2,50 metri al colmo del modello. */}
      <path className="sb-ill-quote" d="M234,68.8 L234,123.8 M229,68.8 L239,68.8 M229,123.8 L239,123.8" />
      <text className="sb-ill-quotenum" x="234" y="62" textAnchor="middle" data-no-i18n>
        2.50
      </text>
    </Plate>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ Card «Auto» — il contagiri

   Il contagiri resta: è già uno strumento, cioè la stessa famiglia delle altre
   tavole. Quello che cambia, di giro in giro, è quanto è uno strumento VERO.

   ── Cosa se n'è andato ──────────────────────────────────────────────────────
   In cima c'era una pillola chiara con dentro cinque pallini della tinta: le
   spie del cambio, quelle che sui motori da corsa si accendono a una a una
   avvicinandosi al fuorigiri. Erano sbagliate due volte. Sbagliate di forma:
   una pastiglia bianca appoggiata sopra alla carta millimetrata era l'unica
   superficie opaca di tutte e sei le tavole, e si vedeva solo quella. E
   sbagliate di sostanza: cinque pallini in fila non sono cinque spie, sono
   cinque pallini — nessuno dei cinque diceva di che cosa fosse la spia.

   ── Cosa c'è adesso, e perché ognuna delle tre cose ci sta ──────────────────
     · LE MEZZE TACCHE. Una fra ogni coppia di tacche piene, cioè ogni cinque-
       cento giri, corte la metà e del colore del terreno. È la prima cosa che
       distingue il quadrante di uno strumento dal disegno di un quadrante: su
       una scala vera si legge anche fra un numero e l'altro.
     · LE TRE SPIE DI CONTROLLO, in fila in basso, e sono glifi VERI —
       pressione dell'olio, temperatura del refrigerante, batteria. Stanno
       SPENTE, ed è la cosa giusta: su un cruscotto una spia accesa vuol dire
       che qualcosa non va, e questa è la tavola di tre auto sognate, non di un
       guasto. Le si riconosce dalla FORMA, che è l'unica cosa che un pallino
       non poteva fare.
     · LA FRECCIA DEL CAMBIO, in cima, dove stava la pillola: la spia che sulle
       auto vere si accende per dire «cambia marcia adesso». Una sola, grande,
       della tinta, e senza scatola intorno — il posto della vecchia pastiglia,
       fatto di luce invece che di superficie.

   ── E una quarta provata e tolta ────────────────────────────────────────────
   LA MARCIA, la cifra grande in mezzo al quadrante. Ci stava, ed è dove ogni
   cruscotto moderno la mette — ma lì dentro una cifra sola, per quanto grande,
   la si legge come una cifra della scala: il sei della marcia cadeva a un dito
   dal sei dei seimila giri, e i due si guardavano. Perché funzionasse ci voleva
   una scatola intorno, cioè esattamente la superficie opaca appena tolta dalla
   cima. Non vale il prezzo.

   Il gesto: la lancetta sale da fondo scala, la scia la insegue e sul finale
   si accende la freccia. Da ferma sta in alto, cioè al massimo, con la freccia
   accesa: il fotogramma finito.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le nove tacche del quadrante, dal minimo al massimo: fra 70 e 58 di raggio,
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

/** Le mezze tacche: una in mezzo a ogni coppia di tacche piene, cioè ogni
 *  cinquecento giri. Sono le uniche coordinate del quadrante che non stanno
 *  scritte a mano, e il conto è quello dell'arco — il punto a θ gradi sul
 *  raggio r sta in (140 − r·cos θ, 124 − r·sin θ), con θ da sinistra in su.
 *  Vanno da 70 a 64: la metà delle piene, che arrivano a 58. */
const MINOR = Array.from({ length: 8 }, (_, k) => {
  const a = rad(11.25 + k * 22.5);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return `M${r2(140 - 70 * c)},${r2(124 - 70 * s)} L${r2(140 - 64 * c)},${r2(124 - 64 * s)}`;
});

/** Le cifre, dove cadono le tacche pari: 2, 4, 6, 8 mila giri. Stanno su un
 *  raggio più corto delle tacche, dentro il quadrante. */
const NUMBERS: [string, number, number][] = [
  ["2", 101.2, 111.1],
  ["4", 123.9, 88.4],
  ["6", 156.1, 88.4],
  ["8", 178.8, 111.1],
];

/** La zona rossa: un arco appoggiato sul quadrante, dalla settima tacca (7000
 *  giri, la prima rossa) al fondo scala. Stesso raggio del quadrante — 70 —
 *  perché è una fascia sul bordo, non un secondo arco più dentro. */
const REDLINE = "M189.5,74.5 A70,70 0 0,1 210,124";

/** La freccia del cambio: la spia «cambia marcia», in cima al quadrante. È una
 *  sagoma piena e non un contorno perché una spia è luce, e la luce non ha un
 *  bordo più scuro di sé. */
const UPARROW = "M140,29 L149.5,42 H143.5 V49.5 H136.5 V42 H130.5 Z";

/* ── Le tre spie di controllo ────────────────────────────────────────────────
   Disegnate all'origine, dentro una scatola larga 18 e alta una quindicina, e
   portate sul posto da un transform: così le coordinate di ognuna si leggono
   per quello che sono — un bidoncino, un termometro, una batteria — e spostare
   la fila è un numero solo.

   Sono glifi da cruscotto, cioè quelli che stanno sul libretto: il bidoncino
   dell'olio con la goccia che cade dal beccuccio, il termometro con le onde
   del liquido sotto, e la batteria con i due morsetti e il più e il meno. */
const SPIE: [string, string][] = [
  [
    "olio",
    "M-7,0 H0 a2.5,2.5 0 0 1 2.5,2.5 v1.5 a2.5,2.5 0 0 1 -2.5,2.5 H-7 a2.5,2.5 0 0 1 -2.5,-2.5" +
      " v-1.5 a2.5,2.5 0 0 1 2.5,-2.5 Z M1.6,1 L6.4,-2.6 M6.4,-1.4 c-2,2.5 -2,4.5 0,4.5" +
      " c2,0 2,-2 0,-4.5 Z",
  ],
  [
    "temperatura",
    "M0,-7 L0,-1 M-4,-4.5 H-1.4 M-4,-1.8 H-1.4 M-2.8,1.9 a2.8,2.8 0 1 0 5.6,0 a2.8,2.8 0 1 0 -5.6,0" +
      " M-8.5,8 q2.1,-2.3 4.25,0 t4.25,0 t4.25,0 t4.25,0",
  ],
  [
    "batteria",
    "M-7.5,-2 h15 a1.5,1.5 0 0 1 1.5,1.5 v5 a1.5,1.5 0 0 1 -1.5,1.5 h-15" +
      " a1.5,1.5 0 0 1 -1.5,-1.5 v-5 a1.5,1.5 0 0 1 1.5,-1.5 Z" +
      " M-5,-2 V-4.5 H-2 V-2 M2,-2 V-4.5 H5 V-2 M-5.4,3 h3.6 M-3.6,1.2 v3.6 M1.8,3 h3.6",
  ],
];

/** Dove cade la fila: sotto alla scritta dell'unità, spaziata di 28. */
const SPIE_X = [112, 140, 168];
const SPIE_Y = 154;

export const GaugePlate = memo(function GaugePlate() {
  return (
    <Plate name="gauge">
      {/* La spia del cambio. Bagliore e sagoma stanno nello stesso gruppo
          perché si accendono insieme: è una lampadina, non due. */}
      <g className="sb-ill-uplamp">
        <path className="sb-ill-bloom" d={UPARROW} />
        <path className="sb-ill-uparrow" d={UPARROW} fill={acc("gauge")} />
      </g>

      <path className="sb-ill-dial" d="M70,124 A70,70 0 0,1 210,124" />
      {MINOR.map((d) => (
        <path key={d} className="sb-ill-minor" d={d} />
      ))}
      {DIAL.map((d, i) => (
        <path key={d} className={i >= 6 ? "sb-ill-tickmark sb-ill-tickmark--red" : "sb-ill-tickmark"} d={d} />
      ))}
      {NUMBERS.map(([n, x, y]) => (
        <text key={n} className="sb-ill-dialnum" x={x} y={y} textAnchor="middle" data-no-i18n>
          {n}
        </text>
      ))}

      <path className="sb-ill-bloom sb-ill-bloom--red" d={REDLINE} />
      <path className="sb-ill-redline" d={REDLINE} stroke={acc("gauge")} />

      {/* La scia: due lancette identiche, dietro, in ritardo di qualche grado.
          La lancetta vera è l'ultima. */}
      <g className="sb-ill-needle sb-ill-needle--ghost" style={{ "--d": "17deg", "--o": 0.16 } as React.CSSProperties}>
        <path d="M140,124 L140,58" />
      </g>
      <g className="sb-ill-needle sb-ill-needle--ghost" style={{ "--d": "8.5deg", "--o": 0.3 } as React.CSSProperties}>
        <path d="M140,124 L140,58" />
      </g>
      <g className="sb-ill-needle">
        <path className="sb-ill-needle-glow" d="M140,124 L140,58" />
        <path d="M140,124 L140,58" />
      </g>
      <circle className="sb-ill-hub" cx={140} cy={124} r={5.5} />
      <text className="sb-ill-dialunit" x={140} y={144} textAnchor="middle" data-no-i18n>
        rpm ×1000
      </text>

      {/* Le tre spie di controllo, spente. */}
      {SPIE.map(([nome, d], i) => (
        <path key={nome} className="sb-ill-spia" d={d} transform={`translate(${SPIE_X[i]} ${SPIE_Y})`} />
      ))}
    </Plate>
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
