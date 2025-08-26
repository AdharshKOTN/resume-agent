# tests/test_audio_upload.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audio_upload_ok():
    data = {
        "session_id": "sess-123",
        "request_id": "req-abc",
    }
    fake_bytes = b"RIFF\x00\x00\x00\x00WEBM\x1A\x45\xDF\xA3"  # just a stub
    files = {
        "file": ("rec-123.webm", fake_bytes, "audio/webm"),
    }

    resp = client.post("/api/ask", data=data, files=files)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["ok"] is True
    assert body["filename"] == "rec-123.webm"
    assert body["session_id"] == "sess-123"
    assert body["request_id"] == "req-abc"
    assert body["head_len"] > 0

def test_audio_upload_missing_file():
    data = {"session_id": "s", "request_id": "r"}
    resp = client.post("/api/ask", data=data, files={})
    # FastAPI will 422 when a required File(...) is missing
    assert resp.status_code == 422

def test_audio_upload_bad_extension():
    data = {"session_id": "s", "request_id": "r"}
    files = {"file": ("clip.mp3", b"fake", "audio/mpeg")}
    resp = client.post("/api/ask", data=data, files=files)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Only .webm is supported"

def test_audio_upload_missing_fields():
    # Missing session_id
    files = {"file": ("rec.webm", b"fake", "audio/webm")}
    resp = client.post("/api/ask", data={"request_id": "r"}, files=files)
    assert resp.status_code == 422
