import { NextRequest, NextResponse } from "next/server";
import { searchTiles } from "@/lib/search";

/**
 * GET /api/search?q=solar+farms+in+deserts&limit=12
 * Natural-language search over the tile embedding index.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const limit = Math.max(
    1,
    Math.min(50, Number.parseInt(params.get("limit") ?? "12", 10) || 12),
  );

  if (!q.trim()) {
    return NextResponse.json(
      {
        error: 'Missing required query parameter "q".',
        example: "/api/search?q=solar+farms+in+deserts",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(searchTiles(q, limit));
}
