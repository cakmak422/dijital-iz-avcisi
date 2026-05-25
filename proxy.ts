import { NextRequest, NextResponse } from "next/server";

const protectedPathPattern = /^\/ops-console(\/.*)?$/;
const legacyAdminPathPattern = /^\/admin(\/.*)?$/;
const authApiPathPattern = /^\/api\/auth(\/.*)?$/;
const staticPathPattern = /^\/(_next|favicon\.ico|robots\.txt|logo\.png|logo-icon\.png|apple-touch-icon\.png|dijital-iz-avcisi-logo\.png)(\/.*)?$/;

function isProtectedPath(pathname: string) {
  return protectedPathPattern.test(pathname);
}

function isLegacyAdminPath(pathname: string) {
  return legacyAdminPathPattern.test(pathname);
}

function isMaintenanceBypassPath(pathname: string) {
  return pathname === "/maintenance" || pathname === "/giris-yap" || authApiPathPattern.test(pathname) || staticPathPattern.test(pathname);
}

function getClientIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

function base64urlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function bytesToBase64url(bytes: ArrayBuffer) {
  const binary = Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function verifySessionToken(token: string | undefined) {
  const secret = process.env.AUTH_SECRET ?? "";
  if (!token || !secret || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  const expected = bytesToBase64url(signed);

  if (signature !== expected) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encodedPayload))) as { email?: string; role?: string; exp?: number };
    if (!payload.email || !payload.role || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
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

function isMaintenanceIpAllowed(request: NextRequest) {
  const allowedIps = (process.env.MAINTENANCE_ALLOWED_IPS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedIps.length === 0) {
    return false;
  }

  return allowedIps.includes(getClientIp(request));
}

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  const session = await verifySessionToken(request.cookies.get("__Host-dia_session")?.value);
  const isAdminSession = session?.role === "admin";

  if (isMaintenanceMode && !isMaintenanceBypassPath(pathname) && !isProtectedPath(pathname) && !isLegacyAdminPath(pathname)) {
    if (!isAdminSession && !isMaintenanceIpAllowed(request)) {
      const maintenanceUrl = request.nextUrl.clone();
      maintenanceUrl.pathname = "/maintenance";
      maintenanceUrl.search = "";
      return withNoIndex(NextResponse.redirect(maintenanceUrl));
    }
  }

  if (pathname === "/maintenance") {
    return withNoIndex(NextResponse.next());
  }

  if (!isProtectedPath(pathname) && !isLegacyAdminPath(pathname)) {
    return NextResponse.next();
  }

  if (!isIpAllowed(request)) {
    return new NextResponse("Bu alana erisim yetkiniz yok.", { status: 403 });
  }

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris-yap";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== "admin") {
    return new NextResponse("Bu alana erisim yetkiniz yok.", { status: 403 });
  }

  if (isLegacyAdminPath(pathname)) {
    const consoleUrl = request.nextUrl.clone();
    consoleUrl.pathname = "/ops-console";
    consoleUrl.search = "";
    return NextResponse.redirect(consoleUrl);
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
