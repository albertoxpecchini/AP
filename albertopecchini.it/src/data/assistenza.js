// ─────────────────────────────────────────────────────────────────────────────
//  «BETTER CALL PEKKO» — i contenuti di /assistenza/ e /contatti/assistenza/:
//  l'assistenza informatica raccontata come il sito americano (2007–2010) di
//  Pekko, «the computer guy». Tutto in inglese per scelta di Alberto: italiana è
//  solo la riga «SI PARLA ITALIANO». Qui Alberto si chiama Pekko (il suo
//  soprannome): «Alberto Pecchini» resta solo nel credito legale del footer.
//  Niente titoli di studio, niente geometra: qui ripara computer e basta.
//
//  Le immagini vengono da tools/assistenza: ingredienti di gpt-image-2 (spot.js)
//  e annunci composti a strati (annunci.js → rendi.mjs); le misure stanno nel
//  manifest generato src/data/assistenza-media.js. Un'immagine elencata ma non
//  ancora resa diventa un riquadro di testo, così la pagina non si rompe.
//
//  Le voci di `tipi` e `urgenze` devono coincidere con api/contatti.js (FORMS.assistenza).
//  I prezzi sono il «listino 2009» della parodia: Alberto li conferma o li cambia qui.
// ─────────────────────────────────────────────────────────────────────────────

import { site } from './site.js'

// Con SITE=bcp (la build del progetto Vercel di bettercallpekko.it) le due pagine
// stanno alla radice del dominio; altrimenti vivono dentro il sito serio.
export const BCP = typeof process !== 'undefined' && process.env?.SITE === 'bcp'
const PATH = BCP ? '/' : '/assistenza/'
const CONTATTI = BCP ? '/contact/' : '/contatti/assistenza/'

const cifre = site.contact.phone.replace(/\D/g, '') // 393510355506
const nazionale = cifre.replace(/^39/, '')
// Il numero come lo scrivono gli spot americani: 351-035-5506.
const bello = nazionale.length === 10 ? `${nazionale.slice(0, 3)}-${nazionale.slice(3, 6)}-${nazionale.slice(6)}` : site.contact.phone

const INDIRIZZO = `${site.location.address}, ${site.location.cap} ${site.location.city} (${site.location.province}), Italy`

export const assistenza = {
  path: PATH,
  contatti: CONTATTI,
  // Il dominio delle due pagine e i loro indirizzi lì: canonical e og:url ci puntano
  // anche dalla copia che resta dentro il sito serio.
  dominio: 'https://bettercallpekko.it',
  urlPubblici: { '/assistenza/': '/', '/contatti/assistenza/': '/contact/' },
  lang: 'en',
  nome: 'Better Call Pekko',
  titolo: 'In Computer Trouble? Better Call Pekko! — I’m the computer guy. Computer repair in Rivalta sul Mincio (Mantova, Italy)',
  descrizione:
    'Pekko fixes computers: virus removal, duplicate files, printers that won’t print, speakers, drivers, Windows and Office installs, system restore, OS changes, documents, phones, Wi-Fi. Via Belvedere 1, Rivalta sul Mincio (Mantova) and remote help. Si parla italiano.',
  titoloContatti: 'Contact Pekko — free consultation, si parla italiano',
  descrizioneContatti: 'Phone, WhatsApp, e-mail, the form, or come by Via Belvedere 1, Rivalta sul Mincio (Mantova, Italy): tell Pekko what your computer did and get an answer within one business day.',

  telefono: bello,
  tel: `tel:${site.contact.phone.replace(/\s/g, '')}`,
  whatsapp: `https://wa.me/${cifre}?text=${encodeURIComponent('Hi Pekko! My computer did something terrible: ')}`,
  email: site.contact.email,
  indirizzo: INDIRIZZO,
  mappa: `https://www.openstreetmap.org/?mlat=${site.location.lat}&mlon=${site.location.lon}#map=15/${site.location.lat}/${site.location.lon}`,
  paypal: 'https://www.paypal.biz/albertoxpecchini',
  instagram: site.social.find((s) => s.key === 'instagram')?.url || '',
  github: site.social.find((s) => s.key === 'github')?.url || '',
  nascita: '06/28/2006',

  // I tasti della colonna sinistra, come nel riferimento: ancore alle sezioni.
  menu: [
    { label: 'Consultations', href: '#consultations' },
    { label: 'About Pekko', href: '#about' },
    { label: 'Prices', href: '#prices' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'As seen on TV', href: '#tv' },
    { label: 'E-cards', href: '#ecards' },
    { label: 'Office webcam', href: '#webcam' },
    { label: 'Forum', href: '#forum' },
    { label: 'Coupons', href: '#coupons' },
    { label: 'Donate', href: '#donate' },
    { label: 'Contact', href: CONTATTI, contatti: true },
  ],

  striscia: `${bello} SI PARLA ITALIANO ● VIA BELVEDERE 1, RIVALTA SUL MINCIO (MN) ● I’M THE COMPUTER GUY ● BETTERCALLPEKKO.IT`,

  popup: {
    barra: 'FREE CONSULTATION — Pekko, the computer guy',
    titolo: 'WAIT!!!',
    testo: 'In computer trouble? Slow PC? Printer pretending it can’t hear you? Duplicate photos of your cat? Don’t close this window. Pekko can help. w00t!',
    si: 'YES, HELP ME!',
    chiama: 'CALL NOW',
    no: 'No thanks, my PC is perfect (liar)',
  },

  video: [
    { ad: 'ad-thumb-1', label: 'DELETE ’EM NOW', alt: 'Consultation video: Pekko pointing at you, about duplicate files' },
    { ad: 'ad-thumb-2', label: 'PRINTER TROUBLE', alt: 'Consultation video: Pekko cradling a printer' },
    { ad: 'ad-thumb-3', label: 'PEKKO’S MAILBAG', alt: 'Consultation video: Pekko on the phone' },
    { ad: 'ad-thumb-4', label: 'VISTA 2007', alt: 'Consultation video: Pekko shrugging' },
  ],
  videoNota: 'Video unavailable in your country. Better call Pekko instead.',

  servizi: [
    ['Virus removal', 'Malware, pop-ups, seventeen toolbars, a PC that boots in ten minutes. Cleaned and sped up. pwned.'],
    ['Duplicate files', 'The same holiday photos saved four times, “copy of copy of copy”. Found, compared, deleted with your OK.'],
    ['Folder cleanup', 'Desktop full, Downloads exploding, photos on three disks and two phones. A place for everything.'],
    ['Printer won’t print', 'Printers, scanners, “empty” cartridges that are full. It will print again today.'],
    ['Speakers, sound, mic', 'Mute speakers, crackling mic, headphones that won’t pair, webcam gone missing.'],
    ['Drivers', 'Graphics, audio, network, the update that broke everything. The right driver in the right place.'],
    ['Windows', 'Clean install, upgrade, restore. All of them: 11 · 10 · 10/11 Enterprise LTSC · ARM64 · 8.1 · 8 · 7 · Vista · XP · Server.'],
    ['Office', 'Install, repair, set up, with your licence. 365 · 2024 · 2021 · 2019 · 2016 · 2013 · 2010 · Office for Mac.'],
    ['System restore', 'The PC goes back to day one without losing your photos and documents.'],
    ['Change operating system', 'Windows to Linux and back, old version to new. Data safe, programs back, printer included.'],
    ['Document re-layout', 'Theses, résumés, menus, flyers, reports: same words, decent look. Even the table of contents.'],
    ['Format conversion', 'DOC, DOCX, ODT, Pages, PDF, pictures, audio, video: I open it, you get it back in the format you need.'],
    ['Backup & recovery', 'Before it’s too late, or right after.'],
    ['Wi-Fi & home network', 'Routers, repeaters, cables, network printers, the corner of the house with no signal.'],
    ['Cell phones', 'Contacts backup, photos off the phone, ringtones, screens, chargers. All brands, even the bitten one.'],
    ['New PC, turnkey', 'Set up, moved in from the old one, ready to go.'],
    ['Passwords & e-mail', 'Accounts, logins, two-factor. Yes, I will guess it. It’s the cat.'],
    ['Inside cleaning & parts', 'SSD, RAM, fans, thermal paste. The PC stops sounding like a hairdryer.'],
    ['Macs too', 'Yes, they break. Same prices, slightly more sighing. No Genius required.'],
    ['Websites', 'I also make websites. This one took an afternoon in 2006 (allegedly).'],
  ],
  windows: ['Windows 11', 'Windows 10', 'Windows 10 / 11 Enterprise LTSC', 'Windows ARM64', 'Windows 8.1', 'Windows 8', 'Windows 7', 'Windows Vista', 'Windows XP', 'Windows Server'],
  office: ['Office 365', 'Office 2024', 'Office 2021', 'Office 2019', 'Office 2016', 'Office 2013', 'Office 2010', 'Office for Mac'],

  omaggio: {
    titolo: 'WINDOWS OR OFFICE — FREE*',
    testo: 'With your first repair over €50, Pekko installs and sets up Windows or Office at no extra charge: updated system, programs where they belong, printer connected.',
    nota: '*Free is the installation, update and setup work, with your own licence or one bought separately. No pirate copies: they carry more viruses than I remove.',
  },

  // ── About Pekko: il profilo in stile MySpace del 2009 ──
  about: {
    titolo: 'ABOUT PEKKO',
    sotto: 'a.k.a. the computer guy · profile views: 1,337',
    intro: 'Hi!!! I’m Pekko. I repair computers. That’s it, that’s the bio. Everything else below is bonus content. ^_^',
    scheda: [
      ['Name', 'Alberto Pecchini, but everybody calls me PEKKO (also pzkko, PeKKo, pekko_the_pc_guy)'],
      ['Born', '06/28/2006 — same day this website was last updated (coincidence? yes)'],
      ['Location', INDIRIZZO],
      ['Job', 'I’m the computer guy. I repair computers. Also printers, which are not computers, they are enemies.'],
      ['Status', 'Available (for repairs)'],
      ['Languages', 'Italian, English, Windows error codes, printer noises'],
      ['Mood', 'fixing'],
      ['Now playing', '56k modem handshake (extended remix)'],
      ['Currently drinking', 'coffee (donate one below)'],
      ['Office hours', 'By appointment. Also 3 AM on channel 47.'],
      ['Transport', 'PC ambulance (a white van in my imagination), a motorbike (no drivers needed)'],
      ['Also makes', 'websites. The serious one is linked at the bottom. This one is the fun one.'],
    ],
    piace: ['printers that print', 'the Mincio river', 'salami (payment accepted)', 'floppy disks (1.44 MB of hope)', 'Impact font, in 3D', 'the sound of a fixed fan', 'my tortoise', 'my giant African snail'],
    nonPiace: ['Vista', 'toolbars (all seventeen)', '“free” screensavers', 'the price of a laptop charger with a bite on it', 'people who say “it just stopped working”', 'ink cartridges that are “empty”'],
    staff: [
      { nome: 'PEKKO', ruolo: 'CEO, CTO, the computer guy', img: 'cut-punta', nota: 'points at things until they work' },
      { nome: 'THE TORTOISE', ruolo: 'Head of Security', img: '/media/mascotte/tartaruga.webp', nota: 'slow, steady, has never been hacked' },
      { nome: 'THE SNAIL', ruolo: 'Customer Relations', img: '/media/mascotte/lumaca.webp', nota: 'leaves a trail, follows up' },
    ],
    top8: ['the tortoise', 'the snail', 'the printer (on and off)', 'grandma_rita', 'BigTony_MN', 'the router', 'jessica_88', 'Vista (blocked)'],
    album: ['cut-punta', 'cut-pollici', 'cut-telefono', 'cut-laptop', 'cut-braccia', 'cut-cartello', 'cut-boh', 'cut-pistole', 'cut-stampante'],
    albumTitolo: 'PEKKO’S OUTFIT — photo album (9 pics)',
    albumNota: 'rate my suit!!! (rating disabled since 2009)',
    siti: [
      { label: 'rivaltasulmincio.it', href: 'https://www.rivaltasulmincio.it' },
      { label: 'cascinafontana.xyz', href: 'https://www.cascinafontana.xyz' },
      { label: 'the serious website', href: site.url },
    ],
  },

  // ── Listino 2009 (da confermare) ──
  prezzi: {
    titolo: 'PRICE LIST',
    sotto: '2009 edition · call for today’s prices · si parla italiano',
    voci: [
      ['Consultation', 'FREE', 'phone, WhatsApp, e-mail or in person'],
      ['Sigh', 'FREE', 'unlimited'],
      ['Virus removal & cleanup', '€39', 'toolbars removed at no extra charge'],
      ['Duplicate file hunt', '€29', 'you keep the cat photos you want'],
      ['Windows clean install', '€49', 'FREE with your first repair over €50*'],
      ['Office install & setup', '€29', 'FREE with your first repair over €50*'],
      ['Printer exorcism', '€25', 'holy water not included'],
      ['Speakers / drivers / sound', '€25', 'until you can hear the error beep again'],
      ['Data recovery', 'from €59', 'depends how dead it is'],
      ['Backup setup', '€29', 'before it’s too late (or €59 right after)'],
      ['PC inside cleaning', '€35', 'fans, dust, thermal paste'],
      ['Wi-Fi & home network', '€35', 'router, repeaters, the dead corner'],
      ['Cell phone contacts backup', '€10', 'all brands, even the bitten one'],
      ['Document re-layout', 'from €19', 'thesis, résumé, menu, flyer'],
      ['Format conversion', '€10', 'first file free (coupon)'],
      ['Hourly rate', '€20/h', 'for everything else'],
      ['House call', '€10', 'within 10 km of Via Belvedere 1 · free over €100'],
      ['Mac surcharge', '€0', 'same price, 30% more sighing'],
    ],
    nota: '*with your own licence. Prices are the 2009 parody list: call for a real quote, you’ll get one before anything starts. VAT not applicable (occasional services). Cash, PayPal, PostePay, bank transfer, salami (negotiable).',
  },

  // ── Telefonini, provider, pagamenti, social: tutto 2009 ──
  telefonini: {
    titolo: 'CELL PHONE CORNER',
    marche: ['Nokia', 'Motorola', 'Sony Ericsson', 'Samsung', 'LG', 'BlackBerry', 'HTC', 'Siemens', 'Alcatel', 'Palm', 'the bitten one'],
    modelli: ['Nokia 3310 (immortal)', 'Nokia N95', 'Motorola RAZR V3', 'Sony Ericsson W810', 'BlackBerry Curve', 'HTC Dream', 'Samsung Star', 'iPhone 3G (yes, that too)'],
    servizi: ['contacts backup (SIM → PC → new phone)', 'photos off the phone before it dies', 'polyphonic ringtones (see FREE RINGTONES)', 'wallpapers 176×220', 'Bluetooth file transfer, the hard way', 'screen & charger replacement', 'unlock, legally', 'MMS settings (remember MMS?)'],
  },
  provider: {
    titolo: 'INTERNET PROVIDERS I CONFIGURE',
    lista: ['Alice ADSL', 'Fastweb', 'Tiscali', 'Libero', 'Infostrada', 'Tele2', 'TIM', 'Wind', 'Vodafone', '3 (Tre)', '56k dial-up (respect)', 'Wi-Fi WEP (please upgrade)', 'FTTH (welcome to the future)'],
    nota: 'Router, modem, repeaters, network printers, LAN parties, the neighbour’s Wi-Fi (no).',
  },
  pagamenti: {
    titolo: 'WE ACCEPT',
    lista: ['Cash', 'Visa', 'MasterCard', 'PayPal', 'PostePay', 'Bancomat', 'Bank transfer', 'Salami (negotiable)'],
    donaTitolo: 'BUY PEKKO A COFFEE',
    donaTesto: 'Did this website make you laugh? Did Pekko fix your PC and you forgot to pay? Every euro buys one (1) sigh of relief. Donations go through PayPal, secure since 1998.',
    donaTasto: 'Donate',
    donaNota: 'Opens PayPal in a new window. Or bring salami.',
  },
  social: {
    titolo: 'FIND PEKKO ON',
    reti: [
      { nome: 'Instagram', href: site.social.find((s) => s.key === 'instagram')?.url || CONTATTI, colore: '#c13584', vero: true },
      { nome: 'GitHub', href: site.social.find((s) => s.key === 'github')?.url || CONTATTI, colore: '#333', vero: true },
      { nome: 'MSN Messenger', href: `mailto:${site.contact.email}`, colore: '#2e8b57', nota: `add me: ${site.contact.email}`, vero: true },
      { nome: 'MySpace', href: CONTATTI, colore: '#0a5ea8', nota: 'top 8 below' },
      { nome: 'Facebook', href: CONTATTI, colore: '#3b5998', nota: 'ask Pekko' },
      { nome: 'Twitter', href: CONTATTI, colore: '#33ccff', nota: '140 chars max' },
      { nome: 'Skype', href: CONTATTI, colore: '#00aff0', nota: 'ask for the name' },
      { nome: 'Netlog', href: CONTATTI, colore: '#ff6600', nota: 'RIP' },
      { nome: 'Badoo', href: CONTATTI, colore: '#ff4d6d', nota: 'no' },
      { nome: 'YouTube', href: CONTATTI, colore: '#cc0000', nota: 'channel 47' },
      { nome: 'Flickr', href: CONTATTI, colore: '#ff0084', nota: '9 photos' },
      { nome: 'Digg', href: CONTATTI, colore: '#1b6fb6', nota: 'digg it!' },
    ],
    condividi: ['Digg', 'del.icio.us', 'StumbleUpon', 'reddit', 'Facebook', 'MySpace', 'Twitter', 'e-mail'],
  },

  // ── Il forum (archivio phpBB, 2009) ──
  forum: {
    titolo: 'PEKKO’S FORUM',
    sotto: 'phpBB archive · 1,337 members · 12,003 posts · 0 spam (lol)',
    argomenti: [
      { titolo: '[SOLVED] printer prints blank pages!!!', chi: 'grandma_rita', risposte: 47, ultimo: 'pekko', quando: '03/14/2009', hot: true },
      { titolo: 'HELP!!! my msn wont login', chi: 'jessica_88', risposte: 12, ultimo: 'BigTony_MN', quando: '04/02/2009' },
      { titolo: 'Vista or XP???? (poll inside)', chi: 'dave', risposte: 1204, ultimo: 'raven_666', quando: '05/19/2009', hot: true },
      { titolo: 'best antivirus 2009??', chi: 'mike_from_mantova', risposte: 88, ultimo: 'pekko', quando: '06/28/2009' },
      { titolo: 'how 2 burn dvd', chi: 'PaoloPaolo', risposte: 6, ultimo: 'nerd4life', quando: '07/07/2009' },
      { titolo: 'is limewire safe?', chi: 'xXx_D4rk_L0rd_xXx', risposte: 3, ultimo: 'pekko', quando: '08/23/2009', chiuso: true },
      { titolo: 'my cat sat on the keyboard and now everything is in chinese', chi: 'kittylover2009', risposte: 21, ultimo: 'pekko', quando: '10/12/2009' },
      { titolo: 'PEKKO’S OUTFIT: rate the yellow suit', chi: 'the_snail', risposte: 404, ultimo: 'the_turtle', quando: '11/30/2009', hot: true },
      { titolo: '[STICKY] READ BEFORE POSTING: have u tried turning it off and on again', chi: 'pekko', risposte: 0, ultimo: 'pekko', quando: '06/28/2006', sticky: true },
    ],
    nota: 'Registration closed in 2010. To post, call Pekko. It’s faster anyway.',
  },

  // I commenti in stile SMS del 2010. `avatar` è un ritaglio del foglio avatar (1–9).
  commenti: [
    { chi: 'jessica_88', quando: '03/14/2009 11:52 PM', avatar: 'avatar-1', testo: 'omg pekko fixd my pc in like 2 hrs!!! ty ty ty!!! xoxo :)' },
    { chi: 'BigTony_MN', quando: '05/02/2009 06:14 AM', avatar: 'avatar-2', testo: 'my printer works now. i dont know how. i dont care. 5 stars.' },
    { chi: 'grandma_rita', quando: '05/19/2009 09:31 PM', avatar: 'avatar-3', testo: 'PEKKO FIXED MY PC!!!! now i can feed my virtual cows again!!!1', comic: true },
    { chi: 'mike_from_mantova', quando: '07/07/2009 01:03 AM', avatar: 'avatar-4', testo: 'he told me 2 stop downloading “free” screensavers. he was right :( epic fail on my part' },
    { chi: 'kittylover2009', quando: '08/23/2009 04:45 PM', avatar: 'avatar-5', testo: 'lol he found 4000 duplicate photos of my cat. all of them of my cat. kept 3999' },
    { chi: 'dave', quando: '10/12/2009 10:10 AM', avatar: 'avatar-6', testo: 'i thought vista was a virus. pekko said “close enough”' },
    { chi: 'nerd4life', quando: '11/30/2009 11:59 PM', avatar: 'avatar-7', testo: '10/10 would boot again. also he ate my salami. worth it. w00t' },
    { chi: 'raven_666', quando: '01/15/2010 02:22 AM', avatar: 'avatar-8', testo: 'my pc had 47 toolbars. pekko removed 46. i kept one for the memories.' },
    { chi: 'PaoloPaolo', quando: '02/28/2010 07:40 PM', avatar: 'avatar-9', testo: 'he came 2 my house in a yellow suit. printer got scared and started working' },
    { chi: 'xXx_D4rk_L0rd_xXx', quando: '04/01/2010 03:12 AM', avatar: null, testo: 'brb calling pekko' },
    { chi: 'the_turtle', quando: '04/01/2010 03:13 AM', avatar: null, testo: 'he is fast. too fast. — comment approved by the snail', moderato: true },
  ],

  sondaggio: {
    domanda: 'POLL: What’s your biggest computer problem?',
    voci: ['It’s slow', 'It’s loud', 'It’s on fire', 'It says “Vista”', '4,000 duplicate photos of my cat', 'I forgot the password (it’s the cat’s name)'],
    risultati: [31, 9, 4, 22, 18, 16],
    grazie: 'Thanks for voting! Your vote has been counted (it hasn’t).',
  },

  ecard: {
    intro: 'SEND AN E-CARD TO A FRIEND',
    carte: [
      { ad: 'ad-ecard-1', alt: 'E-card #1: Virus problem? I’ll turn that malware into a screensaver!' },
      { ad: 'ad-ecard-2', alt: 'E-card #2: Duplicate files? I can make them disappear!' },
      { ad: 'ad-ecard-3', alt: 'E-card #3: Printer problems? I’ll prove it’s not your fault' },
      { ad: 'ad-ecard-4', alt: 'E-card #4: Warrant out for your hard drive? I know a guy who knows a guy' },
      { ad: 'ad-ecard-5', alt: 'E-card #5: Slow PC? I’ll turn that Pentium into a slightly faster Pentium' },
      { ad: 'ad-ecard-6', alt: 'E-card #6: Forgot your password? I’ll guess it. It’s your cat’s name.' },
    ],
    fatto: 'is on its way to',
    fattoNota: 'Delivery by Snail Express Courier: 4–6 weeks. (No e-mail was sent. This is 2009. Better call Pekko.)',
  },

  tv: {
    testo: 'Channel 47, every night at 3 AM, right between the knife infomercial and the psychic hotline. Now with 200% more pixels.',
  },

  webcam: {
    titolo: 'LIVE OFFICE WEBCAM',
    sotto: 'CAM 1 · PEKKO’S OFFICE · VIA BELVEDERE 1',
    filtri: ['Normal', 'Sepia', 'Negative', 'Thermal', 'Pixelate', 'Mirror', 'Night vision', '2009'],
    aiuto: 'Pekko walks by every few seconds. Press USE MY WEBCAM to put yourself in his office (the picture never leaves your computer). Then choose an ugly filter and take a snapshot.',
    passanti: ['cut-punta', 'cut-pollici', 'cut-telefono', 'cut-boh', 'cut-stampante', 'cut-pistole', 'cut-laptop', 'cut-braccia', 'cut-cartello'],
    chat: [
      ['guest_1337', 'is he there??'],
      ['pekko', 'yes. always. what did the computer do'],
      ['guest_1337', 'it makes a noise like a boat'],
      ['pekko', 'thats the fan. or a boat. bring it in'],
      ['sandra72', 'hi pekko do u also fix toasters'],
      ['pekko', 'only if they run windows. kthxbai'],
    ],
    risposte: ['call me: 351-035-5506. si parla italiano', 'have you tried turning it off and on again? (i have to ask)', 'bring it in: via belvedere 1. i have a yellow suit and a lot of time', 'thats a virus. or a cat. either way, call me', 'brb, printer emergency', 'pwned. by a printer. again.', 'w00t, another satisfied customer'],
  },

  coupon: [
    { titolo: 'FREE VIRUS SCAN', testo: 'with any repair over €50', codice: 'NOVIRUS09', scade: 'Expires 12/31/2009 (still valid, nobody updated it)' },
    { titolo: '10% OFF', testo: 'driver installation. Must present coupon. Printing counts. Screenshots count. Just call.', codice: 'DRIVE10', scade: 'Limit one per household' },
    { titolo: 'BUY 1 WINDOWS, GET 1 OFFICE', testo: 'FREE* — *installation and setup, with your own licence. No pirate copies.', codice: 'WINOFF', scade: 'Void where prohibited' },
    { titolo: 'FREE CONSULTATION', testo: 'Pekko will look at your PC and sigh, free of charge.', codice: 'SIGH', scade: 'Cash value 1/100 of €0.01' },
  ],

  suonerie: [
    { nome: '56k Modem Handshake (original mix)', suono: 'modem' },
    { nome: 'Printer Jam (live at the office)', suono: 'printer' },
    { nome: 'Fax Machine (acoustic)', suono: 'fax' },
    { nome: 'Error Beep (extended remix)', suono: 'error' },
  ],

  gioco: {
    titolo: 'PUNCH THE VIRUS AND WIN!!!',
    aiuto: 'Click the virus 3 times to win a FREE consultation.',
    vinto: 'YOU WIN!!! Claim your prize:',
  },

  meteo: 'Rivalta sul Mincio: 21°C, partly cloudy. Chance of viruses: 80%.',
  webring: 'Mantova Computer Repair Webring',
  badges: ['Best viewed in Internet Explorer 6 at 1024×768', 'Made with Notepad', 'Valid HTML 3.2 (almost)', 'Y2K compliant', 'This site is under construction', 'No Flash required (we tried)', 'Get Firefox (or don’t)', 'Netscape friendly'],

  contattiPagina: {
    titolo: 'CONTACT PEKKO',
    sotto: 'FREE CONSULTATION · SI PARLA ITALIANO',
    passi: [
      'Call, WhatsApp, or fill in the form. Two lines are enough.',
      'Pekko calls you back within one business day, usually sooner. You get a price before anything starts.',
      'House call around Rivalta sul Mincio and the province of Mantova, remote help if the computer still turns on, or come by Via Belvedere 1.',
      'You get it back explained in plain words, and a sheet with the things to remember.',
    ],
    ufficio: 'VISIT THE OFFICE',
    ufficioNota: 'Look for the yellow suit. Ring twice: the tortoise is slow to answer.',
    modulo: 'TELL PEKKO WHAT HAPPENED',
    nota: 'Fields with * are required. The phone isn’t, but with it we’re faster.',
    invia: 'SEND TO PEKKO!',
    fatto: 'GOT IT!',
    fattoTesto: 'Pekko answers within one business day. If it’s on fire right now, call:',
  },
  tipi: [
    'Virus / slow PC',
    'Duplicate files & messy folders',
    'Printer or scanner not working',
    'Speakers, sound, microphone, drivers',
    'Windows install or restore',
    'Office install or problems',
    'Change operating system',
    'Documents: layout or format conversion',
    'Backup & data recovery',
    'Wi-Fi & home network',
    'Phone full or slow',
    'New PC setup',
    'Some other computer trouble',
  ],
  urgenze: ['Whenever', 'This week', 'By tomorrow', 'NOW, it’s an emergency!!!'],

  piede: {
    cause: 'CHECK OUT PEKKO’S PHILANTHROPIC CAUSES: THE SAVE THE FLOPPY DISK FOUNDATION (1.44 MB of hope)',
    legale: 'Not affiliated with any TV network, law firm, chicken restaurant or fruit company. Companies advertised on this page do not exist, except Pekko. Opinions about laptops with a bite in them are opinions.',
    ia: 'The photos of Pekko in loud suits, the stock photos, the avatars and the props are generated with AI from Pekko’s ID photo and composed by hand; the banners are built like it’s 2008. See the image credits.',
    aggiornato: 'Last updated: 06/28/2006',
    visitatore: 'You are visitor #',
  },
}
