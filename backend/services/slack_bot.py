from slack_bolt import App
from services.intent_detector import detect_intent
from db.database import create_task
from services.ai_model import generate_reply
from slack_bolt import App
from dotenv import load_dotenv
import os

load_dotenv()

app = App(token=os.getenv("SLACK_BOT_TOKEN"))

@app.message("")
def handle_message(message, say):
    text = message.get("text", "")

    intent = detect_intent(text)

    if intent == "greeting":
        say("Hello! 👋 How can I help you?")

    elif intent == "pricing":
        say("💰 Pricing depends on your project. Please share details.")

    elif intent == "task":
        create_task(text)
        say("✅ Task created and saved!")

    else:
        reply = generate_reply(text)
        say(reply)