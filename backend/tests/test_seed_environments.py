import pytest
from unittest.mock import AsyncMock, patch
from src.core.seed import evaluate_seed_condition, seed_system_data


# ──────────────────────────────────────────────────────────────────────────────
# Tests de evaluate_seed_condition (Lógica pura de negocio por ambiente)
# ──────────────────────────────────────────────────────────────────────────────

def test_evaluate_local_with_existing_data():
    """En Local, si la tabla ya tiene registros, se omite el seed."""
    should_run, reason = evaluate_seed_condition("local", role_count=26, dept_count=9)
    assert should_run is False
    assert reason == "local_has_data"


def test_evaluate_local_when_empty():
    """En Local, si la tabla está vacía (0 roles y 0 departamentos), se debe ejecutar."""
    should_run, reason = evaluate_seed_condition("local", role_count=0, dept_count=0)
    assert should_run is True
    assert reason == "local_empty"


def test_evaluate_dev_always_runs():
    """En DEV, se corre el seed en cada despliegue para asegurar consistencia."""
    should_run, reason = evaluate_seed_condition("dev", role_count=26, dept_count=9)
    assert should_run is True
    assert "deploy_consistency" in reason


def test_evaluate_qa_always_runs():
    """En QA, se corre el seed en cada despliegue para asegurar consistencia."""
    should_run, reason = evaluate_seed_condition("qa", role_count=15, dept_count=5)
    assert should_run is True
    assert "deploy_consistency" in reason


def test_evaluate_prod_with_existing_data():
    """En PROD, si ya existen registros, se omite para evitar sobrescribir datos reales."""
    should_run, reason = evaluate_seed_condition("prod", role_count=26, dept_count=9)
    assert should_run is False
    assert reason == "prod_has_data"


def test_evaluate_prod_when_empty():
    """En PROD, se ejecuta solo si no existen registros previos."""
    should_run, reason = evaluate_seed_condition("prod", role_count=0, dept_count=0)
    assert should_run is True
    assert reason == "prod_empty"


def test_evaluate_force_flag():
    """Con force=True, se ejecuta en cualquier ambiente incluso con datos."""
    should_run, reason = evaluate_seed_condition("prod", role_count=100, dept_count=20, force=True)
    assert should_run is True
    assert reason == "forced"


# ──────────────────────────────────────────────────────────────────────────────
# Tests de integración de seed_system_data (con mock de I/O)
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_seed_system_data_local_skipped():
    with patch("src.core.seed.Role.find_all") as mock_role_find, \
         patch("src.core.seed.Department.find_all") as mock_dept_find, \
         patch("src.core.seed._perform_seed", new_callable=AsyncMock) as mock_perform:

        mock_role_find.return_value.count = AsyncMock(return_value=26)
        mock_dept_find.return_value.count = AsyncMock(return_value=9)

        result = await seed_system_data(env="local")

        assert result["status"] == "skipped"
        assert result["reason"] == "local_has_data"
        mock_perform.assert_not_called()


@pytest.mark.asyncio
async def test_seed_system_data_prod_skipped():
    with patch("src.core.seed.Role.find_all") as mock_role_find, \
         patch("src.core.seed.Department.find_all") as mock_dept_find, \
         patch("src.core.seed._perform_seed", new_callable=AsyncMock) as mock_perform:

        mock_role_find.return_value.count = AsyncMock(return_value=10)
        mock_dept_find.return_value.count = AsyncMock(return_value=4)

        result = await seed_system_data(env="prod")

        assert result["status"] == "skipped"
        assert result["reason"] == "prod_has_data"
        mock_perform.assert_not_called()


@pytest.mark.asyncio
async def test_seed_system_data_dev_executed():
    with patch("src.core.seed.Role.find_all") as mock_role_find, \
         patch("src.core.seed.Department.find_all") as mock_dept_find, \
         patch("src.core.seed._perform_seed", new_callable=AsyncMock) as mock_perform:

        mock_role_find.return_value.count = AsyncMock(return_value=26)
        mock_dept_find.return_value.count = AsyncMock(return_value=9)
        mock_perform.return_value = {"status": "executed", "env": "dev"}

        result = await seed_system_data(env="dev")

        assert result["status"] == "executed"
        mock_perform.assert_called_once_with("dev")


@pytest.mark.asyncio
async def test_seed_system_data_prod_empty_executed():
    with patch("src.core.seed.Role.find_all") as mock_role_find, \
         patch("src.core.seed.Department.find_all") as mock_dept_find, \
         patch("src.core.seed._perform_seed", new_callable=AsyncMock) as mock_perform:

        mock_role_find.return_value.count = AsyncMock(return_value=0)
        mock_dept_find.return_value.count = AsyncMock(return_value=0)
        mock_perform.return_value = {"status": "executed", "env": "prod"}

        result = await seed_system_data(env="prod")

        assert result["status"] == "executed"
        mock_perform.assert_called_once_with("prod")
