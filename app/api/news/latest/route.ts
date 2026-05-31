import { NextRequest, NextResponse } from "next/server";
import { getLatestCyberNews } from "@/lib/newsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 3, 1), 12);
  return NextResponse.json({ items: getLatestCyberNews(limit), fallback: true, dbDisabled: true });
}
