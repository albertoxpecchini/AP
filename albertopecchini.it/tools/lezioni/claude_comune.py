"""Quello che serve a ocr_claude.py e appunti_claude.py per parlare con Claude (API di Anthropic).

La chiave: ANTHROPIC_API_KEY (o un profilo di `ant auth login`). Senza, i due script lo dicono
ed escono puliti. Le richieste a Claude Opus 5.5 e Sonnet 5.5 hanno il ripiego lato server
(`fallbacks: "default"`): se il modello declina una richiesta, la rifà da solo un altro modello.
Il costo stimato di ogni chiamata va in claude_costo.json, nella cartella della lezione.
Di Alberto Pecchini — https://www.pzkko.it/tools/lezioni/
"""
import base64
import io
import time
from pathlib import Path

from PIL import Image

from comune import leggi_json, scrivi_json

MODELLO = 'claude-opus-5-5'
# $ per milione di token: ingresso, uscita, lettura dalla cache (scrittura in cache = 1,25 × ingresso)
PREZZI = {
    'claude-opus-5-5': (4.00, 20.00, 0.20),
    'claude-sonnet-5-5': (2.00, 10.00, 0.20),
    'claude-haiku-5-5': (0.10, 0.50, 0.01),
}
RIPIEGO = {'claude-opus-5-5', 'claude-sonnet-5-5'}  # Haiku 5.5 non ha il ripiego lato server
LATO_MAX = 1568  # le immagini più grandi le rimpicciolisce comunque l'API: tanto vale mandarle già così


class Fatale(Exception):
    """Senza chiave, chiave sbagliata, modello inesistente: inutile riprovare."""


class Riprova(Exception):
    """Rete, limiti, sovraccarico: si riprova più tardi."""


class Fallita(Exception):
    """Questa richiesta non è andata (rifiuto, risposta tagliata, richiesta sbagliata)."""


def client():
    import anthropic
    return anthropic.Anthropic(max_retries=4, timeout=600)


def verifica(cl, modello):
    """Una chiamata gratuita all'inizio: ci sono le credenziali? il modello esiste?"""
    import anthropic
    try:
        cl.models.retrieve(modello)
    except TypeError as e:
        if 'authentication' not in str(e):
            raise
        raise Fatale('manca la chiave: imposta ANTHROPIC_API_KEY') from e  # l'SDK se ne accorge alla prima chiamata
    except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as e:
        raise Fatale(f'chiave non valida o senza permessi: {e.message}') from e
    except anthropic.NotFoundError as e:
        raise Fatale(f'modello «{modello}» non trovato') from e
    except (anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
        raise Riprova(f'rete: {e}') from e


def immagine(p, lato=LATO_MAX):
    """Blocco immagine (JPEG base64, lato lungo ≤ lato) e i token stimati (w·h/750)."""
    im = Image.open(p).convert('RGB')
    im.thumbnail((lato, lato))
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=85)
    blocco = {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg',
                                          'data': base64.standard_b64encode(buf.getvalue()).decode()}}
    return blocco, round(im.width * im.height / 750), im.size


def stima_token(contenuto, sistema):
    """Token d'ingresso stimati, per la prova a secco: immagini w·h/750, testo ~3,5 caratteri a token."""
    t = len(sistema) / 3.5
    for b in contenuto:
        t += b.get('_token', 0) if b['type'] == 'image' else len(b.get('text', '')) / 3.5
    return round(t)


def senza_privati(contenuto):
    """Il contenuto senza i campi di servizio (_token) prima di mandarlo."""
    return [{k: v for k, v in b.items() if not k.startswith('_')} for b in contenuto]


def chiama(cl, modello, sistema, contenuto, *, effort, max_tokens, schema=None, flusso=False):
    """Una richiesta a Claude. Ritorna (testo, usage). Solleva Fatale, Riprova o Fallita."""
    import anthropic
    oc = {'effort': effort}
    if schema:
        oc['format'] = {'type': 'json_schema', 'schema': schema}
    richiesta = dict(model=modello, max_tokens=max_tokens, output_config=oc,
                     system=[{'type': 'text', 'text': sistema, 'cache_control': {'type': 'ephemeral'}}],
                     messages=[{'role': 'user', 'content': senza_privati(contenuto)}])
    if modello in RIPIEGO:
        richiesta.update(betas=['server-side-fallback-2026-07-01'], fallbacks='default')
    try:
        if flusso:  # risposte lunghe: in streaming, così nessun timeout HTTP
            with cl.beta.messages.stream(**richiesta) as s:
                msg = s.get_final_message()
        else:
            msg = cl.beta.messages.create(**richiesta)
    except TypeError as e:
        if 'authentication' not in str(e):
            raise
        raise Fatale('manca la chiave: imposta ANTHROPIC_API_KEY') from e
    except (anthropic.AuthenticationError, anthropic.PermissionDeniedError, anthropic.NotFoundError) as e:
        raise Fatale(e.message) from e
    except anthropic.BadRequestError as e:
        raise Fallita(f'richiesta rifiutata dall\'API: {e.message}') from e
    except (anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
        raise Riprova(str(e)) from e
    except anthropic.APIStatusError as e:
        if e.status_code >= 500:  # sovraccarico, errore del server
            raise Riprova(f'{e.status_code}: {e.message}') from e
        raise Fallita(f'{e.status_code}: {e.message}') from e
    if msg.stop_reason == 'refusal':
        cat = getattr(msg.stop_details, 'category', None) if msg.stop_details else None
        raise Fallita(f'Claude ha declinato la richiesta (categoria {cat})')
    if msg.stop_reason == 'max_tokens':
        raise Fallita('risposta tagliata: max_tokens troppo basso')
    testo = ''.join(b.text for b in msg.content if b.type == 'text')
    return testo, msg.usage


def costo(modello, usage):
    """Dollari stimati di una risposta, dai token che riporta l'API."""
    p_in, p_out, p_cache = PREZZI.get(modello, PREZZI[MODELLO])
    u = {k: getattr(usage, k, 0) or 0 for k in ('input_tokens', 'output_tokens',
                                                'cache_creation_input_tokens', 'cache_read_input_tokens')}
    u['usd'] = (u['input_tokens'] * p_in + u['cache_creation_input_tokens'] * p_in * 1.25
                + u['cache_read_input_tokens'] * p_cache + u['output_tokens'] * p_out) / 1e6
    return u


def registra_costo(cart, voce, modello, u):
    """Somma una chiamata in claude_costo.json (voce: «ocr» o «appunti») e ritorna il totale in $."""
    p = Path(cart) / 'claude_costo.json'
    d = leggi_json(p, {}) or {}
    v = d.setdefault(voce, {'modello': modello, 'chiamate': 0, 'input_tokens': 0, 'output_tokens': 0,
                            'cache_creation_input_tokens': 0, 'cache_read_input_tokens': 0, 'usd': 0.0})
    v['modello'] = modello
    v['chiamate'] += 1
    for k in ('input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'usd'):
        v[k] += u.get(k, 0)
    v['usd'] = round(v['usd'], 4)
    d['totale_usd'] = round(sum(x['usd'] for k, x in d.items() if isinstance(x, dict)), 4)
    scrivi_json(p, d)
    return d['totale_usd']


def attendi(secondi, motivo):
    print(f'{motivo}: riprovo fra {secondi} s', flush=True)
    time.sleep(secondi)
