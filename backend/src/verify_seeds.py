import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.employee import Employee

async def check_seeds():
    await init_db()
    count = await Employee.find_all().count()
    print(f"Total employees: {count}")
    
    # Check a specific one
    sa = await Employee.find_one(Employee.email == "superadmin@redthread.com")
    if sa:
        print(f"SuperAdmin found: {sa.display_name}, Roles: {sa.roles}")

if __name__ == "__main__":
    asyncio.run(check_seeds())
