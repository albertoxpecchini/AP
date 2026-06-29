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
};

// Indicizza per chiave normalizzata (robusto a spazi/righe nel sorgente sopra).
export const DICT: Record<string, Entry> = Object.create(null);
for (const k in RAW) DICT[normalizeKey(k)] = RAW[k];
