# services/slack_bot.py

from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from services.langchain_agent import run_agent, store_slack_id
import os
from dotenv import load_dotenv
load_dotenv()

app = App(token=os.getenv("SLACK_BOT_TOKEN"))

@app.event("message")
def handle_message(event, say):
    if event.get("bot_id"):
        return

    text    = event.get("text", "").strip()
    user_id = event.get("user", "default")

    if not text:
        return

    # ✅ Store Slack user ID before running agent
    store_slack_id(user_id, slack_user_id=user_id)

    response = run_agent(text, user_id=user_id, channel="slack")
    say(response)

def start_slack_bot():
    handler = SocketModeHandler(app, os.getenv("SLACK_APP_TOKEN"))
    handler.start()