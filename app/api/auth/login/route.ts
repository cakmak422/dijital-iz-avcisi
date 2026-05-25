import { NextRequest, NextResponse } from "next/server";
import { createServerSession } from "@/lib/serverSession";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

function safeEquals(left: string, right: string) {
  return left.length === right.length && left === right;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Giriş bilgileri eşleşmedi." }, { status: 400 });
  }

  const credentials = body as { identifier?: string; password?: string };
  const identifier = sanitizeText(credentials.identifier ?? "", 254).toLowerCase();
  const password = (credentials.password ?? "").trim().slice(0, 256);

  const bootstrapEnabled = process.env.ADMIN_BOOTSTRAP_ENABLED === "true";
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const authSecret = process.env.AUTH_SECRET ?? "";

  if (!bootstrapEnabled || !adminEmail || !adminPassword || !authSecret) {
    return NextResponse.json({ ok: false, message: "Giriş bilgileri eşleşmedi." }, { status: 401 });
  }

  if (!safeEquals(identifier, adminEmail) || !safeEquals(password, adminPassword)) {
    return NextResponse.json({ ok: false, message: "Giriş bilgileri eşleşmedi." }, { status: 401 });
  }

  const maxAge = 60 * 60 * 8;
  const token = createServerSession(
    {
      email: adminEmail,
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + maxAge
    },
    authSecret
  );

  const response = NextResponse.json({
    ok: true,
    user: {
      role: "admin",
      isEmailVerified: true,
      status: "active"
    },
    redirectTo: "/ops-console"
  });

  response.cookies.set("__Host-dia_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge
  });
  response.cookies.set("__Host-dia_role", "admin", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge
  });

  return response;
}
