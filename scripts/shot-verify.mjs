// One-off verification shots: fixed africa results + AI search panel.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const TILE_CACHE = "/tmp/earthquery-tile-cache";
mkdirSync(TILE_CACHE, { recursive: true });
function fetchTile(url) {
  const cachePath = join(TILE_CACHE, Buffer.from(url).toString("base64url") + ".png");
  if (existsSync(cachePath)) return readFileSync(cachePath);
  const buf = execFileSync("curl", ["-s", "--max-time", "15", url], { maxBuffer: 4 * 1024 * 1024 });
  if (buf.length < 200) throw new Error("tile fetch too small: " + url);
  writeFileSync(cachePath, buf);
  return buf;
}

const OUT = "/tmp/eq-shots";
const BASE = "http://localhost:3102";
mkdirSync(OUT, { recursive: true });
const errors = [];

function parseProxy(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const proxy = { server: `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}`, bypass: "localhost,127.0.0.1" };
    if (u.username) proxy.username = decodeURIComponent(u.username);
    if (u.password) proxy.password = decodeURIComponent(u.password);
    return proxy;
  } catch { return null; }
}
const proxy = parseProxy(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) ?? undefined;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(proxy ? { proxy } : {}) });
const page = await context.newPage();
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console.error: " + msg.text()); });
page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
const serveTile = async (route) => {
  try { await route.fulfill({ body: fetchTile(route.request().url()), contentType: "image/png" }); }
  catch { await route.abort(); }
};
await page.route("**://*.basemaps.cartocdn.com/**", serveTile);
await page.route("**://server.arcgisonline.com/**", serveTile);

// 1. Fixed query: solar farms in africa -> Sahara, not Ontario
await page.goto(`${BASE}/?q=solar+farms+in+africa`, { waitUntil: "networkidle" });
await page.waitForSelector("#results .result-card", { timeout: 15000 });
await page.waitForTimeout(2500);
await page.locator("#results").screenshot({ path: join(OUT, "africa-results.png") });
// header with AI toggle
await page.locator("header").screenshot({ path: join(OUT, "header-toggle.png") });

// 2. Open the AI search panel
await page.getByRole("button", { name: /AI search/i }).first().click();
await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, "ai-panel.png") });

await context.close();
await browser.close();
console.log("shots written to " + OUT);
console.log(errors.length === 0 ? "console errors: none" : `console errors: ${errors.length}\n` + errors.join("\n"));
