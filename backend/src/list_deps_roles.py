import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.department import Department
from src.models.role import Role

async def list_data():
    await init_db()
    deps = await Department.find_all().to_list()
    roles = await Role.find_all().to_list()
    
    print("--- DEPARTMENTS ---")
    for d in deps:
        print(f"Name: {d.name}, Code: {d.code}, ID: {d.id}")
        
    print("\n--- ROLES ---")
    for r in roles:
        print(f"Name: {r.name}, Slug: {r.slug}, ID: {r.id}")

if __name__ == "__main__":
    asyncio.run(list_data())
