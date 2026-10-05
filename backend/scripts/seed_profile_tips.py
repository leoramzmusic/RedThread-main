import asyncio
import os
import sys

# Add the backend directory to path (same pattern as seed_profile_modules.py)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.models.profile_tip import ProfileTip, TipTranslation, Slide

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

    # Default slides for photos_visual (text only; admin uploads the 6 images).
    # Idempotent: only fills when the tip exists and has no slides.
    await ensure_photos_visual_slides()


PHOTOS_VISUAL_SLIDES = [
    {
        "order": 0,
        "ok_image_url": "",
        "ko_image_url": "",
        "translations": {
            "es": {"title": "Usa fotos que muestren tu rostro", "description": "Los perfiles con fotos de cara suelen recibir más Likes.", "trigger_button_text": "", "ok_label": "Cara OK", "ko_label": "Espalda X"},
            "en": {"title": "Use photos that show your face", "description": "Profiles with face photos usually get more Likes.", "trigger_button_text": "", "ok_label": "Face OK", "ko_label": "Back X"},
        },
    },
    {
        "order": 1,
        "ok_image_url": "",
        "ko_image_url": "",
        "translations": {
            "es": {"title": "Bye bye a los filtros", "description": "Evita filtros exagerados. Usa fotos nítidas y recientes.", "trigger_button_text": "", "ok_label": "Natural OK", "ko_label": "Filtro X"},
            "en": {"title": "Bye bye filters", "description": "Avoid heavy filters. Use sharp, recent photos.", "trigger_button_text": "", "ok_label": "Natural OK", "ko_label": "Filter X"},
        },
    },
    {
        "order": 2,
        "ok_image_url": "",
        "ko_image_url": "",
        "translations": {
            "es": {"title": "Muestra tus pasiones", "description": "Añade fotos que reflejen tus hobbies e intereses.", "trigger_button_text": "", "ok_label": "Hobby OK", "ko_label": "Objeto X"},
            "en": {"title": "Show your passions", "description": "Add photos that reflect your hobbies and interests.", "trigger_button_text": "", "ok_label": "Hobby OK", "ko_label": "Object X"},
        },
    },
]


async def ensure_photos_visual_slides():
    tip = await ProfileTip.find_one({"tip_key": "photos_visual"})
    if not tip:
        print("photos_visual not found, skipping slides")
        return
    if tip.slides:
        print(f"photos_visual already has {len(tip.slides)} slides, skipping")
        return
    tip.slides = [
        Slide(
            order=s["order"],
            ok_image_url=s["ok_image_url"],
            ko_image_url=s["ko_image_url"],
            translations={k: TipTranslation(**v) for k, v in s["translations"].items()},
        )
        for s in PHOTOS_VISUAL_SLIDES
    ]
    await tip.save()
    print(f"photos_visual slides seeded ({len(tip.slides)})")

if __name__ == "__main__":
    asyncio.run(main())
