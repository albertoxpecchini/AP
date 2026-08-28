// ─────────────────────────────────────────────────────────────────────────────
// Movimento del vetro — globale, su OGNI pagina del sito.
//
// Le card sono lastre semitrasparenti (vedi i token --sb-glass-* in home.css).
// Una lastra però si legge come lastra solo se dietro c'è qualcosa che cambia:
// sfocare una tinta piatta dà esattamente lo stesso risultato di non sfocare
// niente. Qui vive quel "qualcosa che cambia", più le due interazioni che
// hanno bisogno del puntatore.
//
// ① Il fondale che si muove — i due aloni (.sb-home::before/::after) slittano
//    con lo scroll e si scostano piano verso il puntatore, così sotto ogni
//    card passa colore diverso man mano che scendi. Qui sta anche la QUIETE: a
//    pagina ferma il respiro degli aloni si mette in pausa, perché è lui che
//    tiene svegli tutti i backdrop-filter della pagina.
// ② Tilt — la card si inclina verso il cursore e il rim si sposta di
//    conseguenza.
// ③ Quello che il puntatore illumina — rim, alone, lucido del titolo.
// ④ Il cubo della card CAT (--vis-x/--vis-y).
// ⑤ Pillola della nav — vedi useNavPill in fondo, che però NON è globale.
// ⑥ Tinta della nav — la sezione a schermo passa il suo data-acc all'<header>;
//    anche questa è roba della home soltanto.
//
// Quello che qui NON c'è, e che è servito impararlo: il moto dei visual delle
// card. Per un giro l'ha comandato il puntatore da questo file, e il risultato
// erano scatti — i numeri finivano in `left`, `top`, `clip-path` e
// `box-shadow`, che ridisegnano. Sta in home.css, in keyframe su transform e
// opacity. Vedi il blocco ④ per il ragionamento per esteso.
//
// Regole, le stesse di site/homeMotion.ts:
//  · un solo gsap.matchMedia() proprietario, revert() al dismount;
//  · niente split del testo traducibile (il motore i18n cammina sui nodi);
//  · solo transform e opacity — quello che era stato tolto dalla home, e per
//    cui era stato tolto, erano gradienti grandi ridisegnati a ogni frame;
//  · NIENTE custom property su <html> a ogni fotogramma. È la regola nuova, e
//    è costata cara impararla: una custom property è ereditata, quindi
//    cambiarne una sulla radice fa ricalcolare lo stile di TUTTO il documento
//    — 18,6 ms per fotogramma su questa home, contro 0,23 se lo stesso numero
//    finisce su una foglia. Quello che deve muoversi a 60 al secondo si scrive
//    sull'elemento che lo consuma, o non passa dalla cascata per niente
//    (site/aura.ts).
//
// Niente ScrollTrigger per la deriva, per la stessa ragione per cui non lo usa
// site/ScrollProgress.tsx: le pagine sono lazy e cambiano altezza dopo il
// montaggio, quindi conviene rimisurare a ogni frame utile invece di fidarsi
// di una misura presa una volta e poi da rinfrescare a mano.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { apriAura, auraViva, chiudiAura, muoviAura } from "./aura";
import { apriMacchie, chiudiMacchie, macchieVive, muoviMacchie } from "./macchie";

/** Quanto slittano gli aloni fra cima e fondo della pagina. Volutamente poco:
 *  è un cambio di luce dietro il vetro, non un fondale che scorre. */
const DRIFT_PX = 140;

/** Inclinazione massima della card, in gradi. Oltre i 5° la card smette di
 *  sembrare una lastra che si orienta e comincia a sembrare una pagina che si
 *  piega. */
const TILT_DEG = 5;

/** Cosa è "una card" per il tilt: gli stessi selettori che in home.css hanno
 *  già un hover, così non si inclina niente che non fosse già premibile. */
const TILTABLE = "a.sb-card, button.sb-card, .sb-page-card, .sb-story, .sb-panel--hover";

/** Quanto si spostano gli aloni del fondale dietro al puntatore, in percentuale
 *  del loro centro. Pochissimo e lentissimo (vedi PTR_LAG): è la luce della
 *  stanza che si accorge di te, non un riflettore che ti insegue. */
const PTR_SHIFT = 4;
const PTR_LAG = 1.2;

/** Riposo del riquadro sotto il puntatore: il centro. */
const VIS_REST = { x: 0.5, y: 0.5 };

/** Dov'è arrivata la lettura, 0→1.
 *
 *  Non basta window.scrollY: su questo sito la pagina NON scorre nella
 *  finestra. index.html mette height:100% su html/body/#root e
 *  styles/index.css mette overflow-x:hidden su html e body — e overflow-x
 *  diverso da visible forza overflow-y a `auto`. Risultato: <body> diventa un
 *  contenitore di scorrimento suo, alto quanto la finestra, e il contenuto
 *  scorre DENTRO di lui. window.scrollY resta 0 per sempre.
 *
 *  Quindi leggo da chiunque si stia muovendo davvero, e ascolto lo scroll in
 *  fase di cattura: gli eventi di scroll di un elemento non risalgono, e
 *  quello di <body> non arriverebbe mai a window. */
function readProgress(): number {
  const d = document.documentElement;
  const b = document.body;
  const y = window.scrollY || d.scrollTop || b.scrollTop || 0;
  const max = Math.max(d.scrollHeight, b.scrollHeight) - window.innerHeight;
  return max > 0 ? gsap.utils.clamp(0, 1, y / max) : 0;
}

export default function GlassMotion() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    // ── ① Il fondale che si muove — deriva, puntatore e quiete ─────────────
    // Un blocco solo per tutti e tre, perché muovono lo stesso oggetto: i due
    // aloni di .sb-home::before/::after.
    //
    //   deriva      slittano scendendo, così sotto ogni lastra passa colore
    //               diverso man mano che leggi;
    //   puntatore   si scostano di pochissimo verso di te, con un ritardo
    //               lungo — la luce della stanza che si accorge di te, non un
    //               riflettore che ti insegue;
    //   quiete      a pagina ferma il respiro a keyframe si mette in pausa.
    //
    // ── Perché NON sono più tre variabili CSS ────────────────────────────────
    // Erano --sb-drift, --sb-px e --sb-py, scritte su <html> a ogni fotogramma.
    // Costava 18,6 ms di ricalcolo dello stile PER FOTOGRAMMA, misurati su una
    // build di produzione: una custom property è ereditata, quindi cambiarne
    // una sulla radice fa ricalcolare lo stile di tutto il documento. Con le
    // stesse quantità scritte fuori dalla radice: 0,23 ms. Ottantuno volte.
    // Il come sta in site/aura.ts; qui restano i numeri e gli ascolti.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const root = document.documentElement;
      let aura = apriAura(DRIFT_PX, PTR_SHIFT / 2);
      // Le macchie del fondale viaggiano sulla STESSA deriva degli aloni: è la
      // posizione nella pagina, e leggerla due volte non avrebbe senso.
      let macchie = apriMacchie();

      // Lo stato che si tweena. I quickTo danno la curva ai NUMERI, e i numeri
      // finiscono nel currentTime delle animazioni: stesso mestiere di prima,
      // solo che il traguardo non è più una variabile nella cascata.
      const st = { deriva: 0, px: 0.5, py: 0.5 };
      let visual: HTMLElement[] = [];
      const raccogliVisual = () => Array.from(document.querySelectorAll<HTMLElement>(".sb-card-visual"));
      const scrivi = () => {
        // Cambiando rotta la radice di pagina è un altro nodo: le animazioni
        // appese al vecchio se ne sono andate con lui, e vanno riaperte.
        if (!auraViva(aura)) aura = apriAura(DRIFT_PX, PTR_SHIFT / 2);
        muoviAura(aura, st.deriva, st.px, st.py);
        // Le macchie del fondale: stessa deriva, cioè la stessa posizione
        // nella pagina. Scendendo cambia l'umore cromatico — vedi site/macchie.ts.
        if (!macchieVive(macchie)) macchie = apriMacchie();
        muoviMacchie(macchie, st.deriva);
        // La parallasse dei sei disegni leggeva la stessa --sb-drift. Adesso
        // si scrive loro addosso la TRASFORMAZIONE GIÀ FATTA, e non la
        // variabile: scriverci la variabile è stato il primo tentativo, e
        // spostava il problema invece di toglierlo — un .sb-card-visual ha
        // dentro una tavola SVG da una cinquantina di nodi, e una custom
        // property è ereditata, quindi ne invalidava il sottoalbero intero.
        // Nella traccia erano 324 elementi ricalcolati a ogni fotogramma.
        // `transform` non si eredita: invalida quell'elemento e basta.
        if (!visual.length || !visual[0].isConnected) visual = raccogliVisual();
        const y = st.deriva * DRIFT_PX * -0.035;
        for (const v of visual) v.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      };

      const derivaTo = gsap.quickTo(st, "deriva", { duration: 0.5, ease: "power2", onUpdate: scrivi });
      const pxTo = gsap.quickTo(st, "px", { duration: PTR_LAG, ease: "power2", onUpdate: scrivi });
      const pyTo = gsap.quickTo(st, "py", { duration: PTR_LAG, ease: "power2", onUpdate: scrivi });

      let frame = 0;
      const update = () => {
        frame = 0;
        // Con lo scroll bloccato (menu, modali) il body va in position:fixed:
        // la pagina "si accorcia" e il fondale schizzerebbe. Lo congelo.
        if (document.body.dataset.scrollLockY !== undefined) return;
        derivaTo(readProgress());
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };

      // ── La quiete ────────────────────────────────────────────────────────
      // Il respiro a keyframe degli aloni (home.css, @keyframes sb-drift-a/b)
      // non finisce mai, e questo NON costa per sé: sono due strati che il
      // compositore sposta. Costa per quello che ha davanti — ogni lastra di
      // vetro ha un backdrop-filter, e un backdrop-filter si rifà ogni volta
      // che cambia il suo sfondo. Con la deriva sempre viva, una pagina ferma
      // continua a risfocare una dozzina di pannelli a 60 al secondo.
      //
      // Quindi: dopo un secondo e mezzo che non si scorre e non si muove il
      // puntatore, `sb-quiet` mette in pausa la deriva; al primo dei due
      // gesti riparte. Nessuno vede una deriva da 74 secondi mentre sta fermo
      // a leggere, e appena la pagina si muove il fondo si muove con lei.
      const QUIETE = 1500;
      let quiet = 0;
      const sveglia = () => {
        root.classList.remove("sb-quiet");
        clearTimeout(quiet);
        quiet = window.setTimeout(() => root.classList.add("sb-quiet"), QUIETE);
      };
      const puntatore = (e: PointerEvent) => {
        sveglia();
        pxTo(e.clientX / window.innerWidth);
        pyTo(e.clientY / window.innerHeight);
      };
      const risveglio = () => {
        sveglia();
        schedule();
      };

      visual = raccogliVisual();
      update();
      scrivi();
      sveglia();
      // capture: true — vedi readProgress(). Lo scroll qui lo fa <body>, e il
      // suo evento non risale fino a window.
      document.addEventListener("scroll", risveglio, { passive: true, capture: true });
      window.addEventListener("resize", risveglio);
      document.addEventListener("pointermove", puntatore, { passive: true });

      return () => {
        if (frame) cancelAnimationFrame(frame);
        clearTimeout(quiet);
        root.classList.remove("sb-quiet");
        document.removeEventListener("scroll", risveglio, { capture: true });
        window.removeEventListener("resize", risveglio);
        document.removeEventListener("pointermove", puntatore);
        gsap.killTweensOf(st);
        chiudiAura(aura);
        chiudiMacchie(macchie);
        for (const v of visual) v.style.removeProperty("transform");
      };
    });
    // ── ② Tilt ──────────────────────────────────────────────────────────────
    // Per delega su document, non un listener per pannello: i .sb-panel del
    // sito sono centinaia e su alcune pagine compaiono dopo (lazy). Così ce
    // n'è una manciata in tutto e le card nuove funzionano senza registrarsi.
    //
    // Il sollevamento di 3px all'hover, che in home.css stava sulla
    // transizione CSS, qui è dentro lo stesso tween: GSAP e CSS scriverebbero
    // tutti e due su `transform` e all'uscita la card sussulterebbe. La regola
    // CSS resta per il tocco (vedi il @media in home.css).
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      let panel: HTMLElement | null = null;
      // La misura della card si prende UNA volta, entrando, e non a ogni
      // frame. getBoundingClientRect obbliga il browser a ricalcolare il
      // layout se nel frattempo è stato scritto dello stile — e qui lo stile
      // lo scrive GSAP a ogni frame, quindi ogni lettura era un layout
      // sincrono forzato. Misurato: da 28,7 a ~15 ms per frame muovendo il
      // puntatore sulle card.
      //
      // La misura si può cachare perché scade in un caso solo, lo scroll, e
      // lì c'è già release() attaccato all'evento (in cattura, più sotto).
      let rect: DOMRect | null = null;
      let rotX: ((v: number) => void) | null = null;
      let rotY: ((v: number) => void) | null = null;
      const clamp = gsap.utils.clamp(-TILT_DEG, TILT_DEG);

      const release = () => {
        if (!panel) return;
        const leaving = panel;
        panel = null;
        rect = null;
        rotX = null;
        rotY = null;
        gsap.to(leaving, {
          rotationX: 0,
          rotationY: 0,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          onComplete: () => {
            leaving.style.willChange = "";
          },
        });
      };

      const enter = (el: HTMLElement) => {
        panel = el;
        rect = el.getBoundingClientRect();
        el.style.willChange = "transform";
        // transformPerspective sta sulla card stessa: mettere `perspective`
        // sul contenitore avrebbe voluto dire toccare il CSS di ogni griglia.
        gsap.set(el, { transformPerspective: 900, transformOrigin: "center center" });
        gsap.to(el, { y: -3, duration: 0.3, ease: "power3.out" });
        // rotationX/rotationY, non rotateX/rotateY: sono i nomi GSAP. Con i
        // nomi CSS il tween gira a vuoto — nessun errore, semplicemente la
        // card non si inclina.
        rotX = gsap.quickTo(el, "rotationX", { duration: 0.45, ease: "power3" });
        rotY = gsap.quickTo(el, "rotationY", { duration: 0.45, ease: "power3" });
      };

      const onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        const card = target?.closest?.(TILTABLE) as HTMLElement | null;
        // .sb-panel--hover è già lui il pannello; le card ce l'hanno dentro.
        const next = card
          ? (card.classList.contains("sb-panel")
              ? card
              : (card.querySelector(":scope > .sb-panel") as HTMLElement | null))
          : null;

        if (next !== panel) {
          release();
          if (next) enter(next);
        }
        if (!panel || !rect || !rotX || !rotY) return;

        const r = rect;
        const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        // Il segno di rotateX è invertito: puntatore in basso = bordo basso
        // che si avvicina, cioè la lastra si orienta VERSO il cursore.
        rotX(clamp(-py * TILT_DEG));
        rotY(clamp(px * TILT_DEG));
      };

      document.addEventListener("pointermove", onMove, { passive: true });
      // Il puntatore può uscire dalla finestra senza passare da nessuna card.
      document.addEventListener("pointerleave", release);
      window.addEventListener("blur", release);
      // Scorrendo, la card sfila via da sotto un cursore fermo: senza questo
      // resterebbe inclinata a mezz'aria. In cattura, come sopra.
      document.addEventListener("scroll", release, { passive: true, capture: true });

      return () => {
        release();
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", release);
        window.removeEventListener("blur", release);
        document.removeEventListener("scroll", release, { capture: true });
      };
    });

    // ── ③ Quello che il puntatore illumina ─────────────────────────────────
    // Un solo pointermove delegato, una sola scrittura per frame, tre effetti
    // che escono dallo stesso calcolo:
    //
    //  · il RIM del vetro (tutti i .sb-panel del sito). Il bordo da 1px di
    //    .sb-panel è un gradiente, e finora il suo angolo era fisso a 160°:
    //    la luce arrivava sempre da in alto a sinistra, anche quando il
    //    puntatore era dall'altra parte. Adesso l'angolo lo scrive questo
    //    ciclo, e il lato illuminato è quello da cui arrivi. Costa una
    //    variabile CSS: il gradiente resta fermo nel foglio di stile.
    //  · l'ALONE (solo .sb-home--fx .sb-panel, cioè le pagine interne, dove i
    //    pannelli SONO il contenuto). Sulla home ce l'hanno già le sette card
    //    prodotti, avvolte una per una da components/reactbits/SpotlightCard:
    //    accenderlo anche qui vorrebbe dire dipingerlo due volte sulla stessa
    //    card. Acceso è sempre e solo UN pannello, quello sotto il cursore —
    //    non è l'alone tolto a suo tempo dalla home, che si accendeva su una
    //    card dopo l'altra mentre scorrevi.
    //  · la STRISCIA DI LUCE sul titolo della hero, via --gloss-x.
    //    Stava sulla radice «così non serve cercare l'elemento a ogni frame, e
    //    l'eredità fa il resto», ed era il ragionamento sbagliato: l'eredità
    //    non è gratis, è il motivo per cui il motore deve ricalcolare lo stile
    //    di ogni nodo del documento. Cercare l'elemento costa una volta sola
    //    (si cachea, e si ricontrolla solo se è uscito dal DOM); scriverci
    //    sopra costa zero, perché sotto non ha nessuno.
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      // L'unico che legge --gloss-x è la prima riga del titolo della hero
      // (home.css, .sb-hero-title > span:first-child). Su una pagina interna
      // non c'è, e allora non c'è niente da scrivere.
      let titolo: HTMLElement | null = null;
      const cercaTitolo = () => {
        if (!titolo || !titolo.isConnected) titolo = document.querySelector(".sb-hero-title > span");
        return titolo;
      };
      let frame = 0;
      let lit: HTMLElement | null = null;
      let litGlows = false;
      let clientX = 0;
      let clientY = 0;

      const clear = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.removeProperty("--spot-x");
        el.style.removeProperty("--spot-y");
        el.style.removeProperty("--rim-angle");
      };

      // Stessa cache del blocco ②, e per lo stesso motivo: qui la misura si
      // leggeva dentro il frame, subito dopo che GSAP aveva scritto le
      // trasformazioni del tilt sullo stesso pannello — cioè nel punto
      // peggiore possibile per chiedere una geometria.
      let rect: DOMRect | null = null;

      const write = () => {
        frame = 0;
        cercaTitolo()?.style.setProperty("--gloss-x", `${(clientX / window.innerWidth) * 100}%`);
        if (!lit) return;
        const r = (rect ??= lit.getBoundingClientRect());
        // Angolo puntatore → centro, in gradi orari a partire dall'alto; +180
        // perché in un linear-gradient l'angolo è il verso in cui la sfumatura
        // VA, mentre il colore chiaro sta all'inizio: la luce è dietro.
        const deg = (Math.atan2(clientX - (r.left + r.width / 2), r.top + r.height / 2 - clientY) * 180) / Math.PI;
        lit.style.setProperty("--rim-angle", `${(deg + 540) % 360}deg`);
        if (!litGlows) return;
        lit.style.setProperty("--spot-x", `${clientX - r.left}px`);
        lit.style.setProperty("--spot-y", `${clientY - r.top}px`);
      };

      const onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        const panel = target?.closest?.(".sb-home .sb-panel") as HTMLElement | null;
        if (panel !== lit) {
          clear(lit);
          lit = panel;
          rect = null;
          // Deciso una volta all'ingresso, non a ogni frame: l'alone è roba
          // delle sole pagine interne (vedi sopra).
          litGlows = !!panel?.closest(".sb-home--fx");
        }
        clientX = e.clientX;
        clientY = e.clientY;
        // Una scrittura per frame, non una per movimento del puntatore.
        if (!frame) frame = requestAnimationFrame(write);
      };

      // La misura cachata scade solo se la pagina scorre sotto il puntatore:
      // qui non serve spegnere niente (a differenza del tilt), basta buttare
      // via il numero e rileggerlo al movimento dopo. In cattura, perché lo
      // scroll lo fa <body> e il suo evento non risale fino a window.
      const stale = () => {
        rect = null;
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("scroll", stale, { passive: true, capture: true });
      window.addEventListener("resize", stale);

      return () => {
        if (frame) cancelAnimationFrame(frame);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("scroll", stale, { capture: true });
        window.removeEventListener("resize", stale);
        clear(lit);
        titolo?.style.removeProperty("--gloss-x");
        titolo = null;
        lit = null;
      };
    });

    // ── ④ Il cubo della card CAT ───────────────────────────────────────────
    // Una scrittura sola, e vale la pena dire cosa NON c'è più qui in mezzo.
    //
    // Per un giro, questo blocco ha comandato tutti e sette i visual della
    // griglia prodotti: scriveva la posizione del puntatore e i visual ci
    // costruivano sopra il loro movimento, al posto delle keyframe. Sulla
    // carta era ordinato — un listener solo, una scrittura per frame. Nei
    // fatti quei numeri finivano dentro `left`, `top`, `clip-path`,
    // `color-mix` e `box-shadow`, che sono tutte proprietà che a ogni
    // movimento del mouse rifanno il layout o ridisegnano. Sette riquadri per
    // volta, più il tilt della card, più il rim, più l'alone: scatti.
    //
    // Il moto dei visual è tornato in keyframe CSS su transform e opacity
    // (vedi home.css), che il compositore muove senza ricalcolare niente. Qui
    // resta il puntatore dove aggiunge qualcosa senza costare: il cubo, che si
    // orienta dentro una `transform`.
    //
    //   --vis-x / --vis-y  dove sei nel riquadro sotto il puntatore, 0→1
    //
    // Gli aloni del fondale stavano qui, e scrivevano --sb-px/--sb-py su
    // <html>: sono saliti al blocco ①, dove adesso si muovono senza passare
    // dalla cascata. Il perché sta lì e in site/aura.ts — in due parole,
    // costavano 18,6 ms di ricalcolo dello stile a ogni movimento del mouse.
    //
    // Perché i quickTo e non la scrittura diretta: una var CSS non registrata
    // con @property non transiziona, quindi uscendo dalla card il cubo
    // tornerebbe dritto di scatto. Tweenando l'oggetto di stato invece della
    // var, la curva ce l'ha il numero — stesso mestiere di driftTo al ①.
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      // ── Il riquadro sotto il puntatore ───────────────────────────────────
      let vis: HTMLElement | null = null;
      // Misura presa una volta all'ingresso (vedi blocco ②): scade sullo
      // scroll, e lì `leave` azzera già tutto.
      let rect: DOMRect | null = null;
      const st = { ...VIS_REST };
      const write = () => {
        if (!vis) return;
        vis.style.setProperty("--vis-x", `${st.x}`);
        vis.style.setProperty("--vis-y", `${st.y}`);
      };
      const xTo = gsap.quickTo(st, "x", { duration: 0.5, ease: "power3", onUpdate: write });
      const yTo = gsap.quickTo(st, "y", { duration: 0.5, ease: "power3", onUpdate: write });

      // Uscendo, il riquadro torna al centro con gli STESSI quickTo: un tween
      // in più sulle stesse proprietà si metterebbe a litigare con quello
      // ancora in volo se si esce dalla card di corsa. Le var restano scritte
      // (valgono 0.5, cioè il riposo) e non c'è niente da ripulire.
      const release = () => {
        if (!vis) return;
        xTo(VIS_REST.x);
        yTo(VIS_REST.y);
      };

      const onMove = (e: PointerEvent) => {
        const next = (e.target as HTMLElement | null)?.closest?.(".sb-card-visual") as HTMLElement | null;
        if (next !== vis) {
          release();
          vis = next;
          rect = next ? next.getBoundingClientRect() : null;
        }
        // Fuori da ogni riquadro non c'è niente da scrivere. Il controllo va
        // QUI e non dentro l'if: col puntatore fuori dalle card `next` e `vis`
        // sono tutti e due null, quindi l'if non scatta — e senza questa riga
        // si finisce a leggere getBoundingClientRect() da null a ogni singolo
        // movimento del mouse su tutto il resto della pagina.
        if (!vis || !rect) return;
        xTo(gsap.utils.clamp(0, 1, (e.clientX - rect.left) / (rect.width || 1)));
        yTo(gsap.utils.clamp(0, 1, (e.clientY - rect.top) / (rect.height || 1)));
      };

      // Il puntatore può uscire dalla finestra senza passare da nessuna card,
      // e scorrendo la card sfila via da sotto un cursore fermo. In cattura:
      // lo scroll qui lo fa <body>, e il suo evento non risale fino a window.
      const leave = () => {
        release();
        vis = null;
        rect = null;
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", leave);
      window.addEventListener("blur", leave);
      document.addEventListener("scroll", leave, { passive: true, capture: true });

      return () => {
        gsap.killTweensOf(st);
        if (vis) {
          vis.style.removeProperty("--vis-x");
          vis.style.removeProperty("--vis-y");
          vis = null;
        }
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", leave);
        window.removeEventListener("blur", leave);
        document.removeEventListener("scroll", leave, { capture: true });
      };
    });


    // Qui c'era il cancello della pozza d'acqua (site/puddle.ts): un
    // MutationObserver sull'intero <body> che a ogni raffica di mutazioni
    // React rifaceva un querySelectorAll("[data-puddle]") per agganciare
    // l'effetto ai contenitori arrivati dalla rete. L'unico che lo portava era
    // l'istogramma del footer, e l'effetto costava una custom property
    // riscritta su ogni cella a ogni fotogramma. Adesso l'onda la fa il CSS
    // coi selettori fratelli (site/foot.css), e sono spariti sia l'osservatore
    // globale sia le scritture per fotogramma.

    return () => mm.revert();
  }, []);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑥ Pillola della nav
//
// Questa NON è globale: `.sb-nav-link` esiste solo nella nav della home, e
// legarla al ciclo di vita di App le fa trovare il DOM già montato senza
// bisogno di stare a sorvegliare i cambi di rotta.
//
// La pillola scivola sotto la voce puntata; tolto il puntatore torna sulla
// sezione che si sta guardando. Si muove su translate3d + scaleX, mai su
// `left`/`width`: sono due proprietà che rifanno il layout a ogni frame.
// ─────────────────────────────────────────────────────────────────────────────
export function useNavPill(navRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const pill = nav.querySelector<HTMLElement>(".sb-nav-pill");
    if (!pill) return;

    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>(".sb-nav-link"));
    if (!links.length) return;

    // La larghezza di riposo della pillola in CSS: scaleX lavora su questa.
    const BASE_W = 100;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.classList.add("sb-nav-links--pill");

    let current: HTMLElement | null = null;
    let hovered: HTMLElement | null = null;
    let active: HTMLElement | null = null;

    const place = (el: HTMLElement | null, animate: boolean) => {
      if (!el) {
        current = null;
        pill.classList.remove("sb-nav-pill--on");
        return;
      }
      if (el === current) return;
      current = el;
      const navBox = nav.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const to = {
        x: box.left - navBox.left,
        scaleX: box.width / BASE_W,
        height: box.height,
      };
      pill.style.height = `${to.height}px`;
      pill.style.marginTop = `${-to.height / 2}px`;
      pill.classList.add("sb-nav-pill--on");
      if (animate && smooth) {
        gsap.to(pill, { x: to.x, scaleX: to.scaleX, duration: 0.42, ease: "power3.out" });
      } else {
        gsap.set(pill, { x: to.x, scaleX: to.scaleX });
      }
    };

    const sync = (animate = true) => place(hovered ?? active, animate);

    const onOver = (e: PointerEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.(".sb-nav-link") as HTMLElement | null;
      if (link && links.includes(link as HTMLAnchorElement)) {
        hovered = link;
        sync();
      }
    };
    const onOut = () => {
      hovered = null;
      sync();
    };

    nav.addEventListener("pointerover", onOver);
    nav.addEventListener("pointerleave", onOut);

    // ── Scrollspy ──────────────────────────────────────────────────────────
    // Quale sezione si sta guardando. rootMargin taglia via la fascia alta
    // (sotto la nav sticky) e i due terzi bassi: così la sezione "attiva" è
    // quella che occupa la parte alta della finestra, non l'ultima entrata di
    // un pixel dal fondo.
    const targets = links
      .map((l) => {
        const href = l.getAttribute("href") || "";
        if (!href.startsWith("#")) return null;
        const el = document.getElementById(href.slice(1));
        return el ? { link: l, el } : null;
      })
      .filter((x): x is { link: HTMLAnchorElement; el: HTMLElement } => x !== null);

    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        const hit = targets.find((t) => visible.has(t.el));
        const next = hit?.link ?? null;
        if (next !== active) {
          active = next;
          links.forEach((l) => {
            if (l === active) l.setAttribute("aria-current", "location");
            else l.removeAttribute("aria-current");
          });
          sync();
        }
      },
      { rootMargin: "-64px 0px -66% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t.el));

    // La nav si riflow-a quando cambia lingua (le voci cambiano larghezza) o
    // quando la finestra cambia misura: la pillola va rimessa in bolla.
    const remeasure = () => {
      current = null;
      sync(false);
    };
    window.addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(nav);

    return () => {
      nav.classList.remove("sb-nav-links--pill");
      nav.removeEventListener("pointerover", onOver);
      nav.removeEventListener("pointerleave", onOut);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      io.disconnect();
      links.forEach((l) => l.removeAttribute("aria-current"));
      gsap.killTweensOf(pill);
    };
  }, [navRef]);
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑦ La tinta della nav
//
// Le sei tinte stanno sulle sezioni (data-acc, vedi il blocco «La tavolozza»
// in home.css). La nav però è sticky: sta sopra tutte le sezioni e non è
// dentro nessuna, quindi non può ereditare niente. Se resta azzurra mentre
// sotto scorre una sezione verde, è l'unico pezzo di pagina che non ha capito
// dove sei.
//
// Quindi la tinta gliela si scrive: stesso data-acc della sezione a schermo,
// copiato sull'<header>. Da lì in giù ci pensa il CSS — pillola, bottone
// Contact, badge Local. Il passaggio è una dissolvenza perché .sb-btn e
// .sb-nav-pill hanno già una transizione sui colori: non c'è animazione da
// scrivere, solo un attributo da cambiare al momento giusto.
//
// Perché un observer suo e non quello della pillola: lo scrollspy della
// pillola guarda solo le sezioni che hanno una voce in nav (tre), mentre le
// tinte sono otto. Stesso rootMargin, però, così il colore e la pillola si
// muovono sullo stesso fotogramma invece di rincorrersi.
//
// Sull'hero e sulla CTA finale l'attributo si toglie: lì non c'è una tinta,
// c'è il sito, e il sito è azzurro.
// ─────────────────────────────────────────────────────────────────────────────
export function useNavAccent(barRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-acc]"));
    if (!sections.length) return;

    const visible = new Set<Element>();
    let current: string | null = null;

    const apply = () => {
      // La prima in ordine di documento fra quelle a schermo: scorrendo in
      // giù la tinta cambia quando la sezione nuova arriva sotto la nav, non
      // quando la vecchia è uscita del tutto.
      const hit = sections.find((el) => visible.has(el));
      const next = hit?.dataset.acc ?? null;
      if (next === current) return;
      current = next;
      if (next) bar.setAttribute("data-acc", next);
      else bar.removeAttribute("data-acc");
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        apply();
      },
      { rootMargin: "-64px 0px -66% 0px", threshold: 0 },
    );
    sections.forEach((el) => io.observe(el));

    // Una sezione può cambiare tinta stando ferma: lo scaffale delle sei
    // pagine porta il data-acc della lastra aperta, e quella si apre con un
    // clic, non con uno scroll. Senza questo, la nav resterebbe sulla tinta
    // che aveva l'ultima volta che l'observer si è svegliato.
    const mo = new MutationObserver(apply);
    sections.forEach((el) => mo.observe(el, { attributeFilter: ["data-acc"] }));

    return () => {
      io.disconnect();
      mo.disconnect();
      bar.removeAttribute("data-acc");
    };
  }, [barRef]);
}
