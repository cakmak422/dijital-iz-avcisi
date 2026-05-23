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


class N11Analyzer:
    marketplace = "N11"

    def can_handle(self, url: str) -> bool:
        return "n11.com" in urlparse(url).netloc.lower()

    def analyze(self, url: str) -> ProductSnapshot:
        soup = fetch_soup(url)
        snapshot = self._parse_soup(url, soup, ["N11 statik HTML tarandi."])

        if get_settings().enable_playwright_fallback and _needs_render(snapshot):
            try:
                rendered_soup = fetch_rendered_soup(url, ".unf-p-detail")
                snapshot = self._parse_soup(
                    url,
                    rendered_soup,
                    snapshot.parser_notes + ["N11 Playwright render fallback tarandi."],
                )
            except Exception as exc:
                snapshot.parser_notes.append(f"Playwright fallback calismadi: {type(exc).__name__}")

        return snapshot

    def _parse_soup(self, url: str, soup, notes: list[str]) -> ProductSnapshot:
        product_data = product_json_ld(soup) or {}
        aggregate_rating = product_data.get("aggregateRating") or {}
        offers = product_data.get("offers") or {}
        embedded = embedded_json_candidates(soup)

        seller_name = text_from_selectors(
            soup,
            [
                ".seller-name",
                ".unf-p-seller-name",
                ".seller a",
                "[class*='seller'] a",
            ],
        )

        if not seller_name and isinstance(offers, dict):
            seller = offers.get("seller")
            if isinstance(seller, dict):
                seller_name = clean_text(seller.get("name"))

        if not seller_name:
            seller_name = clean_text(str(find_first_by_keys(embedded, ["sellerName", "shopName", "merchantName"]) or ""))

        rating_text = text_from_selectors(
            soup,
            [".ratingScore", ".review-score", ".ratingCont", ".unf-p-summary-rating", "[class*='rating']"],
        )
        review_text = text_from_selectors(
            soup,
            [".reviewCount", ".comment-count", ".unf-p-summary-reviewCount", "[class*='comment']"],
        )

        product_name = (
            clean_text(product_data.get("name"))
            or text_from_selectors(soup, ["h1.proName", ".proName", "h1", ".unf-p-title"])
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

        return ProductSnapshot(
            url=url,
            marketplace=self.marketplace,
            product_name=product_name,
            seller_name=seller_name,
            rating=rating,
            review_count=review_count,
            review_snippets=collect_review_snippets(
                soup,
                [
                    ".commentText",
                    ".comment",
                    ".review-comment",
                    ".reviewText",
                    ".unf-review-comment",
                    "[class*='comment']",
                ],
            ),
            parser_notes=notes,
        )


def _needs_render(snapshot: ProductSnapshot) -> bool:
    return not snapshot.product_name or (not snapshot.review_snippets and snapshot.review_count is None)
