import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchLatestCyberNews } from "@/lib/newsFetcher";
import { getLatestRuntimeNews } from "@/lib/newsRuntimeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEWS_FETCH_COOLDOWN_MS = 30 * 60 * 1000;

let lastProductionFetchAt = 0;

export async function GET(request: Request) {
  return handleNewsFetch(request);
}

export async function POST(request: Request) {
  return handleNewsFetch(request);
}

async function handleNewsFetch(request: Request) {
  const guard = await validateNewsFetchAccess(request);
  if (!guard.allowed) {
    return NextResponse.json(guard.body, { status: guard.status });
  }

  if (process.env.NODE_ENV === "production") {
    const elapsed = Date.now() - lastProductionFetchAt;
    if (lastProductionFetchAt > 0 && elapsed < NEWS_FETCH_COOLDOWN_MS) {
      return NextResponse.json(
        {
          ok: false,
          cooldown: true,
          retryAfterSeconds: Math.ceil((NEWS_FETCH_COOLDOWN_MS - elapsed) / 1000),
          items: await getLatestRuntimeNews(12),
          message: "News fetch cooldown is active. Last cache is still available."
        },
        { status: 429 }
      );
    }
  }

  try {
    const result = await fetchLatestCyberNews();
    if (process.env.NODE_ENV === "production") {
      lastProductionFetchAt = Date.now();
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen haber guncelleme hatasi";
    console.error("news_fetch_endpoint_failed", { error: message });
    return NextResponse.json({
      found: 0,
      processedLimit: { perSource: 10, total: 30, processed: 0 },
      inserted: 0,
      skipped: 0,
      failed: 1,
      errors: [message],
      items: await getLatestRuntimeNews(12),
      sources: []
    });
  }
}

async function validateNewsFetchAccess(request: Request) {
  const configuredSecret = (process.env.NEWS_FETCH_SECRET ?? "").trim();

  if (process.env.NODE_ENV === "production" && !configuredSecret) {
    return {
      allowed: false,
      status: 503,
      body: {
        ok: false,
        disabled: true,
        message: "News fetch is disabled because NEWS_FETCH_SECRET is not configured."
      }
    };
  }

  if (!configuredSecret) {
    console.warn("NEWS_FETCH_SECRET tanimli degil. /api/news/fetch development modunda korumasiz calisiyor.");
    return { allowed: true, status: 200, body: {} };
  }

  const cookieStore = await cookies();
  const authorization = request.headers.get("authorization") ?? "";
  const sessionCookie = cookieStore.get("__Host-dia_session")?.value;
  const sessionRole = cookieStore.get("__Host-dia_role")?.value;
  const hasAdminSession = Boolean(sessionCookie && sessionRole === "admin");
  const providedSecret = getProvidedSecret(request);

  if (hasAdminSession || providedSecret === configuredSecret || authorization === `Bearer ${configuredSecret}`) {
    return { allowed: true, status: 200, body: {} };
  }

  return {
    allowed: false,
    status: 401,
    body: { ok: false, error: "Yetkisiz istek." }
  };
}

function getProvidedSecret(request: Request) {
  try {
    return new URL(request.url).searchParams.get("secret")?.trim() ?? "";
  } catch {
    return "";
  }
}
