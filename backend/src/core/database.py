from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.core.config import settings
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match
from src.models.message import Message
from src.models.conversation import Conversation
from src.models.relationship import Relationship
from src.models.report import Report
from src.models.report_rule import ReportRule
from src.models.spotify_playlist import SpotifyPlaylist
from src.models.instagram_photo import InstagramPhoto
from src.models.system_options import SystemOption
from src.models.event import Event
from src.models.notification import Notification
from src.models.admin_rbac import AdminUser, AdminAction
from src.models.employee import Employee
from src.models.subscription import Subscription
from src.models.campaign import Campaign
from src.models.support_ticket import SupportTicket
from src.models.legal_document import LegalDocument
from src.models.media import MediaItem
from src.models.session import Session
from src.models.verification_log import VerificationLog
from src.models.user_settings import UserSettings
from src.models.role import Role
from src.models.department import Department
from src.models.employee_audit import EmployeeAudit
from src.models.audit_log import AuditLog
from src.models.algorithm_management import AlgorithmFactor, AlgorithmHistory, ABTest
from src.models.golth import GolthProfile, GolthInterest
from src.models.appearance import AppearanceResource
from src.models.appearance_history import AppearanceHistory
from src.models.photo_metric import PhotoMetric


async def init_db():
    """Initialize MongoDB connection and Beanie ODM"""
    
    # Create Motor client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # Initialize Beanie with document models
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[
            User,
            Profile,
            Match,
            Message,
            Conversation,
            Relationship,
            Report,
            SpotifyPlaylist,
            InstagramPhoto,
            SystemOption,
            Event,
            Notification,
            AdminUser,
            AdminAction,
            Employee,
            Subscription,
            Campaign,
            SupportTicket,
            LegalDocument,
            MediaItem,
            Session,
            VerificationLog,
            UserSettings,
            Role,
            Department,
            EmployeeAudit,
            ReportRule,
            AuditLog,  # Data privacy audit logging
            AlgorithmFactor,
            AlgorithmHistory,
            ABTest,
            GolthProfile,
            GolthInterest,
            AppearanceResource,
            AppearanceHistory,
            PhotoMetric,
        ]
    )
    
    print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_db():
    """Close MongoDB connection"""
    # Beanie handles connection cleanup automatically
    print("✅ MongoDB connection closed")


