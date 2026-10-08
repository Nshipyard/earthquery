export default function Faq({ tileCount }: { tileCount: number }) {
  const ITEMS = [
  {
    q: "Is this real satellite analysis?",
    a: `No. v1 searches a bundled demo index of ${tileCount} tiles whose vectors are deterministic concept vectors, not measurements from satellite imagery. The pipeline itself is real: query to embedding to cosine search to ranked tiles. The README documents exactly what is simulated and how to replace it.`,
  },
  {
    q: "What models does the production design use?",
    a: "EmbeddingGemma 2 (Google, released October 2026, Apache 2.0) turns queries into vectors in a shared multimodal space. AlphaEarth Satellite Embedding V1 (CC-BY 4.0, served in Google Earth Engine) provides 64-dim embeddings per 10m pixel globally. lib/providers.ts contains the integration code for both.",
  },
  {
    q: "How do I connect a real Earth Engine index?",
    a: "Authenticate the Earth Engine client, sample mean 64-dim embeddings per tile from GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL, and save the result as data/alphaearth-tiles.json in the Tile shape. The cosine search in lib/search.ts is dimension-agnostic, so no search code changes are needed.",
  },
  {
    q: "What does GET /api/search return?",
    a: "JSON with the query, the provider name, matched concepts, and a ranked results array. Each result carries tile_id, bbox as [south, west, north, east], center as [lat, lng], a 0 to 100 similarity score, and concept tags.",
  },
  {
    q: "Can I add my own region to the demo index?",
    a: "Yes. Add an anchor entry to the ANCHORS array in scripts/generate-tiles.mjs, or widen the Ontario grid bounds, then run node scripts/generate-tiles.mjs and restart the dev server. The index regenerates deterministically from seeds.",
  },
  {
    q: "What are the licenses?",
    a: "The code is MIT. AlphaEarth embeddings are CC-BY 4.0. EmbeddingGemma 2 is Apache 2.0. Map tiles are copyright Esri (World Light Gray basemap).",
  },
];

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-20 md:py-28">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#2563eb]">FAQ</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        Questions, answered plainly
      </h2>
      <div className="mt-10 space-y-3">
        {ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-[#ececec] bg-white px-6 py-4 transition-shadow hover:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
