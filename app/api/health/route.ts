import { NextResponse } from "next/server";
import { getIndexMeta, getTileCount } from "@/lib/search";

/** GET /api/health: service status and index metadata. */
export async function GET() {
  const meta = getIndexMeta();
  return NextResponse.json({
    status: "ok",
    version: "0.1.0",
    provider: "demo-concept-embedder",
    dimensions: meta.dimensions,
    tiles: getTileCount(),
    coverage: meta.coverage,
    demo: true,
  });
}
