"""
Tests for User DTOs
Verifies that DTOs correctly filter sensitive data based on access levels.
"""

import pytest
from unittest.mock import MagicMock
from src.api.dtos.user_dtos import PublicUserDTO, PrivateUserDTO, AdminUserDTO
from src.models.user import User, SubscriptionTier, AuthProvider
from src.models.profile import Profile
from datetime import datetime
from beanie import PydanticObjectId


def create_mock_user(**kwargs):
    """Helper to create a mock user with default attributes"""
    user = MagicMock(spec=User)
    user.id = PydanticObjectId()
    user.display_name = "User"
    user.nickname = "user123"
    user.real_name = None
    user.email = None
    user.phone = None
    user.verified = False
    user.is_verified = False
    user.is_active = True
    user.is_banned = False
    user.is_admin = False
    user.subscription_tier = SubscriptionTier.FREE
    user.auth_provider = AuthProvider.EMAIL
    user.identity_verification_status = "none"
    user.identity_document_type = None
    user.identity_document_url = None
    user.identity_rejection_reason = None
    user.identity_submitted_at = None
    user.identity_verified_at = None
    user.created_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    user.last_login_at = None
    
    for key, value in kwargs.items():
        setattr(user, key, value)
    return user


def create_mock_profile(**kwargs):
    """Helper to create a mock profile with default attributes"""
    profile = MagicMock(spec=Profile)
    profile.user_id = "test_id"
    profile.age = None
    profile.gender = None
    profile.city = None
    profile.bio = None
    profile.photos = []
    profile.interests = []
    profile.lifestyle_interests = []
    profile.hobbies = []
    profile.languages = []
    profile.preferred_languages = []
    profile.auto_preferred_languages = True
    profile.location = MagicMock()
    profile.location.city = None
    profile.profile_completion = 0
    profile.dict.return_value = {}
    profile.model_dump.return_value = {}
    
    for key, value in kwargs.items():
        if key == "location_city":
            profile.location.city = value
        else:
            setattr(profile, key, value)
    
    # Ensure model_dump return matches dict for consistency
    if kwargs:
        profile.model_dump.return_value = profile.dict.return_value
        
    return profile


class TestPublicUserDTO:
    """Test PublicUserDTO filtering"""
    
    def test_public_dto_excludes_sensitive_fields(self):
        """Public DTO should not expose sensitive fields"""
        user = create_mock_user(
            real_name="John Doe",
            display_name="Johnny",
            nickname="johnny_2024",
            email="john@example.com",
            phone="+52 123 456 7890",
            verified=True,
            subscription_tier=SubscriptionTier.PREMIUM,
            identity_document_url="/static/identity_documents/doc.jpg"
        )
        
        profile = create_mock_profile(
            user_id=str(user.id),
            age=25,
            gender="male",
            location_city="Mexico City"
        )
        
        dto = PublicUserDTO.from_user_and_profile(user, profile)
        dto_dict = dto.model_dump()
        
        assert "real_name" not in dto_dict
        assert "email" not in dto_dict
        assert "phone" not in dto_dict
        assert dto_dict["user_id"] == str(user.id)
        assert dto_dict["display_name"] == "Johnny"
        assert dto_dict["city"] == "Mexico City"


class TestPrivateUserDTO:
    """Test PrivateUserDTO masking"""
    
    def test_private_dto_masks_email_and_phone(self):
        """Private DTO should mask email and phone"""
        user = create_mock_user(
            display_name="Johnny",
            email="john.doe@example.com",
            phone="+52 123 456 7890",
            identity_verification_status="pending"
        )
        
        profile = create_mock_profile(user_id=str(user.id))
        
        dto = PrivateUserDTO.from_user_and_profile(user, profile, mask_data=True)
        dto_dict = dto.model_dump()
        
        assert dto_dict["real_name"] == None
        assert dto_dict["email_masked"] != "john.doe@example.com"
        assert "***" in dto_dict["email_masked"]
        assert dto_dict["identity_verification_status"] == "pending"
    
    def test_private_dto_without_masking_for_admin(self):
        """Private DTO without masking for admin access"""
        user = create_mock_user(
            display_name="Johnny",
            email="john@example.com",
            phone="+52 123 456 7890"
        )
        
        profile = create_mock_profile(user_id=str(user.id))
        
        dto = PrivateUserDTO.from_user_and_profile(user, profile, mask_data=False)
        dto_dict = dto.model_dump()
        
        assert dto_dict["email_masked"] == "john@example.com"
        assert dto_dict["phone_masked"] == "+52 123 456 7890"


class TestAdminUserDTO:
    """Test AdminUserDTO full access"""
    
    def test_admin_dto_includes_all_fields(self):
        """Admin DTO should include all fields including sensitive ones"""
        user = create_mock_user(
            real_name="John Doe",
            display_name="Johnny",
            email="john@example.com",
            phone="+52 123 456 7890",
            identity_document_url="/static/identity_documents/doc.jpg"
        )
        
        profile = create_mock_profile(user_id=str(user.id))
        profile.dict.return_value = {"age": 25}
        
        dto = AdminUserDTO.from_user_and_profile(user, profile)
        dto_dict = dto.model_dump()
        
        assert dto_dict["real_name"] == "John Doe"
        assert dto_dict["email"] == "john@example.com"
        assert dto_dict["identity_document_url"] == "/static/identity_documents/doc.jpg"
        assert "***" not in dto_dict["email"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
