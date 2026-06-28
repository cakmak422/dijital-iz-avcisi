import { NextResponse } from "next/server";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { getAllContactMessages } from "@/lib/contactDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { messages, error } = await getAllContactMessages();
  if (error) {
    console.error("[admin/contact-messages] Supabase hatası:", error);
    return NextResponse.json({ ok: false, error: "Mesajlar alınamadı." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messages });
}
