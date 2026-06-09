# MTechify/backend/models.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: str
    service: str
    message: str

class ChatMessage(BaseModel):
    user_id: str = "website"
    message: str
    response: Optional[str] = None

class Inquiry(BaseModel):
    name: str
    whatsapp: str
    inquiry_type: str
    details: str