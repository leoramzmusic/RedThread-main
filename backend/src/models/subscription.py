from beanie import Document, Link
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum
from src.models.user import User


class SubscriptionPlan(str, Enum):
    """Subscription plan types"""
    FREE = "free"
    PREMIUM = "premium"
    VIP = "vip"
    PREMIUM_PLUS = "premium_plus"  # Deprecated, alias for VIP


class PaymentStatus(str, Enum):
    """Payment status"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Subscription(Document):
    """
    User subscription model.
    Tracks plan status, billing cycles, and payment history.
    """
    
    user_id: str  # Reference to User._id
    plan: SubscriptionPlan = SubscriptionPlan.FREE
    
    # Status
    is_active: bool = True
    auto_renew: bool = True
    
    # Dates
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    last_payment_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    
    # Payment Info
    payment_method_id: Optional[str] = None  # Stripe/Provider ID
    last_transaction_id: Optional[str] = None
    amount: float = 0.0
    currency: str = "USD"
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    class Settings:
        name = "subscriptions"
        indexes = [
            "user_id",
            "plan",
            "is_active",
            "end_date",
            [("user_id", 1), ("is_active", 1)],
        ]
    
    def is_valid(self) -> bool:
        """Check if subscription is currently valid"""
        if not self.is_active:
            return False
        if self.end_date and datetime.utcnow() > self.end_date:
            return False
        return True

