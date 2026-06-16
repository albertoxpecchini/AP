import { useMemo, useState, useRef, useLayoutEffect } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, ListOrdered, GraduationCap, ArrowDownUp } from "lucide-react";
import { CHAPTERS, questionsForMany } from "./questions";
import { chapterCoveragePct, chapterCoverageCount } from "./coverage";
import { iconForChapter } from "./chapterIcons";
import type { QType } from "./parseTrivia";

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
const TYPE_DEFS: { id: QType; label: string; desc: string; color: string }[] = [
  { id: "multipla",   label: "Scelta multipla", desc: "Scegli l'opzione giusta", color: "#2F7D4A" },
  { id: "vero-falso", label: "Vero o Falso",    desc: "Vero oppure falso",       color: "#3a7bbf" },
  { id: "aperta",     label: "Completamento",   desc: "Scrivi tu la risposta",   color: "#b5651d" },
];

interface TriviaMenuProps {
  dark: boolean;
  bestStreak: number;
  bestGrade: string;        // es. "A−" o "—"
  coverage: number;         // % totale db visto
  nick?: string;
  onPlay: (chapters: ChapterSelection, types: TypeSelection) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
  onPagella: () => void;
  onChangeNick: () => void;
}

export default function TriviaMenu({
  dark, bestStreak, bestGrade, coverage, nick,
  onPlay, onTutorial, onLeaderboard, onPagella, onChangeNick,
}: TriviaMenuProps) {
  // Set di id capitoli selezionati. Vuoto = "Tutti i capitoli".
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Set di tipi domanda selezionati. Vuoto = "Tutti i tipi".
  const [types, setTypes] = useState<Set<QType>>(new Set());

  // ── Fit-to-box: ogni titolo dentro la tile viene ingrandito al massimo finché
  //    riempie il riquadro (stile "Bolt"). Un singolo font-size CSS non basta:
  //    titoli corti ("Torre Eiffel") e lunghi devono riempire entrambi. Qui per
  //    ogni .trm-tile-title cerco (binary search) il font-size più grande che ci
  //    sta in larghezza E altezza. Rigirato a ogni resize e cambio ordine. ──
  const gridWrapRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fitAll = () => {
      const root = gridWrapRef.current;
      if (!root) return;
      const titles = root.querySelectorAll<HTMLElement>(".trm-tile-titlebox .trm-tile-title");
      titles.forEach(el => {
        const box = el.parentElement;
        if (!box) return;
        // altezza disponibile = spazio dato al titolo (flex:1) nella tile
        const maxW = el.clientWidth;
        const maxH = box.clientHeight;
        if (!maxW || !maxH) return;
        let lo = 11, hi = 64, best = 11;
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2;
          el.style.fontSize = mid + "px";
          if (el.scrollHeight <= maxH && el.scrollWidth <= maxW) { best = mid; lo = mid; }
          else hi = mid;
        }
        el.style.fontSize = best + "px";
      });
    };
    fitAll();
    window.addEventListener("resize", fitAll);
    // i font possono caricare dopo il primo layout
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
        return arr.sort((a, b) => chapterCoveragePct(a.id) - chapterCoveragePct(b.id) || a.order - b.order);
      case "cronologico":
      default: return arr.sort((a, b) => a.order - b.order);
    }
  }, [sortBy]);

  const bg       = dark ? "#111916" : "#f4f6f5";
  const card     = dark ? "#1a2720" : "#ffffff";
  const bord     = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const val      = dark ? "#d4e8dc" : "#17271d";
  const lbl      = dark ? "#7ab893" : "#6b8070";
  const icon     = dark ? "#6fd08a" : "#2F7D4A";
  const note     = dark ? "#5a7a62" : "#8a9e91";
  const textMain = dark ? "#d4e8dc" : "#17271d";
  const textSub  = dark ? "#a4c4aa" : "#4a5c50";

  const totalQuestions = CHAPTERS.reduce((s, c) => s + c.questions.length, 0);
  // Domande disponibili nella selezione corrente (capitoli + tipi).
  const availableCount = questionsForMany([...selected], [...types]).length;
  // Colore principale: sempre verde (Italia kit).
  const selectedColor = "#2F7D4A";
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
          <ArrowLeft size={15} /> Torna ai progetti
        </Link>
      </div>
    );
  }

  // Cerchio progressi "N/T" a destra della riga capitolo, colorato a semaforo
  // (rosso → giallo → verde in base alla % esplorata). Anello SVG + numeri.
  const progressRing = (seen: number, total: number, pct: number) => {
    const col = "#2F7D4A";   // verde unico (Italia kit): niente più semaforo
    const R = 13, C = 2 * Math.PI * R;
    const track = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";
    return (
      <div style={{ position: "relative", width: 30, height: 30, flexShrink: 0 }} title={`${seen} / ${total} domande viste · ${pct}%`}>
        <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="15" cy="15" r={R} fill="none" stroke={track} strokeWidth="3" />
          <circle
            cx="15" cy="15" r={R} fill="none" stroke={col} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset .35s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", lineHeight: 1,
        }}>
          <span style={{ fontSize: "0.52rem", fontWeight: 900, color: col, fontVariantNumeric: "tabular-nums" }}>{seen}</span>
          <span style={{ fontSize: "0.4rem", fontWeight: 700, color: lbl }}>/{total}</span>
        </div>
      </div>
    );
  };

  // Tendina "Ordina": select nativa (accessibile, niente librerie).
  const SortControl = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "0.1rem" }}>
      <label style={{
        display: "inline-flex", alignItems: "center", gap: "0.35rem",
        fontSize: "0.72rem", fontWeight: 700, color: lbl,
        border: `1px solid ${bord}`, borderRadius: 999, padding: "0.2rem 0.5rem 0.2rem 0.7rem",
        background: card,
      }}>
        <ArrowDownUp size={13} style={{ color: icon }} />
        Ordina
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          aria-label="Ordina i capitoli"
          style={{
            border: "none", background: "transparent", color: textMain,
            fontFamily: "inherit", fontSize: "0.72rem", fontWeight: 800,
            cursor: "pointer", outline: "none", padding: "0.1rem 0.1rem",
          }}
        >
          {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </label>
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
        className={`trm-tile trm-tile-all${allMode ? " is-on" : ""}`}
      >
        <span className="trm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
        <span className="trm-tile-all-ic"><BookOpen size={22} /></span>
        <span className="trm-tile-all-txt">
          <span className="trm-tile-all-title">Tutti i capitoli</span>
          <span className="trm-tile-all-sub">Mix da tutti i {CHAPTERS.length} capitoli · {totalQuestions} domande</span>
        </span>
      </button>

      {/* Griglia capitoli */}
      <div className="trm-grid">
        {orderedChapters.map((c) => {
          const cov = chapterCoveragePct(c.id);
          const { seen, total } = chapterCoverageCount(c.id);
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
              <span className="trm-tile-spot" aria-hidden />
              <span className="trm-tile-glow" aria-hidden />
              <span className="trm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
              <span className="trm-tile-ring">{progressRing(seen, total, cov)}</span>
              <span className="trm-tile-mark" aria-hidden>{iconForChapter(c.id)}</span>
              <span className="trm-tile-titlebox"><span className="trm-tile-title">{c.title}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Tipi di domanda: tre tile verdi in riga (stesso linguaggio dei capitoli) ──
  const TypeList = (
    <div>
      <p className="trm-section-label" style={{ color: lbl }}>Tipi di domanda</p>
      <div className="trm-grid trm-grid-types">
        {TYPE_DEFS.map(t => {
          const on = types.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleType(t.id)}
              onMouseMove={handleTileMove}
              className={`trm-tile${on ? " is-on" : ""}`}
              title={t.desc}
            >
              <span className="trm-tile-spot" aria-hidden />
              <span className="trm-tile-glow" aria-hidden />
              <span className="trm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
              <span className="trm-tile-title trm-tile-title-type">{t.label}</span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: "0.72rem", color: availableCount === 0 ? "#c0392b" : lbl, margin: "0.4rem 0 0 0.2rem", fontWeight: availableCount === 0 ? 700 : 400 }}>
        {allTypes ? "Tutti i tipi (nessun filtro)" : `${types.size} tipi selezionati`}
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
        background: selectedColor, color: "#fff",
        border: "none", borderRadius: "14px",
        fontSize: "0.98rem", fontWeight: 800,
        cursor: availableCount === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
        boxShadow: `0 6px 24px ${selectedColor}55`,
        transition: "filter 0.12s, transform 0.12s",
        width: "100%", opacity: availableCount === 0 ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (availableCount > 0) { e.currentTarget.style.filter = "brightness(0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
    >
      <div>
        <div style={{ fontSize: "0.98rem", fontWeight: 800 }}>Gioca</div>
        <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: "0.1rem" }}>{selectedName} · {availableCount} domande</div>
      </div>
      <ChevronRight size={20} />
    </button>
  );

  const LbBtn = (
    <button type="button" onClick={onLeaderboard} className="trm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ListOrdered size={15} /> Classifica live
    </button>
  );

  const PagellaBtn = (
    <button type="button" onClick={onPagella} className="trm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <GraduationCap size={15} /> La mia pagella
    </button>
  );

  const NickChip = nick ? (
    <button type="button" onClick={onChangeNick} className="trm-nick-chip" style={{ color: lbl, border: `1px solid ${bord}` }}>
      Giochi come <b style={{ color: textMain }}>{nick}</b> · cambia
    </button>
  ) : null;

  const BackBtn = (
    <Link to="/#progetti" className="trm-back-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ArrowLeft size={15} /> Torna ai progetti
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
    const l = forceDark ? "rgba(255,255,255,0.55)" : lbl;
    const ic = forceDark ? "#6fd08a" : icon;
    return (
      <div className={`trm-stats-card${forceDark ? " trm-stats-dark" : ""}`} style={forceDark ? undefined : { background: card, border: `1px solid ${bord}` }}>
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
          <div className="trm-logo-wrap"><GraduationCap size={44} /></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
            <p className="trm-tagline">Storia dell'Architettura · rispondi e scala la classifica</p>
          </div>
          {BookCover}
          <p className="trm-kicker">Web Game · Quiz</p>
        </div>
        <div className="trm-body">
          {StatsCard(false)}
          <p className="trm-section-label" style={{ color: lbl }}>Scegli i capitoli</p>
          {ChapterList}
          {TypeList}
          {PlayBtn}
          {LbBtn}
          {PagellaBtn}
          <button type="button" onClick={onTutorial} className="trm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {NickChip}
          {BackBtn}
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>Più rispondi giusto e veloce, più punti · classifica live</p>
        </div>
      </div>

      {/* ════════ DESKTOP ════════ */}
      <div className="trm-desktop">
        <div className="trm-desktop-left">
          <div className="trm-logo-wrap"><GraduationCap size={54} /></div>
          <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
          <p className="trm-tagline">Storia dell'Architettura</p>
          {BookCover}
          {StatsCard(true)}
          <p className="trm-kicker" style={{ position: "static", marginTop: "auto", opacity: 1 }}>Web Game · Quiz</p>
        </div>
        <div className="trm-desktop-right" style={{ background: bg }}>
          <p className="trm-section-label" style={{ color: lbl }}>Scegli i capitoli</p>
          {ChapterList}
          {TypeList}
          {PlayBtn}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ flex: 1 }}>{LbBtn}</div>
            <div style={{ flex: 1 }}>{PagellaBtn}</div>
          </div>
          <button type="button" onClick={onTutorial} className="trm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {NickChip}
          {BackBtn}
        </div>
      </div>

      <style>{`
        .trm-root {
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: trm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes trm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .trm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .trm-desktop { display:none; }

        .trm-hero {
          background: linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .trm-logo-wrap {
          background:#fff; color:#1a5030; border-radius:18px; padding:14px;
          box-shadow:0 8px 32px rgba(0,0,0,0.28); display:inline-flex;
        }
        .trm-title {
          font-size:clamp(2.4rem,10vw,3.8rem); font-weight:900;
          letter-spacing:0.28em; margin:0; line-height:1; color:#fff;
        }
        .trm-accent { color:#6fd08a; }
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
          font-size:0.65rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.12em; margin:0 0 0.35rem 0.2rem;
        }
        .trm-tut-btn, .trm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.45rem;
          padding:0.7rem 1rem; background:transparent;
          border-radius:10px; font-size:0.87rem; font-weight:700;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          text-decoration:none;
        }
        .trm-tut-btn:hover, .trm-back-btn:hover { filter:brightness(0.85); }
        .trm-nick-chip {
          background:transparent; border-radius:999px;
          padding:0.45rem 0.9rem; font-size:0.76rem; font-weight:600;
          cursor:pointer; font-family:inherit; transition:filter 0.15s; align-self:center;
        }
        .trm-nick-chip:hover { filter:brightness(0.85); }

        /* ═══════ Tile capitoli stile "booking card": titolo grande che riempie la card,
                   fondo a gradiente verde, logo a filigrana, sfumature + animazioni ═══════ */
        .trm-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:0.55rem;
          margin-top:0.5rem;
        }
        .trm-grid-types { grid-template-columns:repeat(3,1fr); }

        .trm-tile {
          --gv:#2F7D4A; --gv2:#1f6b3c; --gv3:#3a9e5f;
          position:relative; isolation:isolate;
          container-type:size;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          aspect-ratio:1/1; min-height:0;
          padding:2.3rem 0.7rem 0.7rem;
          border:1px solid ${bord};
          border-radius:18px; cursor:pointer; font-family:inherit; text-align:left;
          overflow:hidden;
          background:
            radial-gradient(120% 90% at 100% 0%, ${dark ? "rgba(58,158,95,0.18)" : "rgba(58,158,95,0.10)"} 0%, transparent 55%),
            linear-gradient(160deg, ${card} 0%, ${dark ? "#16241c" : "#f3faf5"} 100%);
          box-shadow:0 2px 6px rgba(0,0,0,0.05);
          transition:transform .22s cubic-bezier(.2,.7,.3,1.25), border-color .22s, box-shadow .22s, background .25s;
        }

        /* gradiente verde pieno che "sale" allo hover / quando acceso */
        .trm-tile::before {
          content:""; position:absolute; inset:0; z-index:-2;
          background:linear-gradient(155deg, var(--gv3) 0%, var(--gv) 45%, var(--gv2) 100%);
          opacity:0; transition:opacity .28s ease;
        }
        /* "torcia" del cursore: alone verde sfumato centrato su --mx/--my (vedi
           handleTileMove). Resta sotto al contenuto (z-index:-1) e sopra al fondo. */
        .trm-tile-spot {
          position:absolute; inset:0; z-index:-1; pointer-events:none;
          border-radius:inherit; opacity:0; transition:opacity .25s ease;
          background:radial-gradient(circle 70px at var(--mx,50%) var(--my,50%),
            ${dark ? "rgba(111,224,166,0.30)" : "rgba(47,158,95,0.28)"} 0%, transparent 70%);
        }
        @media (hover: hover) {
          .trm-tile:hover .trm-tile-spot { opacity:1; }
        }

        /* alone luminoso animato (shimmer) che scorre allo hover */
        .trm-tile-glow {
          position:absolute; inset:-40%; z-index:-1; pointer-events:none;
          background:radial-gradient(closest-side, rgba(255,255,255,0.35), transparent 70%);
          opacity:0; transform:translate(-30%,30%) scale(0.6);
          transition:opacity .3s, transform .5s ease;
        }

        /* Hover effetti solo su dispositivi con puntatore reale (mouse):
           su mobile lo scroll-touch lasciava "appiccicato" l'hover, accendendo
           le tile mentre si scorre. Ora da telefono conta solo il click (is-on). */
        @media (hover: hover) {
          .trm-tile:hover {
            transform:translateY(-4px);
            border-color:var(--gv);
            box-shadow:0 14px 30px ${dark ? "rgba(0,0,0,0.5)" : "rgba(31,107,60,0.30)"};
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
          box-shadow:0 0 0 2px var(--gv3), 0 14px 30px ${dark ? "rgba(0,0,0,0.55)" : "rgba(31,107,60,0.35)"};
        }
        .trm-tile.is-on .trm-tile-title { color:#fff; }
        .trm-tile.is-on .trm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }

        /* logo a filigrana grande nell'angolo alto-sinistra */
        .trm-tile-mark {
          position:absolute; top:8px; left:9px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          color:var(--gv); opacity:0.55;
          transition:transform .3s cubic-bezier(.2,.7,.3,1.5), color .25s, opacity .25s;
        }
        .trm-tile-mark svg { width:28px; height:28px; }

        /* TITOLO protagonista stile "Bolt": riempie tutta l'area disponibile.
           .trm-tile-titlebox è l'area (flex:1) che il JS misura; .trm-tile-title è
           il testo, ingrandito via JS (fit-to-box) fino a riempire larghezza+altezza. */
        .trm-tile-titlebox {
          position:relative; z-index:1; flex:1 1 auto; width:100%;
          display:flex; align-items:flex-end; min-height:0; overflow:hidden;
        }
        .trm-tile-title {
          font-size:1.6rem; /* fallback prima del fit JS */
          font-weight:900; line-height:0.96;
          letter-spacing:-0.03em;
          color:${textMain};
          width:100%;
          word-break:break-word; hyphens:auto; text-wrap:balance;
          transition:color .25s;
          text-shadow:0 1px 0 rgba(255,255,255,0.04);
        }
        .trm-tile.is-on .trm-tile-title { text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        .trm-tile-title-type { font-size:clamp(0.95rem, 8cqw, 1.45rem); font-weight:800; -webkit-line-clamp:2; }

        /* anello progressi: angolo in alto a destra; su verde diventa chiaro */
        .trm-tile-ring { position:absolute; top:7px; right:7px; z-index:1; transition:filter .25s; }
        .trm-tile.is-on .trm-tile-ring { filter:brightness(0) invert(1) opacity(0.92); }

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
          gap:0.7rem; padding:0.85rem 1rem;
          width:100%; border:none;
          background:linear-gradient(135deg, var(--gv3) 0%, var(--gv) 50%, var(--gv2) 100%);
          box-shadow:0 8px 22px ${dark ? "rgba(0,0,0,0.5)" : "rgba(31,107,60,0.32)"};
        }
        .trm-tile-all::before, .trm-tile-all .trm-tile-glow { display:none; }
        .trm-tile-all:hover { transform:translateY(-3px); box-shadow:0 16px 34px ${dark ? "rgba(0,0,0,0.6)" : "rgba(31,107,60,0.42)"}; }
        .trm-tile-all .trm-tile-check {
          position:static; transform:scale(0); width:24px; height:24px; border-radius:8px;
          background:rgba(255,255,255,0.22); color:#fff; box-shadow:none;
        }
        .trm-tile-all .trm-tile-check svg path { stroke:#fff; }
        .trm-tile-all.is-on .trm-tile-check { transform:scale(1); opacity:1; }
        .trm-tile-all-ic { color:#fff; display:flex; flex-shrink:0; transition:transform .25s; }
        .trm-tile-all:hover .trm-tile-all-ic { transform:scale(1.15) rotate(-6deg); }
        .trm-tile-all-txt { display:flex; flex-direction:column; min-width:0; }
        .trm-tile-all-title { font-size:1rem; font-weight:800; color:#fff; line-height:1.2; }
        .trm-tile-all-sub { font-size:0.72rem; color:rgba(255,255,255,0.82); line-height:1.3; margin-top:0.12rem;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        /* tipo domanda: tile più basse, titolo centrato */
        .trm-grid-types .trm-tile { aspect-ratio:auto; min-height:64px; align-items:center; justify-content:center; }
        .trm-grid-types .trm-tile .trm-tile-title { text-align:center; }
        @keyframes trm-pop { 0%{transform:scale(0.6);opacity:0;} 60%{transform:scale(1.08);} 100%{transform:scale(1);opacity:1;} }

        @media (min-width: 760px) {
          .trm-mobile  { display:none; }
          .trm-root { display:flex; align-items:stretch; justify-content:center; }
          .trm-desktop {
            display:flex; flex-direction:row; height:100%; overflow:hidden;
            max-width:920px; margin:0 auto; width:100%;
          }
          .trm-desktop-left {
            width:340px; flex-shrink:0;
            background:linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:1.1rem; padding:2.5rem 2rem; overflow:hidden;
          }
          .trm-desktop-left .trm-logo-wrap { padding:16px; border-radius:22px; }
          .trm-desktop-left .trm-title { font-size:3rem; }
          .trm-desktop-left .trm-stats-card { width:100%; }
          .trm-desktop-right {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem; overflow-y:auto;
          }
          .trm-desktop-right .trm-grid { grid-template-columns:repeat(3,1fr); }
          .trm-desktop-right .trm-grid-types { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>
    </div>
  );
}

