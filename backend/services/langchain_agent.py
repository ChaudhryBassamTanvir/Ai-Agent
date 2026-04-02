# services/langchain_agent.py

import os
import requests
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from db.database import create_task
from slack_sdk import WebClient

load_dotenv()

# ✅ Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ============================
# 🔧 TRELLO
# ============================

TRELLO_TODO_LIST_ID = "69ce483fd98acbd8128e9d9c"  # "To Do" column

def create_trello_card(task_name: str, description: str = ""):
    url = "https://api.trello.com/1/cards"
    params = {
        "key": os.getenv("TRELLO_API_KEY"),
        "token": os.getenv("TRELLO_TOKEN"),
        "idList": TRELLO_TODO_LIST_ID,
        "name": task_name,
        "desc": description
    }
    response = requests.post(url, params=params)
    card = response.json()
    return card.get("shortUrl", "No URL")

# ============================
# 🔔 SLACK TEAM NOTIFICATION
# ============================

def notify_slack_team(message: str):
    client = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))
    channel = os.getenv("SLACK_TEAM_CHANNEL", "#general")
    try:
        client.chat_postMessage(channel=channel, text=message)
    except Exception as e:
        print(f"Slack notify error: {e}")

# ============================
# 🛠️ TOOLS
# ============================

@tool
def create_task_tool(task: str) -> str:
    """
    Use this when the client requests any work, project, feature, fix, or task.
    Creates a task in the database, adds a card to Trello board in To Do column,
    and notifies the team on Slack.
    """
    # 1. Save to local DB
    create_task(task)

    # 2. Create Trello card
    card_url = create_trello_card(
        task_name=task,
        description="Task created via AI Agent from client request."
    )

    # 3. Notify team on Slack
    notify_slack_team(
        f"🆕 *New Client Task Created!*\n"
        f"📋 *Task:* {task}\n"
        f"🔗 *Trello:* {card_url}"
    )

    return (
        f"✅ Task created and added to Trello!\n"
        f"🔗 {card_url}\n"
        f"📢 Your team has been notified on Slack."
    )

@tool
def get_services_info(query: str) -> str:
    """
    Use this when client asks about services, pricing, or what the company offers.
    """
    return """We offer the following services:
🌐 Custom Web Development
📱 Mobile App Development
🤖 AI & Automation Solutions
🎨 UI/UX Design
☁️ Cloud & DevOps Services
📈 Digital Marketing

For pricing, we prepare custom quotes based on your project needs.
Please describe your project and we'll get back to you shortly!"""

@tool
def send_update_to_client(update: str) -> str:
    """
    Use this to acknowledge or send a status update to the client.
    """
    return f"📢 Update: {update}"

tools = [create_task_tool, get_services_info, send_update_to_client]

# ============================
# 🤖 AGENT
# ============================

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="""You are a professional AI assistant for a software company.

Your responsibilities:
1. Greet clients warmly and understand their needs
2. Answer questions about the company's services
3. When a client requests ANY work, project, feature, bug fix, or task → ALWAYS use create_task_tool immediately
4. Confirm to the client their request has been received and team notified
5. Be professional, friendly, and concise in all responses

Important:
- Never ignore a task request
- Always confirm task creation with the Trello link
- Keep responses short and professional"""
)

# ============================
# 🚀 RUN
# ============================

def run_agent(message: str) -> str:
    result = agent.invoke({"messages": [HumanMessage(content=message)]})
    last_message = result["messages"][-1]

    if isinstance(last_message.content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in last_message.content
        )
    return str(last_message.content)

def create_trello_card(task_name: str, description: str = ""):
    url = "https://api.trello.com/1/cards"
    params = {
        "key": os.getenv("TRELLO_API_KEY"),
        "token": os.getenv("TRELLO_TOKEN"),
        "idList": TRELLO_TODO_LIST_ID,
        "name": task_name,
        "desc": description
    }
    print(f"🔧 Creating Trello card: {task_name}")  # ADD THIS
    response = requests.post(url, params=params)
    print(f"🔧 Trello response: {response.status_code} - {response.text[:100]}")  # ADD THIS
    card = response.json()
    return card.get("shortUrl", "No URL")