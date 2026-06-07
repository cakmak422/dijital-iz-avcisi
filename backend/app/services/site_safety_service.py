from __future__ import annotations

import ipaddress
import html as html_lib
import os
import re
import socket
import ssl
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse, urlunparse

import requests

from app.models.site_safety import (
    DnsInfo,
    DomainInfo,
    IpInfo,
    IpRecord,
    MailSecurityInfo,
    RedirectHop,
    RiskScoreItem,
    SecurityHeadersInfo,
    SiteCategoryInfo,
    SiteSafetyResponse,
    SslInfo,
    TechnicalFinding,
    ThreatIntelInfo,
    UrlAnalysis,
)
from app.services.ssrf_guard import SsrfProtectionError, validate_outbound_url

try:
    import dns.resolver
    import dns.reversename
except ImportError:  # pragma: no cover - optional dependency fallback
    dns = None  # type: ignore[assignment]


REQUEST_TIMEOUT = 4
DNS_LIFETIME = 2.5
DNS_TIMEOUT = 1.5
WHOIS_TIMEOUT = 3
USER_AGENT = "Dijital-Iz-Avcisi/1.0 (+https://dijitalizavcisi.com)"

SHORT_LINK_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "cutt.ly",
    "lnkd.in",
    "shorturl.at",
    "rebrand.ly",
    "rb.gy",
    "s.id",
}

SUSPICIOUS_WORDS = [
    "login",
    "verify",
    "secure",
    "account",
    "odeme",
    "ödeme",
    "kargo",
    "hediye",
    "kampanya",
    "dogrula",
    "doğrula",
    "support",
    "wallet",
    "bonus",
    "bank",
    "update",
    "auth",
]

OFFICIAL_DOMAINS = [
    "turkiye.gov.tr",
    "ptt.gov.tr",
    "trendyol.com",
    "hepsiburada.com",
    "n11.com",
    "amazon.com.tr",
    "ziraatbank.com.tr",
    "garantibbva.com.tr",
    "akbank.com",
    "isbank.com.tr",
]

SECURITY_HEADER_LABELS = {
    "strict-transport-security": "HSTS",
    "content-security-policy": "Content-Security-Policy",
    "x-frame-options": "X-Frame-Options",
    "x-content-type-options": "X-Content-Type-Options",
    "referrer-policy": "Referrer-Policy",
    "permissions-policy": "Permissions-Policy",
}

PROVIDER_KEYWORDS = [
    ("Cloudflare", ["cloudflare", "cf-ray", "cloudflare inc"]),
    ("Sucuri", ["sucuri"]),
    ("Fastly", ["fastly"]),
    ("Akamai", ["akamai"]),
    ("Google", ["google", "google cloud"]),
    ("Amazon AWS", ["amazon", "aws", "cloudfront"]),
    ("Microsoft Azure", ["microsoft", "azure"]),
    ("DigitalOcean", ["digitalocean", "digital ocean"]),
    ("Hetzner", ["hetzner"]),
    ("OVH", ["ovh"]),
]

CDN_WAF_PROVIDERS = {"Cloudflare", "Sucuri", "Fastly", "Akamai"}

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Resmi kurum / Devlet": ["gov.tr", "edevlet", "e-devlet", "devlet", "belediye", "bakanlik", "bakanlık", "resmi"],
    "Banka / Finans": [
        "banka",
        "bank",
        "kredi",
        "kart",
        "ödeme",
        "odeme",
        "hesap",
        "iban",
        "ziraat",
        "vakıfbank",
        "vakifbank",
        "halkbank",
        "garanti",
        "isbank",
        "işbank",
        "akbank",
        "yapikredi",
        "yapı kredi",
    ],
    "E-Ticaret": ["shop", "store", "sepet", "ürün", "urun", "sipariş", "siparis", "trendyol", "hepsiburada", "n11", "amazon"],
    "Kargo / Teslimat": ["kargo", "teslimat", "takip", "shipment", "cargo", "delivery", "ptt", "aras", "mng", "yurtiçi", "yurtici"],
    "Sosyal medya": ["facebook", "instagram", "tiktok", "twitter", "x.com", "linkedin", "youtube", "sosyal"],
    "Haber / İçerik": ["haber", "news", "blog", "medya", "gündem", "gundem", "içerik", "icerik"],
    "Bahis / Kumar": [
        "bet",
        "bahis",
        "casino",
        "poker",
        "slot",
        "jackpot",
        "megapari",
        "xbet",
        "betwinner",
        "1win",
        "melbet",
        "iddaa",
        "kupon",
        "bonus",
        "canlı bahis",
        "canli bahis",
        "para yatır",
        "para yatir",
    ],
    "Kripto": ["crypto", "kripto", "coin", "token", "exchange", "wallet", "binance", "btc", "eth"],
    "Yatırım / Forex": ["forex", "investment", "trade", "broker", "kaldıraç", "kaldirac", "yatırım", "yatirim", "kazanç", "kazanc", "gelir", "pasif gelir"],
    "Yetişkin içerik": ["adult", "xxx", "porno", "sex", "escort", "yetişkin", "yetiskin"],
}

OFFICIAL_BANK_DOMAINS = {
    "ziraatbank.com.tr",
    "vakifbank.com.tr",
    "halkbank.com.tr",
    "garantibbva.com.tr",
    "isbank.com.tr",
    "akbank.com",
    "yapikredi.com.tr",
}

OFFICIAL_CARGO_DOMAINS = {
    "ptt.gov.tr",
    "pttavm.com",
    "araskargo.com.tr",
    "mngkargo.com.tr",
    "yurticikargo.com",
    "suratkargo.com.tr",
}

OFFICIAL_ECOMMERCE_DOMAINS = {"trendyol.com", "hepsiburada.com", "n11.com", "amazon.com.tr"}


def analyze_site_safety(input_url: str) -> SiteSafetyResponse:
    normalized_url = _normalize_url(input_url)
    parsed = urlparse(normalized_url)
    domain = (parsed.hostname or "").lower().removeprefix("www.")
    findings: list[TechnicalFinding] = []

    url_analysis, security_headers = _analyze_url(input_url, normalized_url, domain, findings)
    dns_info = _collect_dns(domain)
    domain_info = _collect_domain_info(domain)
    ssl_info = _collect_ssl_info(domain)
    mail_security = _analyze_mail_security(domain, dns_info)
    ip_info, ip_records = _collect_ip_info(dns_info)
    threat_intel = _collect_threat_intel(domain, url_analysis.final_url or normalized_url)

    risk_breakdown = _calculate_risk_breakdown(
        url_analysis=url_analysis,
        security_headers=security_headers,
        dns_info=dns_info,
        domain_info=domain_info,
        ssl_info=ssl_info,
        mail_security=mail_security,
        threat_intel=threat_intel,
        findings=findings,
    )
    risk_score = max(0, min(100, sum(item.points for item in risk_breakdown)))
    risk_level = _risk_level_from_score(risk_score)
    risk_label = _risk_label_from_score(risk_score)
    category_info = _build_site_category_info(domain, normalized_url, url_analysis, risk_score)
    citizen_summary = _build_citizen_summary(domain, domain_info, ssl_info, mail_security, url_analysis, threat_intel, category_info)
    safe_summary = _build_safe_summary(domain_info, ssl_info, security_headers, dns_info)
    risk_summary = _build_risk_summary(risk_breakdown, findings)
    public_advice = _build_public_advice(risk_score, mail_security, url_analysis, threat_intel)

    return SiteSafetyResponse(
        input=input_url,
        normalized_url=normalized_url,
        domain=domain,
        final_url=url_analysis.final_url,
        http_status=url_analysis.http_status,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_label=risk_label,
        technical_risk_label=risk_label,
        site_category=category_info.site_category,
        category_confidence=category_info.category_confidence,
        citizen_risk_level=category_info.citizen_risk_level,
        citizen_risk_reason=category_info.citizen_risk_reason,
        category_warning=category_info.category_warning,
        category_signals=category_info.category_signals,
        risk_score_breakdown=risk_breakdown,
        citizen_summary=citizen_summary,
        safe_summary=safe_summary,
        risk_summary=risk_summary,
        public_advice=public_advice,
        technical_findings=findings,
        url_analysis=url_analysis,
        security_headers=security_headers,
        domain_info=domain_info,
        dns_info=dns_info,
        mail_security=mail_security,
        ssl_info=ssl_info,
        ip_info=ip_info,
        ip_records=ip_records,
        threat_intel=threat_intel,
    )


def _normalize_url(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Geçerli bir domain veya URL girin.")

    if not re.match(r"^https?://", cleaned, re.IGNORECASE):
        cleaned = f"https://{cleaned}"

    parsed = urlparse(cleaned)
    hostname = (parsed.hostname or "").strip().lower()
    if not hostname or hostname in {"http", "https"}:
        raise ValueError("Geçerli bir domain veya URL girin.")

    try:
        ascii_host = hostname.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("Alan adı karakterleri çözümlenemedi.") from exc

    netloc = ascii_host
    if parsed.port:
        netloc = f"{netloc}:{parsed.port}"

    path = parsed.path or "/"
    return urlunparse((parsed.scheme.lower(), netloc, path, "", parsed.query, ""))


def _analyze_url(
    original_url: str,
    url: str,
    domain: str,
    findings: list[TechnicalFinding],
) -> tuple[UrlAnalysis, SecurityHeadersInfo]:
    parsed = urlparse(url)
    suspicious = [word for word in SUSPICIOUS_WORDS if word in url.lower()]
    typo_signals = _detect_typo_signals(domain)
    redirect_chain: list[RedirectHop] = []
    final_url: str | None = None
    page_title: str | None = None
    status_code: int | None = None
    notes: list[str] = []
    headers_info = SecurityHeadersInfo(notes=["HTTP yanıtı alınamadığı için güvenlik header kontrolü sınırlı kaldı."])

    try:
        validate_outbound_url(url)
        response = _safe_http_get_with_redirects(url, redirect_chain)
        status_code = response.status_code
        final_url = response.url
        page_title = _extract_page_title(response.text)
        headers_info = _extract_security_headers(response.headers)
        cdn = _detect_provider_from_headers(response.headers)
        if cdn:
            headers_info.notes.append(f"Yanıt başlıklarında {cdn} altyapı sinyali görüldü.")

        if status_code == 403:
            if _is_cloudflare_response(response.headers):
                findings.append(
                    TechnicalFinding(
                        severity="safe",
                        title="Cloudflare koruması",
                        detail="Site 403 döndü ancak yanıt Cloudflare koruma katmanından geliyor. Bu durum tek başına risk puanı artırmaz.",
                    )
                )
            else:
                findings.append(
                    TechnicalFinding(
                        severity="safe",
                        title="HTTP 403",
                        detail="Site erişimi sınırlamış olabilir. 403 durum kodu tek başına risk puanı artırmaz.",
                    )
                )
    except SsrfProtectionError as exc:
        notes.append(str(exc))
        findings.append(TechnicalFinding(severity="risk", title="SSRF koruması", detail=str(exc)))
    except requests.RequestException as exc:
        notes.append(f"HTTP isteği tamamlanamadı: {_safe_detail(exc)}")
        findings.append(TechnicalFinding(severity="caution", title="HTTP kontrolü tamamlanamadı", detail=_safe_detail(exc)))

    if parsed.scheme != "https":
        findings.append(TechnicalFinding(severity="risk", title="HTTPS kullanılmıyor", detail="Site adresi HTTPS ile başlamıyor."))
    if redirect_chain:
        findings.append(TechnicalFinding(severity="caution", title="Redirect zinciri", detail=f"{len(redirect_chain)} adet yönlendirme görüldü."))
    if domain in SHORT_LINK_DOMAINS:
        findings.append(TechnicalFinding(severity="caution", title="Kısa link servisi", detail="Kısa linkler hedef adresi gizleyebilir."))
    if suspicious:
        findings.append(TechnicalFinding(severity="caution", title="Şüpheli kelime sinyali", detail=", ".join(suspicious[:5])))
    for signal in typo_signals:
        findings.append(TechnicalFinding(severity="caution", title="Typo/homograf sinyali", detail=signal))

    return (
        UrlAnalysis(
            original_url=original_url,
            normalized_url=url,
            domain=domain,
            final_url=final_url,
            page_title=page_title,
            redirect_chain=redirect_chain,
            https=parsed.scheme == "https",
            http_status=status_code,
            is_short_link=domain in SHORT_LINK_DOMAINS,
            suspicious_keywords=suspicious,
            typo_signals=typo_signals,
            notes=notes,
        ),
        headers_info,
    )


def _safe_http_get_with_redirects(url: str, redirect_chain: list[RedirectHop]) -> requests.Response:
    current_url = url
    session = requests.Session()

    for _ in range(6):
        validate_outbound_url(current_url)
        response = session.get(current_url, timeout=REQUEST_TIMEOUT, allow_redirects=False, headers={"User-Agent": USER_AGENT})

        if response.is_redirect or response.is_permanent_redirect:
            redirect_chain.append(RedirectHop(url=response.url, status_code=response.status_code))
            next_url = response.headers.get("location")
            if not next_url:
                return response
            current_url = requests.compat.urljoin(response.url, next_url)
            continue

        return response

    raise SsrfProtectionError("Redirect zinciri güvenli sınırı aştığı için analiz durduruldu.")


def _extract_page_title(raw_html: str) -> str | None:
    if not raw_html:
        return None
    match = re.search(r"<title[^>]*>(.*?)</title>", raw_html[:120_000], re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", match.group(1))).strip()
    return html_lib.unescape(title)[:180] if title else None


def _extract_security_headers(headers: requests.structures.CaseInsensitiveDict[str]) -> SecurityHeadersInfo:
    values = {
        "content_security_policy": headers.get("content-security-policy"),
        "x_frame_options": headers.get("x-frame-options"),
        "x_content_type_options": headers.get("x-content-type-options"),
        "referrer_policy": headers.get("referrer-policy"),
        "permissions_policy": headers.get("permissions-policy"),
        "hsts": headers.get("strict-transport-security"),
    }
    missing = [label for key, label in SECURITY_HEADER_LABELS.items() if not headers.get(key)]
    notes = []
    if missing:
        notes.append("Eksik güvenlik headerları doğrudan kötü niyet göstergesi değildir; savunma katmanının zayıf olabileceğini anlatır.")
    return SecurityHeadersInfo(**values, missing=missing, notes=notes)


def _collect_dns(domain: str) -> DnsInfo:
    info = DnsInfo()

    if dns is None:
        info.notes.append("Detaylı DNS kayıtları için dnspython kurulumu gerekir.")
        return _socket_dns_fallback(domain, info)

    resolver = dns.resolver.Resolver()
    resolver.lifetime = DNS_LIFETIME
    resolver.timeout = DNS_TIMEOUT

    record_targets: list[tuple[str, list[str]]] = [
        ("A", info.a),
        ("AAAA", info.aaaa),
        ("CNAME", info.cname),
        ("MX", info.mx),
        ("NS", info.ns),
        ("TXT", info.txt),
        ("SOA", info.soa),
        ("CAA", info.caa),
    ]

    failed_records: list[tuple[str, list[str]]] = []
    for record_type, target in record_targets:
        try:
            answers = resolver.resolve(domain, record_type)
            for answer in answers:
                target.append(_format_dns_answer(record_type, answer))
        except Exception:
            failed_records.append((record_type, target))

    if not info.a and not info.aaaa:
        _socket_dns_fallback(domain, info)

    for record_type, target in failed_records:
        if not target:
            info.notes.append(f"{record_type} kaydı bulunamadı veya DNS kaynağı yanıt döndürmedi.")

    info.nameservers = info.ns
    first_ip = info.a[0] if info.a else info.aaaa[0] if info.aaaa else None
    if first_ip:
        try:
            reverse_name = dns.reversename.from_address(first_ip)
            info.ptr = [str(answer).rstrip(".") for answer in resolver.resolve(reverse_name, "PTR")]
        except Exception:
            info.notes.append("PTR kaydı okunamadı veya bu IP için ters DNS kaydı yok.")

    provider = _detect_provider(" ".join([*info.ns, *info.cname, *info.txt, *info.ptr]))
    if provider in CDN_WAF_PROVIDERS:
        info.cdn_provider = provider
        info.waf_provider = provider
        info.notes.append(f"{provider} CDN/WAF altyapısı görüldü. Gerçek sunucu IP'si gizlenmiş olabilir.")
    elif provider:
        info.cdn_provider = provider

    return info


def _socket_dns_fallback(domain: str, info: DnsInfo) -> DnsInfo:
    try:
        resolved = socket.getaddrinfo(domain, None, proto=socket.IPPROTO_TCP)
        for item in resolved:
            address = item[4][0]
            if ":" in address and address not in info.aaaa:
                info.aaaa.append(address)
            elif ":" not in address and address not in info.a:
                info.a.append(address)
    except socket.gaierror:
        info.notes.append("A/AAAA kayıtları socket ile okunamadı; domain çözümlenememiş olabilir.")
    return info


def _format_dns_answer(record_type: str, answer: Any) -> str:
    if record_type == "TXT":
        strings = getattr(answer, "strings", None)
        if strings:
            return "".join(part.decode("utf-8", errors="replace") for part in strings)
        return str(answer).strip('"')
    if record_type == "MX":
        return f"{answer.preference} {str(answer.exchange).rstrip('.')}"
    if record_type in {"NS", "CNAME"}:
        return str(answer).rstrip(".")
    return str(answer).strip('"')


def _collect_domain_info(domain: str) -> DomainInfo:
    data: dict[str, Any] | None = None
    notes: list[str] = []

    try:
        response = requests.get(f"https://rdap.org/domain/{domain}", timeout=REQUEST_TIMEOUT, headers={"Accept": "application/rdap+json", "User-Agent": USER_AGENT})
        if response.ok:
            data = response.json()
        else:
            notes.append(f"RDAP kaynağı {response.status_code} durum kodu döndürdü.")
    except (requests.RequestException, ValueError):
        notes.append("RDAP servisine ulaşılamadı veya yanıt okunamadı.")

    if not data:
        whois_info = _query_whois_fallback(domain)
        whois_info.notes = [*notes, *whois_info.notes]
        return whois_info

    events = data.get("events", [])
    created_at = _find_rdap_event(events, "registration")
    updated_at = _find_rdap_event(events, "last changed") or _find_rdap_event(events, "last update of RDAP database")
    expires_at = _find_rdap_event(events, "expiration")
    registrar, registrar_iana_id = _find_registrar(data)
    abuse_contact = _find_abuse_contact(data)
    nameservers = [item.get("ldhName") or item.get("unicodeName") for item in data.get("nameservers", []) if item.get("ldhName") or item.get("unicodeName")]
    status_codes = [str(item) for item in data.get("status", [])]
    age_days = _age_days(created_at)

    if not created_at or not registrar:
        notes.append("Registrar gizlilik servisi veya RDAP kısıtı nedeniyle bazı domain bilgileri görünmüyor.")
    if not abuse_contact:
        notes.append("RDAP yanıtında abuse e-posta bilgisi görünmedi.")

    return DomainInfo(
        created_at=created_at,
        updated_at=updated_at,
        expires_at=expires_at,
        domain_age_days=age_days,
        registrar=registrar,
        registrar_iana_id=registrar_iana_id,
        abuse_contact=abuse_contact,
        nameservers=nameservers,
        status_codes=status_codes,
        notes=notes,
    )


def _query_whois_fallback(domain: str) -> DomainInfo:
    notes = ["RDAP verisi alınamadı; WHOIS fallback sınırlı biçimde denendi."]
    try:
        iana = _whois_query("whois.iana.org", domain)
        match = re.search(r"whois:\s*(\S+)", iana, re.IGNORECASE)
        server = match.group(1) if match else ""
        raw = _whois_query(server, domain) if server else iana
    except Exception:
        return DomainInfo(notes=[*notes, "WHOIS fallback yanıtı alınamadı."])

    created_at = _find_whois_value(raw, ["Creation Date", "Created", "Registered"])
    updated_at = _find_whois_value(raw, ["Updated Date", "Last Updated"])
    expires_at = _find_whois_value(raw, ["Registry Expiry Date", "Expiration Date", "Expiry Date", "Expires"])
    registrar = _find_whois_value(raw, ["Registrar"])
    abuse_contact = _find_whois_value(raw, ["Registrar Abuse Contact Email", "Abuse Contact Email"])
    return DomainInfo(
        created_at=created_at,
        updated_at=updated_at,
        expires_at=expires_at,
        domain_age_days=_age_days(created_at),
        registrar=registrar,
        abuse_contact=abuse_contact,
        notes=notes,
    )


def _whois_query(server: str, query: str) -> str:
    if not server:
        raise ValueError("WHOIS server yok.")
    with socket.create_connection((server, 43), timeout=WHOIS_TIMEOUT) as sock:
        sock.sendall(f"{query}\r\n".encode("utf-8"))
        chunks = []
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            chunks.append(chunk)
    return b"".join(chunks).decode("utf-8", errors="replace")


def _find_whois_value(raw: str, labels: list[str]) -> str | None:
    for label in labels:
        match = re.search(rf"^{re.escape(label)}:\s*(.+)$", raw, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
    return None


def _collect_ssl_info(domain: str) -> SslInfo:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=REQUEST_TIMEOUT) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as tls:
                cert = tls.getpeercert()
                tls_version = tls.version()
    except Exception as exc:
        return SslInfo(valid=False, status="Tespit Edilemedi", notes=[f"SSL/TLS bağlantı testi tamamlanamadı: {_safe_detail(exc)}"])

    not_after = cert.get("notAfter")
    not_before = cert.get("notBefore")
    expires_at = _parse_cert_time(not_after)
    valid_from = _parse_cert_time(not_before)
    days_remaining = None
    if expires_at:
        days_remaining = (datetime.fromisoformat(expires_at) - datetime.now(timezone.utc)).days

    valid = bool(days_remaining is None or days_remaining >= 0)
    status = "Geçerli" if valid else "Süresi Dolmuş"

    return SslInfo(
        valid=valid,
        status=status,
        valid_from=valid_from,
        expires_at=expires_at,
        issuer=_cert_name(cert.get("issuer", [])),
        subject=_cert_name(cert.get("subject", [])),
        days_remaining=days_remaining,
        san=_extract_san(cert),
        tls_version=tls_version,
        notes=[] if valid else ["Sertifika süresi dolmuş görünüyor; kullanıcı güvenliği açısından dikkat gerektirir."],
    )


def _analyze_mail_security(domain: str, dns_info: DnsInfo) -> MailSecurityInfo:
    txt_records = dns_info.txt
    has_mx = bool(dns_info.mx)
    has_spf = any(record.lower().startswith("v=spf1") for record in txt_records)
    dmarc_records: list[str] = []

    if dns is not None:
        try:
            answers = dns.resolver.resolve(f"_dmarc.{domain}", "TXT")
            dmarc_records = [_format_dns_answer("TXT", answer) for answer in answers]
        except Exception:
            pass

    has_dmarc = any("v=dmarc1" in record.lower() for record in dmarc_records)
    has_dkim_signal = any("dkim" in record.lower() or "_domainkey" in record.lower() for record in txt_records)
    risk = "safe" if has_spf and has_dmarc else "caution" if has_mx or has_spf or has_dmarc else "safe"
    notes = []
    if not has_mx:
        notes.append("Bu alan adına tanımlı e-posta sunucusu bulunamadı. Alan adı mail hizmeti kullanmıyor olabilir.")
    if not has_spf:
        notes.append("Alan adı adına sahte e-posta gönderimini zorlaştıran SPF kaydı bulunamadı.")
    if not has_dmarc:
        notes.append("Phishing ve spoofing riskini azaltan DMARC politikası bulunamadı.")
    if not has_dkim_signal:
        notes.append("Selector bilinmediği için DKIM durumu doğrulanamadı; bilinmeyen durum risk puanı olarak değerlendirilmez.")

    return MailSecurityInfo(
        has_mx=has_mx,
        has_spf=has_spf,
        has_dmarc=has_dmarc,
        has_dkim_signal=has_dkim_signal,
        spoofing_risk=risk,
        notes=notes,
    )


def _collect_ip_info(dns_info: DnsInfo) -> tuple[IpInfo, list[IpRecord]]:
    ips = list(dict.fromkeys([*dns_info.a, *dns_info.aaaa]))[:6]
    if not ips:
        return IpInfo(notes=["A/AAAA kayıtlarından IP adresi bulunamadı."]), []

    records = [_build_ip_record(ip) for ip in ips]
    primary_record = records[0]
    primary = IpInfo(
        ip=primary_record.ip,
        country=primary_record.country,
        asn=primary_record.asn,
        organization=primary_record.organization,
        network_name=primary_record.network_name,
        hosting=primary_record.provider or primary_record.organization or primary_record.network_name,
        provider_type=primary_record.provider_type,
        abuse_contact=primary_record.abuse_contact,
        notes=primary_record.notes,
    )
    return primary, records


def _build_ip_record(ip: str) -> IpRecord:
    notes: list[str] = []
    data = _fetch_ip_rdap(ip, notes)
    country = data.get("country") if data else None
    network_name = data.get("name") if data else None
    handle = str(data.get("handle")) if data and data.get("handle") else None
    organization = _find_org(data) if data else None
    abuse_contact = _find_abuse_contact(data) if data else None
    network_cidr = _cidr_from_rdap(data)

    cymru_asn, cymru_org = _team_cymru_lookup(ip)
    asn = cymru_asn or handle
    if not organization and cymru_org:
        organization = cymru_org

    provider = _detect_provider(" ".join(filter(None, [organization, network_name, asn, ip])))
    provider_type = "CDN/WAF" if provider in CDN_WAF_PROVIDERS else "Hosting/Altyapı" if provider else None
    if provider in CDN_WAF_PROVIDERS:
        notes.append(f"{provider} altyapısı görüldü; gerçek sunucu IP'si gizlenmiş olabilir.")

    return IpRecord(
        ip=ip,
        country=country,
        asn=asn,
        organization=organization,
        network_name=network_name or network_cidr,
        provider=provider,
        provider_type=provider_type,
        abuse_contact=abuse_contact,
        notes=notes,
    )


def _fetch_ip_rdap(ip: str, notes: list[str]) -> dict[str, Any] | None:
    try:
        response = requests.get(f"https://rdap.org/ip/{ip}", timeout=REQUEST_TIMEOUT, headers={"Accept": "application/rdap+json", "User-Agent": USER_AGENT})
        if not response.ok:
            notes.append(f"IP RDAP kaynağı {response.status_code} durum kodu döndürdü.")
            return None
        return response.json()
    except (requests.RequestException, ValueError):
        notes.append("IP RDAP servisine ulaşılamadı veya yanıt okunamadı.")
        return None


def _team_cymru_lookup(ip: str) -> tuple[str | None, str | None]:
    if dns is None:
        return None, None
    try:
        ip_obj = ipaddress.ip_address(ip)
        if not ip_obj.is_global or ip_obj.version != 4:
            return None, None
        reversed_ip = ".".join(reversed(ip.split(".")))
        answers = dns.resolver.resolve(f"{reversed_ip}.origin.asn.cymru.com", "TXT")
        value = _format_dns_answer("TXT", answers[0])
        parts = [part.strip() for part in value.split("|")]
        if len(parts) >= 6:
            return f"AS{parts[0]}", parts[5]
        if len(parts) >= 1:
            return f"AS{parts[0]}", None
    except Exception:
        return None, None
    return None, None


def _collect_threat_intel(domain: str, url: str) -> ThreatIntelInfo:
    info = ThreatIntelInfo()
    vt_key = os.getenv("VIRUSTOTAL_API_KEY")
    safe_browsing_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")
    otx_key = os.getenv("ALIENVAULT_OTX_API_KEY")

    if vt_key:
        _check_virustotal(domain, vt_key, info)
    else:
        info.skipped_sources.append("VirusTotal")
        info.notes.append("VirusTotal API anahtarı tanımlı olmadığı için bu kaynak atlandı.")

    if safe_browsing_key:
        _check_google_safe_browsing(url, safe_browsing_key, info)
    else:
        info.skipped_sources.append("Google Safe Browsing")
        info.notes.append("Google Safe Browsing API anahtarı tanımlı olmadığı için bu kaynak atlandı.")

    if otx_key:
        _check_alienvault_otx(domain, otx_key, info)
    else:
        info.skipped_sources.append("AlienVault OTX")
        info.notes.append("AlienVault OTX API anahtarı tanımlı olmadığı için bu kaynak atlandı.")

    return info


def _check_virustotal(domain: str, api_key: str, info: ThreatIntelInfo) -> None:
    try:
        response = requests.get(
            f"https://www.virustotal.com/api/v3/domains/{domain}",
            headers={"x-apikey": api_key, "User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT,
        )
        info.checked_sources.append("VirusTotal")
        if not response.ok:
            info.notes.append(f"VirusTotal {response.status_code} durum kodu döndürdü.")
            return
        stats = response.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        info.malicious_count += int(stats.get("malicious", 0) or 0)
        info.suspicious_count += int(stats.get("suspicious", 0) or 0)
    except Exception:
        info.checked_sources.append("VirusTotal")
        info.notes.append("VirusTotal kontrolü tamamlanamadı.")


def _check_google_safe_browsing(url: str, api_key: str, info: ThreatIntelInfo) -> None:
    body = {
        "client": {"clientId": "dijital-iz-avcisi", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }
    try:
        response = requests.post(
            f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}",
            json=body,
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": USER_AGENT},
        )
        info.checked_sources.append("Google Safe Browsing")
        if not response.ok:
            info.notes.append(f"Google Safe Browsing {response.status_code} durum kodu döndürdü.")
            return
        matches = response.json().get("matches", [])
        if matches:
            info.malicious_count += len(matches)
            info.notes.append("Google Safe Browsing eşleşmesi görüldü.")
    except Exception:
        info.checked_sources.append("Google Safe Browsing")
        info.notes.append("Google Safe Browsing kontrolü tamamlanamadı.")


def _check_alienvault_otx(domain: str, api_key: str, info: ThreatIntelInfo) -> None:
    try:
        response = requests.get(
            f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general",
            headers={"X-OTX-API-KEY": api_key, "User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT,
        )
        info.checked_sources.append("AlienVault OTX")
        if not response.ok:
            info.notes.append(f"AlienVault OTX {response.status_code} durum kodu döndürdü.")
            return
        pulse_count = int(response.json().get("pulse_info", {}).get("count", 0) or 0)
        if pulse_count:
            info.suspicious_count += min(pulse_count, 10)
            info.notes.append(f"AlienVault OTX üzerinde {pulse_count} pulse kaydı görüldü.")
    except Exception:
        info.checked_sources.append("AlienVault OTX")
        info.notes.append("AlienVault OTX kontrolü tamamlanamadı.")


def _build_site_category_info(domain: str, normalized_url: str, url_analysis: UrlAnalysis, technical_score: int) -> SiteCategoryInfo:
    parsed = urlparse(normalized_url)
    text = " ".join(
        filter(
            None,
            [
                domain,
                parsed.path,
                parsed.query,
                url_analysis.page_title,
                normalized_url,
            ],
        )
    ).lower()

    category_scores: dict[str, int] = {}
    category_signals: dict[str, list[str]] = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        hits = [keyword for keyword in keywords if keyword.lower() in text]
        if hits:
            category_scores[category] = len(hits)
            category_signals[category] = hits[:6]

    if domain.endswith(".gov.tr"):
        category_scores["Resmi kurum / Devlet"] = category_scores.get("Resmi kurum / Devlet", 0) + 4
        category_signals.setdefault("Resmi kurum / Devlet", []).append(".gov.tr")

    if any(word in text for word in ["kargo", "teslimat", "shipment", "cargo", "delivery", "takip"]):
        category_scores["Kargo / Teslimat"] = category_scores.get("Kargo / Teslimat", 0) + 2

    if _domain_in_set(domain, OFFICIAL_ECOMMERCE_DOMAINS):
        category_scores["E-Ticaret"] = category_scores.get("E-Ticaret", 0) + 3
        category_signals.setdefault("E-Ticaret", []).append("bilinen e-ticaret domaini")

    if _domain_in_set(domain, OFFICIAL_BANK_DOMAINS):
        category_scores["Banka / Finans"] = category_scores.get("Banka / Finans", 0) + 3
        category_signals.setdefault("Banka / Finans", []).append("bilinen banka domaini")

    if _is_affiliate_registration_pattern(domain, parsed.path, parsed.query):
        category_scores["Bahis / Kumar"] = category_scores.get("Bahis / Kumar", 0) + 3
        category_signals.setdefault("Bahis / Kumar", []).append("affiliate kayıt paterni")

    if not category_scores:
        category = "Genel / Bilgilendirme" if technical_score <= 20 else "Bilinmeyen / Genel site"
        signals: list[str] = []
        confidence = 0.15
    else:
        category = max(category_scores.items(), key=lambda item: item[1])[0]
        signals = category_signals.get(category, [])
        confidence = min(0.95, 0.35 + category_scores[category] * 0.12)

    citizen_risk_level, citizen_risk_reason, category_warning = _citizen_risk_for_category(
        category=category,
        domain=domain,
        normalized_url=normalized_url,
        technical_score=technical_score,
    )

    return SiteCategoryInfo(
        site_category=category,
        category_confidence=round(confidence, 2),
        citizen_risk_level=citizen_risk_level,
        citizen_risk_reason=citizen_risk_reason,
        category_warning=category_warning,
        category_signals=signals,
    )


def _citizen_risk_for_category(category: str, domain: str, normalized_url: str, technical_score: int) -> tuple[str, str, str]:
    text = normalized_url.lower()

    if category == "Bahis / Kumar":
        return (
            "Dikkatli İncele",
            "Bu site çevrim içi bahis/kumar hizmeti sunuyor gibi görünmektedir.",
            "Teknik olarak erişilebilir olması, yasal veya güvenilir olduğu anlamına gelmez. Para yatırmadan ya da üyelik oluşturmadan önce resmi lisans ve yasal durum doğrulanmalıdır.",
        )

    if category == "Kripto":
        return (
            "Dikkatli İncele",
            "Bu site kripto para veya dijital varlık hizmeti sunuyor gibi görünmektedir.",
            "Sahte yatırım, cüzdan ele geçirme ve kimlik avı riskleri nedeniyle işlem yapmadan önce resmi domain, lisans bilgisi ve kullanıcı şikayetleri kontrol edilmelidir.",
        )

    if category == "Yatırım / Forex":
        return (
            "Dikkatli İncele",
            "Bu site yatırım/forex hizmeti sunuyor gibi görünmektedir.",
            "Yüksek kazanç vaadi, hızlı üyelik ve para yatırma yönlendirmeleri dikkat gerektirir. Teknik olarak çalışıyor olması güvenilir olduğu anlamına gelmez.",
        )

    if category == "Yetişkin içerik":
        return (
            "Dikkatli İncele",
            "Bu site yetişkin içerikle ilişkili görünüyor.",
            "Bu tür sitelerde zararlı reklam, sahte indirme ve ödeme yönlendirmeleri görülebilir. Kişisel bilgi ve ödeme bilgisi paylaşmadan önce dikkatli olunmalıdır.",
        )

    if category == "Banka / Finans":
        if _domain_in_set(domain, OFFICIAL_BANK_DOMAINS):
            return (
                "Düşük",
                "Domain bilinen finans kurumlarıyla uyumlu görünüyor.",
                "Banka işlemleri yine de yalnızca kurumun resmi alan adı ve güvenli oturum kanalları üzerinden yapılmalıdır.",
            )
        return (
            "Yüksek Risk",
            "Bu site finansal işlem veya banka hizmetiyle ilişkili görünüyor ancak resmi domainle eşleşmedi.",
            "Şifre, kart, kimlik veya hesap bilgisi girmeden önce kurumun resmi alan adı ayrıca doğrulanmalıdır.",
        )

    if category == "Kargo / Teslimat":
        official = _domain_in_set(domain, OFFICIAL_CARGO_DOMAINS)
        asks_sensitive = any(word in text for word in ["odeme", "ödeme", "payment", "kimlik", "tc", "login", "verify", "dogrula", "doğrula"])
        if not official and asks_sensitive:
            return (
                "Yüksek Risk",
                "Bu site kargo/teslimat temasıyla birlikte ödeme veya kimlik doğrulama sinyali taşıyor.",
                "SMS veya e-posta ile geldiyse bağlantıya tıklamadan önce resmi kargo firmasının kendi sitesinden takip numarası sorgulanmalıdır.",
            )
        return (
            "Dikkatli İncele" if not official else "Düşük",
            "Bu site kargo/teslimat işlemiyle ilişkili görünüyor.",
            "Kargo takip işlemleri mümkünse resmi firma alan adı üzerinden yapılmalı; ödeme veya kimlik bilgisi istenirse dikkatli olunmalıdır.",
        )

    if category == "E-Ticaret":
        return (
            "Düşük" if _domain_in_set(domain, OFFICIAL_ECOMMERCE_DOMAINS) and technical_score <= 49 else "Dikkatli İncele",
            "Bu site alışveriş/e-ticaret hizmeti sunuyor gibi görünmektedir.",
            "Ödeme yapmadan önce satıcı bilgileri, iade şartları, iletişim bilgileri ve kullanıcı yorumları kontrol edilmelidir.",
        )

    if category == "Resmi kurum / Devlet":
        return (
            "Düşük" if domain.endswith(".gov.tr") else "Dikkatli İncele",
            "Bu site resmi kurum/devlet hizmetiyle ilişkili görünüyor.",
            "Resmi işlemler için alan adının gerçek kamu kurumuna ait olduğundan emin olunmalıdır.",
        )

    if technical_score >= 50:
        return (
            "Dikkatli İncele",
            "Site türü netleşmedi ancak teknik risk sinyalleri dikkat gerektiriyor.",
            "Teknik sinyaller olumsuzsa ödeme, kimlik veya şifre bilgisi paylaşmadan önce kaynağı doğrulamanız önerilir.",
        )

    return (
        "Düşük teknik risk, yine de doğrula",
        "Site türü için belirgin bir yüksek dikkat sinyali tespit edilmedi.",
        "SSL/TLS veya HTTP erişimi tek başına sitenin güvenilir, yasal ya da resmi olduğu anlamına gelmez.",
    )


def _domain_in_set(domain: str, known_domains: set[str]) -> bool:
    return any(domain == known_domain or domain.endswith(f".{known_domain}") for known_domain in known_domains)


def _is_affiliate_registration_pattern(domain: str, path: str, query: str) -> bool:
    suffix = domain.rsplit(".", 1)[-1]
    path_query = f"{path}?{query}".lower()
    return suffix in {"pro", "bet", "casino"} and "registration" in path_query and "tag" in path_query


def _calculate_risk_breakdown(
    url_analysis: UrlAnalysis,
    security_headers: SecurityHeadersInfo,
    dns_info: DnsInfo,
    domain_info: DomainInfo,
    ssl_info: SslInfo,
    mail_security: MailSecurityInfo,
    threat_intel: ThreatIntelInfo,
    findings: list[TechnicalFinding],
) -> list[RiskScoreItem]:
    items: list[RiskScoreItem] = []

    def add(label: str, points: int, detail: str) -> None:
        if points > 0:
            items.append(RiskScoreItem(label=label, points=points, detail=detail))

    if not url_analysis.https:
        add("HTTPS kullanılmıyor", 18, "URL HTTPS protokolü ile başlamıyor.")
    if ssl_info.status == "Tespit Edilemedi":
        findings.append(
            TechnicalFinding(
                severity="safe",
                title="SSL/TLS doğrulanamadı",
                detail="SSL/TLS bağlantı testi tamamlanamadı. Doğrulanamayan veri tek başına risk puanı üretmez.",
            )
        )
    elif not ssl_info.valid:
        add("SSL/TLS durumu", 18, "SSL sertifikası okunamadı, süresi dolmuş veya geçerli görünmüyor.")
    elif ssl_info.days_remaining is not None and ssl_info.days_remaining < 14:
        add("SSL süresi yaklaşıyor", 6, f"Sertifikanın bitmesine {ssl_info.days_remaining} gün kalmış.")

    if not dns_info.a and not dns_info.aaaa:
        add("DNS çözümleme yok", 20, "Alan adı için A veya AAAA kaydı okunamadı; site erişilebilirliği doğrulanamadı.")

    if domain_info.domain_age_days is not None and domain_info.domain_age_days < 30:
        add("Yeni domain", 22, f"Domain yaşı {domain_info.domain_age_days} gün.")
        findings.append(TechnicalFinding(severity="caution", title="Yeni domain", detail=f"Domain yaşı {domain_info.domain_age_days} gün."))
    elif domain_info.created_at is None:
        findings.append(
            TechnicalFinding(
                severity="safe",
                title="Alan adı yaşı doğrulanamadı",
                detail="RDAP/WHOIS kaynağı kayıt tarihi döndürmedi. Veri alınamaması tek başına risk puanı üretmez.",
            )
        )

    security_header_points = min(12, len(security_headers.missing) * 2)
    add("Security header eksikleri", security_header_points, f"Eksik headerlar: {', '.join(security_headers.missing)}." if security_headers.missing else "")

    if mail_security.has_mx and not mail_security.has_spf:
        add("SPF eksik", 6, "MX kaydı bulunan alan adında SPF kaydı bulunamadı.")
    if mail_security.has_mx and not mail_security.has_dmarc:
        add("DMARC eksik", 8, "MX kaydı bulunan alan adında DMARC kaydı bulunamadı.")
    if not mail_security.has_dkim_signal and mail_security.has_mx:
        findings.append(
            TechnicalFinding(
                severity="safe",
                title="DKIM doğrulanamadı",
                detail="Selector bilinmediği için DKIM durumu kesin doğrulanamadı. Bilinmeyen durum risk puanı üretmez.",
            )
        )

    if url_analysis.suspicious_keywords:
        add("Şüpheli kelime", 10, f"URL içinde {', '.join(url_analysis.suspicious_keywords[:5])} kelimeleri görüldü.")
    if url_analysis.redirect_chain:
        add("Redirect zinciri", min(12, len(url_analysis.redirect_chain) * 4), f"{len(url_analysis.redirect_chain)} adet yönlendirme görüldü.")
    if url_analysis.is_short_link:
        add("Kısa link", 14, "Kısa link servisi hedef adresi gizleyebilir.")
    if url_analysis.typo_signals:
        add("Typo/homograf sinyali", 16, "Alan adı bilinen marka veya kurum adını andıran bir yapı taşıyor olabilir.")
    if threat_intel.malicious_count:
        add("Tehdit istihbaratı zararlı eşleşme", min(35, threat_intel.malicious_count * 15), f"{threat_intel.malicious_count} zararlı eşleşme görüldü.")
    if threat_intel.suspicious_count:
        add("Tehdit istihbaratı şüpheli eşleşme", min(20, threat_intel.suspicious_count * 5), f"{threat_intel.suspicious_count} şüpheli kayıt görüldü.")

    return items


def _risk_level_from_score(score: int) -> str:
    if score >= 50:
        return "risk"
    if score >= 21:
        return "caution"
    return "safe"


def _risk_label_from_score(score: int) -> str:
    if score <= 20:
        return "Düşük teknik risk"
    if score <= 49:
        return "Teknik olarak dikkatli incele"
    return "Teknik olarak yüksek risk"


def _build_citizen_summary(
    domain: str,
    domain_info: DomainInfo,
    ssl_info: SslInfo,
    mail_security: MailSecurityInfo,
    url_analysis: UrlAnalysis,
    threat_intel: ThreatIntelInfo,
    category_info: SiteCategoryInfo,
) -> str:
    parts = [f"{domain} için teknik OSINT sinyalleri ve site türü birlikte incelendi."]
    if category_info.site_category != "Bilinmeyen / Genel site":
        parts.append(f"Site türü {category_info.site_category} olarak değerlendirildi.")
        parts.append(category_info.category_warning)
    if domain_info.domain_age_days is not None:
        parts.append(_domain_age_sentence(domain_info.domain_age_days))
    else:
        parts.append("Alan adı kayıt tarihi doğrulanamadı.")
    if ssl_info.valid:
        parts.append("SSL/TLS sertifikası geçerli görünüyor.")
    else:
        parts.append("SSL/TLS sertifikası tespit edilemedi veya geçerli görünmüyor.")
    if not mail_security.has_dmarc:
        parts.append("DMARC koruması bulunmadığı için e-posta taklidi ve oltalama girişimlerine karşı dikkatli olunması önerilir.")
    if url_analysis.is_short_link:
        parts.append("Kısa link kullanımı hedef adresi gizleyebilir.")
    if url_analysis.typo_signals:
        parts.append("Alan adı bilinen marka veya kurum adlarını andıran bir yapı taşıyor olabilir.")
    if threat_intel.malicious_count or threat_intel.suspicious_count:
        parts.append("Tehdit istihbaratı kaynaklarında ek kayıtlar görüldü; işlem yapmadan önce kaynağı ayrıca doğrulayın.")
    return " ".join(parts)


def _build_safe_summary(domain_info: DomainInfo, ssl_info: SslInfo, security_headers: SecurityHeadersInfo, dns_info: DnsInfo) -> str:
    signals = []
    if ssl_info.valid:
        signals.append("SSL/TLS sertifikası geçerli.")
    if domain_info.domain_age_days is not None and domain_info.domain_age_days > 365:
        signals.append("Alan adı uzun süredir kayıtlı görünüyor.")
    if dns_info.waf_provider:
        signals.append(f"{dns_info.waf_provider} gibi bir CDN/WAF katmanı kullanılıyor olabilir.")
    header_values = [
        security_headers.content_security_policy,
        security_headers.x_frame_options,
        security_headers.x_content_type_options,
        security_headers.referrer_policy,
        security_headers.permissions_policy,
        security_headers.hsts,
    ]
    has_header_result = any(header_values) or bool(security_headers.missing)
    present_headers = sum(1 for value in header_values if value)
    if has_header_result and present_headers:
        signals.append(f"{present_headers} güvenlik headerı görüldü.")
    return " ".join(signals) if signals else "Güvenli görünen sinyaller sınırlı; bu durum tek başına risk anlamına gelmez."


def _domain_age_sentence(age_days: int | None) -> str:
    if age_days is None:
        return "Alan adı kayıt tarihi doğrulanamadı."
    if age_days <= 30:
        return "Alan adı çok yeni oluşturulmuş görünüyor."
    if age_days <= 90:
        return "Alan adı yeni sayılabilecek bir süredir aktif görünüyor."
    if age_days <= 365:
        return "Alan adı bir süredir aktif görünüyor."
    return "Alan adı uzun süredir aktif görünüyor."


def _build_risk_summary(risk_breakdown: list[RiskScoreItem], findings: list[TechnicalFinding]) -> str:
    if not risk_breakdown:
        return "Risk puanını artıran belirgin bir teknik sinyal görülmedi."
    top_items = sorted(risk_breakdown, key=lambda item: item.points, reverse=True)[:4]
    if top_items:
        return " ".join(f"{item.label}: +{item.points} puan." for item in top_items)
    return "Teknik bulgularda dikkat gerektiren sınırlı sinyaller var."


def _build_public_advice(
    risk_score: int,
    mail_security: MailSecurityInfo,
    url_analysis: UrlAnalysis,
    threat_intel: ThreatIntelInfo,
) -> list[str]:
    advice = ["Adres çubuğundaki domaini işlem yapmadan önce tekrar kontrol edin."]
    if risk_score > 60:
        advice.append("Bu adreste ödeme, kimlik veya şifre bilgisi paylaşmadan önce resmi kaynağı ayrıca doğrulayın.")
    if not mail_security.has_dmarc:
        advice.append("Bu alan adından gelmiş gibi görünen e-postalarda bağlantılara tıklamadan önce dikkatli olun.")
    if url_analysis.redirect_chain or url_analysis.is_short_link:
        advice.append("Kısa link veya yönlendirme varsa nihai adresin beklediğiniz alan adı olduğundan emin olun.")
    if threat_intel.malicious_count or threat_intel.suspicious_count:
        advice.append("Tehdit istihbaratı sinyali görüldüğü için bağlantıyı kapatıp resmi kanaldan tekrar erişmeyi tercih edin.")
    return advice


def _find_rdap_event(events: list[dict[str, Any]], action: str) -> str | None:
    normalized_action = action.lower()
    for event in events:
        if str(event.get("eventAction", "")).lower() == normalized_action:
            return event.get("eventDate")
    return None


def _find_registrar(data: dict[str, Any]) -> tuple[str | None, str | None]:
    for entity in data.get("entities", []):
        roles = entity.get("roles", [])
        if "registrar" in roles:
            return _find_vcard_value(entity, "fn"), _find_public_id(entity)
    return None, None


def _find_public_id(entity: dict[str, Any]) -> str | None:
    for public_id in entity.get("publicIds", []):
        if str(public_id.get("type", "")).lower() in {"iana registrar id", "registrar id"}:
            return str(public_id.get("identifier"))
    return None


def _find_org(data: dict[str, Any] | None) -> str | None:
    if not data:
        return None
    for entity in data.get("entities", []):
        roles = entity.get("roles", [])
        if roles and not any(role in roles for role in ["registrant", "administrative", "technical", "abuse"]):
            continue
        name = _find_vcard_value(entity, "fn") or _find_vcard_value(entity, "org")
        if name:
            return name
    return data.get("name")


def _find_abuse_contact(data: dict[str, Any] | None) -> str | None:
    if not data:
        return None
    for entity in data.get("entities", []):
        if "abuse" not in entity.get("roles", []):
            continue
        email = _find_vcard_value(entity, "email")
        if email:
            return email
    return None


def _find_vcard_value(entity: dict[str, Any], key: str) -> str | None:
    for item in entity.get("vcardArray", [None, []])[1]:
        if item[0] == key:
            return str(item[3])
    return None


def _age_days(value: str | None) -> int | None:
    if not value:
        return None
    try:
        created = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - created).days
    except ValueError:
        return None


def _parse_cert_time(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parsed = datetime.strptime(value, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        return parsed.isoformat()
    except ValueError:
        return None


def _cert_name(entries: Any) -> str | None:
    parts = []
    for item in entries:
        for key, value in item:
            if key in {"organizationName", "commonName"}:
                parts.append(str(value))
    return ", ".join(dict.fromkeys(parts)) or None


def _extract_san(cert: dict[str, Any]) -> list[str]:
    return [str(value) for kind, value in cert.get("subjectAltName", []) if kind.lower() == "dns"]


def _cidr_from_rdap(data: dict[str, Any] | None) -> str | None:
    if not data:
        return None
    start = data.get("startAddress")
    end = data.get("endAddress")
    if start and end:
        return f"{start} - {end}"
    return None


def _detect_typo_signals(domain: str) -> list[str]:
    signals: list[str] = []
    label = domain.split(".")[0]
    if _is_trusted_government_domain(domain):
        return signals

    if any(ord(char) > 127 for char in domain):
        signals.append("Alan adında ASCII dışı karakter kullanımı var; homograf riski için ek kontrol gerekir.")

    for official in OFFICIAL_DOMAINS:
        official_label = official.split(".")[0]
        if domain == official or domain.endswith(f".{official}"):
            continue
        if official_label in label or _levenshtein(label, official_label) <= 2:
            signals.append(f"{official_label} adını andıran alan adı yapısı görüldü.")
            break
    return signals


def _is_cloudflare_response(headers: requests.structures.CaseInsensitiveDict[str]) -> bool:
    server = headers.get("server", "")
    return (
        "cloudflare" in server.lower()
        or bool(headers.get("cf-ray"))
        or bool(headers.get("cf-cache-status"))
        or bool(headers.get("cf-mitigated"))
    )


def _detect_provider_from_headers(headers: requests.structures.CaseInsensitiveDict[str]) -> str | None:
    haystack = " ".join(f"{key}:{value}" for key, value in headers.items())
    return _detect_provider(haystack)


def _detect_provider(value: str) -> str | None:
    lowered = value.lower()
    for provider, keywords in PROVIDER_KEYWORDS:
        if any(keyword in lowered for keyword in keywords):
            return provider
    return None


def _is_trusted_government_domain(domain: str) -> bool:
    return domain == "gov.tr" or domain.endswith(".gov.tr")


def _safe_detail(exc: Exception) -> str:
    return str(exc).replace("\n", " ")[:180] or "Kaynak yanıt vermedi."


def _levenshtein(a: str, b: str) -> int:
    matrix = [[0] * (len(a) + 1) for _ in range(len(b) + 1)]
    for row in range(len(b) + 1):
        matrix[row][0] = row
    for column in range(len(a) + 1):
        matrix[0][column] = column
    for row in range(1, len(b) + 1):
        for column in range(1, len(a) + 1):
            matrix[row][column] = (
                matrix[row - 1][column - 1]
                if b[row - 1] == a[column - 1]
                else min(matrix[row - 1][column - 1], matrix[row][column - 1], matrix[row - 1][column]) + 1
            )
    return matrix[-1][-1]
