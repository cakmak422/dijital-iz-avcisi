import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/serverSession";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = verifyServerSession(request.cookies.get("__Host-dia_session")?.value, process.env.AUTH_SECRET ?? "");

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: "env-admin",
      username: "admin",
      email: session.email,
      firstName: "Admin",
      lastName: "User",
      birthDate: "",
      phone: "",
      role: session.role,
      isEmailVerified: true,
      createdAt: "",
      status: "active"
    }
  });
}
