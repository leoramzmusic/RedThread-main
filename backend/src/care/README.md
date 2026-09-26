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

## Target Formula (Roadmap)

The roadmap formula adds a controlled-chaos term (inspired by Dirac's unification
of seemingly incompatible theories — here: the measurable and the chaotic in
human relationships):

```
CAREScore = α·Compat + β·Auth + γ·Resp + δ·Eng + ε·Chaos(t)
```

- Today's implemented score: `0.60·compat + 0.30·dynamic + 0.10·human`
  (`care/ranking/ranker.py`) — see `docs/CARE_ALGORITHM.md` §3.1.
- `ε·Chaos(t)`: bounded, deterministic-seed noise that decays as interaction
  history grows (uncertainty shown to users as `75% ± 10%`).

## Implementation Phases

Full roadmap with acceptance criteria, dependencies, and file-level detail:
**[docs/CARE_ROADMAP.md](../../../docs/CARE_ROADMAP.md)**

| Phase | Scope |
|---|---|
| **F0** | Prerequisites: P0-1/P0-2 (chat), P1-4 (admin weights disconnected) |
| **F1** | Real dynamic signals (stop the 0.30/0.10 constants) |
| **F2** | Qualitative blocks → narrative labels + configurable weights |
| **F3** | `ε·Chaos(t)` term + uncertainty UI |
| **F4** | Feedback loop: match → chat → friend → couple, weekly recalibration |
| **F5** | Admin portal CARE menu (sliders, simulator, metrics migration) |
| **F6** | Light neural net: embeddings + MLP with mandatory explainability |

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

🚧 **In Development** — F0/F1 of the roadmap.

See [docs/CARE_ROADMAP.md](../../../docs/CARE_ROADMAP.md) for the detailed
roadmap and [docs/CARE_ALGORITHM.md](../../../docs/CARE_ALGORITHM.md) for the
current-state reference.
