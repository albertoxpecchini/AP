// Disabilita la navigazione "Indietro" del browser quando si preme Backspace
// fuori da un campo di testo. È un comportamento legacy di alcuni browser:
// premendo Backspace con il focus NON su un input/textarea/contenteditable,
// la pagina torna indietro nella cronologia, facendoti "uscire".
//
// Qui blocchiamo SOLO quel caso: dentro qualunque campo editabile (form, ricerca,
// tastiera dei giochi che usa <input>, contenteditable) il Backspace continua a
// funzionare normalmente per cancellare i caratteri.

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;

  // contenteditable (anche ereditato da un antenato)
  if (el.isContentEditable) return true;

  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;

  if (tag === "INPUT") {
    const input = el as HTMLInputElement;
    // I tipi non testuali (checkbox, radio, button, range…) non "consumano"
    // il Backspace, quindi per loro va bloccato come per il resto della pagina.
    const nonText = new Set([
      "checkbox", "radio", "button", "submit", "reset",
      "range", "color", "file", "image", "hidden",
    ]);
    if (input.readOnly || input.disabled) return false;
    return !nonText.has(input.type);
  }

  return false;
}

/**
 * Installa un listener globale che impedisce al Backspace di far tornare
 * indietro il browser. Da chiamare una sola volta all'avvio dell'app.
 * Ritorna una funzione di cleanup.
 */
export function disableBackspaceNavigation(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Backspace") return;
    if (isEditableTarget(e.target)) return; // dentro un campo: lascia cancellare
    e.preventDefault(); // fuori da un campo: niente "Indietro"
  };

  // capture: intercetta l'evento prima che arrivi al gestore di default del browser.
  window.addEventListener("keydown", handler, { capture: true });
  return () => window.removeEventListener("keydown", handler, { capture: true });
}
