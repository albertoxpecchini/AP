import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import "./styles/index.css";

const Parole = lazy(() => import("./app/parole/Parole.tsx"));
const Angoli = lazy(() => import("./app/angoli/Angoli.tsx"));
const Aula = lazy(() => import("./app/aula/Aula.tsx"));

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
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
        path="/5bt"
        element={
          <Suspense fallback={null}>
            <Aula />
          </Suspense>
        }
      />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>,
);
