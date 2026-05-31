import { NextRequest, NextResponse } from "next/server";
import { getLatestNews } from "@/lib/newsDb";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 3, 1), 12);
  const items = await getLatestNews(limit);
  return NextResponse.json({ items });
}

