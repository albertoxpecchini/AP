// Gli argomenti nuovi dei quiz (26.10, Alberto: «crea altri quiz… aumenta i modi di rispondere»): [id, nome, icona].
// (31.10) Le domande (e i vero/falso) stanno sulla banca, sul pc di Alberto (banca\dati\quiz-altre.mjs): qui c'erano con la
// risposta giusta, e il browser non le deve sapere. Una domanda nuova si aggiunge là.

export const ARGOMENTI_NUOVI = [
  ['geometra', 'geometra', 'pala'],
  ['informatica', 'informatica', 'app-compilatore'],
  ['storia', 'storia', 'clessidra'],
  ['geografia', 'geografia', 'zaino'],
  ['natura', 'natura', 'rana'],
  ['musica', 'musica', 'campana'],
  ['sport', 'sport', 'fuoco'],
  ['matematica', 'matematica', 'app-calcolatrice'],
]

// (31.10) le domande (SCELTA) non stanno più qui: le ha la banca (banca/dati/quiz-altre.mjs per il quiz del telefono,
// banca/dati/chat-domande.mjs per il vero o falso lampo della chat)
