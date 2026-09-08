import asyncio
import os
import sys

# Add backend src to path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.user import User
from src.models.profile import Profile
from src.models.employee import Employee

async def diagnose():
    try:
        await init_db()
        email = "admin@testemail.com"
        
        output = []
        output.append(f"--- DIAGNOSING {email} ---")
        
        # 1. Check User
        user = await User.find_one(User.email == email)
        if not user:
            output.append("User: MISSING")
        else:
            output.append(f"User: FOUND (ID={user.id})")
            output.append(f"User.real_name: '{user.real_name}'")
            output.append(f"User.verified: {user.verified}")
            output.append(f"User.is_admin: {user.is_admin}")
            
            # 2. Check Profile
            profile = await Profile.find_one(Profile.user_id == str(user.id))
            if not profile:
                output.append("Profile: MISSING")
            else:
                output.append(f"Profile: FOUND (ID={profile.id})")
                output.append(f"Profile.age: {profile.age}")
                output.append(f"Profile.birth_date: {profile.birth_date}")
                output.append(f"Profile.gender: {profile.gender}")
                output.append(f"Profile.feeling_curious: {profile.feeling_curious}")

        # 3. Check Employee
        employee = await Employee.find_one(Employee.email == email)
        if not employee:
            output.append("Employee: MISSING")
        else:
            output.append(f"Employee: FOUND (ID={employee.id})")
            
        with open("status_report.txt", "w") as f:
            f.write("\n".join(output))
            
    except Exception as e:
        with open("status_report.txt", "w") as f:
            f.write(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose())
