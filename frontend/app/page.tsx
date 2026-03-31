"use client"
import { useState } from "react";

export default function Chat() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<string[]>([]);

const sendMessage = async () => {
  if (!msg) return;

  const res = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    body: JSON.stringify({ message: msg }),
    headers: { "Content-Type": "application/json" }
  });

  const data = await res.json();

  setChat((prev) => [
    ...prev,
    "You: " + msg,
    "AI: " + data.response,
    data.task ? "📌 Task: " + data.task : ""
  ]);

  setMsg("");
};

  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">AI Agent</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 w-full"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4"
        >
          Send
        </button>
      </div>

      <div className="space-y-2">
        {chat.map((c, i) => (
          <p key={i}>{c}</p>
        ))}
      </div>
    </div>
  );
}