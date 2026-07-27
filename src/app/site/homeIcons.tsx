// ─────────────────────────────────────────────────────────────────────────────
// Icone delle pagine in veste "piattaforma" (home, /bio, /sostieni,
// /instagram, /archivio, /pcto, /trivia) — disegnate da zero, niente librerie.
// Stile: outline 24×24, tratto 1.5, terminali e giunzioni arrotondati (la
// stessa grammatica delle icone-prodotto di Supabase). Tutte in currentColor.
// ─────────────────────────────────────────────────────────────────────────────

export interface IcProps {
  size?: number;
  className?: string;
}

function Ic({ size = 18, className, children }: IcProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ── UI ── */

export const IcMenu = (p: IcProps) => (
  <Ic {...p}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></Ic>
);

export const IcClose = (p: IcProps) => (
  <Ic {...p}><path d="M6 6l12 12M18 6L6 18" /></Ic>
);

export const IcArrowRight = (p: IcProps) => (
  <Ic {...p}><path d="M4.5 12h15M13.5 6l6 6-6 6" /></Ic>
);

export const IcArrowLeft = (p: IcProps) => (
  <Ic {...p}><path d="M19.5 12h-15M10.5 6l-6 6 6 6" /></Ic>
);

export const IcArrowUpRight = (p: IcProps) => (
  <Ic {...p}><path d="M7 17L17 7M9 7h8v8" /></Ic>
);

export const IcChevronRight = (p: IcProps) => (
  <Ic {...p}><path d="M9 5l7 7-7 7" /></Ic>
);

export const IcChevronLeft = (p: IcProps) => (
  <Ic {...p}><path d="M15 5l-7 7 7 7" /></Ic>
);

export const IcExternal = (p: IcProps) => (
  <Ic {...p}>
    <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
    <path d="M14 3.5h6.5V10M19.9 4.1L11.5 12.5" />
  </Ic>
);

export const IcDownload = (p: IcProps) => (
  <Ic {...p}><path d="M12 4v10.5M7 10.5l5 5 5-5M4.5 19.5h15" /></Ic>
);

export const IcEye = (p: IcProps) => (
  <Ic {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.7" />
  </Ic>
);

export const IcFile = (p: IcProps) => (
  <Ic {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5M9 13h6M9 16.5h6" />
  </Ic>
);

export const IcMail = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3.8 7.2l8.2 5.8 8.2-5.8" />
  </Ic>
);

export const IcHeart = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 20.2S3.5 15.1 3.5 9.3c0-2.7 2.1-4.8 4.7-4.8 1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.6 0 4.7 2.1 4.7 4.8 0 5.8-8.5 10.9-8.5 10.9z" />
  </Ic>
);

export const IcCheck = (p: IcProps) => (
  <Ic {...p}><path d="M4.5 12.5l5 5L19.5 6.5" /></Ic>
);

export const IcSearch = (p: IcProps) => (
  <Ic {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.3 15.3l4.7 4.7" /></Ic>
);

export const IcArrowUp = (p: IcProps) => (
  <Ic {...p}><path d="M12 19.5v-15M6 10.5l6-6 6 6" /></Ic>
);

export const IcArrowDown = (p: IcProps) => (
  <Ic {...p}><path d="M12 4.5v15M6 13.5l6 6 6-6" /></Ic>
);

export const IcHome = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 10.7L12 3.5l8.5 7.2" />
    <path d="M5.8 9.8v9.2c0 .8.7 1.5 1.5 1.5h9.4c.8 0 1.5-.7 1.5-1.5V9.8" />
  </Ic>
);

export const IcTrash = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4 6.5h16M9.5 6.2V4h5v2.2" />
    <path d="M6.1 7l.8 12c.07 1.05.9 1.9 1.95 1.9h6.3c1.05 0 1.88-.85 1.95-1.9l.8-12" />
    <path d="M10 10.5v6.5M14 10.5v6.5" />
  </Ic>
);

export const IcList = (p: IcProps) => (
  <Ic {...p}>
    <path d="M9 6.2h11.5M9 12h11.5M9 17.8h11.5" />
    <circle cx="4.6" cy="6.2" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="4.6" cy="12" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="4.6" cy="17.8" r="1.05" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcGrid = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </Ic>
);

export const IcMore = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="5.2" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.8" r="1.4" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcLink = (p: IcProps) => (
  <Ic {...p}>
    <path d="M10.4 14.4a4 4 0 0 0 5.65 0l2.95-2.95a4.03 4.03 0 0 0-5.7-5.7L11.8 7.25" />
    <path d="M13.6 9.6a4 4 0 0 0-5.65 0L5 12.55a4.03 4.03 0 0 0 5.7 5.7l1.5-1.5" />
  </Ic>
);

/* ── Barra di controllo: tema, sensore orario, lingua ── */

export const IcSun = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
  </Ic>
);

export const IcMoon = (p: IcProps) => (
  <Ic {...p}>
    <path d="M20.5 14.3A8.7 8.7 0 0 1 9.7 3.5a8.7 8.7 0 1 0 10.8 10.8z" />
  </Ic>
);

export const IcClock = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2V12l3.4 2" />
  </Ic>
);

export const IcTranslate = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3 5.6h8.4M7.2 3.5v2.1" />
    <path d="M9.5 5.6c-.5 4.3-3 7.2-6.5 8.6" />
    <path d="M5.4 8.9c1 2.3 3 4.1 5.4 4.8" />
    <path d="M12.8 20.5l3.9-9.4 3.9 9.4M14.2 17.2h5" />
  </Ic>
);

export const IcStar = ({ filled = false, ...p }: IcProps & { filled?: boolean }) => (
  <Ic {...p}>
    <path
      d="M12 3.4l2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3.4z"
      fill={filled ? "currentColor" : "none"}
    />
  </Ic>
);

export const IcFolder = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3 7.5c0-1.1.9-2 2-2h4.2c.6 0 1.2.3 1.6.8l1 1.2H19c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9z" />
  </Ic>
);

export const IcGrad = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 4.5L22 9.5 12 14.5 2 9.5 12 4.5z" />
    <path d="M6.5 12v3.6c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9V12" />
    <path d="M22 9.5v4.5" />
  </Ic>
);

export const IcGlobe = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <ellipse cx="12" cy="12" rx="3.8" ry="8.5" />
    <path d="M3.5 12h17" />
  </Ic>
);

export const IcFlow = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
    <path d="M6.75 10.5v4.25a2 2 0 0 0 2 2h4.75" />
  </Ic>
);

export const IcSparkle = (p: IcProps) => (
  <Ic {...p}>
    <path d="M10 4.5c.55 3.6 2.15 5.2 5.75 5.75-3.6.55-5.2 2.15-5.75 5.75-.55-3.6-2.15-5.2-5.75-5.75 3.6-.55 5.2-2.15 5.75-5.75z" />
    <path d="M18.3 14.5c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3z" />
  </Ic>
);

export const IcCopy = (p: IcProps) => (
  <Ic {...p}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
    <path d="M5.5 15H5.3A1.8 1.8 0 0 1 3.5 13.2V5.3A1.8 1.8 0 0 1 5.3 3.5h7.9A1.8 1.8 0 0 1 15 5.3v.2" />
  </Ic>
);

export const IcSend = (p: IcProps) => (
  <Ic {...p}>
    <path d="M20.7 3.3L13.9 20.6c-.3.8-1.5.8-1.8 0l-2.3-6.4-6.4-2.3c-.8-.3-.8-1.5 0-1.8L20.7 3.3z" />
    <path d="M20.4 3.6l-10.3 10.3" />
  </Ic>
);

export const IcLoader = (p: IcProps) => (
  <Ic {...p}><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" /></Ic>
);

export const IcCrown = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.6 18L3.2 7.6l4.9 3.3L12 5.2l3.9 5.7 4.9-3.3L19.4 18H4.6z" />
    <path d="M6.5 21h11" />
  </Ic>
);

export const IcGift = (p: IcProps) => (
  <Ic {...p}>
    <path d="M19.5 12.5V19a1.8 1.8 0 0 1-1.8 1.8H6.3A1.8 1.8 0 0 1 4.5 19v-6.5" />
    <rect x="3" y="8" width="18" height="4.5" rx="1.2" />
    <path d="M12 8v12.8" />
    <path d="M12 8s-.9-4.5-3.9-4.5a2.25 2.25 0 0 0 0 4.5" />
    <path d="M12 8s.9-4.5 3.9-4.5a2.25 2.25 0 0 1 0 4.5" />
  </Ic>
);

export const IcChevronDown = (p: IcProps) => (
  <Ic {...p}><path d="M6 9.5l6 6 6-6" /></Ic>
);

export const IcHelp = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.4a2.55 2.55 0 0 1 5 .75c0 1.7-2.5 2-2.5 3.65" />
    <circle cx="12" cy="16.8" r="0.75" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcSortAz = (p: IcProps) => (
  <Ic {...p}>
    <path d="M6.5 4v15.5M3.5 16.5l3 3 3-3" />
    <path d="M12.5 6h8M12.5 11.5h5.5M12.5 17h3" />
  </Ic>
);

export const IcUpload = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 15.5V4M7 9l5-5 5 5" />
    <path d="M4.5 15.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5" />
  </Ic>
);

export const IcPaste = (p: IcProps) => (
  <Ic {...p}>
    <path d="M8.5 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2" />
    <path d="M13.5 4.5h1a2 2 0 0 1 2 2v2" />
    <rect x="8.5" y="2.8" width="5" height="3.4" rx="1.2" />
    <rect x="11" y="11" width="9.5" height="10" rx="1.8" />
  </Ic>
);

export const IcRotate = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.2 9.6A8.5 8.5 0 1 1 3.5 12" />
    <path d="M3.4 4.4v5.4h5.3" />
  </Ic>
);

export const IcAlert = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 4.2L21 19.5H3L12 4.2z" />
    <path d="M12 9.6v4.1" />
    <circle cx="12" cy="16.6" r="0.75" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcShield = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 3.2l7.5 2.6v5.9c0 4.4-3.1 7.7-7.5 9.1-4.4-1.4-7.5-4.7-7.5-9.1V5.8L12 3.2z" />
    <path d="M8.8 12.1l2.4 2.4 4-4.4" />
  </Ic>
);

export const IcLock = (p: IcProps) => (
  <Ic {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15.2" r="1" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcWifiOff = (p: IcProps) => (
  <Ic {...p}>
    <path d="M2.6 8.7A15 15 0 0 1 8.2 5.5M21.4 8.7a15 15 0 0 0-6.8-3.2" />
    <path d="M5.9 12.3a10 10 0 0 1 2.9-1.9M18.1 12.3a10 10 0 0 0-3.2-2" />
    <path d="M9.2 15.9a5 5 0 0 1 5.6 0" />
    <circle cx="12" cy="19.2" r="0.85" fill="currentColor" stroke="none" />
    <path d="M3.4 3.4l17.2 17.2" />
  </Ic>
);

/* ── Relazioni fra profili (confronto di due liste) ── */

export const IcUserPlus = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="10" cy="8.2" r="3.9" />
    <path d="M2.9 20c.8-4 3.5-6.1 7.1-6.1 1 0 1.9.2 2.7.5" />
    <path d="M17.6 14.2v6M14.6 17.2h6" />
  </Ic>
);

export const IcUserX = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="10" cy="8.2" r="3.9" />
    <path d="M2.9 20c.8-4 3.5-6.1 7.1-6.1 1 0 1.9.2 2.7.5" />
    <path d="M15.2 15l5.2 5.2M20.4 15l-5.2 5.2" />
  </Ic>
);

export const IcUserMinus = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="10" cy="8.2" r="3.9" />
    <path d="M2.9 20c.8-4 3.5-6.1 7.1-6.1 1 0 1.9.2 2.7.5" />
    <path d="M14.6 17.2h6" />
  </Ic>
);

/* ── Prodotti / aree ── */

export const IcCode = (p: IcProps) => (
  <Ic {...p}>
    <rect x="2.5" y="4" width="19" height="15.5" rx="2" />
    <path d="M2.5 8.5h19" />
    <circle cx="5.4" cy="6.3" r="0.55" fill="currentColor" stroke="none" />
    <circle cx="7.7" cy="6.3" r="0.55" fill="currentColor" stroke="none" />
    <path d="M9.7 12.2l-2.6 2.6 2.6 2.6M14.3 12.2l2.6 2.6-2.6 2.6" />
  </Ic>
);

export const IcPen = (p: IcProps) => (
  <Ic {...p}>
    <path d="M5.6 18.4C7 11.5 11.5 7 18.4 5.6" />
    <rect x="3" y="17.4" width="3.6" height="3.6" rx="0.8" />
    <rect x="17.4" y="3" width="3.6" height="3.6" rx="0.8" />
  </Ic>
);

export const IcTerminal = (p: IcProps) => (
  <Ic {...p}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <path d="M6.5 10l3 2.5-3 2.5M12.5 15h5" />
  </Ic>
);

/* Dati strutturati (JSON, YAML, CSV): le graffe del codice. */
export const IcBraces = (p: IcProps) => (
  <Ic {...p}>
    <path d="M9.5 4.5c-1.7 0-2.5.9-2.5 2.5v2.2c0 1.3-.7 2-2 2.3v1c1.3.3 2 1 2 2.3V17c0 1.6.8 2.5 2.5 2.5" />
    <path d="M14.5 4.5c1.7 0 2.5.9 2.5 2.5v2.2c0 1.3.7 2 2 2.3v1c-1.3.3-2 1-2 2.3V17c0 1.6-.8 2.5-2.5 2.5" />
  </Ic>
);

/* Commit: il nodo sulla linea della storia. */
export const IcGitCommit = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="3.4" />
    <path d="M2.5 12h6.1M15.4 12h6.1" />
  </Ic>
);

/* Ramo: la diramazione del repository. */
export const IcGitBranch = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="7" cy="5.8" r="2.3" />
    <circle cx="7" cy="18.2" r="2.3" />
    <circle cx="17" cy="9.4" r="2.3" />
    <path d="M7 8.1v7.8M17 11.7c0 2.6-2.1 4.2-5.5 4.6" />
  </Ic>
);

export const IcGame = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7.2 7.8h9.6c2.9 0 5.2 2.3 5.2 5.2 0 1.9-1.4 3.6-3.3 3.6-1.1 0-2.1-.5-2.8-1.4l-.9-1.2H9l-.9 1.2c-.7.9-1.7 1.4-2.8 1.4-1.9 0-3.3-1.7-3.3-3.6 0-2.9 2.3-5.2 5.2-5.2z" />
    <path d="M7.4 10.9v3M5.9 12.4h3" />
    <circle cx="15.6" cy="11.3" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="17.9" cy="13.5" r="0.85" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcVenn = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="9.3" cy="12" r="5.8" />
    <circle cx="14.7" cy="12" r="5.8" />
  </Ic>
);

export const IcCompass = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 6.6L5.6 19.5M12 6.6l6.4 12.9" />
    <circle cx="12" cy="4.7" r="1.8" />
    <path d="M8.1 16.9c2.4 1.35 5.4 1.35 7.8 0" />
  </Ic>
);

export const IcRuler = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3 16.5L16.5 3l4.5 4.5L7.5 21 3 16.5z" />
    <path d="M7.1 12.4l2 2M10.5 9l2 2M13.9 5.6l2 2" />
  </Ic>
);

export const IcUser = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="8.2" r="3.9" />
    <path d="M4.8 20c.8-4 3.6-6.1 7.2-6.1s6.4 2.1 7.2 6.1" />
  </Ic>
);

export const IcBook = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 6.6C10 4.9 7 4.5 4 5.3v13.4c3-.8 6-.4 8 1.3 2-1.7 5-2.1 8-1.3V5.3c-3-.8-6-.4-8 1.3z" />
    <path d="M12 6.6V20" />
  </Ic>
);

export const IcCat = (p: IcProps) => (
  <Ic {...p}>
    <path d="M6.3 9.8L5.2 4.6 9.4 7M17.7 9.8l1.1-5.2L14.6 7" />
    <circle cx="12" cy="13.2" r="6.3" />
    <circle cx="9.7" cy="12.4" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="14.3" cy="12.4" r="0.8" fill="currentColor" stroke="none" />
    <path d="M11 15.4h2l-1 1.2-1-1.2z" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcId = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.4" cy="10.4" r="1.9" />
    <path d="M5.6 15.8c.5-1.6 1.5-2.4 2.8-2.4s2.3.8 2.8 2.4M14.5 9.8h4M14.5 13.2h3" />
  </Ic>
);

/* ── Bio: dati essenziali, hobby, passioni, competenze ── */

export const IcCake = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.5 20.5v-6c0-1.1.9-2 2-2h11c1.1 0 2 .9 2 2v6" />
    <path d="M3 20.5h18M4.5 16.5h15" />
    <path d="M12 12.5V9" />
  </Ic>
);

export const IcPin = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 21.2s-6.8-5.5-6.8-10.5a6.8 6.8 0 0 1 13.6 0c0 5-6.8 10.5-6.8 10.5z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </Ic>
);

export const IcBuilding = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 15.5 5v15.5" />
    <path d="M15.5 10.5h3a1.5 1.5 0 0 1 1.5 1.5v8.5M3 20.5h18" />
    <path d="M8 8h4M8 12.5h4" />
    <path d="M10 20.5v-3.5" />
  </Ic>
);

export const IcMoto = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="5.3" cy="16.4" r="3.4" />
    <circle cx="18.7" cy="16.4" r="3.4" />
    <path d="M5.3 16.4l4.4-6.6h4.6l4.4 6.6" />
    <path d="M13 9.8h3.8" />
  </Ic>
);

export const IcTarget = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcPlane = (p: IcProps) => (
  <Ic {...p}>
    <path d="M21 3.5L12.6 20.5l-2.3-8.3L2 9.9l19-6.4z" />
    <path d="M21 3.5l-10.7 8.7" />
  </Ic>
);

export const IcFork = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7 11v9.5M4.5 3.5v4.5a2.5 2.5 0 0 0 5 0V3.5" />
    <path d="M7 3.5V11" />
    <path d="M17 20.5v-17c-2.2 1.7-3.5 4.4-3.5 7.1v1.9c0 1.1.9 2 2 2H17" />
  </Ic>
);

export const IcUsers = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="9" cy="8.6" r="3.4" />
    <path d="M2.8 19.6c.7-3.5 3.1-5.4 6.2-5.4s5.5 1.9 6.2 5.4" />
    <path d="M15.4 5.6a3.4 3.4 0 0 1 0 6.1" />
    <path d="M17.7 14.7c2.1.7 3.6 2.4 4.1 4.9" />
  </Ic>
);

export const IcPalette = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 2-.8 2-1.8 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1 .8-1.8 1.9-1.8h2.1c2.1 0 3.7-1.6 3.7-3.6C20.5 6.6 16.7 3.5 12 3.5z" />
    <circle cx="8.6" cy="7.9" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="13.3" cy="6.6" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="16.8" cy="10.3" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="6.9" cy="12.4" r="0.95" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcBrick = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="5" width="18" height="14.5" rx="1.5" />
    <path d="M3 9.8h18M3 14.7h18" />
    <path d="M8.5 5v4.8M15.5 5v4.8M12 9.8v4.9M8.5 14.7v4.8M15.5 14.7v4.8" />
  </Ic>
);

export const IcTractor = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="7.2" cy="15.6" r="4.4" />
    <circle cx="18.5" cy="17.6" r="2.5" />
    <path d="M11.6 15.6V8.6H6.2" />
    <path d="M11.6 13h4.9l2 3.4" />
  </Ic>
);

export const IcScreen = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="4.5" width="18" height="12.5" rx="2" />
    <path d="M12 17v3.5M8 20.5h8" />
  </Ic>
);

export const IcStore = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.1 9.5l1.1-5h13.6l1.1 5" />
    <path d="M3.5 9.5a2.1 2.1 0 0 0 4.2 0 2.15 2.15 0 0 0 4.3 0 2.15 2.15 0 0 0 4.3 0 2.1 2.1 0 0 0 4.2 0" />
    <path d="M5 13v6.5c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V13" />
    <path d="M9.3 20.5v-4.4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1v4.4" />
  </Ic>
);

export const IcWrench = (p: IcProps) => (
  <Ic {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z" />
  </Ic>
);

export const IcImage = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <circle cx="8.6" cy="9.3" r="1.6" />
    <path d="M21 15.3l-4.2-4.2c-.8-.8-2-.8-2.8 0L6 19.2" />
  </Ic>
);

/* ── PCTO: ore, validazione, calcolo ── */

export const IcHourglass = (p: IcProps) => (
  <Ic {...p}>
    <path d="M6.5 3.5h11M6.5 20.5h11" />
    <path d="M8 3.5v3.2c0 1.9 1.4 3.5 2.9 4.4.7.4.7 1.4 0 1.8C9.4 13.8 8 15.4 8 17.3v3.2" />
    <path d="M16 3.5v3.2c0 1.9-1.4 3.5-2.9 4.4-.7.4-.7 1.4 0 1.8 1.5.9 2.9 2.5 2.9 4.4v3.2" />
  </Ic>
);

/* Schermo con spunta: la validazione dei tecnici. */
export const IcScreenCheck = (p: IcProps) => (
  <Ic {...p}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 20.5h7M12 17v3.5" />
    <path d="M8.8 10.4l2.2 2.2 4.2-4.4" />
  </Ic>
);

export const IcCalculator = (p: IcProps) => (
  <Ic {...p}>
    <rect x="4.5" y="2.8" width="15" height="18.4" rx="2" />
    <rect x="7.5" y="5.8" width="9" height="3.2" rx="0.9" />
    <circle cx="8.6" cy="12.9" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12.9" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="12.9" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="8.6" cy="17.1" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17.1" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="17.1" r="0.85" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcExplore = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.7 8.3l-2 5.4-5.4 2 2-5.4 5.4-2z" />
  </Ic>
);

/* ── /me-stesso: scuola, cascina, sport, strada, futuro ── */

export const IcCalendar = (p: IcProps) => (
  <Ic {...p}>
    <rect x="3" y="5.2" width="18" height="15.3" rx="2" />
    <path d="M8 3.2v4M16 3.2v4M3 10h18" />
    <circle cx="8.4" cy="14" r="0.85" fill="currentColor" stroke="none" />
  </Ic>
);

/* Germoglio: lo stelo con due foglie — la cascina di famiglia. */
export const IcSprout = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 20.5V10.2" />
    <path d="M12 14.4c-3.3 0-5.9-2.6-5.9-5.9 3.3 0 5.9 2.6 5.9 5.9z" />
    <path d="M12 11.6c0-3.3 2.6-5.9 5.9-5.9 0 3.3-2.6 5.9-5.9 5.9z" />
  </Ic>
);

/* Albero a chioma tonda: il verde dei parchi e dei giardini (il conifero
   IcTree, più giù, resta quello dei boschi del PCTO). */
export const IcPark = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="8.9" r="6.4" />
    <path d="M12 15.3v5.2M8.4 20.5h7.2" />
  </Ic>
);

export const IcWaves = (p: IcProps) => (
  <Ic {...p}>
    <path d="M2.5 7.8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    <path d="M2.5 12.4c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    <path d="M2.5 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
  </Ic>
);

/* Mirino: il tiro a volo. */
export const IcCrosshair = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 1.8v4.2M12 18v4.2M1.8 12H6M18 12h4.2" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Ic>
);

export const IcVolley = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M4.2 8.6c4.7-.7 8.6 1.4 11 6.2" />
    <path d="M11.6 3.5c2.4 3.7 2.7 7.6.9 11.7" />
    <path d="M19.3 16.2c-3.7-2.7-7.6-3.1-11.7-1.3" />
  </Ic>
);

export const IcCar = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.6 12.4l1.6-4.6A2 2 0 0 1 8.1 6.4h7.8a2 2 0 0 1 1.9 1.4l1.6 4.6" />
    <path d="M3.5 12.4h17v4.2a1.4 1.4 0 0 1-1.4 1.4H4.9a1.4 1.4 0 0 1-1.4-1.4v-4.2z" />
    <circle cx="7.3" cy="15" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="16.7" cy="15" r="0.9" fill="currentColor" stroke="none" />
    <path d="M6.6 18v1.6M17.4 18v1.6" />
  </Ic>
);

export const IcCart = (p: IcProps) => (
  <Ic {...p}>
    <path d="M2.8 4.5h2.3l2.4 10.3h9.3l2.4-7.7H6.3" />
    <circle cx="9.3" cy="19" r="1.4" />
    <circle cx="16.4" cy="19" r="1.4" />
  </Ic>
);

export const IcTrend = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 16.6l5.4-5.4 3.4 3.4 6.4-6.4" />
    <path d="M15.2 8.2h4.6v4.6" />
  </Ic>
);

/* La scuola: l'edificio con la bandierina. */
export const IcSchool = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4 20.5V9.8l8-4.6 8 4.6v10.7" />
    <path d="M2.5 20.5h19" />
    <path d="M9.6 20.5v-4.6a2.4 2.4 0 0 1 4.8 0v4.6" />
    <path d="M12 5.2V2.4h3.4v1.8H12" />
  </Ic>
);

export const IcZap = (p: IcProps) => (
  <Ic {...p}><path d="M12.9 2.5L5.2 13.4h5.5l-.6 8.1L18.8 10.6h-5.5l-.4-8.1z" /></Ic>
);

export const IcMountain = (p: IcProps) => (
  <Ic {...p}>
    <path d="M2.5 19.5L9.4 7.8l4.3 7.1 2.3-3.3 5.5 7.9z" />
    <path d="M7.6 11l3.6 1.6" />
  </Ic>
);

/* ── Trivia: interfaccia di gioco ──
   Fiamma (streak), coppa (record), classifica, pagella, tempo, schermo intero. */

export const IcFlame = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12.6 2.8c-.4 2.5-1.6 4.1-3.1 5.6C7.6 10.2 6 12 6 14.4a6 6 0 0 0 12 0c0-2.4-1.1-4.3-2.6-6-.6.7-1 1.5-1.2 2.4-1.2-2.5-1.6-5.1-1.6-8z" />
    <path d="M12 20.3a2.8 2.8 0 0 1-2.8-2.8c0-1.7 2-2.6 2.4-4.8 1.6 1.6 3.2 3 3.2 4.8a2.8 2.8 0 0 1-2.8 2.8z" />
  </Ic>
);

export const IcTrophy = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7.5 3.5h9v5.2a4.5 4.5 0 0 1-9 0V3.5z" />
    <path d="M7.5 5.3H4.8v1.6a3.2 3.2 0 0 0 3.2 3.2M16.5 5.3h2.7v1.6a3.2 3.2 0 0 1-3.2 3.2" />
    <path d="M12 13.2v3.6M8.6 20.5h6.8l-.8-3.7H9.4l-.8 3.7z" />
  </Ic>
);

export const IcRanking = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 20.5h17" />
    <rect x="4.2" y="12.4" width="4.4" height="8.1" rx="1" />
    <rect x="9.8" y="8" width="4.4" height="12.5" rx="1" />
    <rect x="15.4" y="14.8" width="4.4" height="5.7" rx="1" />
    <path d="M12 3.5l.9 1.9 2 .3-1.5 1.5.4 2.1-1.8-1-1.8 1 .4-2.1L9.1 5.7l2-.3.9-1.9z" />
  </Ic>
);

export const IcListCheck = (p: IcProps) => (
  <Ic {...p}>
    <path d="M10.5 6.5h10M10.5 12h10M10.5 17.5h10" />
    <path d="M3.2 6.3l1.5 1.5 2.6-2.9M3.2 16.8l1.5 1.5 2.6-2.9" />
    <path d="M3.5 12h3.8" />
  </Ic>
);

export const IcToggle = (p: IcProps) => (
  <Ic {...p}>
    <rect x="2.5" y="6.8" width="19" height="10.4" rx="5.2" />
    <circle cx="7.7" cy="12" r="2.7" />
  </Ic>
);

export const IcSort = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7.2 3.8v16.4M3.6 7.4l3.6-3.6 3.6 3.6" />
    <path d="M16.8 20.2V3.8M13.2 16.6l3.6 3.6 3.6-3.6" />
  </Ic>
);

export const IcPlay = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7.5 4.6l11.2 7.4-11.2 7.4V4.6z" />
  </Ic>
);

export const IcExpand = (p: IcProps) => (
  <Ic {...p}>
    <path d="M14.2 3.5h6.3v6.3M20.5 3.5l-7 7" />
    <path d="M9.8 20.5H3.5v-6.3M3.5 20.5l7-7" />
  </Ic>
);

export const IcCollapse = (p: IcProps) => (
  <Ic {...p}>
    <path d="M20.5 9.8h-6.3V3.5M14.2 9.8l6.3-6.3" />
    <path d="M3.5 14.2h6.3v6.3M9.8 14.2L3.5 20.5" />
  </Ic>
);

export const IcBookOpen = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 6.6C10.4 5.2 8.4 4.5 6 4.5H3v13.4h3c2.4 0 4.4.7 6 2.1" />
    <path d="M12 6.6c1.6-1.4 3.6-2.1 6-2.1h3v13.4h-3c-2.4 0-4.4.7-6 2.1" />
    <path d="M12 6.6V20" />
  </Ic>
);

export const IcBrain = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 5.2a3 3 0 0 0-5.6-1.1A2.9 2.9 0 0 0 3.7 8.5a3 3 0 0 0 .5 4.6 3 3 0 0 0 2.2 4.4A3 3 0 0 0 12 18.9z" />
    <path d="M12 5.2a3 3 0 0 1 5.6-1.1 2.9 2.9 0 0 1 2.7 4.4 3 3 0 0 1-.5 4.6 3 3 0 0 1-2.2 4.4A3 3 0 0 1 12 18.9z" />
    <path d="M12 5.2v13.7" />
  </Ic>
);

/* ── Trivia: icone dei capitoli (storia dell'architettura) ── */

export const IcLandmark = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 3.3l8.5 4.4H3.5L12 3.3z" />
    <path d="M6 10.4v6.9M10 10.4v6.9M14 10.4v6.9M18 10.4v6.9" />
    <path d="M3.5 20.5h17M4.6 17.3h14.8" />
  </Ic>
);

export const IcSkyline = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 20.5V9.4l5.6-2.6v13.7" />
    <path d="M9.1 12.2l5.5-2.5v10.8" />
    <path d="M14.6 13.6h5.9v6.9" />
    <path d="M2.6 20.5h18.8" />
    <path d="M6 12.4v1.6M6 16v1.6M17.4 16.4v1.4" />
  </Ic>
);

export const IcChurch = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 2.6v4.9M10.2 4.4h3.6" />
    <path d="M12 7.5l4.6 3.4v9.6H7.4v-9.6L12 7.5z" />
    <path d="M4.2 20.5v-6.6l3.2-2.3M19.8 20.5v-6.6l-3.2-2.3" />
    <path d="M3 20.5h18M10.6 20.5v-4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v4" />
  </Ic>
);

export const IcTower = (p: IcProps) => (
  <Ic {...p}>
    <path d="M9.4 3.5h5.2l1.6 17H7.8l1.6-17z" />
    <path d="M8.7 10.2h6.6M8.2 15h7.6" />
    <path d="M4.6 20.5h14.8" />
  </Ic>
);

export const IcFactory = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 20.5v-9.2l5.2 3v-3l5.2 3V6.4h1.4l1 14.1" />
    <path d="M2.6 20.5h18.8" />
    <path d="M6.2 16.6v1.5M11.4 16.6v1.5M16.6 16.6v1.5" />
  </Ic>
);

export const IcCastle = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 20.5V6.6h2.3v2.2h2.3V6.6h2.3v2.2h2.4V6.6h2.3v2.2h2.3V6.6h2.3v13.9" />
    <path d="M2.6 20.5h18.8" />
    <path d="M9.6 20.5v-4.4a2.4 2.4 0 0 1 4.8 0v4.4" />
    <path d="M6.4 12.6h1.6M16 12.6h1.6" />
  </Ic>
);

export const IcTree = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 3.2l4.2 5.4h-2.4l3.4 4.5h-2.6l3.6 4.7H5.8l3.6-4.7H6.8l3.4-4.5H7.8L12 3.2z" />
    <path d="M12 17.8v2.7M9.4 20.5h5.2" />
  </Ic>
);

export const IcColumns = (p: IcProps) => (
  <Ic {...p}>
    <path d="M3.5 5.4h17M4.6 20.5h14.8" />
    <path d="M7 5.4v15.1M12 5.4v15.1M17 5.4v15.1" />
    <path d="M3.5 8h17" />
  </Ic>
);

export const IcFlower = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="9.4" r="2.3" />
    <path d="M12 7.1c0-1.9-1-2.9-2.3-2.9S7.4 5.2 7.4 7.1s1 2.3 2.3 2.3" />
    <path d="M12 7.1c0-1.9 1-2.9 2.3-2.9s2.3 1 2.3 2.9-1 2.3-2.3 2.3" />
    <path d="M9.7 9.4c-1.9 0-2.9 1-2.9 2.3s1 2.3 2.9 2.3 2.3-1 2.3-2.3" />
    <path d="M14.3 9.4c1.9 0 2.9 1 2.9 2.3s-1 2.3-2.9 2.3-2.3-1-2.3-2.3" />
    <path d="M12 14v6.5M12 17.4c1.7 0 3-1 3.5-2.4" />
  </Ic>
);

export const IcTheater = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4.4 4.5h15.2v6.9a7.6 7.6 0 0 1-15.2 0V4.5z" />
    <path d="M8.8 8.9h.02M15.2 8.9h.02" />
    <path d="M9 13.4c.9.9 1.9 1.4 3 1.4s2.1-.5 3-1.4" />
    <path d="M3.4 4.5h17.2" />
  </Ic>
);

export const IcCube = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 2.9l8.4 4.6v9L12 21.1 3.6 16.5v-9L12 2.9z" />
    <path d="M3.8 7.6L12 12.1l8.2-4.5M12 12.1v9" />
  </Ic>
);

export const IcTriangleGlyph = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 3.6l8.6 16.9H3.4L12 3.6z" />
    <path d="M12 3.6v16.9M7.2 14.3h9.6" />
  </Ic>
);

/* Glifo per progetto (sostituisce ProjectIcon di lucide nella home). */
export function ProjectGlyph({ thumb, size = 18 }: { thumb?: string; size?: number }) {
  switch (thumb) {
    case "trivia":     return <IcGame size={size} />;
    case "instagram":  return <IcVenn size={size} />;
    case "pcto":       return <IcRuler size={size} />;
    case "mestesso":   return <IcUser size={size} />;
    case "dubliners":  return <IcBook size={size} />;
    case "gattopardo": return <IcCat size={size} />;
    default:           return <IcGlobe size={size} />;
  }
}
