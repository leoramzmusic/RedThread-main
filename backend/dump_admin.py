
import asyncio
from src.core.database import init_db
from src.models.employee import Employee

async def dump_admin():
    await init_db()
    admin = await Employee.find_one(Employee.email == "admin@redthread.com")
    if admin:
        print("--- Admin Employee Data ---")
        print(f"ID: {admin.id}")
        print(f"Email: {admin.email}")
        print(f"Status: {admin.status}")
        print(f"Role (legacy): {admin.role}")
        print(f"Roles (list): {admin.roles}")
        print(f"Has hashed password: {bool(admin.hashed_password)}")
        print(f"Created at: {admin.created_at}")
    else:
        print("❌ Admin employee NOT FOUND")

if __name__ == "__main__":
    asyncio.run(dump_admin())
