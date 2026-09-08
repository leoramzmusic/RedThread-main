# CARE Engine

**C**ompatibility · **A**ctivity · **R**esponsiveness · **E**quity

The CARE Engine is RedThread's recommendation system that combines algorithmic matching with human-centric values to produce authentic, fair, and emotionally safe connections.

## Philosophy

Unlike traditional dating algorithms that optimize for engagement metrics, CARE prioritizes:
- **Authentic compatibility** over superficial attraction
- **Balanced exposure** over popularity contests
- **Emotional safety** over vanity metrics
- **Diversity** over filter bubbles

## Architecture

```
care/
├── models/          # Data structures (UserProfile, CandidateProfile, etc.)
├── scoring/         # Scoring functions (compatibility, dynamic, human)
├── ranking/         # Ranking logic with diversity quotas
├── feedback/        # Real-time and batch feedback processing
└── utils/           # Helper functions (geo, tags, explainer)
```

## Core Components

### 1. Compatibility Score (60%)
Measures profile-level fit based on:
- Age preferences
- Shared interests & values
- Lifestyle compatibility
- Narrative style match
- Geographic proximity

### 2. Dynamic Preference Score (30%)
Learns from user behavior:
- Tag affinity from interaction history
- Activity & responsiveness signals
- Proximity with decay
- Recency momentum

### 3. Human-Centric Adjustments (10%)
Ensures fairness and authenticity:
- Penalizes vanity metrics (high likes, low responses)
- Penalizes ghosting patterns
- Boosts underexposed profiles
- Enforces segment-aware fairness

## Implementation Phases

**Phase 1** (Current): Foundation
- Data models
- Compatibility scoring
- Basic ranking with diversity

**Phase 2**: Dynamic Intelligence
- Behavioral signals
- Human adjustments
- Feedback loops

**Phase 3**: Advanced Features
- Cold start handling
- Score explanations
- A/B testing framework

## Usage

```python
from care.ranking import rank_candidates
from care.models import UserProfile

# Get recommendations
user = UserProfile.from_db(user_id)
candidates = rank_candidates(user, limit=20)

# Process feedback
from care.feedback import on_user_action
on_user_action({
    'user_id': user_id,
    'candidate_id': candidate_id,
    'type': 'LIKE',
    'timestamp': now()
})
```

## Privacy & Safety

- **No metric exposure**: Users never see popularity counts or like ratios
- **Positive explanations**: Match reasons are narrative and encouraging
- **Exposure limits**: Prevents repeated showing of same profiles
- **Fairness caps**: Ensures balanced visibility across segments

## Development Status

🚧 **In Development** - Phase 1 (Foundation)

See [implementation_plan.md](file:///C:/Users/leora/.gemini/antigravity/brain/f0e75734-3d32-4bb3-b4e7-74db2c57a172/implementation_plan.md) for detailed roadmap.
