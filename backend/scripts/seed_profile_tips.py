import asyncio
import os
import sys

# Add the backend directory to path (same pattern as seed_profile_modules.py)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.models.profile_tip import ProfileTip, TipTranslation

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

if __name__ == "__main__":
    asyncio.run(main())
