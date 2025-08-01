from sentence_transformers import SentenceTransformer
import numpy as np

import faiss
import pickle

import os

import logging
logger = logging.getLogger(__name__)

import requests


# LLM environment variables

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
MODEL = "mistral"

# load embedding store
with open("./app/career_embedding_store.pkl", "rb") as f:
    embedding_store = pickle.load(f)

# RAG initialization

model = SentenceTransformer('all-MiniLM-L6-v2')

# load embeddings, metadata and ids ( usage in RAM? but is there a better way? application is small enough for it to not matter )

embeddings, metadata, ids = [], [], []

for entry in embedding_store:
    embeddings.append(entry["embedding"])
    metadata.append(entry["metadata"])
    ids.append(entry["id"])


embedding_matrix = np.array(embeddings, dtype=np.float32)
dimension = embedding_matrix.shape[1] # dimensionality of matrix
index = faiss.IndexFlatL2(dimension)  # 384 is the embedding dimension
index.add(embedding_matrix) # type: ignore

def generate_prompt(user_prompt: str) -> str:

    # vectorize the query

    query_embedding = model.encode([sanitize_prompt(user_prompt=user_prompt)]) # Get the embedding for the query
    query_embedding = np.array(query_embedding, dtype=np.float32).reshape(1, -1)

    D, I = index.search(query_embedding, k=3)  # type: ignore Top 3 results

    results = [
        (embeddings[i], metadata[i], ids[i])
        for i in I[0]
    ]

    # print("-------------------------------------")
    # print("Completed search, got results:", results)
    # print("-------------------------------------")

    context = "Relevant Experience:\n"
    for embedding, meta, _id in results:
        if meta["type"] == "project":
            context += f"Project: {meta['title']}\n{str(meta['content'])}\n\n"
        elif meta["type"] == "tool":
            context += f"Tool: {meta['title']}\n{str(meta['content'])}\n\n"
    context = context.strip()  # Clean up the context string

    
    full_prompt = f"""You are an intelligent assistant helping users understand Adharsh's career background.
    Only use the following experiences to answer the question truthfully.\n
    {context}\n
    User Question: {user_prompt}\n
    Answer: """

    # print("Full prompt:", full_prompt)
    # print("-------------------------------------")
    return full_prompt

def sanitize_prompt(user_prompt: str) -> str:
    # TODO: make more comprehensive sanitization process
    
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
