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

router.include_router(templates.router, prefix="/templates", tags=["Employees - Templates"])
router.include_router(audiences.router, prefix="/audiences", tags=["Employees - Audiences"])
router.include_router(campaigns.router, prefix="/campaigns", tags=["Employees - Campaigns"])
router.include_router(schedules.router, prefix="/schedules", tags=["Employees - Schedules"])
router.include_router(test_center.router, prefix="/test", tags=["Employees - Test Center"])
router.include_router(
    send_individual.router, prefix="/send", tags=["Employees - Send Individual"]
)
router.include_router(metrics.router, prefix="/metrics", tags=["Employees - Metrics"])
router.include_router(history.router, prefix="/history", tags=["Employees - History"])
router.include_router(trash.router, prefix="/trash", tags=["Employees - Trash"])

__all__ = ["router"]
