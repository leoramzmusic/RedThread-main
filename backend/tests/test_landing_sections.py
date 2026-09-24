"""Landing Page Sections: appearance type uses the generic resource CRUD + history."""

from src.api.admin_appearance import router, build_public_resources_query
from src.models.appearance import AppearanceType, Platform


def test_landing_sections_type_registered():
    assert AppearanceType.LANDING_SECTIONS.value == "landing_sections"


def test_public_query_supports_landing_sections():
    assert build_public_resources_query(AppearanceType.LANDING_SECTIONS) == {
        "is_active": True,
        "type": AppearanceType.LANDING_SECTIONS,
    }


def test_admin_crud_and_history_routes_exist():
    paths = {getattr(r, "path", "") for r in router.routes}
    assert "/resources" in paths
    assert "/resources/{resource_id}" in paths
    assert "/public" in paths
    assert "/history" in paths


def test_landing_sections_serializes_as_plain_value():
    assert AppearanceType.LANDING_SECTIONS == "landing_sections"
    query = build_public_resources_query(AppearanceType.LANDING_SECTIONS, Platform.WEB)
    assert query["type"] == "landing_sections"
    assert query["platform"] == Platform.WEB
