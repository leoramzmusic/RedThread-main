from datetime import datetime
from typing import List
from src.models.media import MediaItem, MediaType
from src.models.profile import Profile
from src.models.photo_metric import PhotoMetric

class SmartPhotosService:
    # Scoring coefficients
    ALPHA = 0.5  # Matches/Views weight
    BETA = 0.3   # Clicks/Views weight
    GAMMA = 0.2  # View Time weight (normalized)

    @staticmethod
    def calculate_score(metric: PhotoMetric) -> float:
        """
        Calculates a weighted score for a photo based on its metrics.
        Score = alpha * MatchRate + beta * ClickRate + gamma * ViewTime
        """
        if metric.views == 0:
            return 0.0

        match_rate = metric.matches / metric.views
        click_rate = metric.clicks / metric.views
        
        # Normalize view time: assuming 10s is a very good view time per view
        avg_view_time = metric.view_time / metric.views
        normalized_view_time = min(avg_view_time / 10.0, 1.0)

        score = (
            SmartPhotosService.ALPHA * match_rate +
            SmartPhotosService.BETA * click_rate +
            SmartPhotosService.GAMMA * normalized_view_time
        )
        return score

    @staticmethod
    async def evaluate_user_photos(user_id: str):
        """
        Evaluates and reorders photos for a user based on their performance.
        """
        profile = await Profile.find_one(Profile.user_id == user_id)
        if not profile or not profile.smart_photos_enabled:
            return

        # Get all photo media items
        photos = await MediaItem.find(
            MediaItem.user_id == user_id,
            MediaItem.type == MediaType.PHOTO
        ).to_list()

        if len(photos) < 2:
            return

        # Get metrics for all photos
        metrics = await PhotoMetric.find(PhotoMetric.user_id == user_id).to_list()
        metrics_map = {m.media_id: m for m in metrics}

        # Rank photos
        ranked_photos = []
        for photo in photos:
            metric = metrics_map.get(str(photo.id))
            score = SmartPhotosService.calculate_score(metric) if metric else 0.0
            ranked_photos.append((photo, score))

        # Sort by score descending
        ranked_photos.sort(key=lambda x: x[1], reverse=True)

        # Update order_index
        changed = False
        for index, (photo, score) in enumerate(ranked_photos):
            if photo.order_index != index:
                photo.order_index = index
                await photo.save()
                changed = True

        if changed:
            # Sync to profile
            from src.api.media import sync_profile_photos
            await sync_profile_photos(user_id)
            
            profile.smart_photos_last_evaluated = datetime.utcnow()
            await profile.save()
            print(f"✅ Smart Photos reordered for user {user_id}")
