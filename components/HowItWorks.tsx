export default function HowItWorks({ tileCount }: { tileCount: number }) {
  const STEPS = [
    {
      n: "01",
      title: "You ask in plain English",
      body: "“solar farms in deserts” or “golf courses near lakes”. No GIS syntax, no bounding-box math, no band indices.",
    },
    {
      n: "02",
      title: "The query becomes a vector",
      body: "EmbeddingGemma 2 maps text into a shared 768-dim space. The demo uses 64-dim concept vectors from keyword matching behind the identical interface.",
    },
    {
      n: "03",
      title: "Cosine search over tile embeddings",
      body: `Every tile is scored against the query vector. The demo ranks ${tileCount} tiles; production ranks AlphaEarth's global 10m embeddings in Earth Engine.`,
    },
    {
      n: "04",
      title: "Ranked footprints on a map",
      body: "Top tiles render as map rectangles with scores. GET /api/search returns the same ranking as JSON, so agents skip the UI entirely.",
    },
  ];

  const COMPARISON: [string, string, string][] = [
    ["Query embedding", "Keyword to concept map, 64-dim", "EmbeddingGemma 2, 768-dim, via Hugging Face"],
    ["Tile index", `${tileCount} seeded tiles, generated locally`, "AlphaEarth V1 annual mosaic, Google Earth Engine"],
    ["Coverage", "Southern Ontario + 22 world regions", "Global, 10m resolution, 2017-2025"],
    ["Vectors", "Simulated from concept tags", "Measured from multi-sensor satellite imagery"],
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 md:py-28">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#2563eb]">How it works</p>
      <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
        From a sentence to a map.
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-600">
        The architecture is the product: an embedding model turns language into
        vectors, and vector search turns vectors into places. v1 proves the loop
        on a demo index; the production column shows what replaces each part.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-[#ececec] bg-white p-6 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          >
            <p className="font-mono text-xs font-semibold text-[#2563eb]">{s.n}</p>
            <h3 className="mt-3 text-[15px] font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 overflow-hidden rounded-2xl border border-[#ececec]">
        <div className="grid grid-cols-3 bg-neutral-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          <span>Layer</span>
          <span>Demo (v1)</span>
          <span>Production path</span>
        </div>
        {COMPARISON.map(([layer, demo, prod], i) => (
          <div
            key={layer}
            className={`grid grid-cols-3 gap-4 px-6 py-4 text-sm ${i % 2 === 1 ? "bg-neutral-50/60" : "bg-white"}`}
          >
            <span className="font-medium">{layer}</span>
            <span className="text-neutral-600">{demo}</span>
            <span className="text-neutral-600">{prod}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        Integration code for both production adapters lives in lib/providers.ts. Demo results are never presented as satellite analysis.
      </p>
    </section>
  );
}
