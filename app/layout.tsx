import type { Metadata, Viewport } from "next";
import "./globals.css";

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
        url: "/logo.png",
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
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-icon.png", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
