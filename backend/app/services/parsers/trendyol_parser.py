import json
import re
from dataclasses import dataclass
from html import unescape
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen


@dataclass
class TrendyolProductData:
    platform: str
    product_name: str | None
    seller: str | None
    rating: float | None
    review_count: int | None
    price: str | None
    product_link: str
    parser_notes: list[str]


class TrendyolParser:
    platform = "Trendyol"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        ),
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    def can_parse(self, url: str) -> bool:
        return "trendyol.com" in urlparse(url).netloc.lower()

    def parse(self, url: str) -> TrendyolProductData:
        try:
            html = self._fetch_html(url)
            from bs4 import BeautifulSoup

            soup = BeautifulSoup(html, "html.parser")
            product_json = self._product_json_ld(soup) or {}
            embedded_json = self._embedded_json_candidates(soup)

            product_name = (
                self._clean(product_json.get("name"))
                or self._text(soup, ["h1.pr-new-br", "h1", ".product-title", "[data-testid='product-title']"])
                or self._meta(soup, ["og:title", "twitter:title"])
                or self._clean(str(self._find_first(embedded_json, ["productName", "name", "title"]) or ""))
            )
            seller = (
                self._text(soup, [".seller-name-text", ".merchant-text", ".seller-container a", "[data-testid='seller-name']"])
                or self._clean(str(self._find_first(embedded_json, ["merchantName", "sellerName", "supplierName"]) or ""))
                or self._seller_from_json_ld(product_json)
            )
            rating = self._rating(product_json, embedded_json, soup)
            review_count = self._review_count(product_json, embedded_json, soup)
            price = self._price(product_json, embedded_json, soup)

            return TrendyolProductData(
                platform=self.platform,
                product_name=product_name,
                seller=seller,
                rating=rating,
                review_count=review_count,
                price=price,
                product_link=url,
                parser_notes=["Trendyol requests + BeautifulSoup parser calisti."],
            )
        except Exception as exc:
            return self.fallback(url, f"Trendyol parser guvenli fallback kullandi: {type(exc).__name__}")

    def fallback(self, url: str, note: str = "Trendyol verisi alinamadi.") -> TrendyolProductData:
        return TrendyolProductData(
            platform=self.platform,
            product_name=self._name_from_url(url),
            seller="Dogrulanmamis satici",
            rating=None,
            review_count=None,
            price=None,
            product_link=url,
            parser_notes=[note],
        )

    def _fetch_html(self, url: str) -> str:
        try:
            import requests

            response = requests.get(url, headers=self.headers, timeout=12)
            response.raise_for_status()
            return response.text
        except ModuleNotFoundError:
            request = Request(url, headers=self.headers)
            with urlopen(request, timeout=12) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")

    def _product_json_ld(self, soup: Any) -> dict[str, Any] | None:
        for script in soup.select('script[type="application/ld+json"]'):
            payload = script.string or script.get_text()
            if not payload:
                continue
            try:
                parsed = json.loads(payload)
            except json.JSONDecodeError:
                continue

            candidates = parsed if isinstance(parsed, list) else [parsed]
            for item in candidates:
                if not isinstance(item, dict):
                    continue
                item_type = item.get("@type")
                item_types = item_type if isinstance(item_type, list) else [item_type]
                if "Product" in item_types:
                    return item

        return None

    def _embedded_json_candidates(self, soup: Any) -> list[Any]:
        candidates: list[Any] = []
        patterns = [
            r"window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({.*?});",
            r"window\.__INITIAL_STATE__\s*=\s*({.*?});",
            r"window\.__PRELOADED_STATE__\s*=\s*({.*?});",
        ]

        for script in soup.select("script"):
            payload = script.string or script.get_text()
            if not payload:
                continue
            for pattern in patterns:
                for match in re.finditer(pattern, payload, re.DOTALL):
                    try:
                        candidates.append(json.loads(match.group(1)))
                    except json.JSONDecodeError:
                        pass

        return candidates

    def _rating(self, product_json: dict[str, Any], embedded_json: list[Any], soup: Any) -> float | None:
        aggregate = product_json.get("aggregateRating") or {}
        return (
            self._first_float(str(aggregate.get("ratingValue") or ""))
            or self._first_float(str(self._find_first(embedded_json, ["ratingScore", "ratingValue", "averageRating"]) or ""))
            or self._first_float(self._text(soup, [".rating-score", ".pr-rnr-sm-p-s", "[data-testid='rating-score']"]))
        )

    def _review_count(self, product_json: dict[str, Any], embedded_json: list[Any], soup: Any) -> int | None:
        aggregate = product_json.get("aggregateRating") or {}
        return (
            self._first_int(str(aggregate.get("reviewCount") or ""))
            or self._first_int(str(self._find_first(embedded_json, ["reviewCount", "commentCount", "totalReviewCount"]) or ""))
            or self._first_int(self._text(soup, [".total-review-count", ".rvw-cnt-tx", ".reviewCount", ".comment-count"]))
        )

    def _price(self, product_json: dict[str, Any], embedded_json: list[Any], soup: Any) -> str | None:
        offers = product_json.get("offers") or {}
        if isinstance(offers, dict):
            price = self._clean(str(offers.get("price") or ""))
            currency = self._clean(str(offers.get("priceCurrency") or ""))
            if price:
                return f"{price} {currency}".strip()

        embedded_price = self._find_first(embedded_json, ["discountedPrice", "sellingPrice", "price"])
        if embedded_price:
            return self._clean(str(embedded_price))

        return self._text(soup, [".prc-dsc", ".prc-slg", ".product-price", "[data-testid='price-current-price']"])

    def _seller_from_json_ld(self, product_json: dict[str, Any]) -> str | None:
        offers = product_json.get("offers") or {}
        if not isinstance(offers, dict):
            return None
        seller = offers.get("seller")
        if isinstance(seller, dict):
            return self._clean(seller.get("name"))
        return None

    def _text(self, soup: Any, selectors: list[str]) -> str | None:
        for selector in selectors:
            node = soup.select_one(selector)
            text = self._clean(node.get_text(" ", strip=True) if node else None)
            if text:
                return text
        return None

    def _meta(self, soup: Any, names: list[str]) -> str | None:
        for name in names:
            node = soup.select_one(f'meta[property="{name}"], meta[name="{name}"]')
            text = self._clean(node.get("content") if node else None)
            if text:
                return text
        return None

    def _find_first(self, value: Any, keys: list[str]) -> Any | None:
        if isinstance(value, list):
            for item in value:
                found = self._find_first(item, keys)
                if found not in (None, "", []):
                    return found
        if isinstance(value, dict):
            for key in keys:
                item = value.get(key)
                if item not in (None, "", []):
                    return item
            for item in value.values():
                found = self._find_first(item, keys)
                if found not in (None, "", []):
                    return found
        return None

    def _first_float(self, value: str | None) -> float | None:
        if not value:
            return None
        match = re.search(r"(\d+(?:[,.]\d+)?)", value)
        if not match:
            return None
        return float(match.group(1).replace(",", "."))

    def _first_int(self, value: str | None) -> int | None:
        if not value:
            return None
        match = re.search(r"(\d[\d.]*)", value)
        if not match:
            return None
        return int(match.group(1).replace(".", ""))

    def _clean(self, value: Any) -> str | None:
        if not value:
            return None
        text = unescape(str(value))
        text = re.sub(r"\s+", " ", text).strip()
        return text or None

    def _name_from_url(self, url: str) -> str:
        path = urlparse(url).path.strip("/")
        first_part = path.split("/")[0] if path else "trendyol-urunu"
        return first_part.replace("-", " ").replace("_", " ").title()[:72]
