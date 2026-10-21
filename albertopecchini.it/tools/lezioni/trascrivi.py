"""Trascrive l'audio della lezione mentre viene registrato, con i tempi parola per parola.

    python trascrivi.py <cartella_lezione> [--lingua it] [--modello auto] [--materia "analisi matematica"]

Legge audio/c_*.wav, scrive trascrizione.jsonl (tempi in secondi dall'inizio della
registrazione, gli stessi dei fotogrammi) e rigenera grezzo.md dopo ogni passata.
Ogni finestra lascia fuori gli ultimi secondi, che rientrano nella successiva: così
nessuna frase viene tagliata a metà. Finisce quando c'è il file FINE e l'audio è tutto
trascritto. Riparte da dove era rimasto se viene rilanciato; per fermarlo pulito fra
una passata e l'altra si crea il file FERMA_TRASCRIZIONE nella cartella della lezione.

Il modello: con una GPU NVIDIA large-v3 (su una RTX 3060 Ti 4 minuti di parlato in 5–7 s),
senza GPU small, che sulla CPU tiene il passo della lezione.
"""
import argparse
import importlib
import re
import time
import wave
from pathlib import Path

import numpy as np

from comune import CHUNK_S, aggiungi_jsonl, cuda_dll, leggi_json, scrivi_json
import componi

cuda_dll()
import ctranslate2  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

FINESTRA_MIN, FINESTRA_MAX, MARGINE = 25, 240, 6
ALLUCINAZIONI = ('amara.org', 'sottotitoli creati', 'sottotitoli e revisione', 'qtss', 'grazie per la visione',
                 'grazie per aver seguito', 'iscriviti al canale', 'thanks for watching', 'subtitles by')
SOLO_SUL_SILENZIO = ('grazie.', 'grazie', 'grazie a tutti.')  # vere solo se c'è voce: sul silenzio sono inventate


def prompt(materia):
    """L'inizio del contesto: dice a Whisper che lessico aspettarsi."""
    m = f' di {materia}' if materia else ''
    return f'Lezione universitaria{m}: definizioni, teoremi, dimostrazioni, formule ed esercizi.'


def carica_modello(nome):
    """large-v3 sulla GPU in int8_float16; senza GPU (o se la GPU fallisce) small in int8 sulla CPU."""
    if ctranslate2.get_cuda_device_count() > 0:
        try:
            m = WhisperModel('large-v3' if nome == 'auto' else nome, device='cuda', compute_type='int8_float16')
            return m, 'GPU'
        except Exception as e:  # driver vecchio, memoria piena: si va avanti sulla CPU
            print('GPU non utilizzabile, passo alla CPU:', e, flush=True)
    return WhisperModel('small' if nome == 'auto' else nome, device='cpu', compute_type='int8'), 'CPU'


def durata_pezzo(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def a_16k(p):
    """WAV mono int16 → float32 a 16 kHz (decode_audio di faster-whisper non va con il PyAV installato)."""
    with wave.open(str(p)) as w:
        rate = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    if rate == 16000:
        return x
    if rate % 16000 == 0:  # passa-basso a 7,6 kHz (sinc finestrato) e decimazione
        f = rate // 16000
        k = np.arange(-48, 49)
        h = np.sinc(2 * 7600 / rate * k) * np.hamming(len(k))
        return np.convolve(x, h / h.sum(), mode='same')[::f].astype(np.float32)
    return np.interp(np.arange(0, len(x), rate / 16000), np.arange(len(x)), x).astype(np.float32)


def spezza(parole, taglio):
    """Le parole finite prima del taglio, chiudendo alla pausa più lunga degli ultimi 8 s."""
    dentro = [i for i, w in enumerate(parole) if w.end <= taglio]
    if not dentro:
        return []
    cand = [i for i in dentro if parole[i].end >= taglio - 8] or dentro[-1:]
    i = max(cand, key=lambda i: parole[i + 1].start - parole[i].end if i + 1 < len(parole) else 0)
    return parole[:i + 1]


def carica(pezzi, da, a):
    """Audio a 16 kHz fra i secondi da e a."""
    i0, i1 = int(da // CHUNK_S), int(np.ceil(a / CHUNK_S))
    x = np.concatenate([a_16k(p) for p in pezzi[i0:i1]])
    s = int((da - i0 * CHUNK_S) * 16000)
    return x[s:s + int((a - da) * 16000)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--lingua', default=None, help='it, en, ... (vuoto: la riconosce dalla prima voce)')
    ap.add_argument('--modello', default='auto', help='auto, large-v3, medium, small, …')
    ap.add_argument('--materia', default='', help='es. «analisi matematica»: aiuta Whisper coi termini')
    a = ap.parse_args()
    cart = Path(a.cartella)
    p_stato = cart / 'trascrizione_stato.json'
    st = leggi_json(p_stato, {'fatto_s': 0.0, 'lingua': a.lingua, 'coda': prompt(a.materia)})
    st['lingua'] = a.lingua or st.get('lingua')
    st['coda'] = re.sub(r'(\s*Grazie\.?)+', ' ', st['coda'])  # ripulisce un contesto già inquinato
    ultimo = ''

    modello, dove = carica_modello(a.modello)
    nome = a.modello if a.modello != 'auto' else ('large-v3' if dove == 'GPU' else 'small')
    st['motore'] = f'Whisper {nome} ({dove})'  # componi.py lo scrive in testa al grezzo
    print('modello pronto:', st['motore'], flush=True)

    riprova_da = 0  # dopo una frase rimasta aperta si aspetta altro audio prima di rifare la finestra
    while True:
        if (cart / 'FERMA_TRASCRIZIONE').exists():  # per riavviarlo fra una passata e l'altra
            (cart / 'FERMA_TRASCRIZIONE').unlink()
            print('fermato su richiesta', flush=True)
            return
        fine = (cart / 'FINE').exists()
        pezzi = sorted((cart / 'audio').glob('c_*.wav'))
        if not pezzi:
            if fine:
                break
            time.sleep(3)
            continue
        disp = (len(pezzi) - 1) * CHUNK_S + (durata_pezzo(pezzi[-1]) if fine else CHUNK_S)
        fatto = st['fatto_s']
        if disp - fatto < (FINESTRA_MIN if not fine else 0.5) or (disp < riprova_da and not fine):
            if fine:
                break
            time.sleep(3)
            continue

        fino = min(disp, fatto + FINESTRA_MAX)
        ultima = fine and fino >= disp
        x = carica(pezzi, fatto, fino)
        t = time.perf_counter()
        segs, info = modello.transcribe(
            x, language=st['lingua'], beam_size=5, word_timestamps=True, vad_filter=True,
            vad_parameters={'min_silence_duration_ms': 500}, condition_on_previous_text=False,
            initial_prompt=st['coda'][-220:])
        segs = list(segs)
        if not st['lingua'] and segs and info.language_probability > 0.7:
            st['lingua'] = info.language
            print('lingua:', info.language, flush=True)

        lung = fino - fatto
        taglio = lung - MARGINE
        # (segmento, parole tenute, testo): le frasi finite prima del taglio intere, quella a cavallo
        # fino alla pausa migliore, così anche quando la prof parla di fila la voce non resta indietro
        tieni = [(s, s.words or [], s.text.strip()) for s in segs if ultima or s.end <= taglio]
        aperta = None if ultima else next((s for s in segs if s.start < taglio < s.end), None)
        if aperta:
            parole = spezza(aperta.words or [], taglio)
            if parole:
                tieni.append((aperta, parole, ''.join(w.word for w in parole).strip()))
        if tieni:
            nuovo = fatto + (tieni[-1][1][-1].end if tieni[-1][1] else tieni[-1][0].end)
        elif segs:
            nuovo = fatto  # nessuna parola sicura prima del taglio: si riprova con più audio
            riprova_da = fino + CHUNK_S
        else:
            nuovo = fino if ultima else max(fatto, fino - MARGINE)  # silenzio

        for s, parole, testo in tieni:
            if not testo or any(h in testo.lower() for h in ALLUCINAZIONI):
                continue
            if s.no_speech_prob > 0.6 and s.avg_logprob < -1:
                continue
            if testo.lower() in SOLO_SUL_SILENZIO and (s.no_speech_prob > 0.2 or testo.lower() == ultimo):
                continue  # su rumore (cancellino, sedie) Whisper ripete «Grazie.» a catena
            ultimo = testo.lower()
            aggiungi_jsonl(cart / 'trascrizione.jsonl', {
                't0': round(fatto + (parole[0].start if parole else s.start), 2),
                't1': round(fatto + (parole[-1].end if parole else s.end), 2), 'testo': testo,
                'parole': [[w.word.strip(), round(fatto + w.start, 2), round(fatto + w.end, 2)] for w in parole]})
            if testo.lower() not in SOLO_SUL_SILENZIO:  # il contesto non deve suggerire altri «Grazie»
                st['coda'] = (st['coda'] + ' ' + testo)[-600:]
        st['fatto_s'] = round(nuovo, 2)
        scrivi_json(p_stato, st)
        print(f'{fatto:7.1f}-{fino:7.1f}s  {len(tieni)}/{len(segs)} segmenti{" (uno spezzato)" if aperta and tieni and tieni[-1][0] is aperta else ""}  '
              f'{time.perf_counter() - t:4.1f}s di calcolo', flush=True)
        try:  # ricaricato: il formato si può ritoccare a lezione in corso; un suo errore non ferma la trascrizione
            importlib.reload(componi).componi(cart)
        except Exception as e:
            print('grezzo.md non aggiornato:', e, flush=True)
        if ultima:
            break
    componi.componi(cart)
    print('trascrizione finita', flush=True)


if __name__ == '__main__':
    main()
