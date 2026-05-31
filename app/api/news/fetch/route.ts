import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchLatestCyberNews } from "@/lib/newsFetcher";

export async function POST(request: Request) {
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
  } else if (process.env.NODE_ENV !== "production") {
    console.warn("CRON_SECRET tanimli degil. /api/news/fetch development modunda korunmasiz calisiyor.");
  } else if (!hasAdminSession) {
    return NextResponse.json({ error: "Yetkisiz istek." }, { status: 401 });
  }

  const result = await fetchLatestCyberNews();
  return NextResponse.json(result);
}
