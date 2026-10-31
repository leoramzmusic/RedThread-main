from typing import Dict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_history import NotificationHistory
from src.models.notification_delivery import NotificationDelivery
from src.models.notification_campaign import NotificationCampaign
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()


class MetricsOut(BaseModel):
    total_history: int
    by_status: Dict[str, int]
    sent_last_24h: int
    sent_last_7d: int
    total_deliveries: int
    deliveries_by_status: Dict[str, int]
    total_campaigns: int
    campaigns_by_status: Dict[str, int]

    model_config = ConfigDict(populate_by_name=True)


@router.get("", response_model=MetricsOut)
async def get_metrics(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    total_history = await NotificationHistory.find_all().count()
    by_status: Dict[str, int] = {}
    for status in ("pending", "sent", "delivered", "read", "failed"):
        by_status[status] = await NotificationHistory.find({"status": status}).count()

    sent_last_24h = await NotificationHistory.find(
        {"sent_at": {"$gte": last_24h}}
    ).count()
    sent_last_7d = await NotificationHistory.find(
        {"sent_at": {"$gte": last_7d}}
    ).count()

    total_deliveries = await NotificationDelivery.find_all().count()
    deliveries_by_status: Dict[str, int] = {}
    for status in ("sent", "delivered", "opened", "dismissed", "expired", "failed"):
        deliveries_by_status[status] = await NotificationDelivery.find(
            {"status": status}
        ).count()

    total_campaigns = await NotificationCampaign.find_all().count()
    campaigns_by_status: Dict[str, int] = {}
    for status in ("draft", "scheduled", "active", "completed", "cancelled", "failed"):
        campaigns_by_status[status] = await NotificationCampaign.find(
            {"status": status}
        ).count()

    return MetricsOut(
        total_history=total_history,
        by_status=by_status,
        sent_last_24h=sent_last_24h,
        sent_last_7d=sent_last_7d,
        total_deliveries=total_deliveries,
        deliveries_by_status=deliveries_by_status,
        total_campaigns=total_campaigns,
        campaigns_by_status=campaigns_by_status,
    )
