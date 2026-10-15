"""Smoke test: the scoring module must import cleanly."""


def test_compatibility_module_imports():
    import src.care.scoring.compatibility  # noqa: F401
