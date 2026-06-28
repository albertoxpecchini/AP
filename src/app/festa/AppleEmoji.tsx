// ─── Emoji Apple ovunque ────────────────────────────────────────────────────
// Le emoji Apple sono proprietarie: col solo font di sistema, su Windows/Android
// gli invitati vedrebbero Segoe/Google (diverse e meno belle). Per averle
// IDENTICHE per tutti le serviamo come immagini PNG dal dataset ufficiale
// "emoji-datasource-apple" (npm), copiate self-hosted in /public/emoji/apple/.
//
// La mappa qui sotto (emoji → nome file = codepoint) è generata automaticamente
// dallo stesso dataset, così non c'è logica fragile sui codepoint a runtime.
// Aggiungere un'emoji nuova = rilanciare lo script di sync e incollare la voce.

const CODES: Record<string, string> = {
  "🎈": "1f388", "🎉": "1f389", "🍕": "1f355", "☀️": "2600-fe0f",
  "💦": "1f4a6", "🩴": "1fa74", "🏊": "1f3ca", "🌙": "1f319",
  "🎂": "1f382", "✨": "2728",  "📅": "1f4c5", "📍": "1f4cd",
  "⏰": "23f0",  "🥂": "1f942", "🎶": "1f3b6", "🩳": "1fa73",
  "👕": "1f455", "🏖️": "1f3d6-fe0f", "🧥": "1f9e5", "🎁": "1f381",
  "💚": "1f49a", "🤔": "1f914", "🙁": "1f641", "🥳": "1f973",
  "🍽️": "1f37d-fe0f", "🔒": "1f512", "🍴": "1f374", "👋": "1f44b",
  // Meteo della serata
  "🌤️": "1f324-fe0f", "⛅": "26c5", "☁️": "2601-fe0f", "🌫️": "1f32b-fe0f",
  "🌦️": "1f326-fe0f", "🌧️": "1f327-fe0f", "⛈️": "26c8-fe0f", "🌨️": "1f328-fe0f",
  "🌡️": "1f321-fe0f", "❄️": "2744-fe0f",
};

/**
 * Emoji Apple come immagine. Si dimensiona da sola al font corrente (1em):
 * basta impostare `font-size` sul genitore (o passare la classe di sizing).
 * Le classi di animazione (festa-anim-*) vanno direttamente sull'<img>.
 */
export function E({ e, className }: { e: string; className?: string }) {
  const code = CODES[e];
  // Fallback prudente: se manca dalla mappa, emoji nativa (non rompe nulla).
  if (!code) return <span className={className}>{e}</span>;
  return (
    <img
      src={`/emoji/apple/${code}.png`}
      alt={e}
      className={`festa-emoji${className ? " " + className : ""}`}
      loading="lazy"
      draggable={false}
      aria-hidden={false}
    />
  );
}
