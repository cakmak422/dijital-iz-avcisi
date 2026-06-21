import { MetadataRoute } from "next";

const BASE_URL = "https://dijitalizavcisi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/sorgu-paneli`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/dijital-arac-merkezi`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/haberler`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/siber-arsiv`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/rehberler`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/bilinclendirme`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/yasal-uyari`, lastModified: now, changeFrequency: "yearly", priority: 0.3 }
  ];

  // Haber detay sayfaları dinamik olduğu için sitemap'e eklenmez;
  // haberler/[slug] force-dynamic olarak işaretli ve DB'den çekiliyor.
  // Faz 2'de newsReadService'den slug listesi çekilerek buraya eklenebilir.

  return staticRoutes;
}
