import { NextRequest, NextResponse } from "next/server";

const protectedPathPattern = /^\/ops-console(\/.*)?$/;
const legacyAdminPathPattern = /^\/admin(\/.*)?$/;

function isProtectedPath(pathname: string) {
  return protectedPathPattern.test(pathname);
}

function isLegacyAdminPath(pathname: string) {
  return legacyAdminPathPattern.test(pathname);
}

function getClientIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

function isIpAllowed(request: NextRequest) {
  const allowedIps = (process.env.ADMIN_ALLOWED_IPS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedIps.length === 0) {
    return true;
  }

  // TODO: Production reverse proxy arkasinda CF-Connecting-IP header'i okunarak
  // admin IP allowlist kontrolu backend/session katmaniyla birlikte guclendirilecek.
  return allowedIps.includes(getClientIp(request));
}

export function proxy(request: NextRequest) {
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
    return new NextResponse("Bu alana erisim yetkiniz yok.", { status: 403 });
  }

  const allowDemoCookies = process.env.NODE_ENV !== "production";
  const sessionCookie = request.cookies.get("__Host-dia_session")?.value ?? (allowDemoCookies ? request.cookies.get("dia_session")?.value : undefined);
  const sessionRole = request.cookies.get("__Host-dia_role")?.value ?? (allowDemoCookies ? request.cookies.get("dia_role")?.value : undefined);

  if (!sessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris-yap";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionRole !== "admin") {
    return new NextResponse("Bu alana erisim yetkiniz yok.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ops-console/:path*"]
};

// Production auth cookie requirements:
// Set-Cookie: __Host-dia_session=<signed-session>; Path=/; HttpOnly; Secure; SameSite=Lax
// Optional role claims must be server-signed or derived server-side. Client-readable
// cookies such as document.cookie based role flags are not acceptable for production.
