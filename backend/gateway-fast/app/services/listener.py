import json
import redis.asyncio as redis

from .session_store import SessionStore
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

class RedisListener:
    def __init__(self, session_store: SessionStore, redis_url: str = "redis://localhost:6379"):
        logging.info("Initializing Listener")
        self.redis = redis.Redis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()
        self.session_store = session_store

    async def start(self):
        await self.pubsub.subscribe("agent_updates")
        print("📡 Subscribed to Redis channel")

        async for message in self.pubsub.listen():
            if message is None or message["type"] != "message":
                continue

            try:
                payload = json.loads(message["data"])
                logging.info(f"payload from listener: {payload}")
                session_id = payload["session_id"]
                logging.info(f"checking for session - {session_id}")
                msg_type = payload.get("type")
                content = payload.get("text")

                ws = await self.session_store.get(session_id)
                if ws:
                    await ws.send_json({msg_type: content})
                    logging.info(f"📤 Sent {msg_type} to session {session_id}")
                else:
                    logging.info(f"⚠️ No active session for {session_id}")
            except Exception as e:
                logging.error("❌ Redis message handling failed:", e)