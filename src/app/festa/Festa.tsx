import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin, Navigation, Gift, Pizza, PartyPopper, Send, Loader2,
  ArrowLeftRight, ListChecks, PenLine, CalendarHeart, Scissors, CalendarPlus,
} from "lucide-react";
import {
  submitPresenza, fetchPresenze, subscribePresenze,
  type PresenzaRow, type Presenza, type Giorno,
} from "./festaApi";
import { E } from "./AppleEmoji";
import SiteFooter from "../site/SiteFooter";
import "./festa.css";

// ─── Giorni della festa: due inviti separati, un link (token) ciascuno ──────
// Stesso evento, due date: chi vuole può esserci anche entrambi i giorni.
// Il giorno viaggia col record (colonna "giorno") così le adesioni restano
// separate e so a quale giorno si riferisce ogni risposta.
interface DayCfg {
  id: Giorno;
  token: string;
  weekday: string;     // "Sabato" / "Domenica"
  weekdayShort: string;// "sab" / "dom"
  dayNum: string;      // "27" / "28"
  dateLabel: string;   // "27 giugno"
  other?: { token: string; label: string }; // link all'altro giorno (se attivo)
}

// Invito del 27 revocato: resta attivo solo il link di domenica 28.
const DAYS: Record<string, DayCfg> = {
  "alb20-mtv74-28": {
    id: "28", token: "alb20-mtv74-28",
    weekday: "Domenica", weekdayShort: "dom", dayNum: "28", dateLabel: "28 giugno",
  },
};

// Lunedì 29 giugno 2026, 00:00 (Europe/Rome, CEST = +02:00): l'invito resta
// attivo fino a fine domenica 28 (la festa va dalle 18 a tarda notte).
const DEADLINE = new Date("2026-06-29T00:00:00+02:00");

// Prenotazione pizze: le ordino al Pizzangolo (Rivalta sul Mincio) entro le
// 21:00 di sabato 27/06 (il giorno prima). Dopo, il campo "gusto" si blocca:
// la presenza resta comunque confermabile.
const PIZZA_DEADLINE = new Date("2026-06-27T21:00:00+02:00");
const PIZZA_DEADLINE_LABEL = "sabato 27 giugno, ore 21:00";

// Inizio festa: domenica 28 giugno 2026, ore 18:00 (Europe/Rome, CEST = +02:00).
// Usato dal countdown e dal file .ics ("Aggiungi al calendario").
const FESTA_START = new Date("2026-06-28T18:00:00+02:00");
const FESTA_END = new Date("2026-06-29T01:00:00+02:00"); // "tarda notte"
// Coordinate di Rivalta sul Mincio: meteo della serata (Open-Meteo, no key).
const COORDS = { lat: 45.181, lon: 10.662 };

const ADDRESS = "Strada Vedusino, 4";
const GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Strada Vedusino 4")}`;
const AMAPS = `https://maps.apple.com/?q=${encodeURIComponent("Strada Vedusino 4")}`;

// ─── Risposte presenza ──────────────────────────────────────────────────────
// Stesse tre scelte di sempre. Per NON migrare lo schema Supabase riuso i valori
// storici della colonna `presenza`, rietichettando solo "sera" → "cena":
//   'pomeriggio' → in piscina nel pomeriggio
//   'sera'       → resta a cena (dalle 18)
//   'no'         → non viene
// Sul DB restano i codici vecchi; ovunque (UI + email) si mostrano le etichette
// nuove, così per chi legge resta tutto chiaro.
const PRESENZA_BADGE: Record<Presenza, { emoji: string; short: string }> = {
  pomeriggio: { emoji: "🏊", short: "Pomeriggio" },
  sera:       { emoji: "🍕", short: "A cena" },
  no:         { emoji: "🙁", short: "Non viene" },
};

// ─── Icone che fluttuano sulla "scrivania" (dietro al cartoncino) ───────────
// Decorative: solo transform/opacity, aria-hidden, niente eventi puntatore.
const PROPS = [
  { e: "🎈", t: "6%",  l: "5%",  s: 2.4, d: 13, dl: 0   },
  { e: "🎉", t: "12%", l: "90%", s: 2.0, d: 16, dl: 1.5 },
  { e: "🍕", t: "34%", l: "3%",  s: 2.2, d: 15, dl: 0.6 },
  { e: "☀️", t: "26%", l: "93%", s: 2.6, d: 18, dl: 2.2 },
  { e: "💦", t: "55%", l: "6%",  s: 1.8, d: 12, dl: 1.0 },
  { e: "🩴", t: "62%", l: "92%", s: 2.0, d: 14, dl: 0.3 },
  { e: "🏊", t: "78%", l: "4%",  s: 2.3, d: 17, dl: 2.0 },
  { e: "🌙", t: "84%", l: "91%", s: 2.0, d: 15, dl: 0.9 },
  { e: "🎂", t: "46%", l: "95%", s: 2.1, d: 16, dl: 1.7 },
  { e: "✨", t: "92%", l: "48%", s: 1.7, d: 11, dl: 0.5 },
];

function DeskDecor() {
  return (
    <div className="festa-decor" aria-hidden="true">
      {PROPS.map((p, i) => (
        <span
          key={i}
          className="festa-prop"
          style={{
            top: p.t, left: p.l, fontSize: `${p.s}rem`,
            animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
          }}
        >
          <E e={p.e} />
        </span>
      ))}
    </div>
  );
}

// ─── Coriandoli: scoppio al momento della conferma ──────────────────────────
const CONF_COLORS = ["#dd4814", "#d8b86a", "#ff8fb3", "#5ad1c4", "#ffd24a", "#fff7e6"];
function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      l: Math.random() * 100,
      d: 2.4 + Math.random() * 1.8,
      dl: Math.random() * 0.5,
      c: CONF_COLORS[i % CONF_COLORS.length],
      r: Math.random() * 360,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
    })),
    [],
  );
  return (
    <div className="festa-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.l}%`,
            width: `${p.w}px`, height: `${p.h}px`,
            background: p.c,
            animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
            transform: `rotate(${p.r}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Medaglione (testa di sezione): anello dorato + emoji animata ───────────
function Medallion({ emoji, anim }: { emoji: string; anim: string }) {
  return (
    <span className="festa-medal" aria-hidden="true">
      <E e={emoji} className={`festa-medal-ico festa-anim-${anim}`} />
    </span>
  );
}

// ─── Countdown alla festa (live, una tile per unità) ────────────────────────
function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = FESTA_START.getTime() - now;
  // Festa iniziata (o in corso): niente conto alla rovescia, messaggio festoso.
  if (diff <= 0) {
    return (
      <div className="festa-count festa-count--live">
        <E e="🎉" /> La festa è iniziata — ci vediamo!
      </div>
    );
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const tiles: [number, string][] = [
    [days, "giorni"], [hours, "ore"], [mins, "min"], [secs, "sec"],
  ];
  return (
    <div className="festa-count" aria-label="Conto alla rovescia alla festa">
      {tiles.map(([v, l]) => (
        <div className="festa-count-tile" key={l}>
          <span className="festa-count-num">{String(v).padStart(2, "0")}</span>
          <span className="festa-count-unit">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Meteo della serata (Open-Meteo, gratis e senza API key) ────────────────
// Previsione oraria di Rivalta per il 28/06: prendo l'ora ~20:00. Best-effort:
// se la chiamata fallisce o la data è fuori finestra previsionale, non mostra
// nulla (la riga sparisce, niente errori).
function weatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "sereno" };
  if (code === 1 || code === 2) return { emoji: "🌤️", label: "poco nuvoloso" };
  if (code === 3) return { emoji: "☁️", label: "coperto" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "nebbia" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "pioviggine" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "pioggia" };
  if (code >= 71 && code <= 77) return { emoji: "🌨️", label: "neve" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "rovesci" };
  if (code >= 95) return { emoji: "⛈️", label: "temporale" };
  return { emoji: "🌡️", label: "—" };
}

function Weather() {
  const [w, setW] = useState<{ emoji: string; text: string } | null>(null);
  useEffect(() => {
    let alive = true;
    const d = "2026-06-28";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${COORDS.lat}&longitude=${COORDS.lon}&hourly=temperature_2m,weather_code&timezone=Europe%2FRome&start_date=${d}&end_date=${d}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const times: string[] = j?.hourly?.time ?? [];
        const temps: number[] = j?.hourly?.temperature_2m ?? [];
        const codes: number[] = j?.hourly?.weather_code ?? [];
        let i = times.findIndex((t) => t.endsWith("T20:00"));
        if (i < 0) i = times.findIndex((t) => t.endsWith("T19:00"));
        if (i < 0 || temps[i] == null) return;
        const { emoji, label } = weatherInfo(codes[i]);
        setW({ emoji, text: `Serata: ${Math.round(temps[i])}° · ${label}` });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!w) return null;
  return <span className="festa-weather"><E e={w.emoji} /> {w.text}</span>;
}

// ─── "Aggiungi al calendario": genera e scarica un .ics al volo ─────────────
function downloadIcs() {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//albertopecchini.it//festa//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:festa-alberto-28@albertopecchini.it",
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(FESTA_START)}`,
    `DTEND:${fmt(FESTA_END)}`,
    "SUMMARY:🎉 Festa di Alberto (20 anni + Maturità)",
    "LOCATION:Strada Vedusino 4\\, Rivalta sul Mincio",
    "DESCRIPTION:Festa dalle 18 a tarda notte. Piscina dal pomeriggio\\, cena dalle 18. RSVP: https://www.albertopecchini.it/festa?k=alb20-mtv74-28",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "festa-alberto.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Schermata neutra (token errato o evento concluso) ──────────────────────
function FestaClosed({ expired }: { expired: boolean }) {
  return (
    <div className="festa-page festa-closed">
      <DeskDecor />
      <div className="festa-closed-card">
        <E e={expired ? "🎈" : "🔒"} className="festa-closed-emoji" />
        <h1>{expired ? "Evento concluso" : "Pagina non disponibile"}</h1>
        <p>
          {expired
            ? "Grazie a tutti! Questo invito non è più attivo."
            : "Il link non è valido o è scaduto."}
        </p>
      </div>
    </div>
  );
}

export default function Festa() {
  // Gate calcolato una volta sola al mount.
  const access = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const day = DAYS[params.get("k") ?? ""] ?? null;
    const expired = Date.now() >= DEADLINE.getTime();
    return { day, expired };
  }, []);

  if (!access.day) return <><FestaClosed expired={false} /><SiteFooter /></>;
  if (access.expired) return <><FestaClosed expired={true} /><SiteFooter /></>;

  return <FestaContent day={access.day} />;
}

function FestaContent({ day }: { day: DayCfg }) {
  const [nome, setNome] = useState("");
  const [presenza, setPresenza] = useState<Presenza | null>(null);
  const [cibo, setCibo] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PresenzaRow[]>([]);

  const seen = useRef<Set<string>>(new Set());

  // Mese e anno per il blocco data (derivati dal config: "28 giugno" → "giugno").
  const monthLabel = day.dateLabel.replace(day.dayNum, "").trim();
  const year = "2026";

  // Opzioni del form: emoji + etichetta chiara + sotto-testo. I `value` sono i
  // codici storici del DB (vedi PRESENZA_BADGE): 'sera' = «a cena».
  const presenzaOpts: { value: Presenza; emoji: string; label: string; hint: string }[] = [
    { value: "pomeriggio", emoji: "🏊", label: "Ci sono al pomeriggio", hint: "bagno in piscina" },
    { value: "sera",       emoji: "🍕", label: "Resto a cena",          hint: "dalle 18 in poi" },
    { value: "no",         emoji: "🙁", label: "Non riesco a venire",   hint: "sarò con voi col pensiero" },
  ];

  // Carica le presenze del giorno + sottoscrizione realtime (filtrata).
  // La subscribe è "live" anche in modalità statica/locale (vedi festaApi):
  // su un'altra scheda/sessione le nuove adesioni arrivano via evento storage.
  useEffect(() => {
    let alive = true;
    fetchPresenze(day.id).then((data) => {
      if (!alive) return;
      data.forEach((r) => seen.current.add(rowKey(r)));
      setRows(data);
    }).catch(() => {});

    const unsub = subscribePresenze((r) => {
      if (r.giorno !== day.id) return; // ignora l'altro giorno
      const k = rowKey(r);
      if (seen.current.has(k)) return;
      seen.current.add(k);
      setRows((prev) => [r, ...prev]);
    });
    return () => { alive = false; unsub(); };
  }, [day.id]);

  // Le pizze si ordinano in pizzeria entro le 21 di sabato 27: dopo, niente gusti.
  const pizzaOpen = Date.now() < PIZZA_DEADLINE.getTime();

  const canSend = nome.trim().length > 0 && presenza != null && !sending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || !presenza) return;
    setSending(true);
    setError(null);
    try {
      const saved = await submitPresenza({ nome, presenza, cibo, giorno: day.id });
      // Mostra subito la propria riga (in caso il realtime tardasse).
      const k = rowKey(saved);
      if (!seen.current.has(k)) {
        seen.current.add(k);
        setRows((prev) => [saved, ...prev]);
      }
      // Notifica email (best-effort: non blocca l'esito).
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), presenza, cibo: cibo.trim(), giorno: day.id }),
      }).catch(() => {});
      setSent(true);
    } catch (err: any) {
      setError("Ops, non sono riuscito a salvare. Riprova tra un attimo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="festa-page">
      <DeskDecor />
      {sent && <Confetti />}

      <div className="festa-wrap">

        {/* ════════ INVITO (cartoncino principale) ════════ */}
        <article className="festa-paper">
          <div className="festa-paper-edge" aria-hidden="true" />

          {/* Francobollo decorativo nell'angolo */}
          <span className="festa-stamp" aria-hidden="true">
            <span className="festa-stamp-top">DOM · 28</span>
            <E e="🎉" className="festa-stamp-emoji" />
            <span className="festa-stamp-bot">GIU 2026</span>
          </span>

          {/* Intestazione dell'invito */}
          <header className="festa-head">
            <p className="festa-eyebrow">
              <span className="festa-flourish">❧</span>
              Sei invitato/a
              <span className="festa-flourish festa-flourish--flip">❧</span>
            </p>
            <h1 className="festa-title">La Festa<br />di Alberto</h1>
            <p className="festa-occasion">
              Per i miei <strong>20 anni</strong> &nbsp;·&nbsp; e la <strong>Maturità 74/100</strong>
            </p>
            <p className="festa-geom">Geom. Alberto Pecchini</p>

            <div className="festa-rule" aria-hidden="true">
              <span /><span className="festa-rule-dot">✦</span><span />
            </div>

            {/* Ceralacca con monogramma */}
            <span className="festa-seal" aria-hidden="true">
              <span className="festa-seal-shine" />
              <span className="festa-seal-mono">AP</span>
            </span>
          </header>

          {/* Blocco DATA — il save-the-date, con cornice ad angoli dorati */}
          <div className="festa-date">
            <span className="festa-date-corner tl" aria-hidden="true" />
            <span className="festa-date-corner tr" aria-hidden="true" />
            <span className="festa-date-corner bl" aria-hidden="true" />
            <span className="festa-date-corner br" aria-hidden="true" />
            <span className="festa-date-wd">{day.weekday}</span>
            <span className="festa-date-num">{day.dayNum}</span>
            <span className="festa-date-my">{monthLabel} {year}</span>
            <span className="festa-date-note">dalle 18 fino a tarda notte <E e="🌙" /></span>
          </div>

          {/* Countdown live + meteo serata + aggiungi al calendario */}
          <div className="festa-after-date">
            <Countdown />
            <div className="festa-date-actions">
              <button type="button" className="festa-cal-btn" onClick={downloadIcs}>
                <CalendarPlus size={16} /> Aggiungi al calendario
              </button>
              <Weather />
            </div>
          </div>

          {/* Due giorni: blocco mostrato solo se esiste un secondo invito attivo */}
          {day.other && (
            <div className="festa-cross">
              <ArrowLeftRight size={18} />
              <p>
                Non riesci? <a href={`/festa?k=${day.other.token}`}>Vieni {day.other.label} →</a>
                &nbsp;Puoi esserci anche <strong>entrambi i giorni</strong>: rispondi a tutti e due gli inviti. <E e="💚" />
              </p>
            </div>
          )}

          {/* A colpo d'occhio — le 3 cose da sapere subito, per non impazzire */}
          <div className="festa-glance">
            <div className="festa-glance-item">
              <E e="📅" className="festa-glance-emoji" />
              <span className="festa-glance-k">Quando</span>
              <span className="festa-glance-v">{day.weekdayShort} {day.dayNum} {monthLabel}<br />dalle 18</span>
            </div>
            <div className="festa-glance-item">
              <E e="📍" className="festa-glance-emoji" />
              <span className="festa-glance-k">Dove</span>
              <span className="festa-glance-v">{ADDRESS}</span>
            </div>
            <div className="festa-glance-item">
              <E e="🍕" className="festa-glance-emoji" />
              <span className="festa-glance-k">Cibo</span>
              <span className="festa-glance-v">Pizza offerta<br />regalo facoltativo</span>
            </div>
          </div>

          {/* Il programma — timeline chiara dalla sera a tarda notte */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="⏰" anim="bob" />
              <h2>Il programma</h2>
            </div>
            <div className="festa-timeline">
              <div className="festa-tl-row">
                <span className="festa-tl-time">Pomeriggio</span>
                <span className="festa-tl-line" aria-hidden="true"><i /></span>
                <div className="festa-tl-body">
                  <E e="🏊" className="festa-tl-emoji festa-anim-swim" />
                  <div>
                    <p className="festa-tl-title">Piscina aperta</p>
                    <p className="festa-tl-desc">Chi vuole arriva prima: bagno, sole e aperitivo di benvenuto <E e="🥂" />.</p>
                  </div>
                </div>
              </div>
              <div className="festa-tl-row">
                <span className="festa-tl-time">Dalle 18</span>
                <span className="festa-tl-line" aria-hidden="true"><i /></span>
                <div className="festa-tl-body">
                  <E e="🍕" className="festa-tl-emoji festa-anim-bob" />
                  <div>
                    <p className="festa-tl-title">Cena insieme</p>
                    <p className="festa-tl-desc">Pizza alla teglia dal Pizzangolo: offre la casa, niente pensieri.</p>
                  </div>
                </div>
              </div>
              <div className="festa-tl-row">
                <span className="festa-tl-time">Fino a tardi</span>
                <span className="festa-tl-line" aria-hidden="true"><i /></span>
                <div className="festa-tl-body">
                  <E e="🌙" className="festa-tl-emoji festa-anim-bob" />
                  <div>
                    <p className="festa-tl-title">Musica & chill</p>
                    <p className="festa-tl-desc">Si continua tra chiacchiere e musica <E e="🎶" />, nessuna fretta.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dove — indirizzo + scorciatoie mappe */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="📍" anim="drop" />
              <h2>Come arrivare</h2>
            </div>
            <p className="festa-address"><MapPin size={18} /> {ADDRESS}</p>
            <div className="festa-maps">
              <a className="festa-map-btn festa-map-btn--primary" href={GMAPS} target="_blank" rel="noreferrer">
                <Navigation size={17} /> Google Maps
              </a>
              <a className="festa-map-btn" href={AMAPS} target="_blank" rel="noreferrer">
                <MapPin size={17} /> Apple Maps
              </a>
            </div>
          </section>

          {/* Cosa portare — chip (piscina di sera → c'è anche la felpa) */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="🎒" anim="wiggle" />
              <h2>Cosa portare</h2>
            </div>
            <div className="festa-bring">
              {[
                { e: "🩳", t: "Costume" },
                { e: "🩴", t: "Ciabatte" },
                { e: "👕", t: "Cambio vestiti" },
                { e: "🏖️", t: "Asciugamano" },
                { e: "🧥", t: "Felpa per la notte" },
              ].map((x) => (
                <span key={x.t} className="festa-chip"><E e={x.e} className="festa-chip-e" /> {x.t}</span>
              ))}
            </div>
          </section>

          {/* Buono a sapersi — pizza + regalo facoltativo (chill) */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="🍕" anim="spin" />
              <h2>Buono a sapersi</h2>
            </div>
            <ul className="festa-notes">
              <li>
                <Pizza size={18} className="festa-note-ic" />
                <span>
                  <strong>Pizza alla teglia dal Pizzangolo</strong> (Rivalta sul Mincio) — offre la casa! <E e="🎉" />{" "}
                  Scrivi il tuo gusto nella cartolina qui sotto <strong>entro le 21 di sabato 27 giugno</strong>.
                </span>
              </li>
              <li>
                <Gift size={18} className="festa-note-ic" />
                <span><strong>Regalo facoltativo</strong>, nessun impegno: vieni e basta, è già festa così. Tutto molto chill. <E e="💚" /></span>
              </li>
            </ul>
          </section>
        </article>

        {/* ════════ CARTOLINA R.S.V.P. (la "risposta", staccabile) ════════ */}
        <article className="festa-reply">
          <div className="festa-tear" aria-hidden="true">
            <Scissors size={15} />
            <span>stacca &amp; rispondi</span>
          </div>

          <div className="festa-reply-head">
            <p className="festa-rsvp-tag"><CalendarHeart size={15} /> R.S.V.P.</p>
            <h2 className="festa-reply-title">Ci sei {day.weekday.toLowerCase()} {day.dayNum}?</h2>
            <p className="festa-reply-sub">
              Fammelo sapere <strong>entro {day.weekday.toLowerCase()} {day.dateLabel}</strong> — nessun impegno, è tutto chill.
            </p>
          </div>

          {sent ? (
            <div className="festa-thanks">
              <E e="🥳" className="festa-thanks-emoji" />
              <h3>Grazie, segnato!</h3>
              <p>Ci vediamo {day.weekday.toLowerCase()} {day.dayNum}. Trovi il tuo nome nella lista qui sotto.</p>
            </div>
          ) : (
            <>
              {/* Micro-istruzioni: 3 passi chiarissimi */}
              <ol className="festa-steps">
                <li><span className="festa-step-n">1</span> Scrivi il tuo nome</li>
                <li><span className="festa-step-n">2</span> Dimmi se vieni</li>
                <li><span className="festa-step-n">3</span> Gusto pizza <em>(se vuoi)</em></li>
              </ol>

              <form className="festa-form" onSubmit={handleSubmit}>
                <label className="festa-field">
                  <span className="festa-flabel"><PenLine size={15} /> Il tuo nome</span>
                  <input
                    className="festa-input"
                    type="text"
                    value={nome}
                    maxLength={40}
                    placeholder="Es. Marco"
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </label>

                <div className="festa-field">
                  <span className="festa-flabel"><ListChecks size={15} /> Ci sarai?</span>
                  <div className="festa-seg">
                    {presenzaOpts.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`festa-seg-btn${presenza === o.value ? " is-active" : ""}`}
                        onClick={() => setPresenza(o.value)}
                      >
                        <E e={o.emoji} className="festa-seg-emoji" />
                        <span className="festa-seg-txt">
                          <span className="festa-seg-main">{o.label}</span>
                          <span className="festa-seg-hint">{o.hint}</span>
                        </span>
                        <span className="festa-seg-check" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="festa-field">
                  <span className="festa-flabel"><Pizza size={15} /> Gusto pizza <em>(facoltativo)</em></span>
                  {pizzaOpen ? (
                    <>
                      <textarea
                        className="festa-input"
                        value={cibo}
                        maxLength={200}
                        rows={2}
                        placeholder="Es. margherita, patate, würstel, prosciutto…"
                        onChange={(e) => setCibo(e.target.value)}
                      />
                      <span className="festa-hint">
                        <E e="🍕" /> Prenoto i gusti al Pizzangolo (Rivalta) entro <strong>{PIZZA_DEADLINE_LABEL}</strong>.
                      </span>
                    </>
                  ) : (
                    <div className="festa-locked">
                      <E e="🔒" /> Prenotazione pizze chiusa (scadenza: {PIZZA_DEADLINE_LABEL}). Puoi comunque confermare la presenza.
                    </div>
                  )}
                </div>

                {error && <div className="festa-error">{error}</div>}

                <button className="festa-submit" type="submit" disabled={!canSend}>
                  {sending ? <><Loader2 size={18} className="festa-spin" /> Invio…</>
                           : <><Send size={18} /> Conferma la presenza</>}
                </button>
              </form>
            </>
          )}

          {/* Libro degli ospiti — lista live (aggiornata in tempo reale) */}
          <div className="festa-guests">
            <div className="festa-guests-head">
              <PartyPopper size={16} />
              <span>Chi c'è {day.weekday.toLowerCase()} {day.dayNum}</span>
              <span className="festa-guests-count">{rows.length}</span>
              <span className="festa-live-dot" aria-hidden="true" />
            </div>
            {rows.length === 0 ? (
              <p className="festa-guests-empty">Ancora nessuno… sii il primo! <E e="🎈" /></p>
            ) : (
              <ul className="festa-guests-list">
                {rows.map((r, i) => {
                  const b = PRESENZA_BADGE[r.presenza] ?? { emoji: "🎉", short: r.presenza };
                  return (
                    <li key={r.id ?? `${r.nome}-${i}`} className="festa-guest-row">
                      <span className="festa-guest-name">{r.nome}</span>
                      <span className={`festa-guest-badge p-${r.presenza}`}><E e={b.emoji} /> {b.short}</span>
                      {r.cibo ? <span className="festa-guest-food"><E e="🍽️" /> {r.cibo}</span> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>

        {/* Firma */}
        <footer className="festa-foot">
          <span className="festa-foot-flourish" aria-hidden="true">✦ ✦ ✦</span>
          <p>Con affetto, ti aspetto.</p>
          <p className="festa-foot-sign">Alberto <E e="💚" /></p>
        </footer>
      </div>
      <SiteFooter />
    </div>
  );
}

// Chiave per deduplicare (id se presente, altrimenti nome+timestamp).
function rowKey(r: PresenzaRow): string {
  return r.id != null ? `id:${r.id}` : `n:${r.nome}|${r.created_at ?? ""}`;
}
