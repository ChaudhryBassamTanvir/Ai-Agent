from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.ai_model import generate_reply
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
    message = data.get("message", "")

    # Safety check
    if not message:
        return {"response": "⚠️ Please send a valid message"}

    # Generate AI response
    ai_response = generate_reply(message)

    # Task detection (single clean block)
    if any(word in message.lower() for word in ["build", "create", "make", "develop"]):
        create_task(message)

        return {
            "response": ai_response,
            "task": "✅ Task saved in database"
        }

    return {"response": ai_response}