export type UserRole = "user" | "admin";
export type UserStatus = "active" | "pending" | "blocked";

export type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  status: UserStatus;
  /** ISO timestamp — son başarılı giriş zamanı */
  lastLoginAt?: string;
  /** Başarılı giriş sayısı */
  loginCount?: number;
  /** Son bilinen IP (sunucu x-forwarded-for, kesin kimlik değildir) */
  lastKnownIp?: string;
};

// mockUsers kaldırıldı — gerçek kullanıcılar lib/auth.ts getDemoUsers() ile okunuyor
