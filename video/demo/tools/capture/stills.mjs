// Captures crisp app-state stills (and element boxes) for the demo video from
// the offline-mode build: same UI and synthetic data as production, no
// sign-in, no network lag. HyperFrames animates between these stills (scrolls,
// sheet slide-ins, taps, highlights), which keeps motion smooth and text sharp.
// Each device is its own browser context with a hidden /sim page that fires the
// pharmacy beats, so every state is produced by the real app.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = new URL("../../media/screens/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = {};

const DESKTOP = { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1.6 };
// iPhone 17 Pro page area between the status bar (62pt) and the home indicator (34pt).
const PHONE = {
  viewport: { width: 402, height: 778 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1",
};

async function device(browser, opts) {
  const context = await browser.newContext(opts);
  const sim = await context.newPage();
  await sim.goto(`${BASE}/sim`);
  await sim.getByRole("button", { name: "Next beat" }).waitFor();
  await sim.evaluate(() => localStorage.clear());
  await sim.reload();
  await sim.getByRole("button", { name: "Next beat" }).waitFor();
  const page = await context.newPage();
  return { sim, page };
}

async function beat(sim, n = 1) {
  for (let i = 0; i < n; i++) {
    await sim.getByRole("button", { name: "Next beat" }).click();
    await wait(300);
  }
}

/** Box of a locator in CSS px relative to the viewport (or the page when full). */
async function box(locator, full = false) {
  const b = await locator.boundingBox();
  if (!b) return null;
  if (!full) return { x: b.x, y: b.y, w: b.width, h: b.height };
  const scrollY = await locator.page().evaluate(() => scrollY);
  return { x: b.x, y: b.y + scrollY, w: b.width, h: b.height };
}

/** Screenshot the page (or full page) and record element boxes by name. */
async function still(page, name, boxes = {}, { full = false } = {}) {
  await page.evaluate(() => document.fonts.ready);
  await wait(450);
  const vp = page.viewportSize();
  const entries = {};
  for (const [k, loc] of Object.entries(boxes)) entries[k] = await box(loc, full).catch(() => null);
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: full, animations: "disabled", caret: "hide" });
  const height = full ? await page.evaluate(() => document.documentElement.scrollHeight) : vp.height;
  manifest[name] = { width: vp.width, height, dpr: page.context()._options?.deviceScaleFactor ?? null, boxes: entries };
  console.log(`${name} ${vp.width}x${height}`);
}

/** Screenshot one element (a sheet) for slide-in animation. */
async function element(locator, name) {
  await wait(500);
  await locator.screenshot({ path: `${OUT}${name}.png`, animations: "disabled" });
  manifest[name] = { element: true, box: await box(locator) };
  console.log(`${name} (element)`);
}

const browser = await chromium.launch();
const D = await device(browser, DESKTOP);
const P = await device(browser, PHONE);
const T = await device(browser, PHONE);
const dq = D.page;
const pq = P.page;

// Seed the coordinator's week so the queue looks like a real Monday.
const seed = D.sim.getByRole("button", { name: /^Seed/ });
if (await seed.isEnabled()) await seed.click();
await wait(500);

// ——— Desktop: the queue on a Monday (Dr. Okafor not yet approved) ———
await dq.goto(`${BASE}/coordinator`);
await dq.getByText("Access queue").waitFor();
await still(dq, "d-queue-seeded", {
  banner: dq.getByText(/Waiting for approval from/).locator(".."),
  summary: dq.getByText("Fill confirmed this week").locator("../.."),
  table: dq.locator("table").first(),
});

// She works through the morning's cases, so today's handoffs arrive at the top.
for (let i = 0; i < 6; i++) {
  const next = dq.getByRole("tabpanel").getByRole("button", { name: /^(Connect to access support|Re-send copay card)$/ }).first();
  if (!(await next.count())) break;
  await next.click();
  await wait(500);
}
await still(dq, "d-queue-cleared", {
  banner: dq.getByText(/Waiting for approval from/).locator(".."),
  tab: dq.getByRole("tab", { name: /^Needs you/ }),
});

// ——— Phone: New Rx, Sign and send, then the DailyMed label ———
await pq.goto(`${BASE}/doctor/new`);
await pq.getByRole("button", { name: "Sign and send" }).waitFor();
await still(pq, "p-newrx", { sign: pq.getByRole("button", { name: "Sign and send" }) });
await pq.getByRole("button", { name: "Sign and send" }).tap();
await wait(700);
await still(pq, "p-newrx-sent", { sent: pq.getByText(/Sent to pharmacy/).locator("..") });
const labelCard = pq.locator("div.overflow-hidden.rounded-2xl").last();
await pq.locator("summary", { hasText: /Indications and usage/i }).first().tap();
await wait(500);
await labelCard.evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 24));
await still(pq, "p-newrx-label", {
  label: labelCard,
  badge: pq.getByText(/Verbatim from DailyMed/i).first(),
});
// A true scroll: the whole page (label open) without its fixed tab bar, plus the tab bar alone.
const tabbar = pq.locator("nav").last();
await element(tabbar, "p-tabbar-el");
await pq.evaluate(() => scrollTo(0, 0));
await pq.evaluate(() => { for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed") el.dataset.hid = "1", el.style.visibility = "hidden"; });
await still(pq, "p-newrx-scroll-full", {
  label: labelCard,
  badge: pq.getByText(/Verbatim from DailyMed/i).first(),
}, { full: true });
await pq.evaluate(() => { for (const el of document.querySelectorAll("[data-hid]")) el.style.visibility = ""; });
await pq.evaluate(() => scrollTo(0, 0));
await still(pq, "p-newrx-sent-full", {
  sent: pq.getByText(/Sent to pharmacy/).locator(".."),
  label: pq.getByText(/Verbatim from DailyMed/i).first().locator("xpath=ancestor::div[contains(@class,'rounded')][1]"),
}, { full: true });

// ——— Phone: Rx Alerts before and after the pharmacy says not dispensed ———
await pq.goto(`${BASE}/doctor`);
await pq.getByText("Rx Alerts").waitFor();
await still(pq, "p-home-quiet", {});
await beat(P.sim); // ev_04–06: claim not dispensed → reason → alert
await wait(500);
const sendBtn = pq.getByRole("button", { name: "Send to my coordinator" }).first();
await still(pq, "p-home-alert", {
  card: sendBtn.locator("xpath=ancestor::article[1]"),
  send: sendBtn,
});

// ——— Phone: one tap, first-time approval sheet ———
await sendBtn.tap();
const sheet = pq.getByRole("dialog");
await sheet.waitFor();
await wait(700);
await still(pq, "p-home-sheet", { sheet, approve: pq.getByRole("button", { name: "Approve and send" }) });
await element(sheet, "p-sheet-el");
await pq.getByRole("button", { name: "Approve and send" }).tap();
await wait(900);
await still(pq, "p-home-sent", {
  card: pq.getByText(/With your coordinator/).first().locator("xpath=ancestor::article[1]"),
});

// ——— Desktop: the handoff lands; Maria at the top with one fix ———
await beat(D.sim, 2); // ev_01–03, ev_04–06
await dq.reload();
await dq.getByText("Access queue").waitFor();
await still(dq, "d-queue-before-handoff", {});
await beat(D.sim); // ev_07–08: handoff + fix chosen
await wait(600);
const mariaRow = dq.getByRole("button", { name: "Maria Lopez" }).first().locator("xpath=ancestor::tr[1]");
const mariaFix = mariaRow.getByRole("button", { name: "Re-send copay card" });
await still(dq, "d-queue-maria", {
  row: mariaRow,
  fix: mariaFix,
  tab: dq.getByRole("tab", { name: /^Needs you/ }),
});
// The case sheet: why it's stuck and the rule-picked fix.
await dq.getByRole("button", { name: "Maria Lopez" }).first().click();
const dSheet = dq.getByRole("dialog");
await dSheet.waitFor();
await wait(700);
await still(dq, "d-case-maria", {
  sheet: dSheet,
  why: dSheet.getByText(/Why it.s stuck/i).locator(".."),
  fix: dSheet.getByText(/picked by rule/i).locator(".."),
});
await element(dSheet, "d-case-maria-el");
await dq.keyboard.press("Escape");
await wait(500);
await mariaFix.click();
await wait(800);
await still(dq, "d-queue-after-fix", { tab: dq.getByRole("tab", { name: /^Waiting/ }) });

// ——— Patient phone: the card, Use at pharmacy ———
await beat(T.sim, 4); // through ev_09 fix sent
await T.page.goto(`${BASE}/patient/rx_001`);
await T.page.getByRole("button", { name: "Use at pharmacy" }).waitFor();
await still(T.page, "t-card", {
  pass: T.page.getByText(/You pay/).locator("xpath=ancestor::div[contains(@class,'rounded')][1]"),
  use: T.page.getByRole("button", { name: "Use at pharmacy" }),
});
await T.page.getByRole("button", { name: "Use at pharmacy" }).tap();
await wait(900);
await still(T.page, "t-card-used", {
  status: T.page.getByRole("status").first(),
});

// ——— Desktop: acknowledgment, not a fill; then Fill confirmed ———
await dq.getByRole("tab", { name: /^Waiting/ }).click();
await wait(500);
const mariaWaiting = () => dq.getByRole("button", { name: "Maria Lopez" }).first().locator("xpath=ancestor::tr[1]");
await mariaWaiting().evaluate((el) => el.scrollIntoView({ block: "center" }));
await still(dq, "d-waiting-patient", { row: mariaWaiting(), tab: dq.getByRole("tab", { name: /^Waiting/ }) });
await beat(D.sim); // ev_10 card used
await wait(600);
await still(dq, "d-waiting-pharmacy", { row: mariaWaiting() });
await beat(D.sim); // ev_11 dispensed
await wait(600);
await dq.evaluate(() => scrollTo(0, 0));
await dq.getByRole("tab", { name: /^Fill confirmed/ }).click();
await wait(600);
await still(dq, "d-confirmed", {
  row: dq.getByRole("button", { name: "Maria Lopez" }).first().locator("xpath=ancestor::tr[1]"),
  tab: dq.getByRole("tab", { name: /^Fill confirmed/ }),
  summary: dq.getByText("Fill confirmed this week").locator("../.."),
});

// ——— Phone: the doctor hears about it the second time ———
await beat(P.sim, 3); // ev_09, ev_10, ev_11
await pq.goto(`${BASE}/doctor`);
await pq.getByText("Rx Alerts").waitFor();
await still(pq, "p-home-confirmed", {
  card: pq.getByText(/fill confirmed/i).first().locator("xpath=ancestor::article[1]"),
});

// ——— James: prior auth, unreachable; the doctor sends him on ———
await beat(P.sim, 3); // ev_14–15, ev_16, ev_17–19
await pq.reload();
await pq.getByText("Rx Alerts").waitFor();
const jamesSend = pq.getByRole("button", { name: "Send to my coordinator" }).first();
await still(pq, "p-home-james", {
  card: jamesSend.locator("xpath=ancestor::article[1]"),
  send: jamesSend,
});
await jamesSend.tap();
await wait(900);
await still(pq, "p-home-james-sent", {
  card: pq.getByText(/With your coordinator/).first().locator("xpath=ancestor::article[1]"),
});

// ——— Desktop: James in the queue, his case sheet ———
await beat(D.sim, 4); // ev_14–15, ev_16, ev_17–19, ev_20–21
await dq.getByRole("tab", { name: /^Needs you/ }).click();
await wait(600);
const jamesRow = dq.getByRole("button", { name: "James Carter" }).first().locator("xpath=ancestor::tr[1]");
await still(dq, "d-queue-james", {
  row: jamesRow,
  fix: jamesRow.getByRole("button").last(),
});
await dq.getByRole("button", { name: "James Carter" }).first().click();
await dSheet.waitFor();
await wait(700);
await still(dq, "d-case-james", {
  sheet: dSheet,
  why: dSheet.getByText(/Why it.s stuck/i).locator(".."),
  fix: dSheet.getByText(/picked by rule/i).locator(".."),
});
await element(dSheet, "d-case-james-el");
await dq.keyboard.press("Escape");

// ——— Desktop: Market Access view (counts only) and Prescribers ———
await dq.goto(`${BASE}/access`);
await wait(1200);
const card = (re) => dq.getByText(re).first().locator("xpath=ancestor::*[contains(@class,'rounded')][1]");
await still(dq, "d-access-full", {
  fills: card(/First fills confirmed/i),
  median: card(/Median time to first fill/i),
  reasons: card(/Stuck reasons/i),
  georgia: card(/Georgia market/i),
  who: dq.getByText(/Who sees what/i).first().locator(".."),
}, { full: true });
await still(dq, "d-access", {});
await dq.goto(`${BASE}/coordinator/prescribers`);
await wait(1000);
await still(dq, "d-prescribers", {
  okafor: dq.getByText("Dr. Nadia Okafor").first().locator("xpath=ancestor::tr[1]"),
});

// ——— Phone: Profile, My coordinator ———
await pq.goto(`${BASE}/doctor/profile`);
await wait(900);
await still(pq, "p-profile", {
  coord: pq.getByText("My coordinator").locator("xpath=ancestor::section[1]"),
});

writeFileSync(`${OUT}manifest.json`, JSON.stringify(manifest, null, 2));
await browser.close();
console.log("done");
