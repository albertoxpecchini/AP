// ─── Icona "logo" per capitolo ───────────────────────────────────────────────
//
// Ogni capitolo mostra una piccola icona tematica (discreta), che dà un colpo
// d'occhio sul tema senza essere un pallino colorato. Sono le icone disegnate
// a mano del sito (src/app/site/homeIcons.tsx — outline 24×24, tratto 1.5,
// currentColor), scelte per richiamare l'edificio/corrente del capitolo.
//
// La mappa è per slug (nome file .md). Se un capitolo non è mappato, si ricade
// su un'icona generica (IcLandmark) tramite `iconForChapter`.

import {
  IcLandmark, IcSkyline, IcChurch, IcTower, IcFactory, IcCastle,
  IcTree, IcBuilding, IcColumns, IcSparkle, IcFlower, IcTheater,
  IcCube, IcTriangleGlyph, type IcProps,
} from "../site/homeIcons";

type Glyph = (p: IcProps) => JSX.Element;

// slug → icona. Scelte per "indicatività": cosa evoca subito quel capitolo.
const ICONS: Record<string, Glyph> = {
  // Neoclassico / eclettismo / Ottocento
  "neoclassicismo":        IcColumns,   // colonne, ordine classico
  "teatro-alla-scala":     IcTheater,
  "opera-parigi":          IcTheater,
  "eclettismo":            IcCastle,
  "parigi-haussmann":      IcBuilding,  // i boulevard / palazzi haussmanniani
  "padiglione-brighton":   IcCastle,    // Royal Pavilion, cupole orientaleggianti

  // Architettura del ferro / grandi esposizioni
  "architettura-del-ferro": IcFactory,
  "crystal-palace":         IcCube,     // grande scatola di vetro e ferro
  "torre-eiffel":           IcTower,

  // Art Nouveau / Liberty / Modernismo catalano
  "art-nouveau-francia":    IcFlower,
  "art-nouveau-bruxelles":  IcFlower,
  "liberty-italia":         IcFlower,
  "modernismo-catalano":    IcSparkle,
  "casa-batllo":            IcSparkle,
  "casa-mila":              IcSparkle,
  "sagrada-familia":        IcChurch,

  // Scuola di Chicago / primi grattacieli
  "scuola-di-chicago":      IcSkyline,

  // Movimento moderno / razionalismo / maestri
  "movimento-moderno":      IcSkyline,
  "fabbrica-aeg":           IcFactory,
  "bauhaus":                IcSkyline,
  "razionalismo-italia":    IcSkyline,
  "terragni-como":          IcSkyline,
  "villa-savoye":           IcBuilding,
  "unite-marsiglia":        IcBuilding,
  "padiglione-barcellona":  IcBuilding,
  "fallingwater":           IcTree,     // immersa nel bosco / cascata
  "alvar-aalto":            IcTree,     // organico, legno, Finlandia
  "ronchamp":               IcChurch,

  // Contemporaneo
  "architettura-contemporanea": IcSkyline,
  "san-cataldo":            IcLandmark, // cimitero di Rossi
  "centre-pompidou":        IcFactory,  // tecnologico, tubi a vista
  "piramide-louvre":        IcTriangleGlyph,
  "guggenheim-ny":          IcLandmark,
  "millennium-dome":        IcCube,
  "citta-arti-scienze":     IcSparkle,
  "maxxi":                  IcSkyline,
  "auditorium-roma":        IcTheater,
  "mediopadana":            IcTower,    // stazione, gusci ondulati
  "bosco-verticale":        IcTree,
  "citylife":               IcSkyline,
};

const FALLBACK: Glyph = IcLandmark;

/** Icona per il capitolo, con fallback generico. */
export function iconForChapter(chapterId: string, size = 18): React.ReactNode {
  const Icon = ICONS[chapterId] ?? FALLBACK;
  return <Icon size={size} />;
}
