import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { IcPalette, IcClose, IcCopy, IcCheck, IcSearch } from "./homeIcons";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import "./palette.css";

// ─────────────────────────────────────────────────────────────────────────────
// "Palette" — il sistema colore del sito, per intero, in una finestra sola.
// Sta in fondo alla barra del footer (al posto del vecchio pulsante README) e
// raccoglie TUTTE le tinte in uso: i token .sb- della home (chiaro e scuro), la
// loro copia su :root per shadcn, i colori del codice, quelli dei dati (grafico
// contribuzioni, linguaggi), i pochi colori fissi di Trivia, l'arancio delle
// email, e infine gradienti e ombre — con esempio dal vivo e copia negli
// appunti.
//
// I valori sono trascritti dalle sorgenti (home.css, styles/theme.css,
// _game/ui/tokens.ts, GitHubFooterWidget, scrollprogress.css) invece che letti
// da getComputedStyle: così si vedono ENTRAMBI i temi insieme, non solo quello
// attivo, ed è l'unico modo di mostrare il confronto.
// Contenuto in italiano e marcato data-no-i18n: nomi di colore e variabili CSS
// non si traducono.
// ─────────────────────────────────────────────────────────────────────────────

/** Una tinta: nome, eventuale variabile CSS, valore chiaro e valore scuro. */
interface Sw {
  n: string;
  v?: string;
  l: string;
  /** Se manca, la tinta è la stessa nei due temi. */
  d?: string;
  note?: string;
}

interface Grp {
  id: string;
  t: string;
  s: string;
  sw: Sw[];
  /** Mostra il rapporto di contrasto sul fondo del tema (solo per i testi). */
  contrast?: boolean;
  /** Tinte larghe (gradienti): una barra per riga invece della griglia. */
  wide?: boolean;
  /** Le tinte vengono esportate dentro questo selettore. */
  scope?: ".sb-home" | ":root";
}

const GROUPS: Grp[] = [
  {
    id: "brand",
    t: "Verde brand",
    s: "Il colore del sito: hsl(153 60% 53%), lo stesso verde di Supabase, usato per accenti, bordi vivi e pulsanti primari.",
    scope: ".sb-home",
    sw: [
      { n: "Brand", v: "--sb-brand", l: "hsl(153, 60%, 53%)", note: "accento unico, identico nei due temi" },
      { n: "Brand testo", v: "--sb-brand-text", l: "hsl(153, 86%, 28%)", d: "hsl(155, 100%, 42%)", note: "verde leggibile sul testo" },
      { n: "Bottone fondo", v: "--sb-btn-bg", l: "hsl(151, 67%, 67%)", d: "hsl(155, 100%, 19%)" },
      { n: "Bottone hover", v: "--sb-btn-bg-hover", l: "hsl(151, 63%, 60%)", d: "hsl(155, 74%, 25%)" },
      { n: "Bottone bordo", v: "--sb-btn-bd", l: "hsla(155, 78%, 40%, 0.75)", d: "hsla(153, 60%, 53%, 0.3)" },
      { n: "Bottone testo", v: "--sb-btn-fg", l: "#101010", d: "#ffffff" },
      { n: "Ciano di coppia", l: "hsl(192, 72%, 55%)", note: "coda del filo di lettura e delle barre di avanzamento" },
      { n: "Selezione", l: "hsla(153, 60%, 53%, 0.35)", note: "::selection" },
    ],
  },
  {
    id: "fondali",
    t: "Fondali & superfici",
    s: "Grigi puri, senza tinta: il verde deve essere l'unica cosa colorata della pagina.",
    scope: ".sb-home",
    sw: [
      { n: "Fondo", v: "--sb-bg", l: "#fcfcfc", d: "#141414", note: "fondo pagina" },
      { n: "Fondo alt", v: "--sb-bg-alt", l: "#f8f8f8", d: "#181818", note: "sezioni alternate e footer" },
      { n: "Superficie 75", v: "--sb-surface-75", l: "#fbfbfb", d: "#1c1c1c", note: "interno delle card" },
      { n: "Superficie 100", v: "--sb-surface-100", l: "#f6f6f6", d: "#222222" },
      { n: "Superficie 200", v: "--sb-surface-200", l: "#f0f0f0", d: "#282828" },
      { n: "Velo", v: "--sb-overlay", l: "rgba(0, 0, 0, 0.05)", d: "rgba(255, 255, 255, 0.07)", note: "hover leggeri, chip" },
    ],
  },
  {
    id: "bordi",
    t: "Bordi",
    s: "Tre pesi: filo appena visibile, filo normale, filo marcato. Il bordo-gradiente delle card li mescola.",
    scope: ".sb-home",
    sw: [
      { n: "Bordo", v: "--sb-border", l: "#e8e8e8", d: "#2a2a2a" },
      { n: "Bordo forte", v: "--sb-border-strong", l: "#dbdbdb", d: "#343434" },
      { n: "Bordo marcato", v: "--sb-border-stronger", l: "#c7c7c7", d: "#414141" },
    ],
  },
  {
    id: "testo",
    t: "Testo",
    s: "Quattro livelli di voce, dal titolo alla didascalia. Il rapporto è calcolato sul fondo pagina del tema.",
    scope: ".sb-home",
    contrast: true,
    sw: [
      { n: "Testo", v: "--sb-fg", l: "#171717", d: "#ededed", note: "titoli e corpo" },
      { n: "Testo chiaro", v: "--sb-fg-light", l: "#525252", d: "#b4b4b4", note: "paragrafi secondari" },
      { n: "Testo più chiaro", v: "--sb-fg-lighter", l: "#6f6f6f", d: "#969696", note: "didascalie" },
      { n: "Testo attenuato", v: "--sb-fg-muted", l: "#8f8f8f", d: "#707070", note: "metadati, © del footer" },
    ],
  },
  {
    id: "codice",
    t: "Codice",
    s: "Evidenziazione dei blocchi di codice: gli stessi tre colori di GitHub, uno per tema.",
    scope: ".sb-home",
    sw: [
      { n: "Parola chiave", v: "--sb-code-kw", l: "#0550ae", d: "#79c0ff" },
      { n: "Numero", v: "--sb-code-num", l: "#953800", d: "#ffcda1" },
      { n: "Funzione", v: "--sb-code-fn", l: "#8250df", d: "#bda4ff" },
    ],
  },
  {
    id: "shadcn",
    t: "Token shadcn — mappe e componenti",
    s: "Le stesse tinte dei token .sb-, ricopiate su :root perché Tailwind e i componenti shadcn (le mappe MapLibre) le leggono da lì. Vivono in styles/theme.css.",
    scope: ":root",
    sw: [
      { n: "Primario", v: "--primary", l: "hsl(153, 60%, 53%)", note: "il verde brand, uguale nei due temi" },
      { n: "Fondo", v: "--background", l: "#fcfcfc", d: "#141414" },
      { n: "Testo", v: "--foreground", l: "#171717", d: "#ededed" },
      { n: "Card", v: "--card", l: "#fbfbfb", d: "#1c1c1c" },
      { n: "Secondario", v: "--secondary", l: "#f6f6f6", d: "#222222" },
      { n: "Grigio testo", v: "--muted-foreground", l: "#6f6f6f", d: "#969696" },
      { n: "Bordo", v: "--border", l: "#e8e8e8", d: "#2a2a2a" },
      { n: "Rosso", v: "--destructive", l: "#e5484d", note: "errori, azioni distruttive" },
    ],
  },
  {
    id: "ubuntu",
    t: "Arancio Ubuntu — identità storica",
    s: "La prima veste del sito. Nel sito non c'è più: sopravvive nelle email transazionali e nei documenti generati dal server (api/d.ts).",
    sw: [
      { n: "Ubuntu orange", l: "#e95420", note: "fascia e intestazione delle email" },
      { n: "Arancio profondo", l: "#dd4814", note: "hover e stati premuti" },
      { n: "Sabbia", l: "#faf8f6", note: "fondo delle email" },
      { n: "Inchiostro", l: "#1c1a17", note: "testo delle email" },
      { n: "Nero footer", l: "#08090d", note: "footer delle email" },
    ],
  },
  {
    id: "dati",
    t: "Dati — contribuzioni GitHub",
    s: "Le candele del grafico nel footer: cinque livelli di intensità, i quadratini di GitHub in salsa verde.",
    sw: [
      { n: "Livello 0", l: "rgba(0, 0, 0, 0.05)", d: "rgba(255, 255, 255, 0.07)", note: "giorno senza commit" },
      { n: "Livello 1", l: "hsla(153, 60%, 43%, 0.35)" },
      { n: "Livello 2", l: "hsla(153, 60%, 45%, 0.6)" },
      { n: "Livello 3", l: "hsla(153, 60%, 48%, 0.85)" },
      { n: "Livello 4", l: "hsl(153, 60%, 53%)", note: "giornata piena" },
    ],
  },
  {
    id: "linguaggi",
    t: "Linguaggi",
    s: "Colori ufficiali GitHub Linguist, usati nella barra dei linguaggi del widget.",
    sw: [
      { n: "TypeScript", l: "#3178c6" },
      { n: "JavaScript", l: "#f1e05a" },
      { n: "HTML", l: "#e34c26" },
      { n: "CSS", l: "#563d7c" },
      { n: "Python", l: "#3572a5" },
      { n: "Shell", l: "#89e051" },
      { n: "Markdown", l: "#083fa1" },
      { n: "Altro", l: "#3ecf8e", note: "fallback quando il linguaggio non è in elenco" },
    ],
  },
  {
    id: "trivia",
    t: "Trivia — colori a sé",
    s: "Il gioco non ha più una palette propria: superfici e testi vengono dai token .sb- qui sopra (_game/ui/tokens.ts li rimanda e basta). Restano fissi solo i colori che NON sono interfaccia — un podio è un podio in tutti e due i temi.",
    sw: [
      { n: "Oro", l: "linear-gradient(135deg, #f4d03f, #c8a415)", note: "primo posto" },
      { n: "Argento", l: "linear-gradient(135deg, #cfd8dc, #9aa6ad)", note: "secondo posto" },
      { n: "Bronzo", l: "linear-gradient(135deg, #d99c6a, #b0724c)", note: "terzo posto" },
      { n: "Oro bonus", l: "#d9a400", note: "barra del bonus velocità nel tutorial" },
      { n: "Blu tutorial", l: "#3a7bbf", note: "card «vero o falso»" },
      { n: "Arancio tutorial", l: "#b5651d", note: "card «completamento»" },
      { n: "Rosso errore", l: "#e5484d", note: "nickname non valido, voto in calo" },
    ],
  },
  {
    id: "gradienti",
    t: "Gradienti",
    s: "Le sfumature ricorrenti: filo di lettura, bordo delle card, lampo di luce, aloni.",
    wide: true,
    sw: [
      {
        n: "Filo di lettura",
        l: "linear-gradient(90deg, hsl(153, 60%, 53%), hsl(192, 72%, 55%), hsl(153, 60%, 53%))",
        note: "barra in cima alla finestra e sul filo del footer",
      },
      {
        n: "Bordo card",
        l: "linear-gradient(to bottom, #dbdbdb, rgba(232, 232, 232, 0.45))",
        d: "linear-gradient(to bottom, #343434, rgba(42, 42, 42, 0.45))",
        note: "il bordo da 1px delle .sb-panel",
      },
      {
        n: "Lampo",
        l: "linear-gradient(104deg, transparent 36%, rgba(255, 255, 255, 0.28) 50%, transparent 64%)",
        d: "linear-gradient(104deg, transparent 36%, rgba(255, 255, 255, 0.16) 50%, transparent 64%)",
        note: "attraversa la card quando ci entri col puntatore",
      },
      {
        n: "Alone della card",
        l: "radial-gradient(circle at 30% 40%, hsla(153, 60%, 53%, 0.16), transparent 62%)",
        note: "segue il puntatore dentro il pannello",
      },
      {
        n: "Alone del footer",
        l: "radial-gradient(circle at 50% 20%, hsla(153, 60%, 53%, 0.14), transparent 68%)",
        d: "radial-gradient(circle at 50% 20%, hsla(153, 60%, 53%, 0.2), transparent 68%)",
        note: "la lampada ambientale del footer",
      },
    ],
  },
];

/** Ombre: fuori dall'elenco perché non si mostrano come tinta ma come rilievo. */
const SHADOWS: Sw[] = [
  { n: "Ombra card", v: "--sb-shadow-card", l: "0 4px 20px -6px rgba(0, 0, 0, 0.1)", d: "0 4px 24px -6px rgba(0, 0, 0, 0.55)" },
  { n: "Ombra nav", l: "0 4px 20px rgba(0, 0, 0, 0.06)", d: "0 4px 20px rgba(0, 0, 0, 0.4)" },
  { n: "Alone brand", l: "0 0 12px -1px hsl(153, 60%, 53%)", note: "il bagliore delle barre verdi" },
  { n: "Ombra modale", l: "0 30px 90px rgba(0, 0, 0, 0.6)" },
];

// ── Colore: conversioni e contrasto ──────────────────────────────────────────

/** hsl()/hsla()/rgb()/rgba()/#hex → [r, g, b, a]. null se non è una tinta piena. */
function parse(css: string): [number, number, number, number] | null {
  const s = css.trim().toLowerCase();

  if (s.startsWith("#")) {
    const h = s.slice(1);
    const full = h.length === 3 || h.length === 4 ? h.split("").map((c) => c + c).join("") : h;
    if (full.length !== 6 && full.length !== 8) return null;
    const n = parseInt(full.slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  }

  const nums = s.match(/-?[\d.]+/g)?.map(Number);
  if (!nums || nums.length < 3) return null;

  if (s.startsWith("rgb")) {
    return [nums[0], nums[1], nums[2], nums[3] ?? 1];
  }
  if (s.startsWith("hsl")) {
    const [h, sat, li] = [nums[0] / 360, nums[1] / 100, nums[2] / 100];
    const a = nums[3] ?? 1;
    if (sat === 0) {
      const v = Math.round(li * 255);
      return [v, v, v, a];
    }
    const q = li < 0.5 ? li * (1 + sat) : li + sat - li * sat;
    const p = 2 * li - q;
    const ch = (t: number) => {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    return [
      Math.round(ch(h + 1 / 3) * 255),
      Math.round(ch(h) * 255),
      Math.round(ch(h - 1 / 3) * 255),
      a,
    ];
  }
  return null;
}

/** #rrggbb della tinta. null se non è un colore o se è translucida: con
    l'alfa di mezzo l'esadecimale racconterebbe una bugia. */
function toHex(css: string): string | null {
  const c = parse(css);
  if (!c || c[3] < 1) return null;
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(c[0])}${h(c[1])}${h(c[2])}`;
}

/** Luminanza relativa WCAG. */
function lum(rgb: [number, number, number, number]): number {
  const [r, g, b] = rgb.slice(0, 3).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapporto di contrasto fra due colori (1 → 21). */
function ratio(a: string, b: string): number | null {
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return null;
  const la = lum(ca);
  const lb = lum(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const PAGE_BG = { l: "#fcfcfc", d: "#141414" };
const PAGE_FG = { l: "#171717", d: "#ededed" };

type Mode = "l" | "d" | "both";

const TOTAL = GROUPS.reduce((n, g) => n + g.sw.length, 0) + SHADOWS.length;

/** Le variabili CSS di tutte le famiglie, pronte da incollare in un foglio. */
function exportCss(): string {
  const sb = GROUPS.filter((g) => g.scope === ".sb-home");
  const root = GROUPS.filter((g) => g.scope === ":root");
  const line = (s: Sw, dark = false) => `  ${s.v}: ${dark ? s.d ?? s.l : s.l};`;
  const out: string[] = [
    "/* Palette — albertopecchini.it */",
    "",
    ".sb-home {",
    ...sb.flatMap((g) => [`  /* ${g.t} */`, ...g.sw.filter((s) => s.v).map((s) => line(s))]),
    ...SHADOWS.filter((s) => s.v).map((s) => line(s)),
    "}",
    "",
    "html.dark .sb-home {",
    ...sb.flatMap((g) => [`  /* ${g.t} */`, ...g.sw.filter((s) => s.v).map((s) => line(s, true))]),
    ...SHADOWS.filter((s) => s.v).map((s) => line(s, true)),
    "}",
  ];
  if (root.length) {
    out.push("", ":root {", ...root.flatMap((g) => g.sw.filter((s) => s.v).map((s) => line(s))), "}");
  }
  return out.join("\n");
}

export default function PaletteModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("both");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState("");

  // Esc chiude + blocca lo scroll del body mentre è aperta.
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open]);

  // Alla chiusura si riparte puliti: nessuna ricerca rimasta da prima.
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1300);
  };

  // Ricerca: nome, variabile o valore, in tutte e due le versioni.
  const needle = q.trim().toLowerCase();
  const match = (s: Sw) =>
    !needle ||
    [s.n, s.v, s.l, s.d, s.note, toHex(s.l), s.d ? toHex(s.d) : ""]
      .filter(Boolean)
      .some((x) => (x as string).toLowerCase().includes(needle));

  const groups = useMemo(
    () => GROUPS.map((g) => ({ ...g, sw: g.sw.filter(match) })).filter((g) => g.sw.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [needle],
  );
  const shadows = SHADOWS.filter(match);
  const shown = groups.reduce((n, g) => n + g.sw.length, 0) + shadows.length;

  // Il fondo su cui appoggiare le tinte: quello del tema che si sta guardando.
  const themeKey = mode === "d" ? "d" : "l";
  const canvas = { "--apl-canvas": PAGE_BG[themeKey], "--apl-ink": PAGE_FG[themeKey] } as CSSProperties;

  /** Il valore da mostrare/copiare per la versione richiesta. */
  const val = (s: Sw, k: "l" | "d") => (k === "d" ? s.d ?? s.l : s.l);

  const swatch = (s: Sw, gid: string, contrast?: boolean, wide?: boolean) => {
    const key = `${gid}-${s.n}`;
    const single = mode !== "both";
    const one = val(s, themeKey);
    const hex = toHex(one);
    const cr = contrast ? ratio(one, PAGE_BG[themeKey]) : null;

    return (
      <button
        key={key}
        type="button"
        className={`apl-sw${wide ? " apl-sw--wide" : ""}`}
        onClick={() => copy(hex && !single ? `${s.l}${s.d ? ` / ${s.d}` : ""}` : hex || one, key)}
        title={`Copia ${s.n}`}
      >
        <span className={`apl-box${single ? "" : " apl-box--split"}`}>
          {single ? (
            <span className="apl-half" style={{ background: one }} />
          ) : (
            <>
              <span className="apl-half apl-half--a" style={{ background: s.l }} />
              <span className="apl-half apl-half--b" style={{ background: s.d ?? s.l }} />
            </>
          )}
          <span className="apl-copied">{copied === key ? <IcCheck size={14} /> : <IcCopy size={13} />}</span>
        </span>

        <span className="apl-meta">
          <span className="apl-n">
            {s.n}
            {cr && (
              <i className={`apl-cr${cr >= 7 ? " is-aaa" : cr >= 4.5 ? " is-aa" : ""}`}>
                {cr.toFixed(1)}:1
              </i>
            )}
          </span>
          {s.v && <code className="apl-var">{s.v}</code>}
          {single ? (
            <span className="apl-val">{hex && hex !== one.toLowerCase() ? `${hex} · ${one}` : one}</span>
          ) : (
            <>
              <span className="apl-val"><i>C</i> {s.l}</span>
              {s.d && s.d !== s.l && <span className="apl-val"><i>S</i> {s.d}</span>}
            </>
          )}
          {s.note && <span className="apl-note">{s.note}</span>}
        </span>
      </button>
    );
  };

  return (
    <>
      <button type="button" className="apl-open" onClick={() => setOpen(true)} data-no-i18n>
        <IcPalette size={15} />
        Palette
      </button>

      {open &&
        createPortal(
          <div className="apl-modal" role="dialog" aria-modal="true" aria-label="Palette del sito" data-no-i18n>
            <div className="apl-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="apl-dialog sb-home">
              <div className="apl-bar">
                <div className="apl-bar-txt">
                  <span className="apl-bar-title">
                    <IcPalette size={17} />
                    Palette
                    <span className="apl-tag">{TOTAL} tinte</span>
                  </span>
                  <span className="apl-bar-sub">
                    Il sistema colore di albertopecchini.it — token, identità, dati, gradienti e ombre
                  </span>
                </div>
                <button type="button" className="apl-close" onClick={() => setOpen(false)} aria-label="Chiudi">
                  <IcClose size={18} />
                </button>
              </div>

              <div className="apl-tools">
                <div className="apl-seg" role="group" aria-label="Tema mostrato">
                  {([["l", "Chiaro"], ["d", "Scuro"], ["both", "Confronto"]] as [Mode, string][]).map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      className={mode === m ? "is-on" : ""}
                      onClick={() => setMode(m)}
                      aria-pressed={mode === m}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <label className="apl-search">
                  <IcSearch size={14} />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cerca nome, variabile o valore…"
                    aria-label="Cerca nella palette"
                  />
                </label>

                <button type="button" className="apl-btn" onClick={() => copy(exportCss(), "css")}>
                  {copied === "css" ? <IcCheck size={14} /> : <IcCopy size={14} />}
                  {copied === "css" ? "Copiate" : "Copia CSS"}
                </button>
              </div>

              <div className="apl-body" style={canvas}>
                {groups.map((g) => (
                  <section key={g.id} className="apl-grp">
                    <h3 className="apl-h">
                      {g.t}
                      <i>{g.sw.length}</i>
                    </h3>
                    <p className="apl-sub">{g.s}</p>
                    <div className={`apl-grid${g.wide ? " apl-grid--wide" : ""}`}>
                      {g.sw.map((s) => swatch(s, g.id, g.contrast, g.wide))}
                    </div>
                  </section>
                ))}

                {shadows.length > 0 && (
                  <section className="apl-grp">
                    <h3 className="apl-h">
                      Ombre
                      <i>{shadows.length}</i>
                    </h3>
                    <p className="apl-sub">
                      Il rilievo è sempre morbido e spostato in basso: le card si sollevano di poco, mai di scatto.
                    </p>
                    <div className="apl-shadows">
                      {shadows.map((s) => {
                        const one = val(s, themeKey);
                        const key = `sh-${s.n}`;
                        return (
                          <button
                            key={key}
                            type="button"
                            className="apl-shadow"
                            onClick={() => copy(one, key)}
                            title={`Copia ${s.n}`}
                          >
                            <span className="apl-shadow-box" style={{ boxShadow: one }} />
                            <b>{s.n}</b>
                            {s.v && <code className="apl-var">{s.v}</code>}
                            <span className="apl-val">{one}</span>
                            {copied === key && <span className="apl-shadow-ok"><IcCheck size={13} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {shown === 0 && <p className="apl-empty">Nessuna tinta per «{q}».</p>}

                {/* Prova sul campo: la palette messa al lavoro, nel tema scelto */}
                {!needle && (
                  <section className="apl-grp">
                    <h3 className="apl-h">Dal vivo</h3>
                    <p className="apl-sub">Gli stessi token, montati come li vedi sul sito.</p>
                    <div className="apl-demo">
                      {(mode === "both" ? (["l", "d"] as const) : ([themeKey] as const)).map((k) => (
                        <div
                          key={k}
                          className="apl-demo-card"
                          style={
                            {
                              background: PAGE_BG[k],
                              color: PAGE_FG[k],
                              borderColor: k === "l" ? "#e8e8e8" : "#2a2a2a",
                              "--demo-sub": k === "l" ? "#6f6f6f" : "#969696",
                              "--demo-chip": k === "l" ? "#f6f6f6" : "#222222",
                              "--demo-bd": k === "l" ? "#dbdbdb" : "#343434",
                              "--demo-btn": k === "l" ? "hsl(151, 67%, 67%)" : "hsl(155, 100%, 19%)",
                              "--demo-btn-bd": k === "l" ? "hsla(155, 78%, 40%, 0.75)" : "hsla(153, 60%, 53%, 0.3)",
                              "--demo-btn-fg": k === "l" ? "#101010" : "#ffffff",
                              "--demo-brand": k === "l" ? "hsl(153, 86%, 28%)" : "hsl(155, 100%, 42%)",
                            } as CSSProperties
                          }
                        >
                          <span className="apl-demo-lab">{k === "l" ? "Chiaro" : "Scuro"}</span>
                          <b className="apl-demo-title">Alberto Pecchini</b>
                          <span className="apl-demo-txt">
                            Designer &amp; Developer — un <span className="apl-demo-link">collegamento</span> nel testo.
                          </span>
                          <span className="apl-demo-row">
                            <span className="apl-demo-btn">Contattami</span>
                            <span className="apl-demo-chip">React</span>
                            <span className="apl-demo-chip">TypeScript</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="apl-foot">
                <span>
                  {shown === TOTAL ? `${TOTAL} tinte` : `${shown} di ${TOTAL} tinte`} · {GROUPS.length + 1} famiglie
                </span>
                <span className="apl-foot-hint">Tocca una tinta per copiarla · Esc per chiudere</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
