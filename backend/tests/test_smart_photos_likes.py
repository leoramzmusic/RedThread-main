from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.photo_metric import PhotoMetric
from src.services.smart_photos import SmartPhotosService


def test_like_rate_contributes_to_score():
    metric = SimpleNamespace(views=10, clicks=2, matches=1, view_time=20.0, likes=4)
    score = SmartPhotosService.calculate_score(metric)
    assert score == pytest.approx(0.20)


def test_old_metric_without_likes_is_zero():
    metric = SimpleNamespace(views=10, clicks=0, matches=0, view_time=0.0)
    assert SmartPhotosService.calculate_score(metric) == 0.0


@pytest.mark.asyncio
async def test_record_photo_like_creates_metric():
    with patch.object(
        PhotoMetric, "find_one", new=AsyncMock(return_value=None)
    ), patch.object(PhotoMetric, "insert", new=AsyncMock()) as insert:
        metric = await SmartPhotosService.record_photo_like("u1", "m1")

    assert metric.likes == 1
    insert.assert_awaited_once()


@pytest.mark.asyncio
async def test_record_photo_like_increments_existing_metric():
    existing = SimpleNamespace(likes=2, save=AsyncMock())
    with patch.object(
        PhotoMetric, "find_one", new=AsyncMock(return_value=existing)
    ):
        metric = await SmartPhotosService.record_photo_like("u1", "m1")

    assert metric.likes == 3
    existing.save.assert_awaited_once()
