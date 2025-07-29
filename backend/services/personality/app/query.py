from sentence_transformers import SentenceTransformer
import numpy as np

from app.chunks import chunks
import faiss

import os

import logging
logger = logging.getLogger(__name__)


# LLM environment variables

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
MODEL = "mistral"

# RAG initialization

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(chunks)
index = faiss.IndexFlatL2(384)  # 384 is the embedding dimension
index.add(np.array(embeddings))

def generate_prompt(user_prompt: str) -> str:
    query_embedding = model.encode([sanitize_prompt(user_prompt=user_prompt)]) # Get the embedding for the query
    D, I = index.search(np.array(query_embedding), k=3)  # Top 3 results
    results = [chunks[i] for i in I[0]]  # Get the top matching chunks
    print("-------------------------------------")
    print("Completed search, got results:", results)
    print("-------------------------------------")

    context = ""
    for i in results:
        if i["type"] == "project":
            context += f"Project: {i['title']}\n{str(i['content'])}\n\n"
        elif i["type"] == "tool":
            context += f"Tool: {i['title']}\n{str(i['content'])}\n\n"
    context = context.strip()  # Clean up the context string
    print("Context for LLM:", context)
    print("-------------------------------------")

    
    full_prompt = f"""Based on the following background:
    {context}

    {user_prompt}"""

    print("Full prompt:", full_prompt)
    print("-------------------------------------")
    return full_prompt

def sanitize_prompt(user_prompt: str) -> str:
    # Remove common prompt injection phrases
    blacklist = ["System:", "Ignore", "Forget previous", "Act as", "###", '"""']
    for term in blacklist:
        user_prompt = user_prompt.replace(term, "")
    # prompt = build_prompt(user_prompt.strip())
    return user_prompt

def generate_response(user_prompt: str) -> str:
    payload = {
        "model": MODEL,
        "prompt": generate_prompt(user_prompt),
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status() # Ensure we raise an error for bad responses, 400 or 500 status codes
        return response.json()["response"]
    except Exception as e:
        logger.exception(f"❌ Ollama error: {e}")
        return "Sorry, I'm having trouble responding right now."
