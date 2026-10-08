// Demo gazetteer: place name -> bounding box.
//
// Lets the demo search honor "<thing> in <place>" queries (e.g. "solar farms
// in africa"). Without this, geographic tokens were silently dropped and a
// query for Africa could return tiles in Ontario, which reads as broken.
//
// DEMO ONLY. The list is intentionally small and matched to the demo index's
// actual coverage (Southern Ontario grid + world anchors). Production would
// use a real geocoder. Bboxes are [south, west, north, east] in degrees.

import type { BBox, Center } from "./geo";

export interface Place {
  /** Canonical key, e.g. "africa". */
  name: string;
  /** Display label, e.g. "Africa". */
  label: string;
  bbox: BBox;
}

export const PLACES: Place[] = [
  { name: "africa", label: "Africa", bbox: [-35, -20, 37, 55] },
  { name: "europe", label: "Europe", bbox: [36, -25, 71, 45] },
  { name: "asia", label: "Asia", bbox: [-10, 45, 80, 180] },
  { name: "north america", label: "North America", bbox: [5, -170, 72, -55] },
  { name: "south america", label: "South America", bbox: [-56, -82, 12, -35] },
  { name: "oceania", label: "Oceania", bbox: [-50, 110, 0, 180] },
  { name: "sahara", label: "Sahara", bbox: [16, -17, 28, 34] },
  { name: "amazon", label: "Amazon", bbox: [-12, -74, 5, -44] },
  { name: "middle east", label: "Middle East", bbox: [12, 35, 42, 60] },
  { name: "antarctica", label: "Antarctica", bbox: [-90, -180, -60, 180] },
];

const ALIASES: Record<string, string> = {
  african: "africa",
  european: "europe",
  asian: "asia",
};

/** Whole-word place detection. Returns matched places in gazetteer order. */
export function parsePlaces(query: string): Place[] {
  const padded = ` ${query.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ")} `;
  const found: Place[] = [];
  for (const p of PLACES) {
    if (padded.includes(` ${p.name} `)) found.push(p);
  }
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (padded.includes(` ${alias} `) && !found.some((f) => f.name === target)) {
      const t = PLACES.find((p) => p.name === target);
      if (t) found.push(t);
    }
  }
  return found;
}

export function centerInBbox(center: Center, bbox: BBox): boolean {
  const [lat, lng] = center;
  const [south, west, north, east] = bbox;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

export function centerInAnyBbox(center: Center, places: Place[]): boolean {
  return places.some((p) => centerInBbox(center, p.bbox));
}
