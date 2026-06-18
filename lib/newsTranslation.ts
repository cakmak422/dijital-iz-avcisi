export type NewsLanguage = "tr" | "en";

export type LocalizedNewsText = {
  titleTr: string;
  summaryTr: string;
  originalTitle: string;
};

export type NewsTranslationStatus = "translated" | "generated" | "missing";

export type NewsDisplayFields = {
  displayTitle: string;
  displaySummary: string;
  translationStatus: NewsTranslationStatus;
};

const TURKISH_SECURITY_TITLE_PREFIX = "Siber g\u00fcvenlik haberi";
const TURKISH_SECURITY_SUMMARY_PREFIX = "Kaynak habere g\u00f6re";

const cyberPhraseReplacements: Array<[RegExp, string]> = [
  [/^Fake (.+?) Alerts Used to Deploy North Korean (.+?) Malware$/i, "Sahte $1 uyar\u0131lar\u0131 Kuzey Kore ba\u011flant\u0131l\u0131 $2 zararl\u0131 yaz\u0131l\u0131m\u0131n\u0131 da\u011f\u0131tmak i\u00e7in kullan\u0131ld\u0131"],
  [/\bUsed to Deploy\b/gi, "da\u011f\u0131tmak i\u00e7in kullan\u0131ld\u0131"],
  [/\bNorth Korean\b/gi, "Kuzey Kore ba\u011flant\u0131l\u0131"],
  [/\bFake\b/gi, "sahte"],
  [/\bAlerts\b/gi, "uyar\u0131lar\u0131"],
  [/\bDeploy\b/gi, "da\u011f\u0131tmak"],
  [/\bransomware\b/gi, "fidye yaz\u0131l\u0131m\u0131"],
  [/\bdata breach\b/gi, "veri s\u0131z\u0131nt\u0131s\u0131"],
  [/\bbreach\b/gi, "veri s\u0131z\u0131nt\u0131s\u0131"],
  [/\bmalware\b/gi, "zararl\u0131 yaz\u0131l\u0131m"],
  [/\bphishing\b/gi, "oltalama"],
  [/\bcyberattack\b/gi, "siber sald\u0131r\u0131"],
  [/\bcyber attack\b/gi, "siber sald\u0131r\u0131"],
  [/\bhackers\b/gi, "sald\u0131rganlar"],
  [/\bhacker\b/gi, "sald\u0131rgan"],
  [/\bthreat actors\b/gi, "tehdit akt\u00f6rleri"],
  [/\bthreat actor\b/gi, "tehdit akt\u00f6r\u00fc"],
  [/\bvulnerability\b/gi, "g\u00fcvenlik a\u00e7\u0131\u011f\u0131"],
  [/\bvulnerabilities\b/gi, "g\u00fcvenlik a\u00e7\u0131klar\u0131"],
  [/\bzero-day\b/gi, "s\u0131f\u0131r g\u00fcn a\u00e7\u0131\u011f\u0131"],
  [/\bpatch\b/gi, "g\u00fcvenlik yamas\u0131"],
  [/\bpatched\b/gi, "yamaland\u0131"],
  [/\bexploit\b/gi, "istismar tekni\u011fi"],
  [/\bexploited\b/gi, "istismar edildi"],
  [/\bspyware\b/gi, "casus yaz\u0131l\u0131m"],
  [/\bbotnet\b/gi, "botnet a\u011f\u0131"],
  [/\bscam\b/gi, "doland\u0131r\u0131c\u0131l\u0131k"],
  [/\bfraud\b/gi, "doland\u0131r\u0131c\u0131l\u0131k"],
  [/\bsteals\b/gi, "\u00e7al\u0131yor"],
  [/\bstolen\b/gi, "\u00e7al\u0131nan"],
  [/\bpasswords\b/gi, "parolalar"],
  [/\bcredentials\b/gi, "kimlik bilgileri"],
  [/\baccounts\b/gi, "hesaplar"],
  [/\busers\b/gi, "kullan\u0131c\u0131lar"],
  [/\bcompanies\b/gi, "\u015firketler"],
  [/\bgovernment\b/gi, "kamu kurumu"],
  [/\bcritical infrastructure\b/gi, "kritik altyap\u0131"],
  [/\bsecurity update\b/gi, "g\u00fcvenlik g\u00fcncellemesi"],
  [/\bsecurity researchers\b/gi, "g\u00fcvenlik ara\u015ft\u0131rmac\u0131lar\u0131"],
  [/\bwarning\b/gi, "uyar\u0131"],
  [/\bwarns\b/gi, "uyar\u0131yor"],
  [/\bwarned\b/gi, "uyard\u0131"],
  [/\bnew\b/gi, "yeni"],
  [/\bmajor\b/gi, "b\u00fcy\u00fck"],
  [/\bmassive\b/gi, "geni\u015f \u00e7apl\u0131"],
  [/\battack\b/gi, "sald\u0131r\u0131"],
  [/\battacks\b/gi, "sald\u0131r\u0131lar"]
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
  const originalTitle = cleanNewsDisplayText(title);
  const originalSnippet = cleanNewsDisplayText(textSnippet);
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
    titleTr: ensureTurkishNewsSentence(translatedTitle, TURKISH_SECURITY_TITLE_PREFIX),
    summaryTr: ensureTurkishNewsSentence(translatedSummary || translatedTitle, TURKISH_SECURITY_SUMMARY_PREFIX),
    originalTitle
  };
}

export function buildTurkishNewsDisplay({
  language,
  originalSummary,
  originalTitle,
  summary,
  summaryShortTr,
  title,
  titleTr
}: {
  language?: NewsLanguage;
  originalSummary?: string;
  originalTitle?: string;
  summary: string;
  summaryShortTr?: string;
  title: string;
  titleTr?: string;
}): NewsDisplayFields | null {
  const existingTitle = cleanNewsDisplayText(titleTr ?? "");
  const existingSummary = cleanNewsDisplayText(summaryShortTr ?? "");
  const sourceTitle = cleanNewsDisplayText(originalTitle || title);
  const sourceSummary = cleanNewsDisplayText(originalSummary || summary);
  const existingTitleIsTranslated = isUsableTurkishDisplayText(existingTitle) && !isSameUntranslatedText(existingTitle, sourceTitle);
  const existingSummaryIsTranslated = isUsableTurkishDisplayText(existingSummary) && !isSameUntranslatedText(existingSummary, sourceSummary);

  if (existingTitleIsTranslated && existingSummaryIsTranslated) {
    return {
      displayTitle: existingTitle,
      displaySummary: existingSummary,
      translationStatus: "translated"
    };
  }

  const localized = localizeCyberNewsText({
    language,
    title,
    textSnippet: summary
  });
  const generatedTitle = cleanNewsDisplayText(localized.titleTr);
  const generatedSummary = cleanNewsDisplayText(localized.summaryTr);
  const displayTitle = existingTitleIsTranslated ? existingTitle : generatedTitle;
  const displaySummary = existingSummaryIsTranslated ? existingSummary : generatedSummary;

  if (!isUsableTurkishDisplayTitle(displayTitle) || !isUsableTurkishDisplaySummary(displaySummary)) return null;
  if (isSameUntranslatedText(displayTitle, sourceTitle) || isSameUntranslatedText(displaySummary, sourceSummary)) return null;

  return {
    displayTitle,
    displaySummary,
    translationStatus: existingTitleIsTranslated || existingSummaryIsTranslated ? "translated" : "generated"
  };
}

export function isUsableTurkishDisplayText(value: string) {
  const cleaned = cleanNewsDisplayText(value);
  if (cleaned.length < 8) return false;
  if (hasBrokenMojibake(cleaned)) return false;
  if (hasBlockedEnglishPattern(cleaned)) return false;
  if (hasTooMuchEnglishResidue(cleaned)) return false;
  return hasTurkishSignals(cleaned);
}

function isUsableTurkishDisplayTitle(value: string) {
  const cleaned = cleanNewsDisplayText(value);
  if (!isUsableTurkishDisplayText(cleaned)) return false;
  return hasTurkishTitleSignal(cleaned);
}

function isUsableTurkishDisplaySummary(value: string) {
  const cleaned = cleanNewsDisplayText(value);
  if (!isUsableTurkishDisplayText(cleaned)) return false;
  return looksLikeTurkishSentence(cleaned);
}

export function cleanNewsDisplayText(value: string) {
  return normalizeMojibakeText(decodeHtmlEntities(value))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMojibakeText(value: string) {
  if (!value) return "";

  const decoded = decodeLikelyUtf8Mojibake(value);
  const bestEffort = countMojibakeMarkers(decoded) < countMojibakeMarkers(value) ? decoded : value;

  return repairKnownMojibake(bestEffort);
}

function translateCyberPhrase(value: string) {
  const cleaned = cleanNewsDisplayText(value);
  if (!cleaned) return "";

  return cyberPhraseReplacements
    .reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), cleaned)
    .replace(/\btargets\b/gi, "hedef al\u0131yor")
    .replace(/\btargeting\b/gi, "hedef alan")
    .replace(/\buses\b/gi, "kullan\u0131yor")
    .replace(/\bused\b/gi, "kulland\u0131")
    .replace(/\bGoogle\b/g, "Google")
    .replace(/\bMicrosoft\b/g, "Microsoft")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureTurkishNewsSentence(value: string, prefix: string) {
  const cleaned = cleanNewsDisplayText(value);
  if (!cleaned) return `${prefix}: kaynak haber siber g\u00fcvenlik g\u00fcndemiyle ili\u015fkili bir ba\u015fl\u0131k i\u00e7eriyor.`;
  if (hasTurkishSignals(cleaned)) return cleaned;
  return `${prefix}: ${cleaned}`;
}

function looksEnglish(value: string) {
  const normalized = cleanNewsDisplayText(value).toLocaleLowerCase("en-US");
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

function isSameUntranslatedText(candidate: string, source: string) {
  if (!candidate || !source) return false;
  return normalizeComparableText(candidate) === normalizeComparableText(source) && looksEnglish(source);
}

function normalizeComparableText(value: string) {
  return cleanNewsDisplayText(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]+/gi, " ")
    .trim();
}

function hasTurkishSignals(value: string) {
  const normalized = value.toLocaleLowerCase("tr-TR");
  return (
    /[\u00e7\u011f\u0131\u00f6\u015f\u00fc]/i.test(value) ||
    ["siber", "oltalama", "fidye", "doland\u0131r\u0131c\u0131l\u0131k", "g\u00fcvenlik", "zararl\u0131"].some((signal) =>
      normalized.includes(signal)
    )
  );
}

function hasTooMuchEnglishResidue(value: string) {
  const normalized = cleanNewsDisplayText(value).toLocaleLowerCase("en-US");
  const words = normalized.match(/[a-z]{3,}/g) ?? [];
  if (!words.length) return false;

  const englishResidueWords = new Set([
    "alert",
    "alerts",
    "breach",
    "cyberattack",
    "deploy",
    "fake",
    "hackers",
    "malware",
    "north",
    "korean",
    "phishing",
    "ransomware",
    "researchers",
    "security",
    "threat",
    "used",
    "uses",
    "vulnerability",
    "warning"
  ]);
  const residueCount = words.filter((word) => englishResidueWords.has(word)).length;
  return residueCount >= 2 && residueCount / words.length > 0.22;
}

function hasBlockedEnglishPattern(value: string) {
  const normalized = ` ${cleanNewsDisplayText(value).toLocaleLowerCase("en-US")} `;
  const blockedPatterns = [
    /\bthe\b/,
    /\bhas been\b/,
    /\bhave\b/,
    /\bwith\b/,
    /\bfrom\b/,
    /\bresearchers\b/,
    /\bcampaigns\b/,
    /\bmalware delivery\b/,
    /\bstate-sponsored\b/
  ];
  return blockedPatterns.some((pattern) => pattern.test(normalized));
}

function hasTurkishTitleSignal(value: string) {
  const normalized = cleanNewsDisplayText(value).toLocaleLowerCase("tr-TR");
  return (
    /[\u00e7\u011f\u0131\u00f6\u015f\u00fc]/i.test(normalized) ||
    [
      "siber",
      "oltalama",
      "fidye",
      "doland\u0131r\u0131c\u0131l\u0131k",
      "g\u00fcvenlik",
      "zararl\u0131",
      "uyar\u0131",
      "sald\u0131r\u0131",
      "veri",
      "tehdit",
      "kullan\u0131ld\u0131"
    ].some((signal) => normalized.includes(signal))
  );
}

function looksLikeTurkishSentence(value: string) {
  const normalized = cleanNewsDisplayText(value).toLocaleLowerCase("tr-TR");
  const words = normalized.match(/[a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]+/gi) ?? [];
  if (words.length < 5) return false;
  if (!hasTurkishTitleSignal(normalized)) return false;

  const sentenceSignals = [
    " i\u00e7in ",
    " ile ",
    " olarak ",
    " g\u00f6re ",
    " kar\u015f\u0131 ",
    " tespit ",
    " uyar",
    " kullan",
    " sald\u0131r",
    " g\u00fcvenlik",
    " kaynak",
    " haber",
    " risk",
    " tehdit"
  ];

  return sentenceSignals.some((signal) => ` ${normalized} `.includes(signal));
}

function hasBrokenMojibake(value: string) {
  return countMojibakeMarkers(value) > 0;
}

function decodeLikelyUtf8Mojibake(value: string) {
  if (!hasMojibakeMarker(value)) return value;

  try {
    let decoded = value;
    for (let index = 0; index < 3; index += 1) {
      const bytes = Array.from(decoded, (char) => char.charCodeAt(0));
      if (bytes.some((code) => code > 255)) break;
      const candidate = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
      if (countMojibakeMarkers(candidate) >= countMojibakeMarkers(decoded)) break;
      decoded = candidate;
    }
    return decoded;
  } catch {
    return value;
  }
}

function repairKnownMojibake(value: string) {
  return value
    .replace(/\u00c3\u0087/g, "\u00c7")
    .replace(/\u00c3\u00a7/g, "\u00e7")
    .replace(/\u00c4\u009e/g, "\u011e")
    .replace(/\u00c4\u0178/g, "\u011f")
    .replace(/\u00c4\u00b0/g, "\u0130")
    .replace(/\u00c4\u00b1/g, "\u0131")
    .replace(/\u00c3\u0096/g, "\u00d6")
    .replace(/\u00c3\u00b6/g, "\u00f6")
    .replace(/\u00c3\u009c/g, "\u00dc")
    .replace(/\u00c3\u00bc/g, "\u00fc")
    .replace(/\u00c5\u009e/g, "\u015e")
    .replace(/\u00c5\u0178/g, "\u015f")
    .replace(/\u00c5\u00c3\u00bc/g, "\u015e\u00fc")
    .replace(/\u00c5\u00fc/g, "\u015e\u00fc")
    .replace(/Kayna\u00c4\u00c4\u00b1/g, "Kayna\u011f\u0131")
    .replace(/Kayna\u00c4\u0131/g, "Kayna\u011f\u0131")
    .replace(/da\u00c4\u00c4\u00b1tmak/g, "da\u011f\u0131tmak")
    .replace(/da\u00c4\u0131tmak/g, "da\u011f\u0131tmak")
    .replace(/ba\u00c4lant\u00c4\u00b1l\u00c4\u00b1/g, "ba\u011flant\u0131l\u0131")
    .replace(/ba\u00c4lant\u0131l\u0131/g, "ba\u011flant\u0131l\u0131")
    .replace(/ara\u00c5t\u00c4\u00b1rmac\u00c4\u00b1lar\u00c4\u00b1/g, "ara\u015ft\u0131rmac\u0131lar\u0131")
    .replace(/ara\u00c5t\u0131rmac\u0131lar\u0131/g, "ara\u015ft\u0131rmac\u0131lar\u0131")
    .replace(/i\u00c3\u00a7erik/g, "i\u00e7erik")
    .replace(/\u00c5\u00c3\u00bcpheli/g, "\u015f\u00fcpheli")
    .replace(/\u00c5\u00fcpheli/g, "\u015f\u00fcpheli")
    .replace(/\u00c2/g, "");
}

function hasMojibakeMarker(value: string) {
  return /[\u00c3\u00c4\u00c5\u00c2]/.test(value);
}

function countMojibakeMarkers(value: string) {
  return (value.match(/[\u00c3\u00c4\u00c5\u00c2]/g) ?? []).length;
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
