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
// tornare in pari è ricaricare la pagina, che riparte da un index.html fresco.
//
// Il recupero è a DUE tentativi, perché il primo da solo non basta:
//
//  ① ricaricare. Risolve il caso ①, e in produzione risolve quando l'index.html
//     arriva davvero dalla rete.
//  ② se dopo il ricaricamento siamo ancora qui, il colpevole è in casa: il
//     service worker sta servendo dalla propria cache lo STESSO index.html
//     vecchio, quindi la pagina ricaricata richiede gli stessi chunk morti e
//     fallisce identica. `location.reload()` non scavalca il service worker, e
//     `cleanupOutdatedCaches` ripulisce il precache ma non `ap-lazy-chunks` —
//     dove il chunk di Trivia sta in CacheFirst per trenta giorni. L'unica
//     uscita è togliere di mezzo service worker e cache e ripartire dalla rete.
//
// Le guardie stanno in sessionStorage e si AZZERANO appena una pagina si carica:
// così ogni guasto vero trova i due tentativi interi, invece di trovarli già
// spesi da un singolo inciampo capitato mezz'ora prima. Esauriti entrambi,
// l'errore risale a <PageBoundary>, che mostra un messaggio invece del vuoto.
const PURGE_KEY = "reload-chunk-purge";
const reloadKey = (name: string) => `reload-chunk-${name}`;

function flag(key: string): boolean {
  try {
    if (sessionStorage.getItem(key) === "1") return true;
    sessionStorage.setItem(key, "1");
    return false;
  } catch {
    return true; // niente sessionStorage → niente ricaricamento, per non ciclare
  }
}

// Toglie service worker e cache, poi ricarica. Ultima spiaggia: si paga il
// riscaricamento della shell, ma solo dopo che un ricaricamento normale ha già
// fallito — cioè quando la copia locale è dimostrabilmente quella sbagliata.
async function purgeAndReload() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch { /* niente service worker: tanto meglio */ }
  try {
    const names = (await caches?.keys?.()) ?? [];
    await Promise.all(names.map((n) => caches.delete(n)));
  } catch { /* niente Cache Storage: idem */ }
  location.reload();
}

function lazyPage(name: string, load: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(async () => {
    try {
      const mod = await load();
      // Caricata: i tentativi tornano disponibili per il prossimo guaio vero.
      try {
        sessionStorage.removeItem(reloadKey(name));
        sessionStorage.removeItem(PURGE_KEY);
      } catch { /* senza sessionStorage non c'era niente da azzerare */ }
      return mod;
    } catch (err) {
      // Promise che non si risolve mai: la pagina sta già andando via, così
      // nel frattempo non compare né l'errore né un mezzo render.
      const leaving = () => new Promise<never>(() => {});
      if (!flag(reloadKey(name))) {
        location.reload();
        return await leaving();
      }
      if (!flag(PURGE_KEY)) {
        void purgeAndReload();
        return await leaving();
      }
      throw err;
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
          // Qui ci si arriva solo dopo che ricaricamento E ripulitura hanno già
          // fallito: rifare un reload liscio rifarebbe la cosa che non ha
          // funzionato. Si riparte azzerando tutto, com'è la ripulitura.
          onClick={() => { try { sessionStorage.clear(); } catch {} void purgeAndReload(); }}
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
// /shooting è pubblica, ma le foto no: la pagina esiste per tutti e mostra le
// gallerie solo dove il manifesto privato risponde, cioè sul computer di casa
// sotto `vite dev`. Vedi src/app/shooting/sessioni.ts.
const Shooting = lazyPage("shooting", () => import("./app/shooting/Shooting.tsx"));
const Archivio = lazyPage("archivio", () => import("./app/archivio/Archivio.tsx"));
// /comandi è l'indice dei programmi che il progetto lancia da terminale: la
// pagina è pubblica e racconta soltanto, non esegue niente. Vedi
// src/app/comandi/comandi.ts.
const Comandi = lazyPage("comandi", () => import("./app/comandi/Comandi.tsx"));
const Sostieni = lazyPage("sostieni", () => import("./app/sostieni/Sostieni.tsx"));
const Instagram = lazyPage("instagram", () => import("./app/instagram/Instagram.tsx"));
// /soldi non è un estratto conto: è un contatore. Due rilevamenti veri, un
// tasso fisso, e una formula che da lì ricava ogni istante successivo — vedi
// src/app/soldi/soldi.ts.
const Soldi = lazyPage("soldi", () => import("./app/soldi/Soldi.tsx"));

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
        path="/shooting"
        element={
          <Suspense fallback={null}>
            <Shooting />
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
        path="/comandi"
        element={
          <Suspense fallback={null}>
            <Comandi />
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
      <Route
        path="/soldi"
        element={
          <Suspense fallback={null}>
            <Soldi />
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
