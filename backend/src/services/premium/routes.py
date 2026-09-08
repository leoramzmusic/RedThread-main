from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from src.models.user import User, SubscriptionTier
from src.services.auth.routes import get_current_user
from src.core.config import settings


router = APIRouter()


class SubscriptionRequest(BaseModel):
    plan: str  # "monthly" or "yearly"
    payment_method_id: str  # Stripe payment method ID


class SubscriptionResponse(BaseModel):
    subscription_tier: SubscriptionTier
    expires_at: datetime
    message: str


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe_premium(
    request: SubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Subscribe to premium"""
    
    # TODO: Implement actual Stripe payment processing
    # This is a placeholder implementation
    
    if current_user.subscription_tier == SubscriptionTier.PREMIUM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to premium"
        )
    
    # Calculate expiration
    if request.plan == "monthly":
        expires_at = datetime.utcnow() + timedelta(days=30)
        amount = settings.PREMIUM_MONTHLY_PRICE
    elif request.plan == "yearly":
        expires_at = datetime.utcnow() + timedelta(days=365)
        amount = settings.PREMIUM_YEARLY_PRICE
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan. Choose 'monthly' or 'yearly'"
        )
    
    # Update user subscription
    current_user.subscription_tier = SubscriptionTier.PREMIUM
    current_user.subscription_expires_at = expires_at
    # current_user.stripe_customer_id = "cus_..." # Set after Stripe processing
    await current_user.save()
    
    return SubscriptionResponse(
        subscription_tier=SubscriptionTier.PREMIUM,
        expires_at=expires_at,
        message=f"Successfully subscribed to {request.plan} premium plan"
    )


@router.post("/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_user)):
    """Cancel premium subscription"""
    
    if current_user.subscription_tier != SubscriptionTier.PREMIUM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active premium subscription"
        )
    
    # TODO: Cancel Stripe subscription
    
    current_user.subscription_tier = SubscriptionTier.FREE
    current_user.subscription_expires_at = None
    await current_user.save()
    
    return {"message": "Premium subscription cancelled"}


@router.get("/features")
async def get_premium_features():
    """Get list of premium features"""
    
    return {
        "features": [
            {
                "name": "See Who Likes You",
                "description": "View all users who have liked your profile",
                "icon": "favorite"
            },
            {
                "name": "Rewind",
                "description": "Undo your last swipe",
                "icon": "undo"
            },
            {
                "name": "Extended Radar",
                "description": f"See users up to {settings.PREMIUM_RADAR_RANGE_KM}km away (vs {settings.BASIC_RADAR_RANGE_KM}km)",
                "icon": "radar"
            },
            {
                "name": "Advanced Filters",
                "description": "Filter by interests, MBTI, activity patterns, and more",
                "icon": "filter"
            },
            {
                "name": "Message Translation",
                "description": "Automatically translate messages to your language",
                "icon": "translate"
            },
            {
                "name": "Video Calls",
                "description": "Connect face-to-face with your matches",
                "icon": "videocam"
            },
            {
                "name": "Pro Profile Badge",
                "description": "Stand out with a premium badge on your profile",
                "icon": "verified"
            },
            {
                "name": "Unlimited Likes",
                "description": "No daily limit on likes",
                "icon": "all_inclusive"
            }
        ],
        "pricing": {
            "monthly": settings.PREMIUM_MONTHLY_PRICE,
            "yearly": settings.PREMIUM_YEARLY_PRICE,
            "yearly_savings": round((settings.PREMIUM_MONTHLY_PRICE * 12) - settings.PREMIUM_YEARLY_PRICE, 2)
        }
    }


@router.get("/status")
async def get_subscription_status(current_user: User = Depends(get_current_user)):
    """Get current subscription status"""
    
    return {
        "subscription_tier": current_user.subscription_tier,
        "expires_at": current_user.subscription_expires_at,
        "is_active": current_user.subscription_tier == SubscriptionTier.PREMIUM,
        "days_remaining": (current_user.subscription_expires_at - datetime.utcnow()).days if current_user.subscription_expires_at else 0
    }

