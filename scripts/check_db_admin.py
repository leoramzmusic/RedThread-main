import asyncio
from src.core.database import init_db
from src.models.employee import Employee

async def check_admin():
    await init_db()
    admin = await Employee.find_one(Employee.email == "admin@redthread.com")
    if admin:
        print("Admin Employee Found:")
        print(f"  Email: {admin.email}")
        print(f"  Status: {admin.status}")
        print(f"  Role: {admin.role}")
        print(f"  First Name: {admin.first_name}")
        print(f"  Last Name: {admin.last_name}")
        # print password length to check if something is weird
        print(f"  Hashed Password Length: {len(admin.hashed_password)}")
    else:
        print("Admin Employee NOT found in database.")

if __name__ == "__main__":
    asyncio.run(check_admin())
