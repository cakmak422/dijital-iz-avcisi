import { NextRequest, NextResponse } from "next/server";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import { getLatestRuntimeNews } from "@/lib/newsRuntimeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 3, 1), 12);
  const items = (await getLatestRuntimeNews(limit)).map(normalizeNewsItem);
  return NextResponse.json({ items, fallback: true, dbDisabled: true, runtimeCache: true });
}
