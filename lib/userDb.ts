/**
 * userDb.ts — Supabase app_users / otp_codes tabloları için sunucu taraflı CRUD.
 * Tüm fonksiyonlar SADECE sunucu ortamında çalışır (API route'ları, Server Actions).
 * Client component'lere import ETMEYİN.
 *
 * Şifre hash formatı: "<16-byte-hex-salt>:<64-byte-hex-scrypt-hash>"
 * OTP hash formatı  : SHA-256(code) hex string — kodu düz metin saklamıyoruz.
 */

import crypto from "node:crypto";
import type { UserRole, UserStatus } from "@/lib/users";

// ── Sabitler ─────────────────────────────────────────────────────────────────

const SCRYPT_KEYLEN  = 64;
const SCRYPT_PARAMS  = { N: 16384, r: 8, p: 1 } as const; // OWASP önerisi
const OTP_TTL_MS     = 5 * 60 * 1000; // 5 dakika

// ── Supabase istemcisi ────────────────────────────────────────────────────────

function getSupabase() {
  const url        = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase yapılandırması eksik. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlanmalıdır."
    );
  }

  return { url, serviceKey };
}

type SupabaseFetchOptions = {
  method?:  string;
  headers?: Record<string, string>;
  body?:    unknown;
};

async function supabaseFetch<T>(
  path: string,
  options: SupabaseFetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const { url, serviceKey } = getSupabase();
  const { body, headers: extraHeaders, method } = options;
  const httpMethod = method ?? "GET";

  // newsDb.ts ile aynı kalıp: Prefer sadece açıkça verilince eklenir (GET'e eklenmez)
  const baseHeaders: Record<string, string> = {
    "Content-Type":  "application/json",
    "apikey":        serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
  };

  // Mutasyonlar (POST/PATCH/DELETE) için varsayılan Prefer; extraHeaders geçersiz kılabilir
  if (httpMethod !== "GET" && !extraHeaders?.["Prefer"]) {
    baseHeaders["Prefer"] = "return=representation";
  }

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method: httpMethod,
      headers: { ...baseHeaders, ...(extraHeaders ?? {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { message = (JSON.parse(text) as { message?: string }).message ?? message; } catch { /* ignore */ }
      return { data: null, error: message };
    }

    if (!text) return { data: null, error: null };

    return { data: JSON.parse(text) as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

// ── Şifre Hash / Doğrulama ───────────────────────────────────────────────────

/** Rastgele salt ile scrypt hash üretir. Dönen format: "saltHex:hashHex" */
export function hashPassword(password: string): string {
  const salt    = crypto.randomBytes(16).toString("hex");
  const hash    = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `${salt}:${hash.toString("hex")}`;
}

/** "saltHex:hashHex" formatındaki hash ile düz metin şifreyi karşılaştırır. */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  try {
    const computed = crypto.scryptSync(password, saltHex, SCRYPT_KEYLEN, SCRYPT_PARAMS);
    const expected = Buffer.from(hashHex, "hex");
    if (computed.length !== expected.length) return false;
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

// ── OTP Hash ─────────────────────────────────────────────────────────────────

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// ── Tipler ───────────────────────────────────────────────────────────────────

export type DbUser = {
  id:             string;
  username:       string;
  email:          string;
  first_name:     string;
  last_name:      string;
  birth_date:     string;
  phone:          string;
  role:           UserRole;
  status:         UserStatus;
  email_verified: boolean;
  created_at:     string;
  last_login_at:  string | null;
  login_count:    number;
  last_known_ip:  string | null;
  consent_given:  boolean;
  consent_at:     string | null;
  consent_ip:     string | null;
  // password_hash döndürülmez — SELECT sorgularında hariç tutulur
};

export type CreateUserInput = {
  username:    string;
  email:       string;
  firstName:   string;
  lastName:    string;
  birthDate:   string;
  phone:       string;
  password:    string; // düz metin — burada hash'lenir
  consentAt:   string; // ISO timestamp — OTP doğrulandığı an
  consentIp:   string; // kayıt isteğinin IP'si
};

// ── OTP Fonksiyonları ─────────────────────────────────────────────────────────

/**
 * Yeni OTP kaydeder. Önce aynı e-posta için used=false olan eski kodları geçersiz kılar.
 * (Faz 2 notu: send-otp route'u bu fonksiyonu kullanır)
 */
export async function saveOtp(email: string, code: string): Promise<{ error: string | null }> {
  // 1. Önceki aktif OTP'leri geçersiz kıl
  await supabaseFetch(`otp_codes?email=eq.${encodeURIComponent(email)}&used=eq.false`, {
    method:  "PATCH",
    body:    { used: true },
    headers: { "Prefer": "return=minimal" },
  });

  // 2. Yeni OTP kaydet
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const { error } = await supabaseFetch<unknown>("otp_codes", {
    method: "POST",
    body: {
      email,
      code_hash:  hashOtp(code),
      expires_at: expiresAt,
      used:       false,
    },
    headers: { "Prefer": "return=minimal" },
  });

  return { error };
}

/**
 * OTP kodunu doğrular. Geçerliyse used=true yapar ve true döner.
 * Geçersiz, süresi dolmuş veya zaten kullanılmışsa false döner.
 */
export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const codeHash = hashOtp(code);
  const now      = new Date().toISOString();

  // Eşleşen, kullanılmamış, süresi dolmamış OTP kaydını bul
  const { data } = await supabaseFetch<Array<{ id: string }>>(
    `otp_codes?email=eq.${encodeURIComponent(email)}&code_hash=eq.${codeHash}&used=eq.false&expires_at=gte.${now}&select=id&limit=1`
  );

  if (!data || data.length === 0) return false;

  const id = data[0].id;

  // Kullanıldı olarak işaretle
  await supabaseFetch(`otp_codes?id=eq.${id}`, {
    method:  "PATCH",
    body:    { used: true },
    headers: { "Prefer": "return=minimal" },
  });

  return true;
}

// ── Kullanıcı Fonksiyonları ───────────────────────────────────────────────────

const USER_COLUMNS = "id,username,email,first_name,last_name,birth_date,phone,role,status,email_verified,created_at,last_login_at,login_count,last_known_ip,consent_given,consent_at,consent_ip";

/** Yeni kullanıcı oluşturur. Şifreyi burada hash'ler. */
export async function createUser(
  input: CreateUserInput
): Promise<{ user: DbUser | null; error: string | null }> {
  const passwordHash = hashPassword(input.password);

  const { data, error } = await supabaseFetch<DbUser[]>("app_users", {
    method: "POST",
    body: {
      username:       input.username,
      email:          input.email,
      first_name:     input.firstName,
      last_name:      input.lastName,
      birth_date:     input.birthDate,
      phone:          input.phone,
      password_hash:  passwordHash,
      role:           "user",
      status:         "active",
      email_verified: true,  // OTP doğrulandıktan sonra çağrılır
      consent_given:  true,
      consent_at:     input.consentAt,
      consent_ip:     input.consentIp,
    },
    headers: { "Prefer": "return=representation" },
  });

  if (error || !data || data.length === 0) {
    return { user: null, error: error ?? "Kullanıcı oluşturulamadı." };
  }

  return { user: data[0], error: null };
}

/** E-posta veya kullanıcı adıyla kullanıcı bulur (login için). password_hash dahil. */
export async function getUserByIdentifierWithHash(
  identifier: string
): Promise<{ user: (DbUser & { password_hash: string }) | null; error: string | null }> {
  const encoded = encodeURIComponent(identifier);
  const { data, error } = await supabaseFetch<Array<DbUser & { password_hash: string }>>(
    `app_users?or=(email.eq.${encoded},username.eq.${encoded})&select=${USER_COLUMNS},password_hash&limit=1`
  );

  if (error) return { user: null, error };
  if (!data || data.length === 0) return { user: null, error: null };
  return { user: data[0], error: null };
}

/** Tüm kullanıcıları listeler (admin panel için). password_hash hariç. */
export async function getAllUsers(): Promise<{ users: DbUser[]; error: string | null }> {
  const { data, error } = await supabaseFetch<DbUser[]>(
    `app_users?select=${USER_COLUMNS}&order=created_at.desc`
  );

  return { users: data ?? [], error };
}

/** Tek kullanıcı detayı (admin panel için). password_hash hariç. */
export async function getUserById(id: string): Promise<{ user: DbUser | null; error: string | null }> {
  const { data, error } = await supabaseFetch<DbUser[]>(
    `app_users?id=eq.${encodeURIComponent(id)}&select=${USER_COLUMNS}&limit=1`
  );

  if (error) return { user: null, error };
  if (!data || data.length === 0) return { user: null, error: null };
  return { user: data[0], error: null };
}

/** Kullanıcı durumunu günceller (admin paneli durum değiştirme). */
export async function updateUserStatus(
  id: string,
  status: UserStatus
): Promise<{ error: string | null }> {
  const { error } = await supabaseFetch(`app_users?id=eq.${encodeURIComponent(id)}`, {
    method:  "PATCH",
    body:    { status },
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

/** Başarılı giriş sonrası meta verileri günceller. */
export async function updateLoginMeta(
  id: string,
  lastKnownIp: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseFetch(`app_users?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      last_login_at: new Date().toISOString(),
      last_known_ip: lastKnownIp,
      // login_count Supabase'de DB taraflı artırılacak; şimdilik +1 client-side:
    },
    headers: { "Prefer": "return=minimal" },
  });
  return { error };
}

/**
 * login_count'u atomik olarak artırır (Supabase RPC olmadan güvenli değil —
 * şimdilik mevcut değeri okuyup +1 yazıyoruz, düşük trafik için yeterli).
 */
export async function incrementLoginCount(id: string): Promise<void> {
  const { user } = await getUserById(id);
  if (!user) return;
  await supabaseFetch(`app_users?id=eq.${encodeURIComponent(id)}`, {
    method:  "PATCH",
    body:    { login_count: (user.login_count ?? 0) + 1 },
    headers: { "Prefer": "return=minimal" },
  });
}

// ── Tip dönüştürücü ──────────────────────────────────────────────────────────

/** Supabase satırını UI'da kullanılan User tipine çevirir. */
export function dbUserToUser(db: DbUser): import("@/lib/users").User {
  return {
    id:              db.id,
    username:        db.username,
    email:           db.email,
    firstName:       db.first_name,
    lastName:        db.last_name,
    birthDate:       db.birth_date,
    phone:           db.phone,
    role:            db.role,
    isEmailVerified: db.email_verified,
    createdAt:       db.created_at,
    status:          db.status,
    lastLoginAt:     db.last_login_at ?? undefined,
    loginCount:      db.login_count,
    lastKnownIp:     db.last_known_ip ?? undefined,
  };
}

/** E-posta zaten kayıtlı mı kontrol eder. */
export async function emailExists(email: string): Promise<boolean> {
  const { data } = await supabaseFetch<Array<{ id: string }>>(
    `app_users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
  );
  return Array.isArray(data) && data.length > 0;
}

/** Kullanıcı adı zaten kayıtlı mı kontrol eder. */
export async function usernameExists(username: string): Promise<boolean> {
  const { data } = await supabaseFetch<Array<{ id: string }>>(
    `app_users?username=eq.${encodeURIComponent(username)}&select=id&limit=1`
  );
  return Array.isArray(data) && data.length > 0;
}
