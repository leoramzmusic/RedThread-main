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

router.include_router(templates.router, prefix="/templates", tags=["Users - Templates"])
router.include_router(audiences.router, prefix="/audiences", tags=["Users - Audiences"])
router.include_router(campaigns.router, prefix="/campaigns", tags=["Users - Campaigns"])
router.include_router(schedules.router, prefix="/schedules", tags=["Users - Schedules"])
router.include_router(test_center.router, prefix="/test", tags=["Users - Test Center"])
router.include_router(
    send_individual.router, prefix="/send", tags=["Users - Send Individual"]
)
router.include_router(metrics.router, prefix="/metrics", tags=["Users - Metrics"])
router.include_router(history.router, prefix="/history", tags=["Users - History"])
router.include_router(trash.router, prefix="/trash", tags=["Users - Trash"])

__all__ = ["router"]
