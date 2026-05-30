from __future__ import annotations

import ipaddress
from typing import Any

import requests

from app.models.ip_intelligence import (
    InfrastructureInfo,
    IpInfo,
    IpIntelligenceResponse,
    PrivacySignals,
    RiskScoreItem,
    TechnicalFinding,
)


PROVIDER_KEYWORDS = [
    ("Cloudflare", ["cloudflare"]),
    ("Google", ["google"]),
    ("Amazon AWS", ["amazon", "aws", "amazon.com"]),
    ("Microsoft Azure", ["microsoft", "azure"]),
    ("DigitalOcean", ["digitalocean", "digital ocean"]),
    ("Hetzner", ["hetzner"]),
    ("OVH", ["ovh"]),
]

PROVIDER_NETWORKS = [
    ("Google", ["8.8.8.0/24", "8.8.4.0/24"]),
    ("Cloudflare", ["1.1.1.0/24", "1.0.0.0/24", "104.16.0.0/12", "172.64.0.0/13"]),
]

CDN_PROVIDERS = {"Cloudflare"}
HOSTING_PROVIDERS = {"Cloudflare", "Google", "Amazon AWS", "Microsoft Azure", "DigitalOcean", "Hetzner", "OVH"}


def analyze_ip_intelligence(input_ip: str) -> IpIntelligenceResponse:
    cleaned = input_ip.strip().lower()
    if cleaned == "localhost":
        return _special_ip_response(input_ip, "127.0.0.1", "localhost yerel makineyi ifade eder ve public tehdit istihbarati sorgusu icin uygun degildir.")

    try:
        ip_obj = ipaddress.ip_address(cleaned)
    except ValueError as exc:
        raise ValueError("Gecerli bir IP adresi girin.") from exc

    normalized_ip = str(ip_obj)
    if not ip_obj.is_global:
        return _special_ip_response(
            input_ip,
            normalized_ip,
            "Bu IP public internete acik bir adres degil; private/local/reserved adresler icin dis OSINT sorgusu yapilmaz.",
        )

    rdap_data, rdap_error = _fetch_rdap(normalized_ip)
    ip_info = _build_ip_info(rdap_data) if rdap_data else IpInfo()
    infrastructure = _detect_infrastructure(normalized_ip, ip_info)
    if infrastructure.provider and not ip_info.organization:
        ip_info.organization = infrastructure.provider
    if infrastructure.provider and not ip_info.network_name:
        ip_info.network_name = f"{infrastructure.provider} known infrastructure"
    privacy_signals = _build_privacy_signals(infrastructure)
    findings: list[TechnicalFinding] = []

    if infrastructure.is_datacenter:
        findings.append(
            TechnicalFinding(
                severity="caution",
                title="Veri merkezi sinyali",
                detail="IP bilinen bir altyapi, CDN veya hosting saglayicisi ile iliskili gorunuyor.",
            )
        )
    if rdap_error:
        findings.append(TechnicalFinding(severity="caution", title="RDAP bilgisi", detail=rdap_error))
    if ip_info.abuse_contact:
        findings.append(TechnicalFinding(severity="safe", title="Abuse contact", detail="RDAP kaydinda abuse iletisim bilgisi goruldu."))

    breakdown = _calculate_risk_breakdown(rdap_data, ip_info, infrastructure)
    risk_score = min(100, sum(item.points for item in breakdown))
    risk_level = _risk_level_from_score(risk_score)

    return IpIntelligenceResponse(
        input=input_ip,
        ip=normalized_ip,
        valid=True,
        is_public=True,
        risk_score=risk_score,
        risk_level=risk_level,
        citizen_summary=_build_summary(normalized_ip, ip_info, infrastructure),
        technical_findings=findings,
        ip_info=ip_info,
        infrastructure=infrastructure,
        privacy_signals=privacy_signals,
        risk_score_breakdown=breakdown,
    )


def _special_ip_response(input_value: str, ip: str, summary: str) -> IpIntelligenceResponse:
    return IpIntelligenceResponse(
        input=input_value,
        ip=ip,
        valid=True,
        is_public=False,
        risk_score=0,
        risk_level="safe",
        citizen_summary=summary,
        technical_findings=[
            TechnicalFinding(
                severity="safe",
                title="Public olmayan IP",
                detail="Bu adres local/private/reserved kapsaminda degerlendirildi ve dis kaynaklara sorgu gonderilmedi.",
            )
        ],
        ip_info=IpInfo(),
        infrastructure=InfrastructureInfo(),
        privacy_signals=PrivacySignals(notes=["VPN/Proxy/Tor kontrolu public olmayan IP adresleri icin uygulanmadi."]),
        risk_score_breakdown=[],
    )


def _fetch_rdap(ip: str) -> tuple[dict[str, Any] | None, str | None]:
    try:
        response = requests.get(f"https://rdap.org/ip/{ip}", timeout=6, headers={"Accept": "application/rdap+json"})
    except requests.RequestException:
        return None, "RDAP servisine ulasilamadi."

    if not response.ok:
        return None, f"RDAP servisi {response.status_code} durum kodu dondurdu."

    try:
        return response.json(), None
    except ValueError:
        return None, "RDAP yaniti JSON olarak okunamadi."


def _build_ip_info(data: dict[str, Any]) -> IpInfo:
    return IpInfo(
        country=data.get("country"),
        asn=str(data.get("handle")) if data.get("handle") else None,
        organization=_find_org(data),
        network_name=data.get("name"),
        abuse_contact=_find_abuse_contact(data),
    )


def _find_org(data: dict[str, Any]) -> str | None:
    for entity in data.get("entities", []):
        roles = entity.get("roles", [])
        if roles and not any(role in roles for role in ["registrant", "administrative", "technical", "abuse"]):
            continue
        name = _find_vcard_value(entity, "fn") or _find_vcard_value(entity, "org")
        if name:
            return name
    return data.get("name")


def _find_abuse_contact(data: dict[str, Any]) -> str | None:
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


def _detect_infrastructure(ip: str, ip_info: IpInfo) -> InfrastructureInfo:
    haystack = " ".join(filter(None, [ip_info.organization, ip_info.network_name, ip_info.asn])).lower()
    provider = _detect_provider_by_network(ip)
    for name, keywords in PROVIDER_KEYWORDS:
        if any(keyword in haystack for keyword in keywords):
            provider = name
            break

    is_cdn = provider in CDN_PROVIDERS
    is_hosting = provider in HOSTING_PROVIDERS
    return InfrastructureInfo(provider=provider, is_cdn=is_cdn, is_hosting=is_hosting, is_datacenter=is_hosting or is_cdn)


def _detect_provider_by_network(ip: str) -> str | None:
    ip_obj = ipaddress.ip_address(ip)
    for provider, networks in PROVIDER_NETWORKS:
        if any(ip_obj in ipaddress.ip_network(network) for network in networks):
            return provider
    return None


def _build_privacy_signals(infrastructure: InfrastructureInfo) -> PrivacySignals:
    notes = [
        "Tor exit node kontrolu ilk MVP'de yapilmadi.",
        "VPN/Proxy icin kesin hukum verilmez; yalnizca altyapi sinyalleri yorumlanir.",
    ]
    possibility = "possible" if infrastructure.is_datacenter else "unknown"
    if infrastructure.is_datacenter:
        notes.append("Bilinen veri merkezi veya hosting altyapisi proxy/VPN kullanimi ihtimalini artirabilir.")
    return PrivacySignals(vpn_proxy_possibility=possibility, tor_exit_node="not_checked", notes=notes)


def _calculate_risk_breakdown(
    rdap_data: dict[str, Any] | None,
    ip_info: IpInfo,
    infrastructure: InfrastructureInfo,
) -> list[RiskScoreItem]:
    items: list[RiskScoreItem] = []

    def add(label: str, points: int, detail: str) -> None:
        if points > 0:
            items.append(RiskScoreItem(label=label, points=points, detail=detail))

    if rdap_data is None:
        add("RDAP bilgisi alinamadi", 15, "IP icin RDAP/WHOIS bilgisi okunamadi.")
    if not ip_info.country:
        add("Ulke bilgisi yok", 5, "RDAP kaydinda ulke bilgisi gorulmedi.")
    if not ip_info.organization:
        add("Organizasyon bilinmiyor", 5, "RDAP kaydinda organizasyon bilgisi net okunamadi.")
    if not ip_info.abuse_contact:
        add("Abuse contact yok", 5, "RDAP kaydinda abuse iletisim bilgisi bulunamadi.")
    if infrastructure.is_hosting:
        add("Hosting/veri merkezi", 10, "IP bilinen hosting veya bulut altyapisi ile iliskili gorunuyor.")
    if infrastructure.is_cdn:
        add("CDN altyapisi", 5, "IP bilinen CDN altyapisi ile iliskili gorunuyor.")
    return items


def _risk_level_from_score(score: int) -> str:
    if score >= 50:
        return "risk"
    if score >= 20:
        return "caution"
    return "safe"


def _build_summary(ip: str, ip_info: IpInfo, infrastructure: InfrastructureInfo) -> str:
    owner = infrastructure.provider or ip_info.organization or ip_info.network_name
    if owner:
        base = f"Bu IP {owner} altyapisina ait gorunuyor."
    else:
        base = f"{ip} icin public RDAP sinyalleri incelendi."

    if infrastructure.is_datacenter:
        return f"{base} Veri merkezi veya hosting altyapisi tek basina zararli kabul edilmez; ancak proxy/VPN kullanimi ihtimalini artirabilir."
    return f"{base} Tek basina zararli kabul edilemez; risk yorumu baglam ve ek abuse verileriyle desteklenmelidir."
