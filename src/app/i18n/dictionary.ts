// ─────────────────────────────────────────────────────────────────────────────
// Dizionario delle traduzioni — IT · EN · FR · DE.
//
// COME FUNZIONA
//  · La CHIAVE è il testo così com'è scritto nel sorgente (la "lingua sorgente"),
//    normalizzato con normalizeKey() (spazi singoli, niente spazi ai bordi).
//    La home è scritta in inglese → chiavi in inglese. I giochi e gli
//    approfondimenti sono in italiano → chiavi in italiano.
//  · Il VALORE elenca SOLO le lingue diverse dalla sorgente: la lingua sorgente
//    è già il testo originale, quindi il motore vi fa fallback da solo (così non
//    si duplica, e se una lingua manca resta — senza rompersi — la sorgente).
//
// COME AGGIUNGERNE
//  · Apri la pagina, copia il testo visibile esatto (emoji, «», — e · compresi)
//    e aggiungi `"testo originale": { ...altre lingue }`. Vale ovunque, su
//    qualsiasi pagina, all'istante. Le frasi vanno messe intere (il motore
//    traduce un nodo di testo solo se coincide tutto).
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./langCore";
// Store delle traduzioni del sito: chiave = testo SORGENTE, valore = le altre
// lingue. È il file mantenuto a mano/aggiornato; `scripts/i18n-extract.mjs` fa
// il crawl di tutte le pagine ed elenca le stringhe ancora da tradurre. Le voci
// curate qui sotto (RAW) restano come extra (stringhe dinamiche non sempre
// presenti nel DOM durante il crawl, es. esiti dei giochi).
import generated from "./translations.json";

export type Entry = Partial<Record<Lang, string>>;

/** Normalizza un testo per usarlo/cercarlo come chiave del dizionario. */
export function normalizeKey(s: string): string {
  return s.replace(/\u00A0/g, " ").trim().replace(/\s+/g, " ");
}

const RAW: Record<string, Entry> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // HOME / PORTFOLIO  (sorgente: INGLESE → it / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  // — Navigazione —
  Archive: { it: "Archivio", fr: "Archives", de: "Archiv" },
  About: { it: "Chi sono", fr: "À propos", de: "Über mich" },
  Résumé: { it: "Curriculum", fr: "CV", de: "Lebenslauf" },
  Support: { it: "Sostieni", fr: "Soutenir", de: "Unterstützen" },
  Contact: { it: "Contatti", fr: "Contact", de: "Kontakt" },

  // — Header / brand —
  "Designer & Front-end Developer": {
    it: "Designer e sviluppatore front-end",
    fr: "Designer & développeur front-end",
    de: "Designer & Frontend-Entwickler",
  },
  Local: { it: "Locale", fr: "Local", de: "Lokal" },

  // — Hero —
  "💻 Front-end Developer · CAT Student": {
    it: "💻 Sviluppatore front-end · Studente CAT",
    fr: "💻 Développeur front-end · Étudiant CAT",
    de: "💻 Frontend-Entwickler · CAT-Schüler",
  },
  "High-school senior & front-end developer behind": {
    it: "Studente dell'ultimo anno e sviluppatore front-end dietro a",
    fr: "Lycéen en terminale et développeur front-end derrière",
    de: "Schüler der Abschlussklasse und Frontend-Entwickler hinter",
  },
  "— a web game on the history of architecture — and client websites like": {
    it: "— un web game sulla storia dell'architettura — e siti web per clienti come",
    fr: "— un jeu web sur l'histoire de l'architecture — et des sites web pour clients comme",
    de: "— einem Web-Game über die Geschichte der Architektur — und Kunden-Websites wie",
  },
  "Building elegant, fast web experiences with React, TypeScript and careful motion design — from a playful quiz game to real-world business sites.":
    {
      it: "Creo esperienze web eleganti e veloci con React, TypeScript e cura del movimento — da un quiz spensierato ai veri siti aziendali.",
      fr: "Je crée des expériences web élégantes et rapides avec React, TypeScript et un soin particulier des animations — d'un quiz ludique aux vrais sites d'entreprise.",
      de: "Ich baue elegante, schnelle Web-Erlebnisse mit React, TypeScript und sorgfältigem Motion Design — vom verspielten Quiz bis zu echten Unternehmensseiten.",
    },
  "🚀 Projects": { it: "🚀 Progetti", fr: "🚀 Projets", de: "🚀 Projekte" },

  // — Sezione Archivio —
  "🗂️ Archive": { it: "🗂️ Archivio", fr: "🗂️ Archives", de: "🗂️ Archiv" },
  "Everything, in one place": {
    it: "Tutto, in un unico posto",
    fr: "Tout, au même endroit",
    de: "Alles an einem Ort",
  },
  "Open full archive": {
    it: "Apri l'archivio completo",
    fr: "Ouvrir les archives complètes",
    de: "Vollständiges Archiv öffnen",
  },

  // — Sezione Curriculum —
  "🎓 Résumé": { it: "🎓 Curriculum", fr: "🎓 CV", de: "🎓 Lebenslauf" },
  "Education & experience": {
    it: "Istruzione ed esperienza",
    fr: "Formation et expérience",
    de: "Ausbildung & Erfahrung",
  },
  "View CV": { it: "Vedi il CV", fr: "Voir le CV", de: "CV ansehen" },
  "Download (PDF)": { it: "Scarica (PDF)", fr: "Télécharger (PDF)", de: "Herunterladen (PDF)" },
  "Open certificate (PDF)": {
    it: "Apri l'attestato (PDF)",
    fr: "Ouvrir le certificat (PDF)",
    de: "Zertifikat öffnen (PDF)",
  },
  "Open document (PDF)": {
    it: "Apri il documento (PDF)",
    fr: "Ouvrir le document (PDF)",
    de: "Dokument öffnen (PDF)",
  },

  // — Sezione Stack —
  "Built with": { it: "Costruito con", fr: "Conçu avec", de: "Gebaut mit" },

  // — Sezione Contatti —
  "✉️ Contact": { it: "✉️ Contatti", fr: "✉️ Contact", de: "✉️ Kontakt" },
  "Let's talk. 💬": { it: "Parliamone. 💬", fr: "Discutons. 💬", de: "Reden wir. 💬" },
  "For collaborations, web projects or simply to exchange ideas — I'm available.": {
    it: "Per collaborazioni, progetti web o semplicemente per scambiare idee — sono a disposizione.",
    fr: "Pour des collaborations, des projets web ou simplement pour échanger des idées — je suis disponible.",
    de: "Für Kooperationen, Web-Projekte oder einfach zum Ideenaustausch — ich bin verfügbar.",
  },
  "Email me": { it: "Scrivimi", fr: "Écrivez-moi", de: "Schreib mir" },
  "Call me": { it: "Chiamami", fr: "Appelez-moi", de: "Ruf mich an" },
  "Support me": { it: "Sostienimi", fr: "Soutenez-moi", de: "Unterstütze mich" },

  // — Footer (home + footer condiviso) —
  "Designer & Developer · ITT «Carlo d'Arco» — Mantua": {
    it: "Designer e sviluppatore · ITT «Carlo d'Arco» — Mantova",
    fr: "Designer & développeur · ITT «Carlo d'Arco» — Mantoue",
    de: "Designer & Entwickler · ITT «Carlo d'Arco» — Mantua",
  },
  "Alberto Pecchini — All rights reserved": {
    it: "Alberto Pecchini — Tutti i diritti riservati",
    fr: "Alberto Pecchini — Tous droits réservés",
    de: "Alberto Pecchini — Alle Rechte vorbehalten",
  },
  Updated: { it: "Aggiornato", fr: "Mis à jour", de: "Aktualisiert" },

  // — Accessibilità / menu / modale PDF (home) —
  "Skip to main content": {
    it: "Vai al contenuto principale",
    fr: "Aller au contenu principal",
    de: "Zum Hauptinhalt springen",
  },
  "Skip to contacts": {
    it: "Vai ai contatti",
    fr: "Aller aux contacts",
    de: "Zu den Kontakten springen",
  },
  "Open navigation menu": {
    it: "Apri il menu di navigazione",
    fr: "Ouvrir le menu de navigation",
    de: "Navigationsmenü öffnen",
  },
  "New tab": { it: "Nuova scheda", fr: "Nouvel onglet", de: "Neuer Tab" },
  Download: { it: "Scarica", fr: "Télécharger", de: "Herunterladen" },
  "On mobile the PDF preview may not load — tap here to open the file →": {
    it: "Su mobile l'anteprima PDF potrebbe non caricarsi — tocca qui per aprire il file →",
    fr: "Sur mobile, l'aperçu PDF peut ne pas se charger — touchez ici pour ouvrir le fichier →",
    de: "Auf dem Handy lädt die PDF-Vorschau evtl. nicht — hier tippen, um die Datei zu öffnen →",
  },
  "Close the document preview": {
    it: "Chiudi l'anteprima del documento",
    fr: "Fermer l'aperçu du document",
    de: "Dokumentvorschau schließen",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHROME GLOBALE  (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  // — Footer condiviso —
  "Torna alla home": {
    en: "Back to home",
    fr: "Retour à l'accueil",
    de: "Zurück zur Startseite",
  },

  // — Widget tema (luna/sole) —
  "Passa al tema chiaro": {
    en: "Switch to light theme",
    fr: "Passer au thème clair",
    de: "Zum hellen Thema wechseln",
  },
  "Passa al tema scuro": {
    en: "Switch to dark theme",
    fr: "Passer au thème sombre",
    de: "Zum dunklen Thema wechseln",
  },
  "Tema chiaro": { en: "Light theme", fr: "Thème clair", de: "Helles Thema" },
  "Tema scuro": { en: "Dark theme", fr: "Thème sombre", de: "Dunkles Thema" },
  "Sensore orario attivo (08–20 chiaro, resto scuro)": {
    en: "Time sensor on (08–20 light, rest dark)",
    fr: "Capteur horaire actif (08–20 clair, reste sombre)",
    de: "Zeitsensor aktiv (08–20 hell, sonst dunkel)",
  },
  "Riattiva il sensore orario": {
    en: "Re-enable the time sensor",
    fr: "Réactiver le capteur horaire",
    de: "Zeitsensor wieder aktivieren",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UI COMUNE DEI GIOCHI  (sorgente: ITALIANO → en / fr / de)
  // Etichette brevi e ricorrenti su più pagine.
  // ═══════════════════════════════════════════════════════════════════════════
  Gioca: { en: "Play", fr: "Jouer", de: "Spielen" },
  "Gioca ancora": { en: "Play again", fr: "Rejouer", de: "Nochmal spielen" },
  "Nuova partita": { en: "New game", fr: "Nouvelle partie", de: "Neues Spiel" },
  "Menu principale": { en: "Main menu", fr: "Menu principal", de: "Hauptmenü" },
  Indietro: { en: "Back", fr: "Retour", de: "Zurück" },
  Avanti: { en: "Next", fr: "Suivant", de: "Weiter" },
  Continua: { en: "Continue", fr: "Continuer", de: "Weiter" },
  Chiudi: { en: "Close", fr: "Fermer", de: "Schließen" },
  Riprova: { en: "Try again", fr: "Réessayer", de: "Erneut versuchen" },
  Inizia: { en: "Start", fr: "Commencer", de: "Starten" },
  Avvia: { en: "Start", fr: "Démarrer", de: "Starten" },
  Classifica: { en: "Leaderboard", fr: "Classement", de: "Bestenliste" },
  Punteggio: { en: "Score", fr: "Score", de: "Punktzahl" },
  Salva: { en: "Save", fr: "Enregistrer", de: "Speichern" },
  Annulla: { en: "Cancel", fr: "Annuler", de: "Abbrechen" },
  Conferma: { en: "Confirm", fr: "Confirmer", de: "Bestätigen" },
  Impostazioni: { en: "Settings", fr: "Paramètres", de: "Einstellungen" },
  Aiuto: { en: "Help", fr: "Aide", de: "Hilfe" },
  Suono: { en: "Sound", fr: "Son", de: "Ton" },
  Livello: { en: "Level", fr: "Niveau", de: "Level" },
  Domanda: { en: "Question", fr: "Question", de: "Frage" },
  Risposta: { en: "Answer", fr: "Réponse", de: "Antwort" },
  Suggerimento: { en: "Hint", fr: "Indice", de: "Hinweis" },
  Corretto: { en: "Correct", fr: "Correct", de: "Richtig" },
  Sbagliato: { en: "Wrong", fr: "Faux", de: "Falsch" },
  "Hai vinto!": { en: "You won!", fr: "Vous avez gagné !", de: "Du hast gewonnen!" },
  "Hai perso": { en: "You lost", fr: "Vous avez perdu", de: "Du hast verloren" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FESTA  (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  // — Intestazione e invito —
  "Sei invitato/a": { en: "You are invited", fr: "Vous êtes invité·e", de: "Du bist eingeladen" },
  "La Festa": { en: "The Party", fr: "La Fête", de: "Die Party" },
  "di Alberto": { en: "of Alberto", fr: "d'Alberto", de: "von Alberto" },
  "Per i miei 20 anni · e la Maturità 74/100": {
    en: "For my 20 years · and high school diploma 74/100",
    fr: "Pour mes 20 ans · et le bac 74/100",
    de: "Für meine 20 Jahre · und Abitur 74/100",
  },
  "Geom. Alberto Pecchini": { en: "Geom. Alberto Pecchini", fr: "Geom. Alberto Pecchini", de: "Geom. Alberto Pecchini" },

  // — Countdown —
  "La festa è iniziata — ci vediamo!": {
    en: "The party has started — see you there!",
    fr: "La fête a commencé — à bientôt !",
    de: "Die Party hat begonnen — bis bald!",
  },
  "giorni": { en: "days", fr: "jours", de: "Tage" },
  "ore": { en: "hours", fr: "heures", de: "Std" },
  "min": { en: "min", fr: "min", de: "min" },
  "sec": { en: "sec", fr: "sec", de: "Sek" },
  "Conto alla rovescia alla festa": { en: "Countdown to the party", fr: "Compte à rebours de la fête", de: "Countdown bis zur Party" },

  // — Meteo —
  "sereno": { en: "clear", fr: "dégagé", de: "klar" },
  "poco nuvoloso": { en: "partly cloudy", fr: "peu nuageux", de: "leicht bewölkt" },
  "coperto": { en: "overcast", fr: "couvert", de: "bedeckt" },
  "nebbia": { en: "fog", fr: "brouillard", de: "Nebel" },
  "pioviggine": { en: "drizzle", fr: "bruine", de: "Nieselregen" },
  "pioggia": { en: "rain", fr: "pluie", de: "Regen" },
  "neve": { en: "snow", fr: "neige", de: "Schnee" },
  "rovesci": { en: "showers", fr: "averses", de: "Schauer" },
  "temporale": { en: "thunderstorm", fr: "orage", de: "Gewitter" },
  "Serata:": { en: "Evening:", fr: "Soirée :", de: "Abend:" },

  // — Data e countdown —
  "dalle 18 fino a tarda notte": {
    en: "from 6 PM until late night",
    fr: "de 18h à tard dans la nuit",
    de: "von 18 Uhr bis spät in die Nacht",
  },
  "Aggiungi al calendario": { en: "Add to calendar", fr: "Ajouter au calendrier", de: "Zum Kalender hinzufügen" },

  // — Sezione due giorni —
  "Non riesci? Vieni": { en: "Can't make it? Come", fr: "Vous ne pouvez pas ? Venez", de: "Kannst du nicht? Komm" },
  "Puoi esserci anche entrambi i giorni: rispondi a tutti e due gli inviti.": {
    en: "You can come both days: RSVP to both invites.",
    fr: "Vous pouvez venir les deux jours : répondez aux deux invitations.",
    de: "Du kannst an beiden Tagen kommen: Antworte auf beide Einladungen.",
  },

  // — A colpo d'occhio —
  "A colpo d'occhio — le 3 cose da sapere subito, per non impazzire": {
    en: "At a glance — 3 things to know right away",
    fr: "Un coup d'œil — 3 choses à savoir",
    de: "Auf einen Blick — 3 Dinge zum Wissen",
  },
  "Quando": { en: "When", fr: "Quand", de: "Wann" },
  "dalle 18": { en: "from 6 PM", fr: "de 18h", de: "ab 18 Uhr" },
  "Dove": { en: "Where", fr: "Où", de: "Wo" },
  "Cibo": { en: "Food", fr: "Repas", de: "Essen" },
  "Pizza offerta": { en: "Pizza provided", fr: "Pizza offerte", de: "Pizza gratis" },
  "regalo facoltativo": { en: "optional gift", fr: "cadeau optionnel", de: "optionales Geschenk" },

  // — Il programma —
  "Il programma": { en: "The schedule", fr: "Le programme", de: "Das Programm" },
  "Pomeriggio": { en: "Afternoon", fr: "Après-midi", de: "Nachmittag" },
  "Piscina aperta": { en: "Pool open", fr: "Piscine ouverte", de: "Pool geöffnet" },
  "Chi vuole arriva prima: bagno, sole e aperitivo di benvenuto": {
    en: "Those who want to come early: swimming, sun and welcome drinks",
    fr: "Ceux qui veulent arriver tôt : baignade, soleil et apéritif de bienvenue",
    de: "Wer früh kommen möchte: Schwimmen, Sonne und Willkommensgetränke",
  },
  "Dalle 18": { en: "From 6 PM", fr: "À partir de 18h", de: "Ab 18 Uhr" },
  "Cena insieme": { en: "Dinner together", fr: "Dîner ensemble", de: "Gemeinsames Abendessen" },
  "Pizza alla teglia dal Pizzangolo: offre la casa, niente pensieri.": {
    en: "Sheet pizza from Pizzangolo: the house treats, no worries.",
    fr: "Pizza à la fournée du Pizzangolo : la maison offre, pas d'embrouilles.",
    de: "Pizza aus dem Ofen vom Pizzangolo: das Haus spendiert, keine Sorgen.",
  },
  "Fino a tardi": { en: "Until late", fr: "Jusqu'à tard", de: "Bis spät" },
  "Musica & chill": { en: "Music & chill", fr: "Musique & chill", de: "Musik & chill" },
  "Si continua tra chiacchiere e musica": {
    en: "Keep going with chat and music",
    fr: "On continue avec des discussions et de la musique",
    de: "Wir machen weiter mit Gesprächen und Musik",
  },
  "nessuna fretta.": { en: "no rush.", fr: "aucune hâte.", de: "kein Stress." },

  // — Dove e come arrivare —
  "Come arrivare": { en: "How to get there", fr: "Comment arriver", de: "So kommst du hin" },
  "Google Maps": { en: "Google Maps", fr: "Google Maps", de: "Google Maps" },
  "Apple Maps": { en: "Apple Maps", fr: "Apple Maps", de: "Apple Maps" },

  // — Cosa portare —
  "Cosa portare": { en: "What to bring", fr: "Quoi apporter", de: "Was du mitnehmen solltest" },
  "Costume": { en: "Swimsuit", fr: "Maillot de bain", de: "Badeanzug" },
  "Ciabatte": { en: "Flip-flops", fr: "Tongs", de: "Flip-Flops" },
  "Cambio vestiti": { en: "Change of clothes", fr: "Vêtements de rechange", de: "Wechselkleidung" },
  "Asciugamano": { en: "Towel", fr: "Serviette", de: "Handtuch" },
  "Felpa per la notte": { en: "Hoodie for the night", fr: "Sweat pour la nuit", de: "Hoodie für die Nacht" },

  // — Buono a sapersi —
  "Buono a sapersi": { en: "Good to know", fr: "Bon à savoir", de: "Wichtig zu wissen" },
  "Pizza alla teglia dal Pizzangolo (Rivalta sul Mincio) — offre la casa!": {
    en: "Sheet pizza from Pizzangolo (Rivalta sul Mincio) — the house treats!",
    fr: "Pizza à la fournée du Pizzangolo (Rivalta sul Mincio) — la maison offre !",
    de: "Pizza aus dem Ofen vom Pizzangolo (Rivalta sul Mincio) — das Haus spendiert!",
  },
  "Scrivi il tuo gusto nella cartolina qui sotto entro le 21 di sabato 27 giugno.": {
    en: "Write your pizza flavor in the postcard below by 9 PM on Saturday June 27.",
    fr: "Écrivez votre saveur de pizza dans la carte postale ci-dessous avant 21h le samedi 27 juin.",
    de: "Schreibe dein Pizzaaroma auf die Postkarte unten bis 21 Uhr am Samstag 27. Juni.",
  },
  "Regalo facoltativo, nessun impegno: vieni e basta, è già festa così. Tutto molto chill.": {
    en: "Optional gift, no pressure: just come, that's already enough. All very chill.",
    fr: "Cadeau optionnel, pas d'obligation : venez simplement, c'est déjà assez. Très cool.",
    de: "Optionales Geschenk, kein Druck: Komm einfach, das ist schon genug. Alles sehr entspannt.",
  },

  // — R.S.V.P. —
  "stacca & rispondi": { en: "tear & reply", fr: "détachez & répondez", de: "abtrennen & antworten" },
  "R.S.V.P.": { en: "R.S.V.P.", fr: "R.S.V.P.", de: "R.S.V.P." },
  "Ci sei": { en: "Can you make it", fr: "Pouvez-vous venir", de: "Kannst du kommen" },
  "Fammelo sapere entro": { en: "Let me know by", fr: "Faites-moi savoir avant", de: "Sag mir Bescheid bis" },
  "nessun impegno, è tutto chill.": { en: "no pressure, all very chill.", fr: "aucune obligation, c'est très cool.", de: "kein Druck, alles sehr entspannt." },

  // — Grazie —
  "Grazie, segnato!": { en: "Thanks, noted!", fr: "Merci, noté !", de: "Danke, notiert!" },
  "Ci vediamo": { en: "See you", fr: "À bientôt", de: "Bis bald" },
  "Trovi il tuo nome nella lista qui sotto.": {
    en: "You'll find your name in the list below.",
    fr: "Vous trouverez votre nom dans la liste ci-dessous.",
    de: "Du findest deinen Namen in der Liste unten.",
  },

  // — Passi del form —
  "Scrivi il tuo nome": { en: "Write your name", fr: "Écrivez votre nom", de: "Schreibe deinen Namen" },
  "Dimmi se vieni": { en: "Tell me if you're coming", fr: "Dites-moi si vous venez", de: "Sag mir, ob du kommst" },
  "Gusto pizza (se vuoi)": { en: "Pizza flavor (if you want)", fr: "Saveur de pizza (si vous voulez)", de: "Pizzaaroma (wenn du möchtest)" },

  // — Form labels —
  "Il tuo nome": { en: "Your name", fr: "Votre nom", de: "Dein Name" },
  "Es. Marco": { en: "e.g., Marco", fr: "ex. Marco", de: "z.B. Marco" },
  "Ci sarai?": { en: "Will you be there?", fr: "Serez-vous là ?", de: "Wirst du da sein?" },
  "Ci sono al pomeriggio": { en: "I'll be there in the afternoon", fr: "Je serai là l'après-midi", de: "Ich bin am Nachmittag da" },
  "bagno in piscina": { en: "swimming in the pool", fr: "baignade à la piscine", de: "Schwimmen im Pool" },
  "Resto a cena": { en: "I'll stay for dinner", fr: "Je reste pour le dîner", de: "Ich bleibe zum Abendessen" },
  "dalle 18 in poi": { en: "from 6 PM onwards", fr: "à partir de 18h", de: "ab 18 Uhr" },
  "Non riesco a venire": { en: "I can't make it", fr: "Je ne peux pas venir", de: "Ich kann nicht kommen" },
  "sarò con voi col pensiero": { en: "I'll be with you in spirit", fr: "Je serai avec vous en pensée", de: "Ich bin im Gedanken bei euch" },

  // — Pizza field —
  "Gusto pizza (facoltativo)": { en: "Pizza flavor (optional)", fr: "Saveur de pizza (optionnel)", de: "Pizzaaroma (optional)" },
  "Es. margherita, patate, würstel, prosciutto…": {
    en: "e.g., margherita, potatoes, sausage, ham…",
    fr: "ex. margherita, pommes de terre, saucisse, jambon…",
    de: "z.B. Margherita, Kartoffeln, Wurst, Schinken…",
  },
  "Prenoto i gusti al Pizzangolo (Rivalta) entro": {
    en: "I order the flavors from Pizzangolo (Rivalta) by",
    fr: "Je commande les saveurs au Pizzangolo (Rivalta) avant",
    de: "Ich bestelle die Geschmacksrichtungen beim Pizzangolo (Rivalta) bis",
  },
  "Prenotazione pizze chiusa (scadenza:": {
    en: "Pizza booking closed (deadline:",
    fr: "Réservation de pizza fermée (date limite :",
    de: "Pizzabestellung geschlossen (Frist:",
  },
  "Puoi comunque confermare la presenza.": {
    en: "You can still confirm your attendance.",
    fr: "Vous pouvez toujours confirmer votre présence.",
    de: "Du kannst immer noch deine Teilnahme bestätigen.",
  },

  // — Submit button —
  "Invio…": { en: "Sending…", fr: "Envoi…", de: "Wird gesendet…" },
  "Conferma la presenza": { en: "Confirm attendance", fr: "Confirmer la présence", de: "Teilnahme bestätigen" },

  // — Guest list —
  "Chi c'è": { en: "Who's coming", fr: "Qui vient", de: "Wer kommt" },
  "Ancora nessuno… sii il primo!": {
    en: "No one yet… be the first!",
    fr: "Personne encore… soyez le premier !",
    de: "Noch niemand… sei der Erste!",
  },

  // — Chiusura —
  "Con affetto, ti aspetto.": {
    en: "With love, I'm waiting for you.",
    fr: "Avec affection, je vous attends.",
    de: "Mit Zuneigung warte ich auf dich.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOSTIENI / DONAZIONI  (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  "Home": { en: "Home", fr: "Accueil", de: "Startseite" },
  "Sostieni": { en: "Support", fr: "Soutenir", de: "Unterstützen" },
  "Una piccola pagina": { en: "A small page", fr: "Une petite page", de: "Eine kleine Seite" },
  "Se ti va, puoi sostenermi.": {
    en: "If you'd like, you can support me.",
    fr: "Si tu veux, tu peux me soutenir.",
    de: "Wenn du möchtest, kannst du mich unterstützen.",
  },
  "Se qualcosa che ho fatto ti è stato utile e hai piacere di darmi una mano, puoi farlo con un bonifico — l'importo e la frequenza li decidi tu, dalla tua banca. Nessun obbligo, nessuna pressione. Grazie comunque per essere passato di qui.": {
    en: "If something I've done was useful to you and you'd like to give me a hand, you can do it with a transfer — the amount and frequency are up to you, from your bank. No obligation, no pressure. Thanks anyway for stopping by.",
    fr: "Si quelque chose que j'ai fait vous a été utile et que vous aimeriez me donner un coup de main, vous pouvez le faire par virement — le montant et la fréquence vous appartiennent, de votre banque. Aucune obligation, aucune pression. Merci quand même de votre passage.",
    de: "Wenn etwas, das ich getan habe, dir geholfen hat und du mir einen Gefallen tun möchtest, kannst du das per Überweisung tun — Betrag und Häufigkeit entscheidest du selbst, von deiner Bank. Keine Verpflichtung, kein Druck. Danke trotzdem, dass du vorbeigekommen bist.",
  },
  "Bonifico bancario": { en: "Bank transfer", fr: "Virement bancaire", de: "Banküberweisung" },
  "Solo per bonifico": { en: "For transfer only", fr: "Uniquement pour virement", de: "Nur per Überweisung" },
  "Questi dati servono esclusivamente per il bonifico. Copia ciò che ti serve e procedi dalla tua banca, con l'importo che preferisci.": {
    en: "This data is exclusively for the transfer. Copy what you need and proceed from your bank, with the amount you prefer.",
    fr: "Ces données sont exclusivement pour le virement. Copiez ce dont vous avez besoin et procédez de votre banque, avec le montant que vous préférez.",
    de: "Diese Daten sind ausschließlich für die Überweisung. Kopiere, was du brauchst, und gehe von deiner Bank weiter, mit dem Betrag, den du bevorzugst.",
  },
  "Beneficiario": { en: "Beneficiary", fr: "Bénéficiaire", de: "Begünstigter" },
  "IBAN": { en: "IBAN", fr: "IBAN", de: "IBAN" },
  "BIC / SWIFT": { en: "BIC / SWIFT", fr: "BIC / SWIFT", de: "BIC / SWIFT" },
  "Banca corrispondente (BIC)": { en: "Correspondent bank (BIC)", fr: "Banque correspondante (BIC)", de: "Korrespondenzbank (BIC)" },
  "Codice fiscale": { en: "Tax code", fr: "Code fiscal", de: "Steuernummer" },
  "Banca": { en: "Bank", fr: "Banque", de: "Bank" },
  "Causale (facoltativa)": { en: "Description (optional)", fr: "Description (facultatif)", de: "Beschreibung (optional)" },
  "Copiato": { en: "Copied", fr: "Copié", de: "Kopiert" },
  "Libro dei donatori": { en: "Donor book", fr: "Livre des donateurs", de: "Spenderbuch" },
  "Se vuoi lasciare un segno del tuo passaggio, firma qui. È facoltativo.": {
    en: "If you'd like to leave a mark of your visit, sign here. It's optional.",
    fr: "Si vous souhaitez laisser une trace de votre passage, signez ici. C'est facultatif.",
    de: "Wenn du eine Spur deines Besuchs hinterlassen möchtest, unterschreib hier. Es ist optional.",
  },
  "Grazie.": { en: "Thank you.", fr: "Merci.", de: "Danke." },
  "La tua firma è nel libro.": { en: "Your signature is in the book.", fr: "Votre signature est dans le livre.", de: "Deine Unterschrift ist im Buch." },
  "Es. Mario R.": { en: "e.g., Mario R.", fr: "ex. Mario R.", de: "z.B. Mario R." },
  "Due parole (facoltative)": { en: "A few words (optional)", fr: "Un message (facultatif)", de: "Ein paar Worte (optional)" },
  "Un saluto…": { en: "A greeting…", fr: "Un salut…", de: "Ein Gruß…" },
  "Firma il libro": { en: "Sign the book", fr: "Signer le livre", de: "Das Buch unterzeichnen" },
  "Firmo…": { en: "Signing…", fr: "Signature…", de: "Unterschreibe…" },
  "Sponsor": { en: "Sponsor", fr: "Sponsor", de: "Sponsor" },
  "4,99€": { en: "4.99€", fr: "4,99€", de: "4,99€" },
  "Se hai un progetto o un'attività, puoi comparire tra gli sponsor con un piccolo contributo. Lasciami i dati e ne parliamo con calma: ti scrivo io.": {
    en: "If you have a project or business, you can appear as a sponsor with a small contribution. Send me your details and we'll discuss it calmly: I'll write to you.",
    fr: "Si vous avez un projet ou une entreprise, vous pouvez apparaître comme sponsor avec une petite contribution. Envoyez-moi vos coordonnées et nous en discuterons calmement : je vous écrirai.",
    de: "Wenn du ein Projekt oder ein Geschäft hast, kannst du mit einem kleinen Beitrag als Sponsor erscheinen. Schreib mir deine Daten und wir besprechen es in aller Ruhe: ich schreibe dir.",
  },
  "Nome / Brand": { en: "Name / Brand", fr: "Nom / Marque", de: "Name / Marke" },
  "La tua attività": { en: "Your business", fr: "Votre activité", de: "Dein Geschäft" },
  "Link (sito o social)": { en: "Link (website or social)", fr: "Lien (site ou réseaux sociaux)", de: "Link (Website oder Sozial)" },
  "https://…": { en: "https://…", fr: "https://…", de: "https://…" },
  "Messaggio (facoltativo)": { en: "Message (optional)", fr: "Message (facultatif)", de: "Nachricht (optional)" },
  "Cosa vorresti promuovere?": {
    en: "What would you like to promote?",
    fr: "Qu'aimeriez-vous promouvoir ?",
    de: "Was möchtest du bewerben?",
  },
  "Scrivimi su WhatsApp": { en: "Message me on WhatsApp", fr: "Écrivez-moi sur WhatsApp", de: "Schreib mir auf WhatsApp" },
  "Scrivimi via email": { en: "Email me", fr: "Écrivez-moi par e-mail", de: "Schreib mir eine E-Mail" },
  "Chi è passato di qui": { en: "Who's been here", fr: "Qui est passé par ici", de: "Wer ist hier vorbeigekommen" },
  "Anteprima locale: le firme restano su questo dispositivo finché il backend non è collegato.": {
    en: "Local preview: signatures remain on this device until the backend is connected.",
    fr: "Aperçu local : les signatures restent sur cet appareil jusqu'à ce que le backend soit connecté.",
    de: "Lokale Vorschau: Signaturen bleiben auf diesem Gerät, bis das Backend verbunden ist.",
  },
  "Donatori": { en: "Donors", fr: "Donateurs", de: "Spender" },
  "Carico…": { en: "Loading…", fr: "Chargement…", de: "Wird geladen…" },
  "Ancora nessuna firma.": { en: "No signatures yet.", fr: "Pas encore de signatures.", de: "Noch keine Unterschriften." },
  "Non sono riuscito a registrare la firma. Riprova tra poco.": { en: "Failed to register your signature. Try again shortly.", fr: "Impossible d'enregistrer ta signature. Réessaye bientôt.", de: "Deine Unterschrift konnte nicht registriert werden. Versuche es in Kürze erneut." },
  "Inserisci almeno il nome o il brand.": { en: "Enter at least a name or brand.", fr: "Saisis au moins un nom ou une marque.", de: "Geben Sie mindestens einen Namen oder eine Marke ein." },
  "Per qualsiasi cosa, sono qui.": { en: "For anything, I'm here.", fr: "Pour tout, je suis là.", de: "Für alles bin ich hier." },
  "ora": { en: "now", fr: "à l'instant", de: "gerade" },
  "min fa": { en: "min ago", fr: "min", de: "vor min" },
  "h fa": { en: "h ago", fr: "h", de: "vor h" },
  "g fa": { en: "d ago", fr: "j", de: "vor d" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHIVIO  (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  // — Colonne della tabella —
  "Nome": { en: "Name", fr: "Nom", de: "Name" },
  "Ultima modifica": { en: "Modified", fr: "Dernière modification", de: "Geändert" },
  "Tipo": { en: "Type", fr: "Type", de: "Typ" },
  "Dimensione": { en: "Size", fr: "Taille", de: "Größe" },
  "Data creazione": { en: "Created", fr: "Date de création", de: "Erstellt" },
  "Autori": { en: "Authors", fr: "Auteurs", de: "Autoren" },
  "Categorie": { en: "Categories", fr: "Catégories", de: "Kategorien" },
  "Tag": { en: "Tags", fr: "Étiquettes", de: "Tags" },
  "Titolo": { en: "Title", fr: "Titre", de: "Titel" },

  // — Cartelle principali —
  "Esame di Maturità": { en: "High School Diploma", fr: "Examen de Bac", de: "Abitur" },
  "Giochi Web": { en: "Web Games", fr: "Jeux Web", de: "Web-Spiele" },
  "Siti web": { en: "Websites", fr: "Sites web", de: "Websites" },
  "Documenti": { en: "Documents", fr: "Documents", de: "Dokumente" },

  // — Toolbar —
  "Nuovo": { en: "New", fr: "Nouveau", de: "Neu" },
  "Taglia": { en: "Cut", fr: "Couper", de: "Ausschneiden" },
  "Copia": { en: "Copy", fr: "Copier", de: "Kopieren" },
  "Incolla": { en: "Paste", fr: "Coller", de: "Einfügen" },
  "Rinomina": { en: "Rename", fr: "Renommer", de: "Umbenennen" },
  "Condividi": { en: "Share", fr: "Partager", de: "Teilen" },
  "Elimina": { en: "Delete", fr: "Supprimer", de: "Löschen" },
  "Ordina": { en: "Sort", fr: "Trier", de: "Sortieren" },
  "Inverti ordinamento": { en: "Reverse sort", fr: "Inverser le tri", de: "Sortierung umkehren" },
  "Altro": { en: "More", fr: "Plus", de: "Mehr" },

  // — Vista e layout —
  "Vista dettagli": { en: "Details view", fr: "Vue détails", de: "Detailansicht" },
  "Vista icone": { en: "Icons view", fr: "Vue icônes", de: "Symbolansicht" },
  "Riquadro dettagli": { en: "Details pane", fr: "Volet détails", de: "Detailbereich" },

  // — Navigazione —
  "Su": { en: "Up", fr: "Parent", de: "Nach oben" },
  "Aggiorna": { en: "Refresh", fr: "Actualiser", de: "Aktualisieren" },
  "Questo PC": { en: "This PC", fr: "Cet ordinateur", de: "Dieser PC" },
  "Archivio": { en: "Archive", fr: "Archives", de: "Archiv" },

  // — Sidebar —
  "In evidenza": { en: "Favorites", fr: "En évidence", de: "Favoriten" },
  "Posizioni": { en: "Locations", fr: "Emplacements", de: "Speicherorte" },

  // — Sezioni —
  "Cartelle in evidenza": { en: "Featured folders", fr: "Dossiers en évidence", de: "Ausgewählte Ordner" },
  "Tutti gli elementi": { en: "All items", fr: "Tous les éléments", de: "Alle Elemente" },

  // — Ricerca —
  "Cerca nell'archivio": { en: "Search archive", fr: "Rechercher dans l'archive", de: "Im Archiv suchen" },

  // — Controlli finestra —
  "Riduci a icona": { en: "Minimize", fr: "Réduire", de: "Minimieren" },
  "Ingrandisci": { en: "Maximize", fr: "Agrandir", de: "Maximieren" },

  // — Flash messages —
  "Link copiato negli appunti": { en: "Link copied to clipboard", fr: "Lien copié dans le presse-papiers", de: "Link in Zwischenablage kopiert" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROGETTI, SOCIAL, TECH STACK E VARI (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  "GitHub": { en: "GitHub", fr: "GitHub", de: "GitHub" },
  "Instagram": { en: "Instagram", fr: "Instagram", de: "Instagram" },
  "WhatsApp": { en: "WhatsApp", fr: "WhatsApp", de: "WhatsApp" },
  "TikTok": { en: "TikTok", fr: "TikTok", de: "TikTok" },
  "X (Twitter)": { en: "X (Twitter)", fr: "X (Twitter)", de: "X (Twitter)" },
  "YouTube": { en: "YouTube", fr: "YouTube", de: "YouTube" },
  "Telegram": { en: "Telegram", fr: "Telegram", de: "Telegram" },
  "Snapchat": { en: "Snapchat", fr: "Snapchat", de: "Snapchat" },
  "Trivia": { en: "Trivia", fr: "Trivia", de: "Trivia" },
  "Movimento": { en: "Movement", fr: "Mouvement", de: "Bewegung" },
  "Cascina Fontana": { en: "Cascina Fontana", fr: "Cascina Fontana", de: "Cascina Fontana" },
  "Rivalta sul Mincio": { en: "Rivalta sul Mincio", fr: "Rivalta sul Mincio", de: "Rivalta sul Mincio" },
  "👋 Bio": { en: "👋 Bio", fr: "👋 Bio", de: "👋 Bio" },
  "Dubliners": { en: "Dubliners", fr: "Dubliners", de: "Dubliners" },
  "The Leopard": { en: "The Leopard", fr: "Le Guépard", de: "Der Leopard" },
  "About Me": { en: "About Me", fr: "À propos", de: "Über mich" },
  "PCTO": { en: "PCTO", fr: "PCTO", de: "PCTO" },
  "⚙️ Stack": { en: "⚙️ Stack", fr: "⚙️ Pile", de: "⚙️ Stapel" },
  "React 18.3": { en: "React 18.3", fr: "React 18.3", de: "React 18.3" },
  "TypeScript strict": { en: "TypeScript strict", fr: "TypeScript strict", de: "TypeScript strict" },
  "Vite 6.3": { en: "Vite 6.3", fr: "Vite 6.3", de: "Vite 6.3" },
  "Tailwind 4.1": { en: "Tailwind 4.1", fr: "Tailwind 4.1", de: "Tailwind 4.1" },
  "Radix UI": { en: "Radix UI", fr: "Radix UI", de: "Radix UI" },
  "Motion 12": { en: "Motion 12", fr: "Motion 12", de: "Motion 12" },
  "React Router 7": { en: "React Router 7", fr: "React Router 7", de: "React Router 7" },
  "Supabase": { en: "Supabase", fr: "Supabase", de: "Supabase" },
  "Supabase backend": { en: "Supabase backend", fr: "Backend Supabase", de: "Supabase-Backend" },
  "Claude Opus 4.8": { en: "Claude Opus 4.8", fr: "Claude Opus 4.8", de: "Claude Opus 4.8" },
  "Pinterest": { en: "Pinterest", fr: "Pinterest", de: "Pinterest" },
  "Reddit": { en: "Reddit", fr: "Reddit", de: "Reddit" },
  "Twitch": { en: "Twitch", fr: "Twitch", de: "Twitch" },
  "Spotify": { en: "Spotify", fr: "Spotify", de: "Spotify" },
  "Threads": { en: "Threads", fr: "Threads", de: "Threads" },
  "Steam": { en: "Steam", fr: "Steam", de: "Steam" },
  "Vinted": { en: "Vinted", fr: "Vinted", de: "Vinted" },
  "Subito.it": { en: "Subito.it", fr: "Subito.it", de: "Subito.it" },
  "OpenStreetMap": { en: "OpenStreetMap", fr: "OpenStreetMap", de: "OpenStreetMap" },
  "Auto": { en: "Auto", fr: "Auto", de: "Auto" },
  "IT": { en: "IT", fr: "IT", de: "IT" },
  "Italiano": { en: "Italian", fr: "Italien", de: "Italienisch" },
  "«Carlo d'Arco»": { en: "«Carlo d'Arco»", fr: "«Carlo d'Arco»", de: "«Carlo d'Arco»" },
  "Next.js": { en: "Next.js", fr: "Next.js", de: "Next.js" },
  "TypeScript": { en: "TypeScript", fr: "TypeScript", de: "TypeScript" },
  "Sport": { en: "Sport", fr: "Sport", de: "Sport" },
  "HTML5": { en: "HTML5", fr: "HTML5", de: "HTML5" },
  "CSS3": { en: "CSS3", fr: "CSS3", de: "CSS3" },
  "JavaScript": { en: "JavaScript", fr: "JavaScript", de: "JavaScript" },
  "React": { en: "React", fr: "React", de: "React" },
  "Tailwind CSS": { en: "Tailwind CSS", fr: "Tailwind CSS", de: "Tailwind CSS" },
  "GSAP": { en: "GSAP", fr: "GSAP", de: "GSAP" },
  "Design & UX": { en: "Design & UX", fr: "Design & UX", de: "Design & UX" },
  "UI/UX Design": { en: "UI/UX Design", fr: "Design UI/UX", de: "UI/UX-Design" },
  "Figma": { en: "Figma", fr: "Figma", de: "Figma" },
  "Design System": { en: "Design System", fr: "Design System", de: "Design System" },
  "Bootstrap Italia": { en: "Bootstrap Italia", fr: "Bootstrap Italia", de: "Bootstrap Italia" },
  "Responsive Design": { en: "Responsive Design", fr: "Design Responsive", de: "Responsive Design" },
  "AI-assisted development": { en: "AI-assisted development", fr: "Développement assisté par l'IA", de: "KI-gestützte Entwicklung" },
  "Codex": { en: "Codex", fr: "Codex", de: "Codex" },
  "GitHub Copilot": { en: "GitHub Copilot", fr: "GitHub Copilot", de: "GitHub Copilot" },
  "Gemini": { en: "Gemini", fr: "Gemini", de: "Gemini" },
  "DeepSeek": { en: "DeepSeek", fr: "DeepSeek", de: "DeepSeek" },
  "Grok": { en: "Grok", fr: "Grok", de: "Grok" },
  "Tools & Workflow": { en: "Tools & Workflow", fr: "Outils & Workflow", de: "Tools & Workflow" },
  "Vite": { en: "Vite", fr: "Vite", de: "Vite" },
  "Vercel": { en: "Vercel", fr: "Vercel", de: "Vercel" },
  "VS Code": { en: "VS Code", fr: "VS Code", de: "VS Code" },
  "PowerShell": { en: "PowerShell", fr: "PowerShell", de: "PowerShell" },
  "LaTeX / Overleaf": { en: "LaTeX / Overleaf", fr: "LaTeX / Overleaf", de: "LaTeX / Overleaf" },
  "Windows & IT Support": { en: "Windows & IT Support", fr: "Windows & Support IT", de: "Windows & IT-Support" },
  "Adobe Premiere Pro": { en: "Adobe Premiere Pro", fr: "Adobe Premiere Pro", de: "Adobe Premiere Pro" },
  "Canva": { en: "Canva", fr: "Canva", de: "Canva" },
  "iPhone 16 Pro": { en: "iPhone 16 Pro", fr: "iPhone 16 Pro", de: "iPhone 16 Pro" },
  "CAT technical area": { en: "CAT technical area", fr: "Zone technique CAT", de: "CAT-Fachbereich" },
  "AutoCAD": { en: "AutoCAD", fr: "AutoCAD", de: "AutoCAD" },
  "PE": { en: "PE", fr: "PE", de: "PE" },
  "PAR": { en: "PAR", fr: "PAR", de: "PAR" },
  "OL": { en: "OL", fr: "OL", de: "OL" },
  "Streak": { en: "Streak", fr: "Streak", de: "Streak" },
  "lett": { en: "lett", fr: "lett", de: "lett" },
  "Menu": { en: "Menu", fr: "Menu", de: "Menü" },
  "A–Z": { en: "A–Z", fr: "A–Z", de: "A–Z" },
  "ANG": { en: "ANG", fr: "ANG", de: "ANG" },
  "TRI": { en: "TRI", fr: "TRI", de: "TRI" },
  "VI": { en: "VI", fr: "VI", de: "VI" },

  // ═══════════════════════════════════════════════════════════════════════════
  // LETTERATURA (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  "Gente di Dublino": { en: "Dubliners", fr: "Gens de Dublin", de: "Dubliners" },
  "«Dubliners» — James Joyce, 1914": { en: "«Dubliners» — James Joyce, 1914", fr: "«Dubliners» — James Joyce, 1914", de: "«Dubliners» — James Joyce, 1914" },
  "Quindici racconti da una città che non lascia andare nessuno.": { en: "Fifteen stories from a city that lets no one go.", fr: "Quinze histoires d'une ville qui ne laisse partir personne.", de: "Fünfzehn Geschichten aus einer Stadt, die niemanden loslässt." },
  "01 — L'autore": { en: "01 — The Author", fr: "01 — L'auteur", de: "01 — Der Autor" },
  "Chi è James Joyce": { en: "Who is James Joyce", fr: "Qui est James Joyce", de: "Wer ist James Joyce" },
  "15 racconti": { en: "15 stories", fr: "15 histoires", de: "15 Geschichten" },
  "Storie brevi e indipendenti": { en: "Short and independent stories", fr: "Histoires brèves et indépendantes", de: "Kurze und unabhängige Geschichten" },
  "Una sola città, sempre lei": { en: "One city alone, always the same", fr: "Une seule ville, toujours la même", de: "Eine einzige Stadt, immer dieselbe" },
  "James Joyce (1882 — 1941)": { en: "James Joyce (1882 — 1941)", fr: "James Joyce (1882 — 1941)", de: "James Joyce (1882 — 1941)" },
  "02 — Il libro": { en: "02 — The Book", fr: "02 — Le Livre", de: "02 — Das Buch" },
  "Che cos'è «Gente di Dublino»": { en: "What is «Dubliners»", fr: "Qu'est-ce que «Dubliners»", de: "Was ist «Dubliners»" },
  "Non un romanzo, ma una raccolta di 15 storie brevi": { en: "Not a novel, but a collection of 15 short stories", fr: "Pas un roman, mais un recueil de 15 histoires courtes", de: "Kein Roman, sondern eine Sammlung von 15 Kurzgeschichten" },
  "Dublino, l'unica protagonista": { en: "Dublin, the sole protagonist", fr: "Dublin, la seule protagoniste", de: "Dublin, die einzige Protagonistin" },
  "Infanzia": { en: "Childhood", fr: "Enfance", de: "Kindheit" },
  "i primi racconti": { en: "the first stories", fr: "les premières histoires", de: "die ersten Geschichten" },
  "Adolescenza": { en: "Adolescence", fr: "Adolescence", de: "Adoleszenz" },
  "il risveglio": { en: "the awakening", fr: "l'éveil", de: "das Erwachen" },
  "Maturità": { en: "Maturity", fr: "Maturité", de: "Reife" },
  "la vita adulta": { en: "adult life", fr: "la vie adulte", de: "das Erwachsenenleben" },
  "Vita pubblica": { en: "Public life", fr: "Vie publique", de: "Öffentliches Leben" },
  "la città intera": { en: "the whole city", fr: "toute la ville", de: "die ganze Stadt" },
  "03 — I personaggi": { en: "03 — The Characters", fr: "03 — Les Personnages", de: "03 — Die Charaktere" },
  "Gente comune, nessun eroe": { en: "Ordinary people, no heroes", fr: "Gens ordinaires, pas de héros", de: "Gewöhnliche Menschen, keine Helden" },
  "Bambini": { en: "Children", fr: "Enfants", de: "Kinder" },
  "Ragazze": { en: "Girls", fr: "Filles", de: "Mädchen" },
  "Commessi": { en: "Clerks", fr: "Commis", de: "Angestellte" },
  "Insegnanti": { en: "Teachers", fr: "Enseignants", de: "Lehrer" },
  "Impiegati": { en: "Employees", fr: "Employés", de: "Arbeitnehmer" },
  "Donne sposate": { en: "Married women", fr: "Femmes mariées", de: "Verheiratete Frauen" },
  "Uomini stanchi": { en: "Tired men", fr: "Hommes fatigués", de: "Müde Männer" },
  "04 — La trama": { en: "04 — The Plot", fr: "04 — L'Intrigue", de: "04 — Die Handlung" },
  "Cosa succede? Quasi niente": { en: "What happens? Almost nothing", fr: "Qu'est-ce qui se passe ? Presque rien", de: "Was passiert? Fast nichts" },
  "Un ragazzo scopre il desiderio — e la vergogna": { en: "A boy discovers desire — and shame", fr: "Un garçon découvre le désir — et la honte", de: "Ein Junge entdeckt Lust — und Schande" },
  "Una ragazza sogna di scappare di casa… e non parte": { en: "A girl dreams of running away from home… and doesn't leave", fr: "Une fille rêve de s'enfuir de chez elle… et ne part pas", de: "Ein Mädchen träumt davon, von zu Hause abzuhauen… und geht nicht" },
  "Un uomo è annoiato a morte dalla sua vita": { en: "A man is bored to death with his life", fr: "Un homme s'ennuie à mort de sa vie", de: "Ein Mann ist zu Tode von seinem Leben gelangweilt" },
  "«epifanie»": { en: "«epiphanies»", fr: "«épiphanies»", de: "«Epiphanien»" },
  "05 — Il tema": { en: "05 — The Theme", fr: "05 — Le Thème", de: "05 — Das Thema" },
  "Una parola: intrappolati": { en: "One word: trapped", fr: "Un mot : piégés", de: "Ein Wort: gefangen" },
  "La povertà": { en: "Poverty", fr: "La pauvreté", de: "Armut" },
  "La religione": { en: "Religion", fr: "La religion", de: "Religion" },
  "La famiglia": { en: "The family", fr: "La famille", de: "Die Familie" },
  "La monotonia": { en: "Monotony", fr: "La monotonie", de: "Monotonie" },
  "«paralisi»": { en: "«paralysis»", fr: "«paralysie»", de: "«Lähmung»" },
  "06 — Perché conta": { en: "06 — Why It Matters", fr: "06 — Pourquoi c'est important", de: "06 — Warum es wichtig ist" },
  "Joyce racconta tutto questo in modo realistico e crudo": { en: "Joyce tells all of this in a realistic and raw way", fr: "Joyce raconte tout cela de manière réaliste et crue", de: "Joyce erzählt das alles auf realistische und rohe Weise" },
  "È uno dei primi libri davvero moderni a fare così": { en: "It is one of the first truly modern books to do so", fr: "C'est l'un des premiers véritablement modernes à le faire", de: "Es ist eines der ersten wirklich modernen Bücher, die es tun" },
  "In sintesi": { en: "In summary", fr: "En résumé", de: "Zusammenfassend" },
  "La cosa principale": { en: "The main thing", fr: "La chose principale", de: "Die Hauptsache" },
  "Un libro sulla gente comune che soffre in silenzio, intrappolata in una città grigia.": { en: "A book about ordinary people who suffer in silence, trapped in a gray city.", fr: "Un livre sur les gens ordinaires qui souffrent en silence, piégés dans une ville grise.", de: "Ein Buch über gewöhnliche Menschen, die in einer grauen Stadt schweigend leiden und gefangen sind." },
  "Realismo crudo": { en: "Raw realism", fr: "Réalisme brut", de: "Roher Realismus" },
  "Nessun moralismo": { en: "No moralism", fr: "Pas de moralisme", de: "Kein Moralismus" },
  "La vera Dublino": { en: "The real Dublin", fr: "La vrai Dublin", de: "Das echte Dublin" },
  "Citazione di chiusura": { en: "Closing quote", fr: "Citation de clôture", de: "Abschlussangebot" },
  "La neve cadeva lieve su tutto il paese su tutti i vivi e su tutti i morti.": { en: "Snow was falling gently upon all the living and the dead.", fr: "La neige tombait doucement sur tous les vivants et tous les morts.", de: "Der Schnee fiel sanft auf alle Lebenden und Toten herab." },
  "da «I morti» — l'ultimo dei quindici racconti": { en: "from «The Dead» — the last of the fifteen stories", fr: "de «Les Morts» — la dernière des quinze histoires", de: "aus «Die Toten» — der letzte der fünfzehn Geschichten" },
  "Continua · l'altro approfondimento": { en: "Continue · the other in-depth look", fr: "Continuer · l'autre aperçu approfondi", de: "Fortfahren · die andere Vertiefung" },

  // ═══════════════════════════════════════════════════════════════════════════
  // GATTOPARDO (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  "Il Gattopardo": { en: "The Leopard", fr: "Le Guépard", de: "Der Leopard" },
  "Tomasi di Lampedusa, 1958 — un principe siciliano guarda il suo mondo finire.": { en: "Tomasi di Lampedusa, 1958 — a Sicilian prince watches his world end.", fr: "Tomasi di Lampedusa, 1958 — un prince sicilien regarde son monde prendre fin.", de: "Tomasi di Lampedusa, 1958 — ein sizilianischer Prinz sieht seine Welt enden." },
  "«Il Gattopardo» — Tomasi di Lampedusa, 1958": { en: "«The Leopard» — Tomasi di Lampedusa, 1958", fr: "«Le Guépard» — Tomasi di Lampedusa, 1958", de: "«Der Leopard» — Tomasi di Lampedusa, 1958" },
  "Un principe siciliano guarda il suo mondo finire — e capisce che deve cambiare.": { en: "A Sicilian prince watches his world end — and understands he must change.", fr: "Un prince sicilien regarde son monde prendre fin — et comprend qu'il doit changer.", de: "Ein sizilianischer Prinz sieht seine Welt enden — und versteht, dass er sich ändern muss." },
  "Chi è Tomasi di Lampedusa": { en: "Who is Tomasi di Lampedusa", fr: "Qui est Tomasi di Lampedusa", de: "Wer ist Tomasi di Lampedusa" },
  "Un solo romanzo": { en: "One single novel", fr: "Un seul roman", de: "Ein einziger Roman" },
  "dopo la morte": { en: "after his death", fr: "après sa mort", de: "nach seinem Tod" },
  "La sua unica opera — questa": { en: "His only work — this one", fr: "Son seul ouvrage — celui-ci", de: "Sein einziges Werk — dieses hier" },
  "Sicilia, 1860": { en: "Sicily, 1860", fr: "Sicile, 1860", de: "Sizilien, 1860" },
  "L'anno dell'Unità d'Italia": { en: "The year of Italian Unification", fr: "L'année de l'unification italienne", de: "Das Jahr der italienischen Einigung" },
  "Giuseppe Tomasi di Lampedusa (1896 — 1957)": { en: "Giuseppe Tomasi di Lampedusa (1896 — 1957)", fr: "Giuseppe Tomasi di Lampedusa (1896 — 1957)", de: "Giuseppe Tomasi di Lampedusa (1896 — 1957)" },
  "Un romanzo storico ambientato in Sicilia nel 1860, quando l'Italia si unisce.": { en: "A historical novel set in Sicily in 1860, when Italy unifies.", fr: "Un roman historique situé en Sicile en 1860, quand l'Italie s'unifie.", de: "Ein historischer Roman, der 1860 auf Sizilien spielt, als sich Italien vereinigt." },
  "Una famiglia nobile — i Salina": { en: "A noble family — the Salinas", fr: "Une famille noble — les Salina", de: "Eine edle Familie — die Salinas" },
  "Il Principe Fabrizio": { en: "Prince Fabrizio", fr: "Le Prince Fabrizio", de: "Prinz Fabrizio" },
  "il «Gattopardo»: anziano e lucido, sa che la sua epoca finisce": { en: "the «Leopard»: elderly and lucid, he knows his era is ending", fr: "le «Guépard» : âgé et lucide, il sait que son époque se termine", de: "der «Leopard»: alt und klar, er weiß, dass seine Ära endet" },
  "Tancredi": { en: "Tancredi", fr: "Tancredi", de: "Tancredi" },
  "il nipote giovane e ambizioso, che si adatta ai nuovi tempi": { en: "the young and ambitious nephew, who adapts to the new times", fr: "le jeune et ambitieux neveu, qui s'adapte aux nouveaux temps", de: "der junge und ehrgeizige Neffe, der sich den neuen Zeiten anpasst" },
  "I Salina": { en: "The Salinas", fr: "Les Salina", de: "Die Salinas" },
  "moglie, figli, servi: tutta l'aristocrazia siciliana": { en: "wife, children, servants: all the Sicilian aristocracy", fr: "épouse, enfants, serviteurs : toute l'aristocratie sicilienne", de: "Ehefrau, Kinder, Diener: der gesamte sizilianische Adel" },
  "Fuori dal palazzo, la Storia corre": { en: "Outside the palace, History rushes on", fr: "En dehors du palais, l'Histoire s'accélère", de: "Außerhalb des Palastes eilt die Geschichte voran" },
  "Garibaldi sbarca in Sicilia": { en: "Garibaldi lands in Sicily", fr: "Garibaldi débarque en Sicile", de: "Garibaldi landet auf Sizilien" },
  "Il Re arriva Vittorio Emanuele II": { en: "The King arrives Vittorio Emanuele II", fr: "Le Roi arrive Vittorio Emanuele II", de: "Der König kommt Vittorio Emanuele II an" },
  "Il feudo l'ordine antico crolla": { en: "The feudal ancient order collapses", fr: "L'ordre féodal ancien s'effondre", de: "Die alte feudale Ordnung bricht zusammen" },
  "Il Principe capisce che, per sopravvivere, la famiglia deve adattarsi": { en: "The Prince understands that, to survive, the family must adapt", fr: "Le Prince comprend que, pour survivre, la famille doit s'adapter", de: "Der Prinz versteht, dass sich die Familie, um zu überleben, anpassen muss" },
  "così Tancredi sposa Angelica, la bellissima figlia del sindaco — ricco, ma borghese": { en: "so Tancredi marries Angelica, the beautiful daughter of the mayor — rich, but bourgeois", fr: "donc Tancredi épouse Angelica, la belle fille du maire — riche, mais bourgeoise", de: "also heiratet Tancredi Angelica, die schöne Tochter des Bürgermeisters — reich, aber bürgerlich" },
  "La Chiesa perde influenza, il denaro cambia mani: tutto si trasforma.": { en: "The Church loses influence, money changes hands: everything transforms.", fr: "L'Église perd de l'influence, l'argent change de mains : tout se transforme.", de: "Die Kirche verliert an Einfluss, Geld wechselt die Besitzer: alles transformiert sich." },
  "Una frase che spiega tutto": { en: "One phrase that explains everything", fr: "Une phrase qui explique tout", de: "Ein Satz, der alles erklärt" },
  "«Se vogliamo che tutto rimanga come è, bisogna che tutto cambi.» — Tancredi, al Principe": { en: "«If we want everything to stay as it is, everything must change.» — Tancredi, to the Prince", fr: "«Si nous voulons que tout reste comme il est, il faut que tout change.» — Tancredi, au Prince", de: "«Wenn wir wollen, dass alles so bleibt wie es ist, muss sich alles ändern.» — Tancredi zum Prinzen" },
  "Il Principe sa di non poter fermare la Storia. La scelta è una sola: o ti adatti e sopravvivi, o muori. Non c'è una terza via — ed è proprio cambiando qualcosa che si riesce a conservare il resto.": { en: "The Prince knows he cannot stop History. There is only one choice: either you adapt and survive, or you die. There is no third way — and it is by changing something that the rest is preserved.", fr: "Le Prince sait qu'il ne peut pas arrêter l'Histoire. Il n'y a qu'un seul choix : soit vous vous adaptez et survivez, soit vous mourez. Il n'y a pas de troisième voie — et c'est en changeant quelque chose qu'on préserve le reste.", de: "Der Prinz weiß, dass er die Geschichte nicht aufhalten kann. Es gibt nur eine Wahl: Entweder man passt sich an und überlebt, oder man stirbt. Es gibt keinen dritten Weg — und nur durch die Veränderung von etwas bewahrt man den Rest." },
  "Un tramonto sulla Sicilia: la fine di un'epoca": { en: "A sunset over Sicily: the end of an era", fr: "Un coucher de soleil sur la Sicile : la fin d'une époque", de: "Ein Sonnenuntergang über Sizilien: das Ende einer Ära" },
  "Come va a finire": { en: "How it ends", fr: "Comment cela se termine", de: "Wie es endet" },
  "Il Principe muore.": { en: "The Prince dies.", fr: "Le Prince meurt.", de: "Der Prinz stirbt." },
  "La famiglia continua, ma non è più quella di prima. La Sicilia è ormai trasformata: un mondo intero si è chiuso alle spalle dei Salina, per sempre.": { en: "The family continues, but it is no longer what it was before. Sicily is now transformed: an entire world has closed behind the Salinas, forever.", fr: "La famille continue, mais elle n'est plus ce qu'elle était avant. La Sicile est maintenant transformée : un monde entier s'est fermé derrière les Salina, pour toujours.", de: "Die Familie setzt sich fort, aber sie ist nicht mehr das, was sie vorher war. Sizilien ist jetzt transformiert: Eine ganze Welt hat sich hinter den Salinas für immer geschlossen." },
  "Racconta il Risorgimento da un punto di vista insolito: quello dei perdenti, l'aristocrazia che esce di scena. È scritto in modo bellissimo e poetico, con una prosa raffinata. E mostra una verità spietata: la Storia travolge tutti, anche i più intelligenti e consapevoli.": { en: "It tells the Risorgimento from an unusual perspective: that of the losers, the aristocracy exiting the stage. It is written beautifully and poetically, with refined prose. And it reveals a ruthless truth: History sweeps everyone away, even the smartest and most aware.", fr: "Il raconte le Risorgimento d'un point de vue insolite : celui des perdants, l'aristocratie qui quitte la scène. C'est écrit de manière magnifique et poétique, avec une prose raffinée. Et il révèle une vérité impitoyable : l'Histoire emporte tout le monde, même les plus intelligents et les plus conscients.", de: "Es erzählt das Risorgimento aus einem ungewöhnlichen Blickwinkel: dem der Verlierer, des Adels, der die Bühne verlässt. Es ist wunderschön und poetisch geschrieben, mit verfeinerter Prosa. Und es zeigt eine erbarmungslose Wahrheit: Die Geschichte fegt alle weg, auch die intelligentesten und bewusstesten." },
  "Il Risorgimento visto dai perdenti": { en: "The Risorgimento seen by the losers", fr: "Le Risorgimento vu par les perdants", de: "Das Risorgimento aus der Sicht der Verlierer" },
  "Una prosa poetica e raffinata": { en: "Poetic and refined prose", fr: "Une prose poétique et raffinée", de: "Poetische und verfeinerte Prosa" },
  "La Storia travolge tutti": { en: "History sweeps everyone away", fr: "L'Histoire emporte tout le monde", de: "Die Geschichte fegt alle weg" },
  "aristocratico siciliano assiste al crollo del suo mondo (1860, l'Unità d'Italia) e capisce che deve accettare il cambiamento per non morire.": { en: "Sicilian aristocrat witnesses the collapse of his world (1860, Italian Unification) and understands he must accept change to not die.", fr: "L'aristocrate sicilien assiste à l'effondrement de son monde (1860, l'unification italienne) et comprend qu'il doit accepter le changement pour ne pas mourir.", de: "Der sizilianische Aristokrat ist Zeuge des Zusammenbruchs seiner Welt (1860, italienische Einigung) und versteht, dass er die Veränderung akzeptieren muss, um nicht zu sterben." },
  "L'aristocrazia al tramonto": { en: "Aristocracy at dusk", fr: "L'aristocratie au crépuscule", de: "Der Adel in der Dämmerung" },
  "Il Risorgimento": { en: "The Risorgimento", fr: "Le Risorgimento", de: "Das Risorgimento" },
  "Prosa poetica": { en: "Poetic prose", fr: "Prose poétique", de: "Poetische Prosa" },
  "Noi fummo i Gattopardi, i Leoni quelli che ci sostituiranno saranno gli sciacalletti, le iene. — il Principe Fabrizio Salina": { en: "We were the Leopards, the Lions; those who will replace us will be the jackals, the hyenas. — Prince Fabrizio Salina", fr: "Nous étions les Léopards, les Lions ; ceux qui nous remplaçeront seront les chacals, les hyènes. — Prince Fabrizio Salina", de: "Wir waren die Leoparden, die Löwen; diejenigen, die uns ersetzen, werden die Schakale, die Hyänen sein. — Prinz Fabrizio Salina" },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSEGNAMENTO, GAME MENU, DIDATTICA (sorgente: ITALIANO → en / fr / de)
  // ═══════════════════════════════════════════════════════════════════════════

  "Approfondimento · in 3 minuti": { en: "In-depth · in 3 minutes", fr: "Approfondissement · en 3 minutes", de: "Vertiefung · in 3 Minuten" },
  "29 June 2026": { en: "June 29, 2026", fr: "29 juin 2026", de: "29. Juni 2026" },
  "e-commerce": { en: "e-commerce", fr: "e-commerce", de: "e-commerce" },
  "E-commerce": { en: "E-commerce", fr: "E-commerce", de: "E-commerce" },
  "web design": { en: "web design", fr: "web design", de: "Web-Design" },
  "Punto Energy Service": { en: "Punto Energy Service", fr: "Punto Energy Service", de: "Punto Energy Service" },
  "Punto Energy Service — Medole": { en: "Punto Energy Service — Medole", fr: "Punto Energy Service — Medole", de: "Punto Energy Service — Medole" },
  "AutoCAD 3D": { en: "AutoCAD 3D", fr: "AutoCAD 3D", de: "AutoCAD 3D" },
  "Caem Group": { en: "Caem Group", fr: "Caem Group", de: "Caem Group" },
  "232 h": { en: "232 h", fr: "232 h", de: "232 h" },
  "8 h": { en: "8 h", fr: "8 h", de: "8 h" },
  "Validazione": { en: "Validation", fr: "Validation", de: "Validierung" },
  "Preventivo": { en: "Quotation", fr: "Devis", de: "Angebot" },
  "80 h": { en: "80 h", fr: "80 h", de: "80 h" },
  "72 h": { en: "72 h", fr: "72 h", de: "72 h" },
  "Caem Group S.p.A.": { en: "Caem Group S.p.A.", fr: "Caem Group S.p.A.", de: "Caem Group S.p.A." },
  "Caem Group S.p.A. · Castellucchio (MN)": { en: "Caem Group S.p.A. · Castellucchio (MN)", fr: "Caem Group S.p.A. · Castellucchio (MN)", de: "Caem Group S.p.A. · Castellucchio (MN)" },
  "Rivalta sul Mincio (MN)": { en: "Rivalta sul Mincio (MN)", fr: "Rivalta sul Mincio (MN)", de: "Rivalta sul Mincio (MN)" },
  "Landini L25 Testacalda · 1957": { en: "Landini L25 Testacalda · 1957", fr: "Landini L25 Testacalda · 1957", de: "Landini L25 Testacalda · 1957" },
  "Unicollege Mantova": { en: "Unicollege Mantova", fr: "Unicollege Mantova", de: "Unicollege Mantova" },
  "Santagnese10 Officina Creativa": { en: "Santagnese10 Officina Creativa", fr: "Santagnese10 Officina Creativa", de: "Santagnese10 Officina Creativa" },
  "San Marino": { en: "San Marino", fr: "Saint-Marin", de: "San Marino" },
  "Fausto Chitò": { en: "Fausto Chitò", fr: "Fausto Chitò", de: "Fausto Chitò" },
  "Ducati Scrambler 125": { en: "Ducati Scrambler 125", fr: "Ducati Scrambler 125", de: "Ducati Scrambler 125" },
  "CRED": { en: "CRED", fr: "CRED", de: "CRED" },
  "Gorgonzola": { en: "Gorgonzola", fr: "Gorgonzola", de: "Gorgonzola" },
  "Spaghetti cacio e pepe": { en: "Spaghetti Cacio e Pepe", fr: "Spaghetti Cacio e Pepe", de: "Spaghetti Cacio e Pepe" },
  "Spaghetti alle vongole": { en: "Spaghetti alle Vongole", fr: "Spaghetti alle Vongole", de: "Spaghetti alle Vongole" },
  "Pecorino sardo stagionato": { en: "Aged Pecorino Sardo", fr: "Pecorino Sardo affiné", de: "gereifter Pecorino Sardo" },
  "Grana Padano DOP": { en: "Grana Padano DOP", fr: "Grana Padano DOP", de: "Grana Padano DOP" },
  "Pizza ai quattro formaggi": { en: "Four Cheese Pizza", fr: "Pizza aux Quatre Fromages", de: "Pizza mit vier Käsesorten" },
  "Filetto di manzo": { en: "Beef Fillet", fr: "Filet de Boeuf", de: "Rinderfilet" },

// — Pagina non disponibile —
  "Evento concluso": { en: "Event concluded", fr: "Événement terminé", de: "Veranstaltung beendet" },
  "Pagina non disponibile": { en: "Page not available", fr: "Page non disponible", de: "Seite nicht verfügbar" },
  "Grazie a tutti! Questo invito non è più attivo.": {
    en: "Thank you all! This invite is no longer active.",
    fr: "Merci à tous ! Cette invitation n'est plus active.",
    de: "Danke euch allen! Diese Einladung ist nicht mehr gültig.",
  },
  "Il link non è valido o è scaduto.": {
    en: "The link is invalid or has expired.",
    fr: "Le lien n'est pas valide ou a expiré.",
    de: "Der Link ist ungültig oder ist abgelaufen.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTAGRAM — «Chi ti ha tolto il follow»  (sorgente: ITALIANO → en / fr / de)
  // ("Torna alla home", "Copia", "Copiato" sono già tradotti sopra — non ripetuti.)
  // ═══════════════════════════════════════════════════════════════════════════
  "Chi ti ha tolto il follow? 👀": {
    en: "Who unfollowed you? 👀", fr: "Qui t'a unfollow ? 👀", de: "Wer ist dir entfolgt? 👀",
  },
  "Scopri in 10 secondi chi segui che non ti ricambia.": {
    en: "Find out in 10 seconds who you follow that doesn't follow you back.",
    fr: "Découvre en 10 secondes qui tu suis qui ne te suit pas en retour.",
    de: "Finde in 10 Sekunden heraus, wem du folgst, der dir nicht zurückfolgt.",
  },
  "Carica i due file following.html e followers.html che scarichi da Instagram (vanno bene anche i .json), oppure incolla le liste. Resta tutto nel tuo browser: nessun login, nessun dato inviato.": {
    en: "Upload the two files following.html and followers.html you download from Instagram (.json works too), or paste the lists. Everything stays in your browser: no login, no data sent.",
    fr: "Charge les deux fichiers following.html et followers.html téléchargés depuis Instagram (les .json marchent aussi), ou colle les listes. Tout reste dans ton navigateur : aucune connexion, aucune donnée envoyée.",
    de: "Lade die beiden Dateien following.html und followers.html von Instagram hoch (.json geht auch) oder füge die Listen ein. Alles bleibt in deinem Browser: kein Login, keine Daten gesendet.",
  },
  "I miei seguiti": { en: "People I follow", fr: "Mes abonnements", de: "Wem ich folge" },
  "I miei follower": { en: "My followers", fr: "Mes abonnés", de: "Meine Follower" },
  "Il file following.html — chi segui tu": {
    en: "The following.html file — who you follow",
    fr: "Le fichier following.html — qui tu suis",
    de: "Die Datei following.html — wem du folgst",
  },
  "Il file followers.html — chi ti segue": {
    en: "The followers.html file — who follows you",
    fr: "Le fichier followers.html — qui te suit",
    de: "Die Datei followers.html — wer dir folgt",
  },
  "Scegli file": { en: "Choose file", fr: "Choisir un fichier", de: "Datei wählen" },
  "…oppure incolla qui la lista": { en: "…or paste the list here", fr: "…ou colle la liste ici", de: "…oder füge die Liste hier ein" },
  Confronta: { en: "Compare", fr: "Comparer", de: "Vergleichen" },
  "Cancella e ricomincia": { en: "Clear and start over", fr: "Effacer et recommencer", de: "Löschen und neu starten" },
  "profili che segui non ti ricambiano.": {
    en: "accounts you follow don't follow you back.",
    fr: "comptes que tu suis ne te suivent pas en retour.",
    de: "Konten, denen du folgst, folgen dir nicht zurück.",
  },
  "Li trovi nella lista in evidenza qui sotto.": {
    en: "You'll find them in the highlighted list below.",
    fr: "Tu les trouves dans la liste en évidence ci-dessous.",
    de: "Du findest sie in der hervorgehobenen Liste unten.",
  },
  "Ordina:": { en: "Sort:", fr: "Trier :", de: "Sortieren:" },
  "Nome (A-Z)": { en: "Name (A-Z)", fr: "Nom (A-Z)", de: "Name (A-Z)" },
  "Follow più recenti": { en: "Most recent follows", fr: "Abonnements récents", de: "Neueste Follows" },
  "Le date non sono presenti in questo export": {
    en: "Dates are not present in this export",
    fr: "Les dates ne sont pas présentes dans cet export",
    de: "Daten sind in diesem Export nicht vorhanden",
  },
  "Chi mi segue ma io non seguo": {
    en: "They follow me, I don't follow back", fr: "Ils me suivent, je ne les suis pas", de: "Folgen mir, ich nicht zurück",
  },
  "Io seguo ma non mi segue": {
    en: "I follow, they don't follow back", fr: "Je suis, ils ne me suivent pas", de: "Ich folge, sie nicht zurück",
  },
  "Chi seguo e mi risegue": {
    en: "We follow each other", fr: "On se suit mutuellement", de: "Wir folgen uns gegenseitig",
  },
  Scarica: { en: "Download", fr: "Télécharger", de: "Herunterladen" },
  "Nessuno qui 🎉": { en: "No one here 🎉", fr: "Personne ici 🎉", de: "Niemand hier 🎉" },
  "Chi mi ha tolto il follow di recente? Confronta con un export vecchio": {
    en: "Who unfollowed me recently? Compare with an older export",
    fr: "Qui m'a unfollow récemment ? Compare avec un ancien export",
    de: "Wer ist mir kürzlich entfolgt? Mit einem älteren Export vergleichen",
  },
  "Metti qui i follower di un export più vecchio (il followers.html di settimane fa): chi c'era allora e ora non c'è più ti ha tolto il follow.": {
    en: "Put here the followers from an older export (the followers.html from weeks ago): whoever was there and isn't anymore has unfollowed you.",
    fr: "Mets ici les abonnés d'un export plus ancien (le followers.html d'il y a quelques semaines) : celui qui y était et n'y est plus t'a unfollow.",
    de: "Füge hier die Follower aus einem älteren Export ein (das followers.html von vor Wochen): Wer damals dabei war und jetzt fehlt, ist dir entfolgt.",
  },
  "I miei follower di prima": { en: "My previous followers", fr: "Mes anciens abonnés", de: "Meine früheren Follower" },
  "…oppure incolla qui la lista dei follower di prima": {
    en: "…or paste your previous followers list here",
    fr: "…ou colle ici la liste de tes anciens abonnés",
    de: "…oder füge hier deine frühere Followerliste ein",
  },
  "Rispetto al tuo export vecchio": { en: "Compared to your older export", fr: "Par rapport à ton ancien export", de: "Im Vergleich zu deinem älteren Export" },
  "Ti hanno tolto il follow": { en: "They unfollowed you", fr: "Ils t'ont unfollow", de: "Sie sind dir entfolgt" },
  "Nuovi follower": { en: "New followers", fr: "Nouveaux abonnés", de: "Neue Follower" },

  // — Tutorial "come scaricare i file" (titoli, guida, navigazione) —
  "Come scarico i file da Instagram?": {
    en: "How do I download the files from Instagram?",
    fr: "Comment télécharger les fichiers depuis Instagram ?",
    de: "Wie lade ich die Dateien von Instagram herunter?",
  },
  Salta: { en: "Skip", fr: "Passer", de: "Überspringen" },
  "Ho capito, inizia": { en: "Got it, start", fr: "Compris, commencer", de: "Verstanden, los" },
  "Scarica i tuoi 2 file da Instagram": {
    en: "Download your 2 files from Instagram", fr: "Télécharge tes 2 fichiers depuis Instagram", de: "Lade deine 2 Dateien von Instagram herunter",
  },
  "Profilo → menu → Impostazioni": {
    en: "Profile → menu → Settings", fr: "Profil → menu → Paramètres", de: "Profil → Menü → Einstellungen",
  },
  "Scarica le tue informazioni": {
    en: "Download your information", fr: "Télécharger tes informations", de: "Deine Informationen herunterladen",
  },
  "Scarica o trasferisci informazioni": {
    en: "Download or transfer information", fr: "Télécharger ou transférer des informations", de: "Informationen herunterladen oder übertragen",
  },
  "Solo «Followers e following»": {
    en: "Only “Followers and following”", fr: "Seulement « Followers et following »", de: "Nur „Follower und Abonnierte“",
  },
  "Formato HTML → Inoltra": {
    en: "HTML format → Submit", fr: "Format HTML → Envoyer", de: "HTML-Format → Absenden",
  },
  "Attendi, poi scarica lo ZIP": {
    en: "Wait, then download the ZIP", fr: "Attends, puis télécharge le ZIP", de: "Warte, dann lade die ZIP herunter",
  },
  "Trova i 2 file .html": {
    en: "Find the 2 .html files", fr: "Trouve les 2 fichiers .html", de: "Finde die 2 .html-Dateien",
  },
  "Torna qui e confronta": {
    en: "Come back here and compare", fr: "Reviens ici et compare", de: "Komm zurück und vergleiche",
  },

  // — Banner novità home (sorgente EN) —
  "— new tool: find out who doesn't follow you back on Instagram, all in your browser.": {
    it: "— nuovo strumento: scopri chi non ti segue su Instagram, tutto nel tuo browser.",
    fr: "— nouvel outil : découvre qui ne te suit pas sur Instagram, directement dans ton navigateur.",
    de: "— neues Tool: finde heraus, wer dir auf Instagram nicht zurückfolgt, alles in deinem Browser.",
  },
  "Try it": { it: "Provalo", fr: "Essaie-le", de: "Ausprobieren" },

  // — Sezione privacy —
  "La tua privacy, davvero": {
    en: "Your privacy, for real", fr: "Ta vie privée, pour de vrai", de: "Deine Privatsphäre, wirklich",
  },
  "Questo strumento gira interamente nel tuo browser: i file e le liste che carichi non vengono inviati da nessuna parte, non passano da alcun server e non vengono salvati. Il confronto lo vedi solo tu, su questo dispositivo.": {
    en: "This tool runs entirely in your browser: the files and lists you load are never sent anywhere, never pass through any server and are never stored. Only you see the comparison, on this device.",
    fr: "Cet outil fonctionne entièrement dans ton navigateur : les fichiers et les listes que tu charges ne sont envoyés nulle part, ne passent par aucun serveur et ne sont jamais enregistrés. Toi seul vois la comparaison, sur cet appareil.",
    de: "Dieses Tool läuft vollständig in deinem Browser: Die Dateien und Listen, die du lädst, werden nirgendwo gesendet, laufen über keinen Server und werden nie gespeichert. Nur du siehst den Vergleich, auf diesem Gerät.",
  },
  "Nessun caricamento su internet: tutto resta in locale.": {
    en: "No upload to the internet: everything stays local.",
    fr: "Aucun envoi sur internet : tout reste en local.",
    de: "Kein Upload ins Internet: alles bleibt lokal.",
  },
  "Nessun login, nessun account, nessun cookie di tracciamento.": {
    en: "No login, no account, no tracking cookies.",
    fr: "Aucune connexion, aucun compte, aucun cookie de suivi.",
    de: "Kein Login, kein Konto, keine Tracking-Cookies.",
  },
  "Niente database: appena chiudi o ricarichi la pagina, i dati spariscono.": {
    en: "No database: as soon as you close or reload the page, the data is gone.",
    fr: "Aucune base de données : dès que tu fermes ou recharges la page, les données disparaissent.",
    de: "Keine Datenbank: sobald du die Seite schließt oder neu lädst, sind die Daten weg.",
  },
  "L'unica cosa memorizzata sul tuo dispositivo è se hai già visto il tutorial (una preferenza locale), così non ti viene riproposto. Nient'altro.": {
    en: "The only thing stored on your device is whether you've already seen the tutorial (a local preference), so it isn't shown again. Nothing else.",
    fr: "La seule chose enregistrée sur ton appareil est si tu as déjà vu le tutoriel (une préférence locale), pour ne pas te le remontrer. Rien d'autre.",
    de: "Das Einzige, was auf deinem Gerät gespeichert wird, ist, ob du das Tutorial schon gesehen hast (eine lokale Einstellung), damit es nicht erneut erscheint. Sonst nichts.",
  },
};

// Una chiave ha senso solo se contiene almeno una lettera: numeri, date e
// simboli sono identici in tutte le lingue. Scarta anche gli indici numerici
// spuri finiti per errore nel JSON generato (traducevano i numeri dei giochi
// in stringhe a caso del sito).
function isTranslatableKey(k: string): boolean {
  return /\p{L}/u.test(k);
}

// Indicizza per chiave normalizzata. Prima le voci curate (RAW), poi quelle
// generate dal crawl (che vincono in caso di sovrapposizione: sono autorevoli).
export const DICT: Record<string, Entry> = Object.create(null);
for (const k in RAW) {
  const key = normalizeKey(k);
  if (isTranslatableKey(key)) DICT[key] = RAW[k];
}
for (const k in generated) {
  const key = normalizeKey(k);
  if (isTranslatableKey(key)) DICT[key] = (generated as Record<string, Entry>)[k];
}
