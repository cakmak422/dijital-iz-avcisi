/**
 * Haber veritabanından uygun kayıtları cyber_timeline_events tablosuna aktarır.
 *
 * KRİTERLER (Kararlar: B + E + J + K):
 *  B — riskLevel === "Yüksek" VEYA severity === "Yüksek"
 *  E — visualTone/category: ransomware, breach, infrastructure, malware, threat-intel, privacy
 *  J — süre kriteri yok (tüm tarihler)
 *  K — slug çakışması → atla (mevcut korun), news_item_id çakışması → atla
 */

import type { CyberNewsItem } from "@/lib/newsStore";
import type { CyberVisualTone } from "@/lib/cyberArchive";

export type ArchiveSyncResult = {
  checked: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: string[];
  usingDatabase: boolean;
};

// Kriter E — arşive alınacak visual tone'lar
// phishing ve banking eklendi: mevcut haber akışında Yüksek riskli içerikler bu tonlarda geliyor
const ARCHIVE_TONES = new Set<string>([
  "ransomware",
  "breach",
  "infrastructure",
  "malware",
  "threat-intel",
  "privacy",
  "phishing",
  "banking"
]);

function meetsArchiveCriteria(item: CyberNewsItem): boolean {
  const isHighRisk =
    item.riskLevel === "Yüksek" || item.severity === "Yüksek";
  const hasArchiveTone =
    ARCHIVE_TONES.has(item.fallbackVisualType ?? "") ||
    ARCHIVE_TONES.has(inferToneFromCategory(item.category));
  return isHighRisk && hasArchiveTone;
}

function inferToneFromCategory(category: string): string {
  const lower = (category ?? "").toLowerCase();
  if (lower.includes("fidye") || lower.includes("ransomware")) return "ransomware";
  if (lower.includes("veri sız") || lower.includes("breach")) return "breach";
  if (lower.includes("altyapı") || lower.includes("infrastructure")) return "infrastructure";
  if (lower.includes("zararlı") || lower.includes("malware")) return "malware";
  if (lower.includes("tehdit") || lower.includes("threat")) return "threat-intel";
  if (lower.includes("mahrem") || lower.includes("privacy") || lower.includes("kişisel")) return "privacy";
  return "";
}

function newsItemToArchiveSlug(item: CyberNewsItem): string {
  // Haber slug'ından arşiv slug'ı türet — çakışmayı önlemek için "news-" prefix
  const base = item.slug.slice(0, 60).replace(/[^a-z0-9-]/g, "-");
  return `news-${base}`;
}

function newsItemToArchiveRow(item: CyberNewsItem) {
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : new Date();
  const month  = String(publishedAt.getMonth() + 1).padStart(2, "0");
  const day    = String(publishedAt.getDate()).padStart(2, "0");
  const year   = String(publishedAt.getFullYear());
  const tone   = (item.fallbackVisualType as CyberVisualTone) ?? "breach";
  const displayTitle = item.titleTr || item.displayTitle || item.title;
  const displaySummary = item.summaryLongTr || item.summaryShortTr || item.displaySummary || item.summary;

  return {
    slug:             newsItemToArchiveSlug(item),
    title:            displayTitle,
    date_label:       publishedAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    month_day:        `${month}-${day}`,
    year,
    category:         item.category || "Siber Olay",
    threat_type:      item.category || "Siber Tehdit",
    severity:         item.severity === "Yüksek" ? "Yüksek" : item.riskLevel === "Yüksek" ? "Yüksek" : "Orta",
    summary:          displaySummary,
    impact:           item.whyItMattersTr || displaySummary,
    details:          displaySummary,
    affected_groups:  JSON.stringify(item.affectedGroupsTr ?? []),
    recommendations:  JSON.stringify(item.recommendationsTr ?? []),
    source_name:      item.sourceName,
    source_url:       item.sourceUrl,
    visual_tone:      tone,
    tags:             JSON.stringify(item.tags ?? []),
    status:           "active",
    sort_order:       200,
    event_date:       publishedAt.toISOString().slice(0, 10),
    image_url:        item.imageUrl ?? null,
    image_source:     item.imageUrl ? "admin-upload" : "none",
    news_item_id:     item.id
  };
}

export async function syncNewsToArchive(
  items: CyberNewsItem[],
  supabaseUrl: string,
  serviceKey: string
): Promise<ArchiveSyncResult> {
  const result: ArchiveSyncResult = {
    checked: items.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    usingDatabase: true
  };

  const eligible = items.filter(meetsArchiveCriteria);

  for (const item of eligible) {
    try {
      const archiveSlug   = newsItemToArchiveSlug(item);
      const row           = newsItemToArchiveRow(item);

      // Önce slug veya news_item_id ile mevcut kayıt var mı kontrol et (Kriter K)
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/cyber_timeline_events?or=(slug.eq.${encodeURIComponent(archiveSlug)},news_item_id.eq.${encodeURIComponent(item.id)})&select=slug&limit=1`,
        { headers: supabaseHeaders(serviceKey), signal: AbortSignal.timeout(4000) }
      );
      if (checkRes.ok) {
        const existing = await checkRes.json() as unknown[];
        if (Array.isArray(existing) && existing.length > 0) {
          result.skipped++;
          continue;
        }
      }

      // Insert
      const insertRes = await fetch(
        `${supabaseUrl}/rest/v1/cyber_timeline_events`,
        {
          method: "POST",
          headers: { ...supabaseHeaders(serviceKey), Prefer: "return=minimal" },
          body: JSON.stringify(row),
          signal: AbortSignal.timeout(4000)
        }
      );

      if (insertRes.ok || insertRes.status === 201) {
        result.inserted++;
      } else {
        const msg = await insertRes.text().catch(() => "");
        result.failed++;
        result.errors.push(`${archiveSlug}: ${msg.slice(0, 120)}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(`${item.id}: ${err instanceof Error ? err.message : "bilinmeyen hata"}`);
    }
  }

  return result;
}

function supabaseHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
}
