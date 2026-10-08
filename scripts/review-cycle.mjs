// Product review cycle for earthquery.
// Verifies UI-level issues a unit test cannot catch: modal fit at several
// viewport sizes, dynamic copy (tile counts), friendly error paths, and a
// clean console. Run against a production build:
//
//   npm run build && (npx next start -p 3103 &) && sleep 4 && node scripts/review-cycle.mjs
//
// Exits non-zero on any failed check. Screenshots land in /tmp/eq-review.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.REVIEW_BASE || "http://localhost:3103";
const OUT = "/tmp/eq-review";
mkdirSync(OUT, { recursive: true });

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

let failures = 0;
const errors = [];
function check(name, cond, detail = "") {
  if (cond) console.log(`PASS  ${name}`);
  else { failures++; console.log(`FAIL  ${name}${detail ? " -- " + detail : ""}`); }
}

const browser = await chromium.launch();

async function newPage(viewport, section) {
  const context = await browser.newContext({ viewport, ...(proxy ? { proxy } : {}) });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    // Expected: the fake-token test intentionally calls the HF API, which
    // fails in this sandbox. Chrome logs the failed fetch; the UI still
    // shows the friendly error path, which is what the check verifies.
    if (section === "bad-token" && /Failed to load resource/.test(msg.text())) return;
    errors.push(`[${section} ${viewport.width}x${viewport.height}] console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${viewport.width}x${viewport.height}] pageerror: ${err.message}`));
  const serveTile = async (route) => {
    try { await route.fulfill({ body: fetchTile(route.request().url()), contentType: "image/png" }); }
    catch { await route.abort(); }
  };
  await page.route("**://*.basemaps.cartocdn.com/**", serveTile);
  await page.route("**://server.arcgisonline.com/**", serveTile);
  return { context, page };
}

async function openPanel(page) {
  await page.getByRole("button", { name: /AI search/i }).first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
  await page.waitForTimeout(400);
}

// --- 1. Panel fits the viewport at several sizes (the reported bug) ---
for (const vp of [{ width: 1440, height: 700 }, { width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const label = `${vp.width}x${vp.height}`;
  const { context, page } = await newPage(vp, "panel");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await openPanel(page);
  const box = await page.locator('[role="dialog"] > div').boundingBox();
  const fits = box && box.y >= 0 && box.y + box.height <= vp.height + 1;
  check(`panel fits viewport ${label}`, !!fits, fits ? "" : `panel ${JSON.stringify(box)} vs viewport ${label}`);
  await page.screenshot({ path: join(OUT, `panel-${label}.png`) });
  // Panel closes via the X button
  await page.locator('[role="dialog"] button[aria-label="Close"]').click();
  const gone = await page.locator('[role="dialog"]').count().then((c) => c === 0);
  check(`panel closes ${label}`, gone);
  await context.close();
}

// --- 2. Dynamic copy: FAQ + HowItWorks show the live tile count ---
{
  const { context, page } = await newPage({ width: 1440, height: 900 }, "copy");
  await page.goto(BASE, { waitUntil: "networkidle" });
  const apiCount = await (await fetch(`${BASE}/api/health`)).json().then((j) => j.tiles);
  const faqText = await page.locator("#faq").textContent();
  check("FAQ shows live tile count", faqText.includes(`${apiCount} tiles`), `api=${apiCount}`);
  const howText = await page.locator("#how").innerText();
  check("HowItWorks shows live tile count", howText.includes(`${apiCount} tiles`) || howText.includes(`${apiCount} seeded`), "count missing");
  await page.locator("#faq").screenshot({ path: join(OUT, "faq.png") });
  await context.close();
}

// --- 3. Friendly error path: fake token -> clear message, no crash ---
{
  const { context, page } = await newPage({ width: 1440, height: 900 }, "bad-token");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await openPanel(page);
  await page.fill("#hf-token", "hf_fake_token_for_review");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.waitForTimeout(6000);
  const bodyText = await page.locator('[role="dialog"]').innerText();
  const friendly = /did not work/i.test(bodyText) && /huggingface\.co\/settings\/tokens/i.test(bodyText);
  check("fake token shows friendly error", friendly);
  await page.screenshot({ path: join(OUT, "panel-bad-token.png") });
  await context.close();
}

// --- 4. Keyword search still works end to end in the browser ---
{
  const { context, page } = await newPage({ width: 1440, height: 900 }, "search");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.fill('input[name="q"]', "solar farms in africa");
  await page.click('form[role="search"] button[type="submit"]');
  await page.waitForSelector("#results .result-card", { timeout: 15000 });
  const firstId = await page.locator("#results .result-card").first().innerText();
  check("browser search: africa query, sahara top result", /w-sahara/i.test(firstId), firstId.slice(0, 60));
  const chips = await page.locator("#results").innerText();
  check("browser search: place chip shown", /in Africa/.test(chips));
  await context.close();
}

await browser.close();

console.log(errors.length === 0 ? "console errors: none" : `console errors: ${errors.length}\n` + errors.join("\n"));
if (errors.length > 0) failures++;
console.log(failures === 0 ? "ALL REVIEW CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
