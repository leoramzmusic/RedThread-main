"""
CARE Analytics - Metrics collection and aggregation.

Tracks engagement, quality, and diversity metrics for the CARE Engine.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict


class MetricsCollector:
    """Collects and aggregates CARE Engine metrics."""
    
    def __init__(self):
        # In-memory storage (in production, use database)
        self.swipes = []
        self.matches = []
        self.messages = []
    
    def record_swipe(
        self,
        user_id: str,
        candidate_id: str,
        interaction: str,
        dwell_time_ms: int,
        care_score: float,
        bucket: str,
        variant: str = "control"
    ):
        """Record a swipe action."""
        self.swipes.append({
            'user_id': user_id,
            'candidate_id': candidate_id,
            'interaction': interaction,
            'dwell_time_ms': dwell_time_ms,
            'care_score': care_score,
            'bucket': bucket,
            'variant': variant,
            'timestamp': datetime.utcnow()
        })
    
    def record_match(
        self,
        match_id: str,
        user_id: str,
        candidate_id: str,
        care_score: float,
        compat_score: float,
        variant: str = "control"
    ):
        """Record a match formation."""
        self.matches.append({
            'match_id': match_id,
            'user_id': user_id,
            'candidate_id': candidate_id,
            'care_score': care_score,
            'compat_score': compat_score,
            'variant': variant,
            'timestamp': datetime.utcnow(),
            'has_message': False
        })
    
    def record_message(
        self,
        match_id: str,
        response_time_ms: int
    ):
        """Record a message sent."""
        # Update match to mark it has messages
        for match in self.matches:
            if match['match_id'] == match_id:
                match['has_message'] = True
                match['response_time_ms'] = response_time_ms
                break
    
    def get_engagement_metrics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        variant: Optional[str] = None
    ) -> Dict:
        """Calculate engagement metrics."""
        if start_date is None:
            start_date = datetime.utcnow() - timedelta(days=7)
        if end_date is None:
            end_date = datetime.utcnow()
        
        # Filter data
        swipes = [s for s in self.swipes if start_date <= s['timestamp'] <= end_date]
        matches = [m for m in self.matches if start_date <= m['timestamp'] <= end_date]
        
        if variant:
            swipes = [s for s in swipes if s.get('variant') == variant]
            matches = [m for m in matches if m.get('variant') == variant]
        
        # Calculate metrics
        total_swipes = len(swipes)
        likes = len([s for s in swipes if s['interaction'] in ['like', 'superlike']])
        total_matches = len(matches)
        matches_with_messages = len([m for m in matches if m.get('has_message')])
        
        match_rate = (total_matches / likes) if likes > 0 else 0
        message_rate = (matches_with_messages / total_matches) if total_matches > 0 else 0
        
        return {
            'match_rate': round(match_rate, 3),
            'message_rate': round(message_rate, 3),
            'total_swipes': total_swipes,
            'total_likes': likes,
            'total_matches': total_matches,
            'avg_dwell_time': sum(s['dwell_time_ms'] for s in swipes) / len(swipes) if swipes else 0
        }
    
    def get_diversity_metrics(self) -> Dict:
        """Calculate diversity distribution."""
        bucket_counts = defaultdict(int)
        
        for swipe in self.swipes:
            bucket = swipe.get('bucket', 'unknown')
            bucket_counts[bucket] += 1
        
        total = sum(bucket_counts.values())
        
        return {
            'bucket_distribution': {
                bucket: round(count / total, 3) if total > 0 else 0
                for bucket, count in bucket_counts.items()
            },
            'total_recommendations': total
        }
    
    def get_ab_test_results(self, experiment_id: str) -> Dict:
        """Get A/B test comparison."""
        # Group by variant
        variants = defaultdict(lambda: {'swipes': [], 'matches': []})
        
        for swipe in self.swipes:
            variant = swipe.get('variant', 'control')
            variants[variant]['swipes'].append(swipe)
        
        for match in self.matches:
            variant = match.get('variant', 'control')
            variants[variant]['matches'].append(match)
        
        # Calculate metrics per variant
        results = {}
        for variant, data in variants.items():
            likes = len([s for s in data['swipes'] if s['interaction'] in ['like', 'superlike']])
            matches = len(data['matches'])
            
            results[variant] = {
                'match_rate': round(matches / likes, 3) if likes > 0 else 0,
                'users': len(set(s['user_id'] for s in data['swipes'])),
                'total_likes': likes,
                'total_matches': matches
            }
        
        return {
            'experiment_id': experiment_id,
            'variants': results,
            'p_value': 0.05  # TODO: Calculate statistical significance
        }


# Global instance
metrics_collector = MetricsCollector()
