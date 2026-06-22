/**
 * POST /api/cyber-archive/generate-image/[slug]
 * Admin tetiklemeli: belirtilen arşiv olayı için AI görsel üretir ve kaydeder.
 * Admin-upload mevcutsa üzerine yazmaz.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateAndStoreArchiveImage } from "@/lib/cyberArchiveImageGen";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await validateAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { slug } = await params;
  if (!slug) return NextResponse.json({ ok: false, error: "slug gerekli." }, { status: 400 });

  const supabaseUrl = getSupabaseUrl();
  const serviceKey  = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Supabase yapılandırması eksik." }, { status: 503 });
  }

  // Mevcut kaydı çek
  const rowRes = await fetch(
    `${supabaseUrl}/rest/v1/cyber_timeline_events?slug=eq.${encodeURIComponent(slug)}&select=slug,title,category,summary,image_source&limit=1`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      signal: AbortSignal.timeout(4000)
    }
  );

  if (!rowRes.ok) {
    return NextResponse.json({ ok: false, error: "Olay bulunamadı veya DB hatası." }, { status: 404 });
  }

  const rows = await rowRes.json() as { slug: string; title: string; category: string; summary: string; image_source?: string | null }[];
  const row  = rows[0];
  if (!row) return NextResponse.json({ ok: false, error: `'${slug}' bulunamadı.` }, { status: 404 });

  const result = await generateAndStoreArchiveImage({
    slug:               row.slug,
    title:              row.title,
    category:           row.category,
    summary:            row.summary,
    currentImageSource: row.image_source,
    supabaseUrl,
    serviceKey
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

async function validateAdmin() {
  const { validateAdminFromCookies } = await import("@/lib/serverAuth");
  const result = await validateAdminFromCookies();
  if (result.ok) return { ok: true, status: 200, error: "" };
  return { ok: false, status: result.status, error: result.error };
}

function getSupabaseUrl() {
  const raw = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  try { return new URL(raw).origin; } catch { return ""; }
}
