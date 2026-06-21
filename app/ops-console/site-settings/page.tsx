"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminSessionMenu } from "@/components/AdminSessionMenu";
import { BrandLogo } from "@/components/BrandLogo";
import {
  getPageManagementState,
  savePageManagementState,
  defaultPageManagementState
} from "@/lib/pageManagementStore";

/**
 * Bir kerelik migration: siteSettingsStore localStorage'ındaki heroTitle/heroSubtitle/logoText
 * değerlerini pageManagementStore'a aktarır.
 * siteSettingsStore.ts silindiği için doğrudan localStorage key'i okuyoruz.
 */
function useSiteSettingsMigration() {
  useEffect(() => {
    const LEGACY_KEY = "dijital-iz-avcisi:site-settings:v1";
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    try {
      const old = JSON.parse(raw) as Record<string, string>;
      const state = getPageManagementState();
      let changed = false;

      // heroTitle
      if (old.heroTitle && old.heroTitle !== defaultPageManagementState.theme.siteHeroTitle
          && state.theme.siteHeroTitle === defaultPageManagementState.theme.siteHeroTitle) {
        state.theme.siteHeroTitle = old.heroTitle;
        changed = true;
      }
      // heroSubtitle
      if (old.heroSubtitle && old.heroSubtitle !== defaultPageManagementState.theme.siteHeroSubtitle
          && state.theme.siteHeroSubtitle === defaultPageManagementState.theme.siteHeroSubtitle) {
        state.theme.siteHeroSubtitle = old.heroSubtitle;
        changed = true;
      }
      // logoText
      if (old.logoText && old.logoText !== defaultPageManagementState.theme.logoText
          && state.theme.logoText === defaultPageManagementState.theme.logoText) {
        state.theme.logoText = old.logoText;
        changed = true;
      }

      if (changed) {
        savePageManagementState(state);
        // Eski key'i temizle — bir daha migrate etmeye gerek kalmasın
        window.localStorage.removeItem(LEGACY_KEY);
        console.info("[Migration] siteSettingsStore → pageManagementStore tamamlandı.");
      }
    } catch {
      // Migration başarısız olsa da sayfa normal çalışır
    }
  }, []);
}

export default function OpsConsoleSiteSettingsPage() {
  useSiteSettingsMigration();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo subtitle="Site Ayarları" />
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console">
              Ops Console
            </Link>
            <Link
              className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-300/20 dark:text-cyan-200"
              href="/ops-console/page-management"
            >
              Sayfa Yönetimi →
            </Link>
            <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/ops-console/content">
              İçerik CMS
            </Link>
            <AdminSessionMenu />
          </div>
        </nav>
      </header>

      <AdminGate>
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Admin CMS</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Site Ayarları</h1>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Tüm site ayarları artık tek bir yerden yönetilmektedir.
            </p>

            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              <Link
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-5 transition hover:border-cyan-300/60 hover:bg-cyan-300/15"
                href="/ops-console/page-management"
              >
                <p className="font-bold text-cyan-700 dark:text-cyan-200">Sayfa Yönetimi → Tema</p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Site adı, logo metni, renk, font, yazı boyutu, köşe yuvarlaklığı, boşluk,
                  hero görseli, arka plan ve ana sayfa hero metinleri.
                </p>
              </Link>
              <Link
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                href="/ops-console/content"
              >
                <p className="font-bold">İçerik CMS</p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Duyurular, siber gündem başlığı, footer metni, hakkımızda ve iletişim
                  içerikleri.
                </p>
              </Link>
            </div>

            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-400/30 dark:bg-amber-400/10">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Favicon değiştirmek için</p>
              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                Favicon değişikliği
                <code className="mx-1 rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-900/40">public/</code>
                klasöründeki dosyaların güncellenmesini ve sitenin yeniden deploy edilmesini gerektirir.
                Bu işlem için geliştirici desteğiyle dosya güncellemesi yapılır.
              </p>
            </div>
          </div>
        </section>
      </AdminGate>
    </main>
  );
}
