---
name: earthquery
description: Natural-language search over satellite imagery tile embeddings. Use when an agent needs locations matching a plain-English description (e.g. "solar farms in deserts", "container ports") via the earthquery JSON API. Returns ranked tile footprints with bounding boxes, scores, and concept tags.
---

# earthquery skill

earthquery answers geographic questions with vector search. You describe what you
are looking for in plain English; it returns the tiles whose embeddings match,
ranked by cosine similarity.

## Demo status (read this first)

v1 runs on a **demo index**: 521 tiles (Southern Ontario grid + 22 world-region
anchors) with deterministic 64-dim concept vectors. These are NOT satellite
measurements. Treat results as pipeline demonstrations, never as real
Earth-observation findings. The `demo: true` field in every API response marks
this. Production design (AlphaEarth via Earth Engine + EmbeddingGemma 2) is
documented in README.md and lib/providers.ts.

## API

Base URL: `https://earthquery-mauve.vercel.app` (local dev: `http://localhost:3000`). No key in v1.

### Search

`GET /api/search?q=<query>&limit=<1-50, default 12>`

Response:

```json
{
  "query": "solar farms in deserts",
  "provider": "demo-concept-embedder",
  "dimensions": 64,
  "tile_count": 521,
  "matched_concepts": ["solar farm", "desert"],
  "matched_places": [],
  "notice": null,
  "demo": true,
  "results": [
    {
      "tile_id": "w-sahara-12",
      "bbox": [23.52, 12.84, 23.64, 12.96],
      "center": [23.58, 12.9],
      "score": 94,
      "tags": ["desert", "solar farm"]
    }
  ]
}
```

- `bbox` is `[south, west, north, east]` in decimal degrees.
- `score` is cosine similarity scaled to 0-100.
- Empty `results` with empty `matched_concepts` means the query matched no known
  concept; rephrase with concrete land-use terms (see concept list below).

### Health

`GET /api/health` returns `{ status, version, provider, dimensions, tiles, coverage, demo }`.

## Concept vocabulary (demo embedder)

The demo query embedder recognizes about 90 keywords mapping to 43 concepts:
lake, forest, farmland, urban, downtown, suburb, river, desert, solar farm,
golf course, airport, container terminal, port, highway, beach, mountain,
glacier, wetland, rice paddy, vineyard, ski resort, dam, reservoir, mining,
quarry, oil field, wind farm, industrial, park, stadium, campus, bridge, canal,
island, coastline, reef, volcano, tundra, savanna, jungle, mangrove, bay,
geothermal.

## Example workflow

1. Check `/api/health` for index status and tile count.
2. Call `/api/search?q=golf+courses+near+lakes` and read `matched_concepts` to
   confirm the query was understood.
3. Use the top results' `bbox` values to frame follow-up questions or map views.
4. Always surface the demo status when quoting results to a human.
