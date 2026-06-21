// Dati e costanti condivisi tra la home e la pagina Bio.
import type { ComponentType } from "react";
import {
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

// Contatti
export const EMAIL = "pzkko@yahoo.com";
export const PHONE_DISPLAY = "+39 331 407 4198";
export const PHONE_HREF = "tel:+393314074198";
export const WHATSAPP_HREF = "https://wa.me/447340995142";

// Voci di navigazione. Gli href sono assoluti (con /#ancora) così funzionano
// anche dalla pagina Bio; "Chi sono" è una rotta a sé (route: true).
export const NAV_LINKS: { href: string; label: string; route?: boolean }[] = [
  { href: "/#progetti", label: "Progetti" },
  { href: "/bio", label: "Chi sono", route: true },
  { href: "/#curriculum", label: "Curriculum" },
  { href: "/#contatti", label: "Contatti" },
];

// lucide-react non include un'icona brand di WhatsApp: la definiamo inline.
export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.58-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

// Social del footer.
export const SOCIALS: { name: string; Icon: ComponentType<{ size?: number }>; href: string }[] = [
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

export type Interest = {
  Icon: ComponentType<{ size?: number }>;
  emoji: string;
  label: string;
  img?: string;
  desc: string;
  link?: string;
  linkLabel?: string;
};

export const HOBBY: Interest[] = [
  {
    Icon: Bike,
    emoji: "🏍️",
    label: "Moto",
    img: "/images/hobby-moto.jpg",
    desc: "Le due ruote rappresentano per me libertà allo stato puro. Mi affascina la tecnica di guida, la meccanica dei motori e il senso di controllo totale che si prova su una moto. Seguire il mondo delle moto — dalle naked alle supersportive — è una delle cose che mi appassiona di più.",
  },
  {
    Icon: Dumbbell,
    emoji: "🏋️",
    label: "Sport",
    img: "/images/hobby-sport.jpg",
    desc: "Mi alleno regolarmente in palestra: trovo che la disciplina sportiva migliori non solo il fisico ma anche la concentrazione e la costanza nel lavoro quotidiano. Mi interessano i workout di forza e mi documento continuamente su allenamento e nutrizione sportiva.",
  },
  {
    Icon: Gamepad2,
    emoji: "🎮",
    label: "Videogiochi",
    img: "/images/hobby-videogiochi.jpg",
    desc: "I videogiochi mi hanno avvicinato al mondo del design e della tecnologia fin da giovane. Apprezzo i titoli con una forte identità visiva, una narrativa curata e un gameplay profondo — sia esperienze single player immersive che titoli competitivi. Ne ho anche realizzato uno: Parole, un Wordle in italiano.",
    link: "/parole",
    linkLabel: "Gioca a Parole",
  },
  {
    Icon: Music,
    emoji: "🎧",
    label: "Musica",
    img: "/images/hobby-musica.jpg",
    desc: "La musica è una presenza costante mentre lavoro e mi rilasso. Ascolto generi molto diversi: dalla musica elettronica all'hip-hop, passando per colonne sonore cinematografiche. Il ritmo e l'atmosfera di un brano influenzano molto il mio approccio creativo.",
  },
  {
    Icon: Plane,
    emoji: "✈️",
    label: "Viaggi",
    img: "/images/hobby-viaggi.jpg",
    desc: "Viaggiare mi permette di osservare architetture, design urbano e culture diverse che poi rientrano inconsciamente nel mio lavoro creativo. Mi piace esplorare posti nuovi con curiosità, annotare dettagli visivi e portarli nei miei progetti.",
  },
  {
    Icon: Cpu,
    emoji: "💻",
    label: "Tecnologia",
    img: "/images/hobby-tecnologia.jpg",
    desc: "Sono attratto da tutto ciò che è nuovo nel mondo tech: hardware, software, intelligenza artificiale, smartphone. Seguire le novità tecnologiche non è solo un hobby ma un modo per restare aggiornato e trovare ispirazione per i miei progetti digitali.",
  },
];

export const PASSIONI: Interest[] = [
  {
    Icon: Palette,
    emoji: "🎨",
    label: "Web design",
    img: "/images/passione-webdesign.jpg",
    desc: "Il web design è la mia passione principale: creare interfacce belle e funzionali dove ogni dettaglio — dalla tipografia al ritmo degli spazi — contribuisce all'esperienza dell'utente. Studio continuamente trend di design e mi ispiro a designer internazionali per affinare il mio gusto visivo.",
  },
  {
    Icon: Lightbulb,
    emoji: "💡",
    label: "Innovazione digitale",
    img: "/images/passione-innovazione.jpg",
    desc: "Mi affascina il modo in cui la tecnologia trasforma prodotti, servizi e abitudini quotidiane. Seguo con interesse l'evoluzione dell'intelligenza artificiale, dei tool creativi generativi e delle nuove piattaforme digitali che ridefiniscono il modo di costruire e vivere il web.",
  },
  {
    Icon: Camera,
    emoji: "📷",
    label: "Fotografia",
    img: "/images/passione-fotografia.jpg",
    desc: "Attraverso la fotografia imparo a vedere il mondo con occhio compositivo: luce, prospettiva, equilibrio visivo. Questi concetti si trasferiscono direttamente nel mio approccio al design delle interfacce, dove la gerarchia visiva e il contrasto sono tutto.",
  },
  {
    Icon: Car,
    emoji: "🏎️",
    label: "Motori",
    img: "/images/passione-motori.jpg",
    desc: "La passione per i motori va oltre le moto: seguo l'automotive design, la Formula 1 e l'ingegneria meccanica applicata alle auto. L'estetica di un'auto ben disegnata o la perfezione tecnica di un motore mi affascinano tanto quanto un'interfaccia web riuscita.",
  },
  {
    Icon: Film,
    emoji: "🎬",
    label: "Cinema",
    img: "/images/passione-cinema.jpg",
    desc: "Il cinema mi interessa per il suo linguaggio visivo: composizione dell'inquadratura, uso del colore, ritmo del montaggio. I registi che usano l'immagine come strumento narrativo primario sono una grande fonte di ispirazione per il mio lavoro di design.",
  },
  {
    Icon: Mountain,
    emoji: "🏔️",
    label: "Outdoor",
    img: "/images/passione-outdoor.jpg",
    desc: "Staccare dallo schermo e stare all'aria aperta mi aiuta a ricaricare la creatività. Che sia una gita in moto, una camminata tra la natura mantovana o semplicemente del tempo fuori, il contrasto con il lavoro digitale è fondamentale per tornare ai progetti con occhi freschi.",
  },
];

export const SKILLS: { emoji: string; title: string; items: string[] }[] = [
  { emoji: "🖥️", title: "Sviluppo front-end", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP"] },
  { emoji: "🎨", title: "Design & UX", items: ["UI/UX Design", "Figma", "Design System", "Bootstrap Italia", "Responsive Design"] },
  { emoji: "🤖", title: "AI & sviluppo assistito", items: ["Claude Code", "Codex", "GitHub Copilot", "Gemini", "DeepSeek", "Grok"] },
  { emoji: "🛠️", title: "Strumenti & Workflow", items: ["Git & GitHub", "Vite", "Vercel", "VS Code", "PowerShell", "LaTeX / Overleaf"] },
  { emoji: "🪟", title: "Windows & IT Support", items: ["Troubleshooting PC", "Setup hardware & reti", "Ottimizzazione Windows", "File system 2.5 TB", "Malware removal", "Gestione periferiche"] },
  { emoji: "🎥", title: "Multimedia & Content", items: ["Fotografia commerciale", "DaVinci Resolve", "Adobe Premiere Pro", "Canva", "iPhone 16 Pro"] },
  { emoji: "📐", title: "Area tecnica CAT", items: ["Disegno tecnico / CAD", "AutoCAD", "Topografia", "Progettazione edilizia", "Estimo", "Excel avanzato"] },
  { emoji: "🌍", title: "Lingue", items: ["Italiano — madrelingua", "Inglese — C1 (IELTS)"] },
];
