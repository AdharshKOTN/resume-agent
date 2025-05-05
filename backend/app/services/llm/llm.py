import requests
from app.services.rag.embed import generate_prompt
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "adharsh-mistral-normal"

def generate_response(user_prompt: str) -> str:
    payload = {
        "model": MODEL,
        "prompt": generate_prompt(user_prompt),
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()["response"]
    except Exception as e:
        print(f"❌ Ollama error: {e}")
        return "Sorry, I'm having trouble responding right now."

