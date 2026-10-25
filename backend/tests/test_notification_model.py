import pytest
from datetime import datetime
from src.models.notification import Notification

@pytest.mark.asyncio
async def test_notification_recipient_fields():
    n = Notification(
        recipient_type="employee",
        recipient_id="emp_123",
        category="operational",
        content="New report submitted",
        priority="P1",
        action_url="/portal-redthread/denuncias/1",
        action_label="Open Report"
    )
    assert n.recipient_type == "employee"
    assert n.recipient_id == "emp_123"
    assert n.priority == "P1"
