from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Dict, List, Set

# Mapeo módulo (key `section-*`, contrato con frontend registry.ts) →
# campos de score de completitud. Debe mantenerse en sync con
# frontend/src/utils/profileScoring.ts (MODULE_SCORE_FIELDS).
# INVARIANTE: visible=False solo oculta y excluye del %; jamás borra ni
# modifica registros de usuario (el PUT de perfil usa exclude_unset).
MODULE_SCORE_FIELDS: Dict[str, List[str]] = {
    "section-photos": ["photos"],
    "section-basic": ["nickname", "age", "gender"],
    "section-location": ["city"],
    "section-aboutme": ["bio"],
    "section-goals": ["relationship_goals"],
    "section-interests": ["interests"],
    "section-pronouns": ["pronouns"],
    "section-additional": ["height_cm", "zodiac", "relationship_type"],
    "section-professional": [
        "education_center",
        "education_level",
        "occupation",
        "work_company",
    ],
    # Contenedor (sin campos propios; ocultar arrastra a los hijos)
    "section-music": [],
    "section-music-spotify": ["mi_himno"],
    "section-music-genres": ["music_genres"],
    "section-identity": ["sexual_orientation"],
    "section-personality": [
        "social_style",
        "processing_style",
        "risk_tolerance",
        "decision_making",
    ],
    "section-cognitive": ["neurodiversity", "learning_preferences"],
    "section-wellness": ["disabilities", "health_conditions", "energy_level"],
    "section-status": ["relationship_status"],
    "section-languages": ["languages"],
}


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

    @classmethod
    async def hidden_keys(cls) -> Set[str]:
        """Keys de módulos con visible=False (no cuentan para el progreso)."""
        mods = await cls.find({"visible": False}).to_list()
        return {m.key for m in mods}
