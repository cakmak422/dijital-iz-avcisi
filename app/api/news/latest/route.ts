import { NextRequest, NextResponse } from "next/server";
import { getLatestNews } from "@/lib/newsDb";
import { getLatestCyberNews } from "@/lib/newsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 3, 1), 12);
    const items = await getLatestNews(limit);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen haber okuma hatasi";
    console.error("news_latest_endpoint_failed", { error: message });
    return NextResponse.json({ items: getLatestCyberNews(3), fallback: true, errors: [message] }, { status: 200 });
  }
}
