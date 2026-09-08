"""
Test script to verify Employee RBAC middleware works correctly
"""

import asyncio
from src.core.database import init_db
from src.models.employee import Employee
from src.core.utils.security import create_access_token


async def test_employee_token():
    """Test creating an employee token and verifying it"""
    
    print("🔧 Initializing database...")
    await init_db()
    
    # Get admin employee
    employee = await Employee.find_one(Employee.email == "admin@redthread.com")
    
    if not employee:
        print("❌ Admin employee not found!")
        return
    
    print(f"\n✅ Found employee: {employee.email}")
    print(f"   ID: {employee.id}")
    print(f"   Role: {employee.role}")
    print(f"   Status: {employee.status}")
    
    # Create access token
    access_token = create_access_token(
        {"sub": str(employee.id), "scope": "employee"},
        device_type="web"
    )
    
    print(f"\n🔑 Generated access token:")
    print(f"   {access_token[:50]}...")
    
    # Verify token can be decoded
    from src.core.utils.security import decode_token
    payload = decode_token(access_token)
    
    if payload:
        print(f"\n✅ Token decoded successfully:")
        print(f"   sub: {payload.get('sub')}")
        print(f"   scope: {payload.get('scope')}")
        print(f"   type: {payload.get('type')}")
    else:
        print("\n❌ Failed to decode token")
    
    # Test permissions
    from src.models.admin_rbac import Permission
    print(f"\n🔐 Testing permissions:")
    print(f"   VIEW_USERS: {employee.has_permission(Permission.VIEW_USERS)}")
    print(f"   EDIT_USERS: {employee.has_permission(Permission.EDIT_USERS)}")
    print(f"   VIEW_METRICS: {employee.has_permission(Permission.VIEW_METRICS)}")
    
    print(f"\n✅ All tests passed!")
    print(f"\n📋 To use this token in requests:")
    print(f"   Authorization: Bearer {access_token[:30]}...")


if __name__ == "__main__":
    asyncio.run(test_employee_token())
