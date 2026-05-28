import { useState, useEffect } from "react";
import { activateLocalMode } from "./utils/local";
import { isIOS } from "./utils/device";
import {
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  Menu,
  X,
  GraduationCap,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  Bike,
  Dumbbell,
  Gamepad2,
  Music,
  Plane,
  Cpu,
  Palette,
  Lightbulb,
  Camera,
  Car,
  Film,
  Mountain,
  ShoppingBag,
  Tag,
  FileText,
} from "lucide-react";
import {
  SiInstagram,
  SiTiktok,
  SiX,
  SiYoutube,
  SiGithub,
  SiWhatsapp,
  SiTelegram,
  SiSnapchat,
  SiPinterest,
  SiReddit,
  SiTwitch,
  SiSpotify,
  SiThreads,
  SiSteam,
  SiVinted,
  SiOpenstreetmap,
  SiEbay,
} from "react-icons/si";

const NAV_LINKS = [
  { href: "#chi-sono", label: "Chi sono" },
  { href: "#competenze", label: "Competenze" },
  { href: "#curriculum", label: "Curriculum" },
  { href: "#progetti", label: "Progetti" },
  { href: "#hobby", label: "Hobby" },
  { href: "#passioni", label: "Passioni" },
  { href: "#contatti", label: "Contatti" },
];

// Contatti
const EMAIL = "pzkko@yahoo.com";
const PHONE_DISPLAY = "+39 331 407 4198";
const PHONE_HREF = "tel:+393314074198";
const WHATSAPP_HREF = "https://wa.me/447340995142";

// lucide-react non include un'icona brand di WhatsApp: la definiamo inline.
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.58-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

// Social del footer. href "#" = profilo da fornire (verranno rimossi quelli non usati).
const SOCIALS = [
  { name: "Instagram", Icon: SiInstagram, href: "https://www.instagram.com/albertoxpecchini" },
  { name: "TikTok", Icon: SiTiktok, href: "https://www.tiktok.com/@albertoxpecchini" },
  { name: "X (Twitter)", Icon: SiX, href: "https://x.com/ygpzk" },
  { name: "YouTube", Icon: SiYoutube, href: "https://www.youtube.com/@alberto-h7y3h" },
  { name: "GitHub", Icon: SiGithub, href: "https://github.com/albertoxpecchini" },
  { name: "WhatsApp", Icon: SiWhatsapp, href: WHATSAPP_HREF },
  { name: "Telegram", Icon: SiTelegram, href: "https://t.me/albertopecchini" },
  { name: "Snapchat", Icon: SiSnapchat, href: "https://www.snapchat.com/add/albertoxpecchini" },
  { name: "Pinterest", Icon: SiPinterest, href: "https://www.pinterest.com/albertoxpecchini" },
  { name: "Reddit", Icon: SiReddit, href: "https://www.reddit.com/user/yungpzkko" },
  { name: "Twitch", Icon: SiTwitch, href: "https://www.twitch.tv/pzkko" },
  { name: "Spotify", Icon: SiSpotify, href: "https://open.spotify.com/user/qeefs44bv4bpoa7dk8epagrxf" },
  { name: "Threads", Icon: SiThreads, href: "https://www.threads.net/@albertoxpecchini" },
  { name: "Steam", Icon: SiSteam, href: "https://steamcommunity.com/profiles/76561198971719489/" },
  { name: "Vinted", Icon: SiVinted, href: "https://www.vinted.it/member/237170304" },
  { name: "Subito.it", Icon: SiEbay, href: "https://www.subito.it/utente/127591135" },
  { name: "OpenStreetMap", Icon: SiOpenstreetmap, href: "https://www.openstreetmap.org/user/albertoxpecchini" },
];

const PROJECTS = [
  {
    category: "Sito web istituzionale",
    date: "27 apr 2026",
    title: "Rivalta sul Mincio",
    url: "https://rivaltasulmincio.it",
    desc: "Sito web responsive per la località turistica di Rivalta sul Mincio. Design minimalista con tipografia editoriale, palette calda monocromatica, griglie bento gapless, animazioni GSAP ScrollTrigger e composizione image-led.",
    tags: ["Next.js", "TypeScript", "GSAP", "Tailwind CSS", "Design minimalista"],
    githubRepo: "albertoxpecchini/rivaltasulmincio",
    screenshotUrl: "https://rivaltasulmincio.it",
  },
  {
    category: "Sito web aziendale",
    date: "20 apr 2026",
    title: "Cascina Fontana",
    url: "https://cascinafontana.xyz",
    desc: "Sito web per Cascina Fontana. Design curato e layout responsive ottimizzato per presentare l'attività e i servizi offerti.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Responsive Design"],
    screenshotUrl: "https://cascinafontana.xyz",
    previewImg: "/cascina-preview.png",
  },
];

const SKILLS = [
  { title: "Sviluppo front-end", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP"] },
  { title: "Design & UX", items: ["UI/UX Design", "Figma", "Design System", "Bootstrap Italia", "Responsive Design"] },
  { title: "AI & sviluppo assistito", items: ["Claude Code", "Codex", "GitHub Copilot", "Gemini", "DeepSeek", "Grok"] },
  { title: "Strumenti & Workflow", items: ["Git & GitHub", "Vite", "Vercel", "VS Code", "PowerShell", "LaTeX / Overleaf"] },
  { title: "Windows & IT Support", items: ["Troubleshooting PC", "Setup hardware & reti", "Ottimizzazione Windows", "File system 2.5 TB", "Malware removal", "Gestione periferiche"] },
  { title: "Multimedia & Content", items: ["Fotografia commerciale", "DaVinci Resolve", "Adobe Premiere Pro", "Canva", "iPhone 16 Pro"] },
  { title: "Area tecnica CAT", items: ["Disegno tecnico / CAD", "AutoCAD", "Topografia", "Progettazione edilizia", "Estimo", "Excel avanzato"] },
  { title: "Lingue", items: ["Italiano — madrelingua", "Inglese — C1 (IELTS)"] },
];

const CV = [
  {
    period: "12 set 2018 — 8 giu 2021",
    title: "Scuola secondaria di primo grado — Mantova",
    role: "Istituto Redentore · Fondazione «Casa dello studente Beato Contardo Ferrini»",
    desc: "Percorso triennale con solida base in italiano, matematica, storia, scienze e lingua inglese. Sviluppo del metodo di studio e delle competenze trasversali. Diploma conseguito con profitto.",
  },
  {
    period: "2021 — oggi",
    title: "Istituto Tecnico Tecnologico «Carlo d'Arco» — Mantova",
    role: "Diploma CAT · Costruzioni, Ambiente e Territorio (5º anno) · Classe 5T",
    desc: "Percorso quinquennale di indirizzo tecnico-tecnologico. Materie principali: progettazione architettonica e disegno tecnico (AutoCAD), topografia e rilievo strumentale, estimo e valutazione immobiliare, gestione del cantiere, fisica tecnica, matematica e inglese tecnico. Codice meccanografico MNTL009017.",
  },
  {
    period: "2019 — oggi",
    title: "Vendite online — Vinted & Subito",
    role: "E-commerce · Fotografia commerciale · Customer care",
    desc: "Gestione autonoma dell'intero ciclo di vendita su Vinted e Subito: valutazione del prodotto, definizione del prezzo di mercato, fotografia con Canon EOS 4000D e iPhone 16 Pro, pubblicazione degli annunci, comunicazione con i potenziali acquirenti, trattativa, spedizione e gestione dei feedback. Prima operazione nel dicembre 2019. Attività personale sistematica dall'autunno 2024. Categorie: abbigliamento, collezionabili cinematografici, dispositivi tech (Apple Watch, Nintendo Switch, Flipper Zero).",
  },
  {
    period: "continuativo",
    title: "Cascina di famiglia — Rivalta sul Mincio",
    role: "Collaboratore agricolo · Logistica · Coordinamento operativo",
    desc: "Collaborazione continuativa nell'attività agricola familiare. Attività svolte: cura e manutenzione delle piante (annaffiamento, potatura di diverse tipologie e dimensioni), trasporto di materiali e attrezzature su trattore con rimorchio, raccolta del fieno da prato stabile, coordinamento delle operazioni con il team durante le fasi di lavoro intensivo, supporto logistico e assistenza negli spostamenti. Gestione autonoma di attrezzature agricole e risoluzione di problemi operativi sul campo.",
  },
  {
    period: "19 dic 2023",
    title: "Corso Sicurezza Lavoratori — Rischio Basso",
    role: "Attestato di frequenza · LTO Mantova / FORMA · Regione Lombardia (ATS Val Padana) · 4 ore E-Learning",
    desc: "Corso conforme all'Accordo Stato Regioni 21 dicembre 2011 (D.Lgs. 81/08, Art. 37), destinato ai lavoratori che svolgono attività d'ufficio. Contenuti: rischio elettrico, cadute dall'alto, microclima e illuminazione, videoterminali, organizzazione del lavoro e stress lavoro correlato, procedure di primo soccorso, segnaletica e antincendio (procedure di esodo). Attestato rilasciato in qualità di studente dal Laboratorio Territoriale Occupabilità di Mantova.",
    pdf: "/attestato-sicurezza-lavoratori-rischio-basso.pdf",
    pdfLabel: "Apri attestato (PDF)",
  },
  {
    period: "11 — 25 ago 2024",
    title: "CES IELTS Test Centre — Dublino, Irlanda",
    role: "General English Intensive · 26 lezioni/settimana · Livello C1",
    desc: "Corso intensivo di inglese generale presso il centro CES di Dame Court, Dublino 2. Quattro settimane di full immersion con focus su speaking, writing, reading e comprensione orale a livello avanzato (C1). Superamento dell'esame IELTS al termine del corso. Esplorazione autonoma del territorio: Howth, Balbriggan, North Bull Island, Bray, Greystones, Glendalough, Powerscourt Estate e Galway.",
  },
  {
    period: "2024 — 2025",
    title: "Grest Parrocchiale · Parrocchia SS. Donato e Vigilio Martiri",
    role: "Animatore volontario · Rivalta sul Mincio · 6 settimane/anno · 2 edizioni",
    desc: "Servizio di animazione volontaria durante il Grest estivo parrocchiale — due edizioni consecutive (estate 2024 e 2025), per un totale di dodici settimane di attività. Responsabilità diretta su gruppi di bambini di diverse fasce d'età. Pianificazione e conduzione di giochi, laboratori e attività educative. Gestione delle dinamiche di gruppo, mediazione, comunicazione con i genitori. Referente: don Andrea Grandi.",
  },
  {
    period: "estate 2024",
    title: "CRED · Scuola Secondaria di Rodigo",
    role: "Supporto educativo volontario · Comune di Rodigo · 2 settimane",
    desc: "Supporto educativo e animazione durante il Centro Ricreativo Estivo Diurno del Comune di Rodigo. Affiancamento agli educatori nella conduzione delle attività, gestione dei gruppi, supporto individualizzato agli alunni e organizzazione di momenti di gioco strutturato e libero.",
  },
  {
    period: "23 lug — 1 ago 2025",
    title: "Parigi · Le Havre · Rouen · Étretat — Francia",
    role: "Viaggio culturale",
    desc: "Itinerario tra Normandia e Île-de-France: le scogliere di Étretat, la cattedrale gotica di Rouen, il porto storico di Le Havre e i principali musei e quartieri di Parigi.",
  },
  {
    period: "26 — 29 dic 2025",
    title: "Edimburgo — Scozia, Regno Unito",
    role: "Viaggio culturale",
    desc: "Visita della capitale scozzese durante le festività natalizie: Old Town, Edinburgh Castle, Royal Mile e l'atmosfera unica dei vicoli storici nel periodo natalizio.",
  },
  {
    period: "22 — 23 mar 2026",
    title: "Scrutatore — Sezione 5, Rivalta sul Mincio",
    role: "Operazioni elettorali · Comune di Rodigo · Referendum",
    desc: "Incarico ufficiale di scrutatore presso la sezione elettorale n. 5 di Rivalta sul Mincio (Comune di Rodigo) in occasione del Referendum del 22 e 23 marzo 2026. Attività: verifica dell'identità degli elettori, gestione delle operazioni di voto, scrutinio delle schede, redazione dei verbali e trasmissione dei risultati. Incarico retribuito con onorari di 119,60 €.",
  },
  {
    period: "20 apr 2026",
    title: "Cascina Fontana — Sito web",
    role: "Web design & sviluppo front-end",
    desc: "Progettazione e sviluppo del sito web ufficiale di Cascina Fontana. Analisi delle esigenze del cliente, definizione dell'architettura dell'informazione e realizzazione di un'interfaccia responsive, curata nel design e ottimizzata per la presentazione dei prodotti e servizi aziendali. Collaborazione diretta con il cliente per la definizione dei contenuti. Stack: React, TypeScript, Tailwind CSS.",
  },
  {
    period: "27 apr 2026",
    title: "Rivalta sul Mincio — Sito web",
    role: "Web design & sviluppo front-end",
    desc: "Progettazione e sviluppo del sito web istituzionale e turistico per la località di Rivalta sul Mincio. Design editoriale minimalista con tipografia curata, palette cromatica calda e animazioni avanzate tramite GSAP ScrollTrigger (pinning, stacking, scrubbing parallax). Griglie bento gapless e composizione image-led per una narrazione visiva immersiva. Stack: Next.js, TypeScript, GSAP, Tailwind CSS.",
  },
  // --- zona desideri ---
  {
    period: "✦ desidero",
    title: "Testata giornalistica — fondare la mia",
    role: "Giornalismo indipendente · Reportage · Editoria",
    desc: "Costruire un mezzo di informazione personale: andare sul campo, raccontare storie vere senza filtri, con la stessa aggressività e coraggio che ammiro in chi non si ferma davanti a nulla pur di portare la notizia.",
    wish: true,
  },
];

const HOBBY = [
  {
    Icon: Bike,
    label: "Moto",
    img: "/images/hobby-moto.jpg",
    desc: "Le due ruote rappresentano per me libertà allo stato puro. Mi affascina la tecnica di guida, la meccanica dei motori e il senso di controllo totale che si prova su una moto. Seguire il mondo delle moto — dalle naked alle supersportive — è una delle cose che mi appassiona di più.",
  },
  {
    Icon: Dumbbell,
    label: "Sport",
    img: "/images/hobby-sport.jpg",
    desc: "Mi alleno regolarmente in palestra: trovo che la disciplina sportiva migliori non solo il fisico ma anche la concentrazione e la costanza nel lavoro quotidiano. Mi interessano i workout di forza e mi documento continuamente su allenamento e nutrizione sportiva.",
  },
  {
    Icon: Gamepad2,
    label: "Videogiochi",
    img: "/images/hobby-videogiochi.jpg",
    desc: "I videogiochi mi hanno avvicinato al mondo del design e della tecnologia fin da giovane. Apprezzo i titoli con una forte identità visiva, una narrativa curata e un gameplay profondo — sia esperienze single player immersive che titoli competitivi.",
  },
  {
    Icon: Music,
    label: "Musica",
    img: "/images/hobby-musica.jpg",
    desc: "La musica è una presenza costante mentre lavoro e mi rilasso. Ascolto generi molto diversi: dalla musica elettronica all'hip-hop, passando per colonne sonore cinematografiche. Il ritmo e l'atmosfera di un brano influenzano molto il mio approccio creativo.",
  },
  {
    Icon: Plane,
    label: "Viaggi",
    img: "/images/hobby-viaggi.jpg",
    desc: "Viaggiare mi permette di osservare architetture, design urbano e culture diverse che poi rientrano inconsciamente nel mio lavoro creativo. Mi piace esplorare posti nuovi con curiosità, annotare dettagli visivi e portarli nei miei progetti.",
  },
  {
    Icon: Cpu,
    label: "Tecnologia",
    img: "/images/hobby-tecnologia.jpg",
    desc: "Sono attratto da tutto ciò che è nuovo nel mondo tech: hardware, software, intelligenza artificiale, smartphone. Seguire le novità tecnologiche non è solo un hobby ma un modo per restare aggiornato e trovare ispirazione per i miei progetti digitali.",
  },
];

const PASSIONI = [
  {
    Icon: Palette,
    label: "Web design",
    img: "/images/passione-webdesign.jpg",
    desc: "Il web design è la mia passione principale: creare interfacce belle e funzionali dove ogni dettaglio — dalla tipografia al ritmo degli spazi — contribuisce all'esperienza dell'utente. Studio continuamente trend di design e mi ispiro a designer internazionali per affinare il mio gusto visivo.",
  },
  {
    Icon: Lightbulb,
    label: "Innovazione digitale",
    img: "/images/passione-innovazione.jpg",
    desc: "Mi affascina il modo in cui la tecnologia trasforma prodotti, servizi e abitudini quotidiane. Seguo con interesse l'evoluzione dell'intelligenza artificiale, dei tool creativi generativi e delle nuove piattaforme digitali che ridefiniscono il modo di costruire e vivere il web.",
  },
  {
    Icon: Camera,
    label: "Fotografia",
    img: "/images/passione-fotografia.jpg",
    desc: "Attraverso la fotografia imparo a vedere il mondo con occhio compositivo: luce, prospettiva, equilibrio visivo. Questi concetti si trasferiscono direttamente nel mio approccio al design delle interfacce, dove la gerarchia visiva e il contrasto sono tutto.",
  },
  {
    Icon: Car,
    label: "Motori",
    img: "/images/passione-motori.jpg",
    desc: "La passione per i motori va oltre le moto: seguo l'automotive design, la Formula 1 e l'ingegneria meccanica applicata alle auto. L'estetica di un'auto ben disegnata o la perfezione tecnica di un motore mi affascinano tanto quanto un'interfaccia web riuscita.",
  },
  {
    Icon: Film,
    label: "Cinema",
    img: "/images/passione-cinema.jpg",
    desc: "Il cinema mi interessa per il suo linguaggio visivo: composizione dell'inquadratura, uso del colore, ritmo del montaggio. I registi che usano l'immagine come strumento narrativo primario sono una grande fonte di ispirazione per il mio lavoro di design.",
  },
  {
    Icon: Mountain,
    label: "Outdoor",
    img: "/images/passione-outdoor.jpg",
    desc: "Staccare dallo schermo e stare all'aria aperta mi aiuta a ricaricare la creatività. Che sia una gita in moto, una camminata tra la natura mantovana o semplicemente del tempo fuori, il contrasto con il lavoro digitale è fondamentale per tornare ai progetti con occhi freschi.",
  },
];

function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.dataset.scrollLockY = String(scrollY);
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflowY = "scroll";
}

function unlockBodyScroll() {
  const scrollY = parseInt(document.body.dataset.scrollLockY || "0", 10);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflowY = "";
  delete document.body.dataset.scrollLockY;
  window.scrollTo(0, scrollY);
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [docOpen, setDocOpen] = useState<{ url: string; title: string } | null>(null);

  const CV_PDF = "/cv-alberto-pecchini.pdf";

  useEffect(() => {
    activateLocalMode(() => {
      setLocalMode(true);
      console.info("Local mode attivo");
    });
  }, []);

  useEffect(() => {
    if (isIOS()) document.documentElement.classList.add("ios");
    return () => document.documentElement.classList.remove("ios");
  }, []);

  const now = new Date();
  const currentDate = now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const currentYear = now.getFullYear();

  // Età calcolata dalla data di nascita (28 giugno 2006).
  const birthDate = new Date(2006, 5, 28);
  let age = currentYear - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll while the mobile menu overlay is open.
  useEffect(() => {
    if (menuOpen) lockBodyScroll();
    else unlockBodyScroll();
    return () => unlockBodyScroll();
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const [selectedItem, setSelectedItem] = useState<{ Icon: any; label: string; desc: string; img?: string } | null>(null);
  const [modalImgStatus, setModalImgStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setModalImgStatus("loading");
  }, [selectedItem]);

  const [ghData, setGhData] = useState<Record<string, { pushedAt: string; version?: string }>>({});
  const [projectImages, setProjectImages] = useState<Record<string, string>>({});

  useEffect(() => {
    PROJECTS.forEach(async (p) => {
      const repo = p.githubRepo;
      if (!repo) return;
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${repo}`);
        if (!repoRes.ok) return;
        const repoJson = await repoRes.json();

        let version: string | undefined;
        const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (releaseRes.ok) {
          const rel = await releaseRes.json();
          version = rel.tag_name;
        } else {
          const tagsRes = await fetch(`https://api.github.com/repos/${repo}/tags`);
          if (tagsRes.ok) {
            const tags = await tagsRes.json();
            if (Array.isArray(tags) && tags.length > 0) version = tags[0].name;
          }
        }

        setGhData((prev) => ({ ...prev, [repo]: { pushedAt: repoJson.pushed_at, version } }));
      } catch {}
    });

    PROJECTS.forEach(async (p) => {
      if (!p.screenshotUrl) return;
      try {
        const dataUrl = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(p.screenshotUrl)}&screenshot=true&viewport.width=600&viewport.height=300`)
          .then(r => r.json())
          .then(d => d.data?.screenshot?.url || null);
        if (dataUrl) setProjectImages((prev) => ({ ...prev, [p.title]: dataUrl }));
      } catch {}
    });
  }, []);
  useEffect(() => {
    if (!selectedItem) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedItem(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [selectedItem]);

  // Visualizzatore documenti PDF: blocco scroll + chiusura con Esc.
  useEffect(() => {
    if (!docOpen) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDocOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [docOpen]);


  return (
    <div className="it-page-wrapper">
      {/* Skiplinks — requisito di accessibilità del Design System */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">
          Vai al contenuto principale
        </a>
        <a className="visually-hidden-focusable" href="#contatti">
          Vai ai contatti
        </a>
      </div>

      <header className="it-header-wrapper">
        {/* Header slim: ruolo + recapiti */}
        <div className="it-header-slim-wrapper theme-dark">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="it-header-slim-wrapper-content">
                  <span className="d-none d-lg-block navbar-brand">
                    Disponibile per web design, sviluppo front-end e branding
                  </span>
                  <div className="it-header-slim-right-zone">
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-white text-decoration-none d-flex align-items-center me-3"
                    >
                      <Mail size={16} className="me-1" aria-hidden="true" />
                      <span className="d-none d-md-inline">{EMAIL}</span>
                      <span className="d-md-none visually-hidden">Email</span>
                    </a>
                    <a
                      href={WHATSAPP_HREF}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-white text-decoration-none d-flex align-items-center me-3"
                    >
                      <WhatsAppIcon size={15} />
                      <span className="d-none d-md-inline ms-1">WhatsApp</span>
                      <span className="d-md-none visually-hidden">WhatsApp</span>
                    </a>
                    <a
                      href={PHONE_HREF}
                      className="text-white text-decoration-none d-flex align-items-center"
                    >
                      <Phone size={16} className="me-1" aria-hidden="true" />
                      <span className="d-none d-md-inline">{PHONE_DISPLAY}</span>
                      <span className="d-md-none visually-hidden">Telefono</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="it-nav-wrapper">
          {/* Header center: marchio */}
          <div className="it-header-center-wrapper theme-dark">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <div className="it-header-center-content-wrapper">
                    <div className="it-brand-wrapper">
                      <a href="#home" aria-label="Alberto Pecchini, torna alla home">
                        <span className="ap-brand-mark" aria-hidden="true">
                          <img src="/favicon.svg" alt="" width={48} height={48} />
                        </span>
                        <div className="it-brand-text">
                          <div className="it-brand-title">Alberto Pecchini</div>
                          <div className="it-brand-tagline d-none d-md-block">
                            Designer &amp; Front-end Developer
                          </div>
                          {localMode ? (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "0.25rem",
                                fontSize: "0.75rem",
                                color: "#ffffff",
                                backgroundColor: "#198754",
                                padding: "0.28rem 0.6rem",
                                borderRadius: "9999px",
                              }}
                            >
                              Local
                            </span>
                          ) : null}
                        </div>
                      </a>
                    </div>
                    <div className="it-right-zone">
                      <span className="d-none d-lg-flex align-items-center text-white">
                        <MapPin size={18} className="me-1" aria-hidden="true" /> Mantova · Italia
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navbar principale (sticky) */}
          <div
            className={`it-header-navbar-wrapper theme-dark theme-dark-mobile ap-navbar ${scrolled ? "ap-navbar--scrolled" : ""}`}
          >
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <nav className="navbar navbar-expand-lg" aria-label="Navigazione principale">
                    <button
                      className="custom-navbar-toggler"
                      type="button"
                      aria-controls="nav-main"
                      aria-expanded={menuOpen}
                      aria-label="Apri il menu di navigazione"
                      onClick={() => setMenuOpen(true)}
                    >
                      <Menu aria-hidden="true" />
                    </button>

                    {/* Mobile: logo + nome (nascosto su desktop) */}
                    <a
                      href="#home"
                      className="d-flex d-lg-none align-items-center text-white text-decoration-none ap-mobile-brand ms-2"
                      aria-label="Alberto Pecchini, torna alla home"
                    >
                      <img src="/favicon.svg" alt="" width={28} height={28} style={{ borderRadius: "6px" }} />
                      <span className="ms-2 fw-semibold">Alberto Pecchini</span>
                    </a>

                    <div className="d-lg-none flex-grow-1" />

                    {/* Mobile: bottoni contatto a destra (nascosti su desktop) */}
                    <div className="d-flex d-lg-none align-items-center gap-1 ap-mobile-contacts">
                      <a href={`mailto:${EMAIL}`} className="ap-mobile-contact-btn" aria-label="Email">
                        <Mail size={20} aria-hidden="true" />
                      </a>
                      <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener" className="ap-mobile-contact-btn" aria-label="WhatsApp">
                        <WhatsAppIcon size={18} />
                      </a>
                      <a href={PHONE_HREF} className="ap-mobile-contact-btn" aria-label="Telefono">
                        <Phone size={20} aria-hidden="true" />
                      </a>
                    </div>

                    <div className={`navbar-collapsable ${menuOpen ? "expanded" : ""}`} id="nav-main">
                      <div className="overlay" onClick={closeMenu} />
                      <div className="close-div">
                        <button
                          className="btn close-menu"
                          type="button"
                          aria-label="Chiudi il menu di navigazione"
                          onClick={closeMenu}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </div>
                      <div className="menu-wrapper">
                        <ul className="navbar-nav">
                          {NAV_LINKS.map((link) => (
                            <li className="nav-item" key={link.href}>
                              <a className="nav-link" href={link.href} onClick={closeMenu}>
                                <span>{link.label}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section
          id="home"
          className="ap-hero bg-primary text-white d-flex align-items-center"
        >
          <div className="container position-relative" style={{ zIndex: 1 }}>
            <div>
              <p className="ap-kicker text-uppercase fw-semibold mb-3">
                Studente CAT · Front-end Developer
              </p>
              <h1 className="display-1 fw-bold mb-4" style={{ maxWidth: "12ch" }}>
                Alberto Pecchini
              </h1>
              <p className="lead mb-4" style={{ maxWidth: "44rem" }}>
                Creo esperienze digitali eleganti con un approccio moderno e funzionale.
                Web design, sviluppo e animazioni curate per ogni schermo.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <a href="#progetti" className="btn btn-light btn-lg fw-semibold text-primary">
                  Vedi i progetti
                </a>
                <a href="#contatti" className="btn btn-outline-light btn-lg fw-semibold">
                  Contattami
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="chi-sono" className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="row align-items-center gy-5">
              <div className="col-lg-5">
                <img
                  src="/alberto-pecchini.jpg"
                  alt="Ritratto di Alberto Pecchini"
                  width={1050}
                  height={1400}
                  className="img-fluid rounded shadow"
                  loading="lazy"
                />
              </div>
              <div className="col-lg-7">
                <div>
                  <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                    01 — Chi sono
                  </p>
                  <h2 className="display-5 fw-bold mb-4">
                    Creo esperienze digitali pulite ed eleganti.
                  </h2>
                  <p className="fs-5 text-muted">
                    Mi chiamo Alberto Pecchini, ho {age} anni e frequento il quinto anno della
                    sezione CAT all'Istituto Tecnico Tecnologico <strong>«Carlo d'Arco»</strong> di
                    Mantova.
                  </p>
                  <p className="fs-5 text-muted">
                    Sono uno sviluppatore web e designer appassionato di user experience e design
                    minimalista. Utilizzo Next.js, TypeScript, GSAP e Tailwind CSS per creare siti
                    web responsivi, veloci e raffinati.
                  </p>
                  <p className="fs-5 text-muted mb-3">
                    La mia missione è trasformare le idee in{" "}
                    <strong>esperienze digitali memorabili</strong>, mantenendo un design pulito,
                    una tipografia curata e animazioni che valorizzano i contenuti.
                  </p>
                  <p className="fs-5 text-muted mb-0">
                    Fuori dallo schermo sono un <strong>tifoso del Sassuolo</strong>: il neroverde
                    è anche il filo conduttore cromatico di questo sito.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="competenze" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                02 — Competenze e conoscenze
              </p>
              <h2 className="display-5 fw-bold mb-0">Cosa so fare</h2>
            </div>
            <div className="row g-4">
              {SKILLS.map((group) => (
                <div className="col-md-6 col-lg-4" key={group.title}>
                  <div className="ap-skill-card h-100">
                    <h3 className="h5 fw-bold mb-3">{group.title}</h3>
                    <div className="d-flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span key={item} className="chip chip-simple chip-primary">
                          <span className="chip-label">{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="curriculum" className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                03 — Curriculum Vitae
              </p>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                <h2 className="display-5 fw-bold mb-0">Formazione &amp; esperienze</h2>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDocOpen({ url: CV_PDF, title: "Curriculum Vitae — Alberto Pecchini" })}
                    className="btn btn-primary fw-semibold d-inline-flex align-items-center"
                    aria-haspopup="dialog"
                  >
                    <Eye size={18} className="me-2" aria-hidden="true" /> Visualizza il CV
                  </button>
                  <div className="d-flex flex-column gap-1">
                    <a
                      href={CV_PDF}
                      className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center"
                      download
                    >
                      <Download size={18} className="me-2" aria-hidden="true" /> Scarica (PDF)
                    </a>
                    <span className="text-muted" style={{ fontSize: "0.8rem", lineHeight: 1 }}>3 pagine · 990 KB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-9">
                <div className="ap-timeline">
                  {CV.map((item) => (
                    <div
                      className={`ap-timeline-item${(item as any).wish ? " ap-timeline-item--wish" : ""}`}
                      key={item.title}
                    >
                      <span className={`ap-timeline-period${ (item as any).wish ? " ap-timeline-period--wish" : ""}`}>
                        {item.period}
                      </span>
                      <h3 className={`h5 mb-1${(item as any).wish ? " fst-italic fw-normal" : " fw-bold"}`}>
                        {item.title}
                      </h3>
                      <p className={`fw-semibold mb-2${(item as any).wish ? " ap-wish-role" : " text-primary"}`}>
                        {item.role}
                      </p>
                      <p className="text-muted mb-0">{item.desc}</p>
                      {(item as any).pdf && (
                        <button
                          type="button"
                          onClick={() => setDocOpen({ url: (item as any).pdf, title: item.title })}
                          className="ap-cv-doc mt-3"
                          aria-haspopup="dialog"
                        >
                          <FileText size={16} aria-hidden="true" />
                          <span>{(item as any).pdfLabel || "Apri documento (PDF)"}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="progetti" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                04 — Progetti Web
              </p>
              <h2 className="display-5 fw-bold mb-0">Il mio lavoro</h2>
            </div>

            <div className="row g-4">
              {PROJECTS.map((p) => (
                <div className="col-12 col-md-6" key={p.title}>
                  <div className="card-wrapper h-100">
                    <div className="it-card it-card-bg rounded shadow ap-project-card h-100 d-flex flex-column">
                      <div className="ap-project-preview">
                        {p.wip ? (
                          <div className="ap-project-preview--wip">
                            <div className="ap-project-cantiere">
                              <AlertTriangle size={48} />
                              <span>In fase di sviluppo...</span>
                            </div>
                          </div>
                        ) : (p as any).previewImg || projectImages[p.title] ? (
                          <img
                            src={(p as any).previewImg || projectImages[p.title]}
                            alt={`Anteprima ${p.title}`}
                            className="ap-project-screenshot"
                            loading="lazy"
                          />
                        ) : (
                          <div className="ap-project-placeholder">
                            <div className="ap-project-placeholder-text">{p.title}</div>
                          </div>
                        )}
                      </div>
                      <div className="it-card-body flex-grow-1">
                        <div className="category-top d-flex justify-content-between align-items-center">
                          <span className="category">{p.category}</span>
                          <span className="data">{p.date}</span>
                        </div>
                        <h3 className="it-card-title h2 fw-bold">
                          <a
                            className="text-decoration-none stretched-link"
                            href={p.url}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {p.title}
                            <ArrowUpRight size={22} className="ms-2" aria-hidden="true" />
                          </a>
                        </h3>
                        <p className="it-card-text fs-5">{p.desc}</p>
                        <div className="d-flex flex-wrap gap-2 mt-4">
                          {p.tags.map((tag) => (
                            <span key={tag} className="chip chip-simple chip-primary">
                              <span className="chip-label">{tag}</span>
                            </span>
                          ))}
                        </div>
                        {p.githubRepo && ghData[p.githubRepo] && (
                          <div className="d-flex align-items-center gap-2 mt-3">
                            {ghData[p.githubRepo].version && (
                              <span className="ap-project-version">
                                {ghData[p.githubRepo].version}
                              </span>
                            )}
                            <span className="ap-project-gh-date">
                              Aggiornato il{" "}
                              {new Date(ghData[p.githubRepo].pushedAt).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="hobby" className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                05 — Hobby
              </p>
              <h2 className="display-5 fw-bold mb-0">Nel tempo libero</h2>
            </div>
            <div className="row g-4">
              {HOBBY.map((item) => (
                <div className="col-6 col-md-4 col-lg-2" key={item.label}>
                  <button
                    type="button"
                    className="ap-interest-card h-100"
                    onClick={() => setSelectedItem(item)}
                    aria-label={`Scopri di più: ${item.label}`}
                  >
                    <span className="ap-interest-icon" aria-hidden="true">
                      <item.Icon size={26} />
                    </span>
                    <span className="ap-interest-label">{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="passioni" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                06 — Passioni
              </p>
              <h2 className="display-5 fw-bold mb-0">Cosa mi appassiona</h2>
            </div>
            <div className="row g-4">
              {PASSIONI.map((item) => (
                <div className="col-6 col-md-4 col-lg-2" key={item.label}>
                  <button
                    type="button"
                    className="ap-interest-card h-100"
                    onClick={() => setSelectedItem(item)}
                    aria-label={`Scopri di più: ${item.label}`}
                  >
                    <span className="ap-interest-icon" aria-hidden="true">
                      <item.Icon size={26} />
                    </span>
                    <span className="ap-interest-label">{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contatti" className="py-5 bg-primary text-white">
          <div className="container text-center">
            <div>
              <p className="ap-kicker text-uppercase fw-semibold mb-3" style={{ opacity: 0.85 }}>
                07 — Contatti
              </p>
              <h2 className="display-5 fw-bold mb-4">Parliamone.</h2>
              <p className="lead mb-4 mx-auto" style={{ maxWidth: "40rem" }}>
                Per collaborazioni, progetti web o semplicemente per uno scambio di idee — sono
                disponibile.
              </p>
              <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
                <a
                  href={`mailto:${EMAIL}`}
                  className="btn btn-light btn-lg fw-semibold text-primary d-inline-flex align-items-center"
                >
                  <Mail size={20} className="me-2" aria-hidden="true" /> Scrivimi
                </a>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-outline-light btn-lg fw-semibold d-inline-flex align-items-center"
                >
                  <WhatsAppIcon size={20} />
                  <span className="ms-2">WhatsApp</span>
                </a>
                <a
                  href={PHONE_HREF}
                  className="btn btn-outline-light btn-lg fw-semibold d-inline-flex align-items-center"
                >
                  <Phone size={20} className="me-2" aria-hidden="true" /> Chiamami
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="it-footer">
        <div className="it-footer-main">
          <div className="container">
            <div className="row py-4 gy-4">
              <div className="col-12 col-lg-4">
                <h2 className="h4 fw-bold mb-1">Alberto Pecchini</h2>
                <p className="mb-0" style={{ opacity: 0.8 }}>
                  Designer &amp; Developer · ITT «Carlo d'Arco» — Mantova
                </p>
              </div>
              <div className="col-12 col-lg-8">
                <p className="text-uppercase fw-semibold mb-3" style={{ letterSpacing: "0.12em", opacity: 0.85 }}>
                  Seguimi sui social
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {SOCIALS.map(({ name, Icon, href }) => (
                    <a
                      key={name}
                      href={href}
                      className="ap-social ap-social--sm"
                      aria-label={name}
                      title={name}
                      {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="row border-top pt-3 pb-4" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
              <div className="col-12 col-md-6 small" style={{ opacity: 0.7 }}>
                © {currentYear} Alberto Pecchini — Tutti i diritti riservati
              </div>
              <div className="col-12 col-md-6 text-md-end small" style={{ opacity: 0.7 }}>
                Aggiornato il {currentDate}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {selectedItem && (
        <>
          <div
            className="ap-modal-backdrop"
            onClick={() => setSelectedItem(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{ transform: "translate(-50%, -50%)" }}
            className="ap-modal"
          >
            <button
              type="button"
              className="ap-modal-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
            {selectedItem.img && modalImgStatus !== "error" && (
              <div className={`ap-modal-photo${modalImgStatus === "loaded" ? " ap-modal-photo--ready" : ""}`}>
                <img
                  src={selectedItem.img}
                  alt={selectedItem.label}
                  loading="lazy"
                  onLoad={() => setModalImgStatus("loaded")}
                  onError={() => setModalImgStatus("error")}
                />
              </div>
            )}
            <div className="ap-modal-inner">
              <div className="ap-modal-icon-wrap">
                <selectedItem.Icon size={32} />
              </div>
              <h2 id="modal-title" className="ap-modal-title">{selectedItem.label}</h2>
              <p className="ap-modal-body">{selectedItem.desc}</p>
            </div>
          </div>
        </>
      )}

      {/* Visualizzatore PDF generico: usato sia per il CV che per gli attestati */}
      {docOpen && (
        <div
          className="ap-cv-modal"
          role="dialog"
          aria-modal="true"
          aria-label={docOpen.title}
        >
          <div className="ap-cv-backdrop" onClick={() => setDocOpen(null)} aria-hidden="true" />
          <div className="ap-cv-dialog">
            <div className="ap-cv-bar">
              <span className="ap-cv-title">{docOpen.title}</span>
              <div className="d-flex align-items-center gap-2">
                <a
                  href={docOpen.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-sm btn-outline-light fw-semibold d-none d-sm-inline-flex align-items-center"
                >
                  <ExternalLink size={15} className="me-1" aria-hidden="true" /> Nuova scheda
                </a>
                <a
                  href={docOpen.url}
                  download
                  className="btn btn-sm btn-light fw-semibold text-primary d-inline-flex align-items-center"
                >
                  <Download size={15} className="me-1" aria-hidden="true" /> Scarica
                </a>
                <button
                  type="button"
                  className="ap-cv-close"
                  onClick={() => setDocOpen(null)}
                  aria-label="Chiudi l'anteprima del documento"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <a
              href={docOpen.url}
              target="_blank"
              rel="noreferrer noopener"
              className="ap-cv-fallback d-sm-none"
            >
              Su mobile l'anteprima PDF potrebbe non caricare — tocca qui per aprire il file →
            </a>
            <iframe
              className="ap-cv-frame"
              src={`${docOpen.url}#view=FitH&toolbar=1&navpanes=0`}
              title={`Anteprima: ${docOpen.title}`}
            />
          </div>
        </div>
      )}

      <style>{`
        /* Palette neroverde: override del primario di Bootstrap Italia
           (era blu #06c) per uniformare bg-primary, text-primary, btn-*-primary. */
        :root {
          --bs-primary: #2F7D4A;
          --bs-primary-rgb: 47, 125, 74;
          --bs-link-color: #1F6B3D;
          --bs-link-color-rgb: 31, 107, 61;
          --bs-link-hover-color: #155030;
          --bs-link-hover-color-rgb: 21, 80, 48;
        }
        .it-page-wrapper .bg-primary { background-color: #2F7D4A !important; }
        .it-page-wrapper .text-primary { color: #1F6B3D !important; }
        .it-page-wrapper .border-primary { border-color: #2F7D4A !important; }
        .it-page-wrapper .btn-primary {
          background-color: #2F7D4A;
          border-color: #2F7D4A;
        }
        .it-page-wrapper .btn-primary:hover,
        .it-page-wrapper .btn-primary:focus {
          background-color: #1F6B3D;
          border-color: #1F6B3D;
        }
        .it-page-wrapper .btn-outline-primary {
          color: #1F6B3D !important;
          border-color: #2F7D4A !important;
        }
        .it-page-wrapper .btn-outline-primary:hover,
        .it-page-wrapper .btn-outline-primary:focus {
          background-color: #2F7D4A !important;
          border-color: #2F7D4A !important;
          color: #ffffff !important;
        }
        .it-page-wrapper .chip-primary,
        .it-page-wrapper .chip.chip-primary,
        .it-page-wrapper .chip.chip-simple.chip-primary {
          background-color: rgba(47, 125, 74, 0.12) !important;
          color: #1F6B3D !important;
          border-color: rgba(47, 125, 74, 0.28) !important;
        }
        .it-page-wrapper .chip-primary .chip-label,
        .it-page-wrapper .chip.chip-primary .chip-label {
          color: #1F6B3D !important;
        }
        .it-page-wrapper .theme-dark {
          background-color: #103820 !important;
        }
        .it-page-wrapper .it-footer-main {
          background-color: #103820 !important;
        }
        .it-page-wrapper .it-footer-main .border-top {
          border-color: rgba(255, 255, 255, 0.18) !important;
        }

        .it-page-wrapper {
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background-color: #ffffff;
        }

        /* Marchio nel center header */
        .ap-brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          margin-right: 12px;
        }
        .ap-brand-mark img {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Navbar sticky */
        .ap-navbar {
          position: sticky;
          top: 0;
          z-index: 3;
        }
        .ap-navbar--scrolled {
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
        }

        /*
         * Menu mobile: nel Design System l'apertura del drawer è gestita dal JS
         * di Bootstrap Italia. Qui la navigazione è controllata da React, quindi
         * rendiamo lo stato .expanded autosufficiente in CSS (sotto i 992px).
         */
        @media (max-width: 991.98px) {
          .ap-navbar .navbar-collapsable.expanded {
            display: block;
          }
          .ap-navbar .navbar-collapsable .menu-wrapper {
            height: 100%;
            padding: 1.5rem;
            overflow-y: auto;
          }
          .ap-navbar .navbar-collapsable .overlay {
            display: none;
          }
          .ap-navbar .navbar-collapsable.expanded .overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
          }

          /* ── Mobile header: nascondi topbar e header centrale ── */
          .it-header-slim-wrapper,
          .it-header-center-wrapper {
            display: none !important;
          }

          /* ── Navbar mobile: sfondo verde scuro esplicito ── */
          .ap-navbar {
            background-color: #103820 !important;
          }

          /* ── Hamburger: tre linee bianche ── */
          .ap-navbar .custom-navbar-toggler {
            color: #ffffff !important;
            background: none;
            border: none;
            padding: 8px;
            line-height: 1;
          }
          .ap-navbar .custom-navbar-toggler svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }

          /* ── Menu drawer: sfondo verde scuro (Bootstrap Italia default = blu) ── */
          .ap-navbar .navbar-collapsable,
          .ap-navbar .navbar-collapsable .menu-wrapper,
          .ap-navbar .navbar-collapsable .close-div {
            background-color: #103820 !important;
          }
          .ap-navbar .navbar-collapsable .nav-link {
            color: #ffffff !important;
          }
          .ap-navbar .navbar-collapsable .nav-link:hover,
          .ap-navbar .navbar-collapsable .nav-link:focus {
            color: rgba(255, 255, 255, 0.72) !important;
          }
          .ap-navbar .close-menu {
            color: #ffffff !important;
          }
          .ap-navbar .close-menu svg {
            stroke: #ffffff !important;
          }

          /* ── Logo mobile ── */
          .ap-mobile-brand {
            font-size: 0.95rem;
            line-height: 1;
          }
          .ap-mobile-brand:hover {
            color: rgba(255, 255, 255, 0.85) !important;
          }

          /* ── Bottoni contatto mobile (44×44 px, tappabili) ── */
          .ap-mobile-contact-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.12);
            flex-shrink: 0;
          }
          .ap-mobile-contact-btn:hover,
          .ap-mobile-contact-btn:focus-visible {
            background: rgba(255, 255, 255, 0.22);
            color: #ffffff;
          }
        }

        /* Hero */
        .ap-hero {
          min-height: 100vh;
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          background-color: #1F6B3D;
          background-image: linear-gradient(135deg, #1F6B3D 0%, #2F7D4A 60%, #3F8F5A 100%);
        }
        .ap-hero h1 {
          overflow-wrap: anywhere;
        }
        .ap-hero .lead {
          color: rgba(255, 255, 255, 0.9);
        }
        .ap-kicker {
          letter-spacing: 0.18em;
          font-size: 0.875rem;
        }
        .ap-scroll-hint {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.85);
        }

        /* Card progetto */
        .ap-project-card {
          overflow: hidden;
        }
        .ap-project-wip {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.25rem;
          background: #fef9c3;
          color: #854d0e;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #fde047;
        }
        .ap-project-gh-date {
          font-size: 0.78rem;
          color: #888;
        }
        .ap-project-version {
          display: inline-block;
          padding: 0.18rem 0.55rem;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 0.03em;
        }
        /* Anteprima sito */
        .ap-project-preview {
          width: 100%;
          height: 220px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
          overflow: hidden;
        }
        .ap-project-preview--wip {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #fef9c3 0%,
            #fef3c7 50%,
            #fef9c3 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-project-cantiere {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #854d0e;
          text-align: center;
          opacity: 0.6;
        }
        .ap-project-cantiere span {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .ap-project-screenshot {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ap-project-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #DCEFE2 0%, #EAF6EE 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-project-placeholder-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1F6B3D;
          text-align: center;
          padding: 1rem;
        }
        .ap-project-card .it-card-title a {
          display: inline-flex;
          align-items: center;
          color: inherit;
        }

        /* Icone social nei contatti */
        .ap-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.45);
          color: #ffffff;
        }
        .ap-social:hover,
        .ap-social:focus-visible {
          background-color: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }
        .ap-social--sm {
          width: 40px;
          height: 40px;
        }

        /* Card competenze */
        .ap-skill-card {
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.14);
          border-radius: 8px;
          padding: 1.5rem;
        }

        /* Timeline curriculum */
        .ap-timeline {
          position: relative;
          padding-left: 2rem;
        }
        .ap-timeline::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 6px;
          bottom: 6px;
          width: 2px;
          background: rgba(47, 125, 74, 0.28);
        }
        .ap-timeline-item {
          position: relative;
          padding-bottom: 2rem;
        }
        .ap-timeline-item:last-child {
          padding-bottom: 0;
        }
        .ap-timeline-item::before {
          content: "";
          position: absolute;
          left: -2rem;
          top: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2F7D4A;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 2px rgba(47, 125, 74, 0.28);
        }
        .ap-timeline-period {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1F6B3D;
          margin-bottom: 0.25rem;
        }
        /* Variante "zona desideri" */
        .ap-timeline-item--wish::before {
          background: #f59e0b;
          border-color: #fef3c7;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
        }
        .ap-timeline-period--wish {
          color: #b45309;
        }
        .ap-wish-role {
          color: #92400e;
        }
        .ap-timeline-item--wish {
          opacity: 0.85;
        }

        /* Bottone documento allegato (apre il visore PDF) nella timeline CV */
        button.ap-cv-doc {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.9rem;
          background: rgba(47, 125, 74, 0.08);
          border: 1px solid rgba(47, 125, 74, 0.28);
          border-radius: 999px;
          color: #1F6B3D;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          appearance: none;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        button.ap-cv-doc:hover,
        button.ap-cv-doc:focus-visible {
          background: #2F7D4A;
          border-color: #2F7D4A;
          color: #ffffff;
          outline: none;
        }

        /* Card hobby / passioni */
        .ap-interest-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.75rem 1rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.14);
          border-radius: 8px;
          text-align: center;
        }
        .ap-interest-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
        }
        .ap-interest-label {
          font-weight: 600;
        }

        /* Modale hobby / passioni */
        .ap-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 1000;
          cursor: pointer;
        }
        .ap-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          z-index: 1001;
          background: #ffffff;
          border-radius: 14px;
          max-width: 480px;
          width: calc(100% - 2rem);
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
        }
        .ap-modal-photo {
          height: 0;
          overflow: hidden;
          flex-shrink: 0;
          visibility: hidden;
          transition: height 0.2s ease;
        }
        .ap-modal-photo--ready {
          height: 220px;
          visibility: visible;
        }
        .ap-modal-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ap-modal-inner {
          padding: 1.5rem 2.5rem 2.5rem;
        }
        .ap-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          cursor: pointer;
          color: #444;
          z-index: 1;
          padding: 0;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .ap-modal-close:hover,
        .ap-modal-close:focus-visible {
          background-color: rgba(255, 255, 255, 1);
          color: #111;
        }
        .ap-modal-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
          margin-bottom: 1.25rem;
        }
        .ap-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F6B3D;
          margin-bottom: 1rem;
        }
        .ap-modal-body {
          font-size: 1rem;
          line-height: 1.75;
          color: #444;
          margin: 0;
          padding: 0;
        }
        /* Reset pulsante per le card interesse */
        button.ap-interest-card {
          cursor: pointer;
          appearance: none;
          font-family: inherit;
          font-size: inherit;
          width: 100%;
        }

        /* Visualizzatore CV (modale con anteprima PDF) */
        .ap-cv-modal {
          position: fixed;
          inset: 0;
          z-index: 1080;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(0.5rem, 2vw, 2rem);
        }
        .ap-cv-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(2px);
        }
        .ap-cv-dialog {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          width: min(940px, 100%);
          height: min(92vh, 100%);
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.4);
        }
        .ap-cv-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 0.6rem 0.85rem;
          background: #2F7D4A;
          color: #ffffff;
        }
        .ap-cv-title {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .ap-cv-frame {
          flex: 1 1 auto;
          width: 100%;
          min-height: 0;
          border: 0;
          background: #525659;
        }
        .ap-cv-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          background: transparent;
          color: #ffffff;
          transition: background-color 0.2s ease;
        }
        .ap-cv-close:hover,
        .ap-cv-close:focus-visible {
          background: rgba(255, 255, 255, 0.18);
        }
        .ap-cv-fallback {
          display: block;
          padding: 0.75rem 0.85rem;
          background: #FFF7CC;
          color: #1F6B3D;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          border-bottom: 1px solid #FDE68A;
        }
        .ap-cv-fallback:hover,
        .ap-cv-fallback:focus-visible {
          background: #FEF3A6;
          color: #155030;
        }

        /* ===== Ottimizzazioni mobile ===== */
        @media (max-width: 575.98px) {
          .ap-hero {
            min-height: 100vh;
            min-height: min(85svh, 640px);
          }
          .ap-hero h1.display-1 {
            font-size: clamp(2.25rem, 11vw, 3.25rem);
            max-width: 100% !important;
            line-height: 1.1;
          }
          .ap-hero .lead {
            font-size: 1rem;
          }
          .ap-hero .ap-kicker {
            font-size: 0.75rem;
          }

          /* Modali hobby/passioni */
          .ap-modal {
            border-radius: 12px;
          }
          .ap-modal-inner {
            padding: 1.25rem 1.25rem 1.75rem;
          }
          .ap-modal-title {
            font-size: 1.25rem;
          }
          .ap-modal-body {
            font-size: 0.95rem;
            line-height: 1.65;
          }
          .ap-modal-photo--ready {
            height: 180px;
          }
          .ap-modal-icon-wrap {
            width: 56px;
            height: 56px;
            margin-bottom: 1rem;
          }

          /* Touch target ≥ 44px */
          .ap-modal-close,
          .ap-cv-close {
            width: 44px;
            height: 44px;
          }

          /* CV modal: più spazio in basso per safe-area iOS */
          .ap-cv-dialog {
            height: min(94svh, 100%);
          }

          /* Header slim: più respiro tra le icone, niente strizzature */
          .it-header-slim-right-zone {
            gap: 0.5rem;
          }
          .it-header-slim-right-zone .me-3 {
            margin-right: 0 !important;
          }

          /* Titoli sezione: scala il display-5 per evitare strizzature */
          section h2.display-5 {
            font-size: clamp(1.75rem, 7vw, 2.5rem);
          }

          /* Card progetto: preview più compatta su mobile */
          .ap-project-preview {
            height: 180px;
          }
        }

      `}</style>
    </div>
  );
}
