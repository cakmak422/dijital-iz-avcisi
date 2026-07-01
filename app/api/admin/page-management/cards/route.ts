import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { upsertCards, deleteCards } from "@/lib/pageManagementDb";
import type { ManagedCard } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — tüm kartları upsert et + silinenleri Supabase'den kaldır.
 * Body: { cards: ManagedCard[]; deletedIds: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { cards?: ManagedCard[]; deletedIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const cards      = Array.isArray(body.cards)      ? body.cards      : [];
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];

  if (cards.length > 0) {
    const { error } = await upsertCards(cards);
    if (error) {
      console.error("[admin/page-management/cards] Upsert hatası:", error);
      return NextResponse.json({ ok: false, error: "Kartlar kaydedilemedi." }, { status: 500 });
    }
  }

  if (deletedIds.length > 0) {
    const { error } = await deleteCards(deletedIds);
    if (error) {
      console.error("[admin/page-management/cards] Silme hatası:", error);
      return NextResponse.json({ ok: false, error: "Kart silinemedi." }, { status: 500 });
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
