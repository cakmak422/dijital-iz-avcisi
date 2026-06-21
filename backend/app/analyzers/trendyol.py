from urllib.parse import urlparse

from app.analyzers.base import ProductSnapshot
from app.analyzers.html_utils import (
    clean_text,
    collect_review_snippets,
    embedded_json_candidates,
    fetch_rendered_soup,
    fetch_soup,
    find_first_by_keys,
    first_int,
    first_number,
    meta_content,
    product_json_ld,
    text_from_selectors,
)
from app.core.config import get_settings


class TrendyolAnalyzer:
    marketplace = "Trendyol"

    def can_handle(self, url: str) -> bool:
        return "trendyol.com" in urlparse(url).netloc.lower()

    def analyze(self, url: str) -> ProductSnapshot:
        soup = fetch_soup(url)
        snapshot = self._parse_soup(url, soup, ["Trendyol statik HTML tarandi."])

        if get_settings().enable_playwright_fallback and _needs_render(snapshot):
            try:
                rendered_soup = fetch_rendered_soup(url, ".product-detail-container")
                snapshot = self._parse_soup(
                    url,
                    rendered_soup,
                    snapshot.parser_notes + ["Trendyol Playwright render fallback tarandi."],
                )
            except Exception as exc:
                snapshot.parser_notes.append(f"Playwright fallback calismadi: {type(exc).__name__}")

        return snapshot

    def _parse_soup(self, url: str, soup, notes: list[str]) -> ProductSnapshot:
        product_data = product_json_ld(soup) or {}
        aggregate_rating = product_data.get("aggregateRating") or {}
        brand = product_data.get("brand") or {}
        offers = product_data.get("offers") or {}
        embedded = embedded_json_candidates(soup)

        # Satıcı: CSS selector (CSR'da gelir) > JSON-LD offers.seller > embedded merchantName
        seller_name = text_from_selectors(
            soup,
            [
                ".seller-name-text",
                ".merchant-text",
                ".seller-container a",
                "[data-testid='seller-name']",
            ],
        )

        if not seller_name and isinstance(offers, dict):
            seller = offers.get("seller")
            if isinstance(seller, dict):
                seller_name = clean_text(seller.get("name"))

        if not seller_name:
            seller_name = clean_text(
                str(find_first_by_keys(embedded, ["merchantName", "sellerName", "supplierName", "boutiqueName"]) or "")
            )

        # Marka: JSON-LD brand > inline script brandName — satıcıyla karıştırılmaz
        brand_name: str | None = None
        if isinstance(brand, dict):
            brand_name = clean_text(brand.get("name"))
        if not brand_name:
            brand_name = clean_text(
                str(find_first_by_keys(embedded, ["brandName", "brandTitle"]) or "")
            )

        rating_text = text_from_selectors(
            soup,
            [
                ".rating-score",
                ".pr-rnr-sm-p-s",
                ".rating-line-count",
                ".reviews-summary .rating",
                "[data-testid='rating-score']",
                "[class*='rating']",
            ],
        )
        review_text = text_from_selectors(
            soup,
            [
                ".total-review-count",
                ".rvw-cnt-tx",
                ".reviewCount",
                ".comment-count",
                "[data-testid='review-count']",
                "[class*='review']",
            ],
        )

        product_name = (
            clean_text(product_data.get("name"))
            or clean_text(str(find_first_by_keys(embedded, ["productName", "name", "title"]) or ""))
            or meta_content(soup, ["og:title", "twitter:title"])
        )
        rating = (
            first_number(str(aggregate_rating.get("ratingValue")))
            or first_number(str(find_first_by_keys(embedded, ["ratingScore", "ratingValue", "averageRating"]) or ""))
            or first_number(rating_text)
        )
        review_count = (
            first_int(str(aggregate_rating.get("reviewCount")))
            or first_int(str(find_first_by_keys(embedded, ["reviewCount", "commentCount", "totalReviewCount"]) or ""))
            or first_int(review_text)
        )

        # Fiyat: discountedPrice (indirimli) ve originalPrice / listPrice (orijinal)
        discounted_price_raw = find_first_by_keys(embedded, ["discountedPrice", "sellingPrice", "salePrice"])
        original_price_raw = find_first_by_keys(embedded, ["originalPrice", "listPrice", "msrp"])
        price_str = clean_text(str(discounted_price_raw)) if discounted_price_raw else None
        original_price_str = clean_text(str(original_price_raw)) if original_price_raw else None

        # JSON-LD offers fiyatı fallback
        if not price_str and isinstance(offers, dict):
            p = offers.get("price")
            c = offers.get("priceCurrency", "")
            if p:
                price_str = f"{p} {c}".strip()

        # İndirim oranı (varsa ikisi de gelirse hesapla)
        discount_percent: int | None = None
        if discounted_price_raw and original_price_raw:
            try:
                d = float(str(discounted_price_raw).replace(",", "."))
                o = float(str(original_price_raw).replace(",", "."))
                if o > 0 and d < o:
                    discount_percent = round((1 - d / o) * 100)
            except (ValueError, TypeError):
                pass

        # Favori sayısı
        fav_raw = find_first_by_keys(embedded, ["favoriteCount", "wishlistCount"])
        favorite_count = first_int(str(fav_raw)) if fav_raw else None

        # Merchant rozeti — Trendyol onaylı satıcı sinyali
        sticker_raw = find_first_by_keys(embedded, ["hasMerchantSticker", "merchantSticker"])
        has_merchant_sticker = str(sticker_raw).lower() == "true" if sticker_raw is not None else False

        # Kategori tahmini: URL path'den slug kelimeleri (Trendyol'a özel)
        category_hint = _category_hint_from_url(url, product_name)

        return ProductSnapshot(
            url=url,
            marketplace=self.marketplace,
            product_name=product_name,
            seller_name=seller_name,
            brand_name=brand_name,
            rating=rating,
            review_count=review_count,
            price=price_str,
            original_price=original_price_str,
            discount_percent=discount_percent,
            category_hint=category_hint,
            favorite_count=favorite_count,
            has_merchant_sticker=has_merchant_sticker,
            review_snippets=collect_review_snippets(
                soup,
                [
                    ".comment-text p",
                    ".comment-text",
                    ".review-comment",
                    ".rvw-cnt-tx",
                    "[data-testid='review-comment']",
                    "[class*='comment']",
                ],
            ),
            parser_notes=notes,
        )


def _needs_render(snapshot: ProductSnapshot) -> bool:
    return not snapshot.product_name or (not snapshot.review_snippets and snapshot.review_count is None)


_CATEGORY_KEYWORDS: dict[str, str] = {
    # Kozmetik & parfüm (yüksek risk)
    "parfum": "parfum-kozmetik", "parfüm": "parfum-kozmetik",
    "kozmetik": "parfum-kozmetik", "makyaj": "parfum-kozmetik",
    "ruj": "parfum-kozmetik", "fondoten": "parfum-kozmetik",
    "serum": "parfum-kozmetik", "krem": "parfum-kozmetik",
    # Takviye gıda (yüksek risk)
    "takviye": "takviye-gida", "vitamin": "takviye-gida", "protein": "takviye-gida",
    "supplement": "takviye-gida", "kollajen": "takviye-gida", "omega": "takviye-gida",
    # Saat (yüksek risk — taklit riski)
    "saat": "saat", "kronograf": "saat", "kol saati": "saat",
    # Telefon (orta-yüksek risk — garanti/IMEI)
    "iphone": "telefon", "android telefon": "telefon",
    # Telefon aksesuarı (orta risk)
    "aksesuar": "telefon-aksesuar",
    "sarj": "telefon-aksesuar", "şarj": "telefon-aksesuar",
    "kablo": "telefon-aksesuar", "batarya": "telefon-aksesuar",
    "powerbank": "telefon-aksesuar", "kılıf": "telefon-aksesuar", "kilif": "telefon-aksesuar",
    "ekran koruyucu": "telefon-aksesuar", "lightning": "telefon-aksesuar",
    # Oyuncu ekipmanı (orta risk)
    "gaming": "oyuncu-ekipman", "oyuncu": "oyuncu-ekipman",
    "mekanik klavye": "oyuncu-ekipman", "mousepad": "oyuncu-ekipman",
    "joystick": "oyuncu-ekipman", "gamepad": "oyuncu-ekipman",
    "mouse pad": "oyuncu-ekipman", "rgb": "oyuncu-ekipman",
    # Oyuncak (orta risk)
    "oyuncak": "oyuncak", "bebek": "oyuncak", "lego": "oyuncak",
    # Spor ekipmanı (düşük-orta risk)
    "dambil": "spor-ekipman", "halter": "spor-ekipman",
    "fitness": "spor-ekipman", "bisiklet": "spor-ekipman",
    "treadmill": "spor-ekipman", "yoga": "spor-ekipman",
    "koşu bandı": "spor-ekipman", "kamp": "spor-ekipman",
    "ağırlık": "spor-ekipman", "agirlik": "spor-ekipman",
    # Giyim (orta risk)
    "giyim": "giyim", "çanta": "giyim", "canta": "giyim",
    "mont": "giyim", "ceket": "giyim", "kaban": "giyim",
    "pantolon": "giyim", "elbise": "giyim", "gömlek": "giyim", "gomlek": "giyim",
    "tişört": "giyim", "tisort": "giyim", "sweatshirt": "giyim",
    # Ayakkabı (orta risk)
    "ayakkabı": "ayakkabi", "ayakkabi": "ayakkabi",
    "sneaker": "ayakkabi", "terlik": "ayakkabi",
    "sandalet": "ayakkabi", "bot": "ayakkabi", "çizme": "ayakkabi",
    # Elektronik genel (düşük-orta risk)
    "elektronik": "elektronik", "bilgisayar": "elektronik",
    "tablet": "elektronik", "kulaklık": "elektronik", "kulalik": "elektronik",
    "laptop": "elektronik", "tv": "elektronik", "televizyon": "elektronik",
    "monitör": "elektronik", "monitor": "elektronik",
    # Beyaz eşya & klima (düşük risk)
    "klima": "beyaz-esya", "buzdolabi": "beyaz-esya", "buzdolabı": "beyaz-esya",
    "çamaşır": "beyaz-esya", "camasir": "beyaz-esya",
    "bulaşık": "beyaz-esya", "bulasik": "beyaz-esya",
    "fırın": "beyaz-esya", "firin": "beyaz-esya",
    "mikrodalga": "beyaz-esya", "aspirator": "beyaz-esya", "aspiratör": "beyaz-esya",
    # Mobilya & ev (düşük risk)
    "mobilya": "mobilya", "mutfak": "mobilya",
    "koltuk": "mobilya", "masa": "mobilya", "sandalye": "mobilya",
    "yatak": "mobilya", "dolap": "mobilya",
    # Küçük ev aletleri (düşük risk)
    "kahve makinesi": "kucuk-ev-aleti", "kahve": "kucuk-ev-aleti",
    "tost makinesi": "kucuk-ev-aleti", "tost": "kucuk-ev-aleti",
    "blender": "kucuk-ev-aleti", "mikser": "kucuk-ev-aleti",
    "fritöz": "kucuk-ev-aleti", "fritoz": "kucuk-ev-aleti",
    "kettle": "kucuk-ev-aleti", "su ısıtıcı": "kucuk-ev-aleti",
    "tıraş makinesi": "kucuk-ev-aleti", "tras makinesi": "kucuk-ev-aleti",
    "epilasyon": "kucuk-ev-aleti", "saç kurutma": "kucuk-ev-aleti",
    "saç düzleştirici": "kucuk-ev-aleti", "elektrikli süpürge": "kucuk-ev-aleti",
    "robot süpürge": "kucuk-ev-aleti", "ütü": "kucuk-ev-aleti",
    # Kitap & kırtasiye (çok düşük risk)
    "kitap": "kitap", "kirtasiye": "kitap", "kırtasiye": "kitap",
    "defter": "kitap", "kalem": "kitap",
}


def _category_hint_from_url(url: str, product_name: str | None) -> str | None:
    """URL path ve ürün adından kategori tahmini üretir."""
    text = (url.lower() + " " + (product_name or "").lower())
    for keyword, category in _CATEGORY_KEYWORDS.items():
        if keyword in text:
            return category
    return None
