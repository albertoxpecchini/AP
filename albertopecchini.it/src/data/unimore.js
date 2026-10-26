// ─────────────────────────────────────────────────────────────────────────────
//  UNIMORE — le materie del corso e, per ognuna, i blocchi (uno per lezione) con
//  gli esercizi; la numerazione degli esercizi riparte da 1 a ogni blocco. Le
//  pagine stanno in src/templates/pages/unimore.js, le rotte in routes.js: per
//  aggiungere una materia, un blocco o un esercizio basta una voce qui.
// ─────────────────────────────────────────────────────────────────────────────

export const unimore = {
  path: '/unimore/',
  title: 'Unimore — materie ed esercizi',
  description: 'Gli appunti e gli esercizi dei corsi di Unimore: informatica, analisi e geometria, fisica.',

  materie: [
    {
      slug: 'informatica',
      title: 'Informatica',
      lead: 'Programmazione e fondamenti: gli esercizi svolti, uno per pagina, divisi per blocco.',
      blocchi: [
        {
          slug: 'blocco-1',
          title: 'Blocco 1',
          lead: 'La divisione e la conversione di base, scritte in C e provate in myCompiler.',
          esercizi: [
            {
              slug: 'es-1',
              title: 'Esercizio 1',
              sottotitolo: 'La divisione, al calcolatore',
              testo: [
                'Scrivete in myCompiler, a mano, il programma della slide «Il programma della divisione, completo» e premete Run: deve stampare 13 = 3 * 4 + 1.',
                'Il codice nelle slide non si può copiare, di proposito: scrivendolo si incontrano gli errori di sintassi, una parentesi o un punto e virgola dimenticati.',
              ],
              richieste: [
                'Cambiate M e b, e controllate ogni volta che M = P · b + R, con R minore di b.',
                'Provate M = 0, poi b = 1: prevedete il risultato prima di premere Run.',
                'Aggiungete nel ciclo, dopo P = P + 1, la riga printf("R = %d, P = %d\\n", R, P); e confrontate l’output con la tabella di giovedì.',
              ],
              // La divisione come sottrazioni ripetute: M = dividendo, b = divisore,
              // P = quoziente, R = resto. Il codice è la versione con la riga di traccia.
              codice: `#include <stdio.h>

int main() {
  int M = 13;      // dividendo
  int b = 3;       // divisore (deve essere > 0)
  int R = M;       // resto: parte da M e scende
  int P = 0;       // quoziente: quante volte b sta in M

  while (R >= b) {
    R = R - b;
    P = P + 1;
    printf("R = %d, P = %d\\n", R, P);
  }

  printf("%d = %d * %d + %d\\n", M, b, P, R);
  return 0;
}`,
              output: `R = 10, P = 1
R = 7, P = 2
R = 4, P = 3
R = 1, P = 4
13 = 3 * 4 + 1`,
              svolgimento: [
                { titolo: 'Come funziona', testo: 'Si parte con R = M e P = 0. Finché R è almeno b, si toglie b da R e si conta una sottrazione in P. Quando R scende sotto b il ciclo si ferma: P è il quoziente, R il resto, e vale sempre M = P · b + R con 0 ≤ R < b.' },
                { titolo: 'Cambiare M e b', testo: 'Con M = 17, b = 5 stampa 17 = 5 * 3 + 2; con M = 20, b = 4 stampa 20 = 4 * 5 + 0. Ogni volta P · b + R rida M, e R è minore di b perché il ciclo si ferma proprio quando R < b. Con b = 0 il ciclo non finirebbe mai (R non scende): b deve essere maggiore di zero.' },
                { titolo: 'M = 0, poi b = 1', testo: 'Con M = 0 la condizione 0 >= b è falsa subito: il ciclo non gira, P = 0 e R = 0, e stampa 0 = 3 * 0 + 0. Con b = 1 (e M = 13) il ciclo gira 13 volte, togliendo 1 alla volta: stampa 13 = 1 * 13 + 0, resto sempre 0. Con M = 0 e b = 1 insieme: 0 = 1 * 0 + 0.' },
                { titolo: 'La riga di traccia', testo: 'Con M = 13 e b = 3 il ciclo gira quattro volte, e le righe stampate sono quelle dell’output qui sopra: R scende di 3 alla volta (10, 7, 4, 1) mentre P sale di uno (1, 2, 3, 4). L’ultima riga è il risultato finale.' },
              ],
            },
            {
              slug: 'es-2',
              title: 'Esercizio 2',
              sottotitolo: 'Rompere il programma, di proposito',
              testo: [
                'Partite dal programma dell’esercizio 1. Togliete una cosa alla volta, premete Run e annotate la prima riga del messaggio. Poi rimettetela a posto.',
                'Non tutti e quattro fermano il programma: in qualche caso il messaggio è soltanto un avviso, e il programma parte e stampa comunque. Annotate quindi anche se è partito, non solo che cosa c’è scritto.',
              ],
              // Colonne: che cosa si toglie · che cosa ci si aspetta · che cosa dice il compilatore (gcc) · se è partito.
              tabella: [
                ['Il punto e virgola di una printf', 'Errore: manca la fine dell’istruzione', 'error: expected \';\' before … (la riga indicata è quella dopo la printf)', 'No: non parte'],
                ['La graffa di chiusura', 'Errore: il blocco di main non si chiude', 'error: expected declaration or statement at end of input', 'No: non parte'],
                ['La riga #include <stdio.h>', 'Errore: printf non è nota', 'warning: implicit declaration of function \'printf\' (con gcc 14 o più recente è un error)', 'Sì con gcc fino alla 13, stampa lo stesso. No con gcc 14 o più recente'],
                ['Le virgolette di chiusura', 'Errore: la stringa non finisce', 'error: missing terminating " character', 'No: non parte'],
              ],
              note: [
                'I messaggi vengono dal compilatore gcc, che è quello di myCompiler, e il testo preciso cambia un po’ da versione a versione. Quello che conta è la prima riga: le altre sono spesso conseguenze della prima.',
                'Il numero di riga che il compilatore indica è dove si accorge del guaio, non sempre dove sta la dimenticanza: col punto e virgola mancante segnala la riga dopo.',
                'L’unico caso in cui il programma può partire è la riga #include <stdio.h> tolta. Una printf senza dichiarazione è, per il compilatore, una funzione sconosciuta: le versioni meno recenti si limitano a un avviso e la collegano comunque, quelle recenti lo trattano come errore.',
              ],
            },
            {
              slug: 'es-3',
              title: 'Esercizio 3',
              sottotitolo: 'Dalla divisione alla conversione',
              testo: [
                'Scrivete in myCompiler, a mano, il programma della slide «Lo stesso in C: un ciclo dentro l’altro»: sono le divisioni successive di lunedì scorso, con dentro il ciclo della divisione dell’esercizio 1.',
              ],
              richieste: [
                'Premete Run con M = 45 e b = 2, e leggete le cifre dal basso: deve venire 101101.',
                'Cambiate b in 8, poi in 16. In base 16 compare la cifra 13: si scrive D.',
                'Trovate nel codice le righe della divisione, e dite quale dei due cicli fa un giro per ogni cifra.',
              ],
              // Il ciclo esterno fa un giro per cifra; dentro, il ciclo dell'esercizio 1 divide N per b.
              codice: `#include <stdio.h>

int main() {
  int M = 45;      // numero da convertire
  int b = 2;       // base di arrivo
  int N = M;       // il numero che si divide, giro dopo giro
  int i = 0;       // posizione della cifra: c0, c1, c2...

  while (N > 0) {
    int R = N;     // da qui il ciclo dell'esercizio 1: N diviso b
    int P = 0;
    while (R >= b) {
      R = R - b;
      P = P + 1;
    }

    char c = (R < 10) ? '0' + R : 'A' + R - 10;
    printf("c%d = %c\\n", i, c);

    N = P;         // il quoziente è il numero del giro dopo
    i = i + 1;
  }
  return 0;
}`,
              outputDi: 'Output con M = 45 e b = 2 (le cifre escono da c0):',
              output: `c0 = 1
c1 = 0
c2 = 1
c3 = 1
c4 = 0
c5 = 1`,
              svolgimento: [
                { titolo: 'Il programma', testo: 'Il ciclo esterno prende N, lo divide per b con il ciclo dell’esercizio 1 e ottiene un quoziente P e un resto R. Il resto è una cifra del risultato; il quoziente diventa il nuovo N. Si ripete finché N arriva a 0.' },
                { titolo: '45 in base 2', testo: '45 : 2 = 22 resto 1; 22 : 2 = 11 resto 0; 11 : 2 = 5 resto 1; 5 : 2 = 2 resto 1; 2 : 2 = 1 resto 0; 1 : 2 = 0 resto 1. I resti, dal primo all’ultimo, sono c0 … c5 = 1, 0, 1, 1, 0, 1. Letti dal basso, cioè dall’ultimo al primo, danno 101101.' },
                { titolo: 'Base 8 e base 16', testo: 'Con b = 8: 45 : 8 = 5 resto 5, poi 5 : 8 = 0 resto 5, quindi c0 = 5, c1 = 5 e il numero è 55 (5 · 8 + 5 = 45). Con b = 16: 45 : 16 = 2 resto 13, poi 2 : 16 = 0 resto 2, quindi c0 = 13, c1 = 2. Il 13 non è una cifra sola, e nel programma la riga con (R < 10) lo trasforma nella lettera D: il numero è 2D (2 · 16 + 13 = 45).' },
                { titolo: 'Le righe della divisione e i due cicli', testo: 'Le righe della divisione sono quelle del ciclo interno: while (R >= b) { R = R - b; P = P + 1; }, con int R = N; e int P = 0; subito prima. A fare un giro per ogni cifra è il ciclo esterno, while (N > 0): ogni suo giro esegue per intero la divisione e stampa una cifra. Il ciclo interno invece gira tante volte quanto vale il quoziente di quella divisione.' },
                { titolo: 'Perché si legge dal basso', testo: 'Le cifre escono a partire da c0, la meno significativa, quindi il programma le stampa in ordine inverso rispetto al numero. Per stamparle nell’ordine giusto servono strumenti che si vedranno nelle prossime lezioni.' },
              ],
            },
          ],
        },
        {
          slug: 'blocco-2',
          title: 'Blocco 2',
          lead: 'Leggere i dati con scanf, i numeri con la virgola (double) e i formati di printf.',
          esercizi: [
            {
              slug: 'es-1',
              title: 'Esercizio 1',
              sottotitolo: 'L’area del rettangolo',
              testo: [
                'Scrivete il programma che chiede base e altezza (due double) e stampa l’area con due decimali.',
              ],
              richieste: [
                'Poi aggiungete il perimetro, sulla riga dopo, anch’esso con due decimali.',
                'Poi incolonnate i due risultati usando la larghezza di campo, per esempio %10.2f.',
                'Infine provate a scrivere %f al posto di %lf in una delle due letture, e guardate che numero viene fuori.',
              ],
              // La versione finale: area e perimetro, incolonnati con la larghezza di campo.
              // Le etichette sono lunghe uguali (10 caratteri), così i numeri finiscono nella stessa colonna.
              codice: `#include <stdio.h>

int main() {
  double base, altezza;

  printf("Base: ");
  scanf("%lf", &base);      // %lf: il numero va in un double
  printf("Altezza: ");
  scanf("%lf", &altezza);

  double area = base * altezza;
  double perimetro = 2 * (base + altezza);

  // %10.2f: 10 caratteri in tutto, 2 dopo il punto, allineato a destra
  printf("\\nArea      %10.2f\\n", area);
  printf("Perimetro %10.2f\\n", perimetro);
  return 0;
}`,
              outputDi: 'Output in myCompiler, con 12.5 e 8 scritti nel riquadro dell’input (stdin):',
              output: `Base: Altezza:
Area          100.00
Perimetro      41.00`,
              svolgimento: [
                { titolo: 'Come funziona', testo: 'Le due variabili sono double, cioè numeri con la virgola. scanf("%lf", &base) legge un numero e lo mette in base: %lf dice che la variabile è un double, la & davanti al nome dà a scanf l’indirizzo della variabile, cioè il posto dove scrivere. Il numero si scrive col punto, non con la virgola: 12.5. Con 12,5 scanf legge 12 e si ferma alla virgola, e la lettura dell’altezza fallisce.' },
                { titolo: 'L’area con due decimali', testo: 'area = base * altezza, e printf("%.2f\\n", area) la stampa con due cifre dopo il punto, arrotondando: 12.5 per 8 stampa 100.00, 2.5 per 1.5 stampa 3.75, 1.7 per 1.47 (che fa 2.499) stampa 2.50.' },
                { titolo: 'Il perimetro, sulla riga dopo', testo: 'perimetro = 2 * (base + altezza), stampato con una seconda printf. Va sulla riga dopo perché la printf dell’area finisce con \\n: senza, il perimetro uscirebbe attaccato all’area. Con 12.5 e 8 il perimetro è 2 · 20.5 = 41.00.' },
                { titolo: 'La larghezza di campo', testo: 'In %10.2f il 10 è la larghezza: il numero occupa 10 caratteri in tutto, punto e decimali compresi, allineato a destra, e quello che avanza diventa spazi davanti. 100.00 sono 6 caratteri, quindi prende 4 spazi; 41.00 sono 5 caratteri, quindi ne prende 5. Perché i numeri finiscano nella stessa colonna anche le etichette devono essere lunghe uguali: «Area» con sei spazi e «Perimetro» con uno fanno 10 caratteri tutte e due, e i punti decimali vengono uno sotto l’altro. Un numero più largo di 10 caratteri si stampa comunque intero, ma esce dalla colonna.' },
                { titolo: '%f al posto di %lf', testo: 'In scanf, %f vuol dire float: un numero con la virgola di 4 byte, mentre un double ne occupa 8. Scrivendo scanf("%f", &base) il numero viene scritto come float nella prima metà di base, e l’altra metà resta com’era. Il risultato, letto come double, non c’entra niente con quello scritto: di solito esce 0.00 oppure un numero senza senso, anche enorme, a seconda di che cosa c’era prima in quella metà. Se l’altra metà è a zero, con 12.5 e 8 base vale circa 5 · 10⁻³¹⁵: l’area stampa 0.00 e il perimetro 16.00, come se la base fosse zero. Con gli avvisi attivi gcc lo segnala già in compilazione: warning: format \'%f\' expects argument of type \'float *\', but argument 2 has type \'double *\'.' },
                { titolo: 'Perché in printf invece va bene %f', testo: 'printf riceve il valore, e i float passati a printf diventano double: per questo in printf %f stampa già un double, e %lf fa la stessa cosa. scanf invece riceve l’indirizzo, e deve sapere quanti byte scrivere: %f per un float, %lf per un double.' },
                { titolo: 'In myCompiler', testo: 'myCompiler non chiede i numeri mentre il programma gira: si scrivono prima di premere Run nel riquadro dell’input (stdin), separati da uno spazio o da un a capo. I numeri letti non compaiono nell’output, e le due domande escono attaccate sulla stessa riga: per questo la printf dell’area comincia con \\n, che porta i risultati a capo. In un terminale invece ogni numero si scrive dopo la sua domanda, seguito da Invio.' },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'analisi-geometria',
      title: 'Analisi e geometria',
      lead: 'Analisi matematica e geometria: appunti ed esercizi.',
      blocchi: [],
    },
    {
      slug: 'fisica',
      title: 'Fisica',
      lead: 'Fisica: appunti ed esercizi.',
      blocchi: [],
    },
  ],
}

export const materiaPath = (m) => `${unimore.path}${m.slug}/`
export const bloccoPath = (m, b) => `${materiaPath(m)}${b.slug}/`
export const esercizioPath = (m, b, e) => `${bloccoPath(m, b)}${e.slug}/`
