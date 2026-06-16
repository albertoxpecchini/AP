import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, User, BrainCircuit } from "lucide-react";
import { checkNickname, storeNick } from "./nickname";
import { fetchPlayers, upsertPlayer, getAccountNick, type Player } from "../../lib/players";

export { getStoredNick, storeNick } from "./nickname";

interface NicknameGateProps {
  dark: boolean;
  initial?: string;
  onConfirm: (nick: string) => void;
}

/**
 * Schermata "gate": premendo "Gioca" si sceglie un nickname (max 10 lettere,
 * niente parolacce) prima di entrare. Overlay fixed sopra a tutto (z-250),
 * stesso look del menu (hero verde Kit Italia). Gemello di angoli/NicknameGate.
 *
 * "Login col nome": il nome scelto crea/aggiorna un account su Supabase
 * (tabella `players`), così da qualsiasi dispositivo puoi loggarti
 * riselezionandolo dalla lista qui sotto.
 */
export default function NicknameGate({ dark, initial = "", onConfirm }: NicknameGateProps) {
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

  const card = dark ? "#15231c" : "#ffffff";
  const bord = dark ? "rgba(95,208,154,0.22)" : "rgba(47,125,74,0.15)";
  const text = dark ? "#d4e8dc" : "#17271d";
  const sub  = dark ? "#a4c4aa" : "#4a5c50";

  return (
    <div className={`trv-gate${dark ? " dark" : ""}`}>
      <div className="trv-gate-hero">
        <div className="trv-gate-logo"><BrainCircuit size={46} /></div>
        <h1 className="trv-gate-title">TRI<span>VI</span>A</h1>
        <p className="trv-gate-tag">Scegli il tuo nickname per giocare</p>
      </div>

      <div className="trv-gate-body" style={{ background: card, border: `1px solid ${bord}` }}>
        <label className="trv-gate-label" style={{ color: sub }}>
          <User size={14} /> Nickname (max 10 lettere)
        </label>

        <div className={`trv-gate-inputwrap${error ? " err" : ""}`}>
          <input
            ref={inputRef}
            className="trv-gate-input"
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
          <span className="trv-gate-count" style={{ color: sub }}>{value.length}/10</span>
        </div>

        <div className="trv-gate-msg">{error || " "}</div>

        <button type="button" className="trv-gate-go" onClick={submit}>
          Entra <ArrowRight size={18} />
        </button>

        {players.length > 0 && (
          <div className="trv-gate-accounts">
            <div className="trv-gate-accounts-label" style={{ color: sub }}>
              Oppure entra con un nome già usato
            </div>
            <div className="trv-gate-accounts-list">
              {players.map(p => (
                <button
                  key={p.nick}
                  type="button"
                  className="trv-gate-chip"
                  onClick={() => enter(p.nick.slice(0, 10))}
                  title={`Entra come ${p.nick}`}
                >
                  <User size={12} /> {p.nick}
                </button>
              ))}
            </div>
          </div>
        )}

        <Link to="/#progetti" className="trv-gate-back" style={{ color: sub }}>
          <ArrowLeft size={14} /> Torna ai progetti
        </Link>

        <p className="trv-gate-note" style={{ color: sub }}>
          Il tuo nickname comparirà nella classifica live di tutti i giocatori.
        </p>
      </div>

      <style>{`
        .trv-gate {
          position: fixed; inset: 0; z-index: 250;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background: #f4f6f5;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1.5rem; padding: 1.5rem; overflow-y: auto;
          animation: trv-gate-in .25s ease;
        }
        .trv-gate.dark { background: #0e1512; }
        @keyframes trv-gate-in { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:none; } }

        .trv-gate-hero { display:flex; flex-direction:column; align-items:center; gap:.5rem; }
        .trv-gate-logo {
          background:linear-gradient(140deg,#7c3aed 0%,#5b21b6 55%,#1a5030 130%);
          color:#fff; border-radius:20px; padding:16px; display:inline-flex;
          box-shadow:0 10px 32px rgba(91,33,182,0.4);
        }
        .trv-gate.dark .trv-gate-logo { box-shadow:0 10px 32px rgba(91,33,182,0.5); }
        .trv-gate-title {
          font-size:clamp(2.2rem,9vw,3rem); font-weight:900; letter-spacing:0.26em;
          margin:.4rem 0 0; line-height:1; color:#1a5030;
        }
        .trv-gate.dark .trv-gate-title { color:#6fe0a6; }
        .trv-gate-title span { color:#7c3aed; }
        .trv-gate.dark .trv-gate-title span { color:#b794ff; }
        .trv-gate-tag { font-size:.9rem; color:#6b8070; margin:0; font-weight:600; }
        .trv-gate.dark .trv-gate-tag { color:#a4c4aa; }

        .trv-gate-body {
          width:min(94vw,360px);
          border-radius:16px; padding:1.4rem 1.3rem 1.2rem;
          display:flex; flex-direction:column; gap:.5rem;
          box-shadow:0 8px 30px rgba(0,0,0,0.12);
        }
        .trv-gate-label {
          display:inline-flex; align-items:center; gap:.4rem;
          font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em;
        }
        .trv-gate-inputwrap {
          display:flex; align-items:center; gap:.5rem;
          border:2px solid rgba(47,125,74,0.25); border-radius:12px;
          padding:.1rem .9rem; transition:border-color .15s, box-shadow .15s;
          background:rgba(0,0,0,0.015);
        }
        .trv-gate.dark .trv-gate-inputwrap { background:rgba(255,255,255,0.03); border-color:rgba(155,92,246,0.3); }
        .trv-gate-inputwrap:focus-within { border-color:#7c3aed; box-shadow:0 0 0 .2rem rgba(124,58,237,.2); }
        .trv-gate-inputwrap.err { border-color:#c0392b; box-shadow:0 0 0 .2rem rgba(192,57,43,.15); }
        .trv-gate-input {
          flex:1; min-width:0; border:none; outline:none; background:transparent;
          font-family:inherit; font-size:1.5rem; font-weight:800; letter-spacing:.02em;
          padding:.55rem 0;
        }
        .trv-gate-count { font-size:.78rem; font-weight:700; font-variant-numeric:tabular-nums; flex-shrink:0; }
        .trv-gate-msg {
          min-height:1.1rem; font-size:.8rem; font-weight:700; color:#c0392b;
          padding-left:.2rem;
        }
        .trv-gate-go {
          margin-top:.2rem; height:52px; width:100%;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:linear-gradient(100deg,#7c3aed 0%,#5b21b6 45%,#2F7D4A 100%); color:#fff; border:none; border-radius:13px;
          font-family:inherit; font-size:1.1rem; font-weight:900; cursor:pointer;
          box-shadow:0 6px 22px rgba(91,33,182,0.4); transition:filter .12s, transform .12s;
        }
        .trv-gate-go:hover { filter:brightness(.92); transform:translateY(-1px); }
        .trv-gate-go:active { transform:scale(.98); }
        .trv-gate-back {
          display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
          margin-top:.3rem; padding:.5rem; font-size:.85rem; font-weight:700;
          text-decoration:none; border-radius:8px;
        }
        .trv-gate-back:hover { filter:brightness(.85); }
        .trv-gate-note { font-size:.72rem; text-align:center; margin:.3rem 0 0; line-height:1.4; }

        .trv-gate-accounts { margin-top:.7rem; display:flex; flex-direction:column; gap:.5rem; }
        .trv-gate-accounts-label {
          font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;
          text-align:center;
        }
        .trv-gate-accounts-list {
          display:flex; flex-wrap:wrap; gap:.4rem; justify-content:center;
          max-height:128px; overflow-y:auto; padding:.1rem;
        }
        .trv-gate-chip {
          display:inline-flex; align-items:center; gap:.3rem;
          border:1.5px solid rgba(124,58,237,0.32); border-radius:999px;
          background:rgba(124,58,237,0.07); color:#6d28d9;
          font-family:inherit; font-size:.85rem; font-weight:800; cursor:pointer;
          padding:.32rem .7rem; transition:filter .12s, transform .12s, background .12s;
        }
        .trv-gate.dark .trv-gate-chip {
          border-color:rgba(155,92,246,0.34); background:rgba(155,92,246,0.1); color:#c4a5ff;
        }
        .trv-gate-chip:hover { background:rgba(124,58,237,0.15); transform:translateY(-1px); }
        .trv-gate.dark .trv-gate-chip:hover { background:rgba(155,92,246,0.18); }
        .trv-gate-chip:active { transform:scale(.97); }
      `}</style>
    </div>
  );
}
