"""Tests for the public appearance read endpoint (no auth, active resources only)."""

from src.api.admin_appearance import router, build_public_resources_query
from src.models.appearance import AppearanceType, Platform


def test_public_resources_route_exists_and_is_unauthenticated():
    route = next(
        (r for r in router.routes if getattr(r, "path", "") == "/public"),
        None,
    )
    assert route is not None, "GET /public route missing from admin_appearance router"
    assert route.methods == {"GET"}
    assert "employee" not in route.endpoint.__annotations__


def test_build_public_resources_query_no_filters():
    assert build_public_resources_query() == {"is_active": True}


def test_build_public_resources_query_with_type_and_platform():
    query = build_public_resources_query(AppearanceType.LANDING_THEME, Platform.WEB)
    assert query["is_active"] is True
    assert query["type"] == AppearanceType.LANDING_THEME
    assert query["platform"] == Platform.WEB