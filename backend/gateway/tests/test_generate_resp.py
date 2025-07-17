import pytest
from unittest.mock import patch
from app.services.llm import generate_response

# ✅ 1. Test successful response
@patch("app.services.llm.requests.post")
def test_generate_response_success(mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"response": "Hello, world!"}

    result = generate_response("Hi there")
    assert result == "Hello, world!"

# ✅ 2. Test request failure (e.g., Ollama down)
@patch("app.services.llm.requests.post")
def test_generate_response_failure(mock_post):
    mock_post.side_effect = Exception("Connection failed")

    result = generate_response("Hi")
    assert result == "Sorry, I'm having trouble responding right now."
