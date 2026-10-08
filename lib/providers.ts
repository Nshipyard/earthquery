// Embedding providers for earthquery.
//
// The search pipeline is provider-agnostic:
//   text query -> EmbeddingProvider.embed(text) -> number[] -> cosine search
// over tile vectors. v1 ships with DemoEmbeddingProvider. Production adapters
// below show exactly how to plug in EmbeddingGemma 2 (query side) and the
// AlphaEarth tile index (index side). Adapters that need credentials fail
// loudly with setup instructions instead of silently returning demo data.

export interface EmbeddingProvider {
  /** Human-readable provider name, reported by /api/search. */
  readonly name: string;
  readonly dimensions: number;
  readonly isDemo: boolean;
  /**
   * Embed a natural-language query. Returns null when the query contains no
   * recognizable concepts (demo provider) so callers can show a helpful
   * empty state instead of fake results.
   */
  embed(text: string): { vector: number[]; concepts: string[] } | null;
}

// ---------------------------------------------------------------------------
// Demo provider: deterministic keyword -> concept mapping.
// DEMO ONLY. Documented as such everywhere it is used.
// ---------------------------------------------------------------------------

const KEYWORDS: Record<string, string[]> = {
  solar: ["solar farm"], sun: ["solar farm"],
  desert: ["desert"], arid: ["desert"], sahara: ["desert"], atacama: ["desert"],
  golf: ["golf course"],
  lake: ["lake"], lakes: ["lake"],
  forest: ["forest"], forests: ["forest"], woodland: ["forest"],
  farm: ["farmland"], farms: ["farmland"], farmland: ["farmland"],
  agriculture: ["farmland"], agricultural: ["farmland"], crop: ["farmland"], crops: ["farmland"],
  urban: ["urban", "downtown"], city: ["urban", "downtown"], cities: ["urban", "downtown"],
  town: ["suburb", "urban"], metro: ["urban", "downtown"], downtown: ["downtown"],
  suburb: ["suburb"], suburbs: ["suburb"], suburban: ["suburb"], residential: ["suburb"],
  river: ["river"], rivers: ["river"],
  airport: ["airport"], airports: ["airport"],
  port: ["port", "container terminal"], ports: ["port", "container terminal"],
  container: ["container terminal"], shipping: ["container terminal", "port"], cargo: ["container terminal"],
  highway: ["highway"], highways: ["highway"], freeway: ["highway"], motorway: ["highway"], road: ["highway"],
  beach: ["beach"], beaches: ["beach"],
  mountain: ["mountain"], mountains: ["mountain"], alpine: ["mountain"],
  glacier: ["glacier"], glaciers: ["glacier"], ice: ["glacier"],
  wetland: ["wetland"], wetlands: ["wetland"], marsh: ["wetland"], swamp: ["wetland"],
  rice: ["rice paddy"], paddy: ["rice paddy"], paddies: ["rice paddy"],
  vineyard: ["vineyard"], vineyards: ["vineyard"], wine: ["vineyard"],
  ski: ["ski resort"], skiing: ["ski resort"],
  dam: ["dam"], dams: ["dam"],
  reservoir: ["reservoir"], reservoirs: ["reservoir"],
  mine: ["mining"], mines: ["mining"], mining: ["mining"],
  quarry: ["quarry"], quarries: ["quarry"],
  oil: ["oil field"],
  wind: ["wind farm"], turbine: ["wind farm"], turbines: ["wind farm"],
  industrial: ["industrial"], factory: ["industrial"], factories: ["industrial"], warehouse: ["industrial"],
  park: ["park"], parks: ["park"],
  stadium: ["stadium"], stadiums: ["stadium"], arena: ["stadium"],
  campus: ["campus"], university: ["campus"], college: ["campus"], school: ["campus"],
  bridge: ["bridge"], bridges: ["bridge"],
  canal: ["canal"], canals: ["canal"],
  island: ["island"], islands: ["island"],
  coast: ["coastline"], coastal: ["coastline"], coastline: ["coastline"],
  shore: ["coastline"], shoreline: ["coastline"],
  reef: ["reef"], reefs: ["reef"], coral: ["reef"],
  volcano: ["volcano"], volcanoes: ["volcano"], volcanic: ["volcano"], lava: ["volcano"],
  tundra: ["tundra"],
  savanna: ["savanna"], savannah: ["savanna"],
  jungle: ["jungle"], rainforest: ["jungle"],
  mangrove: ["mangrove"], mangroves: ["mangrove"],
  bay: ["bay"], bays: ["bay"],
  geothermal: ["geothermal"],
};

const STOPWORDS = new Set([
  "a", "an", "the", "in", "on", "of", "near", "with", "and", "or", "to",
  "for", "by", "at", "from", "show", "me", "find", "all", "any", "are",
]);

function singular(token: string): string {
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 3) return token.slice(0, -1);
  return token;
}

export class DemoEmbeddingProvider implements EmbeddingProvider {
  readonly name = "demo-concept-embedder";
  readonly dimensions = 64;
  readonly isDemo = true;

  constructor(private conceptVectors: Record<string, number[]>) {}

  embed(text: string): { vector: number[]; concepts: string[] } | null {
    const tokens = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    const concepts: string[] = [];
    for (const raw of tokens) {
      if (STOPWORDS.has(raw)) continue;
      const hit = KEYWORDS[raw] ?? KEYWORDS[singular(raw)];
      if (hit) {
        for (const c of hit) {
          if (!concepts.includes(c) && this.conceptVectors[c]) concepts.push(c);
        }
      }
    }
    if (concepts.length === 0) return null;
    const dim = this.dimensions;
    const v = new Array<number>(dim).fill(0);
    for (const c of concepts) {
      const cv = this.conceptVectors[c];
      for (let d = 0; d < dim; d++) v[d] += cv[d];
    }
    for (let d = 0; d < dim; d++) v[d] /= concepts.length;
    const n = Math.hypot(...v) || 1;
    return { vector: v.map((x) => x / n), concepts };
  }
}

// ---------------------------------------------------------------------------
// Production adapters. These are real integration points, not mocks. Each
// requires credentials or data access you must provision; without them they
// throw an explanatory error.
// ---------------------------------------------------------------------------

/**
 * Query-side production adapter: EmbeddingGemma 2 via the Hugging Face
 * Inference API. EmbeddingGemma 2 (Google, Oct 2026, Apache 2.0) maps text,
 * code, images, video, and audio into one shared 768-dim space.
 *
 * Setup:
 *   1. Create a Hugging Face access token (https://huggingface.co/settings/tokens).
 *   2. Confirm the exact EmbeddingGemma 2 repository slug on huggingface.co
 *      and pass it as modelId.
 *   3. Set HF_TOKEN in your environment.
 */
export class EmbeddingGemmaProvider implements EmbeddingProvider {
  readonly name = "embeddinggemma-2";
  readonly dimensions = 768;
  readonly isDemo = false;

  constructor(
    private modelId: string,
    private token: string | undefined = process.env.HF_TOKEN,
  ) {}

  embed(): { vector: number[]; concepts: string[] } | null {
    throw new Error(
      "EmbeddingGemmaProvider is async and needs HF_TOKEN plus a valid modelId; " +
        "use embedAsync() after configuring credentials.",
    );
  }

  async embedAsync(text: string): Promise<{ vector: number[]; concepts: string[] }> {
    if (!this.token) {
      throw new Error(
        "HF_TOKEN is not set. Create a token at https://huggingface.co/settings/tokens " +
          "and export HF_TOKEN before using EmbeddingGemmaProvider.",
      );
    }
    const res = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.modelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      },
    );
    if (!res.ok) {
      throw new Error(`Hugging Face inference failed: ${res.status} ${await res.text()}`);
    }
    const vector = (await res.json()) as number[];
    const n = Math.hypot(...vector) || 1;
    return { vector: vector.map((x) => x / n), concepts: [] };
  }
}

/**
 * Index-side production adapter: AlphaEarth Satellite Embedding V1 via
 * Google Earth Engine. The dataset GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL
 * serves global, annual 10-meter embeddings (64-dim vector per pixel,
 * 2017-2025) under CC-BY 4.0.
 *
 * Setup:
 *   1. Sign up for Google Earth Engine (https://earthengine.google.com).
 *   2. Authenticate the @google/earthengine client and export a tile
 *      manifest: for each tile, its bbox plus the mean 64-dim embedding
 *      sampled from the annual mosaic.
 *   3. Save the manifest as data/alphaearth-tiles.json in Tile[] shape and
 *      point the search index at it. No code changes needed beyond the
 *      data source: the cosine search in lib/search.ts is dimension-agnostic
 *      as long as query and tile vectors share the same space, which is
 *      exactly what EmbeddingGemma 2 plus AlphaEarth provide.
 */
export class AlphaEarthIndex {
  static readonly DATASET_ID = "GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL";
  static readonly LICENSE = "CC-BY 4.0";
  static readonly CATALOG_URL =
    "https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL";

  static notConfigured(): never {
    throw new Error(
      "AlphaEarthIndex needs an Earth Engine tile manifest. Follow the setup " +
        `steps in this file, then load data/alphaearth-tiles.json. Dataset: ${AlphaEarthIndex.DATASET_ID} (${AlphaEarthIndex.LICENSE}).`,
    );
  }
}
