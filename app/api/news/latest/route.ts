import { NextRequest, NextResponse } from "next/server";
import { getNewsDbDebugState } from "@/lib/newsDb";
import { normalizeNewsItem } from "@/lib/newsNormalizer";
import { getLatestNewsForPublic } from "@/lib/newsReadService";
import { getNewsDisplayFields, type CyberNewsItem } from "@/lib/newsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 30, 1), 60);
  const result = await getLatestNewsForPublic(limit);
  const items = result.items.map(normalizeNewsItem).map(toPublicNewsItem).filter((item): item is CyberNewsItem => Boolean(item));
  const dbDebug = getNewsDbDebugState();
  return NextResponse.json({
    items,
    source: result.source,
    count: items.length,
    dbEnabled: result.dbEnabled,
    dbCount: result.sourceBreakdown.database,
    runtimeCacheCount: result.sourceBreakdown.runtimeCache,
    seedCount: result.sourceBreakdown.seedFallback,
    supabaseUrlPresent: dbDebug.supabaseUrlPresent,
    supabaseServiceRolePresent: dbDebug.supabaseServiceRolePresent,
    dbReadOk: dbDebug.dbReadOk,
    dbReadStatus: dbDebug.dbReadStatus,
    dbReadError: dbDebug.dbReadError,
    dbWriteOk: dbDebug.dbWriteOk,
    dbWriteStatus: dbDebug.dbWriteStatus,
    dbWriteError: dbDebug.dbWriteError,
    limit,
    generatedAt: new Date().toISOString(),
    sourceBreakdown: result.sourceBreakdown
  });
}

function toPublicNewsItem(item: CyberNewsItem): CyberNewsItem | null {
  const display = getNewsDisplayFields(item);
  if (!display || display.translationStatus === "missing") return null;

  return {
    ...item,
    displayTitle: display.displayTitle,
    displaySummary: display.displaySummary,
    translationStatus: display.translationStatus
  };
}
