// ─────────────────────────────────────────────────────────────────────────────
// Le due miniature dei siti — Rivalta sul Mincio e Cascina Fontana.
//
// Stanno dentro la finestra video della sezione «progetti in evidenza», al posto
// del filmato e dello screenshot: sono disegni vivi, non registrazioni.
//
// ── Da dove vengono ──────────────────────────────────────────────────────────
// Da due tavole preparate a parte («Miniatura Rivalta GIF», «Miniatura Cascina
// Fontana»): due schede 1280×720, ognuna col vestito del sito che racconta —
// Rivalta chiara, Jost, la pergola e i petali; Cascina scura, Bitter, i tralci e
// il pulviscolo. I numeri dentro sono quelli veri dei due siti, e sono la
// ragione per cui queste miniature valgono più di uno screenshot: uno screenshot
// mostra com'è fatta la home, questi mostrano che cosa c'è dentro.
//
// ── Le tre cose cambiate, e perché DOVEVANO ─────────────────────────────────
//
//   ① IL PALCO SI SCALA. Le tavole sono 1280×720 con le misure in px assolute —
//      titoli da 88px, riquadri da 22px di padding. Qui la finestra è larga
//      mezza colonna e cambia con la pagina. Rifare tutte quelle misure in
//      percentuale voleva dire ridisegnare due tavole; invece il palco resta
//      1280×720 esatti e si RIMPICCIOLISCE tutto insieme, con una scala sola
//      presa dalla larghezza del contenitore (100cqw / 1280). Così i rapporti
//      restano quelli disegnati a qualunque larghezza, ed è una transform, cioè
//      non costa niente.
//
//   ② I CARATTERI SONO QUELLI DI CASA. Le tavole chiamavano Jost, Bitter e
//      Source Serif 4 da Google Fonts: tre famiglie in più — con le loro
//      richieste e il loro salto di rendering — per due miniature larghe mezza
//      colonna, dove il testo più grande arriva sullo schermo a una ventina di
//      pixel. Le miniature usano lo stack del sito; il carattere distingue
//      comunque le due schede, perché una è di bastone e l'altra è graziata.
//
//   ③ IL MARCHIO ARRIVA DA /favicon.svg. Le tavole puntavano a un assets/ap.png
//      che non è mai arrivato insieme ai file. È lo stesso marchio che il sito
//      ha già in root e che la nav mostra in cima a ogni pagina: non serve una
//      seconda copia.
//
// ── Il fotogramma di riposo ──────────────────────────────────────────────────
// Come per le scene del mosaico: ogni keyframe comincia e finisce sullo stesso
// fotogramma, quindi con prefers-reduced-motion — che spegne i nomi in
// sitePreview.css — resta la miniatura intera e ferma, non una a metà.
//
// Il vestito sta in site/sitePreview.css.
// ─────────────────────────────────────────────────────────────────────────────
import { memo, useEffect, useRef } from "react";
import "./sitePreview.css";

/* ── La scala del palco ──────────────────────────────────────────────────────
   Guarda quanto è largo il guscio e scrive il rapporto con i 1280 della tavola.
   Perché non lo fa il CSS da solo sta scritto in sitePreview.css, sopra a
   .sp-palco: in breve, `scale()` vuole un numero e `100cqw / 1280` è una
   lunghezza.

   ResizeObserver e non un ascolto su resize della finestra: qui la larghezza
   cambia anche senza che la finestra si muova — la griglia dei lavori passa da
   due colonne a una, e a quel punto il guscio raddoppia mentre il viewport sta
   fermo. E un osservatore per miniatura si spegne da sé quando la scheda esce
   dal DOM, che con un listener globale va ricordato a mano. */
function useScalaPalco() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const guscio = ref.current;
    if (!guscio || typeof ResizeObserver === "undefined") return;
    const palco = guscio.firstElementChild as HTMLElement | null;
    if (!palco) return;

    const misura = () => {
      const w = guscio.clientWidth;
      if (w > 0) palco.style.setProperty("--sp-k", String(w / 1280));
    };
    misura();

    const ro = new ResizeObserver(misura);
    ro.observe(guscio);
    return () => ro.disconnect();
  }, []);
  return ref;
}

/** Il marchio .ap, quello vero del sito. */
function Marchio({ size, radius }: { size: number; radius: number }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: radius }}
      className="sp-marchio"
    />
  );
}

/* ── ① RIVALTA SUL MINCIO — il paese, in ogni suo dato ───────────────────────
   Fondo chiaro e caldo, la pergola che ondeggia in cima con i suoi grappoli, i
   petali che salgono, e in mezzo il titolo con la passata di luce. Sotto, i
   quattro numeri del paese e la striscia del meteo, con la temperatura che
   gira su quattro valori.

   La pergola e i petali sono l'unico posto in cui ho tolto roba: le tavole
   avevano otto campate e sei petali, qui sono sei e quattro. Alla larghezza a
   cui si vedono, gli ultimi due di ognuno cadevano sotto il pixel. */
const NUMERI_RIVALTA = [
  { n: "2.984", unita: null, che: "abitanti" },
  { n: "74", unita: null, che: "assi viari mappati" },
  { n: "954", unita: null, che: "edifici rilevati" },
  { n: "127,2", unita: "ha", che: "di zone umide" },
];

export const MiniaturaRivalta = memo(function MiniaturaRivalta() {
  const ref = useScalaPalco();
  return (
    <div className="sp sp--rivalta" ref={ref} aria-hidden="true">
      <div className="sp-palco">
        {/* La pergola: le campate e, sotto, i grappoli appesi. Ondeggiano
            insieme perché sono la stessa pianta. */}
        <div className="sp-pergola">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="sp-campata" />
          ))}
        </div>
        <div className="sp-tralci">
          {[12.2, 37.2, 62.4, 87.4].map((l, i) => (
            <span key={l} className="sp-grappolo" style={{ left: `${l}%` }}>
              {Array.from({ length: i % 2 ? 3 : 6 }, (_, k) => (
                <i key={k} />
              ))}
            </span>
          ))}
          {[24.6, 49.8, 75].map((l) => (
            <span key={l} className="sp-foglia" style={{ left: `${l}%` }} />
          ))}
        </div>

        {/* I petali che salgono. */}
        <span className="sp-petali">
          {[
            { l: 9, t: 58, s: 13, d: -0.3 },
            { l: 34, t: 66, s: 11, d: -2.2 },
            { l: 57, t: 78, s: 10, d: -3.1 },
            { l: 86, t: 72, s: 9, d: -2.6 },
          ].map((p) => (
            <i
              key={p.l}
              style={{
                left: `${p.l}%`,
                top: `${p.t}%`,
                width: p.s,
                height: p.s,
                animationDelay: `${p.d}s`,
              }}
            />
          ))}
        </span>

        <div className="sp-corpo">
          <div className="sp-insegna">
            <Marchio size={44} radius={12} />
            <span className="sp-dove">
              <i className="sp-punto" />
              Comune di Rodigo · Mantova
            </span>
          </div>

          <div className="sp-titolo">
            <h1>Rivalta sul Mincio</h1>
            <p>il paese, in ogni suo dato</p>
            <span className="sp-passata" />
          </div>

          <div className="sp-numeri">
            {NUMERI_RIVALTA.map((d, i) => (
              <div key={d.che} className="sp-numero" style={{ animationDelay: `${-i}s` }}>
                <span className="sp-n">
                  {d.n}
                  {d.unita ? <span className="sp-u"> {d.unita}</span> : null}
                </span>
                <span className="sp-che">{d.che}</span>
              </div>
            ))}
          </div>

          {/* Il meteo, con la temperatura che gira. La finestrella alta 1em e
              l'overflow nascosto sono tutto il meccanismo. */}
          <div className="sp-meteo">
            <span className="sp-sole" />
            <span className="sp-gradi">
              <span className="sp-rullo-slot">
                <span className="sp-rullo">
                  <span>21</span>
                  <span>22</span>
                  <span>21</span>
                  <span>20</span>
                </span>
              </span>
              <span className="sp-grado">°</span>
            </span>
            <span className="sp-riga" />
            <span className="sp-cielo">sereno a Rivalta, ora</span>
          </div>
        </div>

        <span className="sp-vignetta" />
      </div>
    </div>
  );
});

/* ── ② CASCINA FONTANA — dalla pianura mantovana ─────────────────────────────
   Il rovescio di Rivalta: fondo vinaccia scuro, carattere graziato, e la luce
   che viene da dietro invece che da sopra. Il tralcio a sinistra e le spighe a
   destra ondeggiano in controfase, il pulviscolo sale, e i quattro numeri
   stanno su una tavola avorio che è l'unica cosa chiara della scheda — quindi
   è lì che va l'occhio, ed è dove stanno i dati. */
const NUMERI_CASCINA = [
  { n: "63", che: "biolche coltivate" },
  { n: "~16", che: "ettari totali" },
  { n: "30", che: "pannelli fotovoltaici" },
  { n: "2", che: "operatori fissi" },
];

export const MiniaturaCascina = memo(function MiniaturaCascina() {
  const ref = useScalaPalco();
  return (
    <div className="sp sp--cascina" ref={ref} aria-hidden="true">
      <div className="sp-palco">
        <div className="sp-alone" />
        <div className="sp-alone-oro" />

        {/* Il tralcio appeso a sinistra. */}
        <div className="sp-tralcio">
          <span className="sp-ramo" />
          <span className="sp-uva sp-uva--grande">
            {Array.from({ length: 6 }, (_, k) => (
              <i key={k} />
            ))}
          </span>
          <span className="sp-uva sp-uva--piccola">
            {Array.from({ length: 3 }, (_, k) => (
              <i key={k} />
            ))}
          </span>
        </div>

        {/* Le due spighe a destra, in controfase col tralcio. */}
        <div className="sp-spighe">
          <span className="sp-spiga sp-spiga--alta">
            <i className="sp-stelo" />
            {[24, 44, 68, 92].map((t, i) => (
              <span key={t} className="sp-chicchi" style={{ top: t, opacity: 0.34 - i * 0.04 }}>
                <i />
                <i />
              </span>
            ))}
          </span>
          <span className="sp-spiga sp-spiga--bassa">
            <i className="sp-stelo" />
            {[18, 36, 58].map((t, i) => (
              <span key={t} className="sp-chicchi" style={{ top: t, opacity: 0.38 - i * 0.06 }}>
                <i />
                <i />
              </span>
            ))}
          </span>
        </div>

        {/* Il pulviscolo nella luce. */}
        <span className="sp-pulviscolo">
          {[
            { l: 18, t: 66, s: 5, d: -0.4 },
            { l: 31, t: 74, s: 4, d: -1.5 },
            { l: 52, t: 70, s: 6, d: -2.6 },
            { l: 68, t: 78, s: 4, d: -3.3 },
            { l: 83, t: 68, s: 5, d: -2 },
          ].map((p) => (
            <i
              key={p.l}
              style={{
                left: `${p.l}%`,
                top: `${p.t}%`,
                width: p.s,
                height: p.s,
                animationDelay: `${p.d}s`,
              }}
            />
          ))}
        </span>

        <div className="sp-corpo">
          <div className="sp-insegna">
            <Marchio size={46} radius={11} />
            <span className="sp-nome">
              <span className="sp-nome-forte">Cascina Fontana</span>
              <span className="sp-nome-sotto">Azienda Agricola · Rodigo</span>
            </span>
          </div>

          <div className="sp-occhiello">
            <span>Azienda agricola · Rodigo (MN)</span>
            <i className="sp-filo" />
          </div>

          <div className="sp-titolo">
            <h1>
              Dalla pianura
              <br />
              mantovana, da secoli.
            </h1>
            <span className="sp-passata" />
          </div>

          <div className="sp-tavola">
            {NUMERI_CASCINA.map((d, i) => (
              <div key={d.che} className="sp-voce" style={{ animationDelay: `${-i}s` }}>
                <span className="sp-n">{d.n}</span>
                <span className="sp-che">{d.che}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="sp-vignetta" />
      </div>
    </div>
  );
});

/** Le miniature, per la chiave con cui le chiama App.tsx.
 *
 *  Le chiavi sono quelle di STORIES, non quelle di projects.tsx: nella griglia
 *  dei «progetti in evidenza» le due liste si incontrano — la storia porta le
 *  righe del piede, il progetto porta l'indirizzo — e quella che itera è la
 *  storia. I due id non coincidono sempre («rivalta» di qua,
 *  «rivalta-sul-mincio» di là), quindi ci sono tutti e due: così la miniatura
 *  arriva comunque, da qualunque delle due parti la si chiami. */
export const MINIATURE: Record<string, () => React.ReactElement> = {
  rivalta: MiniaturaRivalta,
  "rivalta-sul-mincio": MiniaturaRivalta,
  "cascina-fontana": MiniaturaCascina,
  cascina: MiniaturaCascina,
};
