// Verification screenshots: log in for real, then capture each Phase 1 screen.
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT = "shots";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["connexion", "/connexion", false],
  ["tableau-de-bord", "/", true],
  ["produits", "/produits", true],
  ["achats", "/achats", true],
  ["ventes", "/ventes", true],
  ["stock", "/stock", true],
  ["benefices", "/benefices", true],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1320, height: 900, deviceScaleFactor: 2 });

// real login
await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle0" });
await page.type('input[name="login"]', "maman");
await page.type('input[name="motDePasse"]', "maman2026");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
const afterLogin = page.url();
console.log("after login URL:", afterLogin);

for (const [name, path, needsAuth] of pages) {
  if (name === "connexion") {
    // fresh page without cookies for the login shot
    const p2 = await browser.newPage();
    await p2.setViewport({ width: 1320, height: 900, deviceScaleFactor: 2 });
    await p2.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
    await p2.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    await p2.close();
    console.log("shot", name);
    continue;
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("shot", name, "->", page.url());
}

await browser.close();
console.log("done");
