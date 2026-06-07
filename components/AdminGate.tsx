"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentDemoUser } from "@/lib/auth";
import { User } from "@/lib/users";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    setUser(getCurrentDemoUser());
  }, []);

  if (user === undefined) {
    return <div className="px-4 py-10 text-center text-sm text-slate-500">Yetki kontrolü yapiliyor...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          <p className="text-sm font-semibold uppercase tracking-[0.14em]">Admin erişimi</p>
          <h1 className="mt-2 text-2xl font-bold">Bu alan yalnızca yonetiçi erişimine açıktır.</h1>
          <p className="mt-3 leading-7">Admin olmayan kullanıcılar yonetim sayfalarini görüntüleyemez.</p>
          <Link className="mt-5 inline-flex rounded-md bg-slate-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-slate-950" href="/giris-yap">
            Giriş Yap
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
