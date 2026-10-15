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


def resolve_label(opt: SystemOption, label_field: str) -> str:
    """Return the localized label, falling back when the translation is empty.

    The ``label_<lang>`` fields always exist with a ``""`` default, so a plain
    ``getattr(opt, label_field, opt.label)`` never falls back and renders blank
    options for languages without a seeded translation. Fall back to the
    default label, then English, then the raw value, so a label is never empty.
    """
    localized = getattr(opt, label_field, "") or ""
    return localized or opt.label or opt.label_en or opt.value


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
        {"value": opt.value, "label": resolve_label(opt, label_field)}
        for opt in options
    ]


@router.get("/")
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
            {"value": opt.value, "label": resolve_label(opt, label_field)}
        )

    return result


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
        opt.value: resolve_label(opt, label_field)
        for opt in options
    }
