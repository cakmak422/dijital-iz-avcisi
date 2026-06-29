import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { updateContent, resetContent } from "@/lib/contentDb";
import { sanitizeMultiline } from "@/lib/sanitize";
import type { EditableContentKey } from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH — içerik güncelle */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { key } = await params;
  if (!key) {
    return NextResponse.json({ ok: false, error: "Key gerekli." }, { status: 400 });
  }

  let body: { content?: string; updatedBy?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const content    = sanitizeMultiline(body.content ?? "", 1000);
  const updatedBy  = (body.updatedBy ?? "admin").slice(0, 80);

  const { error } = await updateContent(key as EditableContentKey, content, updatedBy);
  if (error) {
    console.error("[admin/content] Güncelleme hatası:", error);
    return NextResponse.json({ ok: false, error: "İçerik kaydedilemedi." }, { status: 500 });
  }

  // Root layout cache'ini geçersiz kıl — tüm sayfalar bir sonraki istekte Supabase'den taze içerik alır
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}

/** POST /reset — varsayılan değere döndür */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { key } = await params;

  let body: { updatedBy?: string };
  try {
    body = (await _request.json()) as typeof body;
  } catch {
    body = {};
  }
  const updatedBy = (body.updatedBy ?? "admin").slice(0, 80);

  const { error, defaultContent } = await resetContent(key as EditableContentKey, updatedBy);
  if (error) {
    console.error("[admin/content] Sıfırlama hatası:", error);
    return NextResponse.json({ ok: false, error: "İçerik sıfırlanamadı." }, { status: 500 });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, defaultContent });
}
