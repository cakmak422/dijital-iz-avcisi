import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { updateTheme } from "@/lib/pageManagementDb";
import type { ManagedThemeSettings } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH — tema güncelle + cache geçersiz kıl */
export async function PATCH(request: NextRequest) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: Partial<ManagedThemeSettings>;
  try {
    body = (await request.json()) as Partial<ManagedThemeSettings>;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const { error } = await updateTheme(body);
  if (error) {
    console.error("[admin/page-management/theme] Güncelleme hatası:", error);
    return NextResponse.json({ ok: false, error: "Tema kaydedilemedi." }, { status: 500 });
  }

  // Root layout cache'ini geçersiz kıl — tüm sayfalar bir sonraki istekte taze tema alır
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
