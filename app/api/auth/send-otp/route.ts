import { NextRequest, NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { saveOtp } from "@/lib/userDb";
import { checkRateLimit } from "@/lib/serverAuth";

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
  // Rate limit: aynı IP'den 3 istek / 10 dakika
  if (!checkRateLimit(`otp:${getIp(request)}`, 3, 600_000)) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla OTP isteği. Lütfen 10 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: "E-posta gerekli." }, { status: 400 });
  }

  // Kodu SUNUCUDA üret — client'a göndermiyoruz
  const code = String(Math.floor(100_000 + Math.random() * 900_000));

  // Hash'ini Supabase'e kaydet (eski kullanılmamış kodları da geçersiz kılar)
  const { error: dbError } = await saveOtp(email, code);
  if (dbError) {
    console.error("[send-otp] Supabase kayıt hatası:", dbError);
    return NextResponse.json(
      { ok: false, error: "Doğrulama kodu kaydedilemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  // E-postayı gönder
  const result = await sendOtpEmail(email, code);
  if (!result.delivered) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "E-posta gönderilemedi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
