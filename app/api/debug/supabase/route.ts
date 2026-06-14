import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiagnosticError = {
  errorName: string | null;
  errorMessage: string | null;
  errorStack: string | null;
  causeName: string | null;
  causeMessage: string | null;
  causeCode: string | null;
  causeErrno: string | number | null;
  causeSyscall: string | null;
  causeHostname: string | null;
};

export async function GET(request: Request) {
  const access = validateDebugAccess(request);
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const urlValue = (process.env.SUPABASE_URL ?? "").trim();
  const serviceRoleValue = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const parsed = parseSupabaseUrl(urlValue);
  const hostname = parsed?.hostname ?? null;
  const dns = hostname ? await resolveDns(hostname) : { ok: false, records: [], error: "Hostname yok." };
  const rest = parsed
    ? await testSupabaseRest(parsed.origin, serviceRoleValue)
    : {
        ok: false,
        responseReceived: false,
        status: null,
        statusText: null,
        bodyPreview: null,
        error: null
      };

  return NextResponse.json({
    ok: Boolean(rest.ok),
    generatedAt: new Date().toISOString(),
    env: {
      supabaseUrlPresent: Boolean(urlValue),
      supabaseServiceRolePresent: Boolean(serviceRoleValue),
      debugSecretConfigured: Boolean((process.env.DEBUG_SECRET ?? "").trim()),
      nodeEnv: process.env.NODE_ENV ?? null
    },
    supabaseUrl: {
      parseOk: Boolean(parsed),
      protocol: parsed?.protocol ?? null,
      hostname
    },
    dns,
    rest
  });
}

function validateDebugAccess(request: Request) {
  const configuredSecret = (process.env.DEBUG_SECRET ?? "").trim();

  if (process.env.NODE_ENV === "production" && !configuredSecret) {
    return {
      allowed: false,
      status: 404,
      body: { ok: false, error: "Not found." }
    };
  }

  if (!configuredSecret) {
    return { allowed: true, status: 200, body: {} };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const providedSecret = getProvidedSecret(request);
  if (authorization === `Bearer ${configuredSecret}` || providedSecret === configuredSecret) {
    return { allowed: true, status: 200, body: {} };
  }

  return {
    allowed: false,
    status: 401,
    body: { ok: false, error: "Unauthorized." }
  };
}

function getProvidedSecret(request: Request) {
  try {
    return new URL(request.url).searchParams.get("secret")?.trim() ?? "";
  } catch {
    return "";
  }
}

function parseSupabaseUrl(value: string) {
  if (!value) return null;

  try {
    const parsed = new URL(value.replace(/\/$/, ""));
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function resolveDns(hostname: string) {
  try {
    const records = await lookup(hostname, { all: true });
    return {
      ok: true,
      records: records.map((record) => ({
        family: record.family,
        address: maskIpAddress(record.address)
      })),
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      records: [],
      error: sanitizeText(error instanceof Error ? error.message : "DNS lookup failed.")
    };
  }
}

async function testSupabaseRest(origin: string, serviceRoleValue: string) {
  if (!serviceRoleValue) {
    return {
      ok: false,
      responseReceived: false,
      status: null,
      statusText: null,
      bodyPreview: null,
      error: buildDiagnosticError(new Error("SUPABASE_SERVICE_ROLE_KEY is not configured."))
    };
  }

  try {
    const response = await fetch(`${origin}/rest/v1/cyber_news?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleValue,
        Authorization: `Bearer ${serviceRoleValue}`,
        "Content-Type": "application/json"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    const body = await response.text();
    return {
      ok: response.ok,
      responseReceived: true,
      status: response.status,
      statusText: response.statusText,
      bodyPreview: sanitizeText(body).slice(0, 300),
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      responseReceived: false,
      status: null,
      statusText: null,
      bodyPreview: null,
      error: buildDiagnosticError(error)
    };
  }
}

function buildDiagnosticError(error: unknown): DiagnosticError {
  const record = isRecord(error) ? error : {};
  const cause = isRecord(record.cause) ? record.cause : {};

  return {
    errorName: readErrorField(record.name),
    errorMessage: readErrorField(record.message),
    errorStack: readErrorField(record.stack)?.slice(0, 1000) ?? null,
    causeName: readErrorField(cause.name),
    causeMessage: readErrorField(cause.message),
    causeCode: readErrorField(cause.code),
    causeErrno: readErrorField(cause.errno),
    causeSyscall: readErrorField(cause.syscall),
    causeHostname: readErrorField(cause.hostname)
  };
}

function readErrorField(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return sanitizeText(String(value));
  return null;
}

function sanitizeText(value: string) {
  const secretValues = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.DEBUG_SECRET,
    process.env.SUPABASE_URL
  ].filter((item): item is string => Boolean(item));

  return secretValues.reduce((text, secret) => text.replaceAll(secret, "[redacted]"), value);
}

function maskIpAddress(value: string) {
  if (value.includes(".")) {
    const parts = value.split(".");
    if (parts.length === 4) return `${parts[0]}.xxx.xxx.xxx`;
  }

  if (value.includes(":")) {
    const firstGroup = value.split(":").find(Boolean) ?? "xxxx";
    return `${firstGroup}:xxxx:xxxx::`;
  }

  return "masked";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}
