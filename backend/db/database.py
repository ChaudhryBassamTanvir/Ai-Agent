# db/database.py

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ============================
# 📦 MODELS
# ============================

class Admin(Base):
    __tablename__ = "admins"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(100), nullable=False)
    email       = Column(String(100), unique=True, nullable=False)
    password    = Column(String(255), nullable=False)   # store hashed in prod
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)


class Client(Base):
    __tablename__ = "clients"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(100))
    phone           = Column(String(30))
    company         = Column(String(100))
    channel         = Column(String(20))  # slack / whatsapp / web
    slack_id        = Column(String(50))
    created_at      = Column(DateTime, default=datetime.utcnow)
    tasks           = relationship("Task", back_populates="client")
    messages        = relationship("Message", back_populates="client")

class Task(Base):
    __tablename__ = "tasks"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    description     = Column(Text, nullable=False)
    status          = Column(String(20), default="pending")   # pending / in_progress / done
    trello_url      = Column(String(255))
    client_id       = Column(Integer, ForeignKey("clients.id"), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    client          = relationship("Client", back_populates="tasks")

class Message(Base):
    __tablename__ = "messages"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    client_id       = Column(Integer, ForeignKey("clients.id"), nullable=True)
    role            = Column(String(10))   # user / ai
    content         = Column(Text)
    channel         = Column(String(20))  # slack / whatsapp / web
    created_at      = Column(DateTime, default=datetime.utcnow)
    client          = relationship("Client", back_populates="messages")

# ============================
# 🔧 INIT DB
# ============================

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

# ============================
# 🔐 ADMIN FUNCTIONS
# ============================

def get_admin_by_email(email: str):
    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.email == email, Admin.is_active == True).first()
        if admin:
            return {"id": admin.id, "name": admin.name, "email": admin.email, "password": admin.password}
        return None
    finally:
        db.close()

# ============================
# 📝 TASK FUNCTIONS
# ============================

def create_task(description: str, trello_url: str = "", client_id: int = None):
    db = SessionLocal()
    try:
        task = Task(
            description=description,
            trello_url=trello_url,
            client_id=client_id,
            status="pending"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        print(f"✅ Task saved to DB: {task.id}")
        return task
    finally:
        db.close()

def get_all_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).order_by(Task.created_at.desc()).all()
        return [
            {
                "id": t.id,
                "description": t.description,
                "status": t.status,
                "trello_url": t.trello_url,
                "client": t.client.name if t.client else "Unknown",
                "created_at": t.created_at.strftime("%b %d, %Y %H:%M") if t.created_at else ""
            }
            for t in tasks
        ]
    finally:
        db.close()

def update_task_status(task_id: int, status: str):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = status
            db.commit()
    finally:
        db.close()


def update_task_status_by_trello_url(trello_url: str, status: str):
    db = SessionLocal()
    try:
        tasks = db.query(Task).all()
        for task in tasks:
            if task.trello_url and trello_url in task.trello_url:
                task.status = status
                db.commit()
                print(f"✅ Task {task.id} status → {status}")
                return True
        print(f"⚠️ No task found for Trello URL: {trello_url}")
        return False
    finally:
        db.close()

# ============================
# 👤 CLIENT FUNCTIONS
# ============================

def get_or_create_client(name: str, channel: str, phone: str = "", email: str = "", slack_id: str = ""):
    db = SessionLocal()
    try:
        if channel == "slack" and slack_id:
            client = db.query(Client).filter(Client.slack_id == slack_id).first()
        else:
            client = db.query(Client).filter(Client.phone == phone, Client.channel == channel).first()

        if not client:
            client = Client(
                name=name, phone=phone, channel=channel,
                email=email, slack_id=slack_id
            )
            db.add(client)
            db.commit()
            db.refresh(client)
        else:
            if name and name != "Unknown":
                client.name  = name
                client.email = email or client.email
                db.commit()

        return client.id
    finally:
        db.close()

def get_all_clients():
    db = SessionLocal()
    try:
        clients = db.query(Client).order_by(Client.created_at.desc()).all()
        return [
            {
                "id":              c.id,
                "name":            c.name,
                "email":           c.email or "",
                "phone":           c.phone or "",
                "company":         c.company or "",
                "channel":         c.channel,
                "task_count":      len(c.tasks),
                "created_at":      c.created_at.strftime("%b %d, %Y") if c.created_at else "",
                "whatsapp_number": c.phone if c.channel == "whatsapp" else "",
                "slack_id":        c.slack_id or "",
            }
            for c in clients
        ]
    finally:
        db.close()

# ============================
# 💬 MESSAGE FUNCTIONS
# ============================

def save_message(role: str, content: str, channel: str, client_id: int = None):
    db = SessionLocal()
    try:
        msg = Message(role=role, content=content, channel=channel, client_id=client_id)
        db.add(msg)
        db.commit()
    finally:
        db.close()

def get_dashboard_stats():
    db = SessionLocal()
    try:
        total_tasks    = db.query(Task).count()
        total_clients  = db.query(Client).count()
        pending_tasks  = db.query(Task).filter(Task.status == "pending").count()
        done_tasks     = db.query(Task).filter(Task.status == "done").count()
        return {
            "total_tasks": total_tasks,
            "total_clients": total_clients,
            "pending_tasks": pending_tasks,
            "done_tasks": done_tasks
        }
    finally:
        db.close()

def get_task_trello_url(task_id: int) -> str:
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        return task.trello_url if task else ""
    finally:
        db.close()