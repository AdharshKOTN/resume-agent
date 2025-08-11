import os
import logging
import numpy as np

# Toggle lightweight test mode (set before import in tests):
#   UNIT_TEST=1 PYTHONPATH=. python -m unittest ...
UNIT_TEST = os.getenv("UNIT_TEST") == "1"

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------
# Runtime initialization
#   - Production: load model, FAISS, pickle store, envs
#   - UNIT_TEST:  define harmless defaults; tests inject fakes via _set_test_runtime
# --------------------------------------------------------------------
if not UNIT_TEST:
    # Heavy deps only in runtime
    from sentence_transformers import SentenceTransformer
    import faiss
    import pickle
    import requests
    from torch.cuda import is_available

    # LLM env
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
    MODEL = os.getenv("OLLAMA_MODEL", "mistral")

    # Load embedding store
    with open("./app/career_embedding_store.pkl", "rb") as f:
        embedding_store = pickle.load(f)

    # Build arrays expected by the search pipeline
    embeddings, metadata, ids = [], [], []
    for entry in embedding_store:
        embeddings.append(entry["embedding"])
        metadata.append(entry["metadata"])
        ids.append(entry["id"])

    embedding_matrix = np.array(embeddings, dtype=np.float32)
    dim = int(embedding_matrix.shape[1])
    index = faiss.IndexFlatL2(dim)
    index.add(embedding_matrix)

    # Embedder
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda" if is_available() else "cpu")

else:
    # Lightweight defaults for unit tests (no heavy imports here)
    # Tests will call _set_test_runtime(...) to inject fakes.
    import types

    # Provide a safe default requests stub so generate_response can be called in tests if needed
    requests = types.SimpleNamespace(
        post=lambda *a, **k: types.SimpleNamespace(
            raise_for_status=lambda: None,
            json=lambda: {"response": "OK (test)"},
        )
    )

    OLLAMA_HOST = "http://localhost:11434"
    OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
    MODEL = "test-model"

    model = None
    index = None
    embeddings, metadata, ids = [], [], []
    embedding_matrix = np.zeros((0, 0), dtype=np.float32)

# --------------------------------------------------------------------
# Tiny test helpers (used only when UNIT_TEST=1)
# --------------------------------------------------------------------
def _set_test_runtime(*, _model, _index, _embeddings, _metadata, _ids):
    """
    Keyword args only, explicit for testing and clarity
    Unit tests call this once to inject tiny, deterministic fakes.
    Keeps production code untouched while avoiding heavyweight imports during tests.
    """
    global model, index, embeddings, metadata, ids, embedding_matrix
    # module level variables, allows tests to swap in test objects
    model = _model
    index = _index
    embeddings = _embeddings
    metadata = _metadata
    ids = _ids
    embedding_matrix = np.asarray(embeddings, dtype=np.float32)

def _ensure_runtime_ready():
    if model is None or index is None or embedding_matrix.size == 0:
        raise RuntimeError("RAG runtime not initialized. In tests, call _set_test_runtime(...).")
    
####################################################################################################

def generate_prompt(user_prompt: str) -> str:
    _ensure_runtime_ready()

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
