// Crediti e fonti delle immagini: la pagina /crediti/ (link nel footer) e la
// sezione «Fonti delle immagini» del README dicono le stesse cose. Quando entra
// nel sito un'immagine di provenienza nuova, va aggiunta qui e nel README.
//
// `body` è HTML già pronto (testo scritto qui, non dati dell'utente).

const figma = 'https://www.figma.com/community/file/1172125330560103197/device-mockups-imac-macbook-ipad-iphone'

export const crediti = {
  intro:
    'Da dove vengono le immagini del sito: cosa è disegnato o fotografato da me, cosa è generato con l’intelligenza artificiale e cosa viene da risorse di altri, con la loro licenza.',
  sections: [
    {
      title: 'Illustrazioni generate con l’intelligenza artificiale',
      body: `<p>Sono generate con il modello <strong>gpt-image-2</strong> di OpenAI, usato attraverso <a href="https://replicate.com/openai/gpt-image-2" target="_blank" rel="noopener">Replicate<span class="sr-only"> (nuova scheda)</span></a>, con istruzioni scritte per questo sito, poi scelte e ritagliate per il sito:</p>
      <ul>
        <li><strong>Le copertine e le gallerie dei progetti tecnici</strong> — il progetto stradale, il bar-caffetteria, il layout di cantiere, le tettoie in legno lamellare e il Museo dei Mestieri del Fiume: illustrazioni in assonometria e scene disegnate che hanno come riferimento le tavole originali dei progetti e, per il museo, le mie fotografie. Mostrano i progetti, non sono i progetti: le tavole vere non sono pubblicate sul sito.</li>
        <li><strong>Le figurine</strong> dei servizi, delle fasi del metodo, dei lavori trasversali, degli strumenti, delle sezioni sul web (home, progetti web e case study dei siti), della pagina contatti e della pagina 404.</li>
        <li><strong>Il fondo della carta dell’area operativa</strong> nella pagina contatti: acque, rilievi e campi disegnati dal modello sulla geometria di lago e fiumi ricavata dalle coordinate. Reticolo, raggi, città, nomi e scala grafica sono disegnati dal codice del sito sulle stesse coordinate, e restano esatti.</li>
      </ul>`,
    },
    {
      title: 'Fotografie',
      body: `<ul>
        <li><strong>Il ritratto</strong> in home e nel saluto è una mia fototessera. Il fondo bianco è stato tolto con il modello <strong>remove-background</strong> di Bria, su Replicate; il volto è quello della fotografia, non ritoccato.</li>
        <li><strong>La figura scontornata</strong> della pagina Studio è una mia fotografia, scontornata con l’intelligenza artificiale su Replicate.</li>
        <li><strong>Le fotografie del Museo dei Mestieri del Fiume</strong> sono state scattate durante l’uscita didattica del 15 novembre 2025. Le due fotografie d’epoca riprendono materiale esposto nel museo. Chi compare nelle immagini ha dato l’autorizzazione, e le fotografie in cui si riconoscono insegnanti o guida sono state escluse o ritagliate.</li>
      </ul>`,
    },
    {
      title: 'Tavole e disegni',
      body: `<ul>
        <li><strong>Le tavole dei progetti tecnici</strong>, da cui partono le illustrazioni, sono miei elaborati originali in AutoCAD LT, fatti per le esercitazioni e per l’Esame di Stato all’I.T.T. «Carlo d’Arco» di Mantova.</li>
        <li><strong>I disegni dei progetti dimostrativi</strong> (quelli segnati con ◇), le piante, i prospetti e i marchi di esempio sono disegnati dal codice del sito.</li>
        <li><strong>Icone, monogramma, firma e immagine di anteprima</strong> sono disegnati per questo sito.</li>
      </ul>`,
    },
    {
      title: 'Siti web e dispositivi',
      body: `<ul>
        <li><strong>Gli screenshot</strong> sono catture dei siti che ho progettato e sviluppato.</li>
        <li><strong>MacBook, iPad e iPhone</strong> intorno agli screenshot vengono dal file <a href="${figma}" target="_blank" rel="noopener">Device Mockups (iMac, Macbook, iPad, iPhone)<span class="sr-only"> (nuova scheda)</span></a> della Figma Community, pubblicato con licenza <a href="https://creativecommons.org/licenses/by/4.0/deed.it" target="_blank" rel="noopener">CC BY 4.0<span class="sr-only"> (nuova scheda)</span></a>. Le immagini sono ritagliate e convertite in WebP.</li>
        <li><strong>L’iPhone 18 Pro</strong> del case study di questo sito e della pagina contatti è il disegno vettoriale <a href="https://commons.wikimedia.org/wiki/File:IPhone_18_Pro_Vector.svg" target="_blank" rel="noopener">IPhone 18 Pro Vector.svg<span class="sr-only"> (nuova scheda)</span></a> di Rafael Fernandez, da Wikimedia Commons, con licenza <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener">CC BY-SA 4.0<span class="sr-only"> (nuova scheda)</span></a>; il credito compare anche sotto ogni telefono.</li>
      </ul>`,
    },
    {
      title: 'Caratteri',
      body: '<p>Archivo, IBM Plex Mono e Instrument Serif, tutti con licenza <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License<span class="sr-only"> (nuova scheda)</span></a>, serviti da questo dominio tramite i pacchetti Fontsource.</p>',
    },
  ],
}
