# Profile Like + Media Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un like desde el perfil público (y desde discover/likes) atribuye la foto o video visible, notifica con su thumbnail y alimenta Smart Photos.

**Architecture:** El frontend envía `shown_media_id` en `POST /discovery/swipe`. El backend resuelve y valida la media, persiste la atribución en `Match`, incrementa `PhotoMetric.likes` una sola vez y emite la notificación enriquecida con snapshot de la media. Sondeo de estado del perfil vía `my_interaction`/`match_status`.

**Tech Stack:** FastAPI, Beanie/MongoDB, pytest; Next.js (pages router), React, MUI, Jest/RTL.

**Spec:** `docs/superpowers/specs/2026-10-19-notification-center-design.md` (sección “Delta aprobado 2026-10-19”).

## Global Constraints

- No push nativo ni email.
- No duplicar métricas ni notificaciones en likes repetidos.
- Superlike no agrupa.
- Solo fotos alimentan el score de Smart Photos.
- Mantener `like:photo:{id}` por compatibilidad.
- Commits locales únicamente; no push.
- Tests backend: `venv\Scripts\python.exe -m pytest tests/<archivo> -q` desde `backend/`.
- Tests frontend: `npm test -- --ci`, `npm run typecheck`, `npm run lint` desde `frontend/`.

---

### Task 1: Smart Photos likes

**Files:**
- Modify: `backend/src/models/photo_metric.py`
- Modify: `backend/src/services/smart_photos.py`
- Test: `backend/tests/test_smart_photos_likes.py`

**Interfaces:**
- Produces: `PhotoMetric.likes: int`, `SmartPhotosService.record_photo_like(user_id: str, media_id: str) -> PhotoMetric`.

- [ ] **Step 1: Write failing tests**

```python
from types import SimpleNamespace
from src.services.smart_photos import SmartPhotosService


def test_like_rate_contributes_to_score():
    metric = SimpleNamespace(views=10, clicks=2, matches=1, view_time=20.0, likes=4)
    score = SmartPhotosService.calculate_score(metric)
    assert score == 0.40 * 0.1 + 0.25 * 0.2 + 0.15 * 0.2 + 0.20 * 0.4


def test_old_metric_without_likes_is_zero():
    metric = SimpleNamespace(views=10, clicks=0, matches=0, view_time=0.0)
    assert SmartPhotosService.calculate_score(metric) == 0.0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `venv\Scripts\python.exe -m pytest tests/test_smart_photos_likes.py -q`
Expected: FAIL because `likes` is absent / score is old.

- [ ] **Step 3: Implement**

```python
# photo_metric.py
likes: int = 0

# smart_photos.py
ALPHA = 0.40
BETA = 0.25
GAMMA = 0.15
DELTA = 0.20

@staticmethod
def calculate_score(metric: PhotoMetric) -> float:
    if metric.views == 0:
        return 0.0
    match_rate = metric.matches / metric.views
    click_rate = metric.clicks / metric.views
    like_rate = getattr(metric, "likes", 0) / metric.views
    normalized_view_time = min((metric.view_time / metric.views) / 10.0, 1.0)
    return (
        SmartPhotosService.ALPHA * match_rate
        + SmartPhotosService.BETA * click_rate
        + SmartPhotosService.GAMMA * normalized_view_time
        + SmartPhotosService.DELTA * like_rate
    )

@staticmethod
async def record_photo_like(user_id: str, media_id: str) -> PhotoMetric:
    metric = await PhotoMetric.find_one(
        PhotoMetric.user_id == user_id, PhotoMetric.media_id == media_id
    )
    if metric:
        metric.likes = (metric.likes or 0) + 1
        await metric.save()
        return metric
    metric = PhotoMetric(user_id=user_id, media_id=media_id, likes=1)
    await metric.insert()
    return metric
```

- [ ] **Step 4: Run tests and commit**

Run: `venv\Scripts\python.exe -m pytest tests/test_smart_photos_likes.py -q`
Expected: PASS.

```bash
git add backend/src/models/photo_metric.py backend/src/services/smart_photos.py backend/tests/test_smart_photos_likes.py
git commit -m "feat(smart-photos): contar likes por foto"
```

---

### Task 2: Backend media attribution and like pipeline

**Files:**
- Modify: `backend/src/models/match.py`
- Modify: `backend/src/api/discovery.py`
- Modify: `backend/src/services/notification_service.py`
- Test: `backend/tests/test_swipe_media_attribution.py`

**Interfaces:**
- Consumes: `SmartPhotosService.record_photo_like` from Task 1.
- Produces: `SwipeRequest.shown_media_id`, `Match.shown_media_id_1/2`, `handle_swipe_notifications(...)`.

- [ ] **Step 1: Write failing tests**

```python
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.media import MediaType
from src.services import notification_service as ns


@pytest.mark.asyncio
async def test_photo_like_records_metric_and_passes_media_snapshot():
    media = SimpleNamespace(
        id="m1", user_id="target", type=MediaType.PHOTO,
        url="/p.jpg", thumbnail_url="/p-thumb.jpg",
    )
    with patch.object(ns.MediaItem, "get", new=AsyncMock(return_value=media)), \
         patch.object(ns, "record_photo_like", new=AsyncMock()) as record, \
         patch.object(ns, "emit_like_notification", new=AsyncMock()) as emit:
        await ns.handle_swipe_notifications(
            swiper_id="me", target_id="target", interaction="like",
            is_match=False, match_id="match1", shown_media_id="m1",
            is_new_like=True, was_matched=False,
        )
    record.assert_awaited_once_with("target", "m1")
    assert emit.await_args.kwargs["shown_media_url"] == "/p.jpg"
    assert emit.await_args.kwargs["shown_media_type"] == "photo"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `venv\Scripts\python.exe -m pytest tests/test_swipe_media_attribution.py -q`
Expected: FAIL because `handle_swipe_notifications` does not exist.

- [ ] **Step 3: Implement models and notification service**

```python
# match.py
shown_media_id_1: Optional[str] = None
shown_media_id_2: Optional[str] = None
```

```python
# notification_service.py
from src.models.media import MediaItem, MediaType
from src.services.smart_photos import SmartPhotosService

async def resolve_recipient_media(media_ref: str, recipient_id: str):
    if not media_ref:
        return None
    media = None
    try:
        media = await MediaItem.get(media_ref)
    except Exception:
        pass
    if media is None:
        media = await MediaItem.find_one(MediaItem.url == media_ref)
    if media is None or str(media.user_id) != recipient_id:
        return None
    return media


async def handle_swipe_notifications(
    *,
    swiper_id: str,
    target_id: str,
    interaction: str,
    is_match: bool,
    match_id: str,
    shown_media_id: Optional[str] = None,
    is_new_like: bool = True,
    was_matched: bool = False,
) -> None:
    if interaction not in ("like", "superlike"):
        return
    media = await resolve_recipient_media(shown_media_id, target_id)
    media_id = str(media.id) if media else None
    if (
        media
        and is_new_like
        and media.type == MediaType.PHOTO
    ):
        await SmartPhotosService.record_photo_like(target_id, media_id)
    if is_match and not was_matched:
        await emit_match_notification(
            user_a_id=swiper_id, user_b_id=target_id, match_id=match_id
        )
        return
    if not is_new_like:
        return
    await emit_like_notification(
        liker_id=swiper_id,
        recipient_id=target_id,
        shown_media_id=media_id,
        is_superlike=interaction == "superlike",
        shown_media_url=getattr(media, "url", None) if media else None,
        shown_media_type=(
            media.type.value if media and hasattr(media.type, "value") else None
        ),
        shown_media_thumbnail_url=(
            getattr(media, "thumbnail_url", None) if media else None
        ),
    )
```

Extend `emit_like_notification` with the three optional snapshot params and merge them into `metadata`. Use content `le gustó tu foto/video` when `shown_media_id` exists.

- [ ] **Step 4: Wire `SwipeRequest` and discovery endpoint**

```python
class SwipeRequest(BaseModel):
    target_user_id: str
    interaction: InteractionType
    dwell_time_ms: Optional[int] = None
    is_blind_mode: bool = False
    shown_media_id: Optional[str] = None
```

In the existing-match branch capture `previous_interaction` and `previous_status`, persist the shown media on the caller's side when the interaction is like/superlike, then call `handle_swipe_notifications` in a `try/except` after saving with:

```python
is_new_like = previous_interaction not in (
    InteractionType.LIKE, InteractionType.SUPERLIKE
)
was_matched = previous_status == MatchStatus.MATCHED
```

In the create branch pass `shown_media_id_1=request.shown_media_id`, then call the same helper with `is_match=False, is_new_like=True, was_matched=False`.

- [ ] **Step 5: Run tests and commit**

Run: `venv\Scripts\python.exe -m pytest tests/test_swipe_media_attribution.py tests/test_notification_service.py -q`
Expected: PASS.

```bash
git add backend/src/models/match.py backend/src/api/discovery.py backend/src/services/notification_service.py backend/tests/test_swipe_media_attribution.py
git commit -m "feat(discovery): atribuir like a la media visible"
```

---

### Task 3: Profile interaction state

**Files:**
- Modify: `backend/src/api/users.py`
- Test: `backend/tests/test_profile_interaction_state.py`

**Interfaces:**
- Produces: `_interaction_state(match, me) -> tuple[Optional[str], Optional[str]]`, response fields `my_interaction`, `match_status`.

- [ ] **Step 1: Write failing test**

```python
from types import SimpleNamespace
from src.api.users import _interaction_state


def test_interaction_state_for_user_two():
    match = SimpleNamespace(
        user_id_1="other", user_id_2="me",
        user_1_interaction="pass", user_2_interaction="like",
        status="pending",
    )
    assert _interaction_state(match, "me") == ("like", "pending")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `venv\Scripts\python.exe -m pytest tests/test_profile_interaction_state.py -q`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement**

```python
from src.models.match import Match, InteractionType

def _interaction_state(match, me: str):
    if not match:
        return None, None
    interaction = (
        match.user_1_interaction
        if match.user_id_1 == me
        else match.user_2_interaction
    )
    status = match.status
    return (
        interaction.value if hasattr(interaction, "value") else interaction,
        status.value if hasattr(status, "value") else status,
    )
```

At the end of `get_user_by_nickname`, for an authenticated non-owner, fetch the `Match` by the two user ids and add:

```python
result["my_interaction"], result["match_status"] = _interaction_state(match, str(current_user.id))
```

- [ ] **Step 4: Run tests and commit**

Run: `venv\Scripts\python.exe -m pytest tests/test_profile_interaction_state.py -q`
Expected: PASS.

```bash
git add backend/src/api/users.py backend/tests/test_profile_interaction_state.py
git commit -m "feat(users): exponer estado del like en el perfil"
```

---

### Task 4: Profile carousel and like button

**Files:**
- Create: `frontend/src/components/profile/view/ProfileMediaCarousel.tsx`
- Modify: `frontend/src/components/profile/view/ProfileHeader.tsx`
- Modify: `frontend/src/components/profile/ProfileView.tsx`
- Test: `frontend/src/components/profile/view/ProfileMediaCarousel.test.tsx`

**Interfaces:**
- Produces: `ProfileMediaCarousel` props `mediaItems`, `fallbackPhotos`, `activeIndex`, `onIndexChange`, `likeSlot`.
- Consumes: `MediaItem` from `types/media`.

- [ ] **Step 1: Write failing test**

Render the carousel with two photo URLs, assert the first image is visible, click the next arrow, assert the second image is visible.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --ci ProfileMediaCarousel.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement carousel**

- `<Box>` with fixed responsive height, `position: relative`, rounded corners.
- Photos via `<Box component="img">`; videos via `<Box component="video" autoPlay muted loop playsInline poster={thumbnail_url}>`.
- Dots, counter, left/right `IconButton`s, touch start/end swipe.
- `likeSlot` absolutely positioned bottom-right with `zIndex: 5`.

- [ ] **Step 4: Integrate in ProfileHeader/ProfileView**

- `ProfileHeader` accepts `activeMediaIndex`, `onActiveMediaChange`, `likeState`, `onLike`, `showLikeButton`.
- Replace the static banner with the carousel, keep the gradient/overlap layout.
- Like button: `FavoriteIcon`, label “Me gusta”, disabled when `sending`/`sent`; show “Like enviado” after.
- `ProfileView` owns `activeMediaIndex`, `likeState`, `matchOpen`, `likedMedia`.
- `handleLike` posts `{target_user_id, interaction: 'like', shown_media_id: activeMedia?._id || activeMedia?.url}`; on match open the existing-style match dialog.
- Initialize `likeState='sent'` when `profile.my_interaction` is `like`/`superlike`.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- --ci ProfileMediaCarousel.test.tsx` and `npm run typecheck`.
Expected: PASS.

```bash
git add frontend/src/components/profile/view/ProfileMediaCarousel.tsx frontend/src/components/profile/view/ProfileHeader.tsx frontend/src/components/profile/ProfileView.tsx frontend/src/components/profile/view/ProfileMediaCarousel.test.tsx
git commit -m "feat(profile): carrusel y like unico en el perfil"
```

---

### Task 5: Capture visible media in discover and likes

**Files:**
- Modify: `frontend/src/components/profile/ProfileCard.tsx`
- Modify: `frontend/src/components/profile/ProfileActions.tsx` (only if needed for types)
- Modify: `frontend/src/components/discovery/layouts/StackLayout.tsx`
- Modify: `frontend/src/components/discovery/ProfileDetailModal.tsx`
- Modify: `frontend/src/pages/discover/index.tsx`
- Modify: `frontend/src/pages/likes/index.tsx`
- Test: `frontend/src/components/profile/ProfileCard.media.test.tsx`

**Interfaces:**
- `onLike?: (media?: MediaItem | null) => void`
- `onActiveMediaChange?: (media: MediaItem | null) => void`
- `handleSwipe(interaction, explicitProfile?, shownMedia?)`

- [ ] **Step 1: Write failing test**

Mock `apiClient.get('/media/:id')` with two photos, render `ProfileCard`, click the like button, assert `onLike` was called with the active `MediaItem`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --ci ProfileCard.media.test.tsx`
Expected: FAIL because `onLike` receives no argument.

- [ ] **Step 3: Implement**

- In `ProfileCard`, compute `activeMedia` from `mediaItems[activePhotoIndex]` or a synthetic `{ _id: '', url, type: 'photo' }` from `profile.photos`.
- Call `onLike?.(activeMedia)` in tap, keyboard, drag and ProfileActions paths.
- Call `onActiveMediaChange?.(activeMedia)` in an effect.
- Update StackLayout/ProfileDetailModal prop types to forward the media argument.
- Discover: `handleSwipe(interaction, explicitProfile, shownMedia)` adds `shown_media_id: shownMedia?._id || shownMedia?.url || null`; pass the media from StackLayout/ProfileDetailModal. Use `shownMedia?._id` for `trackMatch`.
- Likes: same third argument; store `selectedMedia` from `onActiveMediaChange` and use it in footer “Responder”.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- --ci ProfileCard.media.test.tsx` and `npm run typecheck`.
Expected: PASS.

```bash
git add frontend/src/components/profile/ProfileCard.tsx frontend/src/components/discovery/layouts/StackLayout.tsx frontend/src/components/discovery/ProfileDetailModal.tsx frontend/src/pages/discover/index.tsx frontend/src/pages/likes/index.tsx frontend/src/components/profile/ProfileCard.media.test.tsx
git commit -m "feat(discovery): enviar la media visible al dar like"
```

---

### Task 6: Notification thumbnail and navigation

**Files:**
- Modify: `frontend/src/components/notifications/NotificationItem.tsx`
- Test: `frontend/src/components/notifications/NotificationItem.test.tsx`

**Interfaces:**
- Consumes: `notification.metadata.shown_media_url`, `shown_media_thumbnail_url`, `shown_media_type`, `actor_count`, `target_type`, `metadata.target_url`.

- [ ] **Step 1: Write failing tests**

- Render a like notification with `metadata.shown_media_thumbnail_url` and assert the image `src` is used.
- Assert click calls `onRead` and `router.push('/likes')` for `actor_count > 1`.
- Assert a single like navigates to `metadata.target_url`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --ci NotificationItem.test.tsx`
Expected: FAIL because the item has no thumbnail/navigation.

- [ ] **Step 3: Implement**

- Add `useRouter`.
- `mediaThumb = metadata.shown_media_thumbnail_url || metadata.shown_media_url`.
- Render a 56x56 rounded media thumbnail when present; keep the small actor avatar/icon badge.
- Title: group likes → `N personas les gustó tu foto/video`; single like → `notification.content`; other types keep existing mapping.
- Click: mark read, then `router.push('/likes')` for groups/`target_type==='likes'`; `/chat` for chat; `metadata.target_url` otherwise.
- Fallback to actor avatar when no media.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- --ci NotificationItem.test.tsx` and `npm run typecheck`.
Expected: PASS.

```bash
git add frontend/src/components/notifications/NotificationItem.tsx frontend/src/components/notifications/NotificationItem.test.tsx
git commit -m "feat(notifications): thumbnail de media y navegacion"
```

---

### Task 7: Full verification

- [ ] Run backend targeted tests:
  `venv\Scripts\python.exe -m pytest tests/test_smart_photos_likes.py tests/test_swipe_media_attribution.py tests/test_profile_interaction_state.py tests/test_notification_service.py -q`
- [ ] Run frontend tests:
  `npm test -- --ci`
- [ ] Run `npm run typecheck` and `npm run lint`.
- [ ] Review `git diff` for accidental changes; do not push.
