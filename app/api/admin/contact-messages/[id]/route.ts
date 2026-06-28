import { NextRequest, NextResponse } from "next/server";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { updateContactMessageStatus } from "@/lib/contactDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["new", "read", "archived"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum değeri." }, { status: 400 });
  }

  const { error } = await updateContactMessageStatus(id, status as "new" | "read" | "archived");
  if (error) {
    console.error("[admin/contact-messages/[id]] Supabase hatası:", error);
    return NextResponse.json({ ok: false, error: "Durum güncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
