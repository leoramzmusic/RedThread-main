from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime, timezone
from src.models.notification import Notification
from src.models.campaign import Campaign
from src.models.support_ticket import SupportTicket
from src.models.report import Report

router = APIRouter()

@router.get("/kpis")
@router.get("")
async def get_admin_notification_kpis() -> Dict[str, Any]:
    """Get aggregated notification and operational KPIs for Admin Notification Center."""
    enviadas_hoy = 0
    no_leidas = 0
    alertas_p0 = 0
    ctr_promedio = 0.0
    acciones_pendientes = 0

    try:
        start_of_today_naive = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        enviadas_notifs = await Notification.find({"created_at": {"$gte": start_of_today_naive}}).count()
        enviadas_campaigns = await Campaign.find({"created_at": {"$gte": start_of_today_naive}}).count()
        enviadas_hoy = enviadas_notifs + enviadas_campaigns

        no_leidas = await Notification.find({"is_read": False}).count()

        notifs_p0 = await Notification.find({"priority": "P0"}).count()
        tickets_crit = await SupportTicket.find({"priority": "critical"}).count()
        alertas_p0 = notifs_p0 + tickets_crit

        campaigns = await Campaign.find_all().to_list()
        if campaigns:
            total_ctr = sum(c.click_rate for c in campaigns)
            ctr_promedio = round(total_ctr / len(campaigns), 2)

        tickets_open = await SupportTicket.find({"status": "open"}).count()
        reports_pending = await Report.find({"status": "pending"}).count()
        acciones_pendientes = tickets_open + reports_pending

    except Exception as e:
        print(f"⚠️ KPI aggregation warning: {e}")

    return {
        "enviadas_hoy": enviadas_hoy,
        "no_leidas": no_leidas,
        "alertas_p0": alertas_p0,
        "ctr_promedio": ctr_promedio,
        "acciones_pendientes": acciones_pendientes,
    }
