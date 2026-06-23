import { NextRequest, NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const code  = (body.code  ?? "").trim();

  if (!email || !code) {
    return NextResponse.json({ ok: false, error: "E-posta ve kod gerekli." }, { status: 400 });
  }

  // RESEND_API_KEY burada, sunucu tarafında güvenle okunur
  const result = await sendOtpEmail(email, code);

  if (!result.delivered) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "E-posta gönderilemedi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
