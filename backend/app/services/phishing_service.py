from __future__ import annotations

import re
from urllib.parse import urlparse

import requests

from app.models.phishing import PhishingRedirectHop, PhishingResponse
from app.services.site_safety_service import (
    BANK_BRANDS,
    BRAND_KEYWORDS,
    ECOMMERCE_BRANDS,
    OFFICIAL_BANK_DOMAINS,
    OFFICIAL_BRAND_DOMAINS,
    OFFICIAL_CARGO_DOMAINS,
    OFFICIAL_ECOMMERCE_DOMAINS,
    SHORT_LINK_DOMAINS,
    _collect_domain_info,
    _domain_in_set,
    _levenshtein,
    _normalize_brand_text,
    _normalize_url,
    _safe_http_get_with_redirects,
)
from app.services.ssrf_guard import SsrfProtectionError, validate_outbound_url


EXTRA_OFFICIAL_DOMAINS = {
    "binance.com",
    "coinbase.com",
    "metamask.io",
    "whatsapp.com",
    "instagram.com",
    "facebook.com",
    "google.com",
    "microsoft.com",
    "apple.com",
}

PHISHING_OFFICIAL_DOMAINS = OFFICIAL_BRAND_DOMAINS | EXTRA_OFFICIAL_DOMAINS

PHISHING_BRAND_KEYWORDS: dict[str, list[str]] = {
    **BRAND_KEYWORDS,
    "Binance": ["binance"],
    "Coinbase": ["coinbase"],
    "MetaMask": ["metamask", "meta-mask"],
    "WhatsApp": ["whatsapp"],
    "Instagram": ["instagram"],
    "Facebook": ["facebook"],
    "Google": ["google"],
    "Microsoft": ["microsoft", "outlook", "hotmail", "office365"],
    "Apple": ["apple", "icloud"],
}

OFFICIAL_DOMAIN_BY_BRAND: dict[str, set[str]] = {
    "PTT": {"ptt.gov.tr", "pttavm.com"},
    "Türkiye / E-Devlet": {"turkiye.gov.tr", "giris.turkiye.gov.tr"},
    "Hepsiburada": {"hepsiburada.com"},
    "Trendyol": {"trendyol.com"},
    "N11": {"n11.com"},
    "Amazon": {"amazon.com.tr"},
    "Sahibinden": {"sahibinden.com"},
    "Ziraat Bankası": {"ziraatbank.com.tr"},
    "VakıfBank": {"vakifbank.com.tr"},
    "Halkbank": {"halkbank.com.tr"},
    "Garanti": {"garanti.com.tr", "garantibbva.com.tr"},
    "İşbank": {"isbank.com.tr"},
    "Akbank": {"akbank.com"},
    "Yapı Kredi": {"yapikredi.com.tr"},
    "Enpara": {"enpara.com"},
    "Papara": {"papara.com"},
    "Turkcell": {"turkcell.com.tr"},
    "Vodafone": {"vodafone.com.tr"},
    "Türk Telekom": {"turktelekom.com.tr"},
    "Binance": {"binance.com"},
    "Coinbase": {"coinbase.com"},
    "MetaMask": {"metamask.io"},
    "WhatsApp": {"whatsapp.com"},
    "Instagram": {"instagram.com"},
    "Facebook": {"facebook.com"},
    "Google": {"google.com"},
    "Microsoft": {"microsoft.com"},
    "Apple": {"apple.com"},
}

CRITICAL_BRANDS = BANK_BRANDS | {"PTT", "Türkiye / E-Devlet"}
SOCIAL_BRANDS = {"WhatsApp", "Instagram", "Facebook", "Google", "Microsoft", "Apple"}
CRYPTO_BRANDS = {"Binance", "Coinbase", "MetaMask"}

PHISHING_SHORT_LINK_DOMAINS = SHORT_LINK_DOMAINS | {
    "buff.ly",
    "t.ly",
}

SUSPICIOUS_GROUPS: dict[str, list[str]] = {
    "login": ["login", "signin", "giris", "giriş", "hesap", "account", "verify", "verification", "dogrula", "doğrula", "onay", "confirm", "security", "guvenlik", "güvenlik"],
    "payment": ["odeme", "ödeme", "payment", "pay", "kart", "card", "iban", "invoice", "fatura", "borc", "borç", "fee", "ucret", "ücret"],
    "cargo": ["kargo", "teslimat", "takip", "shipment", "cargo", "delivery", "paket", "gumruk", "gümrük"],
    "government": ["edevlet", "e-devlet", "turkiye", "gov", "devlet", "kimlik", "tc", "tckn"],
    "pressure": ["askiya", "askıya", "suspended", "blocked", "bloke", "ceza", "uyari", "uyarı", "ihlal"],
    "campaign": ["bonus", "hediye", "odul", "ödül", "kampanya", "indirim", "kupon", "prize", "reward"],
    "otp": ["sms", "otp", "kod", "code", "doğrulama-kodu", "dogrulama-kodu"],
}

TWO_PART_SUFFIXES = {"com.tr", "gov.tr", "org.tr", "net.tr", "edu.tr", "bel.tr", "k12.tr"}


def analyze_phishing(input_url: str) -> PhishingResponse:
    normalized_url = _normalize_url(input_url)
    parsed = urlparse(normalized_url)
    original_domain = (parsed.hostname or "").lower().removeprefix("www.")
    redirect_chain: list[PhishingRedirectHop] = []
    technical_notes: list[str] = []
    uncertain_signals: list[str] = []
    final_url: str | None = None

    try:
        validate_outbound_url(normalized_url)
        site_redirects: list = []
        response = _safe_http_get_with_redirects(normalized_url, site_redirects)
        final_url = response.url
        redirect_chain = [PhishingRedirectHop(url=hop.url, status_code=hop.status_code) for hop in site_redirects]
    except SsrfProtectionError as exc:
        uncertain_signals.append("Bağlantı güvenli analiz sınırları nedeniyle takip edilemedi.")
        technical_notes.append(str(exc))
    except requests.RequestException as exc:
        uncertain_signals.append("Bağlantının nihai adresi doğrulanamadı.")
        technical_notes.append(str(exc).replace("\n", " ")[:180])

    is_short_link = original_domain in PHISHING_SHORT_LINK_DOMAINS
    short_link_provider = original_domain if is_short_link else None
    if is_short_link and not final_url:
        uncertain_signals.append("Kısa linkin nihai adresi doğrulanamadı.")

    analyzed_url = final_url or normalized_url
    analyzed = urlparse(analyzed_url)
    domain = (analyzed.hostname or original_domain).lower().removeprefix("www.")
    root_domain = _root_domain(domain)
    is_https = analyzed.scheme == "https"
    official_domain_match = _domain_in_set(domain, PHISHING_OFFICIAL_DOMAINS)
    suspected_brand, matched_by_typo = _detect_suspected_brand(domain, analyzed_url)
    brand_impersonation_risk = bool(suspected_brand and not official_domain_match)
    signals = _collect_suspicious_signals(analyzed_url)
    category = _site_category(domain, suspected_brand, brand_impersonation_risk, signals, analyzed.path, analyzed.query)
    positive_signals = _positive_signals(is_https, official_domain_match, is_short_link, redirect_chain, brand_impersonation_risk, signals)
    phishing_signals: list[str] = []
    score = 0

    if brand_impersonation_risk and suspected_brand:
        brand_points = 70 if suspected_brand in CRITICAL_BRANDS else 60
        score += brand_points
        phishing_signals.append(f"{suspected_brand} marka/resmi kurum taklidi sinyali görüldü.")
        if matched_by_typo:
            phishing_signals.append("Alan adı marka adına benzer typo/homograf yapısı taşıyor.")

    if is_short_link:
        score += 10
        phishing_signals.append("Kısa link servisi kullanılıyor.")
    if is_short_link and not final_url:
        score += 10
    if not is_https:
        score += 20
        phishing_signals.append("HTTPS kullanılmıyor.")

    redirect_count = len(redirect_chain)
    if redirect_count >= 6:
        score += 20
        phishing_signals.append("6 veya daha fazla yönlendirme görüldü.")
    elif redirect_count >= 3:
        score += 10
        phishing_signals.append("Birden fazla yönlendirme görüldü.")
    if final_url and original_domain and domain and original_domain != domain:
        technical_notes.append(f"İlk domain {original_domain}, nihai domain {domain} olarak görüldü.")

    score += _score_suspicious_groups(signals, phishing_signals)
    score += _domain_age_score(domain, technical_notes, uncertain_signals)

    if brand_impersonation_risk:
        score = max(score, 70)
    if category == "Bahis / Kumar":
        score = max(score, 35)
        phishing_signals.append("Bahis/kumar bağlantısı sinyali görüldü.")

    if not phishing_signals:
        phishing_signals.append("Belirgin oltalama paterni görülmedi.")

    phishing_risk_score = min(100, max(0, score))
    phishing_risk_label = _risk_label(phishing_risk_score)
    risk_level = _risk_level(phishing_risk_score)
    citizen_summary = _citizen_summary(
        domain=domain,
        category=category,
        risk_label=phishing_risk_label,
        brand_impersonation_risk=brand_impersonation_risk,
        suspected_brand=suspected_brand,
        official_domain_match=official_domain_match,
        is_short_link=is_short_link,
        is_https=is_https,
    )

    return PhishingResponse(
        normalized_url=normalized_url,
        final_url=final_url,
        domain=domain,
        root_domain=root_domain,
        redirect_count=redirect_count,
        redirect_chain=redirect_chain,
        is_https=is_https,
        is_short_link=is_short_link,
        short_link_provider=short_link_provider,
        brand_impersonation_risk=brand_impersonation_risk,
        suspected_brand=suspected_brand,
        official_domain_match=official_domain_match,
        site_category=category,
        phishing_risk_score=phishing_risk_score,
        phishing_risk_label=phishing_risk_label,
        phishing_signals=_sort_phishing_signals(list(dict.fromkeys(phishing_signals))),
        positive_signals=positive_signals,
        uncertain_signals=list(dict.fromkeys(uncertain_signals)),
        citizen_summary=citizen_summary,
        citizen_recommendation=_citizen_recommendation(phishing_risk_score),
        technical_notes=list(dict.fromkeys(technical_notes)),
        risk_level=risk_level,
    )


def _detect_suspected_brand(domain: str, url: str) -> tuple[str | None, bool]:
    if _domain_in_set(domain, PHISHING_OFFICIAL_DOMAINS):
        return _brand_for_official_domain(domain), False

    normalized_domain = _normalize_brand_text(domain)
    normalized_url = _normalize_brand_text(url)
    domain_parts = domain.split(".")
    labels = [_normalize_brand_text(label) for label in domain_parts[:-1] if label]
    for brand, keywords in PHISHING_BRAND_KEYWORDS.items():
        for keyword in keywords:
            normalized_keyword = _normalize_brand_text(keyword)
            if normalized_keyword and (normalized_keyword in normalized_domain or normalized_keyword in normalized_url):
                return brand, False
            if (
                normalized_keyword
                and len(normalized_keyword) >= 5
                and any(len(label) >= 5 and _levenshtein(label, normalized_keyword) <= 2 for label in labels)
            ):
                return brand, True
    return None, False


def _brand_for_official_domain(domain: str) -> str | None:
    for brand, domains in OFFICIAL_DOMAIN_BY_BRAND.items():
        if _domain_in_set(domain, domains):
            return brand
    return None


def _site_category(domain: str, brand: str | None, brand_risk: bool, signals: dict[str, list[str]], path: str, query: str) -> str:
    if brand_risk and brand:
        if brand == "Türkiye / E-Devlet":
            return "Resmi kurum taklidi / Şüpheli"
        if brand in BANK_BRANDS:
            return "Banka taklidi / Şüpheli"
        if brand == "PTT":
            return "Kargo taklidi / Şüpheli"
        if brand in ECOMMERCE_BRANDS:
            return "E-Ticaret taklidi / Şüpheli"
        if brand in SOCIAL_BRANDS:
            return "Sosyal medya taklidi / Şüpheli"
        if brand in CRYPTO_BRANDS:
            return "Kripto taklidi / Şüpheli"

    if _domain_in_set(domain, {"turkiye.gov.tr", "giris.turkiye.gov.tr"}) or signals["government"]:
        return "Resmi kurum / Devlet"
    if _domain_in_set(domain, OFFICIAL_BANK_DOMAINS) or brand in BANK_BRANDS or signals["payment"]:
        return "Banka / Finans"
    if _domain_in_set(domain, OFFICIAL_CARGO_DOMAINS) or brand == "PTT" or signals["cargo"]:
        return "Kargo / Teslimat"
    if _domain_in_set(domain, OFFICIAL_ECOMMERCE_DOMAINS) or brand in ECOMMERCE_BRANDS:
        return "E-Ticaret"
    if brand in SOCIAL_BRANDS:
        return "Sosyal medya"
    if brand in CRYPTO_BRANDS:
        return "Kripto"
    if _looks_like_betting(domain, path, query):
        return "Bahis / Kumar"
    return "Bilinmeyen / Genel site"


def _collect_suspicious_signals(url: str) -> dict[str, list[str]]:
    parsed = urlparse(url)
    text = f"{parsed.path} {parsed.query}".lower()
    return {group: [word for word in words if word in text] for group, words in SUSPICIOUS_GROUPS.items()}


def _score_suspicious_groups(signals: dict[str, list[str]], phishing_signals: list[str]) -> int:
    score = 0
    labels = {
        "login": "Giriş/hesap doğrulama kelimeleri görüldü",
        "payment": "Ödeme/kart/IBAN kelimeleri görüldü",
        "cargo": "Kargo/teslimat kelimeleri görüldü",
        "government": "Resmi işlem/kimlik kelimeleri görüldü",
        "pressure": "Tehdit veya aciliyet dili görüldü",
        "campaign": "Hediye/kampanya dili görüldü",
        "otp": "SMS kodu/OTP doğrulama sinyali görüldü",
    }
    points = {
        "login": 15,
        "payment": 20,
        "cargo": 8,
        "government": 10,
        "pressure": 10,
        "campaign": 5,
        "otp": 25,
    }
    for group, matches in signals.items():
        if matches:
            score += points[group]
            phishing_signals.append(f"{labels[group]}: {', '.join(matches[:4])}.")
    return min(score, 45)


def _domain_age_score(domain: str, technical_notes: list[str], uncertain_signals: list[str]) -> int:
    try:
        domain_info = _collect_domain_info(domain)
    except Exception:
        uncertain_signals.append("Alan adı kayıt tarihi doğrulanamadı.")
        return 0
    if domain_info.domain_age_days is None:
        uncertain_signals.append("Alan adı kayıt tarihi doğrulanamadı.")
        return 0
    technical_notes.append(f"Alan adı yaşı yaklaşık {domain_info.domain_age_days} gün.")
    if domain_info.domain_age_days <= 30:
        return 20
    if domain_info.domain_age_days <= 90:
        return 10
    return 0


def _positive_signals(
    is_https: bool,
    official_domain_match: bool,
    is_short_link: bool,
    redirects: list[PhishingRedirectHop],
    brand_risk: bool,
    suspicious: dict[str, list[str]],
) -> list[str]:
    signals: list[str] = []
    if is_https:
        signals.append("HTTPS kullanıyor.")
    if official_domain_match:
        signals.append("Bilinen resmi domain veya resmi subdomain ile eşleşiyor.")
    if not is_short_link:
        signals.append("Kısa link servisi kullanılmıyor.")
    if len(redirects) <= 2:
        signals.append("Yönlendirme sayısı normal seviyede.")
    if not brand_risk:
        signals.append("Marka taklidi sinyali görülmedi.")
    if not any(suspicious.values()):
        signals.append("Şüpheli path/query kelimesi görülmedi.")
    return signals


def _citizen_summary(
    domain: str,
    category: str,
    risk_label: str,
    brand_impersonation_risk: bool,
    suspected_brand: str | None,
    official_domain_match: bool,
    is_short_link: bool,
    is_https: bool,
) -> str:
    if brand_impersonation_risk and suspected_brand:
        if suspected_brand == "PTT":
            return "Bu bağlantı PTT/kargo işlemi izlenimi veriyor ancak resmi PTT alan adıyla eşleşmiyor. Kargo ücreti, teslimat ödemesi, SMS kodu veya kimlik bilgisi istenirse işlem yapılmamalıdır."
        return f"Bu bağlantı {suspected_brand} markasını çağrıştırıyor ancak resmi alan adıyla eşleşmiyor. Şifre, kart, ödeme veya kimlik bilgisi girilmemelidir."
    if is_short_link:
        return "Bu bağlantı kısa link kullanıyor. Nihai adres doğrulanmadan kişisel bilgi veya ödeme bilgisi girilmemelidir."
    if category == "Bahis / Kumar":
        return "Bu bağlantı bahis/kumar hizmetiyle ilişkili görünüyor. Teknik olarak erişilebilir olması yasal veya güvenilir olduğu anlamına gelmez."
    if official_domain_match:
        return "Bu bağlantı bilinen resmi alan adıyla eşleşiyor. HTTPS kullanıyor ve belirgin bir marka taklidi sinyali görülmedi. Yine de işlem yapmadan önce adres çubuğundaki alan adını kontrol edin."
    if risk_label == "Düşük oltalama riski":
        return f"{domain} için belirgin oltalama sinyali görülmedi. HTTPS durumu {'olumlu' if is_https else 'olumsuz'} görünüyor; yine de hassas işlem öncesi adresi doğrulayın."
    return "Bu bağlantıda dikkat gerektiren oltalama sinyalleri görüldü. Resmi uygulama veya resmi web sitesi üzerinden doğrulama yapılmadan hassas bilgi girilmemelidir."


def _citizen_recommendation(score: int) -> str:
    if score <= 20:
        return "Adres çubuğundaki alan adını kontrol edin. Hassas işlem yapacaksanız siteye arama motoru veya yer imi üzerinden gidin."
    if score <= 49:
        return "Bağlantıya tıklamadan önce resmi uygulama veya resmi web sitesi üzerinden doğrulama yapın. SMS/e-posta ile geldiyse dikkatli olun."
    return "Bu bağlantı üzerinden şifre, kart, kimlik, SMS kodu veya ödeme bilgisi girmeyin. Resmi kurum/marka sitesini kendiniz yazarak açın."


def _risk_label(score: int) -> str:
    if score <= 20:
        return "Düşük oltalama riski"
    if score <= 49:
        return "Şüpheli bağlantı"
    return "Yüksek oltalama riski"


def _risk_level(score: int) -> str:
    if score <= 20:
        return "safe"
    if score <= 49:
        return "caution"
    return "risk"


def _sort_phishing_signals(signals: list[str]) -> list[str]:
    def priority(signal: str) -> int:
        lowered = signal.lower()
        if "marka" in lowered and "taklidi" in lowered:
            return 1
        if any(word in lowered for word in ["banka", "resmi", "kurum", "e-devlet", "edevlet"]):
            return 2
        if any(word in lowered for word in ["ödeme", "odeme", "kart", "iban", "payment"]):
            return 3
        if any(word in lowered for word in ["sms", "otp", "kod"]):
            return 4
        if any(word in lowered for word in ["login", "verify", "giriş", "giris", "hesap", "doğrulama"]):
            return 5
        if any(word in lowered for word in ["kargo", "teslimat", "cargo", "delivery"]):
            return 6
        if "kısa link" in lowered:
            return 7
        if any(word in lowered for word in ["redirect", "yönlendirme"]):
            return 8
        return 9

    return sorted(signals, key=priority)


def _root_domain(domain: str) -> str:
    parts = [part for part in domain.split(".") if part]
    if len(parts) < 2:
        return domain
    suffix = ".".join(parts[-2:])
    if suffix in TWO_PART_SUFFIXES and len(parts) >= 3:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def _looks_like_betting(domain: str, path: str, query: str) -> bool:
    text = f"{domain} {path} {query}".lower()
    affiliate_registration = domain.rsplit(".", 1)[-1] in {"pro", "bet", "casino"} and "registration" in text and "tag" in text
    return affiliate_registration or any(word in text for word in ["bet", "bahis", "casino", "slot", "iddaa"])
