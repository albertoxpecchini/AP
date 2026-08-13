import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  IcArrowLeft, IcWrench, IcRotate, IcTrash, IcTerminal, IcFile, IcGitCommit,
  IcGitBranch, IcCheck, IcPlay, IcTrend,
} from "../site/homeIcons";
import { PageBackdrop } from "../site/homeFx";
import "../home.css";
import "./cleaning.css";

// ─────────────────────────────────────────────────────────────────────────────
// /cleaning — l'officina, e solo in locale.
//
// Questa pagina fa tre cose che un sito pubblico non deve poter fare: legge i
// file del repo, li riscrive, e fa commit. Sta in piedi solo perché dall'altra
// parte c'è `scripts/janitor/api-dev.mjs`, un plugin che vive dentro
// `configureServer` — l'aggancio che gira solo con `vite dev`. In produzione
// quegli endpoint non esistono, e la rotta stessa non entra nel bundle: in
// main.tsx è dietro `import.meta.env.DEV`, che rollup risolve a `false` e porta
// via insieme all'import.
//
// Veste: design system .sb- della piattaforma, come le altre pagine — stesso
// guscio (fondale unico fisso, nav sottile con briciola, sezioni trasparenti),
// stessi bottoni, stessi pannelli. Le classi proprie hanno il prefisso della
// pagina, `.sb-cl-*`. Palette neutra più il solo azzurro del marchio: qui non
// c'è un rosso per gli errori né un arancio per gli avvisi, si distinguono
// per peso e bordo — vedi cleaning.css.
//
// L'unico stato che conta davvero è `modificato`: finché un file aperto ha
// modifiche non salvate, non si fa nient'altro senza dirlo.
// ─────────────────────────────────────────────────────────────────────────────

type Voce = { path: string; bytes: number; motivo?: string; soloConTutto?: boolean };
type Duplicato = { file: string[]; sprecato: number };
type Analisi = {
  rigenerabili: Voce[];
  orfaniSrc: Voce[];
  assetOrfani: Voce[];
  dipendenzeInutili: { nome: string; versione: string }[];
  duplicati: Duplicato[];
  git: { oggettiSciolti: number; bytesSciolti: number; bytesPack: number; ramiConfluiti: string[] };
  cartelleProtette: string[];
  totali: { fileTracciati: number; moduliRaggiungibili: number };
};
type FileGit = { percorso: string; stato: string; inIndice: boolean; nuovo: boolean };
type StatoGit = { ramo: string; file: FileGit[]; avanti: number; ultimi: { hash: string; oggetto: string; quando: string }[] };
type Quarantena = { etichetta: string; voci: number; bytes: number };
type Stato = { analisi: Analisi; git: StatoGit; quarantene: Quarantena[] };
type VoceAlbero = { percorso: string; bytes: number; testo: boolean };

type Pesi = { git: number; lavoro: number; dist: number; cache: number };
type MisuraPagina = { fps: number; fpsMinimo: number; dentroBudget: number; lcp: number; errore?: string };
type Bench = { build?: { ms: number | null; totale: number; gzJs: number }; pagine: Record<string, MisuraPagina>; frenate?: Record<string, MisuraPagina> };
type Ultimo = {
  vuoto?: boolean;
  tipo?: string;
  quando?: string;
  pesoPrima?: Pesi;
  pesoDopo?: Pesi;
  tolti?: { path: string; bytes: number; motivo?: string }[];
  falliti?: { path: string; errore: string }[];
  quarantenati?: { path: string; bytes: number; categoria?: string }[];
  liberati?: number;
  problemi?: string[];
  prima?: Bench;
  dopo?: Bench;
};

const API = "/api/cleaning";

const peso = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " kB");

async function chiedi<T>(rotta: string, opzioni?: RequestInit): Promise<T> {
  const r = await fetch(API + rotta, opzioni);
  const dato = await r.json();
  if (!r.ok) throw new Error(dato?.errore || `errore ${r.status}`);
  return dato as T;
}

// Titolo di sezione: prima usava .sb-bk-sechead e .sb-bk-overline, che però
// stanno in approfondimento.css — un foglio che questa pagina non importa.
// Erano quindi classi che non stilavano niente: l'occhiello usciva a 16px
// tondi tondi come un paragrafo qualsiasi.
function Titolo({ icona, testo, occhiello }: { icona: React.ReactNode; testo: string; occhiello?: string }) {
  return (
    <div className="sb-cl-sechead">
      {occhiello && <p className="sb-cl-overline">{occhiello}</p>}
      <h2>
        <span className="sb-cl-sechead-ic" aria-hidden="true">{icona}</span>
        {testo}
      </h2>
    </div>
  );
}

// Le categorie pulite sono la maggioranza — ed è la notizia buona, quindi si
// vedono comunque. Ma occupavano una riga larga tutto il pannello per dire
// "niente", con l'occhio costretto ad attraversarla fino in fondo: quattro
// volte di fila. Adesso sono pastiglie in fila (radius 999, come ogni cosa
// tonda nel sito), e solo quelle che hanno qualcosa da dire si aprono sotto.
function Pastiglia({ nome, quante }: { nome: string; quante: number }) {
  return (
    <span className={"sb-cl-pill" + (quante ? " sb-cl-pill--sporco" : "")}>
      {nome}
      <span className="sb-cl-pill-n">{quante || <IcCheck size={11} />}</span>
    </span>
  );
}

// ── Prima e dopo ────────────────────────────────────────────────────────────
// Tutto in questa pagina è una coppia: quanto pesava / quanto pesa, quanti
// fotogrammi tenevi / quanti ne tieni. Una riga sola che sa raccontare una
// coppia, e la si riusa per lo spazio come per i fotogrammi — così il "prima e
// dopo" ha sempre la stessa forma e si impara a leggerlo una volta.
function Riga({ nome, prima, dopo, formatta, megli0Basso = true, nota }: {
  nome: string;
  prima: number;
  dopo: number;
  formatta: (n: number) => string;
  megli0Basso?: boolean;
  nota?: string;
}) {
  const delta = dopo - prima;
  const migliorato = megli0Basso ? delta < 0 : delta > 0;
  const uguale = Math.abs(delta) < 1e-9;
  return (
    <div className="sb-cl-riga">
      <span className="sb-cl-riga-nome">{nome}</span>
      <span className="sb-cl-riga-prima">{formatta(prima)}</span>
      <span className="sb-cl-riga-freccia" aria-hidden="true">→</span>
      <span className="sb-cl-riga-dopo">{formatta(dopo)}</span>
      <span className={"sb-cl-riga-delta" + (uguale ? "" : migliorato ? " sb-cl-riga-delta--meglio" : " sb-cl-riga-delta--peggio")}>
        {uguale ? "=" : (delta > 0 ? "+" : "−") + formatta(Math.abs(delta))}
      </span>
      {nota && <span className="sb-cl-nota sb-cl-riga-nota">{nota}</span>}
    </div>
  );
}

function Dettaglio({ nome, voci, riga }: {
  nome: string; voci: unknown[]; riga: (v: never, i: number) => React.ReactNode;
}) {
  if (!voci.length) return null;
  return (
    <div className="sb-cl-cat">
      <div className="sb-cl-cat-testa">
        <span className="sb-cl-cat-nome">{nome}</span>
        <span className="sb-chip">{voci.length}</span>
      </div>
      <ul className="sb-cl-cat-lista">{voci.slice(0, 20).map(riga as never)}</ul>
      {voci.length > 20 && <p className="sb-cl-nota">…e altri {voci.length - 20}</p>}
    </div>
  );
}

// ── Pagina ──────────────────────────────────────────────────────────────────

export default function Cleaning() {
  const [stato, setStato] = useState<Stato | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [albero, setAlbero] = useState<VoceAlbero[]>([]);

  const [filtro, setFiltro] = useState("");
  const [aperto, setAperto] = useState<string | null>(null);
  const [testo, setTesto] = useState("");
  const [originale, setOriginale] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [log, setLog] = useState<string[]>([]);
  const [inCorso, setInCorso] = useState<string | null>(null);
  const [messaggio, setMessaggio] = useState("");
  const [scelti, setScelti] = useState<Set<string>>(new Set());
  const [avviso, setAvviso] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [ultimo, setUltimo] = useState<Ultimo | null>(null);

  const consolle = useRef<HTMLPreElement>(null);
  const sorgente = useRef<EventSource | null>(null);

  const modificato = aperto !== null && testo !== originale;

  const ricarica = useCallback(async () => {
    try {
      const s = await chiedi<Stato>("/stato");
      setStato(s);
      setErrore(null);
      // Di default si committa tutto quello che è cambiato: è il caso normale.
      setScelti(new Set(s.git.file.map((f) => f.percorso)));
    } catch (e) {
      setErrore((e as Error).message);
    }
    // Il rendiconto dell'ultimo lavoro arriva comunque, anche se lo stato
    // fallisce: sono due cose indipendenti, e vederne una sola è meglio di
    // vederne zero.
    try {
      setUltimo(await chiedi<Ultimo>("/ultimo"));
    } catch {
      /* nessun lavoro ancora registrato */
    }
  }, []);

  useEffect(() => {
    const prima = document.title;
    document.title = "Officina del repo — Alberto Pecchini";
    return () => { document.title = prima; };
  }, []);

  // La nav prende bordo e ombra solo dopo lo scroll, come su tutto il sito:
  // in cima non c'è nessuna riga di confine.
  useEffect(() => {
    const alloScroll = () => setScrolled(window.scrollY > 60);
    alloScroll();
    window.addEventListener("scroll", alloScroll, { passive: true });
    return () => window.removeEventListener("scroll", alloScroll);
  }, []);

  useEffect(() => {
    ricarica();
    chiedi<{ file: VoceAlbero[] }>("/albero").then((d) => setAlbero(d.file)).catch(() => {});
  }, [ricarica]);

  // La consolle segue il log solo se si è già in fondo: se si sta leggendo
  // qualcosa più su, trascinare la vista sarebbe una scortesia.
  useEffect(() => {
    const el = consolle.current;
    if (!el) return;
    const inFondo = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (inFondo) el.scrollTop = el.scrollHeight;
  }, [log]);

  useEffect(() => () => sorgente.current?.close(), []);

  // Chiudere la scheda con modifiche non salvate deve costare una domanda.
  useEffect(() => {
    if (!modificato) return;
    const guardia = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", guardia);
    return () => window.removeEventListener("beforeunload", guardia);
  }, [modificato]);

  function esegui(cosa: string) {
    if (inCorso) return;
    setLog([]);
    setInCorso(cosa);
    const es = new EventSource(`${API}/esegui?cosa=${encodeURIComponent(cosa)}`);
    sorgente.current = es;
    // Il comando vero, in cima, come se lo si fosse scritto a mano: un bottone
    // che nasconde cosa esegue è un bottone di cui bisogna fidarsi, uno che lo
    // dichiara si può controllare.
    es.addEventListener("inizio", (e) => {
      const { comando } = JSON.parse((e as MessageEvent).data);
      setLog([`$ ${comando}`, ""]);
    });
    es.addEventListener("riga", (e) => setLog((l) => [...l, JSON.parse((e as MessageEvent).data)]));
    es.addEventListener("fine", (e) => {
      const { codice } = JSON.parse((e as MessageEvent).data);
      setLog((l) => [...l, "", codice === 0 ? "── finito ──" : `── finito con uscita ${codice} ──`]);
      es.close();
      setInCorso(null);
      ricarica();
    });
    es.onerror = () => { es.close(); setInCorso(null); setLog((l) => [...l, "── connessione interrotta ──"]); };
  }

  async function apri(percorso: string) {
    if (modificato && !confirm(`"${aperto}" ha modifiche non salvate. Le perdo?`)) return;
    try {
      const d = await chiedi<{ testo: string }>(`/file?p=${encodeURIComponent(percorso)}`);
      setAperto(percorso);
      setTesto(d.testo);
      setOriginale(d.testo);
      setAvviso(null);
    } catch (e) {
      setAvviso((e as Error).message);
    }
  }

  async function salva() {
    if (!aperto || !modificato) return;
    setSalvando(true);
    try {
      await chiedi("/file", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percorso: aperto, testo }),
      });
      setOriginale(testo);
      setAvviso(`Salvato ${aperto}`);
      ricarica();
    } catch (e) {
      setAvviso((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function committa() {
    if (!messaggio.trim()) { setAvviso("Serve un messaggio di commit"); return; }
    if (modificato && !confirm(`"${aperto}" non è salvato: committo senza?`)) return;
    try {
      await chiedi("/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messaggio, file: [...scelti] }),
      });
      setMessaggio("");
      setAvviso("Commit fatto");
      ricarica();
    } catch (e) {
      setAvviso((e as Error).message);
    }
  }

  async function spingi() {
    try {
      await chiedi("/push", { method: "POST" });
      setAvviso("Push fatto");
      ricarica();
    } catch (e) {
      setAvviso((e as Error).message);
    }
  }

  const visibili = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    const base = albero.filter((f) => f.testo);
    if (!q) return base.slice(0, 60);
    return base.filter((f) => f.percorso.toLowerCase().includes(q)).slice(0, 60);
  }, [albero, filtro]);

  const a = stato?.analisi;

  return (
    <div className="sb-home sb-home--fx sb-cl-page">
      <PageBackdrop />

      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: briciola Home / Officina ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-cl-back" aria-label="Torna alla home">
            <IcArrowLeft size={16} />
            <span>Home</span>
          </Link>
          <span className="sb-cl-crumb" aria-hidden="true">/</span>
          <span className="sb-cl-navtitle"><IcWrench size={16} /> Officina</span>
          <div className="sb-nav-right">
            {stato && (
              <span className="sb-chip sb-cl-ramo" title="ramo corrente">
                <IcGitBranch size={13} />
                {stato.git.ramo}
                {stato.git.avanti > 0 && ` · ${stato.git.avanti} da spingere`}
              </span>
            )}
            <button className="sb-btn sb-btn--sm sb-btn--secondary" onClick={ricarica} disabled={!!inCorso}>
              <IcRotate size={14} /> Aggiorna
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ── Hero sobrio ── */}
        <section className="sb-cl-hero">
          <div className="sb-container">
            <p className="sb-cl-eyebrow">Solo in locale · non esiste in produzione</p>
            <h1 className="sb-cl-h1">Officina del repo</h1>
            <p className="sb-cl-lead">
              Le stesse cose del terminale, ma guardabili: lo sporco elencato, i lavori che
              arrivano riga per riga mentre succedono, i file del repo da aprire e correggere,
              e il commit lì sotto.
            </p>
          </div>
        </section>

        {errore && (
          <div className="sb-container">
            <div className="sb-cl-avviso sb-cl-avviso--male" role="alert">
              {errore}
              <span className="sb-cl-nota"> — gli endpoint esistono solo con <code>npm run dev</code>.</span>
            </div>
          </div>
        )}
        {avviso && (
          <div className="sb-container">
            <div className="sb-cl-avviso" role="status" onClick={() => setAvviso(null)}>{avviso}</div>
          </div>
        )}

        {/* ── Sporco + Lavori, affiancati dove c'è spazio ── */}
        <section className="sb-section" aria-label="Analisi e lavori">
          <div className="sb-container sb-cl-griglia">
            <div className="sb-cl-riquadro">
              <Titolo icona={<IcTrash size={16} />} testo="Sporco trovato" occhiello="Analisi" />
              <div className="sb-panel"><div className="sb-panel-inner sb-cl-categorie">
                {!a && <p className="sb-cl-nota">Sto guardando…</p>}
                {a && (
                  <>
                    <div className="sb-cl-pills">
                      <Pastiglia nome="Rigenerabili" quante={a.rigenerabili.length} />
                      <Pastiglia nome="Orfani in src/" quante={a.orfaniSrc.length} />
                      <Pastiglia nome="Asset mai nominati" quante={a.assetOrfani.length} />
                      <Pastiglia nome="Dipendenze inutili" quante={a.dipendenzeInutili.length} />
                      <Pastiglia nome="Duplicati" quante={a.duplicati.length} />
                    </div>

                    <Dettaglio nome="Rigenerabili" voci={a.rigenerabili}
                      riga={(v: Voce) => (
                        <li key={v.path} className={v.soloConTutto ? "sb-cl-solo-tutto" : undefined}>
                          <code>{v.path}</code>{" "}
                          <span className="sb-cl-nota">
                            {peso(v.bytes)} — {v.motivo}
                            {v.soloConTutto && " · resta, salvo --tutto"}
                          </span>
                        </li>
                      )} />
                    <Dettaglio nome="Moduli orfani in src/" voci={a.orfaniSrc}
                      riga={(v: Voce) => <li key={v.path}><code>{v.path}</code> <span className="sb-cl-nota">{peso(v.bytes)}</span></li>} />
                    <Dettaglio nome="Asset mai nominati" voci={a.assetOrfani}
                      riga={(v: Voce) => <li key={v.path}><code>{v.path}</code> <span className="sb-cl-nota">{peso(v.bytes)}</span></li>} />
                    <Dettaglio nome="Dipendenze mai importate" voci={a.dipendenzeInutili}
                      riga={(d: { nome: string; versione: string }) => <li key={d.nome}><code>{d.nome}</code> <span className="sb-cl-nota">{d.versione}</span></li>} />
                    <Dettaglio nome="Duplicati" voci={a.duplicati}
                      riga={(d: Duplicato, i: number) => (
                        <li key={i}><span className="sb-cl-nota">{peso(d.sprecato)} sprecati</span> {d.file.map((f) => <code key={f}>{f}</code>)}</li>
                      )} />
                    <p className="sb-cl-nota sb-cl-riepilogo">
                      {a.totali.moduliRaggiungibili} moduli raggiungibili · git: {a.git.oggettiSciolti} oggetti sciolti,
                      pack {peso(a.git.bytesPack)}
                      {a.git.ramiConfluiti.length > 0 && ` · ${a.git.ramiConfluiti.length} rami già confluiti`}
                    </p>
                  </>
                )}
              </div></div>
            </div>

            <div className="sb-cl-riquadro">
              <Titolo icona={<IcTerminal size={16} />} testo="Lavori" occhiello="Da lanciare" />
              <div className="sb-cl-bottoni">
                <button className="sb-btn sb-btn--primary" onClick={() => esegui("applica")} disabled={!!inCorso}>
                  <IcPlay size={14} /> Pulisci e verifica
                </button>
                <button className="sb-btn sb-btn--secondary" onClick={() => esegui("bench")} disabled={!!inCorso}>
                  Benchmark
                </button>
                <button className="sb-btn sb-btn--secondary" onClick={() => esegui("prove")} disabled={!!inCorso}>
                  Prove
                </button>
                <button className="sb-btn sb-btn--secondary" onClick={() => esegui("analisi")} disabled={!!inCorso}>
                  Solo analisi
                </button>
                {inCorso && <span className="sb-cl-inCorso">in corso: {inCorso}…</span>}
              </div>
              <p className="sb-cl-nota">
                «Pulisci e verifica» mette da parte, ricostruisce, misura, e rimette tutto a posto da
                solo se qualcosa peggiora. Ci mette qualche minuto: il log arriva mentre succede.
              </p>
              <pre className="sb-cl-consolle" ref={consolle} aria-live="polite">
                {log.length ? log.join("\n") : "Nessun lavoro ancora lanciato."}
              </pre>

              {!!stato?.quarantene.length && (
                <div className="sb-cl-quarantene">
                  <span className="sb-cl-nota">Quarantene:</span>
                  {stato.quarantene.map((q) => (
                    <span key={q.etichetta} className="sb-chip">{q.etichetta} · {q.voci} file · {peso(q.bytes)}</span>
                  ))}
                  <button className="sb-btn sb-btn--secondary sb-btn--sm" onClick={async () => {
                    try { await chiedi("/ripristina", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etichetta: "ultima" }) }); setAvviso("Quarantena ripristinata"); ricarica(); }
                    catch (e) { setAvviso((e as Error).message); }
                  }}>Ripristina l'ultima</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Prima e dopo: il rendiconto dell'ultimo lavoro ── */}
        {ultimo && !ultimo.vuoto && ultimo.pesoPrima && ultimo.pesoDopo && (
          <section className="sb-section sb-cl-sezione-stretta" aria-label="Prima e dopo">
            <div className="sb-container">
              <Titolo
                icona={<IcTrend size={16} />}
                testo="Prima e dopo"
                occhiello={ultimo.quando ? `Ultimo lavoro · ${new Date(ultimo.quando).toLocaleString("it-IT")}` : "Ultimo lavoro"}
              />
              <div className="sb-cl-prima-dopo">
                {/* ── Spazio ── */}
                <div className="sb-panel"><div className="sb-panel-inner">
                  <h3 className="sb-cl-sottotitolo">Spazio</h3>
                  <div className="sb-cl-righe">
                    <Riga nome="cartella .git" prima={ultimo.pesoPrima.git} dopo={ultimo.pesoDopo.git} formatta={peso} />
                    <Riga nome="file del progetto" prima={ultimo.pesoPrima.lavoro} dopo={ultimo.pesoDopo.lavoro} formatta={peso} />
                    <Riga nome="build (dist)" prima={ultimo.pesoPrima.dist} dopo={ultimo.pesoDopo.dist} formatta={peso}
                      nota="torna alla prossima build" />
                    <Riga nome="cache di sviluppo" prima={ultimo.pesoPrima.cache} dopo={ultimo.pesoDopo.cache} formatta={peso}
                      nota="si riscalda da sola" />
                    <div className="sb-cl-righe-totale">
                      <Riga nome="in tutto"
                        prima={ultimo.pesoPrima.git + ultimo.pesoPrima.lavoro + ultimo.pesoPrima.dist + ultimo.pesoPrima.cache}
                        dopo={ultimo.pesoDopo.git + ultimo.pesoDopo.lavoro + ultimo.pesoDopo.dist + ultimo.pesoDopo.cache}
                        formatta={peso} />
                    </div>
                  </div>
                  <p className="sb-cl-nota sb-cl-riepilogo">
                    Definitivo — git più file del progetto —{" "}
                    <strong>
                      {peso(Math.max(0,
                        (ultimo.pesoPrima.git - ultimo.pesoDopo.git) +
                        (ultimo.pesoPrima.lavoro - ultimo.pesoDopo.lavoro)))}
                    </strong>
                    . Il resto è spazio prestato: torna appena si ricostruisce.
                  </p>
                </div></div>

                {/* ── Fotogrammi ── */}
                {ultimo.prima && ultimo.dopo && (
                  <div className="sb-panel"><div className="sb-panel-inner">
                    <h3 className="sb-cl-sottotitolo">Fotogrammi entro i 16.7 ms</h3>
                    <div className="sb-cl-righe">
                      {Object.entries(ultimo.dopo.pagine)
                        .filter(([p, d]) => !d.errore && ultimo.prima?.pagine?.[p])
                        .map(([p, d]) => (
                          <Riga key={p} nome={p}
                            prima={ultimo.prima!.pagine[p].dentroBudget}
                            dopo={d.dentroBudget}
                            formatta={(n) => n.toFixed(1) + "%"}
                            megli0Basso={false} />
                        ))}
                    </div>
                    {ultimo.prima.build && ultimo.dopo.build && (
                      <div className="sb-cl-righe sb-cl-righe-totale">
                        <Riga nome="js gzip" prima={ultimo.prima.build.gzJs} dopo={ultimo.dopo.build.gzJs} formatta={peso} />
                      </div>
                    )}
                    <p className="sb-cl-nota sb-cl-riepilogo">
                      {ultimo.problemi?.length
                        ? `Annullato: ${ultimo.problemi[0]}`
                        : "Nessuna richiesta rotta, nessun errore nuovo in console."}
                    </p>
                  </div></div>
                )}
              </div>

              {/* ── Cosa è sparito, uno per uno ── */}
              <div className="sb-cl-sparito">
                <div>
                  <h3 className="sb-cl-sottotitolo">
                    File eliminati
                    <span className="sb-chip">{ultimo.tolti?.length ?? 0}</span>
                    {!!ultimo.liberati && <span className="sb-cl-nota">{peso(ultimo.liberati)}</span>}
                  </h3>
                  {!ultimo.tolti?.length && <p className="sb-cl-nota">Niente da togliere: era già pulito.</p>}
                  {/* Quando i due numeri sembrano darsi torto — «eliminati 14.4 MB» sopra
                      uno spazio che non cambia — la ragione è che quella roba all'inizio
                      non c'era: l'ha ricostruita la build di verifica, e poi è stata
                      tolta. Sono vere tutte e due, e lasciarlo indovinare sarebbe il modo
                      più veloce di non farsi più credere. */}
                  {!!ultimo.liberati && !!ultimo.pesoPrima && !!ultimo.pesoDopo &&
                    (ultimo.pesoPrima.git + ultimo.pesoPrima.lavoro + ultimo.pesoPrima.dist + ultimo.pesoPrima.cache) -
                    (ultimo.pesoDopo.git + ultimo.pesoDopo.lavoro + ultimo.pesoDopo.dist + ultimo.pesoDopo.cache)
                      < ultimo.liberati / 2 && (
                    <p className="sb-cl-nota sb-cl-riepilogo">
                      Lo spazio qui sopra non cala di altrettanto perché parte di questa roba
                      all'inizio non c'era: l'ha ricostruita la build di verifica, e poi è stata
                      tolta. Il repo pesa come prima, non di meno.
                    </p>
                  )}
                  {!!ultimo.tolti?.length && (
                    <ul className="sb-cl-elenco-tolti">
                      {ultimo.tolti.map((v) => (
                        <li key={v.path}>
                          <span className="sb-cl-segno" aria-hidden="true">−</span>
                          <code>{v.path}</code>
                          <span className="sb-cl-tolto-peso">{peso(v.bytes)}</span>
                          {v.motivo && <span className="sb-cl-nota sb-cl-tolto-motivo">{v.motivo}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!!ultimo.falliti?.length && (
                    <ul className="sb-cl-elenco-tolti">
                      {ultimo.falliti.map((v) => (
                        <li key={v.path}>
                          <span className="sb-cl-segno" aria-hidden="true">!</span>
                          <code>{v.path}</code>
                          <span className="sb-cl-nota">non tolto: {v.errore}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="sb-cl-sottotitolo">
                    Messi da parte
                    <span className="sb-chip">{ultimo.quarantenati?.length ?? 0}</span>
                  </h3>
                  {!ultimo.quarantenati?.length && (
                    <p className="sb-cl-nota">
                      Nessun orfano trovato. Quando ce ne sono, finiscono in quarantena — non
                      cancellati — e tornano da soli se la build o il browser protestano.
                    </p>
                  )}
                  {!!ultimo.quarantenati?.length && (
                    <ul className="sb-cl-elenco-tolti">
                      {ultimo.quarantenati.map((v) => (
                        <li key={v.path}>
                          <span className="sb-cl-segno" aria-hidden="true">→</span>
                          <code>{v.path}</code>
                          <span className="sb-cl-tolto-peso">{peso(v.bytes)}</span>
                          {v.categoria && <span className="sb-cl-nota sb-cl-tolto-motivo">{v.categoria}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── File ── */}
        <section className="sb-section sb-cl-sezione-stretta" aria-label="File del repository">
          <div className="sb-container">
            <Titolo icona={<IcFile size={16} />} testo="File" occhiello="Da correggere" />
            <div className="sb-cl-officina">
              <div className="sb-cl-elenco">
                <input className="sb-cl-filtro" placeholder="filtra i file…" value={filtro}
                  aria-label="Filtra i file" onChange={(e) => setFiltro(e.target.value)} />
                <ul>
                  {visibili.map((f) => {
                    const taglio = f.percorso.lastIndexOf("/") + 1;
                    return (
                      <li key={f.percorso}>
                        <button className={"sb-cl-file" + (aperto === f.percorso ? " sb-cl-file--aperto" : "")}
                          onClick={() => apri(f.percorso)} title={f.percorso}>
                          <span className="sb-cl-file-percorso">
                            <span className="sb-cl-file-dir">{f.percorso.slice(0, taglio)}</span>
                            <span className="sb-cl-file-base">{f.percorso.slice(taglio)}</span>
                          </span>
                          <span className="sb-cl-nota">{peso(f.bytes)}</span>
                        </button>
                      </li>
                    );
                  })}
                  {!visibili.length && <li className="sb-cl-nota sb-cl-vuoto-elenco">Nessun file.</li>}
                </ul>
              </div>

              <div className="sb-cl-editor">
                {!aperto && <p className="sb-cl-nota sb-cl-vuoto">Scegli un file a sinistra.</p>}
                {aperto && (
                  <>
                    <div className="sb-cl-editor-testa">
                      <code>{aperto}</code>
                      {modificato && <span className="sb-chip sb-cl-chip--attenzione">non salvato</span>}
                      <button className="sb-btn sb-btn--primary sb-btn--sm" onClick={salva} disabled={!modificato || salvando}>
                        {salvando ? "Salvo…" : "Salva"}
                      </button>
                      <button className="sb-btn sb-btn--secondary sb-btn--sm" onClick={() => setTesto(originale)} disabled={!modificato}>
                        Annulla
                      </button>
                    </div>
                    <textarea className="sb-cl-testo" value={testo} spellCheck={false}
                      aria-label={`Contenuto di ${aperto}`}
                      onChange={(e) => setTesto(e.target.value)}
                      onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); salva(); } }} />
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Commit ── */}
        <section className="sb-section sb-cl-sezione-stretta" aria-label="Commit">
          <div className="sb-container">
            <Titolo icona={<IcGitCommit size={16} />} testo="Commit" occhiello="Da mandare" />
            <div className="sb-panel"><div className="sb-panel-inner">
              {!stato?.git.file.length && <p className="sb-cl-nota">Niente da committare: l'albero è pulito.</p>}
              {!!stato?.git.file.length && (
                <>
                  <ul className="sb-cl-cambiati">
                    {stato.git.file.map((f) => (
                      <li key={f.percorso}>
                        <label>
                          <input type="checkbox" checked={scelti.has(f.percorso)}
                            onChange={(e) => setScelti((s) => {
                              const n = new Set(s);
                              if (e.target.checked) n.add(f.percorso); else n.delete(f.percorso);
                              return n;
                            })} />
                          <span className={"sb-cl-stato" + (f.nuovo ? " sb-cl-stato--nuovo" : "")}>
                            {f.nuovo ? "nuovo" : f.stato}
                          </span>
                          <button type="button" className="sb-cl-cambiato-nome" onClick={() => apri(f.percorso)}>{f.percorso}</button>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <textarea className="sb-cl-messaggio" rows={3} placeholder="Messaggio del commit…"
                    aria-label="Messaggio del commit"
                    value={messaggio} onChange={(e) => setMessaggio(e.target.value)} />
                  <div className="sb-cl-bottoni">
                    <button className="sb-btn sb-btn--primary" onClick={committa} disabled={!messaggio.trim() || !scelti.size}>
                      <IcGitCommit size={14} /> Commit di {scelti.size} file
                    </button>
                    <button className="sb-btn sb-btn--secondary" onClick={spingi} disabled={!stato.git.avanti}>
                      Push{stato.git.avanti ? ` (${stato.git.avanti})` : ""}
                    </button>
                  </div>
                </>
              )}
              {!!stato?.git.ultimi.length && (
                <ul className="sb-cl-storia">
                  {stato.git.ultimi.map((c) => (
                    <li key={c.hash}><code>{c.hash}</code> {c.oggetto} <span className="sb-cl-nota">{c.quando}</span></li>
                  ))}
                </ul>
              )}
            </div></div>
          </div>
        </section>
      </main>
    </div>
  );
}
