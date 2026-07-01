import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeStyleInjector } from "@/components/ThemeStyleInjector";
import { getAllContent } from "@/lib/contentDb";
import { SiteContentProvider } from "@/lib/contentContext";
import { getAllPageManagementData } from "@/lib/pageManagementDb";
import { PageManagementProvider } from "@/lib/pageManagementContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dijitalizavcisi.com"),
  title: {
    default: "Dijital İz Avcısı",
    template: "%s | Dijital İz Avcısı"
  },
  description:
    "Dijital İz Avcısı, alışveriş linkleri, satıcı sinyalleri, yorum örüntüleri ve dijital risk göstergelerini analiz eden AI destekli güvenlik ve farkındalık platformudur.",
  keywords: [
    "Dijital İz Avcısı",
    "alışveriş güvenliği",
    "phishing kontrolü",
    "sahte link analizi",
    "satıcı güven skoru",
    "siber farkındalık",
    "AI risk analizi"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Dijital İz Avcısı",
    description:
      "AI destekli alışveriş güvenliği, siber farkındalık ve dijital risk analizi platformu.",
    url: "/",
    siteName: "Dijital İz Avcısı",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        // TODO: /public/og-image.png (1200x630) üretilince bu path güncellenmeli.
        // Mevcut logo.png 1536x1024 ve 2.3MB — OG için ideal değil.
        url: "/dijital-iz-avcisi-logo.png",
        width: 1200,
        height: 630,
        alt: "Dijital İz Avcısı"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Dijital İz Avcısı",
    description:
      "Alışveriş linkleri, satıcı sinyalleri ve dijital risk göstergeleri için AI destekli güvenlik platformu.",
    images: ["/logo.png"]
  },
  robots: {
    index: true,
    follow: true
  },
  icons: {
    // favicon.ico mevcut hali 2.3MB / 1536x1024 — üzerine yazılmış logo.png kopyası.
    // Gerçek .ico (16x16 veya 32x32) üretilince /public/favicon.ico değiştirilmeli.
    // Tarayıcılar favicon-32.png'yi PNG önceliğiyle doğru seçer.
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/logo-icon.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Paralel fetch — içerik + sayfa yönetimi (her ikisi de cached + graceful fallback)
  const [content, pageManagement] = await Promise.all([
    getAllContent(),
    getAllPageManagementData(),
  ]);

  return (
    <html lang="tr">
      <body>
        <SiteContentProvider initialContent={content}>
          <PageManagementProvider initialState={pageManagement}>
            <ThemeStyleInjector />
            {children}
          </PageManagementProvider>
        </SiteContentProvider>
      </body>
    </html>
  );
}
