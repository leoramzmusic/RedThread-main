def test_profile_tip_import():
    from src.models.profile_tip import ProfileTip
    assert ProfileTip is not None


def test_tip_permissions_exist():
    from src.models.admin_rbac import Permission
    assert Permission.VIEW_PROFILE_TIPS is not None
    assert Permission.MANAGE_PROFILE_TIPS is not None
    assert Permission.EDIT_PROFILE_TIPS is not None
