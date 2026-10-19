"""Mapa extensible tag natural -> dimensión CARE canónica."""
from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CareDimensionMap(Document):
    """Traducción de una etiqueta natural a una de las 7 dimensiones CARE."""

    tag: str = Field(min_length=1, max_length=40)
    care_dimension: str

    class Settings:
        name = "care_dimension_map"
        indexes = [IndexModel([("tag", ASCENDING)], unique=True)]
