import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  IcArrowLeft, IcWrench, IcRotate, IcTrash, IcTerminal, IcFile, IcGitCommit,
  IcGitBranch, IcCheck, IcPlay,
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
// pagina, `.sb-cl-*`. Palette neutra più il solo verde del marchio: qui non
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
