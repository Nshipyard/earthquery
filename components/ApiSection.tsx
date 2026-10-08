const CURL = `curl "https://earthquery-mauve.vercel.app/api/search?q=solar+farms+in+deserts&limit=3"`;

const RESPONSE = `{
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
}`;

const PARAMS = [
  {
    name: "q",
    req: "required",
    desc: "Plain-English query, e.g. “golf courses near lakes”. Empty q returns 400.",
  },
  {
    name: "limit",
    req: "optional",
    desc: "Max results, 1 to 50. Defaults to 12.",
  },
];

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/search?q=…&limit=12",
    desc: "Ranked tile matches for a natural-language query. Returns 400 when q is missing.",
  },
  {
    method: "GET",
    path: "/api/health",
    desc: "Status, provider name, vector dimensions, tile count, and coverage.",
  },
  {
    method: "GET",
    path: "/llms.txt",
    desc: "Agent-readable project description, API summary, and demo status.",
  },
];

export default function ApiSection() {
  return (
    <section id="api" className="scroll-mt-24 border-y border-[#ececec] bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#2563eb]">API</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
          Built for agents, not just browsers.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-600">
          Every search the UI performs is a plain GET request. Agents use the
          same endpoint with no API key in v1, and /llms.txt tells them exactly
          what the demo index can and cannot do.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-white">
            <div className="border-b border-[#ececec] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Request
            </div>
            <pre className="p-5 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-neutral-800">
              {CURL}
            </pre>
            <div className="border-t border-[#ececec] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Parameters
              </p>
              <dl className="mt-3 space-y-3">
                {PARAMS.map((p) => (
                  <div key={p.name} className="flex gap-3 text-sm">
                    <code className="shrink-0 font-mono text-[13px] font-semibold text-[#0a0a0a]">
                      {p.name}
                    </code>
                    <div>
                      <span
                        className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.req === "required"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {p.req}
                      </span>
                      <span className="text-neutral-600">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
                Scores are cosine similarity scaled to 0-100. Every response
                carries a demo flag and the matched concepts, so agents can
                tell simulated vectors from measured ones.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white">
            <div className="border-b border-[#ececec] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Response <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 font-sans text-[11px] font-medium normal-case tracking-normal text-blue-700">demo data</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-neutral-800">
              {RESPONSE}
            </pre>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {ENDPOINTS.map((e) => (
            <div
              key={e.path}
              className="flex flex-col gap-1 rounded-2xl border border-[#ececec] bg-white px-5 py-4 md:flex-row md:items-center md:gap-6"
            >
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs font-semibold">
                  {e.method}
                </span>
                <code className="font-mono text-[13px] text-[#2563eb]">{e.path}</code>
              </div>
              <p className="text-sm text-neutral-600 md:ml-auto">{e.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/api/search?q=solar+farms+in+deserts"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#0a0a0a] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Try it live
          </a>
          <a
            href="/llms.txt"
            className="rounded-full border border-[#ececec] bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-neutral-300"
          >
            Read llms.txt
          </a>
        </div>
      </div>
    </section>
  );
}
