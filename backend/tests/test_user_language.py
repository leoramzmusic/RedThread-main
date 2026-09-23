from src.models.user import User

def test_user_default_language_is_en():
    # Use model_fields to avoid Beanie CollectionWasNotInitialized on direct instantiation
    assert User.model_fields["preferred_language"].default == "en"

def test_appearance_type_has_landing_languages():
    from src.models.appearance import AppearanceType
    assert AppearanceType.LANDING_LANGUAGES == "landing_languages"
