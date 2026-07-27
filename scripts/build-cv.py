# -*- coding: utf-8 -*-
# =============================================================================
#  Generatore CV PDF — skin "piattaforma Supabase" della home (albertopecchini.it).
#  Tipografia: Ubuntu (installato a livello di sistema, embeddato/subsettato
#  nel PDF da WeasyPrint). Palette identica alla home .sb- (tema chiaro):
#  pagina #fcfcfc, inchiostro #171717, grigi puri, verde brand
#  hsl(153 60% 53%) / verde testo hsl(153 86% 28%), pannelli con
#  bordo-gradiente da 1px (il marchio di fabbrica delle card .sb-panel).
#  Struttura HTML/CSS -> PDF (paged media) via WeasyPrint.
#
#  Layout: intestazione in pannello chiaro (foto 108px con anello verde, nome
#  30px/500 con tracking negativo), pannello "in breve" a tre colonne, chip
#  neutre bordate, timeline con nodi verdi, competenze su due colonne, footer
#  con nome, numerazione pagina e albertopecchini.it.
#
#  Legge scripts/cv-data.<it|en|fr|de>.json (UTF-8) e genera un PDF per lingua:
#  public/cv-alberto-pecchini-<loc>.pdf (+ copia IT -> cv-alberto-pecchini.pdf).
#
#  Uso:  python3 scripts/build-cv.py            # tutte le lingue
#        python3 scripts/build-cv.py it en      # solo alcune
#  Richiede: weasyprint, font "Ubuntu" nel sistema (fc-list | grep Ubuntu).
# =============================================================================
import base64
import html
import json
import shutil
import sys
from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
PUBLIC = ROOT / "public"
PHOTO = PUBLIC / "alberto-pecchini.jpg"
LOCALES = ["it", "en", "fr", "de"]

# --- palette della home .sb- (Supabase, tema chiaro) ------------------------
CSS_VARS = """
  --bg:              #fcfcfc;   /* pagina (--sb-bg) */
  --surface-75:      #fbfbfb;   /* fondo dei pannelli (--sb-surface-75) */
  --surface-200:     #f0f0f0;   /* superfici tenui (--sb-surface-200) */
  --fg:              #171717;   /* inchiostro (--sb-fg) */
  --fg-light:        #525252;   /* testo secondario (--sb-fg-light) */
  --fg-lighter:      #6f6f6f;   /* descrizioni (--sb-fg-lighter) */
  --fg-muted:        #8f8f8f;   /* ruoli, note (--sb-fg-muted) */
  --border:          #e8e8e8;   /* hairline (--sb-border) */
  --border-strong:   #dbdbdb;   /* bordi chip/pannelli (--sb-border-strong) */
  --border-stronger: #c7c7c7;   /* (--sb-border-stronger) */
  --brand:           hsl(153, 60%, 53%);  /* verde Supabase (--sb-brand) */
  --brand-text:      hsl(153, 86%, 28%);  /* verde per il testo, AA (--sb-brand-text) */
"""


def esc(value) -> str:
    """Escape sicuro per il testo che finisce nell'HTML."""
    return html.escape("" if value is None else str(value))


def photo_data_uri() -> str:
    raw = PHOTO.read_bytes()
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")


def chips(items) -> str:
    return "".join(f'<span class="chip">{esc(it)}</span>' for it in items)


def render_entry(e: dict, show_link: bool = True) -> str:
    role = (
        f'<div class="e-role">{esc(e["role"])}</div>'
        if e.get("role")
        else ""
    )
    link = ""
    if show_link and e.get("link"):
        link = f'<div class="e-link">{esc(e["link"])}&nbsp;&#8594;</div>'
    return f"""
      <article class="entry">
        <div class="e-period">{esc(e["period"])}</div>
        <div class="e-title">{esc(e["title"])}</div>
        {role}
        <div class="e-desc">{esc(e["desc"])}</div>
        {link}
      </article>"""


def section(label: str, body: str, tight: bool = False) -> str:
    cls = "section tight" if tight else "section"
    return f"""
      <section class="{cls}">
        <div class="sec-head"><span class="dot"></span><h2>{esc(label)}</h2><span class="rule"></span></div>
        {body}
      </section>"""


def build_html(data: dict, photo_uri: str) -> str:
    ui = data["ui"]

    # ---- fascia intestazione (melanzana) -----------------------------------
    contact_chips = "".join(
        f'<span class="c-chip"><span class="c-k">{esc(k)}</span>{esc(v)}</span>'
        for k, v in data["contacts"]
    )
    header = f"""
      <header class="panel head-panel">
        <div class="panel-inner masthead">
          <img class="photo" src="{photo_uri}" alt="Alberto Pecchini" />
          <div class="id">
            <h1>{esc(data["name"])}</h1>
            <div class="role">{esc(data["role"])}</div>
            <div class="tagline">{esc(data["tagline"])}</div>
            <div class="contacts">{contact_chips}</div>
          </div>
        </div>
      </header>"""

    # ---- "in breve": lingue, patente, guida, forza, disponibilita', cassetto
    langs = ""
    for name, lvl, frac in data["languages"]:
        pct = max(0.0, min(1.0, float(frac))) * 100.0
        langs += f"""
          <div class="lang">
            <div class="lang-row"><span class="lang-name">{esc(name)}</span>
              <span class="lang-lvl">{esc(lvl)}</span></div>
            <div class="bar-track"><span class="bar-fill" style="width:{pct:.0f}%"></span></div>
          </div>"""

    avail = "".join(f"<li>{esc(a)}</li>" for a in data["availability"])

    wish_col = (
        f"""
        <div class="fcol">
          <div class="f-label">{esc(ui["wish"])}</div>
          <p class="wish">{esc(data["wishlist"])}</p>
        </div>"""
        if data.get("wishlist")
        else ""
    )

    facts = f"""
      <section class="panel facts-panel">
        <div class="panel-inner facts">
        <div class="fcol">
          <div class="f-label">{esc(ui["langs"])}</div>
          {langs}
          <div class="f-label sp">{esc(ui["license"])}</div>
          <div class="chips">{chips(data["patente"])}</div>
          <div class="f-label sp">{esc(ui["canDrive"])}</div>
          <div class="chips">{chips(data["guida"])}</div>
        </div>
        <div class="fcol">
          <div class="f-label">{esc(ui["strengths"])}</div>
          <div class="chips">{chips(data["strengths"])}</div>
          <div class="f-label sp">{esc(ui["availability"])}</div>
          <ul class="avail">{avail}</ul>
        </div>{wish_col}
        </div>
      </section>"""

    # ---- competenze --------------------------------------------------------
    skills = ""
    for label, items in data["skills"]:
        skills += f"""
          <div class="skill-group">
            <div class="sk-label">{esc(label)}</div>
            <div class="chips">{chips(items)}</div>
          </div>"""

    # ---- corpo -------------------------------------------------------------
    body = header + facts
    body += section(ui["profile"], f'<p class="profile">{esc(data["profile"])}</p>')
    body += section(ui["skills"], f'<div class="skills-grid">{skills}</div>')
    body += section(
        ui["education"],
        "".join(render_entry(e, show_link=False) for e in data["education"]),
    )
    body += section(
        ui["experience"],
        "".join(render_entry(e) for e in data["experience"]),
    )
    body += section(
        ui["travel"],
        "".join(render_entry(e, show_link=False) for e in data["travel"]),
    )
    body += section(
        ui["volunteer"],
        "".join(render_entry(e, show_link=False) for e in data["volunteer"]),
    )
    body += f'<p class="privacy">{esc(data["privacy"])}</p>'

    running = esc(f'{data["name"]} — {ui["runningTitle"]}')

    return f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8" />
<style>
:root {{ {CSS_VARS} }}

@page {{
  size: A4;
  margin: 13mm;
  background: var(--bg);
  @bottom-left   {{ content: "{running}"; font: 400 9px Ubuntu; color: var(--fg-muted);
                    vertical-align: top; padding-top: 4mm; }}
  @bottom-center {{ content: counter(page) " / " counter(pages);
                    font: 400 9px "Ubuntu Mono", monospace; color: var(--fg-muted);
                    vertical-align: top; padding-top: 4mm; }}
  @bottom-right  {{ content: "albertopecchini.it"; font: 500 9px Ubuntu;
                    color: var(--brand-text); vertical-align: top; padding-top: 4mm; }}
}}

* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html {{ font-family: "Ubuntu", sans-serif; color: var(--fg);
        font-size: 10px; line-height: 1.45; }}
body {{ background: var(--bg); }}

/* ---- pannello con bordo-gradiente da 1px (come .sb-panel della home) ---- */
.panel {{
  padding: 1px; border-radius: 12px;
  background: linear-gradient(to bottom, var(--border-strong), rgba(232, 232, 232, 0.45));
  break-inside: avoid;
}}
.panel-inner {{ border-radius: 11px; background: var(--surface-75); }}

/* ---- intestazione (pannello chiaro, titolo stile hero) ---- */
.masthead {{ display: flex; align-items: center; gap: 24px; padding: 26px 30px; }}
.masthead .photo {{
  width: 108px; height: 108px; border-radius: 50%; object-fit: cover;
  border: 2px solid var(--brand); flex: 0 0 auto;
}}
.masthead .id {{ min-width: 0; }}
.masthead h1 {{ font-size: 30px; font-weight: 500; letter-spacing: -0.02em;
                line-height: 1.05; color: var(--fg); }}
.masthead .role {{ font-size: 14px; font-weight: 500; color: var(--brand-text);
                   margin-top: 5px; letter-spacing: -0.01em; }}
.masthead .tagline {{ font-size: 10.5px; color: var(--fg-lighter);
                      margin-top: 8px; max-width: 60ch; line-height: 1.55; }}
.masthead .contacts {{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 13px; }}
.c-chip {{ font-size: 9.5px; padding: 3.5px 11px; border-radius: 999px;
           background: var(--bg); border: 1px solid var(--border-strong);
           color: var(--fg-light); }}
.c-chip .c-k {{ color: var(--brand-text); font-weight: 500; margin-right: 6px;
                text-transform: uppercase; letter-spacing: 0.05em; font-size: 8px; }}

/* ---- "in breve" ---- */
.facts-panel {{ margin-top: 12px; }}
.facts {{ display: flex; padding: 17px 0; }}
.facts .fcol {{ flex: 1.1; padding: 0 20px; }}
.facts .fcol:last-child {{ flex: 0.9; }}
.facts .fcol + .fcol {{ border-left: 1px solid var(--border); }}
.f-label {{ font-size: 8.5px; font-weight: 500; text-transform: uppercase;
            letter-spacing: 0.12em; color: var(--fg-muted); margin-bottom: 9px; }}
.f-label.sp {{ margin-top: 13px; margin-bottom: 8px; }}
.lang {{ margin-bottom: 10px; }}
.lang-row {{ display: flex; justify-content: space-between; align-items: baseline; }}
.lang-name {{ font-size: 11px; font-weight: 500; color: var(--fg); }}
.lang-lvl {{ font-size: 9.5px; color: var(--fg-muted); font-family: "Ubuntu Mono", monospace; }}
.bar-track {{ height: 4px; border-radius: 999px; background: var(--surface-200);
              margin-top: 5px; overflow: hidden; }}
.bar-fill {{ display: block; height: 4px; border-radius: 999px;
             background: var(--brand); }}
.avail {{ list-style: none; }}
.avail li {{ font-size: 10.5px; color: var(--fg-light); padding-left: 12px;
             position: relative; margin-bottom: 5px; }}
.avail li::before {{ content: ""; position: absolute; left: 0; top: 4px;
                     width: 4px; height: 4px; border-radius: 50%; background: var(--brand); }}
.wish {{ font-size: 10.5px; font-style: italic; color: var(--fg-light); line-height: 1.6;
         padding-left: 10px; border-left: 2px solid var(--brand); }}

/* ---- chip generici (come .sb-chip della home) ---- */
.chips {{ display: flex; flex-wrap: wrap; gap: 5px; }}
.chip {{ font-size: 9.5px; font-weight: 400; padding: 3px 10px; border-radius: 999px;
         background: var(--bg); border: 1px solid var(--border-strong);
         color: var(--fg-light); }}

/* ---- sezioni ---- */
.section {{ margin-top: 16px; }}
.section.tight {{ margin-top: 12px; }}
.sec-head {{ display: flex; align-items: center; gap: 9px; margin-bottom: 13px;
             break-inside: avoid; }}
.sec-head .dot {{ width: 7px; height: 7px; border-radius: 50%; background: var(--brand);
                  flex: 0 0 auto; }}
.sec-head h2 {{ font-size: 13.5px; font-weight: 500; letter-spacing: -0.015em;
                color: var(--fg); flex: 0 0 auto; white-space: nowrap; }}
.sec-head .rule {{ flex: 1; height: 1px; background: var(--border); }}
.profile {{ font-size: 11.5px; color: var(--fg-light); line-height: 1.65; }}

/* ---- competenze (griglia a due colonne) ---- */
.skills-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }}
.skill-group {{ break-inside: avoid; }}
.sk-label {{ font-size: 9.5px; font-weight: 500; text-transform: uppercase;
             letter-spacing: 0.07em; color: var(--fg-lighter); margin-bottom: 6px; }}

/* ---- esperienze / voci (timeline a nodo singolo, nodi verdi) ---- */
.entry {{ position: relative; padding: 0 0 10px 18px;
          border-left: 1px solid var(--border); break-inside: avoid; }}
.entry:last-child {{ padding-bottom: 2px; }}
.entry::before {{ content: ""; position: absolute; left: -4.25px; top: 4px;
                  width: 7.5px; height: 7.5px; border-radius: 50%;
                  background: var(--brand); box-shadow: 0 0 0 3px var(--bg); }}
.e-period {{ font-size: 9.5px; font-weight: 500; letter-spacing: 0.02em;
             color: var(--brand-text); margin-bottom: 4px; }}
.e-title {{ font-size: 12.5px; font-weight: 500; letter-spacing: -0.01em;
            color: var(--fg); line-height: 1.3; }}
.e-role {{ font-size: 10.5px; color: var(--fg-muted); margin-top: 2px; }}
.e-desc {{ font-size: 10.5px; color: var(--fg-lighter); line-height: 1.55; margin-top: 4px; }}
.e-link {{ font-size: 10px; font-weight: 500; color: var(--brand-text); margin-top: 4px; }}

.privacy {{ font-size: 8.5px; font-style: italic; color: var(--fg-muted);
            line-height: 1.4; margin-top: 10px; padding-top: 7px;
            border-top: 1px solid var(--border); }}
</style></head>
<body>{body}
</body></html>"""


def build_locale(loc: str, photo_uri: str) -> None:
    data = json.loads((SCRIPTS / f"cv-data.{loc}.json").read_text("utf-8"))
    out = PUBLIC / f"cv-alberto-pecchini-{loc}.pdf"
    HTML(string=build_html(data, photo_uri), base_url=str(ROOT)).write_pdf(str(out))
    size_kb = out.stat().st_size / 1024
    print(f"OK: {out.relative_to(ROOT)}  ({size_kb:.0f} KB)")
    if loc == "it":  # l'italiano e' anche il PDF "base" (link storici, /archivio)
        base = PUBLIC / "cv-alberto-pecchini.pdf"
        shutil.copyfile(out, base)
        print(f"OK: {base.relative_to(ROOT)}  (copia IT del CV base)")


def main() -> None:
    locales = [a for a in sys.argv[1:] if a in LOCALES] or LOCALES
    photo_uri = photo_data_uri()
    for loc in locales:
        build_locale(loc, photo_uri)


if __name__ == "__main__":
    main()
