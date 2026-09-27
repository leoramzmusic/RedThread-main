"""Pure target-resolution helpers for chat HTTP/WS handlers (CARE F0, P0-1)."""

from typing import Optional


def resolve_message_source(
    conversation_found: bool,
    path_id: str,
    match_id_param: Optional[str],
) -> tuple[str, str]:
    """Decide which storage serves GET /chat/messages/{id}.

    Priority: existing conversation > ?match_id query > path id as legacy match id.
    Returns ("conversation", id) or ("match", id).
    """
    if conversation_found:
        return "conversation", path_id
    return "match", match_id_param or path_id


def resolve_ws_send_mode(
    conversation_id: Optional[str],
    match_id: Optional[str],
) -> str:
    """Decide which branch serves WS send_message: "conversation" | "match" | "error"."""
    if conversation_id:
        return "conversation"
    if match_id:
        return "match"
    return "error"
