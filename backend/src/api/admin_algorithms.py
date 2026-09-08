"""
Admin Algorithm Management API
Provides endpoints for controlling CARE and Compatibility algorithms.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Dict, Any
from src.models.employee import Employee, EmployeeStatus
from src.api.admin.auth import get_current_employee
from src.models.algorithm_management import AlgorithmFactor, AlgorithmHistory, ABTest, AlgorithmType, FactorStatus
from src.services.algorithm_service import AlgorithmService
from datetime import datetime

router = APIRouter()

def admin_required(current_employee: Employee = Depends(get_current_employee)):
    """Verifies that the employee is active."""
    if current_employee.status != EmployeeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta de empleado inactiva"
        )
    return current_employee

# --- CARE Algorithm Endpoints ---

@router.get("/care/factores", response_model=List[AlgorithmFactor])
async def get_care_factors(admin: Employee = Depends(admin_required)):
    """Retrieve all factors for the CARE algorithm."""
    return await AlgorithmFactor.find(AlgorithmFactor.algorithm_type == AlgorithmType.CARE).to_list()

@router.post("/care/factor/add", response_model=AlgorithmFactor)
async def add_care_factor(
    factor_data: Dict[str, Any],
    admin: Employee = Depends(admin_required)
):
    """Add a new factor to the CARE algorithm."""
    factor = AlgorithmFactor(
        **factor_data,
        algorithm_type=AlgorithmType.CARE,
        last_modified_by=str(admin.id)
    )
    await factor.insert()
    
    # Log history
    history = AlgorithmHistory(
        algorithm_type=AlgorithmType.CARE,
        factor_id=str(factor.id),
        action="add_factor",
        old_value=None,
        new_value=factor.model_dump(mode='json'),
        modified_by=str(admin.id),
        comment="Nuevo factor agregado"
    )
    await history.insert()
    
    return factor

@router.post("/care/factor/update/{factor_id}", response_model=AlgorithmFactor)
async def update_care_factor(
    factor_id: str,
    update_data: Dict[str, Any],
    admin: Employee = Depends(admin_required)
):
    """Update an existing CARE algorithm factor."""
    factor = await AlgorithmFactor.get(factor_id)
    if not factor or factor.algorithm_type != AlgorithmType.CARE:
        raise HTTPException(status_code=404, detail="Factor no encontrado")
    
    old_value = factor.model_dump(mode='json')
    
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
        new_value=factor.model_dump(mode='json'),
        modified_by=str(admin.id),
        comment=update_data.get("comment", "Factor actualizado")
    )
    await history.insert()
    
    return factor

@router.get("/care/historial", response_model=List[AlgorithmHistory])
async def get_care_history(
    admin: Employee = Depends(admin_required),
    limit: int = 50
):
    """Retrieve history of changes for the CARE algorithm."""
    return await AlgorithmHistory.find(
        AlgorithmHistory.algorithm_type == AlgorithmType.CARE
    ).sort("-timestamp").limit(limit).to_list()

# --- Compatibility Algorithm Endpoints ---

@router.get("/compatibilidad/criterios", response_model=List[AlgorithmFactor])
async def get_compatibility_criteria(admin: Employee = Depends(admin_required)):
    """Retrieve all criteria for the Compatibility algorithm."""
    return await AlgorithmFactor.find(AlgorithmFactor.algorithm_type == AlgorithmType.COMPATIBILITY).to_list()

@router.post("/compatibilidad/criterio/update/{criterio_id}", response_model=AlgorithmFactor)
async def update_compatibility_criterion(
    criterio_id: str,
    update_data: Dict[str, Any],
    admin: Employee = Depends(admin_required)
):
    """Update an existing compatibility criterion."""
    criterion = await AlgorithmFactor.get(criterio_id)
    if not criterion or criterion.algorithm_type != AlgorithmType.COMPATIBILITY:
        raise HTTPException(status_code=404, detail="Criterio no encontrado")
    
    old_value = criterion.model_dump(mode='json')
    
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
        new_value=criterion.model_dump(mode='json'),
        modified_by=str(admin.id),
        comment=update_data.get("comment", "Criterio actualizado")
    )
    await history.insert()
    
    return criterion

@router.post("/compatibilidad/abtest/start", response_model=ABTest)
async def start_ab_test(
    test_data: Dict[str, Any],
    admin: Employee = Depends(admin_required)
):
    """Start a new A/B test for the compatibility algorithm."""
    test = ABTest(
        **test_data,
        created_by=str(admin.id),
        status="running",
        start_date=datetime.utcnow()
    )
    await test.insert()
    
    # Log history
    history = AlgorithmHistory(
        algorithm_type=test.algorithm_type,
        action="start_ab_test",
        old_value=None,
        new_value=test.model_dump(mode='json'),
        modified_by=str(admin.id),
        comment=f"Iniciada prueba A/B: {test.name}"
    )
    await history.insert()
    
    return test

# --- Normalization Endpoints ---

@router.post("/care/normalizar", response_model=List[AlgorithmFactor])
async def normalize_care_weights(
    data: Dict[str, Any],
    admin: Employee = Depends(admin_required)
):
    """Normalizes CARE weights based on a manual change."""
    factor_id = data.get("factor_id")
    new_weight = data.get("new_weight")
    locked_ids = data.get("locked_ids", [])
    
    if factor_id is None or new_weight is None:
        raise HTTPException(status_code=400, detail="factor_id y new_weight son requeridos")
        
    return await AlgorithmService.normalize_weights(
        AlgorithmType.CARE,
        factor_id,
        new_weight,
        locked_ids
    )

@router.post("/care/equitativo", response_model=List[AlgorithmFactor])
async def distribute_care_equitably(admin: Employee = Depends(admin_required)):
    """Distributes CARE weights equitably."""
    return await AlgorithmService.distribute_equitably(AlgorithmType.CARE)
