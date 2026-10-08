// Client-side "AI search": real query embeddings with the user's own
// Hugging Face token, run entirely in the browser.
//
// How it works: the demo tile index ships tile *tags* (43 land-use concepts).
// On first use we embed all 43 concept names once with the user's key via the
// Hugging Face Inference API and cache the vectors in localStorage. Each
// query is embedded the same way, tile vectors are rebuilt as weighted sums
// of their tags' real concept embeddings, and ranking is cosine similarity.
// The tile index itself stays the demo index (honestly labeled); what the key
// upgrades is query understanding: "places to grow grapes" now matches
// vineyard tiles even though no keyword overlaps.
//
// The key never leaves the browser: requests go straight to Hugging Face.

import type { SearchResponse, SearchResultItem, Tile } from "./geo";
import { parsePlaces, centerInAnyBbox } from "./places";
import {
  getToken,
  getModelId,
  LS_CONCEPT_CACHE,
} from "./ai-settings";

interface ConceptCache {
  model: string;
  dims: number;
  vectors: Record<string, number[]>;
}

let tilesCache: Tile[] | null = null;
let conceptNamesCache: string[] | null = null;

async function loadTiles(): Promise<Tile[]> {
  if (!tilesCache) {
    const res = await fetch("/data/tiles.json");
    if (!res.ok) throw new Error("Could not load the demo tile index.");
    tilesCache = (await res.json()).tiles as Tile[];
  }
  return tilesCache;
}

async function loadConceptNames(): Promise<string[]> {
  if (!conceptNamesCache) {
    const res = await fetch("/data/concepts.json");
    if (!res.ok) throw new Error("Could not load the concept list.");
    conceptNamesCache = Object.keys((await res.json()).vectors as Record<string, number[]>);
  }
  return conceptNamesCache;
}

function l2norm(v: number[]): number[] {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

async function hfEmbedBatch(
  texts: string[],
  token: string,
  model: string,
): Promise<number[][]> {
  const res = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
    },
  );
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 240);
    throw new Error(`Hugging Face returned HTTP ${res.status}. ${detail}`);
  }
  const data = await res.json();
  // Batched input -> number[][]; single input -> number[].
  const rows: number[][] = Array.isArray(data[0]) ? data : [data];
  if (rows.length !== texts.length || !Array.isArray(rows[0])) {
    throw new Error("Unexpected embedding shape from Hugging Face; trying one-by-one.");
  }
  return rows.map(l2norm);
}

async function hfEmbedOne(text: string, token: string, model: string): Promise<number[]> {
  return (await hfEmbedBatch([text], token, model))[0];
}

/**
 * Embed all concept names once per model; cache in localStorage so later
 * visits need zero warmup calls. onProgress reports completed/total.
 */
async function getConceptEmbeddings(
  token: string,
  model: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ConceptCache> {
  try {
    const raw = window.localStorage.getItem(LS_CONCEPT_CACHE);
    if (raw) {
      const cached = JSON.parse(raw) as ConceptCache;
      if (cached.model === model && cached.vectors && cached.dims > 0) return cached;
    }
  } catch {
    // Corrupt cache: fall through and rebuild.
  }

  const names = await loadConceptNames();
  let vectors: Record<string, number[]> | null = null;
  let dims = 0;

  try {
    onProgress?.(0, names.length);
    const rows = await hfEmbedBatch(names, token, model);
    vectors = Object.fromEntries(names.map((c, i) => [c, rows[i]]));
    dims = rows[0].length;
    onProgress?.(names.length, names.length);
  } catch {
    // Batched request unsupported: fall back to one-by-one with progress.
    vectors = {};
    for (let i = 0; i < names.length; i++) {
      const v = await hfEmbedOne(names[i], token, model);
      vectors[names[i]] = v;
      if (i === 0) dims = v.length;
      onProgress?.(i + 1, names.length);
    }
  }

  const cache: ConceptCache = { model, dims, vectors: vectors! };
  try {
    window.localStorage.setItem(LS_CONCEPT_CACHE, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: search still works for this session.
  }
  return cache;
}

/** Rebuild a tile vector from its tags' real concept embeddings. */
function tileVector(tags: string[], conceptVecs: Record<string, number[]>, dims: number): number[] {
  const v = new Array<number>(dims).fill(0);
  tags.forEach((t, i) => {
    const cv = conceptVecs[t];
    if (!cv) return;
    const w = i === 0 ? 1.0 : 0.55;
    for (let d = 0; d < dims; d++) v[d] += cv[d] * w;
  });
  return l2norm(v);
}

export type LiveProgress = (done: number, total: number) => void;

/**
 * Run a full live search in the browser. Throws a human-readable Error when
 * the key is missing/invalid or Hugging Face is unreachable.
 */
export async function liveSearch(
  query: string,
  onProgress?: LiveProgress,
): Promise<SearchResponse> {
  const token = getToken();
  if (!token) throw new Error("No Hugging Face token saved. Open AI search settings to add one.");
  const model = getModelId();

  const { dims, vectors } = await getConceptEmbeddings(token, model, onProgress);
  const tiles = await loadTiles();
  const names = await loadConceptNames();

  const places = parsePlaces(query);
  const placeLabels = places.map((p) => p.label);

  const base = {
    query,
    provider: `${model} (your key)`,
    dimensions: dims,
    tile_count: tiles.length,
    matched_concepts: [] as string[],
    matched_places: placeLabels,
    notice: null as string | null,
    demo: true,
  };

  let candidates = tiles;
  if (places.length > 0) {
    const inRegion = tiles.filter((t) => centerInAnyBbox(t.center, places));
    if (inRegion.length === 0) {
      return { ...base, results: [], notice: `The demo index has no tiles in ${placeLabels.join(" or ")} yet.` };
    }
    candidates = inRegion;
  }

  const qv = await hfEmbedOne(query, token, model);

  // Show which concepts the model thought the query was about.
  const conceptScores = names
    .map((c) => ({ c, s: cosine(qv, vectors[c]) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.c);

  const tileVecs = new Map<string, number[]>();
  const scored: SearchResultItem[] = candidates.map((t) => {
    let tv = tileVecs.get(t.id);
    if (!tv) {
      tv = tileVector(t.tags, vectors, dims);
      tileVecs.set(t.id, tv);
    }
    return {
      tile_id: t.id,
      bbox: t.bbox,
      center: t.center,
      score: Math.round(cosine(qv, tv) * 100),
      tags: t.tags,
    };
  });
  scored.sort((a, b) => b.score - a.score);

  return { ...base, matched_concepts: conceptScores, results: scored.slice(0, 12) };
}

/** Validate a token with a tiny probe embedding before saving it. */
export async function probeToken(token: string, model: string): Promise<{ ok: true; dims: number } | { ok: false; message: string }> {
  try {
    const v = await hfEmbedOne("hello world", token, model);
    return { ok: true, dims: v.length };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Token check failed." };
  }
}
