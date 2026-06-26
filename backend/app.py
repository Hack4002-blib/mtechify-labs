# MTechify/backend/app.py
# MTechify Labs - Backend API
# app.py

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from database import get_db, ContactSubmission, ChatLog, Lead, Review, Candidate, Visitor, ServiceConfig, PricingPackage
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import hashlib
import time
import re

load_dotenv()

from database import get_db, ContactSubmission, ChatLog, Lead, Review, Candidate, Visitor
from models import ContactForm, ChatMessage, Inquiry

# ============================================
# APP INIT
# ============================================
app = FastAPI(title="MTechify Labs API", version="1.0")

# ============================================
# CORS MIDDLEWARE — SINGLE, CLEAN
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT = {}
RATE_LIMIT_WINDOW = 60   # seconds
RATE_LIMIT_MAX = 200     # requests per window

def rate_limit_check(client_ip: str) -> bool:
    current_time = time.time()
    if client_ip in RATE_LIMIT:
        requests = [t for t in RATE_LIMIT[client_ip] if current_time - t < RATE_LIMIT_WINDOW]
        if len(requests) >= RATE_LIMIT_MAX:
            return False
        requests.append(current_time)
        RATE_LIMIT[client_ip] = requests
    else:
        RATE_LIMIT[client_ip] = [current_time]
    return True

# ============================================
# RATE LIMIT MIDDLEWARE
# ============================================
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    client_ip = request.client.host
    if request.method in ["POST", "PUT", "DELETE"]:
        if not rate_limit_check(client_ip):
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests. Please try again later."}
            )
    return await call_next(request)

# ============================================
# ADMIN PASSWORD
# ============================================
ADMIN_PASSWORD_HASH = hashlib.sha256(
    os.getenv("ADMIN_PASSWORD", "mtechify2026").encode()
).hexdigest()

def verify_password(password: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH

# ============================================
# CHATBOT — MTECHIFY LABS BRANDED
# ============================================
def get_chat_response(message: str) -> str:
    msg = message.lower().strip()

    if any(w in msg for w in ["hello", "hi", "salam", "assalam", "hey"]):
        return "👋 Assalamualaikum! Welcome to MTechify Labs. I'm your AI assistant. Ask me about pricing, logo design, websites, ERP software, or anything else!"

    if any(w in msg for w in ["price", "pricing", "cost", "rate", "kitne", "charges", "package"]):
        return (
            "💰 MTechify Labs Pricing:\n\n"
            "🎨 Logo Design:\n"
            "• Basic: PKR 800 (1 concept, PNG, 1 revision)\n"
            "• Standard: PKR 1,500 (2 concepts, all formats, same day)\n"
            "• Premium: PKR 2,500 (3+ concepts, brand guide, unlimited revisions)\n\n"
            "🌐 Website: From PKR 15,000 (Coming Soon)\n"
            "📊 ERP Software: Custom quote (Coming Soon)\n"
            "📱 Social Media: From PKR 5,000/month (Coming Soon)\n\n"
            "WhatsApp for custom quote: +92 310 3888922"
        )

    if any(w in msg for w in ["logo", "brand", "branding", "design", "banner", "poster", "card"]):
        return (
            "🎨 MTechify Labs — Logo & Graphic Design:\n\n"
            "• Same day delivery (6-8 hours)\n"
            "• PNG + PDF + Vector formats\n"
            "• AI-powered professional quality\n"
            "• Starting at PKR 800\n\n"
            "To order, send us on WhatsApp:\n"
            "1. Business name\n"
            "2. Preferred colors\n"
            "3. Industry type\n\n"
            "WhatsApp: +92 310 3888922"
        )

    if any(w in msg for w in ["website", "web", "ecommerce", "site", "online store"]):
        return (
            "🌐 Web Development (Coming Soon):\n\n"
            "• Business websites: PKR 15,000–35,000\n"
            "• E-commerce stores: PKR 25,000–60,000\n"
            "• Landing pages: PKR 8,000–15,000\n\n"
            "Interested? WhatsApp for early bird discount!\n"
            "+92 310 3888922"
        )

    if any(w in msg for w in ["erp", "software", "inventory", "billing", "pos", "stock"]):
        return (
            "📊 ERP/POS Software (Coming Soon):\n\n"
            "• Inventory Management\n"
            "• Billing & Invoicing\n"
            "• Sales Reports\n"
            "• Customer Records\n\n"
            "Custom quote based on your business needs.\n"
            "WhatsApp: +92 310 3888922"
        )

    if any(w in msg for w in ["delivery", "time", "when", "urgent", "fast", "jaldi", "kitna"]):
        return (
            "⚡ Delivery Timeline:\n\n"
            "• Logo/Graphic Design: 6-8 hours (same day)\n"
            "• Basic Package: 24 hours\n"
            "• Website: 7-14 days\n"
            "• ERP Software: 2-4 weeks\n\n"
            "Need urgent delivery? WhatsApp us!\n"
            "+92 310 3888922"
        )

    if any(w in msg for w in ["contact", "whatsapp", "phone", "number", "email", "reach"]):
        return (
            "📞 Contact MTechify Labs:\n\n"
            "• WhatsApp: +92 310 3888922\n"
            "• Email: hello.mtechifylabs@gmail.com\n"
            "• Hours: Mon-Sat, 10AM to 8PM\n"
            "• Response: Within 1 hour guaranteed\n\n"
            "📍 Based in Hyderabad, Sindh, Pakistan"
        )

    if any(w in msg for w in ["payment", "pay", "easypaisa", "jazzcash", "bank"]):
        return (
            "💳 Payment Methods:\n\n"
            "• EasyPaisa\n"
            "• JazzCash\n"
            "• Bank Transfer\n"
            "• Cash (local clients)\n\n"
            "Logo work: Payment after design approval.\n"
            "Web/ERP: 50% advance required.\n\n"
            "WhatsApp for details: +92 310 3888922"
        )

    if any(w in msg for w in ["guarantee", "refund", "revision", "not happy", "money back"]):
        return (
            "✅ 100% Satisfaction Guarantee:\n\n"
            "• Free revisions until you're happy\n"
            "• Money-back if not satisfied\n"
            "• Free changes within 7 days\n\n"
            "We don't stop until you love the result!"
        )

    if any(w in msg for w in ["about", "who", "mtechify", "company", "experience"]):
        return (
            "🏢 About MTechify Labs:\n\n"
            "• Founded by Mubashir Shaikh\n"
            "• Based in Hyderabad, Sindh, Pakistan\n"
            "• IT Professional with 3+ years experience\n"
            "• AI-powered design & development services\n"
            "• Mission: Affordable digital solutions for every Pakistani business\n\n"
            "WhatsApp: +92 310 3888922"
        )

    if any(w in msg for w in ["bye", "goodbye", "tata", "later"]):
        return "👋 Thank you for chatting with MTechify Labs! WhatsApp us anytime at +92 310 3888922. Have a great day! 😊"

    # Default fallback
    return (
        "🤔 I can help with:\n\n"
        "💰 Pricing — 🎨 Logo Design — 🌐 Websites\n"
        "📊 ERP Software — ⚡ Delivery — 📞 Contact\n\n"
        "Just type what you need, or WhatsApp us directly:\n"
        "+92 310 3888922"
    )

# ============================================
# API ROUTES
# ============================================

@app.get("/")
def root():
    return {
        "message": "MTechify Labs API",
        "status": "active",
        "version": "1.0",
        "contact": "hello.mtechifylabs@gmail.com"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "agency": "MTechify Labs",
        "database": "connected"
    }

@app.post("/api/chat")
def chat(message: ChatMessage, request: Request, db: Session = Depends(get_db)):
    if not rate_limit_check(request.client.host):
        return {"response": "Too many requests. Please try again in a moment.", "success": False}

    try:
        reply = get_chat_response(message.message)

        try:
            chat_log = ChatLog(
                user_id=(message.user_id or "web")[:100],
                user_message=message.message[:500],
                bot_response=reply[:1000]
            )
            db.add(chat_log)
            db.commit()
        except Exception:
            pass

        return {"response": reply, "success": True}

    except Exception as e:
        return {
            "response": "WhatsApp us at +92 310 3888922 for immediate help!",
            "success": True
        }

@app.post("/api/contact")
def submit_contact(form: ContactForm, request: Request, db: Session = Depends(get_db)):
    if not rate_limit_check(request.client.host):
        raise HTTPException(status_code=429, detail="Too many requests.")
    try:
        submission = ContactSubmission(
            name=re.sub(r'[<>]', '', form.name[:100]),
            email=re.sub(r'[<>]', '', form.email[:100]),
            phone=re.sub(r'[^0-9+]', '', form.phone[:20]),
            service=form.service[:100],
            message=form.message[:1000]
        )
        db.add(submission)
        db.commit()
        print(f"📞 New contact: {submission.name}")
        return {"success": True, "message": "Submitted successfully", "id": submission.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/review")
def submit_review(review_data: dict, request: Request, db: Session = Depends(get_db)):
    if not rate_limit_check(request.client.host):
        raise HTTPException(status_code=429, detail="Too many requests")
    try:
        review = Review(
            client_name=re.sub(r'[<>]', '', review_data.get("client_name", "")[:100]),
            rating=int(review_data.get("rating", 3)),
            review_text=re.sub(r'[<>]', '', review_data.get("review_text", "")[:1000]),
            whatsapp=review_data.get("whatsapp", "")[:20],
            is_approved="pending"
        )
        db.add(review)
        db.commit()
        return {"success": True, "message": "Review submitted for approval", "id": review.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews")
def get_reviews(db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.is_approved == "approved"
    ).order_by(Review.created_at.desc()).limit(20).all()
    return {
        "reviews": [{
            "id": r.id,
            "client_name": r.client_name,
            "rating": r.rating,
            "review_text": r.review_text,
            "created_at": str(r.created_at)
        } for r in reviews]
    }

@app.post("/api/careers")
def submit_candidate(candidate_data: dict, request: Request, db: Session = Depends(get_db)):
    if not rate_limit_check(request.client.host):
        raise HTTPException(status_code=429, detail="Too many requests")
    try:
        candidate = Candidate(
            full_name=re.sub(r'[<>]', '', candidate_data.get("full_name", "")[:100]),
            whatsapp=re.sub(r'[^0-9+]', '', candidate_data.get("whatsapp", "")[:20]),
            email=candidate_data.get("email", "")[:100],
            expertise=candidate_data.get("expertise", "")[:100],
            experience=candidate_data.get("experience", "")[:50],
            portfolio_link=candidate_data.get("portfolio_link", "")[:500],
            message=candidate_data.get("message", "")[:1000],
            status="new"
        )
        db.add(candidate)
        db.commit()
        return {"success": True, "message": "Application submitted", "id": candidate.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lead")
def save_lead(inquiry: Inquiry, request: Request, db: Session = Depends(get_db)):
    if not rate_limit_check(request.client.host):
        raise HTTPException(status_code=429, detail="Too many requests")
    try:
        lead = Lead(
            name=inquiry.name[:100],
            whatsapp=inquiry.whatsapp[:20],
            inquiry_type=inquiry.inquiry_type[:100],
            details=inquiry.details[:1000]
        )
        db.add(lead)
        db.commit()
        return {"success": True, "message": "Lead saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/track")
async def track_visitor(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        visitor = Visitor(
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "")[:500],
            page_visited=data.get("page", "/")[:200],
            referrer=data.get("referrer", "")[:500],
            device=data.get("device", "desktop"),
            browser=data.get("browser", "Unknown"),
            os=data.get("os", "Unknown")
        )
        db.add(visitor)
        db.commit()
        return {"success": True}
    except Exception:
        return {"success": False}

# ============================================
# ADMIN ENDPOINTS
# ============================================

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel():
    with open("templates/admin.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/api/admin/data")
def get_admin_data(password: str, db: Session = Depends(get_db)):
    if not verify_password(password):
        raise HTTPException(status_code=401, detail="Wrong password")

    contacts = db.query(ContactSubmission).order_by(ContactSubmission.created_at.desc()).all()
    leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    visitors = db.query(Visitor).order_by(Visitor.visited_at.desc()).limit(50).all()

    return {
        "contacts": [{"id": c.id, "name": c.name, "email": c.email, "phone": c.phone, "service": c.service, "message": c.message[:100], "created_at": str(c.created_at)} for c in contacts],
        "leads": [{"id": l.id, "name": l.name, "whatsapp": l.whatsapp, "inquiry_type": l.inquiry_type, "status": l.status, "created_at": str(l.created_at)} for l in leads],
        "reviews": [{"id": r.id, "client_name": r.client_name, "rating": r.rating, "review_text": r.review_text[:100], "status": r.is_approved, "created_at": str(r.created_at)} for r in reviews],
        "candidates": [{"id": c.id, "name": c.full_name, "expertise": c.expertise, "whatsapp": c.whatsapp, "experience": c.experience, "status": c.status, "created_at": str(c.created_at)} for c in candidates],
        "visitors": [{"ip": v.ip_address, "page": v.page_visited, "device": v.device, "time": str(v.visited_at)} for v in visitors],
        "stats": {
            "total_contacts": len(contacts),
            "total_reviews": len(reviews),
            "pending_reviews": len([r for r in reviews if r.is_approved == "pending"]),
            "approved_reviews": len([r for r in reviews if r.is_approved == "approved"]),
            "total_candidates": len(candidates),
            "total_visitors": len(visitors)
        }
    }

@app.get("/api/admin/approve-review/{review_id}")
def approve_review(review_id: int, password: str, db: Session = Depends(get_db)):
    if not verify_password(password):
        raise HTTPException(status_code=401, detail="Wrong password")
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_approved = "approved"
    db.commit()
    print(f"✅ Review {review_id} approved")
    return {"success": True, "message": "Review approved"}

# ============================================
# SEED DEFAULT DATA (runs once)
# ============================================
def seed_default_data(db):
    # Seed Services
    if db.query(ServiceConfig).count() == 0:
        defaults = [
            ServiceConfig(service_key="graphic_design", service_name="Graphic Design", description="Logo, banner, poster, business card, social media posts, and complete brand identity.", icon="🎨", is_active="active", is_permanent=1, display_order=1),
            ServiceConfig(service_key="web_development", service_name="Web Development", description="Business websites, e-commerce stores, landing pages, and web applications.", icon="💻", is_active="active", is_permanent=1, display_order=2),
            ServiceConfig(service_key="erp_software", service_name="ERP Software", description="Inventory management, billing system, sales tracking, and reporting tools.", icon="📊", is_active="coming_soon", is_permanent=1, display_order=3),
            ServiceConfig(service_key="social_media", service_name="Social Media Marketing", description="Meta ads management, content creation, page growth, and engagement strategies.", icon="📱", is_active="coming_soon", is_permanent=1, display_order=4),
            ServiceConfig(service_key="ai_automation", service_name="AI Automation", description="Custom AI chatbots, workflow automation, lead generation bots, and AI agents.", icon="🤖", is_active="coming_soon", is_permanent=1, display_order=5),
            ServiceConfig(service_key="custom_software", service_name="Custom Software", description="Tailored desktop applications, business tools, and automation solutions.", icon="⚙️", is_active="coming_soon", is_permanent=1, display_order=6),
        ]
        for s in defaults:
            db.add(s)

    # Seed Pricing
    if db.query(PricingPackage).count() == 0:
        packages = [
            # Graphic Design
            PricingPackage(service_key="graphic_design", package_name="Logo Only", price=500, description="Perfect for startups & small shops", features='["1 Unique Logo Concept","High Resolution PNG + Vector","2 Free Revisions","Same Day Delivery (6-8 hrs)","Commercial Rights"]', is_popular=0, display_order=1),
            PricingPackage(service_key="graphic_design", package_name="Starter Branding", price=1200, description="Most chosen by businesses", features='["Logo + Business Card + Letterhead","PNG + PDF + Vector","Unlimited Revisions","Same Day Delivery","Commercial Rights + Source File"]', is_popular=1, display_order=2),
            PricingPackage(service_key="graphic_design", package_name="Complete Branding", price=2000, description="Full brand identity package", features='["Logo + Card + Banner + FB Cover","All Formats (PNG, PDF, SVG)","Unlimited Revisions","Priority Delivery","Complete Brand Guide","1 Month Free Support"]', is_popular=0, display_order=3),
            PricingPackage(service_key="graphic_design", package_name="Premium Identity Pack", price=3500, description="Ultimate branding solution", features='["Everything in Complete Branding","Social Media Kit (5 templates)","Company Profile Design","48hr Delivery","Dedicated Support"]', is_popular=0, display_order=4),
            # Web Development
            PricingPackage(service_key="web_development", package_name="Starter Landing Page", price=7000, description="Single page professional site", features='["1-Page Responsive Site","WhatsApp/Contact Integration","Free Netlify Hosting Setup","Mobile Optimized","Basic SEO"]', is_popular=0, display_order=1),
            PricingPackage(service_key="web_development", package_name="Business Website", price=15000, description="Complete business presence", features='["3-5 Pages (Home,About,Services,Contact)","Mobile Responsive","Basic SEO Setup","Domain Setup Support","WhatsApp Integration"]', is_popular=1, display_order=2),
            PricingPackage(service_key="web_development", package_name="Premium Business Site", price=25000, description="Advanced business website", features='["Up to 8 Pages","Custom Design","Blog/CMS","Advanced SEO","Analytics Setup","1 Month Support"]', is_popular=0, display_order=3),
            PricingPackage(service_key="web_development", package_name="E-commerce Starter", price=40000, description="Start selling online", features='["Product Catalog (30 items)","Cart & Checkout","EasyPaisa/JazzCash/COD","Mobile Responsive","Order Management"]', is_popular=0, display_order=4),
        ]
        for p in packages:
            db.add(p)

    db.commit()

@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    try:
        seed_default_data(db)
        print("✅ Default data seeded")
    except Exception as e:
        print(f"Seed error: {e}")
    finally:
        db.close()

# ============================================
# PUBLIC — Services & Pricing APIs
# ============================================
@app.get("/api/services")
def get_services(db: Session = Depends(get_db)):
    services = db.query(ServiceConfig).order_by(ServiceConfig.display_order).all()
    return {"services": [
        {"id": s.id, "service_key": s.service_key, "service_name": s.service_name,
         "description": s.description, "icon": s.icon, "is_active": s.is_active,
         "is_permanent": s.is_permanent, "display_order": s.display_order}
        for s in services
    ]}

@app.get("/api/pricing")
def get_pricing(db: Session = Depends(get_db)):
    packages = db.query(PricingPackage).filter(
        PricingPackage.is_active == 1
    ).order_by(PricingPackage.service_key, PricingPackage.display_order).all()
    return {"packages": [
        {"id": p.id, "service_key": p.service_key, "package_name": p.package_name,
         "price": p.price, "currency": p.currency, "description": p.description,
         "features": p.features, "is_popular": p.is_popular, "display_order": p.display_order}
        for p in packages
    ]}

# ============================================
# ADMIN — Services Management
# ============================================
@app.post("/api/admin/service/toggle")
def toggle_service(data: dict, db: Session = Depends(get_db)):
    if not verify_password(data.get("password", "")):
        raise HTTPException(status_code=401, detail="Wrong password")
    service = db.query(ServiceConfig).filter(ServiceConfig.service_key == data.get("service_key")).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.is_active = "active" if service.is_active == "coming_soon" else "coming_soon"
    db.commit()
    return {"success": True, "new_status": service.is_active, "service": service.service_name}

@app.post("/api/admin/service/add")
@app.post("/api/admin/service/add")
def add_service(data: dict, db: Session = Depends(get_db)):
    if not verify_password(data.get("password", "")):
        raise HTTPException(status_code=401, detail="Wrong password")
    try:
        existing = db.query(ServiceConfig).filter(
            ServiceConfig.service_key == data.get("service_key")
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Service key already exists")
        service = ServiceConfig(
            service_key=str(data.get("service_key", ""))[:50],
            service_name=str(data.get("service_name", ""))[:100],
            description=str(data.get("description", ""))[:500],
            icon=str(data.get("icon", "🔧"))[:10],
            is_active=str(data.get("is_active", "coming_soon")),
            is_permanent=0,
            display_order=int(data.get("display_order", 99))
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        return {"success": True, "message": "Service added", "id": service.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
@app.delete("/api/admin/service/{service_key}")
def delete_service(service_key: str, password: str, db: Session = Depends(get_db)):
    if not verify_password(password):
        raise HTTPException(status_code=401, detail="Wrong password")
    service = db.query(ServiceConfig).filter(ServiceConfig.service_key == service_key).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.is_permanent == 1:
        raise HTTPException(status_code=403, detail="Cannot delete permanent service")
    db.delete(service)
    db.commit()
    return {"success": True, "message": "Service deleted"}

# ============================================
# ADMIN — Pricing Management
# ============================================
@app.post("/api/admin/pricing/add")
def add_pricing(data: dict, db: Session = Depends(get_db)):
    if not verify_password(data.get("password", "")):
        raise HTTPException(status_code=401, detail="Wrong password")
    package = PricingPackage(
        service_key=data.get("service_key", "")[:50],
        package_name=data.get("package_name", "")[:100],
        price=int(data.get("price", 0)),
        currency=data.get("currency", "PKR"),
        description=data.get("description", "")[:500],
        features=data.get("features", "[]"),
        is_popular=int(data.get("is_popular", 0)),
        is_active=1,
        display_order=data.get("display_order", 99)
    )
    db.add(package)
    db.commit()
    return {"success": True, "message": "Package added", "id": package.id}

@app.put("/api/admin/pricing/{package_id}")
def update_pricing(package_id: int, data: dict, db: Session = Depends(get_db)):
    if not verify_password(data.get("password", "")):
        raise HTTPException(status_code=401, detail="Wrong password")
    package = db.query(PricingPackage).filter(PricingPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    if "package_name" in data: package.package_name = data["package_name"][:100]
    if "price" in data: package.price = int(data["price"])
    if "description" in data: package.description = data["description"][:500]
    if "features" in data: package.features = data["features"]
    if "is_popular" in data: package.is_popular = int(data["is_popular"])
    if "is_active" in data: package.is_active = int(data["is_active"])
    db.commit()
    return {"success": True, "message": "Package updated"}

@app.delete("/api/admin/pricing/{package_id}")
def delete_pricing(package_id: int, password: str, db: Session = Depends(get_db)):
    if not verify_password(password):
        raise HTTPException(status_code=401, detail="Wrong password")
    package = db.query(PricingPackage).filter(PricingPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    db.delete(package)
    db.commit()
    return {"success": True, "message": "Package deleted"}

# ============================================
# STATIC FILES — FRONTEND SERVE
# ============================================
app.mount("/frontend", StaticFiles(directory="../frontend"), name="frontend")

# ============================================
# RUN
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)