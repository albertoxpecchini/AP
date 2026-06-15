import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, ListOrdered, GraduationCap, ArrowDownUp } from "lucide-react";
import { CHAPTERS, questionsForMany } from "./questions";
import { chapterCoveragePct, chapterCoverageCount } from "./coverage";
import { iconForChapter } from "./chapterIcons";
import type { QType } from "./parseTrivia";

// Colore "semaforo" in base alla % esplorata del capitolo.
// rosso = appena iniziato, giallo = a metà, verde = completato.
function trafficColor(pct: number): string {
  if (pct >= 100) return "#2F7D4A";   // verde pieno
  if (pct >= 66)  return "#5aa02c";   // verde-lime
  if (pct >= 33)  return "#d9a300";   // giallo
  if (pct > 0)    return "#e07a1f";   // arancio
  return "#c0392b";                   // rosso = da esplorare
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
  onChangeNick: () => void;
}

// Palette per i capitoli (ciclica): dà varietà colore alle card capitolo.
const CHAP_COLORS = ["#2F7D4A", "#3a7bbf", "#b5651d", "#8e44ad", "#c0392b", "#0e8a8a", "#c79a00"];
const colorForIdx = (i: number) => CHAP_COLORS[i % CHAP_COLORS.length];

export default function TriviaMenu({
  dark, bestStreak, bestGrade, coverage, nick,
  onPlay, onTutorial, onLeaderboard, onChangeNick,
}: TriviaMenuProps) {
  // Set di id capitoli selezionati. Vuoto = "Tutti i capitoli".
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Set di tipi domanda selezionati. Vuoto = "Tutti i tipi".
  const [types, setTypes] = useState<Set<QType>>(new Set());

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
  // Colore stabile per capitolo (basato sull'ordine cronologico): non cambia
  // quando riordini la lista.
  const colorById = useMemo(() => {
    const m = new Map<string, string>();
    [...CHAPTERS].sort((a, b) => a.order - b.order).forEach((c, i) => m.set(c.id, colorForIdx(i)));
    return m;
  }, []);
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
  // Colore "principale" = verde se "tutti", altrimenti colore del primo capitolo
  // scelto (nell'ordine di visualizzazione corrente).
  const firstSel = allMode ? undefined : orderedChapters.find(c => selected.has(c.id));
  const selectedColor = firstSel ? (colorById.get(firstSel.id) || "#2F7D4A") : "#2F7D4A";
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
    const col = trafficColor(pct);
    const R = 15, C = 2 * Math.PI * R;
    const track = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
    return (
      <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }} title={`${seen} / ${total} domande viste · ${pct}%`}>
        <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="19" cy="19" r={R} fill="none" stroke={track} strokeWidth="3.5" />
          <circle
            cx="19" cy="19" r={R} fill="none" stroke={col} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset .3s, stroke .3s" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", lineHeight: 1,
        }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 900, color: col, fontVariantNumeric: "tabular-nums" }}>{seen}</span>
          <span style={{ fontSize: "0.46rem", fontWeight: 700, color: lbl }}>/{total}</span>
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

  // ── Lista to-do: "Tutti i capitoli" + una riga per capitolo ──
  const ChapterList = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {SortControl}
      {/* Tutti (deseleziona tutto) */}
      <TodoRow
        active={allMode}
        multi={false}
        color="#2F7D4A"
        title="Tutti i capitoli"
        subtitle={`Mix da tutti i ${CHAPTERS.length} capitoli · ${totalQuestions} domande`}
        dark={dark} card={card} bord={bord} lbl={lbl} textMain={textMain} textSub={textSub}
        onClick={selectAll}
      />
      {orderedChapters.map((c) => {
        const cov = chapterCoveragePct(c.id);
        const { seen, total } = chapterCoverageCount(c.id);
        const color = colorById.get(c.id) || "#2F7D4A";
        return (
          <TodoRow
            key={c.id}
            active={selected.has(c.id)}
            multi
            color={color}
            title={c.title}
            // Sottotitolo = argomento/autore (utile), non più "N domande".
            subtitle={c.autore ? `${c.argomento} · ${c.autore}` : c.argomento}
            logo={iconForChapter(c.id)}
            badge={progressRing(seen, total, cov)}
            done={cov >= 100}
            dark={dark} card={card} bord={bord} lbl={lbl} textMain={textMain} textSub={textSub}
            onClick={() => toggleChapter(c.id)}
          />
        );
      })}
    </div>
  );

  // ── Lista to-do dei tipi di domanda (stesso look dei capitoli) ──
  const TypeList = (
    <div>
      <p className="trm-section-label" style={{ color: lbl }}>Tipi di domanda</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {TYPE_DEFS.map(t => (
          <TodoRow
            key={t.id}
            active={types.has(t.id)}
            multi
            color={t.color}
            title={t.label}
            subtitle={t.desc}
            dark={dark} card={card} bord={bord} lbl={lbl} textMain={textMain} textSub={textSub}
            onClick={() => toggleType(t.id)}
          />
        ))}
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
    <div className="trm-root">
      {/* ════════ MOBILE ════════ */}
      <div className="trm-mobile">
        <div className="trm-hero">
          <div className="trm-logo-wrap"><GraduationCap size={44} /></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
            <p className="trm-tagline">Storia dell'Architettura · rispondi e scala la classifica</p>
          </div>
          <p className="trm-kicker">Web Game · Quiz</p>
        </div>
        <div className="trm-body">
          {StatsCard(false)}
          <p className="trm-section-label" style={{ color: lbl }}>Scegli i capitoli</p>
          {ChapterList}
          {TypeList}
          {PlayBtn}
          {LbBtn}
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
            <button type="button" onClick={onTutorial} className="trm-tut-btn" style={{ flex: 1, color: icon, border: `1.5px solid ${bord}` }}>
              <BookOpen size={15} /> Come si gioca
            </button>
          </div>
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
        }
      `}</style>
    </div>
  );
}

// ── Riga "to-do" riusabile (capitoli e tipi condividono lo stesso look) ──
// Checkbox A SINISTRA, poi contenuto, poi badge opzionale a destra.
// `multi` = checkbox quadrata (capitolo/tipo), altrimenti pallino ("Tutti").
// `done` = pacchetto/capitolo completato al 100% → spunta piena di colore.
function TodoRow(props: {
  active: boolean; multi: boolean; color: string; title: string; subtitle: string;
  badge?: React.ReactNode; done?: boolean; logo?: React.ReactNode;
  dark: boolean; card: string; bord: string; lbl: string; textMain: string; textSub: string;
  onClick: () => void;
}) {
  const { active, multi, color, title, subtitle, badge, done, logo, dark, card, bord, lbl, textMain, textSub, onClick } = props;
  // La checkbox è "piena" se selezionata oppure se il capitolo è completato.
  const filled = active || done;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.7rem",
        padding: "0.6rem 0.8rem",
        background: active ? `${color}${dark ? "22" : "12"}` : card,
        border: `1.5px solid ${active ? color : bord}`,
        borderRadius: "11px", cursor: "pointer", fontFamily: "inherit",
        textAlign: "left", width: "100%",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Checkbox a SINISTRA (stile to-do) */}
      <div style={{
        width: 22, height: 22, flexShrink: 0,
        borderRadius: multi ? 6 : "50%",
        background: filled ? color : "transparent",
        border: filled ? `2px solid ${color}` : `2px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .15s, border-color .15s",
      }}>
        {filled && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
      </div>
      {/* Slot logo SVG del capitolo: discreto e indicativo. Quando un capitolo
          avrà il suo logo (campo `logo`) verrà mostrato qui; altrimenti niente. */}
      {logo && (
        <span style={{
          width: 26, height: 26, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
          opacity: 0.85,
        }}>{logo}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: active ? color : textMain, lineHeight: 1.25 }}>{title}</div>
        {subtitle && <p style={{ fontSize: "0.72rem", color: textSub, margin: "0.05rem 0 0", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>}
      </div>
      {badge}
    </button>
  );
}
