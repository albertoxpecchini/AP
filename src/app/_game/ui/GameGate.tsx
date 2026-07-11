import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteLink as Link } from "../../site/nav";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { checkNickname } from "../nickname";
import { fetchPlayers, upsertPlayer, getAccountNick, type Player } from "../../../lib/players";
import type { GameAccent } from "./tokens";

// ─── MOTORE GIOCHI · GameGate (schermata nickname, look "dark premium") ──────
//
// Componente condiviso da TUTTI i giochi: prima ogni gioco aveva la propria
// copia di NicknameGate (~225 righe × 4, quasi identiche). Ora il gate vive qui
// una volta sola; ogni gioco passa solo la sua identità (accento neon, titolo,
// icona) e la sua funzione di storage del nick.
//
// "Login col nome": il nome scelto crea/aggiorna un account condiviso su
// Supabase (tabella `players`), così da qualsiasi dispositivo ci si rilogga
// selezionandolo dalla lista.

export interface GameGateProps {
  /** Tema scuro (default del look). Se false, variante chiara pulita. */
  dark: boolean;
  /** Accento neon d'identità del gioco (vedi ACCENTS in tokens.ts). */
  accent: GameAccent;
  /** Nome del gioco mostrato grande (es. "TRIVIA"). */
  title: ReactNode;
  /** Riga sotto il titolo. */
  tagline?: string;
  /** Icona del gioco (es. <BrainCircuit size={44} />). */
  icon: ReactNode;
  /** Salva il nick per QUESTO gioco (chiave propria, da makeNickStorage). */
  storeNick: (nick: string) => void;
  initial?: string;
  onConfirm: (nick: string) => void;
  /** Dove torna il link "indietro" (default: home progetti). */
  backTo?: string;
}

export default function GameGate({
  dark, accent, title, tagline = "Scegli il tuo nickname per giocare",
  icon, storeNick, initial = "", onConfirm, backTo = "/#progetti",
}: GameGateProps) {
  const [value, setValue] = useState(initial || getAccountNick());
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { fetchPlayers().then(setPlayers).catch(() => {}); }, []);

  const enter = (nick: string) => {
    storeNick(nick);
    void upsertPlayer(nick);   // crea/aggiorna l'account condiviso su Supabase
    onConfirm(nick);
  };

  const submit = () => {
    const res = checkNickname(value);
    if (!res.ok) { setError(res.message || "Nickname non valido"); setTouched(true); return; }
    enter(res.value);
  };

  const onChange = (raw: string) => {
    const v = raw.slice(0, 10);
    setValue(v);
    if (touched) {
      const res = checkNickname(v);
      setError(res.ok ? "" : (res.message || ""));
    }
  };

  return (
    <div
      className={`gg${dark ? " gg-dark" : " gg-light"}`}
      style={{ ["--accent" as any]: accent.accent, ["--glow" as any]: accent.glow }}
    >
      <div className="gg-hero">
        <div className="gg-logo">{icon}</div>
        <h1 className="gg-title">{title}</h1>
        <p className="gg-tag">{tagline}</p>
      </div>

      <div className="gg-card">
        <label className="gg-label">
          <User size={14} /> Nickname (max 10 lettere)
        </label>

        <div className={`gg-inputwrap${error ? " err" : ""}`}>
          <input
            ref={inputRef}
            className="gg-input"
            value={value}
            maxLength={10}
            placeholder="Es. Alberto"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
          />
          <span className="gg-count">{value.length}/10</span>
        </div>

        <div className="gg-msg">{error || " "}</div>

        <button type="button" className="gg-go" onClick={submit}>
          Entra <ArrowRight size={18} />
        </button>

        {players.length > 0 && (
          <div className="gg-accounts">
            <div className="gg-accounts-label">Oppure entra con un nome già usato</div>
            <div className="gg-accounts-list">
              {players.map(p => (
                <button
                  key={p.nick}
                  type="button"
                  className="gg-chip"
                  onClick={() => enter(p.nick.slice(0, 10))}
                  title={`Entra come ${p.nick}`}
                >
                  <User size={12} /> {p.nick}
                </button>
              ))}
            </div>
          </div>
        )}

        <Link to={backTo} className="gg-back">
          <ArrowLeft size={14} /> Torna ai progetti
        </Link>

        <p className="gg-note">
          Il tuo nickname comparirà nella classifica live di tutti i giocatori.
        </p>
      </div>

      <style>{`
        .gg {
          position: fixed; inset: 0; z-index: 250;
          font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1.6rem; padding: 1.5rem; overflow-y: auto;
          animation: gg-in .28s cubic-bezier(.2,.7,.2,1);
          --text: #f5f3f1; --sub: #8b98a6;
          --surface: rgba(255,255,255,0.05); --surface-bd: rgba(255,255,255,0.10);
          --field: rgba(255,255,255,0.04); --field-bd: rgba(255,255,255,0.14);
        }
        .gg-dark {
          color: var(--text);
          background:
            radial-gradient(115% 80% at 50% -8%, var(--glow) 0%, transparent 52%),
            linear-gradient(180deg, #241c22 0%, #1b151a 100%);
        }
        .gg-light {
          --text: #16201a; --sub: #5a6b62;
          --surface: #ffffff; --surface-bd: rgba(0,0,0,0.07);
          --field: rgba(0,0,0,0.02); --field-bd: rgba(0,0,0,0.12);
          color: var(--text);
          background:
            radial-gradient(115% 80% at 50% -8%, var(--glow) 0%, transparent 46%),
            linear-gradient(180deg, #f6f8fa 0%, #eef1f4 100%);
        }
        @keyframes gg-in { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none; } }

        .gg-hero { display:flex; flex-direction:column; align-items:center; gap:.55rem; }
        .gg-logo {
          display:inline-flex; padding:16px; border-radius:22px; color:#fff;
          background:linear-gradient(140deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, #000) 130%);
          box-shadow: 0 12px 40px var(--glow), inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .gg-title {
          margin:.4rem 0 0; line-height:1; font-weight:900;
          font-size:clamp(2.2rem,9vw,3.1rem); letter-spacing:.24em; padding-left:.24em;
          color: var(--accent);
          text-shadow: 0 0 26px var(--glow);
        }
        .gg-light .gg-title { text-shadow:none; }
        .gg-title span { color: var(--text); }
        .gg-tag { margin:0; font-size:.9rem; font-weight:600; color: var(--sub); }

        .gg-card {
          width:min(94vw,372px);
          border-radius:20px; padding:1.5rem 1.35rem 1.25rem;
          display:flex; flex-direction:column; gap:.5rem;
          background: var(--surface); border:1px solid var(--surface-bd);
          backdrop-filter: blur(18px) saturate(120%);
          -webkit-backdrop-filter: blur(18px) saturate(120%);
          box-shadow: 0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .gg-light .gg-card { box-shadow: 0 18px 50px rgba(20,40,30,0.12); }

        .gg-label {
          display:inline-flex; align-items:center; gap:.4rem; color: var(--sub);
          font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.07em;
        }
        .gg-inputwrap {
          display:flex; align-items:center; gap:.5rem;
          border:1.5px solid var(--field-bd); border-radius:14px;
          padding:.1rem .9rem; background: var(--field);
          transition:border-color .15s, box-shadow .15s;
        }
        .gg-inputwrap:focus-within { border-color: var(--accent); box-shadow:0 0 0 .22rem var(--glow); }
        .gg-inputwrap.err { border-color:#ff6b6b; box-shadow:0 0 0 .22rem rgba(255,107,107,.22); }
        .gg-input {
          flex:1; min-width:0; border:none; outline:none; background:transparent; color: var(--text);
          font-family:inherit; font-size:1.5rem; font-weight:800; letter-spacing:.02em; padding:.55rem 0;
        }
        .gg-input::placeholder { color: var(--sub); opacity:.55; }
        .gg-count { color: var(--sub); font-size:.78rem; font-weight:700; font-variant-numeric:tabular-nums; flex-shrink:0; }
        .gg-msg { min-height:1.1rem; font-size:.8rem; font-weight:700; color:#ff7b7b; padding-left:.2rem; }

        .gg-go {
          margin-top:.2rem; height:52px; width:100%;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          border:none; border-radius:14px; cursor:pointer; color: #ffffff;
          font-family:inherit; font-size:1.1rem; font-weight:900;
          background:linear-gradient(100deg, #fff 0%, var(--accent) 28%, var(--accent) 100%);
          box-shadow:0 10px 30px var(--glow); transition:filter .12s, transform .12s;
        }
        .gg-go:hover { filter:brightness(1.06); transform:translateY(-1px); }
        .gg-go:active { transform:scale(.985); }

        .gg-accounts { margin-top:.7rem; display:flex; flex-direction:column; gap:.5rem; }
        .gg-accounts-label {
          color: var(--sub); text-align:center;
          font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
        }
        .gg-accounts-list {
          display:flex; flex-wrap:wrap; gap:.4rem; justify-content:center;
          max-height:128px; overflow-y:auto; padding:.1rem;
        }
        .gg-chip {
          display:inline-flex; align-items:center; gap:.3rem;
          border:1.5px solid var(--accent); border-radius:999px;
          background:transparent; color: var(--accent);
          font-family:inherit; font-size:.85rem; font-weight:800; cursor:pointer;
          padding:.32rem .7rem; transition:filter .12s, transform .12s, background .12s;
        }
        .gg-chip:hover { background: var(--glow); color: #ffffff; transform:translateY(-1px); }
        .gg-light .gg-chip:hover { color:#fff; }
        .gg-chip:active { transform:scale(.97); }

        .gg-back {
          display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
          margin-top:.3rem; padding:.5rem; font-size:.85rem; font-weight:700;
          text-decoration:none; border-radius:8px; color: var(--sub);
        }
        .gg-back:hover { color: var(--accent); }
        .gg-note { color: var(--sub); font-size:.72rem; text-align:center; margin:.3rem 0 0; line-height:1.4; }
      `}</style>
    </div>
  );
}
