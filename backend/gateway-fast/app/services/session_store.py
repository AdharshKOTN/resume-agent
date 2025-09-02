from typing import Dict, Optional
from fastapi import WebSocket
from asyncio import Lock
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

class SessionStore:
    def __init__(self):
        self._store: Dict[str, WebSocket] = {}
        self._lock = Lock()

    async def add(self, session_id: str, ws: WebSocket):
        async with self._lock:
            self._store[session_id] = ws
            logging.info(f"✅ Added session: {session_id}")

    async def get(self, session_id: str) -> Optional[WebSocket]:
        async with self._lock:
            return self._store.get(session_id)

    async def remove(self, session_id: str):
        async with self._lock:
            if session_id in self._store:
                del self._store[session_id]
                logging.info(f"🗑️ Removed session: {session_id}")
