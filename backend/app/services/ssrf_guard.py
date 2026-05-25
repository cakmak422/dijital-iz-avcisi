from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_SCHEMES = {"http", "https"}


class SsrfProtectionError(ValueError):
    pass


def validate_outbound_url(url: str) -> None:
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    hostname = (parsed.hostname or "").strip().lower()

    if scheme not in ALLOWED_SCHEMES:
        raise SsrfProtectionError("Unsupported URL protocol.")

    if not hostname:
        raise SsrfProtectionError("URL hostname is required.")

    if hostname in {"localhost", "localhost.localdomain"} or hostname.endswith(".localhost"):
        raise SsrfProtectionError("Localhost targets are blocked.")

    try:
        direct_ip = ipaddress.ip_address(hostname)
        _reject_private_address(direct_ip)
        return
    except ValueError:
        pass

    try:
        resolved = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise SsrfProtectionError("Hostname could not be resolved.") from exc

    if not resolved:
        raise SsrfProtectionError("Hostname did not resolve.")

    for item in resolved:
        address = item[4][0]
        _reject_private_address(ipaddress.ip_address(address))


def _reject_private_address(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    if (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    ):
        raise SsrfProtectionError("Internal network targets are blocked.")


# TODO: Add DNS rebinding protection by pinning resolved IPs to the outbound
# connection layer or by using a controlled fetch service with egress allowlists.
