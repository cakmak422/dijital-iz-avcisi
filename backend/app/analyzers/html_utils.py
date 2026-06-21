import json
import re
from html import unescape
from typing import Any, Iterable
from urllib.request import Request, urlopen

from app.services.ssrf_guard import validate_outbound_url


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

NEGATIVE_KEYWORDS = [
    "bozuk",
    "kotu",
    "kötü",
    "iade",
    "gec",
    "geç",
    "hasar",
    "eksik",
    "sahte",
    "yanlis",
    "yanlış",
    "kalitesiz",
    "şikayet",
    "sikayet",
    "teslim",
]


def fetch_soup(url: str, timeout: int = 12) -> Any:
    from bs4 import BeautifulSoup

    validate_outbound_url(url)
    html = _fetch_html(url, timeout)
    return BeautifulSoup(html, "html.parser")


def fetch_rendered_soup(url: str, wait_selector: str | None = None, timeout_ms: int = 15000) -> Any:
    from bs4 import BeautifulSoup

    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Playwright kurulu degil. Calistirin: python -m playwright install chromium") from exc

    validate_outbound_url(url)
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(
                locale="tr-TR",
                user_agent=DEFAULT_HEADERS["User-Agent"],
                viewport={"width": 1366, "height": 900},
            )
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            if wait_selector:
                try:
                    page.wait_for_selector(wait_selector, timeout=5000)
                except Exception:
                    pass
            page.wait_for_timeout(1200)
            html = page.content()
            browser.close()
    except Exception as exc:
        if "Executable doesn't exist" in str(exc) or "chromium" in str(exc).lower():
            raise RuntimeError(
                "Playwright Chromium binary bulunamadi. Calistirin: python -m playwright install chromium"
            ) from exc
        raise

    return BeautifulSoup(html, "html.parser")


def clean_text(value: str | None) -> str | None:
    if not value:
        return None

    text = unescape(value)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def text_from_selectors(soup: Any, selectors: list[str]) -> str | None:
    for selector in selectors:
        node = soup.select_one(selector)
        text = clean_text(node.get_text(" ", strip=True) if node else None)
        if text:
            return text

    return None


def meta_content(soup: Any, names: list[str]) -> str | None:
    for name in names:
        node = soup.select_one(f'meta[property="{name}"], meta[name="{name}"]')
        text = clean_text(node.get("content") if node else None)
        if text:
            return text

    return None


def first_number(text: str | None) -> float | None:
    if not text:
        return None

    match = re.search(r"(\d+(?:[,.]\d+)?)", text)
    if not match:
        return None

    return float(match.group(1).replace(",", "."))


def first_int(text: str | None) -> int | None:
    number = first_number(text)
    return int(number) if number is not None else None


def json_ld_objects(soup: Any) -> list[dict[str, Any]]:
    objects: list[dict[str, Any]] = []

    for script in soup.select('script[type="application/ld+json"]'):
        payload = script.string or script.get_text()
        if not payload:
            continue

        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            continue

        objects.extend(_flatten_json_ld(parsed))

    return objects


def product_json_ld(soup: Any) -> dict[str, Any] | None:
    for item in json_ld_objects(soup):
        item_type = item.get("@type")
        types = item_type if isinstance(item_type, list) else [item_type]
        if "Product" in types:
            return item

    return None


def embedded_json_candidates(soup: Any) -> list[Any]:
    candidates: list[Any] = []

    for script in soup.select("script"):
        payload = script.string or script.get_text()
        if not payload or len(payload) < 20:
            continue

        stripped = payload.strip()
        if stripped.startswith("{") or stripped.startswith("["):
            _append_json(candidates, stripped)
            continue

        for pattern in [
            r"window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({.*?});",
            r"window\.__INITIAL_STATE__\s*=\s*({.*?});",
            r"window\.__PRELOADED_STATE__\s*=\s*({.*?});",
            r"self\.__next_f\.push\(\[(?:\d+),\s*\"(.*?)\"\]\)",
        ]:
            for match in re.finditer(pattern, stripped, re.DOTALL):
                value = match.group(1)
                if "\\\"" in value:
                    value = value.encode("utf-8").decode("unicode_escape")
                _append_json(candidates, value)

    return candidates


def find_first_by_keys(payloads: Iterable[Any], keys: list[str]) -> Any | None:
    for payload in payloads:
        found = _find_first_by_keys(payload, keys)
        if found is not None:
            return found

    return None


def negative_density(snippets: list[str]) -> int:
    if not snippets:
        return 0

    negative_count = 0
    for snippet in snippets:
        lowered = snippet.lower()
        if any(keyword in lowered for keyword in NEGATIVE_KEYWORDS):
            negative_count += 1

    return round((negative_count / len(snippets)) * 100)


def collect_review_snippets(soup: Any, selectors: list[str], limit: int = 24) -> list[str]:
    snippets: list[str] = []

    for selector in selectors:
        for node in soup.select(selector):
            text = clean_text(node.get_text(" ", strip=True))
            if text and len(text) > 12 and text not in snippets:
                snippets.append(text[:280])
            if len(snippets) >= limit:
                return snippets

    return snippets


def _fetch_html(url: str, timeout: int) -> str:
    validate_outbound_url(url)
    try:
        import requests

        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout, allow_redirects=True)
        response.raise_for_status()
        encoding = response.apparent_encoding or response.encoding or "utf-8"
        return response.content.decode(encoding, errors="replace")
    except ModuleNotFoundError:
        request = Request(url, headers=DEFAULT_HEADERS)
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(charset, errors="replace")


def _append_json(candidates: list[Any], value: str) -> None:
    try:
        candidates.append(json.loads(value))
    except json.JSONDecodeError:
        pass


def _find_first_by_keys(value: Any, keys: list[str]) -> Any | None:
    if isinstance(value, dict):
        for key in keys:
            item = value.get(key)
            if item not in (None, "", []):
                return item

        for item in value.values():
            found = _find_first_by_keys(item, keys)
            if found is not None:
                return found

    if isinstance(value, list):
        for item in value:
            found = _find_first_by_keys(item, keys)
            if found is not None:
                return found

    return None


def _flatten_json_ld(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, dict):
        items = [value]
        graph = value.get("@graph")
        if isinstance(graph, list):
            items.extend(item for item in graph if isinstance(item, dict))
        return items

    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    return []
