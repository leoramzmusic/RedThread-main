from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from src.models.subscription import Subscription, SubscriptionPlan, PaymentStatus
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.rbac import require_permission, log_admin_action
from src.api.auth import get_current_user


router = APIRouter()


@router.get("/suscripciones")
async def listar_suscripciones(
    plan: Optional[SubscriptionPlan] = None,
    active_only: bool = True,
    limit: int = Query(50, le=100),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_FINANCES))
) -> List[Dict[str, Any]]:
    """List all subscriptions with filters - Admin only"""
    
    # Build query
    query = {}
    if plan:
        query["plan"] = plan
    if active_only:
        query["is_active"] = True
    
    # Get subscriptions
    subscriptions = await Subscription.find(query).sort(-Subscription.created_at).skip(offset).limit(limit).to_list()
    
    return [
        {
            "id": str(sub.id),
            "user_id": sub.user_id,
            "plan": sub.plan,
            "is_active": sub.is_active,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "amount": sub.amount,
            "currency": sub.currency
        }
        for sub in subscriptions
    ]


@router.get("/ingresos")
async def get_revenue_stats(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_FINANCES))
) -> Dict[str, Any]:
    """Get revenue statistics - Admin only"""
    
    now = datetime.utcnow()
    start_date = now
    
    if period == "day":
        start_date = now - timedelta(days=1)
    elif period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    
    # Get subscriptions created in period
    new_subs = await Subscription.find(
        Subscription.created_at >= start_date
    ).to_list()
    
    total_revenue = sum(sub.amount for sub in new_subs)
    
    return {
        "period": period,
        "total_revenue": total_revenue,
        "new_subscriptions": len(new_subs),
        "average_revenue_per_user": total_revenue / len(new_subs) if new_subs else 0
    }


@router.get("/estadisticas")
async def get_financial_stats(
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_METRICS))
) -> Dict[str, Any]:
    """Get overall financial statistics - Admin only"""
    
    total_subs = await Subscription.find_all().count()
    active_subs = await Subscription.find(Subscription.is_active == True).count()
    
    # Count by plan
    plan_counts = {}
    for plan in SubscriptionPlan:
        count = await Subscription.find(Subscription.plan == plan).count()
        plan_counts[plan.value] = count
    
    return {
        "total_subscriptions": total_subs,
        "active_subscriptions": active_subs,
        "churn_rate": (total_subs - active_subs) / total_subs if total_subs > 0 else 0,
        "by_plan": plan_counts
    }


@router.post("/{subscription_id}/cancelar")
async def cancel_subscription(
    subscription_id: str,
    reason: str = Body(..., embed=True),
    admin_user: AdminUser = Depends(require_permission(Permission.MANAGE_SUBSCRIPTIONS))
) -> Dict[str, Any]:
    """Cancel a subscription - Admin only"""
    
    sub = await Subscription.get(subscription_id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    sub.is_active = False
    sub.auto_renew = False
    sub.cancelled_at = datetime.utcnow()
    sub.cancellation_reason = reason
    await sub.save()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="cancel_subscription",
        description=f"Cancelled subscription for user {sub.user_id}",
        target_type="subscription",
        target_id=subscription_id,
        metadata={"reason": reason}
    )
    
    return {"message": "Subscription cancelled successfully"}

