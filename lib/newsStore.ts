export type CyberNewsRiskLevel = "Düşük" | "Orta" | "Yüksek";

export type CyberNewsItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  riskNote: string;
  publicAdvice: string[];
  category: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  fetchedAt: string;
  riskLevel: CyberNewsRiskLevel;
};

export const cyberNewsKeywords = [
  "siber suç",
  "siber dolandırıcılık",
  "oltalama",
  "phishing",
  "sahte SMS",
  "sahte kargo",
  "banka dolandırıcılığı",
  "sosyal medya hesabı çalındı",
  "kripto dolandırıcılığı",
  "yasa dışı bahis",
  "USOM",
  "BTK",
  "Emniyet siber",
  "Jandarma siber"
];

const cyberNewsItems: CyberNewsItem[] = [
  {
    id: "usom-oltalama-uyarilari",
    title: "USOM oltalama bağlantılarına karşı kullanıcıları uyardı",
    slug: "usom-oltalama-baglantilarina-karsi-uyari",
    summary:
      "USOM kaynaklı uyarılar, kullanıcıların marka veya kurum taklidi yapan bağlantılara karşı alan adını ve resmi kanalı kontrol etmesi gerektiğini vurguluyor.",
    riskNote: "Kurum taklidi yapan linkler kimlik bilgisi, SMS kodu veya ödeme bilgisi toplama amacıyla kullanılabilir.",
    publicAdvice: [
      "Linke tıklamadan önce alan adını resmi web sitesiyle karşılaştırın.",
      "SMS kodu, parola veya kart bilgisi isteyen sayfalarda işlemi durdurun.",
      "Şüpheli bağlantıyı resmi uygulama veya çağrı merkezi üzerinden doğrulayın."
    ],
    category: "Oltalama",
    sourceName: "USOM",
    sourceUrl: "https://www.usom.gov.tr/",
    imageUrl: "/news-fallback-cyber.svg",
    publishedAt: "2026-05-31",
    fetchedAt: "2026-05-31T00:00:00+03:00",
    riskLevel: "Yüksek"
  },
  {
    id: "sahte-kargo-smsleri",
    title: "Sahte kargo SMS'leri yeniden gündemde",
    slug: "sahte-kargo-smsleri-yeniden-gundemde",
    summary:
      "Kargo teslimatı, ek ücret veya adres güncelleme bahanesiyle gönderilen mesajlar kullanıcıları sahte ödeme sayfalarına yönlendirebiliyor.",
    riskNote: "Küçük tutarlı ödeme talepleri kullanıcıyı hızlı karar vermeye zorlayan sosyal mühendislik sinyali olabilir.",
    publicAdvice: [
      "Kargo durumunu mesajdaki linkten değil, kargo şirketinin resmi uygulamasından kontrol edin.",
      "Kart bilgisi isteyen sayfanın alan adını dikkatle inceleyin.",
      "Şüpheli SMS'i silmeden önce ekran görüntüsü alıp ilgili kuruma bildirin."
    ],
    category: "Sahte SMS",
    sourceName: "Dijital İz Avcısı gözlem notu",
    sourceUrl: "https://dijitalizavcisi.com/sorgu-paneli?module=message",
    imageUrl: "/news-fallback-cyber.svg",
    publishedAt: "2026-05-30",
    fetchedAt: "2026-05-31T00:00:00+03:00",
    riskLevel: "Orta"
  },
  {
    id: "banka-taklidi-phishing",
    title: "Banka taklidi yapan phishing sayfalarına dikkat",
    slug: "banka-taklidi-yapan-phishing-sayfalari",
    summary:
      "Banka adı, kampanya veya hesap doğrulama ifadesi kullanan sahte sayfalar kullanıcıları giriş bilgisi paylaşmaya ikna etmeye çalışabiliyor.",
    riskNote: "Resmi alan adına benzemeyen, tireli veya ek kelime içeren domainler şüpheli örüntü oluşturabilir.",
    publicAdvice: [
      "Bankacılık işlemlerini yalnızca resmi uygulama veya elle yazılan resmi alan adı üzerinden yapın.",
      "Arama motoru reklamı veya SMS linkiyle gelen giriş sayfalarına temkinli yaklaşın.",
      "Şüpheli işlem fark ederseniz bankanın resmi kanalından hızlıca bildirim yapın."
    ],
    category: "Banka Dolandırıcılığı",
    sourceName: "BTK / kamu farkındalık kaynakları",
    sourceUrl: "https://www.btk.gov.tr/",
    imageUrl: "/news-fallback-cyber.svg",
    publishedAt: "2026-05-29",
    fetchedAt: "2026-05-31T00:00:00+03:00",
    riskLevel: "Yüksek"
  }
];

export function getCyberNewsItems() {
  return [...cyberNewsItems].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getLatestCyberNews(limit = 3) {
  return getCyberNewsItems().slice(0, limit);
}

export function getCyberNewsBySlug(slug: string) {
  return getCyberNewsItems().find((item) => item.slug === slug);
}

export function isRelevantCyberNews(text: string) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  return cyberNewsKeywords.some((keyword) => normalized.includes(keyword.toLocaleLowerCase("tr-TR")));
}

export function upsertUniqueNewsItems(items: CyberNewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
}
