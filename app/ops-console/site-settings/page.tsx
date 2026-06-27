"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
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
    <AdminGate>
      <AdminShell activeItem="site-settings">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-400">Admin CMS</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-100 sm:text-4xl">Site Ayarları</h1>
          <p className="mt-4 leading-7 text-slate-400">
            Tüm site ayarları artık tek bir yerden yönetilmektedir.
          </p>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <Link
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-5 transition hover:border-sky-400/60 hover:bg-sky-400/15"
              href="/ops-console/page-management"
            >
              <p className="font-bold text-sky-300">Sayfa Yönetimi → Tema</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Site adı, logo metni, renk, font, yazı boyutu, köşe yuvarlaklığı, boşluk,
                hero görseli, arka plan ve ana sayfa hero metinleri.
              </p>
            </Link>
            <Link
              className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10"
              href="/ops-console/content"
            >
              <p className="font-bold text-slate-100">İçerik CMS</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Duyurular, siber gündem başlığı, footer metni, hakkımızda ve iletişim
                içerikleri.
              </p>
            </Link>
          </div>

          <div className="mt-8 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-left">
            <p className="text-sm font-semibold text-amber-300">Favicon değiştirmek için</p>
            <p className="mt-1 text-xs leading-5 text-amber-400/80">
              Favicon değişikliği
              <code className="mx-1 rounded bg-amber-400/10 px-1 font-mono text-xs">public/</code>
              klasöründeki dosyaların güncellenmesini ve sitenin yeniden deploy edilmesini gerektirir.
              Bu işlem için geliştirici desteğiyle dosya güncellemesi yapılır.
            </p>
          </div>
        </div>
      </AdminShell>
    </AdminGate>
  );
}
