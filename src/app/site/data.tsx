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

// Social del footer.
export const SOCIALS: { name: string; Icon: ComponentType<{ size?: number }>; href: string }[] = [
  { name: "Instagram", Icon: SiInstagram, href: "https://www.instagram.com/albertoxpecchini" },
  { name: "TikTok", Icon: SiTiktok, href: "https://www.tiktok.com/@albertoxpecchini" },
  { name: "X (Twitter)", Icon: SiX, href: "https://x.com/ygpzk" },
  { name: "YouTube", Icon: SiYoutube, href: "https://www.youtube.com/@alberto-h7y3h" },
  { name: "GitHub", Icon: SiGithub, href: "https://github.com/albertoxpecchini" },
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
    label: "Motorbikes",
    img: "/images/hobby-moto.jpg",
    desc: "Two wheels mean pure freedom to me. I'm fascinated by riding technique, engine mechanics and the sense of total control you feel on a bike. Following the world of motorbikes — from nakeds to supersports — is one of the things I'm most passionate about.",
  },
  {
    Icon: Dumbbell,
    emoji: "🏋️",
    label: "Sport",
    img: "/images/hobby-sport.jpg",
    desc: "I train regularly at the gym: I find that sporting discipline improves not only the body but also focus and consistency in everyday work. I'm into strength workouts and keep reading up on training and sports nutrition.",
  },
  {
    Icon: Gamepad2,
    emoji: "🎮",
    label: "Video games",
    img: "/images/hobby-videogiochi.jpg",
    desc: "Video games drew me into the world of design and technology from a young age. I love titles with a strong visual identity, careful storytelling and deep gameplay — both immersive single-player experiences and competitive titles. I've even built one: Trivia, a quiz game on the history of architecture.",
    link: "/trivia",
    linkLabel: "Play Trivia",
  },
  {
    Icon: Music,
    emoji: "🎧",
    label: "Music",
    img: "/images/hobby-musica.jpg",
    desc: "Music is a constant presence while I work and unwind. I listen to very different genres: from electronic to hip-hop, by way of film scores. The rhythm and mood of a track strongly shape my creative approach.",
  },
  {
    Icon: Plane,
    emoji: "✈️",
    label: "Travel",
    img: "/images/hobby-viaggi.jpg",
    desc: "Travelling lets me observe architecture, urban design and different cultures that then unconsciously feed back into my creative work. I like exploring new places with curiosity, noting visual details and carrying them into my projects.",
  },
  {
    Icon: Cpu,
    emoji: "💻",
    label: "Technology",
    img: "/images/hobby-tecnologia.jpg",
    desc: "I'm drawn to everything new in tech: hardware, software, artificial intelligence, smartphones. Following tech news isn't just a hobby but a way to stay up to date and find inspiration for my digital projects.",
  },
];

export const PASSIONI: Interest[] = [
  {
    Icon: Palette,
    emoji: "🎨",
    label: "Web design",
    img: "/images/passione-webdesign.jpg",
    desc: "Web design is my main passion: creating beautiful, functional interfaces where every detail — from typography to the rhythm of spacing — contributes to the user experience. I constantly study design trends and take inspiration from international designers to refine my visual taste.",
  },
  {
    Icon: Lightbulb,
    emoji: "💡",
    label: "Digital innovation",
    img: "/images/passione-innovazione.jpg",
    desc: "I'm fascinated by the way technology transforms products, services and everyday habits. I follow with interest the evolution of artificial intelligence, generative creative tools and the new digital platforms redefining how we build and experience the web.",
  },
  {
    Icon: Camera,
    emoji: "📷",
    label: "Photography",
    img: "/images/passione-fotografia.jpg",
    desc: "Through photography I learn to see the world with a compositional eye: light, perspective, visual balance. These concepts transfer directly into my approach to interface design, where visual hierarchy and contrast are everything.",
  },
  {
    Icon: Car,
    emoji: "🏎️",
    label: "Motors",
    img: "/images/passione-motori.jpg",
    desc: "My passion for engines goes beyond motorbikes: I follow automotive design, Formula 1 and the mechanical engineering behind cars. The aesthetics of a well-designed car or the technical perfection of an engine fascinate me as much as a great web interface.",
  },
  {
    Icon: Film,
    emoji: "🎬",
    label: "Cinema",
    img: "/images/passione-cinema.jpg",
    desc: "Cinema interests me for its visual language: framing, use of colour, editing rhythm. Directors who use the image as their primary narrative tool are a great source of inspiration for my design work.",
  },
  {
    Icon: Mountain,
    emoji: "🏔️",
    label: "Outdoors",
    img: "/images/passione-outdoor.jpg",
    desc: "Stepping away from the screen and being outdoors helps me recharge my creativity. Whether it's a ride on the bike, a walk through the Mantua countryside or simply time outside, the contrast with digital work is essential to come back to projects with fresh eyes.",
  },
];

export const SKILLS: { emoji: string; title: string; items: string[] }[] = [
  { emoji: "🖥️", title: "Front-end development", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP"] },
  { emoji: "🎨", title: "Design & UX", items: ["UI/UX Design", "Figma", "Design System", "Bootstrap Italia", "Responsive Design"] },
  { emoji: "🤖", title: "AI-assisted development", items: ["Claude Code", "Codex", "GitHub Copilot", "Gemini", "DeepSeek", "Grok"] },
  { emoji: "🛠️", title: "Tools & Workflow", items: ["Git & GitHub", "Vite", "Vercel", "VS Code", "PowerShell", "LaTeX / Overleaf"] },
  { emoji: "🪟", title: "Windows & IT Support", items: ["PC troubleshooting", "Hardware & network setup", "Windows optimisation", "2.5 TB file system", "Malware removal", "Peripheral management"] },
  { emoji: "🎥", title: "Multimedia & Content", items: ["Commercial photography", "DaVinci Resolve", "Adobe Premiere Pro", "Canva", "iPhone 16 Pro"] },
  { emoji: "📐", title: "CAT technical area", items: ["Technical drawing / CAD", "AutoCAD", "Topography", "Building design", "Valuation", "Advanced Excel"] },
  { emoji: "🌍", title: "Languages", items: ["Italian — native", "English — C1 (IELTS)"] },
];
