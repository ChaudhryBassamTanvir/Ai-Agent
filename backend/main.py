from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.ai_model import generate_reply
from services.intent_detector import detect_intent
from db.database import create_task

app = FastAPI()

# CORS (allow frontend)
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

    # ✅ Safety check
    if not message:
        return {"response": "⚠️ Please send a valid message"}

    # ✅ Detect intent
    intent = detect_intent(message)

    # ✅ Greeting
    if intent == "greeting":
        return {"response": "Hello! 👋 How can we assist you today?"}

    # ✅ Pricing
    if intent == "pricing":
        return {
            "response": "💰 Our pricing depends on your project requirements. Please share more details."
        }

    # ✅ Task creation
    if intent == "task":
        create_task(message)
        return {
            "response": "✅ Got it! Your request has been noted and our team will start working on it.",
            "task": "Task saved in DB"
        }

    # ✅ Default AI response (fallback)
    ai_response = generate_reply(message)

    return {"response": ai_response}