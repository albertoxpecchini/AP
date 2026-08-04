import { Map, MapControls } from "@/components/ui/map";

// Isolato in un file a sé e caricato con React.lazy da App.tsx: maplibre-gl
// pesa ~290kB gzip, troppo per il bundle statico della home per una sola
// mappa decorativa.
export default function RivaltaMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  return (
    <Map center={center} zoom={zoom}>
      <MapControls />
    </Map>
  );
}
