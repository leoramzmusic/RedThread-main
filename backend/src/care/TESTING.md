# CARE Engine - Testing Guide

## Running Tests

The CARE Engine tests require the module to be importable. There are two options:

### Option 1: Install in Development Mode (Recommended)

From the `backend/` directory:

```bash
pip install -e src/
```

This makes the `care` module importable system-wide.

### Option 2: Set PYTHONPATH

From the `backend/src/care/` directory:

```bash
# Windows PowerShell
$env:PYTHONPATH = "C:\Users\leora\Documents\RedThread\backend\src"
python -m pytest tests/ -v

# Linux/Mac
PYTHONPATH=/path/to/backend/src python -m pytest tests/ -v
```

## Test Coverage

- `test_compatibility.py`: Compatibility scoring with various scenarios
- `test_ranking.py`: Diversity bucketing and quota enforcement

## Expected Results

All tests should pass with Phase 1 implementation:
- Perfect match: score ≈ 1.0
- Partial match: score between 0.25-0.35
- Age mismatch: reduced score
- Distance decay: proximity penalty applied
- Diversity quotas: balanced bucket distribution
