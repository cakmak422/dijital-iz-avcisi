"use client";

import { useEffect, useMemo, useState } from "react";

export type SiteSettings = {
  siteName: string;
  logoText: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  updatedAt: string;
};

const storageKey = "dijital-iz-avcisi:site-settings:v1";
const changedEventName = "dijital-iz-avcisi-site-settings-changed";

export const defaultSiteSettings: SiteSettings = {
  siteName: "Dijital Iz Avcisi",
  logoText: "Dijital Iz Avcisi",
  favicon: "/favicon.ico",
  primaryColor: "#0f172a",
  secondaryColor: "#0891b2",
  textColor: "#0f172a",
  backgroundColor: "#f8fafc",
  updatedAt: "2026-06-01T00:00:00.000Z"
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isValidSettings(value: Partial<SiteSettings>) {
  return Boolean(
    value.siteName &&
      value.logoText &&
      value.favicon &&
      value.primaryColor &&
      value.secondaryColor &&
      value.textColor &&
      value.backgroundColor
  );
}

function normalizeSettings(value: Partial<SiteSettings>) {
  if (!isValidSettings(value)) {
    return defaultSiteSettings;
  }

  return {
    ...defaultSiteSettings,
    ...value,
    updatedAt: value.updatedAt ?? defaultSiteSettings.updatedAt
  };
}

export function getSiteSettings(): SiteSettings {
  if (!canUseStorage()) {
    return defaultSiteSettings;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSiteSettings;

    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return normalizeSettings(parsed);
  } catch {
    return defaultSiteSettings;
  }
}

export function saveSiteSettings(settings: SiteSettings) {
  const nextSettings: SiteSettings = {
    ...normalizeSettings(settings),
    updatedAt: new Date().toISOString()
  };

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    window.dispatchEvent(new Event(changedEventName));
  }

  // TODO: Bu localStorage store ileride PostgreSQL/Supabase tabanli
  // kalici site ayarlari servisine tasinacak.
  return nextSettings;
}

export function resetSiteSettings() {
  const resetSettings = {
    ...defaultSiteSettings,
    updatedAt: new Date().toISOString()
  };

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(resetSettings));
    window.dispatchEvent(new Event(changedEventName));
  }

  return resetSettings;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => getSiteSettings());

  useEffect(() => {
    const refresh = () => setSettings(getSiteSettings());

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(changedEventName, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(changedEventName, refresh);
    };
  }, []);

  return useMemo(() => settings, [settings]);
}
