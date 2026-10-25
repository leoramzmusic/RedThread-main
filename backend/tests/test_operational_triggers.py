import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from types import SimpleNamespace
from src.api.moderation import report_user, ReportCreate
from src.models.report import Report

@pytest.mark.asyncio
async def test_report_creates_operational_notification():
    current_user = SimpleNamespace(id="user_reporter_1")
    report_data = ReportCreate(
        reported_user_id="user_bad_1",
        reason="harassment",
        description="bad behavior"
    )

    inserted_notifications = []
    class MockNotification:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
        async def insert(self):
            inserted_notifications.append(self)

    with patch.object(Report, "find_one", new=AsyncMock(return_value=None)), \
         patch.object(Report, "get_motor_collection", return_value=MagicMock()), \
         patch.object(Report, "insert", new=AsyncMock()) as mock_report_insert, \
         patch("src.api.moderation.Notification", MockNotification):
        
        response = await report_user(report_data, current_user=current_user)
        assert response["message"] == "Report submitted successfully"
        mock_report_insert.assert_awaited_once()
        assert len(inserted_notifications) == 1
        notif = inserted_notifications[0]
        assert notif.kwargs["recipient_type"] == "employee"
        assert notif.kwargs["recipient_id"] == "moderators_group"
        assert notif.kwargs["category"] == "operational"
        assert notif.kwargs["priority"] == "P1"
        assert "denuncias" in notif.kwargs["action_url"]
        assert notif.kwargs["action_label"] == "Open Report"
