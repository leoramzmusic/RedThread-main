def test_profile_tip_import():
    from src.models.profile_tip import ProfileTip
    assert ProfileTip is not None


def test_tip_permissions_exist():
    from src.models.admin_rbac import Permission
    assert Permission.VIEW_PROFILE_TIPS is not None
    assert Permission.MANAGE_PROFILE_TIPS is not None
    assert Permission.EDIT_PROFILE_TIPS is not None


def test_public_tip_endpoint_registered():
    from src.main import app
    paths = [r.path for r in app.routes]
    assert any("profile-tips" in p for p in paths)
