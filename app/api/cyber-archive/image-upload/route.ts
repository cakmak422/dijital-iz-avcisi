import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "cyber-archive";
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png",  "png"],
  ["image/webp", "webp"]
]);

export async function POST(request: Request) {
  const auth = await validateAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabaseUrl = getSupabaseUrl();
  const serviceKey  = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Supabase yapılandırması eksik." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const slug = String(formData.get("slug") ?? "").trim();

  if (!isFile(file)) return NextResponse.json({ ok: false, error: "Dosya bulunamadı." }, { status: 400 });
  if (!slug)         return NextResponse.json({ ok: false, error: "Olay slug'ı gerekli." }, { status: 400 });

  const ext = ACCEPTED.get(file.type);
  if (!ext) return NextResponse.json({ ok: false, error: "Sadece PNG, JPG, WEBP desteklenir." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, error: "Dosya en fazla 5 MB olabilir." }, { status: 400 });

  const safeSlug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const path = `events/${Date.now()}-${safeSlug}.${ext}`;

  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type,
      "x-upsert": "true"
    },
    body: await file.arrayBuffer()
  });

  if (!uploadRes.ok) {
    const msg = await uploadRes.text().catch(() => "");
    return NextResponse.json({ ok: false, error: `Storage hatası: ${msg.slice(0, 200)}` }, { status: 500 });
  }

  const imageUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

  // Veritabanında image_url ve image_source güncelle
  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/cyber_timeline_events?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ image_url: imageUrl, image_source: "admin-upload" })
    }
  );

  if (!patchRes.ok) {
    return NextResponse.json({
      ok: true,
      imageUrl,
      warning: "Görsel yüklendi fakat DB güncellenemedi. Manuel PATCH gerekebilir."
    });
  }

  return NextResponse.json({ ok: true, imageUrl, bucket: BUCKET, path });
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

function isFile(v: FormDataEntryValue | null): v is File {
  return typeof File !== "undefined" && v instanceof File;
}
