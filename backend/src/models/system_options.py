from beanie import Document, Indexed
from pydantic import Field
from typing import Optional

class SystemOption(Document):
    """
    Dynamic options for dropdowns and lists in the application.
    Allows managing values like Gender, Interests, etc. without code changes.
    Supports multilingual labels.
    """
    category: Indexed(str)  # e.g., "gender", "interest", "language"
    value: str              # e.g., "male", "music", "en"
    label: str              # Default label (deprecated, use label_es/en/pt/fr)
    label_es: str           # Spanish label
    label_en: str           # English label
    label_pt: str           # Portuguese label
    label_fr: str           # French label
    order: int = 0          # For sorting
    is_active: bool = True
    
    class Settings:
        name = "system_options"
        indexes = [
            "category",
            "value",
            ("category", "order")
        ]
    
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
                "order": 3
            }
        }

