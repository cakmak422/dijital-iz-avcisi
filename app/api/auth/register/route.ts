import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/serverAuth";
import {
  verifyOtp,
  createUser,
  emailExists,
  usernameExists,
} from "@/lib/userDb";
import { isValidEmail, sanitizeText } from "@/lib/sanitize";

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
  // Rate limit: 5 istek / 10 dakika / IP
  if (!checkRateLimit(`register:${getIp(request)}`, 5, 600_000)) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla kayıt denemesi. Lütfen 10 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: {
    email?: string;
    code?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    phone?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  // ── Alan doğrulama ────────────────────────────────────────────────────────────

  const email     = sanitizeText(body.email ?? "", 120).toLowerCase();
  const code      = (body.code ?? "").trim();
  const username  = sanitizeText(body.username ?? "", 40);
  const firstName = sanitizeText(body.firstName ?? "", 60);
  const lastName  = sanitizeText(body.lastName ?? "", 60);
  const birthDate = sanitizeText(body.birthDate ?? "", 20);
  const phone     = sanitizeText(body.phone ?? "", 30);
  const password  = (body.password ?? "").trim().slice(0, 128);

  if (!email || !code || !username || !firstName || !lastName || !birthDate || !phone || !password) {
    return NextResponse.json({ ok: false, error: "Tüm alanlar zorunludur." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Geçersiz e-posta adresi." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Şifre en az 8 karakter olmalıdır." }, { status: 400 });
  }
  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Doğrulama kodu 6 haneli olmalıdır." }, { status: 400 });
  }

  // ── OTP doğrulama (sunucu taraflı) ───────────────────────────────────────────

  const otpValid = await verifyOtp(email, code);
  if (!otpValid) {
    return NextResponse.json(
      { ok: false, error: "Doğrulama kodu hatalı veya süresi dolmuş. Yeni kod isteyin." },
      { status: 400 }
    );
  }

  // ── Tekrar kayıt kontrolü ─────────────────────────────────────────────────────

  const [emailTaken, usernameTaken] = await Promise.all([
    emailExists(email),
    usernameExists(username),
  ]);

  if (emailTaken) {
    return NextResponse.json(
      { ok: false, error: "Bu e-posta adresi zaten kayıtlı." },
      { status: 409 }
    );
  }
  if (usernameTaken) {
    return NextResponse.json(
      { ok: false, error: "Bu kullanıcı adı zaten alınmış." },
      { status: 409 }
    );
  }

  // ── Kullanıcı oluştur (şifre burada hash'lenir) ───────────────────────────────

  const { user, error: createError } = await createUser({
    username,
    email,
    firstName,
    lastName,
    birthDate,
    phone,
    password, // createUser içinde hashPassword() çağrılır
  });

  if (createError || !user) {
    console.error("[register] Kullanıcı oluşturulamadı:", createError);
    return NextResponse.json(
      { ok: false, error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
