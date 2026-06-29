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
  "High-school senior & front-end developer behind a hub of web games —": {
    it: "Studente dell'ultimo anno e sviluppatore front-end dietro a un hub di web game —",
    fr: "Lycéen en terminale et développeur front-end derrière un hub de jeux web —",
    de: "Schüler der Abschlussklasse und Frontend-Entwickler hinter einem Hub von Web-Games —",
  },
  "Building elegant, fast web experiences with React, TypeScript and careful motion design — from playful games to real-world business sites.":
    {
      it: "Creo esperienze web eleganti e veloci con React, TypeScript e cura del movimento — dai giochi spensierati ai veri siti aziendali.",
      fr: "Je crée des expériences web élégantes et rapides avec React, TypeScript et un soin particulier des animations — des jeux ludiques aux vrais sites d'entreprise.",
      de: "Ich baue elegante, schnelle Web-Erlebnisse mit React, TypeScript und sorgfältigem Motion Design — von verspielten Games bis zu echten Unternehmensseiten.",
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
};

// Indicizza per chiave normalizzata. Prima le voci curate (RAW), poi quelle
// generate dal crawl (che vincono in caso di sovrapposizione: sono autorevoli).
export const DICT: Record<string, Entry> = Object.create(null);
for (const k in RAW) DICT[normalizeKey(k)] = RAW[k];
for (const k in generated) DICT[normalizeKey(k)] = (generated as Record<string, Entry>)[k];
