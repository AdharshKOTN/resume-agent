from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from pathlib import Path
from os import environ
import secrets
from hashlib import sha256
from rq.job import Job
from ..tasks import transcribe_and_reply

router = APIRouter()

UPLOAD_DIR = Path(environ.get("UPLOAD_DIR", "/data/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 10 * 1024 * 1024

TRANS_URL = environ.get("TRANSCRIBE_URL","http://127.0.0.1:5001/api/transcribe")
PERS_URL = environ.get("PERSONALITY_URL","http://127.0.0.1:5002/api/personality-response"),

async def _save_with_hash(u: UploadFile) -> tuple[str, str]:
    """Stream upload to disk and compute sha256 for caching. Limit: 5 MB."""
    ext = (u.filename.rsplit(".", 1)[1].lower() if u.filename and "." in u.filename else "webm")
    p = UPLOAD_DIR / f"{secrets.token_hex(8)}.{ext}"

    hasher = sha256()
    written = 0

    with p.open("wb") as out:
        while True:
            chunk = await u.read(1 << 20)  # 1 MiB chunks
            if not chunk:
                break

            written += len(chunk)
            if written > MAX_BYTES:
                # Cleanup partially written file, then abort
                try:
                    out.close()
                finally:
                    try:
                        p.unlink()
                    except FileNotFoundError:
                        pass
                raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

            hasher.update(chunk)
            out.write(chunk)

    # Reset stream position in case caller wants to re-read UploadFile
    await u.seek(0)

    return str(p), hasher.hexdigest()

@router.post("/ask", status_code=202)
async def ask(
    request: Request,
    file: UploadFile = File(...),
    session_id: str = Form(...),
    request_id: str = Form(...),
):
    # 1) persist upload (you chose to skip ext/size limits — kept minimal)
    file_path, audio_hash = await _save_with_hash(file)

    # 2) idempotent enqueue (one job per session_id:request_id)
    q = request.app.state.rq
    job_id = f"{session_id}:{request_id}"

    # If a job with this id already exists and is in-flight, reuse it
    reuse = False
    try:
        existing = Job.fetch(job_id, connection=q.connection)
        if existing.get_status() in ("queued", "started", "deferred"):
            reuse = True
            job = existing
        else:
            # Finished/failed—enqueue a fresh run with same id
            job = q.enqueue(
                transcribe_and_reply,
                file_path, TRANS_URL, PERS_URL,
                {"session_id": session_id, "request_id": request_id},
                audio_hash,
                job_id=job_id,
                job_timeout=180, result_ttl=1800, failure_ttl=86400,
                description=f"{session_id}/{request_id}",
            )
    except Exception:
        # NoSuchJobError or not found → enqueue new
        job = q.enqueue(
            transcribe_and_reply,
            file_path, TRANS_URL, PERS_URL,
            {"session_id": session_id, "request_id": request_id},
            audio_hash,
            job_id=job_id,
            job_timeout=180, result_ttl=1800, failure_ttl=86400,
            description=f"{session_id}/{request_id}",
        )

    # 3) tell listeners we received it (works now, sockets can come later)
    try:
        await request.app.state.redis_async.publish(
            f"jobs:{job.id}",
            '{"type":"stage","value":"received"}'
        )
    except Exception:
        # non-fatal if redis_async isn’t used yet
        pass

    return {"ok": True, "job_id": job.id, "reused": reuse}
