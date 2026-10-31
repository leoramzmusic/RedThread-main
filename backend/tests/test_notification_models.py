import pytest
from datetime import datetime
from beanie import PydanticObjectId

from src.models.notification_delivery import NotificationDelivery
from src.models.notification_history import NotificationHistory
from src.models.notification_template import NotificationTemplate
from src.models.notification_audience import NotificationAudience
from src.models.notification_campaign import NotificationCampaign
from src.models.notification_schedule import NotificationSchedule


@pytest.mark.asyncio
async def test_notification_delivery_creation():
    d = NotificationDelivery(
        notification_id="notif_123",
        recipient_type="user",
        recipient_id="user_1",
        channel="push",
        status="sent",
        provider="firebase",
        error_code=None,
        error_message=None,
        sent_at=datetime.utcnow(),
    )
    assert d.notification_id == "notif_123"
    assert d.recipient_type == "user"
    assert d.recipient_id == "user_1"
    assert d.channel == "push"
    assert d.status == "sent"
    assert d.provider == "firebase"
    assert d.sent_at is not None


@pytest.mark.asyncio
async def test_notification_delivery_failed_with_error():
    d = NotificationDelivery(
        notification_id="notif_456",
        recipient_type="employee",
        recipient_id="emp_1",
        channel="email",
        status="failed",
        provider="internal",
        error_code="ECONNREFUSED",
        error_message="Connection refused",
    )
    assert d.status == "failed"
    assert d.error_code == "ECONNREFUSED"
    assert d.error_message == "Connection refused"
    assert d.created_at is not None


@pytest.mark.asyncio
async def test_notification_history_creation():
    oid = PydanticObjectId()
    h = NotificationHistory(
        template_id=oid,
        campaign_id=None,
        recipient_type="brand",
        recipient_id="brand_1",
        sender_id=oid,
        status="sent",
        sent_at=datetime.utcnow(),
    )
    assert h.template_id == oid
    assert h.campaign_id is None
    assert h.recipient_type == "brand"
    assert h.recipient_id == "brand_1"
    assert h.sender_id == oid
    assert h.status == "sent"


@pytest.mark.asyncio
async def test_notification_history_read_status():
    oid = PydanticObjectId()
    h = NotificationHistory(
        recipient_type="user",
        recipient_id="user_2",
        sender_id=oid,
        status="read",
        read_at=datetime.utcnow(),
    )
    assert h.status == "read"
    assert h.read_at is not None
    assert h.created_at is not None


@pytest.mark.asyncio
async def test_notification_template_creation():
    oid = PydanticObjectId()
    t = NotificationTemplate(
        title="Nuevo like",
        body="Hola {{name}}, tienes un nuevo like",
        icon="/icon/like.png",
        action_url="/matches/1",
        category="like",
        priority="P1",
        required_action=True,
        critical=False,
        variables=[{"name": "name", "type": "string"}],
        created_by=oid,
    )
    assert t.title == "Nuevo like"
    assert "{{name}}" in t.body
    assert t.category == "like"
    assert t.priority == "P1"
    assert t.required_action is True
    assert t.critical is False
    assert t.variables == [{"name": "name", "type": "string"}]
    assert t.created_by == oid


@pytest.mark.asyncio
async def test_notification_audience_creation():
    oid = PydanticObjectId()
    a = NotificationAudience(
        name="Usuarios premium MX",
        description="Usuarios con suscripcion activa en Mexico",
        filters={"is_premium": True, "country": "MX"},
        estimated_count=1250,
        created_by=oid,
    )
    assert a.name == "Usuarios premium MX"
    assert a.description == "Usuarios con suscripcion activa en Mexico"
    assert a.filters == {"is_premium": True, "country": "MX"}
    assert a.estimated_count == 1250
    assert a.created_by == oid


@pytest.mark.asyncio
async def test_notification_campaign_creation():
    oid = PydanticObjectId()
    c = NotificationCampaign(
        name="Campaña de bienvenida",
        template_id=oid,
        audience_id=oid,
        status="scheduled",
        scheduled_at=datetime.utcnow(),
        created_by=oid,
    )
    assert c.name == "Campaña de bienvenida"
    assert c.template_id == oid
    assert c.audience_id == oid
    assert c.status == "scheduled"
    assert c.stats == {"sent": 0, "delivered": 0, "read": 0, "failed": 0}


@pytest.mark.asyncio
async def test_notification_campaign_stats_update():
    oid = PydanticObjectId()
    c = NotificationCampaign(
        name="Campaña promo",
        template_id=oid,
        audience_id=oid,
        status="active",
        created_by=oid,
    )
    c.stats = {"sent": 100, "delivered": 90, "read": 75, "failed": 10}
    assert c.stats["sent"] == 100
    assert c.stats["read"] == 75


@pytest.mark.asyncio
async def test_notification_schedule_creation():
    oid = PydanticObjectId()
    s = NotificationSchedule(
        campaign_id=oid,
        schedule_type="recurring",
        schedule_expression="0 9 * * *",
        start_date=datetime.utcnow(),
        is_active=True,
        next_run=datetime.utcnow(),
    )
    assert s.campaign_id == oid
    assert s.schedule_type == "recurring"
    assert s.schedule_expression == "0 9 * * *"
    assert s.is_active is True
    assert s.next_run is not None


@pytest.mark.asyncio
async def test_notification_schedule_once():
    oid = PydanticObjectId()
    s = NotificationSchedule(
        campaign_id=oid,
        schedule_type="once",
        schedule_expression="2026-11-01T10:00:00Z",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow(),
        is_active=False,
    )
    assert s.schedule_type == "once"
    assert s.is_active is False
    assert s.end_date is not None
