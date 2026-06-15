// ─── Icona "logo" per capitolo ───────────────────────────────────────────────
//
// Ogni capitolo mostra a sinistra una piccola icona tematica (discreta), che
// dà un colpo d'occhio sul tema senza essere un pallino colorato. Sono icone
// lucide-react scelte per richiamare l'edificio/corrente del capitolo.
//
// La mappa è per slug (nome file .md). Se un capitolo non è mappato, si ricade
// su un'icona generica (Landmark) tramite `iconForChapter`.

import {
  Landmark, Building2, Church, TowerControl, Factory, Castle,
  TreePine, Building, Columns3, Sparkles, Flower2, Theater, Box, Triangle,
  type LucideIcon,
} from "lucide-react";

// slug → icona. Scelte per "indicatività": cosa evoca subito quel capitolo.
const ICONS: Record<string, LucideIcon> = {
  // Neoclassico / eclettismo / Ottocento
  "neoclassicismo":        Columns3,   // colonne, ordine classico
  "teatro-alla-scala":     Theater,
  "opera-parigi":          Theater,
  "eclettismo":            Castle,
  "parigi-haussmann":      Building,   // i boulevard / palazzi haussmanniani
  "padiglione-brighton":   Castle,     // Royal Pavilion, cupole orientaleggianti

  // Architettura del ferro / grandi esposizioni
  "architettura-del-ferro": Factory,
  "crystal-palace":         Box,       // grande scatola di vetro e ferro
  "torre-eiffel":           TowerControl,

  // Art Nouveau / Liberty / Modernismo catalano
  "art-nouveau-francia":    Flower2,
  "art-nouveau-bruxelles":  Flower2,
  "liberty-italia":         Flower2,
  "modernismo-catalano":    Sparkles,
  "casa-batllo":            Sparkles,
  "casa-mila":              Sparkles,
  "sagrada-familia":        Church,

  // Scuola di Chicago / primi grattacieli
  "scuola-di-chicago":      Building2,

  // Movimento moderno / razionalismo / maestri
  "movimento-moderno":      Building2,
  "fabbrica-aeg":           Factory,
  "bauhaus":                Building2,
  "razionalismo-italia":    Building2,
  "terragni-como":          Building2,
  "villa-savoye":           Building,
  "unite-marsiglia":        Building,
  "padiglione-barcellona":  Building,
  "fallingwater":           TreePine,  // immersa nel bosco / cascata
  "alvar-aalto":            TreePine,  // organico, legno, Finlandia
  "ronchamp":               Church,

  // Contemporaneo
  "architettura-contemporanea": Building2,
  "san-cataldo":            Landmark,  // cimitero di Rossi
  "centre-pompidou":        Factory,   // tecnologico, tubi a vista
  "piramide-louvre":        Triangle,
  "guggenheim-ny":          Landmark,
  "millennium-dome":        Box,
  "citta-arti-scienze":     Sparkles,
  "maxxi":                  Building2,
  "auditorium-roma":        Theater,
  "mediopadana":            TowerControl, // stazione, gusci ondulati
  "bosco-verticale":        TreePine,
  "citylife":               Building2,
};

const FALLBACK: LucideIcon = Landmark;

/** Icona (lucide) per il capitolo, con fallback generico. */
export function iconForChapter(chapterId: string, size = 18): React.ReactNode {
  const Icon = ICONS[chapterId] ?? FALLBACK;
  return <Icon size={size} strokeWidth={1.9} />;
}
