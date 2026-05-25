"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentDemoUser } from "@/lib/auth";
import { User } from "@/lib/users";

export function UserSessionBanner() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentDemoUser());
  }, []);

  if (!user) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
        Aktif demo oturumu bulunmuyor. Kayıt olup e-posta doğrulamasını tamamladıktan sonra giriş yapabilirsiniz.
        <Link className="ml-2 font-bold underline" href="/giris-yap">
          Giriş yap
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
      Oturum açık: <span className="font-bold">{user.username}</span> ({user.email}) · E-posta doğrulandı.
    </div>
  );
}
