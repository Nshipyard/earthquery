"use client";

import { useEffect, useState } from "react";
import DynamicMapView from "./DynamicMapView";
import type { SearchResponse } from "@/lib/geo";

const SAMPLE_QUERY = "solar farms in deserts";

function BrowserChrome({ query }: { query: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#ececec] px-4 py-3">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
      </div>
      <div className="min-w-0 flex-1 truncate rounded-full bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500">
        earthquery.app/?q={encodeURIComponent(query)}
      </div>
    </div>
  );
}

export default function HeroPreview() {
  const [data, setData] = useState<SearchResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(SAMPLE_QUERY)}&limit=6`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const results = data?.results ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <BrowserChrome query={SAMPLE_QUERY} />
      <div className="grid md:grid-cols-5">
        <div className="relative h-64 md:col-span-3 md:h-auto md:min-h-80">
          <DynamicMapView results={results} interactive={false} />
        </div>
        <div className="border-t border-[#ececec] md:col-span-2 md:border-l md:border-t-0">
          <div className="border-b border-[#ececec] px-4 py-3">
            <p className="text-xs text-neutral-500">
              Query <span className="font-medium text-[#0a0a0a]">“{SAMPLE_QUERY}”</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {data
                ? `${results.length} matches · cosine similarity over 64-dim vectors`
                : "Searching demo index…"}
            </p>
          </div>
          <ul className="divide-y divide-[#f1f1f1]">
            {results.slice(0, 4).map((r) => (
              <li key={r.tile_id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-neutral-500">{r.tile_id}</span>
                  <span className="text-xs font-semibold text-[#2563eb]">{r.score}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${r.score}%` }} />
                </div>
                <p className="mt-1.5 truncate text-xs text-neutral-500">{r.tags.join(" · ")}</p>
              </li>
            ))}
            {!data &&
              [0, 1, 2, 3].map((i) => (
                <li key={i} className="animate-pulse px-4 py-3">
                  <div className="h-3 w-2/3 rounded bg-neutral-100" />
                  <div className="mt-2 h-1 rounded bg-neutral-100" />
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
