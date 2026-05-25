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
};

export const mockUsers: User[] = [
  {
    id: "usr-001",
    username: "demo_user",
    email: "demo@dijitalizavcisi.com",
    firstName: "Demo",
    lastName: "Kullanici",
    birthDate: "1998-04-12",
    phone: "+90 555 000 00 00",
    role: "user",
    isEmailVerified: true,
    createdAt: "24.05.2026",
    status: "active"
  },
  {
    id: "usr-002",
    username: "pending_user",
    email: "bekleyen@example.com",
    firstName: "Bekleyen",
    lastName: "Uye",
    birthDate: "2001-09-03",
    phone: "+90 532 000 00 00",
    role: "user",
    isEmailVerified: false,
    createdAt: "24.05.2026",
    status: "pending"
  },
  {
    id: "usr-003",
    username: "admin",
    email: "admin@dijitalizavcisi.com",
    firstName: "Platform",
    lastName: "Admin",
    birthDate: "1990-01-01",
    phone: "+90 212 000 00 00",
    role: "admin",
    isEmailVerified: true,
    createdAt: "23.05.2026",
    status: "active"
  }
];
