import { Map, MapControls, MapMarker, MapRoute, MarkerContent, MarkerLabel } from "@/components/ui/map";
import { MIMA_CENTER, MIMA_ZOOM, PLACES, ROUTE, TRIP_PLACES, type Place } from "./mimaData";

// ─────────────────────────────────────────────────────────────────────────────
// Le mappe di /mima. Sta in un file a sé e le pagine la caricano con
// React.lazy: maplibre-gl pesa ~290 kB gzip, troppo da mettere nel bundle
// statico di una pagina che ne mostra una sola. (Era MimaMap.tsx, copiato da
// site/RivaltaMap.tsx; ora ha marcatori e tracciato, quindi ha un nome suo.)
//
// Due varianti:
//   "trip"  — il tavolo del cartografo: Cervia e Milano Marittima da vicino,
//             con hostel, mare e centri marcati.
//   "route" — il viaggio intero, Rivalta sul Mincio → Cervia, col tracciato.
//
// L'azzurro è scritto per esteso perché l'API di MapLibre vuole una stringa di
// colore, non una var CSS. È lo stesso valore di --sb-brand, che è identico in
// chiaro e in scuro (vedi home.css): non è un secondo accento.
// ─────────────────────────────────────────────────────────────────────────────

const BRAND = "hsl(197, 100%, 49%)";

const ROUTE_PINS: Place[] = [PLACES.rivalta, PLACES.hostel];

function Pin({ place, primary }: { place: Place; primary?: boolean }) {
  return (
    <MapMarker longitude={place.lon} latitude={place.lat}>
      <MarkerContent className="sb-mima-pin">
        <span className={`sb-mima-pin-dot ${primary ? "is-primary" : ""}`} />
        <MarkerLabel className="sb-mima-pin-label">{place.name}</MarkerLabel>
      </MarkerContent>
    </MapMarker>
  );
}

export default function MimaRouteMap({ variant = "trip" }: { variant?: "trip" | "route" }) {
  if (variant === "route") {
    return (
      <Map center={[11.55, 44.68]} zoom={7.2}>
        <MapRoute coordinates={ROUTE} color={BRAND} width={3} opacity={0.9} interactive={false} />
        {ROUTE_PINS.map((p) => (
          <Pin key={p.key} place={p} primary={p.key === "hostel"} />
        ))}
        <MapControls />
      </Map>
    );
  }

  return (
    <Map center={MIMA_CENTER} zoom={MIMA_ZOOM}>
      {TRIP_PLACES.map((p) => (
        <Pin key={p.key} place={p} primary={p.key === "hostel"} />
      ))}
      <MapControls />
    </Map>
  );
}
