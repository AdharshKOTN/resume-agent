import io
import tempfile
import pytest
import os
from app import create_app
TEST_PATH = "test/"

@pytest.fixture
def client():
    app, socketio = create_app()
    test_client = socketio.test_client(app, flask_test_client=app.test_client())
    yield test_client
    test_client.disconnect()

def test_end_stream_flow(client, monkeypatch):

# /root/projects/resume-agent/backend/test/assets/resume-agent.mp3
    audio_path = f"{TEST_PATH}assets/resume-agent.mp3"

    assert os.path.exists(audio_path), "Test audio file not found"

    with open(audio_path, "rb") as f:
        blob_data = f.read()

    client.emit("end_stream", {"blob": blob_data, "session_id": "test_session"}) # starts handle_end_stream

    # Get response sent back by backend
    received = client.get_received()
    assert received, "No message received back"
    print("Received messages:", received)

    # Find the emitted 'agent_response' event
    transcript = next((msg for msg in received if msg["name"] == "transcript"), None)
    assert transcript, "No 'agent_response' emitted"

    agent_response = next((msg for msg in received if msg["name"] == "agent_response"), None)
    assert agent_response, "Missing transcription"

    print("✅ Transcription:", transcript)
    print("✅ LLM Response:", agent_response)
