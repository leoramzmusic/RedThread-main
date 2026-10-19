from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Multi-connection registry: every user can have N sockets (tabs)."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket | None = None):
        sockets = self.active_connections.get(user_id)
        if not sockets:
            return
        if websocket is None:
            del self.active_connections[user_id]
            return
        remaining = [ws for ws in sockets if ws is not websocket]
        if remaining:
            self.active_connections[user_id] = remaining
        else:
            del self.active_connections[user_id]

    async def send_personal_message(self, user_id: str, message: dict):
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(user_id, websocket)

    async def broadcast_typing(self, match_id: str, user_id: str, is_typing: bool):
        # Notify the other user in the match (compat; sin uso)
        pass


manager = ConnectionManager()
