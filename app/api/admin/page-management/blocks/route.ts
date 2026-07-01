import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { upsertBlocks, deleteBlocks } from "@/lib/pageManagementDb";
import type { ManagedHomeBlock } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — tüm blokları upsert et + artık listede olmayan blokları Supabase'den sil.
 * Body: { blocks: ManagedHomeBlock[]; deletedIds: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { blocks?: ManagedHomeBlock[]; deletedIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const blocks     = Array.isArray(body.blocks)     ? body.blocks     : [];
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];

  // Upsert mevcut bloklar
  if (blocks.length > 0) {
    const { error } = await upsertBlocks(blocks);
    if (error) {
      console.error("[admin/page-management/blocks] Upsert hatası:", error);
      return NextResponse.json({ ok: false, error: "Bloklar kaydedilemedi." }, { status: 500 });
    }
  }

  // Silinen blokları Supabase'den kaldır
  if (deletedIds.length > 0) {
    const { error } = await deleteBlocks(deletedIds);
    if (error) {
      console.error("[admin/page-management/blocks] Silme hatası:", error);
      return NextResponse.json({ ok: false, error: "Blok silinemedi." }, { status: 500 });
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
