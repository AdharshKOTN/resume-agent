from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from redis.asyncio import Redis as AsyncRedis

from redis import Redis
from rq import Queue
from rq.job import Job
from os import getenv

REDIS_URL   = getenv("REDIS_URL", "redis://localhost:6379/0")
API_TITLE   = getenv("API_TITLE", "Resume-Agent-Gateway")
API_VERSION = getenv("API_VERSION", "0.1.0")
CORS_ORIGINS = getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title=API_TITLE, version=API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rq_redis = Redis.from_url(REDIS_URL)
app.state.rq = Queue("default", connection=rq_redis)

app.state.redis_async = AsyncRedis.from_url(REDIS_URL, decode_responses=True)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/health")
def health():
    return {"ok": True}