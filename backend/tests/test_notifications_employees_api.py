"""Unit tests for the Gestor de Notificaciones - Módulo Empleados routers."""
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

VALID_ID = "507f1f77bcf86cd799439011"
EMP_ID = "507f1f77bcf86cd799439022"
NOW = datetime(2026, 10, 25, 12, 0, 0)


def _make_employee():
    return SimpleNamespace(id=EMP_ID)


def _doc(**attrs):
    base = dict(
        id=VALID_ID,
        name="Item",
        title="Item",
        body="",
        icon="i",
        color=None,
        action_url=None,
        action_type=None,
        action_destination=None,
        channels=None,
        category="system",
        priority="P2",
        required_action=False,
        critical=False,
        variables=[],
        description=None,
        filters={},
        estimated_count=0,
        template_id=None,
        campaign_id=None,
        audience_id=None,
        status="draft",
        scheduled_at=None,
        sent_at=None,
        stats={"sent": 0, "delivered": 0, "read": 0, "failed": 0},
        schedule_type="once",
        schedule_expression="expr",
        start_date=NOW,
        end_date=None,
        is_active=True,
        last_run=None,
        next_run=None,
        recipient_type="employee",
        recipient_id="employee_1",
        sender_id=EMP_ID,
        delivered_at=None,
        read_at=None,
        error_message=None,
        created_by=EMP_ID,
        created_at=NOW,
        updated_at=NOW,
        deleted_at=None,
        deleted_by=None,
    )
    base.update(attrs)
    d = SimpleNamespace(**base)
    d.insert = AsyncMock()
    d.save = AsyncMock()
    d.update = AsyncMock()
    d.delete = AsyncMock()
    return d


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.templates.NotificationTemplate")
@pytest.mark.asyncio
async def test_templates_crud(mock_model):
    from src.api.notifications.employees import templates as mod

    emp = _make_employee()
    created = _doc(
        title="Nuevo Match",
        body="Hola {{first_name}}",
        icon="heart",
        category="match",
        priority="P1",
        variables=[{"name": "first_name", "type": "string"}],
    )
    mock_model.return_value = created

    payload = mod.TemplateCreate(
        title="Nuevo Match",
        body="Hola {{first_name}}",
        icon="heart",
        category="match",
        priority="P1",
        variables=[{"name": "first_name", "type": "string"}],
    )
    out = await mod.create_template(payload, employee=emp)
    assert out.title == "Nuevo Match"
    created.insert.assert_awaited_once()

    mock_model.get = AsyncMock(return_value=created)
    out = await mod.get_template(VALID_ID, employee=emp)
    assert out.title == "Nuevo Match"

    mock_model.find = MagicMock(return_value=MagicMock())
    chain = mock_model.find.return_value
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[created])
    chain.count = AsyncMock(return_value=1)
    res = await mod.list_templates(employee=emp, skip=0, limit=20)
    assert res["total"] == 1
    assert len(res["items"]) == 1

    upd = _doc(title="Nuevo Match Editado")
    mock_model.get = AsyncMock(return_value=upd)
    out = await mod.update_template(
        VALID_ID, mod.TemplateUpdate(title="Nuevo Match Editado"), employee=emp
    )
    assert out.title == "Nuevo Match Editado"
    upd.save.assert_awaited_once()

    deld = _doc(deleted_at=None)
    mock_model.get = AsyncMock(return_value=deld)
    res = await mod.delete_template(VALID_ID, employee=emp)
    assert res["ok"] is True
    assert deld.deleted_at is not None
    assert deld.deleted_by == EMP_ID
    deld.save.assert_awaited_once()


@patch("src.api.notifications.employees.templates.NotificationTemplate")
@pytest.mark.asyncio
async def test_templates_not_found(mock_model):
    from src.api.notifications.employees import templates as mod
    from fastapi import HTTPException

    emp = _make_employee()
    mock_model.get = AsyncMock(return_value=None)
    with pytest.raises(HTTPException) as exc:
        await mod.get_template(VALID_ID, employee=emp)
    assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Audiences
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.audiences.NotificationAudience")
@pytest.mark.asyncio
async def test_audiences_crud(mock_model):
    from src.api.notifications.employees import audiences as mod

    emp = _make_employee()
    created = _doc(name="Empleados Premium", filters={"premium": True}, estimated_count=50)
    mock_model.return_value = created

    payload = mod.AudienceCreate(name="Empleados Premium", filters={"premium": True}, estimated_count=50)
    out = await mod.create_audience(payload, employee=emp)
    assert out.name == "Empleados Premium"
    created.insert.assert_awaited_once()

    mock_model.get = AsyncMock(return_value=created)
    out = await mod.get_audience(VALID_ID, employee=emp)
    assert out.name == "Empleados Premium"

    mock_model.find = MagicMock(return_value=MagicMock())
    chain = mock_model.find.return_value
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[created])
    chain.count = AsyncMock(return_value=1)
    res = await mod.list_audiences(employee=emp, skip=0, limit=20)
    assert res["total"] == 1

    upd = _doc(name="Empleados Premium Editado")
    mock_model.get = AsyncMock(return_value=upd)
    out = await mod.update_audience(
        VALID_ID, mod.AudienceUpdate(name="Empleados Premium Editado"), employee=emp
    )
    assert out.name == "Empleados Premium Editado"

    deld = _doc(deleted_at=None)
    mock_model.get = AsyncMock(return_value=deld)
    res = await mod.delete_audience(VALID_ID, employee=emp)
    assert res["ok"] is True


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.campaigns.NotificationCampaign")
@patch("src.api.notifications.employees.campaigns.NotificationTemplate")
@patch("src.api.notifications.employees.campaigns.NotificationAudience")
@pytest.mark.asyncio
async def test_campaigns_crud_and_send(mock_audience, mock_template, mock_campaign):
    from src.api.notifications.employees import campaigns as mod

    emp = _make_employee()
    created = _doc(name="Campaña Bienvenida", status="draft")
    mock_campaign.return_value = created

    mock_template.get = AsyncMock(return_value=_doc(deleted_at=None))
    mock_audience.get = AsyncMock(return_value=_doc(deleted_at=None, estimated_count=50))

    payload = mod.CampaignCreate(
        name="Campaña Bienvenida", template_id=VALID_ID, audience_id=VALID_ID, status="draft"
    )
    out = await mod.create_campaign(payload, employee=emp)
    assert out.name == "Campaña Bienvenida"
    created.insert.assert_awaited_once()

    mock_campaign.get = AsyncMock(return_value=created)
    out = await mod.get_campaign(VALID_ID, employee=emp)
    assert out.status == "draft"

    mock_campaign.find = MagicMock(return_value=MagicMock())
    chain = mock_campaign.find.return_value
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[created])
    chain.count = AsyncMock(return_value=1)
    res = await mod.list_campaigns(employee=emp, skip=0, limit=20)
    assert res["total"] == 1

    sent = _doc(name="Campaña Bienvenida", status="draft", sent_at=NOW)
    sent.stats = {"sent": 50, "delivered": 0, "read": 0, "failed": 0}
    mock_campaign.get = AsyncMock(return_value=sent)
    res = await mod.send_campaign(VALID_ID, employee=emp)
    assert res["ok"] is True
    assert res["recipients"] == 50
    sent.save.assert_awaited_once()


@patch("src.api.notifications.employees.campaigns.NotificationCampaign")
@pytest.mark.asyncio
async def test_campaign_send_rejects_wrong_status(mock_campaign):
    from src.api.notifications.employees import campaigns as mod
    from fastapi import HTTPException

    emp = _make_employee()
    done = _doc(name="C", status="completed")
    mock_campaign.get = AsyncMock(return_value=done)
    with pytest.raises(HTTPException) as exc:
        await mod.send_campaign(VALID_ID, employee=emp)
    assert exc.value.status_code == 400


# ---------------------------------------------------------------------------
# Schedules
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.schedules.NotificationSchedule")
@patch("src.api.notifications.employees.schedules.NotificationCampaign")
@pytest.mark.asyncio
async def test_schedules_crud(mock_campaign, mock_schedule):
    from src.api.notifications.employees import schedules as mod

    emp = _make_employee()
    created = _doc(schedule_type="once", schedule_expression="2026-10-26T09:00:00")
    mock_schedule.return_value = created

    mock_campaign.get = AsyncMock(return_value=_doc(deleted_at=None))

    payload = mod.ScheduleCreate(
        campaign_id=VALID_ID,
        schedule_type="once",
        schedule_expression="2026-10-26T09:00:00",
        start_date=NOW,
    )
    out = await mod.create_schedule(payload, employee=emp)
    assert out.schedule_type == "once"
    created.insert.assert_awaited_once()

    mock_schedule.get = AsyncMock(return_value=created)
    out = await mod.get_schedule(VALID_ID, employee=emp)
    assert out.schedule_type == "once"

    mock_schedule.find = MagicMock(return_value=MagicMock())
    chain = mock_schedule.find.return_value
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[created])
    chain.count = AsyncMock(return_value=1)
    res = await mod.list_schedules(employee=emp, skip=0, limit=20)
    assert res["total"] == 1


# ---------------------------------------------------------------------------
# Test Center
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.test_center.NotificationHistory")
@pytest.mark.asyncio
async def test_test_center_send_and_history(mock_history):
    from src.api.notifications.employees import test_center as mod

    emp = _make_employee()
    created = _doc(recipient_type="employee", recipient_id="employee_1", status="sent", sent_at=NOW)
    mock_history.return_value = created

    payload = mod.TestSendRequest(recipient_id="employee_1", content="Hola", channel="in_app")
    out = await mod.send_test_notification(payload, employee=emp)
    assert out.ok is True
    assert out.recipient_id == "employee_1"
    assert mod.RECIPIENT_TYPE == "employee"
    created.insert.assert_awaited_once()

    mock_history.find = MagicMock(return_value=MagicMock())
    chain = mock_history.find.return_value
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[created])
    chain.count = AsyncMock(return_value=1)
    res = await mod.list_test_history(employee=emp, skip=0, limit=20)
    assert res["total"] == 1
    assert len(res["items"]) == 1


# ---------------------------------------------------------------------------
# Send Individual
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.send_individual.NotificationHistory")
@pytest.mark.asyncio
async def test_send_individual(mock_history):
    from src.api.notifications.employees import send_individual as mod

    emp = _make_employee()
    created = _doc(recipient_type="employee", recipient_id="employee_2", status="sent", sent_at=NOW)
    mock_history.return_value = created

    payload = mod.IndividualSendRequest(recipient_id="employee_2", content="Hola Juan", channel="push")
    out = await mod.send_individual_notification(payload, employee=emp)
    assert out.ok is True
    assert out.channel == "push"
    assert mod.RECIPIENT_TYPE == "employee"
    created.insert.assert_awaited_once()


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.metrics.NotificationHistory")
@patch("src.api.notifications.employees.metrics.NotificationDelivery")
@patch("src.api.notifications.employees.metrics.NotificationCampaign")
@pytest.mark.asyncio
async def test_metrics(mock_campaign, mock_delivery, mock_history):
    from src.api.notifications.employees import metrics as mod

    emp = _make_employee()

    def _m():
        m = MagicMock()
        m.find_all = MagicMock(return_value=MagicMock(count=AsyncMock(return_value=3)))
        m.find = MagicMock(return_value=MagicMock(count=AsyncMock(return_value=3)))
        return m

    mock_history.find_all = _m().find_all
    mock_history.find = _m().find
    mock_delivery.find_all = _m().find_all
    mock_delivery.find = _m().find
    mock_campaign.find_all = _m().find_all
    mock_campaign.find = _m().find

    res = await mod.get_metrics(employee=emp)
    assert res.total_history == 3
    assert res.total_deliveries == 3
    assert res.total_campaigns == 3


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.history.NotificationHistory")
@pytest.mark.asyncio
async def test_history(mock_history):
    from src.api.notifications.employees import history as mod

    emp = _make_employee()
    created = _doc(recipient_type="employee", recipient_id="employee_1", status="sent", sent_at=NOW)
    mock_history.find = MagicMock(return_value=MagicMock())
    chain = mock_history.find.return_value
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[created])
    chain.count = AsyncMock(return_value=1)

    res = await mod.list_history(
        employee=emp,
        skip=0,
        limit=20,
        recipient_type=None,
        recipient_id=None,
        status="sent",
        template_id=None,
        campaign_id=None,
        sender_id=None,
        date_from=None,
        date_to=None,
    )
    assert res["total"] == 1
    assert len(res["items"]) == 1
    assert res["items"][0]["status"] == "sent"


# ---------------------------------------------------------------------------
# Trash
# ---------------------------------------------------------------------------
@patch("src.api.notifications.employees.trash.NotificationTemplate")
@patch("src.api.notifications.employees.trash.NotificationAudience")
@patch("src.api.notifications.employees.trash.NotificationCampaign")
@patch("src.api.notifications.employees.trash.NotificationSchedule")
@pytest.mark.asyncio
async def test_trash(mock_schedule, mock_campaign, mock_audience, mock_template):
    from src.api.notifications.employees import trash as mod

    emp = _make_employee()
    mod._TRASH_MODELS["template"] = mock_template

    deleted = _doc(title="Plantilla Borrada", deleted_at=NOW, deleted_by=EMP_ID)
    mock_template.get = AsyncMock(return_value=deleted)

    chain = MagicMock()
    chain.sort.return_value = chain
    chain.skip.return_value = chain
    chain.limit.return_value = chain
    chain.to_list = AsyncMock(return_value=[deleted])
    chain.count = AsyncMock(return_value=1)
    mock_template.find = MagicMock(return_value=chain)

    res = await mod.list_trash(employee=emp, skip=0, limit=20, type="template")
    assert res["total"] == 1
    assert res["items"][0]["type"] == "template"
    assert res["items"][0]["title"] == "Plantilla Borrada"

    res = await mod.restore_item(VALID_ID, employee=emp, type="template")
    assert res["restored"] is True
    assert deleted.deleted_at is None
    deleted.save.assert_awaited_once()

    deleted2 = _doc(title="Plantilla Borrada", deleted_at=NOW, deleted_by=EMP_ID)
    mock_template.get = AsyncMock(return_value=deleted2)
    res = await mod.delete_item_permanently(VALID_ID, employee=emp, type="template")
    assert res["deleted_permanently"] is True
    deleted2.delete.assert_awaited_once()
