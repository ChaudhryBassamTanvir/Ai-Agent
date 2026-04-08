# services/langchain_agent.py

import os
import requests
import resend
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, AIMessage
from slack_sdk import WebClient
from db.database import create_task

load_dotenv()

# ============================
# ✅ GEMINI LLM
# ============================
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ============================
# 💬 CONVERSATION MEMORY
# per user session storage
# ============================
conversation_history = {}  # { user_id: [messages] }

# ============================
# 🔧 TRELLO
# ============================
TRELLO_TODO_LIST_ID = "69ce483fd98acbd8128e9d9c"

def create_trello_card(task_name: str, description: str = ""):
    url = "https://api.trello.com/1/cards"
    params = {
        "key": os.getenv("TRELLO_API_KEY"),
        "token": os.getenv("TRELLO_TOKEN"),
        "idList": TRELLO_TODO_LIST_ID,
        "name": task_name,
        "desc": description
    }
    print(f"🔧 Creating Trello card: {task_name}")
    response = requests.post(url, params=params)
    print(f"🔧 Trello response: {response.status_code}")
    card = response.json()
    return card.get("shortUrl", "No URL")

# ============================
# 📧 RESEND EMAIL
# ============================
def send_email_notification(task_name: str, requirements: str, card_url: str):
    resend.api_key = os.getenv("RESEND_API_KEY")
    try:
        resend.Emails.send({
            "from": "AI Agent <onboarding@resend.dev>",
            "to": os.getenv("NOTIFY_EMAIL"),
            "subject": f"🆕 New Client Task: {task_name}",
            "html": f"""
                <h2>New Task Created by AI Agent</h2>
                <p><strong>Task:</strong> {task_name}</p>
                <hr/>
                <h3>Client Requirements:</h3>
                <pre>{requirements}</pre>
                <hr/>
                <p><strong>Trello Card:</strong> <a href="{card_url}">{card_url}</a></p>
                <br/>
                <p>This task was automatically created by the AI Agent after gathering client requirements.</p>
            """
        })
        print("✅ Email sent successfully")
    except Exception as e:
        print(f"❌ Email error: {e}")

# ============================
# 🔔 SLACK TEAM NOTIFICATION
# ============================
def notify_slack_team(task_name: str, requirements: str, card_url: str):
    client = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))
    channel = os.getenv("SLACK_TEAM_CHANNEL", "#general")
    try:
        client.chat_postMessage(
            channel=channel,
            text=(
                f"🆕 *New Client Task Created!*\n"
                f"📋 *Task:* {task_name}\n"
                f"📝 *Requirements:*\n{requirements}\n"
                f"🔗 *Trello:* {card_url}"
            )
        )
        print("✅ Slack team notified")
    except Exception as e:
        print(f"❌ Slack notify error: {e}")

# ============================
# 🛠️ TOOLS
# ============================

@tool
def finalize_and_create_task(task_name: str, requirements: str) -> str:
    """
    Use this ONLY when the client has confirmed all requirements are complete
    and said something like 'done', 'that is all', 'create the task', 'yes finalize it'.
    
    task_name: A short clear title for the task
    requirements: Full detailed requirements gathered from the conversation
    """
    # 1. Save to DB
    create_task(f"{task_name}: {requirements}")

    # 2. Create Trello card with full requirements
    card_url = create_trello_card(
        task_name=task_name,
        description=f"Client Requirements:\n\n{requirements}"
    )

    # 3. Send email
    send_email_notification(task_name, requirements, card_url)

    # 4. Notify Slack team
    notify_slack_team(task_name, requirements, card_url)

    return (
        f"✅ Perfect! Your task has been created with all requirements.\n"
        f"🔗 Trello Card: {card_url}\n"
        f"📧 Our team has been notified via email and Slack.\n"
        f"We'll get back to you shortly!"
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
Please describe your project and we'll prepare a quote for you!"""

tools = [finalize_and_create_task, get_services_info]

# ============================
# 🤖 AGENT
# ============================
agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="""You are a professional AI assistant for a software company name DS Technologies.

Your job is to gather client requirements through conversation before creating any task.

## Your Conversation Flow:
1. Greet the client warmly,
2. Understand what they need (website, app, AI solution, etc.)
3. Ask relevant follow-up questions ONE AT A TIME to gather full requirements:
   - For websites: purpose, pages needed, design preferences, deadline, budget
   - For apps: platform (iOS/Android/both), features, target users, deadline, budget
   - For AI: what problem to solve, data available, integration needs
   - Always ask about: timeline, budget range, any special requirements
4. After each answer, ask the next relevant question
5. Keep asking until the client says something like "done", "that's all", "create the task", "yes", "finalize"
6. Once client confirms → use finalize_and_create_task tool with ALL gathered requirements
ask for email and name of the client after that confirm his project and send email along with name and email and update the client table
## Rules:
- Ask only ONE question at a time
- Be conversational and friendly
- Summarize requirements before finalizing and ask client to confirm
- NEVER create a task without client confirmation
- If client asks about services → use get_services_info tool"""
)

# ============================
# 🚀 RUN AGENT WITH MEMORY
# ============================
def run_agent(message: str, user_id: str = "default") -> str:
    # Get or create conversation history for this user
    if user_id not in conversation_history:
        conversation_history[user_id] = []

    # Add new user message to history
    conversation_history[user_id].append(HumanMessage(content=message))

    # Run agent with full history
    result = agent.invoke({"messages": conversation_history[user_id]})

    # Get the last AI response
    last_message = result["messages"][-1]

    # Save full updated history
    conversation_history[user_id] = result["messages"]

    # Extract text content
    if isinstance(last_message.content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in last_message.content
        )
    return str(last_message.content)