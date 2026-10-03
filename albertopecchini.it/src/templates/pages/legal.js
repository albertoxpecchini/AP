// Privacy, cookie policy e pagina 404.
// I testi legali sono un modello redatto sulla base del GDPR: vanno riletti dal
// titolare (o da un consulente) prima della pubblicazione.

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { button, breadcrumb, monogram, splitWords, figurina, puppet } from '../components/ui.js'
import { crediti } from '../../data/crediti.js'

const updated = () => new Date(site.legal.updated).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

const legalShell = ({ crumb, href, title, intro, sections }) => html`
  <article class="legal">
    <div class="container legal__wrap">
      ${breadcrumb([{ label: 'Home', href: '/' }, { label: crumb, href }])}
      <header class="legal__head">
        <p class="label">Note legali · aggiornata il ${updated()}</p>
        <h1 class="h1">${esc(title)}</h1>
        <p class="lead">${esc(intro)}</p>
      </header>
      <nav class="legal__toc" aria-label="Indice del documento">
        <ol>${sections.map((s, i) => `<li><a href="#s${i + 1}"><span class="label">${String(i + 1).padStart(2, '0')}</span>${esc(s.title)}</a></li>`)}</ol>
      </nav>
      <div class="legal__body">
        ${sections.map((s, i) => `<section id="s${i + 1}"><h2 class="h3"><span class="label">${String(i + 1).padStart(2, '0')}</span>${esc(s.title)}</h2>${s.body}</section>`)}
      </div>
    </div>
  </article>
`

export function privacyPage() {
  const owner = `${esc(site.legal.owner)}, ${esc(site.location.address)}, ${esc(site.location.cap)} ${esc(site.location.city)} (${esc(site.location.province)})${site.legal.piva ? ` — P. IVA ${esc(site.legal.piva)}` : ''}`
  return legalShell({
    crumb: 'Privacy',
    href: '/privacy/',
    title: 'Informativa sulla privacy',
    intro: 'Come vengono trattati i dati personali di chi visita questo sito o mi scrive, ai sensi dell’art. 13 del Regolamento (UE) 2016/679.',
    sections: [
      { title: 'Titolare del trattamento', body: `<p>${owner}.<br>Per ogni richiesta relativa ai tuoi dati: <a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a>.</p>` },
      {
        title: 'Quali dati tratto',
        body: `<ul>
          <li><strong>Dati che mi invii tu.</strong> Nome, email, telefono (facoltativo), tipo di progetto, budget indicativo (facoltativo) e testo del messaggio, quando compili il modulo di contatto o mi scrivi via email.</li>
          <li><strong>Dati di navigazione.</strong> Il fornitore di hosting registra nei propri log tecnici l’indirizzo IP, la data e l’ora della richiesta, la pagina richiesta e il tipo di browser. Servono al funzionamento e alla sicurezza del servizio e non vengono usati per identificarti.</li>
        </ul>
        <p>Il sito non usa strumenti di analisi statistica, pixel pubblicitari né sistemi di profilazione.</p>`,
      },
      {
        title: 'Perché li tratto e su quale base',
        body: `<ul>
          <li>Rispondere alla tua richiesta e preparare un preventivo: esecuzione di misure precontrattuali (art. 6, par. 1, lett. b GDPR).</li>
          <li>Adempiere a obblighi fiscali e contabili in caso di incarico: obbligo di legge (art. 6, par. 1, lett. c).</li>
          <li>Garantire la sicurezza del sito: legittimo interesse del titolare (art. 6, par. 1, lett. f).</li>
        </ul>`,
      },
      { title: 'Per quanto tempo', body: '<p>Le richieste che non si trasformano in un incarico vengono cancellate entro 12 mesi. I dati dei clienti sono conservati per 10 anni, come richiesto dalla normativa fiscale. I log tecnici dell’hosting seguono i tempi del fornitore, di norma non oltre 30 giorni.</p>' },
      {
        title: 'A chi possono essere comunicati',
        body: `<p>Ai fornitori che rendono possibile il servizio, nominati, ove necessario, responsabili del trattamento:</p>
        <ul>
          <li><strong>Vercel Inc.</strong> — hosting del sito e del modulo di contatto.</li>
          <li><strong>Resend (Plus Five Five, Inc.)</strong> — recapito via email dei messaggi inviati dal modulo.</li>
          <li><strong>CallMeBot</strong> — notifica su WhatsApp dei messaggi inviati dal modulo, così da poterti rispondere prima.</li>
          <li><strong>Cloudflare, Inc.</strong> — servizio antispam Turnstile, che distingue le persone dai programmi automatici (vedi «Protezione antispam»).</li>
          <li><strong>Il fornitore della casella di posta</strong> su cui ricevo e conservo i messaggi.</li>
        </ul>
        <p>Se un fornitore ha sede fuori dallo Spazio Economico Europeo, il trasferimento avviene sulla base di decisioni di adeguatezza o clausole contrattuali standard. I dati non vengono venduti né ceduti a terzi per finalità di marketing.</p>`,
      },
      {
        title: 'Better Call Pekko (bettercallpekko.it)',
        body: '<p>Le pagine di <strong>bettercallpekko.it</strong> hanno un forum, un guestbook, una shoutbox, un sondaggio, una classifica e dei contatori. Quello che scrivi lì (un nome o soprannome a tua scelta e il messaggio) è <strong>pubblico</strong> e resta visibile finché non lo cancello: non scrivere numeri di telefono, indirizzi o dati di altre persone. I testi sono salvati su <strong>Vercel Blob</strong> (Vercel Inc.); l’indirizzo IP non viene salvato, serve solo per qualche minuto, in memoria, a limitare gli invii ripetuti. Like, voto e nome si ricordano nel tuo browser (archiviazione locale), non sul server. Per far togliere un tuo messaggio scrivimi: lo cancello. La base giuridica è il consenso che dai pubblicando.</p>',
      },
      {
        title: 'Protezione antispam',
        body: '<p>Il modulo di contatto è protetto da <strong>Cloudflare Turnstile</strong>, che verifica che a scrivere sia una persona e non un programma automatico. Per farlo analizza il comportamento del browser durante la compilazione e riceve l’indirizzo IP; nella maggior parte dei casi la verifica è invisibile e non richiede alcuna azione. Turnstile non installa cookie di profilazione e non viene usato per tracciarti su altri siti. La base giuridica è il legittimo interesse a proteggere il sito dagli invii automatici (art. 6, par. 1, lett. f GDPR). Insieme al messaggio registro anche l’indirizzo IP di provenienza e il momento dell’invio, per la stessa finalità di sicurezza.</p>',
      },
      {
        title: 'I tuoi diritti',
        body: `<p>Puoi chiedere in ogni momento l’accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità, e puoi opporti al trattamento (artt. 15–22 GDPR). Basta una email a <a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a>: rispondo entro 30 giorni.</p>
        <p>Se ritieni che il trattamento violi la normativa puoi proporre reclamo al <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener">Garante per la protezione dei dati personali<span class="sr-only"> (nuova scheda)</span></a>.</p>`,
      },
      { title: 'Conferimento dei dati', body: '<p>Il conferimento dei dati contrassegnati come obbligatori nel modulo è necessario per poterti rispondere; gli altri sono facoltativi e servono solo a preparare una risposta più precisa.</p>' },
      { title: 'Cookie', body: '<p>Il sito non installa cookie di profilazione. I dettagli sono nella <a href="/cookie/">cookie policy</a>.</p>' },
    ],
  })
}

export function cookiePage() {
  return legalShell({
    crumb: 'Cookie',
    href: '/cookie/',
    title: 'Cookie policy',
    intro: 'Questo sito non usa cookie di profilazione né strumenti di tracciamento. Per questo non trovi un banner: non c’è un consenso da chiedere.',
    sections: [
      { title: 'Cosa viene salvato nel tuo browser', body: `<p>Solo due informazioni tecniche, che non ti identificano e non lasciano il tuo dispositivo:</p>
        <div class="legal__table" role="region" aria-label="Elenco degli archivi locali" tabindex="0"><table>
          <thead><tr><th scope="col">Nome</th><th scope="col">Tipo</th><th scope="col">Scopo</th><th scope="col">Durata</th></tr></thead>
          <tbody>
            <tr><td><code>ap:nav</code></td><td>sessionStorage</td><td>Ricorda che stai passando da una pagina all’altra, per animare la transizione</td><td>Pochi secondi</td></tr>
            <tr><td><code>ap:view</code></td><td>localStorage</td><td>Ricorda se nel portfolio preferisci la griglia o l’elenco</td><td>Finché non svuoti i dati del browser</td></tr>
          </tbody>
        </table></div>
        <p>Sono strumenti tecnici strettamente necessari, esenti da consenso ai sensi delle Linee guida del Garante del 10 giugno 2021.</p>` },
      { title: 'Risorse di terze parti', body: '<p>Caratteri tipografici, script e immagini sono serviti da questo stesso dominio: aprire una pagina non comporta richieste verso Google Fonts, reti pubblicitarie o social network. Non sono presenti mappe o video incorporati.</p>' },
      { title: 'Collegamenti esterni', body: '<p>I link verso altri siti — i progetti online, OpenStreetMap, i profili social — si aprono in una nuova scheda. Da quel momento valgono le regole sulla privacy del sito di destinazione.</p>' },
      { title: 'Come cancellare i dati locali', body: '<p>Puoi eliminare in ogni momento i dati salvati dal sito dalle impostazioni del browser, alla voce «Cancella dati di navigazione» o «Dati dei siti». Il sito continuerà a funzionare normalmente.</p>' },
      { title: 'Aggiornamenti', body: `<p>Se in futuro dovessi introdurre strumenti di analisi o servizi di terze parti, questa pagina verrà aggiornata e, quando necessario, ti verrà chiesto il consenso. Per domande: <a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a>.</p>` },
    ],
  })
}

export function creditiPage() {
  return legalShell({
    crumb: 'Crediti',
    href: '/crediti/',
    title: 'Crediti e fonti delle immagini',
    intro: crediti.intro,
    sections: crediti.sections,
  })
}

// ── 404 ──────────────────────────────────────────────────────────────────────
// La pagina che manca l'ha presa la gazza ladra (il burattino del piè di
// pagina): la tiene nel becco, un foglio con l'indirizzo cercato (lo scrive
// src/client/puppet.js), e se le vai vicino scappa lungo la quota «punto non
// rilevato», guardandoti. Toccata fa l'occhiolino e riscappa.

// Il foglio: una tavola in piccolo, con il bordo adesivo come i pezzi del
// burattino. In alto, dietro alla chiave, il disegno (il punto non rilevato);
// in basso il cartiglio con il numero della tavola e l'indirizzo cercato.
const missingPage = html`
  <span class="pup__carry nf__page" data-carry>
    <svg viewBox="0 0 100 128" aria-hidden="true">
      <path class="nf__page-edge" d="M6 6H80L94 20V122H6Z"/>
      <path class="nf__page-sheet" d="M6 6H80L94 20V122H6Z"/>
      <path class="nf__page-fold" d="M80 6V20H94"/>
      <path class="nf__page-lines" d="M14 18H48M14 24H40M14 30H44"/>
      <circle class="nf__page-c" cx="58" cy="54" r="16"/>
      <path class="nf__page-rule" d="M58 32V76M36 54H80"/>
      <circle class="nf__page-dot" cx="58" cy="54" r="2.8"/>
      <path class="nf__page-rule" d="M12 84H88V116H12ZM12 97H88"/>
      <text class="nf__page-tav" x="16" y="93.5">Tav. 404</text>
      <text class="nf__page-path" x="16" y="106" data-path>questa pagina</text>
      <text class="nf__page-nr" x="16" y="112.5">punto non rilevato</text>
    </svg>
  </span>
`

export function notFoundPage() {
  return html`
    <section class="nf" data-theme="ink">
      <div class="nf__grid" aria-hidden="true"></div>
      <div class="container nf__wrap">
        <p class="label nf__top"><span>Errore 404</span><span>N 404°00′00″ · E —</span><span>Tav. non in elenco</span></p>
        <div class="nf__figure" aria-hidden="true">
          <div class="nf__digits">
            <span class="nf__num">4</span>
            <span class="nf__target">
              <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" class="nf__c"/><circle cx="100" cy="100" r="58" class="nf__c nf__c--dash"/><circle cx="100" cy="100" r="7" class="nf__dot"/><path d="M100 0v72M100 128v72M0 100h72M128 100h72" class="nf__c"/></svg>
            </span>
            <span class="nf__num">4</span>
            <span class="nf__dim"><i></i><b>punto non rilevato</b><i></i></span>
          </div>
          <div class="nf__gazza" data-flee>${puppet('gazza', { className: 'nf__pup', inside: { testa: missingPage } })}</div>
        </div>
        <h1 class="nf__title" data-reveal="words">${splitWords('Questa pagina se l’è presa la gazza.', { accent: ['gazza.'] })}</h1>
        <p class="lead nf__text">Ce l’ha nel becco e non la molla: prova a riprendergliela. Oppure riparti da un caposaldo noto, perché la pagina che cerchi è stata spostata, rinominata o non è mai esistita.</p>
        <div class="nf__actions">
          ${button({ href: '/', label: 'Torna alla home', variant: 'light', magnetic: true })}
          ${button({ href: '/portfolio/', label: 'Apri il portfolio', variant: 'ghost' })}
        </div>
        <ul class="nf__links label">
          <li><a href="/servizi/">Servizi</a></li><li><a href="/studio/">Studio</a></li><li><a href="/metodo/">Metodo</a></li><li><a href="/contatti/">Contatti</a></li>
        </ul>
        <div class="nf__mark">${monogram()}</div>
        ${figurina('404', { className: 'nf__fig', lazy: false })}
      </div>
    </section>
  `
}
