# blackjack di pzkko.it

Il tavolo di blackjack di <https://www.pzkko.it/games/blackjack/>: una stanza
sola, il banco è un bot (il server), fino a cinque amici seduti insieme in
tempo reale, chi arriva dopo guarda e si siede appena si libera un posto.
Niente soldi: si gioca coi **$pzk**, gettoni senza valore che distribuisce
pzkko. Tutto in italiano, minuscolo, nello stile di pzkko.it. All'apertura un
messaggio chiede di avere più di 18 anni.

## Com'è fatto

| pezzo | file | cosa fa |
|---|---|---|
| motore | `src/blackjack/motore.js` | regole, sabot, fasi, tempi, conti, amministrazione: funzioni pure su un oggetto JSON, senza rete né orologio (li riceve da fuori) |
| funzione | `api/blackjack.js` | archivio (Redis o memoria), richieste GET/POST, limiti di frequenza, chiave di amministrazione |
| pagina | `pzkko/games/blackjack/index.html` | il tavolo: CSS e JS in linea, nessun file esterno |
| banco | `pzkko/games/blackjack/admin/index.html` | la pagina di pzkko per dare $pzk, registrare amici, cambiare limiti e tempi (noindex) |
| terminale | `tools/blackjack/admin.mjs` | gli stessi comandi dal terminale |
| sviluppo | `tools/blackjack/dev.mjs` | server locale con archivio in memoria e amici finti (`--bot 4`) |
| prova | `tools/blackjack/prova.mjs` | le regole e i conti messi alla prova con orologio finto e caso ripetibile |

### Le regole del tavolo

Stile europeo: sabot da 6 mazzi rimescolato sotto un quarto; il banco prende
una carta scoperta e pesca le altre dopo i giocatori (niente carta coperta,
niente assicurazione); si ferma a 17 anche morbido; blackjack paga 3 a 2
(arrotondato per difetto); raddoppio su qualsiasi prima coppia; divisione una
volta sola su due carte dello stesso valore, assi divisi una carta sola; dopo
una divisione un 21 non è blackjack. Puntate da 5 a 500 $pzk (si cambia).

### I tempi (veri)

Le fasi: `attesa → puntate → distribuzione → turno → banco → esito → puntate…`

- la prima puntata apre il tavolo: 20 s per puntare; quando tutti i seduti
  hanno deciso (puntato o «salto») si chiude entro 3 s;
- le carte escono una alla volta (650 ms): il server le pesca tutte insieme e
  dà a ognuna l'orario di comparsa, i client le mostrano a quell'ora, sincronizzati
  sull'orologio del server;
- 20 s per ogni decisione (carta, stai, raddoppia, dividi); chi non risponde
  sta, due volte di fila e si alza dal tavolo;
- il banco pesca una carta ogni 900 ms; 7 s di risultati; poi si riapre.

Il server non ha un orologio che gira da solo: ogni richiesta fa scattare le
scadenze (`avanza`) e poi risponde. Finché qualcuno ha la pagina aperta (che
interroga ogni 0,8–3 s) il banco gioca da solo. La GET è uguale per tutti e la
rete di Vercel la tiene in cache un secondo: dieci schede aperte costano una
lettura di Redis al secondo.

### I giocatori

Si entra con un nome (2–14 lettere, unico): il server dà un **codice** di 24
caratteri che la pagina tiene in `localStorage`. Da un altro telefono si rientra
«col codice», che pzkko legge nella pagina del banco o con `admin.mjs codice`.
I $pzk restano nel saldo del giocatore tra una sessione e l'altra. Chi entra
riceve il «benvenuto» (0 $pzk finché pzkko non decide altro).

## Su Vercel (progetto `pzkko`)

La funzione `api/blackjack.js` si pubblica da sola a ogni push su `main`
(come `api/bcp.js`). Servono due cose dal dashboard, una volta sola:

1. **Redis**: Storage → Create → *Upstash Redis* (Marketplace, piano Free:
   256 MB, 500.000 comandi al mese) collegato al progetto `pzkko`. Vercel
   imposta da sé `KV_REST_API_URL` e `KV_REST_API_TOKEN` (vanno bene anche
   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`).
   Perché non il Blob già usato da bettercallpekko.it: nel piano Hobby include
   2.000 scritture al mese, e una mano di blackjack ne fa dieci.
2. **`BJ_ADMIN_KEY`**: Settings → Environment Variables, una stringa lunga a
   caso (almeno 8 caratteri; meglio 24). La stessa va in `.env.local` per il
   terminale. Senza chiave il tavolo funziona ma nessuno può dare $pzk.

Poi: `node tools/blackjack/admin.mjs benvenuto 100` o `dai <nome> 500`.

Costi nel piano gratuito: con cinque amici al tavolo, circa 1 lettura e qualche
scrittura di Redis al secondo (≈ 5.000 comandi l'ora: un centinaio di ore di
gioco al mese) e altrettante invocazioni della funzione (1.000.000 al mese).

## In locale

```bash
node tools/blackjack/dev.mjs --bot 4      # http://localhost:5190/games/blackjack/
node tools/blackjack/prova.mjs            # le regole e i conti
node tools/blackjack/admin.mjs --locale elenco
```

Il server di sviluppo serve `pzkko/` con gli URL puliti di Vercel e passa
`/api/blackjack/` alla funzione con l'archivio in memoria (chiave di
amministrazione `prova-locale`); con `--bot N` siede N amici finti che
puntano e giocano con la strategia di base. Con `--redis` usa il Redis vero di
`.env.local` su chiavi a parte (`bj-prova:*`). Ascolta su tutte le interfacce,
così si prova anche dal telefono sulla stessa rete.

## Il banco (amministrazione)

Dalla pagina <https://www.pzkko.it/games/blackjack/admin/> (la chiave resta
nella scheda) o dal terminale:

```bash
node tools/blackjack/admin.mjs elenco            # giocatori, $pzk, codici
node tools/blackjack/admin.mjs dai mario 500
node tools/blackjack/admin.mjs togli mario 100
node tools/blackjack/admin.mjs imposta mario 1000
node tools/blackjack/admin.mjs nuovo mario 500   # registra e stampa il codice da mandare
node tools/blackjack/admin.mjs codice mario
node tools/blackjack/admin.mjs benvenuto 100
node tools/blackjack/admin.mjs limiti 5 500
node tools/blackjack/admin.mjs tempi 20 20       # secondi: puntate, decisione
node tools/blackjack/admin.mjs espelli mario
node tools/blackjack/admin.mjs elimina mario
node tools/blackjack/admin.mjs messaggio "si gioca alle 21"
node tools/blackjack/admin.mjs azzera            # tavolo da capo, giocatori e $pzk restano
node tools/blackjack/admin.mjs stato | guarda
```

## L'API

`GET /api/blackjack/` → la vista pubblica (fase, scadenza `fine`, mano, banco,
posti con le mani, giocatori con i saldi, eventi, ultime mani, `now` del server).
Niente codici, niente sabot.

`POST /api/blackjack/` con JSON `{ a, tok, … }`:

| `a` | campi | effetto |
|---|---|---|
| `entra` | `nome` oppure `tok` | registra (torna `io` col `tok`) o rientra |
| `ping` | `tok` facoltativo | segno di vita; senza `tok` serve solo a leggere l'ora |
| `siedi` | `posto` facoltativo | al primo posto libero |
| `alzati` | | subito, o a fine mano se ha carte |
| `punta` | `importo` (0 ritira) | in attesa o puntate |
| `salta` | | resta seduto, salta la mano |
| `gioca` | `mossa`: carta, stai, raddoppia, dividi | nel proprio turno |
| `ammin` | `key`, `cmd` e i suoi campi | i comandi del banco; risponde anche con `privato` (codici, registro) |

Ogni risposta porta la vista pubblica aggiornata e, se c'è il `tok`, `io`.
Limiti: 5 ingressi al minuto per IP, 90 mosse al minuto.

## La grafica (Claude Design)

Oggi il tavolo è feltro in CSS e le carte sono disegnate in CSS (indice negli
angoli, seme al centro, semi in SVG). Il tavolo e il mazzo veri, firmati
pzkko, si disegnano in Claude Design (vedi `design-prompts.md`) e si mettono in
`pzkko/games/blackjack/art/`:

- `tavolo.svg` (1600×1000, orizzontale) e `tavolo-verticale.svg` (900×1400):
  il feltro con la scritta; la pagina lo mette come sfondo del tavolo
  (`object-fit: cover`) e nasconde la propria scritta;
- `carte/<rango><seme>.svg`, 52 file: ranghi `A 2 3 4 5 6 7 8 9 10 J Q K`, semi
  `c q f p` (cuori, quadri, fiori, picche): `Ac.svg`, `10p.svg`, `Kf.svg`…
  proporzione 5:7 (es. 250×350), angoli al 9 %; più `retro.svg`;
- `fiche-5.svg`, `fiche-10.svg`, `fiche-25.svg`, `fiche-50.svg`, `fiche-100.svg`
  (tonde, es. 200×200).

Poi in `index.html` si accendono i tre interruttori:
`const ART = { tavolo: true, carte: true, fiche: true }`. Niente altro cambia.
