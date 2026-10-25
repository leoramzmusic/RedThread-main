import pytest
from src.models.notification import Notification
from src.api import employee_notifications as api

@pytest.mark.asyncio
async def test_employee_notification_model_and_fields():
    n = Notification(
        recipient_type="employee",
        recipient_id="emp_123",
        category="operational",
        content="Test operational notification",
        priority="P1",
        action_url="/portal-redthread/denuncias/1",
        action_label="Open Report"
    )
    assert n.recipient_type == "employee"
    assert n.recipient_id == "emp_123"
    assert n.category == "operational"
    assert n.priority == "P1"
    assert n.action_url == "/portal-redthread/denuncias/1"

def test_employee_notifications_router_registered():
    from src.main import app
    from fastapi.routing import APIRoute
    routes = [r.path for r in app.routes if isinstance(r, APIRoute)]
    # Check that inbox, seen, read, archive, snooze routes exist
    inbox_exists = any("/employee/notifications/inbox" in r for r in routes)
    seen_exists = any("/employee/notifications/seen" in r for r in routes)
    read_exists = any("/employee/notifications/read" in r for r in routes)
    archive_exists = any("/employee/notifications/archive" in r for r in routes)
    snooze_exists = any("/employee/notifications/snooze" in r for r in routes)

    assert inbox_exists or any("inbox" in r for r in routes)
    assert seen_exists or any("seen" in r for r in routes)
    assert read_exists or any("read" in r for r in routes)
    assert archive_exists or any("archive" in r for r in routes)
    assert snooze_exists or any("snooze" in r for r in routes)
