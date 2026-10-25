import pytest
from fastapi.testclient import TestClient
from src.main import app

def test_kpi_endpoint():
    client = TestClient(app)
    response = client.get("/api/admin/notifications/kpis")
    assert response.status_code in [200, 401]
    if response.status_code == 200:
        data = response.json()
        assert "enviadas_hoy" in data
        assert "no_leidas" in data
        assert "alertas_p0" in data
        assert "ctr_promedio" in data
        assert "acciones_pendientes" in data
