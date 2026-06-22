import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  defaultAwarenessBanners,
  filterAwarenessBannersByScope,
  type AwarenessBannerScope
} from "@/lib/awarenessBanners";
import { createAwarenessBanner, getAwarenessBanners } from "@/lib/awarenessBannersDb";
import type { ManagedBanner } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedScopes = new Set(["all", "home", "about", "archive", "news", "query", "tools", "guides", "contact"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = getScope(searchParams.get("page_key"));
  const result = await getAwarenessBanners(scope);

  if (result.items.length > 0) {
    return NextResponse.json({
      ok: true,
      source: "database",
      count: result.items.length,
      items: result.items
    });
  }

  const fallbackItems = filterAwarenessBannersByScope(defaultAwarenessBanners, scope);

  return NextResponse.json({
    ok: true,
    source: result.usingDatabase ? "fallback" : "fallback-no-db",
    count: fallbackItems.length,
    error: result.error,
    items: fallbackItems
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ ok: false, error: "Bu işlem için admin yetkisi gerekir." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<ManagedBanner> | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "Geçersiz afiş verisi." }, { status: 400 });
  }

  const result = await createAwarenessBanner(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Afiş oluşturulamadı." }, { status: result.status ?? 500 });
  }

  return NextResponse.json({ ok: true, item: result.item });
}

function getScope(value: string | null): AwarenessBannerScope {
  return allowedScopes.has(value ?? "") ? (value as AwarenessBannerScope) : "home";
}

async function hasAdminSession() {
  const { validateAdminFromCookies } = await import("@/lib/serverAuth");
  const result = await validateAdminFromCookies();
  return result.ok;
}
