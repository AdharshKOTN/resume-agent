from fastapi import FastAPI
from .api.routes import router

app = FastAPI(title="Resume-Agent-Gateway", version="0.1")

@app.get("/")
def root():
    app.include_router(router, prefix="/api")

    return {"message": "Hello World"}