// ─────────────────────────────────────────────────────────────────────────────
//  ASSISTENZA INFORMATICA — la pagina /servizi/informatica/, l'area D dei servizi
//  vista da vicino. I servizi stanno in services.js (area `informatica`, con il
//  campo `group`); qui ci sono i gruppi, le versioni di Windows e Office, il
//  regalo del primo intervento, come si svolge un intervento, le regole e le FAQ.
//
//  È la versione seria di «Better Call Pekko» (/assistenza/): stesse cose, dette
//  come nel resto del sito. Windows e Office si installano sempre con una licenza
//  valida del cliente: il regalo è il lavoro, mai una copia.
// ─────────────────────────────────────────────────────────────────────────────

export const informatica = {
  path: '/servizi/informatica/',
  title: 'Assistenza informatica a Mantova — PC, stampanti, Windows e Office',
  description:
    'Pulizia da virus, file doppioni, riordino cartelle, stampanti, audio e driver, installazione di Windows (da XP a 11, LTSC, Server) e di Office, ripristino, cambio di sistema, impaginazione e conversione di documenti. A Rivalta sul Mincio e Mantova.',

  head: {
    label: 'Assistenza informatica',
    title: 'Computer che funzionano, file al loro posto.',
    accent: ['posto'],
    lead: 'Virus, stampanti, driver, Windows e Office, file doppioni e documenti da sistemare. Per privati, famiglie e piccoli uffici, a Rivalta sul Mincio, a Mantova e nei dintorni.',
  },

  // L'ordine dei gruppi nella pagina; i servizi li sceglie `group` in services.js.
  groups: [
    { key: 'sicurezza', title: 'Sicurezza e velocità', text: 'Un computer pulito, con gli accessi in ordine e i pezzi giusti è anche un computer veloce.' },
    { key: 'file', title: 'File e documenti', text: 'Trovare, ordinare, salvare, impaginare, convertire: il lavoro che il computer dovrebbe renderti più facile.' },
    { key: 'periferiche', title: 'Periferiche, driver e rete', text: 'Tutto quello che si collega al computer, con un cavo o senza, e i driver che lo fanno funzionare.' },
    { key: 'sistemi', title: 'Sistemi e programmi', text: 'Installare, riparare, rimettere a nuovo, cambiare sistema: il computer come lo vuoi, con i tuoi dati al loro posto.' },
  ],

  // Le versioni che installo, riparo e configuro, con quello che serve sapere.
  windows: [
    { name: 'Windows 11', note: 'Installazione pulita o aggiornamento da Windows 10, con la verifica dei requisiti (TPM 2.0, avvio protetto, processore) prima di cominciare.' },
    { name: 'Windows 10', note: 'Il supporto di Microsoft è finito a ottobre 2025: ti dico se il computer può passare a 11 e, se non può, come continuare a usarlo in sicurezza.' },
    { name: 'Windows 10 e 11 Enterprise LTSC', note: 'Le edizioni a lungo termine, senza app superflue e con i soli aggiornamenti di sicurezza, per postazioni che devono restare uguali per anni. Richiedono una licenza a volume.' },
    { name: 'Windows su ARM64', note: 'Portatili con processore Snapdragon e macchine virtuali sui Mac con chip Apple: installazione, driver e compatibilità dei programmi.' },
    { name: 'Windows Server', note: 'Per il piccolo ufficio: cartelle condivise, utenti e permessi, stampanti di rete, backup centralizzati.' },
    { name: 'Windows 8.1 · 8 · 7 · Vista · XP', note: 'Per i macchinari, i gestionali e i programmi che funzionano solo lì. Non ricevono più aggiornamenti di sicurezza: li configuro per restare fuori da internet o isolati dal resto della rete.' },
  ],
  office: [
    { name: 'Microsoft 365 · Office 2024 · 2021 · 2019 · 2016 · 2013', note: 'L’installazione a portata di clic (Click-to-Run), quella standard di Microsoft: i programmi si aggiornano da soli.' },
    { name: 'Installazione personalizzata · 365 · 2024 · 2021 · 2019 · 2016', note: 'Con lo strumento di distribuzione di Microsoft (Office Deployment Tool) installo solo i programmi che usi, nelle lingue che ti servono, a 32 o 64 bit. In ufficio la stessa configurazione va su tutti i computer.' },
    { name: 'Office 2016 · 2013 · 2010 in versione MSI', note: 'Le versioni con il vecchio installatore, per le aziende con licenze a volume e i gestionali legati a una versione precisa di Office.' },
    { name: 'Office per Mac', note: 'Microsoft 365 e Office 2024 e 2021 su macOS, con Outlook e OneDrive configurati.' },
  ],
  versionsNote: 'Scarico Windows e Office solo dai server di Microsoft. La licenza è la tua, quella della tua azienda o una nuova acquistata originale: ti aiuto a capire quale ti serve. Se ti basta scrivere e fare due conti, ti mostro anche le alternative gratuite, come Office sul web e LibreOffice.',

  // Il regalo del primo intervento: il lavoro di installazione, non la licenza.
  gift: {
    label: 'Primo intervento',
    title: 'Installazione di Windows o Office in regalo',
    text: 'Al primo intervento sopra i 50 €, installazione e configurazione di Windows o di Office non si pagano: sistema aggiornato, driver, programmi al loro posto, stampante collegata.',
    note: 'Il regalo è il lavoro; la licenza resta a parte. Niente copie non autorizzate.',
  },

  steps: [
    { title: 'Mi racconti il problema', text: 'Per telefono, WhatsApp o email. Spesso basta una foto dello schermo o del messaggio d’errore per capire da dove partire.' },
    { title: 'Ti dico prezzo e tempi', text: 'Prima di cominciare, non dopo. Se riparare non conviene te lo dico, e ti aiuto a scegliere l’alternativa.' },
    { title: 'Copio i tuoi dati', text: 'Prima di ogni intervento sul sistema faccio una copia di foto, documenti e posta, e la cancello solo quando hai controllato che c’è tutto.' },
    { title: 'Intervengo', text: 'Sul posto oppure da remoto, quando basta un collegamento: lo autorizzi tu e lo chiudi quando vuoi.' },
    { title: 'Ti spiego cosa ho fatto', text: 'Un riepilogo scritto: cosa ho trovato, cosa ho cambiato, le impostazioni nuove. In parole semplici, senza sigle.' },
  ],

  rules: [
    { title: 'Solo software originale', text: 'Windows e Office dai server di Microsoft, driver e programmi dai siti dei produttori. Niente copie modificate, niente «attivatori».' },
    { title: 'I tuoi file restano tuoi', text: 'Apro documenti e foto solo se serve al lavoro, e non ne tengo copie dopo la consegna.' },
    { title: 'Niente abbonamenti inutili', text: 'Antivirus a pagamento, «ottimizzatori», pulitori: quasi sempre basta quello che Windows ha già, configurato bene.' },
    { title: 'Prima il prezzo', text: 'Sai quanto spendi prima che cominci. Se durante il lavoro salta fuori altro, ci sentiamo prima di andare avanti.' },
  ],

  faq: [
    { q: 'Quanto costa un intervento?', a: 'Dipende dal problema, e il prezzo lo sai prima che cominci. Raccontarmi cosa succede e capire se si può risolvere non costa niente.' },
    { q: 'La licenza di Windows o di Office me la dai tu?', a: 'No: installo e configuro con la tua licenza, con quella della tua azienda o con una nuova che acquisti originale, e ti aiuto a capire quale ti serve. Il regalo del primo intervento è il lavoro di installazione.' },
    { q: 'Rischio di perdere i miei file?', a: 'Prima di ogni intervento sul sistema faccio una copia di foto, documenti e posta. La cancello solo quando hai controllato che c’è tutto.' },
    { q: 'Vieni tu o porto io il computer?', a: 'Come ti è più comodo. Stampanti, rete e computer fissi di solito si sistemano sul posto; per programmi, posta e documenti spesso basta un collegamento da remoto.' },
    { q: 'Lavori anche su Mac e su Linux?', a: 'Sì: Office per Mac, stampanti, backup e pulizia anche su macOS; installazione di Linux (Ubuntu, Linux Mint) sui computer che non reggono Windows 11 ma hanno ancora anni di vita.' },
    { q: 'Il mio computer è vecchio: conviene sistemarlo?', a: 'Spesso sì: un SSD e un po’ di memoria costano molto meno di un computer nuovo e lo rendono di nuovo veloce. Se non conviene, te lo dico prima.' },
    { q: 'Perché installi anche Windows XP o Windows 7?', a: 'Perché ci sono macchinari, gestionali e programmi che funzionano solo lì. Senza aggiornamenti di sicurezza non devono stare su internet: li configuro scollegati o isolati dal resto della rete.' },
  ],

  cta: {
    title: 'Raccontami cosa non va.',
    accent: ['non', 'va'],
    text: 'Rispondo entro un giorno lavorativo. Se il computer non si accende o la stampante serve oggi, chiamami.',
    // La voce del modulo di contatto da preselezionare (src/data/site.js → form.projectTypes).
    tipo: 'Assistenza informatica',
  },
}
