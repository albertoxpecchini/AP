import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "motion/react";
import { Github, Linkedin, Mail, ExternalLink, ChevronDown } from "lucide-react";

const PRIMARY = "#5B6FA8";
const ACCENT = "#8FA7C8";
const SOFT = "#A8B8C8";

const skills = [
  {
    category: "Disegno Tecnico & CAD",
    items: [
      { name: "AutoCAD", level: 88 },
      { name: "Revit BIM", level: 80 },
      { name: "SketchUp", level: 76 },
      { name: "Disegno a mano libera", level: 84 },
    ],
  },
  {
    category: "Materie Tecniche",
    items: [
      { name: "Topografia", level: 85 },
      { name: "Estimo", level: 78 },
      { name: "Progettazione", level: 82 },
      { name: "Matematica", level: 80 },
    ],
  },
  {
    category: "Altro",
    items: [
      { name: "Fotografia", level: 75 },
      { name: "Microsoft Office", level: 88 },
      { name: "Italiano & Comunicazione", level: 90 },
      { name: "Inglese Tecnico", level: 72 },
    ],
  },
];

const projects = [
  {
    num: "01",
    title: "Progetto di Riqualificazione Urbana",
    description:
      "Piano di intervento per il recupero di un'area industriale dismessa nel centro di Mantova. Rilievo sul campo, planimetrie in AutoCAD e relazione tecnica completa.",
    tags: ["AutoCAD", "Rilievo", "Urbanistica"],
    year: "2025",
    color: PRIMARY,
  },
  {
    num: "02",
    title: "Modello BIM Edificio Residenziale",
    description:
      "Realizzazione di un modello parametrico tridimensionale di un edificio a tre piani con Revit. Tavole architettoniche, computo metrico estimativo e simulazione energetica.",
    tags: ["Revit", "BIM", "Estimo"],
    year: "2024",
    color: "#7A8FAF",
  },
  {
    num: "03",
    title: "Rilievo Topografico del Territorio",
    description:
      "Campagna di rilievo con stazione totale e GPS differenziale in zona periurbana. Elaborazione dati, restituzione cartografica e relazione finale con elaborati grafici.",
    tags: ["Topografia", "GIS", "Stazione Totale"],
    year: "2024",
    color: "#8FA7C8",
  },
  {
    num: "04",
    title: "Valutazione Immobiliare — Estimo",
    description:
      "Perizia estimativa di un compendio agricolo con metodo di comparazione di mercato. Analisi del territorio, indagine catastale e redazione del rapporto di stima.",
    tags: ["Estimo", "Catasto", "Relazione"],
    year: "2024",
    color: "#A0B4C4",
  },
];

const stats = [
  { label: "Media Voti", raw: 85, display: "8.5", suffix: "/10", decimal: true },
  { label: "Progetti Tecnici", raw: 14, display: "14", suffix: "+", decimal: false },
  { label: "Ore di Disegno", raw: 600, display: "600", suffix: "h", decimal: false },
  { label: "Anni di Percorso", raw: 5, display: "5", suffix: "°", decimal: false },
];

const interests = [
  "Architettura Sostenibile",
  "Fotografia di Architettura",
  "Modellazione 3D",
  "Paesaggistica",
  "Storia dell'Arte",
  "Topografia Avanzata",
  "Design Urbano",
  "Edilizia Green",
];

function AnimatedName({ name, delay = 0 }: { name: string; delay?: number }) {
  const chars = name.split("");
  return (
    <div className="overflow-hidden flex flex-wrap justify-center">
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: delay + i * 0.035,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </div>
  );
}

function StatCounter({
  raw,
  suffix,
  label,
  active,
  decimal,
}: {
  raw: number;
  suffix: string;
  label: string;
  active: boolean;
  decimal: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const step = raw / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= raw) {
        setCount(raw);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [raw, active]);

  const displayed = active
    ? decimal
      ? (count / 10).toFixed(1)
      : count
    : decimal
    ? "0.0"
    : "0";

  return (
    <div className="border-l-2 pl-5" style={{ borderColor: PRIMARY }}>
      <div
        className="font-display text-3xl lg:text-4xl font-semibold"
        style={{ color: PRIMARY }}
      >
        {displayed}
        {suffix}
      </div>
      <div
        className="font-mono text-xs mt-1 uppercase tracking-wider"
        style={{ color: "var(--muted-foreground)", fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </div>
    </div>
  );
}

function SkillBar({ name, level, delay }: { name: string; level: number; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="mb-5">
      <div className="flex justify-between mb-2">
        <span
          className="font-mono text-xs tracking-wider"
          style={{ color: "var(--muted-foreground)", fontFamily: "'DM Mono', monospace" }}
        >
          {name}
        </span>
        <span
          className="font-mono text-xs"
          style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
        >
          {level}%
        </span>
      </div>
      <div
        className="h-px overflow-hidden rounded-full"
        style={{ background: "rgba(92, 111, 168, 0.12)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})` }}
        />
      </div>
    </div>
  );
}

function FadeSection({
  children,
  className = "",
  id = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id={id} style={style}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 44 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </section>
  );
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Chi Sono", href: "#chi-sono" },
    { label: "Competenze", href: "#competenze" },
    { label: "Progetti", href: "#progetti" },
    { label: "Contatti", href: "#contatti" },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Scroll progress */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[100] pointer-events-none transition-none"
        style={{
          width: `${scrollProgress}%`,
          background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
        }}
      />

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={
          scrolled
            ? {
                backdropFilter: "blur(18px)",
                background: "rgba(247, 245, 240, 0.88)",
                borderBottom: "1px solid rgba(92, 111, 168, 0.12)",
              }
            : {}
        }
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="font-mono text-xs tracking-[0.3em] uppercase"
            style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
          >
            AP<span className="opacity-30 mx-2">—</span>CAT 5°
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex items-center gap-10"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: "var(--muted-foreground)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#F7F5F0" }}
      >
        {/* Soft ambient layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="grid-light" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 mb-10 px-6 py-2.5 rounded-full"
            style={{
              border: `1px solid rgba(92, 111, 168, 0.25)`,
              background: "rgba(92, 111, 168, 0.06)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: PRIMARY }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.25em] uppercase"
              style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
            >
              ITT Carlo d'Arco · Sezione CAT · Classe 5ª
            </span>
          </motion.div>

          {/* Name */}
          <h1
            className="font-display font-semibold leading-none tracking-tight mb-2"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(3.2rem, 10vw, 8.5rem)",
              color: "#1C1A17",
            }}
          >
            <AnimatedName name="Alberto" delay={0.2} />
          </h1>
          <h1
            className="font-display font-semibold leading-none tracking-tight mb-10"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(3.2rem, 10vw, 8.5rem)",
              color: PRIMARY,
            }}
          >
            <AnimatedName name="Pecchini" delay={0.55} />
          </h1>

          {/* Divider line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-16 h-px mx-auto mb-10 origin-center"
            style={{ background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)` }}
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl max-w-md mx-auto mb-14 leading-relaxed font-light"
            style={{ color: "var(--muted-foreground)" }}
          >
            Studente di Costruzioni, Ambiente e Territorio.{" "}
            <em
              className="not-italic"
              style={{ color: PRIMARY }}
            >
              Progetto spazi, misuro il territorio, costruisco il futuro.
            </em>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <a
              href="#progetti"
              className="relative px-10 py-3.5 text-sm font-medium overflow-hidden group rounded-sm transition-colors duration-300"
              style={{ background: PRIMARY, color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#4A5E97")}
              onMouseLeave={(e) => (e.currentTarget.style.background = PRIMARY)}
            >
              Vedi Progetti
            </a>
            <a
              href="#contatti"
              className="text-sm font-medium transition-colors duration-300"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
            >
              Contattami <span style={{ color: PRIMARY }}>→</span>
            </a>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--muted-foreground)", fontFamily: "'DM Mono', monospace" }}
          >
            Scorri
          </span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── CHI SONO ── */}
      <FadeSection
        id="chi-sono"
        className="py-32 px-6"
        style={{ background: "#FFFFFF" }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-28 items-center">
          {/* Photo */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-sm" style={{ aspectRatio: "4/5" }}>
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=750&fit=crop&auto=format"
                alt="Alberto Pecchini, studente CAT"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(247,245,240,0.4) 0%, transparent 60%)",
                }}
              />
            </div>
            {/* Frame */}
            <div
              className="absolute -top-4 -left-4 w-full h-full pointer-events-none rounded-sm"
              style={{ border: `1px solid rgba(92, 111, 168, 0.2)` }}
            />
            {/* Badge anno */}
            <div
              className="absolute bottom-6 left-6 px-4 py-2 font-mono text-xs tracking-widest rounded-sm"
              style={{
                background: PRIMARY,
                color: "#fff",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              2020 — 2025
            </div>
          </div>

          {/* Text */}
          <div>
            <div
              className="font-mono text-xs tracking-[0.3em] uppercase mb-6"
              style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
            >
              01 — Chi Sono
            </div>
            <h2
              className="font-display font-semibold leading-tight mb-8"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                color: "#1C1A17",
              }}
            >
              Guardo il territorio{" "}
              <span style={{ color: PRIMARY }}>con occhi</span>
              <br />
              da progettista.
            </h2>
            <p className="leading-relaxed mb-5" style={{ color: "var(--muted-foreground)" }}>
              Mi chiamo Alberto Pecchini, ho 19 anni e frequento il quinto anno
              della sezione CAT all'Istituto Tecnico Tecnologico{" "}
              <span className="text-foreground font-medium">"Carlo d'Arco"</span> di Mantova.
            </p>
            <p className="leading-relaxed mb-12" style={{ color: "var(--muted-foreground)" }}>
              Nel mio percorso ho imparato a leggere e disegnare il territorio, a
              valutare immobili, a redigere progetti edilizi e a usare strumenti
              professionali come AutoCAD e Revit. La mia passione è trasformare
              dati tecnici in{" "}
              <span className="text-foreground font-medium">spazi reali e vivibili</span>.
            </p>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-2 gap-8">
              {stats.map((s) => (
                <StatCounter
                  key={s.label}
                  raw={s.raw}
                  suffix={s.suffix}
                  label={s.label}
                  active={statsInView}
                  decimal={s.decimal}
                />
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── COMPETENZE ── */}
      <FadeSection
        id="competenze"
        className="py-32 px-6"
        style={{ background: "#F7F5F0", borderTop: "1px solid rgba(92,111,168,0.1)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <div
              className="font-mono text-xs tracking-[0.3em] uppercase mb-5"
              style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
            >
              02 — Competenze
            </div>
            <h2
              className="font-display font-semibold leading-none"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                color: "#1C1A17",
              }}
            >
              Cosa so fare
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16 mb-20">
            {skills.map((cat, ci) => (
              <div key={cat.category}>
                <div
                  className="font-mono text-[10px] tracking-[0.3em] uppercase mb-6 pb-3"
                  style={{
                    color: "var(--muted-foreground)",
                    fontFamily: "'DM Mono', monospace",
                    borderBottom: `1px solid rgba(92, 111, 168, 0.15)`,
                  }}
                >
                  {cat.category}
                </div>
                {cat.items.map((skill, si) => (
                  <SkillBar
                    key={skill.name}
                    name={skill.name}
                    level={skill.level}
                    delay={si * 0.1 + ci * 0.06}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Interest tags */}
          <div className="flex flex-wrap gap-3">
            {interests.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="px-5 py-2 font-mono text-xs tracking-wider rounded-full border cursor-default transition-all duration-300"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  borderColor: "rgba(92, 111, 168, 0.2)",
                  color: "var(--muted-foreground)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = PRIMARY;
                  (e.currentTarget as HTMLElement).style.color = PRIMARY;
                  (e.currentTarget as HTMLElement).style.background = "rgba(92,111,168,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(92, 111, 168, 0.2)";
                  (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── PROGETTI ── */}
      <section
        id="progetti"
        className="py-32 px-6"
        style={{ background: "#FFFFFF", borderTop: "1px solid rgba(92,111,168,0.1)" }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            <div
              className="font-mono text-xs tracking-[0.3em] uppercase mb-5"
              style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
            >
              03 — Progetti
            </div>
            <h2
              className="font-display font-semibold leading-none"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                color: "#1C1A17",
              }}
            >
              Il mio lavoro
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {projects.map((project, i) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="group relative p-8 border rounded-sm overflow-hidden cursor-pointer transition-all duration-500"
                style={{
                  borderColor: "rgba(92, 111, 168, 0.14)",
                  background: "#FAFAF8",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `rgba(92,111,168,0.35)`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(92,111,168,0.1)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(92,111,168,0.14)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Soft glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 0% 0%, rgba(92,111,168,0.05) 0%, transparent 70%)`,
                  }}
                />

                <div className="flex items-start justify-between mb-8">
                  <span
                    className="font-display font-semibold text-5xl leading-none opacity-15"
                    style={{ color: project.color, fontFamily: "'Fraunces', serif" }}
                  >
                    {project.num}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--muted-foreground)", fontFamily: "'DM Mono', monospace" }}
                    >
                      {project.year}
                    </span>
                    <ExternalLink
                      size={13}
                      className="opacity-30 group-hover:opacity-80 transition-opacity"
                      style={{ color: project.color }}
                    />
                  </div>
                </div>

                <h3
                  className="font-display font-semibold mb-4 leading-snug"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: "clamp(1.05rem, 2vw, 1.2rem)",
                    color: "#1C1A17",
                  }}
                >
                  {project.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-8"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 font-mono text-[11px] tracking-wider rounded-full"
                      style={{
                        background: `rgba(92,111,168,0.08)`,
                        color: project.color,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTATTI ── */}
      <FadeSection
        id="contatti"
        className="py-32 px-6 text-center"
        style={{ background: "#F7F5F0", borderTop: "1px solid rgba(92,111,168,0.1)" }}
      >
        <div className="max-w-xl mx-auto">
          <div
            className="font-mono text-xs tracking-[0.3em] uppercase mb-6"
            style={{ color: PRIMARY, fontFamily: "'DM Mono', monospace" }}
          >
            04 — Contatti
          </div>
          <h2
            className="font-display font-semibold leading-none mb-8"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(3rem, 8vw, 6rem)",
              color: "#1C1A17",
            }}
          >
            Parliamo
            <span style={{ color: PRIMARY }}>.</span>
          </h2>
          <p
            className="text-lg leading-relaxed mb-14"
            style={{ color: "var(--muted-foreground)" }}
          >
            Per collaborazioni, domande sul mio percorso scolastico o semplicemente
            per uno scambio di idee — sono disponibile.
          </p>

          <a
            href="mailto:alberto.pecchini@studente.it"
            className="inline-flex items-center gap-3 px-12 py-4 text-sm font-medium rounded-sm transition-all duration-300"
            style={{ background: PRIMARY, color: "#fff" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#4A5E97";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px rgba(92,111,168,0.25)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = PRIMARY;
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <Mail size={15} />
            Scrivimi
          </a>

          <div className="mt-12 flex items-center justify-center gap-10">
            {[
              { Icon: Github, label: "GitHub", href: "#" },
              { Icon: Linkedin, label: "LinkedIn", href: "#" },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: "var(--muted-foreground)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                <Icon size={14} />
                {label}
              </a>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* Footer */}
      <footer
        className="py-8 px-6"
        style={{ background: "#FFFFFF", borderTop: "1px solid rgba(92,111,168,0.1)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span
            className="font-mono text-xs tracking-widest"
            style={{ color: "var(--muted-foreground)", fontFamily: "'DM Mono', monospace" }}
          >
            © 2025 Alberto Pecchini
          </span>
          <span
            className="font-mono text-xs tracking-widest"
            style={{ color: "var(--muted-foreground)", fontFamily: "'DM Mono', monospace" }}
          >
            ITT "Carlo d'Arco" · Sezione CAT · Mantova
          </span>
        </div>
      </footer>

      <style>{`
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          will-change: transform;
        }
        .blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(92,111,168,0.12), transparent);
          top: -150px; left: -150px;
          animation: blobdrift1 24s ease-in-out infinite;
        }
        .blob-2 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(143,167,200,0.1), transparent);
          bottom: -80px; right: -80px;
          animation: blobdrift2 18s ease-in-out infinite;
        }
        .blob-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(168,184,200,0.1), transparent);
          top: 50%; left: 55%;
          animation: blobdrift3 30s ease-in-out infinite;
        }
        @keyframes blobdrift1 {
          0%, 100% { transform: translate(0, 0); }
          40% { transform: translate(50px, 40px); }
          70% { transform: translate(20px, 70px); }
        }
        @keyframes blobdrift2 {
          0%, 100% { transform: translate(0, 0); }
          35% { transform: translate(-40px, -30px); }
          65% { transform: translate(-20px, -55px); }
        }
        @keyframes blobdrift3 {
          0%, 100% { transform: translate(-50%, -50%); }
          30% { transform: translate(-60%, -42%); }
          60% { transform: translate(-42%, -58%); }
        }
        .grid-light {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(92, 111, 168, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92, 111, 168, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        ::-webkit-scrollbar { width: 0; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
