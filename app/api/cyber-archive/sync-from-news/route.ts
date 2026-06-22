/**
 * POST /api/cyber-archive/sync-from-news
 *
 * Yetkili: admin oturumu VEYA ARCHIVE_SYNC_SECRET header/query param
 * — news/fetch ile aynı desen.
 *
 * Vercel Cron örneği (vercel.json içinde):
 *   { "path": "/api/cyber-archive/sync-from-news", "schedule": "0 4 * * *" }
 *   Header: { "Authorization": "Bearer <ARCHIVE_SYNC_SECRET>" }
 *
 * .env: ARCHIVE_SYNC_SECRET=<rastgele uzun string>
 * Bu dosyayı sen oluşturuyorsun — bot bunu yazmaz.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAllNewsForPublic } from "@/lib/newsReadService";
import { syncNewsToArchive } from "@/lib/cyberArchiveSync";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }

async function handle(request: Request) {
  const guard = await validateAccess(request);
  if (!guard.allowed) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceKey  = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase yapılandırması eksik — SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlanmalı." },
      { status: 503 }
    );
  }

  try {
    // Haber listesini oku (sadece okuma — newsFetcher'a dokunulmaz)
    const { items } = await getAllNewsForPublic();

    const result = await syncNewsToArchive(items, supabaseUrl, serviceKey);

    return NextResponse.json({
      ok: true,
      ...result,
      message: `${result.checked} haber kontrol edildi. ${result.inserted} eklendi, ${result.skipped} atlandı, ${result.failed} başarısız.`
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bilinmeyen senkronizasyon hatası";
    console.error("cyber_archive_sync_failed", { error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

async function validateAccess(request: Request) {
  const configuredSecret = (process.env.ARCHIVE_SYNC_SECRET ?? "").trim();

  // Development modunda secret yoksa geç
  if (!configuredSecret && process.env.NODE_ENV !== "production") {
    return { allowed: true, status: 200, error: "" };
  }

  // Admin oturumu — imzalı çerez doğrulaması
  const { validateAdminFromCookies } = await import("@/lib/serverAuth");
  const adminCheck = await validateAdminFromCookies();
  if (adminCheck.ok) return { allowed: true, status: 200, error: "" };

  // Secret token (header veya query)
  if (configuredSecret) {
    const authorization = request.headers.get("authorization") ?? "";
    const querySecret   = getQuerySecret(request);
    if (
      authorization === `Bearer ${configuredSecret}` ||
      querySecret === configuredSecret
    ) {
      return { allowed: true, status: 200, error: "" };
    }
  }

  return { allowed: false, status: 401, error: "Admin oturumu veya ARCHIVE_SYNC_SECRET gereklidir." };
}

function getQuerySecret(request: Request) {
  try { return new URL(request.url).searchParams.get("secret")?.trim() ?? ""; }
  catch { return ""; }
}

function getSupabaseUrl() {
  const raw = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  try { return new URL(raw).origin; } catch { return ""; }
}
