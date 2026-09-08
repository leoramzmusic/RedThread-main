from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.campaign import Campaign, CampaignStatus, CampaignType
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.rbac import require_permission, log_admin_action
from src.api.auth import get_current_user


router = APIRouter()


class CreateCampaignRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: CampaignType
    subject: Optional[str] = None
    content: str
    media_url: Optional[str] = None
    action_url: Optional[str] = None
    target_audience: Dict[str, Any] = {}
    scheduled_at: Optional[datetime] = None
    tags: List[str] = []


@router.get("/listado")
async def listar_campanas(
    status_filter: Optional[CampaignStatus] = None,
    type_filter: Optional[CampaignType] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_CAMPAIGNS))
) -> List[Dict[str, Any]]:
    """List all campaigns with filters - Admin only"""
    
    # Build query
    query = {}
    if status_filter:
        query["status"] = status_filter
    if type_filter:
        query["type"] = type_filter
    
    # Get campaigns
    campaigns = await Campaign.find(query).sort(-Campaign.created_at).skip(offset).limit(limit).to_list()
    
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "type": c.type,
            "status": c.status,
            "scheduled_at": c.scheduled_at,
            "sent_count": c.sent_count,
            "open_rate": round(c.open_rate, 2),
            "click_rate": round(c.click_rate, 2)
        }
        for c in campaigns
    ]


@router.post("/crear")
async def crear_campana(
    campaign_data: CreateCampaignRequest,
    admin_user: AdminUser = Depends(require_permission(Permission.CREATE_CAMPAIGNS))
) -> Dict[str, Any]:
    """Create new campaign - Admin only"""
    
    campaign = Campaign(
        name=campaign_data.name,
        description=campaign_data.description,
        type=campaign_data.type,
        subject=campaign_data.subject,
        content=campaign_data.content,
        media_url=campaign_data.media_url,
        action_url=campaign_data.action_url,
        target_audience=campaign_data.target_audience,
        scheduled_at=campaign_data.scheduled_at,
        status=CampaignStatus.SCHEDULED if campaign_data.scheduled_at else CampaignStatus.DRAFT,
        tags=campaign_data.tags,
        created_by=admin_user.user_id
    )
    
    await campaign.insert()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="create_campaign",
        description=f"Created campaign: {campaign.name}",
        target_type="campaign",
        target_id=str(campaign.id)
    )
    
    return {
        "message": "Campaña creada exitosamente",
        "campaign_id": str(campaign.id)
    }


@router.get("/{campaign_id}/estadisticas")
async def get_campaign_stats(
    campaign_id: str,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_METRICS))
) -> Dict[str, Any]:
    """Get detailed campaign statistics - Admin only"""
    
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "status": campaign.status,
        "metrics": {
            "sent": campaign.sent_count,
            "delivered": campaign.delivered_count,
            "opened": campaign.opened_count,
            "clicked": campaign.clicked_count,
            "failed": campaign.failed_count,
            "open_rate": round(campaign.open_rate, 2),
            "click_rate": round(campaign.click_rate, 2)
        },
        "timeline": {
            "created_at": campaign.created_at,
            "scheduled_at": campaign.scheduled_at,
            "started_at": campaign.started_at,
            "completed_at": campaign.completed_at
        }
    }


@router.put("/{campaign_id}/estado")
async def update_campaign_status(
    campaign_id: str,
    status_update: str = Body(..., embed=True),  # active, paused, cancelled
    admin_user: AdminUser = Depends(require_permission(Permission.MANAGE_CAMPAIGNS))
) -> Dict[str, Any]:
    """Update campaign status - Admin only"""
    
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Validate status transition
    try:
        new_status = CampaignStatus(status_update)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    old_status = campaign.status
    campaign.status = new_status
    campaign.updated_at = datetime.utcnow()
    
    if new_status == CampaignStatus.ACTIVE and not campaign.started_at:
        campaign.started_at = datetime.utcnow()
    elif new_status == CampaignStatus.COMPLETED:
        campaign.completed_at = datetime.utcnow()
        
    await campaign.save()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="update_campaign_status",
        description=f"Updated campaign {campaign.name} status to {new_status}",
        target_type="campaign",
        target_id=campaign_id,
        metadata={"old_status": old_status, "new_status": new_status}
    )
    
    return {
        "message": "Estado de campaña actualizado",
        "status": new_status
    }

