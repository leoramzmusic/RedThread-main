from beanie import Document, Indexed
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class TipTranslation(BaseModel):
    title: str = ""
    description: str = ""
    trigger_button_text: str = ""
    ok_label: Optional[str] = None
    ko_label: Optional[str] = None


class Slide(BaseModel):
    order: int = 0
    translations: dict[str, TipTranslation] = Field(default_factory=dict)
    ok_image_url: str = ""
    ko_image_url: str = ""


class ProfileTip(Document):
    tip_key: Indexed(str, unique=True)
    type: Literal["carousel", "drawer", "stepper", "dialog"] = "drawer"
    section_key: str = ""
    translations: dict[str, TipTranslation] = Field(default_factory=dict)
    slides: List[Slide] = Field(default_factory=list)
    is_active: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "profile_tips"
        indexes = ["tip_key", "section_key", "order"]
