export const WORD_TRIVIA: Record<string, string> = {
  amore: "Sentimento di viva affezione verso una persona che si manifesta come desiderio di procurare il suo bene. Dal latino amōr.",
  gatto: "Mammifero domestico con unghie retrattili e straordinaria agilità. Secondo una leggenda, ha sette vite grazie alle sue doti di sopravvivenza.",
  libro: "Il termine deriva dal latino liber: la parte interna della corteccia degli alberi, usata anticamente come primo supporto scrittorio portatile.",
  stella: "Corpo celeste luminoso formato da enormi masse di gas incandescente. Nel linguaggio figurato rappresenta personaggi molto famosi.",
  musica: "Arte di creare serie di suoni con la voce o con strumenti. Il termine deriva dal greco mousikè: l'arte delle Muse.",
  leone: "Il re degli animali. Simbolo di forza, coraggio e maestosità nella cultura occidentale sin dall'antichità.",
  mare: "Grande distesa d'acqua salata. Copre circa il 71% della superficie terrestre ed è fonte di vita e ispirazione.",
  sole: "Stella al centro del nostro sistema solare. È la fonte primaria di energia per la vita sulla Terra.",
  cuore: "Organo vitale che pompa il sangue. Simbolo universale dell'amore e delle emozioni umane.",
  fiore: "Parte riproduttiva colorata delle piante. Rappresenta bellezza, delicatezza e rinascita nella natura.",
  albero: "Pianta legnosa con fusto e rami. Simbolo di vita, crescita e connessione tra cielo e terra.",
  vento: "Movimento naturale dell'aria. Invisibile ma potente, rappresenta il cambiamento e la libertà.",
  piazza: "Spazio pubblico aperto nelle città. Centro della vita civica e punto d'incontro sin dai tempi antichi.",
  strada: "Via che collega i luoghi. Simbolo di cammino, viaggio e delle scelte che facciamo nella vita.",
  tempo: "Dimensione inesaurabile che scandisce l'esistenza. Per Aristotele è il numero del movimento secondo il prima e il dopo.",
  voce: "Suono prodotto dalle corde vocali umane. Strumento di comunicazione che caratterizza ogni individuo.",
  luce: "Radiazione elettromagnetica che rende visibile il mondo. Universalmente simbolo di verità e conoscenza.",
  acqua: "Elemento essenziale per la vita. Copre il 71% della Terra e rappresenta purificazione e trasformazione.",
};

export function getTrivia(word: string): string | undefined {
  return WORD_TRIVIA[word.toLowerCase()];
}
