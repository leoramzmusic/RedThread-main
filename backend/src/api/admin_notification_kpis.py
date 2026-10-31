from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any, List
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


@router.get("/kpis/audiences")
async def get_notification_kpis_audiences() -> Dict[str, Any]:
    """Get notification distribution by audience type (users, employees, brands)."""
    try:
        users_count = await Notification.find({"recipient_type": "user"}).count()
        employees_count = await Notification.find({"recipient_type": "employee"}).count()
        brands_count = await Notification.find({"recipient_type": "brand"}).count()
    except Exception as e:
        print(f"⚠️ Audiences KPI warning: {e}")
        users_count = 0
        employees_count = 0
        brands_count = 0

    total = users_count + employees_count + brands_count

    return {
        "audiences": [
            {"type": "Usuarios", "key": "users", "count": users_count, "percentage": round((users_count / total * 100) if total else 0, 1)},
            {"type": "Empleados", "key": "employees", "count": employees_count, "percentage": round((employees_count / total * 100) if total else 0, 1)},
            {"type": "Marcas", "key": "brands", "count": brands_count, "percentage": round((brands_count / total * 100) if total else 0, 1)},
        ],
        "total": total,
    }


@router.get("/activity/recent")
async def get_notification_activity_recent() -> Dict[str, Any]:
    """Get recent notification activity for the activity feed."""
    try:
        recent = await Notification.find({}).sort([("created_at", -1)]).limit(10).to_list()
        activities = []
        for n in recent:
            audience_label = {"user": "Usuarios", "employee": "Empleados", "brand": "Marcas"}.get(n.recipient_type, n.recipient_type)
            activities.append({
                "id": str(n.id),
                "timestamp": n.created_at.isoformat() if n.created_at else datetime.utcnow().isoformat(),
                "campaign": n.content[:60] + ("..." if len(n.content) > 60 else ""),
                "audience": audience_label,
                "recipients": n.actor_count,
                "priority": n.priority,
                "category": n.category,
                "is_read": n.is_read,
            })
    except Exception as e:
        print(f"⚠️ Recent activity warning: {e}")
        activities = []

    return {"activities": activities}


@router.get("/campaigns/scheduled")
async def get_notification_campaigns_scheduled() -> Dict[str, Any]:
    """Get scheduled (upcoming) campaigns."""
    try:
        campaigns = await Campaign.find({"status": "scheduled"}).sort([("scheduled_at", 1)]).limit(10).to_list()
        items = []
        for c in campaigns:
            items.append({
                "id": str(c.id),
                "name": c.name,
                "scheduled_at": c.scheduled_at.isoformat() if c.scheduled_at else None,
                "type": c.type,
                "audience": c.target_recipient_type,
                "status": c.status,
                "sent_count": c.sent_count,
            })
    except Exception as e:
        print(f"⚠️ Scheduled campaigns warning: {e}")
        items = []

    return {"campaigns": items}


@router.get("/system/health")
async def get_notification_system_health() -> Dict[str, Any]:
    """Get system health status for notifications."""
    try:
        now = datetime.utcnow()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        critical_alerts = await Notification.find({"priority": "P0"}).count()
        pending_actions = await SupportTicket.find({"status": "open"}).count() + await Report.find({"status": "pending"}).count()
        failed_pushes = await Notification.find({"category": "security", "is_read": False}).count()
        active_campaigns = await Campaign.find({"status": "active"}).count()

        return {
            "alertas_criticas": critical_alerts,
            "acciones_requeridas": pending_actions,
            "push_fallidas": failed_pushes,
            "campanas_activas": active_campaigns,
            "estado": "operativo" if critical_alerts == 0 else "atencion",
            "timestamp": now.isoformat(),
        }
    except Exception as e:
        print(f"⚠️ System health warning: {e}")
        return {
            "alertas_criticas": 0,
            "acciones_requeridas": 0,
            "push_fallidas": 0,
            "campanas_activas": 0,
            "estado": "operativo",
            "timestamp": datetime.utcnow().isoformat(),
        }


@router.get("/trash")
async def get_notification_trash() -> Dict[str, Any]:
    """Get globally deleted notification items across all audiences."""
    try:
        deleted = await Notification.find({"deleted_at": {"$ne": None}}).sort([("deleted_at", -1)]).limit(50).to_list()
        items = []
        for n in deleted:
            audience_label = {"user": "Usuario", "employee": "Empleado", "brand": "Marca"}.get(n.recipient_type, n.recipient_type)
            category_label = {
                "announcement": "Anuncio",
                "alert": "Alerta",
                "operational": "Operacional",
                "security": "Seguridad",
                "maintenance": "Mantenimiento",
            }.get(n.category, n.category)
            items.append({
                "id": str(n.id),
                "tipo": audience_label,
                "nombre": n.content[:50] + ("..." if len(n.content) > 50 else ""),
                "categoria": category_label,
                "eliminado_por": str(n.created_by) if n.created_by else "Sistema",
                "fecha_eliminacion": n.deleted_at.isoformat() if n.deleted_at else None,
                "recipient_type": n.recipient_type,
                "priority": n.priority,
            })
    except Exception as e:
        print(f"⚠️ Trash warning: {e}")
        items = []

    return {"items": items, "total": len(items)}


@router.post("/trash/{item_id}/restore")
async def restore_notification_trash_item(item_id: str = Path(...)) -> Dict[str, Any]:
    """Restore a deleted notification item from the trash."""
    try:
        from bson import ObjectId
        n = await Notification.find_one({"_id": ObjectId(item_id)})
        if not n:
            raise HTTPException(status_code=404, detail="Ítem no encontrado en la papelera")
        n.deleted_at = None
        await n.save()
        return {"success": True, "id": item_id, "message": "Ítem restaurado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Restore trash warning: {e}")
        raise HTTPException(status_code=500, detail="Error al restaurar ítem")


@router.delete("/trash/{item_id}")
async def delete_notification_trash_item_permanently(item_id: str = Path(...)) -> Dict[str, Any]:
    """Permanently delete a notification item from the trash."""
    try:
        from bson import ObjectId
        n = await Notification.find_one({"_id": ObjectId(item_id)})
        if not n:
            raise HTTPException(status_code=404, detail="Ítem no encontrado en la papelera")
        await n.delete()
        return {"success": True, "id": item_id, "message": "Ítem eliminado definitivamente"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Permanent delete warning: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar ítem definitivamente")


@router.delete("/trash")
async def empty_notification_trash() -> Dict[str, Any]:
    """Empty the entire notification trash (permanently delete all deleted items)."""
    try:
        deleted = await Notification.find({"deleted_at": {"$ne": None}}).to_list()
        count = len(deleted)
        for n in deleted:
            await n.delete()
        return {"success": True, "deleted_count": count, "message": f"{count} ítem(es) eliminado(s) definitivamente"}
    except Exception as e:
        print(f"⚠️ Empty trash warning: {e}")
        raise HTTPException(status_code=500, detail="Error al vaciar la papelera")
