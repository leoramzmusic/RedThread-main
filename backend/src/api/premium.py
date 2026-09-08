from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from src.models.user import User, SubscriptionTier
from src.api.auth import get_current_user
from src.core.config import settings


router = APIRouter()


class SubscriptionRequest(BaseModel):
    tier: str  # "premium" or "vip"
    plan: str  # "monthly", "yearly", "3_months", "6_months" - kept for backward compatibility or logging
    duration_months: int  # 1, 3, 6, 12
    payment_method_id: str  # Stripe payment method ID


class SubscriptionResponse(BaseModel):
    subscription_tier: SubscriptionTier
    expires_at: Optional[datetime]
    message: str


class BoostPurchaseRequest(BaseModel):
    package_id: str  # "boost_5", "boost_10", "boost_20"
    payment_method_id: str


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe_premium(
    request: SubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Subscribe to premium or VIP"""
    
    # TODO: Implement actual Stripe payment processing
    # This is a placeholder implementation
    
    # Validate tier
    if request.tier.lower() == "premium":
        target_tier = SubscriptionTier.PREMIUM
        if request.duration_months == 1:
            amount = settings.PREMIUM_MONTHLY_PRICE
        elif request.duration_months == 3:
            amount = settings.PREMIUM_3_MONTH_PRICE
        elif request.duration_months == 6:
            amount = settings.PREMIUM_6_MONTH_PRICE
        elif request.duration_months == 12:
            amount = settings.PREMIUM_YEARLY_PRICE
        else:
             raise HTTPException(status_code=400, detail="Invalid duration")
             
    elif request.tier.lower() == "vip":
        target_tier = SubscriptionTier.VIP
        if request.duration_months == 1:
            amount = settings.VIP_MONTHLY_PRICE
        elif request.duration_months == 3:
            amount = settings.VIP_3_MONTH_PRICE
        elif request.duration_months == 6:
            amount = settings.VIP_6_MONTH_PRICE
        elif request.duration_months == 12:
            amount = settings.VIP_YEARLY_PRICE
        else:
             raise HTTPException(status_code=400, detail="Invalid duration")
    else:
        raise HTTPException(status_code=400, detail="Invalid tier")

    
    # Calculate expiration
    expires_at = datetime.utcnow() + timedelta(days=request.duration_months * 30) # Approximate
    
    # Update user subscription
    current_user.subscription_tier = target_tier
    current_user.subscription_expires_at = expires_at
    # current_user.stripe_customer_id = "cus_..." # Set after Stripe processing
    await current_user.save()
    
    return SubscriptionResponse(
        subscription_tier=target_tier,
        expires_at=expires_at,
        message=f"Successfully subscribed to {request.tier} plan for {request.duration_months} months"
    )


@router.post("/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_user)):
    """Cancel premium subscription"""
    
    if current_user.subscription_tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription"
        )
    
    # TODO: Cancel Stripe subscription
    
    current_user.subscription_tier = SubscriptionTier.FREE
    current_user.subscription_expires_at = None
    await current_user.save()
    
    return {"message": "Subscription cancelled"}


@router.get("/features")
async def get_premium_features():
    """Get list of premium features and pricing"""
    
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
            "premium": {
                "monthly": settings.PREMIUM_MONTHLY_PRICE,
                "threeMonth": settings.PREMIUM_3_MONTH_PRICE,
                "sixMonth": settings.PREMIUM_6_MONTH_PRICE,
                "yearly": settings.PREMIUM_YEARLY_PRICE,
            },
            "vip": {
                "monthly": settings.VIP_MONTHLY_PRICE,
                "threeMonth": settings.VIP_3_MONTH_PRICE,
                "sixMonth": settings.VIP_6_MONTH_PRICE,
                "yearly": settings.VIP_YEARLY_PRICE,
            }
        }
    }


@router.get("/status")
async def get_subscription_status(current_user: User = Depends(get_current_user)):
    """Get current subscription status"""
    
    return {
        "subscription_tier": current_user.subscription_tier,
        "expires_at": current_user.subscription_expires_at,
        "is_active": current_user.subscription_tier != SubscriptionTier.FREE,
        "days_remaining": (current_user.subscription_expires_at - datetime.utcnow()).days if current_user.subscription_expires_at else 0
    }


class UpdateTierRequest(BaseModel):
    tier: str  # "free", "premium", or "vip"
    days: int = 30  # Number of days for premium/vip


@router.post("/update-tier")
async def update_subscription_tier(
    request: UpdateTierRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update subscription tier (for testing/admin purposes)
    In production, this should be restricted to admin users only
    """
    
    # Validate tier
    tier_map = {
        "free": SubscriptionTier.FREE,
        "premium": SubscriptionTier.PREMIUM,
        "vip": SubscriptionTier.VIP,
    }
    
    if request.tier.lower() not in tier_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tier. Must be 'free', 'premium', or 'vip'"
        )
    
    new_tier = tier_map[request.tier.lower()]
    
    # Update user
    current_user.subscription_tier = new_tier
    
    if new_tier == SubscriptionTier.FREE:
        current_user.subscription_expires_at = None
    else:
        current_user.subscription_expires_at = datetime.utcnow() + timedelta(days=request.days)
    
    await current_user.save()
    
    return {
        "message": f"Subscription tier updated to {request.tier}",
        "subscription_tier": current_user.subscription_tier,
        "expires_at": current_user.subscription_expires_at,
    }


@router.get("/boost-packages")
async def get_boost_packages(current_user: User = Depends(get_current_user)):
    """Get available boost packages with tier-based discounts"""
    
    # Base prices
    packages = [
        {"id": "boost_5", "count": 5, "price": settings.BOOST_5_PACK_PRICE},
        {"id": "boost_10", "count": 10, "price": settings.BOOST_10_PACK_PRICE},
        {"id": "boost_20", "count": 20, "price": settings.BOOST_20_PACK_PRICE},
    ]
    
    # Apply discounts based on tier
    discount = 0.0
    if current_user.subscription_tier == SubscriptionTier.PREMIUM:
        discount = 0.15  # 15% discount for Premium
    elif current_user.subscription_tier == SubscriptionTier.VIP:
        discount = 0.30  # 30% discount for VIP
        
    for pkg in packages:
        pkg["original_price"] = pkg["price"]
        pkg["price"] = round(pkg["price"] * (1 - discount), 2)
        pkg["discount_percent"] = int(discount * 100)
        
    return {
        "packages": packages,
        "current_tier": current_user.subscription_tier,
        "available_boosts": current_user.available_boosts
    }


@router.post("/purchase-boosts")
async def purchase_boosts(
    request: BoostPurchaseRequest,
    current_user: User = Depends(get_current_user)
):
    """Purchase a package of boosts"""
    
    package_map = {
        "boost_5": 5,
        "boost_10": 10,
        "boost_20": 20
    }
    
    if request.package_id not in package_map:
        raise HTTPException(status_code=400, detail="Invalid package ID")
        
    boost_count = package_map[request.package_id]
    
    # TODO: Implement actual Stripe payment processing
    
    # Update user available boosts
    # Note: purchased boosts are added to available_boosts. 
    # The renewal logic normally resets to the tier maximum.
    # We should probably have a separate field or handle this in renewal.
    # For now, we'll just add them.
    current_user.available_boosts += boost_count
    await current_user.save()
    
    return {
        "success": True,
        "message": f"Successfully purchased {boost_count} boosts!",
        "new_total": current_user.available_boosts
    }

