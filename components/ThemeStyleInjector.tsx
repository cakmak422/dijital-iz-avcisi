"use client";

/**
 * ThemeStyleInjector
 *
 * Faz 1: primaryColor, secondaryColor, pageBackgroundImage
 * Faz 2: fontPairing, sizeScale, radiusStyle, spacingStyle
 *
 * Kural: default değerlerden fark yoksa HİÇBİR şey değiştirmez.
 * Font değişkenleri (.cyber-page üzerinden) → sadece ziyaretçi sayfaları etkilenir,
 * ops-console admin paneli .cyber-page kullanmadığı için etkilenmez.
 */

import { useEffect, useRef } from "react";
import { usePageManagementState, defaultPageManagementState } from "@/lib/pageManagementStore";

const D = defaultPageManagementState.theme;

const STYLE_ID      = "dia-theme-override";
const STYLE_PRESET  = "dia-theme-preset";

function safeColor(value: string, fallback: string): string {
  const t = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return t;
  if (/^rgb/.test(t)) return t;
  return fallback;
}

function safeUrl(value: string): string {
  const t = value.trim();
  if (!t) return "";
  if (/^(javascript|data:text\/html)/i.test(t)) return "";
  return t.replaceAll('"', "%22");
}

// ── Font Preset CSS değerleri ──────────────────────────────────────────────
const FONT_PRESETS: Record<string, string> = {
  system:   `system-ui, -apple-system, "Segoe UI", Arial, sans-serif`,
  mono:     `"Courier New", "Consolas", "Liberation Mono", monospace`,
  editorial:`Georgia, "Times New Roman", "DejaVu Serif", serif`
};
const FONT_BODY_PRESETS: Record<string, string> = {
  system:   `system-ui, -apple-system, "Segoe UI", Arial, sans-serif`,
  mono:     `system-ui, -apple-system, "Segoe UI", Arial, sans-serif`,
  editorial:`system-ui, -apple-system, "Segoe UI", Arial, sans-serif`
};

// ── Size Scale CSS değerleri ───────────────────────────────────────────────
const SIZE_PRESETS: Record<string, Record<string, string>> = {
  compact: { h1: "2.25rem", h2: "1.5rem",   h3: "1.125rem", body: "0.9375rem" },
  normal:  { h1: "2.5rem",  h2: "1.75rem",  h3: "1.25rem",  body: "1rem"      }, // varsayılan
  wide:    { h1: "3rem",    h2: "2.25rem",  h3: "1.5rem",   body: "1.0625rem" }
};

// ── Radius CSS değerleri ───────────────────────────────────────────────────
const RADIUS_PRESETS: Record<string, Record<string, string>> = {
  sharp: { card: "4px",   btn: "4px",   lg: "6px"   },
  soft:  { card: "8px",   btn: "6px",   lg: "12px"  }, // varsayılan (Tailwind rounded-lg = 8px)
  round: { card: "16px",  btn: "999px", lg: "24px"  }
};

// ── Spacing CSS değerleri ──────────────────────────────────────────────────
const SPACING_PRESETS: Record<string, Record<string, string>> = {
  tight:  { section: "1.5rem", card: "1rem",    gap: "0.75rem" },
  normal: { section: "2.5rem", card: "1.25rem", gap: "1rem"    }, // varsayılan
  airy:   { section: "4rem",   card: "2rem",    gap: "1.5rem"  }
};

function buildPresetCss(theme: typeof D): string {
  const font    = FONT_PRESETS[theme.fontPairing]     ?? FONT_PRESETS.system;
  const fontBod = FONT_BODY_PRESETS[theme.fontPairing]?? FONT_BODY_PRESETS.system;
  const sz      = SIZE_PRESETS[theme.sizeScale]       ?? SIZE_PRESETS.normal;
  const rx      = RADIUS_PRESETS[theme.radiusStyle]   ?? RADIUS_PRESETS.soft;
  const sp      = SPACING_PRESETS[theme.spacingStyle] ?? SPACING_PRESETS.normal;

  // Font: .cyber-page üzerinden → sadece public sayfalar, admin paneli değil
  return `
    .cyber-page {
      --font-heading: ${font};
      --font-body:    ${fontBod};
      --size-h1:      ${sz.h1};
      --size-h2:      ${sz.h2};
      --size-h3:      ${sz.h3};
      --size-body:    ${sz.body};
      --radius-card:  ${rx.card};
      --radius-btn:   ${rx.btn};
      --radius-lg:    ${rx.lg};
      --spacing-section: ${sp.section};
      --spacing-card:    ${sp.card};
      --spacing-gap:     ${sp.gap};
    }
  `;
}

function isAllPresetDefault(theme: typeof D): boolean {
  return (
    theme.fontPairing  === D.fontPairing  &&
    theme.sizeScale    === D.sizeScale    &&
    theme.radiusStyle  === D.radiusStyle  &&
    theme.spacingStyle === D.spacingStyle
  );
}

export function ThemeStyleInjector() {
  const { theme } = usePageManagementState();
  const colorElRef  = useRef<HTMLStyleElement | null>(null);
  const presetElRef = useRef<HTMLStyleElement | null>(null);

  // ── Renk override ─────────────────────────────────────────────────────
  useEffect(() => {
    const isDefaultPrimary   = theme.primaryColor   === D.primaryColor;
    const isDefaultSecondary = theme.secondaryColor === D.secondaryColor;

    if (isDefaultPrimary && isDefaultSecondary) {
      document.getElementById(STYLE_ID)?.remove();
      colorElRef.current = null;
      return;
    }

    const p = safeColor(theme.primaryColor,   D.primaryColor);
    const s = safeColor(theme.secondaryColor, D.secondaryColor);

    const css = `
      .cyber-button-primary,
      .site-shell :where(.btn-primary) {
        background: linear-gradient(135deg, ${p}, ${s} 54%, #0f172a) !important;
        border-color: ${p}57 !important;
        box-shadow: 0 0 0 1px ${p}29, 0 16px 42px ${p}42 !important;
      }
      .cyber-button-primary:hover,
      .site-shell :where(.btn-primary:hover) {
        background: linear-gradient(135deg, ${p}cc, ${s}cc 55%, #0f172a) !important;
        border-color: ${p}99 !important;
      }
    `;

    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) { el = document.createElement("style"); el.id = STYLE_ID; document.head.appendChild(el); }
    el.textContent = css;
    colorElRef.current = el;
  }, [theme.primaryColor, theme.secondaryColor]);

  // ── Preset override (font/size/radius/spacing) ─────────────────────────
  useEffect(() => {
    if (isAllPresetDefault(theme)) {
      document.getElementById(STYLE_PRESET)?.remove();
      presetElRef.current = null;
      return;
    }

    const css = buildPresetCss(theme);
    let el = document.getElementById(STYLE_PRESET) as HTMLStyleElement | null;
    if (!el) { el = document.createElement("style"); el.id = STYLE_PRESET; document.head.appendChild(el); }
    el.textContent = css;
    presetElRef.current = el;
  }, [theme.fontPairing, theme.sizeScale, theme.radiusStyle, theme.spacingStyle]);

  // Cleanup
  useEffect(() => {
    return () => {
      document.getElementById(STYLE_ID)?.remove();
      document.getElementById(STYLE_PRESET)?.remove();
    };
  }, []);

  // ── Sayfa arka plan overlay ────────────────────────────────────────────
  const isDefaultBg = theme.pageBackgroundImage === D.pageBackgroundImage;
  if (isDefaultBg) return null;

  const bgUrl = safeUrl(theme.pageBackgroundImage);
  if (!bgUrl) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        backgroundImage: `url("${bgUrl}")`, backgroundPosition: "center top",
        backgroundRepeat: "repeat-y", backgroundSize: "cover",
        bottom: 0, left: 0, opacity: 0.55, pointerEvents: "none",
        position: "fixed", right: 0, top: 0, zIndex: -20
      }}
    />
  );
}
