// ─────────────────────────────────────────────────────────────────────────────
//  «BETTER CALL PEKKO» — i contenuti di bettercallpekko.it (e della copia su
//  /assistenza/ e /contatti/assistenza/ del sito serio, che rimanda al dominio):
//  l'assistenza informatica raccontata come il sito americano (2007–2010) di
//  Pekko, «the computer guy», alla Saul Goodman. Tutto in inglese; italiana è
//  solo la riga «SI PARLA ITALIANO». I paragrafi sono scritti apposta in
//  minuscolo e sgrammaticati (u, ur, 4, 2, plz…), come sui forum del 2009; i
//  titoli restano in Impact maiuscolo. Niente indirizzo di casa: solo il comune.
//  «Alberto Pecchini» compare solo nel credito legale e nella scheda «real name».
//
//  Le cose vive (contavisite, online, like, condivisioni, sondaggio, record del
//  gioco, forum, guestbook, shoutbox, e-card) le gestisce api/bcp.js su Vercel
//  Blob; il contenuto iniziale sta in src/data/bcp-seed.js.
//
//  Le voci di `tipi` e `urgenze` devono coincidere con api/contatti.js (FORMS.assistenza).
//  I prezzi sono il «listino 2009» della parodia: Alberto li conferma o li cambia qui.
// ─────────────────────────────────────────────────────────────────────────────

import { site } from './site.js'
import { projects } from './projects.js'

// Con SITE=bcp (la build del progetto Vercel di bettercallpekko.it) le due pagine
// stanno alla radice del dominio; altrimenti vivono dentro il sito serio.
export const BCP = typeof process !== 'undefined' && process.env?.SITE === 'bcp'
const PATH = BCP ? '/' : '/assistenza/'
const CONTATTI = BCP ? '/contact/' : '/contatti/assistenza/'

const cifre = site.contact.phone.replace(/\D/g, '') // 393510355506
const nazionale = cifre.replace(/^39/, '')
// Il numero come lo scrivono gli spot americani: 351-035-5506.
const bello = nazionale.length === 10 ? `${nazionale.slice(0, 3)}-${nazionale.slice(3, 6)}-${nazionale.slice(6)}` : site.contact.phone

// Solo il comune: l'indirizzo di casa non si pubblica (richiesta di Alberto, 29.09.2026).
const DOVE = `${site.location.city} (${site.location.province}), Italy`

// I siti veri di Alberto, dal portfolio (src/data/projects.js): stesso indirizzo e
// stessa cattura a pagina intera (rifatta ogni ora da tools/catture), raccontati
// da Pekko. Fatti e numeri sono quelli delle schede dei progetti, niente di inventato.
const PRJ = Object.fromEntries(projects.map((p) => [p.slug, p]))
const sito = (slug, extra) => {
  const p = PRJ[slug]
  return { slug, nome: p.title, url: p.web.url, dominio: p.web.domain, cattura: p.web.desktopTall, anteprima: p.web.desktop, anno: p.year, tech: p.technologies, ...extra }
}

export const assistenza = {
  path: PATH,
  contatti: CONTATTI,
  // Il dominio delle due pagine (www è il principale, l'apice rimanda lì) e i loro
  // indirizzi: canonical e og:url ci puntano sempre.
  dominio: 'https://www.bettercallpekko.it',
  urlPubblici: { '/assistenza/': '/', '/contatti/assistenza/': '/contact/' },
  // con la barra finale: vercel.json ha trailingSlash e senza passerebbe da un 308
  api: '/api/bcp/',
  lang: 'en',
  nome: 'Better Call Pekko',
  titolo: 'In Computer Trouble? Better Call Pekko! — I’m the computer guy (and I make websites). Computer repair & web design in Rivalta sul Mincio (Mantova, Italy)',
  descrizione:
    'pekko fixes computers: virus removal, duplicate files, printers that wont print, drivers, windows and office installs, phones, wi-fi. and he makes real websites, hand-coded: rivaltasulmincio.it, cascinafontana.xyz, ing. dario donelli, pzkko.it. rivalta sul mincio (mantova), house calls and remote help. si parla italiano.',
  titoloContatti: 'Contact Pekko — free consultation, si parla italiano',
  descrizioneContatti: 'phone, whatsapp, e-mail or the form: tell pekko what ur computer did and get an answer within 1 business day. rivalta sul mincio (mantova, italy), house calls and remote help.',

  telefono: bello,
  tel: `tel:${site.contact.phone.replace(/\s/g, '')}`,
  whatsapp: `https://wa.me/${cifre}?text=${encodeURIComponent('Hi Pekko! My computer did something terrible: ')}`,
  email: site.contact.email,
  dove: DOVE,
  mappa: `https://www.openstreetmap.org/?mlat=${site.location.lat}&mlon=${site.location.lon}#map=13/${site.location.lat}/${site.location.lon}`,
  paypal: 'https://www.paypal.biz/albertoxpecchini',
  instagram: site.social.find((s) => s.key === 'instagram')?.url || '',
  github: site.social.find((s) => s.key === 'github')?.url || '',
  nascita: '06/28/2006',
  slogan: 'IT’S ALL GOOD, MAN!',

  menu: [
    { label: 'Consultations', href: '#consultations' },
    { label: 'Websites!!!', href: '#websites', nuovo: true },
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

  striscia: `${bello} ● SI PARLA ITALIANO ● RIVALTA SUL MINCIO (MN) ● I’M THE COMPUTER GUY ● I ALSO MAKE WEBSITES, REAL ONES ● IT’S ALL GOOD, MAN! ● WWW.BETTERCALLPEKKO.IT`,

  popup: {
    barra: 'FREE CONSULTATION — Pekko, the computer guy',
    titolo: 'WAIT!!!',
    testo: 'in computer trouble? slow pc? printer pretending it cant hear u? duplicate photos of ur cat? dont close this window. u have rights. pekko can help!!!',
    si: 'YES, HELP ME!',
    chiama: 'CALL NOW',
    no: 'no thx, my pc is perfect (liar)',
  },

  // Il monologo dello spot, alla maniera dell'avvocato più famoso della TV.
  monologo:
    'hi. im pekko. did u know that u have rights? ur computer does too. the warranty says so, and so do i. i believe that until proven infected, every pc, laptop and printer in this country is innocent. thats why i fight 4 u, rivalta sul mincio! slow pc? virus? printer that wont print? dont wait. better call pekko!',

  video: [
    { ad: 'ad-thumb-1', label: 'DELETE ’EM NOW', alt: 'Consultation video: Pekko pointing at you, about duplicate files' },
    { ad: 'ad-thumb-2', label: 'PRINTER TROUBLE', alt: 'Consultation video: Pekko cradling a printer' },
    { ad: 'ad-thumb-3', label: 'PEKKO’S MAILBAG', alt: 'Consultation video: Pekko on the phone' },
    { ad: 'ad-thumb-4', label: 'VISTA 2007', alt: 'Consultation video: Pekko shrugging' },
  ],
  videoNota: 'video unavailable in ur country. better call pekko instead.',

  servizi: [
    ['Virus removal', 'malware, pop ups, seventeen toolbars, a pc that takes 10 minutes 2 boot. cleaned and speeded up. pwned.'],
    ['Duplicate files', 'the same holiday photos saved 4 times, "copy of copy of copy". i find them, u say ok, they r gone.'],
    ['Folder cleanup', 'desktop full, downloads exploding, photos on 3 disks and 2 phones. a place 4 everything. finally.'],
    ['Printer wont print', 'printers, scanners, "empty" cartridges that r full. it will print again today. probly.'],
    ['Speakers, sound, mic', 'mute speakers, mic that crackles, headphones that dont pair, webcam gone missing.'],
    ['Drivers', 'graphic, audio, network, the update that broke everything. right driver, right place. ez.'],
    ['Windows', 'clean install, upgrade, restore. all of them: 11 · 10 · 10/11 enterprise ltsc · arm64 · 8.1 · 8 · 7 · vista · xp · server.'],
    ['Office', 'install, repair, set up, with ur licence. 365 · 2024 · 2021 · 2019 · 2016 · 2013 · 2010 · office 4 mac.'],
    ['System restore', 'the pc goes back 2 day one without loosing ur photos and documents. no drama.'],
    ['Change operating system', 'windows 2 linux and back, old version 2 new. data safe, programs back, printer included.'],
    ['Document re-layout', 'thesis, cv, menus, flyers, reports: same words, decent look. even the table of contents that never aligns.'],
    ['Format conversion', 'doc, docx, odt, pages, pdf, pictures, audio, video: i open it, u get it back in the format u need.'],
    ['Backup & recovery', 'b4 its too late. or right after, we can try.'],
    ['Wi-Fi & home network', 'routers, repeaters, cables, network printers, the corner of the house with no signal.'],
    ['Cell phones', 'contacts backup, photos off the phone, ringtones, screens, chargers. all brands, even the bitten one.'],
    ['New pc, turnkey', 'set up, moved in from the old one, ready 2 go. u just turn it on.'],
    ['Passwords & e-mail', 'accounts, logins, two factor. yes i will guess it. its the cat.'],
    ['Inside cleaning & parts', 'ssd, ram, fans, thermal paste. the pc stops sounding like a hairdryer.'],
    ['Macs too', 'yes, they break. same prices, slightly more sighing. no genius required.'],
    ['Websites', 'i also make websites. real ones, hand-coded, online right now: see WEBSITES!!! (this one took a afternoon in 2006, allegedly).'],
  ],
  windows: ['Windows 11', 'Windows 10', 'Windows 10 / 11 Enterprise LTSC', 'Windows ARM64', 'Windows 8.1', 'Windows 8', 'Windows 7', 'Windows Vista', 'Windows XP', 'Windows Server'],
  office: ['Office 365', 'Office 2024', 'Office 2021', 'Office 2019', 'Office 2016', 'Office 2013', 'Office 2010', 'Office for Mac'],

  omaggio: {
    titolo: 'WINDOWS OR OFFICE — FREE*',
    testo: 'with ur first repair over €50 pekko installs and sets up windows or office 4 free: system updated, programs where they belong, printer connected. its all good, man.',
    nota: '*free is the installation, update and setup work, with ur own licence or one bought separately. no pirate copies: they carry more viruses than i remove.',
  },

  about: {
    titolo: 'ABOUT PEKKO',
    sotto: 'a.k.a. the computer guy · it’s all good, man',
    intro: 'hi!!! im pekko. i repair computers. thats it thats the bio. everything else below is bonus content ^_^',
    scheda: [
      ['Name', 'PEKKO (also pzkko, PeKKo, slippin pekko)'],
      ['Real name', 'alberto pecchini. dont tell anyone'],
      ['Born', '06/28/2006, same day this website was last updated (coincidence? yes)'],
      ['Location', 'rivalta sul mincio (mn), italy. house calls in the province, remote help everywhere'],
      ['Job', 'im the computer guy. i repair computers. also printers, wich are not computers, they r enemies'],
      ['Status', 'available (4 repairs)'],
      ['Languages', 'italian, english, windows error codes, printer noises'],
      ['Mood', 'fixing'],
      ['Now playing', '56k modem handshake (extended remix)'],
      ['Currently drinking', 'coffee (donate one below)'],
      ['Office', 'by appointment. also 3 am on channel 47'],
      ['Transport', 'pc ambulance (a white van in my imagination), a motorbike (no drivers needed)'],
      ['Motto', 'until proven infected, every computer is innocent'],
    ],
    piace: ['printers that print', 'the mincio river', 'salami (payment accepted)', 'floppy disks (1.44 mb of hope)', 'impact font, in 3d', 'the sound of a fixed fan', 'my nutria', 'my giant african snail'],
    nonPiace: ['vista', 'toolbars (all seventeen)', '"free" screensavers', 'the price of a charger with a bite on it', 'ppl who say "it just stopped working"', 'ink cartridges that r "empty"'],
    staff: [
      { nome: 'PEKKO', ruolo: 'ceo, cto, the computer guy', img: 'cut-punta', nota: 'points at things until they work' },
      { nome: 'THE NUTRIA', ruolo: 'head of security', img: '/media/mascotte/nutria.webp', nota: 'eats grass, never been hacked' },
      { nome: 'THE SNAIL', ruolo: 'customer relations', img: '/media/mascotte/lumaca.webp', nota: 'leaves a trail, follows up' },
    ],
    album: ['cut-punta', 'cut-pollici', 'cut-telefono', 'cut-laptop', 'cut-braccia', 'cut-cartello', 'cut-boh', 'cut-pistole', 'cut-stampante'],
    albumTitolo: 'PEKKO’S OUTFIT — rate my suit!!!',
    albumNota: 'click 👍 on the suit u like. real votes, no cheating (the nutria is watching)',
    siti: [
      { label: 'rivaltasulmincio.it', href: 'https://www.rivaltasulmincio.it' },
      { label: 'cascinafontana.xyz', href: 'https://www.cascinafontana.xyz' },
      { label: 'ing. dario donelli', href: PRJ['dario-donelli'].web.url },
      { label: 'pzkko.it', href: PRJ['pzkko-it'].web.url },
      { label: 'the serious website', href: site.url },
    ],
  },

  // ── «Pekko makes websites»: il lavoro vero, più di tutto i siti ──────────────
  // Gli annunci della sezione vengono dal canvas di Claude Design (tools/assistenza/design).
  web: {
    titolo: 'PEKKO MAKES WEBSITES',
    sotto: 'real ones · hand-coded · online right now · click them',
    intro:
      'yes, the computer guy also makes websites. not the 2008 kind like this one (this one is a joke, on purpose): real sites 4 a village, a farm, an engineer and himself. written by hand, no wordpress, no templates, no trackers, fast on a phone. open them in pekko explorer, scroll, then visit them 4 real:',
    siti: [
      sito('rivaltasulmincio-it', {
        tab: 'rivaltasulmincio.it',
        ad: 'ad-web-rivalta',
        alt: '184 places. 1 village. 0 trackers. rivaltasulmincio.it, now in beta! Visit rivaltasulmincio.it',
        testo: 'an atlas of my village on the mincio. 184 places from openstreetmap on a map and in 124 cards, the weather from the village station, a local newspaper, and next 2 every number: where it comes from and when it was checked. 132 static pages, ~3 kb of javascript when it opens, no tracking. its in beta (the honest kind).',
        numeri: [['184', 'places'], ['132', 'pages'], ['~3 kb', 'of js on load']],
      }),
      sito('cascina-fontana', {
        tab: 'cascinafontana.xyz',
        ad: 'ad-web-cascina',
        alt: 'Hay! This website has 0 cookies. Cascina Fontana, est. 2007, Rodigo. cascinafontana.xyz',
        testo: 'the farm of my family in rodigo, since 2007: milk 4 grana padano, corn, wheat, alfalfa, and hay, firewood and flowers sold at the farm. 5 pages of plain html, css and javascript, photos i took myself, a 12-month calendar 4 every product and 1 single action: call. no cookies, nothing from third parties.',
        numeri: [['5', 'pages'], ['221', 'lines of js'], ['0', 'cookies']],
      }),
      sito('dario-donelli', {
        tab: 'ing. dario donelli',
        ad: 'ad-web-donelli',
        alt: 'Serious engineer. Serious website. Ing. Dario Donelli, Rivalta sul Mincio — pekko wore a tie for this one',
        testo: 'the studio of an engineer in rivalta sul mincio. black and white like the metal plate on his door, the name lands while u scroll (pure css, no libraries) and a map of the mantova province drawn in svg with the right projection: 21 towns, the mincio, the lakes, the park. ~90 kb of code, 0 profiling cookies. pekko wore a tie.',
        numeri: [['1', 'page'], ['22', 'places on the map'], ['90 kb', 'of code']],
      }),
      {
        ...sito('albertopecchini-it', {}),
        url: site.url,
        tab: 'the serious twin',
        ad: 'ad-web-twin',
        alt: 'Same guy. Different font. Pekko fixes computers — Alberto Pecchini: houses, websites & brands',
        testo: 'pekkos serious twin. same guy, different font: the portfolio of alberto pecchini, in italian. houses, websites, brands and computers. pages generated from data, technical drawings drawn by code, a snail and a nutria whose eyes follow ur mouse. 0 frameworks, 0 tracking cookies.',
        numeri: [['0', 'frameworks'], ['0', 'tracking cookies'], ['2', 'pets on the staff']],
      },
      sito('pzkko-it', {
        tab: 'pzkko.it',
        ad: 'ad-web-pzkko',
        alt: 'pzkko: all my sites & socials on 1 wall. Pekko points at a yellow flyer with tear-off tabs on a rolling shutter: tear 1 off!!! 3D roulette inside! pzkko.it',
        testo: 'pekkos name on the internet, glued 2 a wall. a rolling shutter covered in flyers, 1 4 every site and social, with tear-off tabs that copy the contact. at sunset in mantova the wall gets dark and the neon sign turns on, and 1 flyer opens a 3d roulette with real physics: the ball stops where it stops (fake money only). no build, no frameworks, just files.',
        numeri: [['1', 'wall'], ['157', 'roulette bets'], ['0', 'build steps']],
      }),
      {
        slug: 'bettercallpekko',
        nome: 'Better Call Pekko',
        url: 'https://www.bettercallpekko.it/',
        dominio: 'bettercallpekko.it',
        cattura: null, // la cattura di questa pagina: media['shot-bcp'] (vedi il template)
        tab: 'bettercallpekko.it',
        tech: ['HTML', 'CSS', 'JavaScript', 'Vercel Blob', 'Claude Design', 'GIF (a lot)'],
        testo: 'this one. u r here. built like its 2008 on purpose: 960 px, gifs, impact in 3d. but the visitor counter, the likes, the forum, the guestbook and the shoutbox r real, and the banners r drawn in vector with real fonts b4 becoming gifs. the only website where pekko is allowed 2 blink.',
        numeri: [['2008', 'on purpose'], ['100%', 'real counters'], ['1', 'nutria moderator']],
      },
    ],
    servizi: [
      ['Websites', '4 professionals, shops, villages and farms. clear structure, real texts, fast. online with domain and hosting set up.'],
      ['Landing pages', '1 page, 1 goal: a call, a sign-up, a sale. u see from day 1 if it works.'],
      ['UI/UX', 'wireframes and clickable prototypes in figma, tried on real ppl b4 writing a line of code.'],
      ['Frontend', 'semantic html, modern css, javascript or typescript. react only when it really helps. animations yes, gratuitous ones no.'],
      ['Responsive', 'the phone is not a tiny desktop: layouts designed 4 the thumb and checked from 320 2 1920 px.'],
      ['Maintenance', 'updates, fixes, new pages, backups. the guy who built it is the guy who answers.'],
      ['Speed & SEO', 'sites u already have: speed, accessibility, technical seo. before and after measured with lighthouse.'],
      ['Logos & graphics', 'logos drawn on a grid, colours, business cards, flyers, posters. delivered in vector.'],
    ],
    faq: [
      ['do i need a website if i have facebook?', 'facebook is a rented room. a website is ur house: ur address, ur rules, and google finds it. keep both if u like.'],
      ['wordpress?', 'no. pekko writes the pages by hand: nothing 2 update every week, nothing 4 hackers 2 guess, nothing that slows it down.'],
      ['how long does it take?', 'u get a date at the start, and if it slips u r the first 2 know. a one-pager is quicker than a village atlas with 184 places.'],
      ['how much?', 'a written quote, item by item, so u see what u can remove. the consultation is free. the sigh too.'],
      ['who owns it?', 'u do. the source files come with the site, always, with a note that explains how they r organised.'],
      ['can i change the texts myself?', 'yes, or pekko does it. the first 30 days of help r included, and after that he still picks up the phone.'],
      ['cookie banner?', 'no trackers = no "accept all cookies" wall in front of ur visitors. this site has a fake 2008 pop-up instead. sorry.'],
    ],
    altro: {
      titolo: 'Other stuff Pekko does (4 real)',
      voci: [
        ['Drawings', 'houses, roads and building sites in autocad: plans, sections, road profiles, cubic metres of dirt. diploma in construction & surveying, class of 2026.'],
        ['3D models', 'glulam timber roofs modelled in 3d at a real timber company, during school internships, with the quote followed live with the customer.'],
        ['Graphics', 'logos, colours, business cards, posters, the letterhead of the serious twin.'],
        ['Computers', 'the whole rest of this page.'],
      ],
      nota: 'the serious version, in italian, with the whole portfolio:',
    },
    // «Lo sapevi?»: fatti veri, uno alla volta nella colonna destra.
    sapevi: [
      'rivaltasulmincio.it knows 184 places. pekko checked where every single one comes from.',
      'cascinafontana.xyz has exactly 221 lines of javascript. pekko counted them. twice.',
      'the map on dario donellis website was drawn in svg, with the right projection 4 mantova.',
      'on the serious website the snail and the nutria follow ur mouse with their eyes. try it.',
      'pzkko.it calculates the sunset in mantova by itself, no internet needed. when the sun goes down there, the neon sign turns on, wherever u r.',
      'this website was last updated on 06/28/2006, the day pekko was born.',
      'every banner on this page was drawn in vector, with real fonts, then baked into a gif. like its 2008.',
      'the photos of pekko in loud suits come from 1 id photo and a lot of ai. the suits r not for sale (yet).',
      'the nutria moderates the forum. it has never been hacked. it has eaten 3 spam posts.',
      'pekkos websites have 0 tracking cookies. pekko accepts real cookies (the ones u eat).',
      'there is a secret on this page. ↑ ↑ ↓ ↓ ← → ← → B A',
    ],
    segreto: {
      titolo: 'U FOUND THE SECRET!!!',
      testo: 'the konami code still works in 2026. pekko is proud of u. the nutria is not impressed. as a reward: pekko dancing, and the knowledge that u r a person of culture.',
      conta: 'ppl found it so far (4 real)',
    },
    cta: 'UR WEBSITE NEXT?',
    ctaTipo: 'I want a website!!!',
  },

  prezzi: {
    titolo: 'PRICE LIST',
    sotto: '2009 edition · call 4 todays prices · si parla italiano',
    voci: [
      ['Consultation', 'FREE', 'phone, whatsapp, e-mail or in person'],
      ['Sigh', 'FREE', 'unlimited'],
      ['Virus removal & cleanup', '€39', 'toolbars removed at no extra charge'],
      ['Duplicate file hunt', '€29', 'u keep the cat photos u want'],
      ['Windows clean install', '€49', 'FREE with ur first repair over €50*'],
      ['Office install & setup', '€29', 'FREE with ur first repair over €50*'],
      ['Printer exorcism', '€25', 'holy water not included'],
      ['Speakers / drivers / sound', '€25', 'until u can hear the error beep again'],
      ['Data recovery', 'from €59', 'depends how dead it is'],
      ['Backup setup', '€29', 'b4 its too late (or €59 right after)'],
      ['PC inside cleaning', '€35', 'fans, dust, thermal paste'],
      ['Wi-Fi & home network', '€35', 'router, repeaters, the dead corner'],
      ['Cell phone contacts backup', '€10', 'all brands, even the bitten one'],
      ['Document re-layout', 'from €19', 'thesis, cv, menu, flyer'],
      ['Format conversion', '€10', 'first file free (coupon)'],
      ['Website', 'ASK', 'written quote, item by item. consultation free'],
      ['Hourly rate', '€20/h', '4 everything else'],
      ['House call', '€10', 'around rivalta sul mincio · free over €100'],
      ['Mac surcharge', '€0', 'same price, 30% more sighing'],
    ],
    nota: '*with ur own licence. prices r the 2009 parody list: call 4 a real quote, u get one b4 anything starts. vat not applicable (occasional services). cash, paypal, postepay, bank transfer, salami (negotiable).',
  },

  telefonini: {
    titolo: 'CELL PHONE CORNER',
    marche: ['Nokia', 'Motorola', 'Sony Ericsson', 'Samsung', 'LG', 'BlackBerry', 'HTC', 'Siemens', 'Alcatel', 'Palm', 'the bitten one'],
    modelli: ['Nokia 3310 (immortal)', 'Nokia N95', 'Motorola RAZR V3', 'Sony Ericsson W810', 'BlackBerry Curve', 'HTC Dream', 'Samsung Star', 'iPhone 3G (yes, that too)'],
    servizi: ['contacts backup (sim → pc → new phone)', 'photos off the phone b4 it dies', 'polyphonic ringtones (see FREE RINGTONES)', 'wallpapers 176×220', 'bluetooth file transfer, the hard way', 'screen & charger replacement', 'unlock, legally', 'mms settings (remember mms?)'],
  },
  provider: {
    titolo: 'INTERNET PROVIDERS I CONFIGURE',
    lista: ['Alice ADSL', 'Fastweb', 'Tiscali', 'Libero', 'Infostrada', 'Tele2', 'TIM', 'Wind', 'Vodafone', '3 (Tre)', '56k dial-up (respect)', 'Wi-Fi WEP (plz upgrade)', 'FTTH (welcome 2 the future)'],
    nota: 'router, modem, repeaters, network printers, lan parties, the neighbours wifi (no).',
  },
  pagamenti: {
    titolo: 'WE ACCEPT',
    lista: ['Cash', 'Visa', 'MasterCard', 'PayPal', 'PostePay', 'Bancomat', 'Bank transfer', 'Salami (negotiable)'],
    donaTitolo: 'BUY PEKKO A COFFEE',
    donaTesto: 'did this website make u laugh? did pekko fix ur pc and u forgot 2 pay? every euro buys 1 sigh of relief. donations go thru paypal, the real one.',
    donaTasto: 'Donate',
    donaNota: 'opens paypal in a new window. or bring salami.',
  },

  // Solo link che funzionano davvero.
  social: {
    titolo: 'FIND PEKKO ON',
    reti: [
      { nome: 'Instagram', href: site.social.find((s) => s.key === 'instagram')?.url || CONTATTI, colore: '#c13584', nota: '@albertoxpecchini' },
      { nome: 'GitHub', href: site.social.find((s) => s.key === 'github')?.url || CONTATTI, colore: '#333', nota: 'the code of this site' },
      { nome: 'WhatsApp', href: `https://wa.me/${cifre}`, colore: '#25a244', nota: bello },
      { nome: 'E-mail', href: `mailto:${site.contact.email}`, colore: '#2e5fb8', nota: 'msn is dead. rip' },
      { nome: 'Phone', href: `tel:${site.contact.phone.replace(/\s/g, '')}`, colore: '#e21212', nota: 'call. like its 2009' },
      { nome: 'PayPal', href: 'https://www.paypal.biz/albertoxpecchini', colore: '#003087', nota: 'donate a coffee' },
    ],
  },
  // Condivisioni vere: ogni rete apre la sua pagina di condivisione.
  condividi: [
    { k: 'facebook', nome: 'Facebook', colore: '#3b5998' },
    { k: 'twitter', nome: 'Twitter / X', colore: '#1da1f2' },
    { k: 'whatsapp', nome: 'WhatsApp', colore: '#25a244' },
    { k: 'telegram', nome: 'Telegram', colore: '#2aa3df' },
    { k: 'reddit', nome: 'Reddit', colore: '#ff4500' },
    { k: 'email', nome: 'E-mail', colore: '#666' },
    { k: 'copy', nome: 'Copy link', colore: '#111' },
  ],
  shareTesto: 'LOL better call pekko!!! the computer guy from rivalta sul mincio',

  forum: {
    titolo: 'PEKKO’S FORUM',
    sotto: 'real topics by real ppl · no links · no spam · the nutria moderates',
    nota: 'posts r public. dont write ur phone number or ur address plz. for real problems use the contact page',
  },

  guestbook: {
    titolo: 'Pekko worked for me!!!!',
    nota: 'ur comment is public and stays here. no links. dont write ur real phone/address. comments r moderated by pekkos nutria (expect delays, it is eating)',
  },

  sondaggio: {
    domanda: 'POLL: whats ur biggest computer problem?',
    voci: ['its slow', 'its loud', 'its on fire', 'it says "vista"', '4000 duplicate photos of my cat', 'i forgot the password (its the cats name)'],
    grazie: 'thx 4 voting! ur vote has been counted (4 real this time)',
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
    aiuto: 'fill in the names, pick a card, press submit: u get a real link 2 send on whatsapp, e-mail or wherever. ur friend opens it and gets the card. 100% real, 0% spam',
  },

  tv: {
    testo: 'channel 47, every night at 3 am, right between the knife infomercial and the psychic hotline. now with 200% more pixels.',
  },

  webcam: {
    titolo: 'LIVE OFFICE WEBCAM',
    sotto: 'CAM 1 · PEKKO’S OFFICE · RIVALTA SUL MINCIO',
    filtri: ['Normal', 'Sepia', 'Negative', 'Thermal', 'Pixelate', 'Mirror', 'Night vision', '2009'],
    aiuto: 'pekko walks by every few seconds. press USE MY WEBCAM 2 put urself in his office (the picture never leaves ur computer). then choose a ugly filter and take a snapshot.',
    passanti: ['cut-punta', 'cut-pollici', 'cut-telefono', 'cut-boh', 'cut-stampante', 'cut-pistole', 'cut-laptop', 'cut-braccia', 'cut-cartello', 'web-tastiera', 'web-mouse', 'web-evviva', 'web-lente', 'web-monitor', 'web-cuffie'],
    shoutTitolo: 'SHOUTBOX (real, public, live)',
    shoutNota: 'say hi. every1 sees it. no links. pekko reads it when hes not fixing printers',
  },

  coupon: [
    { titolo: 'FREE VIRUS SCAN', testo: 'with any repair over €50', codice: 'NOVIRUS09', scade: 'expires 12/31/2009 (still valid, nobody updated it)' },
    { titolo: '10% OFF', testo: 'driver installation. show this coupon. printing counts. screenshots count. just call.', codice: 'DRIVE10', scade: 'limit one per household' },
    { titolo: 'BUY 1 WINDOWS, GET 1 OFFICE', testo: 'FREE* — *installation and setup, with ur own licence. no pirate copies.', codice: 'WINOFF', scade: 'void where prohibited' },
    { titolo: 'FREE CONSULTATION', testo: 'pekko will look at ur pc and sigh, free of charge.', codice: 'SIGH', scade: 'cash value 1/100 of €0.01' },
  ],

  suonerie: [
    { nome: '56k Modem Handshake (original mix)', suono: 'modem' },
    { nome: 'Printer Jam (live at the office)', suono: 'printer' },
    { nome: 'Fax Machine (acoustic)', suono: 'fax' },
    { nome: 'Error Beep (extended remix)', suono: 'error' },
  ],

  gioco: {
    titolo: 'PUNCH THE VIRUS AND WIN!!!',
    aiuto: 'hit the virus 3 times as fast as u can. the clock starts on ur first click. best times go in the hall of fame (4 real)',
    vinto: 'U WIN!!! claim ur prize:',
  },

  meteo: 'rivalta sul mincio: 21°C, partly cloudy. chance of viruses: 80%.',
  badges: ['Best viewed in Internet Explorer 6 at 1024×768', 'Made with Notepad', 'Valid HTML 3.2 (almost)', 'Y2K compliant', 'This site is under construction', 'No Flash required (we tried)', 'Get Firefox (or don’t)', 'Netscape friendly'],

  contattiPagina: {
    titolo: 'CONTACT PEKKO',
    sotto: 'FREE CONSULTATION · SI PARLA ITALIANO',
    passi: [
      'call, whatsapp, or fill in the form. 2 lines r enough.',
      'pekko calls u back within 1 business day, usually sooner. u get a price b4 anything starts.',
      'house call around rivalta sul mincio and the province of mantova, or remote help if the computer still turns on.',
      'u get it back explained in plain words, and a sheet with the things 2 remember. its all good, man.',
    ],
    ufficio: 'WHERE 2 FIND PEKKO',
    ufficioTesto: 'rivalta sul mincio (mn), italy. no office with columns (yet): pekko comes 2 u, or fixes it from remote. we can also meet 4 a coffee (u pay).',
    modulo: 'TELL PEKKO WHAT HAPPENED',
    nota: 'fields with * r required. the phone isnt, but with it we r faster.',
    invia: 'SEND TO PEKKO!',
    fatto: 'GOT IT!',
    fattoTesto: 'pekko answers within 1 business day. if its on fire right now, call:',
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
    'I want a website!!!',
    'Logo or graphics',
    'Some other computer trouble',
  ],
  urgenze: ['Whenever', 'This week', 'By tomorrow', 'NOW, it’s an emergency!!!'],

  piede: {
    cause: 'CHECK OUT PEKKO’S PHILANTHROPIC CAUSES: THE SAVE THE FLOPPY DISK FOUNDATION (1.44 MB OF HOPE)',
    legale: 'not affiliated with any tv network, law firm, chicken restaurant or fruit company. companies advertised on this page do not exist, except pekko. opinions about laptops with a bite in them r opinions.',
    ia: 'the photos of pekko in loud suits, the stock photos, the avatars, the icons and the props r generated with ai from pekkos id photo and composed by hand; the banners r drawn in vector (claude design, real fonts) and baked into gifs like its 2008. the website screenshots r real. see the image credits.',
    aggiornato: 'Last updated: 06/28/2006',
    visitatore: 'you are visitor #',
  },
}
