import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchLatestCyberNews, type NewsFetchReport } from "@/lib/newsFetcher";
import { getNewsDbDebugState, upsertNewsItems, type NewsDbWriteResult } from "@/lib/newsDb";
import { getLatestNewsForPublic } from "@/lib/newsReadService";
import { getCachedRuntimeNewsItems } from "@/lib/newsRuntimeStore";
import { checkNewsFetchAlertThrottle, recordNewsFetchAlertSent } from "@/lib/newsFetchAlertDb";
import { sendNewsFetchAlertEmail } from "@/lib/email";

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
          items: (await getLatestNewsForPublic(12)).items,
          message: "News fetch cooldown is active. Last cache is still available."
        },
        { status: 429 }
      );
    }
  }

  try {
    const t0 = Date.now();
    console.log("news_fetch_timing", { step: "handler_start", ts: t0 });

    let result;
    try {
      result = await fetchLatestCyberNews();
    } catch (fetchErr) {
      console.error("news_fetch_timing_error", { step: "fetch_sources_crashed", elapsed_ms: Date.now() - t0, error: fetchErr instanceof Error ? fetchErr.stack : String(fetchErr) });
      throw fetchErr;
    }
    const t1 = Date.now();
    console.log("news_fetch_timing", { step: "after_fetch_sources", elapsed_ms: t1 - t0, found: result.found });

    let dbWrite;
    try {
      dbWrite = await upsertNewsItems(result.fetchedItems ?? []);
    } catch (dbErr) {
      console.error("news_fetch_timing_error", { step: "db_write_crashed", elapsed_ms: Date.now() - t0, error: dbErr instanceof Error ? dbErr.stack : String(dbErr) });
      throw dbErr;
    }
    const t2 = Date.now();
    console.log("news_fetch_timing", { step: "after_db_write", elapsed_ms: t2 - t0, db_inserted: dbWrite.inserted });

    const dbDebug = getNewsDbDebugState();
    const runtimeCacheCountAfterWrite = (await getCachedRuntimeNewsItems()).length;

    // İzleme/uyarı mekanizması — izleyici izlediği sistemi asla bozmamalı,
    // bu yüzden tamamen ayrı bir try/catch içinde, ana response'u etkilemez.
    try {
      await evaluateAndSendNewsFetchAlert(result, dbWrite);
    } catch (alertErr) {
      console.error("news_fetch_alert_evaluation_failed", {
        error: alertErr instanceof Error ? alertErr.message : String(alertErr)
      });
    }

    if (process.env.NODE_ENV === "production") {
      lastProductionFetchAt = Date.now();
    }
    return NextResponse.json({
      ...result,
      inserted: dbWrite.usingDatabase ? dbWrite.inserted : 0,
      skipped: dbWrite.usingDatabase ? dbWrite.skipped : result.found,
      failed: dbWrite.usingDatabase ? dbWrite.failed : 0,
      errors: dbWrite.usingDatabase ? dbWrite.errors : result.errors,
      items: dbWrite.usingDatabase && dbWrite.items.length ? dbWrite.items : result.items,
      cachePersisted: result.cache?.persisted ?? 0,
      databaseEnabled: dbWrite.usingDatabase,
      dbUpserted: dbWrite.inserted,
      dbFailed: dbWrite.failed,
      dbErrors: dbWrite.errors.slice(0, 3),
      dbReadOk: dbDebug.dbReadOk,
      dbReadStatus: dbDebug.dbReadStatus,
      dbReadError: dbDebug.dbReadError,
      dbWriteOk: dbDebug.dbWriteOk,
      dbWriteStatus: dbDebug.dbWriteStatus,
      dbWriteError: dbDebug.dbWriteError,
      runtimeCacheCountAfterWrite,
      database: {
        enabled: dbWrite.usingDatabase,
        inserted: dbWrite.inserted,
        skipped: dbWrite.skipped,
        failed: dbWrite.failed,
        errors: dbWrite.errors
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen haber guncelleme hatasi";
    const dbDebug = getNewsDbDebugState();
    console.error("news_fetch_endpoint_failed", { error: message });
    return NextResponse.json({
      found: 0,
      processedLimit: { perSource: 10, total: 30, processed: 0 },
      inserted: 0,
      skipped: 0,
      failed: 1,
      errors: [message],
      items: (await getLatestNewsForPublic(12)).items,
      cachePersisted: 0,
      databaseEnabled: false,
      dbUpserted: 0,
      dbFailed: 0,
      dbErrors: [],
      dbReadOk: dbDebug.dbReadOk,
      dbReadStatus: dbDebug.dbReadStatus,
      dbReadError: dbDebug.dbReadError,
      dbWriteOk: dbDebug.dbWriteOk,
      dbWriteStatus: dbDebug.dbWriteStatus,
      dbWriteError: dbDebug.dbWriteError,
      runtimeCacheCountAfterWrite: (await getCachedRuntimeNewsItems()).length,
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

  const authorization  = request.headers.get("authorization") ?? "";
  const providedSecret = getProvidedSecret(request);

  // İmzalı oturum doğrulaması
  const { validateAdminFromCookies } = await import("@/lib/serverAuth");
  const adminCheck = await validateAdminFromCookies();
  const hasAdminSession = adminCheck.ok;

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

async function evaluateAndSendNewsFetchAlert(result: NewsFetchReport, dbWrite: NewsDbWriteResult) {
  const reasons: string[] = [];

  if (dbWrite.failed > 0) reasons.push(`DB yazım hatası (failed: ${dbWrite.failed})`);
  if (result.found > 0 && dbWrite.inserted + dbWrite.skipped === 0) reasons.push("Bulunan haberlerden hiçbiri DB'ye yazılamadı");
  if (result.aiStats.attempted > 0 && result.aiStats.ok === 0) reasons.push(`AI çağrılarının tamamı başarısız (0/${result.aiStats.attempted})`);
  if (result.truncationCount > 0) reasons.push(`Alan kırpma uyarısı (${result.truncationCount} kez)`);
  if (result.found === 0) reasons.push("Hiçbir kaynaktan haber bulunamadı");

  if (!reasons.length) return;

  const throttle = await checkNewsFetchAlertThrottle();
  if (!throttle.shouldSend) {
    console.warn("news_fetch_alert_suppressed", { reasons, lastSentAt: throttle.lastSentAt });
    return;
  }

  const sampleErrors = [...dbWrite.errors, ...result.errors].filter(Boolean).slice(0, 3);
  const emailResult = await sendNewsFetchAlertEmail({
    reasons,
    found: result.found,
    inserted: dbWrite.inserted,
    skipped: dbWrite.skipped,
    failed: dbWrite.failed,
    aiAttempted: result.aiStats.attempted,
    aiOk: result.aiStats.ok,
    truncationCount: result.truncationCount,
    sampleErrors
  });

  if (emailResult.delivered) {
    await recordNewsFetchAlertSent(reasons);
  } else {
    console.warn("news_fetch_alert_email_not_delivered", { reasons, error: emailResult.error });
  }
}
