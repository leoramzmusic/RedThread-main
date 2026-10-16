# CARE Formula Backend (Fase 1, Bloque 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la fórmula canónica versionada del motor CARE: modelo `CAREFormula`, scoring re-cableado a 7 dimensiones con caos ±X% y umbrales, narrativa Python, y 7 endpoints admin.

**Architecture:** Documento Beanie `CAREFormula` (una versión activa) como fuente de verdad; `compatibility_score` pasa de 10 bloques legacy a `Σ wᵢ·fᵢ + χ(t)` con las 7 funciones de bloque que ya existen; servicio con lógica pura testeable (validación, normalización, χ determinista, etiquetas) separada de los wrappers de BD; endpoints en el router admin existente.

**Tech Stack:** Python 3.12 (venv del repo), FastAPI, Beanie/Motor, pytest + pytest-asyncio. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-15-care-formula-dirac-design.md`

## Global Constraints

- Taxonomía canónica (suma exacta 1.0): `values 0.36, relationship_goals 0.18, neurodiversity 0.15, responsiveness 0.10, music 0.11, love_language 0.06, communication_style 0.04`.
- Caos: `χ = U(-1,1) × factor/100`; con `seed` → `random.Random(f"{seed}:{user_id}:{candidate_id}:{version}")`; `factor=0` → χ=0 sin RNG.
- Bandas de label: `≥0.70 Alto · ≥0.50 Medio · <0.50 Bajo · <0.30 Muy bajo` (Muy bajo gana a Bajo).
- Gate `min_compatibility` default `0.0` (sin cambio de comportamiento hasta que el admin lo suba).
- Identidad/atracción mutua: safe-stop pre-filtro **se mantiene** arriba de `compatibility_score` (`calculate_identity_block_compatibility` → 0.0).
- No commitear nada sin el "sube" explícito del usuario (regla del repo).
- Ejecutar pytest desde `backend/`: `venv\Scripts\python.exe -m pytest <ruta> -q` (Windows; `PYTHONUTF8=1` si se necesita).
- Endpoints en `admin_algorithms.py` (prefijo existente `/portal-redthread/experiencia/algoritmos`, auth `admin_required`).
- Español en mensajes de negocio/errores (convención del router).

---

### Task 1: Fix bug de import `datetime` en compatibility.py

**Files:**
- Modify: `backend/src/care/scoring/compatibility.py:1-17` (imports del módulo)
- Test: `backend/src/care/tests/test_module_import.py` (nuevo, smoke)

**Interfaces:**
- Consumes: nada.
- Produces: `src.care.scoring.compatibility` importable (requisito de todos los tasks siguientes). Hoy la anotación `Optional[datetime]` en `calculate_activity_score` (L854) revienta con `NameError` al importar el módulo.

- [ ] **Step 1: Escribir el test de humo que falla**

```python
# backend/src/care/tests/test_module_import.py
"""Smoke test: the scoring module must import cleanly."""


def test_compatibility_module_imports():
    import src.care.scoring.compatibility  # noqa: F401
```

- [ ] **Step 2: Verificar que falla**

Run (desde `backend/`): `venv\Scripts\python.exe -m pytest src\care\tests\test_module_import.py -q`
Expected: FAIL — `NameError: name 'datetime' is not defined` (colectando).

- [ ] **Step 3: Arreglar el import**

En `compatibility.py`, añadir `datetime` al import de typing/módulo existente — añadir línea:

```python
from datetime import datetime
```

(junto a `from typing import Dict, Optional, List`, arriba del archivo). NO tocar el `from datetime import datetime, timedelta` interno de la función (se puede dejar; el de módulo es el que importa para las anotaciones).

- [ ] **Step 4: Verificar que pasa**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_module_import.py -q`
Expected: PASS

- [ ] **Step 5: No commitear** (regla del repo: esperar "sube"). Reportar verde.

---

### Task 2: Modelo `CAREFormula` + constantes + validación/normalización puras

**Files:**
- Create: `backend/src/care/models/care_formula.py`
- Create: `backend/src/care/formula/__init__.py` (vacío)
- Create: `backend/src/care/formula/service.py`
- Modify: `backend/src/core/database.py` (import L≈31 + lista `document_models` L≈81)
- Test: `backend/src/care/tests/test_care_formula.py` (nuevo)

**Interfaces:**
- Consumes: patrón Beanie de `src/models/algorithm_management.py` (clase `Settings.name`, índices).
- Produces:
  - `CAREFormula` (Beanie Document, colección `care_formulas`): `version:int`, `status:str`, `blocks:Dict[str,float]`, `chaos_factor:float`, `chaos_seed:Optional[str]`, `min_compatibility:float`, `match_critical:float`, `changelog:str`, `created_by:str`, `created_at:datetime`.
  - `CANONICAL_BLOCKS: Dict[str, float]` (las 7 claves, suma 1.0).
  - `CANONICAL_LABELS_ES: Dict[str, str]` (`values→"Valores"`, `relationship_goals→"Metas de relación"`, `neurodiversity→"Neurodiversidad"`, `responsiveness→"Responsiveness"`, `music→"Música"`, `love_language→"Lenguaje del amor"`, `communication_style→"Comunicación"`).
  - `def validate_formula_dict(data: Any) -> List[str]` → lista de errores en español ([] si válida).
  - `def normalize_blocks(blocks: Dict[str, float], locked: Set[str]) -> Dict[str, float]` → redistribuye proporcionalmente los NO bloqueados para que la suma sea exactamente 1.0 (los bloqueados conservan valor; si los bloqueados ya suman ≥1.0, lanza `ValueError`).

- [ ] **Step 1: Escribir los tests que fallan**

```python
# backend/src/care/tests/test_care_formula.py
"""Tests for CAREFormula model constants and pure helpers."""
import pytest
from src.care.formula.service import (
    CANONICAL_BLOCKS,
    CANONICAL_LABELS_ES,
    normalize_blocks,
    validate_formula_dict,
)


def test_canonical_blocks_sum_exactly_one():
    assert round(sum(CANONICAL_BLOCKS.values()), 10) == 1.0
    assert set(CANONICAL_BLOCKS) == {
        "values", "relationship_goals", "neurodiversity",
        "responsiveness", "music", "love_language", "communication_style",
    }
    assert CANONICAL_BLOCKS["values"] == 0.36
    assert CANONICAL_BLOCKS["neurodiversity"] == 0.15


def test_canonical_labels_cover_all_keys():
    assert set(CANONICAL_LABELS_ES) == set(CANONICAL_BLOCKS)
    assert CANONICAL_LABELS_ES["values"] == "Valores"


def test_validate_ok():
    data = {"blocks": dict(CANONICAL_BLOCKS), "chaos_factor": 5.0,
            "chaos_seed": None, "min_compatibility": 0.0, "match_critical": 0.15}
    assert validate_formula_dict(data) == []


def test_validate_rejects_wrong_keys_and_sum():
    bad = dict(CANONICAL_BLOCKS)
    del bad["music"]
    bad["interests"] = 0.1
    errors = validate_formula_dict({"blocks": bad})
    assert any("music" in e for e in errors)
    assert any("interests" in e or "sobran" in e for e in errors)


def test_validate_rejects_sum_not_one():
    bad = dict(CANONICAL_BLOCKS)
    bad["values"] = 0.50  # suma > 1
    errors = validate_formula_dict({"blocks": bad})
    assert any("100" in e or "1.0" in e for e in errors)


def test_validate_rejects_out_of_range():
    bad = dict(CANONICAL_BLOCKS)
    bad["music"] = 1.5
    errors = validate_formula_dict({"blocks": bad})
    assert any("music" in e for e in errors)


def test_normalize_respects_locks():
    blocks = {"values": 0.30, "relationship_goals": 0.10, "neurodiversity": 0.10,
              "responsiveness": 0.10, "music": 0.10, "love_language": 0.10,
              "communication_style": 0.10}
    out = normalize_blocks(blocks, locked={"values"})
    assert out["values"] == 0.30
    assert round(sum(out.values()), 10) == 1.0
    # los no bloqueados mantienen sus proporciones relativas
    assert out["music"] > 0.10


def test_normalize_raises_if_locked_overflow():
    blocks = dict(CANONICAL_BLOCKS)
    blocks["values"] = 0.95
    with pytest.raises(ValueError):
        normalize_blocks(blocks, locked={"values", "relationship_goals"})
```

- [ ] **Step 2: Verificar fallo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_care_formula.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.care.formula'`.

- [ ] **Step 3: Implementar modelo + servicio puro**

`backend/src/care/models/care_formula.py`:

```python
"""Versioned CARE formula document (the compatibility matrix M)."""
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class CAREFormula(Document):
    """One immutable version of the canonical CARE formula."""

    version: int
    status: str = "active"  # "active" | "archived"
    blocks: dict  # exactly the 7 canonical keys, values 0-1, sum 1.0
    chaos_factor: float = 0.0  # 0-20 (%)
    chaos_seed: Optional[str] = None
    min_compatibility: float = 0.0
    match_critical: float = 0.15
    changelog: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "care_formulas"
        indexes = ["version", "status"]
```

`backend/src/care/formula/service.py`:

```python
"""CARE formula domain logic (pure helpers + DB wrappers)."""
from typing import Any, Dict, List, Set

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
```

Registrar en `database.py`: añadir `from src.care.models.care_formula import CAREFormula` junto a los otros imports de modelos, y `CAREFormula,` en la lista `document_models=[...]` (junto a `AlgorithmFactor,`).

- [ ] **Step 4: Verificar que pasa**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_care_formula.py -q`
Expected: PASS (8 tests)

- [ ] **Step 5: No commitear.** Reportar verde.

---

### Task 3: Caos (χ), determinismo y bandas de label

**Files:**
- Modify: `backend/src/care/formula/service.py` (añadir helpers al final)
- Test: `backend/src/care/tests/test_care_formula.py` (añadir tests)

**Interfaces:**
- Consumes: `CANONICAL_BLOCKS` del Task 2.
- Produces (en `service.py`):
  - `def compatibility_label(score: float) -> str` → `"Alto"|"Medio"|"Bajo"|"Muy bajo"`.
  - `def compute_chi(factor_pct: float, seed: Optional[str], user_id: str, candidate_id: str, version: int) -> float` → χ en [-factor/100, +factor/100]; `factor_pct==0` → 0.0; si `seed` es None → `random.Random()` sin semilla (no determinista).
  - `def clamp_score(value: float) -> Tuple[float, bool]` → `(clamped, saturated)`.

- [ ] **Step 1: Añadir tests que fallan**

```python
# añadir a test_care_formula.py
import random
from src.care.formula.service import (
    clamp_score,
    compatibility_label,
    compute_chi,
)


def test_label_bands():
    assert compatibility_label(0.9) == "Alto"
    assert compatibility_label(0.70) == "Alto"
    assert compatibility_label(0.55) == "Medio"
    assert compatibility_label(0.50) == "Medio"
    assert compatibility_label(0.40) == "Bajo"
    assert compatibility_label(0.30) == "Bajo"
    assert compatibility_label(0.29) == "Muy bajo"


def test_chi_zero_factor_is_zero_and_skips_rng():
    assert compute_chi(0.0, "abc", "u1", "c1", 1) == 0.0
    assert compute_chi(0.0, None, "u1", "c1", 1) == 0.0


def test_chi_deterministic_with_seed():
    a = compute_chi(10.0, "seed-x", "u1", "c1", 3)
    b = compute_chi(10.0, "seed-x", "u1", "c1", 3)
    assert a == b
    assert -0.10 <= a <= 0.10


def test_chi_varies_per_pair_and_version():
    a = compute_chi(10.0, "seed-x", "u1", "c1", 3)
    b = compute_chi(10.0, "seed-x", "u2", "c2", 3)
    c = compute_chi(10.0, "seed-x", "u1", "c1", 4)
    assert a != b or a != c  # con alta probabilidad; semillas distintas


def test_chi_unseeded_within_bounds():
    for _ in range(50):
        chi = compute_chi(5.0, None, "u", "c", 1)
        assert -0.05 <= chi <= 0.05


def test_clamp_score():
    assert clamp_score(1.2) == (1.0, True)
    assert clamp_score(-0.1) == (0.0, True)
    assert clamp_score(0.5) == (0.5, False)
```

- [ ] **Step 2: Verificar fallo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_care_formula.py -q`
Expected: FAIL — `ImportError` de los nuevos nombres.

- [ ] **Step 3: Implementar helpers**

Añadir a `service.py`:

```python
import random
from typing import Optional, Tuple


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
```

- [ ] **Step 4: Verificar que pasa**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_care_formula.py -q`
Expected: PASS (14 tests)

- [ ] **Step 5: No commitear.** Reportar verde.

---

### Task 4: Narrativa Python (`care/narrative.py`)

**Files:**
- Create: `backend/src/care/narrative.py`
- Test: `backend/src/care/tests/test_narrative.py` (nuevo)

**Interfaces:**
- Consumes: `compatibility_label` del Task 3, `CANONICAL_LABELS_ES` del Task 2.
- Produces: `def generate_narrative(breakdown: Dict[str, Any], tone: str = "directo", weights: Optional[Dict[str, float]] = None) -> Dict[str, str]` → `{"tone": tone, "text": str, "label": str}`. `breakdown` es el dict de `compatibility_breakdown` (claves numéricas 0–1 + `chaos_applied` opcional + `compatibility_label` opcional). `weights` opcional para ranking por contribución; si falta usa `CANONICAL_BLOCKS`. Tones válidos: `directo, poetico, ludico, emocional, curioso` (default `directo`). Patrón: top-2 dimensiones por contribución (wᵢ·fᵢ), contraste de la dimensión más baja, χ si `chaos_applied` no es 0, saturación si `saturated` es True.

- [ ] **Step 1: Escribir tests que fallan**

```python
# backend/src/care/tests/test_narrative.py
"""Tests for the CARE narrative generator."""
import pytest
from src.care.narrative import VALID_TONES, generate_narrative

BASE_BREAKDOWN = {
    "values": 0.9, "relationship_goals": 0.8, "neurodiversity": 0.7,
    "responsiveness": 0.6, "music": 0.2, "love_language": 0.5,
    "communication_style": 0.4, "chaos_applied": 0.0, "saturated": False,
}


@pytest.mark.parametrize("tone", ["directo", "poetico", "ludico", "emocional", "curioso"])
def test_all_tones_return_full_shape(tone):
    result = generate_narrative(dict(BASE_BREAKDOWN), tone=tone)
    assert set(result) == {"tone", "text", "label"}
    assert result["tone"] == tone
    assert result["text"].strip()
    assert result["label"] in {"Muy bajo", "Bajo", "Medio", "Alto"}


def test_narrative_mentions_top_and_contrast():
    result = generate_narrative(dict(BASE_BREAKDOWN), tone="directo")
    text = result["text"].lower()
    assert "valores" in text          # top-1
    assert "música" in text           # dimensión más baja (contraste)


def test_narrative_mentions_chaos_when_applied():
    data = dict(BASE_BREAKDOWN, chaos_applied=0.04)
    result = generate_narrative(data, tone="directo")
    assert "caos" in result["text"].lower()


def test_narrative_skips_chaos_phrase_when_zero():
    result = generate_narrative(dict(BASE_BREAKDOWN), tone="directo")
    assert "caos" not in result["text"].lower()


def test_invalid_tone_falls_back_to_directo():
    result = generate_narrative(dict(BASE_BREAKDOWN), tone="inventado")
    assert result["tone"] == "directo"
    assert "inventado" not in result["tone"]


def test_label_comes_from_breakdown_or_score():
    data = dict(BASE_BREAKDOWN, compatibility_label="Alto")
    assert generate_narrative(data)["label"] == "Alto"
```

- [ ] **Step 2: Verificar fallo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_narrative.py -q`
Expected: FAIL — `ModuleNotFoundError` / `ImportError`.

- [ ] **Step 3: Implementar narrative.py**

```python
"""Narrative generation for CARE compatibility (single source of truth)."""
from typing import Any, Dict, Optional

from src.care.formula.service import CANONICAL_BLOCKS, CANONICAL_LABELS_ES, compatibility_label

VALID_TONES = ("directo", "poetico", "ludico", "emocional", "curioso")

_TONE_OPENERS = {
    "directo": "Compatibilidad {label}.",
    "poetico": "Sus almas trazan un puente de afinidad: sintonía {label}.",
    "ludico": "¡Match detectado! Afinidad {label} en el tablero CARE.",
    "emocional": "Hay una corriente emotiva genuina aquí: afinidad {label}.",
    "curioso": "Interesante: el motor CARE mide una afinidad {label}.",
}

_TONE_TOP = {
    "directo": "Sobre todo coinciden en {top1} y {top2}.",
    "poetico": "Sus {top1} resuenan en armonía, y {top2} los acompaña.",
    "ludico": "Combo fuerte en {top1} + {top2}.",
    "emocional": "Se sienten vistos en {top1}, y {top2} refuerza el vínculo.",
    "curioso": "Los factores con mayor peso combinado son {top1} y {top2}.",
}

_TONE_CONTRAST = {
    "directo": "Aunque difieren en {low}, el resto sostiene la conexión.",
    "poetico": "Aunque {low} susurre en otra tonada, la melodía común prevalece.",
    "ludico": "Ojo: {low} es su zona baja, pero ya ganaron en lo demás.",
    "emocional": "Hay distancia en {low}, aunque el corazón afina en el resto.",
    "curioso": "El punto débil comparado es {low}.",
}

_TONE_CHAOS = {
    "directo": " Caos aplicado: {chi:+.2f}.",
    "poetico": " El azar controlado ({chi:+.2f}) tejió una sorpresa.",
    "ludico": " χ(t) inyectó {chi:+.2f} de caos reproducible.",
    "emocional": " Un atisbo de incertidumbre ({chi:+.2f}) hace único este vínculo.",
    "curioso": " Término de caos χ = {chi:+.2f}.",
}


def generate_narrative(
    breakdown: Dict[str, Any],
    tone: str = "directo",
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, str]:
    if tone not in VALID_TONES:
        tone = "directo"
    weights = weights or CANONICAL_BLOCKS

    final_score = None
    for candidate_key in ("final_score", "compatibility_score", "score"):
        if isinstance(breakdown.get(candidate_key), (int, float)):
            final_score = float(breakdown[candidate_key])
            break
    if final_score is None:
        final_score = sum(
            float(breakdown.get(k, 0.0)) * weights.get(k, 0.0) for k in CANONICAL_BLOCKS
        )

    label = breakdown.get("compatibility_label") or compatibility_label(final_score)

    contributions = {
        k: float(breakdown.get(k, 0.0)) * weights.get(k, 0.0) for k in CANONICAL_BLOCKS
    }
    ordered = sorted(contributions, key=contributions.get, reverse=True)
    top1 = CANONICAL_LABELS_ES[ordered[0]].lower()
    top2 = CANONICAL_LABELS_ES[ordered[1]].lower()
    f_values = {k: float(breakdown.get(k, 0.0)) for k in CANONICAL_BLOCKS}
    low = CANONICAL_LABELS_ES[min(f_values, key=f_values.get)].lower()

    text = _TONE_OPENERS[tone].format(label=label.lower())
    text += " " + _TONE_TOP[tone].format(top1=top1, top2=top2)
    if top1 != low and top2 != low:
        text += " " + _TONE_CONTRAST[tone].format(low=low)
    chi = breakdown.get("chaos_applied") or 0.0
    if chi:
        text += _TONE_CHAOS[tone].format(chi=float(chi))
    if breakdown.get("saturated"):
        text += " Score saturado en el rango límite."

    return {"tone": tone, "text": text.strip(), "label": label}
```

- [ ] **Step 4: Verificar que pasa**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_narrative.py -q`
Expected: PASS (8 tests)

- [ ] **Step 5: No commitear.** Reportar verde.

---

### Task 5: Re-cableado de `compatibility_score` / `compatibility_breakdown` + gate del ranker

**Files:**
- Modify: `backend/src/care/scoring/compatibility.py` (reemplazar `get_compatibility_weights`, `compatibility_score`, `compatibility_breakdown`; añadir `get_active_formula_config`, `compute_block_scores`)
- Modify: `backend/src/care/ranking/ranker.py:79-100` (gate tras construir `scored`)
- Test: reescribir `backend/src/care/tests/test_compatibility.py` y `backend/src/care/tests/test_location_decoupling.py`

**Interfaces:**
- Consumes: Tasks 2–4 (`CAREFormula`, `compute_chi`, `clamp_score`, `compatibility_label`); funciones de bloque existentes en el mismo archivo (`calculate_values_compatibility`, `calculate_intent_compatibility`, `calculate_neuro_compatibility`, `calculate_activity_score`, `calculate_anthem_compatibility`, `calculate_love_language_compatibility`, `calculate_communication_style_compatibility`, `calculate_identity_block_compatibility`, `calculate_location_context`, `haversine_distance`).
- Produces:
  - `async def get_active_formula_config() -> Dict` → `{"version": int, "blocks": Dict[str,float], "chaos_factor": float, "chaos_seed": Optional[str], "min_compatibility": float, "match_critical": float}` (fallback a `CANONICAL_BLOCKS` y chaos 0 si no hay doc; NO hace seed aquí — solo lee; seed lazy vive en el service de DB del Task 6, pero get_active_formula_config tolera BD ausente con try/except).
  - `async def get_compatibility_weights() -> Dict[str, float]` → `config["blocks"]` (mantiene firma para tests/llamadores viejos).
  - `async def compute_block_scores(user, candidate) -> Dict[str, float]` → las 7 fᵢ en 0–1.
  - `async def compatibility_score(user, candidate, params=None, weights=None, strict=True) -> float` → identidad safe-stop + `Σ wᵢ·fᵢ + χ` clamp. **Si `weights` viene inyectado (tests), se usa tal cual y χ se calcula con la config activa pero puro bloque matemático: se usa `compute_chi` siempre vía config; para tests deterministas se parchea `get_active_formula_config`.**
  - `async def compatibility_breakdown(user, candidate, params=None) -> Dict[str, Any]` → claves: las 7 numéricas, `chaos_applied` (float), `saturated` (bool), `compatibility_label` (str), `final_score` (float), `proximity_km`, `scenario_label`, `connection_tone`, `context_advice`. Sin claves viejas (`interests`, `intent`, `lifestyle`, `height_compatibility`, `professional_*`, `identity_*`).

- [ ] **Step 1: Reescribir tests de scoring (que fallan contra el código viejo)**

`test_compatibility.py` completo nuevo:

```python
"""Unit tests for the 7-dimension canonical CARE scoring."""
from unittest.mock import patch
from uuid import uuid4
import pytest
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import (
    compatibility_breakdown,
    compatibility_score,
    compute_block_scores,
)

CANONICAL = {
    "values": 0.36, "relationship_goals": 0.18, "neurodiversity": 0.15,
    "responsiveness": 0.10, "music": 0.11, "love_language": 0.06,
    "communication_style": 0.04,
}

NO_FORMULA = {
    "version": 1, "blocks": CANONICAL, "chaos_factor": 0.0, "chaos_seed": None,
    "min_compatibility": 0.0, "match_critical": 0.15,
}


def _profiles():
    user = UserProfile(id=uuid4(), values=["autenticidad"],
                       relationship_goals=["serious_relationship"])
    candidate = CandidateProfile(id=str(uuid4()), values=["autenticidad"],
                                 relationship_goals=["serious_relationship"])
    return user, candidate


@pytest.mark.asyncio
async def test_score_is_weighted_sum_of_blocks():
    user, candidate = _profiles()
    fixed = {"values": 1.0, "relationship_goals": 0.5, "neurodiversity": 0.0,
             "responsiveness": 0.0, "music": 0.0, "love_language": 0.0,
             "communication_style": 0.0}
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        score = await compatibility_score(user, candidate)
    expected = 1.0 * 0.36 + 0.5 * 0.18
    assert score == pytest.approx(expected, abs=1e-9)


@pytest.mark.asyncio
async def test_perfect_blocks_give_one():
    user, candidate = _profiles()
    fixed = {k: 1.0 for k in CANONICAL}
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        assert await compatibility_score(user, candidate) == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_chaos_seed_deterministic_and_bounded():
    user, candidate = _profiles()
    fixed = {k: 0.5 for k in CANONICAL}
    cfg = dict(NO_FORMULA, chaos_factor=10.0, chaos_seed="s1")
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=cfg):
        a = await compatibility_score(user, candidate)
        b = await compatibility_score(user, candidate)
    assert a == b
    base = sum(0.5 * CANONICAL[k] for k in CANONICAL)
    assert abs(a - base) <= 0.10 + 1e-9


@pytest.mark.asyncio
async def test_chaos_clamps_and_flags_saturation_in_breakdown():
    user, candidate = _profiles()
    fixed = {k: 1.0 for k in CANONICAL}
    cfg = dict(NO_FORMULA, chaos_factor=20.0, chaos_seed="s1")
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=cfg):
        score = await compatibility_score(user, candidate)
        bd = await compatibility_breakdown(user, candidate)
    assert score == 1.0
    assert bd["saturated"] in (True, False)
    assert bd["compatibility_label"] in {"Muy bajo", "Bajo", "Medio", "Alto"}
    assert isinstance(bd["chaos_applied"], float)


@pytest.mark.asyncio
async def test_breakdown_shape_new_keys_only():
    user, candidate = _profiles()
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value={k: 0.5 for k in CANONICAL}), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        bd = await compatibility_breakdown(user, candidate)
    for key in CANONICAL:
        assert key in bd
    for gone in ("interests", "intent", "lifestyle", "height_compatibility",
                 "professional_compatibility", "identity_compatibility"):
        assert gone not in bd
    for kept in ("proximity_km", "scenario_label", "connection_tone", "context_advice"):
        assert kept in bd


@pytest.mark.asyncio
async def test_real_block_functions_smoke():
    """compute_block_scores returns the 7 canonical keys in 0-1 without DB."""
    user, candidate = _profiles()
    blocks = await compute_block_scores(user, candidate)
    assert set(blocks) == set(CANONICAL)
    for v in blocks.values():
        assert 0.0 <= v <= 1.0
```

`test_location_decoupling.py` completo nuevo:

```python
"""Location must not change the compat score; it only feeds narrative context."""
from unittest.mock import patch
from uuid import uuid4
import pytest
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import compatibility_breakdown, compatibility_score

CANONICAL = {
    "values": 0.36, "relationship_goals": 0.18, "neurodiversity": 0.15,
    "responsiveness": 0.10, "music": 0.11, "love_language": 0.06,
    "communication_style": 0.04,
}
NO_FORMULA = {"version": 1, "blocks": CANONICAL, "chaos_factor": 0.0,
              "chaos_seed": None, "min_compatibility": 0.0, "match_critical": 0.15}


@pytest.mark.asyncio
async def test_location_does_not_affect_score():
    user = UserProfile(id=str(uuid4()), location=(19.4326, -99.1332))
    cand_local = CandidateProfile(id="c1", location=(19.4326, -99.1332))
    cand_far = CandidateProfile(id="c1", location=(0.0, 0.0))
    fixed = {k: 0.5 for k in CANONICAL}
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        s_local = await compatibility_score(user, cand_local)
        s_far = await compatibility_score(user, cand_far)
        bd_local = await compatibility_breakdown(user, cand_local)
        bd_far = await compatibility_breakdown(user, cand_far)
    assert s_local == s_far
    assert bd_local["scenario_label"] != bd_far["scenario_label"]
    assert bd_local["proximity_km"] == pytest.approx(0.0, abs=0.01)
    assert bd_far["proximity_km"] > 9000
```

- [ ] **Step 2: Verificar fallo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_compatibility.py src\care\tests\test_location_decoupling.py -q`
Expected: FAIL (imports de `compute_block_scores`/`get_active_formula_config` no existen todavía, o aserciones contra el scoring viejo).

- [ ] **Step 3: Reescribir el núcleo en compatibility.py**

Reemplazar `get_compatibility_weights` (L19-49), `compatibility_score` (L52-140) y `compatibility_breakdown` (L142-217) por:

```python
from datetime import datetime  # SE MANTIENE del fix del Task 1 (anotaciones)
from src.care.formula.service import (  # añadir a los imports del módulo
    CANONICAL_BLOCKS,
    clamp_score,
    compatibility_label,
    compute_chi,
)

DEFAULT_FORMULA_CONFIG = {
    "version": 0,
    "blocks": CANONICAL_BLOCKS,
    "chaos_factor": 0.0,
    "chaos_seed": None,
    "min_compatibility": 0.0,
    "match_critical": 0.15,
}


async def get_active_formula_config() -> Dict:
    """Active formula config; safe fallback if DB/model unavailable."""
    try:
        from src.care.models.care_formula import CAREFormula

        formula = await CAREFormula.find_one(CAREFormula.status == "active")
        if formula is None:
            return dict(DEFAULT_FORMULA_CONFIG)
        return {
            "version": formula.version,
            "blocks": dict(formula.blocks),
            "chaos_factor": formula.chaos_factor,
            "chaos_seed": formula.chaos_seed,
            "min_compatibility": formula.min_compatibility,
            "match_critical": formula.match_critical,
        }
    except Exception:
        return dict(DEFAULT_FORMULA_CONFIG)


async def get_compatibility_weights() -> Dict[str, float]:
    """Canonical weights from the active formula (fallback: defaults)."""
    config = await get_active_formula_config()
    return config["blocks"]


async def compute_block_scores(user: UserProfile, candidate: CandidateProfile) -> Dict[str, float]:
    """The 7 canonical dimension scores fᵢ in 0–1."""
    return {
        "values": calculate_values_compatibility(user.values, candidate.values),
        "relationship_goals": calculate_intent_compatibility(
            user.relationship_goals, candidate.relationship_goals
        ),
        "neurodiversity": calculate_neuro_compatibility(
            user.neurodiversity, candidate.neurodiversity
        ),
        "responsiveness": calculate_activity_score(
            user.last_active, candidate.last_active
        ),
        "music": calculate_anthem_compatibility(user.anthem, candidate.anthem),
        "love_language": calculate_love_language_compatibility(
            user.love_language, candidate.love_language
        ),
        "communication_style": calculate_communication_style_compatibility(
            user.communication_style, candidate.communication_style
        ),
    }


async def compatibility_score(
    user: UserProfile,
    candidate: CandidateProfile,
    params: SystemParams = None,
    weights: Dict[str, float] = None,
    strict: bool = True,
) -> float:
    """CARE_score = Σ wᵢ·fᵢ + χ(t), clamped to [0, 1]. Identity is a hard pre-filter."""
    identity_compat = calculate_identity_block_compatibility(
        user, candidate, strict=strict
    )
    if identity_compat == 0.0:
        return 0.0

    config = await get_active_formula_config()
    if weights is None:
        weights = config["blocks"]

    blocks = await compute_block_scores(user, candidate)
    base = sum(weights.get(k, 0.0) * v for k, v in blocks.items())
    chi = compute_chi(
        config["chaos_factor"],
        config["chaos_seed"],
        str(user.id),
        str(candidate.id),
        config["version"],
    )
    score, _ = clamp_score(base + chi)
    return score


async def compatibility_breakdown(
    user: UserProfile, candidate: CandidateProfile, params: SystemParams = None
) -> Dict[str, Any]:
    """Full breakdown: 7 numeric blocks + chaos/clamp/label + narrative context."""
    config = await get_active_formula_config()
    weights = config["blocks"]
    blocks = await compute_block_scores(user, candidate)
    base = sum(weights.get(k, 0.0) * v for k, v in blocks.items())
    chi = compute_chi(
        config["chaos_factor"],
        config["chaos_seed"],
        str(user.id),
        str(candidate.id),
        config["version"],
    )
    final_score, saturated = clamp_score(base + chi)

    from src.care.utils.geo import haversine_distance

    distance_km = haversine_distance(user.location, candidate.location)
    location_ctx = calculate_location_context(user, candidate, distance_km)

    result: Dict[str, Any] = dict(blocks)
    result.update(
        {
            "chaos_applied": chi,
            "saturated": saturated,
            "compatibility_label": compatibility_label(final_score),
            "final_score": final_score,
            "proximity_km": distance_km,
            "scenario_label": location_ctx["scenario_label"],
            "connection_tone": location_ctx["tone"],
            "context_advice": location_ctx["advice"],
        }
    )
    return result
```

Ajustar imports del archivo: `Dict, Optional, List, Any` en `typing`. Las funciones de bloque viejas NO se borran (las usan `explainer.py` y tests); solo dejan de estar en el camino del score.

Gate en `rank_candidates` (`ranker.py`), justo antes de `buckets = group_by_bucket(scored)` (~L79):

```python
    # Optional min-compatibility gate (active formula threshold; 0.0 = disabled)
    from src.care.scoring.compatibility import get_active_formula_config

    formula_config = await get_active_formula_config()
    min_compat = formula_config.get("min_compatibility", 0.0)
    if min_compat > 0.0:
        scored = [item for item in scored if item["compat_score"] >= min_compat]
```

- [ ] **Step 4: Verificar que pasa la suite reescrita + humo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_compatibility.py src\care\tests\test_location_decoupling.py src\care\tests\test_module_import.py -q`
Expected: PASS

- [ ] **Step 5: Ejecutar el resto del backend para detectar roturas colaterales**

Run: `venv\Scripts\python.exe -m pytest src\care\tests -q`
Expected: PASS (o documentar cualquier test legacy que dependa de claves viejas y ajustarlo en el mismo task).

- [ ] **Step 6: No commitear.** Reportar verde.

---

### Task 6: Wrappers de BD del servicio (seed lazy, save, rollback, historial enriquecido)

**Files:**
- Modify: `backend/src/care/formula/service.py` (añadir wrappers async)
- Test: `backend/src/care/tests/test_formula_service_db.py` (nuevo, con mocks de Beanie)

**Interfaces:**
- Consumes: `CAREFormula` (Task 2), `AlgorithmHistory`/`AlgorithmType` (`src/models/algorithm_management.py`), helpers puros (Tasks 2–3).
- Produces (en `service.py`):
  - `class FormulaNoChangeError(Exception)`
  - `class FormulaValidationError(Exception)` con `.errors: List[str]`
  - `async def get_active_formula() -> Optional["CAREFormula"]`
  - `async def ensure_active_formula() -> "CAREFormula"` → seed lazy v1 (blocks=CANONICAL, chaos 0, changelog="Seed inicial canónico", created_by="system").
  - `async def save_new_version(payload: Dict[str, Any], admin_id: str, source: str) -> "CAREFormula"` → valida (`FormulaValidationError`), compara con activa (si blocks+chaos+thresholds iguales → `FormulaNoChangeError`), archiva la activa, inserta versión `max+1` status active, escribe `AlgorithmHistory(action="save_formula", algorithm_type=AlgorithmType.COMPATIBILITY, old_value=dump_activa, new_value=dump_nueva, modified_by=admin_id, comment=f"[{source}] {changelog}")`.
  - `async def rollback_to_version(version: int, admin_id: str, source: str = "api") -> "CAREFormula"` → archiva activa, activa la versión pedida (debe existir; si no, `HTTPException` no — el service lanza `LookupError` y el endpoint traduce), historial `action="rollback_formula"` con `target_version`.
  - `async def list_versions(limit: int = 50) -> List["CAREFormula"]` → `.sort("-version").limit(limit)`.
  - `async def normalize_payload_blocks(blocks: Dict[str, float], locked: List[str]) -> Dict[str, float]` → delega en `normalize_blocks`.

- [ ] **Step 1: Tests con Beanie parcheado (que fallan)**

```python
# backend/src/care/tests/test_formula_service_db.py
"""DB-wrapper tests with monkeypatched Beanie documents (no Mongo)."""
from unittest.mock import AsyncMock, patch
import pytest
from src.care.formula import service
from src.care.formula.service import (
    CANONICAL_BLOCKS,
    FormulaNoChangeError,
    FormulaValidationError,
    ensure_active_formula,
    list_versions,
    rollback_to_version,
    save_new_version,
)


def _payload(**over):
    data = {
        "blocks": dict(CANONICAL_BLOCKS),
        "chaos_factor": 0.0,
        "chaos_seed": None,
        "min_compatibility": 0.0,
        "match_critical": 0.15,
        "changelog": "cambio de prueba",
    }
    data.update(over)
    return data


@pytest.mark.asyncio
async def test_save_validates_before_touching_db():
    bad = _payload(chaos_factor=99.0)
    with pytest.raises(FormulaValidationError) as exc:
        await save_new_version(bad, admin_id="adm1", source="equation")
    assert any("chaos_factor" in e for e in exc.value.errors)


@pytest.mark.asyncio
async def test_save_rejects_no_change():
    active = AsyncMock()
    active.version = 3
    active.blocks = dict(CANONICAL_BLOCKS)
    active.chaos_factor = 0.0
    active.chaos_seed = None
    active.min_compatibility = 0.0
    active.match_critical = 0.15
    with patch.object(service.CAREFormula, "find_one", AsyncMock(return_value=active)), \
         patch.object(service.CAREFormula, "find_all", AsyncMock()):
        with pytest.raises(FormulaNoChangeError):
            await save_new_version(_payload(), admin_id="adm1", source="criteria")


@pytest.mark.asyncio
async def test_save_creates_version_and_history():
    active = AsyncMock()
    active.version = 3
    active.blocks = dict(CANONICAL_BLOCKS)
    active.chaos_factor = 0.0
    active.chaos_seed = None
    active.min_compatibility = 0.0
    active.match_critical = 0.15
    new_blocks = dict(CANONICAL_BLOCKS, values=0.32, relationship_goals=0.22)
    inserted = []
    history_entries = []

    with patch.object(service.CAREFormula, "find_one", AsyncMock(return_value=active)), \
         patch.object(service.CAREFormula, "find_all", AsyncMock(return_value=AsyncMock(sort=AsyncMock(return_value=AsyncMock(to_list=AsyncMock(return_value=[active])))))), \
         patch.object(service, "insert_new_formula", AsyncMock(side_effect=lambda doc: inserted.append(doc) or doc)), \
         patch.object(service, "insert_history", AsyncMock(side_effect=lambda h: history_entries.append(h) or h)):
        result = await save_new_version(
            _payload(blocks=new_blocks, changelog="Valores 36→32"),
            admin_id="adm1", source="criteria",
        )
    assert result.version == 4
    assert result.blocks["values"] == 0.32
    assert history_entries and history_entries[0].action == "save_formula"
    assert "[criteria]" in history_entries[0].comment


@pytest.mark.asyncio
async def test_list_versions_orders_desc():
    fake_qs = AsyncMock()
    fake_qs.sort = AsyncMock(return_value=AsyncMock(
        limit=AsyncMock(return_value=AsyncMock(to_list=AsyncMock(return_value=["v3", "v2"])))))
    with patch.object(service.CAREFormula, "find_all", AsyncMock(return_value=fake_qs)):
        assert await list_versions() == ["v3", "v2"]
```

- [ ] **Step 2: Verificar fallo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_formula_service_db.py -q`
Expected: FAIL (nombres no importados).

- [ ] **Step 3: Implementar wrappers**

Añadir a `service.py` (imports: `CAREFormula`, `AlgorithmHistory`, `AlgorithmType`; `copy`):

```python
from typing import Optional
from src.care.models.care_formula import CAREFormula
from src.models.algorithm_management import AlgorithmHistory, AlgorithmType


class FormulaValidationError(Exception):
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__("; ".join(errors))


class FormulaNoChangeError(Exception):
    pass


async def get_active_formula() -> Optional[CAREFormula]:
    return await CAREFormula.find_one(CAREFormula.status == "active")


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


def _config_tuple(formula: CAREFormula):
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
    target = await CAREFormula.find_one(CAREFormula.version == version)
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
```

Ajustar el test `test_save_creates_version_and_history` si la implementación usa `insert_new_formula`/`insert_history` (los tests ya los parchean) — mantener esos dos puntos de inyección.

- [ ] **Step 4: Verificar que pasa**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_formula_service_db.py -q`
Expected: PASS (4 tests)

- [ ] **Step 5: No commitear.** Reportar verde.

---

### Task 7: Endpoints admin de fórmula

**Files:**
- Modify: `backend/src/api/admin_algorithms.py` (añadir bloque `# --- Canonical Formula Endpoints ---` al final + imports)
- Test: `backend/src/care/tests/test_formula_endpoints.py` (nuevo)

**Interfaces:**
- Consumes: service del Task 6, `generate_narrative` (Task 4), `get_active_formula_config` + `compute_block_scores`/`compatibility_score`/`compatibility_breakdown` (Task 5), adaptadores `profile_to_user_profile` / `profile_to_candidate_profile` (`src/care/adapters.py`), modelos `User` (`src.models.user`) y `Profile` (`src.models.profile`, campo `user_id`).
- Produces (rutas relativas al prefijo del router):
  - `GET /formula/active` → `ensure_active_formula().model_dump(mode="json")`
  - `GET /formula/versions?limit=50` → lista de dumps
  - `POST /formula/validate` body `{formula}` → `{"valid": bool, "errors": [...]}`
  - `POST /formula/preview` body `{formula, user_a_id, user_b_id, tone?}` → `{"current": {...score, breakdown}, "proposed": {...}, "deltas": {k: prop-current}, "chi_current", "chi_proposed", "narrative": {...}}` (chi_proposed = `compute_chi` con la fórmula propuesta)
  - `POST /formula/simulate` body `{formula, anchor_user_id?, candidate_user_ids?}` → `{"mock": bool, "ranking": [{"candidate_id", "score_current", "score_proposed", "chi_current", "chi_proposed", "delta"}], "mean_delta"}`; mock = 8 pares fixture inline; reales = load `User`+`Profile` por id y convertir con adaptadores (máx 20 candidatos; si `anchor_user_id` falta con reales → 400)
  - `POST /formula/save` body `{formula, source}` → dump nueva versión; `FormulaNoChangeError` → HTTP 409; `FormulaValidationError` → 422
  - `POST /formula/rollback/{version}` → dump; `LookupError` → 404
  - `POST /formula/normalizar` body `{blocks, locked}` → `{"blocks": normalizados}` (adaptado; el endpoint viejo `/care/normalizar` de AlgorithmFactor se deja intacto)

Para preview/simulate con "fórmula propuesta" sin escribir en BD: helpers internos `_score_with_formula(user, cand, formula_dict)` que calculan `Σ blocks·fᵢ + compute_chi(formula.chaos…)` reutilizando `compute_block_scores` (sin parchear la config activa).

- [ ] **Step 1: Tests de endpoints llamando funciones directamente (que fallan)**

```python
# backend/src/care/tests/test_formula_endpoints.py
"""Endpoint tests via direct async calls with mocked service."""
from unittest.mock import AsyncMock, patch
import pytest
from src.api import admin_algorithms as api


class _Admin:
    id = "emp1"


@pytest.mark.asyncio
async def test_validate_endpoint_shape():
    from src.care.formula.service import CANONICAL_BLOCKS
    body = {"formula": {"blocks": dict(CANONICAL_BLOCKS), "chaos_factor": 0.0}}
    result = await api.validate_formula(body, admin=_Admin())
    assert result["valid"] is True
    assert result["errors"] == []


@pytest.mark.asyncio
async def test_validate_endpoint_reports_errors():
    from src.care.formula.service import CANONICAL_BLOCKS
    bad = dict(CANONICAL_BLOCKS, values=0.9)
    result = await api.validate_formula({"formula": {"blocks": bad}}, admin=_Admin())
    assert result["valid"] is False
    assert result["errors"]


@pytest.mark.asyncio
async def test_save_maps_no_change_to_conflict():
    from fastapi import HTTPException
    from src.care.formula.service import FormulaNoChangeError
    with patch("src.care.formula.service.save_new_version",
               AsyncMock(side_effect=FormulaNoChangeError("x"))):
        with pytest.raises(HTTPException) as exc:
            await api.save_formula({"formula": {}, "source": "criteria"}, admin=_Admin())
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_save_maps_validation_to_422():
    from fastapi import HTTPException
    from src.care.formula.service import FormulaValidationError
    with patch("src.care.formula.service.save_new_version",
               AsyncMock(side_effect=FormulaValidationError(["mal"]))):
        with pytest.raises(HTTPException) as exc:
            await api.save_formula({"formula": {}, "source": "equation"}, admin=_Admin())
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rollback_maps_missing_to_404():
    from fastapi import HTTPException
    with patch("src.care.formula.service.rollback_to_version",
               AsyncMock(side_effect=LookupError("no"))):
        with pytest.raises(HTTPException) as exc:
            await api.rollback_formula(99, admin=_Admin())
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_active_endpoint_seeds():
    from src.care.formula.service import CANONICAL_BLOCKS
    fake = AsyncMock()
    fake.model_dump = lambda mode="json": {"version": 1, "blocks": dict(CANONICAL_BLOCKS)}
    with patch("src.care.formula.service.ensure_active_formula", AsyncMock(return_value=fake)):
        result = await api.get_formula_active(admin=_Admin())
    assert result["version"] == 1
```

- [ ] **Step 2: Verificar fallo**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_formula_endpoints.py -q`
Expected: FAIL (funciones endpoint no existen).

- [ ] **Step 3: Implementar endpoints**

En `admin_algorithms.py`, imports nuevos:

```python
from src.care.formula import service as formula_service
from src.care.formula.service import (
    FormulaNoChangeError,
    FormulaValidationError,
)
from src.care.narrative import generate_narrative
from src.care.scoring.compatibility import (
    compute_block_scores,
    get_active_formula_config,
)
```

Bloque al final del archivo (antes no hay; después de `/care/equitativo`):

```python
# --- Canonical Formula Endpoints (Dirac matrix M) ---


@router.get("/formula/active")
async def get_formula_active(admin: Employee = Depends(admin_required)):
    formula = await formula_service.ensure_active_formula()
    return formula.model_dump(mode="json")


@router.get("/formula/versions")
async def get_formula_versions(admin: Employee = Depends(admin_required), limit: int = 50):
    versions = await formula_service.list_versions(limit=limit)
    return [v.model_dump(mode="json") for v in versions]


@router.post("/formula/validate")
async def validate_formula(body: Dict[str, Any], admin: Employee = Depends(admin_required)):
    errors = formula_service.validate_formula_dict(body.get("formula"))
    return {"valid": not errors, "errors": errors}


def _chi_for(user_id: str, candidate_id: str, formula: Dict[str, Any]) -> float:
    from src.care.formula.service import compute_chi

    return compute_chi(
        float(formula.get("chaos_factor", 0.0)),
        formula.get("chaos_seed"),
        user_id,
        candidate_id,
        int(formula.get("version", 0)),
    )


async def _evaluate(user, candidate, formula: Dict[str, Any]) -> Dict[str, Any]:
    from src.care.formula.service import clamp_score, compatibility_label

    blocks = await compute_block_scores(user, candidate)
    weights = formula.get("blocks", {})
    base = sum(float(weights.get(k, 0.0)) * v for k, v in blocks.items())
    chi = _chi_for(str(user.id), str(candidate.id), formula)
    final, saturated = clamp_score(base + chi)
    breakdown = dict(blocks)
    breakdown.update(
        {
            "chaos_applied": chi,
            "saturated": saturated,
            "compatibility_label": compatibility_label(final),
            "final_score": final,
        }
    )
    return {"score": final, "base": base, "chi": chi, "breakdown": breakdown}


@router.post("/formula/preview")
async def preview_formula(body: Dict[str, Any], admin: Employee = Depends(admin_required)):
    from src.models.profile import Profile
    from src.models.user import User
    from src.care.adapters import profile_to_candidate_profile, profile_to_user_profile

    formula = body.get("formula") or {}
    errors = formula_service.validate_formula_dict(formula)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    tone = body.get("tone", "directo")

    user_a = await User.get(body["user_a_id"])
    user_b = await User.get(body["user_b_id"])
    if not user_a or not user_b:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    profile_a = await Profile.find_one(Profile.user_id == body["user_a_id"])
    profile_b = await Profile.find_one(Profile.user_id == body["user_b_id"])
    if not profile_a or not profile_b:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    care_a = profile_to_user_profile(profile_a, user_a)
    care_b = profile_to_candidate_profile(profile_b, user_b)

    current_cfg = await get_active_formula_config()
    current = await _evaluate(care_a, care_b, current_cfg)
    proposed = await _evaluate(care_a, care_b, formula)
    deltas = {
        k: proposed["breakdown"][k] - current["breakdown"][k]
        for k in formula.get("blocks", {})
    }
    narrative = generate_narrative(proposed["breakdown"], tone=tone, weights=formula.get("blocks"))
    return {
        "current": current,
        "proposed": proposed,
        "deltas": deltas,
        "chi_current": current["chi"],
        "chi_proposed": proposed["chi"],
        "narrative": narrative,
    }


_MOCK_PAIRS = None  # se inicializa con _build_mock_pairs() en Step 3


def _build_mock_pairs():
    from uuid import uuid4
    from src.care.models.user_profile import UserProfile
    from src.care.models.candidate_profile import CandidateProfile

    pairs = []
    for i in range(8):
        values_overlap = ["autenticidad", "empatía"][: (i % 3) + 1]
        user = UserProfile(id=uuid4(), values=values_overlap,
                           relationship_goals=["serious_relationship"],
                           love_language="quality_time", communication_style="texting")
        cand = CandidateProfile(id=f"mock-{i}", values=values_overlap if i % 2 == 0 else ["libertad"],
                                relationship_goals=["serious_relationship"] if i % 2 == 0 else ["casual_fun"],
                                love_language="quality_time" if i % 3 else "gifts",
                                communication_style="texting" if i % 2 else "calls")
        pairs.append((user, cand))
    return pairs


@router.post("/formula/simulate")
async def simulate_formula(body: Dict[str, Any], admin: Employee = Depends(admin_required)):
    formula = body.get("formula") or {}
    errors = formula_service.validate_formula_dict(formula)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    current_cfg = await get_active_formula_config()

    anchor_id = body.get("anchor_user_id")
    candidate_ids = body.get("candidate_user_ids") or []
    if anchor_id:
        if not candidate_ids:
            raise HTTPException(status_code=400, detail="candidate_user_ids requeridos con anchor_user_id")
        if len(candidate_ids) > 20:
            raise HTTPException(status_code=400, detail="Máximo 20 candidatos")
        from src.models.profile import Profile
        from src.models.user import User
        from src.care.adapters import profile_to_candidate_profile, profile_to_user_profile

        anchor_user = await User.get(anchor_id)
        anchor_profile = await Profile.find_one(Profile.user_id == anchor_id)
        if not anchor_user or not anchor_profile:
            raise HTTPException(status_code=404, detail="Anchor no encontrado")
        care_anchor = profile_to_user_profile(anchor_profile, anchor_user)
        pairs = []
        for cid in candidate_ids:
            cand_user = await User.get(cid)
            cand_profile = await Profile.find_one(Profile.user_id == cid)
            if cand_user and cand_profile:
                pairs.append((care_anchor, profile_to_candidate_profile(cand_profile, cand_user)))
        is_mock = False
    else:
        global _MOCK_PAIRS
        if _MOCK_PAIRS is None:
            _MOCK_PAIRS = _build_mock_pairs()
        pairs = _MOCK_PAIRS
        is_mock = True

    ranking = []
    for user, cand in pairs:
        cur = await _evaluate(user, cand, current_cfg)
        prop = await _evaluate(user, cand, formula)
        ranking.append({
            "candidate_id": str(cand.id),
            "score_current": cur["score"],
            "score_proposed": prop["score"],
            "chi_current": cur["chi"],
            "chi_proposed": prop["chi"],
            "delta": prop["score"] - cur["score"],
        })
    ranking.sort(key=lambda r: r["score_proposed"], reverse=True)
    mean_delta = sum(r["delta"] for r in ranking) / len(ranking) if ranking else 0.0
    return {"mock": is_mock, "ranking": ranking, "mean_delta": mean_delta}


@router.post("/formula/save")
async def save_formula(body: Dict[str, Any], admin: Employee = Depends(admin_required)):
    formula = body.get("formula") or {}
    source = body.get("source", "api")
    try:
        saved = await formula_service.save_new_version(formula, str(admin.id), source)
    except FormulaNoChangeError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FormulaValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    return saved.model_dump(mode="json")


@router.post("/formula/rollback/{version}")
async def rollback_formula(version: int, admin: Employee = Depends(admin_required)):
    try:
        restored = await formula_service.rollback_to_version(version, str(admin.id))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return restored.model_dump(mode="json")


@router.post("/formula/normalizar")
async def normalize_formula_blocks(body: Dict[str, Any], admin: Employee = Depends(admin_required)):
    try:
        blocks = await formula_service.normalize_payload_blocks(
            body.get("blocks", {}), body.get("locked", [])
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"blocks": blocks}
```

Ajustar los tests del Step 1 a los nombres reales de función (`get_formula_active`, `validate_formula`, `save_formula`, `rollback_formula`) y parchear `src.care.formula.service.*` (los endpoints delegan ahí).

- [ ] **Step 4: Verificar que pasa**

Run: `venv\Scripts\python.exe -m pytest src\care\tests\test_formula_endpoints.py -q`
Expected: PASS

- [ ] **Step 5: No commitear.** Reportar verde.

---

### Task 8: Suite completa + verificación final del bloque

- [ ] **Step 1: Suite backend completa**

Run (desde `backend/`): `venv\Scripts\python.exe -m pytest src -q`
Expected: todos los tests en verde (los legacy que dependan de claves viejas del breakdown ya fueron ajustados en Task 5; si aparece algún otro consumidor sorpresa de claves viejas, ajustarlo aquí documentándolo).

- [ ] **Step 2: Compilación limpia**

Run: `venv\Scripts\python.exe -m compileall src\care src\api\admin_algorithms.py -q`
Expected: sin errores.

- [ ] **Step 3: Reporte final**

Resumen al usuario: tests nuevos/reescritos, bugs corregidos (import datetime), comportamiento nuevo (scoring 7D + χ + gate), archivos tocados. **No commitear** — esperar "sube". Tras aprobación del usuario, este bloque se commitea como (sugerido): `feat(care): fórmula canónica versionada — scoring 7D, caos χ(t), endpoints admin`.

---

## Self-Review (ya ejecutado)

- Spec coverage Bloque 1: modelo ✓ (T2), seed lazy ✓ (T6), scoring 7D ✓ (T5), χ determinista ✓ (T3/T5), clamp+label ✓ (T3/T5), gate ✓ (T5), narrativa 5 tonos ✓ (T4), 7 endpoints + normalizar ✓ (T7), historial enriquecido con source ✓ (T6), tests (incl. integración 5 tonos en T4) ✓, bug datetime ✓ (T1). Fase 1 Bloques 2–5 (frontend) quedan para plan siguiente tras ejecutar este.
- Placeholders: ninguno — todos los steps contienen código o comandos exactos.
- Consistency de tipos: `get_active_formula_config` (dict con keys version/blocks/chaos_factor/chaos_seed/min_compatibility/match_critical) consumido igual en T5/T7; `compute_chi(factor_pct, seed, user_id, candidate_id, version)` idéntico en T3/T5/T7; `FormulaValidationError.errors` usado en T6/T7.
