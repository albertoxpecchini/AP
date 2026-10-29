// Il libro dei conti di un giocatore (29.10 notte): c.libro, scritto dal server dei soldi (api/wallet.mjs) coi lotti del
// browser e con le sue mosse, e letto QUI allo stesso modo dal server (le classifiche, api/_giocatori.mjs) e dal browser (il
// profilo, telefono/app/profilo.js; la chat, «profilo»): un numero è lo stesso dappertutto. Prima ognuno contava a modo suo
// nello zaino, e Alberto (29.10): «non posso avere 5.5k in vinti ai giochi e 2.0k guadagnati in tutto: deve avere senso».
//
// Il libro: g (per gioco: [mani, vinte, puntato, tornato, il colpo migliore]); lav (i soldi nuovi del lavoro, della miniera,
// delle quest: i lotti 'c:'); pre (i premi che dà il server: il sussidio, le banconote, instagram, i wallet decifrati); spe (le
// spese: la cassa fuori dai giochi, le multe, la cauzione, la lavatrice); ven (le vendite alla cassa); lum (la lumachina,
// netto); mor (i $pzk persi morendo); rap (i bottini delle rapine); inv [ricevuti, inviati]; cam [in EUR€, da EUR€].
// Le definizioni:
// - giochi («vinti ai giochi») = tornato − puntato, in tutti i giochi (i grandi e quelli della chat): il netto; sotto zero
//   sono «persi ai giochi»;
// - lavoro = i soldi nuovi: lavoro, miniera, quest e premi;
// - guadagnati («guadagnati in tutto») = giochi + lavoro + vendite − spese ± lumachina − morti + rapine: quanto ti ha fatto
//   guadagnare (o perdere) tutto quello che hai fatto. Non contano gli invii (passano da un conto all'altro) né i cambi in
//   EUR€ (spostano i soldi, non li fanno). Così, se non hai speso, non sei morto e la lumachina non ti ha tolto niente,
//   guadagnati in tutto ≥ vinti ai giochi.
const n = (x) => Number(x) || 0
const mezzi = (x) => Math.round(x * 2) / 2

/** I conti di un libro: { mani, vinte, puntato, tornato, giochi, lavoro, vendite, spese, lumaca, morti, rapine, guadagnati, ricevuti, inviati, perGioco }. */
export function conti(libro = {}) {
  const g = Object.values(libro?.g ?? {}), somma = (i) => g.reduce((s, x) => s + n(x?.[i]), 0)
  const v = (k) => n(libro?.[k])
  const giochi = somma(3) - somma(2), lavoro = v('lav') + v('pre')
  return {
    mani: somma(0), vinte: somma(1), puntato: mezzi(somma(2)), tornato: mezzi(somma(3)), giochi: mezzi(giochi),
    lavoro: mezzi(lavoro), vendite: v('ven'), spese: v('spe'), lumaca: v('lum'), morti: v('mor'), rapine: v('rap'),
    guadagnati: mezzi(giochi + lavoro + v('ven') - v('spe') + v('lum') - v('mor') + v('rap')),
    ricevuti: n(libro?.inv?.[0]), inviati: n(libro?.inv?.[1]), perGioco: libro?.g ?? {},
  }
}
