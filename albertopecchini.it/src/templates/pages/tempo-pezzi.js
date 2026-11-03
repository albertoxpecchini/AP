// I pezzi della macchina del tempo: gli indirizzi delle pagine, l'istogramma, le statistiche
// della cattura, i «momenti» del giorno e del sito. Solo stringhe, per i template di
// pages/tempo.js. I dati vengono da src/data/tempo.js (tools/tempo/tempo.mjs).
//
// Dal 3.11.2026 sera ogni cattura è una pagina statica leggera con un indirizzo suo,
// /tempo/<dominio>/<AAAA-MM-GG>/: la barra e le foto da Vercel, niente iframe né dati di
// tutti i siti dentro la pagina (Alberto, in chiamata con Gabry: «fai che gli altri vedano
// l'html leggero con solo le foto e non che debba scaricare il repo intero ogni volta, un
// html semplice leggibile con percorso completo e univoco»). La pagina vera dal server di
// casa resta un link, per chi la vuole.
//
// Riservatezza (Alberto, 3.11.2026: «ripercorrere i momenti di quando committavo senza
// violare la mia privacy»): si mostrano ore, giorni e quantità, mai nomi o indirizzi di
// nessuno; i messaggi dei commit sono quelli già pubblici su GitHub, ripuliti da tempo.mjs.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])

const giorno = (iso) => new Date(iso + 'T12:00:00')
export const lunga = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
export const corta = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
const breve = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '')
const meseCorto = (iso) => giorno(iso).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase()
const settimanale = (iso) => giorno(iso).toLocaleDateString('it-IT', { weekday: 'long' })
export const num = (n) => Number(n || 0).toLocaleString('it-IT')
export const peso = (kb) => (kb >= 1024 ? `${(kb / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB` : `${num(kb)} KB`)
const avanti = (iso, n) => {
  const d = giorno(iso)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}
const per = (n, uno, tanti) => `${num(n)} ${n === 1 ? uno : tanti}`
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export const GIORNI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']
const TIPI = { feat: 'novità', fix: 'correzioni', chore: 'manutenzione', docs: 'documenti', style: 'stile', refactor: 'riordino', perf: 'velocità', test: 'prove', build: 'build', ci: 'automatismi', revert: 'passi indietro', merge: 'unioni', altro: 'altro' }
const AI = { claude: 'Claude', copilot: 'Copilot', codex: 'Codex' }

// dove stanno le foto e le pagine vere di una versione
export const foto = (id, short, k) => `/media/tempo/${id}/${short}-${k}.webp`
export const percorso = (id, short) => (id === 'ap' ? short : `${id}/${short}`)
export const dominio = (url) => url.replace(/^https?:\/\/(www\.)?/, '')
// gli indirizzi: un sito, una cattura (una per giorno, quindi la data basta)
export const sitoPath = (s) => `/tempo/${dominio(s.url)}/`
export const catturaPath = (s, v) => `/tempo/${dominio(s.url)}/${v.data}/`
// la pagina vera sul server di casa: pesante, il sito intero di quel giorno
export const vivaUrl = (archivio, s, v) => `${archivio}/${percorso(s.id, v.short)}/`
export const conFoto = (v) => Boolean(v.d && v.m)

// ── L'istogramma: un posto per ogni giorno dal primo all'ultimo, alto quanti commit ──
// Ogni barra è un link alla sua cattura; l'anteprima (data-t) la mostra il browser al passaggio.

export function istogramma(s, corrente = -1) {
  const versioni = s.versioni
  if (!versioni.length) return { barre: '', mesi: '', n: 1 }
  const max = Math.max(...versioni.map((v) => v.commit))
  const perData = new Map(versioni.map((v, i) => [v.data, i]))
  const giorni = []
  for (let d = versioni[0].data; d <= versioni.at(-1).data; d = avanti(d, 1)) giorni.push({ data: d, i: perData.has(d) ? perData.get(d) : -1 })
  const mesi = []
  giorni.forEach((g, k) => {
    const m = g.data.slice(0, 7)
    if (!mesi.length || mesi.at(-1).m !== m) mesi.push({ m, k, label: meseCorto(g.data) })
  })
  // il primo mese, se finisce fra pochi giorni, non scrive l'etichetta (si accavallerebbe)
  if (mesi.length > 1 && mesi[1].k - mesi[0].k < 12) mesi.shift()
  const barre = giorni
    .map((g, k) => {
      const v = g.i >= 0 ? versioni[g.i] : null
      if (!v) return `<span class="wb__col wb__col--empty" style="--k:${k}" aria-hidden="true"></span>`
      const h = Math.max(14, Math.round((v.commit / max) * 100))
      const qui = g.i === corrente
      const t = conFoto(v) ? ` data-t="${foto(s.id, v.short, v.foto2 ? 't' : 'd')}"` : ''
      const righe = v.st?.piu || v.st?.meno ? ` · +${num(v.st.piu)} −${num(v.st.meno)}` : ''
      return `<a class="wb__col${qui ? ' is-current' : ''}${conFoto(v) ? '' : ' is-off'}" href="${catturaPath(s, v)}" style="--k:${k};--h:${h}%" data-tm-go data-d="${esc(lunga(v.data))} · ${v.ora}" data-n="${per(v.commit, 'commit', 'commit')}${righe}"${t} aria-label="${esc(lunga(v.data))}, ${per(v.commit, 'commit', 'commit')}"${qui ? ' aria-current="page"' : ''}></a>`
    })
    .join('')
  // l'ultimo mese, se comincia a pochi giorni dalla fine, si appoggia al bordo destro (sul telefono «NOV» usciva)
  const fine = (m) => giorni.length - m.k < Math.max(8, giorni.length * 0.06)
  return { barre, mesi: mesi.map((m) => `<span${fine(m) ? ' class="wb__m-end"' : ''} style="--k:${m.k}">${m.label}</span>`).join(''), n: giorni.length }
}

export function conteggio(sito) {
  const vs = sito.versioni
  if (!vs.length) return 'Nessuna cattura ancora'
  const m = sito.momenti || {}
  return `Salvata <b>${num(vs.length)}</b> volte tra il <b>${esc(lunga(vs[0].data))}</b> e il <b>${esc(lunga(vs.at(-1).data))}</b> · ${per(m.commit ? m.commit + (m.auto || 0) : vs.reduce((n, v) => n + v.commit, 0), 'commit', 'commit')} su <a href="${esc(sito.github)}" target="_blank" rel="noopener">${esc(sito.github.replace('https://github.com/', ''))}</a>`
}

// ── Le statistiche della cattura, in fila sotto il commit ─────────────────────

export function chips(v) {
  const st = v.st || {}
  const out = []
  if (st.piu || st.meno) out.push(`<span class="wb__chip" title="righe aggiunte e tolte quel giorno"><b class="wb__plus">+${num(st.piu)}</b> <b class="wb__minus">−${num(st.meno)}</b></span>`)
  if (st.file) out.push(`<span class="wb__chip" title="file toccati quel giorno">${per(st.file, 'file', 'file')}</span>`)
  out.push(`<span class="wb__chip" title="commit quel giorno e ore del primo e dell'ultimo di Alberto${st.auto ? ` (più ${st.auto} automatici, le catture dei siti)` : ''}">${per(v.commit, 'commit', 'commit')}${st.da && st.da !== st.a ? ` · dalle ${st.da} alle ${st.a}` : st.da ? ` · alle ${st.da}` : ''}</span>`)
  if (st.giorno) out.push(`<span class="wb__chip" title="giorni di lavoro dal primo commit; giorni di fila con almeno un commit">giorno ${num(st.giorno)}${st.serie > 1 ? ` · ${st.serie}° di fila` : ''}</span>`)
  if (st.ai) out.push(`<span class="wb__chip" title="commit scritti insieme a un assistente (Claude, Copilot, Codex)">${num(st.ai)} con un assistente</span>`)
  if (st.sito) out.push(`<span class="wb__chip" title="il sito di quel giorno: pagine HTML e peso di tutti i file">${per(st.sito.pagine, 'pagina', 'pagine')} · ${peso(st.sito.kb)}</span>`)
  return out.join('')
}

// ── I momenti: il giorno della cattura e tutto il sito ────────────────────────

// il giorno su un righello di 24 ore, un puntino per commit (in grigio quelli automatici)
export function righello(v, commit) {
  const righe = commit || (v.st?.ore || []).map((h) => [`${String(h).padStart(2, '0')}:30`])
  const ore = righe.filter((c) => !c[8]).map((c) => c[0])
  const punti = righe
    .map((c) => {
      const [h, m] = c[0].split(':').map(Number)
      const x = ((h * 60 + m) / 1440) * 100
      return `<span class="wb__dot${c[8] ? ' wb__dot--auto' : ''}" style="--x:${x.toFixed(2)}%" title="${c[0]}${c[2] ? ' · ' + esc(c[2]) : ''}${c[8] ? ' (automatico)' : ''}"></span>`
    })
    .join('')
  const tacche = [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => `<span class="wb__tick" style="--x:${(h / 24) * 100}%">${h === 24 ? '' : String(h).padStart(2, '0')}</span>`).join('')
  return `<div class="wb__ruler" role="img" aria-label="${ore.length} commit fra le ${ore[0] || '—'} e le ${ore.at(-1) || '—'}"><span class="wb__night" style="--a:0%;--b:${(6 / 24) * 100}%"></span>${tacche}${punti}</div>`
}

export function momentiGiorno(v, commit, sito) {
  const st = v.st || {}
  const tipi = Object.entries(st.tipi || {}).sort((a, b) => b[1] - a[1])
  const lista = commit
    ? `<ol class="wb__commits">${commit
        .map(([ora, short, msg, piu, meno, file, tipo, ai, auto]) => `<li${auto ? ' class="is-auto"' : ''}><span class="wb__c-ora">${ora}</span> <a class="wb__c-sha" href="${esc(sito.github)}/commit/${short}" target="_blank" rel="noopener">${short}</a> <span class="wb__c-msg">${esc(msg)}</span> <span class="wb__c-n"><b class="wb__plus">+${num(piu)}</b> <b class="wb__minus">−${num(meno)}</b> · ${per(file, 'file', 'file')}${ai ? ` · ${AI[ai] || ai}` : ''}${auto ? ' · automatico' : ''}</span></li>`)
        .join('')}</ol>`
    : `<p class="wb__muted">${commit === null ? 'I commit uno per uno non si caricano: c’è solo il riassunto.' : 'Carico i commit di quel giorno…'}</p>`
  return `
    <h3 class="wb__h">Quel giorno · ${esc(settimanale(v.data))} ${esc(lunga(v.data))}</h3>
    ${righello(v, commit)}
    <p class="wb__facts">${per(v.commit, 'commit', 'commit')}${st.auto ? ` (${num(st.auto)} automatici)` : ''}${st.da && st.da !== st.a ? ` fra le ${st.da} e le ${st.a}` : st.da ? ` alle ${st.da}` : ''}${st.file ? ` · ${per(st.file, 'file', 'file')}` : ''}${st.piu || st.meno ? ` · <b class="wb__plus">+${num(st.piu)}</b> <b class="wb__minus">−${num(st.meno)}</b> righe` : ''}${tipi.length ? ` · ${tipi.map(([t, n]) => `${num(n)} ${TIPI[t] || t}`).join(', ')}` : ''}</p>
    ${st.aree?.length ? `<p class="wb__facts">Dove: ${st.aree.map(([a, n]) => `<code>${esc(a)}</code> ${n}`).join(' · ')}</p>` : ''}
    ${st.sito ? `<p class="wb__facts">Il sito quel giorno: ${per(st.sito.pagine, 'pagina', 'pagine')}, ${per(st.sito.file, 'file', 'file')}, ${peso(st.sito.kb)} (JS ${peso(st.sito.js)}, CSS ${peso(st.sito.css)}, immagini ${peso(st.sito.img)}) · ${st.sito.tipo === 'server' ? 'raccolto dal server di allora' : st.sito.tipo === 'statico' ? 'file statici' : 'compilato'} in ${num(st.sito.build)} s</p>` : ''}
    ${v.nota ? `<p class="wb__facts wb__muted">${esc(v.nota)}</p>` : ''}
    ${lista}`
}

export function momentiSito(sito) {
  const m = sito.momenti
  if (!m?.commit) return ''
  const max = Math.max(1, ...m.griglia.flat())
  const griglia = m.griglia
    .map((riga, d) => `<span class="wb__pc-day">${GIORNI[d]}</span>${riga.map((n, h) => `<span class="wb__pc" style="--s:${n ? (0.25 + 0.75 * Math.sqrt(n / max)).toFixed(2) : 0}" title="${GIORNI[d]} ${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59 · ${per(n, 'commit', 'commit')}"></span>`).join('')}`)
    .join('')
  const ore = `<span class="wb__pc-day"></span>${Array.from({ length: 24 }, (_, h) => `<span class="wb__pc-h">${h % 3 ? '' : String(h).padStart(2, '0')}</span>`).join('')}`
  const oraTop = m.ore.indexOf(Math.max(...m.ore))
  const giornoTop = m.settimana.indexOf(Math.max(...m.settimana))
  const ai = Object.entries(m.ai || {}).filter(([, n]) => n)
  const fatti = [
    `<b>${per(m.commit, 'commit', 'commit')}</b> in <b>${per(m.giorni, 'giorno', 'giorni')}</b> di lavoro, dal ${esc(lunga(m.primo))} al ${esc(lunga(m.ultimo))}`,
    m.serie?.n > 1 && `la serie più lunga: <b>${m.serie.n} giorni di fila</b>, dal ${esc(breve(m.serie.da))} al ${esc(breve(m.serie.a))}`,
    m.intenso && `il giorno più intenso: <b>${esc(lunga(m.intenso.data))}</b>, ${per(m.intenso.commit, 'commit', 'commit')}`,
    m.lungo?.min > 0 && `la giornata più lunga: il ${esc(breve(m.lungo.data))}, dalle ${m.lungo.da} alle ${m.lungo.a}`,
    `l'ora preferita: <b>${String(oraTop).padStart(2, '0')}:00–${String(oraTop).padStart(2, '0')}:59</b> · il giorno preferito: <b>${['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'][giornoTop]}</b>`,
    m.notte && `di notte (fra mezzanotte e le sei): ${pct(m.notte, m.commit)}% dei commit${m.tardi ? `, il più tardi alle <b>${m.tardi.ora}</b> del ${esc(breve(m.tardi.data))}` : ''}`,
    m.presto && `il più mattiniero: alle <b>${m.presto.ora}</b> del ${esc(breve(m.presto.data))}`,
    `nel fine settimana: ${pct(m.weekend, m.commit)}% dei commit`,
    ai.length && `con un assistente: ${ai.map(([k, n]) => `${AI[k]} ${num(n)}`).join(' · ')} (${pct(ai.reduce((a, [, n]) => a + n, 0), m.commit)}%)`,
    `<b class="wb__plus">+${num(m.piu)}</b> <b class="wb__minus">−${num(m.meno)}</b> righe in tutto`,
    m.auto && `qui non contano ${per(m.auto, 'commit automatico', 'commit automatici')} (le catture dei siti, rifatte da sole)`,
  ].filter(Boolean)
  return `
    <h3 class="wb__h">Tutto ${esc(dominio(sito.url))} · quando lavoravo</h3>
    <div class="wb__punch" role="img" aria-label="Commit per giorno della settimana e ora, ora italiana">${griglia}${ore}</div>
    <ul class="wb__facts-list">${fatti.map((f) => `<li>${f}</li>`).join('')}</ul>`
}
