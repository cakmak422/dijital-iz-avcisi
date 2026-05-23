import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dijital Iz Avcisi",
  description: "AI destekli dijital guvenlik ve risk analizi platformu"
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
