import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/serverAuth";
import { insertQueryLog, QUERY_TYPES, type QueryType, type RiskLevel } from "@/lib/queryLogDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_RISK_LEVELS = new Set(["Düşük", "Orta", "Yüksek"]);
const MAX_VALUE_LEN = 500;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 istek / dakika / IP
  if (!checkRateLimit(`query-log:${getIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { query_type?: string; query_value?: string; risk_level?: string; user_id?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // query_type doğrulama
  const queryType = body.query_type as QueryType | undefined;
  if (!queryType || !(QUERY_TYPES as readonly string[]).includes(queryType)) {
    return NextResponse.json({ ok: false, error: "Geçersiz query_type." }, { status: 400 });
  }

  // query_value uzunluk sınırı
  const queryValue = (body.query_value ?? "").slice(0, MAX_VALUE_LEN);
  if (!queryValue) {
    return NextResponse.json({ ok: false, error: "query_value gerekli." }, { status: 400 });
  }

  // risk_level doğrulama (null kabul edilir)
  const riskLevel = body.risk_level ?? null;
  if (riskLevel !== null && !VALID_RISK_LEVELS.has(riskLevel)) {
    return NextResponse.json({ ok: false, error: "Geçersiz risk_level." }, { status: 400 });
  }

  // user_id: UUID formatı değilse (örn. "demo-admin") null olarak logla
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const rawUserId = body.user_id ?? null;
  const userId = rawUserId && UUID_RE.test(rawUserId) ? rawUserId : null;

  const { error: insertError } = await insertQueryLog(
    queryType,
    queryValue,
    riskLevel as RiskLevel | null,
    userId
  );

  if (insertError) {
    console.error("[query-log] Supabase insert hatası:", insertError);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
