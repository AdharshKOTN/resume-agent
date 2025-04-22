import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def generate_response(prompt: str, model: str = "mistral") -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()["response"]
    except Exception as e:
        print(f"❌ Ollama error: {e}")
        return "Sorry, I'm having trouble responding right now."