import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { checkNickname, storeNick } from "./nickname";
import { fetchPlayers, upsertPlayer, getAccountNick, type Player } from "../../lib/players";
import { MappaMark } from "./MappaMenu";

export { getStoredNick, storeNick } from "./nickname";

interface NicknameGateProps {
  dark: boolean;
  initial?: string;
  onConfirm: (nick: string) => void;
}

/**
 * Schermata "gate": premendo "Gioca" si sceglie un nickname (max 10 lettere,
 * niente parolacce) prima di entrare. Overlay fixed sopra a tutto (z-250),
 * stesso look del menu (identità Trivia: viola+verde). Gemella di Trivia/Angoli.
 *
 * "Login col nome": il nome scelto crea/aggiorna un account su Supabase
 * (tabella `players` condivisa), così da qualsiasi dispositivo puoi loggarti
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

  const card = dark ? "#291d26" : "#ffffff";
  const bord = dark ? "rgba(237, 113, 67,0.22)" : "rgba(233, 84, 32,0.15)";
  const text = dark ? "#f5ede8" : "#17271d";
  const sub  = dark ? "#c9bcb4" : "#4a5c50";

  return (
    <div className={`mpg-gate${dark ? " dark" : ""}`}>
      <div className="mpg-gate-hero">
        <div className="mpg-gate-logo"><MappaMark size={46} /></div>
        <h1 className="mpg-gate-title">MAP<span>PA</span></h1>
        <p className="mpg-gate-tag">Scegli il tuo nickname per giocare</p>
      </div>

      <div className="mpg-gate-body" style={{ background: card, border: `1px solid ${bord}` }}>
        <label className="mpg-gate-label" style={{ color: sub }}>
          <User size={14} /> Nickname (max 10 lettere)
        </label>

        <div className={`mpg-gate-inputwrap${error ? " err" : ""}`}>
          <input
            ref={inputRef}
            className="mpg-gate-input"
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
          <span className="mpg-gate-count" style={{ color: sub }}>{value.length}/10</span>
        </div>

        <div className="mpg-gate-msg">{error || " "}</div>

        <button type="button" className="mpg-gate-go" onClick={submit}>
          Entra <ArrowRight size={18} />
        </button>

        {players.length > 0 && (
          <div className="mpg-gate-accounts">
            <div className="mpg-gate-accounts-label" style={{ color: sub }}>
              Oppure entra con un nome già usato
            </div>
            <div className="mpg-gate-accounts-list">
              {players.map(p => (
                <button
                  key={p.nick}
                  type="button"
                  className="mpg-gate-chip"
                  onClick={() => enter(p.nick.slice(0, 10))}
                  title={`Entra come ${p.nick}`}
                >
                  <User size={12} /> {p.nick}
                </button>
              ))}
            </div>
          </div>
        )}

        <Link to="/#progetti" className="mpg-gate-back" style={{ color: sub }}>
          <ArrowLeft size={14} /> Torna ai progetti
        </Link>

        <p className="mpg-gate-note" style={{ color: sub }}>
          Il tuo nickname comparirà nella classifica live di tutti i giocatori.
        </p>
      </div>

      <style>{`
        .mpg-gate {
          position: fixed; inset: 0; z-index: 250;
          font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
          background: #f4f6f5;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1.5rem; padding: 1.5rem; overflow-y: auto;
          animation: mpg-gate-in .25s ease;
        }
        .mpg-gate.dark { background: #171114; }
        @keyframes mpg-gate-in { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:none; } }

        .mpg-gate-hero { display:flex; flex-direction:column; align-items:center; gap:.5rem; }
        .mpg-gate-logo {
          background:#fff; color:#bc3d10; border-radius:20px; padding:16px; display:inline-flex;
          box-shadow:0 10px 32px rgba(162, 51, 14,0.4);
        }
        .mpg-gate.dark .mpg-gate-logo { box-shadow:0 10px 32px rgba(162, 51, 14,0.5); }
        .mpg-gate-title {
          font-size:clamp(2.2rem,9vw,3rem); font-weight:900; letter-spacing:0.16em;
          margin:.4rem 0 0; line-height:1; color:#a2330e;
        }
        .mpg-gate.dark .mpg-gate-title { color:#f6a583; }
        .mpg-gate-title span { color:#e95420; }
        .mpg-gate.dark .mpg-gate-title span { color:#6fe0a6; }
        .mpg-gate-tag { font-size:.9rem; color:#7d7066; margin:0; font-weight:600; }
        .mpg-gate.dark .mpg-gate-tag { color:#c9bcb4; }

        .mpg-gate-body {
          width:min(94vw,360px);
          border-radius:16px; padding:1.4rem 1.3rem 1.2rem;
          display:flex; flex-direction:column; gap:.5rem;
          box-shadow:0 8px 30px rgba(0,0,0,0.12);
        }
        .mpg-gate-label {
          display:inline-flex; align-items:center; gap:.4rem;
          font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em;
        }
        .mpg-gate-inputwrap {
          display:flex; align-items:center; gap:.5rem;
          border:2px solid rgba(233, 84, 32,0.25); border-radius:12px;
          padding:.1rem .9rem; transition:border-color .15s, box-shadow .15s;
          background:rgba(0,0,0,0.015);
        }
        .mpg-gate.dark .mpg-gate-inputwrap { background:rgba(255,255,255,0.03); border-color:rgba(237, 113, 67,0.3); }
        .mpg-gate-inputwrap:focus-within { border-color:#e95420; box-shadow:0 0 0 .2rem rgba(233, 84, 32,.2); }
        .mpg-gate-inputwrap.err { border-color:#c0392b; box-shadow:0 0 0 .2rem rgba(192,57,43,.15); }
        .mpg-gate-input {
          flex:1; min-width:0; border:none; outline:none; background:transparent;
          font-family:inherit; font-size:1.5rem; font-weight:800; letter-spacing:.02em;
          padding:.55rem 0;
        }
        .mpg-gate-count { font-size:.78rem; font-weight:700; font-variant-numeric:tabular-nums; flex-shrink:0; }
        .mpg-gate-msg {
          min-height:1.1rem; font-size:.8rem; font-weight:700; color:#c0392b;
          padding-left:.2rem;
        }
        .mpg-gate-go {
          margin-top:.2rem; height:52px; width:100%;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:linear-gradient(100deg,#e95420 0%,#a2330e 45%,#e95420 100%); color:#fff; border:none; border-radius:13px;
          font-family:inherit; font-size:1.1rem; font-weight:900; cursor:pointer;
          box-shadow:0 6px 22px rgba(162, 51, 14,0.4); transition:filter .12s, transform .12s;
        }
        .mpg-gate-go:hover { filter:brightness(.92); transform:translateY(-1px); }
        .mpg-gate-go:active { transform:scale(.98); }
        .mpg-gate-back {
          display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
          margin-top:.3rem; padding:.5rem; font-size:.85rem; font-weight:700;
          text-decoration:none; border-radius:8px;
        }
        .mpg-gate-back:hover { filter:brightness(.85); }
        .mpg-gate-note { font-size:.72rem; text-align:center; margin:.3rem 0 0; line-height:1.4; }

        .mpg-gate-accounts { margin-top:.7rem; display:flex; flex-direction:column; gap:.5rem; }
        .mpg-gate-accounts-label {
          font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;
          text-align:center;
        }
        .mpg-gate-accounts-list {
          display:flex; flex-wrap:wrap; gap:.4rem; justify-content:center;
          max-height:128px; overflow-y:auto; padding:.1rem;
        }
        .mpg-gate-chip {
          display:inline-flex; align-items:center; gap:.3rem;
          border:1.5px solid rgba(233, 84, 32,0.32); border-radius:999px;
          background:rgba(233, 84, 32,0.07); color:#cf4312;
          font-family:inherit; font-size:.85rem; font-weight:800; cursor:pointer;
          padding:.32rem .7rem; transition:filter .12s, transform .12s, background .12s;
        }
        .mpg-gate.dark .mpg-gate-chip {
          border-color:rgba(237, 113, 67,0.34); background:rgba(237, 113, 67,0.1); color:#f6a583;
        }
        .mpg-gate-chip:hover { background:rgba(233, 84, 32,0.15); transform:translateY(-1px); }
        .mpg-gate.dark .mpg-gate-chip:hover { background:rgba(237, 113, 67,0.18); }
        .mpg-gate-chip:active { transform:scale(.97); }
      `}</style>
    </div>
  );
}
