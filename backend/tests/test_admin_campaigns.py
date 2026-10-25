import pytest
from datetime import datetime
from src.models.campaign import Campaign, CampaignType

@pytest.mark.asyncio
async def test_campaign_extension_fields():
    c = Campaign(
        name="Test Campaign",
        type=CampaignType.IN_APP_MESSAGE,
        content="Test content",
        target_recipient_type="employee",
        category="operational",
        audience_filter={"role": "admin"},
        content_i18n={"es": {"title": "Hola", "body": "Mundo"}},
        priority="P1",
        action_url="/portal-redthread/denuncias/1",
        action_label="Open Report",
        created_by="emp_1",
        executed_by="emp_2",
        expires_at=datetime.utcnow(),
        stats={"sent": 10, "delivered": 10, "seen": 5, "read": 2, "clicked": 1}
    )
    assert c.target_recipient_type == "employee"
    assert c.category == "operational"
    assert c.audience_filter == {"role": "admin"}
    assert c.content_i18n["es"]["title"] == "Hola"
    assert c.priority == "P1"
    assert c.action_url == "/portal-redthread/denuncias/1"
    assert c.action_label == "Open Report"
    assert c.created_by == "emp_1"
    assert c.executed_by == "emp_2"
    assert c.expires_at is not None
    assert c.stats["sent"] == 10
