import { useMemo } from "react";
import type * as GeoJSON from "geojson";
import { Map, MapControls, MapClusterLayer } from "@/components/ui/map";
import type { Foto } from "./foto";

// ─────────────────────────────────────────────────────────────────────────────
// La mappa dell'album: seicento e passa scatti, ognuno dove è stato fatto.
//
// In un file a sé e caricato con React.lazy dentro un <WhenVisible>: maplibre-gl
// pesa ~290 kB gzip, e chi apre l'album per guardare le foto non deve pagarli
// prima di aver visto la prima miniatura.
//
// I punti sono raggruppati (MapClusterLayer) e non piantati uno per uno: a zoom
// di paese seicento cerchi sovrapposti sono una macchia azzurra che non dice
// niente. Raggruppati, invece, si legge subito dove si è passato più tempo — ed
// è esattamente la domanda a cui una mappa di vacanza deve rispondere. Si apre
// il gruppo zoomando, e quando i punti si separano si clicca il singolo scatto.
//
// I colori dei cerchi sono tre gradazioni della stessa tinta azzurra del sito,
// non tre colori diversi: la grandezza del gruppo la dicono già il diametro e
// il numero scritto sopra.
// ─────────────────────────────────────────────────────────────────────────────

// Tre passi della stessa tinta (--sb-brand è hsl(197,100%,49%)). Il componente
// mappa vuole colori veri, non var(): le scrive dentro a una specifica di stile
// MapLibre, che le custom property CSS non le legge.
const AZZURRO: [string, string, string] = [
  "hsl(197, 100%, 49%)",
  "hsl(199, 92%, 38%)",
  "hsl(201, 90%, 27%)",
];
const SOGLIE: [number, number] = [15, 60];

export default function MimaMappa({
  foto,
  bounds,
  onApri,
}: {
  /** Solo quelle con la posizione: le altre non hanno un punto da mostrare. */
  foto: Foto[];
  bounds: { sw: [number, number]; ne: [number, number] } | null;
  onApri: (id: string) => void;
}) {
  const dati = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }>>(
    () => ({
      type: "FeatureCollection",
      features: foto.map((f) => ({
        type: "Feature",
        properties: { id: f.id },
        geometry: { type: "Point", coordinates: [f.lon!, f.lat!] },
      })),
    }),
    [foto],
  );

  // L'inquadratura esce dalle foto vere, non da un centro deciso a tavolino:
  // il viaggio parte da Mantova e arriva a Cervia, e una mappa centrata solo
  // sulla riviera taglierebbe fuori un giorno intero di scatti.
  const viewport = bounds
    ? { bounds: [bounds.sw, bounds.ne] as [[number, number], [number, number]],
        fitBoundsOptions: { padding: 48 } }
    : { center: [12.363, 44.252] as [number, number], zoom: 11 };

  return (
    <Map {...viewport} className="sb-mima-mappa">
      <MapControls />
      <MapClusterLayer
        data={dati}
        clusterColors={AZZURRO}
        clusterThresholds={SOGLIE}
        clusterRadius={44}
        clusterMaxZoom={16}
        pointColor={AZZURRO[0]}
        onPointClick={(feature) => {
          const id = feature.properties?.id;
          if (id) onApri(id);
        }}
      />
    </Map>
  );
}
