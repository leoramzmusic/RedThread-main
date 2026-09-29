
import asyncio
import os
import sys
import traceback

# Add backend path to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile, Gender
from src.models.match import Match
from src.care.ranking.ranker import rank_candidates
from src.care.adapters import profile_to_user_profile, profile_to_candidate_profile
from src.care.models.system_params import SystemParams

async def debug_discovery():
    with open("debug_discovery_output.txt", "w") as f:
        try:
            # Connect to DB
            db_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            db_name = "redthread"
            
            from src.models.user import User
            from src.models.profile import Profile
            from src.models.match import Match
            from src.models.message import Message
            from src.models.conversation import Conversation
            from src.models.relationship import Relationship
            from src.models.report import Report
            from src.models.system_options import SystemOption
            from src.models.event import Event
            from src.models.notification import Notification
            from src.models.admin_rbac import AdminUser, AdminAction
            from src.models.employee import Employee
            from src.models.subscription import Subscription
            from src.models.campaign import Campaign
            from src.models.support_ticket import SupportTicket
            from src.models.legal_document import LegalDocument
            from src.models.media import MediaItem
            from src.models.session import Session
            from src.models.verification_log import VerificationLog
            from src.models.user_settings import UserSettings
            from src.models.role import Role
            from src.models.department import Department
            from src.models.employee_audit import EmployeeAudit
            from src.models.report_rule import ReportRule
            from src.models.audit_log import AuditLog
            from src.models.algorithm_management import AlgorithmFactor, AlgorithmHistory, ABTest
            from src.models.golth import GolthProfile, GolthInterest
            from src.models.appearance import AppearanceResource
            from src.models.appearance_history import AppearanceHistory
            from src.models.photo_metric import PhotoMetric

            f.write(f"Connecting to {db_url} / {db_name}\n")
            client = AsyncIOMotorClient(db_url)
            await init_beanie(
                database=client[db_name], 
                document_models=[
                    User, Profile, Match, Message, Conversation, Relationship, Report,
                    SystemOption, Event, Notification, AdminUser, AdminAction, Employee,
                    Subscription, Campaign, SupportTicket, LegalDocument, MediaItem,
                    Session, VerificationLog, UserSettings, Role, Department, EmployeeAudit,
                    ReportRule, AuditLog, AlgorithmFactor, AlgorithmHistory, ABTest,
                    GolthProfile, GolthInterest, AppearanceResource, AppearanceHistory,
                    PhotoMetric
                ]
            )

            # 1. Get User
            email = "maria@redthread.com"
            user = await User.find_one({"email": email})
            if not user:
                f.write(f"User {email} not found!\n")
                return

            my_profile = await Profile.find_one(Profile.user_id == str(user.id))
            if not my_profile:
                f.write("Profile not found!\n")
                return
                
            f.write(f"Debugging discovery for: {user.nickname} (ID: {user.id})\n")
            f.write(f"Profile Completion: {my_profile.profile_completion}%\n")
            f.write(f"Gender: {my_profile.gender}\n")
            f.write(f"Attraction Preferences: {my_profile.attraction_preferences}\n")
            
            is_incomplete_profile = my_profile.profile_completion < 60
            f.write(f"Is Incomplete Profile? {is_incomplete_profile}\n")

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
            
            f.write(f"Interacted Users count: {len(interacted_user_ids)}\n")
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
            else:
                f.write("Strict Mutual Interest Filter DISABLED (due to incomplete/free/curiosity)\n")
                
            query_result = await Profile.find(query).to_list()
            f.write(f"Standard Query User Candidates Found: {len(query_result)}\n")
            
            candidates_to_rank = query_result

            if len(query_result) == 0:
                f.write("Standard Query returned 0. Checking Fallback Logic...\n")
                
                fallback_query = {
                    "profile_visible": True,
                    "show_me_in_discovery": True,
                    "user_id": {"$nin": excluded_ids}
                }
                
                # Gender Preferences Check
                if my_profile.attraction_preferences:
                    fallback_query["gender"] = {"$in": my_profile.attraction_preferences}
                    f.write(f"Fallback filtering by gender: {my_profile.attraction_preferences}\n")
                else:
                    f.write("Fallback has NO gender filter.\n")
                    
                fallback_result = await Profile.find(fallback_query).to_list()
                f.write(f"Fallback Query Candidates Found: {len(fallback_result)}\n")
                candidates_to_rank = fallback_result
                
                # Check total visible profiles in DB just in case
                total = await Profile.find({"profile_visible": True}).count()
                f.write(f"Total Visible Profiles in DB (ALL): {total}\n")
                
                if len(fallback_result) == 0:
                    f.write("Even fallback returned 0. This means no one matches criteria or DB is empty.\n")
                    return

            # 4. Simulate Ranker
            f.write("Simulating Ranker...\n")
            user_p = profile_to_user_profile(my_profile, user)
            candidates = [profile_to_candidate_profile(p, None) for p in candidates_to_rank]
            params = SystemParams() # Use default params
            
            # Print first candidate data
            if candidates:
                c = candidates[0]
                f.write(f"TOP CANDIDATE DATA: ID={c.id}, Gender={c.gender}, Orientation={c.sexual_orientation}\n")
            
            # Strict mode check
            strict_mode = (mode != "free" and my_profile.gender != Gender.PREFER_NOT_TO_SAY and not is_incomplete_profile)
            f.write(f"Strict Mode for Ranker: {strict_mode}\n")
            
            ranked = await rank_candidates(
                user_p, 
                candidates, 
                {},  # No interaction logs for now
                limit=10,
                params=params,
                strict=strict_mode,
                mode=mode
            )
            
            f.write(f"Ranked Candidates Returned: {len(ranked)}\n")
            for i, item in enumerate(ranked[:3]):
                f.write(f"Candidate {i} Score: {item['score'] * 100}% (Compat: {item['compat_score']*100}%, Dynamic: {item['dynamic_score']*100}%, Human: {item['human_adjustment']*100}%)\n")
                
            # 5. Simulate Mode Filtering (Suggested)
            filtered_ranked = []
            for item in ranked:
                score = item['compat_score'] * 100
                # If incomplete, base_threshold is 0
                base_threshold = 0 if is_incomplete_profile else 10
                if score < base_threshold:
                    f.write(f"Dropping candidate with score {score} (threshold {base_threshold})\n")
                    continue
                filtered_ranked.append(item)
                
            f.write(f"Final Filtered Result Count (Suggested Mode): {len(filtered_ranked)}\n")

        except Exception as e:
            f.write(f"ERROR: {str(e)}\n")
            f.write(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(debug_discovery())
