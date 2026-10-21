"""Legge la lavagna durante la lezione con Claude (facoltativo: serve ANTHROPIC_API_KEY).

    python ocr_claude.py <cartella_lezione> [--modello claude-opus-5-5] [--ogni 120] [--prova]

Fa da solo quello che altrimenti fa Claude Code a giri: ogni ~2 minuti (prima, se ci sono
almeno 5 fotogrammi nuovi) prende i fotogrammi ancora da leggere (al più 18), ne fa i ritagli
e i provini 3×3 (prepara.py), sceglie fino a 4 dettagli a piena risoluzione (l'ultimo
fotogramma e quelli subito prima che la lavagna cambi molto, cioè completi) e li manda a
Claude con la frase detta in quel momento e le ultime letture già fatte. La risposta, in JSON
vincolato da uno schema, diventa ocr/ocr_NNN.json nello stesso formato delle letture a mano;
poi rifà grezzo.md. Mentre legge scrive attivita.json (la barra mostra «ocr leggo»).
Finisce (uscita 0) quando c'è FINE e non resta niente da leggere; senza chiave lo dice ed
esce subito, sempre con 0, così il guardiano di lezione.ps1 non lo rilancia.

Costo stimato (prezzi di ottobre 2026), lezione di 2 h 30 con 444 fotogrammi: ~75 lotti da
~6 fotogrammi, ~9.000 token d'ingresso l'uno (un provino da ~1.950, fino a 4 dettagli da
~1.430, il testo; il prompt fisso va in cache; un lotto pieno da 18 ne fa ~12.000) e ~2.500
d'uscita col ragionamento: Claude Opus 5.5 (predefinito) circa 6–7 $; --modello
claude-sonnet-5-5 circa 3 $; --modello claude-haiku-5-5 circa 0,2 $ (meno preciso sulle
formule). Il conto vero, dai token che riporta l'API, è in claude_costo.json.

--prova: non chiama l'API. Salva in prova_claude/ quello che manderebbe (immagini, misure,
token stimati) e usa una risposta finta per provare il resto (validazione, file, grezzo.md).
Di Alberto Pecchini — https://www.pzkko.it/tools/lezioni/
"""
import argparse
import json
import sys
import time
from pathlib import Path

import componi
import prepara
from claude_comune import (MODELLO, Fallita, Fatale, Riprova, attendi, chiama, client, costo, immagine,
                           registra_costo, stima_token, verifica)
from comune import da_fare, hms, leggi_json, leggi_jsonl, prossimo_ocr, scrivi_json

MAX_LOTTO, DETTAGLI = 18, 4

SISTEMA = r"""Leggi la lavagna di una lezione universitaria ripresa da una telecamera (riunione Teams).

Ricevi un lotto di fotogrammi in ordine di tempo:
- i provini: griglie 3×3 di ritagli della lavagna, col nome del fotogramma sotto ogni casella, per vedere cosa cambia da uno all'altro;
- alcuni dettagli a piena risoluzione, per leggere bene le formule;
- per ogni fotogramma l'ora nella registrazione e la frase che il docente diceva in quel momento (trascrizione automatica di Whisper: aiuta a capire, ma storpia i termini);
- le ultime letture già fatte, per continuare da lì.

Per OGNI fotogramma del lotto, una e una sola lettura:
- tipo "nuovo": sulla lavagna è comparso o cambiato qualcosa, o il docente ha detto qualcosa che serve a capire (una regola, un avvertimento, una domanda alla classe). In «nuovo» una frase breve in italiano su cosa è cambiato o cosa sta facendo; in «lavagna» SOLO il contenuto nuovo, in Markdown con LaTeX per KaTeX ($…$ in riga, $$…$$ a blocco). «lavagna» può restare vuota se la novità è solo che il docente cancella o parla.
- tipo "uguale": niente di nuovo da leggere (lavagna invariata, docente davanti, stessa formula). «nuovo» e «lavagna» vuoti.
- tipo "salta": il fotogramma non mostra la lezione (schermata d'errore, chat aperta, desktop, pausa con lavagna vuota). «nuovo» e «lavagna» vuoti.

Regole:
1. La lavagna fa fede sulla voce. Whisper sbaglia: «è alla x» = $e^x$, «mepero» = Nepero, «xen» = arcsen, «ar tangente» = arctg; «Grazie…» ripetuti sono rumore, non parlato.
2. Non ripetere ciò che è già nelle letture precedenti: continua da lì. Quando un esercizio o una dimostrazione si chiude, scrivi in «lavagna» la catena completa in un'unica formula, dall'inizio al risultato.
3. Grafici e disegni: descrivili in corsivo tra _(…)_ — che funzione è, asintoti, punti segnati, ciò che è cerchiato o colorato. Le cose riquadrate alla lavagna: \boxed{…}.
4. Se un pezzo è fuori inquadratura o coperto dal docente e lo ricostruisci dalla voce, scrivilo in «nuovo» («fuori inquadratura: dalla voce»). Se non si legge, scrivi solo ciò che è certo: niente invenzioni.
5. Notazione italiana: \operatorname{sen}, \operatorname{tg}, \operatorname{arctg}, \operatorname{arcsen}, \ln, \log_a, \nexists.
6. Usa i nomi dei fotogrammi esattamente come dati (t_000123.jpg). Non riportare nomi di studenti.

Esempi di buone letture (da una lezione di Analisi sui limiti):
{"frame": "t_005132.jpg", "tipo": "nuovo", "nuovo": "Prodotto notevole (somma per differenza) per il numeratore.", "lavagna": "$$(a-b)(a+b)=a^2-b^2$$\n\n$$\\lim_{x\\to0}\\frac{1-\\cos x}{x^2}\\cdot\\frac{1+\\cos x}{1+\\cos x}=\\lim_{x\\to0}\\frac{1-\\cos^2x}{x^2(1+\\cos x)}$$"}
{"frame": "t_005178.jpg", "tipo": "uguale", "nuovo": "", "lavagna": ""}
{"frame": "t_000969.jpg", "tipo": "nuovo", "nuovo": "Grafico dell'arcotangente con gli asintoti orizzontali.", "lavagna": "_(grafico: $y=\\operatorname{arctg}x$ crescente, passa per l'origine, asintoti $y=\\frac{\\pi}{2}$ per $x\\to+\\infty$ e $y=-\\frac{\\pi}{2}$ per $x\\to-\\infty$)_"}
{"frame": "t_005851.jpg", "tipo": "nuovo", "nuovo": "Limite destro e sinistro diversi: il limite non esiste.", "lavagna": "$$\\lim_{x\\to2}e^{\\frac{1}{x-2}}=\\begin{cases}\\displaystyle\\lim_{x\\to2^-}e^{\\frac{1}{x-2}}=e^{-\\infty}=0^+\\\\[2mm]\\displaystyle\\lim_{x\\to2^+}e^{\\frac{1}{x-2}}=e^{+\\infty}=+\\infty\\end{cases}\\ \\Rightarrow\\ \\nexists\\lim_{x\\to2}e^{\\frac{1}{x-2}}$$"}
{"frame": "t_008212.jpg", "tipo": "nuovo", "nuovo": "⚠️ Regola: stesso grado ma coefficienti diversi ($3\\neq9$) ⇒ si può raccogliere; con coefficienti uguali no (servirà il coniugato).", "lavagna": "$$3\\neq9\\ \\Rightarrow\\ \\text{anche se hanno lo stesso grado posso raccogliere}$$"}
{"frame": "t_003933.jpg", "tipo": "salta", "nuovo": "", "lavagna": ""}
"""

SCHEMA = {
    'type': 'object',
    'properties': {'letture': {'type': 'array', 'items': {
        'type': 'object',
        'properties': {'frame': {'type': 'string'}, 'tipo': {'type': 'string', 'enum': ['nuovo', 'uguale', 'salta']},
                       'nuovo': {'type': 'string'}, 'lavagna': {'type': 'string'}},
        'required': ['frame', 'tipo', 'nuovo', 'lavagna'], 'additionalProperties': False}}},
    'required': ['letture'], 'additionalProperties': False,
}


def dettagli(lotto, tutti, quanti):
    """I fotogrammi da mandare interi: quelli subito prima di un grosso cambio (la lavagna completa
    prima di essere cancellata) e l'ultimo del lotto, al più `quanti`, in ordine di tempo."""
    dopo = {f['file']: tutti[i + 1] for i, f in enumerate(tutti[:-1])}
    scelti = [f for f in lotto[:-1] if f['file'] in dopo and dopo[f['file']].get('cambio', 0) >= 0.08]
    scelti = sorted(scelti, key=lambda f: dopo[f['file']]['cambio'], reverse=True)[:quanti - 1]
    return sorted(scelti + [lotto[-1]], key=lambda f: f['t'])


def precedenti(cart, quante=8):
    """Le ultime letture con qualcosa dentro, come contesto."""
    letture = []
    for p in sorted((cart / 'ocr').glob('ocr_*.json')):
        letture += [d for d in leggi_json(p, []) or [] if d.get('lavagna') or d.get('nuovo')]
    return letture[-quante:]


def contenuto(cart, lotto, n_lotto, quanti_dettagli):
    """Il messaggio per Claude: testo, provini, dettagli. Ritorna anche il riassunto per la prova."""
    tutti = leggi_jsonl(cart / 'frames.jsonl')
    voce = leggi_jsonl(cart / 'trascrizione.jsonl')
    st = leggi_json(cart / 'trascrizione_stato.json', {}) or {}
    nomi = [Path(f['file']).name for f in lotto]
    for n in nomi:
        prepara.ritaglia(cart, n)
    righe = []
    for f in lotto:
        detto = ' '.join(s['testo'] for s in voce if f['t'] - 12 <= s['t0'] <= f['t'] + 8)
        righe.append(f'- {Path(f["file"]).name} · {hms(f["t"])} · «{detto[:300]}»')
    prec = precedenti(cart)
    testo = (f'Lotto {n_lotto}: {len(lotto)} fotogrammi, da {hms(lotto[0]["t"])} a {hms(lotto[-1]["t"])}.'
             + (f' Lingua della lezione: {st["lingua"]}.' if st.get('lingua') else '')
             + '\n\nFotogrammi, con la frase detta in quel momento:\n' + '\n'.join(righe)
             + '\n\nUltime letture già fatte (non ripeterle, continua da qui):\n'
             + ('\n'.join(json.dumps({k: d[k] for k in ('frame', 'nuovo', 'lavagna') if k in d}, ensure_ascii=False)
                          for d in prec) or '(nessuna: è l\'inizio della lezione)'))
    blocchi = [{'type': 'text', 'text': testo}]
    riassunto = {'lotto': n_lotto, 'fotogrammi': nomi, 'immagini': []}
    (cart / 'provini').mkdir(exist_ok=True)
    for i in range(0, len(nomi), 9):
        p = prepara.provino(cart, cart / 'provini' / f'auto_{n_lotto:03d}_{i // 9 + 1}.jpg', nomi[i:i + 9])
        b, tok, dim = immagine(p)
        blocchi += [{'type': 'text', 'text': f'Provino: {", ".join(nomi[i:i + 9])}'}, {**b, '_token': tok}]
        riassunto['immagini'].append({'file': Path(p).name, 'misure': dim, 'token': tok})
    for f in dettagli(lotto, tutti, quanti_dettagli):
        n = Path(f['file']).name
        b, tok, dim = immagine(cart / 'ritagli' / n)
        blocchi += [{'type': 'text', 'text': f'Dettaglio a piena risoluzione: {n} ({hms(f["t"])})'}, {**b, '_token': tok}]
        riassunto['immagini'].append({'file': n, 'misure': dim, 'token': tok})
    blocchi.append({'type': 'text', 'text': f'Restituisci una lettura per ciascuno di questi {len(nomi)} fotogrammi: '
                                            + ', '.join(nomi) + '.'})
    return blocchi, riassunto


def valida(testo, nomi):
    """Dalla risposta alle letture nel formato di ocr/*.json, in ordine di tempo. Ritorna (letture, mancanti)."""
    try:
        dati = json.loads(testo)['letture']
    except (json.JSONDecodeError, KeyError, TypeError):
        return {}, list(nomi)
    trovate = {}
    for d in dati if isinstance(dati, list) else []:
        n = Path(str(d.get('frame', ''))).name
        if n not in nomi or n in trovate:  # nomi inventati o doppioni: via
            continue
        if d.get('tipo') == 'salta':
            trovate[n] = {'frame': f'frames/{n}', 'salta': True}
        elif d.get('tipo') == 'uguale' or not (d.get('nuovo') or d.get('lavagna')):
            trovate[n] = {'frame': f'frames/{n}', 'uguale': True}
        else:
            trovate[n] = {'frame': f'frames/{n}', 'nuovo': d.get('nuovo', ''), 'lavagna': d.get('lavagna', '')}
    return trovate, [n for n in nomi if n not in trovate]


def finta(nomi):
    """La risposta della prova a secco: il primo fotogramma nuovo, gli altri uguali."""
    return json.dumps({'letture': [{'frame': n, 'tipo': 'nuovo' if i == 0 else 'uguale',
                                    'nuovo': '(prova a secco: nessuna chiamata)' if i == 0 else '',
                                    'lavagna': '_(prova a secco)_' if i == 0 else ''} for i, n in enumerate(nomi)]})


def leggi_lotto(cl, cart, lotto, a, n_lotto):
    """Un lotto dall'inizio alla fine. True se è scritto, False se va riprovato più tardi."""
    nomi = [Path(f['file']).name for f in lotto]
    scrivi_json(cart / 'attivita.json', {'frames': [f['file'] for f in lotto]})
    blocchi, riassunto = contenuto(cart, lotto, n_lotto, a.dettagli)
    trovate, mancanti = {}, list(nomi)
    for tentativo in (1, 2):
        if a.prova:
            riassunto['token_stimati'] = stima_token(blocchi, SISTEMA)
            (cart / 'prova_claude').mkdir(exist_ok=True)
            scrivi_json(cart / 'prova_claude' / f'lotto_{n_lotto:03d}.json', riassunto)
            testo, spesa = finta(mancanti), None
        else:
            try:
                testo, usage = chiama(cl, a.modello, SISTEMA, blocchi, effort=a.effort, max_tokens=16000, schema=SCHEMA)
            except Fallita as e:
                print(f'lotto {n_lotto}, tentativo {tentativo}: {e}', flush=True)
                continue
            u = costo(a.modello, usage)
            spesa = registra_costo(cart, 'ocr', a.modello, u)
            print(f'lotto {n_lotto}: {u["input_tokens"]} in + {u["cache_read_input_tokens"]} dalla cache, '
                  f'{u["output_tokens"]} out, {u["usd"]:.3f} $ (in tutto {spesa:.2f} $)', flush=True)
        nuove, mancanti = valida(testo, mancanti)
        trovate.update(nuove)
        if not mancanti:
            break
        # al secondo giro si chiedono solo quelli rimasti fuori
        blocchi = blocchi[:-1] + [{'type': 'text', 'text': 'Nella risposta precedente mancavano questi fotogrammi: '
                                   + ', '.join(mancanti) + '. Restituisci una lettura per ciascuno di loro.'}]
    for n in mancanti:  # dopo due tentativi: segnati, così non si riprovano all'infinito
        trovate[n] = {'frame': f'frames/{n}', 'nuovo': '_(lettura automatica non riuscita: guarda il fotogramma)_',
                      'lavagna': ''}
    scrivi_json(prossimo_ocr(cart), [trovate[n] for n in nomi])
    try:
        componi.componi(cart)
    except Exception as e:  # grezzo.md lo rifà comunque il trascrittore
        print('grezzo.md non aggiornato:', e, flush=True)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--modello', default=MODELLO, help='claude-opus-5-5 (predefinito), claude-sonnet-5-5, claude-haiku-5-5')
    ap.add_argument('--effort', default='medium', choices=['low', 'medium', 'high', 'xhigh', 'max'])
    ap.add_argument('--ogni', type=float, default=120, help='secondi fra un lotto e l\'altro')
    ap.add_argument('--fotogrammi', type=int, default=5, help='un lotto prima, se ci sono almeno tanti fotogrammi')
    ap.add_argument('--lotto', type=int, default=MAX_LOTTO, help='fotogrammi al più per lotto')
    ap.add_argument('--dettagli', type=int, default=DETTAGLI, help='ritagli a piena risoluzione per lotto')
    ap.add_argument('--prova', action='store_true', help='nessuna chiamata: salva le richieste e usa risposte finte')
    a = ap.parse_args()
    cart = Path(a.cartella)
    cl = None
    if not a.prova:
        cl = client()
        while True:
            try:
                verifica(cl, a.modello)
                break
            except Fatale as e:
                print(f'lettura con Claude spenta: {e}', flush=True)
                return 0
            except Riprova as e:
                attendi(60, str(e))
    print(f'lettura della lavagna con {a.modello}{" (prova a secco)" if a.prova else ""}', flush=True)
    ultimo, n_lotto = 0.0, len(list((cart / 'ocr').glob('ocr_*.json')))
    while True:
        fine = (cart / 'FINE').exists()
        fare = da_fare(cart)
        if not fare:
            if fine:
                break
            time.sleep(5)
            continue
        attesa = time.time() - ultimo
        if not (fine or attesa >= a.ogni or (len(fare) >= a.fotogrammi and attesa >= 60)):
            time.sleep(5)
            continue
        n_lotto += 1
        try:
            leggi_lotto(cl, cart, fare[:a.lotto], a, n_lotto)
        except Riprova as e:
            n_lotto -= 1
            attendi(60, str(e))
            continue
        except Fatale as e:
            print(f'lettura con Claude spenta: {e}', flush=True)
            break
        finally:
            scrivi_json(cart / 'attivita.json', {'frames': []})
        ultimo = time.time()
    print('lettura della lavagna finita', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
