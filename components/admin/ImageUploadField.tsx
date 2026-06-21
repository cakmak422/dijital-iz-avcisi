"use client";

import { ChangeEvent, useEffect, useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

function validate(file: File): string {
  if (!ACCEPTED_TYPES.has(file.type)) return "Sadece PNG, JPG/JPEG ve WEBP görseller seçilebilir.";
  if (file.size > MAX_SIZE) return `Görsel boyutu en fazla 5 MB olabilir. (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  return "";
}

type Props = {
  label: string;
  subfolder: "banners" | "blocks" | "cards" | "theme" | "pages" | "guides";
  value: string;
  onChange: (url: string) => void;
};

export function ImageUploadField({ label, onChange, subfolder, value }: Props) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMsg, setUploadMsg]   = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const visibleUrl = previewUrl || value;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validate(file);
    if (err) { setUploadState("error"); setUploadMsg(err); return; }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState("uploading");
    setUploadMsg("Görsel yükleniyor…");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("subfolder", subfolder);

    try {
      const res  = await fetch("/api/awareness/upload", { method: "POST", body: fd });
      const data = await res.json() as { ok: boolean; imageUrl?: string; error?: string };

      if (!res.ok || !data.ok || !data.imageUrl) throw new Error(data.error ?? "Görsel yüklenemedi.");

      onChange(data.imageUrl);
      setPreviewUrl("");
      setUploadState("success");
      setUploadMsg("Yüklendi. Kaydetmeyi unutmayın.");
    } catch (err) {
      setUploadState("error");
      setUploadMsg(err instanceof Error ? err.message : "Görsel yüklenemedi.");
    }
  }

  const msgClass = {
    idle:      "border-slate-500/25 bg-slate-500/10 text-slate-200",
    uploading: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    success:   "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    error:     "border-red-300/25 bg-red-300/10 text-red-100"
  }[uploadState];

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-slate-200">{label}</label>

      {/* URL kutusu */}
      <input
        className="min-h-10 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
        onChange={(e) => onChange(e.target.value)}
        placeholder="/awareness/... veya https://..."
        type="text"
        value={value}
      />

      {/* Dosya seçici */}
      <label className="cursor-pointer">
        <span className="block text-xs font-semibold text-slate-400">veya dosyadan yükle</span>
        <input
          accept="image/png,image/jpeg,image/webp"
          className="mt-1 min-h-10 w-full rounded-md border border-dashed border-cyan-300/25 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-300 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950 hover:border-cyan-300/50"
          onChange={handleFile}
          type="file"
        />
        <span className="mt-0.5 block text-xs text-slate-500">PNG, JPG veya WEBP · en fazla 5 MB</span>
      </label>

      {/* Durum mesajı */}
      {uploadMsg && (
        <p className={`rounded-md border px-3 py-2 text-xs font-bold ${msgClass}`}>{uploadMsg}</p>
      )}

      {/* Önizleme */}
      {visibleUrl && (
        <div className="overflow-hidden rounded-lg border border-cyan-300/15 bg-slate-900 p-2">
          <p className="mb-1 text-xs text-slate-500">Önizleme</p>
          <img alt="Önizleme" className="max-h-28 w-full rounded object-cover" src={visibleUrl} />
        </div>
      )}
    </div>
  );
}
