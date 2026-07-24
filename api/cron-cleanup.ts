// ─── Link tracciabili · pulizia giornaliera (cron Vercel) ────────────────────
//
// Cancella i link scaduti (expires_at < adesso) e i relativi oggetti in Storage.
// Programmato in vercel.json ("crons"). Vercel lo chiama con l'header
//   Authorization: Bearer <CRON_SECRET>
// quindi qui pretendiamo quel segreto: nessuno può innescarlo dall'esterno.
//
// La cancellazione "pigra" in /api/d copre i link riaperti dopo la scadenza;
// questo cron rimuove anche quelli che nessuno riapre più → 7 giorni e via.

export const config = { runtime: "nodejs" };

function supa(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}
const sHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

export default async function handler(req: any, res: any) {
  // Solo il cron di Vercel (o chi conosce il segreto) può eseguire.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Non autorizzato" });
  }

  const s = supa();
  if (!s) return res.status(503).json({ error: "Backend non configurato" });

  const nowIso = new Date().toISOString();

  // 1) Prendi gli scaduti (per cancellare anche gli oggetti in Storage collegati)
  let scaduti: any[] = [];
  try {
    const r = await fetch(
      `${s.url}/rest/v1/tracked_links?expires_at=lt.${encodeURIComponent(nowIso)}&select=id,storage_path`,
      { headers: sHeaders(s.key) },
    );
    if (r.ok) scaduti = (await r.json()) as any[];
  } catch {
    return res.status(502).json({ error: "DB irraggiungibile" });
  }

  // 2) Cancella eventuali file in Storage
  for (const row of scaduti) {
    if (!row.storage_path) continue;
    try {
      await fetch(`${s.url}/storage/v1/object/${String(row.storage_path).replace(/^\/+/, "")}`, {
        method: "DELETE",
        headers: { apikey: s.key, Authorization: `Bearer ${s.key}` },
      });
    } catch { /* best-effort */ }
  }

  // 3) Cancella le righe scadute
  try {
    await fetch(`${s.url}/rest/v1/tracked_links?expires_at=lt.${encodeURIComponent(nowIso)}`, {
      method: "DELETE",
      headers: sHeaders(s.key),
    });
  } catch {
    return res.status(502).json({ error: "Cancellazione fallita" });
  }

  return res.status(200).json({ ok: true, purged: scaduti.length });
}
