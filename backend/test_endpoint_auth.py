"""
Debug script to test the employee RBAC middleware with a real HTTP request
"""

import asyncio
import httpx
from src.core.database import init_db
from src.models.employee import Employee
from src.core.utils.security import create_access_token


async def test_endpoint_with_token():
    """Test the verification endpoint with a real token"""
    
    print("🔧 Initializing database...")
    await init_db()
    
    # Get admin employee
    employee = await Employee.find_one(Employee.email == "admin@redthread.com")
    
    if not employee:
        print("❌ Admin employee not found!")
        return
    
    print(f"✅ Found employee: {employee.email}")
    
    # Create access token
    access_token = create_access_token(
        {"sub": str(employee.id), "scope": "employee"},
        device_type="web"
    )
    
    print(f"\n🔑 Generated token: {access_token[:50]}...")
    
    # Test the endpoint
    print(f"\n🌐 Testing endpoint: GET /portal-redthread/verificaciones/pendientes")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "http://localhost:8000/portal-redthread/verificaciones/pendientes",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"\n✅ Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Items: {len(data.get('items', []))}")
                print(f"   Total: {data.get('total', 0)}")
            else:
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"\n❌ Request failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_endpoint_with_token())
