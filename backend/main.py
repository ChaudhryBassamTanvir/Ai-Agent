# main.py
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from services.langchain_agent import run_agent
from services.whatsapp_bot import send_whatsapp_message
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(data: dict):
    message = data.get("message", "").strip()

    if not message:
        return {"response": "⚠️ Please send a valid message"}

    response = run_agent(message)

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

        response = run_agent(user_message, user_id=f"wa_{from_number}")
        send_whatsapp_message(from_number, response)

    except Exception as e:
        print(f"❌ WhatsApp webhook error: {e}")

    return {"status": "ok"}