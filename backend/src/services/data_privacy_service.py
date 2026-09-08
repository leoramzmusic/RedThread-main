"""
Data Privacy Service
Provides utilities for filtering, masking, and protecting sensitive user data.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime


def mask_email(email: Optional[str]) -> Optional[str]:
    """
    Mask email address for privacy.
    
    Examples:
        user@example.com -> u***@e***.com
        john.doe@company.org -> j***.d***@c***.org
    
    Args:
        email: Email address to mask
        
    Returns:
        Masked email address or None if email is None
    """
    if not email:
        return None
    
    try:
        local, domain = email.split('@')
        
        # Mask local part (keep first char + ***)
        if len(local) > 1:
            masked_local = local[0] + '***'
        else:
            masked_local = '***'
        
        # Mask domain (keep first char of domain name + ***)
        domain_parts = domain.split('.')
        if domain_parts:
            if len(domain_parts[0]) > 1:
                masked_domain = domain_parts[0][0] + '***'
            else:
                masked_domain = '***'
            
            # Keep TLD visible
            if len(domain_parts) > 1:
                masked_domain += '.' + '.'.join(domain_parts[1:])
        else:
            masked_domain = '***'
        
        return f"{masked_local}@{masked_domain}"
    except:
        # If email format is invalid, return fully masked
        return "***@***.***"


def mask_phone(phone: Optional[str]) -> Optional[str]:
    """
    Mask phone number for privacy.
    
    Examples:
        +52 123 456 7890 -> +52 *** *** **90
        1234567890 -> *** *** **90
    
    Args:
        phone: Phone number to mask
        
    Returns:
        Masked phone number or None if phone is None
    """
    if not phone:
        return None
    
    # Remove all non-digit characters except +
    digits = ''.join(c for c in phone if c.isdigit())
    
    if not digits:
        return "*** *** ****"
    
    # Keep country code if present (starts with +)
    prefix = ""
    if phone.startswith('+'):
        # Extract country code (1-3 digits after +)
        country_code = ""
        for char in phone[1:]:
            if char.isdigit() and len(country_code) < 3:
                country_code += char
            elif not char.isdigit():
                continue
            else:
                break
        if country_code:
            prefix = f"+{country_code} "
            # Remove country code from digits
            digits = digits[len(country_code):]
    
    # Keep last 2 digits visible
    if len(digits) >= 2:
        masked = f"{prefix}*** *** **{digits[-2:]}"
    else:
        masked = f"{prefix}*** *** ****"
    
    return masked


def filter_sensitive_fields(
    data: Dict[str, Any],
    viewer_role: str,
    is_owner: bool = False
) -> Dict[str, Any]:
    """
    Filter sensitive fields from data based on viewer permissions.
    
    Args:
        data: Dictionary containing user data
        viewer_role: Role of the viewer ('public', 'user', 'admin')
        is_owner: True if viewer is the data owner
        
    Returns:
        Filtered dictionary with sensitive fields removed or masked
    """
    # Define sensitive fields that should never be exposed to public
    always_sensitive = [
        'identity_document_url',
        'hashed_password',
        'refresh_tokens',
        'reset_token',
        'phone_otp',
        'spotify_access_token',
        'spotify_refresh_token',
        'stripe_customer_id'
    ]
    
    # Fields that should only be visible to owner or admin
    owner_only = [
        'real_name',
        'email',
        'phone',
        'identity_rejection_reason',
        'identity_submitted_at'
    ]
    
    # Create a copy to avoid modifying original
    filtered_data = data.copy()
    
    # Always remove highly sensitive fields
    for field in always_sensitive:
        filtered_data.pop(field, None)
    
    # Remove owner-only fields if viewer is not owner or admin
    if not is_owner and viewer_role != 'admin':
        for field in owner_only:
            filtered_data.pop(field, None)
    
    # Mask email and phone for non-admin viewers (even for owners)
    if viewer_role != 'admin':
        if 'email' in filtered_data:
            filtered_data['email'] = mask_email(filtered_data['email'])
        if 'phone' in filtered_data:
            filtered_data['phone'] = mask_phone(filtered_data['phone'])
    
    return filtered_data


async def log_sensitive_access(
    user_id: str,
    accessed_by: str,
    fields: List[str],
    ip_address: str = "unknown",
    user_agent: str = "unknown"
) -> None:
    """
    Log access to sensitive user data for audit purposes.
    
    Args:
        user_id: ID of user whose data was accessed
        accessed_by: ID of user who accessed the data
        fields: List of sensitive fields that were accessed
        ip_address: IP address of the accessor
        user_agent: User agent string of the accessor
    """
    from src.models.audit_log import AuditLog
    
    # Only log if accessing someone else's data or accessing sensitive fields
    if user_id != accessed_by or any(field in ['identity_document_url', 'real_name', 'email', 'phone'] for field in fields):
        audit_log = AuditLog(
            user_id=user_id,
            accessed_by=accessed_by,
            action="view_sensitive_data",
            sensitive_fields=fields,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        await audit_log.insert()
        
        print(f"[AUDIT] User {accessed_by} accessed sensitive data of user {user_id}: {fields}")


def validate_field_access(
    field_name: str,
    viewer_role: str,
    is_owner: bool = False
) -> bool:
    """
    Validate if a viewer has permission to access a specific field.
    
    Args:
        field_name: Name of the field to check
        viewer_role: Role of the viewer ('public', 'user', 'admin')
        is_owner: True if viewer is the data owner
        
    Returns:
        True if access is allowed, False otherwise
    """
    # Fields that are always forbidden
    forbidden_fields = [
        'hashed_password',
        'refresh_tokens',
        'reset_token',
        'phone_otp',
        'spotify_access_token',
        'spotify_refresh_token'
    ]
    
    if field_name in forbidden_fields:
        return False
    
    # Admin can access everything (except forbidden fields)
    if viewer_role == 'admin':
        return True
    
    # Owner-only fields
    owner_only_fields = [
        'real_name',
        'email',
        'phone',
        'identity_document_url',
        'identity_rejection_reason',
        'identity_submitted_at'
    ]
    
    if field_name in owner_only_fields:
        return is_owner
    
    # All other fields are public
    return True


def get_safe_user_response(user, profile, viewer_id: Optional[str] = None, viewer_is_admin: bool = False):
    """
    Get a safe user response based on viewer permissions.
    
    Args:
        user: User model instance
        profile: Profile model instance
        viewer_id: ID of the user viewing the data
        viewer_is_admin: True if viewer is an admin
        
    Returns:
        DTO instance appropriate for the viewer's permissions
    """
    from src.api.dtos.user_dtos import PublicUserDTO, PrivateUserDTO, AdminUserDTO
    
    is_owner = viewer_id == str(user.id)
    
    if viewer_is_admin:
        return AdminUserDTO.from_user_and_profile(user, profile)
    elif is_owner:
        return PrivateUserDTO.from_user_and_profile(user, profile, mask_data=True)
    else:
        return PublicUserDTO.from_user_and_profile(user, profile)
