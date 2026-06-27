import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/serverAuth";
import {
  getUserByIdentifierWithHash,
  verifyPassword,
  updateLoginMeta,
  incrementLoginCount,
  dbUserToUser,
} from "@/lib/userDb";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Başarısız girişte hangisinin yanlış olduğunu sızdırmıyoruz
const GENERIC_ERROR = "E-posta veya şifre hatalı.";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 istek / 15 dakika / IP
  if (!checkRateLimit(`login:${getIp(request)}`, 10, 900_000)) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: { identifier?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const identifier = sanitizeText(body.identifier ?? "", 120).toLowerCase();
  const password   = (body.password ?? "").trim().slice(0, 128);

  if (!identifier || !password) {
    return NextResponse.json({ ok: false, error: "Tüm alanlar zorunludur." }, { status: 400 });
  }

  // Kullanıcıyı bul (password_hash dahil)
  const { user, error: dbError } = await getUserByIdentifierWithHash(identifier);

  if (dbError) {
    console.error("[login] Veritabanı hatası:", dbError);
    return NextResponse.json({ ok: false, error: "Giriş sırasında bir hata oluştu." }, { status: 500 });
  }

  // Kullanıcı bulunamadı → genel hata (hangisinin yanlış olduğunu sızdırmıyoruz)
  if (!user) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  // Şifre doğrulama
  const passwordOk = verifyPassword(password, user.password_hash);
  if (!passwordOk) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  // Hesap durumu kontrolleri
  if (!user.email_verified) {
    return NextResponse.json(
      { ok: false, error: "E-posta adresiniz doğrulanmamış." },
      { status: 403 }
    );
  }
  if (user.status === "blocked") {
    return NextResponse.json(
      { ok: false, error: "Hesabınız engellendi. Destek için iletişime geçin." },
      { status: 403 }
    );
  }
  if (user.status === "pending") {
    return NextResponse.json(
      { ok: false, error: "Hesabınız henüz onaylanmamış." },
      { status: 403 }
    );
  }

  // Meta güncelle (paralel — başarısız olsa da girişi engelleme)
  const ip = getIp(request);
  void Promise.all([
    updateLoginMeta(user.id, ip),
    incrementLoginCount(user.id),
  ]).catch(err => console.error("[login] Meta güncelleme hatası:", err));

  // password_hash'siz kullanıcı döndür
  return NextResponse.json({
    ok:          true,
    user:        dbUserToUser(user),
    lastKnownIp: ip,
    lastLoginAt: new Date().toISOString(),
  });
}
