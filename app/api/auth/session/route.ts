import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  checkSessionRateLimit,
  signSession,
  verifyAdminPassphrase,
  SESSION_COOKIE,
  DEV_COOKIE
} from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE = 28800; // 8 saat

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isSecureEnv() {
  return process.env.NODE_ENV === "production";
}

/** POST — Oturum oluştur (imzalı HttpOnly çerez yaz) */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  // Rate limit — aynı IP'den dakikada en fazla 5 deneme
  if (!checkSessionRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla giriş denemesi. 1 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: { role?: string; userId?: string; passphrase?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek formatı." }, { status: 400 });
  }

  const role       = (body.role ?? "user").trim();
  const userId     = (body.userId ?? "").trim();
  const passphrase = (body.passphrase ?? "").trim();

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Kullanıcı bilgisi eksik." }, { status: 400 });
  }

  // Admin için sunucu taraflı passphrase doğrulaması — role alanına körü körüne güvenilmez
  if (role === "admin") {
    if (!passphrase) {
      return NextResponse.json({ ok: false, error: "Admin girişi için şifre gerekli." }, { status: 401 });
    }
    if (!verifyAdminPassphrase(passphrase)) {
      return NextResponse.json({ ok: false, error: "Geçersiz admin şifresi." }, { status: 401 });
    }
  }

  let token: string;
  try {
    token = signSession(userId, role);
  } catch {
    // ADMIN_SESSION_SECRET tanımlı değil (production'da zorunlu)
    return NextResponse.json(
      { ok: false, error: "Sunucu oturum yapılandırması eksik. ADMIN_SESSION_SECRET tanımlanmalıdır." },
      { status: 503 }
    );
  }

  const secure = isSecureEnv();
  const name   = secure ? SESSION_COOKIE : DEV_COOKIE;

  const cookieStore = await cookies();
  cookieStore.set(name, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path:     "/",
    maxAge:   COOKIE_MAX_AGE
  });

  const lastKnownIp = clientIp(request);
  const lastLoginAt = new Date().toISOString();

  return NextResponse.json({ ok: true, lastKnownIp, lastLoginAt });
}

/** DELETE — Oturumu kapat (çerezi temizle) */
export async function DELETE() {
  const secure = isSecureEnv();
  const cookieStore = await cookies();

  // Yeni imzalı çerez
  cookieStore.set(secure ? SESSION_COOKIE : DEV_COOKIE, "", {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0
  });

  // Eski imzasız çerezleri de temizle (geçiş dönemi)
  cookieStore.set("dia_session", "", { path: "/", maxAge: 0 });
  cookieStore.set("dia_role",    "", { path: "/", maxAge: 0 });
  cookieStore.set("__Host-dia_session", "", { path: "/", secure: true, maxAge: 0 });
  cookieStore.set("__Host-dia_role",    "", { path: "/", secure: true, maxAge: 0 });

  return NextResponse.json({ ok: true });
}
