from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime
from src.models.user import User
from src.models.report import Report
from src.models.match import Match, MatchStatus
from src.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ReportCreate(BaseModel):
    reported_user_id: str
    reason: str
    description: str = None

class BlockRequest(BaseModel):
    blocked_user_id: str

@router.post("/report")
async def report_user(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_user)
):
    """Report a user"""
    
    # Check if already reported
    existing_report = await Report.find_one(
        Report.reporter_id == str(current_user.id),
        Report.reported_user_id == report_data.reported_user_id,
        Report.status == "pending"
    )
    
    if existing_report:
        return {"message": "Report already submitted"}
        
    report = Report(
        reporter_id=str(current_user.id),
        reported_user_id=report_data.reported_user_id,
        reason=report_data.reason,
        description=report_data.description,
        created_at=datetime.utcnow()
    )
    
    await report.insert()
    
    return {"message": "Report submitted successfully"}

@router.post("/block")
async def block_user(
    block_data: BlockRequest,
    current_user: User = Depends(get_current_user)
):
    """Block a user"""
    
    # Find any existing match and unmatch/block
    match = await Match.find_one({
        "$or": [
            {"user_id_1": str(current_user.id), "user_id_2": block_data.blocked_user_id},
            {"user_id_1": block_data.blocked_user_id, "user_id_2": str(current_user.id)}
        ]
    })
    
    if match:
        match.status = MatchStatus.BLOCKED
        match.unmatched_at = datetime.utcnow()
        match.blocked_by = str(current_user.id)
        await match.save()
        
    return {"message": "User blocked successfully"}

@router.post("/unblock")
async def unblock_user(
    block_data: BlockRequest,
    current_user: User = Depends(get_current_user)
):
    """Unblock a user"""
    
    # Find the blocked match
    match = await Match.find_one({
        "$or": [
            {"user_id_1": str(current_user.id), "user_id_2": block_data.blocked_user_id},
            {"user_id_1": block_data.blocked_user_id, "user_id_2": str(current_user.id)}
        ],
        "status": MatchStatus.BLOCKED
    })
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blocked match not found"
        )
        
    # Check if the current user is the one who blocked
    if match.blocked_by != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot unblock this user"
        )
        
    # Restore match status
    match.status = MatchStatus.MATCHED
    match.blocked_by = None
    match.unmatched_at = None
    await match.save()
    
    return {"message": "User unblocked successfully"}

