# EMAIL INPUT — Passaggio del dominio

## METADATI

```yaml
id: "2026-09-18-yahoo-hosting"
date: "2026-09-18"
from_profile: "personale"
to:
  - "Marco <marco@example.org>"
cc: []
bcc: []
reply_to: ""
subject: "Record DNS per il passaggio del dominio"
language: "it"
tone: "cordiale"
priority: "normal"
footer_profile: "auto"
request_confirmation: false
```

---

## SCOPO DELL'EMAIL

```text
Passare a Marco i record DNS da impostare per puntare il dominio al nuovo
hosting, spiegando l'ordine delle operazioni.
```

---

## ISTRUZIONI DI SCRITTURA

```text
- tono: cordiale
- lunghezza: breve
- cosa enfatizzare: l'ordine delle operazioni
- cosa evitare: allarmismi sui tempi di propagazione
```

---

## MATERIALE GREZZO

````text
Ciao Marco,

come promesso ti mando i record da impostare nel pannello del dominio.

## Record da inserire

| Tipo | Nome | Valore |
| --- | --- | --- |
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

L'apex (la `@`) va per forza su record `A`: molti pannelli non accettano un
`CNAME` sulla radice del dominio.

## Ordine delle operazioni

1. Inserisci prima il `CNAME` su `www` e verifica che risponda
2. Solo dopo sposta il record `A` dell'apex
3. Lascia invariati i record `MX`, altrimenti si ferma la posta

> Se qualcosa non torna, riportiamo il valore precedente e riproviamo con calma.

Per controllare come si è propagato puoi usare:

```
nslookup www.tuodominio.it
```

Fammi sapere quando hai fatto e controllo insieme a te.
````

---

## FILE DA LEGGERE

```text
```

---

## FILE DA ALLEGARE

```text
```

---

## LINK DA INSERIRE

```text
```

---

## FOOTER DA IMPARARE / AGGIORNARE

```text
Azione footer: KEEP_EXISTING
```

---

## NOTE INTERNE

```text
Marco non è tecnico: tenere le istruzioni semplici.
```

---

## COMANDO DESIDERATO

```text
GENERATE_EMAIL
```
