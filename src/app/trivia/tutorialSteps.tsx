import type { IntroStep } from "../components/GameIntro";

// ════════════════════════════════════════════════════════════════════════════
// Tutorial Trivia — VISUAL ANIMATI (vettoriale puro, zero dipendenze esterne)
// ════════════════════════════════════════════════════════════════════════════
// Ogni passo è una "scena" autonoma: tutto è CSS/SVG inline → leggerissimo, ma
// con animazioni stratificate (entrata in sequenza, loop continui, parallax,
// glow, conta-su numerico) per un effetto ultra-fluido. Le keyframes vivono in
// <style> in fondo, con prefisso `tut-` per non collidere con GameIntro (`gt-`).
//
// COLORI. Due categorie, con regole diverse:
//  · le SUPERFICI e i TESTI delle scene vengono dai token --sb-*, così le
//    scene si leggono sia sulla card chiara sia su quella scura. Prima erano
//    grigi fissi (#3c4a41, #7a8a80…) tarati su una card sempre bianca;
//  · i colori da ILLUSTRAZIONE restano fissi: sono disegni, non interfaccia.
//    Le tre card dei tipi di domanda vanno distinte fra loro e l'oro del bonus
//    deve leggersi come "oro" in tutti e due i temi. Sopra ci sta sempre del
//    bianco, che su un fondo pieno saturo va bene.
// Il primo dei tre è il brand, così le scene non litigano col resto del sito.
// Da quando il brand è azzurro il secondo NON può più essere blu — erano due
// card della stessa fila e la stessa tinta: è passato al viola, che resta a
// distanza sia dall'azzurro sia dall'arancio.

const BRAND = "var(--sb-brand-text)";
const BRAND_LITE = "var(--sb-brand)";
const VIOLET = "#7a5bbf";
const ORANGE = "#b5651d";
const GOLD = "#D9A400";
const VIOLA = BRAND;
const VIOLA_LITE = BRAND_LITE;

// ── Passo 1 ─────────────────────────────────────────────────────────────────
// "Tre tipi di domanda" — tre card che entrano a cascata, fluttuano in loop
// sfalsato, e mostrano una micro-anteprima animata del proprio tipo.
function TypesVisual() {
  const cards: { bg: string; label: string; icon: React.ReactNode; delay: number }[] = [
    {
      bg: BRAND, label: "Scelta\nmultipla", delay: 0,
      icon: (
        <svg viewBox="0 0 44 44" width="40" height="40" fill="none">
          {[8, 20, 32].map((y, i) => (
            <g key={y}>
              <circle cx="9" cy={y} r="4.5" stroke="#fff" strokeWidth="2"
                style={{ opacity: 0.85 }} />
              {i === 1 && (
                <circle cx="9" cy={y} r="2" fill="#fff"
                  style={{ animation: "tut-pop 2.4s ease-in-out infinite", transformOrigin: "9px 20px" }} />
              )}
              <rect x="18" y={y - 2.5} width={i === 1 ? 22 : 16} height="5" rx="2.5" fill="#fff"
                style={{ opacity: i === 1 ? 0.95 : 0.5 }} />
            </g>
          ))}
        </svg>
      ),
    },
    {
      bg: VIOLET, label: "Vero /\nFalso", delay: 0.12,
      icon: (
        <svg viewBox="0 0 44 44" width="40" height="40" fill="none">
          <g style={{ animation: "tut-flip 3s ease-in-out infinite", transformOrigin: "22px 22px" }}>
            <circle cx="22" cy="22" r="15" stroke="#fff" strokeWidth="2.2" style={{ opacity: 0.55 }} />
            <path d="M15 22.5 l4.5 4.5 L30 16" stroke="#fff" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="26" strokeDashoffset="26"
              style={{ animation: "tut-draw 3s ease-in-out infinite" }} />
          </g>
        </svg>
      ),
    },
    {
      bg: ORANGE, label: "Risposta\naperta", delay: 0.24,
      icon: (
        <svg viewBox="0 0 44 44" width="40" height="40" fill="none">
          <rect x="6" y="13" width="32" height="18" rx="4" stroke="#fff" strokeWidth="2" style={{ opacity: 0.6 }} />
          <rect x="11" y="20.5" width="0" height="3" rx="1.5" fill="#fff"
            style={{ animation: "tut-type 3.2s steps(1) infinite" }} />
          <rect x="11" y="19" width="2" height="6" rx="1" fill="#fff"
            style={{ animation: "tut-caret 3.2s ease infinite" }} />
        </svg>
      ),
    },
  ];
  return (
    <div style={{ display: "flex", gap: "0.7rem", width: "100%", maxWidth: 360, perspective: 800 }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: 1,
            background: `linear-gradient(160deg, ${c.bg}, ${c.bg} 60%, rgba(0,0,0,0.18))`,
            borderRadius: 16,
            padding: "0.9rem 0.4rem 0.7rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
            boxShadow: `0 10px 22px ${c.bg}44`,
            animation: `tut-card-in 0.6s cubic-bezier(.34,1.56,.64,1) ${c.delay}s both, tut-float 4s ease-in-out ${c.delay + 0.6}s infinite`,
          }}
        >
          <div style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}>{c.icon}</div>
          <span style={{
            color: "#fff", fontWeight: 800, fontSize: "0.72rem", textAlign: "center",
            lineHeight: 1.15, whiteSpace: "pre-line", letterSpacing: "0.01em",
          }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Passo 2 ─────────────────────────────────────────────────────────────────
// "Più giusto e veloce, più punti" — anello di voto che si disegna + numero che
// conta su, una barra "bonus velocità" che si svuota in loop e scintille d'oro.
function ScoreVisual() {
  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = 0.82; // riempimento finale dell'anello
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem", width: "100%", maxWidth: 320 }}>
      <div style={{ position: "relative", width: 132, height: 132 }}>
        {/* scintille orbitanti */}
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{
            position: "absolute", top: "50%", left: "50%", width: 6, height: 6, marginLeft: -3, marginTop: -3,
            borderRadius: "50%", background: GOLD,
            boxShadow: `0 0 8px ${GOLD}`,
            animation: `tut-orbit 3.4s linear ${i * 0.85}s infinite`,
            opacity: 0,
          }} />
        ))}
        <svg viewBox="0 0 132 132" width="132" height="132" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="66" cy="66" r={R} stroke="var(--sb-surface-200)" strokeWidth="11" fill="none" />
          <circle
            cx="66" cy="66" r={R} stroke={BRAND_LITE} strokeWidth="11" fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C}
            style={{
              animation: "tut-ring 2.6s cubic-bezier(.4,0,.2,1) 0.3s infinite",
              // valore custom usato nelle keyframes
              ["--ring-target" as string]: `${C * (1 - pct)}`,
              filter: `drop-shadow(0 0 6px color-mix(in srgb, ${BRAND_LITE} 53%, transparent))`,
            }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
        }}>
          <span style={{
            fontWeight: 900, fontSize: "2.4rem", color: BRAND_LITE, lineHeight: 1,
            animation: "tut-grade-pop 2.6s ease 0.3s infinite",
          }}>A−</span>
        </div>
      </div>

      {/* barra bonus velocità che si "consuma" come un timer */}
      <div style={{ width: "100%", maxWidth: 240 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", fontSize: "0.66rem",
          fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
          color: "var(--sb-fg-muted)", marginBottom: 5,
        }}>
          <span>Bonus velocità</span>
          <span style={{ color: GOLD, animation: "tut-blink 2.6s ease 0.3s infinite" }}>+100</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "var(--sb-surface-200)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 999,
            background: `linear-gradient(90deg, ${GOLD}, #f2c94c)`,
            animation: "tut-drain 2.6s linear 0.3s infinite",
            boxShadow: `0 0 10px color-mix(in srgb, ${GOLD} 67%, transparent)`,
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Passo 3 ─────────────────────────────────────────────────────────────────
// "Streak e classifica live" — fiamme che pulsano in cascata, moltiplicatore che
// "scatta", trofeo che rimbalza, e tre righe di classifica che salgono di posto.
function StreakVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem", width: "100%", maxWidth: 300 }}>
      {/* fiamme + moltiplicatore */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            fontSize: "2rem", display: "inline-block",
            animation: `tut-flame 1.1s ease-in-out ${i * 0.18}s infinite`,
            filter: "drop-shadow(0 3px 6px rgba(217,164,0,0.5))",
          }}>🔥</span>
        ))}
        <span style={{
          fontWeight: 900, fontSize: "1.6rem", color: GOLD, marginLeft: 4,
          animation: "tut-mult 2.2s cubic-bezier(.34,1.56,.64,1) infinite",
          textShadow: `0 2px 8px color-mix(in srgb, ${GOLD} 40%, transparent)`,
        }}>×3</span>
        <span style={{
          fontSize: "1.9rem", marginLeft: 6, display: "inline-block",
          animation: "tut-trophy 2.2s ease 0.4s infinite",
          filter: "drop-shadow(0 3px 6px rgba(217,164,0,0.5))",
        }}>🏆</span>
      </div>

      {/* mini-classifica live: la riga "tu" sale in cima */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { name: "Giulia", me: false, w: "72%", base: 0 },
          { name: "TU", me: true, w: "92%", base: 1 },
          { name: "Marco", me: false, w: "58%", base: 2 },
        ].map((r, i) => (
          <div key={r.name} style={{
            display: "flex", alignItems: "center", gap: "0.55rem",
            padding: "0.4rem 0.6rem", borderRadius: 10,
            background: r.me ? `linear-gradient(90deg, color-mix(in srgb, ${BRAND} 12%, transparent), color-mix(in srgb, ${BRAND} 3%, transparent))` : "var(--sb-overlay)",
            border: r.me ? `1px solid color-mix(in srgb, ${BRAND} 25%, transparent)` : "1px solid transparent",
            animation: r.me
              ? "tut-rank-rise 3s cubic-bezier(.5,0,.2,1) infinite"
              : `tut-row-in 0.5s ease ${0.3 + i * 0.1}s both`,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: r.me ? BRAND_LITE : "var(--sb-border-stronger)",
              color: r.me ? "#fff" : "var(--sb-fg-muted)",
              fontSize: "0.6rem", fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{i + 1}</span>
            <span style={{
              fontWeight: r.me ? 900 : 700, fontSize: "0.74rem",
              color: r.me ? BRAND : "var(--sb-fg-light)", width: 52, flexShrink: 0,
            }}>{r.name}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--sb-overlay)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: r.w, borderRadius: 999,
                background: r.me ? `linear-gradient(90deg, ${BRAND}, ${BRAND_LITE})` : "var(--sb-border-stronger)",
                animation: r.me ? "tut-bar-grow 3s ease infinite" : "none",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Passo: CONTESTO sempre visibile ───────────────────────────────────────────
// Banner argomento · autore · edificio che "monta" riga per riga sopra una
// domanda finta → spiega che non sei mai senza riferimenti ("quale chiesa?").
function ContextVisual() {
  const rows = [
    { k: "Argomento", v: "Sagrada Família", d: 0 },
    { k: "Autore", v: "Antoni Gaudí", d: 0.18 },
    { k: "Edificio", v: "Basilica, Barcellona", d: 0.36 },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      <div style={{
        borderRadius: 14, overflow: "hidden",
        border: `1px solid color-mix(in srgb, ${BRAND} 20%, transparent)`,
        boxShadow: `0 10px 24px color-mix(in srgb, ${BRAND} 13%, transparent)`,
        animation: "tut-card-in 0.5s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        {/* banner contesto */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LITE})`, padding: "0.7rem 0.85rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {rows.map(r => (
            <div key={r.k} style={{
              display: "flex", alignItems: "baseline", gap: "0.45rem",
              animation: `tut-row-in 0.5s ease ${0.25 + r.d}s both`,
            }}>
              <span style={{ fontSize: "0.56rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", width: 60, flexShrink: 0 }}>{r.k}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#fff" }}>{r.v}</span>
            </div>
          ))}
        </div>
        {/* domanda finta sotto */}
        <div style={{ background: "var(--sb-surface-75)", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem", animation: "tut-row-in 0.5s ease 0.6s both" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--sb-fg)", lineHeight: 1.4 }}>In che anno iniziò la costruzione?</span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {["1882", "1905", "1926"].map((o, i) => (
              <span key={o} style={{
                flex: 1, textAlign: "center", padding: "0.35rem", borderRadius: 8,
                fontSize: "0.72rem", fontWeight: 800,
                background: i === 0 ? `color-mix(in srgb, ${BRAND} 10%, transparent)` : "var(--sb-overlay)",
                color: i === 0 ? BRAND : "var(--sb-fg-muted)",
                border: i === 0 ? `1.5px solid ${BRAND}` : "1.5px solid transparent",
                animation: i === 0 ? "tut-pop-soft 2.6s ease 1s infinite" : "none",
              }}>{o}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Passo: COPERTURA / progressi ──────────────────────────────────────────────
// Una barra "DB esplorato" che si riempie + una pila di capitoli che fanno
// "25/25" e diventano viola (completati). Conta su il numero.
function CoverageVisual() {
  const chapters = [
    { name: "Neoclassicismo", n: "25/25", done: true, d: 0.2 },
    { name: "Torre Eiffel", n: "25/25", done: true, d: 0.4 },
    { name: "Bauhaus", n: "18/25", done: false, d: 0.6 },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* barra DB esplorato */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--sb-fg-muted)", marginBottom: 5 }}>
          <span>Database esplorato</span>
          <span style={{ color: VIOLA, animation: "tut-blink 3s ease 0.3s infinite" }}>68%</span>
        </div>
        <div style={{ height: 9, borderRadius: 999, background: "var(--sb-surface-200)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${VIOLA}, ${VIOLA_LITE})`, animation: "tut-fill-68 2.6s cubic-bezier(.4,0,.2,1) 0.3s infinite", boxShadow: `0 0 10px color-mix(in srgb, ${VIOLA} 53%, transparent)` }} />
        </div>
      </div>
      {/* capitoli con N/T */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {chapters.map(c => (
          <div key={c.name} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.5rem 0.7rem", borderRadius: 10,
            background: c.done ? `color-mix(in srgb, ${VIOLA} 8%, transparent)` : "var(--sb-overlay)",
            border: c.done ? `1px solid color-mix(in srgb, ${VIOLA} 23%, transparent)` : "1px solid transparent",
            animation: `tut-row-in 0.5s ease ${c.d}s both`,
          }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: c.done ? VIOLA : "var(--sb-fg-light)" }}>{c.name}</span>
            <span style={{
              fontSize: "0.74rem", fontWeight: 900, fontVariantNumeric: "tabular-nums",
              padding: "0.1rem 0.5rem", borderRadius: 999,
              color: c.done ? "#fff" : BRAND,
              background: c.done ? VIOLA : `color-mix(in srgb, ${BRAND} 10%, transparent)`,
              animation: c.done ? `tut-badge-pop 2.6s ease ${0.8 + c.d}s infinite` : "none",
            }}>{c.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Passo: VOTO per pacchetto + PAGELLA ───────────────────────────────────────
// Tre "lettere" voto che escono come timbri (A+, A−, B) per argomento×tipo, poi
// un mini-libretto "pagella" che si apre.
function GradeVisual() {
  const grades = [
    { g: "A+", lab: "Neoclassicismo · Multipla", col: BRAND_LITE, d: 0.2 },
    { g: "A−", lab: "Torre Eiffel · Vero/Falso", col: BRAND, d: 0.5 },
    { g: "B", lab: "Bauhaus · Completamento", col: GOLD, d: 0.8 },
  ];
  return (
    <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.1rem" }}>
        <span style={{ fontSize: "1.2rem", animation: "tut-trophy 2.4s ease infinite", display: "inline-block" }}>📒</span>
        <span style={{ fontSize: "0.74rem", fontWeight: 900, color: VIOLA, textTransform: "uppercase", letterSpacing: "0.06em" }}>La tua pagella</span>
      </div>
      {grades.map(r => (
        <div key={r.lab} style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.4rem 0.6rem", borderRadius: 11,
          background: "var(--sb-overlay)",
          animation: `tut-row-in 0.5s ease ${r.d}s both`,
        }}>
          <span style={{
            width: 34, height: 34, flexShrink: 0, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "1rem", color: "#fff",
            background: `linear-gradient(140deg, ${r.col}, color-mix(in srgb, ${r.col} 80%, transparent))`,
            boxShadow: `0 4px 12px color-mix(in srgb, ${r.col} 33%, transparent)`,
            animation: `tut-stamp 2.8s cubic-bezier(.34,1.56,.64,1) ${r.d + 0.3}s infinite`,
          }}>{r.g}</span>
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--sb-fg)" }}>{r.lab}</span>
        </div>
      ))}
      <p style={{ margin: "0.15rem 0 0", fontSize: "0.66rem", color: "var(--sb-fg-muted)", textAlign: "center", lineHeight: 1.35 }}>
        La lettera arriva solo se rispondi a <b style={{ color: VIOLA }}>tutte</b> le domande del pacchetto.
      </p>
    </div>
  );
}

export const TRIVIA_INTRO: IntroStep[] = [
  {
    title: "Tre tipi di domanda",
    body: "Scelta multipla, vero o falso e completamento. Nel completamento scrivi tu la risposta: accetta piccoli errori di battitura, quindi vai tranquillo.",
    visual: <TypesVisual />,
  },
  {
    title: "Non sei mai senza riferimenti",
    body: "Sopra ogni domanda trovi sempre argomento, autore ed edificio. Niente più «ma quale chiesa?»: il contesto è sempre lì, a colpo d'occhio.",
    visual: <ContextVisual />,
  },
  {
    title: "Più giusto e veloce, più punti",
    body: "Hai 20 secondi a domanda. Ogni risposta corretta vale punti, con un bonus che cresce quanto più rispondi in fretta.",
    visual: <ScoreVisual />,
  },
  {
    title: "Streak e classifica live",
    body: "Le risposte corrette di fila accendono la streak e sbloccano trofei. Il tuo punteggio entra subito nella classifica live di tutti i giocatori.",
    visual: <StreakVisual />,
  },
  {
    title: "Esplora tutto il database",
    body: "Ogni capitolo tiene il conto delle domande viste (le «25/25»). Quando lo completi diventa viola e la percentuale di database esplorato sale.",
    visual: <CoverageVisual />,
  },
  {
    title: "Voti e pagella",
    body: "Ogni argomento riceve un voto da F ad A+ per ciascun tipo di domanda — ma solo se lo completi al 100%. Tutti i voti restano salvati nella tua pagella.",
    visual: <GradeVisual />,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// Keyframes condivise dai visual. Iniettate una sola volta (id univoco) così da
// non duplicarle ad ogni cambio di passo.
// ════════════════════════════════════════════════════════════════════════════
export const TUTORIAL_KEYFRAMES = (
  <style id="trivia-tutorial-keyframes">{`
    /* Passo 1 — card */
    @keyframes tut-card-in {
      from { opacity: 0; transform: translateY(26px) rotateX(28deg) scale(0.9); }
      to   { opacity: 1; transform: translateY(0) rotateX(0) scale(1); }
    }
    @keyframes tut-float {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-7px); }
    }
    @keyframes tut-pop {
      0%,100% { transform: scale(0); opacity: 0; }
      40%,70% { transform: scale(1); opacity: 1; }
    }
    @keyframes tut-flip {
      0%,100% { transform: rotateY(0deg); }
      50%     { transform: rotateY(180deg); }
    }
    @keyframes tut-draw {
      0%,30%  { stroke-dashoffset: 26; }
      55%,100%{ stroke-dashoffset: 0; }
    }
    @keyframes tut-type {
      0%   { width: 0; }
      80%  { width: 20px; }
      100% { width: 0; }
    }
    @keyframes tut-caret {
      0%,80% { transform: translateX(0); opacity: 1; }
      40%    { transform: translateX(20px); }
      90%,100% { transform: translateX(0); opacity: 0.4; }
    }

    /* Passo 2 — anello voto + bonus */
    @keyframes tut-ring {
      0%   { stroke-dashoffset: 327; }   /* C ≈ 327 (vuoto) */
      45%,100% { stroke-dashoffset: var(--ring-target); }
    }
    @keyframes tut-grade-pop {
      0%   { transform: scale(0.6); opacity: 0; }
      45%  { transform: scale(1.18); opacity: 1; }
      60%  { transform: scale(1); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes tut-drain {
      0%   { width: 100%; }
      100% { width: 8%; }
    }
    @keyframes tut-blink {
      0%,45% { opacity: 0; transform: translateY(-3px); }
      55%    { opacity: 1; transform: translateY(0); }
      100%   { opacity: 1; }
    }
    @keyframes tut-orbit {
      0%   { transform: rotate(0deg) translateX(58px) rotate(0deg); opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 1; }
      100% { transform: rotate(360deg) translateX(58px) rotate(-360deg); opacity: 0; }
    }

    /* Passo 3 — streak + classifica */
    @keyframes tut-flame {
      0%,100% { transform: translateY(0) scale(1); }
      30%     { transform: translateY(-5px) scale(1.14) rotate(-4deg); }
      60%     { transform: translateY(-2px) scale(1.05) rotate(3deg); }
    }
    @keyframes tut-mult {
      0%,70%,100% { transform: scale(1); }
      78%         { transform: scale(1.45) rotate(-6deg); }
      86%         { transform: scale(0.92); }
    }
    @keyframes tut-trophy {
      0%,60%,100% { transform: translateY(0) rotate(0); }
      72%         { transform: translateY(-10px) rotate(8deg); }
      84%         { transform: translateY(0) rotate(-5deg); }
    }
    @keyframes tut-row-in {
      from { opacity: 0; transform: translateX(-14px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes tut-rank-rise {
      0%   { transform: translateY(28px) scale(0.96); }
      35%  { transform: translateY(0) scale(1.03); }
      45%  { transform: scale(1); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes tut-bar-grow {
      0%   { width: 30%; }
      40%,100% { width: 92%; }
    }

    /* Passo contesto / copertura / pagella */
    @keyframes tut-pop-soft {
      0%,100% { transform: scale(1); }
      50%     { transform: scale(1.06); }
    }
    @keyframes tut-fill-68 {
      0%   { width: 6%; }
      45%,100% { width: 68%; }
    }
    @keyframes tut-badge-pop {
      0%,70%,100% { transform: scale(1); }
      80%         { transform: scale(1.18); }
    }
    @keyframes tut-stamp {
      0%   { transform: scale(1.6) rotate(-12deg); opacity: 0; }
      18%  { transform: scale(0.92) rotate(3deg); opacity: 1; }
      30%  { transform: scale(1) rotate(0deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .gt-scene * { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; }
    }
  `}</style>
);
