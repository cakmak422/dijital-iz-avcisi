export function stripRiskyHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeText(value: string, maxLength: number) {
  return stripRiskyHtml(value).slice(0, maxLength);
}

export function sanitizeMultiline(value: string, maxLength: number) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.length <= 254;
}

export function isLikelyUrl(value: string) {
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname.includes("."));
  } catch {
    return false;
  }
}
