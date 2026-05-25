import { mockUsers, User } from "@/lib/users";

export type DemoAuthRecord = {
  user: User;
  password: string;
};

const USERS_KEY = "dijital-iz-avcisi-demo-users";
const SESSION_KEY = "dijital-iz-avcisi-demo-session";

const seededUsers: DemoAuthRecord[] = mockUsers
  .filter((user) => user.status === "active" && user.isEmailVerified)
  .map((user) => ({
    user,
    password: user.role === "admin" ? "Admin12345" : "Demo12345"
  }));

export function getDemoUsers(): DemoAuthRecord[] {
  if (typeof window === "undefined") return seededUsers;

  const stored = window.localStorage.getItem(USERS_KEY);
  if (!stored) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  }

  try {
    return JSON.parse(stored) as DemoAuthRecord[];
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
