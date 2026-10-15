"""
Admin Algorithm Management API
Provides endpoints for controlling CARE and Compatibility algorithms.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from src.models.employee import Employee, EmployeeStatus
from src.api.admin.auth import get_current_employee
from src.models.algorithm_management import (
    AlgorithmFactor,
    AlgorithmHistory,
    ABTest,
    AlgorithmType,
)
from src.services.algorithm_service import AlgorithmService
from datetime import datetime
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

router = APIRouter()


def admin_required(current_employee: Employee = Depends(get_current_employee)):
    """Verifies that the employee is active."""
    if current_employee.status != EmployeeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta de empleado inactiva"
        )
    return current_employee


# --- CARE Algorithm Endpoints ---


@router.get("/care/factores", response_model=List[AlgorithmFactor])
async def get_care_factors(admin: Employee = Depends(admin_required)):
    """Retrieve all factors for the CARE algorithm."""
    return await AlgorithmFactor.find(
        AlgorithmFactor.algorithm_type == AlgorithmType.CARE
    ).to_list()


@router.post("/care/factor/add", response_model=AlgorithmFactor)
async def add_care_factor(
    factor_data: Dict[str, Any], admin: Employee = Depends(admin_required)
):
    """Add a new factor to the CARE algorithm."""
    factor = AlgorithmFactor(
        **factor_data, algorithm_type=AlgorithmType.CARE, last_modified_by=str(admin.id)
    )
    await factor.insert()

    # Log history
    history = AlgorithmHistory(
        algorithm_type=AlgorithmType.CARE,
        factor_id=str(factor.id),
        action="add_factor",
        old_value=None,
        new_value=factor.model_dump(mode="json"),
        modified_by=str(admin.id),
        comment="Nuevo factor agregado",
    )
    await history.insert()

    return factor


@router.post("/care/factor/update/{factor_id}", response_model=AlgorithmFactor)
async def update_care_factor(
    factor_id: str,
    update_data: Dict[str, Any],
    admin: Employee = Depends(admin_required),
):
    """Update an existing CARE algorithm factor."""
    factor = await AlgorithmFactor.get(factor_id)
    if not factor or factor.algorithm_type != AlgorithmType.CARE:
        raise HTTPException(status_code=404, detail="Factor no encontrado")

    old_value = factor.model_dump(mode="json")

    # Update fields
    for field, value in update_data.items():
        setattr(factor, field, value)

    factor.updated_at = datetime.utcnow()
    factor.last_modified_by = str(admin.id)
    await factor.save()

    # Log history
    history = AlgorithmHistory(
        algorithm_type=AlgorithmType.CARE,
        factor_id=factor_id,
        action="update_factor",
        old_value=old_value,
        new_value=factor.model_dump(mode="json"),
        modified_by=str(admin.id),
        comment=update_data.get("comment", "Factor actualizado"),
    )
    await history.insert()

    return factor


@router.get("/care/historial", response_model=List[AlgorithmHistory])
async def get_care_history(admin: Employee = Depends(admin_required), limit: int = 50):
    """Retrieve history of changes for the CARE algorithm."""
    return (
        await AlgorithmHistory.find(
            AlgorithmHistory.algorithm_type == AlgorithmType.CARE
        )
        .sort("-timestamp")
        .limit(limit)
        .to_list()
    )


# --- Compatibility Algorithm Endpoints ---


@router.get("/compatibilidad/criterios", response_model=List[AlgorithmFactor])
async def get_compatibility_criteria(admin: Employee = Depends(admin_required)):
    """Retrieve all criteria for the Compatibility algorithm."""
    return await AlgorithmFactor.find(
        AlgorithmFactor.algorithm_type == AlgorithmType.COMPATIBILITY
    ).to_list()


@router.post(
    "/compatibilidad/criterio/update/{criterio_id}", response_model=AlgorithmFactor
)
async def update_compatibility_criterion(
    criterio_id: str,
    update_data: Dict[str, Any],
    admin: Employee = Depends(admin_required),
):
    """Update an existing compatibility criterion."""
    criterion = await AlgorithmFactor.get(criterio_id)
    if not criterion or criterion.algorithm_type != AlgorithmType.COMPATIBILITY:
        raise HTTPException(status_code=404, detail="Criterio no encontrado")

    old_value = criterion.model_dump(mode="json")

    # Update fields
    for field, value in update_data.items():
        setattr(criterion, field, value)

    criterion.updated_at = datetime.utcnow()
    criterion.last_modified_by = str(admin.id)
    await criterion.save()

    # Log history
    history = AlgorithmHistory(
        algorithm_type=AlgorithmType.COMPATIBILITY,
        factor_id=criterio_id,
        action="update_criterion",
        old_value=old_value,
        new_value=criterion.model_dump(mode="json"),
        modified_by=str(admin.id),
        comment=update_data.get("comment", "Criterio actualizado"),
    )
    await history.insert()

    return criterion


@router.post("/compatibilidad/abtest/start", response_model=ABTest)
async def start_ab_test(
    test_data: Dict[str, Any], admin: Employee = Depends(admin_required)
):
    """Start a new A/B test for the compatibility algorithm."""
    test = ABTest(
        **test_data,
        created_by=str(admin.id),
        status="running",
        start_date=datetime.utcnow(),
    )
    await test.insert()

    # Log history
    history = AlgorithmHistory(
        algorithm_type=test.algorithm_type,
        action="start_ab_test",
        old_value=None,
        new_value=test.model_dump(mode="json"),
        modified_by=str(admin.id),
        comment=f"Iniciada prueba A/B: {test.name}",
    )
    await history.insert()

    return test


# --- Normalization Endpoints ---


@router.post("/care/normalizar", response_model=List[AlgorithmFactor])
async def normalize_care_weights(
    data: Dict[str, Any], admin: Employee = Depends(admin_required)
):
    """Normalizes CARE weights based on a manual change."""
    factor_id = data.get("factor_id")
    new_weight = data.get("new_weight")
    locked_ids = data.get("locked_ids", [])

    if factor_id is None or new_weight is None:
        raise HTTPException(
            status_code=400, detail="factor_id y new_weight son requeridos"
        )

    return await AlgorithmService.normalize_weights(
        AlgorithmType.CARE, factor_id, new_weight, locked_ids
    )


@router.post("/care/equitativo", response_model=List[AlgorithmFactor])
async def distribute_care_equitably(admin: Employee = Depends(admin_required)):
    """Distributes CARE weights equitably."""
    return await AlgorithmService.distribute_equitably(AlgorithmType.CARE)


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


_MOCK_PAIRS = None


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
