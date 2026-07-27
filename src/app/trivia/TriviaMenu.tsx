import { useMemo, useState, useEffect } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  IcBrain, IcBookOpen, IcArrowRight, IcArrowLeft, IcArrowUpRight, IcExternal,
  IcSort, IcListCheck, IcToggle, IcPen, IcGrad, IcFlame, IcTrophy,
  IcRanking, IcPlay, IcUser, IcCheck,
} from "../site/homeIcons";
import { CHAPTERS, questionsForMany } from "./questions";
import { fetchTotals } from "./leaderboardApi";
import { chapterCoverageFrom } from "./questionStats";
import type { ProgressMap } from "./progressApi";
import { iconForChapter } from "./chapterIcons";
import { TRIVIA_VERSION } from "./version";
import type { QType } from "./parseTrivia";

// ─────────────────────────────────────────────────────────────────────────────
// Il MENÙ di Trivia nella veste "piattaforma Supabase" della home (.sb-):
// hero a due colonne (titolo + profilo), quattro card-record (voto, streak,
// database esplorato, libro di riferimento), il pannello "dashboard" con la
// scelta dei capitoli, la griglia dei tipi di domanda, la barra di lancio e
// le funzioni del gioco. Testi in italiano (li traduce il motore i18n del
// sito), icone disegnate a mano, tema chiaro/scuro nativo via token --sb-*.
// ─────────────────────────────────────────────────────────────────────────────

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

// Tipi di domanda selezionabili, con etichetta, descrizione e icona.
const TYPE_DEFS: { id: QType; label: string; desc: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { id: "multipla",   label: "Scelta multipla", desc: "Scegli l'opzione giusta", Icon: IcListCheck },
  { id: "vero-falso", label: "Vero o Falso",    desc: "Vero oppure falso",       Icon: IcToggle },
  { id: "aperta",     label: "Completamento",   desc: "Scrivi tu la risposta",   Icon: IcPen },
];

interface TriviaMenuProps {
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
  bestStreak, bestGrade, coverage, progress, nick,
  onPlay, onTutorial, onLeaderboard, onPagella, onChangeNick,
}: TriviaMenuProps) {
  // Set di id capitoli selezionati. Vuoto = "Tutti i capitoli".
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Set di tipi domanda selezionati. Vuoto = "Tutti i tipi".
  const [types, setTypes] = useState<Set<QType>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("cronologico");

  // Punteggio totale del giocatore (somma dei best per capitolo) → mostrato
  // nella pastiglia del profilo. Caricato una volta per nickname.
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

  // ── Ordinamento della lista capitoli ──
  // cronologico = ordine di caricamento dei raw (default); az/za = per titolo;
  // esplorato = meno esplorati in cima (così è una "to-do" di studio).
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

  // Un solo tap sul tasto "Ordina" passa al criterio successivo (cicla).
  const cycleSort = () => {
    const i = SORT_OPTIONS.findIndex(o => o.key === sortBy);
    setSortBy(SORT_OPTIONS[(i + 1) % SORT_OPTIONS.length].key);
  };

  // Domande disponibili nella selezione corrente (capitoli + tipi).
  const availableCount = questionsForMany([...selected], [...types]).length;
  // Quante domande di OGNI tipo nei capitoli scelti (ignora il filtro tipi):
  // si aggiorna selezionando i capitoli.
  const countByType = useMemo(() => {
    const ids = [...selected];
    const m = {} as Record<QType, number>;
    (["multipla", "vero-falso", "aperta"] as QType[]).forEach(t => {
      m[t] = questionsForMany(ids, [t]).length;
    });
    return m;
  }, [selected]);
  const oneChapterTitle = selected.size === 1 ? (CHAPTERS.find(c => selected.has(c.id))?.title ?? "") : "";

  const play = () => { if (availableCount > 0) onPlay([...selected], [...types]); };

  // Nessun capitolo caricato (cartella content/trivia vuota): stato "in arrivo".
  if (CHAPTERS.length === 0) {
    return (
      <main id="main-content">
        <section className="sb-container sb-tv-hero">
          <span className="sb-tv-eyebrow">
            <IcBrain size={14} />
            <span translate="no" data-no-i18n>Trivia v{TRIVIA_VERSION}</span>
          </span>
          <h1 className="sb-hero-title">
            <span translate="no">Trivia</span>
            <span className="sb-brandline">Storia dell'Architettura</span>
          </h1>
        </section>
        <section className="sb-container sb-section">
          <div className="sb-panel">
            <div className="sb-panel-inner sb-tv-empty-inner">
              <IcBookOpen size={28} />
              <h3>Domande in arrivo</h3>
              <p>I capitoli del quiz verranno caricati a breve. Torna presto!</p>
              <Link to="/#progetti" className="sb-link">
                <IcArrowLeft size={15} /> Torna ai progetti
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content">
      {/* ① Hero — titolo a sinistra, promessa del gioco a destra */}
      <section className="sb-container sb-tv-hero">
        <span className="sb-tv-eyebrow">
          <IcBrain size={14} />
          <span translate="no" data-no-i18n>Trivia v{TRIVIA_VERSION}</span>
          <span data-no-i18n>·</span>
          <span>gioco gratuito</span>
        </span>
        <div className="sb-hero-grid">
          <div>
            <h1 className="sb-hero-title">
              <span translate="no">Trivia</span>
              <span className="sb-brandline">Storia dell'Architettura</span>
            </h1>
            <p className="sb-tv-lead">Rispondi e scala la classifica.</p>
          </div>
          <div className="sb-hero-copy sb-tv-hero-copy">
            <p>Scegli i capitoli e i tipi di domanda, poi premi Gioca: la partita copre tutte le domande del filtro scelto, così puoi completare un argomento e prenderne il voto.</p>
            <p>Più rispondi giusto e veloce, più punti · classifica live</p>
            <PlayerPill nick={nick} score={playerScore} fmt={fmtScore} onClick={onChangeNick} />
          </div>
        </div>
        <div className="sb-hero-actions">
          <a href="#partita" className="sb-btn sb-btn--primary"><IcPlay size={15} /> Gioca</a>
          <button type="button" className="sb-btn sb-btn--secondary" onClick={onTutorial}>
            <IcBookOpen size={15} /> Come si gioca
          </button>
        </div>
      </section>

      {/* ② I record del giocatore + il libro di riferimento */}
      <section className="sb-container sb-tv-facts" aria-label="I tuoi record">
        <Fact Icon={IcGrad} label="Miglior voto" value={bestGrade} note="Il voto più alto che hai preso su un pacchetto." />
        <Fact Icon={IcFlame} label="Streak record" value={String(bestStreak)} note="Risposte giuste di fila, il tuo primato." />
        <Fact Icon={IcTrophy} label="Db esplorato" value={`${coverage}%`} note="Quante domande del database hai già visto." />

        <a
          className="sb-tv-book"
          href="https://www.amazon.it/Progettazione-Costruzioni-Impianti-Vall%C3%AC-Baraldi/dp/8836007562"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="sb-panel">
            <div className="sb-panel-inner sb-tv-book-inner">
              <img
                src="/trivia-libro.jpg"
                alt="Progettazione, Costruzioni e Impianti 3 — Hoepli"
                loading="lazy"
                onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
              />
              <span className="sb-tv-book-txt">
                <span className="sb-tv-book-lbl">Libro di riferimento</span>
                <span className="sb-tv-book-title" translate="no">
                  Progettazione, Costruzioni e Impianti 3 — Baraldi, Zanghì (Hoepli)
                </span>
                <span className="sb-tv-book-go">Vedi il libro <IcExternal size={13} /></span>
              </span>
            </div>
          </div>
        </a>
      </section>

      {/* ③ Il "dashboard": la scelta dei capitoli */}
      <section id="partita" className="sb-section sb-tv-setup">
        <div className="sb-container">
          <div className="sb-tv-sechead sb-sechead">
            <h3><span className="sb-tv-step" data-no-i18n>1</span>Scegli i capitoli</h3>
            <p>Vuoto vuol dire tutti: seleziona uno o più capitoli per restringere il quiz.</p>
          </div>

          <div className="sb-tv-toolbar">
            <span className="sb-tv-count">
              <strong translate="no">{availableCount}</strong> domande nel quiz
            </span>
            <button
              type="button"
              className="sb-btn sb-btn--sm sb-btn--secondary"
              onClick={cycleSort}
              aria-label="Cambia ordinamento dei capitoli"
            >
              <IcSort size={15} /> {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
            </button>
          </div>

          {/* Tile larga "Tutti i capitoli" */}
          <button
            type="button"
            className="sb-tv-all"
            aria-pressed={allMode}
            data-tour="chapters"
            onClick={selectAll}
          >
            <div className="sb-panel">
              <div className="sb-panel-inner sb-tv-all-inner">
                <span className="sb-tv-all-ic"><IcBookOpen size={22} /></span>
                <span className="sb-tv-all-txt">
                  <span className="sb-tv-all-title">Tutti i capitoli</span>
                  <span className="sb-tv-all-sub">Nessun filtro: il quiz pesca da tutti i capitoli.</span>
                </span>
                {allMode ? <IcCheck size={18} /> : <IcArrowRight size={18} />}
              </div>
            </div>
          </button>

          <div className="sb-tv-chapters">
            {orderedChapters.map(c => {
              const { seen, total, pct } = chapterCoverageFrom(progress, c.id);
              const on = selected.has(c.id);
              const done = pct >= 100;
              return (
                <button
                  key={c.id}
                  type="button"
                  className="sb-tv-chapter"
                  aria-pressed={on}
                  onClick={() => toggleChapter(c.id)}
                >
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-tv-chapter-inner">
                      <span className="sb-tv-chapter-top">
                        <span className="sb-tv-chapter-ic">{iconForChapter(c.id, 20)}</span>
                        <span
                          className={`sb-tv-prog${done ? " sb-tv-prog--done" : ""}`}
                          data-no-i18n
                          title={`${seen} / ${total} · ${pct}%`}
                        >
                          <b>{seen}</b>/{total}
                        </span>
                      </span>
                      <span className="sb-tv-chapter-name" translate="no">{c.title}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ④ I tipi di domanda */}
      <section className="sb-section sb-tv-setup" aria-label="Tipi di domanda">
        <div className="sb-container">
          <div className="sb-tv-sechead sb-sechead">
            <h3><span className="sb-tv-step" data-no-i18n>2</span>Tipi di domanda</h3>
            <p>{allTypes
              ? <span>Tutti i tipi: tocca per accendere o spegnere un tipo di domanda.</span>
              : <span>Solo i tipi accesi finiscono nel quiz: tocca di nuovo per spegnerli.</span>}</p>
          </div>

          <div className="sb-tv-types">
            {TYPE_DEFS.map(t => {
              const on = types.has(t.id);
              const n = countByType[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  className="sb-tv-type"
                  aria-pressed={on}
                  disabled={n === 0}
                  onClick={() => toggleType(t.id)}
                >
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-tv-type-inner">
                      <span className="sb-tv-type-top">
                        <span className="sb-tv-type-ic"><t.Icon size={20} /></span>
                        <span className="sb-tv-type-n">
                          <span translate="no">{n}</span> domande
                        </span>
                      </span>
                      <h4>{t.label}</h4>
                      <p>{t.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ⑤ Barra di lancio: riepilogo della selezione + Gioca */}
      <section className="sb-container sb-tv-setup-end" aria-label="Avvia la partita">
        <div className="sb-panel">
          <div className="sb-panel-inner sb-tv-launch-inner">
            <span className="sb-tv-launch-txt">
              <span className="sb-tv-launch-title">
                <span className="sb-tv-step" data-no-i18n>3</span>Pronto a giocare?
              </span>
              <span className={`sb-tv-launch-sub${availableCount === 0 ? " sb-tv-launch-sub--warn" : ""}`}>
                {allMode
                  ? <span>Tutti i capitoli</span>
                  : selected.size === 1
                    ? <span translate="no">{oneChapterTitle}</span>
                    : <><span translate="no">{selected.size}</span> <span>capitoli selezionati</span></>}
                <span data-no-i18n> · </span>
                {availableCount === 0
                  ? <span>nessuna domanda con questi filtri</span>
                  : <><span translate="no">{availableCount}</span> <span>domande nel quiz</span></>}
              </span>
            </span>
            <span className="sb-tv-launch-actions">
              <button type="button" className="sb-btn sb-btn--primary" onClick={play} disabled={availableCount === 0}>
                <IcPlay size={15} /> Gioca
              </button>
              <button type="button" className="sb-btn sb-btn--secondary" onClick={onTutorial}>
                <IcBookOpen size={15} /> Come si gioca
              </button>
            </span>
          </div>
        </div>
      </section>

      {/* ⑥ Le funzioni del gioco (≈ griglia dei template) */}
      <section className="sb-section" aria-label="Funzioni del gioco">
        <div className="sb-container">
          <div className="sb-splithead">
            <h3>Tutto quello che il gioco tiene da conto</h3>
            <Link to="/#progetti" className="sb-btn sb-btn--sm sb-btn--secondary">
              <IcArrowLeft size={15} /> Torna ai progetti
            </Link>
          </div>
          <div className="sb-tv-funcs">
            <Func Icon={IcRanking} title="Classifica live" desc="Il podio di tutti i giocatori, aggiornato in tempo reale." onClick={onLeaderboard} />
            <Func Icon={IcGrad} title="La mia pagella" desc="I voti che conquisti, capitolo per capitolo e tipo per tipo." onClick={onPagella} />
            <Func Icon={IcBookOpen} title="Come si gioca" desc="Punteggi, bonus velocità e streak, spiegati passo per passo." onClick={onTutorial} />
          </div>
        </div>
      </section>

      {/* ⑦ CTA finale */}
      <section className="sb-section sb-cta">
        <div className="sb-container">
          <h2>
            Metti alla prova quello che sai
            <span className="sb-brandline">Buona partita.</span>
          </h2>
          <p>Più rispondi giusto e veloce, più punti · classifica live</p>
          <div className="sb-cta-actions">
            <button type="button" className="sb-btn sb-btn--primary" onClick={play} disabled={availableCount === 0}>
              <IcPlay size={15} /> Gioca
            </button>
            <button type="button" className="sb-btn sb-btn--secondary" onClick={onLeaderboard}>
              <IcRanking size={15} /> Classifica live
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ── Card di un record (voto, streak, copertura) ── */
function Fact({ Icon, label, value, note }: {
  Icon: (p: { size?: number }) => JSX.Element;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="sb-panel">
      <div className="sb-panel-inner sb-tv-fact-inner">
        <span className="sb-tv-fact-top"><Icon size={16} /><span>{label}</span></span>
        <p className="sb-tv-fact-val" translate="no">{value}</p>
        <p className="sb-tv-fact-note">{note}</p>
      </div>
    </div>
  );
}

/* ── Card-funzione (apre una modale del gioco) ── */
function Func({ Icon, title, desc, onClick }: {
  Icon: (p: { size?: number }) => JSX.Element;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="sb-tv-func sb-page-card" onClick={onClick} aria-haspopup="dialog">
      <div className="sb-panel">
        <div className="sb-panel-inner sb-page-inner">
          <div className="sb-page-top">
            <Icon size={20} />
            <IcArrowUpRight size={16} className="go" />
          </div>
          <h4>{title}</h4>
          <p>{desc}</p>
        </div>
      </div>
    </button>
  );
}

/* ── Pastiglia del profilo: punteggio totale + nome, tocca per cambiarlo ── */
function PlayerPill({ nick, score, fmt, onClick, small }: {
  nick?: string;
  score: number | null;
  fmt: (n: number) => string;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      className={`sb-tv-player${small ? " sb-tv-player--sm" : ""}`}
      onClick={onClick}
      data-tour="player"
    >
      <span className="sb-tv-player-badge" data-no-i18n>
        {nick ? (score === null ? "…" : fmt(score)) : <IcUser size={15} />}
      </span>
      {nick
        ? <span className="sb-tv-player-name" translate="no">{nick}</span>
        : <span className="sb-tv-player-name">Scegli profilo</span>}
    </button>
  );
}

export { PlayerPill };
