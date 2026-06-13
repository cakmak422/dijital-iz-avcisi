import { NextRequest, NextResponse } from "next/server";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import { getLatestNewsForPublic } from "@/lib/newsReadService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 3, 1), 12);
  const result = await getLatestNewsForPublic(limit);
  const items = result.items.map(normalizeNewsItem);
  return NextResponse.json({
    items,
    source: result.source,
    database: result.source === "database",
    runtimeCache: result.source === "runtime-cache",
    fallback: result.source === "seed-fallback"
  });
}
