import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminFromCookies } from "@/lib/serverAuth";
import { upsertPage } from "@/lib/pageManagementDb";
import type { ManagedPageSettings } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — tüm sayfa ayarlarını upsert et.
 * seoTitle/seoDescription alanları kaydedilir ama Next.js metadata'ya bağlanmaz.
 * Body: { pages: ManagedPageSettings[] }
 */
export async function POST(request: NextRequest) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { pages?: ManagedPageSettings[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const pages = Array.isArray(body.pages) ? body.pages : [];

  if (pages.length > 0) {
    const results = await Promise.allSettled(pages.map((p) => upsertPage(p)));
    const failed = results
      .map((r, i) => (r.status === "rejected" ? i : r.value.error ? i : null))
      .filter((i) => i !== null);

    if (failed.length > 0) {
      const firstErr =
        results[failed[0]!].status === "fulfilled"
          ? (results[failed[0]!] as PromiseFulfilledResult<{ error: string | null }>).value.error
          : String((results[failed[0]!] as PromiseRejectedResult).reason);
      console.error("[admin/page-management/pages] Upsert hatası:", firstErr);
      return NextResponse.json({ ok: false, error: "Sayfa ayarları kaydedilemedi." }, { status: 500 });
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
