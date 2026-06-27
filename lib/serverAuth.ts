/**
 * serverAuth.ts — Sunucu taraflı oturum imzalama ve doğrulama
 * Node.js yerleşik crypto kullanır, dış bağımlılık yok.
 */

import crypto from "node:crypto";

// ── Sabitler ─────────────────────────────────────────────────────────────────

const SCRYPT_SALT    = "dia-admin-v1";
const SCRYPT_KEYLEN  = 32;
const SESSION_SEP    = ".";
const SESSION_EXPIRY = 28800; // 8 saat
export const SESSION_COOKIE  = "__Host-dia_session";
export const DEV_COOKIE      = "dia_session";       // dev/HTTP için (non-__Host-)

// ── Rate limit (in-memory) ────────────────────────────────────────────────────

const RL_MAP = new Map<string, { count: number; resetAt: number }>();

/**
 * Genel rate limiter. key = "prefix:ip" formatında kullan.
 * Aynı Map'i paylaşır; prefix farklı olduğu için çakışma olmaz.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now   = Date.now();
  const entry = RL_MAP.get(key);

  if (!entry || now > entry.resetAt) {
    RL_MAP.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Geriye dönük uyumluluk — admin session endpoint'i bu fonksiyonu kullanıyor */
export function checkSessionRateLimit(ip: string): boolean {
  return checkRateLimit(`session:${ip}`, 5, 60_000);
}

// ── HMAC session ──────────────────────────────────────────────────────────────

function getSessionSecret(): string {
  const secret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET tanımlı değil. Production'da zorunludur.");
  }

  console.warn("[serverAuth] ADMIN_SESSION_SECRET tanımlı değil — development fallback kullanılıyor.");
  return "dev-insecure-fallback-do-not-use-in-production";
}

/** payload = userId|role|iat → base64url(payload).base64url(HMAC) */
export function signSession(userId: string, role: string): string {
  const secret  = getSessionSecret();
  const iat     = Math.floor(Date.now() / 1000);
  const payload = `${userId}|${role}|${iat}`;
  const payB64  = Buffer.from(payload).toString("base64url");
  const mac     = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payB64}${SESSION_SEP}${mac}`;
}

/** Çerez değerini doğrular, geçerliyse {userId, role} döner */
export function verifySession(token: string): { userId: string; role: string } | null {
  if (!token) return null;

  const parts = token.split(SESSION_SEP);
  if (parts.length !== 2) return null;

  const [payB64, mac] = parts;

  try {
    const payload     = Buffer.from(payB64, "base64url").toString();
    const secret      = getSessionSecret();
    const expectedMac = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

    // Sabit-süreli karşılaştırma (timing attack engeli)
    if (!timingSafeEqualStrings(mac, expectedMac)) return null;

    const [userId, role, iatStr] = payload.split("|");
    if (!userId || !role || !iatStr) return null;

    const age = Math.floor(Date.now() / 1000) - parseInt(iatStr, 10);
    if (age > SESSION_EXPIRY || age < 0) return null;

    return { userId, role };
  } catch {
    return null;
  }
}

// ── Admin passphrase doğrulama ────────────────────────────────────────────────

export function verifyAdminPassphrase(passphrase: string): boolean {
  if (!passphrase) return false;

  const storedHex = (process.env.ADMIN_PASSPHRASE_HASH ?? "").trim();

  if (!storedHex) {
    if (process.env.NODE_ENV === "production") {
      console.error("[serverAuth] ADMIN_PASSPHRASE_HASH tanımlı değil — admin girişi devre dışı.");
      return false;
    }

    // Development: DEMO_ADMIN_PASSWORD ile doğrudan karşılaştır (fallback)
    const devPass = (process.env.DEMO_ADMIN_PASSWORD ?? "").trim();
    if (!devPass) {
      console.warn("[serverAuth] ADMIN_PASSPHRASE_HASH ve DEMO_ADMIN_PASSWORD yok — admin girişi devre dışı.");
      return false;
    }
    console.warn("[serverAuth] Development fallback: DEMO_ADMIN_PASSWORD kullanılıyor.");
    return timingSafeEqualStrings(passphrase, devPass);
  }

  try {
    const computed = crypto.scryptSync(passphrase, SCRYPT_SALT, SCRYPT_KEYLEN);
    const stored   = Buffer.from(storedHex, "hex");
    if (computed.length !== stored.length) return false;
    // timingSafeEqual — passphrase karşılaştırması sabit süreli (timing attack engeli)
    return crypto.timingSafeEqual(computed, stored);
  } catch {
    return false;
  }
}

// ── API route'ları için admin kontrol yardımcısı ────────────────────────────

/**
 * Mevcut request'in cookies'inden admin oturumu doğrular.
 * Tüm API route'larında ortak kullanım için.
 */
export async function validateAdminFromCookies(): Promise<{ ok: boolean; status: number; error: string }> {
  const result = await getAdminSessionFromCookies();
  if (!result) return { ok: false, status: 401, error: "Admin oturumu gerekir." };
  return { ok: true, status: 200, error: "" };
}

/**
 * Cookie'den admin oturumunu okur ve { userId, role } döner.
 * Geçersiz veya eksik token'da null döner.
 * PATCH endpoint'lerinde "kendi hesabını değiştirme" kontrolü için kullanılır.
 */
export async function getAdminSessionFromCookies(): Promise<{ userId: string; role: string } | null> {
  const { cookies } = await import("next/headers");
  const cookieStore  = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  const token =
    cookieStore.get(SESSION_COOKIE)?.value ??
    (!isProduction ? cookieStore.get(DEV_COOKIE)?.value : undefined);

  if (!token) return null;

  const session = verifySession(token);
  if (!session || session.role !== "admin") return null;

  return session;
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Uzunluk farkını gizlemek için yine de compare yap (side-channel azaltma)
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
