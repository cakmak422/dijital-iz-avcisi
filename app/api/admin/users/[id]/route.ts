import { NextRequest, NextResponse } from "next/server";
import { validateAdminFromCookies, getAdminSessionFromCookies } from "@/lib/serverAuth";
import { getUserById, updateUserStatus } from "@/lib/userDb";
import type { UserStatus } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: UserStatus[] = ["active", "pending", "blocked"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { user, error } = await getUserById(id);

  if (error) {
    return NextResponse.json({ ok: false, error: "Kullanıcı alınamadı." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ ok: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // password_hash bu response'da YOK — getUserById() zaten hariç tutuyor
  return NextResponse.json({ ok: true, user });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAdminFromCookies();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  // ── Sunucu taraflı güvenlik: admin kendi hesabını değiştiremez ───────────
  const adminSession = await getAdminSessionFromCookies();
  if (adminSession && adminSession.userId === id) {
    return NextResponse.json(
      { ok: false, error: "Kendi hesabınızın durumunu bu panelden değiştiremezsiniz (kendini kilitleme riski)." },
      { status: 403 }
    );
  }

  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const status = body.status as UserStatus | undefined;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum değeri." }, { status: 400 });
  }

  const { error } = await updateUserStatus(id, status);
  if (error) {
    return NextResponse.json({ ok: false, error: "Durum güncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
