"""Scrive gli appunti della lezione con Claude e li impagina in PDF (facoltativo: serve ANTHROPIC_API_KEY).

    python appunti_claude.py <cartella_lezione> [--modello claude-opus-5-5] [--effort high] [--senza-pdf] [--prova]

Legge grezzo.md (voce e lavagna sincronizzate, con le letture OCR) e chiede a Claude gli
appunti per argomento, come quelli scritti a mano del 21.10.2026: regola + esempio svolto
passo passo + il perché detto a voce, i rimandi `⏱ h:mm:ss` al grezzo, tabelle riassuntive,
«Detto a voce», «Errori da non fare», «Prossima lezione». Le figure sono i ritagli veri della
lavagna, scelti da Claude fra i fotogrammi letti e copiati in appunti/figure/ (niente codice
generato da eseguire). Scrive appunti/appunti.md — o appunti_claude.md, se c'è già un
appunti.md scritto da altri, che non si tocca — e lancia impagina.py per il PDF.
Un grezzo fino a ~500.000 token va in una richiesta sola (il contesto è di 1M); più lungo,
lo spezza: appunti parziali per ogni parte e poi una richiesta che li unisce.

Costo stimato (prezzi di ottobre 2026), lezione di 2 h 30 (grezzo da ~200 KB, ~70.000 token)
con ~25.000 token di appunti più il ragionamento: Claude Opus 5.5 (predefinito) circa 1–1,5 $;
claude-sonnet-5-5 circa la metà. Il conto vero è in claude_costo.json.

--prova: non chiama l'API; salva in prova_claude/appunti.json la richiesta (token stimati) e
usa appunti finti per provare figure e impaginazione.
Di Alberto Pecchini — https://www.pzkko.it/tools/lezioni/
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

import componi
import prepara
from claude_comune import (MODELLO, Fallita, Fatale, Riprova, attendi, chiama, client, costo, registra_costo,
                           stima_token, verifica)
from comune import hms, leggi_json, leggi_jsonl, scrivi_json

FIRMA = '<!-- scritto da appunti_claude.py -->'
TOKEN_MAX = 500_000  # oltre, il grezzo si spezza in parti

SISTEMA = r"""Scrivi gli appunti di una lezione universitaria a partire dal suo «file grezzo»: la trascrizione automatica della voce (🗣, Whisper) e le letture della lavagna (🖼, in LaTeX), sincronizzate al secondo. Sono appunti per studiare: chiari, completi, ordinati per argomento, in italiano.

Formato: Markdown con LaTeX per KaTeX ($…$ in riga, $$…$$ a blocco). Struttura:

# <Argomento della lezione>

**<Materia> · lezione del GG/MM/AAAA** — una riga con l'orario e cosa si è fatto.

> I rimandi `⏱ h:mm:ss` sono i minuti della registrazione: li ritrovi uguali nel file `grezzo.md`, dove c'è la frase esatta e il fotogramma della lavagna.

**In questi appunti**

1. <sezione>
2. …

---

## 1. <Sezione> `⏱ 05:04`
… una sezione per argomento, con ### per i sottoargomenti. Per ogni regola: l'enunciato, l'esempio svolto alla lavagna passo per passo (catena di uguaglianze completa), il perché detto a voce. Tabelle riassuntive dove servono (limiti notevoli, casi, strategie). Le dimostrazioni passo per passo («Passo 1 — …»). Le cose riquadrate o sottolineate dal docente in evidenza (grassetto, \boxed{}, oppure un riquadro «> **Attenzione** …»).

## <n>. Errori da non fare e strategie
Gli avvertimenti del docente («questo lo sbagliano in tanti»), con il minuto.

## <n+1>. Detto a voce e prossima lezione
Avvisi, consigli, cosa si farà la prossima volta, esercizi lasciati.

Regole:
1. La lavagna fa fede sulla voce. Whisper storpia i termini («è alla x» = $e^x$, «mepero» = Nepero, «xen» = arcsen): correggi. I «Grazie…» ripetuti e le frasi senza senso nelle pause sono rumore: ignorali.
2. Niente invenzioni: solo quello che c'è nel grezzo. Se un pezzo è ricostruito dalla voce perché la lavagna non si leggeva, scrivi *(dalla voce)*; se una cosa è dubbia, dillo.
3. Ogni argomento col suo rimando `⏱ h:mm:ss` (il minuto in cui comincia nel grezzo), scritto proprio così, fra apici inversi.
4. Figure: puoi mettere le foto della lavagna che aiutano davvero (grafici, figure di una dimostrazione, la lavagna finale di un esercizio), al più una dozzina, SOLO fra quelle dell'elenco «Fotogrammi disponibili», con questa sintassi su una riga da sola: ![didascalia breve](figure/t_000123.jpg)
5. Niente nomi di studenti. Il nome del docente solo se lo dice lui o è scritto alla lavagna (l'account Teams può essere di un altro).
6. Rispondi solo con il Markdown degli appunti, senza preamboli e senza ```."""

UNISCI = r"""Ti do gli appunti parziali di una stessa lezione, scritti parte per parte. Uniscili in un unico documento con la stessa struttura e le stesse regole: un solo titolo, un solo indice, sezioni per argomento numerate di seguito (unisci quelle che continuano lo stesso argomento), una sola sezione «Errori da non fare e strategie» e una sola «Detto a voce e prossima lezione» in fondo. Tieni tutte le formule, i rimandi `⏱` e le figure ![…](figure/…) così come sono. Rispondi solo con il Markdown."""


def fotogrammi_letti(cart):
    """I fotogrammi con una lettura vera della lavagna: le figure possibili, con l'ora e cosa c'è."""
    righe = []
    ora = {f['file']: f['t'] for f in leggi_jsonl(cart / 'frames.jsonl')}
    for p in sorted((cart / 'ocr').glob('ocr_*.json')):
        for d in leggi_json(p, []) or []:
            if d.get('lavagna') and d['frame'] in ora:
                righe.append((ora[d['frame']], Path(d['frame']).name, (d.get('nuovo') or '')[:90]))
    return sorted(righe)


def parti(grezzo):
    """Il grezzo in parti di al più TOKEN_MAX token stimati, spezzato ai titoletti dei 5 minuti."""
    if len(grezzo) / 3 <= TOKEN_MAX:
        return [grezzo]
    pezzi = re.split(r'(?m)^(?=## \d)', grezzo)
    testa, out, cur = pezzi[0], [], ''
    for p in pezzi[1:]:
        if cur and (len(cur) + len(p)) / 3 > TOKEN_MAX:
            out.append(testa + cur)
            cur = ''
        cur += p
    return out + [testa + cur] if cur else out


def richiesta(cart, testo_grezzo, n=None, di=None):
    meta = leggi_json(cart / 'meta.json', {}) or {}
    figure = fotogrammi_letti(cart)
    elenco = '\n'.join(f'- {nome} · {hms(t)} · {cosa}' for t, nome, cosa in figure) or '(nessuno)'
    parte = f' (parte {n} di {di}: scrivi gli appunti solo di questa parte)' if di and di > 1 else ''
    return [{'type': 'text', 'text': f'Lezione del {meta.get("inizio", "?")[:10]}, durata {hms(meta.get("durata_s", 0))}{parte}.'
                                     f'\n\nFotogrammi disponibili come figure:\n{elenco}\n\nFile grezzo:\n\n{testo_grezzo}'}]


def figure(cart, md, cart_appunti):
    """Copia in appunti/figure/ i ritagli citati; toglie le righe con figure che non esistono."""
    dest = cart_appunti / 'figure'
    righe = []
    for riga in md.splitlines():
        m = re.search(r'!\[[^\]]*\]\(figure/([^)\s]+)\)', riga)
        if m:
            nome = Path(m.group(1)).name
            if not (cart / 'frames' / nome).exists():
                print('figura inesistente tolta:', nome, flush=True)
                continue
            dest.mkdir(parents=True, exist_ok=True)
            shutil.copy2(prepara.ritaglia(cart, nome), dest / nome)
        righe.append(riga)
    return '\n'.join(righe).strip() + '\n'


def pulisci(testo):
    """Via i recinti ``` se il modello ha incartato il Markdown."""
    t = testo.strip()
    m = re.match(r'^```(?:markdown|md)?\s*\n(.*)\n```$', t, re.S)
    return m.group(1) if m else t


def finti(cart):
    """Gli appunti della prova a secco: due figure vere, una formula, una tabella."""
    fig = [nome for _, nome, _ in fotogrammi_letti(cart)][:2]
    return ('# Appunti di prova\n\n**Prova a secco** — nessuna chiamata a Claude.\n\n## 1. Una formula `⏱ 00:10`\n\n'
            '$$\\lim_{x\\to0}\\frac{\\operatorname{sen}x}{x}=1$$\n\n| caso | risultato |\n|---|---|\n| $0^+$ | $+\\infty$ |\n\n'
            + ''.join(f'![lavagna {n}](figure/{n})\n\n' for n in fig) + '![inventata](figure/t_999999.jpg)\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--modello', default=MODELLO, help='claude-opus-5-5 (predefinito), claude-sonnet-5-5, …')
    ap.add_argument('--effort', default='high', choices=['low', 'medium', 'high', 'xhigh', 'max'])
    ap.add_argument('--senza-pdf', action='store_true')
    ap.add_argument('--prova', action='store_true', help='nessuna chiamata: richiesta salvata, appunti finti')
    a = ap.parse_args()
    cart = Path(a.cartella)
    componi.componi(cart)
    grezzo = (cart / 'grezzo.md').read_text(encoding='utf-8')
    cart_app = cart / 'appunti'
    cart_app.mkdir(exist_ok=True)

    if a.prova:
        blocchi = richiesta(cart, grezzo)
        (cart / 'prova_claude').mkdir(exist_ok=True)
        scrivi_json(cart / 'prova_claude' / 'appunti.json', {'parti': len(parti(grezzo)),
                                                             'token_stimati': stima_token(blocchi, SISTEMA),
                                                             'figure_possibili': len(fotogrammi_letti(cart))})
        md = finti(cart)
    else:
        cl = client()
        try:
            verifica(cl, a.modello)
        except Fatale as e:
            print(f'appunti con Claude non fatti: {e}', flush=True)
            return 0
        except Riprova as e:
            print(f'appunti con Claude non fatti, rete: {e} (rilancia più tardi)', flush=True)
            return 1

        def una(sistema, blocchi):
            for tentativo in range(4):
                try:
                    testo, usage = chiama(cl, a.modello, sistema, blocchi, effort=a.effort, max_tokens=64000, flusso=True)
                    u = costo(a.modello, usage)
                    tot = registra_costo(cart, 'appunti', a.modello, u)
                    print(f'{u["input_tokens"]} in, {u["output_tokens"]} out, {u["usd"]:.2f} $ (in tutto {tot:.2f} $)', flush=True)
                    return pulisci(testo)
                except Riprova as e:
                    attendi(30 * (tentativo + 1), str(e))
                except Fallita as e:
                    print(f'tentativo {tentativo + 1}: {e}', flush=True)
            raise Fallita('appunti non riusciti dopo 4 tentativi')

        try:
            pp = parti(grezzo)
            print(f'scrivo gli appunti con {a.modello} ({len(pp)} {"parte" if len(pp) == 1 else "parti"})', flush=True)
            if len(pp) == 1:
                md = una(SISTEMA, richiesta(cart, grezzo))
            else:
                parziali = [una(SISTEMA, richiesta(cart, p, i + 1, len(pp))) for i, p in enumerate(pp)]
                md = una(UNISCI, [{'type': 'text', 'text': '\n\n---\n\n'.join(parziali)}])
        except (Fallita, Fatale) as e:
            print(f'appunti con Claude non fatti: {e}', flush=True)
            return 1

    uscita = cart_app / 'appunti.md'
    if uscita.exists() and FIRMA not in uscita.read_text(encoding='utf-8')[:200]:
        uscita = cart_app / 'appunti_claude.md'  # gli appunti scritti da altri non si toccano
    uscita.write_text(FIRMA + '\n' + figure(cart, md, cart_app), encoding='utf-8')
    print('appunti:', uscita, flush=True)
    if not a.senza_pdf:
        subprocess.run([sys.executable, str(Path(__file__).with_name('impagina.py')), str(uscita)], check=False)
    return 0


if __name__ == '__main__':
    sys.exit(main())
