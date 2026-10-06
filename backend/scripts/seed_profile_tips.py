import asyncio
import os
import sys

# Add the backend directory to path (same pattern as seed_profile_modules.py)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.models.profile_tip import ProfileTip, TipTranslation, Slide

import sys as _sys
import os as _os

_sys.path.insert(0, _os.path.dirname(__file__))
from profile_tips_i18n import (  # noqa: E402
    PHOTOS_VISUAL_SLIDES_I18N,
    PHOTOS_VISUAL_TITLES,
)

SEEDS = [
    {"tip_key": "photos_visual", "type": "carousel", "section_key": "section-photos", "order": 0, "translations": {"es": {"title": "Tips para tus fotos", "description": "", "trigger_button_text": "Tips visuales"}}},
    {"tip_key": "safety", "type": "drawer", "section_key": "section-aboutme", "order": 1, "translations": {"es": {"title": "Consejos de Seguridad", "description": "Por tu seguridad, no incluyas nombres de usuario de redes sociales ni información de contacto directa en tu biografía.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "goals", "type": "drawer", "section_key": "section-goals", "order": 2, "translations": {"es": {"title": "Las emociones cambian", "description": "Te preguntaremos de vez en cuando en caso de que tu opinión haya cambiado.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "pronouns", "type": "drawer", "section_key": "section-pronouns", "order": 3, "translations": {"es": {"title": "¿Por qué son importantes los pronombres?", "description": "Los pronombres permiten darle más profundidad y detalle a tu perfil.", "trigger_button_text": "De acuerdo"}}},
    {"tip_key": "location", "type": "drawer", "section_key": "section-location", "order": 4, "translations": {"es": {"title": "¿Por qué pedimos tu ubicación?", "description": "Tu ubicación nos ayuda a mostrarte personas cercanas. Nunca compartiremos tu ubicación exacta sin tu consentimiento.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "identity", "type": "drawer", "section_key": "section-basic", "order": 5, "translations": {"es": {"title": "¿Por qué pedimos tu identidad?", "description": "Tu identidad nos ayuda a verificar tu perfil y mantener la seguridad de la comunidad.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "social_style_test", "type": "stepper", "section_key": "section-personality", "order": 6, "translations": {"es": {"title": "Microtest: Estilo Social", "description": "Responde 5 preguntas para descubrir tu estilo social.", "trigger_button_text": "¿No sabes cuál eres?"}}},
    {"tip_key": "spotify_search", "type": "dialog", "section_key": "section-music", "order": 7, "translations": {"es": {"title": "Buscar en Spotify", "description": "", "trigger_button_text": "Buscar"}}},
    {"tip_key": "nickname", "type": "dialog", "section_key": "section-basic", "order": 8, "translations": {"es": {"title": "Cambiar nickname", "description": "", "trigger_button_text": "Editar"}}},
]

async def main():
    from src.core.database import init_db
    await init_db()
    for s in SEEDS:
        existing = await ProfileTip.find_one({"tip_key": s["tip_key"]})
        if existing:
            print(f"skip {s['tip_key']}")
            continue
        tip = ProfileTip(tip_key=s["tip_key"], type=s["type"], section_key=s["section_key"], translations={k: TipTranslation(**v) for k, v in s["translations"].items()}, slides=[], order=s["order"])
        await tip.insert()
        print(f"created {s['tip_key']}")

    # Default slides for photos_visual (21-language text; admin uploads the 6 images).
    # Idempotent: only fills when the tip exists and has no slides.
    await ensure_photos_visual_slides()


def _slide_models():
    return [
        Slide(
            order=s["order"],
            ok_image_url="",
            ko_image_url="",
            translations={k: TipTranslation(**v) for k, v in s["translations"].items()},
        )
        for s in PHOTOS_VISUAL_SLIDES_I18N
    ]


async def ensure_photos_visual_slides():
    tip = await ProfileTip.find_one({"tip_key": "photos_visual"})
    if not tip:
        print("photos_visual not found, skipping slides")
        return
    if tip.slides:
        print(f"photos_visual already has {len(tip.slides)} slides, skipping")
        return
    # Full 21-language titles at tip level too
    translations = dict(tip.translations or {})
    for lang, title in PHOTOS_VISUAL_TITLES.items():
        current = translations.get(lang)
        if current is not None and not isinstance(current, dict):
            try:
                current = current.model_dump()
            except Exception:
                current = {}
        current = dict(current or {})
        current.setdefault("title", title)
        translations[lang] = TipTranslation(**current)
    tip.translations = translations
    tip.slides = _slide_models()
    await tip.save()
    print(f"photos_visual slides seeded ({len(tip.slides)})")

if __name__ == "__main__":
    asyncio.run(main())
