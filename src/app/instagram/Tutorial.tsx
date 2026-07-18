import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial "Come scaricare i tuoi dati da Instagram" — overlay a slide, con
// mockup SVG che ricordano le schermate del Centro gestione account di Meta
// («Le tue informazioni», «Scarica le tue informazioni»…). Skippabile subito.
// Il finale rimanda al NOSTRO strumento (dove mettere ciascun file), non a siti
// esterni. I testi sono in italiano: il motore i18n del sito li traduce.
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitive SVG delle schermate (schematiche, con i nomi veri dei pulsanti) ──
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 260 384" className="tut-svg" role="img" aria-hidden="true">
      <rect x="4" y="4" width="252" height="376" rx="28" fill="#0c0c11" />
      <rect x="11" y="11" width="238" height="362" rx="22" fill="#ffffff" />
      <rect x="104" y="17" width="52" height="7" rx="3.5" fill="#0c0c11" />
      {children}
    </svg>
  );
}

function Row({ y, label, hi, check }: { y: number; label: string; hi?: boolean; check?: boolean }) {
  return (
    <g>
      <rect x="22" y={y} width="216" height="32" rx="8" fill="#f6f6f8"
        stroke={hi ? "#e95420" : "#e6e6ea"} strokeWidth={hi ? 2.5 : 1} />
      <rect x="31" y={y + 8} width="16" height="16" rx="4" fill="#dcdce2" />
      <text x="55" y={y + 21} fontSize="10.5" fill="#33333b">{label}</text>
      {check !== undefined && (
        <g>
          <rect x="214" y={y + 8} width="16" height="16" rx="4"
            fill={check ? "#1877F2" : "#fff"} stroke={check ? "#1877F2" : "#b8b8c0"} strokeWidth="1.5" />
          {check && <path d={`M217 ${y + 16} l3 3 l6 -7`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      )}
      {hi && <text x="228" y={y + 24} fontSize="17">👆</text>}
    </g>
  );
}

function Primary({ label }: { label: string }) {
  const y = 322;
  return (
    <g>
      <rect x="22" y={y} width="216" height="34" rx="17" fill="#1877F2" />
      <text x="130" y={y + 22} fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle">{label}</text>
      <rect x="19" y={y - 3} width="222" height="40" rx="20" fill="none" stroke="#e95420" strokeWidth="2.5" />
      <text x="214" y={y + 27} fontSize="18">👆</text>
    </g>
  );
}

function ScreenTitle({ t }: { t: string }) {
  return <text x="22" y="46" fontSize="13" fontWeight="700" fill="#1c1c22">{t}</text>;
}

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);

  // Ogni slide: mockup SVG + testo. I nomi in grassetto sono i pulsanti reali.
  const slides: { svg: React.ReactNode; title: string; body: React.ReactNode }[] = [
    {
      title: "Scarica i tuoi 2 file da Instagram",
      body: (
        <>
          <p>Per il confronto servono i file <b>following.html</b> (chi segui) e <b>followers.html</b> (chi ti segue). Te li dà Instagram stesso: è il modo più preciso e sicuro.</p>
          <p className="tut-note">Ti guido dall'app sul telefono. Da computer (sito web) le parole sono identiche, cambia solo la posizione sullo schermo. Puoi saltare quando vuoi.</p>
        </>
      ),
      svg: (
        <Phone>
          <circle cx="130" cy="150" r="46" fill="none" stroke="url(#igg)" strokeWidth="7" />
          <circle cx="130" cy="150" r="24" fill="none" stroke="url(#igg)" strokeWidth="7" />
          <circle cx="150" cy="128" r="6" fill="#d62976" />
          <text x="130" y="240" fontSize="13" fontWeight="700" fill="#1c1c22" textAnchor="middle">Instagram</text>
          <text x="130" y="262" fontSize="10.5" fill="#8a8a93" textAnchor="middle">I tuoi dati, esportati da te</text>
          <defs>
            <linearGradient id="igg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#feda75" /><stop offset=".5" stopColor="#d62976" /><stop offset="1" stopColor="#4f5bd5" />
            </linearGradient>
          </defs>
        </Phone>
      ),
    },
    {
      title: "Profilo → menu → Impostazioni",
      body: (
        <>
          <p>Apri il tuo <b>profilo</b> (icona in basso a destra). In alto a destra premi le <b>tre lineette ☰</b>.</p>
          <p>Dal menu che si apre, in fondo, premi <b>Impostazioni e privacy</b>.</p>
        </>
      ),
      svg: (
        <Phone>
          <text x="22" y="40" fontSize="13" fontWeight="700" fill="#1c1c22">Il tuo profilo</text>
          {/* hamburger evidenziato */}
          <g>
            <rect x="205" y="28" width="30" height="24" rx="6" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
            <line x1="212" y1="36" x2="228" y2="36" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="40" x2="228" y2="40" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="44" x2="228" y2="44" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
            <text x="238" y="26" fontSize="17">👆</text>
          </g>
          <circle cx="45" cy="82" r="20" fill="#eee" stroke="#dcdce2" />
          <Row y={120} label="Impostazioni e privacy" hi />
          <Row y={160} label="La tua attività" />
          <Row y={200} label="Archivio" />
          {/* bottom nav con profilo evidenziato */}
          <line x1="11" y1="336" x2="249" y2="336" stroke="#eee" />
          <circle cx="220" cy="356" r="11" fill="none" stroke="#e95420" strokeWidth="2.5" />
        </Phone>
      ),
    },
    {
      title: "Scarica le tue informazioni",
      body: (
        <p>Scorri fino al gruppo <b>«Le tue informazioni e autorizzazioni»</b> e premi <b>Scarica le tue informazioni</b>.</p>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="Le tue informazioni e autorizzazioni" />
          <Row y={70} label="Scarica le tue informazioni" hi />
          <Row y={110} label="Trasferisci le tue informazioni" />
          <Row y={150} label="Autorizzazioni per le app" />
          <Row y={190} label="Cronologia dei link" />
        </Phone>
      ),
    },
    {
      title: "Scarica o trasferisci informazioni",
      body: (
        <p>Premi <b>Scarica o trasferisci informazioni</b>. Scegli il tuo profilo, poi premi <b>Avanti</b>.</p>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="Scarica le tue informazioni" />
          <Row y={70} label="Scarica o trasferisci informazioni" hi />
          <circle cx="40" cy="150" r="16" fill="#eee" stroke="#dcdce2" />
          <text x="66" y="155" fontSize="10.5" fill="#33333b">Il tuo profilo</text>
          <rect x="214" y="142" width="16" height="16" rx="8" fill="#1877F2" />
          <Primary label="Avanti" />
        </Phone>
      ),
    },
    {
      title: "Solo «Followers e following»",
      body: (
        <>
          <p>Se <b>Seleziona tutto</b> è spuntato, premilo per <b>togliere</b> tutte le spunte.</p>
          <p>Poi premi su <b>Connessioni</b> e spunta solo <b>Followers e following</b>. Premi <b>Avanti</b>.</p>
        </>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="Seleziona informazioni" />
          <Row y={64} label="Seleziona tutto" check={false} />
          <Row y={104} label="Connessioni" hi />
          <Row y={144} label="Followers e following" check />
          <Row y={184} label="Storie" check={false} />
          <Primary label="Avanti" />
        </Phone>
      ),
    },
    {
      title: "Formato HTML → Inoltra",
      body: (
        <p>Alla voce <b>Formato</b> scegli <b>HTML</b> (non JSON). Poi premi <b>Inoltra richiesta</b>.</p>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="Formato del file" />
          <Row y={70} label="HTML  (facile da leggere)" hi />
          <Row y={110} label="JSON  (per sviluppatori)" check={false} />
          <text x="22" y="176" fontSize="10.5" fill="#8a8a93">Intervallo di date: Tutto</text>
          <Primary label="Inoltra richiesta" />
        </Phone>
      ),
    },
    {
      title: "Attendi, poi scarica lo ZIP",
      body: (
        <>
          <p>Instagram prepara il file: da 10 minuti a qualche ora. Ricevi <b>notifica ed email</b> quando è pronto.</p>
          <p>Torna nella stessa pagina, premi <b>Scarica</b>, inserisci la password: parte un file <b>.zip</b>.</p>
        </>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="Richieste disponibili" />
          <rect x="22" y="64" width="216" height="56" rx="10" fill="#f6f6f8" stroke="#e6e6ea" />
          <rect x="32" y="76" width="20" height="20" rx="4" fill="#1877F2" />
          <text x="60" y="84" fontSize="10.5" fill="#33333b">Informazioni pronte</text>
          <text x="60" y="102" fontSize="9" fill="#8a8a93">instagram_tuonome.zip</text>
          <g>
            <rect x="150" y="128" width="88" height="30" rx="15" fill="#1877F2" />
            <text x="194" y="147" fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle">Scarica</text>
            <rect x="147" y="125" width="94" height="36" rx="18" fill="none" stroke="#e95420" strokeWidth="2.5" />
            <text x="222" y="152" fontSize="17">👆</text>
          </g>
        </Phone>
      ),
    },
    {
      title: "Trova i 2 file .html",
      body: (
        <>
          <p>Apri (estrai) lo ZIP <b>instagram_tuonome.zip</b>. Entra nella cartella <b>connections</b> → <b>followers_and_following</b>.</p>
          <p>Lì ci sono i tuoi file: <b>following.html</b> e <b>followers.html</b>.</p>
        </>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="instagram_tuonome" />
          <g fill="#f6f6f8" stroke="#e6e6ea">
            <rect x="22" y="66" width="216" height="30" rx="8" />
            <rect x="22" y="104" width="216" height="30" rx="8" />
          </g>
          <text x="40" y="86" fontSize="10.5" fill="#33333b">📁 connections</text>
          <text x="52" y="124" fontSize="10.5" fill="#33333b">📁 followers_and_following</text>
          <g>
            <rect x="40" y="146" width="198" height="30" rx="8" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
            <text x="52" y="166" fontSize="10.5" fill="#1c1c22">📄 following.html</text>
            <rect x="40" y="184" width="198" height="30" rx="8" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
            <text x="52" y="204" fontSize="10.5" fill="#1c1c22">📄 followers.html</text>
          </g>
        </Phone>
      ),
    },
    {
      title: "Torna qui e confronta",
      body: (
        <>
          <p>Ci siamo! In questa pagina:</p>
          <p>• <b>following.html</b> → riquadro <b>«I miei seguiti»</b> (a sinistra)</p>
          <p>• <b>followers.html</b> → riquadro <b>«I miei follower»</b> (a destra)</p>
          <p>Carica i file (o incolla), poi premi <b>Confronta</b>. Il resto lo faccio io.</p>
        </>
      ),
      svg: (
        <Phone>
          <ScreenTitle t="Compare Two Lists" />
          <rect x="22" y="64" width="102" height="150" rx="10" fill="#fff" stroke="#e95420" strokeWidth="2" />
          <text x="30" y="84" fontSize="9.5" fontWeight="700" fill="#1c1c22">I miei seguiti</text>
          <text x="30" y="100" fontSize="8" fill="#8a8a93">following.html</text>
          <rect x="136" y="64" width="102" height="150" rx="10" fill="#fff" stroke="#e6e6ea" strokeWidth="2" />
          <text x="144" y="84" fontSize="9.5" fontWeight="700" fill="#1c1c22">I miei follower</text>
          <text x="144" y="100" fontSize="8" fill="#8a8a93">followers.html</text>
          <Primary label="Confronta" />
        </Phone>
      ),
    },
  ];

  const n = slides.length;
  const last = i === n - 1;
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);
  const next = useCallback(() => setI((v) => Math.min(n - 1, v + 1)), [n]);

  // Tastiera: Esc chiude, frecce navigano.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, next, prev]);

  const slide = slides[i];

  return (
    <div className="tut-overlay" role="dialog" aria-modal="true" aria-label="Come scaricare i dati da Instagram" onClick={onClose}>
      <div className="tut-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tut-skip" onClick={onClose} type="button">
          <span>Salta</span><X size={16} />
        </button>

        <div className="tut-art">{slide.svg}</div>

        <div className="tut-body">
          <div className="tut-step" translate="no">{i + 1} / {n}</div>
          <h2 className="tut-title">{slide.title}</h2>
          <div className="tut-text">{slide.body}</div>
        </div>

        <div className="tut-nav">
          <button className="tut-btn" onClick={prev} disabled={i === 0} type="button">
            <ChevronLeft size={16} /><span>Indietro</span>
          </button>
          <div className="tut-dots" aria-hidden="true">
            {slides.map((_, k) => <span key={k} className={"tut-dot" + (k === i ? " on" : "")} />)}
          </div>
          {last ? (
            <button className="tut-btn tut-btn--primary" onClick={onClose} type="button">
              <span>Ho capito, inizia</span>
            </button>
          ) : (
            <button className="tut-btn tut-btn--primary" onClick={next} type="button">
              <span>Avanti</span><ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        .tut-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: rgba(10, 6, 4, 0.62); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
          animation: tut-fade .2s ease both;
        }
        @keyframes tut-fade { from { opacity: 0 } to { opacity: 1 } }
        .tut-modal {
          position: relative; width: 100%; max-width: 760px; max-height: 92vh; overflow: auto;
          background: var(--card, #fff); color: var(--foreground, #1c1a17);
          border: 1px solid var(--border, rgba(0,0,0,.12)); border-radius: 18px;
          box-shadow: 0 30px 80px rgba(0,0,0,.45); padding: clamp(18px, 3vw, 28px);
          display: grid; grid-template-columns: 240px 1fr; grid-template-areas: "art body" "nav nav";
          gap: 8px 26px; align-items: center;
          animation: tut-pop .25s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes tut-pop { from { opacity: 0; transform: translateY(14px) scale(.98) } to { opacity: 1; transform: none } }
        @media (max-width: 620px) {
          .tut-modal { grid-template-columns: 1fr; grid-template-areas: "art" "body" "nav"; gap: 12px; text-align: center; }
        }
        .tut-skip {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--secondary, #eae7e0); color: var(--muted-foreground, #8a8478);
          border: 1px solid var(--border, rgba(0,0,0,.12)); border-radius: 999px;
          padding: 5px 12px; font-size: .82rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .tut-skip:hover { color: var(--primary, #e95420); border-color: var(--primary, #e95420); }
        .tut-art { grid-area: art; display: flex; justify-content: center; }
        .tut-svg { width: 100%; max-width: 240px; height: auto; filter: drop-shadow(0 12px 28px rgba(0,0,0,.22)); }
        .tut-body { grid-area: body; min-width: 0; }
        .tut-step { font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--primary, #e95420); margin-bottom: .4rem; }
        .tut-title { margin: 0 0 .6rem; font-size: clamp(1.25rem, 3vw, 1.6rem); font-weight: 700; line-height: 1.15; }
        .tut-text p { margin: 0 0 .55rem; font-size: .98rem; line-height: 1.55; color: var(--foreground, #2a2833); }
        .tut-text b { color: var(--primary, #c2410c); }
        .tut-note { font-size: .84rem !important; color: var(--muted-foreground, #77716b) !important; background: rgba(233,84,32,.07); border-radius: 8px; padding: .5rem .65rem; }
        .tut-nav { grid-area: nav; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--border, rgba(0,0,0,.1)); }
        .tut-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: transparent; color: var(--foreground, #2a2833);
          border: 1px solid var(--border, rgba(0,0,0,.18)); border-radius: 10px;
          padding: .55rem .9rem; font-size: .9rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .tut-btn:hover:not(:disabled) { border-color: var(--primary, #e95420); color: var(--primary, #c2410c); }
        .tut-btn:disabled { opacity: .4; cursor: not-allowed; }
        .tut-btn--primary { background: var(--primary, #e95420); color: #fff; border-color: var(--primary, #e95420); }
        .tut-btn--primary:hover { filter: brightness(1.06); color: #fff; }
        .tut-dots { display: flex; gap: 6px; }
        .tut-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border, #ccc); transition: background .2s, transform .2s; }
        .tut-dot.on { background: var(--primary, #e95420); transform: scale(1.3); }
      `}</style>
    </div>
  );
}
