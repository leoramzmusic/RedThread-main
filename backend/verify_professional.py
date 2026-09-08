
import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from src.care.scoring.compatibility import calculate_professional_compatibility, calculate_professional_context
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile

async def verify_professional_logic():
    print("--- Verificando Lógica Profesional y Académica ---")
    
    # 1. Test Base Match (Same University)
    print("\n1. Universidad coincidente:")
    user = UserProfile(id="u1", age=25, location=(0,0), education_center="UNAM")
    cand = CandidateProfile(id="c1", age=25, location=(0,0), education_center="UNAM")
    
    score = calculate_professional_compatibility(user, cand)
    ctx = calculate_professional_context(user, cand)
    print(f"Score: {score} (Expected 1.0)")
    print(f"Advice: {ctx['advice']}")

    # 2. Test Partial/No Match
    print("\n2. Sin coincidencia:")
    cand_diff = CandidateProfile(id="c2", age=25, location=(0,0), education_center="IPN", work_company="Google")
    score_ns = calculate_professional_compatibility(user, cand_diff)
    print(f"Score: {score_ns} (Expected 0.0)")

    # 3. Test Multiple Checks
    print("\n3. Coincidencia parcial (Empresa no, Uni sí):")
    user_multi = UserProfile(id="u1", age=25, location=(0,0), education_center="UNAM", work_company="Meta")
    cand_multi = CandidateProfile(id="c1", age=25, location=(0,0), education_center="UNAM", work_company="Google")
    score_p = calculate_professional_compatibility(user_multi, cand_multi)
    print(f"Score: {score_p} (Expected 0.5)")

    # 4. Test Education Level Boost Match
    print("\n4. Coincidencia Nivel Educativo:")
    user_ed = UserProfile(id="u1", age=25, location=(0,0), education_level="Master")
    cand_ed = CandidateProfile(id="c1", age=25, location=(0,0), education_level="Master")
    score_ed = calculate_professional_compatibility(user_ed, cand_ed)
    print(f"Score: {score_ed} (Expected 1.0 - placeholder match)")

if __name__ == "__main__":
    asyncio.run(verify_professional_logic())
