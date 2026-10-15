"""CARE formula domain logic (pure helpers + DB wrappers)."""
import random
from typing import Any, Dict, List, Optional, Set, Tuple

CANONICAL_BLOCKS: Dict[str, float] = {
    "values": 0.36,
    "relationship_goals": 0.18,
    "neurodiversity": 0.15,
    "responsiveness": 0.10,
    "music": 0.11,
    "love_language": 0.06,
    "communication_style": 0.04,
}

CANONICAL_LABELS_ES: Dict[str, str] = {
    "values": "Valores",
    "relationship_goals": "Metas de relación",
    "neurodiversity": "Neurodiversidad",
    "responsiveness": "Responsiveness",
    "music": "Música",
    "love_language": "Lenguaje del amor",
    "communication_style": "Comunicación",
}

_CHAOS_MIN, _CHAOS_MAX = 0.0, 20.0


def validate_formula_dict(data: Any) -> List[str]:
    """Return a list of Spanish errors; empty list means valid."""
    errors: List[str] = []
    if not isinstance(data, dict):
        return ["La fórmula debe ser un objeto JSON"]
    blocks = data.get("blocks")
    if not isinstance(blocks, dict):
        return ["Falta el objeto 'blocks'"]
    expected = set(CANONICAL_BLOCKS)
    got = set(blocks)
    for missing in sorted(expected - got):
        errors.append(f"Falta la dimensión '{missing}'")
    for extra in sorted(got - expected):
        errors.append(f"Dimensión desconocida '{extra}' (sobran claves)")
    for key in sorted(expected & got):
        value = blocks[key]
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            errors.append(f"Peso de '{key}' debe ser numérico")
        elif not (0.0 <= float(value) <= 1.0):
            errors.append(f"Peso de '{key}' fuera de rango 0–1: {value}")
    if not errors:
        total = round(sum(float(v) for v in blocks.values()), 10)
        if total != 1.0:
            errors.append(f"La suma de pesos debe ser exactamente 1.0 (100%), lleva {total:.2f}")
    chaos = data.get("chaos_factor", 0.0)
    if not isinstance(chaos, (int, float)) or isinstance(chaos, bool):
        errors.append("'chaos_factor' debe ser numérico")
    elif not (_CHAOS_MIN <= float(chaos) <= _CHAOS_MAX):
        errors.append(f"'chaos_factor' fuera de rango 0–20: {chaos}")
    return errors


def normalize_blocks(blocks: Dict[str, float], locked: Set[str]) -> Dict[str, float]:
    """Redistribute unlocked weights proportionally so the sum is exactly 1.0."""
    unknown = set(blocks) - set(CANONICAL_BLOCKS)
    if unknown:
        raise ValueError(f"Claves desconocidas: {sorted(unknown)}")
    locked_sum = sum(float(blocks[k]) for k in locked)
    if locked_sum >= 1.0:
        raise ValueError("Los pesos bloqueados ya suman 1.0 o más; no hay margen para redistribuir")
    free = [k for k in CANONICAL_BLOCKS if k not in locked]
    if not free:
        raise ValueError("Todas las dimensiones están bloqueadas; no hay pesos libres para redistribuir")
    free_current = sum(float(blocks[k]) for k in free)
    target_free = 1.0 - locked_sum
    out = {k: float(blocks[k]) for k in locked}
    if free_current <= 0:
        share = target_free / len(free)
        for k in free:
            out[k] = share
    else:
        for k in free:
            out[k] = float(blocks[k]) / free_current * target_free
    # Ajuste de redondeo en el último libre para suma exacta 1.0
    total_free = round(sum(out[k] for k in free), 10)
    diff = round(target_free - total_free, 10)
    if free and diff != 0:
        out[free[-1]] = round(out[free[-1]] + diff, 10)
    return out


def compatibility_label(score: float) -> str:
    if score >= 0.70:
        return "Alto"
    if score >= 0.50:
        return "Medio"
    if score >= 0.30:
        return "Bajo"
    return "Muy bajo"


def compute_chi(
    factor_pct: float,
    seed: Optional[str],
    user_id: str,
    candidate_id: str,
    version: int,
) -> float:
    """Chaos term χ(t): uniform in [-factor/100, +factor/100]; deterministic if seed set."""
    if not factor_pct:
        return 0.0
    if seed is None:
        rng = random.Random()
    else:
        rng = random.Random(f"{seed}:{user_id}:{candidate_id}:{version}")
    return rng.uniform(-1.0, 1.0) * (factor_pct / 100.0)


def clamp_score(value: float) -> Tuple[float, bool]:
    if value > 1.0:
        return 1.0, True
    if value < 0.0:
        return 0.0, True
    return value, False
