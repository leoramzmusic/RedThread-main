"""CARE F0 tests for chat target resolution (P0-1)."""

from src.api.chat_resolvers import resolve_message_source, resolve_ws_send_mode


class TestResolveMessageSource:
    def test_existing_conversation_wins_over_match_param(self):
        assert resolve_message_source(True, "conv1", "m1") == ("conversation", "conv1")

    def test_no_conversation_uses_match_param(self):
        assert resolve_message_source(False, "conv1", "m1") == ("match", "m1")

    def test_no_conversation_no_param_falls_back_to_path(self):
        assert resolve_message_source(False, "m1", None) == ("match", "m1")

    def test_empty_match_param_falls_back_to_path(self):
        assert resolve_message_source(False, "m1", "") == ("match", "m1")


class TestResolveWsSendMode:
    def test_conversation_id_wins_when_both_present(self):
        assert resolve_ws_send_mode("c1", "m1") == "conversation"

    def test_match_only(self):
        assert resolve_ws_send_mode(None, "m1") == "match"

    def test_conversation_only(self):
        assert resolve_ws_send_mode("c1", None) == "conversation"

    def test_neither_is_error(self):
        assert resolve_ws_send_mode(None, None) == "error"
