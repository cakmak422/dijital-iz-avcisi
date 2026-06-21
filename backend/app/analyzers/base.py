from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class ProductSnapshot:
    url: str
    marketplace: str
    product_name: str | None = None
    seller_name: str | None = None
    brand_name: str | None = None
    rating: float | None = None
    review_count: int | None = None
    price: str | None = None
    original_price: str | None = None
    discount_percent: int | None = None
    category_hint: str | None = None
    favorite_count: int | None = None
    has_merchant_sticker: bool = False
    review_snippets: list[str] = field(default_factory=list)
    raw_negative_signals: list[str] = field(default_factory=list)
    parser_notes: list[str] = field(default_factory=list)


class ProductAnalyzer(Protocol):
    marketplace: str

    def can_handle(self, url: str) -> bool:
        ...

    def analyze(self, url: str) -> ProductSnapshot:
        ...
