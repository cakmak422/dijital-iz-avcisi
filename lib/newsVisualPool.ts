// Kategori başına Supabase Storage "news-visuals" bucket'ındaki statik
// görsel sayısı. Yeni görsel eklendiğinde sadece ilgili kategorinin
// sayısını artırmak yeterli — kod başka bir yerde değişmez.
export const CATEGORY_POOL_SIZE: Record<string, number> = {
  "illegal-betting": 4,
  phishing: 4,
  sms: 4,
  banking: 4,
  ransomware: 4,
  breach: 4,
  infrastructure: 4,
  malware: 4,
  "threat-intel": 4,
  privacy: 4,
  general: 4
};

const BUCKET = "news-visuals";

function hashSlugToIndex(slug: string, poolSize: number): number {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }
  return hash % poolSize;
}

// NEXT_PUBLIC_SUPABASE_URL kullanılıyor — bu değer sunucu ve istemci
// render'ları arasında tutarlı olmalı (aksi halde hydration mismatch
// riski doğar). Tanımlı değilse null döner; çağıran taraf mevcut
// kategori SVG placeholder'ına düşer — env eklenmeden de güvenli çalışır.
export function getCategoryPoolImageUrl(category: string, slug: string): string | null {
  const poolSize = CATEGORY_POOL_SIZE[category];
  if (!poolSize || poolSize < 1 || !slug) return null;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  if (!supabaseUrl) return null;

  const index = hashSlugToIndex(slug, poolSize) + 1;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${category}/${index}.webp`;
}
