import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/serverAuth";
import { insertContactMessage } from "@/lib/contactDb";
import { isValidEmail, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  // Sunucu taraflı rate limit: 3 mesaj / 10 dakika / IP
  if (!checkRateLimit(`contact:${getIp(request)}`, 3, 600_000)) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla mesaj isteği. Lütfen 10 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: { name?: string; email?: string; topic?: string; message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const name    = sanitizeText(body.name ?? "", 80);
  const email   = sanitizeText(body.email ?? "", 120).toLowerCase();
  const topic   = sanitizeText(body.topic ?? "", 80);
  const message = sanitizeMultiline(body.message ?? "", 1000);

  if (!name || !email || !topic || !message) {
    return NextResponse.json({ ok: false, error: "Tüm alanlar zorunludur." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Geçersiz e-posta adresi." }, { status: 400 });
  }

  const { id, error } = await insertContactMessage({ name, email, topic, message });
  if (error || !id) {
    console.error("[contact] Supabase insert hatası:", error);
    return NextResponse.json(
      { ok: false, error: "Mesaj kaydedilemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id });
}
