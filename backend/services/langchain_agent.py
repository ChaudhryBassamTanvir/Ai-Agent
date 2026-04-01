# services/langchain_agent.py

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from db.database import create_task
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ✅ Tool
@tool
def create_task_tool(text: str):
    """Create a task when user requests project or work"""
    create_task(text)
    return "✅ Task created successfully"

tools = [create_task_tool]

# ✅ Agent
agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="""You are an AI assistant for a software company.
You can:
- Answer client queries
- Create tasks if user asks for project/work
Always be helpful and professional."""
)

def run_agent(message: str) -> str:
    result = agent.invoke({"messages": [HumanMessage(content=message)]})
    last_message = result["messages"][-1]
    
    # Handle if content is a list (Gemini sometimes returns list of content blocks)
    if isinstance(last_message.content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in last_message.content
        )
    return str(last_message.content)