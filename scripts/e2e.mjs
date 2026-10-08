// earthquery end-to-end test. Exercises the production build's /api/search
// over HTTP and asserts product-level expectations: place-aware queries stay
// in the requested region, plain concept queries behave as before, unknown
// places fall back gracefully, and empty states are honest.
//
// Usage:
//   npm run build && (npx next start -p 3100 &) && sleep 3 && \
//     E2E_BASE=http://localhost:3100 node scripts/e2e.mjs

const BASE = process.env.E2E_BASE || "http://localhost:3100";

const AFRICA = [-35, -20, 37, 55];
const EUROPE = [36, -25, 71, 45];

const inBbox = ([lat, lng], [s, w, n, e]) => lat >= s && lat <= n && lng >= w && lng <= e;

async function search(q, limit = 12) {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  const body = await res.json();
  return { status: res.status, body };
}

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

const q1 = await search("solar farms in africa", 12);
check("africa: http 200", q1.status === 200, `got ${q1.status}`);
check("africa: results returned", q1.body.results.length > 0, JSON.stringify(q1.body).slice(0, 120));
check(
  "africa: place detected",
  (q1.body.matched_places || []).includes("Africa"),
  `matched_places=${JSON.stringify(q1.body.matched_places)}`,
);
const top5 = q1.body.results.slice(0, 5);
check(
  "africa: top 5 all inside Africa",
  top5.length === 5 && top5.every((r) => inBbox(r.center, AFRICA)),
  `centers=${JSON.stringify(top5.map((r) => r.center))}`,
);
check(
  "africa: no Ontario tiles in top 5",
  top5.every((r) => !r.tile_id.startsWith("on-")),
  `ids=${top5.map((r) => r.tile_id).join(",")}`,
);
check(
  "africa: top result is a sahara solar tile",
  top5[0] && top5[0].tile_id.startsWith("w-sahara-") && top5[0].tags.includes("solar farm"),
  `top=${top5[0] ? `${top5[0].tile_id} [${top5[0].tags}]` : "none"}`,
);

const q2 = await search("solar farms in deserts", 5);
check(
  "deserts (no place): top result tagged desert",
  q2.body.results[0] && q2.body.results[0].tags.includes("desert"),
  `top=${q2.body.results[0] ? `${q2.body.results[0].tile_id} [${q2.body.results[0].tags}]` : "none"}`,
);
check(
  "deserts (no place): no place filter applied",
  (q2.body.matched_places || []).length === 0,
  `matched_places=${JSON.stringify(q2.body.matched_places)}`,
);

const q3 = await search("golf courses near lakes", 5);
check(
  "golf+lakes: results carry golf/lake tags",
  q3.body.results.length > 0 &&
    q3.body.results[0].tags.some((t) => t === "golf course" || t === "lake"),
  `top tags=${JSON.stringify(q3.body.results[0]?.tags)}`,
);

const q4 = await search("container ports", 5);
check(
  "ports: top results tagged port/terminal",
  q4.body.results.length > 0 &&
    q4.body.results.slice(0, 3).some((r) => r.tags.includes("port") || r.tags.includes("container terminal")),
  `top3=${q4.body.results.slice(0, 3).map((r) => `${r.tile_id}[${r.tags}]`).join(" ")}`,
);

const q5 = await search("vineyards in europe", 8);
check(
  "europe: place detected",
  (q5.body.matched_places || []).includes("Europe"),
  `matched_places=${JSON.stringify(q5.body.matched_places)}`,
);
check(
  "europe: all results inside Europe",
  q5.body.results.length > 0 && q5.body.results.every((r) => inBbox(r.center, EUROPE)),
  `centers=${JSON.stringify(q5.body.results.map((r) => r.center))}`,
);
check(
  "europe: bordeaux anchor ranks top for vineyards",
  q5.body.results[0] && q5.body.results[0].tile_id.startsWith("w-bordeaux-"),
  `top=${q5.body.results[0]?.tile_id}`,
);

const q6 = await search("airports in antarctica", 5);
check(
  "antarctica: empty results with honest notice",
  q6.body.results.length === 0 && typeof q6.body.notice === "string" && /antarctica/i.test(q6.body.notice),
  `notice=${JSON.stringify(q6.body.notice)} results=${q6.body.results.length}`,
);

const q7 = await search("solar farms in atlantis", 5);
check(
  "atlantis (unknown place): no place filter, global fallback",
  (q7.body.matched_places || []).length === 0 && q7.body.results.length > 0 && !q7.body.notice,
  `places=${JSON.stringify(q7.body.matched_places)} results=${q7.body.results.length}`,
);

const q8 = await search("xyzzyplugh", 5);
check(
  "gibberish: empty results, no crash",
  q8.status === 200 && q8.body.results.length === 0,
  `status=${q8.status} results=${q8.body.results.length}`,
);

const q9 = await search("rice paddies in asia", 5);
check(
  "asia: mekong rice tiles rank top",
  q9.body.results[0] && q9.body.results[0].tile_id.startsWith("w-mekong-"),
  `top=${q9.body.results[0] ? `${q9.body.results[0].tile_id} [${q9.body.results[0].tags}]` : "none"}`,
);

console.log(failures === 0 ? "\nALL E2E CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
