import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ManagedImageFormat } from "@/types/pageManagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bucketName = "awareness";
const maxUploadSize = 5 * 1024 * 1024;
const acceptedTypes = new Map<string, { extension: string; format: ManagedImageFormat }>([
  ["image/jpeg", { extension: "jpg", format: "jpg" }],
  ["image/png", { extension: "png", format: "png" }],
  ["image/webp", { extension: "webp", format: "webp" }]
]);

export async function POST(request: Request) {
  const auth = await validateAdminUploadAccess();
  if (!auth.allowed) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const supabaseUrl = getSupabaseBaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase Storage yapılandırması eksik. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlanmalıdır."
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadFile(file)) {
      return NextResponse.json({ ok: false, error: "Yüklenecek görsel dosyası bulunamadı." }, { status: 400 });
    }

    const typeInfo = acceptedTypes.get(file.type);
    if (!typeInfo) {
      return NextResponse.json({ ok: false, error: "Sadece PNG, JPG/JPEG ve WEBP görseller desteklenir." }, { status: 400 });
    }

    if (file.size > maxUploadSize) {
      return NextResponse.json({ ok: false, error: "Görsel boyutu en fazla 5 MB olabilir." }, { status: 400 });
    }

    const subfolder = getSafeSubfolder(String(formData.get("subfolder") ?? ""));
    const safePath = createSafeStoragePath(file.name, typeInfo.extension, subfolder);
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${safePath}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type,
        "x-upsert": "false"
      },
      body: await file.arrayBuffer()
    });

    if (!uploadResponse.ok) {
      const message = await readStorageError(uploadResponse);
      return NextResponse.json(
        {
          ok: false,
          error: `Görsel yüklenemedi. Supabase Storage bucket '${bucketName}' erişimini kontrol edin. ${message}`
        },
        { status: uploadResponse.status === 404 ? 502 : 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bucket: bucketName,
      format: typeInfo.format,
      imageUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${safePath}`,
      path: safePath
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen upload hatası";
    console.error("awareness_upload_failed", { error: message });
    return NextResponse.json({ ok: false, error: "Görsel yüklenirken beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}

async function validateAdminUploadAccess() {
  const { validateAdminFromCookies } = await import("@/lib/serverAuth");
  const result = await validateAdminFromCookies();
  return { allowed: result.ok, status: result.status, error: result.error };
}

function getSupabaseBaseUrl() {
  const rawUrl = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

const ALLOWED_SUBFOLDERS = new Set(["banners", "blocks", "cards", "theme", "pages", "guides"]);

function getSafeSubfolder(value: string): string {
  const trimmed = value.trim().toLowerCase().replace(/[^a-z]/g, "");
  return ALLOWED_SUBFOLDERS.has(trimmed) ? trimmed : "banners";
}

function createSafeStoragePath(fileName: string, extension: string, subfolder = "banners") {
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "");
  const safeName =
    normalizeForFileName(nameWithoutExtension)
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "gorsel";

  return `${subfolder}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;
}

function normalizeForFileName(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

async function readStorageError(response: Response) {
  try {
    const text = await response.text();
    return text ? text.slice(0, 300) : "";
  } catch {
    return "";
  }
}
