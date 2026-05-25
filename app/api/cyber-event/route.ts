import { NextResponse } from "next/server";
import { cyberEventSourcePolicy, fetchLiveCyberEvent } from "@/lib/cyberEventSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const event = await fetchLiveCyberEvent().catch(() => null);

  return NextResponse.json(
    {
      event: event ?? {
        id: "fallback-safe-response",
        title: "Kaynak verisi gecici olarak alinamadi",
        year: "2026",
        summary: "Canli kaynak verisi su anda alinamadi. Sistem yedek bilgilendirme moduna gecti.",
        impact: "Bu gecici durum ana sayfanin acilmasini engellemez.",
        category: "Kaynak durumu",
        sourceName: "CISA KEV Catalog",
        sourceUrl: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        isLiveData: false,
        imageType: "fallback"
      },
      sourcePolicy: {
        primarySource: "CISA Known Exploited Vulnerabilities KEV Catalog",
        cacheSeconds: cyberEventSourcePolicy.cacheSeconds,
        allowedFetchHosts: cyberEventSourcePolicy.allowedFetchHosts,
        allowedImageHosts: cyberEventSourcePolicy.allowedImageHosts
      }
    },
    {
      headers: {
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=1800"
      }
    }
  );
}
