
import asyncio
import os
import sys

# Add backend path to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile, Gender
from src.models.match import Match
from src.care.ranking.ranker import rank_candidates
from src.care.adapters import profile_to_user_profile, profile_to_candidate_profile
from src.care.experiments.ab_testing import get_params_for_user, WEIGHT_EXPERIMENT
from src.care.models.system_params import SystemParams

async def debug_discovery():
    # Connect to DB
    db_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = "redthread"
    
    print(f"Connecting to {db_url} / {db_name}")
    client = AsyncIOMotorClient(db_url)
    await init_beanie(database=client[db_name], document_models=[User, Profile, Match])

    # 1. Get User
    email = "maria@redthread.com"
    user = await User.find_one({"email": email})
    if not user:
        print(f"User {email} not found!")
        return

    my_profile = await Profile.find_one(Profile.user_id == str(user.id))
    if not my_profile:
        print("Profile not found!")
        return
        
    print(f"Debugging discovery for: {user.nickname} (ID: {user.id})")
    print(f"Profile Completion: {my_profile.profile_completion}%")
    print(f"Gender: {my_profile.gender}")
    print(f"Attraction Preferences: {my_profile.attraction_preferences}")
    
    is_incomplete_profile = my_profile.profile_completion < 60
    print(f"Is Incomplete Profile? {is_incomplete_profile}")

    # 2. Simulate User Exclusions
    existing_matches = await Match.find(
        {"$or": [
            {"user_id_1": str(user.id)},
            {"user_id_2": str(user.id)}
        ]}
    ).to_list()
    
    interacted_user_ids = set()
    for match in existing_matches:
        if match.user_id_1 == str(user.id):
            interacted_user_ids.add(match.user_id_2)
        else:
            interacted_user_ids.add(match.user_id_1)
            
    print(f"Interacted Users count: {len(interacted_user_ids)}")
    excluded_ids = list(interacted_user_ids) + [str(user.id)]

    # 3. Simulate DB Query (Standard)
    query = {
        "profile_visible": True,
        "show_me_in_discovery": True,
        "user_id": {"$nin": excluded_ids}
    }
    
    # Standard Logic from discovery.py
    active_curiosity = my_profile.feeling_curious
    mode = "suggested" # Checking standard mode
    
    # Mutual Interest Filter (Strictness check)
    if mode != "free" and my_profile.gender != Gender.PREFER_NOT_TO_SAY and not active_curiosity and not is_incomplete_profile:
        query["$or"] = [
            {"attraction_preferences": {"$in": [my_profile.gender]}},
            {"attraction_preferences": {"$exists": False}},
            {"attraction_preferences": []},
            {"attraction_preferences": None}
        ]
        
    query_result = await Profile.find(query).to_list()
    print(f"Standard Query User Candidates Found: {len(query_result)}")
    
    if len(query_result) == 0:
        print("Standard Query returned 0. Checking Fallback Logic...")
        
        fallback_query = {
            "profile_visible": True,
            "show_me_in_discovery": True,
            "user_id": {"$nin": excluded_ids}
        }
        
        # Gender Preferences Check
        if my_profile.attraction_preferences:
            fallback_query["gender"] = {"$in": my_profile.attraction_preferences}
            print(f"Fallback filtering by gender: {my_profile.attraction_preferences}")
        else:
            print("Fallback has NO gender filter.")
            
        fallback_result = await Profile.find(fallback_query).to_list()
        print(f"Fallback Query Candidates Found: {len(fallback_result)}")
        
        # Check total visible profiles in DB just in case
        total = await Profile.find({"profile_visible": True}).count()
        print(f"Total Visible Profiles in DB (excluding me? No, total): {total}")
        return

    # 4. Simulate Ranker
    print("Simulating Ranker...")
    user_p = profile_to_user_profile(my_profile, user)
    candidates = [profile_to_candidate_profile(p, None) for p in query_result]
    params = get_params_for_user(str(user.id), [WEIGHT_EXPERIMENT], SystemParams())
    
    # Strict mode check
    strict_mode = (mode != "free" and my_profile.gender != Gender.PREFER_NOT_TO_SAY and not is_incomplete_profile)
    print(f"Strict Mode for Ranker: {strict_mode}")
    
    ranked = await rank_candidates(
        user_p, 
        candidates, 
        {},  # No interaction logs for now
        limit=10,
        params=params,
        strict=strict_mode,
        mode=mode
    )
    
    print(f"Ranked Candidates Returned: {len(ranked)}")
    if len(ranked) > 0:
        print(f"Top Candidate Score: {ranked[0]['compat_score'] * 100}%")
        
    # 5. Simulate Mode Filtering (Suggested)
    filtered_ranked = []
    for item in ranked:
        score = item['compat_score'] * 100
        # If incomplete, base_threshold is 0
        base_threshold = 0 if is_incomplete_profile else 10
        if score < base_threshold:
            continue
        filtered_ranked.append(item)
        
    print(f"Final Filtered Result Count (Suggested Mode): {len(filtered_ranked)}")

if __name__ == "__main__":
    asyncio.run(debug_discovery())
