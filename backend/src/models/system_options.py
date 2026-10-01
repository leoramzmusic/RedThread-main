from beanie import Document, Indexed


class SystemOption(Document):
    """
    Dynamic options for dropdowns and lists in the application.
    Allows managing values like Gender, Interests, etc. without code changes.
    Supports multilingual labels for all 21 supported languages.
    """

    category: Indexed(str)  # e.g., "gender", "interest", "language"
    value: str  # e.g., "male", "music", "en"
    label: str  # Default label (fallback)
    label_es: str = ""  # Spanish
    label_en: str = ""  # English
    label_pt: str = ""  # Portuguese
    label_fr: str = ""  # French
    label_de: str = ""  # German
    label_it: str = ""  # Italian
    label_ru: str = ""  # Russian
    label_sv: str = ""  # Swedish
    label_nl: str = ""  # Dutch
    label_zh: str = ""  # Chinese (Mandarin)
    label_hi: str = ""  # Hindi
    label_bn: str = ""  # Bengali
    label_ja: str = ""  # Japanese
    label_ko: str = ""  # Korean
    label_ar: str = ""  # Arabic
    label_sw: str = ""  # Swahili
    label_ha: str = ""  # Hausa
    label_am: str = ""  # Amharic
    label_tl: str = ""  # Filipino/Tagalog
    label_ms: str = ""  # Malay
    label_mi: str = ""  # Māori
    order: int = 0  # For sorting
    is_active: bool = True

    class Settings:
        name = "system_options"
        indexes = ["category", "value", ("category", "order")]

    class Config:
        json_schema_extra = {
            "example": {
                "category": "gender",
                "value": "non_binary",
                "label": "Non-binary",
                "label_es": "No binario",
                "label_en": "Non-binary",
                "label_pt": "Não binário",
                "label_fr": "Non-binaire",
                "label_de": "Nicht-binär",
                "label_it": "Non binario",
                "label_ru": "Небинарный",
                "label_sv": "Ickebinär",
                "label_nl": "Non-binair",
                "label_zh": "非二元",
                "label_hi": "नॉन-बाइनरी",
                "label_bn": "নন-বাইনারি",
                "label_ja": "ノンバイナリー",
                "label_ko": "논바이너리",
                "label_ar": "غير ثنائي",
                "label_sw": "Si-bainari",
                "label_ha": "Ba tare da rabinah",
                "label_am": "የባይናሪ",
                "label_tl": "Non-binary",
                "label_ms": "Bukan binary",
                "label_mi": "Kore whakapa",
                "order": 3,
            }
        }
