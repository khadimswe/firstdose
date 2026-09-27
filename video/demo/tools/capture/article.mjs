import { chromium } from "playwright";
const url = "https://www.docupdate.io/articles/prescription-abandonment-the-prescription-was-sent-the-patient-still-never-started-it/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36" });
const page = await ctx.newPage();
const res = await page.goto(url, { waitUntil: "networkidle" });
console.log("status", res.status());
await page.waitForTimeout(1500);
// Decline non-essential cookies if a banner appears (privacy-preserving default).
for (const name of [/reject all/i, /decline/i, /only necessary/i]) {
  const b = page.getByRole("button", { name }); if (await b.count()) { await b.first().click(); await page.waitForTimeout(500); break; }
}
const h1 = page.getByRole("heading", { level: 1 }).first();
const hb = await h1.boundingBox();
console.log("h1", JSON.stringify(hb), await h1.textContent());
await page.screenshot({ path: new URL("../../media/screens/docupdate-article.png", import.meta.url).pathname });
const fs = await import("node:fs");
fs.writeFileSync(new URL("../../media/docupdate-article.json", import.meta.url).pathname, JSON.stringify({ url, headline: (await h1.textContent()).trim(), byline: "Sana Khateeb, PharmD", date: "July 9, 2026", h1: hb, viewport: { width: 1440, height: 900 } }, null, 2));
await browser.close();
