// ─── Convertitore: file "formato libro" → capitoli del gioco Trivia ──────────
//
// Legge i sorgenti in content/trivia/raw/*.md (formato del libro, con numeri,
// opzioni "- A)/B)", "**Risposta corretta:** X", V/F e completamenti col buco)
// e genera in content/trivia/<slug>.md i capitoli nello schema che il gioco
// legge (parseTrivia.ts: "## Domanda" + "type:" + opzioni "- [x]" / "risposta:").
//
// Regole di questa fase (decise con l'utente):
//  • MULTIPLE  → importate tutte.
//  • VERO/FALSO → SALTATE (placeholder senza risposta in quasi tutti i file).
//                 Quelle con risposta esplicita esistono ma le teniamo fuori per
//                 coerenza, e le contiamo nel report.
//  • COMPLETAMENTI → la risposta NON c'è nel file: la DEDUCIAMO dalle multiple/
//                 testi dello stesso argomento. Se deducibile con certezza →
//                 inclusa (type: aperta). Altrimenti → esclusa + segnalata nel report.
//
// Eseguire:  node scripts/import-trivia.mjs
//
// Niente dipendenze esterne: solo Node (fs/path).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "content", "trivia", "raw");
const OUT_DIR = join(ROOT, "content", "trivia");
const REPORT_PATH = join(RAW_DIR, "_IMPORT_REPORT.md");

// ── Titoli puliti e slug per ciascun file sorgente (nomi tecnici → leggibili) ──
const CHAPTER_META = {
  "neoclassicismo_domande":            { slug: "neoclassicismo",        title: "Neoclassicismo" },
  "continuazione_scala_milano":        { slug: "teatro-alla-scala",     title: "Teatro alla Scala di Milano" },
  "continuazione_architettura_eclettica": { slug: "eclettismo",         title: "Architettura eclettica" },
  "padiglione_brighton_31_40":         { slug: "padiglione-brighton",   title: "Padiglione Reale di Brighton" },
  "opera_parigi_41_50":                { slug: "opera-parigi",          title: "Opéra di Parigi (Palais Garnier)" },
  "urbanistica_ottocento_51_60":       { slug: "parigi-haussmann",      title: "Parigi di Haussmann" },
  "architettura_ferro_ponti_61_70":    { slug: "architettura-del-ferro",title: "Architettura del ferro e ponti" },
  "continuazione_71_80":               { slug: "crystal-palace",        title: "Crystal Palace" },
  "continuazione_81_90":               { slug: "torre-eiffel",          title: "Torre Eiffel" },
  "continuazione_91_100":              { slug: "art-nouveau-bruxelles",  title: "Art Nouveau a Bruxelles" },
  "continuazione_101_110":             { slug: "art-nouveau-francia",    title: "Art Nouveau in Francia" },
  "continuazione_111_120":             { slug: "modernismo-catalano",    title: "Modernismo catalano e Gaudí" },
  "continuazione_121_130":             { slug: "casa-batllo",            title: "Casa Batlló" },
  "continuazione_131_140":             { slug: "casa-mila",              title: "Casa Milà – La Pedrera" },
  "sagrada_familia_141_150":           { slug: "sagrada-familia",        title: "Sagrada Família" },
  "liberty_in_italia_151_160":         { slug: "liberty-italia",         title: "Liberty in Italia" },
  "scuola_di_chicago_grattacieli_161_170": { slug: "scuola-di-chicago",  title: "Scuola di Chicago e grattacieli" },
  "movimento_moderno_171_180":         { slug: "movimento-moderno",      title: "Movimento moderno" },
  "fabbrica_turbine_aeg_181_190":      { slug: "fabbrica-aeg",           title: "Fabbrica di turbine AEG" },
  "stabilimento_fagus_bauhaus_191_200":{ slug: "bauhaus",               title: "Stabilimento Fagus e Bauhaus" },
  "villa_savoye_201_210":              { slug: "villa-savoye",           title: "Villa Savoye" },
  "unita_abitazione_marsiglia_211_220":{ slug: "unite-marsiglia",        title: "Unità di abitazione di Marsiglia" },
  "cappella_notre_dame_du_haut_221_230": { slug: "ronchamp",            title: "Cappella di Notre-Dame du Haut (Ronchamp)" },
  "padiglione_barcellona_231_240":     { slug: "padiglione-barcellona",  title: "Padiglione di Barcellona" },
  "architetture_alvar_aalto_241_250":  { slug: "alvar-aalto",            title: "Architetture di Alvar Aalto" },
  "casa_sulla_cascata_251_260":        { slug: "fallingwater",           title: "Casa sulla cascata (Fallingwater)" },
  "solomon_r_guggenheim_museum_261_270": { slug: "guggenheim-ny",        title: "Solomon R. Guggenheim Museum" },
  "razionalismo_in_italia_271_280":    { slug: "razionalismo-italia",    title: "Razionalismo in Italia" },
  "novocomum_casa_del_fascio_281_290": { slug: "terragni-como",          title: "Novocomum e Casa del Fascio" },
  "architettura_contemporanea_291_300":{ slug: "architettura-contemporanea", title: "Architettura contemporanea" },
  "centre_georges_pompidou_301_310":   { slug: "centre-pompidou",        title: "Centre Georges Pompidou" },
  "nuovo_cimitero_san_cataldo_311_320":{ slug: "san-cataldo",            title: "Cimitero di San Cataldo" },
  "piramide_del_louvre_321_330":       { slug: "piramide-louvre",        title: "Piramide del Louvre" },
  "citta_delle_arti_e_delle_scienze_331_340": { slug: "citta-arti-scienze", title: "Città delle Arti e delle Scienze" },
  "auditorium_parco_della_musica_341_350": { slug: "auditorium-roma",    title: "Auditorium Parco della Musica" },
  "millennium_dome_351_360":           { slug: "millennium-dome",        title: "Millennium Dome" },
  "maxxi_museo_delle_arti_del_xxi_secolo_361_370": { slug: "maxxi",      title: "MAXXI" },
  "stazione_mediopadana_e_ponti_371_380": { slug: "mediopadana",        title: "Stazione Mediopadana e ponti di Calatrava" },
  "bosco_verticale_381_390":           { slug: "bosco-verticale",        title: "Bosco Verticale" },
  "quartiere_citylife_391_400":        { slug: "citylife",               title: "Quartiere CityLife" },
};

// Keyword foto per capitolo: soggetto preciso da cercare su Wikipedia.
const CHAPTER_PHOTO = {
  "neoclassicismo": "Architettura neoclassica",
  "teatro-alla-scala": "Teatro alla Scala Milano",
  "eclettismo": "Galleria Vittorio Emanuele II Milano",
  "padiglione-brighton": "Royal Pavilion Brighton",
  "opera-parigi": "Palais Garnier Opéra Paris",
  "parigi-haussmann": "Boulevard Haussmann Parigi",
  "architettura-del-ferro": "Forth Bridge Scotland",
  "crystal-palace": "Crystal Palace London",
  "torre-eiffel": "Torre Eiffel Parigi",
  "art-nouveau-bruxelles": "Hôtel Tassel Bruxelles",
  "art-nouveau-francia": "Métro Paris Guimard entrance",
  "modernismo-catalano": "Park Güell Barcellona",
  "casa-batllo": "Casa Batlló Barcelona",
  "casa-mila": "Casa Milà La Pedrera",
  "sagrada-familia": "Sagrada Família Barcelona",
  "liberty-italia": "Palazzo Castiglioni Milano",
  "scuola-di-chicago": "Reliance Building Chicago",
  "movimento-moderno": "Robie House Chicago",
  "fabbrica-aeg": "AEG Turbine Factory Berlin",
  "bauhaus": "Bauhaus Dessau",
  "villa-savoye": "Villa Savoye Poissy",
  "unite-marsiglia": "Unité d'Habitation Marseille",
  "ronchamp": "Notre-Dame du Haut Ronchamp",
  "padiglione-barcellona": "Barcelona Pavilion Mies van der Rohe",
  "alvar-aalto": "Paimio Sanatorium Aalto",
  "fallingwater": "Fallingwater Frank Lloyd Wright",
  "guggenheim-ny": "Solomon R. Guggenheim Museum New York",
  "razionalismo-italia": "Palazzo della Civiltà Italiana Roma",
  "terragni-como": "Casa del Fascio Como Terragni",
  "architettura-contemporanea": "Centre Pompidou Paris",
  "centre-pompidou": "Centre Georges Pompidou Paris",
  "san-cataldo": "Cimitero San Cataldo Modena Aldo Rossi",
  "piramide-louvre": "Louvre Pyramid Paris",
  "citta-arti-scienze": "Ciudad de las Artes y las Ciencias Valencia",
  "auditorium-roma": "Auditorium Parco della Musica Roma",
  "millennium-dome": "Millennium Dome O2 London",
  "maxxi": "MAXXI Museo Roma Zaha Hadid",
  "mediopadana": "Stazione Mediopadana Reggio Emilia Calatrava",
  "bosco-verticale": "Bosco Verticale Milano",
  "citylife": "CityLife Milano Tre Torri",
};

// ── Override risposte completamenti (per quelli non auto-dedotti con certezza).
// Chiave: "<slug>#<numeroDomanda>". Ricavate dal materiale dello stesso argomento.
// I due casi davvero ambigui restano fuori → finiscono nel report da rivedere.
const COMPLETION_OVERRIDE = {
  "architettura-contemporanea#149": "1977",
  "fallingwater#126": "Kaufmann",
  "art-nouveau-francia#52": "1942",
  "art-nouveau-francia#54": "ghisa",
  "modernismo-catalano#59": "Güell",
  "casa-batllo#65": "chiocciola",
  "casa-mila#67": "Milà",
  "crystal-palace#39": "Hyde",
  "art-nouveau-bruxelles#47": "Bruxelles",
  "teatro-alla-scala#10": "servitù",
  "fabbrica-aeg#95": "legno",
  "liberty-italia#80": "ferro",
  "maxxi#182": "Roma",
  "maxxi#185": "atrio",
  "millennium-dome#177": "Tamigi",
  "movimento-moderno#88": "funzione",
  "neoclassicismo#2": "ragione",
  "neoclassicismo#3": "Medioevo",
  "san-cataldo#159": "cubo",
  "padiglione-brighton#19": "Lunga",
  "citylife#196": "Milano",
  "sagrada-familia#73": "170",
  "scuola-di-chicago#81": "XIX",
  "scuola-di-chicago#82": "8",
  "unite-marsiglia#110": "Perriand",
  "parigi-haussmann#27": "Haussmann",
  "parigi-haussmann#29": "Vincennes",
};

// ── Fix encoding mojibake (UTF-8 letto come Latin-1) ──
// Idempotente: se il testo è già corretto, i pattern non scattano.
function fixEncoding(s) {
  // Tentativo "pulito": se contiene sequenze tipiche di mojibake, ridecodifica.
  if (/Ã|Â|â\x82|â\x80/.test(s)) {
    try {
      const redecoded = Buffer.from(s, "latin1").toString("utf8");
      // accetta la ridecodifica solo se riduce i marcatori sospetti
      if ((redecoded.match(/Ã|Â/g) || []).length < (s.match(/Ã|Â/g) || []).length) s = redecoded;
    } catch { /* ignora */ }
  }
  // Mappa residui comuni.
  const map = {
    "Ã¨": "è", "Ã©": "é", "Ã ": "à", "Ã²": "ò", "Ã¹": "ù", "Ã¬": "ì",
    "Ã­": "í", "Ã¡": "á", "Ã³": "ó", "Ãº": "ú", "Ã±": "ñ", "Ã¼": "ü",
    "Ã€": "À", "Ã‰": "É", "Ãˆ": "È",
    "Â²": "²", "Â³": "³", "Â°": "°", "Â ": " ", "Â": "",
    "â‚¬": "€", "â€™": "’", "â€˜": "‘", "â€œ": "“", "â€": "”",
    "â€“": "–", "â€”": "—", "â€¦": "…", "â": "",
  };
  for (const [k, v] of Object.entries(map)) s = s.split(k).join(v);
  return s;
}

const slugifyAnswer = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// ── Parsing del file sorgente in sezioni e domande ──
function parseRaw(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let section = null; // "multipla" | "vf" | "compl" | null
  const multiple = []; // { n, text, options:[{letter,text}], correct }
  const vf = [];       // { n, text, answer? }
  const compl = [];    // { n, text }

  let cur = null; // domanda multipla in costruzione

  const flushMulti = () => { if (cur) { multiple.push(cur); cur = null; } };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/,"");
    const h = line.match(/^#{1,3}\s+(.*)$/);
    if (h) {
      flushMulti();
      const t = h[1].toLowerCase();
      if (t.includes("risposta multipla")) section = "multipla";
      else if (t.includes("vero")) section = "vf";
      else if (t.includes("completamento")) section = "compl";
      else section = section; // "# Continuazione" / "# Domande..." → lascia stato
      continue;
    }
    if (section === "multipla") {
      const mQ = line.match(/^(\d+)\.\s+(.*)$/);
      if (mQ) { flushMulti(); cur = { n: +mQ[1], text: mQ[2].trim(), options: [], correct: null }; continue; }
      const mO = line.match(/^[-*]\s*([A-D])\)\s+(.*)$/);
      if (mO && cur) { cur.options.push({ letter: mO[1], text: mO[2].trim() }); continue; }
      const mR = line.match(/\*\*Risposta corretta:\*\*\s*([A-D])/i);
      if (mR && cur) { cur.correct = mR[1].toUpperCase(); continue; }
    } else if (section === "vf") {
      const mV = line.match(/^(\d+)\.\s+(.*)$/);
      if (mV) {
        let text = mV[2].trim();
        let answer = null;
        const ans = text.match(/\*\*(Vero|Falso)\*\*\s*$/i);
        if (ans) { answer = ans[1].toLowerCase(); }
        text = text.replace(/\*\*Vero\/Falso\*\*\s*$/i, "").replace(/\*\*(Vero|Falso)\*\*\s*$/i, "").trim();
        vf.push({ n: +mV[1], text, answer });
      }
    } else if (section === "compl") {
      const mC = line.match(/^(\d+)\.\s+(.*)$/);
      if (mC) compl.push({ n: +mC[1], text: mC[2].trim() });
    }
  }
  flushMulti();
  return { multiple, vf, compl };
}

// ── Deduzione risposta di un completamento dalle multiple dello stesso file ──
// Ritorna { answer, accept[] } oppure null se non deducibile con certezza.
function deduceCompletion(comp, multiple) {
  const text = comp.text;
  const blank = text.indexOf("__");
  if (blank < 0) return null;
  const before = text.slice(0, blank).trim();
  const after = text.slice(text.lastIndexOf("__") + 2).replace(/^_+/, "").trim();

  // Parole-chiave del completamento (senza stopword) per agganciare la multipla giusta.
  const STOP = new Set("il lo la i gli le un uno una di a da in con su per tra fra del della dei degli delle al alla ai agli alle dal dalla e o ho è sono fu venne era stato stata che chi cosa come dove quale quali quanti quanto si abita aveva ha hanno il suo sua".split(/\s+/));
  const keywords = (before + " " + after)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/).map(w => w.toLowerCase()).filter(w => w.length > 2 && !STOP.has(w));

  // 1) Anni-range: "tra il X e il __" → secondo anno del range "X-Y" o "X-Y" nelle opzioni.
  const yearBefore = before.match(/(\d{4})\D*$/);
  if (yearBefore) {
    const y1 = yearBefore[1];
    for (const m of multiple) {
      const opt = m.options.find(o => o.letter === m.correct);
      if (!opt) continue;
      const range = opt.text.match(new RegExp(`${y1}\\s*[-–]\\s*(\\d{4})`));
      if (range) return { answer: range[1], accept: [range[1]] };
    }
  }

  // 2) Lista "X, Y e __": cerca opzione corretta che contenga X e Y + un terzo.
  const listMatch = before.match(/([A-ZÀ-Ý][\wàèéìòù]+),\s*([A-ZÀ-Ý][\wàèéìòù]+)\s*e\s*$/);
  if (listMatch) {
    const [_, a, b] = listMatch;
    for (const m of multiple) {
      const opt = m.options.find(o => o.letter === m.correct);
      if (!opt) continue;
      if (opt.text.includes(a) && opt.text.includes(b)) {
        const parts = opt.text.split(/,|\se\s/).map(s => s.trim()).filter(Boolean);
        const third = parts.find(p => !p.includes(a) && !p.includes(b));
        if (third) return { answer: third, accept: [third] };
      }
    }
  }

  // 3) Match per contesto: la multipla che condivide più keyword col completamento.
  let best = null, bestScore = 0;
  for (const m of multiple) {
    if (m.correct == null) continue;
    const qWords = new Set(m.text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/));
    let score = 0;
    for (const k of keywords) if (qWords.has(k)) score++;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  // Servono almeno 2 keyword condivise per fidarci.
  if (best && bestScore >= 2) {
    const opt = best.options.find(o => o.letter === best.correct);
    if (opt) {
      const val = extractAnswerValue(opt.text, before, after);
      if (val) return val;
    }
  }

  return null; // non deducibile con certezza
}

// Insieme di parole (normalizzate) di un testo, per sottrarre dalla risposta
// ciò che è già scritto nella frase del completamento.
function wordSet(s) {
  return new Set(slugifyAnswer(s).split(" ").filter(Boolean));
}

// Estrae il valore da mettere nel buco dalla risposta corretta della multipla.
// `before`/`after` = testo prima/dopo il buco: serve a togliere dall'opzione le
// parole GIA' presenti nella frase (es. "certificazione __ Gold" + "LEED Gold"
// -> "LEED"; "Charles-Edouard __" + "Charles-Edouard Jeanneret" -> "Jeanneret").
function extractAnswerValue(optText, before, after) {
  let t = optText.trim().replace(/^(Per|Il|La|Lo|Gli|Le|I|Un|Uno|Una)\s+/i, "");
  // Se la frase del completamento ha un'unità dopo il buco (posti/metri/m), e
  // l'opzione è tipo "2744" o "192 m", estrai il numero.
  const unitAfter = /\b(posti|metri|metro|m²|m2|mq|km²|piani|appartamenti|anni|persone|gradini|archi|finestre)\b/i.test(after);
  const numMatch = t.match(/^\s*([\d. \s]+)\s*(m²|m2|m|km²|km)?\s*$/);
  if (numMatch) {
    const num = numMatch[1].replace(/[\s .]/g, "");
    // accetta sia il numero puro sia con eventuale unità
    const accept = [num];
    if (numMatch[2]) accept.push(`${num} ${numMatch[2]}`);
    return { answer: num, accept };
  }
  if (unitAfter) {
    const n = t.match(/(\d[\d. ]*)/);
    if (n) { const num = n[1].replace(/[\s .]/g, ""); return { answer: num, accept: [num] }; }
  }
  // Caso testuale: sottrai dall'opzione le parole già presenti nella frase
  // (prima/dopo il buco), così resta solo la parte mancante.
  const present = new Set([...wordSet(before), ...wordSet(after)]);
  // una "parola" della risposta è presente se TUTTI i suoi token normalizzati
  // (anche separati da trattino, es. "Charles-Édouard") sono già nella frase
  const remaining = t.split(/\s+/).filter(w => {
    const toks = slugifyAnswer(w).split(" ").filter(Boolean);
    return toks.length === 0 ? false : !toks.every(tok => present.has(tok));
  });
  const cleaned = remaining.join(" ").trim();
  if (cleaned && cleaned.split(/\s+/).length <= 4) return { answer: cleaned, accept: [cleaned] };
  // Altrimenti, se l'opzione intera è corta, usala così com'è.
  if (t.split(/\s+/).length <= 3) return { answer: t, accept: [t] };
  return null;
}

// ── Emissione di un capitolo nel formato del parser ──
function emitChapter(meta, multiple, completionsDeduced, photo) {
  const out = [`# ${meta.title}`, ""];
  const esc = (s) => s.replace(/\s+/g, " ").trim();

  for (const m of multiple) {
    out.push("## Domanda", "type: multipla", esc(m.text));
    for (const o of m.options) {
      const mark = o.letter === m.correct ? "x" : " ";
      out.push(`- [${mark}] ${esc(o.text)}`);
    }
    if (photo) out.push(`foto: ${photo}`);
    out.push("");
  }

  for (const c of completionsDeduced) {
    out.push("## Domanda", "type: aperta", esc(c.text.replace(/_{2,}/g, "__________")));
    out.push(`risposta: ${c.answer}`);
    const extra = (c.accept || []).filter(a => a && a !== c.answer);
    if (extra.length) out.push(`accetta: ${extra.join("; ")}`);
    if (photo) out.push(`foto: ${photo}`);
    out.push("");
  }

  return out.join("\n").trim() + "\n";
}

// ── Main ──
function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const files = readdirSync(RAW_DIR).filter(f => f.endsWith(".md") && !f.startsWith("_"));

  const report = [];
  let totMulti = 0, totVf = 0, totComplDed = 0, totComplSkip = 0;

  for (const file of files) {
    const base = file.replace(/\.md$/, "");
    const meta = CHAPTER_META[base];
    if (!meta) { report.push(`⚠️  ${file}: nessun mapping titolo/slug — SALTATO`); continue; }

    const rawText = fixEncoding(readFileSync(join(RAW_DIR, file), "utf8"));
    const { multiple, vf, compl } = parseRaw(rawText);

    // Valida multiple (devono avere opzioni + corretta)
    const validMulti = multiple.filter(m => m.options.length >= 2 && m.correct);
    const badMulti = multiple.filter(m => !(m.options.length >= 2 && m.correct));

    // Deduci completamenti: prima un eventuale override manuale, poi l'euristica.
    const deduced = [];
    const skipped = [];
    for (const c of compl) {
      const ov = COMPLETION_OVERRIDE[`${meta.slug}#${c.n}`];
      if (ov) { deduced.push({ text: c.text, answer: ov, accept: [ov] }); continue; }
      const d = deduceCompletion(c, validMulti);
      if (d) deduced.push({ text: c.text, answer: d.answer, accept: d.accept });
      else skipped.push(c);
    }

    const photo = CHAPTER_PHOTO[meta.slug] || meta.title;
    const md = emitChapter(meta, validMulti, deduced, photo);
    writeFileSync(join(OUT_DIR, `${meta.slug}.md`), md, "utf8");

    totMulti += validMulti.length; totVf += vf.length;
    totComplDed += deduced.length; totComplSkip += skipped.length;

    const lines = [`### ${meta.title}  →  ${meta.slug}.md`,
      `   multiple: ${validMulti.length}${badMulti.length ? ` (⚠️ ${badMulti.length} scartate)` : ""} · V/F saltati: ${vf.length} · completamenti dedotti: ${deduced.length}/${compl.length}`];
    if (skipped.length) {
      lines.push(`   completamenti da rivedere (risposta non dedotta con certezza):`);
      for (const s of skipped) lines.push(`     - #${s.n}: ${s.text}`);
    }
    report.push(lines.join("\n"));
  }

  const head = [
    `# Report import Trivia`,
    ``,
    `Generato da \`scripts/import-trivia.mjs\`. Rilancia con \`node scripts/import-trivia.mjs\`.`,
    ``,
    `**Totali:** multiple importate ${totMulti} · V/F saltati ${totVf} · completamenti dedotti ${totComplDed} · completamenti da rivedere ${totComplSkip}`,
    ``,
    `> I V/F sono esclusi per scelta (mancano le risposte nei sorgenti). I completamenti`,
    `> con risposta non deducibile con certezza sono elencati qui sotto e NON sono finiti`,
    `> nei capitoli: vanno completati a mano (aggiungendo \`risposta:\`) o rivisti insieme.`,
    ``,
  ].join("\n");

  writeFileSync(REPORT_PATH, head + report.join("\n\n") + "\n", "utf8");
  console.log(head);
  console.log(report.join("\n\n"));
  console.log(`\n✅ Generati ${files.length} capitoli in content/trivia/. Report: content/trivia/raw/_IMPORT_REPORT.md`);
}

main();
