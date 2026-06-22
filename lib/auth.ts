import { User } from "@/lib/users";

export type DemoAuthRecord = {
  user: User;
  password: string;
};

const USERS_KEY   = "dijital-iz-avcisi-demo-users";
const SESSION_KEY = "dijital-iz-avcisi-demo-session";

/**
 * Seed admin: password alanı "server-verified" placeholder.
 * Gerçek admin şifresi sunucuda ADMIN_PASSPHRASE_HASH / DEMO_ADMIN_PASSWORD
 * env değişkenleriyle tutulur — client tarafına GÖNDERİLMEZ.
 * NEXT_PUBLIC_DEMO_ADMIN_PASSWORD kaldırıldı.
 */
const seededUsers: DemoAuthRecord[] = [
  {
    user: {
      id:              "demo-admin",
      username:        process.env.NEXT_PUBLIC_DEMO_ADMIN_USERNAME ?? "admin",
      email:           process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL    ?? "admin@dijitalizavcisi.com",
      firstName:       "Demo",
      lastName:        "Admin",
      birthDate:       "1990-01-01",
      phone:           "",
      role:            "admin",
      isEmailVerified: true,
      createdAt:       "2026-06-01",
      status:          "active"
    },
    // Şifre artık client'ta saklanmıyor — sunucu taraflı ADMIN_PASSPHRASE_HASH ile doğrulanır
    password: "server-verified"
  }
];

function normalizeSeededUsers(records: DemoAuthRecord[]) {
  const safeRecords = records.filter((record) => record.user.role !== "admin");
  const adminSeed   = seededUsers.find((record) => record.user.role === "admin");
  if (!adminSeed) return safeRecords;
  return [...safeRecords, adminSeed];
}

export function getDemoUsers(): DemoAuthRecord[] {
  if (typeof window === "undefined") return seededUsers;

  const stored = window.localStorage.getItem(USERS_KEY);
  if (!stored) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  }

  try {
    const parsed     = JSON.parse(stored) as DemoAuthRecord[];
    const normalized = normalizeSeededUsers(parsed);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  }
}

export function saveDemoUser(user: User, password: string) {
  if (typeof window === "undefined") return;

  const users     = getDemoUsers();
  const nextUsers = users.filter(
    (record) => record.user.email !== user.email && record.user.username !== user.username
  );
  nextUsers.push({ user, password });
  window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
}

/**
 * Giriş meta verilerini günceller: loginCount, lastLoginAt, lastKnownIp.
 * Hem admin hem normal kullanıcı için kullanılır.
 * İlk girişte loginCount undefined olabilir — (loginCount ?? 0) + 1 ile güvenli artış.
 */
export function updateUserLoginMeta(userId: string, lastKnownIp: string, lastLoginAt: string) {
  if (typeof window === "undefined") return;

  const records = getDemoUsers();
  const idx     = records.findIndex((r) => r.user.id === userId);
  if (idx === -1) return;

  const prev = records[idx].user;
  const updated: User = {
    ...prev,
    lastLoginAt,
    lastKnownIp,
    loginCount: (prev.loginCount ?? 0) + 1
  };

  records[idx] = { ...records[idx], user: updated };
  window.localStorage.setItem(USERS_KEY, JSON.stringify(records));

  // SESSION_KEY de güncelle (açık oturum varsa yansısın)
  const sessionStored = window.localStorage.getItem(SESSION_KEY);
  if (sessionStored) {
    try {
      const sessionUser = JSON.parse(sessionStored) as User;
      if (sessionUser.id === userId) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      }
    } catch {/* ignore */}
  }
}

/**
 * Sadece NON-ADMIN kullanıcılar için client-side giriş.
 * Admin girişi LoginForm içinde doğrudan /api/auth/session üzerinden yapılır.
 */
export function loginDemoUser(identifier: string, password: string): User | null {
  const normalized = identifier.trim().toLowerCase();
  const record     = getDemoUsers().find(
    (item) =>
      (item.user.email.toLowerCase() === normalized ||
        item.user.username.toLowerCase() === normalized) &&
      item.user.role !== "admin" && // admin bu yolu kullanmaz
      item.password === password &&
      item.user.status === "active" &&
      item.user.isEmailVerified
  );

  if (!record) return null;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(record.user));
  }

  return record.user;
}

export function getCurrentDemoUser(): User | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function logoutDemoUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  // Çerez temizleme /api/auth/session DELETE endpoint'i tarafından yapılır
  void fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
}

/** Admin kullanıcısını identifier'a göre bul (şifre kontrolü yapma) */
export function findAdminByIdentifier(identifier: string): User | null {
  const normalized = identifier.trim().toLowerCase();
  const record     = getDemoUsers().find(
    (item) =>
      item.user.role === "admin" &&
      (item.user.email.toLowerCase()    === normalized ||
       item.user.username.toLowerCase() === normalized)
  );
  return record?.user ?? null;
}

/** Admin için localStorage oturumunu kaydet (çerez /api/auth/session'dan gelir) */
export function setAdminSession(user: User) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
