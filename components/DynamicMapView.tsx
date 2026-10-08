"use client";

import dynamic from "next/dynamic";

/**
 * Client-only Leaflet map, shared by the hero preview and the results
 * section. Single dynamic() call site so the MapView chunk loads once and
 * is reused everywhere.
 */
const DynamicMapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
      Loading map…
    </div>
  ),
});

export default DynamicMapView;
