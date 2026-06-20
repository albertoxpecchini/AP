// ─── Dataset città del gioco "Mappa" ────────────────────────────────────────
// Città riconoscibili dall'alto, sparse nei continenti. Le coordinate puntano
// al centro città; lo zoom satellitare iniziale è scelto per mostrare un
// landmark/tessuto urbano abbastanza caratteristico ma non banale.
//
// `aliases` raccoglie le grafie accettate come risposta (italiano/inglese e
// varianti comuni), tutte confrontate in minuscolo.

export interface City {
  name: string;        // nome "ufficiale" mostrato (italiano dove esiste)
  country: string;     // paese (italiano)
  continent: string;   // continente (italiano)
  lat: number;
  lng: number;
  zoom: number;        // zoom iniziale della vista satellitare
  aliases: string[];   // grafie accettate (oltre a name/country)
}

export const CITIES: City[] = [
  { name: "Roma", country: "Italia", continent: "Europa", lat: 41.9028, lng: 12.4964, zoom: 14, aliases: ["rome"] },
  { name: "Venezia", country: "Italia", continent: "Europa", lat: 45.4371, lng: 12.3326, zoom: 14, aliases: ["venice", "venedig"] },
  { name: "Parigi", country: "Francia", continent: "Europa", lat: 48.8584, lng: 2.2945, zoom: 15, aliases: ["paris"] },
  { name: "Londra", country: "Regno Unito", continent: "Europa", lat: 51.5007, lng: -0.1246, zoom: 15, aliases: ["london"] },
  { name: "Barcellona", country: "Spagna", continent: "Europa", lat: 41.4036, lng: 2.1744, zoom: 16, aliases: ["barcelona"] },
  { name: "Madrid", country: "Spagna", continent: "Europa", lat: 40.4168, lng: -3.7038, zoom: 14, aliases: [] },
  { name: "Amsterdam", country: "Paesi Bassi", continent: "Europa", lat: 52.3676, lng: 4.9041, zoom: 14, aliases: [] },
  { name: "Berlino", country: "Germania", continent: "Europa", lat: 52.5163, lng: 13.3777, zoom: 15, aliases: ["berlin"] },
  { name: "Atene", country: "Grecia", continent: "Europa", lat: 37.9715, lng: 23.7257, zoom: 16, aliases: ["athens", "athína"] },
  { name: "Istanbul", country: "Turchia", continent: "Asia", lat: 41.0086, lng: 28.9802, zoom: 15, aliases: ["istambul", "costantinopoli"] },
  { name: "Mosca", country: "Russia", continent: "Europa", lat: 55.7539, lng: 37.6208, zoom: 15, aliases: ["moscow", "moskva"] },
  { name: "Il Cairo", country: "Egitto", continent: "Africa", lat: 29.9792, lng: 31.1342, zoom: 15, aliases: ["cairo", "il cairo"] },
  { name: "Dubai", country: "Emirati Arabi Uniti", continent: "Asia", lat: 25.1972, lng: 55.2744, zoom: 15, aliases: [] },
  { name: "Tokyo", country: "Giappone", continent: "Asia", lat: 35.6586, lng: 139.7454, zoom: 15, aliases: ["tokio"] },
  { name: "Pechino", country: "Cina", continent: "Asia", lat: 39.9163, lng: 116.3972, zoom: 15, aliases: ["beijing", "pekino"] },
  { name: "Singapore", country: "Singapore", continent: "Asia", lat: 1.2834, lng: 103.8607, zoom: 15, aliases: [] },
  { name: "Bangkok", country: "Thailandia", continent: "Asia", lat: 13.7510, lng: 100.4927, zoom: 15, aliases: [] },
  { name: "Sydney", country: "Australia", continent: "Oceania", lat: -33.8568, lng: 151.2153, zoom: 15, aliases: [] },
  { name: "New York", country: "Stati Uniti", continent: "America", lat: 40.7484, lng: -73.9857, zoom: 15, aliases: ["nyc", "new york city"] },
  { name: "San Francisco", country: "Stati Uniti", continent: "America", lat: 37.8199, lng: -122.4783, zoom: 14, aliases: ["frisco"] },
  { name: "Las Vegas", country: "Stati Uniti", continent: "America", lat: 36.1147, lng: -115.1728, zoom: 15, aliases: ["vegas"] },
  { name: "Rio de Janeiro", country: "Brasile", continent: "America", lat: -22.9519, lng: -43.2105, zoom: 14, aliases: ["rio"] },
  { name: "Città del Messico", country: "Messico", continent: "America", lat: 19.4326, lng: -99.1332, zoom: 15, aliases: ["mexico city", "ciudad de mexico", "citta del messico"] },
  { name: "Toronto", country: "Canada", continent: "America", lat: 43.6426, lng: -79.3871, zoom: 15, aliases: [] },
  { name: "Città del Capo", country: "Sudafrica", continent: "Africa", lat: -33.9249, lng: 18.4241, zoom: 13, aliases: ["cape town", "citta del capo"] },
  { name: "Pisa", country: "Italia", continent: "Europa", lat: 43.7230, lng: 10.3966, zoom: 17, aliases: [] },
  { name: "Milano", country: "Italia", continent: "Europa", lat: 45.4642, lng: 9.1900, zoom: 16, aliases: ["milan", "mailand"] },
  { name: "Firenze", country: "Italia", continent: "Europa", lat: 43.7731, lng: 11.2560, zoom: 16, aliases: ["florence", "florenz"] },
  { name: "Lisbona", country: "Portogallo", continent: "Europa", lat: 38.7223, lng: -9.1393, zoom: 14, aliases: ["lisbon", "lisboa"] },
  { name: "Mumbai", country: "India", continent: "Asia", lat: 18.9220, lng: 72.8347, zoom: 15, aliases: ["bombay"] },
];

// Tutte le grafie accettate per una città (nome + paese + alias), in minuscolo.
function acceptedForms(c: City): string[] {
  return [c.name, c.country, ...c.aliases].map(s => s.trim().toLowerCase()).filter(Boolean);
}

/** Una risposta è corretta se combacia (o quasi) con nome/paese/alias. */
export function isCorrectGuess(guess: string, city: City): boolean {
  const g = guess.trim().toLowerCase();
  if (g.length < 2) return false;
  const forms = acceptedForms(city);
  if (forms.includes(g)) return true;
  // tolleranza: il nome città inizia con quanto digitato (>=4 lettere) o viceversa
  const nameLc = city.name.toLowerCase();
  if (g.length >= 4 && (nameLc.startsWith(g) || g.startsWith(nameLc))) return true;
  return false;
}

// Lista nomi (solo città) per i suggerimenti di completamento.
export const CITY_NAMES: string[] = CITIES.map(c => c.name);
