from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.media import MediaType
from src.services import notification_service as ns


def photo(media_id="m1", user_id="target"):
    return SimpleNamespace(
        id=media_id,
        user_id=user_id,
        type=MediaType.PHOTO,
        url="/p.jpg",
        thumbnail_url="/p-thumb.jpg",
    )


def video(media_id="v1", user_id="target"):
    return SimpleNamespace(
        id=media_id,
        user_id=user_id,
        type=MediaType.VIDEO,
        url="/v.mp4",
        thumbnail_url="/v-thumb.jpg",
    )


@pytest.mark.asyncio
async def test_photo_like_records_metric_and_passes_media_snapshot():
    media = photo()
    with patch.object(
        ns.MediaItem, "get", new=AsyncMock(return_value=media)
    ), patch.object(
        ns.SmartPhotosService, "record_photo_like", new=AsyncMock()
    ) as record, patch.object(
        ns, "emit_like_notification", new=AsyncMock()
    ) as emit:
        await ns.handle_swipe_notifications(
            swiper_id="me",
            target_id="target",
            interaction="like",
            is_match=False,
            match_id="match1",
            shown_media_id="m1",
            is_new_like=True,
            was_matched=False,
        )

    record.assert_awaited_once_with("target", "m1")
    kwargs = emit.await_args.kwargs
    assert kwargs["shown_media_id"] == "m1"
    assert kwargs["shown_media_url"] == "/p.jpg"
    assert kwargs["shown_media_type"] == "photo"
    assert kwargs["shown_media_thumbnail_url"] == "/p-thumb.jpg"


@pytest.mark.asyncio
async def test_video_like_notifies_without_photo_metric():
    media = video()
    with patch.object(
        ns.MediaItem, "get", new=AsyncMock(return_value=media)
    ), patch.object(
        ns.SmartPhotosService, "record_photo_like", new=AsyncMock()
    ) as record, patch.object(
        ns, "emit_like_notification", new=AsyncMock()
    ) as emit:
        await ns.handle_swipe_notifications(
            swiper_id="me",
            target_id="target",
            interaction="like",
            is_match=False,
            match_id="match1",
            shown_media_id="v1",
        )

    record.assert_not_awaited()
    assert emit.await_args.kwargs["shown_media_type"] == "video"


@pytest.mark.asyncio
async def test_repeated_like_does_not_record_or_notify():
    with patch.object(
        ns.MediaItem, "get", new=AsyncMock(return_value=photo())
    ), patch.object(
        ns.SmartPhotosService, "record_photo_like", new=AsyncMock()
    ) as record, patch.object(
        ns, "emit_like_notification", new=AsyncMock()
    ) as emit, patch.object(
        ns, "emit_match_notification", new=AsyncMock()
    ) as match_emit:
        await ns.handle_swipe_notifications(
            swiper_id="me",
            target_id="target",
            interaction="like",
            is_match=False,
            match_id="match1",
            shown_media_id="m1",
            is_new_like=False,
            was_matched=False,
        )

    record.assert_not_awaited()
    emit.assert_not_awaited()
    match_emit.assert_not_awaited()


@pytest.mark.asyncio
async def test_mutual_match_records_metric_and_only_emits_match():
    with patch.object(
        ns.MediaItem, "get", new=AsyncMock(return_value=photo())
    ), patch.object(
        ns.SmartPhotosService, "record_photo_like", new=AsyncMock()
    ) as record, patch.object(
        ns, "emit_like_notification", new=AsyncMock()
    ) as emit, patch.object(
        ns, "emit_match_notification", new=AsyncMock()
    ) as match_emit:
        await ns.handle_swipe_notifications(
            swiper_id="me",
            target_id="target",
            interaction="like",
            is_match=True,
            match_id="match1",
            shown_media_id="m1",
            is_new_like=True,
            was_matched=False,
        )

    record.assert_awaited_once_with("target", "m1")
    emit.assert_not_awaited()
    match_emit.assert_awaited_once()


@pytest.mark.asyncio
async def test_media_from_another_user_falls_back_to_profile_like():
    with patch.object(
        ns.MediaItem, "get", new=AsyncMock(return_value=photo(user_id="someone"))
    ), patch.object(
        ns.MediaItem, "find_one", new=AsyncMock(return_value=None)
    ), patch.object(
        ns.SmartPhotosService, "record_photo_like", new=AsyncMock()
    ) as record, patch.object(
        ns, "emit_like_notification", new=AsyncMock()
    ) as emit:
        await ns.handle_swipe_notifications(
            swiper_id="me",
            target_id="target",
            interaction="like",
            is_match=False,
            match_id="match1",
            shown_media_id="m1",
            is_new_like=True,
        )

    record.assert_not_awaited()
    assert emit.await_args.kwargs["shown_media_id"] is None
