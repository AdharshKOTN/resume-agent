from unittest.mock import patch
from app.service import transcribe_audio
from app.routes import transcribe_blueprint
from flask import Flask
import time

def test_transcribe_audio_success():
    dummy_audio = b"fake audio bytes"

    with patch("app.service.model.transcribe") as mock_transcribe:
        mock_transcribe.return_value = {"text": "hello world"}

        result = transcribe_audio(dummy_audio)

        assert result == "hello world"
        mock_transcribe.assert_called_once()

# Setup test Flask app
def create_test_app():
    app = Flask(__name__)
    app.register_blueprint(transcribe_blueprint)
    return app

def test_transcribe_route_success():
    app = create_test_app()
    client = app.test_client()

    dummy_audio = b"fake audio blob"

    with patch("app.routes.transcribe_audio") as mock_transcribe_audio:
        mock_transcribe_audio.return_value = "mocked transcript"

        res = client.post("/transcribe", data=dummy_audio)

        assert res.status_code == 200
        assert res.data.decode("utf-8") == "mocked transcript"

def test_transcribe_success():
    app = create_test_app()
    client = app.test_client()

    with open("./tests/assets/simple-transcript-test.mp3", 'rb') as test_audio:
        res = client.post("/transcribe", data=test_audio)

        assert res.data.decode("utf-8").strip().rstrip(".").lower() == "simple transcript test"

def test_transcribe_execution_time():
    app = create_test_app()
    client = app.test_client()

    with open("./tests/assets/simple-transcript-test.mp3", 'rb') as test_audio:
        start = time.time()
        res = client.post("/transcribe", data=test_audio)
        duration = time.time() - start

    assert res.status_code == 200
    assert duration < 10

def test_transcribe_empty_input():
    app = create_test_app()
    client = app.test_client()

    res = client.post("/transcribe", data=b"")

    assert res.status_code in [200]  # depending on your error strategy
    assert "error" in res.data.decode("utf-8").lower()

@patch("app.service.model.transcribe", side_effect=Exception("mock fail"))
def test_transcribe_failure_response(mock_transcribe):
    from app.service import transcribe_audio
    res = transcribe_audio(b"corrupt audio")

    assert res == "An error occured while transcribing"