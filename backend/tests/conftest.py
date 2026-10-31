"""CARE F0 pytest session setup for beanie document models."""

from beanie.odm.settings.document import DocumentSettings

from src.models.campaign import Campaign
from src.models.conversation import Conversation
from src.models.media import MediaItem
from src.models.notification import Notification
from src.models.notification_audience import NotificationAudience
from src.models.notification_campaign import NotificationCampaign
from src.models.notification_delivery import NotificationDelivery
from src.models.notification_history import NotificationHistory
from src.models.notification_schedule import NotificationSchedule
from src.models.notification_template import NotificationTemplate
from src.models.photo_metric import PhotoMetric
from src.models.relationship import Relationship

Campaign._document_settings = DocumentSettings(name="campaigns")
Relationship._document_settings = DocumentSettings(name="relationships")
Conversation._document_settings = DocumentSettings(name="conversations")
Notification._document_settings = DocumentSettings(name="notifications")
NotificationDelivery._document_settings = DocumentSettings(name="notification_deliveries")
NotificationHistory._document_settings = DocumentSettings(name="notification_history")
NotificationTemplate._document_settings = DocumentSettings(name="notification_templates")
NotificationAudience._document_settings = DocumentSettings(name="notification_audiences")
NotificationCampaign._document_settings = DocumentSettings(name="notification_campaigns")
NotificationSchedule._document_settings = DocumentSettings(name="notification_schedules")
PhotoMetric._document_settings = DocumentSettings(name="photo_metrics")
MediaItem._document_settings = DocumentSettings(name="media_items")
