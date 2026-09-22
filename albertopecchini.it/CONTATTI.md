# Modulo di contatto — come funziona e come si configura

Quando qualcuno compila il modulo su `/contatti/`, il messaggio arriva in due
posti insieme: **una email** formattata e **una notifica su WhatsApp**. Se uno
dei due canali si guasta, l'altro riceve lo stesso: la richiesta non si perde.

Tutto gira su Vercel, che ospita già il sito. Non c'è nulla da installare, non
c'è un server da mantenere e, con i volumi di un portfolio, **non si paga nulla**.

```
  /contatti/  ──POST──▶  /api/contatti  ──▶  Resend    ──▶  email
   (browser)             (Vercel)        └─▶  CallMeBot ──▶  WhatsApp
```

## I pezzi

| Pezzo | A cosa serve | Costo |
|---|---|---|
| **Vercel** | ospita sito e funzione `api/contatti.js` | gratis (piano Hobby) |
| **Resend** | spedisce la email | gratis fino a 3.000 email/mese, 100 al giorno |
| **CallMeBot** | manda la notifica WhatsApp | gratis |
| **Cloudflare Turnstile** | ferma i bot | gratis fino a 1 milione di verifiche/mese |

---

## Configurazione, un pezzo alla volta

Ogni pezzo è indipendente: se ne configuri solo uno, il modulo funziona lo
stesso con quello. Il consiglio è di attivarli nell'ordine in cui sono scritti.

### 1. Resend — la email

1. Registrati su [resend.com](https://resend.com) (basta l'account GitHub).
2. **API Keys → Create API Key**, permesso *Sending access*. Copia la chiave
   (`re_...`): viene mostrata una volta sola.
3. Per partire subito puoi usare il mittente di prova `onboarding@resend.dev`,
   ma la email finisce spesso nello spam. Meglio verificare il dominio:
   **Domains → Add Domain → `albertopecchini.it`**, poi copia i record DNS
   (SPF, DKIM e DMARC) nel pannello del dominio. La verifica richiede da pochi
   minuti a qualche ora. Fatto questo, il mittente diventa
   `contatti@albertopecchini.it`.

### 2. CallMeBot — la notifica WhatsApp

Servizio gratuito pensato esattamente per le notifiche personali. Non serve un
account WhatsApp Business.

1. Salva in rubrica il numero **+34 621 331 709** (nome a piacere, es. «CallMeBot»).
2. Da WhatsApp mandagli il messaggio: `I allow callmebot to send me messages`
3. Rispondi con la tua **API key** (un numero di 6-7 cifre): è quella che va
   nella variabile `CALLMEBOT_APIKEY`.

Il tuo numero va scritto in formato internazionale senza spazi: `+393510355506`.

> **Nota.** CallMeBot è un servizio gratuito gestito da una sola persona: è
> affidabile per le notifiche ma non ha garanzie contrattuali. Per questo la
> email resta il canale principale e WhatsApp è la sveglia che ti fa rispondere
> prima. Se un giorno smettesse di funzionare, il modulo continua a mandare le
> email e nel log di Vercel compare l'avviso.

### 3. Cloudflare Turnstile — l'antispam

1. Entra su [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile**
   → **Add Site**.
2. Dominio: `albertopecchini.it`. Tipo di widget: **Managed**.
3. Ottieni due chiavi:
   - **Site Key** (pubblica) → va in `src/data/site.js`, campo
     `form.turnstileSiteKey`. Finisce nell'HTML: non è un segreto.
   - **Secret Key** → va nelle variabili d'ambiente di Vercel.

Finché `turnstileSiteKey` è vuota il riquadro non compare e il modulo resta
perfettamente funzionante: restano attivi campo trappola, controllo sui tempi
e limite di frequenza.

### 4. Le variabili d'ambiente su Vercel

**Project → Settings → Environment Variables.** Impostale su *Production*,
*Preview* e *Development*.

| Variabile | Valore | Se manca |
|---|---|---|
| `RESEND_API_KEY` | la chiave `re_...` del punto 1 | niente email |
| `CONTACT_TO` | `pzkko@yahoo.com` | niente email |
| `CONTACT_FROM` | `Sito albertopecchini.it <contatti@albertopecchini.it>` | usa `onboarding@resend.dev` |
| `CALLMEBOT_PHONE` | `+393510355506` | niente WhatsApp |
| `CALLMEBOT_APIKEY` | la chiave del punto 2 | niente WhatsApp |
| `TURNSTILE_SECRET_KEY` | la Secret Key del punto 3 | antispam non verificato lato server |

Dopo averle inserite serve un nuovo deploy perché vengano lette.

---

## Provare che funzioni

**In locale**, con la CLI di Vercel (`npm i -g vercel`):

```bash
vercel dev            # serve sito e funzione insieme, su http://localhost:3000
```

Le variabili si scrivono in un file `.env.local` nella cartella del sito (è già
escluso da Git dalla regola `*.local`).

**Online**, dopo il deploy: compila il modulo su `albertopecchini.it/contatti/`
e controlla che arrivino sia la email sia il messaggio WhatsApp.

**Se qualcosa non torna**: Vercel → il progetto → **Logs**, filtra su
`/api/contatti`. La funzione scrive righe chiare come
`contatti: notifica WhatsApp non consegnata — HTTP 403`, che dicono quale dei
due canali ha avuto un problema e perché.

Per una verifica veloce da riga di comando (sostituisci il dominio):

```bash
curl -i -X POST https://albertopecchini.it/api/contatti \
  -H "Content-Type: application/json" \
  -d '{"nome":"Prova Invio","email":"tua@email.it","tipo":"Altro","messaggio":"Messaggio di prova lungo abbastanza per passare i controlli.","privacy":true}'
```

Con Turnstile attivo questa richiesta riceve `403`: è il comportamento giusto,
perché manca il gettone che genera il browser. Per provare la consegna vera usa
il modulo dal sito.

---

## Come si difende dallo spam

Cinque filtri, dal più economico al più costoso. I primi quattro non costano
nulla e non disturbano chi scrive davvero.

1. **Campo trappola** (`sito`): invisibile, se compilato la richiesta viene
   scartata fingendo un invio riuscito, così il bot non capisce e non riprova.
2. **Tempo di compilazione**: sotto i 3 secondi è un programma automatico.
3. **Limite di frequenza**: 5 invii l'ora per indirizzo IP.
4. **Validazione lato server**: gli stessi controlli del browser, rifatti da
   capo — perché quelli del browser si possono aggirare. Comprende il rifiuto
   dei ritorni a capo nel nome, che servirebbero a manomettere le intestazioni
   della email.
5. **Turnstile**: verifica di Cloudflare, quasi sempre invisibile.

Se Cloudflare risulta irraggiungibile la richiesta viene lasciata passare: è
preferibile ricevere qualche messaggio non verificato piuttosto che perdere il
contatto di un cliente. Gli altri quattro filtri restano comunque attivi.

---

## Dove mettere le mani

| File | Cosa c'è |
|---|---|
| `api/contatti.js` | la funzione: controlli, formato della email, invio |
| `src/data/site.js` → `form` | endpoint, sitekey Turnstile, voci dei menu a tendina |
| `src/templates/pages/contact.js` | il modulo in pagina |
| `src/client/form.js` | validazione nel browser, Turnstile, invio |
| `src/templates/pages/legal.js` | informativa privacy (già aggiornata con i fornitori) |

**Per cambiare l'aspetto della email** basta modificare `emailHtml()` in
`api/contatti.js`: è HTML da tabelle, quello che i programmi di posta
gestiscono senza sorprese.

**Per spegnere un canale** togli le sue variabili d'ambiente: la funzione se ne
accorge da sola e continua con l'altro.
