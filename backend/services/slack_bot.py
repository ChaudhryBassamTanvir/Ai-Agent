# services/slack_bot.py

from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from services.langchain_agent import run_agent
import os
from dotenv import load_dotenv
load_dotenv()

app = App(token=os.getenv("SLACK_BOT_TOKEN"))

@app.event("message")
def handle_message(event, say):
    # Ignore bot messages to avoid loops
    if event.get("bot_id"):
        return

    text = event.get("text", "").strip()
    user_id = event.get("user", "default")  # ✅ unique per Slack user

    if not text:
        return

    response = run_agent(text, user_id=user_id)  # ✅ pass user_id
    say(response)

def start_slack_bot():
    handler = SocketModeHandler(app, os.getenv("SLACK_APP_TOKEN"))
    handler.start()