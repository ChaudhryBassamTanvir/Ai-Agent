# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.langchain_agent import run_agent

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