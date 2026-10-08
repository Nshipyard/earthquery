// Verification screenshots for earthquery.
// Captures hero + populated search-results states at desktop and mobile
// viewports, and reports any browser console errors or page errors.
//
// Usage: node scripts/screenshot.mjs [out-dir]   (dev server must run on :3000)

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

// Tile CDN requests fail from headless Chromium in this environment (proxy
// CONNECT auth). curl handles the env proxy correctly, so the harness fetches
// tiles via curl and fulfills them from a disk cache. Product code is untouched.
const TILE_CACHE = "/tmp/earthquery-tile-cache";
mkdirSync(TILE_CACHE, { recursive: true });

function fetchTile(url) {
  const cachePath = join(TILE_CACHE, Buffer.from(url).toString("base64url") + ".png");
  if (existsSync(cachePath)) return readFileSync(cachePath);
  const buf = execFileSync("curl", ["-s", "--max-time", "15", url], {
    maxBuffer: 4 * 1024 * 1024,
  });
  if (buf.length < 200) throw new Error("tile fetch too small: " + url);
  writeFileSync(cachePath, buf);
  return buf;
}

const OUT = resolve(process.argv[2] || "/tmp/earthquery-shots");
const BASE = "http://localhost:3000";
const QUERY = "solar farms in deserts";

mkdirSync(OUT, { recursive: true });

const errors = [];

// Playwright does not parse credentials out of the proxy URL; split them
// into the dedicated username/password fields or CONNECT auth fails.
function parseProxy(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const proxy = {
      server: `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}`,
      bypass: "localhost,127.0.0.1",
    };
    if (u.username) proxy.username = decodeURIComponent(u.username);
    if (u.password) proxy.password = decodeURIComponent(u.password);
    return proxy;
  } catch {
    return null;
  }
}

const proxy =
  parseProxy(
    process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy,
  ) ?? undefined;

async function capturePage(browser, viewport, label) {
  // Route tile CDN traffic through the environment proxy; keep localhost direct.
  const context = await browser.newContext({ viewport, ...(proxy ? { proxy } : {}) });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${label}] console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${label}] pageerror: ${err.message}`));

  const serveTile = async (route) => {
    try {
      const buf = fetchTile(route.request().url());
      await route.fulfill({ body: buf, contentType: "image/png" });
    } catch {
      await route.abort();
    }
  };
  await page.route("**://*.basemaps.cartocdn.com/**", serveTile);
  await page.route("**://server.arcgisonline.com/**", serveTile);

  // Hero state
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // let Leaflet tiles paint
  await page.screenshot({ path: join(OUT, `hero-${label}.png`) });

  // Populated results state
  await page.fill('input[name="q"]', QUERY);
  await page.click('form[role="search"] button[type="submit"]');
  await page.waitForSelector("#results .result-card", { timeout: 15000 });
  await page.waitForSelector("#results .leaflet-container", { timeout: 20000 });
  await page.waitForTimeout(2500); // let tiles and rectangles paint
  const results = page.locator("#results");
  await results.screenshot({ path: join(OUT, `results-${label}.png`) });

  await context.close();
}

const browser = await chromium.launch();
await capturePage(browser, { width: 1440, height: 900 }, "desktop");
await capturePage(browser, { width: 390, height: 844 }, "mobile");
await browser.close();

console.log(`screenshots written to ${OUT}`);
if (errors.length === 0) {
  console.log("console errors: none");
} else {
  console.log(`console errors: ${errors.length}`);
  for (const e of errors) console.log("  " + e);
}
