import requests
from app.services.rag.embed import generate_prompt
from dotenv import load_dotenv

env = load_dotenv()
OLLAMA_HOST = env.get("OLLAMA_HOST", "http://localhost:11434")

OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
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

