import argparse
import csv
import json
import sys
from dataclasses import asdict
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.analyzers.registry import analyze_with_marketplace_parser


REQUIRED_FIELDS = ["product_name", "seller_name", "rating", "review_count"]


def measure_url(url: str) -> dict:
    try:
        snapshot = analyze_with_marketplace_parser(url)
        data = asdict(snapshot)
        fields_found = sum(1 for field in REQUIRED_FIELDS if data.get(field) not in (None, "", []))
        success_score = round((fields_found / len(REQUIRED_FIELDS)) * 100)
        data.update(
            {
                "success_score": success_score,
                "fields_found": fields_found,
                "required_fields": len(REQUIRED_FIELDS),
                "has_reviews": len(snapshot.review_snippets) > 0,
                "status": "ok",
            }
        )
        return data
    except Exception as exc:
        return {
            "url": url,
            "marketplace": "unknown",
            "product_name": None,
            "seller_name": None,
            "rating": None,
            "review_count": None,
            "review_snippets": [],
            "raw_negative_signals": [],
            "parser_notes": [f"{type(exc).__name__}: {exc}"],
            "success_score": 0,
            "fields_found": 0,
            "required_fields": len(REQUIRED_FIELDS),
            "has_reviews": False,
            "status": "error",
        }


def read_urls(path: str | None, inline_urls: list[str]) -> list[str]:
    urls = [url.strip() for url in inline_urls if url.strip()]
    if path:
        urls.extend(
            line.strip()
            for line in Path(path).read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.strip().startswith("#")
        )
    return urls


def write_csv(path: str, rows: list[dict]) -> None:
    fieldnames = [
        "url",
        "marketplace",
        "status",
        "success_score",
        "fields_found",
        "required_fields",
        "has_reviews",
        "product_name",
        "seller_name",
        "rating",
        "review_count",
        "parser_notes",
    ]
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    **{field: row.get(field) for field in fieldnames},
                    "parser_notes": " | ".join(row.get("parser_notes") or []),
                }
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure marketplace parser success on real product URLs.")
    parser.add_argument("urls", nargs="*", help="Product URLs to measure.")
    parser.add_argument("--file", help="Text file with one product URL per line.")
    parser.add_argument("--csv", help="Optional CSV output path.")
    args = parser.parse_args()

    urls = read_urls(args.file, args.urls)
    if not urls:
        raise SystemExit("Provide URLs as arguments or with --file.")

    rows = [measure_url(url) for url in urls]
    average = round(sum(row["success_score"] for row in rows) / len(rows), 1)
    full_success = sum(1 for row in rows if row["success_score"] == 100)

    report = {
        "total_urls": len(rows),
        "average_success_score": average,
        "full_success_count": full_success,
        "full_success_rate": round((full_success / len(rows)) * 100, 1),
        "results": rows,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if args.csv:
        write_csv(args.csv, rows)


if __name__ == "__main__":
    main()
