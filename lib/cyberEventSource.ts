import type { CyberEvent } from "@/types/cyberEvent";

type CisaKevCatalog = {
  vulnerabilities?: CisaKevItem[];
};

type CisaKevItem = {
  cveID?: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
  notes?: string;
};

const cisaKevUrl = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const allowedFetchHosts = new Set(["cisa.gov", "www.cisa.gov", "nist.gov", "nvd.nist.gov", "raw.githubusercontent.com"]);
const allowedImageHosts = new Set([
  "cisa.gov",
  "www.cisa.gov",
  "nist.gov",
  "nvd.nist.gov",
  "mitre.org",
  "www.mitre.org",
  "cloudflare.com",
  "www.cloudflare.com",
  "microsoft.com",
  "www.microsoft.com",
  "kaspersky.com",
  "www.kaspersky.com",
  "crowdstrike.com",
  "www.crowdstrike.com",
  "wired.com",
  "www.wired.com",
  "bleepingcomputer.com",
  "www.bleepingcomputer.com",
  "therecord.media"
]);

let cachedEvent: { event: CyberEvent; expiresAt: number } | null = null;

export function sanitizeExternalUrl(value: string, allowedHosts: Set<string>) {
  try {
    const url = new URL(value);
    if (!["https:"].includes(url.protocol)) {
      return "";
    }
    if (!allowedHosts.has(url.hostname.toLowerCase())) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function text(value: string | undefined, fallback = "") {
  return (value ?? fallback).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function getFallbackCyberEvent(): CyberEvent {
  return {
    id: "fallback-cisa-kev",
    title: "CISA KEV kaynak verisi gecici olarak alinamadi",
    year: "2026",
    summary:
      "Kaynak verisi alinamadigi icin yedek bilgilendirme gosteriliyor. Canli mod tekrar denendiginde CISA KEV katalog kayitlari kullanilacaktir.",
    impact:
      "Kullaniciya gosterilen bu kart kesin hukum degildir; canli kaynak baglantisi tekrar kuruldugunda resmi advisory verisiyle degisir.",
    category: "Kaynak durumu",
    sourceName: "CISA KEV Catalog",
    sourceUrl: cisaKevUrl,
    publishedAt: undefined,
    updatedAt: undefined,
    isLiveData: false,
    imageSource: "Dijital Iz Avcisi fallback visual",
    imageAlt: "Kaynak verisi alinamadi fallback cyber visual",
    imageType: "fallback"
  };
}

function mapKevItemToCyberEvent(item: CisaKevItem): CyberEvent {
  const cveId = text(item.cveID);
  const dateAdded = text(item.dateAdded);
  const year = dateAdded ? dateAdded.slice(0, 4) : new Date().getFullYear().toString();
  const vendor = text(item.vendorProject);
  const product = text(item.product);
  const title = text(item.vulnerabilityName, cveId || "CISA KEV kaydi");
  const ransomware = text(item.knownRansomwareCampaignUse);
  const sourceUrl = cveId ? `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cveId)}` : cisaKevUrl;

  return {
    id: cveId || `kev-${dateAdded || Date.now()}`,
    title,
    year,
    summary: text(item.shortDescription, "CISA KEV katalogunda bilinen istismar edilen zafiyet kaydi."),
    impact: text(
      item.requiredAction,
      "CISA KEV kaydi, bu zafiyetin bilinen istismar sinyali tasidigini ve kurumlarin resmi yonlendirmeleri takip etmesini onerir."
    ),
    category: ransomware.toLowerCase() === "known" ? "Known exploited vulnerability / ransomware signal" : "Known exploited vulnerability",
    sourceName: "CISA KEV Catalog",
    sourceUrl: sanitizeExternalUrl(sourceUrl, allowedFetchHosts) || cisaKevUrl,
    cveId,
    vendor,
    product,
    severity: ransomware ? `Ransomware use: ${ransomware}` : undefined,
    publishedAt: dateAdded || undefined,
    updatedAt: text(item.dueDate) || undefined,
    isLiveData: true,
    imageSource: "Fallback cyber visual",
    imageAlt: `${title} icin siber guvenlik gorseli`,
    imageType: "fallback"
  };
}

export function sanitizeCyberEventImageUrl(value: string | undefined) {
  if (!value) {
    return "";
  }
  return sanitizeExternalUrl(value, allowedImageHosts);
}

export async function fetchLiveCyberEvent({ bypassCache = false }: { bypassCache?: boolean } = {}) {
  const now = Date.now();
  if (!bypassCache && cachedEvent && cachedEvent.expiresAt > now) {
    return cachedEvent.event;
  }

  const safeUrl = sanitizeExternalUrl(cisaKevUrl, allowedFetchHosts);
  if (!safeUrl) {
    return getFallbackCyberEvent();
  }

  try {
    const response = await fetch(safeUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Dijital-Iz-Avcisi/1.0"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return getFallbackCyberEvent();
    }

    const catalog = (await response.json()) as CisaKevCatalog;
    const vulnerabilities = Array.isArray(catalog.vulnerabilities) ? catalog.vulnerabilities : [];
    const sorted = vulnerabilities
      .filter((item) => item.cveID && item.vulnerabilityName)
      .sort((a, b) => text(b.dateAdded).localeCompare(text(a.dateAdded)));

    const event = sorted[0] ? mapKevItemToCyberEvent(sorted[0]) : getFallbackCyberEvent();
    cachedEvent = { event, expiresAt: now + 60 * 60 * 1000 };
    return event;
  } catch {
    return getFallbackCyberEvent();
  }
}

export const cyberEventSourcePolicy = {
  allowedFetchHosts: Array.from(allowedFetchHosts),
  allowedImageHosts: Array.from(allowedImageHosts),
  cacheSeconds: 3600
};
