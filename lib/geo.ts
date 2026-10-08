// Shared geographic types for earthquery.

/** Bounding box as [south, west, north, east] in decimal degrees. */
export type BBox = [number, number, number, number];

/** Map center as [lat, lng]. */
export type Center = [number, number];

export interface Tile {
  id: string;
  bbox: BBox;
  center: Center;
  tags: string[];
  /** L2-normalized embedding vector (demo: 64 dims, production: 64 dims AlphaEarth). */
  vector: number[];
}

export interface TileIndexMeta {
  generated_at: string;
  count: number;
  dimensions: number;
  coverage: string;
  demo: boolean;
  note: string;
}

export interface SearchResultItem {
  tile_id: string;
  bbox: BBox;
  center: Center;
  /** Cosine similarity, 0 to 100. */
  score: number;
  tags: string[];
}

export interface SearchResponse {
  query: string;
  provider: string;
  dimensions: number;
  tile_count: number;
  matched_concepts: string[];
  /** Display labels of detected places, e.g. ["Africa"]. Empty when none. */
  matched_places: string[];
  /**
   * Human-readable note when a detected place has no tiles in the demo
   * index (e.g. Antarctica). Null otherwise.
   */
  notice: string | null;
  demo: boolean;
  results: SearchResultItem[];
}

export interface HealthResponse {
  status: string;
  version: string;
  provider: string;
  dimensions: number;
  tiles: number;
  coverage: string;
  demo: boolean;
}
