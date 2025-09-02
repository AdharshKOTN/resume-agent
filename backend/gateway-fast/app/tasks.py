import os, requests, json
from rq import get_current_job
from redis import Redis
from uuid import uuid4
import logging

logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

# Redis publisher setup (sync)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis = Redis.from_url(REDIS_URL)

def transcribe_and_reply(file_path: str, transcribe_url: str, personality_url: str, meta: dict):
    job = get_current_job()
    logging.info("Job id=%s status=%s", job.get_id() if job else None, job.get_status() if job else None)

    if job is None:
        raise RuntimeError("must run under RQ worker")

    job_id = job.get_id()
    session_id = meta.get("session_id")
    request_id = meta.get("request_id")

    headers = {
        "X-Request-ID": job_id,
        "X-Idempotency-Key": f"{session_id}:{request_id}"
    }

    try:
        logging.info("Transcribing")

        redis.publish("agent_updates", json.dumps({
            "type": "transcript_stage",
            "stage": "transcribing",
            "session_id": session_id,
            "request_id": request_id
        }))

        with open(file_path, "rb") as fh:
            r1 = requests.post(
                transcribe_url,
                data=meta,
                files={"audio_file": (os.path.basename(file_path), fh)},
                timeout=40,
                headers=headers
            )
        r1.raise_for_status()
        transcript = r1.text

        redis.publish("agent_updates", json.dumps({
            "type": "transcript_result",
            "text": transcript,
            "session_id": session_id,
            "request_id": request_id
        }))

        logging.info("Generating response")
        r2 = requests.post(
            personality_url,
            json={"transcript": transcript, **meta},
            timeout=40,
            headers=headers
        )
        r2.raise_for_status()
        answer = r2.text

        redis.publish("agent_updates", json.dumps({
            "type": "agent_response",
            "text": answer,
            "session_id": session_id,
            "request_id": request_id
        }))

        logging.info("Completed processing")

        return {"transcript": transcript, "answer": answer}

    finally:
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass