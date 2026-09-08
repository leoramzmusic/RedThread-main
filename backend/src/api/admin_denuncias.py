from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.user import User
from src.models.profile import Profile
from src.models.report import Report, ReportStatus, ReportPriority, ReportCategory
from src.models.report_rule import ReportRule, RuleAction, RuleTrigger
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.rbac import require_permission, log_admin_action


router = APIRouter()


class UpdateReportStatusRequest(BaseModel):
    """Request to update report status"""
    status: ReportStatus
    resolution_notes: Optional[str] = None

class AssignModeratorRequest(BaseModel):
    """Request to assign report to moderator"""
    moderator_id: str
    notes: Optional[str] = None

class BulkProcessRequest(BaseModel):
    """Request for bulk processing of reports"""
    report_ids: List[str]
    action: str  # "resolve", "dismiss", "assign"
    moderator_id: Optional[str] = None
    notes: Optional[str] = None

class ReportRuleCreate(BaseModel):
    """Schema for creating a moderation rule"""
    name: str
    description: Optional[str] = None
    trigger_type: RuleTrigger
    threshold: int = 5
    category_filter: Optional[ReportCategory] = None
    type_filter: Optional[str] = None
    action: RuleAction
    is_active: bool = True


# --- Static Routes First (to avoid parameterized route conflicts) ---

@router.get("/listado")
async def list_reports(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    reason_filter: Optional[str] = Query(None, description="Filter by reason"),
    limit: int = Query(50, le=100),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_REPORTS))
) -> Dict[str, Any]:
    """
    List all reports with pagination and filters.
    Admin/Moderator only.
    """
    
    # Build query
    query = {}
    if status_filter:
        query["status"] = status_filter
    if reason_filter:
        query["reason"] = reason_filter
    
    # Get reports
    reports = await Report.find(query).skip(offset).limit(limit).to_list()
    total_count = await Report.find(query).count()
    
    # Enrich with user data
    enriched_reports = []
    for report in reports:
        # Get reporter profile
        reporter_profile = await Profile.find_one(Profile.user_id == report.reporter_id)
        
        # Get reported user profile
        reported_profile = await Profile.find_one(Profile.user_id == report.reported_user_id)
        
        # Get moderator profile if assigned
        moderator_profile = None
        if report.assigned_to:
            moderator_profile = await Profile.find_one(Profile.user_id == report.assigned_to)
        
        enriched_reports.append({
            "id": str(report.id),
            "reporter": {
                "id": report.reporter_id,
                "name": reporter_profile.display_name if reporter_profile else "Unknown"
            },
            "reported_user": {
                "id": report.reported_user_id,
                "name": reported_profile.display_name if reported_profile else "Unknown"
            },
            "category": report.category,
            "report_type": report.report_type,
            "reason": report.reason,
            "description": report.description,
            "status": report.status,
            "priority": report.priority,
            "assigned_to": {
                "id": report.assigned_to,
                "name": moderator_profile.display_name if moderator_profile else None
            } if report.assigned_to else None,
            "created_at": report.created_at.isoformat(),
            "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None
        })
    
    return {
        "reports": enriched_reports,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }


@router.get("/estadisticas")
async def get_report_statistics(
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_METRICS))
) -> Dict[str, Any]:
    """
    Get overall report statistics using aggregation for efficiency.
    Admin only.
    """
    
    # Aggregate counts by status
    status_aggregation = await Report.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list()
    
    by_status = {
        "pending": 0,
        "under_review": 0,
        "resolved": 0,
        "dismissed": 0,
        "in_process": 0
    }
    
    total_reports = 0
    for item in status_aggregation:
        status_val = item["_id"]
        count = item["count"]
        if status_val in by_status:
            by_status[status_val] = count
        total_reports += count

    # For the frontend mapping, combine in_process and under_review if needed
    # but the frontend specifically looks for under_review
    by_status["under_review"] = by_status.get("under_review", 0) + by_status.get("in_process", 0)
    
    # Aggregate counts by reason (limit to top 10 to avoid too much data)
    reason_aggregation = await Report.aggregate([
        {"$group": {"_id": "$reason", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list()
    
    by_reason = {item["_id"]: item["count"] for item in reason_aggregation if item["_id"]}

    return {
        "total_reports": total_reports,
        "by_status": by_status,
        "by_reason": by_reason
    }


@router.post("/lotes/procesar")
async def bulk_process_reports(
    request_data: BulkProcessRequest,
    admin_user: AdminUser = Depends(require_permission(Permission.HANDLE_REPORTS))
) -> Dict[str, Any]:
    """
    Process multiple reports at once.
    Admin/Moderator only.
    """
    processed_count = 0
    for report_id in request_data.report_ids:
        report = await Report.get(report_id)
        if not report:
            continue
            
        if request_data.action == "resolve":
            report.status = ReportStatus.RESOLVED
            report.resolved_at = datetime.utcnow()
            report.resolved_by = admin_user.user_id
        elif request_data.action == "dismiss":
            report.status = ReportStatus.DISMISSED
            report.resolved_at = datetime.utcnow()
            report.resolved_by = admin_user.user_id
        elif request_data.action == "assign":
            if request_data.moderator_id:
                report.assigned_to = request_data.moderator_id
                report.assigned_at = datetime.utcnow()
                if report.status == ReportStatus.PENDING:
                    report.status = "under_review"
                    report.reviewed_at = datetime.utcnow()
        
        if request_data.notes:
            report.resolution_notes = (report.resolution_notes or "") + f"\n[Bulk Action]: {request_data.notes}"
            
        await report.save()
        processed_count += 1
        
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="bulk_process_reports",
        description=f"Processed {processed_count} reports with action {request_data.action}",
        target_type="report_batch",
        target_id="N/A"
    )
    
    return {
        "message": f"Successfully processed {processed_count} reports",
        "processed_count": processed_count
    }


@router.get("/configuracion/reglas")
async def list_moderation_rules(
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_CONFIG))
) -> List[Dict[str, Any]]:
    """List all automated moderation rules."""
    rules = await ReportRule.find_all().to_list()
    return [rule.dict() for rule in rules]


@router.post("/configuracion/reglas")
async def create_moderation_rule(
    rule_data: ReportRuleCreate,
    admin_user: AdminUser = Depends(require_permission(Permission.EDIT_CONFIG))
) -> Dict[str, Any]:
    """Create a new automated moderation rule."""
    rule = ReportRule(**rule_data.dict())
    await rule.insert()
    
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="create_moderation_rule",
        description=f"Created moderation rule: {rule_data.name}",
        target_type="moderation_rule",
        target_id=str(rule.id)
    )
    
    return rule.dict()


@router.delete("/configuracion/reglas/{rule_id}")
async def delete_moderation_rule(
    rule_id: str,
    admin_user: AdminUser = Depends(require_permission(Permission.EDIT_CONFIG))
) -> Dict[str, Any]:
    """Delete a moderation rule."""
    rule = await ReportRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    await rule.delete()
    
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="delete_moderation_rule",
        description=f"Deleted moderation rule: {rule_id}",
        target_type="moderation_rule",
        target_id=rule_id
    )
    
    return {"message": "Rule deleted successfully"}


# --- Parameterized Routes Last ---

@router.get("/{report_id}")
async def get_report_details(
    report_id: str,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_REPORTS))
) -> Dict[str, Any]:
    """
    Get detailed information about a specific report.
    Admin/Moderator only.
    """
    
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Get full user profiles
    reporter_profile = await Profile.find_one(Profile.user_id == report.reporter_id)
    reported_profile = await Profile.find_one(Profile.user_id == report.reported_user_id)
    
    # Get moderator if assigned
    moderator_profile = None
    if report.assigned_to:
        moderator_profile = await Profile.find_one(Profile.user_id == report.assigned_to)
    
    # Get reported user's other reports (as reporter and as reported)
    reports_by_user = await Report.find(
        Report.reporter_id == report.reported_user_id
    ).count()
    
    reports_against_user = await Report.find(
        Report.reported_user_id == report.reported_user_id
    ).count()
    
    return {
        "id": str(report.id),
        "reporter": {
            "id": report.reporter_id,
            "name": reporter_profile.display_name if reporter_profile else "Unknown",
            "photo": reporter_profile.photos[0] if reporter_profile and reporter_profile.photos else None
        },
        "reported_user": {
            "id": report.reported_user_id,
            "name": reported_profile.display_name if reported_profile else "Unknown",
            "photo": reported_profile.photos[0] if reported_profile and reported_profile.photos else None,
            "reports_made": reports_by_user,
            "reports_received": reports_against_user
        },
        "reason": report.reason,
        "description": report.description,
        "status": report.status,
        "assigned_to": {
            "id": report.assigned_to,
            "name": moderator_profile.display_name if moderator_profile else None
        } if report.assigned_to else None,
        "resolution_notes": report.resolution_notes,
        "created_at": report.created_at.isoformat(),
        "reviewed_at": report.reviewed_at.isoformat() if report.reviewed_at else None,
        "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None
    }


@router.put("/{report_id}/estado")
async def update_report_status(
    report_id: str,
    request_data: UpdateReportStatusRequest,
    admin_user: AdminUser = Depends(require_permission(Permission.HANDLE_REPORTS))
) -> Dict[str, Any]:
    """
    Update the status of a report.
    Admin/Moderator only.
    """
    
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Validate status
    valid_statuses = ["pending", "under_review", "resolved", "dismissed", "in_process"]
    if request_data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update report
    report.status = request_data.status
    
    if (request_data.status == ReportStatus.UNDER_REVIEW or request_data.status == "in_process") and not report.reviewed_at:
        report.reviewed_at = datetime.utcnow()
    
    if request_data.status in [ReportStatus.RESOLVED, ReportStatus.DISMISSED]:
        report.resolved_at = datetime.utcnow()
        report.resolved_by = admin_user.user_id
    
    if request_data.resolution_notes:
        report.resolution_notes = request_data.resolution_notes
    
    await report.save()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="update_report_status",
        description=f"Updated report {report_id} status to {request_data.status}",
        target_type="report",
        target_id=report_id
    )
    
    return {
        "message": "Report status updated successfully",
        "report_id": str(report.id),
        "new_status": report.status
    }


@router.put("/{report_id}/asignar")
async def assign_moderator(
    report_id: str,
    request_data: AssignModeratorRequest,
    admin_user: AdminUser = Depends(require_permission(Permission.ASSIGN_REPORTS))
) -> Dict[str, Any]:
    """
    Assign a report to a specific moderator.
    Admin/Moderator only.
    """
    
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Verify moderator/employee exists (in our dual system, employees are moderators)
    from src.models.employee import Employee
    moderator = await Employee.get(request_data.moderator_id)
    if not moderator:
        # Fallback to regular user if needed by some system A admins
        moderator = await User.get(request_data.moderator_id)
        
    if not moderator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Moderator not found"
        )
    
    # Assign report
    report.assigned_to = request_data.moderator_id
    report.assigned_at = datetime.utcnow()
    
    if request_data.notes:
        if not report.resolution_notes:
            report.resolution_notes = ""
        report.resolution_notes += f"\n[Assigned by {admin_user.user_id if hasattr(admin_user, 'user_id') else admin_user.email}]: {request_data.notes}"
    
    # Update status if still pending
    if report.status == "pending":
        report.status = "under_review"
        report.reviewed_at = datetime.utcnow()
    
    await report.save()
    
    return {
        "message": "Report assigned successfully",
        "report_id": str(report.id),
        "assigned_to": request_data.moderator_id
    }


@router.get("/usuario/{user_id}/historial")
async def get_user_report_history(
    user_id: str,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_REPORTS))
) -> Dict[str, Any]:
    """
    Get all reports involving a specific user (as reporter or reported).
    Admin/Moderator only.
    """
    
    # Get reports made by user
    reports_made = await Report.find(
        Report.reporter_id == user_id
    ).to_list()
    
    # Get reports against user
    reports_received = await Report.find(
        Report.reported_user_id == user_id
    ).to_list()
    
    # Get user profile
    profile = await Profile.find_one(Profile.user_id == user_id)
    
    return {
        "user": {
            "id": user_id,
            "name": profile.display_name if profile else "Unknown"
        },
        "reports_made": {
            "count": len(reports_made),
            "reports": [
                {
                    "id": str(r.id),
                    "reported_user_id": r.reported_user_id,
                    "reason": r.reason,
                    "status": r.status,
                    "created_at": r.created_at.isoformat()
                }
                for r in reports_made
            ]
        },
        "reports_received": {
            "count": len(reports_received),
            "reports": [
                {
                    "id": str(r.id),
                    "reporter_id": r.reporter_id,
                    "reason": r.reason,
                    "status": r.status,
                    "created_at": r.created_at.isoformat()
                }
                for r in reports_received
            ]
        }
    }
