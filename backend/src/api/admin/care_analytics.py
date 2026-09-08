"""
CARE Analytics API endpoints.

Provides metrics and insights for the CARE Engine.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timedelta

# Import User authentication (for admin users)
from src.api.auth import require_admin
from src.models.user import User

# Import CARE metrics
from src.care.analytics.metrics import metrics_collector


router = APIRouter()


@router.get("/metrics/engagement")
async def get_engagement_metrics(
    days: int = Query(7, ge=1, le=90),
    variant: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    """
    Get engagement metrics for CARE Engine.
    
    Requires admin access.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    
    metrics = metrics_collector.get_engagement_metrics(
        start_date=start_date,
        end_date=end_date,
        variant=variant
    )
    
    return {
        "period": f"last_{days}_days",
        "metrics": metrics
    }


@router.get("/metrics/diversity")
async def get_diversity_metrics(
    current_user: User = Depends(require_admin)
):
    """
    Get diversity distribution metrics.
    
    Shows how recommendations are distributed across popularity buckets.
    """
    return metrics_collector.get_diversity_metrics()


@router.get("/ab-tests/{experiment_id}")
async def get_ab_test_results(
    experiment_id: str,
    current_user: User = Depends(require_admin)
):
    """
    Get A/B test results for a specific experiment.
    
    Compares performance across variants.
    """
    return metrics_collector.get_ab_test_results(experiment_id)


@router.get("/metrics/summary")
async def get_metrics_summary(
    current_user: User = Depends(require_admin)
):
    """
    Get overall CARE Engine health summary.
    """
    # Last 7 days engagement
    engagement_7d = metrics_collector.get_engagement_metrics(
        start_date=datetime.utcnow() - timedelta(days=7)
    )
    
    # Last 30 days engagement
    engagement_30d = metrics_collector.get_engagement_metrics(
        start_date=datetime.utcnow() - timedelta(days=30)
    )
    
    # Diversity
    diversity = metrics_collector.get_diversity_metrics()
    
    # A/B test (if running)
    ab_test = metrics_collector.get_ab_test_results("weight_test_001")
    
    return {
        "engagement_7d": engagement_7d,
        "engagement_30d": engagement_30d,
        "diversity": diversity,
        "active_experiments": [ab_test]
    }
