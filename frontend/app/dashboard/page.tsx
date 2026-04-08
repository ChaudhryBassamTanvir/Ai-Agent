"use client"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"

type Task = {
  id: number
  description: string
  status: string
  trello_url: string
  client: string
  created_at: string
}

type Client = {
  id: number
  name: string
  email: string
  phone: string
  company: string
  channel: string
  task_count: number
  created_at: string
}

type Stats = {
  total_tasks: number
  total_clients: number
  pending_tasks: number
  done_tasks: number
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  in_progress: { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  done: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
}

const channelColor: Record<string, { bg: string; text: string; border: string }> = {
  whatsapp: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  slack: { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  web: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats>({
    total_tasks: 0,
    total_clients: 0,
    pending_tasks: 0,
    done_tasks: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const fetchAll = async () => {
    try {
      const [t, c, s] = await Promise.all([
        fetch("http://127.0.0.1:8000/tasks").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/clients").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/stats").then((r) => r.json()),
      ])
      setTasks(t)
      setClients(c)
      setStats(s)
    } catch {
      console.error("Backend not reachable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const updateStatus = async (id: number, status: string) => {
    await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchAll()
  }

  const pill = (
    text: string,
    colors: { bg: string; text: string; border: string }
  ) => (
    <span
      style={{
        fontSize: "11px",
        padding: "3px 8px",
        borderRadius: "6px",
        background: colors.bg,
        color: colors.text,
        border: `0.5px solid ${colors.border}`,
        fontWeight: "500",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  )

  if (loading)
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main
          style={{
            marginLeft: isMobile ? "0" : "220px",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: isMobile ? "16px" : "0",
          }}
        >
          <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
        </main>
      </div>
    )

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main
        style={{
          marginLeft: isMobile ? "0" : "220px",
          flex: 1,
          minHeight: "100vh",
          background: "#f9f9f8",
          padding: isMobile ? "16px" : "32px 36px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: isMobile ? "18px" : "20px",
              fontWeight: "500",
              letterSpacing: "-0.3px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            Live overview of clients and tasks
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(4, 1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "Total Tasks", value: stats.total_tasks },
            { label: "Total Clients", value: stats.total_clients },
            { label: "Pending", value: stats.pending_tasks },
            { label: "Completed", value: stats.done_tasks },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "0.5px solid #e8e8e6",
                borderRadius: "10px",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#999",
                  marginBottom: "8px",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: "24px", fontWeight: "500" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Table */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e8e8e6",
            borderRadius: "10px",
            overflowX: "auto",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "0.5px solid #e8e8e6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              Tasks
            </span>
            <span style={{ fontSize: "11px", color: "#999" }}>
              {tasks.length} total
            </span>
          </div>

          {tasks.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                fontSize: "13px",
                color: "#bbb",
              }}
            >
              No tasks yet.
            </div>
          ) : (
            tasks.map((task, i) => (
              <div
                key={task.id}
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "14px",
                  borderBottom:
                    i < tasks.length - 1
                      ? "0.5px solid #f0f0ef"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    border: "0.5px solid #e8e8e6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "#999",
                    flexShrink: 0,
                  }}
                >
                  {task.id}
                </div>

                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#1a1a1a",
                      wordBreak: "break-word",
                    }}
                  >
                    {task.description}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#999",
                      marginTop: "2px",
                    }}
                  >
                    {task.client} · {task.created_at}
                  </div>
                </div>

                {task.trello_url && (
                  <a
                    href={task.trello_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "11px",
                      color: "#3b5bdb",
                      textDecoration: "none",
                    }}
                  >
                    Trello
                  </a>
                )}

                <select
                  value={task.status}
                  onChange={(e) =>
                    updateStatus(task.id, e.target.value)
                  }
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "0.5px solid #e8e8e6",
                    background: "#f9f9f8",
                    color: "#1a1a1a",
                    cursor: "pointer",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                {pill(
                  task.status.replace("_", " "),
                  statusColor[task.status] || statusColor.pending
                )}
              </div>
            ))
          )}
        </div>

        {/* Clients Table */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e8e8e6",
            borderRadius: "10px",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "0.5px solid #e8e8e6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              Clients
            </span>
            <span style={{ fontSize: "11px", color: "#999" }}>
              {clients.length} total
            </span>
          </div>

          {clients.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                fontSize: "13px",
                color: "#bbb",
              }}
            >
              No clients yet.
            </div>
          ) : (
            clients.map((client, i) => (
              <div
                key={client.id}
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "14px",
                  borderBottom:
                    i < clients.length - 1
                      ? "0.5px solid #f0f0ef"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#e8f0fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#3b5bdb",
                    flexShrink: 0,
                  }}
                >
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#1a1a1a",
                    }}
                  >
                    {client.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999" }}>
                    {client.company || client.email || client.phone}
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#999" }}>
                  {client.task_count} task
                  {client.task_count !== 1 ? "s" : ""}
                </div>

                {pill(
                  client.channel,
                  channelColor[client.channel] || channelColor.web
                )}

                <div style={{ fontSize: "11px", color: "#bbb" }}>
                  {client.created_at}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}