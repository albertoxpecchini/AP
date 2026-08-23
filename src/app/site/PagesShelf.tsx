// ─────────────────────────────────────────────────────────────────────────────
// Lo scaffale delle sei pagine (§⑤ della home).
//
// Erano sei card di vetro in griglia, e una griglia di sei rettangoli uguali si
// legge come un elenco: la si scorre e non ci si ferma su niente. Adesso sono
// sei lastre affiancate, cinque chiuse di taglio e una sola aperta — quella che
// stai guardando. Le tinte sono le sei di casa, ma qui non fanno da accento su
// fondo bianco: sono il fondo, e vanno accese fino in fondo (vedi «Il muro delle
// sei pagine» in home.css).
//
// La sezione porta il data-acc di quella aperta, non uno fisso: la tinta esce
// dallo scaffale e sale fino alla nav, che segue la sezione a schermo
// (useNavAccent in site/GlassMotion.tsx).
//
// ── Perché è un componente a sé, e non un pezzo di App ───────────────────────
// Perché la lastra si apre al PASSAGGIO del puntatore. Finché `openPage` stava
// su App, ogni mouseenter ridisegnava tutto l'albero della home — il muro dei
// commit da 1.100 rect, l'archivio incorporato, lo snippet ritokenizzato — e
// spazzando lo scaffale se ne facevano sei di fila. Qui dentro lo stesso gesto
// ridisegna sei lastre e basta.
//
// Il componente rende la <section> INTERA, non solo lo scaffale: il data-acc
// dipende dalla lastra aperta, e chi possiede lo stato deve possedere anche
// l'elemento che lo indossa.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Link } from "react-router";
import { IcArrowRight, IcBook, IcCat, IcHeart, IcId, IcRuler, IcUser } from "./homeIcons";

// ── Le altre pagine del sito (≈ i "template" di Supabase) ───────────────────
// Oltre a titolo, riga e rotta portano due cose: `kind`, la targhetta di che
// cosa sono, e `acc` — la tinta, che è una delle sei di casa (vedi «La
// tavolozza» in home.css). Qui la tinta non è un accento su fondo bianco ma il
// FONDO della lastra, quindi l'ordine conta: due tinte vicine di giro cromatico
// non stanno mai una accanto all'altra.
const PAGES = [
  {
    title: "About Me",
    kind: "Personal presentation",
    desc: "My personal presentation for the 2026 final state exam — who I am, my roots and the future, in a single narrated scroll.",
    url: "/me-stesso",
    acc: "verde",
    Icon: IcUser,
  },
  {
    title: "PCTO",
    kind: "Work placement",
    desc: "Three years of work placement at Caem Group's timber department, told through illustrations of the woods.",
    url: "/pcto",
    acc: "ambra",
    Icon: IcRuler,
  },
  {
    title: "Dubliners",
    kind: "English literature",
    desc: "James Joyce's «Dubliners» in 3 minutes — fifteen stories where almost nothing happens, and that's the point.",
    url: "/dubliners",
    acc: "blu",
    Icon: IcBook,
  },
  {
    title: "The Leopard",
    kind: "Italian literature",
    desc: "Tomasi di Lampedusa's novel in 3 minutes — Sicily in 1860 and the art of changing everything to change nothing.",
    url: "/gattopardo",
    acc: "rosso",
    Icon: IcCat,
  },
  {
    title: "Bio",
    kind: "Profile",
    desc: "The long version of the story: interests, skills, socials and everything that doesn't fit in a hero section.",
    url: "/bio",
    acc: "viola",
    Icon: IcId,
  },
  {
    title: "Support",
    kind: "Donations",
    desc: "Ways to support my work — every contribution goes straight into new projects and better tools.",
    url: "/sostieni",
    acc: "rosa",
    Icon: IcHeart,
  },
];

export default function PagesShelf() {
  // Quale delle sei lastre è aperta. Ce n'è sempre una: uno scaffale tutto
  // chiuso sarebbe una fila di colori senza contenuto.
  const [openPage, setOpenPage] = useState(0);

  return (
    <section className="sb-section" aria-label="Pages" data-acc={PAGES[openPage].acc}>
      <div className="sb-container">
        <div className="sb-splithead">
          <div>
            <h3>Six more pages I designed and built</h3>
            <p>
              Other projects of mine — some born for school, some to support myself.
              Different subjects, the same hand and the same design system as this page.
            </p>
          </div>
          <Link to="/archivio" className="sb-btn sb-btn--sm sb-btn--secondary">View them all</Link>
        </div>

        <div className="sb-shelf">
          {PAGES.map((p, i) => {
            const open = i === openPage;
            return (
              <div key={p.url} className="sb-slat" data-acc={p.acc} data-open={open}>
                {/* Il bersaglio è tutta la lastra, ed è un <button> vero:
                    apre, non naviga. La navigazione è il link in fondo al
                    pannello — un link dentro un bottone non si può fare, e
                    soprattutto sono due gesti diversi. */}
                <button
                  type="button"
                  className="sb-slat-hit"
                  aria-label={p.title}
                  aria-expanded={open}
                  aria-controls={`sb-slat-${i}`}
                  onClick={() => setOpenPage(i)}
                  onMouseEnter={() => setOpenPage(i)}
                  onFocus={() => setOpenPage(i)}
                />
                <span className="sb-slat-mark" aria-hidden="true"><p.Icon size={24} /></span>
                {/* Lo stesso glifo, in grande e appena visibile: la lastra
                    aperta è alta mezzo schermo e il testo sta tutto in
                    fondo (è lì che il velo scurisce abbastanza da farlo
                    leggere), quindi in mezzo restava un campo di tinta
                    vuoto. Questo lo riempie senza chiedere di essere
                    guardato. */}
                <span className="sb-slat-ghost" aria-hidden="true"><p.Icon size={200} /></span>
                {/* Il nome di taglio sul dorso: cinque lastre chiuse senza
                    nome sarebbero cinque colori e basta. aria-hidden perché
                    è lo stesso titolo che portano il bottone e il pannello. */}
                <span className="sb-slat-rail" aria-hidden="true">{p.title}</span>
                <div className="sb-slat-body" id={`sb-slat-${i}`}>
                  <span className="sb-slat-kind">{p.kind}</span>
                  <h4 className="sb-slat-name">{p.title}</h4>
                  <p className="sb-slat-line">{p.desc}</p>
                  <Link className="sb-slat-go" to={p.url} tabIndex={open ? 0 : -1}>
                    Open the page <IcArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
