# MTechify/backend/database.py
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATABASE_URL = "postgresql://postgres.dwsnohkrbqglrwxkngfd:MTechify%402026%23DB@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ContactSubmission(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    service = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

class ChatLog(Base):
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    user_message = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    whatsapp = Column(String, nullable=False)
    inquiry_type = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    status = Column(String, default="new")
    created_at = Column(DateTime, default=datetime.now)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=False)
    whatsapp = Column(String, nullable=True)
    is_approved = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.now)

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    whatsapp = Column(String, nullable=False)
    email = Column(String, nullable=True)
    expertise = Column(String, nullable=False)
    experience = Column(String, nullable=False)
    portfolio_link = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String, default="new")
    created_at = Column(DateTime, default=datetime.now)

class Visitor(Base):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    page_visited = Column(String(200))
    referrer = Column(String(500))
    country = Column(String(100))
    city = Column(String(100))
    device = Column(String(50))
    browser = Column(String(50))
    os = Column(String(50))
    visited_at = Column(DateTime, default=datetime.now)

# Create ALL tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()