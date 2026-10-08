// earthquery demo index generator.
// Builds a deterministic, reproducible demo tile index: ~476 tiles with
// 64-dimensional concept vectors. Southern Ontario grid plus 20 world-region
// anchors. Demo only: vectors are seeded combinations of concept vectors,
// NOT real satellite embeddings. The production path (AlphaEarth via Earth
// Engine) is documented in README.md and lib/providers.ts.
//
// Usage: node scripts/generate-tiles.mjs [output-dir]
// Writes: <output-dir>/tiles.json and <output-dir>/concepts.json

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIM = 64;
const OUT_DIR = resolve(process.argv[2] || "public/data");

// --- deterministic RNG (mulberry32) ---------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// --- concept vocabulary ------------------------------------------------------
const CONCEPTS = [
  "lake", "forest", "farmland", "urban", "downtown", "suburb", "river",
  "desert", "solar farm", "golf course", "airport", "container terminal",
  "port", "highway", "beach", "mountain", "glacier", "wetland", "rice paddy",
  "vineyard", "ski resort", "dam", "reservoir", "mining", "quarry",
  "oil field", "wind farm", "industrial", "park", "stadium", "campus",
  "bridge", "canal", "island", "coastline", "reef", "volcano", "tundra",
  "savanna", "jungle", "mangrove", "bay", "geothermal",
];

const conceptVec = {};
for (const c of CONCEPTS) {
  const r = mulberry32(hashStr("concept:" + c));
  const v = Array.from({ length: DIM }, () => r() * 2 - 1);
  const n = Math.hypot(...v) || 1;
  conceptVec[c] = v.map((x) => +(x / n).toFixed(5));
}

function tileVector(tags, seed) {
  const v = new Array(DIM).fill(0);
  tags.forEach((t, i) => {
    const w = i === 0 ? 1.0 : 0.55;
    const cv = conceptVec[t];
    if (!cv) throw new Error("unknown concept: " + t);
    for (let d = 0; d < DIM; d++) v[d] += cv[d] * w;
  });
  const r = mulberry32(seed);
  for (let d = 0; d < DIM; d++) v[d] += (r() * 2 - 1) * 0.06;
  const n = Math.hypot(...v) || 1;
  return v.map((x) => +(x / n).toFixed(4));
}

function pick(r, arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
  }
  return out;
}

// --- tile builders ------------------------------------------------------------
const tiles = [];
let seq = 0;

function addTile(id, south, west, north, east, tags) {
  const seed = hashStr(id);
  tiles.push({
    id,
    bbox: [+south.toFixed(4), +west.toFixed(4), +north.toFixed(4), +east.toFixed(4)],
    center: [+((south + north) / 2).toFixed(4), +((west + east) / 2).toFixed(4)],
    tags: [...new Set(tags)].slice(0, 4),
    vector: tileVector([...new Set(tags)].slice(0, 4), seed),
  });
  seq++;
}

// Southern Ontario: 42.8-44.6 lat, -80.8 to -78.85 lng, 0.15 deg cells.
const TORONTO = [43.65, -79.38];
const PEARSON = [43.68, -79.63];
function degDist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

let airportTile = null;
let airportBest = Infinity;

for (let lat = 42.8; lat < 44.6; lat += 0.15) {
  for (let lng = -80.8; lng < -78.85; lng += 0.15) {
    const c = [lat + 0.075, lng + 0.075];
    const r = mulberry32(hashStr(`on:${lat.toFixed(2)},${lng.toFixed(2)}`));
    const dT = degDist(c, TORONTO);
    let tags;
    if (dT < 0.32) {
      tags = pick(r, ["urban", "downtown", "suburb", "park"], 2 + (r() < 0.5 ? 1 : 0));
      if (dT < 0.16 && r() < 0.3) tags.push("stadium");
    } else if (c[0] > 43.3 && c[0] < 43.72 && c[1] > -79.75 && c[1] < -79.05) {
      tags = pick(r, ["lake", "coastline", "beach", "urban", "suburb"], 2);
      if (r() < 0.35) tags.push("island"); // Toronto Islands and shore islands
      if (r() < 0.2) tags.push("wetland");
    } else if (c[0] > 44.25) {
      tags = pick(r, ["forest", "lake", "wetland", "park"], 2);
    } else if (c[1] < -80.15) {
      tags = ["farmland"];
      if (r() < 0.25) tags.push("wind farm");
      if (r() < 0.12) tags.push("solar farm");
    } else {
      tags = pick(r, ["farmland", "forest", "suburb", "park", "highway", "river"], 2 + (r() < 0.4 ? 1 : 0));
    }
    if (r() < 0.08) tags.push("golf course");
    if (r() < 0.05) tags.push("campus");
    if (r() < 0.04) tags.push("quarry");
    const id = `on-${String(seq).padStart(4, "0")}`;
    addTile(id, lat, lng, lat + 0.15, lng + 0.15, tags);
    const dA = degDist(c, PEARSON);
    if (dA < airportBest) {
      airportBest = dA;
      airportTile = tiles[tiles.length - 1];
    }
  }
}
if (airportTile && !airportTile.tags.includes("airport")) {
  airportTile.tags.unshift("airport");
  airportTile.vector = tileVector(airportTile.tags.slice(0, 4), hashStr(airportTile.id));
}

// World anchors: 4x4 grids at 0.12 deg cells.
const ANCHORS = [
  { name: "sahara", lat: 23.4, lng: 12.6, tags: ["desert", "solar farm", "oil field"] },
  { name: "amazon", lat: -3.0, lng: -62.0, tags: ["jungle", "river", "wetland"] },
  { name: "rotterdam", lat: 51.95, lng: 4.05, tags: ["container terminal", "port", "industrial"] },
  { name: "sfbay", lat: 37.65, lng: -122.35, tags: ["urban", "bay", "airport"] },
  { name: "polders", lat: 52.35, lng: 4.85, tags: ["farmland", "canal", "wind farm"] },
  { name: "dubai", lat: 25.15, lng: 55.25, tags: ["desert", "urban", "airport"] },
  { name: "maldives", lat: 3.2, lng: 73.2, tags: ["island", "reef", "beach"] },
  { name: "alps", lat: 46.55, lng: 8.05, tags: ["mountain", "glacier", "ski resort"] },
  { name: "iceland", lat: 64.8, lng: -18.7, tags: ["volcano", "glacier", "geothermal"] },
  { name: "gbr", lat: -18.3, lng: 147.7, tags: ["reef", "island", "coastline"] },
  { name: "napa", lat: 38.4, lng: -122.4, tags: ["vineyard", "farmland", "suburb"] },
  { name: "singapore", lat: 1.32, lng: 103.82, tags: ["container terminal", "urban", "port"] },
  { name: "capetown", lat: -33.92, lng: 18.42, tags: ["coastline", "mountain", "vineyard"] },
  { name: "tokyo", lat: 35.6, lng: 139.75, tags: ["urban", "port", "industrial"] },
  { name: "fjords", lat: 60.5, lng: 6.6, tags: ["coastline", "mountain", "glacier"] },
  { name: "kenya", lat: -1.5, lng: 36.8, tags: ["savanna", "park", "river"] },
  { name: "siberia", lat: 68.0, lng: 100.0, tags: ["tundra", "forest", "river"] },
  { name: "atacama", lat: -23.5, lng: -68.6, tags: ["desert", "mining", "quarry"] },
  { name: "threegorges", lat: 30.82, lng: 111.0, tags: ["dam", "reservoir", "river"] },
  { name: "mekong", lat: 10.4, lng: 105.1, tags: ["rice paddy", "river", "wetland"] },
  { name: "bordeaux", lat: 44.8, lng: -0.6, tags: ["vineyard", "farmland", "river"] },
  { name: "nile", lat: 30.0, lng: 31.2, tags: ["river", "farmland", "desert"] },
];

for (const a of ANCHORS) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const lat = a.lat + i * 0.12;
      const lng = a.lng + j * 0.12;
      const r = mulberry32(hashStr(`w:${a.name}:${i}:${j}`));
      const tags = [a.tags[0]];
      if (r() < 0.8) tags.push(a.tags[1]);
      if (r() < 0.45) tags.push(a.tags[2] || a.tags[0]);
      const id = `w-${a.name}-${i}${j}`;
      addTile(id, lat, lng, lat + 0.12, lng + 0.12, tags);
    }
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  join(OUT_DIR, "tiles.json"),
  JSON.stringify(
    {
      meta: {
        generated_at: new Date().toISOString().split("T")[0],
        count: tiles.length,
        dimensions: DIM,
        coverage: "Southern Ontario grid (0.15 deg cells) plus 22 world-region anchors (0.12 deg cells)",
        demo: true,
        note: "Demo vectors are deterministic seeded combinations of concept vectors, not real satellite embeddings.",
      },
      tiles,
    },
    null,
    1
  )
);
writeFileSync(join(OUT_DIR, "concepts.json"), JSON.stringify({ dimensions: DIM, vectors: conceptVec }, null, 1));

console.log(`wrote ${tiles.length} tiles and ${CONCEPTS.length} concept vectors to ${OUT_DIR}`);
