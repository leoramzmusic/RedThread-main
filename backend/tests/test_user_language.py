from src.models.user import User

def test_user_default_language_is_en():
    # Use model_fields to avoid Beanie CollectionWasNotInitialized on direct instantiation
    assert User.model_fields["preferred_language"].default == "en"

def test_appearance_type_has_landing_languages():
    from src.models.appearance import AppearanceType
    assert AppearanceType.LANDING_LANGUAGES == "landing_languages"

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_patch_preferred_language():
    from src.api.dtos.user_dtos import PrivateUserDTO
    from unittest.mock import Mock
    user = Mock(preferred_language="en", display_name="A", nickname="a", email="a@a.com", phone=None, real_name=None, verified=False, is_verified=False, subscription_tier=Mock(value="free"), identity_verification_status="none", identity_document_type=None, identity_rejection_reason=None, identity_submitted_at=None, id="123")
    profile = None
    dto = PrivateUserDTO.from_user_and_profile(user, profile)
    assert hasattr(dto, 'preferred_language')
    assert dto.preferred_language == "en"

def test_register_request_accepts_preferred_language():
    from src.api.auth import RegisterRequest
    r = RegisterRequest(email="x@x.com", password="12345678", username="xuser", display_name="X", age=22, gender="other", preferred_language="fr")
    assert r.preferred_language == "fr"

def test_employee_default_language_is_en():
    from src.models.employee import Employee
    assert Employee.model_fields["preferred_language"].default == "en"

def test_admin_me_payload_includes_language():
    import inspect
    from src.api.admin.auth import _me_payload
    src = inspect.getsource(_me_payload)
    assert "preferred_language" in src

def test_admin_router_has_patch_me():
    import inspect
    from src.api.admin.auth import router
    from fastapi.routing import APIRoute
    paths = [
        r.path for r in router.routes
        if isinstance(r, APIRoute) and r.path == "/portal-redthread/auth/me" and "PATCH" in r.methods
    ]
    assert paths, "PATCH /me missing from admin auth router"
