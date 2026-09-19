from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.support_ticket import SupportTicket, TicketStatus, TicketPriority, TicketCategory
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.employee_rbac import require_employee_permission, log_employee_action
from src.api.auth import get_current_user


router = APIRouter()


class TicketResponse(BaseModel):
    content: str
    is_internal: bool = False


@router.get("/tickets")
async def listar_tickets(
    status_filter: Optional[TicketStatus] = None,
    priority_filter: Optional[TicketPriority] = None,
    assigned_to_me: bool = False,
    limit: int = Query(50, le=100),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_TICKETS))
) -> List[Dict[str, Any]]:
    """List all tickets with filters - Admin only"""
    
    # Build query
    query = {}
    if status_filter:
        query["status"] = status_filter
    if priority_filter:
        query["priority"] = priority_filter
    if assigned_to_me:
        query["assigned_to"] = admin_user.user_id
    
    # Get tickets
    tickets = await SupportTicket.find(query).sort(-SupportTicket.updated_at).skip(offset).limit(limit).to_list()
    
    return [
        {
            "id": str(t.id),
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "user_id": t.user_id,
            "assigned_to": t.assigned_to,
            "created_at": t.created_at,
            "updated_at": t.updated_at
        }
        for t in tickets
    ]


@router.get("/tickets/{ticket_id}")
async def get_ticket_details(
    ticket_id: str,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_TICKETS))
) -> Dict[str, Any]:
    """Get ticket details - Admin only"""
    
    ticket = await SupportTicket.get(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    return {
        "id": str(ticket.id),
        "subject": ticket.subject,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "user_id": ticket.user_id,
        "assigned_to": ticket.assigned_to,
        "messages": [
            {
                "sender_id": m.sender_id,
                "content": m.content,
                "is_internal": m.is_internal,
                "created_at": m.created_at
            }
            for m in ticket.messages
        ],
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at
    }


@router.put("/tickets/{ticket_id}/asignar")
async def assign_ticket(
    ticket_id: str,
    admin_id: str = Body(..., embed=True),
    admin_user: AdminUser = Depends(require_employee_permission(Permission.HANDLE_TICKETS))
) -> Dict[str, Any]:
    """Assign ticket to admin - Admin only"""
    
    ticket = await SupportTicket.get(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    old_assignee = ticket.assigned_to
    ticket.assigned_to = admin_id
    ticket.status = TicketStatus.IN_PROGRESS
    ticket.updated_at = datetime.utcnow()
    await ticket.save()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="assign_ticket",
        description=f"Assigned ticket {ticket_id} to {admin_id}",
        target_type="ticket",
        target_id=ticket_id,
        metadata={"old_assignee": old_assignee, "new_assignee": admin_id}
    )
    
    return {"message": "Ticket assigned successfully"}


@router.post("/tickets/{ticket_id}/responder")
async def respond_ticket(
    ticket_id: str,
    response: TicketResponse,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.HANDLE_TICKETS))
) -> Dict[str, Any]:
    """Add response to ticket - Admin only"""
    
    ticket = await SupportTicket.get(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    ticket.add_message(
        sender_id=admin_user.user_id,
        content=response.content,
        is_internal=response.is_internal
    )
    
    if not response.is_internal and ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS
        
    await ticket.save()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="respond_ticket",
        description=f"Responded to ticket {ticket_id}",
        target_type="ticket",
        target_id=ticket_id,
        metadata={"is_internal": response.is_internal}
    )
    
    return {"message": "Response added successfully"}


@router.put("/tickets/{ticket_id}/cerrar")
async def close_ticket(
    ticket_id: str,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.CLOSE_TICKETS))
) -> Dict[str, Any]:
    """Close ticket - Admin only"""
    
    ticket = await SupportTicket.get(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    ticket.status = TicketStatus.CLOSED
    ticket.closed_at = datetime.utcnow()
    ticket.closed_by = admin_user.user_id
    ticket.updated_at = datetime.utcnow()
    await ticket.save()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="close_ticket",
        description=f"Closed ticket {ticket_id}",
        target_type="ticket",
        target_id=ticket_id
    )
    
    return {"message": "Ticket closed successfully"}

