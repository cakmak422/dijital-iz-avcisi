import { NextRequest, NextResponse } from "next/server";
import { getCyberTimelineEventsForPublic, pickTodayTimelineEvent } from "@/lib/cyberTimelineDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getCyberTimelineEventsForPublic();
  const todayOnly = request.nextUrl.searchParams.get("today") === "1";

  return NextResponse.json(
    todayOnly
      ? {
          event: pickTodayTimelineEvent(result.events),
          source: result.source,
          count: result.events.length
        }
      : {
          events: result.events,
          source: result.source,
          count: result.events.length
        },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
