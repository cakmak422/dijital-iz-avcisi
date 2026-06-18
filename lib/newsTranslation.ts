export type NewsLanguage = "tr" | "en";

type LocalizedNewsText = {
  titleTr: string;
  summaryTr: string;
  originalTitle: string;
};

const cyberPhraseReplacements: Array<[RegExp, string]> = [
  [/\bransomware\b/gi, "fidye yazılımı"],
  [/\bdata breach\b/gi, "veri sızıntısı"],
  [/\bbreach\b/gi, "veri sızıntısı"],
  [/\bmalware\b/gi, "zararlı yazılım"],
  [/\bphishing\b/gi, "oltalama"],
  [/\bcyberattack\b/gi, "siber saldırı"],
  [/\bcyber attack\b/gi, "siber saldırı"],
  [/\bhackers\b/gi, "saldırganlar"],
  [/\bhacker\b/gi, "saldırgan"],
  [/\bthreat actors\b/gi, "tehdit aktörleri"],
  [/\bthreat actor\b/gi, "tehdit aktörü"],
  [/\bvulnerability\b/gi, "güvenlik açığı"],
  [/\bvulnerabilities\b/gi, "güvenlik açıkları"],
  [/\bzero-day\b/gi, "sıfır gün açığı"],
  [/\bpatch\b/gi, "güvenlik yaması"],
  [/\bpatched\b/gi, "yamalandı"],
  [/\bexploit\b/gi, "istismar tekniği"],
  [/\bexploited\b/gi, "istismar edildi"],
  [/\bspyware\b/gi, "casus yazılım"],
  [/\bbotnet\b/gi, "botnet ağı"],
  [/\bscam\b/gi, "dolandırıcılık"],
  [/\bfraud\b/gi, "dolandırıcılık"],
  [/\bsteals\b/gi, "çalıyor"],
  [/\bstolen\b/gi, "çalınan"],
  [/\bpasswords\b/gi, "parolalar"],
  [/\bcredentials\b/gi, "kimlik bilgileri"],
  [/\baccounts\b/gi, "hesaplar"],
  [/\busers\b/gi, "kullanıcılar"],
  [/\bcompanies\b/gi, "şirketler"],
  [/\bgovernment\b/gi, "kamu kurumu"],
  [/\bcritical infrastructure\b/gi, "kritik altyapı"],
  [/\bsecurity update\b/gi, "güvenlik güncellemesi"],
  [/\bsecurity researchers\b/gi, "güvenlik araştırmacıları"],
  [/\bwarning\b/gi, "uyarı"],
  [/\bwarns\b/gi, "uyarıyor"],
  [/\bwarned\b/gi, "uyardı"],
  [/\bnew\b/gi, "yeni"],
  [/\bmajor\b/gi, "büyük"],
  [/\bmassive\b/gi, "geniş çaplı"],
  [/\battack\b/gi, "saldırı"],
  [/\battacks\b/gi, "saldırılar"]
];

export function localizeCyberNewsText({
  language,
  title,
  textSnippet
}: {
  language?: NewsLanguage;
  title: string;
  textSnippet: string;
}): LocalizedNewsText {
  const originalTitle = cleanText(title);
  const originalSnippet = cleanText(textSnippet);
  const shouldTranslate = language === "en" || looksEnglish(`${originalTitle} ${originalSnippet}`);

  if (!shouldTranslate) {
    return {
      titleTr: originalTitle,
      summaryTr: originalSnippet,
      originalTitle
    };
  }

  const translatedTitle = translateCyberPhrase(originalTitle);
  const translatedSummary = translateCyberPhrase(originalSnippet);

  return {
    titleTr: ensureTurkishNewsSentence(translatedTitle, "Siber güvenlik haberi"),
    summaryTr: ensureTurkishNewsSentence(translatedSummary || translatedTitle, "Kaynak habere göre"),
    originalTitle
  };
}

function translateCyberPhrase(value: string) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";

  return cyberPhraseReplacements
    .reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), cleaned)
    .replace(/\btargets\b/gi, "hedef alıyor")
    .replace(/\btargeting\b/gi, "hedef alan")
    .replace(/\buses\b/gi, "kullanıyor")
    .replace(/\bused\b/gi, "kullandı")
    .replace(/\bGoogle\b/g, "Google")
    .replace(/\bMicrosoft\b/g, "Microsoft")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureTurkishNewsSentence(value: string, prefix: string) {
  const cleaned = cleanText(value);
  if (!cleaned) return `${prefix}: kaynak haber siber güvenlik gündemiyle ilişkili bir başlık içeriyor.`;
  if (hasTurkishSignals(cleaned)) return cleaned;
  return `${prefix}: ${cleaned}`;
}

function looksEnglish(value: string) {
  const normalized = cleanText(value).toLocaleLowerCase("en-US");
  if (!normalized) return false;
  if (hasTurkishSignals(normalized)) return false;

  const englishSignals = [
    " ransomware ",
    " malware ",
    " phishing ",
    " hackers ",
    " cyberattack ",
    " data breach ",
    " vulnerability ",
    " threat actor ",
    " zero-day ",
    " security researchers ",
    " patched ",
    " exploit "
  ];
  return englishSignals.some((signal) => ` ${normalized} `.includes(signal));
}

function hasTurkishSignals(value: string) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  return /[çğıöşü]/i.test(value) || ["siber", "oltalama", "fidye", "dolandırıcılık", "güvenlik", "zararlı"].some((signal) => normalized.includes(signal));
}

function cleanText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}
