"use client"
import { useState, useRef, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import { Send } from "lucide-react"

type Message = {
  role: "user" | "ai"
  content: string
  isTask?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I'm your AI assistant. Tell me about your project and I'll gather all requirements before creating a task for the team." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      const reply = data.response || "Sorry, something went wrong."
      const isTask = reply.includes("Trello") || reply.includes("✅")
      setMessages(prev => [...prev, { role: "ai", content: reply, isTask }])
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Connection error. Make sure the backend is running." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "220px", flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        
        {/* Header */}
        <div style={{ padding: "16px 28px", borderBottom: "0.5px solid #e8e8e6", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "500" }}>Client Chat</div>
            <div style={{ fontSize: "11px", color: "#999" }}>AI Agent is online</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "11px", color: "#999" }}>Connected</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px", background: "#fff" }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.isTask && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 14px", background: "#f0fdf4",
                  border: "0.5px solid #bbf7d0", borderRadius: "8px", marginBottom: "8px"
                }}>
                  <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "500" }}>
                    Task created in Trello · Team notified on Slack
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-start" }}>
                {msg.role === "ai" && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "#f3f4f6", border: "0.5px solid #e8e8e6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: "500", color: "#666", flexShrink: 0
                  }}>AI</div>
                )}
                <div style={{
                  maxWidth: "68%",
                  background: msg.role === "user" ? "#1a1a1a" : "#f9f9f8",
                  border: msg.role === "user" ? "none" : "0.5px solid #e8e8e6",
                  borderRadius: msg.role === "user" ? "12px 0 12px 12px" : "0 12px 12px 12px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: msg.role === "user" ? "#fff" : "#1a1a1a",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap"
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f3f4f6", border: "0.5px solid #e8e8e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#666" }}>AI</div>
              <div style={{ background: "#f9f9f8", border: "0.5px solid #e8e8e6", borderRadius: "0 12px 12px 12px", padding: "12px 16px", fontSize: "13px", color: "#999" }}>Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 28px", borderTop: "0.5px solid #e8e8e6", background: "#fff" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              style={{
                flex: 1, padding: "10px 14px", fontSize: "13px",
                borderRadius: "8px", border: "0.5px solid #e8e8e6",
                background: "#f9f9f8", color: "#1a1a1a", outline: "none"
              }}
            />
            <button onClick={sendMessage} disabled={loading} style={{
              padding: "10px 18px", background: loading ? "#e0e0e0" : "#1a1a1a",
              color: loading ? "#999" : "#fff", border: "none",
              borderRadius: "8px", fontSize: "13px", fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              <Send size={13} /> Send
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}