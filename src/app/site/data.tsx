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
// anche dalla pagina Bio; "About" è una rotta a sé (route: true).
export const NAV_LINKS: { href: string; label: string; route?: boolean }[] = [
  { href: "/#progetti", label: "Work" },
  { href: "/bio", label: "About", route: true },
  { href: "/#curriculum", label: "Résumé" },
  { href: "/#contatti", label: "Contact" },
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
    desc: "Video games drew me into the world of design and technology from a young age. I love titles with a strong visual identity, careful storytelling and deep gameplay — both immersive single-player experiences and competitive titles. I've even built one: Parole, an Italian Wordle.",
    link: "/parole",
    linkLabel: "Play Parole",
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
