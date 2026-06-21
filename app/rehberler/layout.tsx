import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rehberler",
  description: "Sahte site, riskli SMS, sahte yorum ve hesap güvenliği için sade ve uygulanabilir siber farkındalık rehberleri.",
  alternates: { canonical: "/rehberler" },
  openGraph: {
    title: "Rehberler | Dijital İz Avcısı",
    description: "Teknik tehditleri sade, uygulanabilir rehberlere dönüştüren siber farkındalık alanı.",
    url: "/rehberler",
    images: [{ url: "/awareness/rehberler.png", width: 1200, height: 630, alt: "Siber Farkındalık Rehberleri" }]
  }
};

export default function RehberlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
