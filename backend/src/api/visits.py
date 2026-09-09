from fastapi import APIRouter, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter
from bson import ObjectId
from src.models.user import User
from src.models.profile import Profile
from src.models.profile_visit import ProfileVisit
from src.models.user_settings import UserSettings
from src.api.auth import get_current_user


router = APIRouter()


@router.get("")
async def get_visits(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """List recent profile visitors with stats and privacy setting."""
    viewed_user_id = str(current_user.id)
    now = datetime.utcnow()
    collection = ProfileVisit.get_motor_collection()

    # Recent visits (last 50, all time)
    recent = await collection.find(
        {"viewed_user_id": viewed_user_id}
    ).sort("created_at", -1).limit(50).to_list(50)

    viewer_ids = {v.get("viewer_id") for v in recent if v.get("viewer_id")}

    # Batch-fetch viewer users and profiles for display info
    users_map: Dict[str, User] = {}
    profiles_map: Dict[str, Profile] = {}
    if viewer_ids:
        id_list = list(viewer_ids)
        try:
            user_docs = await User.find(
                {"_id": {"$in": [ObjectId(uid) for uid in id_list]}}
            ).to_list()
            for u in user_docs:
                users_map[str(u.id)] = u
        except Exception as e:
            print(f"[VISITS] Error fetching viewers: {e}")

        prof_docs = await Profile.find({"user_id": {"$in": id_list}}).to_list()
        for p in prof_docs:
            profiles_map[p.user_id] = p

    visits = []
    for v in recent:
        viewer_id = v.get("viewer_id")
        u = users_map.get(viewer_id)
        p = profiles_map.get(viewer_id)
        created_at = v.get("created_at")
        visits.append({
            "viewer_id": viewer_id,
            "display_name": (u.display_name if u else None) or "Usuario",
            "nickname": u.nickname if u else None,
            "photo": (p.photos[0] if p and p.photos else None),
            "visited_at": created_at.isoformat() + "Z" if created_at else None,
        })

    # Stats (today / week / month) + daily buckets for the chart (last 14 days)
    since_month = now - timedelta(days=30)
    since_week = now - timedelta(days=7)
    since_14 = now - timedelta(days=14)
    today_start = datetime(now.year, now.month, now.day)

    month_docs = await collection.find(
        {"viewed_user_id": viewed_user_id, "created_at": {"$gte": since_month}}
    ).to_list(None)

    week_count = 0
    today_count = 0
    daily_counts: Counter = Counter()
    for d in month_docs:
        ts = d.get("created_at")
        if not ts:
            continue
        if ts >= today_start:
            today_count += 1
        if ts >= since_week:
            week_count += 1
        if ts >= since_14:
            daily_counts[ts.strftime("%Y-%m-%d")] += 1

    day_keys = sorted((now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(14))
    daily = [{"date": day, "count": daily_counts.get(day, 0)} for day in day_keys]

    settings = await UserSettings.find_one({"user_id": viewed_user_id})
    hide_visit_activity = bool(settings and getattr(settings, "hide_visit_activity", False))

    # Distinct visitors all-time (matches dashboard profile_visits)
    distinct_viewers = await collection.distinct("viewer_id", {"viewed_user_id": viewed_user_id})

    return {
        "visits": visits,
        "stats": {
            "today": today_count,
            "week": week_count,
            "month": len(month_docs),
            "total": len(distinct_viewers),
            "daily": daily,
        },
        "hide_visit_activity": hide_visit_activity,
    }