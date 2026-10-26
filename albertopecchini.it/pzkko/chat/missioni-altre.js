// Altre side quest (26.10, Alberto: «altre side quest»): nello stesso formato di missioni-dati.js (che le mette in coda alle
// prime cinque). Nessuna richiede oggetti per cominciare, tranne dove c'è scritto: si fanno con quello che c'è.

export const MISSIONI_NUOVE = [
  {
    id: 'nutria', nome: 'La nutria sindacalista', icona: 'nutria', breve: 'sciopero sull’argine', liv: 1, richiede: [], premio: { pzk: 300, xp: 60, oggetto: 'cassa-comune' },
    nodi: {
      start: { t: 'Sull’argine una nutria con un cartello «ORARIO CONTINUATO» blocca il sentiero. Dietro di lei, venti nutrie in fila, in silenzio. È uno sciopero.', scelte: [
        { eti: 'ascolta le richieste', vai: 'richieste' }, { eti: 'prova a passare', vai: 'passa' },
      ] },
      passa: { t: 'La prima nutria ti guarda. Le altre venti ti guardano. Ti ripensi.', scelte: [{ eti: 'ascolta le richieste', vai: 'richieste' }] },
      richieste: { t: '«Tre cose» dice. «Più erba, meno cani, e che nessuno ci chiami topi.» Ha una voce rauca, da sigaro.', scelte: [
        { eti: 'accetta tutto', vai: 'accordo' }, { eti: 'tratta sul cane', vai: 'cane', caso: { p: 0.5, ko: 'morso' } },
      ] },
      morso: { t: 'Un morso piccolo ma deciso. La trattativa è finita, il tuo orgoglio pure: 60 $pzk di cerotti.', scelte: [{ eti: 'riprova', vai: 'richieste', perde: 60 }] },
      cane: { t: 'La nutria ci pensa un minuto. «Va bene: i cani restano, ma al guinzaglio e senza abbaiare.»', scelte: [{ eti: 'stringi la zampa', vai: 'accordo' }] },
      accordo: { fine: true, t: 'Le nutrie tolgono il cartello e si disperdono nel canneto. La capa ti lascia un fiocchetto di pelo bagnato: «per la firma». Lo conservi, tra le cose che non sai spiegare.' },
    },
  },
  {
    id: 'ponte', nome: 'Il ponte che non finisce', icona: 'fuoco', breve: 'un ponte di Mantova troppo lungo', liv: 1, richiede: [], premio: { pzk: 380, xp: 70, oggetto: 'estathe' },
    nodi: {
      start: { t: 'Attraversi il ponte di San Giorgio e, a metà, ti accorgi che non finisce. Lo attraversi da cinque minuti. Il castello è sempre alla stessa distanza.', scelte: [
        { eti: 'continua a camminare', vai: 'cammina' }, { eti: 'torna indietro', vai: 'indietro' }, { eti: 'guarda giù', vai: 'giu' },
      ] },
      cammina: { t: 'Cammini. E cammini. Passa un ciclista, poi lo stesso ciclista, poi ancora lui. Ti saluta come un collega.', scelte: [{ eti: 'chiedigli la strada', vai: 'ciclista' }] },
      indietro: { t: 'Torni indietro: anche l’altra riva è sempre uguale. Il ponte si è accorto che lo guardi.', scelte: [{ eti: 'guarda giù', vai: 'giu' }] },
      giu: { t: 'Giù c’è l’acqua del lago. Non riflette il cielo: riflette un altro ponte, e sul ponte un altro te che guarda in su, preoccupato.', scelte: [{ eti: 'fai ciao', vai: 'ciao' }] },
      ciclista: { t: '«Il trucco» dice il ciclista «è non contare i passi. Chi conta i passi, resta.»', scelte: [{ eti: 'smetti di contare', vai: 'fine' }] },
      ciao: { t: 'L’altro te risponde col saluto. Poi sorride e si volta: il ponte, di colpo, si accorcia.', scelte: [{ eti: 'attraversa', vai: 'fine' }] },
      fine: { fine: true, t: 'Arrivi al castello in tre passi. Dietro di te il ponte è un ponte normale. Il ciclista è già sparito, ma sul manubrio ti ha lasciato una bibita.' },
    },
  },
  {
    id: 'sagra', nome: 'La sagra dei tortelli', icona: 'tortelli', breve: 'tre banchi, una giuria, una zucca', liv: 2, richiede: [], premio: { pzk: 520, xp: 85, oggetto: 'cassa-comune' },
    nodi: {
      start: { t: 'In paese c’è la sagra dei tortelli di zucca. La giuria è composta da tre nonne con la faccia di chi ha già deciso. Devi convincerle prima che i tortelli si freddino.', scelte: [
        { eti: 'parla con la nonna del banco uno', vai: 'uno', non: 'uno' }, { eti: 'parla con la nonna del banco due', vai: 'due', non: 'due' }, { eti: 'parla con la nonna del banco tre', vai: 'tre', non: 'tre' },
        { eti: 'presenta il piatto alla giuria', vai: 'giuria', se: ['uno', 'due', 'tre'] },
      ] },
      uno: { t: '«La zucca va cotta al forno» dice, sicura. «Non bollita. Mai bollita.»', scelte: [{ eti: 'prometti: al forno', vai: 'start', segna: 'uno' }, { eti: 'dille che la bolli', vai: 'litigio' }] },
      litigio: { t: 'Silenzio. Poi un mattarello atterra sul banco, a dieci centimetri dalla tua mano. Ti sembra un buon momento per ripensarci.', scelte: [{ eti: 'prometti: al forno', vai: 'start', segna: 'uno' }] },
      due: { t: '«Il segreto è la mostarda» sussurra. «Ma il segreto è segreto. Costa 200 $pzk.»', scelte: [{ eti: 'paga 200 $pzk', vai: 'start', costo: 200, segna: 'due' }, { eti: 'prova a indovinare', vai: 'start', segna: 'due', caso: { p: 0.45, ko: 'sbagliato' } }] },
      sbagliato: { t: '«Mostarda di mele? Ma che mele!» Sbagliato. La nonna ti toglie il mestolo di mano.', scelte: [{ eti: 'torna indietro', vai: 'start' }] },
      tre: { t: 'La terza nonna vuole solo una cosa: un assaggio, subito, e che tu dica «buono». Se menti si vede.', scelte: [{ eti: 'assaggia e di’ la verità', vai: 'start', segna: 'tre' }] },
      giuria: { fine: true, t: 'La giuria assaggia. Mastica. Poi dice, tutta insieme, la parola più bella del Mantovano: «Eh.» Hai vinto. Il premio è una coppa, una cassa, e un grembiule.' },
    },
  },
  {
    id: 'ristorante', nome: 'Il cliente fantasma', icona: 'carte', breve: 'un tavolo prenotato da trent’anni', liv: 2, richiede: [], premio: { pzk: 480, xp: 80, oggetto: 'estathe' },
    nodi: {
      start: { t: 'Nella trattoria c’è un tavolo apparecchiato per uno, con sopra un cartello «PRENOTATO». Il cartello è giallo di polvere. L’oste dice: «dal 1994».', scelte: [
        { eti: 'siediti', vai: 'siedi' }, { eti: 'chiedi all’oste', vai: 'oste' },
      ] },
      oste: { t: '«Si chiamava Ottavio» dice. «Un giorno ha detto “torno subito” ed è andato a prendere il giornale. Non il giornale: il pane. Boh.»', scelte: [{ eti: 'siediti al suo posto', vai: 'siedi' }] },
      siedi: { t: 'Ti siedi. Il piatto si riempie da solo di agnolini in brodo, fumanti. Sull’altra sedia, per un attimo, vedi un cappello appoggiato.', scelte: [
        { eti: 'mangia', vai: 'mangia' }, { eti: 'lascia il piatto al cappello', vai: 'cappello' },
      ] },
      mangia: { t: 'Sono i migliori agnolini della tua vita. Il brodo sa di Natale, di cucina calda, di quando non c’era fretta. Il cappello, accanto a te, non si muove.', scelte: [{ eti: 'finisci', vai: 'fine', caso: { p: 0.7, ko: 'conto' } }] },
      conto: { t: 'Arriva il conto: 90 $pzk, scritto con una calligrafia di trent’anni fa.', scelte: [{ eti: 'paga', vai: 'fine', perde: 90 }] },
      cappello: { t: 'Spingi il piatto verso il cappello. Per un attimo il tavolo è pieno di luce, poi il cappello non c’è più. Resta una mancia, sul tovagliolo.', scelte: [{ eti: 'prendi la mancia', vai: 'fine' }] },
      fine: { fine: true, t: 'Esci con la pancia piena. Il cartello «PRENOTATO» è sparito: sul tavolo ora c’è un fiore. L’oste, dalla porta, ti fa un cenno con la testa.' },
    },
  },
  {
    id: 'rana', nome: 'La rana che canta', icona: 'rana', breve: 'un concerto nel fosso', liv: 1, richiede: [], premio: { pzk: 280, xp: 55, oggetto: 'cassa-comune' },
    nodi: {
      start: { t: 'Di sera, in un fosso, una rana canta da sola. Ha una voce incredibile: un baritono. Le altre rane tacciono, in rispettosa attesa.', scelte: [
        { eti: 'applaudi', vai: 'applaudi' }, { eti: 'chiedi il bis', vai: 'bis' }, { eti: 'registra con il telefono', vai: 'registra' },
      ] },
      applaudi: { t: 'La rana si inchina. Poi una libellula ti passa sul naso e tutto il pubblico perde la concentrazione.', scelte: [{ eti: 'chiedi il bis', vai: 'bis' }] },
      registra: { t: 'Premi REC. Il telefono emette un bip. La rana smette, ti guarda con disprezzo, e riparte in falsetto per farti un dispetto.', scelte: [{ eti: 'smetti di registrare', vai: 'bis' }] },
      bis: { t: 'La rana canta ancora. Un’aria d’opera che sembra Verdi. Anzi no: è proprio Rigoletto. «La donna è mobile»... in rana.', scelte: [{ eti: 'canta con lei', vai: 'duetto', caso: { p: 0.5, ko: 'stonato' } }] },
      stonato: { t: 'Stoni. La rana si ferma, sospira, e ti tira addosso un ranocchio con un’espressione molto triste. Perdi 40 $pzk di dignità.', scelte: [{ eti: 'riprova', vai: 'bis', perde: 40 }] },
      duetto: { fine: true, t: 'Il duetto riesce. Dal canneto escono venti rane che applaudono con le zampe. La tua nuova amica ti lascia un sassolino liscio, a forma di nota.' },
    },
  },
  {
    id: 'virgilio', nome: 'La statua che parla', icona: 'moneta-virgilio', breve: 'Virgilio vuole un favore', liv: 3, richiede: [], premio: { pzk: 800, xp: 120, oggetto: 'cassa-rara' },
    nodi: {
      start: { t: 'A mezzanotte, in piazza Virgiliana, la statua di Virgilio si gira verso di te. «Ho un problema» dice, con la voce di bronzo. «Ho dimenticato come finisce l’Eneide.»', scelte: [
        { eti: 'racconta il finale', vai: 'finale' }, { eti: 'inventa un finale', vai: 'inventa' }, { eti: 'dì che non l’hai letta', vai: 'non-letta' },
      ] },
      finale: { t: '«Turno uccide? Enea uccide Turno? Troppo violento.» Virgilio è contrariato. «Non si può pensare a un finale più allegro?»', scelte: [{ eti: 'inventa un finale', vai: 'inventa' }] },
      inventa: { t: 'Inventi: Enea e Turno aprono insieme una trattoria sul Mincio. Il poeta si commuove. Una lacrima di bronzo cade sul tuo piede.', scelte: [{ eti: 'chiedi il compenso', vai: 'compenso' }] },
      'non-letta': { t: '«Nessuno l’ha letta» sospira. «Mi ci vuole una bella scossa.»', scelte: [{ eti: 'inventa un finale', vai: 'inventa' }] },
      compenso: { t: '«Il compenso? Sono un poeta!» Ma poi sorride (un poeta di bronzo che sorride è un evento). «Prendi questo.»', scelte: [{ eti: 'prendi', vai: 'fine' }] },
      fine: { fine: true, t: 'Virgilio ti allunga una moneta con il suo profilo. Torna immobile. Il giorno dopo nessuno ti crede, ma la moneta è lì, ancora calda.' },
    },
  },
  {
    id: 'campanile', nome: 'La campana stonata', icona: 'campana', breve: 'suona le 13', liv: 2, richiede: [], premio: { pzk: 450, xp: 75, oggetto: 'estathe' },
    nodi: {
      start: { t: 'Il campanile del paese ha suonato tredici rintocchi. Nessuno ci ha fatto caso, tranne te. E il sagrestano, che è scomparso.', scelte: [
        { eti: 'sali sul campanile', vai: 'sali' }, { eti: 'cerca il sagrestano', vai: 'cerca' },
      ] },
      cerca: { t: 'Il sagrestano non è in sacrestia. Sulla scrivania c’è un biglietto: «sono sopra, non fatemi scendere».', scelte: [{ eti: 'sali sul campanile', vai: 'sali' }] },
      sali: { t: 'Cento gradini. In cima c’è il sagrestano, seduto sulla campana grande, con una chitarra. «Questa campana è stonata» dice. «Da sempre. Provo ad accordarla.»', scelte: [
        { eti: 'prova ad aiutarlo', vai: 'aiuto', caso: { p: 0.5, ko: 'botto' } }, { eti: 'chiedigli di scendere', vai: 'scende' },
      ] },
      botto: { t: 'BONG. Il suono ti entra nelle ossa. Per tre minuti senti solo un fischio e i tuoi pensieri sono in la bemolle (perdi 50 $pzk di orecchio).', scelte: [{ eti: 'riprova', vai: 'sali', perde: 50 }] },
      aiuto: { t: 'Insieme trovate la nota giusta: un sol leggermente basso. Il sagrestano batte un colpo, poi un altro. Il campanile vibra, felice.', scelte: [{ eti: 'scendi', vai: 'fine' }] },
      scende: { t: '«Se scendo è finita» dice. «Perché poi mi tocca spiegare perché sono salito.» Ti guarda, speranzoso.', scelte: [{ eti: 'aiutalo ad accordare', vai: 'aiuto' }] },
      fine: { fine: true, t: 'Il campanile suona le ore giuste per la prima volta dopo quarant’anni. In paese qualcuno si ferma, alza la testa, e sorride senza sapere perché.' },
    },
  },
  {
    id: 'rider', nome: 'La consegna impossibile', icona: 'telefono', breve: 'un indirizzo che non esiste', liv: 2, richiede: [], premio: { pzk: 420, xp: 70, oggetto: 'cassa-comune' },
    nodi: {
      start: { t: 'Il telefono vibra: una consegna da fare entro dieci minuti, in via dei Nuvoloni 0. Non esiste. Non c’è nemmeno una via con quel nome.', scelte: [
        { eti: 'cerca l’indirizzo sulla mappa', vai: 'mappa' }, { eti: 'chiama il cliente', vai: 'chiama' }, { eti: 'rifiuta la consegna', vai: 'rifiuta' },
      ] },
      mappa: { t: 'La mappa mostra un puntino nel mezzo del lago. Accanto, un messaggio: «scendi dalla bici».', scelte: [{ eti: 'chiama il cliente', vai: 'chiama' }] },
      rifiuta: { t: 'Rifiuti. Il telefono vibra, indignato: «sei sicuro?». Vibra ancora. Ti mette in imbarazzo.', scelte: [{ eti: 'accetta', vai: 'mappa' }] },
      chiama: { t: '«Pronto?» Risponde una voce stranamente familiare. «Sono io, ma dal futuro: sono dietro di te. Non ti voltare.»', scelte: [
        { eti: 'voltati', vai: 'voltati', caso: { p: 0.5, ko: 'vuoto' } }, { eti: 'consegna al vuoto', vai: 'consegna' },
      ] },
      vuoto: { t: 'Non c’è nessuno. Solo un gatto. Il gatto ti fissa e miagola: «avevi detto di non voltarti». Il tempo scade, e ti toglie 70 $pzk.', scelte: [{ eti: 'riprova', vai: 'chiama', perde: 70 }] },
      voltati: { t: 'Dietro di te c’è un altro te, con il casco e la stessa pizza. «Tieni» dice. «Ordinata ieri, pagata domani.»', scelte: [{ eti: 'prendi la pizza', vai: 'consegna' }] },
      consegna: { fine: true, t: 'Consegni la pizza a te stesso. Il cliente ti dà cinque stelle e una mancia in $pzk di domani. Domani li troverai già nel portafoglio.' },
    },
  },
]
