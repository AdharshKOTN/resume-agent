from fastapi import APIRouter
from pydantic import BaseModel

class Item(BaseModel):
    data: bytearray

router = APIRouter()

@router.post("/ask")
async def ask(item: Item):
    return item

@router.get("/health")
def health():
    return {"ok": True}
