from types import SimpleNamespace

from src.api.users import _interaction_state


def test_interaction_state_for_user_two():
    match = SimpleNamespace(
        user_id_1="other",
        user_id_2="me",
        user_1_interaction="pass",
        user_2_interaction="like",
        status="pending",
    )
    assert _interaction_state(match, "me") == ("like", "pending")


def test_interaction_state_without_match():
    assert _interaction_state(None, "me") == (None, None)
