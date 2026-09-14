from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from src.models.appearance import AppearanceResource, AppearanceType, Platform
from src.models.appearance_history import AppearanceHistory, HistoryAction
from src.core.config import settings
from src.models.employee import Employee
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import require_employee_permission, require_any_employee_permission
import os
import shutil
from datetime import datetime, timezone
import uuid

router = APIRouter()

# ...

async def check_scheduled_activations(type: Optional[AppearanceType] = None, platform: Optional[Platform] = None):
    """
    Check for inactive resources that should be active based on start_date.
    Lazy activation strategy. 
    """
    now = datetime.now(timezone.utc)
    query = {
        "is_active": False,
        "start_date": {"$lte": now}
    }
# ...
    # Log history
    context = "Scheduled Upload" if resource.start_date else "Initial upload"
    
    await AppearanceHistory(
        resource_id=str(resource.id),
        action=HistoryAction.UPLOADED,
        user_id="admin", # Todo: get from auth context
        context=context,
        timestamp=datetime.now(timezone.utc)
    ).insert()

UPLOAD_DIR = "static/uploads/appearance"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".ico"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: AppearanceType = Form(...),
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    """
    Upload a file for an appearance resource.
    Returns the URL of the uploaded file.
    """
    try:
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="File extension not allowed")

        if file_ext != ".ico" and file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Generate unique filename
        filename = f"{type.value}_{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file with size limit
        size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > settings.MAX_UPLOAD_SIZE:
                    buffer.close()
                    os.remove(file_path)
                    raise HTTPException(status_code=413, detail="File too large")
                buffer.write(chunk)

        # Return URL
        url = f"/static/uploads/appearance/{filename}"
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resources", response_model=AppearanceResource)
async def create_resource(
    resource: AppearanceResource,
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    """
    Create a new appearance resource entry.
    If is_active is True, other resources of same type/platform might need to be deactivated (logic dependent on exact requirement, currently allowing multiple).
    For Logos/Favicons usually only one is active per platform.
    """
    # Auto-deactivate others if needed logic can go here
    if resource.is_active and resource.type in [AppearanceType.LOGO, AppearanceType.FAVICON]:
        await AppearanceResource.find(
            AppearanceResource.type == resource.type,
            AppearanceResource.platform == resource.platform,
            AppearanceResource.is_active == True
        ).update({"$set": {"is_active": False}})
        
    await resource.insert()

    # Log history
    context = "Scheduled Upload" if resource.start_date else "Initial upload"
    
    await AppearanceHistory(
        resource_id=str(resource.id),
        action=HistoryAction.UPLOADED,
        user_id=str(employee.id),
        context=context
    ).insert()

    return resource

    return await AppearanceHistory.find(query).sort("-created_at").to_list()


async def check_scheduled_activations(type: Optional[AppearanceType] = None, platform: Optional[Platform] = None):
    """
    Check for inactive resources that should be active based on start_date.
    Lazy activation strategy. 
    """
    now = datetime.now(timezone.utc)
    print(f"[DEBUG] Checking activations at {now}")
    
    # Check for items that are inactive, start_date passed, and either has_triggered is False OR doesn't exist
    query = {
        "is_active": False,
        "start_date": {"$lte": now},
        "$or": [
            {"has_triggered": False},
            {"has_triggered": {"$exists": False}}
        ]
    }
    if type: query["type"] = type
    if platform: query["platform"] = platform

    # Find candidates
    candidates = await AppearanceResource.find(query).sort("-start_date").to_list()
    print(f"[DEBUG] Found {len(candidates)} candidates for activation")
    
    for resource in candidates:
        print(f"[DEBUG] Activating resource {resource.id} (Scheduled: {resource.start_date})")
        # Just activate the most recent one if multiple?
        # Activates resource and deactivates others.
        
        # Deactivate current active ones
        await AppearanceResource.find(
            AppearanceResource.type == resource.type,
            AppearanceResource.platform == resource.platform,
            AppearanceResource.is_active == True
        ).update({"$set": {"is_active": False}})

        # Activate this one
        resource.is_active = True
        resource.has_triggered = True
        await resource.save()

        # Log
        await AppearanceHistory(
            resource_id=str(resource.id),
            action=HistoryAction.ACTIVATED,
            user_id="system", 
            context="Scheduled Auto-Activation"
        ).insert()


@router.get("/resources", response_model=List[AppearanceResource])
async def list_resources(
    type: Optional[AppearanceType] = None,
    platform: Optional[Platform] = None,
    active_only: bool = False,
    employee: Employee = Depends(require_any_employee_permission([Permission.MANAGE_BRANDING, Permission.EDIT_CONFIG])),
):
    # Run lazy check
    await check_scheduled_activations(type, platform)

    query = {}
    if type:
        query["type"] = type
    if platform:
        query["platform"] = platform
    if active_only:
        query["is_active"] = True
        
    return await AppearanceResource.find(query).sort("-created_at").to_list()


def build_public_resources_query(
    type: Optional[AppearanceType] = None,
    platform: Optional[Platform] = None,
) -> dict:
    query = {"is_active": True}
    if type:
        query["type"] = type
    if platform:
        query["platform"] = platform
    return query


@router.get("/public", response_model=List[AppearanceResource])
async def list_public_resources(
    type: Optional[AppearanceType] = None,
    platform: Optional[Platform] = None,
):
    """Public read of active appearance resources. Used by public pages (landing, favicon)."""
    await check_scheduled_activations(type, platform)
    return await AppearanceResource.find(
        build_public_resources_query(type, platform)
    ).sort("-created_at").to_list()

@router.put("/resources/{resource_id}", response_model=AppearanceResource)
async def update_resource(
    resource_id: str,
    update_data: dict,
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    resource = await AppearanceResource.get(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # If setting to active, deactivate others
    if update_data.get("is_active") and not resource.is_active and resource.type in [AppearanceType.LOGO, AppearanceType.FAVICON]:
         await AppearanceResource.find(
            AppearanceResource.type == resource.type,
            AppearanceResource.platform == resource.platform,
            AppearanceResource.is_active == True
        ).update({"$set": {"is_active": False}})

    
    # History Logging
    if "is_active" in update_data:
        action = HistoryAction.ACTIVATED if update_data["is_active"] else HistoryAction.DEACTIVATED
        await AppearanceHistory(
            resource_id=str(resource.id),
            action=action,
            user_id=str(employee.id),
            context="Manual update"
        ).insert()

    await resource.update({"$set": update_data})
    return resource

@router.delete("/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    resource = await AppearanceResource.get(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Log history before deleting
    await AppearanceHistory(
        resource_id=str(resource.id),
        action=HistoryAction.DELETED,
        user_id=str(employee.id),
        context="Resource deleted"
    ).insert()

    # Optional: Delete physical file?
    # For now, just delete the record.
    await resource.delete()
    return {"status": "deleted"}

@router.get("/history", response_model=List[AppearanceHistory])
async def get_history(
    resource_id: Optional[str] = None,
    limit: int = 50,
    employee: Employee = Depends(require_any_employee_permission([Permission.MANAGE_BRANDING, Permission.EDIT_CONFIG])),
):
    query = {}
    if resource_id:
        query["resource_id"] = resource_id
        
    return await AppearanceHistory.find(query).sort("-timestamp").limit(limit).to_list()

@router.delete("/history")
async def clear_history(
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    """
    Clear all appearance history logs.
    """
    await AppearanceHistory.delete_all()
    return {"status": "cleared"}
