from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # Stores active connections: { "finance": [ws1, ws2], "admin": [ws3] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        if role not in self.active_connections:
            self.active_connections[role] = []
        self.active_connections[role].append(websocket)

    def disconnect(self, websocket: WebSocket, role: str):
        if role in self.active_connections:
            self.active_connections[role].remove(websocket)

    async def broadcast_to_role(self, message: dict, role: str):
        """Send a live update to everyone in a specific department"""
        if role in self.active_connections:
            for connection in self.active_connections[role]:
                try:
                    await connection.send_json(message)
                except:
                    pass # Connection might be closed

    async def broadcast_to_all(self, message: dict):
        """Send a live update to EVERYONE (Admins, Auditors, etc.)"""
        for role in self.active_connections:
            await self.broadcast_to_role(message, role)

# Create a single global instance
manager = ConnectionManager()
