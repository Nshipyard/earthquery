"use client";

import DynamicMapView from "./DynamicMapView";
import type { SearchResponse } from "@/lib/geo";
import DemoBadge from "./DemoBadge";

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${score}%` }} />
    </div>
  );
}

export default function ResultsSection({
  data,
  loading,
  query,
  searched,
  selectedId,
  onSelect,
  tileCount,
}: {
  data: SearchResponse | null;
  loading: boolean;
  query: string;
  searched: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  tileCount: number;
}) {
  if (!searched) return null;

  return (
    <section id="results" className="scroll-mt-24 border-b border-[#ececec] bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {loading ? "Searching…" : data && data.matched_concepts.length === 0 ? "No matches" : `Results for “${query}”`}
          </h2>
          <DemoBadge tiles={tileCount} />
        </div>

        {loading && (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="h-[420px] animate-pulse rounded-2xl bg-neutral-100 lg:col-span-3" />
            <div className="space-y-3 lg:col-span-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          </div>
        )}

        {!loading && searched && !data && (
          <div className="mt-8 rounded-2xl border border-[#ececec] bg-white p-8">
            <p className="text-[15px] font-medium">Search failed to load.</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              The demo API did not respond. Check that the dev server is running
              and try again.
            </p>
          </div>
        )}

        {!loading && data && data.matched_concepts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-[#ececec] bg-white p-8">
            <p className="text-[15px] font-medium">No recognizable concepts in “{query}”.</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              The demo embedder maps keywords to 43 land-use concepts such as
              solar farm, desert, lake, port, and volcano. Try “wind farms near
              coastlines” or “airports” instead.
            </p>
          </div>
        )}

        {!loading && data && data.matched_concepts.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              <span>
                <span className="font-semibold text-[#0a0a0a]">{data.results.length}</span> matches
                across <span className="font-semibold text-[#0a0a0a]">{data.tile_count}</span> tiles
              </span>
              <span>Cosine similarity · {data.dimensions}-dim vectors</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.matched_concepts.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <div className="h-[420px] overflow-hidden rounded-2xl border border-[#ececec] lg:col-span-3 md:h-[520px]">
                <DynamicMapView results={data.results} selectedId={selectedId} onSelect={onSelect} />
              </div>
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 lg:col-span-2">
                {data.results.map((r, i) => {
                  const selected = r.tile_id === selectedId;
                  return (
                    <button
                      key={r.tile_id}
                      type="button"
                      onClick={() => onSelect(r.tile_id)}
                      className={`result-card w-full rounded-2xl border bg-white p-4 text-left transition-all ${
                        selected
                          ? "border-[#2563eb] shadow-[0_0_0_1px_#2563eb]"
                          : "border-[#ececec] hover:border-neutral-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">#{i + 1}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563eb]">
                          {r.score}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[13px] font-medium">{r.tile_id}</p>
                      <ScoreBar score={r.score} />
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-neutral-400">
                        {r.center[0].toFixed(3)}, {r.center[1].toFixed(3)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
