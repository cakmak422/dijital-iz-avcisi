from __future__ import annotations

from datetime import datetime


def parser_health_snapshot() -> list[dict]:
    return [
        {
            "platform": "Trendyol",
            "status": "aktif",
            "lastTest": datetime.utcnow().isoformat(),
            "successRate": 86,
            "note": "Temel alanlar için selector testi çalışmaya hazır.",
        },
        {
            "platform": "Hepsiburada",
            "status": "dikkat",
            "lastTest": datetime.utcnow().isoformat(),
            "successRate": 68,
            "note": "Dinamik render durumunda Playwright fallback önerilir.",
        },
        {
            "platform": "N11",
            "status": "bakımda",
            "lastTest": datetime.utcnow().isoformat(),
            "successRate": 52,
            "note": "Selector sertleştirme ve gerçek sayfa örnekleri planlandı.",
        },
    ]
