import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { checkNickname } from "./nickname";

const NICK_KEY = "angoli-nick";

export function getStoredNick(): string {
  try { return (localStorage.getItem(NICK_KEY) || "").slice(0, 10); } catch { return ""; }
}
export function storeNick(nick: string) {
  try { localStorage.setItem(NICK_KEY, nick.slice(0, 10)); } catch {}
}

interface NicknameGateProps {
  dark: boolean;
  initial?: string;
  onConfirm: (nick: string) => void;
}

/**
 * Schermata "gate": prima di entrare in Angoli si sceglie un nickname
 * (max 10 lettere, niente parolacce). Overlay fixed sopra a tutto (z-250),
 * stesso look del menu (hero verde Kit Italia).
 */
export default function NicknameGate({ dark, initial = "", onConfirm }: NicknameGateProps) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    const res = checkNickname(value);
    if (!res.ok) { setError(res.message || "Nickname non valido"); setTouched(true); return; }
    storeNick(res.value);
    onConfirm(res.value);
  };

  const onChange = (raw: string) => {
    // hard-limit a 10 caratteri mentre si digita
    const v = raw.slice(0, 10);
    setValue(v);
    if (touched) {
      const res = checkNickname(v);
      setError(res.ok ? "" : (res.message || ""));
    }
  };

  const card = dark ? "#15231c" : "#ffffff";
  const bord = dark ? "rgba(95,208,154,0.22)" : "rgba(47,125,74,0.15)";
  const text = dark ? "#d4e8dc" : "#17271d";
  const sub  = dark ? "#a4c4aa" : "#4a5c50";

  return (
    <div className={`ang-gate${dark ? " dark" : ""}`}>
      <div className="ang-gate-hero">
        <div className="ang-gate-logo"><img src="/angoli-logo.png" alt="Angoli" /></div>
        <h1 className="ang-gate-title">ANG<span>OL</span>I</h1>
        <p className="ang-gate-tag">Scegli il tuo nickname per giocare</p>
      </div>

      <div className="ang-gate-body" style={{ background: card, border: `1px solid ${bord}` }}>
        <label className="ang-gate-label" style={{ color: sub }}>
          <User size={14} /> Nickname (max 10 lettere)
        </label>

        <div className={`ang-gate-inputwrap${error ? " err" : ""}`}>
          <input
            ref={inputRef}
            className="ang-gate-input"
            style={{ color: text }}
            value={value}
            maxLength={10}
            placeholder="Es. Alberto"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
          />
          <span className="ang-gate-count" style={{ color: sub }}>{value.length}/10</span>
        </div>

        <div className="ang-gate-msg">{error || " "}</div>

        <button type="button" className="ang-gate-go" onClick={submit}>
          Entra <ArrowRight size={18} />
        </button>

        <Link to="/#progetti" className="ang-gate-back" style={{ color: sub }}>
          <ArrowLeft size={14} /> Torna ai progetti
        </Link>

        <p className="ang-gate-note" style={{ color: sub }}>
          Il tuo nickname comparirà nella classifica live di tutti i giocatori.
        </p>
      </div>

      <style>{`
        .ang-gate {
          position: fixed; inset: 0; z-index: 250;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background: #f4f6f5;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1.5rem; padding: 1.5rem; overflow-y: auto;
          animation: ang-gate-in .25s ease;
        }
        .ang-gate.dark { background: #0e1512; }
        @keyframes ang-gate-in { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:none; } }

        .ang-gate-hero { display:flex; flex-direction:column; align-items:center; gap:.5rem; }
        .ang-gate-logo {
          background:#fff; border-radius:18px; padding:12px; display:inline-flex;
          box-shadow:0 8px 32px rgba(0,0,0,0.18);
        }
        .ang-gate-logo img { width:74px; height:74px; object-fit:contain; display:block; }
        .ang-gate-title {
          font-size:clamp(2.2rem,9vw,3rem); font-weight:900; letter-spacing:0.26em;
          margin:.4rem 0 0; line-height:1; color:#1a5030;
        }
        .ang-gate.dark .ang-gate-title { color:#6fe0a6; }
        .ang-gate-title span { color:#3a9e5f; }
        .ang-gate.dark .ang-gate-title span { color:#9ff0c2; }
        .ang-gate-tag { font-size:.9rem; color:#6b8070; margin:0; font-weight:600; }
        .ang-gate.dark .ang-gate-tag { color:#a4c4aa; }

        .ang-gate-body {
          width:min(94vw,360px);
          border-radius:16px; padding:1.4rem 1.3rem 1.2rem;
          display:flex; flex-direction:column; gap:.5rem;
          box-shadow:0 8px 30px rgba(0,0,0,0.12);
        }
        .ang-gate-label {
          display:inline-flex; align-items:center; gap:.4rem;
          font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em;
        }
        .ang-gate-inputwrap {
          display:flex; align-items:center; gap:.5rem;
          border:2px solid rgba(47,125,74,0.25); border-radius:12px;
          padding:.1rem .9rem; transition:border-color .15s, box-shadow .15s;
          background:rgba(0,0,0,0.015);
        }
        .ang-gate.dark .ang-gate-inputwrap { background:rgba(255,255,255,0.03); border-color:rgba(95,208,154,0.25); }
        .ang-gate-inputwrap:focus-within { border-color:#2F7D4A; box-shadow:0 0 0 .2rem rgba(47,125,74,.18); }
        .ang-gate-inputwrap.err { border-color:#c0392b; box-shadow:0 0 0 .2rem rgba(192,57,43,.15); }
        .ang-gate-input {
          flex:1; min-width:0; border:none; outline:none; background:transparent;
          font-family:inherit; font-size:1.5rem; font-weight:800; letter-spacing:.02em;
          padding:.55rem 0;
        }
        .ang-gate-count { font-size:.78rem; font-weight:700; font-variant-numeric:tabular-nums; flex-shrink:0; }
        .ang-gate-msg {
          min-height:1.1rem; font-size:.8rem; font-weight:700; color:#c0392b;
          padding-left:.2rem;
        }
        .ang-gate-go {
          margin-top:.2rem; height:50px; width:100%;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:#2F7D4A; color:#fff; border:none; border-radius:12px;
          font-family:inherit; font-size:1.05rem; font-weight:800; cursor:pointer;
          box-shadow:0 6px 20px rgba(47,125,74,0.35); transition:filter .12s, transform .12s;
        }
        .ang-gate-go:hover { filter:brightness(.92); transform:translateY(-1px); }
        .ang-gate-go:active { transform:scale(.98); }
        .ang-gate-back {
          display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
          margin-top:.3rem; padding:.5rem; font-size:.85rem; font-weight:700;
          text-decoration:none; border-radius:8px;
        }
        .ang-gate-back:hover { filter:brightness(.85); }
        .ang-gate-note { font-size:.72rem; text-align:center; margin:.3rem 0 0; line-height:1.4; }
      `}</style>
    </div>
  );
}
