"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { SearchResponse } from "@/lib/geo";
import Hero from "./Hero";
import ResultsSection from "./ResultsSection";
import HowItWorks from "./HowItWorks";
import ApiSection from "./ApiSection";
import Faq from "./Faq";
import {
  getAiServerSnapshot,
  getAiSnapshot,
  getToken,
  openAiPanel,
  subscribeAi,
} from "@/lib/ai-settings";
import { liveSearch } from "@/lib/live-search";

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
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [searched, setSearched] = useState(initialQuery.length > 0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ai = useSyncExternalStore(subscribeAi, getAiSnapshot, getAiServerSnapshot);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setLoading(true);
      setSearched(true);
      setSelectedId(null);
      setAiError(null);
      setLoadingMessage(null);
      try {
        if (ai.enabled && getToken()) {
          // AI search: real embeddings in the browser with the user's key.
          const result = await liveSearch(trimmed, (done, total) => {
            if (done < total) setLoadingMessage(`Warming up AI search… ${done}/${total} concepts`);
            else setLoadingMessage("Embedding your query…");
          });
          setData(result);
        } else {
          const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=12`);
          setData(res.ok ? ((await res.json()) as SearchResponse) : null);
        }
        window.history.replaceState(null, "", `/?q=${encodeURIComponent(trimmed)}`);
      } catch (e) {
        setData(null);
        setAiError(
          e instanceof Error
            ? e.message
            : "AI search failed. Check your key in AI search settings.",
        );
      } finally {
        setLoading(false);
        setLoadingMessage(null);
      }
    },
    [ai.enabled],
  );

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
        loadingMessage={loadingMessage}
        aiError={aiError}
        onOpenAiSettings={openAiPanel}
        aiActive={ai.enabled}
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
