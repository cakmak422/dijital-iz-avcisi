import { NextResponse } from "next/server";
import { cyberEventSourcePolicy, fetchLiveCyberEvent } from "@/lib/cyberEventSource";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  const event = await fetchLiveCyberEvent();

  return NextResponse.json(
    {
      event,
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
