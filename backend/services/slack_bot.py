from slack_bolt import App
from dotenv import load_dotenv
import os
from services.langchain_agent import run_agent

load_dotenv()

app = App(token=os.getenv("SLACK_BOT_TOKEN"))

@app.message("")
def handle_message(message, say):
    text = message.get("text", "")

    if not text:
        say("⚠️ Please send a message")
        return

    response = run_agent(text)

    say(response)