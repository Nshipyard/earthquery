"use client";

import { useCallback, useState } from "react";
import type { SearchResponse } from "@/lib/geo";
import Hero from "./Hero";
import ResultsSection from "./ResultsSection";
import HowItWorks from "./HowItWorks";
import ApiSection from "./ApiSection";
import Faq from "./Faq";

export default function HomeClient({
  tileCount,
  initialQuery,
  initialData,
}: {
  tileCount: number;
  initialQuery: string;
  initialData: SearchResponse | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<SearchResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(initialQuery.length > 0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    setSelectedId(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=12`);
      setData(res.ok ? ((await res.json()) as SearchResponse) : null);
      window.history.replaceState(null, "", `/?q=${encodeURIComponent(trimmed)}`);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    runSearch(query);
    window.setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, [query, runSearch]);

  return (
    <>
      <Hero query={query} onQueryChange={setQuery} onSubmit={handleSubmit} tileCount={tileCount} />
      <ResultsSection
        data={data}
        loading={loading}
        query={data?.query ?? query}
        searched={searched}
        selectedId={selectedId}
        onSelect={setSelectedId}
        tileCount={tileCount}
      />
      <HowItWorks />
      <ApiSection />
      <Faq />
    </>
  );
}
