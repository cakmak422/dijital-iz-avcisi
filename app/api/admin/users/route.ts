import { NextResponse } from "next/server";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { getAllUsers } from "@/lib/userDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { users, error } = await getAllUsers();
  if (error) {
    console.error("[admin/users] Supabase hatası:", error);
    return NextResponse.json({ ok: false, error: "Kullanıcı listesi alınamadı." }, { status: 500 });
  }

  // password_hash bu response'da YOK — getAllUsers() zaten hariç tutuyor
  return NextResponse.json({ ok: true, users });
}
