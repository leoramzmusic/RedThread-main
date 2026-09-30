"""Profile Modules: admin CRUD + public endpoint.

No DB required — ProfileModule is doubled with an in-memory fake and the
auth dependencies are overridden. (backend/tests/conftest.py defines no
client/auth fixtures, so they are declared locally here.)
"""

from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

import src.api.admin_profile_modules as pm
from src.api.auth import get_current_user
from src.core.middleware.employee_rbac import get_current_employee


# ---- In-memory ProfileModule double ---------------------------------------

class _Query:
    def __init__(self, items):
        self._items = items

    async def to_list(self):
        return list(self._items)


class FakeProfileModule:
    _store = {}

    def __init__(self, **kw):
        self.id = kw.get("id", kw["key"])
        self.key = kw["key"]
        self.nombre = kw.get("nombre", "")
        self.descripcion = kw.get("descripcion", "")
        self.icono = kw.get("icono", "tune")
        self.orden = kw.get("orden", 0)
        self.visible = kw.get("visible", True)
        self.origen = kw.get("origen", "core")
        self.requiere_premium = kw.get("requiere_premium", False)
        now = datetime.utcnow()
        self.created_at = kw.get("created_at", now)
        self.updated_at = kw.get("updated_at", now)

    @classmethod
    def reset(cls, items=()):
        cls._store = {m.key: m for m in items}

    @classmethod
    def _match(cls, m, query):
        return all(getattr(m, k) == v for k, v in query.items())

    @classmethod
    async def find_one(cls, query):
        return next((m for m in cls._store.values() if cls._match(m, query)), None)

    @classmethod
    def find_all(cls):
        return _Query(cls._store.values())

    @classmethod
    def find(cls, query):
        return _Query([m for m in cls._store.values() if cls._match(m, query)])

    async def insert(self):
        FakeProfileModule._store[self.key] = self
        return self

    async def save(self):
        FakeProfileModule._store[self.key] = self
        return self

    async def delete(self):
        FakeProfileModule._store.pop(self.key, None)


def _core(key, visible=True, orden=0):
    return FakeProfileModule(key=key, nombre=key, orden=orden,
                             visible=visible, origen="core")


class _AdminEmp:
    id = "emp1"

    def __init__(self, allowed=True):
        self._allowed = allowed

    async def has_permission(self, permission):
        return self._allowed


# ---- Fixtures ---------------------------------------------------------------

@pytest.fixture
def store(monkeypatch):
    FakeProfileModule.reset([
        _core("section-photos", visible=True, orden=0),
        _core("section-music", visible=True, orden=1),
    ])
    monkeypatch.setattr(pm, "ProfileModule", FakeProfileModule)
    return FakeProfileModule


@pytest.fixture
def mock_log(monkeypatch):
    mock = AsyncMock()
    monkeypatch.setattr(pm, "log_employee_action", mock)
    return mock


@pytest.fixture
def admin_token():
    return {"Authorization": "Bearer fake-admin-token"}


def _build_app(employee=None, user=None):
    app = FastAPI()
    app.include_router(pm.router, prefix="/portal-redthread/profile-modules")
    app.include_router(pm.public_router, prefix="/api/profile-modules")
    if employee is not None:
        app.dependency_overrides[get_current_employee] = lambda: employee
    if user is not None:
        app.dependency_overrides[get_current_user] = lambda: user
    return app


@pytest.fixture
def client(store, mock_log):
    app = _build_app(employee=_AdminEmp(allowed=True),
                     user=SimpleNamespace(id="u1"))
    with TestClient(app) as c:
        yield c


@pytest.fixture
def noauth_client(store, mock_log):
    with TestClient(_build_app()) as c:
        yield c


@pytest.fixture
def noperm_client(store, mock_log):
    app = _build_app(employee=_AdminEmp(allowed=False),
                     user=SimpleNamespace(id="u1"))
    with TestClient(app) as c:
        yield c


# ---- Tests ------------------------------------------------------------------

def test_cannot_hide_last_core_module(client, admin_token):
    # Leave section-photos as the only visible core module first
    res = client.patch(
        "/portal-redthread/profile-modules/section-music/visibilidad",
        json={"visible": False},
        headers=admin_token,
    )
    assert res.status_code == 200
    res = client.patch(
        "/portal-redthread/profile-modules/section-photos/visibilidad",
        json={"visible": False},
        headers=admin_token,
    )
    assert res.status_code in (400, 422)


def test_list_requires_auth(noauth_client):
    res = noauth_client.get("/portal-redthread/profile-modules/")
    assert res.status_code == 401


def test_list_returns_modules_ordered(client, admin_token):
    res = client.get("/portal-redthread/profile-modules/", headers=admin_token)
    assert res.status_code == 200
    keys = [m["key"] for m in res.json()]
    assert keys == ["section-photos", "section-music"]


def test_create_module_happy_path(client, admin_token):
    res = client.post(
        "/portal-redthread/profile-modules/",
        json={"key": "spotify", "nombre": "Spotify"},
        headers=admin_token,
    )
    assert res.status_code in (200, 201)
    body = res.json()
    assert body["key"] == "spotify"
    assert body["origen"] == "integracion"


def test_create_duplicate_key_returns_400(client, admin_token):
    res = client.post(
        "/portal-redthread/profile-modules/",
        json={"key": "section-photos", "nombre": "Duplicado"},
        headers=admin_token,
    )
    assert res.status_code == 400


def test_delete_integracion_happy_path(client, admin_token):
    client.post(
        "/portal-redthread/profile-modules/",
        json={"key": "spotify", "nombre": "Spotify"},
        headers=admin_token,
    )
    res = client.delete(
        "/portal-redthread/profile-modules/spotify", headers=admin_token
    )
    assert res.status_code == 200


def test_delete_core_module_returns_400(client, admin_token):
    res = client.delete(
        "/portal-redthread/profile-modules/section-photos", headers=admin_token
    )
    assert res.status_code == 400


def test_reorder_persists_order(client, admin_token):
    res = client.put(
        "/portal-redthread/profile-modules/reorden",
        json={"keys": ["section-music", "section-photos"]},
        headers=admin_token,
    )
    assert res.status_code == 200
    res = client.get("/portal-redthread/profile-modules/", headers=admin_token)
    keys = [m["key"] for m in res.json()]
    assert keys == ["section-music", "section-photos"]


def test_reorder_unknown_key_returns_400(client, admin_token):
    res = client.put(
        "/portal-redthread/profile-modules/reorden",
        json={"keys": ["nope"]},
        headers=admin_token,
    )
    assert res.status_code == 400


def test_reorder_duplicate_keys_returns_400(client, admin_token):
    res = client.put(
        "/portal-redthread/profile-modules/reorden",
        json={"keys": ["section-music", "section-music"]},
        headers=admin_token,
    )
    assert res.status_code == 400


def test_public_returns_only_visible_ordered(client):
    res = client.get("/api/profile-modules/")
    assert res.status_code == 200
    mods = res.json()
    assert [m["key"] for m in mods] == ["section-photos", "section-music"]
    assert all(m["visible"] for m in mods)
    # Hide one core module (the other keeps the integrity rule satisfied)
    client.patch(
        "/portal-redthread/profile-modules/section-music/visibilidad",
        json={"visible": False},
        headers={"Authorization": "Bearer fake-admin-token"},
    )
    res = client.get("/api/profile-modules/")
    assert [m["key"] for m in res.json()] == ["section-photos"]


def test_public_requires_auth(noauth_client):
    res = noauth_client.get("/api/profile-modules/")
    assert res.status_code == 401


def test_role_without_permission_gets_403(noperm_client, admin_token):
    res = noperm_client.get(
        "/portal-redthread/profile-modules/", headers=admin_token
    )
    assert res.status_code == 403
