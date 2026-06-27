import { NextResponse } from "next/server";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { getQueryStats } from "@/lib/queryLogDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const stats = await getQueryStats();
  return NextResponse.json({ ok: true, ...stats });
}
