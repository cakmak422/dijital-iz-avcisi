import { NextRequest, NextResponse } from "next/server";
import { fetchLiveCyberEvent } from "@/lib/cyberEventSource";

export const runtime = "nodejs";

let lastCronState: {
  updatedAt?: string;
  lastError?: string;
  lastEventId?: string;
} = {};

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret") ?? "";

  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const event = await fetchLiveCyberEvent({ bypassCache: true });

  if (!event.isLiveData) {
    lastCronState = {
      ...lastCronState,
      lastError: "Live source could not be fetched; existing published content should be preserved.",
      updatedAt: new Date().toISOString()
    };
    return NextResponse.json({ ok: false, state: lastCronState, event }, { status: 503 });
  }

  lastCronState = {
    updatedAt: new Date().toISOString(),
    lastEventId: event.id
  };

  // TODO: Persist the selected daily event in PostgreSQL/Supabase with a unique
  // sourceUrl/CVE constraint so the same item is not published twice.
  // Without a database, serverless deployments cannot reliably keep daily state.
  return NextResponse.json({ ok: true, state: lastCronState, event });
}
