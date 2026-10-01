from fastapi import APIRouter
from src.models.system_options import SystemOption

router = APIRouter()

# All 21 supported language codes
SUPPORTED_LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl",
    "zh", "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am",
    "tl", "ms", "mi"
]

def get_label_field(lang: str) -> str:
    """Get the label field name for the given language code."""
    return f"label_{lang}" if lang in SUPPORTED_LANGS else "label_es"


@router.get("")
async def get_all_options(lang: str = "es"):
    """
    Get all active options grouped by category in specified language.
    Useful for initial app load.
    """
    options = (
        await SystemOption.find(SystemOption.is_active == True)
        .sort(+SystemOption.order)
        .to_list()
    )

    label_field = get_label_field(lang)

    result = {}
    for opt in options:
        if opt.category not in result:
            result[opt.category] = []
        result[opt.category].append(
            {"value": opt.value, "label": getattr(opt, label_field, opt.label)}
        )

    return result


@router.get("/{category}")
async def get_options(category: str, lang: str = "es"):
    """
    Get all active options for a specific category in specified language.
    Returns a list of dicts with 'value' and 'label'.
    """
    options = (
        await SystemOption.find(
            SystemOption.category == category, SystemOption.is_active == True
        )
        .sort(+SystemOption.order)
        .to_list()
    )

    if not options:
        return []

    label_field = get_label_field(lang)

    return [
        {"value": opt.value, "label": getattr(opt, label_field, opt.label)}
        for opt in options
    ]


@router.get("/section/{category}")
async def get_section_texts(category: str, lang: str = "es"):
    """
    Get all active texts for a section category as a flat key-value object.
    Returns: {"key1": "translated value 1", "key2": "translated value 2", ...}
    """
    options = (
        await SystemOption.find(
            SystemOption.category == category, SystemOption.is_active == True
        )
        .sort(+SystemOption.order)
        .to_list()
    )

    if not options:
        return {}

    label_field = get_label_field(lang)

    return {
        opt.value: getattr(opt, label_field, opt.label)
        for opt in options
    }
