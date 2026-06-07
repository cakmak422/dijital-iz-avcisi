import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchLatestCyberNews } from "@/lib/newsFetcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "News fetch temporarily disabled in production"
    });
  }

  const cookieStore = await cookies();
  const authorization = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  const sessionCookie = cookieStore.get("__Host-dia_session")?.value;
  const sessionRole = cookieStore.get("__Host-dia_role")?.value;
  const hasAdminSession = Boolean(sessionCookie && sessionRole === "admin");

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    if (authorization !== expected && !hasAdminSession) {
      return NextResponse.json({ error: "Yetkisiz istek." }, { status: 401 });
    }
  } else {
    console.warn("CRON_SECRET tanımlı değil. /api/news/fetch development modunda korumasız çalışıyor.");
  }

  try {
    const result = await fetchLatestCyberNews();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen haber güncelleme hatası";
    console.error("news_fetch_endpoint_failed", { error: message });
    return NextResponse.json(
      {
        found: 0,
        processedLimit: { perSource: 10, total: 30, processed: 0 },
        inserted: 0,
        skipped: 0,
        failed: 1,
        errors: [message],
        items: [],
        sources: []
      },
      { status: 200 }
    );
  }
}
