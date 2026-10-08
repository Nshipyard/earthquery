"use client";

import { useEffect } from "react";
import { MapContainer, Popup, Rectangle, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { SearchResultItem } from "@/lib/geo";

function FitBounds({
  results,
  selectedId,
}: {
  results: SearchResultItem[];
  selectedId?: string | null;
}) {
  const map = useMap();
  // Selecting a card flies to that tile; new results fit all tiles.
  useEffect(() => {
    if (results.length === 0) return;
    const selected = selectedId ? results.find((r) => r.tile_id === selectedId) : undefined;
    const target = selected ? [selected] : results;
    const pts: [number, number][] = [];
    for (const r of target) {
      pts.push([r.bbox[0], r.bbox[1]], [r.bbox[2], r.bbox[3]]);
    }
    if (selected) {
      map.flyToBounds(pts, { padding: [48, 48], duration: 0.8 });
    } else {
      map.fitBounds(pts, { padding: [28, 28] });
    }
  }, [results, selectedId, map]);
  return null;
}

export default function MapView({
  results,
  selectedId,
  onSelect,
  interactive = true,
  className = "",
  defaultCenter = [43.7, -79.4] as [number, number],
  defaultZoom = 7,
}: {
  results: SearchResultItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  className?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}) {
  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      attributionControl={interactive}
      doubleClickZoom={interactive}
      keyboard={interactive}
      className={className}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      {/*
        Esri World Light Gray Canvas: keyless light basemap that matches the
        site aesthetic. CARTO's light basemap now requires an API key
        (carto.com/basemaps/apikey); to switch back, use
        https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
        with your key and CARTO attribution. Note the {z}/{y}/{x} order below.
      */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
      />
      <FitBounds results={results} selectedId={selectedId} />
      {results.map((r) => {
        const t = Math.max(0.2, r.score / 100);
        const selected = r.tile_id === selectedId;
        return (
          <Rectangle
            key={r.tile_id}
            bounds={[
              [r.bbox[0], r.bbox[1]],
              [r.bbox[2], r.bbox[3]],
            ]}
            pathOptions={{
              color: "#2563eb",
              weight: selected ? 4 : 2,
              fillColor: "#2563eb",
              fillOpacity: 0.1 + t * 0.3,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(r.tile_id) } : undefined}
          >
            <Popup>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.tile_id}</div>
                <div style={{ fontSize: 12, color: "#525252" }}>
                  Score {r.score} · {r.center[0].toFixed(2)}, {r.center[1].toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: "#737373" }}>{r.tags.join(", ")}</div>
              </div>
            </Popup>
          </Rectangle>
        );
      })}
    </MapContainer>
  );
}
