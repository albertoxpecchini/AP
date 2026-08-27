// Dati e costanti condivisi tra la home e la pagina Bio.
import type { ComponentType } from "react";
import {
  Bike,
  Crosshair,
  Gamepad2,
  UtensilsCrossed,
  Plane,
  Users,
  Palette,
  BrickWall,
  Tractor,
  MonitorSmartphone,
  HeartHandshake,
  Store,
} from "lucide-react";
import {
  SiInstagram,
  SiGithub,
  SiVinted,
  SiOpenstreetmap,
  SiEbay,
} from "react-icons/si";

// Contatti
// Solo l'email è pubblica: telefono e WhatsApp non compaiono più sul sito né nel
// CV, per non esporre recapiti personali diretti a chiunque. Chi ha bisogno di un
// contatto diretto lo chiede via email.
export const EMAIL = "pzkko@yahoo.com";

// Voci di navigazione. Gli href sono assoluti (con /#ancora) così funzionano
// anche dalla pagina Bio; "About" è una rotta a sé (route: true).
export const NAV_LINKS: { href: string; label: string; route?: boolean }[] = [
  { href: "/#progetti", label: "Work" },
  { href: "/bio", label: "About", route: true },
  { href: "/#curriculum", label: "Résumé" },
  { href: "/#contatti", label: "Contact" },
];

// Social del footer. Erano diciassette — Snapchat, Kick, Steam, Spotify,
// Twitch, Pinterest, Reddit, Threads, TikTok, X, YouTube, Telegram — cioè un
// muro di presenze personali su una pagina che vende servizi, e un cliente che
// finisce sul profilo Twitch è un piccolo danno. Restano le cinque che
// c'entrano con il lavoro: GitHub (il portfolio vero), Instagram (il recapito
// del README), OpenStreetMap (i dati del sito di Rivalta vengono di lì), e
// Vinted + Subito, che il CV cita come esperienza vera di vendita e foto.
// Manca LinkedIn: appena c'è l'indirizzo, va in cima a questa lista.
export const SOCIALS: { name: string; Icon: ComponentType<{ size?: number }>; href: string }[] = [
  { name: "GitHub", Icon: SiGithub, href: "https://github.com/albertoxpecchini" },
  { name: "Instagram", Icon: SiInstagram, href: "https://www.instagram.com/albertoxpecchini" },
  { name: "OpenStreetMap", Icon: SiOpenstreetmap, href: "https://www.openstreetmap.org/user/albertoxpecchini" },
  { name: "Vinted", Icon: SiVinted, href: "https://www.vinted.it/member/237170304" },
  { name: "Subito.it", Icon: SiEbay, href: "https://www.subito.it/utente/127591135" },
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
    label: "Motorbikes",
    img: "/images/me-stesso/moto.jpg",
    desc: "Since 2023 I've owned a Ducati Scrambler 125, and I ride it whenever the days start feeling monotonous: it's how I clear my head. I'm still a beginner on two wheels, but the sense of freedom is worth every kilometre. I've had my car licence for a year too, and I haven't passed up a few road trips — Milan, Brescia, Verona, Bologna, Piacenza.",
  },
  {
    Icon: Crosshair,
    emoji: "🎯",
    label: "Clay shooting",
    img: "/images/me-stesso/tiro.jpg",
    desc: "Aim, breathe, focus: shooting is my sport. My father got me into it, and today I practise clay shooting at the «Al Perrosso» range in Castel Goffredo under coach Fausto Chitò. I take it slowly, but it's the discipline I recognise myself in the most: silence, precision and steady nerves. Before landing here I tried a bit of everything — swimming, volleyball, basketball.",
  },
  {
    Icon: Plane,
    emoji: "✈️",
    label: "Travel",
    img: "/images/me-stesso/parigi.jpg",
    desc: "I love discovering new places — and I love it when everything runs smoothly. When we travel as a group, even just with friends, I'm the one handling tickets, bookings and itineraries: on the road I'm the brain of the operation. So far: Italy, San Marino, Switzerland, Austria, France, Ireland and Scotland.",
  },
  {
    Icon: Gamepad2,
    emoji: "🎮",
    label: "Video games",
    img: "/trivia-libro.jpg",
    desc: "Video games pulled me into design and technology from a young age. I love titles with a strong visual identity, careful storytelling and deep gameplay. I've even built one: Trivia, a quiz game on the history of architecture, with its own design system and animations.",
    link: "/trivia",
    linkLabel: "Play Trivia",
  },
  {
    Icon: UtensilsCrossed,
    emoji: "🍝",
    label: "Good food",
    img: "/images/me-stesso/cucina.jpg",
    desc: "I'm the kind of person who likes eating well, and a good sandwich made with real ingredients is worth as much to me as a plated dish. Aged Sardinian pecorino, gorgonzola and Grana Padano DOP are the cheeses I always come back to; cacio e pepe, spaghetti alle vongole and a proper fillet of beef are the dishes I never turn down.",
  },
  {
    Icon: Users,
    emoji: "🎉",
    label: "Time with friends",
    img: "/images/me-stesso/festa-cascina.jpg",
    desc: "Clubs aren't my thing: I'd rather organise small parties at the farm, where it's quieter and you actually get to enjoy the people around you. Real company over crowded places, every time.",
  },
];

export const PASSIONI: Interest[] = [
  {
    Icon: Palette,
    emoji: "🎨",
    label: "Web design",
    img: "/images/me-stesso/web.jpg",
    desc: "Designing and building websites and web games is what defines me. I handle everything from the idea to the code: I've delivered real sites — Cascina Fontana and Rivalta sul Mincio — and Trivia, a web game with careful design and animation. What I love is turning an idea into something you can touch on screen, then iterating and refining it down to the last detail.",
  },
  {
    Icon: BrickWall,
    emoji: "🧱",
    label: "Restoration",
    img: "/images/me-stesso/restauro-1.jpg",
    desc: "Everything really started here. In 2018, aged twelve, I took a restoration course at the Mantua Seminary — today Unicollege Mantova — one of the youth projects run by Santagnese10 Officina Creativa. With work gloves on I cleaned up and repaired old brick and cobblestone walls: the first time I put my hands on a historic building, and it stayed with me. Not long after, I chose the CAT programme.",
  },
  {
    Icon: Tractor,
    emoji: "🚜",
    label: "Working the land",
    img: "/images/me-stesso/trattore.jpg",
    desc: "I grew up lending a hand in the family business — not as a pastime, but as the way I learned what real work means. I drive the farm machinery, including the Landini L25 Testacalda from 1957, and with my father I look after parks, pools and outdoor spaces. Concrete work, made of hands, seasons and attention to detail.",
  },
  {
    Icon: MonitorSmartphone,
    emoji: "💻",
    label: "Digitising the business",
    img: "/images/me-stesso/azienda-digitale.jpg",
    desc: "In the family business I've taken over everything digital: online orders, the satellite imagery we use to prepare quotes, and the listings for second-hand sales. It's where my two sides — the hands-on one and the digital one — meet, and where I first saw that software can make real work lighter.",
  },
  {
    Icon: HeartHandshake,
    emoji: "🤝",
    label: "Volunteering",
    img: "/images/me-stesso/grest.jpg",
    desc: "For two summers I was a group leader at the Grest in Rivalta sul Mincio, and I gave a hand at the CRED summer school in Rodigo, working with children. Being among people, leading a group, inventing activities: it gives me energy — and it taught me to keep calm when a plan falls apart.",
  },
  {
    Icon: Store,
    emoji: "🛒",
    label: "Building a business",
    img: "/images/me-stesso/futuro.jpg",
    desc: "My goal is to take over Punto Energy Service, the «Home Engineer» store in Medole — batteries, chargers, lubricants and spare parts for cars and vehicles — and grow it by building it an e-commerce of my own, to sell online and reach far more customers. It's where the skills I already use every day become a life project.",
  },
];

export const SKILLS: { emoji: string; title: string; items: string[] }[] = [
  { emoji: "🖥️", title: "Website development", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP"] },
  { emoji: "🎨", title: "Design & UX", items: ["UI/UX Design", "Figma", "Design System", "Responsive Design", "Motion"] },
  { emoji: "🤖", title: "AI-assisted development", items: ["Claude Code", "Codex", "GitHub Copilot", "Gemini"] },
  { emoji: "🛠️", title: "Tools & Workflow", items: ["Git & GitHub", "Vite", "Vercel", "VS Code", "PowerShell", "Supabase"] },
  { emoji: "📐", title: "CAT technical area", items: ["AutoCAD", "cadwork", "Topography", "Valuation", "Technical drawing / CAD", "Advanced Excel"] },
  { emoji: "🪟", title: "IT & multimedia", items: ["PC troubleshooting", "Windows", "Linux Ubuntu", "Commercial photography", "DaVinci Resolve", "Canva"] },
  { emoji: "🚜", title: "On the ground", items: ["Tractors & forklifts", "Grounds & pool upkeep", "Site logistics", "Team coordination"] },
  { emoji: "🌍", title: "Languages", items: ["Italian — native", "English — C1 (IELTS)"] },
];
