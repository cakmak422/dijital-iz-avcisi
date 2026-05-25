export type CyberEventImageType = "real" | "generated" | "fallback";

export type CyberEvent = {
  id: string;
  title: string;
  year: string;
  summary: string;
  impact: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  cveId?: string;
  vendor?: string;
  product?: string;
  severity?: string;
  publishedAt?: string;
  updatedAt?: string;
  isLiveData: boolean;
  imageUrl?: string;
  imageSource?: string;
  imageAlt?: string;
  imageCopyright?: string;
  imageType: CyberEventImageType;
};
