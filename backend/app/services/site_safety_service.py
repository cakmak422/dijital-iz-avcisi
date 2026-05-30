from __future__ import annotations

import re
import socket
import ssl
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import requests

from app.models.site_safety import (
    DnsInfo,
    DomainInfo,
    IpInfo,
    MailSecurityInfo,
    RedirectHop,
    SiteSafetyResponse,
    SslInfo,
    TechnicalFinding,
    UrlAnalysis,
)
from app.services.ssrf_guard import SsrfProtectionError, validate_outbound_url

try:
    import dns.resolver
except ImportError:  # pragma: no cover - optional dependency fallback
    dns = None  # type: ignore[assignment]


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
}

SUSPICIOUS_WORDS = [
    "login",
    "verify",
    "secure",
    "account",
    "odeme",
    "kargo",
    "hediye",
    "kampanya",
    "dogrula",
    "support",
    "wallet",
    "bonus",
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


def analyze_site_safety(input_url: str) -> SiteSafetyResponse:
    normalized_url = _normalize_url(input_url)
    parsed = urlparse(normalized_url)
    domain = (parsed.hostname or "").lower().removeprefix("www.")
    findings: list[TechnicalFinding] = []

    url_analysis = _analyze_url(normalized_url, domain, findings)
    dns_info = _collect_dns(domain)
    domain_info = _collect_domain_info(domain)
    ssl_info = _collect_ssl_info(domain)
    mail_security = _analyze_mail_security(domain, dns_info)
    ip_info = _collect_ip_info(domain, dns_info)

    risk_score = _calculate_risk_score(url_analysis, domain_info, ssl_info, mail_security, findings)
    risk_level = _risk_level_from_score(risk_score)
    citizen_summary = _build_citizen_summary(domain, domain_info, ssl_info, mail_security, url_analysis)

    return SiteSafetyResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        citizen_summary=citizen_summary,
        technical_findings=findings,
        url_analysis=url_analysis,
        domain_info=domain_info,
        dns_info=dns_info,
        mail_security=mail_security,
        ssl_info=ssl_info,
        ip_info=ip_info,
    )


def _normalize_url(value: str) -> str:
    cleaned = value.strip()
    if not re.match(r"^https?://", cleaned, re.IGNORECASE):
        cleaned = f"https://{cleaned}"
    parsed = urlparse(cleaned)
    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise ValueError("Gecerli bir domain veya URL girin.")
    return cleaned


def _analyze_url(url: str, domain: str, findings: list[TechnicalFinding]) -> UrlAnalysis:
    parsed = urlparse(url)
    suspicious = [word for word in SUSPICIOUS_WORDS if word in url.lower()]
    typo_signals = _detect_typo_signals(domain)
    redirect_chain: list[RedirectHop] = []
    final_url: str | None = None
    status_code: int | None = None

    try:
        validate_outbound_url(url)
        response = requests.get(url, timeout=5, allow_redirects=True, headers={"User-Agent": "Dijital-Iz-Avcisi/1.0"})
        status_code = response.status_code
        final_url = response.url
        redirect_chain = [RedirectHop(url=item.url, status_code=item.status_code) for item in response.history]
    except SsrfProtectionError as exc:
        findings.append(TechnicalFinding(severity="risk", title="SSRF korumasi", detail=str(exc)))
    except requests.RequestException as exc:
        findings.append(TechnicalFinding(severity="caution", title="HTTP kontrolu tamamlanamadi", detail=str(exc)[:180]))

    if parsed.scheme != "https":
        findings.append(TechnicalFinding(severity="risk", title="HTTPS kullanilmiyor", detail="Site adresi HTTPS ile baslamiyor."))
    if redirect_chain:
        findings.append(TechnicalFinding(severity="caution", title="Redirect zinciri", detail=f"{len(redirect_chain)} adet yonlendirme goruldu."))
    if domain in SHORT_LINK_DOMAINS:
        findings.append(TechnicalFinding(severity="caution", title="Kisa link servisi", detail="Kisa linkler hedef adresi gizleyebilir."))
    if suspicious:
        findings.append(TechnicalFinding(severity="caution", title="Supheli kelime sinyali", detail=", ".join(suspicious[:5])))
    for signal in typo_signals:
        findings.append(TechnicalFinding(severity="caution", title="Typo/homograf sinyali", detail=signal))

    return UrlAnalysis(
        normalized_url=url,
        domain=domain,
        final_url=final_url,
        redirect_chain=redirect_chain,
        https=parsed.scheme == "https",
        http_status=status_code,
        is_short_link=domain in SHORT_LINK_DOMAINS,
        suspicious_keywords=suspicious,
        typo_signals=typo_signals,
    )


def _collect_dns(domain: str) -> DnsInfo:
    info = DnsInfo()

    try:
        resolved = socket.getaddrinfo(domain, None, proto=socket.IPPROTO_TCP)
        for item in resolved:
            address = item[4][0]
            if ":" in address and address not in info.aaaa:
                info.aaaa.append(address)
            elif ":" not in address and address not in info.a:
                info.a.append(address)
    except socket.gaierror:
        info.notes.append("A/AAAA kayitlari socket ile okunamadi.")

    if dns is None:
        info.notes.append("Detayli DNS kayitlari icin dnspython kurulumu gerekir.")
        return info

    resolver = dns.resolver.Resolver()
    resolver.lifetime = 4
    resolver.timeout = 3
    for record_type, target in [("MX", info.mx), ("NS", info.ns), ("TXT", info.txt)]:
        try:
            answers = resolver.resolve(domain, record_type)
            for answer in answers:
                target.append(str(answer).strip('"'))
        except Exception:
            info.notes.append(f"{record_type} kaydi okunamadi veya bulunamadi.")

    info.nameservers = info.ns
    return info


def _collect_domain_info(domain: str) -> DomainInfo:
    try:
        response = requests.get(f"https://rdap.org/domain/{domain}", timeout=5, headers={"Accept": "application/rdap+json"})
        if not response.ok:
            return DomainInfo(notes=["RDAP bilgisi alinamadi."])
        data = response.json()
    except requests.RequestException:
        return DomainInfo(notes=["RDAP servisine ulasilamadi."])

    events = data.get("events", [])
    created_at = _find_rdap_event(events, "registration")
    expires_at = _find_rdap_event(events, "expiration")
    registrar = _find_registrar(data)
    abuse_contact = _find_abuse_contact(data)
    age_days = _age_days(created_at)

    return DomainInfo(
        created_at=created_at,
        expires_at=expires_at,
        domain_age_days=age_days,
        registrar=registrar,
        abuse_contact=abuse_contact,
        notes=[] if created_at or registrar else ["RDAP yanitinda sinirli domain bilgisi var."],
    )


def _collect_ssl_info(domain: str) -> SslInfo:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as tls:
                cert = tls.getpeercert()
    except Exception as exc:
        return SslInfo(valid=False, notes=[f"SSL sertifikasi okunamadi: {str(exc)[:120]}"])

    not_after = cert.get("notAfter")
    expires_at = None
    days_remaining = None
    if not_after:
        expires = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        expires_at = expires.isoformat()
        days_remaining = (expires - datetime.now(timezone.utc)).days

    issuer_parts = []
    for item in cert.get("issuer", []):
        for key, value in item:
            if key in {"organizationName", "commonName"}:
                issuer_parts.append(value)

    return SslInfo(
        valid=bool(days_remaining is None or days_remaining >= 0),
        expires_at=expires_at,
        issuer=", ".join(issuer_parts) or None,
        days_remaining=days_remaining,
    )


def _analyze_mail_security(domain: str, dns_info: DnsInfo) -> MailSecurityInfo:
    txt_records = dns_info.txt
    has_spf = any(record.lower().startswith("v=spf1") for record in txt_records)
    dmarc_records: list[str] = []

    if dns is not None:
        try:
            answers = dns.resolver.resolve(f"_dmarc.{domain}", "TXT")
            dmarc_records = [str(answer).strip('"') for answer in answers]
        except Exception:
            pass

    has_dmarc = any("v=dmarc1" in record.lower() for record in dmarc_records)
    has_dkim_signal = any("dkim" in record.lower() or "_domainkey" in record.lower() for record in txt_records)
    risk = "safe" if has_spf and has_dmarc else "caution" if has_spf or has_dmarc else "risk"
    notes = []
    if not has_spf:
        notes.append("SPF kaydi bulunamadi.")
    if not has_dmarc:
        notes.append("DMARC kaydi bulunamadi.")
    if not has_dkim_signal:
        notes.append("Genel TXT kayitlarinda DKIM sinyali gorulmedi.")

    return MailSecurityInfo(has_spf=has_spf, has_dmarc=has_dmarc, has_dkim_signal=has_dkim_signal, spoofing_risk=risk, notes=notes)


def _collect_ip_info(domain: str, dns_info: DnsInfo) -> IpInfo:
    ip = dns_info.a[0] if dns_info.a else dns_info.aaaa[0] if dns_info.aaaa else None
    if not ip:
        return IpInfo(notes=["IP adresi bulunamadi."])

    try:
        response = requests.get(f"https://rdap.org/ip/{ip}", timeout=5, headers={"Accept": "application/rdap+json"})
        if not response.ok:
            return IpInfo(ip=ip, notes=["IP RDAP bilgisi alinamadi."])
        data = response.json()
    except requests.RequestException:
        return IpInfo(ip=ip, notes=["IP RDAP servisine ulasilamadi."])

    return IpInfo(
        ip=ip,
        country=data.get("country"),
        asn=str(data.get("handle")) if data.get("handle") else None,
        hosting=data.get("name"),
    )


def _calculate_risk_score(
    url_analysis: UrlAnalysis,
    domain_info: DomainInfo,
    ssl_info: SslInfo,
    mail_security: MailSecurityInfo,
    findings: list[TechnicalFinding],
) -> int:
    score = 0
    if not url_analysis.https:
        score += 18
    if not ssl_info.valid:
        score += 18
    if domain_info.domain_age_days is not None and domain_info.domain_age_days < 30:
        score += 22
        findings.append(TechnicalFinding(severity="caution", title="Yeni domain", detail=f"Domain yasi {domain_info.domain_age_days} gun."))
    if domain_info.created_at is None:
        score += 8
    if not mail_security.has_spf:
        score += 10
    if not mail_security.has_dmarc:
        score += 12
    if url_analysis.suspicious_keywords:
        score += 10
    if url_analysis.redirect_chain:
        score += min(12, len(url_analysis.redirect_chain) * 4)
    if url_analysis.is_short_link:
        score += 14
    if url_analysis.typo_signals:
        score += 16
    return max(0, min(100, score))


def _risk_level_from_score(score: int) -> str:
    if score >= 60:
        return "risk"
    if score >= 30:
        return "caution"
    return "safe"


def _build_citizen_summary(
    domain: str,
    domain_info: DomainInfo,
    ssl_info: SslInfo,
    mail_security: MailSecurityInfo,
    url_analysis: UrlAnalysis,
) -> str:
    parts = [f"{domain} icin teknik sinyaller incelendi."]
    if domain_info.domain_age_days is not None:
        parts.append(f"Alan adi yaklasik {domain_info.domain_age_days} gun once olusturulmus gorunuyor.")
    if not ssl_info.valid:
        parts.append("SSL sertifikasi okunamadi veya gecerli gorunmuyor.")
    if not mail_security.has_dmarc:
        parts.append("DMARC korumasi bulunmadigi icin e-posta taklidi riskine karsi dikkatli olunmasi onerilir.")
    if url_analysis.is_short_link:
        parts.append("Kisa link kullanimi hedef adresi gizleyebilir.")
    if url_analysis.typo_signals:
        parts.append("Alan adi bilinen marka/kurum adlarini andiran bir yapi tasiyor olabilir.")
    return " ".join(parts)


def _find_rdap_event(events: list[dict[str, Any]], action: str) -> str | None:
    for event in events:
        if event.get("eventAction") == action:
            return event.get("eventDate")
    return None


def _find_registrar(data: dict[str, Any]) -> str | None:
    entities = data.get("entities", [])
    for entity in entities:
        roles = entity.get("roles", [])
        if "registrar" in roles:
            vcard = entity.get("vcardArray", [None, []])[1]
            for item in vcard:
                if item[0] == "fn":
                    return item[3]
    return None


def _find_abuse_contact(data: dict[str, Any]) -> str | None:
    for entity in data.get("entities", []):
        if "abuse" not in entity.get("roles", []):
            continue
        for item in entity.get("vcardArray", [None, []])[1]:
            if item[0] == "email":
                return item[3]
    return None


def _age_days(value: str | None) -> int | None:
    if not value:
        return None
    try:
        created = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - created).days
    except ValueError:
        return None


def _detect_typo_signals(domain: str) -> list[str]:
    signals: list[str] = []
    label = domain.split(".")[0]
    if any(ord(char) > 127 for char in domain):
        signals.append("Alan adinda ASCII disi karakter kullanimi var; homograf riski icin ek kontrol gerekir.")

    for official in OFFICIAL_DOMAINS:
        official_label = official.split(".")[0]
        if domain == official or domain.endswith(f".{official}"):
            continue
        if official_label in label or _levenshtein(label, official_label) <= 2:
            signals.append(f"{official_label} adini andiran alan adi yapisi goruldu.")
            break
    return signals


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
