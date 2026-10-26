// I comandi per ridere (26.10, Alberto: «altre cose in chat»): non toccano i soldi né lo zaino, non hanno attesa. Il bot dice
// la sua: una barzelletta, la palla otto, l'oroscopo del Mincio, testa o croce, il dado.

const caso = (a) => a[Math.floor(Math.random() * a.length)]

const BARZELLETTE = [
  'Perché la nutria non gioca a carte? Perché ha paura di trovarsi in mano un castoro.',
  'Un mantovano entra in una pescheria e chiede: «ha il siluro?». «Sì.» «E lo vende?» «No, lo noleggia: è lungo due metri.»',
  'Cosa dice una chiocciola quando sale sulla schiena di una tartaruga? «Wheeeee!»',
  'Il geometra al muratore: «il muro è storto». Il muratore: «è il pavimento che è dritto sbagliato».',
  'Perché il programmatore preferisce il Mincio? Perché non ha mai segnalato un bug: scorre e basta.',
  'Perché il tortello di zucca non ha paura di nessuno? Perché ha il ripieno di coraggio.',
  'Come si chiama una chiocciola con gli occhiali da sole? Un bot con la visiera.',
  'Cosa fa un pesce siluro in banca? Chiede un mutuo da due metri.',
  'Un matematico cade nel Mincio. Il suo amico gli grida: «prendi la mia mano!». Lui: «scusa, sto ancora calcolando la derivata dell’acqua.»',
  'Perché Virgilio non ha mai finito il cruciverba? Perché le definizioni erano tutte in latino.',
]
const PALLA = [
  ['sì, senza dubbio', 1], ['certo che sì', 1], ['ci puoi giurare', 1], ['tutto fa pensare di sì', 1], ['ci sono ottime possibilità', 1],
  ['forse', 0], ['non so, riprova più tardi', 0], ['chiedimelo dopo cena', 0], ['la nebbia sul Mincio non mi lascia vedere', 0],
  ['non ci contare', -1], ['i miei calcoli dicono di no', -1], ['direi di no', -1], ['neanche per sogno', -1],
]
const SEGNI = ['la nutria', 'la chiocciola', 'il siluro', 'la zanzara tigre', 'il luccio', 'la carpa', 'il fagiano', 'l’airone', 'il cinghiale', 'la rana', 'la libellula', 'il fior di loto']
const SORTI = [
  'oggi un incontro inatteso vicino all’acqua cambierà la tua giornata',
  'la fortuna ti cerca, ma si è fermata a prendere un caffè: aspettala',
  'attento ai soldi dimenticati nelle tasche dei vecchi pantaloni: qualcuno li ha già visti',
  'un vecchio amico ti manderà un messaggio. Probabilmente per chiederti qualcosa',
  'è il giorno giusto per una scelta coraggiosa. Anche una piccola: un panino diverso, una strada nuova',
  'il giorno non si presta ai grandi progetti ma a una bella dormita sì',
  'una persona che ti sta antipatica dirà la cosa giusta. Non farglielo notare',
  'nella tua cucina c’è qualcosa che scade oggi. Mangialo',
]

export const SVAGO = [
  {
    nomi: ['barzelletta', 'joke', 'ridere'], cat: 'app', icona: 'bot', breve: 'una barzelletta (pessima)', uso: 'barzelletta', senzaEventi: true,
    async fai(ctx) {
      await ctx.pensa(500)
      ctx.dì({ colore: 'oro', av: 'bot-ride', t: ':bot: la barzelletta', d: caso(BARZELLETTE), pie: 'se non ride nessuno è colpa del pubblico' })
    },
  },
  {
    nomi: ['palla8', 'palla', '8ball', 'domanda'], cat: 'app', icona: 'dado', breve: 'chiedi al bot una cosa a cui rispondere sì o no: palla8 vincerò?', uso: 'palla8 <domanda>', senzaEventi: true,
    async fai(ctx) {
      if (!ctx.testo) return ctx.dì({ colore: 'rosso', d: 'devi farmi una domanda: <code>palla8 vincerò alla roulette?</code>' })
      await ctx.pensa(900)
      const [r, v] = caso(PALLA)
      ctx.dì({ colore: v > 0 ? 'verde' : v < 0 ? 'rosso' : 'grigio', av: v > 0 ? 'bot-ride' : v < 0 ? 'bot-triste' : 'bot-pensa', t: ':dado: la palla otto', d: `<i>${ctx.testo.replace(/</g, '&lt;').slice(0, 120)}</i>\n<b>${r}.</b>` })
    },
  },
  {
    nomi: ['oroscopo', 'segno', 'stelle'], cat: 'app', icona: 'clessidra', breve: 'l’oroscopo del Mincio, uguale per tutti per tutto il giorno', uso: 'oroscopo', senzaEventi: true,
    async fai(ctx) {
      await ctx.pensa(600)
      // il giorno decide (stessa risposta per tutto il giorno, per chi la chiede più volte)
      const g = Math.floor(Date.now() / 86400000)
      ctx.dì({ colore: 'viola', t: ':clessidra: l’oroscopo di oggi', d: `Segno: <b>${SEGNI[g % SEGNI.length]}</b>.\n${SORTI[(g * 7) % SORTI.length]}.`, pie: 'l’astrologia è una scienza, ma questa è una scienza del Mincio' })
    },
  },
  {
    nomi: ['sorte', 'testaocroce', 'lancia'], cat: 'app', icona: 'moneta-virgilio', breve: 'testa o croce, gratis (se ci giochi i soldi è «moneta»)', uso: 'sorte', senzaEventi: true,
    async fai(ctx) {
      await ctx.pensa(400)
      const t = Math.random() < 0.5
      ctx.dì({ colore: 'oro', t: ':moneta-virgilio: la moneta', d: `è uscita <b>${t ? 'testa (Virgilio)' : 'croce'}</b>.` })
    },
  },
  {
    nomi: ['tira', 'd20', 'dice'], cat: 'app', icona: 'dado', breve: 'tira un dado per scherzo: tira, tira 20, tira 100 (i dadi coi soldi sono «dado»)', uso: 'tira [facce]', senzaEventi: true,
    async fai(ctx) {
      const n = Math.max(2, Math.min(1000, Math.floor(Number(ctx.args[0])) || 6))
      await ctx.pensa(350)
      ctx.dì({ colore: 'blu', t: ':dado: dado a ' + n + ' facce', d: `è uscito <b>${1 + Math.floor(Math.random() * n)}</b>.` })
    },
  },
]
