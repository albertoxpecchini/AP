import { chromium } from "playwright";

const URL = "http://localhost:5173/5bt";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

// bbox (screen px) della cattedra: unione dei poligoni verdi + l'eventuale immagine schermo laptop
async function catClip() {
  return await page.evaluate(() => {
    const svg = document.querySelector(".aula-svg");
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, found = 0;
    for (const el of svg.querySelectorAll("polygon, image")) {
      const f = (el.getAttribute("fill") || "");
      const href = el.getAttribute("href") || "";
      const green = f.startsWith("rgb(50,134,79)") || f.startsWith("rgb(47,125,74)") || f === "#2f7d4a";
      const lap = href.includes("laptop-screen");
      if (!green && !lap) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0) continue;
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      found++;
    }
    if (!found) return null;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  });
}

let prev = 0;
for (const a of [0, 1, 2, 3]) {
  for (let s = 0; s < a - prev; s++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(360); }
  prev = a;
  await page.waitForTimeout(300);
  const c = await catClip();
  if (!c) { console.log("no cattedra at angle", a); continue; }
  const m = 90; // margine px attorno
  const clip = {
    x: Math.max(0, c.x - m), y: Math.max(0, c.y - m),
    width: Math.min(1100, c.w + m * 2), height: Math.min(900, c.h + m * 2),
  };
  await page.screenshot({ path: `cat-${a}.png`, clip });
  console.log(`saved cat-${a}.png`, JSON.stringify(clip).slice(0, 80));
}
await browser.close();
