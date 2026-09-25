"""User portal Menus: appearance type uses the generic resource CRUD + history."""

from src.api.admin_appearance import router, build_public_resources_query
from src.models.appearance import AppearanceType, Platform


def test_user_menus_type_registered():
    assert AppearanceType.USER_MENUS.value == "user_menus"


def test_public_query_supports_user_menus():
    assert build_public_resources_query(AppearanceType.USER_MENUS) == {
        "is_active": True,
        "type": AppearanceType.USER_MENUS,
    }


def test_admin_crud_and_history_routes_exist():
    paths = {getattr(r, "path", "") for r in router.routes}
    assert "/resources" in paths
    assert "/resources/{resource_id}" in paths
    assert "/public" in paths
    assert "/history" in paths


def test_user_menus_serializes_as_plain_value():
    assert AppearanceType.USER_MENUS == "user_menus"
    query = build_public_resources_query(AppearanceType.USER_MENUS, Platform.WEB)
    assert query["type"] == "user_menus"
    assert query["platform"] == Platform.WEB
