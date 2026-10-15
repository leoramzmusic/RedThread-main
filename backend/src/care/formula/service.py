"""CARE formula domain logic (pure helpers + DB wrappers)."""
import random
from typing import Any, Dict, List, Optional, Set, Tuple

from src.care.models.care_formula import CAREFormula
from src.models.algorithm_management import AlgorithmHistory, AlgorithmType

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


class FormulaValidationError(Exception):
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__("; ".join(errors))


class FormulaNoChangeError(Exception):
    pass


async def get_active_formula() -> Optional[CAREFormula]:
    return await CAREFormula.find_one({"status": "active"})


async def ensure_active_formula() -> CAREFormula:
    active = await get_active_formula()
    if active is not None:
        return active
    formula = CAREFormula(
        version=1,
        status="active",
        blocks=dict(CANONICAL_BLOCKS),
        chaos_factor=0.0,
        chaos_seed=None,
        min_compatibility=0.0,
        match_critical=0.15,
        changelog="Seed inicial canónico",
        created_by="system",
    )
    await CAREFormula.insert(formula)
    return formula


async def insert_new_formula(doc: CAREFormula) -> CAREFormula:
    await doc.insert()
    return doc


async def insert_history(entry: AlgorithmHistory) -> AlgorithmHistory:
    await entry.insert()
    return entry


def _config_tuple(formula: CAREFormula) -> Tuple[Dict[str, float], float, Optional[str], float, float]:
    return (
        dict(formula.blocks),
        formula.chaos_factor,
        formula.chaos_seed,
        formula.min_compatibility,
        formula.match_critical,
    )


async def save_new_version(payload: Dict[str, Any], admin_id: str, source: str) -> CAREFormula:
    errors = validate_formula_dict(payload)
    if errors:
        raise FormulaValidationError(errors)
    active = await ensure_active_formula()
    if _config_tuple(active) == (
        dict(payload["blocks"]),
        float(payload.get("chaos_factor", 0.0)),
        payload.get("chaos_seed"),
        float(payload.get("min_compatibility", 0.0)),
        float(payload.get("match_critical", 0.15)),
    ):
        raise FormulaNoChangeError("La fórmula no cambió respecto a la versión activa")

    max_doc = (
        await CAREFormula.find_all().sort("-version").limit(1).to_list()
    )
    next_version = (max_doc[0].version if max_doc else 0) + 1

    active.status = "archived"
    await active.save()

    new_formula = CAREFormula(
        version=next_version,
        status="active",
        blocks=dict(payload["blocks"]),
        chaos_factor=float(payload.get("chaos_factor", 0.0)),
        chaos_seed=payload.get("chaos_seed"),
        min_compatibility=float(payload.get("min_compatibility", 0.0)),
        match_critical=float(payload.get("match_critical", 0.15)),
        changelog=payload["changelog"],
        created_by=admin_id,
    )
    await insert_new_formula(new_formula)

    await insert_history(AlgorithmHistory(
        algorithm_type=AlgorithmType.COMPATIBILITY,
        factor_id=str(new_formula.id),
        action="save_formula",
        old_value=active.model_dump(mode="json"),
        new_value={**new_formula.model_dump(mode="json"), "source": source},
        modified_by=admin_id,
        comment=f"[{source}] {payload['changelog']}",
    ))
    return new_formula


async def rollback_to_version(version: int, admin_id: str, source: str = "api") -> CAREFormula:
    target = await CAREFormula.find_one({"version": version})
    if target is None:
        raise LookupError(f"La versión {version} no existe")
    active = await get_active_formula()
    if active is not None and active.id == target.id:
        return target
    if active is not None:
        active.status = "archived"
        await active.save()
    target.status = "active"
    await target.save()
    await insert_history(AlgorithmHistory(
        algorithm_type=AlgorithmType.COMPATIBILITY,
        factor_id=str(target.id),
        action="rollback_formula",
        old_value=active.model_dump(mode="json") if active else None,
        new_value={**target.model_dump(mode="json"), "source": source, "target_version": version},
        modified_by=admin_id,
        comment=f"[{source}] Rollback a v{version}",
    ))
    return target


async def list_versions(limit: int = 50) -> List[CAREFormula]:
    return await CAREFormula.find_all().sort("-version").limit(limit).to_list()


async def normalize_payload_blocks(blocks: Dict[str, float], locked: List[str]) -> Dict[str, float]:
    return normalize_blocks(blocks, set(locked))
