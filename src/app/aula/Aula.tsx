import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Moon, Sun, Hand, ZoomIn, ZoomOut } from "lucide-react";

// ─── Modello stanza (metri) ─────────────────────────────────────────────────
// x = Est-Ovest (corto) · y = Nord-Sud (lungo) · z = altezza
const RW = 8.0;   // larghezza E-W (aula quasi quadrata, come la pianta)
const RD = 9;     // profondità N-S
const RH = 3.8;   // altezza pareti
const CX = RW / 2;
const CY = RD / 2;
const WAINSCOT = 1.5; // porzione bassa gialla

// ─── Proiezione isometrica 2:1 ──────────────────────────────────────────────
const ISO_X = 25;
const ISO_Y = 12.5;
const ISO_Z = 30;

// Zoom vettoriale (scale CSS sull'SVG → nitidezza cartoon sempre intatta).
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 4;

type Pt = { sx: number; sy: number; depth: number };
type Proj = (x: number, y: number, z: number) => Pt;

// Rotazione di pianta attorno al centro stanza + mappatura iso.
// Angolo continuo (gradi) → drag fluido; lo snap riporta ai multipli di 90°.
function makeProject(angleDeg: number): Proj {
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return (x, y, z) => {
    const dx = x - CX;
    const dy = y - CY;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return {
      sx: (rx - ry) * ISO_X,
      sy: (rx + ry) * ISO_Y - z * ISO_Z,
      depth: rx + ry, // più grande = più vicino allo spettatore
    };
  };
}

// ─── Helper colore ──────────────────────────────────────────────────────────
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(Math.min(255, ((n >> 16) & 255) * f));
  const g = Math.round(Math.min(255, ((n >> 8) & 255) * f));
  const b = Math.round(Math.min(255, (n & 255) * f));
  return `rgb(${r},${g},${b})`;
}
const join = (ps: Pt[]) => ps.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");

// ─── Box isometrico (top + 2 facce visibili) ────────────────────────────────
type Draw = { depth: number; node: React.ReactNode };

function isoBox(
  P: Proj,
  x: number, y: number, z0: number,
  w: number, d: number, h: number,
  color: string,
  key: string,
  ribs = 0,
): Draw {
  const hw = w / 2, hd = d / 2;
  const corners: [number, number][] = [
    [x - hw, y - hd], [x + hw, y - hd], [x + hw, y + hd], [x - hw, y + hd],
  ];
  const base = corners.map((c) => P(c[0], c[1], z0));
  const top = corners.map((c) => P(c[0], c[1], z0 + h));
  const cxs = (base[0].sx + base[1].sx + base[2].sx + base[3].sx) / 4;
  const cys = (base[0].sy + base[1].sy + base[2].sy + base[3].sy) / 4;

  const faces: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = base[i], b = base[(i + 1) % 4];
    const mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2;
    const ny = my - cys; // normale schermo: verso il basso = faccia visibile
    if (ny <= 0.01) continue;
    const nx = mx - cxs;
    const ta = top[i], tb = top[(i + 1) % 4];
    const f = nx < 0 ? 0.72 : 0.87; // faccia sinistra più scura
    faces.push(
      <polygon key={`f${i}`} points={join([a, b, tb, ta])} fill={shade(color, f)}
        stroke={shade(color, 0.5)} strokeWidth={0.6} strokeLinejoin="round" />,
    );
    // costole verticali (calorifero)
    if (ribs > 0) {
      for (let r = 1; r < ribs; r++) {
        const t = r / ribs;
        const bx = a.sx + (b.sx - a.sx) * t, by = a.sy + (b.sy - a.sy) * t;
        const tx = ta.sx + (tb.sx - ta.sx) * t, ty = ta.sy + (tb.sy - ta.sy) * t;
        faces.push(
          <line key={`r${i}-${r}`} x1={bx} y1={by} x2={tx} y2={ty}
            stroke={shade(color, 0.6)} strokeWidth={1.1} strokeLinecap="round" />,
        );
      }
    }
  }

  return {
    depth: P(x, y, z0).depth,
    node: (
      <g key={key}>
        {faces}
        <polygon points={join(top)} fill={shade(color, 1.07)}
          stroke={shade(color, 0.5)} strokeWidth={0.6} strokeLinejoin="round" />
      </g>
    ),
  };
}

// ─── Banchi e sedie (modello JsChair: legno chiaro + gambe metalliche) ────────
const WOOD = "#e7d09a";   // betulla chiara
const METAL = "#9aa0a6";  // tubolare metallico
const TRAY = "#dadee0";   // vano portaoggetti

// Gamba/montante come linea verticale (tubolare): poco costoso, legge bene.
function legLine(P: Proj, x: number, y: number, z0: number, z1: number, key: string): React.ReactNode {
  const a = P(x, y, z0), b = P(x, y, z1);
  return <line key={key} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={METAL} strokeWidth={1.6} strokeLinecap="round" />;
}

// Banco: 4 gambe + vano portaoggetti + piano in legno.
function deskUnit(P: Proj, x: number, y: number, key: string): Draw {
  const hw = 0.33, hd = 0.25, ins = 0.05;
  const legs = [
    legLine(P, x - hw + ins, y - hd + ins, 0, 0.6, `${key}-l0`),
    legLine(P, x + hw - ins, y - hd + ins, 0, 0.6, `${key}-l1`),
    legLine(P, x + hw - ins, y + hd - ins, 0, 0.6, `${key}-l2`),
    legLine(P, x - hw + ins, y + hd - ins, 0, 0.6, `${key}-l3`),
  ];
  const tray = isoBox(P, x, y, 0.40, 0.50, 0.40, 0.16, TRAY, `${key}-tray`);
  const top = isoBox(P, x, y, 0.56, 0.66, 0.50, 0.08, WOOD, `${key}-top`);
  return { depth: P(x, y, 0).depth, node: <g key={key}>{legs}{tray.node}{top.node}</g> };
}

// Sedia: seduta + gambe + schienale. dir=1 schienale a sud (studente guarda a
// nord); dir=-1 schienale a nord (prof guarda a sud). Stesso modello copiato.
function chairUnit(P: Proj, x: number, y: number, key: string, dir = 1): Draw {
  const cy = y + 0.46 * dir;           // centro seduta
  const shw = 0.21, shd = 0.21, ins = 0.04;
  const legs = [
    legLine(P, x - shw + ins, cy - shd + ins, 0, 0.45, `${key}-l0`),
    legLine(P, x + shw - ins, cy - shd + ins, 0, 0.45, `${key}-l1`),
    legLine(P, x + shw - ins, cy + shd - ins, 0, 0.45, `${key}-l2`),
    legLine(P, x - shw + ins, cy + shd - ins, 0, 0.45, `${key}-l3`),
  ];
  const seat = isoBox(P, x, cy, 0.42, 0.42, 0.42, 0.06, WOOD, `${key}-seat`);
  const by = cy + shd * dir;           // bordo schienale (dietro le spalle)
  const posts = [
    legLine(P, x - 0.19, by, 0.45, 0.82, `${key}-p0`),
    legLine(P, x + 0.19, by, 0.45, 0.82, `${key}-p1`),
  ];
  const back = isoBox(P, x, by, 0.55, 0.34, 0.05, 0.27, WOOD, `${key}-back`);
  return { depth: P(x, cy, 0).depth, node: <g key={key}>{legs}{seat.node}{posts}{back.node}</g> };
}

// ─── Cattedra (Desk.fbx): corpo antracite, cassetti a NORD, piano verde sopra ──
// Materiali presi da Desk_Base_Color.PNG: corpo/cassetti scuri, piano (legno) →
// reso verde omogeneo come richiesto ("verde solo sopra").
const CATT_TOP = "#2f7d4a";   // piano verde omogeneo
const CATT_BODY = "#34373c";  // corpo/cassetti antracite (come la texture)

function cattedraUnit(P: Proj, x: number, y: number, key: string): Draw {
  // Proporzioni da desk.glb (≈2.11×1.07×1.05) scalate a un'altezza realistica.
  // Struttura reale: cassettiera su un fianco + gamba sull'altro → VANO GAMBE
  // (kneehole) vuoto in mezzo; pannello modestia chiude solo il lato sud.
  const w = 1.55, d = 0.78, bh = 0.70, hw = w / 2, hd = d / 2;
  const pedD = d - 0.04;

  const top = isoBox(P, x, y, bh, w + 0.06, d + 0.06, 0.06, CATT_TOP, `${key}-top`);     // piano verde
  const pedX = x + 0.50, pedW = 0.52;
  const ped = isoBox(P, pedX, y, 0, pedW, pedD, bh, CATT_BODY, `${key}-ped`);             // cassettiera (est)
  const legW = isoBox(P, x - hw + 0.05, y, 0, 0.08, pedD, bh, CATT_BODY, `${key}-legW`);  // gamba/pannello (ovest)
  const k0 = x - hw + 0.09, k1 = pedX - pedW / 2;                                          // luce del vano gambe
  const mod = isoBox(P, (k0 + k1) / 2, y + hd - 0.05, 0.26, k1 - k0, 0.05, 0.42, CATT_BODY, `${key}-mod`); // pannello modestia (sud, chiuso)

  // Cassetti IN RILIEVO (cassetti sporgenti, non poligoni piatti) sulla faccia
  // nord della cassettiera — disegnati solo quando il lato nord è verso lo spettatore.
  const drawers: React.ReactNode[] = [];
  if (P(x, y - hd, bh / 2).sy > P(x, y, bh / 2).sy + 0.5) {
    const dy = y - pedD / 2 - 0.035; // sporge a nord oltre la faccia della pedana
    const bands = [[0.12, 0.27], [0.29, 0.44], [0.46, 0.61]] as const;
    bands.forEach(([z0, z1], k) => {
      drawers.push(isoBox(P, pedX, dy, z0, pedW - 0.10, 0.08, z1 - z0, shade(CATT_BODY, 1.28), `${key}-d${k}`).node);
      const hz = (z0 + z1) / 2;
      drawers.push(
        <line key={`${key}-h${k}`} {...seg(P(pedX - 0.13, dy - 0.045, hz), P(pedX + 0.13, dy - 0.045, hz))}
          stroke="#c2c6ca" strokeWidth={1.8} strokeLinecap="round" />,
      );
    });
  }
  return { depth: P(x, y, 0).depth, node: <g key={key}>{legW.node}{ped.node}{mod.node}{drawers}{top.node}</g> };
}

// ─── Pareti ─────────────────────────────────────────────────────────────────
type Wall = { id: "N" | "E" | "S" | "W"; p1: [number, number]; p2: [number, number]; len: number };
const WALLS: Wall[] = [
  { id: "N", p1: [0, 0], p2: [RW, 0], len: RW },
  { id: "E", p1: [RW, 0], p2: [RW, RD], len: RD },
  { id: "S", p1: [RW, RD], p2: [0, RD], len: RW },
  { id: "W", p1: [0, RD], p2: [0, 0], len: RD },
];

// punto sul piano della parete: u lungo p1→p2, v in altezza
function wp(P: Proj, w: Wall, u: number, v: number): Pt {
  const t = u / w.len;
  return P(w.p1[0] + (w.p2[0] - w.p1[0]) * t, w.p1[1] + (w.p2[1] - w.p1[1]) * t, v);
}
function wallBand(P: Proj, w: Wall, v0: number, v1: number): Pt[] {
  return [wp(P, w, 0, v0), wp(P, w, w.len, v0), wp(P, w, w.len, v1), wp(P, w, 0, v1)];
}
function mountQuad(P: Proj, w: Wall, u0: number, u1: number, v0: number, v1: number): Pt[] {
  return [wp(P, w, u0, v0), wp(P, w, u1, v0), wp(P, w, u1, v1), wp(P, w, u0, v1)];
}

interface Pal {
  yellow: string; white: string; base: string;
  glass: string; winFrame: string;
}

// ─── Sacca portatelefoni (parete N, a sinistra della porta, quasi nell'angolo) ─
// Organizer da muro 6×5 (numeri 1-30): corpo 3D che sporge dal muro + tasche con
// "bocca" scura (si vede che il telefono ci entra). Colori/proporzioni 1:1 con la foto.
function renderPhoneBag(P: Proj): React.ReactNode {
  const x0 = 0.07, x1 = 0.69, zBot = 1.05, zTop = 1.85;     // ingombro sul muro N
  const xc = (x0 + x1) / 2, w = x1 - x0, h = zTop - zBot;
  const depth = 0.06, yc = depth / 2, yF = depth;            // sporgenza nella stanza

  const body = isoBox(P, xc, yc, zBot, w, depth, h, "#1b2746", "phonebag-body");

  // Faccia frontale → sistema di coordinate locale: disegno tutto piatto (griglia,
  // numeri) e la matrice lo "incolla" in prospettiva sul muro (resta vettoriale).
  const W = 600, H = Math.round((600 * h) / w);
  const O = P(x0, yF, zTop), EXp = P(x1, yF, zTop), EYp = P(x0, yF, zBot);
  const a = (EXp.sx - O.sx) / W, b = (EXp.sy - O.sy) / W;
  const c = (EYp.sx - O.sx) / H, d = (EYp.sy - O.sy) / H;
  const mat = `matrix(${a.toFixed(4)},${b.toFixed(4)},${c.toFixed(4)},${d.toFixed(4)},${O.sx.toFixed(2)},${O.sy.toFixed(2)})`;

  const COLS = 6, ROWS = 5, band = 60;
  const gridH = H - band, cw = W / COLS, ch = gridH / ROWS;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const n = r * COLS + col + 1;
      const pad = 7;
      const rx = col * cw + pad, ry = band + r * ch + pad;
      const rw = cw - pad * 2, rh = ch - pad * 2;
      cells.push(
        <g key={`pb-${n}`}>
          <rect x={rx} y={ry} width={rw} height={rh} rx={5} fill="#0e1428" />
          <rect x={rx} y={ry + 13} width={rw} height={rh - 13} rx={5} fill="#27365d" />
          <rect x={rx + 2} y={ry + 13} width={rw - 4} height={8} fill="#aab3c0" opacity={0.85} />
          <rect x={rx} y={ry + rh - 3} width={rw} height={4} rx={2} fill="#0a0f1e" opacity={0.55} />
          <text x={rx + rw / 2} y={ry + rh / 2 + 13} textAnchor="middle" fontSize={34} fontWeight={800}
            fill="#ffffff" fontFamily="'Titillium Web', sans-serif">{n}</text>
        </g>,
      );
    }
  }

  return (
    <g key="phonebag">
      {body.node}
      <g transform={mat}>
        <rect x={0} y={0} width={W} height={H} fill="#1b2746" />
        <rect x={0} y={0} width={W} height={band} fill="#f3c11d" />
        {[0.16, 0.38, 0.62, 0.84].map((t, i) => (
          <circle key={`g${i}`} cx={t * W} cy={band / 2} r={9} fill="#cdd2d7" stroke="#8a9096" strokeWidth={2} />
        ))}
        {cells}
      </g>
    </g>
  );
}

// ─── Proiettore short-throw realistico (staffa bianca, ~50 cm dal muro) ───────
// Tutte le parti sono volumi ordinati per profondità: restano attaccate alla
// staffa a qualsiasi angolo (niente pezzi che fluttuano ruotando la visuale).
const PJ_CX = 4.2;
const PJ_LENS: [number, number, number] = [PJ_CX, 0.73, 2.40]; // muso/lente, punta alla LIM
function renderProjector(P: Proj): React.ReactNode {
  const cx = PJ_CX;
  const parts: Draw[] = [
    isoBox(P, cx, 0.05, 2.58, 0.26, 0.12, 0.24, "#e9eae8", "pj-plate"),    // piastra a muro
    isoBox(P, cx, 0.31, 2.74, 0.10, 0.58, 0.05, "#eef0ee", "pj-arm"),      // braccio (~50 cm)
    isoBox(P, cx, 0.52, 2.58, 0.12, 0.16, 0.18, "#eef0ee", "pj-yoke"),     // staffa che regge il corpo
    isoBox(P, cx, 0.50, 2.44, 0.46, 0.30, 0.16, "#f5f5f3", "pj-body"),     // corpo
    isoBox(P, cx, 0.50, 2.595, 0.40, 0.26, 0.02, "#e6e7e4", "pj-vent"),    // sfiato superiore
    isoBox(P, cx, 0.66, 2.40, 0.24, 0.16, 0.11, "#d7dadc", "pj-lensblk"),  // blocco obiettivo (muso, in basso)
  ];
  parts.sort((a, b) => a.depth - b.depth);
  const l = P(PJ_LENS[0], PJ_LENS[1], PJ_LENS[2]);
  const le = P(PJ_LENS[0] + 0.06, PJ_LENS[1], PJ_LENS[2]);
  const lr = Math.hypot(le.sx - l.sx, le.sy - l.sy) || 3;
  return (
    <g key="projector">
      {parts.map((p) => p.node)}
      {/* lente (faro) sul muso, rivolta verso la LIM */}
      <ellipse cx={l.sx} cy={l.sy} rx={lr * 1.3} ry={lr * 1.05} fill="#16242f" stroke="#777b7f" strokeWidth={0.8} />
      <ellipse cx={l.sx} cy={l.sy} rx={lr * 0.72} ry={lr * 0.58} fill="#2f4456" />
      <circle cx={l.sx - lr * 0.35} cy={l.sy - lr * 0.3} r={lr * 0.2} fill="#cfe9fb" opacity={0.95} />
      <circle {...dot(P(cx + 0.20, 0.56, 2.48))} r={1.4} fill="#3ad27c" />
    </g>
  );
}

// ─── LIM in rilievo: cornice acciaio 3 cm, schermo col desktop Windows, luminosa ─
function renderLim(P: Proj, w: Wall, dark: boolean): React.ReactNode {
  void w;
  const x0 = 3.0, x1 = 5.4, zB = 1.05, zT = 2.55;     // top allungato → più alta
  const fr = 0.03, dp = 0.05, cx = (x0 + x1) / 2;       // cornice 3 cm · rilievo · asse 4.2 (cattedra)
  const sx0 = x0 + fr, sx1 = x1 - fr, szB = zB + fr, szT = zT - fr;

  const body = isoBox(P, cx, dp / 2, zB, x1 - x0, dp, zT - zB, "#c4c8cb", "lim-body");
  const frame = [P(x0, dp, zB), P(x1, dp, zB), P(x1, dp, zT), P(x0, dp, zT)];
  const screen = [P(sx0, dp, szB), P(sx1, dp, szB), P(sx1, dp, szT), P(sx0, dp, szT)];

  const O = P(sx0, dp, szT), EX = P(sx1, dp, szT), EY = P(sx0, dp, szB);
  const m = `matrix(${(EX.sx - O.sx).toFixed(3)},${(EX.sy - O.sy).toFixed(3)},${(EY.sx - O.sx).toFixed(3)},${(EY.sy - O.sy).toFixed(3)},${O.sx.toFixed(2)},${O.sy.toFixed(2)})`;

  // Faro: cono di luce dalla lente del proiettore fin sulla LIM (apice = lente).
  const coneOuter = [P(cx - 0.06, 0.70, 2.40), P(cx + 0.06, 0.70, 2.40), P(sx1, dp, szB), P(sx0, dp, szB)];
  const coneCore = [P(cx - 0.025, 0.70, 2.40), P(cx + 0.025, 0.70, 2.40), P(sx1 - 0.35, dp, szB + 0.15), P(sx0 + 0.35, dp, szB + 0.15)];

  return (
    <g key="lim">
      <defs>
        <filter id="limGlowF" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <radialGradient id="limScreenLight" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={dark ? 0.55 : 0.34} />
          <stop offset="55%" stopColor="#dce9ff" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* alone: la LIM proietta luce sul muro */}
      <polygon points={join(frame)} fill={dark ? "#bfe0ff" : "#eaf4ff"} opacity={dark ? 0.9 : 0.5} filter="url(#limGlowF)" />
      {/* corpo in rilievo + cornice acciaio sottile */}
      {body.node}
      <polygon points={join(frame)} fill="#cdd1d4" stroke="#969ca0" strokeWidth={0.8} />
      <polygon points={join(frame)} fill="none" stroke="#f2f4f5" strokeWidth={0.4} />
      {/* schermo: nero + desktop Windows + luce emessa */}
      <polygon points={join(screen)} fill="#0b1626" />
      <image href="/images/windows-desktop.jpg" x={0} y={0} width={1} height={1} preserveAspectRatio="none" transform={m} />
      <polygon points={join(screen)} fill="url(#limScreenLight)" />
      {/* faro: cono di luce verso la LIM + proiettore */}
      <polygon points={join(coneOuter)} fill="#ffffff" opacity={dark ? 0.16 : 0.09} />
      <polygon points={join(coneCore)} fill="#eaf3ff" opacity={dark ? 0.26 : 0.14} />
      {renderProjector(P)}
    </g>
  );
}

function renderWall(P: Proj, w: Wall, pal: Pal, dark: boolean): React.ReactNode {
  const els: React.ReactNode[] = [
    <polygon key="y" points={join(wallBand(P, w, 0, WAINSCOT))} fill={pal.yellow} />,
    <polygon key="w" points={join(wallBand(P, w, WAINSCOT, RH))} fill={pal.white} />,
    <polygon key="b" points={join(wallBand(P, w, 0, 0.13))} fill={pal.base} />,
  ];

  if (w.id === "N") {
    // Porta doppia (centro-ovest)
    els.push(
      <g key="door">
        <polygon points={join(mountQuad(P, w, 0.85, 2.35, 0, 2.05))} fill="#8b9499" stroke="#6f787d" strokeWidth={0.8} />
        <polygon points={join(mountQuad(P, w, 0.95, 1.58, 0.12, 1.95))} fill="#aab1b6" />
        <polygon points={join(mountQuad(P, w, 1.62, 2.25, 0.12, 1.95))} fill="#aab1b6" />
        <circle {...dot(wp(P, w, 1.52, 1.05))} r={2} fill="#5c6469" />
        <circle {...dot(wp(P, w, 1.68, 1.05))} r={2} fill="#5c6469" />
      </g>,
    );
    // LIM in rilievo (cornice acciaio), schermo Windows luminoso, proiettore sopra
    els.push(renderLim(P, w, dark));
    // Sacca portatelefoni nell'angolo NO, a sinistra della porta
    els.push(renderPhoneBag(P));
  } else if (w.id === "S") {
    // 2 finestre alte e strette, cornice nera (3 specchiature)
    for (const [c, key] of [[3.0, "w0"], [5.0, "w1"]] as [number, string][]) {
      const u = RW - c; // u = distanza da est lungo S
      const u0 = u - 0.38, u1 = u + 0.38, v0 = 0.95, v1 = 2.78;
      const t1 = v0 + (v1 - v0) / 3, t2 = v0 + (2 * (v1 - v0)) / 3;
      els.push(
        <g key={key}>
          <polygon points={join(mountQuad(P, w, u0, u1, v0, v1))} fill="#1a1a1a" stroke="#000" strokeWidth={0.8} />
          <polygon points={join(mountQuad(P, w, u0 + 0.07, u1 - 0.07, v0 + 0.07, v1 - 0.07))} fill={pal.glass} />
          <line {...seg(wp(P, w, u, v0 + 0.07), wp(P, w, u, v1 - 0.07))} stroke="#1a1a1a" strokeWidth={1.5} />
          <line {...seg(wp(P, w, u0 + 0.07, t1), wp(P, w, u1 - 0.07, t1))} stroke="#1a1a1a" strokeWidth={1.4} />
          <line {...seg(wp(P, w, u0 + 0.07, t2), wp(P, w, u1 - 0.07, t2))} stroke="#1a1a1a" strokeWidth={1.4} />
        </g>,
      );
    }
  } else if (w.id === "E") {
    // ── Poster cicogna: FOTO reale (public/images/cicogna.jpg) mappata sul muro,
    //    con sagoma vettoriale di riserva sotto (se il file manca). Spostato vicino
    //    e a destra del PC e abbassato di 50 cm. Rettangolo verticale come la foto. ──
    const U0 = 1.62, U1 = 2.42, V0 = 0.90, V1 = 2.00; // y lungo il muro · z in altezza
    // rimappa i punti della sagoma originale (rect 3.7..4.9 / 1.4..2.4) nel nuovo poster
    const sp = (u: number, v: number) =>
      wp(P, w, U0 + ((u - 3.7) / 1.2) * (U1 - U0), V0 + ((v - 1.4) / 1.0) * (V1 - V0));
    // matrice: quadrato unitario dell'immagine → parallelogramma del muro
    const o = wp(P, w, U0, V1), ex = wp(P, w, U1, V1), ey = wp(P, w, U0, V0);
    const m = `matrix(${(ex.sx - o.sx).toFixed(3)},${(ex.sy - o.sy).toFixed(3)},${(ey.sx - o.sx).toFixed(3)},${(ey.sy - o.sy).toFixed(3)},${o.sx.toFixed(2)},${o.sy.toFixed(2)})`;
    els.push(
      <g key="poster">
        <polygon points={join(mountQuad(P, w, U0, U1, V0, V1))} fill="#df9a2b" stroke="#b6862f" strokeWidth={0.8} />
        {/* sagoma di riserva: visibile finché non aggiungi la foto */}
        <polygon points={join([sp(4.05, 1.95), sp(4.35, 2.02), sp(4.62, 1.97), sp(4.66, 1.86), sp(4.45, 1.78), sp(4.10, 1.80)])} fill="#fbfbf7" />
        <polygon points={join([sp(4.05, 1.95), sp(3.88, 2.22), sp(3.96, 2.24), sp(4.14, 2.00)])} fill="#fbfbf7" />
        <polygon points={join([sp(3.88, 2.22), sp(3.72, 2.16), sp(3.90, 2.13)])} fill="#fbfbf7" />
        <line {...seg(sp(4.18, 1.79), sp(4.16, 1.46))} stroke="#fbfbf7" strokeWidth={1.7} strokeLinecap="round" />
        <line {...seg(sp(4.40, 1.79), sp(4.42, 1.46))} stroke="#fbfbf7" strokeWidth={1.7} strokeLinecap="round" />
        {/* FOTO reale sovrapposta (in SVG un href mancante non mostra nulla → resta la sagoma) */}
        <image href="/images/cicogna.jpg" x={0} y={0} width={1} height={1} preserveAspectRatio="none" transform={m} />
      </g>,
    );
    // ── PC del prof (notebook a muro) — abbassato di 50 cm ──
    const fx = 7.78; // faccia frontale (ovest, verso la stanza)
    const fq = (y0: number, y1: number, z0: number, z1: number) =>
      join([P(fx, y0, z0), P(fx, y1, z0), P(fx, y1, z1), P(fx, y0, z1)]);
    els.push(
      <g key="secbox">
        {isoBox(P, 7.89, 1.2, 1.05, 0.22, 0.58, 0.6, "#d7dbde", "sb-body").node}
        <polygon points={fq(1.00, 1.40, 1.11, 1.59)} fill="#262b2e" />
        <polygon points={fq(1.06, 1.34, 1.16, 1.52)} fill="#0e1418" />
        <polygon points={fq(1.08, 1.32, 1.18, 1.50)} fill="#37525f" />
        {isoBox(P, 7.68, 1.2, 1.085, 0.22, 0.48, 0.035, "#c6cbce", "sb-tray").node}
        {isoBox(P, 7.66, 1.2, 1.12, 0.18, 0.42, 0.02, "#aeb4b8", "sb-kbd").node}
        <circle {...dot(P(fx, 1.44, 1.36))} r={1.6} fill="#5c6469" />
      </g>,
    );
  }

  return <g key={`wall-${w.id}`}>{els}</g>;
}

const dot = (p: Pt) => ({ cx: p.sx, cy: p.sy });
const seg = (a: Pt, b: Pt) => ({ x1: a.sx, y1: a.sy, x2: b.sx, y2: b.sy });

// ─── Sprite prof (billboard pixel) ──────────────────────────────────────────
function person(P: Proj, x: number, y: number, key: string): Draw {
  const b = P(x, y, 0);
  const S = 1.0; // scala px
  const u = (vx: number, vy: number) => ({ x: b.sx + vx * S, y: b.sy + vy * S });
  const px = (o: { x: number; y: number }, w: number, h: number, fill: string, k: string) => (
    <rect key={k} x={o.x - w / 2} y={o.y} width={w} height={h} fill={fill} />
  );
  return {
    depth: b.depth,
    node: (
      <g key={key} shapeRendering="crispEdges">
        {/* ombra */}
        <ellipse cx={b.sx} cy={b.sy} rx={11} ry={4} fill="rgba(0,0,0,0.18)" />
        {px(u(-6, -16), 5, 16, "#36434c", "legL")}
        {px(u(1, -16), 5, 16, "#36434c", "legR")}
        {px(u(-6, -15), 5, 4, "#26313a", "shoeL")}
        {px(u(1, -15), 5, 4, "#26313a", "shoeR")}
        {px(u(-8, -34), 16, 19, "#2f7d4a", "body")}
        {px(u(-12, -33), 4, 15, "#2f7d4a", "armL")}
        {px(u(8, -33), 4, 15, "#2f7d4a", "armR")}
        {px(u(-12, -19), 4, 4, "#e8b48c", "handL")}
        {px(u(8, -19), 4, 4, "#e8b48c", "handR")}
        {px(u(-5, -45), 10, 11, "#e8b48c", "head")}
        {px(u(-6, -47), 12, 5, "#3a2a1a", "hair")}
        {px(u(-4, -40), 2.5, 2, "#2a2018", "eyeL")}
        {px(u(1.5, -40), 2.5, 2, "#2a2018", "eyeR")}
      </g>
    ),
  };
}

// ─── Pavimento a piastrelle ──────────────────────────────────────────────────
function buildFloor(P: Proj, floorA: string, floorB: string, dotC: string): React.ReactNode {
  const cols = 6, rows = 9;
  const cw = RW / cols, ch = RD / rows;
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = i * cw, y0 = j * ch;
      const quad = [P(x0, y0, 0), P(x0 + cw, y0, 0), P(x0 + cw, y0 + ch, 0), P(x0, y0 + ch, 0)];
      const c = P(x0 + cw / 2, y0 + ch / 2, 0);
      tiles.push(
        <polygon key={`t${i}-${j}`} points={join(quad)} fill={(i + j) % 2 ? floorA : floorB}
          stroke="rgba(0,0,0,0.05)" strokeWidth={0.4} />,
      );
      tiles.push(<circle key={`d${i}-${j}`} cx={c.sx} cy={c.sy} r={1.5} fill={dotC} />);
    }
  }
  return <g key="floor">{tiles}</g>;
}

// ─── Arredo (banchi 2-2-2-3 su O/E, cattedra, prof, calorifero) ──────────────
// Banchi in due blocchi (ovest/est) attorno a un corridoio centrale, come la
// pianta: per lato, dal fronte (nord) al fondo, righe 2-2-2-3. Tutti rivolti a
// NORD (sedia a sud del banco). L'ultima riga (3) si allarga verso il centro.
const DESK_ROWS = [2.8, 4.5, 6.2, 7.9];   // y delle 4 righe
const WEST_COLS = [0.40, 1.28];           // colonne ovest: esterna appoggiata al muro W
const WEST_COL3 = 2.16;                   // 3ª colonna ovest (solo riga 4)

function buildFurniture(P: Proj): Draw[] {
  const items: Draw[] = [];

  DESK_ROWS.forEach((y, ri) => {
    const west = ri === DESK_ROWS.length - 1 ? [...WEST_COLS, WEST_COL3] : WEST_COLS;
    const cols = [...west, ...west.map((x) => RW - x)]; // est = specchio su CX
    cols.forEach((x, ci) => {
      items.push(deskUnit(P, x, y, `desk-${ri}-${ci}`));
      items.push(chairUnit(P, x, y, `chair-${ri}-${ci}`));
    });
  });

  // Cattedra al centro-fronte (in asse con la LIM) + sedia della prof (copiata
  // dai banchi, rivolta a sud: schienale a nord) allineata al vano gambe.
  items.push(cattedraUnit(P, 4.2, 1.4, "cattedra"));
  items.push(chairUnit(P, 4.2, 1.18, "profchair", -1));
  items.push(person(P, 4.2, 0.95, "prof"));

  // Termosifone a colonne verticali (proporzioni da radiator.glb, reso rosso),
  // sotto la finestra destra (parete sud)
  items.push(isoBox(P, 5.0, 8.88, 0.08, 0.62, 0.12, 0.8, "#cc3b30", "radiator", 9));

  return items;
}

// ─── Ombre a terra ────────────────────────────────────────────────────────────
// Luce dalle finestre (parete sud) → le ombre cadono verso nord. L'ombra è la
// pianta dell'oggetto sghembata verso nord, lunga in proporzione all'altezza.
function shadowQuad(P: Proj, x: number, y: number, hw: number, hd: number, h: number, key: string): React.ReactNode {
  const lx = 0.16, ly = -0.5;            // direzione luce (sud→nord, leggermente da est)
  const ox = lx * h, oy = ly * h;
  const pts = [
    P(x - hw, y + hd, 0), P(x + hw, y + hd, 0),
    P(x + hw + ox, y - hd + oy, 0), P(x - hw + ox, y - hd + oy, 0),
  ];
  return <polygon key={key} points={join(pts)} />;
}

function buildShadows(P: Proj): React.ReactNode[] {
  const sh: React.ReactNode[] = [];
  DESK_ROWS.forEach((y, ri) => {
    const west = ri === DESK_ROWS.length - 1 ? [...WEST_COLS, WEST_COL3] : WEST_COLS;
    const cols = [...west, ...west.map((x) => RW - x)];
    cols.forEach((x, ci) => {
      sh.push(shadowQuad(P, x, y, 0.33, 0.25, 0.6, `shd-${ri}-${ci}`));
      sh.push(shadowQuad(P, x, y + 0.46, 0.21, 0.21, 0.82, `shc-${ri}-${ci}`));
    });
  });
  sh.push(shadowQuad(P, 4.2, 1.4, 0.8, 0.4, 0.76, "sh-catt"));
  sh.push(shadowQuad(P, 4.2, 0.95, 0.22, 0.18, 1.6, "sh-prof"));
  sh.push(shadowQuad(P, 5.0, 8.88, 0.31, 0.06, 0.85, "sh-rad"));
  return sh;
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function Aula() {
  const [angle, setAngle] = useState(0);   // rotazione orizzontale (un solo cerchio)
  // Vista: zoom + centro normalizzato (0..1) del viewBox sul box base → zoom-al-punto.
  const [view, setView] = useState({ cx: 0.5, cy: 0.5, zoom: 1 });
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("games-dark");
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });

  const angleRef = useRef(0);
  const viewRef = useRef(view);
  const baseRef = useRef({ x: 0, y: 0, w: 1, h: 1 }); // viewBox base (auto-fit) corrente
  const rafRef = useRef<number>(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Puntatori attivi: 1 = ruota (cerchio orizzontale) · 2 = pinch-zoom.
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gest = useRef({ mode: "none" as "none" | "rot" | "pinch", x: 0, a: 0, moved: false, onHand: false, dist: 1, z: 1 });

  useEffect(() => { angleRef.current = angle; }, [angle]);
  useEffect(() => { viewRef.current = view; }, [view]);

  const applyView = useCallback((cx: number, cy: number, zoom: number) => {
    let z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
    if (z <= 1.0001) { cx = 0.5; cy = 0.5; z = Math.min(z, 1); } // a zoom 1 si ricentra
    const nv = { cx, cy, zoom: z };
    setView(nv); viewRef.current = nv;
  }, []);

  // Zoom tenendo FERMO il punto sotto la mano (clientX/clientY) — zoom-al-punto.
  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const svg = svgRef.current, base = baseRef.current, v = viewRef.current;
    if (!svg) return;
    const z2 = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v.zoom * factor));
    if (z2 === v.zoom) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const U = pt.matrixTransform(ctm.inverse());            // punto sotto la mano (coord SVG)
    const vw0 = base.w / v.zoom, vh0 = base.h / v.zoom;
    const vx0 = base.x + v.cx * base.w - vw0 / 2, vy0 = base.y + v.cy * base.h - vh0 / 2;
    const fracX = (U.x - vx0) / vw0, fracY = (U.y - vy0) / vh0;
    const vw2 = base.w / z2, vh2 = base.h / z2;
    const vx2 = U.x - fracX * vw2, vy2 = U.y - fracY * vh2;  // lo stesso punto resta sotto la mano
    applyView((vx2 + vw2 / 2 - base.x) / base.w, (vy2 + vh2 / 2 - base.y) / base.h, z2);
  }, [applyView]);

  const zoomCentered = useCallback((factor: number) => {
    const v = viewRef.current;
    applyView(v.cx, v.cy, v.zoom * factor);
  }, [applyView]);

  const tweenTo = useCallback((target: number) => {
    cancelAnimationFrame(rafRef.current);
    const start = angleRef.current;
    if (Math.abs(target - start) < 0.01) { setAngle(target); angleRef.current = target; return; }
    const t0 = performance.now();
    const dur = 300;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
      const a = start + (target - start) * e;
      setAngle(a); angleRef.current = a;
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const rotateStep = useCallback((dir: number) => {
    tweenTo(Math.round(angleRef.current / 90) * 90 + dir * 90);
  }, [tweenTo]);

  // ── Gesti: trascina = ruota in cerchio · due dita = pinch-zoom ──
  const pointerDown = useCallback((e: React.PointerEvent, onHand: boolean) => {
    cancelAnimationFrame(rafRef.current);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest.current;
    if (ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()];
      g.mode = "pinch"; g.dist = Math.hypot(a.x - b.x, a.y - b.y) || 1; g.z = viewRef.current.zoom; g.moved = true;
    } else {
      g.mode = "rot"; g.x = e.clientX; g.a = angleRef.current; g.moved = false; g.onHand = onHand;
    }
  }, []);

  const pointerMove = useCallback((e: PointerEvent) => {
    const p = ptrs.current.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    const g = gest.current;
    if (g.mode === "rot") {
      const dx = e.clientX - g.x;
      if (Math.abs(dx) > 4) g.moved = true;
      const na = g.a - dx / 2.0;
      setAngle(na); angleRef.current = na;
    } else if (g.mode === "pinch") {
      const [a, b] = [...ptrs.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const target = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, g.z * (dist / g.dist)));
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, target / viewRef.current.zoom); // verso il centro delle dita
    }
  }, [zoomAt]);

  const pointerUp = useCallback((e: PointerEvent) => {
    if (!ptrs.current.delete(e.pointerId)) return;
    const g = gest.current;
    if (g.mode === "rot") {
      if (!g.moved && g.onHand) rotateStep(1); // tap manina = +90° (come il tasto rotazione di The Sims)
      g.mode = "none";                          // niente snap: il cerchio si ferma dove lo lasci
    } else if (g.mode === "pinch") {
      if (ptrs.current.size === 1) {
        const [only] = [...ptrs.current.values()];
        g.mode = "rot"; g.x = only.x; g.a = angleRef.current; g.moved = true; g.onHand = false;
      } else g.mode = "none";
    }
  }, [rotateStep]);

  useEffect(() => {
    const move = (e: PointerEvent) => pointerMove(e);
    const up = (e: PointerEvent) => pointerUp(e);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [pointerMove, pointerUp]);

  // Rotella = zoom (listener nativo non-passive per usare preventDefault).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); // zoom dove c'è il puntatore
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") rotateStep(-1);
      else if (e.key === "ArrowRight") rotateStep(1);
      else if (e.key === "+" || e.key === "=") zoomCentered(1.15);
      else if (e.key === "-" || e.key === "_") zoomCentered(1 / 1.15);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [rotateStep, zoomCentered]);

  const toggleDark = useCallback(() => {
    setDark((d) => { const n = !d; try { localStorage.setItem("games-dark", n ? "1" : "0"); } catch {} return n; });
  }, []);
  const resetView = useCallback(() => {
    tweenTo(Math.round(angleRef.current / 360) * 360);
    applyView(0.5, 0.5, 1);
  }, [tweenTo, applyView]);

  // ── Costruzione scena ──
  const P = makeProject(angle);

  // viewBox auto-fit sugli 8 vertici del volume stanza
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const x of [0, RW]) for (const y of [0, RD]) for (const z of [0, RH]) {
    const p = P(x, y, z);
    minX = Math.min(minX, p.sx); maxX = Math.max(maxX, p.sx);
    minY = Math.min(minY, p.sy); maxY = Math.max(maxY, p.sy);
  }
  // Zoom VETTORIALE: si stringe il viewBox (resta nitido) attorno al punto scelto
  // (view.cx/cy normalizzati sul box base) → zoom dove tieni la mano.
  const pad = 26;
  const baseX = minX - pad, baseY = minY - pad;
  const baseW = maxX - minX + pad * 2, baseH = maxY - minY + pad * 2;
  baseRef.current = { x: baseX, y: baseY, w: baseW, h: baseH };
  const vw = baseW / view.zoom, vh = baseH / view.zoom;
  const vx = baseX + view.cx * baseW - vw / 2, vy = baseY + view.cy * baseH - vh / 2;
  const vb = `${vx} ${vy} ${vw} ${vh}`;

  // Palette giorno/notte
  const pal: Pal = {
    yellow: "#f1cf6a", white: "#f7f2e6", base: "#5c4733",
    winFrame: "#e2e6e8", glass: dark ? "#1d2e39" : "#a9d6ec",
  };
  const floorA = "#f3c9d0", floorB = "#efbcc6", dotC = "#e29bab";

  // Direzione "verso lo spettatore" in coordinate stanza (cutaway + bussola).
  const ar = (angle * Math.PI) / 180;
  const dEast = Math.cos(ar) + Math.sin(ar);
  const dSouth = -Math.sin(ar) + Math.cos(ar);
  const dlen = Math.hypot(dEast, dSouth) || 1;

  // Cutaway stile The Sims: ogni parete sfuma in base a quanto è rivolta verso
  // lo spettatore. Normale uscente · direzione spettatore > 0 ⇒ parete davanti
  // (si vede dentro) ⇒ diventa trasparente; ≤ 0 ⇒ parete di fondo ⇒ opaca.
  // La transizione di opacità (CSS) dà la dissolvenza quando ruoti.
  const WALL_NORMALS: Record<Wall["id"], [number, number]> = {
    N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0],
  };
  const wallView = WALLS.map((w) => {
    const facing = (WALL_NORMALS[w.id][0] * dEast + WALL_NORMALS[w.id][1] * dSouth) / dlen;
    const depth = (P(w.p1[0], w.p1[1], 0).depth + P(w.p2[0], w.p2[1], 0).depth) / 2;
    const opacity = facing > 0 ? Math.max(0, 1 - facing * 2.2) : 1;
    return { w, depth, opacity, near: facing > 0 };
  });
  const farWalls = wallView.filter((x) => !x.near).sort((a, b) => a.depth - b.depth);
  const nearWalls = wallView.filter((x) => x.near).sort((a, b) => a.depth - b.depth);

  const furniture = buildFurniture(P).sort((a, b) => a.depth - b.depth);

  // Bussola
  const dots: Record<string, number> = {
    N: (-1 * dSouth) / dlen, S: (1 * dSouth) / dlen,
    E: (1 * dEast) / dlen, W: (-1 * dEast) / dlen,
  };
  const maxDot = Math.max(...Object.values(dots));
  const isFront = (c: string) => dots[c] >= maxDot - 0.35;
  const CARD: Record<string, { x: number; y: number }> = {
    N: { x: 35, y: 11 }, E: { x: 59, y: 35 }, S: { x: 35, y: 59 }, W: { x: 11, y: 35 },
  };

  return (
    <div className={`aula-page${dark ? " dark" : ""}`}>
      <header className="aula-header">
        <div className="aula-hdr-side">
          <a href="/" className="aula-iconbtn" aria-label="Torna al sito"><ArrowLeft size={22} /></a>
        </div>
        <h1 className="aula-title"><span className="aula-accent">5</span>BT</h1>
        <div className="aula-hdr-side aula-hdr-side--r">
          <button className="aula-iconbtn" onClick={toggleDark} aria-label="Cambia tema">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="aula-iconbtn" onClick={resetView} aria-label="Reset vista"><RotateCcw size={20} /></button>
        </div>
      </header>

      <div
        ref={stageRef}
        className="aula-stage"
        onPointerDown={(e) => pointerDown(e, false)}
      >
        <svg
          ref={svgRef}
          className="aula-svg"
          viewBox={vb}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Aula isometrica 5BT"
        >
          <g className="aula-scene">
            {buildFloor(P, floorA, floorB, dotC)}
            {/* ombre a terra: luce dalle finestre (sud) → ombre verso nord */}
            <g className="aula-shadows" fill="#0d1018" opacity={0.16}>{buildShadows(P)}</g>
            {/* pareti di fondo (opache) */}
            {farWalls.map(({ w, opacity }) => (
              <g key={`fw-${w.id}`} className="aula-wall" style={{ opacity }}>{renderWall(P, w, pal, dark)}</g>
            ))}
            {furniture.map((f, i) => <g key={i}>{f.node}</g>)}
            {/* pareti davanti: cutaway, sfumano per far vedere dentro */}
            {nearWalls.map(({ w, opacity }) => (
              <g key={`nw-${w.id}`} className="aula-wall" style={{ opacity }}>{renderWall(P, w, pal, dark)}</g>
            ))}
          </g>
        </svg>

        {/* Bussola */}
        <svg className="aula-compass" viewBox="0 0 70 70" aria-hidden="true">
          <circle cx={35} cy={35} r={31} fill="rgba(16,56,32,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
          <line {...{
            x1: 35, y1: 35,
            x2: 35 + (dEast / dlen) * 20,
            y2: 35 + (dSouth / dlen) * 20,
          }} stroke="#6fd08a" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={35 + (dEast / dlen) * 20} cy={35 + (dSouth / dlen) * 20} r={3} fill="#6fd08a" />
          {(["N", "E", "S", "W"] as const).map((c) => (
            <text key={c} x={CARD[c].x} y={CARD[c].y + 4} textAnchor="middle"
              fontSize={isFront(c) ? 13 : 10} fontWeight={700}
              fill={isFront(c) ? "#6fd08a" : "rgba(255,255,255,0.6)"}>{c}</text>
          ))}
        </svg>

        {/* Controlli zoom */}
        <div className="aula-zoom">
          <button className="aula-zoombtn" aria-label="Ingrandisci" onClick={() => zoomCentered(1.25)}>
            <ZoomIn size={20} />
          </button>
          <button className="aula-zoombtn" aria-label="Riduci" onClick={() => zoomCentered(1 / 1.25)}>
            <ZoomOut size={20} />
          </button>
        </div>

        {/* Manina */}
        <button
          className="aula-hand"
          aria-label="Ruota la classe (trascina o tocca)"
          onPointerDown={(e) => { e.stopPropagation(); pointerDown(e, true); }}
        >
          <Hand size={26} />
        </button>
      </div>

      <p className="aula-caption">Trascina per girare la classe · pizzica o rotella per lo zoom · ← → per ruotare</p>

      <style>{`
        .aula-page {
          height: 100dvh;
          overflow: hidden;
          background: #eef1ee;
          color: #17271d;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          user-select: none;
          touch-action: none;
        }
        .aula-header {
          position: sticky; top: 0; z-index: 20; flex-shrink: 0;
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 0.7rem 1rem; background: #103820; color: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
        }
        .aula-title { font-size: 1.75rem; font-weight: 700; letter-spacing: 0.22em; margin: 0; padding-left: .2em; animation: aula-drop .5s ease; }
        .aula-accent { color: #6fd08a; }
        @keyframes aula-drop { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .aula-hdr-side { display: flex; align-items: center; gap: 6px; min-width: 82px; }
        .aula-hdr-side--r { justify-content: flex-end; }
        .aula-iconbtn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.35);
          background: transparent; color: #fff; cursor: pointer; text-decoration: none;
          transition: background .15s, transform .15s;
        }
        .aula-iconbtn:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }

        .aula-stage {
          flex: 1; min-height: 0; width: 100%;
          position: relative;
          display: flex; align-items: center; justify-content: center;
          padding: 14px;
          cursor: grab;
          touch-action: none;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 42%, #ffffff 0%, #e7ebe8 70%, #dde2de 100%);
        }
        .aula-stage:active { cursor: grabbing; }
        .aula-svg { display: block; width: 100%; height: 100%; }
        .aula-scene { transition: opacity .12s ease; }
        /* dissolvenza del cutaway: le pareti davanti compaiono/spariscono morbide */
        .aula-wall { transition: opacity .35s ease; }

        .aula-compass {
          position: absolute; top: 14px; left: 14px;
          width: 64px; height: 64px; pointer-events: none;
        }
        .aula-zoom {
          position: absolute; right: 18px; bottom: 88px; z-index: 10;
          display: flex; flex-direction: column; gap: 8px;
        }
        .aula-zoombtn {
          width: 42px; height: 42px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(16,56,32,0.82); color: #fff; border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 4px 12px rgba(0,0,0,0.22); cursor: pointer;
          transition: background .15s, transform .12s;
        }
        .aula-zoombtn:hover { background: #1f6b3d; transform: translateY(-1px); }
        .aula-zoombtn:active { transform: scale(0.92); }

        .aula-hand {
          position: absolute; right: 18px; bottom: 18px;
          width: 60px; height: 60px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: #2f7d4a; color: #fff; border: none;
          box-shadow: 0 6px 18px rgba(47,125,74,0.45); cursor: grab;
          touch-action: none;
          transition: transform .12s, background .15s;
          animation: aula-pulse 2.4s ease-in-out infinite;
        }
        .aula-hand:hover { background: #1f6b3d; transform: scale(1.05); }
        .aula-hand:active { cursor: grabbing; transform: scale(0.94); }
        @keyframes aula-pulse {
          0%, 100% { box-shadow: 0 6px 18px rgba(47,125,74,0.45); }
          50% { box-shadow: 0 6px 26px rgba(47,125,74,0.7); }
        }

        .aula-caption {
          flex-shrink: 0; margin: 0; padding: 0.55rem 1rem 0.8rem;
          font-size: 0.82rem; color: #5b6b61; text-align: center;
        }

        /* ── Dark / night mode ── */
        .aula-page.dark { background: #0e140f; color: #d4e8dc; }
        .aula-page.dark .aula-stage {
          background: radial-gradient(ellipse at 50% 42%, #1a2620 0%, #121a14 70%, #0c110d 100%);
        }
        .aula-page.dark .aula-svg { filter: brightness(0.82) saturate(0.92); }
        .aula-page.dark .aula-caption { color: #7ab893; }

        @media (max-width: 639px) {
          .aula-title { font-size: 1.5rem; }
          .aula-hand { width: 54px; height: 54px; right: 14px; bottom: 14px; }
          .aula-zoom { right: 14px; bottom: 78px; gap: 6px; }
          .aula-zoombtn { width: 38px; height: 38px; }
          .aula-compass { width: 56px; height: 56px; top: 10px; left: 10px; }
          .aula-caption { font-size: 0.76rem; }
        }
      `}</style>
    </div>
  );
}
