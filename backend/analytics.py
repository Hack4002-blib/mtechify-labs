# backend/analytics.py
from database import Base, SessionLocal
from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
import os

class Visitor(Base):
    __tablename__ = "visitors"
    
    id = Column(Integer, primary_key=True)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    page_visited = Column(String(200))
    referrer = Column(String(500))
    country = Column(String(100))
    city = Column(String(100))
    device = Column(String(50))  # mobile, tablet, desktop
    browser = Column(String(50))
    os = Column(String(50))
    visited_at = Column(DateTime, default=datetime.now)

class PageView(Base):
    __tablename__ = "page_views"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(100))
    page_url = Column(String(500))
    time_spent = Column(Integer, default=0)  # seconds
    viewed_at = Column(DateTime, default=datetime.now)

def track_visitor(ip, user_agent, page, referrer, country="Pakistan", city="Unknown", device="desktop", browser="Unknown", os="Unknown"):
    """Track website visitors"""
    db = SessionLocal()
    try:
        visitor = Visitor(
            ip_address=ip,
            user_agent=user_agent[:500],
            page_visited=page,
            referrer=referrer,
            country=country,
            city=city,
            device=device,
            browser=browser,
            os=os
        )
        db.add(visitor)
        db.commit()
        return visitor.id
    except Exception as e:
        print(f"Error tracking visitor: {e}")
        return None
    finally:
        db.close()

def get_analytics_data():
    """Get analytics for dashboard"""
    db = SessionLocal()
    try:
        from sqlalchemy import func
        
        # Today's visitors
        today = datetime.now().date()
        today_visitors = db.query(Visitor).filter(
            func.date(Visitor.visited_at) == today
        ).count()
        
        # This week visitors
        from datetime import timedelta
        week_ago = datetime.now() - timedelta(days=7)
        week_visitors = db.query(Visitor).filter(
            Visitor.visited_at >= week_ago
        ).count()
        
        # Total visitors
        total_visitors = db.query(Visitor).count()
        
        # Unique IPs
        unique_visitors = db.query(Visitor.ip_address).distinct().count()
        
        # Devices breakdown
        devices = db.query(Visitor.device, func.count(Visitor.id)).group_by(Visitor.device).all()
        
        # Pages visited
        pages = db.query(Visitor.page_visited, func.count(Visitor.id)).group_by(Visitor.page_visited).all()
        
        # Recent visitors (last 10)
        recent = db.query(Visitor).order_by(Visitor.visited_at.desc()).limit(10).all()
        
        return {
            "today_visitors": today_visitors,
            "week_visitors": week_visitors,
            "total_visitors": total_visitors,
            "unique_visitors": unique_visitors,
            "devices": [{"name": d[0], "count": d[1]} for d in devices],
            "pages": [{"url": p[0], "count": p[1]} for p in pages],
            "recent": [{
                "ip": v.ip_address,
                "page": v.page_visited,
                "device": v.device,
                "time": v.visited_at.strftime("%Y-%m-%d %H:%M")
            } for v in recent]
        }
    finally:
        db.close()