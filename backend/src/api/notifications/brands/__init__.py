from fastapi import APIRouter

from . import (
    audiences,
    campaigns,
    history,
    metrics,
    schedules,
    send_individual,
    test_center,
    templates,
    trash,
)

router = APIRouter()

router.include_router(templates.router, prefix="/templates", tags=["Brands - Templates"])
router.include_router(audiences.router, prefix="/audiences", tags=["Brands - Audiences"])
router.include_router(campaigns.router, prefix="/campaigns", tags=["Brands - Campaigns"])
router.include_router(schedules.router, prefix="/schedules", tags=["Brands - Schedules"])
router.include_router(test_center.router, prefix="/test", tags=["Brands - Test Center"])
router.include_router(
    send_individual.router, prefix="/send", tags=["Brands - Send Individual"]
)
router.include_router(metrics.router, prefix="/metrics", tags=["Brands - Metrics"])
router.include_router(history.router, prefix="/history", tags=["Brands - History"])
router.include_router(trash.router, prefix="/trash", tags=["Brands - Trash"])

__all__ = ["router"]
