# main.py
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from services.langchain_agent import run_agent
from services.whatsapp_bot import send_whatsapp_message
from dotenv import load_dotenv
# main.py — add this after init_db()
from db.database import Base, engine
# Base.metadata.drop_all(bind=engine)   # ⚠️ drops all data
# Base.metadata.create_all(bind=engine)
from db.database import get_all_tasks  # make sure this function exists
from db.database import (
    init_db, get_all_tasks, get_all_clients,
    get_dashboard_stats, update_task_status
)
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse, Response
from api.routes.auth import router as auth_router
from services.email_service import send_status_update_email
from db.database import get_task_with_client
# Initialize DB on startup
init_db()

load_dotenv()

app = FastAPI()
app.include_router(auth_router)   # ← adds POST /auth/login

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(data: dict):
    message  = data.get("message", "").strip()
    user_id  = data.get("user_id", "web_user")
    channel  = data.get("channel", "web")
    if not message:
        return {"response": "⚠️ Please send a valid message"}
    response = run_agent(message, user_id=user_id, channel=channel)
    return {"response": response}

@app.get("/whatsapp/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    print(f"🔍 Webhook verify attempt - mode: {mode}, token: {token}")

    if mode == "subscribe" and token == os.getenv("WHATSAPP_VERIFY_TOKEN"):
        print("✅ WhatsApp webhook verified!")
        return Response(content=challenge, media_type="text/plain")
    
    print("❌ Webhook verification failed")
    return Response(content="Forbidden", status_code=403)

# ============================
# 📩 WHATSAPP INCOMING MESSAGE
# ============================
@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    data = await request.json()
    print(f"📩 Incoming WhatsApp data: {data}")

    try:
        entry = data["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]

        if "messages" not in value:
            return {"status": "no message"}

        message_data = value["messages"][0]
        from_number = message_data["from"]
        message_type = message_data.get("type")

        if message_type != "text":
            send_whatsapp_message(from_number, "Sorry, I can only process text messages right now.")
            return {"status": "non-text ignored"}

        user_message = message_data["text"]["body"]
        print(f"📱 WhatsApp from {from_number}: {user_message}")

        response = run_agent(user_message, user_id=f"wa_{from_number}", channel="whatsapp")
        send_whatsapp_message(from_number, response)

    except Exception as e:
        print(f"❌ WhatsApp webhook error: {e}")

    return {"status": "ok"}


@app.get("/tasks")
async def get_tasks():
    return get_all_tasks()

@app.get("/clients")
async def get_clients():
    return get_all_clients()

@app.get("/stats")
async def get_stats():
    return get_dashboard_stats()

from db.database import (
    init_db, get_all_tasks, get_all_clients,
    get_dashboard_stats, update_task_status,
    update_task_status_by_trello_url, get_task_trello_url
)
from services.trello_service import move_trello_card

@app.patch("/tasks/{task_id}")
async def update_task(task_id: int, data: dict):
    new_status = data.get("status", "pending")

    # 1. Update DB
    update_task_status(task_id, new_status)

    # 2. Sync Trello
    trello_url = get_task_trello_url(task_id)
    if trello_url:
        move_trello_card(trello_url, new_status)

    # 3. Email client about status change
    task = get_task_with_client(task_id)
    if task and task.get("client_email"):
        send_status_update_email(
            client_name=task["client_name"],
            client_email=task["client_email"],
            task_description=task["description"],
            new_status=new_status,
            trello_url=task.get("trello_url", "")
        )

    return {"success": True}

@app.get("/clients")
async def get_clients():
    return get_all_clients()



@app.post("/trello/webhook")
async def trello_webhook(request: Request):
    try:
        data       = await request.json()
        action     = data.get("action", {})
        if action.get("type") != "updateCard":
            return {"status": "ignored"}
        card_data  = action.get("data", {})
        card       = card_data.get("card", {})
        list_after = card_data.get("listAfter", {})
        if not list_after:
            return {"status": "no list change"}
        card_url   = f"https://trello.com/c/{card.get('shortLink', '')}"
        list_name  = list_after.get("name", "").lower()
        status_map = {"to do": "pending", "doing": "in_progress", "in progress": "in_progress", "done": "done"}
        new_status = status_map.get(list_name)
        if new_status:
            # Update DB
            update_task_status_by_trello_url(card_url, new_status)

            # ✅ Email client about Trello status change too
            from db.database import SessionLocal, Task, Client
            db = SessionLocal()
            try:
                tasks = db.query(Task).all()
                for task in tasks:
                    if task.trello_url and card_url in task.trello_url:
                        client = db.query(Client).filter(Client.id == task.client_id).first() if task.client_id else None
                        if client and client.email:
                            send_status_update_email(
                                client_name=client.name,
                                client_email=client.email,
                                task_description=task.description,
                                new_status=new_status,
                                trello_url=task.trello_url
                            )
                        break
            finally:
                db.close()

    except Exception as e:
        print(f"❌ Trello webhook error: {e}")
    return {"status": "ok"}
# Trello needs GET verification too
@app.get("/trello/webhook")
async def trello_webhook_verify():
    return {"status": "ok"}

# Add this route to main.py
@app.head("/trello/webhook")
async def trello_webhook_head():
    return Response(status_code=200)