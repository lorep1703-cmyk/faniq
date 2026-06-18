from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.chat import chat_with_ai

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/")
def post_chat(body: ChatRequest, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    return chat_with_ai(db, club.id, club.nome, messages)
