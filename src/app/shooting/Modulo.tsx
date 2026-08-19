import { useState } from "react";
import { IcSend, IcCheck, IcAlert, IcLock, IcLoader } from "../site/homeIcons";

// ─────────────────────────────────────────────────────────────────────────────
// Il modulo con cui si chiede di vedere una sessione.
//
// Non è un modulo aperto al mondo: serve un CODICE, che Alberto consegna a
// voce a chi ha davvero motivo di chiedere. Senza, la richiesta non parte
// nemmeno — e il server risponde lo stesso a chi prova a indovinarlo, con un
// limite duro sui tentativi (vedi api/scatti-richiesta.ts).
//
// Quello che si scrive qui finisce in una tabella privata e in un'email. Non
// diventa pubblico niente, e dopo trenta giorni la riga si cancella da sola: è
// scritto nel modulo, sopra la spunta, invece che in una pagina di condizioni
// che non legge nessuno.
// ─────────────────────────────────────────────────────────────────────────────

type Esito = { tipo: "fermo" } | { tipo: "invio" } | { tipo: "fatto" } | { tipo: "guaio"; testo: string };

export default function Modulo({ sessione, onChiudi }: { sessione: string; onChiudi: () => void }) {
  const [esito, setEsito] = useState<Esito>({ tipo: "fermo" });
  const [consenso, setConsenso] = useState(false);

  async function invia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (esito.tipo === "invio") return;
    const dati = new FormData(e.currentTarget);
    setEsito({ tipo: "invio" });

    try {
      const r = await fetch("/api/scatti-richiesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessione,
          nome: dati.get("nome"),
          email: dati.get("email"),
          rapporto: dati.get("rapporto"),
          motivo: dati.get("motivo"),
          codice: dati.get("codice"),
          consenso: true,
        }),
      });
      const risposta = await r.json().catch(() => ({}));
      if (r.ok && risposta?.ok) {
        setEsito({ tipo: "fatto" });
        return;
      }
      setEsito({
        tipo: "guaio",
        testo:
          risposta?.errore === "codice"
            ? "Il codice non è quello giusto."
            : risposta?.error || "Non è andata. Riprova fra poco.",
      });
    } catch {
      setEsito({ tipo: "guaio", testo: "Niente rete: la richiesta non è partita." });
    }
  }

  if (esito.tipo === "fatto") {
    return (
      <div className="sb-sh-modulo sb-sh-modulo--fatto">
        <p className="sb-sh-modulo-ok">
          <IcCheck size={15} /> Richiesta inviata.
        </p>
        <p>
          Se Alberto autorizza, ti arriva un'email con un link che vale 24 ore. Se non autorizza,
          non ricevi niente: le foto sono di chi c'è dentro, non di chi le ha scattate.
        </p>
        <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <form className="sb-sh-modulo" onSubmit={invia}>
      <p className="sb-sh-modulo-intro">
        Serve il <strong>codice</strong> che ti ha dato Alberto: senza, la richiesta non parte.
      </p>

      <div className="sb-sh-campi">
        <label className="sb-sh-campo">
          <span>Nome e cognome</span>
          <input name="nome" type="text" required minLength={2} maxLength={60} autoComplete="name" />
        </label>
        <label className="sb-sh-campo">
          <span>Email</span>
          <input name="email" type="email" required maxLength={120} autoComplete="email" />
        </label>
        <label className="sb-sh-campo sb-sh-campo--lungo">
          <span>Chi sei per le persone ritratte</span>
          <input
            name="rapporto"
            type="text"
            required
            minLength={2}
            maxLength={200}
            placeholder="sono io · la sorella · un'amica di…"
          />
        </label>
        <label className="sb-sh-campo sb-sh-campo--lungo">
          <span>Perché vuoi vederle</span>
          <textarea name="motivo" rows={3} maxLength={600} placeholder="Facoltativo, ma aiuta." />
        </label>
        <label className="sb-sh-campo sb-sh-campo--codice">
          <span>
            <IcLock size={13} /> Codice
          </span>
          <input name="codice" type="text" required maxLength={40} autoComplete="off" spellCheck={false} />
        </label>
      </div>

      <label className="sb-sh-consenso">
        <input type="checkbox" checked={consenso} onChange={(e) => setConsenso(e.target.checked)} required />
        <span>
          So che questi dati servono solo a valutare la richiesta, che non diventano pubblici, e che
          vengono cancellati entro trenta giorni.
        </span>
      </label>

      {esito.tipo === "guaio" && (
        <p className="sb-sh-modulo-guaio">
          <IcAlert size={15} /> {esito.testo}
        </p>
      )}

      <div className="sb-sh-modulo-fondo">
        <button type="submit" className="sb-btn sb-btn--sm sb-btn--primary" disabled={esito.tipo === "invio"}>
          {esito.tipo === "invio" ? <IcLoader size={15} /> : <IcSend size={15} />}
          {esito.tipo === "invio" ? "Invio…" : "Invia la richiesta"}
        </button>
        <button type="button" className="sb-btn sb-btn--sm sb-btn--ghost" onClick={onChiudi}>
          Lascia stare
        </button>
      </div>
    </form>
  );
}
