import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { upsertNavItems, deleteNavItems } from "@/lib/pageManagementDb";
import type { ManagedNavigationItem } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — tüm nav öğelerini upsert et + silinenleri Supabase'den kaldır.
 * Body: { items: ManagedNavigationItem[]; deletedIds: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { items?: ManagedNavigationItem[]; deletedIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const items      = Array.isArray(body.items)      ? body.items      : [];
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];

  if (items.length > 0) {
    const { error } = await upsertNavItems(items);
    if (error) {
      console.error("[admin/page-management/navigation] Upsert hatası:", error);
      return NextResponse.json({ ok: false, error: "Menü öğeleri kaydedilemedi." }, { status: 500 });
    }
  }

  if (deletedIds.length > 0) {
    const { error } = await deleteNavItems(deletedIds);
    if (error) {
      console.error("[admin/page-management/navigation] Silme hatası:", error);
      return NextResponse.json({ ok: false, error: "Menü öğesi silinemedi." }, { status: 500 });
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
