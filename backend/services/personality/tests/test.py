from app.query import generate_prompt
from unittest.mock import patch



def test_generate_reponse():
    dummy_user_prompt = "Tell me about your experience"

    with patch("app.query.index.search") as mock_index_search:
        prompt = generate_prompt("Tell me about your experience")

        assert prompt