from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
from jose import jwt, JWTError
import os

class ConnectionManager:
    def __init__(self):
        # Stores: { "user_id": { "websocket": ws, "role": "admin", "username": "admin" } }
        self.active_connections: Dict[int, Dict] = {}

    async def connect(self, websocket: WebSocket, user_id: int, role: str, username: str):
        await websocket.accept()
        self.active_connections[user_id] = {
            "websocket": websocket,
            "role": role,
            "username": username
        }

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def broadcast_to_role(self, message: dict, target_role: str):
        """Send to all users with matching role (or super_admin/admin who see everything)"""
        sent_count = 0
        for user_id, conn_data in list(self.active_connections.items()):
            user_role = conn_data["role"]
            # Super admins and admins see all security events
            if user_role in ["super_admin", "admin"] or user_role == target_role:
                try:
                    await conn_data["websocket"].send_json(message)
                    sent_count += 1
                except Exception as e:
                    print(f"Failed to send to user {user_id}: {e}")
                    # Remove dead connections
                    self.disconnect(user_id)
        
        if sent_count > 0:
            print(f"📡 Broadcast '{message.get('type')}' to {sent_count} users")

    async def broadcast_to_all(self, message: dict):
        """Send to every connected user"""
        for user_id, conn_data in list(self.active_connections.items()):
            try:
                await conn_data["websocket"].send_json(message)
            except Exception:
                self.disconnect(user_id)

    def get_connected_count(self) -> int:
        return len(self.active_connections)

    def get_connected_users(self) -> List[Dict]:
        return [
            {"user_id": uid, "role": data["role"], "username": data["username"]}
            for uid, data in self.active_connections.items()
        ]

# Global instance
manager = ConnectionManager()


def verify_websocket_token(token: str) -> Optional[dict]:
    """Verify JWT token for WebSocket authentication"""
    try:
        secret_key = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
