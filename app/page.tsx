import { Suspense } from "react";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeClient from "@/components/HomeClient";
import { getTileCount } from "@/lib/search";
import type { SearchResponse } from "@/lib/geo";

// Deep-link queries (?q=...) are resolved on the server inside a Suspense
// boundary (required by cacheComponents). The client receives plain props,
// so it never needs useSearchParams() or render-time promise caching
// (both caused infinite fetch loops).
async function getInitialData(q: string): Promise<SearchResponse | null> {
  if (!q) return null;
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const res = await fetch(
      `${proto}://${host}/api/search?q=${encodeURIComponent(q)}&limit=12`,
      { cache: "no-store" },
    );
    return res.ok ? ((await res.json()) as SearchResponse) : null;
  } catch {
    return null;
  }
}

async function HomeLoader({
  searchParams,
  tileCount,
}: {
  searchParams: Promise<{ q?: string }>;
  tileCount: number;
}) {
  const { q } = await searchParams;
  const initialQuery = q ?? "";
  const initialData = await getInitialData(initialQuery);
  return (
    <HomeClient
      tileCount={tileCount}
      initialQuery={initialQuery}
      initialData={initialData}
    />
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const tileCount = getTileCount();
  return (
    <div id="top" className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={null}>
          <HomeLoader searchParams={searchParams} tileCount={tileCount} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
