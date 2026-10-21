// Il meteo di Mantova per la scena 3D di pzkko.it (pzkko/scena/meteo.js): com'è adesso
// e quanto ha piovuto nelle ultime 12 ore, da Open-Meteo (open-meteo.com: gratuito,
// senza chiave, dati dei servizi meteorologici nazionali).
//
// Funzione serverless Vercel, runtime Node, sotto lo stesso dominio: il browser di
// chi guarda chiede solo a pzkko.it, non a un servizio di altri, e la risposta resta
// nella cache di Vercel dieci minuti (Open-Meteo riceve una richiesta ogni dieci
// minuti, non una per visita). Se Open-Meteo non risponde: 502, e la scena resta col
// dopo pioggia di sempre.
//
// Sta qui (.mjs: senza package.json intorno è comunque un modulo) perché vada online
// quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko; finché
// la radice è albertopecchini.it, la pubblica albertopecchini.it/api/meteo.js, che la
// riesporta. In locale la serve tools/dev.mjs (npm run dev:pzkko).

// Mantova, la stessa delle luci (pzkko/scena/luci.js): 45,1564 N, 10,7914 E
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast?latitude=45.1564&longitude=10.7914' +
  '&current=temperature_2m,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,snow_depth' +
  '&hourly=precipitation&past_hours=12&forecast_hours=1&timezone=Europe%2FRome'

const json = (res, status, body, cache) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return json(res, 405, { errore: 'solo GET' }, 'no-store') }
  try {
    const r = await fetch(OPEN_METEO, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`)
    const d = await r.json(), c = d.current ?? {}
    // la pioggia delle ultime 12 ore (mm): dice quanto è bagnato il marciapiede anche quando ha smesso
    const ore = d.hourly?.precipitation ?? []
    json(res, 200, {
      codice: c.weather_code, // codice WMO: 0 sereno, 1-3 nuvole, 45-48 nebbia, 51-67 e 80-82 pioggia, 71-77 e 85-86 neve, 95-99 temporale
      nuvole: c.cloud_cover, // %
      pioggia: (c.rain ?? 0) + (c.showers ?? 0), // mm nell'ultima ora
      neve: c.snowfall ?? 0, // cm nell'ultima ora
      manto: c.snow_depth ?? 0, // m di neve per terra
      visibilita: c.visibility, // m
      vento: c.wind_speed_10m, // km/h
      direzione: c.wind_direction_10m, // gradi, da dove viene
      temperatura: c.temperature_2m,
      giorno: c.is_day,
      pioggia12: Math.round(ore.reduce((a, b) => a + (b || 0), 0) * 10) / 10,
      ora: c.time,
    }, 'public, s-maxage=600, stale-while-revalidate=1800')
  } catch (e) {
    json(res, 502, { errore: String(e?.message || e) }, 'public, s-maxage=60')
  }
}
