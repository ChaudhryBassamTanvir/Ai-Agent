"use client"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"

type Task = { id: number; description: string }

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/tasks")
      .then(r => r.json())
      .then(setTasks)
      .catch(() => {})
  }, [])

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "220px", flex: 1, minHeight: "100vh", background: "#f9f9f8", padding: "32px 36px" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "500", letterSpacing: "-0.3px" }}>Dashboard</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>Overview of all client tasks</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Total Tasks", value: tasks.length },
            { label: "This Week", value: tasks.slice(-5).length },
            { label: "Channels", value: "Slack + WA" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#fff", border: "0.5px solid #e8e8e6",
              borderRadius: "10px", padding: "16px 20px"
            }}>
              <div style={{ fontSize: "11px", color: "#999", marginBottom: "8px" }}>{label}</div>
              <div style={{ fontSize: "22px", fontWeight: "500" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tasks list */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e6", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #e8e8e6", fontSize: "13px", fontWeight: "500" }}>
            Recent Tasks
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#bbb" }}>
              No tasks yet. Start a conversation to create one.
            </div>
          ) : (
            tasks.map((task, i) => (
              <div key={task.id} style={{
                padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px",
                borderBottom: i < tasks.length - 1 ? "0.5px solid #f0f0ef" : "none"
              }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: "#f3f4f6", border: "0.5px solid #e8e8e6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", color: "#999", flexShrink: 0
                }}>{task.id}</div>
                <div style={{ fontSize: "13px", color: "#1a1a1a", flex: 1 }}>{task.description}</div>
                <div style={{
                  fontSize: "11px", padding: "3px 8px", borderRadius: "6px",
                  background: "#f0fdf4", color: "#15803d", border: "0.5px solid #bbf7d0"
                }}>Created</div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}