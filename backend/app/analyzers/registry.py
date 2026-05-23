from urllib.parse import urlparse

from app.analyzers.base import ProductAnalyzer, ProductSnapshot
from app.analyzers.hepsiburada import HepsiburadaAnalyzer
from app.analyzers.n11 import N11Analyzer
from app.analyzers.trendyol import TrendyolAnalyzer


ANALYZERS: list[ProductAnalyzer] = [
    TrendyolAnalyzer(),
    HepsiburadaAnalyzer(),
    N11Analyzer(),
]


def analyze_with_marketplace_parser(url: str) -> ProductSnapshot:
    for analyzer in ANALYZERS:
        if analyzer.can_handle(url):
            return analyzer.analyze(url)

    return ProductSnapshot(
        url=url,
        marketplace=_detect_marketplace(url),
        parser_notes=["Desteklenen pazar yeri parser'i bulunamadi."],
    )


def _detect_marketplace(url: str) -> str:
    host = urlparse(url).netloc.lower()

    if "trendyol" in host:
        return "Trendyol"
    if "hepsiburada" in host:
        return "Hepsiburada"
    if "n11" in host:
        return "N11"

    return "Bilinmeyen pazar yeri"
