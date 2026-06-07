import { User } from "@/lib/users";

export type DemoAuthRecord = {
  user: User;
  password: string;
};

const USERS_KEY = "dijital-iz-avcisi-demo-users";
const SESSION_KEY = "dijital-iz-avcisi-demo-session";
const DEMO_SESSION_COOKIE = "dia_session";
const DEMO_ROLE_COOKIE = "dia_role";

// Demo admin is only for local/admin panel access in the current frontend MVP.
// This is not production authentication; real deployment needs backend auth,
// password hashing, server-side authorization, and HttpOnly Secure sessions.
const seededUsers: DemoAuthRecord[] = [
  {
    user: {
      id: "demo-admin",
      username: process.env.NEXT_PUBLIC_DEMO_ADMIN_USERNAME ?? "admin",
      email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "admin@dijitalizavcisi.com",
      firstName: "Demo",
      lastName: "Admin",
      birthDate: "1990-01-01",
      phone: "",
      role: "admin",
      isEmailVerified: true,
      createdAt: "2026-06-01",
      status: "active"
    },
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? "Gokce42+-"
  }
];

function normalizeSeededUsers(records: DemoAuthRecord[]) {
  const safeRecords = records.filter((record) => record.user.role !== "admin");
  const adminSeed = seededUsers.find((record) => record.user.role === "admin");
  if (!adminSeed) return safeRecords;

  const withoutAdmin = safeRecords.filter((record) => record.user.role !== "admin");
  return [...withoutAdmin, adminSeed];
}

export function getDemoUsers(): DemoAuthRecord[] {
  if (typeof window === "undefined") return seededUsers;

  const stored = window.localStorage.getItem(USERS_KEY);
  if (!stored) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  }

  try {
    const parsed = JSON.parse(stored) as DemoAuthRecord[];
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

  const users = getDemoUsers();
  const nextUsers = users.filter((record) => record.user.email !== user.email && record.user.username !== user.username);
  nextUsers.push({ user, password });
  window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
}

export function loginDemoUser(identifier: string, password: string): User | null {
  const normalized = identifier.trim().toLowerCase();
  const record = getDemoUsers().find(
    (item) =>
      (item.user.email.toLowerCase() === normalized || item.user.username.toLowerCase() === normalized) &&
      item.password === password &&
      item.user.status === "active" &&
      item.user.isEmailVerified
  );

  if (!record) return null;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(record.user));
    setDemoSessionCookies(record.user);
  }

  return record.user;
}

export function getCurrentDemoUser(): User | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const user = JSON.parse(stored) as User;
    setDemoSessionCookies(user);
    return user;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    clearDemoSessionCookies();
    return null;
  }
}

export function logoutDemoUser() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_KEY);
  clearDemoSessionCookies();
}

function setDemoSessionCookies(user: User) {
  const maxAge = 60 * 60 * 8;
  document.cookie = `${DEMO_SESSION_COOKIE}=demo-session; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
  document.cookie = `${DEMO_ROLE_COOKIE}=${user.role}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;

  if (window.location.protocol === "https:") {
    document.cookie = `__Host-${DEMO_SESSION_COOKIE}=demo-session; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
    document.cookie = `__Host-${DEMO_ROLE_COOKIE}=${user.role}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  }
}

function clearDemoSessionCookies() {
  document.cookie = `${DEMO_SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `${DEMO_ROLE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `__Host-${DEMO_SESSION_COOKIE}=; Path=/; Secure; SameSite=Lax; Max-Age=0`;
  document.cookie = `__Host-${DEMO_ROLE_COOKIE}=; Path=/; Secure; SameSite=Lax; Max-Age=0`;
}
