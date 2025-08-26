import os, requests
from rq import get_current_job
from uuid import uuid4

def transcribe_and_reply(file_path: str, transcribe_url: str, personality_url: str, meta: dict):
    job = get_current_job()
    if job is None:
        raise RuntimeError("must run under RQ worker")
    job_id = job.get_id() if job else f"local-{uuid4().hex}"
    headers = {"X-Request-ID": job_id,
                "X-Idempotency-Key": f'{meta["session_id"]}:{meta["request_id"]}'}
    try:
        job.meta.update(stage="transcribing")
        job.save_meta()
        with open(file_path, "rb") as fh:
            r1 = requests.post(transcribe_url, data=meta, files={"file": (os.path.basename(file_path), fh)}, timeout=40, headers=headers)
        r1.raise_for_status()
        transcript = r1.json()["transcript"]

        job.meta.update(stage="generating")
        job.save_meta()
        r2 = requests.post(personality_url, json={"transcript": transcript, **meta}, timeout=40, headers=headers)
        r2.raise_for_status()
        answer = r2.json().get("text")
        
        job.meta.update(stage="done")
        job.save_meta()
        return {"transcript": transcript, "answer": answer}
    finally:
        try: os.remove(file_path)
        except FileNotFoundError: pass