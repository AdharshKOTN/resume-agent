import requests
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "adharsh-tinyllama"

def generate_response(user_prompt: str) -> str:
    payload = {
        "model": MODEL,
        "prompt": sanitize_prompt(user_prompt),
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()["response"]
    except Exception as e:
        print(f"❌ Ollama error: {e}")
        return "Sorry, I'm having trouble responding right now."
    
def sanitize_prompt(user_prompt: str) -> str:
    # Remove common prompt injection phrases
    blacklist = ["System:", "Ignore", "Forget previous", "Act as", "###", '"""']
    for term in blacklist:
        user_prompt = user_prompt.replace(term, "")
    # prompt = build_prompt(user_prompt.strip())
    return user_prompt
