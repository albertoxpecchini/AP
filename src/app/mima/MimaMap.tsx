import { Map, MapControls } from "@/components/ui/map";

// Isolato in un file a sé e caricato con React.lazy da Mima.tsx: maplibre-gl
// pesa ~290kB gzip, troppo per il bundle statico di /mima per una sola mappa
// decorativa. Copiato 1:1 da src/app/site/RivaltaMap.tsx.
export default function MimaMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  return (
    <Map center={center} zoom={zoom}>
      <MapControls />
    </Map>
  );
}
