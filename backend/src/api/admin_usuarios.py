from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import re
from src.models.user import User
from src.models.profile import Profile
from src.models.relationship import Relationship
from src.models.report import Report
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.employee_rbac import require_employee_permission, require_all_employee_permissions, log_employee_action
from src.api.auth import get_current_user


router = APIRouter()


# Pydantic models for request validation
class UpdateAccountStatusRequest(BaseModel):
    status: str
    reason: str
    duration_days: Optional[int] = None


@router.get("/listado")
async def list_users(
    search: Optional[str] = Query(None, description="Search by name, email, ID or nickname"),
    country: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, description="Filter by account status (active, suspended, banned, deleted)"),
    verified_filter: Optional[bool] = Query(None),
    tier_filter: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    last_active_days: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    is_2fa_enabled: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: int = Query(-1, ge=-1, le=1),
    limit: int = Query(50, le=500),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> Dict[str, Any]:
    """
    List all users with advanced pagination and filters.
    """
    
    # Base user query
    user_query = {}
    
    # 1. Filter by User fields
    if status_filter:
        user_query["account_status"] = status_filter
    if verified_filter is not None:
        user_query["is_verified"] = verified_filter
    if tier_filter:
        user_query["subscription_tier"] = tier_filter
    if is_2fa_enabled is not None:
        user_query["is_2fa_enabled"] = is_2fa_enabled
        
    # Date ranges
    if date_from or date_to:
        created_query = {}
        if date_from:
            created_query["$gte"] = date_from
        if date_to:
            created_query["$lte"] = date_to
        user_query["created_at"] = created_query
        
    if last_active_days:
        cutoff = datetime.utcnow() - timedelta(days=last_active_days)
        user_query["last_active"] = {"$gte": cutoff}

    # 2. Filter by Profile fields (via sub-query if necessary)
    profile_query = {}
    if country:
        profile_query["location.country"] = country
    if state:
        profile_query["location.state"] = state
    if city:
        profile_query["location.city"] = city
    if language:
        # Check both User.preferred_language and Profile.languages? 
        # User model has preferred_language
        user_query["preferred_language"] = language

    if profile_query:
        # Get user IDs from filtered profiles
        profiles_with_location = await Profile.find(profile_query).to_list()
        location_user_ids = [p.user_id for p in profiles_with_location]
        if "id" in user_query:
            # Intersection if already set (e.g. from search)
            pass 
        user_query["_id"] = {"$in": [str(uid) for uid in location_user_ids]}

    # 3. Smart Search
    if search:
        search_regex = {"$regex": re.escape(search), "$options": "i"}
        search_query = {
            "$or": [
                {"email": search_regex},
                {"display_name": search_regex},
                {"nickname": search_regex},
                {"nickname": search} # Exact match for nickname
            ]
        }
        # If it looks like an ObjectId, search by ID too
        try:
            from bson import ObjectId
            if ObjectId.is_valid(search):
                search_query["$or"].append({"_id": ObjectId(search)})
        except:
            pass
            
        if user_query:
            user_query = {"$and": [user_query, search_query]}
        else:
            user_query = search_query

    # Execute query with sorting
    users = await User.find(user_query).sort([(sort_by, sort_order)]).skip(offset).limit(limit).to_list()
    total_count = await User.find(user_query).count()
    
    # Enrich with profile data
    enriched_users = []
    for user in users:
        profile = await Profile.find_one(Profile.user_id == str(user.id))
        
        # Get user statistics (cached or summarized)
        relationships_count = await Relationship.find({
            "$or": [
                {"user_a_id": str(user.id)},
                {"user_b_id": str(user.id)}
            ]
        }).count()
        
        reports_received = await Report.find(
            Report.reported_user_id == str(user.id)
        ).count()
        
        enriched_users.append({
            "id": str(user.id),
            "email": user.email,
            "display_name": getattr(user, 'display_name', None) or (profile.nickname if profile else None) or "User",
            "nickname": getattr(user, 'nickname', 'user'),
            "photo": profile.photos[0] if profile and profile.photos else None,
            "account_status": getattr(user, 'account_status', 'active'),
            "is_verified": user.is_verified,
            "subscription_tier": user.subscription_tier,
            "created_at": user.created_at.isoformat(),
            "last_active": user.last_active.isoformat() if user.last_active else None,
            "location": {
                "country": profile.location.country if profile and profile.location else None,
                "state": profile.location.state if profile and profile.location else None,
                "city": profile.location.city if profile and profile.location else None,
            } if profile else None,
            "stats": {
                "relationships": relationships_count,
                "reports_received": reports_received,
                "profile_completion": profile.profile_completion if profile else 0
            }
        })
    
    return {
        "users": enriched_users,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "summary": {
            "active": await User.find({"account_status": "active"}).count() if hasattr(User, 'account_status') else total_count,
            "suspended": await User.find({"account_status": "suspended"}).count() if hasattr(User, 'account_status') else 0,
            "new_today": await User.find({"created_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}}).count()
        }
    }


@router.get("/dashboard-stats")
async def get_admin_dashboard_stats(
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_METRICS))
) -> Dict[str, Any]:
    """
    Get detailed user statistics for the admin dashboard.
    """
    now = datetime.utcnow()
    
    # 1. Volume Metrics
    total_users = await User.find_all().count()
    verified_users = await User.find(User.is_verified == True).count()
    
    # 2. Activity Metrics
    seven_days_ago = now - timedelta(days=7)
    active_users_7d = await User.find(User.last_active >= seven_days_ago).count()
    
    # 3. Trends (New Users)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    new_today = await User.find(User.created_at >= today_start).count()
    new_week = await User.find(User.created_at >= week_start).count()
    new_month = await User.find(User.created_at >= month_start).count()
    
    # 4. Status Distribution
    active_status = await User.find(User.account_status == "active").count() if hasattr(User, 'account_status') else total_users
    suspended_status = await User.find(User.account_status == "suspended").count() if hasattr(User, 'account_status') else 0
    banned_status = await User.find(User.account_status == "banned").count() if hasattr(User, 'account_status') else 0
    
    # 5. Geostats (Top 5 Countries) - Requires aggregation for efficiency
    pipeline = [
        {"$match": {"location.country": {"$ne": None}}},
        {"$group": {"_id": "$location.country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    country_counts = await Profile.aggregate(pipeline).to_list()
    
    return {
        "overview": {
            "total": total_users,
            "verified": verified_users,
            "active_7d": active_users_7d,
            "new": {
                "today": new_today,
                "week": new_week,
                "month": new_month
            }
        },
        "distribution": {
            "status": {
                "active": active_status,
                "suspended": suspended_status,
                "banned": banned_status
            },
            "countries": [{"name": c["_id"], "value": c["count"]} for c in country_counts]
        }
    }


@router.get("/exportar")
async def export_users(
    format: str = Query("json", regex="^(json|csv)$"),
    admin_user: AdminUser = Depends(require_employee_permission(Permission.EXPORT_METRICS))
):
    """
    Export all users in JSON or CSV format.
    """
    users = await User.find_all().to_list()
    
    data = []
    for user in users:
        profile = await Profile.find_one(Profile.user_id == str(user.id))
        data.append({
            "id": str(user.id),
            "email": user.email,
            "display_name": getattr(user, 'display_name', None) or (profile.nickname if profile else None) or "User",
            "status": getattr(user, 'account_status', 'active'),
            "verified": user.is_verified,
            "created_at": user.created_at.isoformat(),
            "country": profile.location.country if profile and profile.location else "Unknown"
        })
    
    if format == "json":
        return data
        
    # Generate CSV
    import io
    import csv
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["id", "email", "display_name", "status", "verified", "created_at", "country"])
    writer.writeheader()
    writer.writerows(data)
    
    from fastapi.responses import Response
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=usuarios_redthread_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/{user_id}")
async def get_user_details(
    user_id: str,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> Dict[str, Any]:
    """
    Get detailed information about a specific user.
    Admin only.
    """
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = await Profile.find_one(Profile.user_id == user_id)
    
    # Get relationships
    relationships = await Relationship.find({
        "$or": [
            {"user_a_id": user_id},
            {"user_b_id": user_id}
        ]
    }).to_list()
    
    # Get reports
    reports_made = await Report.find(Report.reporter_id == user_id).to_list()
    reports_received = await Report.find(Report.reported_user_id == user_id).to_list()
    
    return {
        "id": str(user.id),
        "email": user.email,
        "account_status": getattr(user, 'account_status', 'active'),
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat(),
        "last_active": user.last_active.isoformat() if user.last_active else None,
        "profile": {
            "display_name": getattr(user, 'display_name', None) or (profile.nickname if profile else None) or "User",
            "age": profile.age if profile else None,
            "gender": profile.gender if profile else None,
            "city": profile.city if profile else None,
            "bio": profile.bio if profile else None,
            "photos_count": len(profile.photos) if profile and profile.photos else 0,
            "profile_completion": profile.profile_completion if profile else 0,
            "relationship_status": profile.relationship_status if profile else None
        },
        "statistics": {
            "total_relationships": len(relationships),
            "matches": len([r for r in relationships if r.type == "match"]),
            "friends": len([r for r in relationships if r.type == "friend"]),
            "reports_made": len(reports_made),
            "reports_received": len(reports_received)
        },
        "recent_reports": [
            {
                "id": str(r.id),
                "reason": r.reason,
                "status": r.status,
                "created_at": r.created_at.isoformat()
            }
            for r in reports_received[-5:]  # Last 5 reports
        ]
    }


@router.put("/{user_id}/estado")
async def update_account_status(
    user_id: str,
    request_data: UpdateAccountStatusRequest,
    admin_user: AdminUser = Depends(require_all_employee_permissions([
        Permission.VIEW_USERS,
        Permission.SUSPEND_USERS
    ]))
) -> Dict[str, Any]:
    """
    Update user account status (suspend, ban, activate).
    Admin only.
    """
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate status
    valid_statuses = ["active", "suspended", "banned", "deleted"]
    if request_data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update user status
    user.account_status = request_data.status
    
    # Set suspension end date if temporary
    if request_data.status == "suspended" and request_data.duration_days:
        user.suspension_end = datetime.utcnow() + timedelta(days=request_data.duration_days)
    
    # Log the action
    if not hasattr(user, 'status_history'):
        user.status_history = []
    
    user.status_history.append({
        "status": request_data.status,
        "reason": request_data.reason,
        "changed_by": str(admin_user.user_id),
        "changed_at": datetime.utcnow().isoformat()
    })
    
    await user.save()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="update_account_status",
        description=f"Updated user {user_id} status to {request_data.status}",
        target_type="user",
        target_id=user_id,
        metadata={"reason": request_data.reason, "status": request_data.status}
    )
    
    # TODO: Send notification to user
    # TODO: Log admin action for audit
    
    return {
        "message": f"Account status updated to {request_data.status}",
        "user_id": user_id,
        "new_status": request_data.status
    }


@router.get("/{user_id}/historial")
async def get_user_activity_history(
    user_id: str,
    limit: int = Query(50, le=200),
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> Dict[str, Any]:
    """
    Get user activity history.
    Admin only.
    """
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = await Profile.find_one(Profile.user_id == user_id)
    
    # Get recent relationships
    relationships = await Relationship.find({
        "$or": [
            {"user_a_id": user_id},
            {"user_b_id": user_id}
        ]
    }).sort(-Relationship.created_at).limit(limit).to_list()
    
    # Get reports
    reports_made = await Report.find(
        Report.reporter_id == user_id
    ).sort(-Report.created_at).limit(limit).to_list()
    
    reports_received = await Report.find(
        Report.reported_user_id == user_id
    ).sort(-Report.created_at).limit(limit).to_list()
    
    return {
        "user": {
            "id": user_id,
            "email": user.email,
            "display_name": user.display_name if user else None
        },
        "activity": {
            "relationships": [
                {
                    "id": str(r.id),
                    "type": r.type,
                    "status": r.status,
                    "created_at": r.created_at.isoformat()
                }
                for r in relationships
            ],
            "reports_made": [
                {
                    "id": str(r.id),
                    "reported_user_id": r.reported_user_id,
                    "reason": r.reason,
                    "status": r.status,
                    "created_at": r.created_at.isoformat()
                }
                for r in reports_made
            ],
            "reports_received": [
                {
                    "id": str(r.id),
                    "reporter_id": r.reporter_id,
                    "reason": r.reason,
                    "status": r.status,
                    "created_at": r.created_at.isoformat()
                }
                for r in reports_received
            ]
        },
        "status_history": getattr(user, 'status_history', [])
    }


@router.get("/perfiles-reportados")
async def get_flagged_profiles(
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> List[Dict[str, Any]]:
    """
    Get profiles with multiple reports (3+).
    Admin only.
    """
    # Get users with multiple reports
    all_reports = await Report.find_all().to_list()
    
    # Count reports per user
    user_report_counts = {}
    for report in all_reports:
        user_id = report.reported_user_id
        user_report_counts[user_id] = user_report_counts.get(user_id, 0) + 1
    
    # Filter users with 3+ reports
    flagged_user_ids = [uid for uid, count in user_report_counts.items() if count >= 3]
    
    flagged_profiles = []
    for user_id in flagged_user_ids:
        user = await User.get(user_id)
        profile = await Profile.find_one(Profile.user_id == user_id)
        
        if user and profile:
            flagged_profiles.append({
                "user_id": user_id,
                "email": user.email,
                "display_name": getattr(user, 'display_name', None) or (profile.nickname if profile else None) or "User",
                "photo": profile.photos[0] if profile.photos else None,
                "report_count": user_report_counts[user_id],
                "account_status": getattr(user, 'account_status', 'active'),
                "created_at": user.created_at.isoformat(),
                "last_active": user.last_active.isoformat() if user.last_active else None
            })
    
    # Sort by report count descending
    flagged_profiles.sort(key=lambda x: x['report_count'], reverse=True)
    
    return flagged_profiles


