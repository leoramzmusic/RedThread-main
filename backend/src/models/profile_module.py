from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime


class ProfileModule(Document):
    key: Indexed(str, unique=True)  # e.g. "section-music" — contract with frontend registry.ts
    nombre: str
    descripcion: str = ""
    icono: str = "tune"
    orden: int = 0
    visible: bool = True
    origen: str = "core"  # "core" | "integracion"
    requiere_premium: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "profile_modules"
        indexes = ["key", "orden"]
