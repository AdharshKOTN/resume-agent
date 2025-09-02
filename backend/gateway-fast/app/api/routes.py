from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from pathlib import Path
from os import environ
import secrets
from hashlib import sha256
from rq.job import Job
from ..tasks import transcribe_and_reply

from asyncio import sleep


from fastapi import WebSocket, APIRouter
from fastapi.websockets import WebSocketDisconnect

import logging
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

router = APIRouter()

UPLOAD_DIR = Path(environ.get("UPLOAD_DIR", "/data/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 10 * 1024 * 1024

TRANS_URL = environ.get("TRANSCRIBE_URL","http://0.0.0.0:5001/transcribe")
PERS_URL = environ.get("PERSONALITY_URL","http://0.0.0.0:5002/personality-response")

# async def _save_with_hash(u: UploadFile) -> tuple[str, str]:
#     """Stream upload to disk and compute sha256 for caching. Limit: 5 MB."""
#     # logging.info(f"Saved file to {p} with size {u.size} bytes")
#     ext = (u.filename.rsplit(".", 1)[1].lower() if u.filename and "." in u.filename else "webm")
#     p = UPLOAD_DIR / f"{secrets.token_hex(8)}.{ext}"

#     hasher = sha256()
#     written = 0

#     with p.open("wb") as out:
#         while True:
#             chunk = await u.read(1 << 20)
#             if not chunk: 
#                 break

#             written += len(chunk)
#             if written > MAX_BYTES:
#                 try:
#                     out.close()
#                 finally:
#                     try:
#                         p.unlink()
#                     except FileNotFoundError:
#                         pass
#                 raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

#             hasher.update(chunk)
#             out.write(chunk)
#     await u.seek(0)

#     return str(p), hasher.hexdigest()

async def save_upload(u: UploadFile) -> str:
    logging.info(f"Saving uploaded file: {u.filename}")
    logging.info(f"UploadFile: filename={u.filename}, content_type={u.content_type}")

    ext = (u.filename.rsplit(".", 1)[1].lower() if u.filename and "." in u.filename else "webm")
    p = UPLOAD_DIR / f"{secrets.token_hex(8)}.{ext}"

    logging.info(f"Saving uploaded file: {u.filename} → {p}")

    written = 0
    with p.open("wb") as out:
        while True:
            chunk = await u.read(1 << 20)
            if not chunk:
                break
            logging.info(f"Chunk size: {len(chunk)} bytes")
            out.write(chunk)
            written += len(chunk)

    await u.seek(0)

    # ✅ Add validation logs
    logging.info(f"Saved file: {p} ({written} bytes)")
    
    if written == 0:
        logging.warning(f"Uploaded file is empty: {p}")

    try:
        with open(p, "rb") as f:
            head = f.read(4)
        logging.info(f"First 4 bytes of {p}: {head}")
    except Exception as e:
        logging.error(f"Error reading saved file: {e}")

    return str(p)


@router.post("/ask", status_code=202)
async def ask(
    request: Request,
    file: UploadFile = File(...),
    session_id: str = Form(...),
    request_id: str = Form(...),
):
    # 1) persist upload (you chose to skip ext/size limits — kept minimal)
    file_path = await save_upload(file)

    # 2) idempotent enqueue (one job per session_id:request_id)
    q = request.app.state.rq
    job_id = f"{session_id}-{request_id}"
    logging.info(f"Job queued: {job_id}")

    # If a job with this id already exists and is in-flight, reuse it
    reuse = False
    try:
        existing = Job.fetch(job_id, connection=q.connection)
        if existing.get_status() in ("queued", "started", "deferred"):
            reuse = True
            job = existing
        else:
            await sleep(0.3)
            # Finished/failed—enqueue a fresh run with same id
            logger.info("Running Job")
            job = q.enqueue(transcribe_and_reply, file_path, TRANS_URL, PERS_URL,
                            {"session_id": session_id, "request_id": request_id},
                            job_id=job_id, job_timeout=180, result_ttl=1800, failure_ttl=86400,
                            description=f"{session_id}/{request_id}")
    except Exception:
        # NoSuchJobError or not found → enqueue new
        job = q.enqueue(transcribe_and_reply, file_path, TRANS_URL, PERS_URL,
                            {"session_id": session_id, "request_id": request_id},
                            job_id=job_id, job_timeout=180, result_ttl=1800, failure_ttl=86400,
                            description=f"{session_id}/{request_id}")

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


@router.websocket("/ws/session/{session_id}")
async def ws_session(websocket: WebSocket, session_id: str):
    logging.info("Websocket connection attempted: session_id={session_id}")
    # session_store = request.app.state.session_store
    session_store = websocket.app.state.session_store

    await websocket.accept()
    await session_store.add(session_id, websocket)
    logging.info(f"🟢 WebSocket connected: {session_id}")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logging.info(f"🔌 WebSocket disconnected: {session_id}")
    finally:
        logging.info("Remove socket")
        await session_store.remove(session_id)
        
@router.get("/health")
def health():
    return {"ok": True}