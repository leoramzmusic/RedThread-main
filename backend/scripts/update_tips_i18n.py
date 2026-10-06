"""Merge scripted translations into existing tips WITHOUT touching image URLs.

Usage (from backend/):
    python scripts/update_tips_i18n.py
"""

import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.dirname(__file__))

from profile_tips_i18n import (  # noqa: E402
    PHOTOS_VISUAL_SLIDES_I18N,
    PHOTOS_VISUAL_TITLES,
)


async def main():
    from src.core.database import init_db
    from src.models.profile_tip import ProfileTip, Slide, TipTranslation

    await init_db()

    tip = await ProfileTip.find_one({"tip_key": "photos_visual"})
    if not tip:
        print("photos_visual not found, nothing to update")
        return

    # 1. Tip-level titles (preserve trigger_button_text and other fields)
    translations = dict(tip.translations or {})
    for lang, title in PHOTOS_VISUAL_TITLES.items():
        current = translations.get(lang)
        if current is not None and not isinstance(current, dict):
            try:
                current = current.model_dump()
            except Exception:
                current = {}
        current = dict(current or {})
        current["title"] = title
        translations[lang] = TipTranslation(**current)
    tip.translations = translations

    # 2. Slides: merge translations per index, NEVER touch image URLs
    slides = list(tip.slides or [])
    for seed in PHOTOS_VISUAL_SLIDES_I18N:
        idx = seed["order"]
        while len(slides) <= idx:
            slides.append(
                Slide(order=len(slides), translations={}, ok_image_url="", ko_image_url="")
            )
        current_tr = dict(slides[idx].translations or {})
        for lang, tr in seed["translations"].items():
            merged = dict(current_tr.get(lang) or {})
            if not isinstance(merged, dict):
                try:
                    merged = merged.model_dump()
                except Exception:
                    merged = {}
            merged.update(tr)
            current_tr[lang] = TipTranslation(**merged)
        slides[idx].translations = current_tr
        slides[idx].order = idx
    tip.slides = slides

    await tip.save()
    print(
        f"photos_visual updated: {len(translations)} title langs, "
        f"{len(slides)} slides with {[len(s.translations or {}) for s in slides]} langs each"
    )


if __name__ == "__main__":
    asyncio.run(main())
