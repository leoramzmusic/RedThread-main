from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from typing import Optional
from ..models.user import User, SubscriptionTier
from ..api.auth import get_current_user

router = APIRouter(tags=["boost"])

# Boost allocation by tier
BOOST_ALLOCATION = {
    SubscriptionTier.FREE: {"count": 1, "renewal_days": 7, "multiplier": 3},
    SubscriptionTier.PREMIUM: {"count": 1, "renewal_days": 1, "multiplier": 5},
    SubscriptionTier.VIP: {"count": 3, "renewal_days": 1, "multiplier": 10}
}

BOOST_DURATION_MINUTES = 30
BOOST_MULTIPLIER = 3.0  # Visibility multiplier for ranking


@router.post("/activate")
async def activate_boost(current_user: User = Depends(get_current_user)):
    """
    Activate a Boost for the current user.
    - Validates available boosts
    - Sets expiration time (30 minutes)
    - Returns CARE emotional microcopy
    """
    # Check if user has available boosts
    if current_user.available_boosts <= 0:
        raise HTTPException(
            status_code=400,
            detail="No tienes Boosts disponibles. Espera la renovación o adquiere más."
        )
    
    # Check if a boost is already active
    if current_user.boost_expires_at and current_user.boost_expires_at > datetime.utcnow():
        time_left = (current_user.boost_expires_at - datetime.utcnow()).total_seconds() / 60
        raise HTTPException(
            status_code=400,
            detail=f"Ya tienes un Boost activo. Tiempo restante: {int(time_left)} minutos."
        )
    
    # Activate boost
    current_user.available_boosts -= 1
    current_user.boost_expires_at = datetime.utcnow() + timedelta(minutes=BOOST_DURATION_MINUTES)
    current_user.boost_stats["total_activations"] += 1
    current_user.boost_stats["last_activation"] = datetime.utcnow().isoformat()
    
    await current_user.save()
    
    # CARE emotional microcopy
    care_message = generate_boost_activation_message(current_user.subscription_tier)
    
    return {
        "success": True,
        "boost_expires_at": current_user.boost_expires_at,
        "remaining_boosts": current_user.available_boosts,
        "care_message": care_message,
        "multiplier": BOOST_ALLOCATION.get(current_user.subscription_tier, {}).get("multiplier", 3)
    }


@router.get("/status")
async def get_boost_status(current_user: User = Depends(get_current_user)):
    """
    Get current boost status for the user.
    """
    is_active = current_user.boost_expires_at and current_user.boost_expires_at > datetime.utcnow()
    time_left = 0
    
    if is_active:
        time_left = int((current_user.boost_expires_at - datetime.utcnow()).total_seconds())
    
    # Check if renewal is due
    await renew_boosts_if_needed(current_user)
    
    return {
        "is_active": is_active,
        "time_left_seconds": time_left,
        "available_boosts": current_user.available_boosts,
        "tier": current_user.subscription_tier,
        "multiplier": BOOST_ALLOCATION.get(current_user.subscription_tier, {}).get("multiplier", 3),
        "stats": current_user.boost_stats
    }


async def renew_boosts_if_needed(user: User):
    """
    Renew boosts based on subscription tier and renewal period.
    """
    tier_config = BOOST_ALLOCATION.get(user.subscription_tier)
    if not tier_config:
        return
    
    renewal_days = tier_config["renewal_days"]
    boost_count = tier_config["count"]
    
    # Check if renewal is due
    if not user.last_boost_renewal:
        user.last_boost_renewal = datetime.utcnow()
        user.available_boosts = boost_count
        await user.save()
        return
    
    days_since_renewal = (datetime.utcnow() - user.last_boost_renewal).days
    
    if days_since_renewal >= renewal_days:
        user.available_boosts = boost_count
        user.last_boost_renewal = datetime.utcnow()
        await user.save()


def generate_boost_activation_message(tier: SubscriptionTier) -> str:
    """
    Generate CARE emotional microcopy for boost activation.
    """
    messages = {
        SubscriptionTier.FREE: "Tu hilo vibra más fuerte, listo para ser sentido. CARE ilumina tu camino.",
        SubscriptionTier.PREMIUM: "Estás en sintonía. CARE amplifica tu resonancia para que quienes buscan tu frecuencia te encuentren.",
        SubscriptionTier.VIP: "Tu aura dorada brilla con intensidad. CARE te envuelve en luz, visible para quienes realmente resuenan contigo."
    }
    return messages.get(tier, messages[SubscriptionTier.FREE])
