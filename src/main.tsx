import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import { disableBackspaceNavigation } from "./app/utils/keyboard.ts";
import "./styles/index.css";

// Il Backspace non deve più far "uscire" dalla pagina (navigazione Indietro del
// browser): resta attivo solo dentro i campi di testo per cancellare i caratteri.
disableBackspaceNavigation();

const Bio = lazy(() => import("./app/site/Bio.tsx"));
const Parole = lazy(() => import("./app/parole/Parole.tsx"));
const Angoli = lazy(() => import("./app/angoli/Angoli.tsx"));
const Trivia = lazy(() => import("./app/trivia/Trivia.tsx"));
const Pcto = lazy(() => import("./app/pcto/Pcto.tsx"));
const MeStesso = lazy(() => import("./app/me-stesso/MeStesso.tsx"));
const Movimento = lazy(() => import("./app/movimento/Movimento.tsx"));
const Mappa = lazy(() => import("./app/mappa/Mappa.tsx"));

createRoot(document.getElementById("root")!).render(
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
<Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>,
);
