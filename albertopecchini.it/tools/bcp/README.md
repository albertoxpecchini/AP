# Contatore visite di Better Call Pekko

Le parti vive di bettercallpekko.it (contavisite, persone online, like, forum…)
stanno in un documento JSON su Vercel Blob e passano da `api/bcp.js`. Dal
7 ottobre 2026 ogni visita nuova si conta anche **per giorno** (ora di Roma) e
**per sito di provenienza**: la pagina manda il nome host di `document.referrer`
(solo quello, niente percorso, e solo se è un altro sito); l'API lo pulisce e
somma. Serve a vedere se chi ci sponsorizza porta gente davvero.

## Leggere i numeri senza sporcarli

Aprire la pagina conta una visita; una `GET` all'API no. Dal terminale:

```
node tools/bcp/visite.mjs            # ogni 30 s, Ctrl+C per fermare
node tools/bcp/visite.mjs --once     # una lettura sola
node tools/bcp/visite.mjs --ogni 10  # ogni 10 s
```

Stampa totale, online adesso, visite di oggi, gli ultimi giorni e la classifica
delle provenienze (`direct` = indirizzo scritto a mano o segnalibro, `other` =
oltre i 40 siti distinti tenuti). La stessa lettura si può fare nel browser:
<https://www.bettercallpekko.it/api/bcp/> (campi `visits`, `online`, `today`,
`days`, `refs`). La risposta in lettura ha `Access-Control-Allow-Origin: *`,
così anche una pagina su un'altra origine (un cruscotto) può leggerla.

## Cosa conta e cosa no

- **Visita** = prima apertura della pagina in una scheda (`sessionStorage`
  `bcp-seen`); ricaricare o passare a /contact/ nella stessa scheda non conta.
- **Online** = chi ha aperto la pagina negli ultimi 5 minuti (massimo 80).
- **Provenienza** = nome host del referrer. Con la Referrer-Policy di default dei
  browser arriva comunque l'origine (`https://outbid.lol/`), quindi il sito sì, la
  pagina no. Chi arriva da un'app (WhatsApp, Telegram…) o da un link con
  `rel="noreferrer"` risulta `direct`.
- Giorni tenuti: 90; siti distinti: 40. Nessun dato personale: niente IP, niente
  identificativi, niente cookie.

Per le prove in locale: `BCP_STORE=memory npx vite --port 5180`, poi
`BCP_API=http://localhost:5180/api/bcp/ node tools/bcp/visite.mjs --once`.
