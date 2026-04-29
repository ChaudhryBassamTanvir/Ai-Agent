# main.py

import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from services.langchain_agent import run_agent
from services.whatsapp_bot import send_whatsapp_message
from services.email_service import send_status_update_email
from services.trello_service import move_trello_card
from api.routes.auth import router as auth_router
from db.database import (
    Base, engine, init_db,
    get_all_tasks, get_all_clients, get_dashboard_stats,
    update_task_status, update_task_status_by_trello_url,
    get_task_trello_url, get_task_with_client,
    delete_client, add_client_manual,
    SessionLocal, Task, Client
)
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ============================
# 💬 CHAT
# ============================
@app.post("/chat")
async def chat(data: dict):
    message = data.get("message", "").strip()
    user_id = data.get("user_id", "web_user")
    channel = data.get("channel", "web")
    if not message:
        return {"response": "⚠️ Please send a valid message"}
    return {"response": run_agent(message, user_id=user_id, channel=channel)}

# ============================
# 📊 DASHBOARD
# ============================
@app.get("/tasks")
async def get_tasks():
    return get_all_tasks()

@app.get("/clients")
async def get_clients():
    return get_all_clients()

@app.get("/stats")
async def get_stats():
    return get_dashboard_stats()

# ============================
# ✏️ TASK CRUD
# ============================
@app.patch("/tasks/{task_id}")
async def update_task(task_id: int, data: dict):
    new_status = data.get("status", "pending")

    # 1. Update DB
    update_task_status(task_id, new_status)
    print(f"✅ Task {task_id} status updated to: {new_status}")

    # 2. Sync Trello
    trello_url = get_task_trello_url(task_id)
    if trello_url:
        move_trello_card(trello_url, new_status)

    # 3. Email client
    task = get_task_with_client(task_id)
    print(f"🔍 Task with client: {task}")

    if task:
        client_email = task.get("client_email", "")
        print(f"📧 Client email: '{client_email}'")

        if client_email:
            print(f"📤 Sending status email to {client_email}...")
            send_status_update_email(
                client_name=task["client_name"],
                client_email=client_email,
                task_description=task["description"],
                new_status=new_status,
                trello_url=task.get("trello_url", "")
            )
        else:
            print(f"⚠️ No client email found for task {task_id} — skipping email")
    else:
        print(f"⚠️ No task found with id {task_id}")

    return {"success": True}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            db.delete(task)
            db.commit()
        return {"success": True}
    finally:
        db.close()

# ============================
# 👥 CLIENT CRUD
# ============================
@app.post("/clients")
async def add_client(data: dict):
    client_id = add_client_manual(
        name=data.get("name", ""),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        company=data.get("company", ""),
        channel=data.get("channel", "web"),
        university=data.get("university", ""),
        target_country=data.get("target_country", ""),
        cgpa=data.get("cgpa", ""),
        degree=data.get("degree", ""),
    )
    return {"id": client_id, "success": True}

@app.delete("/clients/{client_id}")
async def delete_client_endpoint(client_id: int):
    success = delete_client(client_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete client")
    return {"success": True}

# ============================
# 📱 WHATSAPP WEBHOOK
# ============================
@app.get("/whatsapp/webhook")
async def verify_webhook(request: Request):
    params    = dict(request.query_params)
    mode      = params.get("hub.mode")
    token     = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == os.getenv("WHATSAPP_VERIFY_TOKEN"):
        return Response(content=challenge, media_type="text/plain")
    return Response(content="Forbidden", status_code=403)

@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    data = await request.json()
    try:
        entry        = data["entry"][0]
        changes      = entry["changes"][0]
        value        = changes["value"]
        if "messages" not in value:
            return {"status": "no message"}
        message_data = value["messages"][0]
        from_number  = message_data["from"]
        if message_data.get("type") != "text":
            send_whatsapp_message(from_number, "Sorry, I can only process text messages.")
            return {"status": "non-text"}
        user_message = message_data["text"]["body"]
        print(f"📱 WhatsApp from {from_number}: {user_message}")
        response = run_agent(user_message, user_id=f"wa_{from_number}", channel="whatsapp")
        send_whatsapp_message(from_number, response)
    except Exception as e:
        print(f"❌ WhatsApp error: {e}")
    return {"status": "ok"}

# ============================
# 🔲 TRELLO WEBHOOK
# ============================
@app.head("/trello/webhook")
async def trello_webhook_head():
    return Response(status_code=200)

@app.get("/trello/webhook")
async def trello_webhook_verify():
    return {"status": "ok"}

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
            update_task_status_by_trello_url(card_url, new_status)
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

@app.get("/debug/task/{task_id}")
async def debug_task(task_id: int):
    task = get_task_with_client(task_id)
    return task