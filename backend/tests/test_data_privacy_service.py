"""
Tests for Data Privacy Service
Verifies email/phone masking and field filtering functions.
"""

import pytest
from src.services.data_privacy_service import (
    mask_email,
    mask_phone,
    filter_sensitive_fields,
    validate_field_access
)


class TestEmailMasking:
    """Test email masking function"""
    
    def test_mask_email_standard(self):
        """Test masking of standard email"""
        masked = mask_email("user@example.com")
        assert masked == "u***@e***.com"
        assert "user" not in masked
        assert "example" not in masked
    
    def test_mask_email_with_dots(self):
        """Test masking of email with dots in local part"""
        masked = mask_email("john.doe@company.org")
        assert "j***" in masked
        assert "c***.org" in masked
        assert "john" not in masked
        assert "doe" not in masked
    
    def test_mask_email_none(self):
        """Test masking None email"""
        assert mask_email(None) is None
    
    def test_mask_email_invalid(self):
        """Test masking invalid email format"""
        masked = mask_email("notanemail")
        assert "***" in masked


class TestPhoneMasking:
    """Test phone masking function"""
    
    def test_mask_phone_with_country_code(self):
        """Test masking phone with country code"""
        masked = mask_phone("+52 123 456 7890")
        assert "+52" in masked  # Country code visible
        assert "***" in masked
        assert "90" in masked  # Last 2 digits visible
        assert "123" not in masked
        assert "456" not in masked
    
    def test_mask_phone_without_country_code(self):
        """Test masking phone without country code"""
        masked = mask_phone("1234567890")
        assert "***" in masked
        assert "90" in masked  # Last 2 digits visible
        assert "123456" not in masked
    
    def test_mask_phone_none(self):
        """Test masking None phone"""
        assert mask_phone(None) is None
    
    def test_mask_phone_short(self):
        """Test masking short phone number"""
        masked = mask_phone("12")
        assert "***" in masked


class TestFieldFiltering:
    """Test field filtering function"""
    
    def test_filter_removes_always_sensitive(self):
        """Test that always-sensitive fields are removed"""
        data = {
            "user_id": "123",
            "display_name": "John",
            "identity_document_url": "/path/to/doc.jpg",
            "hashed_password": "hashed123",
            "refresh_tokens": ["token1", "token2"]
        }
        
        filtered = filter_sensitive_fields(data, viewer_role="public", is_owner=False)
        
        # Always sensitive fields should be removed
        assert "identity_document_url" not in filtered
        assert "hashed_password" not in filtered
        assert "refresh_tokens" not in filtered
        
        # Public fields should remain
        assert filtered["user_id"] == "123"
        assert filtered["display_name"] == "John"
    
    def test_filter_removes_owner_only_for_non_owner(self):
        """Test that owner-only fields are removed for non-owners"""
        data = {
            "user_id": "123",
            "display_name": "John",
            "real_name": "John Doe",
            "email": "john@example.com",
            "phone": "+52 123 456 7890"
        }
        
        filtered = filter_sensitive_fields(data, viewer_role="user", is_owner=False)
        
        # Owner-only fields should be removed
        assert "real_name" not in filtered
        assert "email" not in filtered
        assert "phone" not in filtered
    
    def test_filter_keeps_owner_fields_for_owner(self):
        """Test that owner-only fields are kept for owner (but masked)"""
        data = {
            "user_id": "123",
            "display_name": "John",
            "email": "john@example.com",
            "phone": "+52 123 456 7890"
        }
        
        filtered = filter_sensitive_fields(data, viewer_role="user", is_owner=True)
        
        # Owner fields should be present but masked
        assert "email" in filtered
        assert "phone" in filtered
        assert "***" in filtered["email"]
        assert "***" in filtered["phone"]
    
    def test_filter_admin_no_masking(self):
        """Test that admin sees everything without masking"""
        data = {
            "user_id": "123",
            "email": "john@example.com",
            "phone": "+52 123 456 7890",
            "real_name": "John Doe"
        }
        
        filtered = filter_sensitive_fields(data, viewer_role="admin", is_owner=False)
        
        # Admin should see everything without masking
        assert filtered["email"] == "john@example.com"
        assert filtered["phone"] == "+52 123 456 7890"
        assert filtered["real_name"] == "John Doe"
        assert "***" not in filtered["email"]


class TestFieldAccessValidation:
    """Test field access validation"""
    
    def test_forbidden_fields_always_denied(self):
        """Test that forbidden fields are always denied"""
        assert validate_field_access("hashed_password", "admin", is_owner=True) == False
        assert validate_field_access("refresh_tokens", "admin", is_owner=True) == False
    
    def test_admin_can_access_most_fields(self):
        """Test that admin can access most fields"""
        assert validate_field_access("real_name", "admin", is_owner=False) == True
        assert validate_field_access("email", "admin", is_owner=False) == True
        assert validate_field_access("identity_document_url", "admin", is_owner=False) == True
    
    def test_owner_can_access_owner_fields(self):
        """Test that owner can access owner-only fields"""
        assert validate_field_access("real_name", "user", is_owner=True) == True
        assert validate_field_access("email", "user", is_owner=True) == True
    
    def test_non_owner_cannot_access_owner_fields(self):
        """Test that non-owner cannot access owner-only fields"""
        assert validate_field_access("real_name", "user", is_owner=False) == False
        assert validate_field_access("email", "user", is_owner=False) == False
        assert validate_field_access("identity_document_url", "user", is_owner=False) == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
