import { buildTurkishNewsDisplay, isUsableTurkishDisplayText } from "@/lib/newsTranslation";

export type CyberNewsRiskLevel = "Düşük" | "Orta" | "Yüksek";

export type CyberNewsVisualType =
  | "illegal-betting"
  | "phishing"
  | "sms"
  | "banking"
  | "ransomware"
  | "breach"
  | "infrastructure"
  | "malware"
  | "threat-intel"
  | "privacy"
  | "general";

export type CyberNewsImageSource = "rss" | "og" | "twitter" | "jsonld" | "article" | "fallback";

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
  imageSource?: CyberNewsImageSource;
  imageCheckedAt?: string;
  imageAltTr?: string;
  fetchImageFailureReason?: string;
  publishedAt: string;
  fetchedAt: string;
  riskLevel: CyberNewsRiskLevel;
  displayTitle?: string;
  displaySummary?: string;
  translationStatus?: "translated" | "generated" | "missing";
  titleTr?: string;
  originalTitle?: string;
  originalUrl?: string;
  summaryShortTr?: string;
  summaryLongTr?: string;
  whyItMattersTr?: string;
  affectedGroupsTr?: string[];
  recommendationsTr?: string[];
  technicalSignalsTr?: string[];
  severity?: CyberNewsRiskLevel;
  fallbackVisualType?: CyberNewsVisualType;
  isFeatured?: boolean;
  isArchived?: boolean;
  tags?: string[];
};

export const cyberNewsKeywords = [
  "siber suç",
  "siber dolandırıcılık",
  "oltalama",
  "phishing",
  "sahte SMS",
  "sahte kargo",
  "siber saldırı",
  "cyberattack",
  "ransomware",
  "fidye yazılımı",
  "malware",
  "zararlı yazılım",
  "data breach",
  "veri sızıntısı",
  "cve",
  "zero-day",
  "threat actor",
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
    titleTr: "USOM oltalama bağlantılarına karşı kullanıcıları uyardı",
    originalTitle: "USOM oltalama uyarıları",
    slug: "usom-oltalama-baglantilarina-karsi-uyari",
    summary:
      "USOM kaynaklı uyarılar, kullanıcıların marka veya kurum taklidi yapan bağlantılara karşı alan adını ve resmi kanalı kontrol etmesi gerektiğini vurguluyor.",
    summaryShortTr:
      "USOM kaynaklı uyarılar, marka veya kurum taklidi yapan bağlantılara karşı alan adı kontrolünün önemini hatırlatıyor.",
    summaryLongTr:
      "Oltalama bağlantıları genellikle resmi kurum, banka veya bilinen marka görünümüyle kullanıcıyı giriş bilgisi, SMS kodu ya da ödeme bilgisi paylaşmaya ikna etmeye çalışır. Bu nedenle bağlantının alan adı, yönlendirme yapısı ve resmi kanal uyumu birlikte kontrol edilmelidir.",
    riskNote:
      "Kurum taklidi yapan linkler kimlik bilgisi, SMS kodu veya ödeme bilgisi toplama amacıyla kullanılabilir.",
    whyItMattersTr:
      "Bu tür bağlantılar vatandaşın resmi bir işlem yaptığını düşünmesine neden olabilir. Alan adı küçük farklarla değiştirildiğinde risk ilk bakışta fark edilmeyebilir.",
    affectedGroupsTr: ["Bireysel kullanıcılar", "E-devlet ve banka işlemi yapan vatandaşlar", "SMS veya e-posta ile link alan kullanıcılar"],
    recommendationsTr: [
      "Linke tıklamadan önce alan adını resmi web sitesiyle karşılaştırın.",
      "SMS kodu, parola veya kart bilgisi isteyen sayfalarda işlemi durdurun.",
      "Şüpheli bağlantıyı resmi uygulama veya çağrı merkezi üzerinden doğrulayın."
    ],
    technicalSignalsTr: ["Marka/kurum taklidi olasılığı", "Alan adı benzerliği", "Kimlik bilgisi toplama riski"],
    publicAdvice: [
      "Linke tıklamadan önce alan adını resmi web sitesiyle karşılaştırın.",
      "SMS kodu, parola veya kart bilgisi isteyen sayfalarda işlemi durdurun.",
      "Şüpheli bağlantıyı resmi uygulama veya çağrı merkezi üzerinden doğrulayın."
    ],
    category: "Oltalama",
    sourceName: "USOM",
    sourceUrl: "https://www.usom.gov.tr/",
    originalUrl: "https://www.usom.gov.tr/",
    imageUrl: "/news-fallback-cyber.svg",
    imageSource: "fallback",
    imageAltTr: "Oltalama uyarısı için temsili siber güvenlik görseli",
    publishedAt: "2026-05-31",
    fetchedAt: "2026-05-31T00:00:00+03:00",
    riskLevel: "Yüksek",
    severity: "Yüksek",
    fallbackVisualType: "phishing",
    isFeatured: true,
    tags: ["oltalama", "kurum taklidi", "link güvenliği"]
  },
  {
    id: "sahte-kargo-smsleri",
    title: "Sahte kargo SMS'leri yeniden gündemde",
    titleTr: "Sahte kargo SMS'leri yeniden gündemde",
    originalTitle: "Sahte kargo SMS uyarıları",
    slug: "sahte-kargo-smsleri-yeniden-gundemde",
    summary:
      "Kargo teslimatı, ek ücret veya adres güncelleme bahanesiyle gönderilen mesajlar kullanıcıları sahte ödeme sayfalarına yönlendirebiliyor.",
    summaryShortTr:
      "Kargo teslimatı ve ek ücret bahanesiyle gönderilen sahte SMS'ler, kullanıcıları sahte ödeme sayfalarına yönlendirebiliyor.",
    summaryLongTr:
      "Sahte kargo mesajları genellikle düşük tutarlı ödeme, adres güncelleme veya teslimat sorunu iddiasıyla aciliyet hissi oluşturur. Mesajdaki bağlantı resmi kargo şirketiyle ilişkili görünse bile alan adı ve ödeme ekranı dikkatle kontrol edilmelidir.",
    riskNote:
      "Küçük tutarlı ödeme talepleri kullanıcıyı hızlı karar vermeye zorlayan sosyal mühendislik sinyali olabilir.",
    whyItMattersTr:
      "Düşük tutarlı ödeme talepleri zararsız görünebilir; ancak kart bilgisi veya kimlik verisi toplanması için kullanılabilir.",
    affectedGroupsTr: ["Online alışveriş yapan kullanıcılar", "Kargo bekleyen vatandaşlar", "SMS ile bağlantı alan kullanıcılar"],
    recommendationsTr: [
      "Kargo durumunu mesajdaki linkten değil, kargo şirketinin resmi uygulamasından kontrol edin.",
      "Kart bilgisi isteyen sayfanın alan adını dikkatle inceleyin.",
      "Şüpheli SMS'i silmeden önce ekran görüntüsü alıp ilgili kuruma bildirin."
    ],
    technicalSignalsTr: ["Sahte teslimat bildirimi", "Ödeme yönlendirmesi", "Aciliyet baskısı"],
    publicAdvice: [
      "Kargo durumunu mesajdaki linkten değil, kargo şirketinin resmi uygulamasından kontrol edin.",
      "Kart bilgisi isteyen sayfanın alan adını dikkatle inceleyin.",
      "Şüpheli SMS'i silmeden önce ekran görüntüsü alıp ilgili kuruma bildirin."
    ],
    category: "Sahte SMS",
    sourceName: "USOM",
    sourceUrl: "https://www.usom.gov.tr/",
    originalUrl: "https://www.usom.gov.tr/",
    imageUrl: "/news-fallback-cyber.svg",
    imageSource: "fallback",
    imageAltTr: "Sahte SMS uyarısı için temsili siber güvenlik görseli",
    publishedAt: "2026-05-30",
    fetchedAt: "2026-05-31T00:00:00+03:00",
    riskLevel: "Orta",
    severity: "Orta",
    fallbackVisualType: "sms",
    isFeatured: true,
    tags: ["sahte SMS", "kargo", "ödeme"]
  },
  {
    id: "banka-taklidi-phishing",
    title: "Banka taklidi yapan phishing sayfalarına dikkat",
    titleTr: "Banka taklidi yapan phishing sayfalarına dikkat",
    originalTitle: "Banka taklidi yapan oltalama sayfaları",
    slug: "banka-taklidi-yapan-phishing-sayfalari",
    summary:
      "Banka adı, kampanya veya hesap doğrulama ifadesi kullanan sahte sayfalar kullanıcıları giriş bilgisi paylaşmaya ikna etmeye çalışabiliyor.",
    summaryShortTr:
      "Banka adı ve hesap doğrulama ifadeleri kullanan sahte sayfalar, kullanıcıları giriş bilgisi paylaşmaya yönlendirebiliyor.",
    summaryLongTr:
      "Banka taklidi yapan sayfalar çoğu zaman resmi alan adına benzeyen ek kelimeler, tireler veya kampanya ifadeleri kullanır. Bağlantı reklam, SMS ya da sosyal medya üzerinden geldiyse resmi uygulama ve elle yazılan alan adı üzerinden doğrulama yapılmalıdır.",
    riskNote:
      "Resmi alan adına benzemeyen, tireli veya ek kelime içeren domainler şüpheli örüntü oluşturabilir.",
    whyItMattersTr:
      "Bankacılık bilgileri ele geçirilirse hesap erişimi, kart bilgisi veya tek kullanımlık kodlar kötüye kullanılabilir.",
    affectedGroupsTr: ["Mobil bankacılık kullanıcıları", "Kart bilgisi giren kullanıcılar", "SMS veya reklam linkiyle gelen kullanıcılar"],
    recommendationsTr: [
      "Bankacılık işlemlerini yalnızca resmi uygulama veya elle yazılan resmi alan adı üzerinden yapın.",
      "Arama motoru reklamı veya SMS linkiyle gelen giriş sayfalarına temkinli yaklaşın.",
      "Şüpheli işlem fark ederseniz bankanın resmi kanalından hızlıca bildirim yapın."
    ],
    technicalSignalsTr: ["Marka taklidi", "Giriş formu riski", "Alan adı benzerliği"],
    publicAdvice: [
      "Bankacılık işlemlerini yalnızca resmi uygulama veya elle yazılan resmi alan adı üzerinden yapın.",
      "Arama motoru reklamı veya SMS linkiyle gelen giriş sayfalarına temkinli yaklaşın.",
      "Şüpheli işlem fark ederseniz bankanın resmi kanalından hızlıca bildirim yapın."
    ],
    category: "Banka Dolandırıcılığı",
    sourceName: "BTK",
    sourceUrl: "https://www.btk.gov.tr/",
    originalUrl: "https://www.btk.gov.tr/",
    imageUrl: "/news-fallback-cyber.svg",
    imageSource: "fallback",
    imageAltTr: "Banka taklidi ve finansal risk için temsili siber güvenlik görseli",
    publishedAt: "2026-05-29",
    fetchedAt: "2026-05-31T00:00:00+03:00",
    riskLevel: "Yüksek",
    severity: "Yüksek",
    fallbackVisualType: "banking",
    isFeatured: true,
    tags: ["banka", "phishing", "marka taklidi"]
  }
];

export function getCyberNewsItems() {
  return [...cyberNewsItems]
    .filter((item) => hasValidNewsSource(item))
    .filter(hasPublicNewsDisplay)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getLatestCyberNews(limit = 3) {
  return getCyberNewsItems().filter((item) => !item.isArchived).slice(0, limit);
}

export function getCyberNewsBySlug(slug: string) {
  return getCyberNewsItems().find((item) => item.slug === slug);
}

export function getNewsTitle(item: CyberNewsItem) {
  return getNewsDisplayFields(item)?.displayTitle ?? "";
}

export function getNewsShortSummary(item: CyberNewsItem) {
  return getNewsDisplayFields(item)?.displaySummary ?? "";
}

export function getNewsLongSummary(item: CyberNewsItem) {
  return item.summaryLongTr && isUsableTurkishDisplayText(item.summaryLongTr) ? item.summaryLongTr : getNewsShortSummary(item);
}

export function getNewsWhyItMatters(item: CyberNewsItem) {
  return item.whyItMattersTr || item.riskNote;
}

export function getNewsRecommendations(item: CyberNewsItem) {
  return item.recommendationsTr?.length ? item.recommendationsTr : item.publicAdvice;
}

export function getNewsAffectedGroups(item: CyberNewsItem) {
  return item.affectedGroupsTr?.length ? item.affectedGroupsTr : ["Bireysel kullanıcılar", "Kurum çalışanları", "Online işlem yapan kullanıcılar"];
}

export function getNewsTechnicalSignals(item: CyberNewsItem) {
  return item.technicalSignalsTr?.length ? item.technicalSignalsTr : ["Kaynak haber siber güvenlik anahtar kelimeleriyle eşleşti.", "Detaylar için resmi kaynak bağlantısı korunuyor."];
}

export function getNewsDisplayFields(item: CyberNewsItem) {
  if (item.displayTitle && item.displaySummary) {
    return buildTurkishNewsDisplay({
      originalSummary: item.summary,
      originalTitle: item.originalTitle || item.title,
      summary: item.displaySummary,
      summaryShortTr: item.displaySummary,
      title: item.displayTitle,
      titleTr: item.displayTitle
    });
  }

  return buildTurkishNewsDisplay({
    originalSummary: item.summary,
    originalTitle: item.originalTitle || item.title,
    summary: item.summary,
    summaryShortTr: item.summaryShortTr,
    title: item.title,
    titleTr: item.titleTr
  });
}

export function hasPublicNewsDisplay(item: CyberNewsItem) {
  return Boolean(getNewsDisplayFields(item));
}

export function getNewsSeverity(item: CyberNewsItem) {
  return item.severity || item.riskLevel;
}

export function hasRealNewsImage(item: CyberNewsItem) {
  return Boolean(item.imageUrl && isSafeRenderableImageUrl(item.imageUrl) && !item.imageUrl.includes("news-fallback-cyber.svg"));
}

export function getNewsVisualType(item: CyberNewsItem): CyberNewsVisualType {
  const inferred = inferNewsVisualType(`${item.category} ${item.title} ${item.summary} ${(item.tags ?? []).join(" ")}`);
  if (inferred !== "general") return inferred;
  return item.fallbackVisualType || inferred;
}

export function inferNewsVisualType(text: string): CyberNewsVisualType {
  const normalized = text.toLocaleLowerCase("tr-TR");
  if (
    normalized.includes("bahis") ||
    normalized.includes("yasa dışı bahis") ||
    normalized.includes("yasa disi bahis") ||
    normalized.includes("sanal bahis") ||
    normalized.includes("kumar")
  ) {
    return "illegal-betting";
  }
  if (normalized.includes("sms") || normalized.includes("kargo")) return "sms";
  if (normalized.includes("banka") || normalized.includes("kart") || normalized.includes("iban")) return "banking";
  if (normalized.includes("tehdit istihbaratı") || normalized.includes("threat intel") || normalized.includes("ioc")) return "threat-intel";
  if (normalized.includes("oltalama") || normalized.includes("phishing")) return "phishing";
  if (normalized.includes("fidye") || normalized.includes("ransomware")) return "ransomware";
  if (normalized.includes("zararlı yazılım") || normalized.includes("malware") || normalized.includes("trojan")) return "malware";
  if (normalized.includes("sızıntı") || normalized.includes("breach") || normalized.includes("veri")) return "breach";
  if (normalized.includes("kritik altyapı") || normalized.includes("devlet destekli") || normalized.includes("usom") || normalized.includes("btk")) return "infrastructure";
  if (normalized.includes("mahremiyet") || normalized.includes("gizlilik")) return "privacy";
  return "general";
}

export function getNewsImageSource(item: CyberNewsItem) {
  if (hasRealNewsImage(item)) return item.imageUrl as string;
  return getNewsPlaceholderPath(getNewsVisualType(item));
}

export function getNewsImageFallbackSource() {
  return "/news-placeholders/default-cyber.svg";
}

export function getNewsPlaceholderPath(type: CyberNewsVisualType) {
  const placeholderMap: Record<CyberNewsVisualType, string> = {
    "illegal-betting": "/news-placeholders/illegal-betting.svg",
    phishing: "/news-placeholders/phishing.svg",
    sms: "/news-placeholders/phishing.svg",
    banking: "/news-placeholders/financial-risk.svg",
    ransomware: "/news-placeholders/ransomware.svg",
    breach: "/news-placeholders/data-breach.svg",
    infrastructure: "/news-placeholders/critical-infra.svg",
    malware: "/news-placeholders/malware.svg",
    "threat-intel": "/news-placeholders/threat-intel.svg",
    privacy: "/news-placeholders/data-breach.svg",
    general: "/news-placeholders/default-cyber.svg"
  };

  return placeholderMap[type] || placeholderMap.general;
}

export function isRelevantCyberNews(text: string) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  return cyberNewsKeywords.some((keyword) => normalized.includes(keyword.toLocaleLowerCase("tr-TR")));
}

export function upsertUniqueNewsItems(items: CyberNewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!hasValidNewsSource(item)) return false;
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
}

function hasValidNewsSource(item: CyberNewsItem) {
  if (!item.sourceName.trim()) return false;
  try {
    const parsed = new URL(item.sourceUrl);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isSafeRenderableImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;

  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
