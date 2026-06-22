import { NextRequest, NextResponse } from "next/server";

const protectedPathPattern   = /^\/ops-console(\/.*)?$/;
const legacyAdminPathPattern  = /^\/admin(\/.*)?$/;

const SESSION_COOKIE = "__Host-dia_session";
const DEV_COOKIE     = "dia_session";
const SESSION_SEP    = ".";
const SESSION_EXPIRY = 28800; // 8 saat

function isProtectedPath(pathname: string)  { return protectedPathPattern.test(pathname);  }
function isLegacyAdminPath(pathname: string) { return legacyAdminPathPattern.test(pathname); }

function getClientIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

function isIpAllowed(request: NextRequest) {
  const allowedIps = (process.env.ADMIN_ALLOWED_IPS ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (allowedIps.length === 0) return true;
  return allowedIps.includes(getClientIp(request));
}

/**
 * Edge runtime'da Web Crypto API ile HMAC doğrulaması.
 * Node crypto kullanılamaz — crypto.subtle kullanılır.
 */
async function verifySessionEdge(token: string): Promise<string | null> {
  const secret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();

  // Secret yoksa: development fallback — sadece token varlığını kontrol et
  if (!secret) {
    if (process.env.NODE_ENV === "production") return null; // production'da fail-secure
    // dev: token formatı geçerliyse role'ü payload'dan çıkar (imzasız kabul)
    const parts = token.split(SESSION_SEP);
    if (parts.length !== 2) return null;
    try {
      const payload = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
      const [, role, iatStr] = payload.split("|");
      const age = Math.floor(Date.now() / 1000) - parseInt(iatStr, 10);
      if (age > SESSION_EXPIRY || age < 0 || !role) return null;
      return role;
    } catch { return null; }
  }

  const parts = token.split(SESSION_SEP);
  if (parts.length !== 2) return null;

  const [payB64, sigB64] = parts;

  try {
    const enc         = new TextEncoder();
    const payload     = atob(payB64.replace(/-/g, "+").replace(/_/g, "/"));
    const sigBytes    = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
    if (!valid) return null;

    const [, role, iatStr] = payload.split("|");
    const age = Math.floor(Date.now() / 1000) - parseInt(iatStr, 10);
    if (age > SESSION_EXPIRY || age < 0 || !role) return null;

    return role;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLegacyAdminPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris-yap";
    loginUrl.searchParams.set("next", "/ops-console");
    return NextResponse.redirect(loginUrl);
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!isIpAllowed(request)) {
    return new NextResponse("Bu alana erişim yetkiniz yok.", { status: 403 });
  }

  const isProduction = process.env.NODE_ENV === "production";
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    (!isProduction ? request.cookies.get(DEV_COOKIE)?.value : undefined);

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris-yap";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // İmzalı çerez doğrulaması (Web Crypto)
  const role = await verifySessionEdge(token);

  if (!role) {
    // Geçersiz/süresi dolmuş token → oturum aç
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris-yap";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== "admin") {
    return new NextResponse("Bu alana erişim yetkiniz yok.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ops-console/:path*"]
};
