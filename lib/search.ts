// Vector search over the tile index. Dimension-agnostic: works for the
// 64-dim demo index and for a 64-dim AlphaEarth production manifest alike,
// as long as query and tile vectors share an embedding space.

import type { SearchResponse, SearchResultItem, Tile, TileIndexMeta } from "./geo";
import { DemoEmbeddingProvider } from "./providers";
import tilesJson from "../public/data/tiles.json";
import conceptsJson from "../public/data/concepts.json";

const tiles = tilesJson.tiles as Tile[];
const meta = tilesJson.meta as TileIndexMeta;
const conceptVectors = conceptsJson.vectors as Record<string, number[]>;

const provider = new DemoEmbeddingProvider(conceptVectors);

export function getIndexMeta(): TileIndexMeta {
  return meta;
}

export function getTileCount(): number {
  return tiles.length;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot; // vectors are L2-normalized
}

export function searchTiles(query: string, limit = 12): SearchResponse {
  const embedded = provider.embed(query);
  const safeLimit = Math.max(1, Math.min(limit, 50));

  if (!embedded) {
    return {
      query,
      provider: provider.name,
      dimensions: provider.dimensions,
      tile_count: tiles.length,
      matched_concepts: [],
      demo: provider.isDemo,
      results: [],
    };
  }

  const scored: SearchResultItem[] = tiles.map((t) => ({
    tile_id: t.id,
    bbox: t.bbox,
    center: t.center,
    score: Math.round(cosine(embedded.vector, t.vector) * 100),
    tags: t.tags,
  }));

  scored.sort((a, b) => b.score - a.score);

  return {
    query,
    provider: provider.name,
    dimensions: provider.dimensions,
    tile_count: tiles.length,
    matched_concepts: embedded.concepts,
    demo: provider.isDemo,
    results: scored.slice(0, safeLimit),
  };
}
