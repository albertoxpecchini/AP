import { lazy, Suspense, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./app/App.tsx";
import { disableBackspaceNavigation } from "./app/utils/keyboard.ts";
import ControlBar from "./app/theme/ControlBar.tsx";
import ScrollProgress from "./app/site/ScrollProgress.tsx";
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

const Bio = lazy(() => import("./app/site/Bio.tsx"));
const Trivia = lazy(() => import("./app/trivia/Trivia.tsx"));
const Pcto = lazy(() => import("./app/pcto/Pcto.tsx"));
const MeStesso = lazy(() => import("./app/me-stesso/MeStesso.tsx"));
const Dubliners = lazy(() => import("./app/dubliners/Dubliners.tsx"));
const Gattopardo = lazy(() => import("./app/gattopardo/Gattopardo.tsx"));
const Festa = lazy(() => import("./app/festa/Festa.tsx"));
const Archivio = lazy(() => import("./app/archivio/Archivio.tsx"));
const Sostieni = lazy(() => import("./app/sostieni/Sostieni.tsx"));
const Instagram = lazy(() => import("./app/instagram/Instagram.tsx"));

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
    <BrowserRouter>
    {SubPage ? (
      <Routes>
        <Route path="*" element={<Suspense fallback={null}><SubPage /></Suspense>} />
      </Routes>
    ) : (
    <Routes>
      <Route path="/" element={<App />} />
      <Route
        path="/bio"
        element={
          <Suspense fallback={null}>
            <Bio />
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
    {/* Barra di controllo globale — un'unica pillola in basso a sinistra:
        lingua · tema · sensore orario. Presente su ogni pagina. Sta
        rincantucciata oltre il bordo ed esce dal lato quando ci si avvicina. */}
    <ControlBar />
    {/* Filo di avanzamento della lettura, sul bordo alto: cresce da sinistra a
        destra avvicinandosi alla fine della pagina. Anche questo su ogni pagina. */}
    <ScrollProgress />
    {/* Vercel Speed Insights: raccoglie le metriche di performance reali (Core
        Web Vitals) su ogni pagina. Attivo solo in produzione su Vercel. */}
    <SpeedInsights />
  </>,
);

// Avvia il motore di traduzione DOPO il primo render: traduce subito ciò che è
// già a schermo (la home non è lazy → DOM presente) e poi segue ogni cambio
// pagina/contenuto e ogni cambio lingua.
startI18nEngine();
