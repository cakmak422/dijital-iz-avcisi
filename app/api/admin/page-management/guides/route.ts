import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { upsertGuides, deleteGuides } from "@/lib/pageManagementDb";
import type { ManagedGuide } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — tüm rehberleri upsert et + silinenleri Supabase'den kaldır.
 * Body: { guides: ManagedGuide[]; deletedIds: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { guides?: ManagedGuide[]; deletedIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const guides     = Array.isArray(body.guides)     ? body.guides     : [];
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];

  if (guides.length > 0) {
    const { error } = await upsertGuides(guides);
    if (error) {
      console.error("[admin/page-management/guides] Upsert hatası:", error);
      return NextResponse.json({ ok: false, error: "Rehberler kaydedilemedi." }, { status: 500 });
    }
  }

  if (deletedIds.length > 0) {
    const { error } = await deleteGuides(deletedIds);
    if (error) {
      console.error("[admin/page-management/guides] Silme hatası:", error);
      return NextResponse.json({ ok: false, error: "Rehber silinemedi." }, { status: 500 });
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
