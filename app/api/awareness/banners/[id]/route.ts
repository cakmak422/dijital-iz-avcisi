import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deactivateAwarenessBanner, updateAwarenessBanner } from "@/lib/awarenessBannersDb";
import type { ManagedBanner } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ ok: false, error: "Bu işlem için admin yetkisi gerekir." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Partial<ManagedBanner> | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "Geçersiz afiş verisi." }, { status: 400 });
  }

  const result = await updateAwarenessBanner(id, body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Afiş güncellenemedi." }, { status: result.status ?? 500 });
  }

  return NextResponse.json({ ok: true, item: result.item });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ ok: false, error: "Bu işlem için admin yetkisi gerekir." }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deactivateAwarenessBanner(id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Afiş pasifleştirilemedi." }, { status: result.status ?? 500 });
  }

  return NextResponse.json({ ok: true, item: result.item });
}

async function hasAdminSession() {
  const cookieStore = await cookies();
  const allowDemoCookies = process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true" || process.env.NODE_ENV !== "production";
  const hostSession = cookieStore.get("__Host-dia_session")?.value;
  const hostRole = cookieStore.get("__Host-dia_role")?.value;
  const demoSession = allowDemoCookies ? cookieStore.get("dia_session")?.value : undefined;
  const demoRole = allowDemoCookies ? cookieStore.get("dia_role")?.value : undefined;

  return Boolean((hostSession && hostRole === "admin") || (demoSession && demoRole === "admin"));
}
