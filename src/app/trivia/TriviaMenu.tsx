import { useMemo, useState, useRef, useLayoutEffect, useEffect } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, ListOrdered, GraduationCap, ArrowDownUp, ListChecks, ToggleLeft, PencilLine, MoreHorizontal, X, BrainCircuit } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CHAPTERS, questionsForMany } from "./questions";
import { fetchTotals } from "./leaderboardApi";
import { chapterCoverageFrom } from "./questionStats";
import type { ProgressMap } from "./progressApi";
import { iconForChapter } from "./chapterIcons";
import { TRIVIA_VERSION } from "./version";
import type { QType } from "./parseTrivia";

// Spezza un titolo in "righe" per le tile: le parole brevi/connettori (di, e,
// in, a, del...) e i pezzi tra parentesi NON vanno mai da soli su una riga,
// restano agganciati alla parola vicina. Così l'impaginazione resta leggibile.
const CONNETTORI = new Set(["di","e","in","a","il","la","lo","le","i","gli","del","della","dei","delle","dello","al","alla","con","su","da","per","e'","o","ed"]);
function titoloInRighe(titolo: string): string[] {
  const parole = titolo.split(/\s+/).filter(Boolean);
  const righe: string[] = [];
  for (let i = 0; i < parole.length; i++) {
    const p = parole[i];
    const breve = p.length <= 3 || CONNETTORI.has(p.toLowerCase()) || p.startsWith("(");
    // un connettore si attacca alla riga precedente (se c'è), altrimenti alla prossima
    if (breve && righe.length) righe[righe.length - 1] += " " + p;
    else if (breve && i + 1 < parole.length) { righe.push(p + " " + parole[i + 1]); i++; }
    else righe.push(p);
  }
  return righe;
}

// Selezione capitoli: lista di id. Vuota = tutti i capitoli.
export type ChapterSelection = string[];
// Selezione tipi di domanda. Vuota = tutti i tipi.
export type TypeSelection = QType[];

// Criteri di ordinamento della lista capitoli (tasto "Ordina").
type SortKey = "cronologico" | "az" | "za" | "esplorato";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "cronologico", label: "Ordine cronologico" },
  { key: "az",          label: "A → Z" },
  { key: "za",          label: "Z → A" },
  { key: "esplorato",   label: "Da esplorare" },
];

// Tipi di domanda selezionabili, con etichetta e icona "da gioco".
const TYPE_DEFS: { id: QType; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "multipla",   label: "Scelta multipla", desc: "Scegli l'opzione giusta", icon: ListChecks },
  { id: "vero-falso", label: "Vero o Falso",    desc: "Vero oppure falso",       icon: ToggleLeft },
  { id: "aperta",     label: "Completamento",   desc: "Scrivi tu la risposta",   icon: PencilLine },
];

interface TriviaMenuProps {
  dark: boolean;
  bestStreak: number;
  bestGrade: string;        // es. "A−" o "—"
  coverage: number;         // % totale db visto
  progress: ProgressMap;    // progresso per-account (copertura per capitolo)
  nick?: string;
  onPlay: (chapters: ChapterSelection, types: TypeSelection) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
  onPagella: () => void;
  onChangeNick: () => void;
}

export default function TriviaMenu({
  dark, bestStreak, bestGrade, coverage, progress, nick,
  onPlay, onTutorial, onLeaderboard, onPagella, onChangeNick,
}: TriviaMenuProps) {
  // Set di id capitoli selezionati. Vuoto = "Tutti i capitoli".
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Set di tipi domanda selezionati. Vuoto = "Tutti i tipi".
  const [types, setTypes] = useState<Set<QType>>(new Set());
  // Drawer "Altro" su mobile: raccoglie le azioni dopo Gioca (classifica, pagella…)
  // così la sequenza 1-2-3 resta pulita.
  const [moreOpen, setMoreOpen] = useState(false);

  // Punteggio totale del giocatore (somma dei best per capitolo) → mostrato come
  // "icona" col numero grande (es. 12.4k) e il nome sotto. Caricato una volta.
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  useEffect(() => {
    if (!nick) { setPlayerScore(null); return; }
    let alive = true;
    const realIds = CHAPTERS.map(c => c.id);
    fetchTotals(realIds, 500)
      .then(rows => { if (alive) { const k = nick.trim().toLowerCase(); setPlayerScore(rows.find(r => r.nick.trim().toLowerCase() === k)?.score ?? 0); } })
      .catch(() => { if (alive) setPlayerScore(0); });
    return () => { alive = false; };
  }, [nick]);
  // 12480 → "12.4k", 980 → "980"
  const fmtScore = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : `${n}`;

  // ── Fit-to-box "a parole" (stile Bolt): ogni PAROLA del titolo va su una riga
  //    propria, MAI tagliata, e ha dimensione INDIPENDENTE — ognuna ingrandita
  //    fino a riempire la larghezza della tile. Poi tutte le parole si scalano in
  //    blocco se eccedono l'altezza disponibile. Rigirato a resize e font ready. ──
  const gridWrapRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fitAll = () => {
      const root = gridWrapRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".trm-tile-titlebox").forEach(box => {
        const words = Array.from(box.querySelectorAll<HTMLElement>(".trm-word"));
        if (!words.length) return;
        const maxW = box.clientWidth - 2;   // margine di sicurezza anti-clipping
        const maxH = box.clientHeight;
        if (maxW <= 0 || !maxH) return;
        // 1) ogni parola: font-size massimo che entra in larghezza (mai troncata)
        words.forEach(w => {
          let lo = 9, hi = 56, best = 9;
          for (let i = 0; i < 10; i++) {
            const mid = (lo + hi) / 2;
            w.style.fontSize = mid + "px";
            if (w.scrollWidth <= maxW) { best = mid; lo = mid; } else hi = mid;
          }
          w.style.fontSize = Math.floor(best) + "px";
        });
        // 2) se la pila di parole sfora l'altezza, riduci tutte in proporzione
        const totalH = box.scrollHeight;
        if (totalH > maxH) {
          const k = (maxH / totalH) * 0.99;
          words.forEach(w => {
            w.style.fontSize = Math.floor(parseFloat(w.style.fontSize) * k) + "px";
          });
        }
      });
    };
    fitAll();
    window.addEventListener("resize", fitAll);
    (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(fitAll);
    return () => window.removeEventListener("resize", fitAll);
  });

  // Desktop: "torcia" del mouse. Scrive la posizione del cursore (in %) nelle
  // CSS var --mx/--my della tile sotto al puntatore, così un alone verde sfumato
  // segue il mouse (vedi .trm-tile-spot). Solo per puntatori reali.
  const handleTileMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const allMode = selected.size === 0;
  const toggleChapter = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const selectAll = () => setSelected(new Set());

  const allTypes = types.size === 0;
  const toggleType = (id: QType) =>
    setTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // ── Ordinamento della lista capitoli (tasto "Ordina") ──
  // cronologico = ordine di caricamento dei raw (default); az/za = per titolo;
  // esplorato = meno esplorati in cima (così è una "to-do" di studio).
  const [sortBy, setSortBy] = useState<SortKey>("cronologico");
  const orderedChapters = useMemo(() => {
    const arr = [...CHAPTERS];
    switch (sortBy) {
      case "az": return arr.sort((a, b) => a.title.localeCompare(b.title, "it"));
      case "za": return arr.sort((a, b) => b.title.localeCompare(a.title, "it"));
      case "esplorato": // meno esplorati in cima; a parità, ordine cronologico
        return arr.sort((a, b) => chapterCoverageFrom(progress, a.id).pct - chapterCoverageFrom(progress, b.id).pct || a.order - b.order);
      case "cronologico":
      default: return arr.sort((a, b) => a.order - b.order);
    }
  }, [sortBy, progress]);

  const bg       = dark ? "#0b0f14" : "#eef1f4";
  const card     = dark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const bord     = dark ? "rgba(255,255,255,0.11)" : "rgba(20,30,25,0.10)";
  const val      = dark ? "#e8eef4" : "#16201a";
  const lbl      = dark ? "#93a0ad" : "#5a6b62";
  const icon     = dark ? "#8b7bff" : "#6d4dff";
  const note     = dark ? "#6b7785" : "#8a9e91";
  const textMain = dark ? "#e8eef4" : "#16201a";
  const textSub  = dark ? "#a7b2bd" : "#4a5c50";

  // Accento del menù: viola neon ovunque (coerente col gioco). Lo smeraldo è
  // riservato ai capitoli COMPLETATI per distinguerli a colpo d'occhio.
  const vio  = dark ? "#8b7bff" : "#6d4dff";
  const vBord = dark ? "rgba(139,123,255,0.34)" : "rgba(109,77,255,0.26)";

  // Domande disponibili nella selezione corrente (capitoli + tipi).
  const availableCount = questionsForMany([...selected], [...types]).length;
  // Quante domande di OGNI tipo nei capitoli scelti (ignora il filtro tipi):
  // mostrato in leggero sul tasto del tipo, si aggiorna selezionando i capitoli.
  const countByType = useMemo(() => {
    const ids = [...selected];
    const m = {} as Record<QType, number>;
    (["multipla", "vero-falso", "aperta"] as QType[]).forEach(t => {
      m[t] = questionsForMany(ids, [t]).length;
    });
    return m;
  }, [selected]);
  const selectedName = allMode
    ? "Tutti i capitoli"
    : selected.size === 1
      ? (CHAPTERS.find(c => selected.has(c.id))?.title ?? "1 capitolo")
      : `${selected.size} capitoli`;

  // Nessun capitolo caricato (cartella content/trivia vuota): stato "in arrivo".
  if (CHAPTERS.length === 0) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200, background: bg,
        fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif',
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "1.3rem", padding: "1.5rem", textAlign: "center",
      }}>
        <div style={{ background: "#1a5030", color: "#fff", borderRadius: 18, padding: 16, display: "inline-flex", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <GraduationCap size={46} />
        </div>
        <div>
          <h1 style={{ fontSize: "clamp(2rem,8vw,2.6rem)", fontWeight: 900, letterSpacing: "0.26em", margin: 0, color: dark ? "#6fe0a6" : "#1a5030" }}>
            TRI<span style={{ color: dark ? "#9ff0c2" : "#3a9e5f" }}>VI</span>A
          </h1>
          <p style={{ margin: ".4rem 0 0", fontWeight: 700, color: textSub }}>Storia dell'Architettura</p>
        </div>
        <div style={{ background: card, border: `1px dashed ${bord}`, borderRadius: 14, padding: "1.5rem 1.3rem", maxWidth: 360, color: textSub }}>
          <BookOpen size={28} style={{ color: icon, marginBottom: ".5rem" }} />
          <p style={{ margin: 0, fontWeight: 800, color: textMain }}>Domande in arrivo</p>
          <p style={{ margin: ".4rem 0 0", fontSize: ".85rem", lineHeight: 1.5 }}>
            I capitoli del quiz verranno caricati a breve. Torna presto!
          </p>
        </div>
        <Link to="/#progetti" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", color: icon, textDecoration: "none", fontWeight: 700, fontSize: ".9rem" }}>
          <ArrowLeft size={18} /> Torna ai progetti
        </Link>
      </div>
    );
  }

  // Progressi capitolo "N/T" come ICONCINA grande e leggibile (es. 0/25 … 25/25):
  // pastiglia col numero in grande, verde mentre esplori, VIOLA quando completato
  // (coerente con la tile). Niente più anellino minuscolo: il numero è protagonista.
  const progressRing = (seen: number, total: number, pct: number) => {
    const done = pct >= 100;
    const col = done ? "#34d399" : (dark ? "#8b7bff" : "#6d4dff");
    const bg = done
      ? (dark ? "rgba(52,211,153,0.20)" : "rgba(16,163,74,0.12)")
      : (dark ? "rgba(139,123,255,0.20)" : "rgba(109,77,255,0.12)");
    return (
      <span
        className="trm-progbadge"
        style={{ color: col, background: bg, borderColor: col }}
        title={`${seen} / ${total} domande viste · ${pct}%`}
      >
        <span className="trm-progbadge-seen">{seen}</span>
        <span className="trm-progbadge-tot">/{total}</span>
      </span>
    );
  };

  // Tasto "Ordina": un solo tap → passa alla modalità successiva (cicla).
  const cycleSort = () => {
    const i = SORT_OPTIONS.findIndex(o => o.key === sortBy);
    setSortBy(SORT_OPTIONS[(i + 1) % SORT_OPTIONS.length].key);
  };
  const SortControl = (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.9rem" }}>
      <button type="button" onClick={cycleSort} aria-label="Cambia ordinamento dei capitoli"
        className="trm-sort" style={{ background: card, border: `1.5px solid ${bord}` }}>
        <ArrowDownUp size={16} style={{ color: vio, flexShrink: 0 }} />
        <span className="trm-sort-txt" style={{ color: textMain }}>
          {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
        </span>
      </button>
    </div>
  );

  // ── Griglia di tile quadrate: "Tutti i capitoli" (largo) + una tile per capitolo ──
  // Stile "Italia kit": logo verde, testo nero, hover che colora, click che accende.
  const ChapterList = (
    <div>
      {SortControl}
      {/* Tile larga "Tutti i capitoli" (occupa tutta la riga) */}
      <button
        type="button"
        onClick={selectAll}
        data-tour="chapters"
        className={`trm-tile trm-tile-all trm-vio${allMode ? " is-on" : ""}`}
      >
        <span className="trm-tile-all-ic"><BookOpen size={30} /></span>
        <span className="trm-tile-all-title">Tutti i capitoli</span>
        <span className="trm-tile-check"><svg width="14" height="14" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
      </button>

      {/* Griglia capitoli */}
      <div className="trm-grid">
        {orderedChapters.map((c) => {
          const { seen, total, pct: cov } = chapterCoverageFrom(progress, c.id);
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleChapter(c.id)}
              onMouseMove={handleTileMove}
              className={`trm-tile${on ? " is-on" : ""}${cov >= 100 ? " is-done" : ""}`}
              title={c.autore ? `${c.argomento} · ${c.autore}` : c.argomento}
            >
              {/* immagine/segnaposto grafico al ~30% dietro al titolo (icona gigante) */}
              <span className="trm-tile-bg" aria-hidden>{iconForChapter(c.id, 130)}</span>
              <span className="trm-tile-spot" aria-hidden />
              <span className="trm-tile-glow" aria-hidden />
              <span className="trm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
              <span className="trm-tile-ring">{progressRing(seen, total, cov)}</span>
              <span className="trm-tile-mark" aria-hidden>{iconForChapter(c.id)}</span>
              <span className="trm-tile-titlebox">
                {titoloInRighe(c.title).map((riga, i) => (
                  <span className="trm-word" key={i}>{riga}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Tipi di domanda: tre tasti grossi con ICONA + conteggio domande per tipo ──
  const TypeList = (
    <div>
      <p className="trm-section-label" style={{ color: vio }}>
        <span className="trm-step" style={{ background: vio }}>2</span>Tipi di domanda
      </p>
      <div className="trm-types-row">
        {TYPE_DEFS.map(t => {
          const on = types.has(t.id);
          const n = countByType[t.id];
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleType(t.id)}
              onMouseMove={handleTileMove}
              className={`trm-typebtn trm-vio${on ? " is-on" : ""}`}
              title={t.desc}
              disabled={n === 0}
            >
              <span className="trm-tile-spot" aria-hidden />
              <span className="trm-typebtn-ic"><Icon size={26} strokeWidth={2.2} /></span>
              <span className="trm-typebtn-label">{t.label}</span>
              <span className="trm-typebtn-count">{n} <span className="trm-typebtn-count-u">dom.</span></span>
              <span className="trm-typebtn-check" aria-hidden>
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: "0.78rem", color: availableCount === 0 ? "#c0392b" : lbl, margin: "0.5rem 0 0 0.2rem", fontWeight: availableCount === 0 ? 800 : 600 }}>
        {allTypes ? "Tutti i tipi" : `${types.size} tipi`}
        {" · "}
        {availableCount === 0 ? "nessuna domanda con questi filtri" : `${availableCount} domande nel quiz`}
      </p>
    </div>
  );

  const PlayBtn = (
    <button
      type="button"
      onClick={() => { if (availableCount > 0) onPlay([...selected], [...types]); }}
      disabled={availableCount === 0}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.95rem 1.3rem",
        background: "linear-gradient(100deg, #9d8fff 0%, #7c6cff 45%, #5b4bd6 100%)", color: "#fff",
        border: "none", borderRadius: "14px",
        fontSize: "0.98rem", fontWeight: 800,
        cursor: availableCount === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
        boxShadow: "0 10px 30px rgba(124,108,255,0.45)",
        transition: "filter 0.12s, transform 0.12s",
        width: "100%", opacity: availableCount === 0 ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (availableCount > 0) { e.currentTarget.style.filter = "brightness(0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <span className="trm-step" style={{ background: "rgba(255,255,255,0.22)", color: "#fff", width: 26, height: 26, fontSize: "0.9rem" }}>3</span>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>Gioca</div>
          <div style={{ fontSize: "0.74rem", opacity: 0.9, marginTop: "0.1rem" }}>{selectedName} · {availableCount} domande</div>
        </div>
      </div>
      <ChevronRight size={22} />
    </button>
  );

  // Azioni secondarie (dopo Gioca): su desktop vanno nel pannello viola a sinistra,
  // su mobile dentro il drawer "Altro". Stesso markup, riusato.
  const SecondaryActions = () => (
    <>
      {LbBtn}
      {PagellaBtn}
      {/* "Come si gioca": tasto PIENO viola, grosso e spesso come gli altri CTA
          (prima era un ghost smorto). È l'invito a scoprire il tour. */}
      <button type="button" onClick={onTutorial} data-tour="tutorial" className="trm-tut-btn trm-tut-cta">
        <BookOpen size={19} strokeWidth={2.4} /> Come si gioca
      </button>
      {BackBtn}
    </>
  );

  const LbBtn = (
    <button type="button" onClick={onLeaderboard} data-tour="leaderboard" className="trm-tut-btn trm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
      <ListOrdered size={18} /> Classifica live
    </button>
  );

  const PagellaBtn = (
    <button type="button" onClick={onPagella} data-tour="pagella" className="trm-tut-btn trm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
      <GraduationCap size={18} /> La mia pagella
    </button>
  );

  // Icona-tasto giocatore: pastiglia con avatar (punteggio dentro) + nome.
  // Sta FUORI dai bottoni d'azione. Tap = cambia nome.
  const PlayerIcon = (onDark: boolean) => nick ? (
    <button type="button" onClick={onChangeNick} data-tour="player" className={`trm-player${onDark ? " on-dark" : ""}`} title={`${nick} · tocca per cambiare`}>
      <span className="trm-player-badge">{playerScore === null ? "…" : fmtScore(playerScore)}</span>
      <span className="trm-player-name">{nick}</span>
    </button>
  ) : null;

  const BackBtn = (
    <Link to="/#progetti" className="trm-back-btn trm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
      <ArrowLeft size={18} /> Torna ai progetti
    </Link>
  );

  // Copertina del libro di riferimento, sotto il titolo. Se l'immagine manca,
  // onError la nasconde (niente icona rotta).
  const BookCover = (
    <a
      className="trm-book"
      href="https://www.amazon.it/Progettazione-Costruzioni-Impianti-Vall%C3%AC-Baraldi/dp/8836007562"
      target="_blank" rel="noopener noreferrer"
      title="Progettazione, Costruzioni e Impianti 3 — Baraldi, Zanghì (Hoepli)"
    >
      <img
        src="/trivia-libro.jpg"
        alt="Progettazione, Costruzioni e Impianti 3 — Hoepli"
        loading="lazy"
        onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
      />
    </a>
  );

  const StatsCard = (forceDark: boolean) => {
    const c = forceDark ? "#fff" : val;
    const l = forceDark ? "rgba(255,255,255,0.6)" : lbl;
    const ic = forceDark ? "#c4a5ff" : vio;   // stats: accento viola
    return (
      <div className={`trm-stats-card${forceDark ? " trm-stats-dark" : ""}`} style={forceDark ? undefined : { background: card, border: `1px solid ${vBord}` }}>
        <div className="trm-stat"><GraduationCap size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{bestGrade}</span><span className="trm-stat-lbl" style={{ color: l }}>Miglior voto</span></div>
        <div className="trm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="trm-stat"><Flame size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{bestStreak}</span><span className="trm-stat-lbl" style={{ color: l }}>Streak record</span></div>
        <div className="trm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="trm-stat"><Trophy size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{coverage}%</span><span className="trm-stat-lbl" style={{ color: l }}>Db esplorato</span></div>
      </div>
    );
  };

  return (
    <div className="trm-root" ref={gridWrapRef}>
      {/* ════════ MOBILE ════════ */}
      <div className="trm-mobile">
        <div className="trm-hero">
          <div className="trm-logo-wrap"><BrainCircuit size={44} /></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
            <p className="trm-tagline">Storia dell'Architettura · rispondi e scala la classifica</p>
          </div>
          {BookCover}
          <p className="trm-kicker">Versione {TRIVIA_VERSION}</p>
        </div>
        <div className="trm-body">
          {StatsCard(false)}
          <p className="trm-section-label" style={{ color: icon }}>
            <span className="trm-step" style={{ background: icon }}>1</span>Scegli i capitoli
          </p>
          {ChapterList}
          {TypeList}
          {PlayBtn}
          {/* Tutto ciò che viene dopo Gioca è nel drawer "Altro" */}
          <button type="button" className="trm-more-toggle trm-vio-btn" onClick={() => setMoreOpen(true)} style={{ color: vio, border: `1.5px solid ${vBord}` }}>
            <MoreHorizontal size={18} /> Altro
          </button>
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>Più rispondi giusto e veloce, più punti · classifica live</p>
        </div>

        {/* Drawer "Altro": azioni secondarie, fuori dalla sequenza di gioco */}
        {moreOpen && (
          <div className="trm-drawer-back" onClick={() => setMoreOpen(false)}>
            <div className="trm-drawer" onClick={e => e.stopPropagation()}>
              <div className="trm-drawer-head">
                {PlayerIcon(true) ?? <span>Altro</span>}
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Chiudi" className="trm-drawer-x"><X size={20} /></button>
              </div>
              <div className="trm-actions trm-actions-dark">{SecondaryActions()}</div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ DESKTOP — tre colonne ════════
          SINISTRA (vetrina scura): logo, titolo, sottotitolo, LIBRO grande, DATI grandi.
          CENTRO (chiaro): la sequenza di gioco 1-2-3 (capitoli, tipi, Gioca).
          DESTRA (rail scuro speculare): funzioni (classifica, pagella, tutorial) +
          giocatore con punteggio. Così il login non sposta più nulla del resto. */}
      <div className="trm-desktop">
        {/* ── Vetrina sinistra ── */}
        <div className="trm-desktop-left">
          <div className="trm-logo-wrap"><BrainCircuit size={54} /></div>
          <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
          <p className="trm-tagline">Storia dell'Architettura</p>
          {BookCover}
          {StatsCard(true)}
          <p className="trm-kicker" style={{ position: "static", opacity: 1 }}>Versione {TRIVIA_VERSION} · gioco gratuito</p>
        </div>

        {/* ── Centro: il gioco ── */}
        <div className="trm-desktop-center" style={{ background: bg }}>
          <p className="trm-section-label" style={{ color: icon }}>
            <span className="trm-step" style={{ background: icon }}>1</span>Scegli i capitoli
          </p>
          {ChapterList}
          {TypeList}
          {PlayBtn}
        </div>

        {/* ── Rail destro: funzioni + giocatore (speculare alla vetrina) ── */}
        <div className="trm-desktop-right">
          <p className="trm-rail-label">Funzioni</p>
          <div className="trm-actions trm-actions-dark">{SecondaryActions()}</div>
          <div className="trm-rail-spacer" />
          <p className="trm-rail-label">Il tuo profilo</p>
          <div className="trm-player-slot">{PlayerIcon(true)}</div>
        </div>
      </div>

      <style>{`
        .trm-root {
          /* Palette: VERDE = capitoli (il contenuto), VIOLA = tutto il resto del menù */
          --pv:#7c3aed; --pv2:#6024c4; --pv3:#9b5cf6; --pv-soft:${dark ? "rgba(155,92,246,0.16)" : "rgba(124,58,237,0.10)"};
          --pv-ink:${dark ? "#c4a5ff" : "#6d28d9"};
          --gv:#2F7D4A; --gv3:#3a9e5f;
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: trm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes trm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .trm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .trm-desktop { display:none; }

        .trm-hero {
          background: linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        /* alone viola + alone verde negli angoli dell'hero (vibrante, "note di viola") */
        .trm-hero::before, .trm-hero::after {
          content:""; position:absolute; width:60%; height:70%; border-radius:50%;
          filter:blur(50px); opacity:0.55; pointer-events:none; z-index:0;
        }
        .trm-hero::before { background:#8b7bff; top:-25%; left:-15%; }
        .trm-hero::after  { background:#6d4dff; bottom:-30%; right:-15%; opacity:0.4; }
        .trm-hero > * { position:relative; z-index:1; }
        .trm-logo-wrap {
          background:#fff; color:#6d4dff; border-radius:18px; padding:14px;
          box-shadow:0 8px 32px rgba(91,33,182,0.4); display:inline-flex;
        }
        .trm-title {
          font-size:clamp(2.4rem,10vw,3.8rem); font-weight:900;
          letter-spacing:0.28em; margin:0; line-height:1; color:#fff;
        }
        .trm-accent { color:#b794ff; }
        .trm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0; font-weight:500; text-align:center; }
        .trm-book {
          display:block; width:104px; flex-shrink:0; border-radius:8px; overflow:hidden;
          box-shadow:0 8px 26px rgba(0,0,0,0.35); line-height:0;
          transition:transform .18s, box-shadow .18s;
        }
        .trm-book:hover { transform:translateY(-2px) scale(1.02); box-shadow:0 12px 34px rgba(0,0,0,0.45); }
        .trm-book img { width:100%; height:auto; display:block; }
        .trm-desktop-left .trm-book { width:140px; }
        .trm-kicker {
          position:absolute; bottom:0.7rem; left:1.4rem;
          font-size:0.63rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.16em; color:rgba(255,255,255,0.28); margin:0;
        }

        .trm-body { padding:1.1rem 1.1rem 2rem; display:flex; flex-direction:column; gap:0.9rem; }

        .trm-stats-card {
          display:flex; align-items:stretch;
          border-radius:13px; padding:0.85rem 1.1rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .trm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); }
        .trm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; }
        .trm-stat-val { font-size:1.4rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .trm-stat-lbl { font-size:0.58rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
        .trm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        .trm-section-label {
          font-size:0.72rem; font-weight:800; text-transform:uppercase;
          letter-spacing:0.1em; margin:0 0 0.4rem 0.1rem;
          display:flex; align-items:center; gap:0.5rem;
        }
        /* tasto "Ordina": un tap cambia modalità (cicla) */
        .trm-sort {
          display:inline-flex; align-items:center; gap:0.5rem;
          padding:0.55rem 0.95rem; border-radius:12px; cursor:pointer;
          font-family:inherit; box-shadow:0 2px 8px rgba(0,0,0,0.05);
          transition:transform .12s, box-shadow .15s;
        }
        .trm-sort:hover { transform:translateY(-1px); box-shadow:0 5px 14px rgba(0,0,0,0.08); }
        .trm-sort:active { transform:scale(0.97); }
        .trm-sort-txt { font-size:0.9rem; font-weight:800; white-space:nowrap; }

        /* pallino numerato della sequenza (1 capitoli, 2 tipi, 3 gioca) */
        .trm-step {
          display:inline-flex; align-items:center; justify-content:center;
          width:20px; height:20px; border-radius:999px; flex-shrink:0;
          color:#fff; font-size:0.72rem; font-weight:900; line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        }

        /* ─── Tipi di domanda: tasti grossi con icona + conteggio (importanti!) ─── */
        .trm-types-row { display:grid; grid-template-columns:repeat(3,1fr); gap:0.55rem; margin-top:0.4rem; }
        .trm-typebtn {
          --gv:#7c6cff; --gv2:#5b4bd6; --gv3:#9d8fff;
          --spot:${dark ? "rgba(139,123,255,0.30)" : "rgba(109,77,255,0.24)"};
          position:relative; isolation:isolate; overflow:hidden;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:0.3rem; padding:0.85rem 0.5rem 0.7rem;
          min-height:108px; border:1.5px solid ${vBord}; border-radius:16px;
          background:${dark ? "rgba(139,123,255,0.08)" : "rgba(109,77,255,0.05)"};
          color:${textMain}; cursor:pointer; font-family:inherit;
          transition:transform .18s, border-color .18s, box-shadow .18s, background .2s;
        }
        .trm-typebtn:disabled { opacity:0.4; cursor:not-allowed; }
        @media (hover:hover) {
          .trm-typebtn:not(:disabled):hover { transform:translateY(-3px); border-color:var(--gv3); box-shadow:0 10px 24px ${dark ? "rgba(0,0,0,0.5)" : "rgba(124,58,237,0.22)"}; }
        }
        .trm-typebtn:active { transform:translateY(-1px) scale(0.98); }
        .trm-typebtn.is-on {
          background:linear-gradient(155deg, var(--gv3) 0%, var(--gv) 55%, var(--gv2) 100%);
          border-color:var(--gv3); color:#fff;
          box-shadow:0 0 0 2px var(--gv3), 0 10px 26px ${dark ? "rgba(0,0,0,0.55)" : "rgba(91,33,182,0.38)"};
        }
        .trm-typebtn-ic { color:var(--gv); display:flex; transition:color .2s, transform .2s; }
        .trm-typebtn.is-on .trm-typebtn-ic { color:#fff; transform:scale(1.08); }
        .trm-typebtn-label { font-size:0.92rem; font-weight:800; line-height:1.1; text-align:center; }
        .trm-typebtn-count { font-size:0.78rem; font-weight:800; opacity:0.62; font-variant-numeric:tabular-nums; }
        .trm-typebtn.is-on .trm-typebtn-count { opacity:0.92; }
        .trm-typebtn-count-u { font-weight:600; opacity:0.8; }
        .trm-typebtn-check {
          position:absolute; top:7px; right:7px; width:18px; height:18px; border-radius:6px;
          background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center;
          transform:scale(0); opacity:0; transition:transform .22s cubic-bezier(.2,.9,.3,1.6), opacity .18s;
        }
        .trm-typebtn.is-on .trm-typebtn-check { transform:scale(1); opacity:1; }

        /* azioni secondarie raggruppate (drawer mobile / pannello desktop) */
        .trm-actions { display:flex; flex-direction:column; gap:0.55rem; width:100%; }
        .trm-actions-dark .trm-tut-btn, .trm-actions-dark .trm-back-btn {
          background:rgba(255,255,255,0.10); color:#fff !important; border:1px solid rgba(255,255,255,0.16) !important;
        }
        .trm-actions-dark .trm-tut-btn:hover, .trm-actions-dark .trm-back-btn:hover { background:rgba(255,255,255,0.18); }
        .trm-actions-dark .trm-tut-btn svg, .trm-actions-dark .trm-back-btn svg { color:#c4a5ff; }
        .trm-actions-dark .trm-nick-chip { color:rgba(255,255,255,0.85) !important; border-color:rgba(255,255,255,0.22) !important; }
        .trm-actions-dark .trm-nick-chip b { color:#fff !important; }

        /* toggle "Altro" (mobile) */
        .trm-more-toggle {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; width:100%;
          padding:0.85rem 1rem; border-radius:13px; font-size:0.95rem; font-weight:800;
          background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          cursor:pointer; font-family:inherit; transition:background .15s;
        }
        /* drawer mobile */
        .trm-drawer-back { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,0.5); display:flex; align-items:flex-end; animation:trm-fade .2s ease; }
        @keyframes trm-fade { from{opacity:0;} to{opacity:1;} }
        .trm-drawer {
          width:100%; background:linear-gradient(160deg,#15101f 0%,#1a1430 60%,#0b0f14 130%);
          border-radius:20px 20px 0 0; padding:1.1rem 1.1rem calc(1.6rem + env(safe-area-inset-bottom));
          box-shadow:0 -10px 40px rgba(0,0,0,0.4); animation:trm-up .25s cubic-bezier(.2,.8,.3,1);
          max-height:88dvh; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
        }
        @keyframes trm-up { from{transform:translateY(100%);} to{transform:none;} }
        .trm-drawer-head { display:flex; align-items:center; justify-content:space-between; color:#fff; font-weight:800; font-size:1.05rem; margin-bottom:0.9rem; padding:0 0.2rem; }
        .trm-drawer-x { background:rgba(255,255,255,0.12); border:none; color:#fff; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .trm-tut-btn, .trm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem;
          width:100%;
          padding:0.95rem 1rem; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          border-radius:13px; font-size:1rem; font-weight:800;
          cursor:pointer; font-family:inherit; transition:filter .15s, transform .12s, background .15s;
          text-decoration:none;
        }
        .trm-vio-btn svg { width:18px; height:18px; }
        .trm-tut-btn:hover, .trm-back-btn:hover {
          background:${dark ? "rgba(155,92,246,0.18)" : "rgba(124,58,237,0.11)"};
          transform:translateY(-1px);
        }
        /* "Come si gioca": CTA PIENO viola — grosso, spesso, con accento e un
           leggero respiro luminoso per invitare a scoprire il tour. */
        .trm-tut-cta {
          background:linear-gradient(100deg,#9d8fff 0%,#7c6cff 55%,#5b4bd6 130%) !important;
          color:#fff !important; border:none !important;
          font-size:1.05rem !important; font-weight:900 !important; letter-spacing:0.01em;
          box-shadow:0 6px 22px rgba(91,33,182,0.45);
          position:relative; overflow:hidden;
          animation:trm-cta-breathe 2.8s ease-in-out infinite;
        }
        .trm-tut-cta svg { color:#fff; width:19px; height:19px; }
        .trm-tut-cta::after {
          content:""; position:absolute; top:0; left:-60%; width:45%; height:100%;
          background:linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent);
          transform:skewX(-18deg); animation:trm-cta-shine 3.4s ease-in-out infinite;
        }
        .trm-tut-cta:hover { transform:translateY(-2px); filter:brightness(1.07); box-shadow:0 10px 30px rgba(124,108,255,0.55); background:linear-gradient(100deg,#9d8fff 0%,#7c6cff 55%,#5b4bd6 130%) !important; }
        @keyframes trm-cta-breathe { 0%,100%{box-shadow:0 6px 22px rgba(91,33,182,0.4);} 50%{box-shadow:0 8px 30px rgba(124,58,237,0.65);} }
        @keyframes trm-cta-shine { 0%,55%{left:-60%;} 100%{left:130%;} }
        @media (prefers-reduced-motion: reduce) {
          .trm-tut-cta, .trm-tut-cta::after { animation:none; }
        }
        /* icona-tasto giocatore: pastiglia con badge punteggio + nome (fuori dai bottoni) */
        .trm-player-slot { display:flex; justify-content:center; }
        .trm-player {
          display:inline-flex; align-items:center; gap:0.6rem;
          padding:0.4rem 0.95rem 0.4rem 0.4rem; border-radius:999px; cursor:pointer;
          border:1.5px solid ${vBord}; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          font-family:inherit; transition:transform .12s, background .15s, box-shadow .15s;
        }
        .trm-player:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(124,58,237,0.25); }
        .trm-player:active { transform:scale(0.97); }
        /* badge tondo "avatar" col punteggio dentro */
        .trm-player-badge {
          display:inline-flex; align-items:center; justify-content:center;
          min-width:38px; height:38px; padding:0 0.4rem; border-radius:999px;
          background:linear-gradient(140deg,#9d8fff,#5b4bd6); color:#fff;
          font-size:0.92rem; font-weight:900; line-height:1; letter-spacing:-0.02em;
          font-variant-numeric:tabular-nums; box-shadow:0 3px 10px rgba(91,33,182,0.4);
        }
        .trm-player-name {
          font-size:0.92rem; font-weight:800; color:${vio};
          letter-spacing:0.01em; padding-right:0.2rem;
        }
        /* su pannello/drawer scuro */
        .trm-player.on-dark { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.08); }
        .trm-player.on-dark .trm-player-name { color:#fff; }

        /* ═══════ Tile capitoli stile "booking card": titolo grande che riempie la card,
                   fondo a gradiente verde, logo a filigrana, sfumature + animazioni ═══════ */
        .trm-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:0.55rem;
          margin-top:0.5rem;
        }
        .trm-grid-types { grid-template-columns:repeat(3,1fr); }

        .trm-tile {
          --gv:#7c6cff; --gv2:#5b4bd6; --gv3:#9d8fff;
          position:relative; isolation:isolate;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          aspect-ratio:1/1; min-height:0;
          padding:2.3rem 0.7rem 0.7rem;
          border:1px solid ${bord};
          border-radius:18px; cursor:pointer; font-family:inherit; text-align:left;
          overflow:hidden;
          background:
            radial-gradient(120% 90% at 100% 0%, ${dark ? "rgba(139,123,255,0.16)" : "rgba(109,77,255,0.08)"} 0%, transparent 55%),
            linear-gradient(160deg, ${card} 0%, ${dark ? "rgba(139,123,255,0.05)" : "#f4f2fb"} 100%);
          box-shadow:0 2px 6px rgba(0,0,0,0.05);
          transition:transform .12s cubic-bezier(.2,.7,.3,1.25), border-color .1s, box-shadow .12s, background .12s;
        }

        /* CAPITOLO COMPLETATO (25/25): tile VIOLA anche da non selezionata,
           così si distingue a colpo d'occhio. Ridefinisce le var colore + il fondo. */
        .trm-tile.is-done {
          --gv:#34d399; --gv2:#0f9d68; --gv3:#5fe0b0;
          --spot:${dark ? "rgba(52,211,153,0.30)" : "rgba(16,163,74,0.24)"};
          border-color:${dark ? "rgba(52,211,153,0.32)" : "rgba(16,163,74,0.26)"};
          background:
            radial-gradient(120% 90% at 100% 0%, ${dark ? "rgba(52,211,153,0.16)" : "rgba(16,163,74,0.10)"} 0%, transparent 55%),
            linear-gradient(160deg, ${card} 0%, ${dark ? "rgba(52,211,153,0.06)" : "#eefaf3"} 100%);
        }
        .trm-tile.is-done .trm-tile-mark,
        .trm-tile.is-done .trm-tile-bg { color:var(--gv); }

        /* Variante VIOLA (.trm-vio): "Tutti i capitoli" + tipi di domanda.
           Ridefinisce solo le variabili colore → riusa tutta l'estetica delle tile. */
        .trm-vio {
          --gv:#7c6cff; --gv2:#5b4bd6; --gv3:#9d8fff;
        }

        /* gradiente verde pieno che "sale" allo hover / quando acceso */
        .trm-tile::before {
          content:""; position:absolute; inset:0; z-index:-2;
          background:linear-gradient(155deg, var(--gv3) 0%, var(--gv) 45%, var(--gv2) 100%);
          opacity:0; transition:opacity .14s ease;
        }
        /* "torcia" del cursore: alone verde sfumato centrato su --mx/--my (vedi
           handleTileMove). Resta sotto al contenuto (z-index:-1) e sopra al fondo. */
        .trm-tile-spot {
          position:absolute; inset:0; z-index:-1; pointer-events:none;
          border-radius:inherit; opacity:0; transition:opacity .25s ease;
          background:radial-gradient(circle 70px at var(--mx,50%) var(--my,50%),
            var(--spot, ${dark ? "rgba(139,123,255,0.30)" : "rgba(109,77,255,0.26)"}) 0%, transparent 70%);
        }
        .trm-vio { --spot:${dark ? "rgba(139,123,255,0.30)" : "rgba(109,77,255,0.26)"}; }
        @media (hover: hover) {
          .trm-tile:hover .trm-tile-spot { opacity:1; }
        }

        /* alone luminoso animato (shimmer) che scorre allo hover */
        .trm-tile-glow {
          position:absolute; inset:-40%; z-index:-1; pointer-events:none;
          background:radial-gradient(closest-side, rgba(255,255,255,0.35), transparent 70%);
          opacity:0; transform:translate(-30%,30%) scale(0.6);
          transition:opacity .14s, transform .25s ease;
        }

        /* Hover effetti solo su dispositivi con puntatore reale (mouse):
           su mobile lo scroll-touch lasciava "appiccicato" l'hover, accendendo
           le tile mentre si scorre. Ora da telefono conta solo il click (is-on). */
        @media (hover: hover) {
          .trm-tile:hover {
            transform:translateY(-4px);
            border-color:var(--gv);
            box-shadow:0 14px 30px ${dark ? "rgba(0,0,0,0.5)" : "rgba(109,77,255,0.26)"};
          }
          .trm-tile:hover::before { opacity:1; }
          .trm-tile:hover .trm-tile-glow { opacity:1; transform:translate(0,0) scale(1); }
          .trm-tile:hover .trm-tile-title { color:#fff; }
          .trm-tile:hover .trm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }
          .trm-tile:hover .trm-tile-title { text-shadow:0 1px 8px rgba(0,0,0,0.25); }
          .trm-tile:hover .trm-tile-ring { filter:brightness(0) invert(1) opacity(0.92); }
        }
        /* Touch: tap fugace mentre scorri = solo bordo verde, nessun "accendi". */
        .trm-tile:active { transform:translateY(-1px) scale(0.97); border-color:var(--gv); }

        /* SELEZIONATO (click reale): la card diventa verde pieno, testo bianco */
        .trm-tile.is-on::before { opacity:1; }
        .trm-tile.is-on {
          border-color:var(--gv3);
          box-shadow:0 0 0 2px var(--gv3), 0 14px 30px ${dark ? "rgba(0,0,0,0.55)" : "rgba(109,77,255,0.30)"};
        }
        .trm-tile.is-on .trm-tile-title { color:#fff; }
        .trm-tile.is-on .trm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }

        /* logo a filigrana grande nell'angolo alto-sinistra */
        .trm-tile-mark {
          position:absolute; top:8px; left:9px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          color:var(--gv); opacity:0.55;
          transition:transform .15s cubic-bezier(.2,.7,.3,1.5), color .12s, opacity .12s;
        }
        .trm-tile-mark svg { width:28px; height:28px; }

        /* "immagine" di sfondo (segnaposto grafico): icona gigante del capitolo al
           ~30%, in basso a destra, dietro il titolo. Su tile accesa diventa bianca. */
        .trm-tile-bg {
          position:absolute; right:-14px; bottom:-18px; z-index:-1; pointer-events:none;
          color:var(--gv); opacity:0.16;
          transition:opacity .14s, color .12s, transform .15s;
        }
        .trm-tile-bg svg { width:130px; height:130px; }
        .trm-tile.is-on .trm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
        @media (hover: hover) {
          .trm-tile:hover .trm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
        }

        /* TITOLO protagonista stile "Bolt": riempie tutta l'area disponibile.
           .trm-tile-titlebox è l'area (flex:1) che il JS misura; .trm-tile-title è
           il testo, ingrandito via JS (fit-to-box) fino a riempire larghezza+altezza. */
        .trm-tile-titlebox {
          position:relative; z-index:1; flex:1 1 auto; width:100%;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          min-height:0; overflow:hidden; gap:0.02em;
        }
        /* ogni PAROLA: blocco a riga propria, mai mandata a capo (no troncamento),
           font-size impostato dal JS per riempire la larghezza in modo indipendente */
        .trm-word {
          display:block; white-space:nowrap;
          font-size:1.4rem; /* fallback prima del fit JS */
          font-weight:900; line-height:0.92;
          letter-spacing:-0.03em;
          color:${textMain};
          transition:color .12s;
          text-shadow:0 1px 0 rgba(255,255,255,0.04);
        }
        .trm-tile.is-on .trm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        @media (hover: hover) {
          .trm-tile:hover .trm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        }
        .trm-tile-title-type {
          position:relative; z-index:1;
          font-size:1.18rem; font-weight:800; line-height:1.15;
          letter-spacing:-0.01em; color:${textMain};
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
          overflow:hidden; transition:color .12s;
        }

        /* badge progressi "N/T": angolo in alto a destra. Numero grande = iconcina. */
        .trm-tile-ring { position:absolute; top:6px; right:6px; z-index:2; }
        .trm-progbadge {
          display:inline-flex; align-items:baseline; gap:0.02em;
          padding:0.12rem 0.42rem; border-radius:999px;
          border:1.5px solid currentColor;
          background:rgba(255,255,255,0.92);
          line-height:1; font-variant-numeric:tabular-nums;
          box-shadow:0 2px 7px rgba(0,0,0,0.16);
          backdrop-filter:blur(2px);
        }
        .trm-progbadge-seen { font-size:0.92rem; font-weight:900; letter-spacing:-0.03em; }
        .trm-progbadge-tot  { font-size:0.6rem;  font-weight:800; opacity:0.72; }
        /* su tile accesa/hover (fondo verde/viola pieno): badge bianco traslucido */
        .trm-tile.is-on .trm-progbadge {
          color:#fff !important; border-color:rgba(255,255,255,0.55) !important;
          background:rgba(255,255,255,0.18) !important; box-shadow:none;
        }
        @media (hover: hover) {
          .trm-tile:hover .trm-progbadge {
            color:#fff !important; border-color:rgba(255,255,255,0.55) !important;
            background:rgba(255,255,255,0.18) !important; box-shadow:none;
          }
        }

        /* spunta "accesa": angolo basso-destra, pop elastico */
        .trm-tile-check {
          position:absolute; bottom:8px; right:8px; z-index:2;
          width:22px; height:22px; border-radius:8px;
          background:#fff; color:var(--gv);
          display:flex; align-items:center; justify-content:center;
          transform:scale(0) rotate(-30deg); opacity:0;
          transition:transform .26s cubic-bezier(.2,.9,.3,1.6), opacity .2s;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
        }
        .trm-tile-check svg path { stroke:var(--gv); }
        .trm-tile.is-on .trm-tile-check,
        .trm-tile.is-done .trm-tile-check { transform:scale(1) rotate(0); opacity:1; }

        /* tile larga "Tutti i capitoli": gradiente verde pieno fisso (come hero card della foto) */
        .trm-tile-all {
          flex-direction:row; aspect-ratio:auto; align-items:center;
          justify-content:flex-start; text-align:left;
          gap:0.85rem; padding:1.25rem 1.2rem;
          width:100%; border:none;
          margin-bottom:1.1rem;   /* stacca dalla griglia capitoli sotto */
          background:linear-gradient(135deg, var(--gv3) 0%, var(--gv) 50%, var(--gv2) 100%);
          box-shadow:0 8px 22px ${dark ? "rgba(0,0,0,0.5)" : "rgba(91,33,182,0.34)"};
        }
        .trm-tile-all::before, .trm-tile-all .trm-tile-glow { display:none; }
        .trm-tile-all:hover { transform:translateY(-3px); box-shadow:0 16px 34px ${dark ? "rgba(0,0,0,0.6)" : "rgba(91,33,182,0.44)"}; }
        .trm-tile-all .trm-tile-check {
          position:static; transform:scale(0); width:24px; height:24px; border-radius:8px;
          background:rgba(255,255,255,0.22); color:#fff; box-shadow:none;
        }
        .trm-tile-all .trm-tile-check svg path { stroke:#fff; }
        .trm-tile-all.is-on .trm-tile-check { transform:scale(1); opacity:1; }
        .trm-tile-all-ic { color:#fff; display:flex; flex-shrink:0; transition:transform .25s; }
        .trm-tile-all:hover .trm-tile-all-ic { transform:scale(1.15) rotate(-6deg); }
        .trm-tile-all-title { font-size:1.35rem; font-weight:900; color:#fff; line-height:1.1; flex:1; letter-spacing:-0.01em; }

        /* tipo domanda: tile più basse, titolo centrato e BEN leggibile */
        .trm-grid-types .trm-tile {
          aspect-ratio:auto; min-height:90px;
          align-items:center; justify-content:center;
          padding:0.7rem 0.5rem;
        }
        .trm-grid-types .trm-tile .trm-tile-title-type {
          text-align:center; font-size:1rem; line-height:1.12; font-weight:800;
          -webkit-line-clamp:3; word-break:normal; hyphens:none;
        }
        @keyframes trm-pop { 0%{transform:scale(0.6);opacity:0;} 60%{transform:scale(1.08);} 100%{transform:scale(1);opacity:1;} }

        /* ════════ DESKTOP: tre colonne (vetrina | gioco | funzioni) ════════ */
        @media (min-width: 760px) {
          .trm-mobile  { display:none; }
          .trm-root { display:flex; align-items:stretch; justify-content:center; }
          .trm-desktop {
            display:flex; flex-direction:row; height:100%; overflow:hidden;
            max-width:100%; margin:0 auto; width:100%;
          }

          /* Fasce scure SINISTRA e DESTRA: stessa "pelle" speculare. */
          .trm-desktop-left, .trm-desktop-right {
            flex-shrink:0;
            background:linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
            display:flex; flex-direction:column; overflow:hidden; position:relative;
          }
          /* alone viola/verde diffuso in entrambe le fasce (vibrante) */
          .trm-desktop-left::before, .trm-desktop-right::before {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.4; pointer-events:none;
            background:#8b7bff; top:-10%; left:-20%;
          }
          .trm-desktop-left::after, .trm-desktop-right::after {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.3; pointer-events:none;
            background:#6d4dff; bottom:-12%; right:-20%;
          }
          .trm-desktop-left > *, .trm-desktop-right > * { position:relative; z-index:1; }

          /* SINISTRA = vetrina. Ora che azioni/giocatore sono a destra, c'è spazio:
             libro e statistiche più GRANDI e protagonisti. */
          .trm-desktop-left {
            width:330px;
            align-items:center; justify-content:center; gap:1.5rem; padding:2rem;
          }
          .trm-desktop-left .trm-logo-wrap { padding:16px; border-radius:22px; }
          .trm-desktop-left .trm-title { font-size:3.1rem; }
          .trm-desktop-left .trm-tagline { font-size:0.95rem; }
          .trm-desktop-left .trm-book { width:178px; }
          .trm-desktop-left .trm-stats-card { width:100%; padding:1.1rem 1.2rem; background:rgba(255,255,255,0.06); }
          .trm-desktop-left .trm-stat-val { font-size:1.9rem; }
          .trm-desktop-left .trm-stat-lbl { font-size:0.62rem; }
          .trm-desktop-left .trm-stat svg { width:24px; height:24px; }

          /* CENTRO = il gioco (la sequenza 1-2-3). */
          .trm-desktop-center {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem; overflow-y:auto;
          }
          .trm-desktop-center .trm-grid { grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); }
          .trm-desktop-center .trm-grid-types { grid-template-columns:repeat(3,1fr); }

          /* DESTRA = funzioni + profilo. Larghezza fissa: il login non sposta nulla. */
          .trm-desktop-right {
            width:280px;
            justify-content:flex-start; gap:0.7rem; padding:2rem 1.5rem;
          }
          .trm-desktop-right .trm-actions { gap:0.6rem; }
          .trm-rail-label {
            font-size:0.66rem; font-weight:800; text-transform:uppercase;
            letter-spacing:0.14em; color:rgba(255,255,255,0.45); margin:0 0 0.1rem 0.2rem;
          }
          .trm-rail-spacer { flex:1; min-height:1rem; }
          .trm-desktop-right .trm-player-slot { justify-content:stretch; }
          .trm-desktop-right .trm-player { width:100%; justify-content:flex-start; }
        }

        /* ─── Fasce scure: compatta quando lo schermo è basso, così logo→titolo→
           libro→stats (sx) e funzioni→profilo (dx) ci stanno senza tagli. ─── */
        @media (min-width:760px) and (max-height:860px) {
          .trm-desktop-left { gap:0.95rem; padding:1.5rem; }
          .trm-desktop-left .trm-logo-wrap { padding:12px; border-radius:18px; }
          .trm-desktop-left .trm-logo-wrap svg { width:44px; height:44px; }
          .trm-desktop-left .trm-title { font-size:2.5rem; letter-spacing:0.22em; }
          .trm-desktop-left .trm-tagline { font-size:0.82rem; }
          .trm-desktop-left .trm-book { width:140px; }
          .trm-desktop-left .trm-stats-card { padding:0.8rem 1rem; }
          .trm-desktop-left .trm-stat-val { font-size:1.5rem; }
          .trm-desktop-left .trm-kicker { display:none; }
          .trm-desktop-right { padding:1.5rem 1.4rem; gap:0.5rem; }
          .trm-desktop-right .trm-actions { gap:0.45rem; }
          .trm-desktop-right .trm-tut-btn, .trm-desktop-right .trm-back-btn { padding:0.7rem 1rem; font-size:0.92rem; }
        }
        /* Schermi molto bassi: stringi ancora un filo. */
        @media (min-width:760px) and (max-height:680px) {
          .trm-desktop-left { gap:0.65rem; padding:1.1rem 1.4rem; }
          .trm-desktop-left .trm-logo-wrap svg { width:36px; height:36px; }
          .trm-desktop-left .trm-title { font-size:2.1rem; }
          .trm-desktop-left .trm-book { width:108px; }
          .trm-desktop-left .trm-stat-val { font-size:1.3rem; }
          .trm-desktop-right .trm-tut-btn, .trm-desktop-right .trm-back-btn { padding:0.58rem 1rem; }
        }
      `}</style>
    </div>
  );
}

