"""Fetch a daily cyber archive item from a configured public feed.

Render/Railway cron can run this script around 00:00 Europe/Istanbul.
Set CYBER_ARCHIVE_FEED_URL to a trusted RSS/Atom/JSON source, then persist
the printed JSON in the database or a generated file in a later iteration.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from html import unescape
from urllib.request import Request, urlopen
from xml.etree import ElementTree


def strip_html(value: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", value)
    clean = re.sub(r"\s+", " ", clean)
    return unescape(clean).strip()


def fetch_text(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "DijitalIzAvcisi/0.1 cyber-archive-fetcher"
        },
    )
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_feed(raw: str, source_url: str) -> dict[str, str]:
    if raw.lstrip().startswith("{"):
        payload = json.loads(raw)
        items = payload.get("items") or payload.get("articles") or []
        if not items:
            raise ValueError("JSON feed item bulunamadi.")
        first = items[0]
        return {
            "title": strip_html(str(first.get("title", "Guncel siber olay"))),
            "summary": strip_html(str(first.get("summary") or first.get("description") or "")),
            "sourceUrl": str(first.get("url") or first.get("link") or source_url),
        }

    root = ElementTree.fromstring(raw)
    item = root.find(".//item")
    if item is None:
        item = root.find(".//{http://www.w3.org/2005/Atom}entry")
    if item is None:
        raise ValueError("RSS/Atom feed item bulunamadi.")

    title = item.findtext("title") or item.findtext("{http://www.w3.org/2005/Atom}title") or "Guncel siber olay"
    summary = (
        item.findtext("description")
        or item.findtext("summary")
        or item.findtext("{http://www.w3.org/2005/Atom}summary")
        or ""
    )
    link = item.findtext("link")
    if not link:
        atom_link = item.find("{http://www.w3.org/2005/Atom}link")
        link = atom_link.get("href") if atom_link is not None else source_url

    return {
        "title": strip_html(title),
        "summary": strip_html(summary),
        "sourceUrl": link,
    }


def main() -> None:
    source_url = os.environ.get("CYBER_ARCHIVE_FEED_URL", "").strip()
    if not source_url:
        raise SystemExit("CYBER_ARCHIVE_FEED_URL env degeri gerekli.")

    item = parse_feed(fetch_text(source_url), source_url)
    today = datetime.now(timezone.utc).date().isoformat()
    output = {
        "date": today,
        "category": "Guncel siber tehdit",
        "title": item["title"],
        "summary": item["summary"],
        "impact": "Bu kayit otomatik kaynak taramasindan uretilmistir; yayinlanmadan once editor kontrolu onerilir.",
        "sourceUrl": item["sourceUrl"],
        "sourceName": source_url,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
