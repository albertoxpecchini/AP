import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import { disableBackspaceNavigation } from "./app/utils/keyboard.ts";
import ThemeWidget from "./app/theme/ThemeWidget.tsx";
import { syncTheme } from "./app/theme/themeCore.ts";
import LanguageSwitcher from "./app/i18n/LanguageSwitcher.tsx";
import { startI18nEngine } from "./app/i18n/translateDom.ts";
import { initLangAttr } from "./app/i18n/langCore.ts";
import "./styles/index.css";

// Il Backspace non deve più far "uscire" dalla pagina (navigazione Indietro del
// browser): resta attivo solo dentro i campi di testo per cancellare i caratteri.
disableBackspaceNavigation();

// Tema globale applicato subito (mode manuale o sensore orario).
syncTheme();

// Lingua globale: imposta <html lang> col valore memorizzato/rilevato.
initLangAttr();

const Bio = lazy(() => import("./app/site/Bio.tsx"));
const Parole = lazy(() => import("./app/parole/Parole.tsx"));
const Angoli = lazy(() => import("./app/angoli/Angoli.tsx"));
const Trivia = lazy(() => import("./app/trivia/Trivia.tsx"));
const Pcto = lazy(() => import("./app/pcto/Pcto.tsx"));
const MeStesso = lazy(() => import("./app/me-stesso/MeStesso.tsx"));
const Dubliners = lazy(() => import("./app/dubliners/Dubliners.tsx"));
const Gattopardo = lazy(() => import("./app/gattopardo/Gattopardo.tsx"));
const Letteratura = lazy(() => import("./app/letteratura/Letteratura.tsx"));
const Movimento = lazy(() => import("./app/movimento/Movimento.tsx"));
const Mappa = lazy(() => import("./app/mappa/Mappa.tsx"));
const Festa = lazy(() => import("./app/festa/Festa.tsx"));
const Archivio = lazy(() => import("./app/archivio/Archivio.tsx"));
const Sostieni = lazy(() => import("./app/sostieni/Sostieni.tsx"));

createRoot(document.getElementById("root")!).render(
  <>
    <BrowserRouter>
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
        path="/parole"
        element={
          <Suspense fallback={null}>
            <Parole />
          </Suspense>
        }
      />
      <Route
        path="/angoli"
        element={
          <Suspense fallback={null}>
            <Angoli />
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
        path="/letteratura"
        element={
          <Suspense fallback={null}>
            <Letteratura />
          </Suspense>
        }
      />
      <Route
        path="/movimento"
        element={
          <Suspense fallback={null}>
            <Movimento />
          </Suspense>
        }
      />
      <Route
        path="/mappa"
        element={
          <Suspense fallback={null}>
            <Mappa />
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
<Route path="*" element={<App />} />
    </Routes>
    </BrowserRouter>
    {/* Barra di controllo globale — un'unica pillola in vetro, in basso a
        sinistra: lingua · tema · sensore orario. Presente su ogni pagina.
        L'ordine qui è l'ordine dei segmenti da sinistra a destra. */}
    <div className="ap-controlbar">
      <LanguageSwitcher />
      <ThemeWidget />
    </div>
  </>,
);

// Avvia il motore di traduzione DOPO il primo render: traduce subito ciò che è
// già a schermo (la home non è lazy → DOM presente) e poi segue ogni cambio
// pagina/contenuto e ogni cambio lingua.
startI18nEngine();
