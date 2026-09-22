from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from src.models.employee import Employee
from src.core.middleware.employee_rbac import require_employee_permission
from src.models.admin_rbac import Permission
import os
import uuid
import json
from datetime import datetime

router = APIRouter(tags=["Admin Credentials"])

CREDENTIALS_DIR = os.path.join("img", "assets", "credentials")
PUBLIC_CREDENTIALS_DIR = os.path.join("frontend", "public", "img", "assets", "credentials")
os.makedirs(CREDENTIALS_DIR, exist_ok=True)
os.makedirs(PUBLIC_CREDENTIALS_DIR, exist_ok=True)

@router.post("/upload-logo")
async def upload_credential_logo(
    file: UploadFile = File(...),
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".svg"}:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usa PNG/JPG/WebP/SVG")
    if file.content_type not in ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/jpg"]:
        # allow svg
        pass
    filename = f"logo_{uuid.uuid4().hex}{ext}"
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Máx 2MB")
    # save to both locations for local resource
    for d in [CREDENTIALS_DIR, PUBLIC_CREDENTIALS_DIR]:
        path = os.path.join(d, filename)
        with open(path, "wb") as out:
            out.write(content)
    url = f"/img/assets/credentials/{filename}"
    return {"url": url, "public_url": url, "filename": filename}

@router.post("/save-design")
async def save_credential_design(
    design: dict,
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    # guarda JSON de diseño en img/assets/credentials — solo al pulsar Guardar, y permite editar (sobrescribe por versión)
    version = str(design.get("previewVersion") or "v1").replace("/", "_").strip() or "v1"
    # usa nombre determinístico por versión para poder editar sin crear duplicados
    filename = f"credential_design_{version}.json"
    for d in [CREDENTIALS_DIR, PUBLIC_CREDENTIALS_DIR]:
        path = os.path.join(d, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(design, f, ensure_ascii=False, indent=2)
    return {"filename": filename, "message": "Diseño guardado en img/assets/credentials"}

@router.get("/list")
async def list_credential_assets(
    employee: Employee = Depends(require_employee_permission(Permission.MANAGE_BRANDING)),
):
    files = []
    for fname in os.listdir(CREDENTIALS_DIR):
        fpath = os.path.join(CREDENTIALS_DIR, fname)
        if os.path.isfile(fpath):
            files.append({"name": fname, "url": f"/img/assets/credentials/{fname}", "size": os.path.getsize(fpath), "modified": datetime.fromtimestamp(os.path.getmtime(fpath)).isoformat()})
    return files
