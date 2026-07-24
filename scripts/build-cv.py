# -*- coding: utf-8 -*-
# =============================================================================
#  Generatore CV PDF — skin "Ubuntu / Yaru" del sito (albertopecchini.it).
#  Tipografia: Ubuntu (installato a livello di sistema, embeddato/subsettato
#  nel PDF da WeasyPrint). Palette identica al sito: crema #faf8f6, inchiostro
#  caldo #1C1A17, arancio Yaru #e95420 (#c2410c per il testo), grigi caldi,
#  chip arancio tenue e melanzana #2c001e (la fascia intestazione, come il
#  footer del sito). Struttura HTML/CSS -> PDF (paged media) via WeasyPrint.
#
#  Layout allineato al redesign "CV redesign in review" (Claude Design):
#  intestazione ampia (foto 108px, nome 31px/800), pannello "in breve" a tre
#  colonne con bordo tenue, periodi in Ubuntu Mono, competenze su due colonne,
#  footer con nome, numerazione pagina e albertopecchini.it.
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

# --- palette del sito (Ubuntu / Yaru, tema chiaro) --------------------------
CSS_VARS = """
  --bg:          #faf8f6;   /* crema pagina */
  --ink:         #1c1a17;   /* inchiostro caldo */
  --ink-soft:    #3d3846;   /* aubergine ink Yaru */
  --card:        #ffffff;
  --muted:       #8a8478;   /* grigio caldo per il corpo */
  --muted-2:     #6f695f;   /* grigio caldo piu' scuro (descrizioni) */
  --secondary:   #eae7e0;   /* superfici tenui */
  --orange:      #e95420;   /* arancio Yaru */
  --orange-ink:  #c2410c;   /* arancio per il testo (contrasto AA) */
  --orange-deep: #9a3412;
  --accent:      #f0a183;
  --border:      rgba(233, 84, 32, 0.18);
  --border-soft: rgba(233, 84, 32, 0.14);   /* bordo del pannello "in breve" */
  --hair:        rgba(28, 26, 23, 0.10);
  --chip-bg:     #f9e7de;   /* pesca tenue, opaco (una sola pillola) */
  --chip-bd:     rgba(233, 84, 32, 0.26);
  --aubergine:      #2c001e;  /* melanzana Ubuntu (fascia / footer del sito) */
  --aubergine-mid:  #5e2750;
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
        link = f'<div class="e-link">&rsaquo;&nbsp;{esc(e["link"])}</div>'
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
        <div class="sec-head"><span class="bar"></span><h2>{esc(label)}</h2><span class="rule"></span></div>
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
      <header class="masthead">
        <img class="photo" src="{photo_uri}" alt="Alberto Pecchini" />
        <div class="id">
          <h1>{esc(data["name"])}</h1>
          <div class="role">{esc(data["role"])}</div>
          <div class="tagline">{esc(data["tagline"])}</div>
          <div class="contacts">{contact_chips}</div>
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
      <section class="facts">
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
  @bottom-left   {{ content: "{running}"; font: 400 9px Ubuntu; color: var(--muted);
                    vertical-align: top; padding-top: 4mm; }}
  @bottom-center {{ content: counter(page) " / " counter(pages);
                    font: 400 9px "Ubuntu Mono", monospace; color: var(--muted);
                    vertical-align: top; padding-top: 4mm; }}
  @bottom-right  {{ content: "albertopecchini.it"; font: 500 9px Ubuntu;
                    color: var(--orange-ink); vertical-align: top; padding-top: 4mm; }}
}}

* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html {{ font-family: "Ubuntu", sans-serif; color: var(--ink);
        font-size: 10px; line-height: 1.45; }}
body {{ background: var(--bg); }}

/* ---- fascia intestazione (melanzana Ubuntu) ---- */
.masthead {{
  display: flex; align-items: center; gap: 24px;
  background: var(--aubergine);
  background-image: radial-gradient(120% 160% at 0% 0%, #4a0733 0%, var(--aubergine) 55%);
  border-radius: 18px; padding: 26px 30px; color: #faf8f6;
  break-inside: avoid;
}}
.masthead .photo {{
  width: 108px; height: 108px; border-radius: 50%; object-fit: cover;
  border: 3px solid var(--orange); flex: 0 0 auto;
}}
.masthead .id {{ min-width: 0; }}
.masthead h1 {{ font-size: 31px; font-weight: 800; letter-spacing: -0.015em;
                line-height: 1.05; }}
.masthead .role {{ font-size: 14.5px; font-weight: 600; color: var(--accent);
                   margin-top: 5px; }}
.masthead .tagline {{ font-size: 11px; color: rgba(255, 255, 255, 0.72);
                      margin-top: 8px; max-width: 56ch; line-height: 1.5; }}
.masthead .contacts {{ display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }}
.c-chip {{ font-size: 10px; padding: 4px 12px; border-radius: 999px;
           background: #4a1f3d; color: #f3ede9; }}
.c-chip .c-k {{ color: var(--accent); font-weight: 700; margin-right: 6px;
                text-transform: uppercase; letter-spacing: 0.05em; font-size: 8.5px; }}

/* ---- "in breve" ---- */
.facts {{
  display: flex; margin-top: 14px;
  background: var(--bg); border: 1px solid var(--border-soft);
  border-radius: 14px; padding: 18px 0; break-inside: avoid;
}}
.facts .fcol {{ flex: 1.1; padding: 0 20px; }}
.facts .fcol:last-child {{ flex: 0.9; }}
.facts .fcol + .fcol {{ border-left: 1px solid var(--hair); }}
.f-label {{ font-size: 9px; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.14em; color: var(--orange-ink); margin-bottom: 9px; }}
.f-label.sp {{ margin-top: 13px; margin-bottom: 8px; }}
.lang {{ margin-bottom: 10px; }}
.lang-row {{ display: flex; justify-content: space-between; align-items: baseline; }}
.lang-name {{ font-size: 11px; font-weight: 700; color: var(--ink); }}
.lang-lvl {{ font-size: 9.5px; color: var(--muted); font-family: "Ubuntu Mono", monospace; }}
.bar-track {{ height: 4px; border-radius: 999px; background: var(--secondary);
              margin-top: 5px; overflow: hidden; }}
.bar-fill {{ display: block; height: 4px; border-radius: 999px;
             background-image: linear-gradient(90deg, var(--orange), var(--accent)); }}
.avail {{ list-style: none; }}
.avail li {{ font-size: 10.5px; color: var(--ink-soft); padding-left: 12px;
             position: relative; margin-bottom: 5px; }}
.avail li::before {{ content: ""; position: absolute; left: 0; top: 4px;
                     width: 4px; height: 4px; border-radius: 50%; background: var(--orange); }}
.wish {{ font-size: 10.5px; font-style: italic; color: var(--ink-soft); line-height: 1.6; }}

/* ---- chip generici ---- */
.chips {{ display: flex; flex-wrap: wrap; gap: 5px; }}
.chip {{ font-size: 10px; font-weight: 600; padding: 3px 11px; border-radius: 999px;
         background: var(--chip-bg); color: var(--orange-ink); }}

/* ---- sezioni ---- */
.section {{ margin-top: 16px; }}
.section.tight {{ margin-top: 12px; }}
.sec-head {{ display: flex; align-items: center; gap: 10px; margin-bottom: 13px;
             break-inside: avoid; }}
.sec-head .bar {{ width: 16px; height: 4px; border-radius: 999px; background: var(--orange);
                  flex: 0 0 auto; }}
.sec-head h2 {{ font-size: 12px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.16em; color: var(--ink); flex: 0 0 auto; }}
.sec-head .rule {{ flex: 1; height: 1px; background: var(--hair); }}
.profile {{ font-size: 11.5px; color: var(--ink-soft); line-height: 1.65; }}

/* ---- competenze (griglia a due colonne) ---- */
.skills-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }}
.skill-group {{ break-inside: avoid; }}
.sk-label {{ font-size: 9.5px; font-weight: 700; text-transform: uppercase;
             letter-spacing: 0.07em; color: var(--ink-soft); margin-bottom: 6px; }}

/* ---- esperienze / voci (timeline a nodo singolo) ---- */
.entry {{ position: relative; padding: 0 0 10px 18px;
          border-left: 1.5px solid var(--hair); break-inside: avoid; }}
.entry:last-child {{ padding-bottom: 2px; }}
.entry::before {{ content: ""; position: absolute; left: -4.5px; top: 4px;
                  width: 7.5px; height: 7.5px; border-radius: 50%;
                  background: var(--orange); box-shadow: 0 0 0 3px var(--bg); }}
.e-period {{ font-family: "Ubuntu Mono", monospace; font-size: 9.5px; font-weight: 700;
             letter-spacing: 0.05em; text-transform: uppercase;
             color: var(--orange-ink); margin-bottom: 4px; }}
.e-title {{ font-size: 12.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }}
.e-role {{ font-size: 10.5px; font-weight: 600; color: var(--orange-ink); margin-top: 2px; }}
.e-desc {{ font-size: 10.5px; color: var(--muted-2); line-height: 1.55; margin-top: 4px; }}
.e-link {{ font-size: 10px; font-weight: 600; color: var(--orange-ink); margin-top: 4px; }}

.privacy {{ font-size: 8.5px; font-style: italic; color: var(--muted);
            line-height: 1.4; margin-top: 10px; padding-top: 7px;
            border-top: 1px solid var(--hair); }}
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
