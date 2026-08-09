import { Component, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./app/App.tsx";
import { disableBackspaceNavigation } from "./app/utils/keyboard.ts";
import ControlBar from "./app/theme/ControlBar.tsx";
import ScrollProgress from "./app/site/ScrollProgress.tsx";
import GlassMotion from "./app/site/GlassMotion.tsx";
import { syncTheme } from "./app/theme/themeCore.ts";
import { startI18nEngine } from "./app/i18n/translateDom.ts";
import { initLangAttr } from "./app/i18n/langCore.ts";
import { pathForHost } from "./app/site/nav";
import "./styles/index.css";

// Il Backspace non deve più far "uscire" dalla pagina (navigazione Indietro del
// browser): resta attivo solo dentro i campi di testo per cancellare i caratteri.
disableBackspaceNavigation();

// Tema globale applicato subito (mode manuale o sensore orario).
syncTheme();

// Lingua globale: imposta <html lang> col valore memorizzato/rilevato.
initLangAttr();

// ── Pagine caricate a richiesta, con rete di sicurezza ──────────────────────
//
// Ogni pagina è un chunk a parte, scaricato al primo ingresso. Se quel
// download fallisce, `lazy` propaga l'errore: senza error boundary il
// <Suspense fallback={null}> qui sotto rende NIENTE, cioè pagina bianca — il
// gioco sembra "rotto" pur essendo intatto. Succede in due casi reali:
//
//  ① in sviluppo, quando Vite ri-ottimizza le dipendenze mentre il server è
//     acceso: il vecchio /node_modules/.vite/deps/<dep>.js?v=<hash> risponde
//     504 "Outdated Optimize Dep" e l'import della pagina muore con lui
//     (capitava a /trivia, l'unica che importa canvas-confetti);
//  ② in produzione dopo un deploy: una scheda aperta — o il service worker col
//     vecchio index.html in precache — chiede un chunk il cui hash non esiste
//     più sul CDN.
//
// In entrambi i casi il codice della pagina va benissimo: è il file servito a
// non esserci. E non serve richiederlo una seconda volta: quando il fetch di un
// modulo fallisce, il browser segna QUELL'URL come errato nella module map e a
// ogni import successivo restituisce lo stesso errore senza più uscire in rete
// (verificato: il secondo import non genera alcuna richiesta). L'unico modo di
// tornare in pari è ricaricare la pagina, che riparte da un index.html fresco —
// con i nomi dei chunk aggiornati e, grazie a `registerType: 'autoUpdate'`, col
// service worker nuovo al posto di quello che teneva in cache il vecchio indice.
//
// Il ricaricamento si fa UNA sola volta per pagina e per sessione: la guardia in
// sessionStorage evita il loop se il file manca davvero. Esaurito il tentativo,
// l'errore risale a <PageBoundary>, che mostra un messaggio invece del vuoto.
function lazyPage(name: string, load: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(async () => {
    try {
      return await load();
    } catch (err) {
      const key = `reload-chunk-${name}`;
      let already = true;
      try {
        already = sessionStorage.getItem(key) === "1";
        if (!already) sessionStorage.setItem(key, "1");
      } catch { already = true; } // niente sessionStorage → niente ricaricamento
      if (already) throw err;
      location.reload();
      // Promise che non si risolve mai: la pagina sta già andando via, così
      // nel frattempo non compare né l'errore né un mezzo render.
      return await new Promise<never>(() => {});
    }
  });
}

// Rete di sicurezza finale: se perfino dopo il ricaricamento la pagina non si
// carica, meglio dirlo che restare bianchi. Niente dipendenze, niente stile del
// sito (potrebbe non essere arrivato nemmeno quello): solo il minimo leggibile.
class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: 16, padding: 24, textAlign: "center", font: "16px/1.5 system-ui, sans-serif" }}>
        <p style={{ margin: 0 }}>Non è stato possibile caricare questa pagina.</p>
        <p style={{ margin: 0, opacity: 0.7 }}>Controlla la connessione e riprova.</p>
        <button
          type="button"
          onClick={() => { try { sessionStorage.clear(); } catch {} location.reload(); }}
          style={{ justifySelf: "center", padding: "8px 18px", borderRadius: 6, border: "1px solid currentColor", background: "transparent", color: "inherit", font: "inherit", cursor: "pointer" }}
        >
          Riprova
        </button>
      </div>
    );
  }
}

const Bio = lazyPage("bio", () => import("./app/site/Bio.tsx"));
const Cv = lazyPage("cv", () => import("./app/cv/Cv.tsx"));
const Trivia = lazyPage("trivia", () => import("./app/trivia/Trivia.tsx"));
const Pcto = lazyPage("pcto", () => import("./app/pcto/Pcto.tsx"));
const MeStesso = lazyPage("me-stesso", () => import("./app/me-stesso/MeStesso.tsx"));
const Dubliners = lazyPage("dubliners", () => import("./app/dubliners/Dubliners.tsx"));
const Gattopardo = lazyPage("gattopardo", () => import("./app/gattopardo/Gattopardo.tsx"));
const Festa = lazyPage("festa", () => import("./app/festa/Festa.tsx"));
const Mima = lazyPage("mima", () => import("./app/mima/Mima.tsx"));
const MimaVeicoli = lazyPage("mima-veicoli", () => import("./app/mima/Veicoli.tsx"));
const MimaLuoghi = lazyPage("mima-luoghi", () => import("./app/mima/Luoghi.tsx"));
const Archivio = lazyPage("archivio", () => import("./app/archivio/Archivio.tsx"));
const Sostieni = lazyPage("sostieni", () => import("./app/sostieni/Sostieni.tsx"));
const Instagram = lazyPage("instagram", () => import("./app/instagram/Instagram.tsx"));

// ── /cleaning — l'officina del repo, solo in locale ──────────────────────────
// Legge e riscrive i file del repo e fa commit: roba che su un sito pubblico
// non deve nemmeno esistere. `import.meta.env.DEV` è una costante che Vite
// sostituisce a build-time, quindi in produzione questo diventa `null` e rollup
// porta via con sé anche l'import() qui dentro — la pagina non finisce in un
// chunk, non c'è un URL che risponde, non c'è un interruttore da ricordarsi.
// Dall'altra parte gli endpoint stanno in un plugin che vive dentro
// `configureServer`, cioè solo sotto `vite dev`.
const Cleaning = import.meta.env.DEV
  ? lazyPage("cleaning", () => import("./app/cleaning/Cleaning.tsx"))
  : null;

// ── Sottodomini canonici ──────────────────────────────────────────────────────
// Se siamo su <pagina>.albertopecchini.it, serviamo DIRETTAMENTE quella pagina
// alla root del sottodominio: l'URL resta pulito (nessun /path aggiunto) e non
// c'è alcun redirect. Su www/apex (e in dev/preview) resta il routing a path.
const SUBDOMAIN_PAGE: Record<string, ComponentType> = {
  "/bio": Bio,
  "/trivia": Trivia,
  "/pcto": Pcto,
  "/me-stesso": MeStesso,
  "/dubliners": Dubliners,
  "/gattopardo": Gattopardo,
  "/archivio": Archivio,
  "/sostieni": Sostieni,
  "/festa": Festa,
};
const subPath = pathForHost();
const SubPage = subPath ? SUBDOMAIN_PAGE[subPath] : null;

createRoot(document.getElementById("root")!).render(
  <>
    <PageBoundary>
    <BrowserRouter>
    {SubPage ? (
      <Routes>
        <Route path="*" element={<Suspense fallback={null}><SubPage /></Suspense>} />
      </Routes>
    ) : (
    <Routes>
      <Route path="/" element={<App />} />
      {Cleaning && (
        <Route
          path="/cleaning"
          element={
            <Suspense fallback={null}>
              <Cleaning />
            </Suspense>
          }
        />
      )}
      <Route
        path="/bio"
        element={
          <Suspense fallback={null}>
            <Bio />
          </Suspense>
        }
      />
      <Route
        path="/cv"
        element={
          <Suspense fallback={null}>
            <Cv />
          </Suspense>
        }
      />
      <Route
        path="/trivia"
        element={
          <Suspense fallback={null}>
            <Trivia />
          </Suspense>
        }
      />
      <Route
        path="/pcto"
        element={
          <Suspense fallback={null}>
            <Pcto />
          </Suspense>
        }
      />
      <Route
        path="/me-stesso"
        element={
          <Suspense fallback={null}>
            <MeStesso />
          </Suspense>
        }
      />
      <Route
        path="/dubliners"
        element={
          <Suspense fallback={null}>
            <Dubliners />
          </Suspense>
        }
      />
      <Route
        path="/gattopardo"
        element={
          <Suspense fallback={null}>
            <Gattopardo />
          </Suspense>
        }
      />
      <Route
        path="/festa"
        element={
          <Suspense fallback={null}>
            <Festa />
          </Suspense>
        }
      />
      <Route
        path="/mima"
        element={
          <Suspense fallback={null}>
            <Mima />
          </Suspense>
        }
      />
      <Route
        path="/mima/veicoli"
        element={
          <Suspense fallback={null}>
            <MimaVeicoli />
          </Suspense>
        }
      />
      <Route
        path="/mima/luoghi"
        element={
          <Suspense fallback={null}>
            <MimaLuoghi />
          </Suspense>
        }
      />
      <Route
        path="/archivio"
        element={
          <Suspense fallback={null}>
            <Archivio />
          </Suspense>
        }
      />
      <Route
        path="/sostieni"
        element={
          <Suspense fallback={null}>
            <Sostieni />
          </Suspense>
        }
      />
      <Route
        path="/instagram"
        element={
          <Suspense fallback={null}>
            <Instagram />
          </Suspense>
        }
      />
<Route path="*" element={<App />} />
    </Routes>
    )}
    </BrowserRouter>
    </PageBoundary>
    {/* Barra di controllo globale — un'unica pillola in basso a sinistra:
        lingua · tema · sensore orario. Presente su ogni pagina. Sta
        rincantucciata oltre il bordo ed esce dal lato quando ci si avvicina. */}
    <ControlBar />
    {/* Filo di avanzamento della lettura, sul bordo alto: cresce da sinistra a
        destra avvicinandosi alla fine della pagina. Anche questo su ogni pagina. */}
    <ScrollProgress />
    {/* Movimento del vetro, su ogni pagina: la deriva degli aloni dietro alle
        card (senza cui il blur non si leggerebbe) e il tilt delle card sotto
        il puntatore. Non disegna niente: monta solo gli effetti. */}
    <GlassMotion />
    {/* Vercel Speed Insights: raccoglie le metriche di performance reali (Core
        Web Vitals) su ogni pagina. Attivo solo in produzione su Vercel. */}
    <SpeedInsights />
  </>,
);

// Avvia il motore di traduzione DOPO il primo render: traduce subito ciò che è
// già a schermo (la home non è lazy → DOM presente) e poi segue ogni cambio
// pagina/contenuto e ogni cambio lingua.
startI18nEngine();
