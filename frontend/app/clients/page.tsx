"use client"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"

type Client = {
  id: number
  name: string
  email: string
  phone: string
  company: string
  channel: string
  task_count: number
  created_at: string
  whatsapp_number: string
  slack_id: string
}

const channelConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  whatsapp: { label: "WhatsApp", bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", icon: "WA" },
  slack:    { label: "Slack",    bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe", icon: "SL" },
  web:      { label: "Web",      bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", icon: "WB" },
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: "36px", height: "36px", borderRadius: "50%",
      background: "#e8f0fe", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: "12px", fontWeight: "500",
      color: "#3b5bdb", flexShrink: 0
    }}>{initials}</div>
  )
}

function ChannelBadge({ channel }: { channel: string }) {
  const cfg = channelConfig[channel] || channelConfig.web
  return (
    <span style={{
      fontSize: "11px", padding: "3px 8px", borderRadius: "6px",
      background: cfg.bg, color: cfg.text, border: `0.5px solid ${cfg.border}`,
      fontWeight: "500"
    }}>{cfg.label}</span>
  )
}

export default function ClientsPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState("")
  const [filter,  setFilter]    = useState("all")
  const [selected, setSelected] = useState<Client | null>(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/clients")
      .then(r => r.json())
      .then(data => { setClients(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        c.phone.includes(search)
    const matchFilter = filter === "all" || c.channel === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "220px", flex: 1, minHeight: "100vh", background: "#f9f9f8" }}>

        {/* Header */}
        <div style={{ padding: "28px 36px 0", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "500", letterSpacing: "-0.3px", margin: 0 }}>Clients</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {clients.length} total clients across all channels
          </p>
        </div>

        <div style={{ display: "flex", gap: "24px", padding: "0 36px 36px" }}>

          {/* Left — client list */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Search + Filter */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: "9px 14px", fontSize: "13px",
                  borderRadius: "8px", border: "0.5px solid #e8e8e6",
                  background: "#fff", color: "#1a1a1a", outline: "none"
                }}
              />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                  padding: "9px 12px", fontSize: "13px", borderRadius: "8px",
                  border: "0.5px solid #e8e8e6", background: "#fff",
                  color: "#1a1a1a", outline: "none", cursor: "pointer"
                }}
              >
                <option value="all">All Channels</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="slack">Slack</option>
                <option value="web">Web</option>
              </select>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "WhatsApp", value: clients.filter(c => c.channel === "whatsapp").length, ...channelConfig.whatsapp },
                { label: "Slack",    value: clients.filter(c => c.channel === "slack").length,    ...channelConfig.slack },
                { label: "Web",      value: clients.filter(c => c.channel === "web").length,      ...channelConfig.web },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#fff", border: "0.5px solid #e8e8e6",
                  borderRadius: "10px", padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>{s.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: "500" }}>{s.value}</div>
                  </div>
                  <span style={{
                    fontSize: "11px", padding: "3px 8px", borderRadius: "6px",
                    background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, fontWeight: "500"
                  }}>{s.icon}</span>
                </div>
              ))}
            </div>

            {/* Client cards */}
            <div style={{ background: "#fff", border: "0.5px solid #e8e8e6", borderRadius: "10px", overflow: "hidden" }}>

              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.5fr 1fr 80px",
                padding: "10px 20px",
                borderBottom: "0.5px solid #f0f0ef",
                background: "#f9f9f8"
              }}>
                {["Client", "Contact", "Channel ID", "Tasks", "Joined"].map(h => (
                  <div key={h} style={{ fontSize: "11px", color: "#999", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</div>
                ))}
              </div>

              {loading ? (
                <div style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#bbb" }}>Loading...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#bbb" }}>No clients found.</div>
              ) : filtered.map((client, i) => (
                <div
                  key={client.id}
                  onClick={() => setSelected(selected?.id === client.id ? null : client)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1.5fr 1fr 80px",
                    padding: "14px 20px",
                    borderBottom: i < filtered.length - 1 ? "0.5px solid #f0f0ef" : "none",
                    cursor: "pointer",
                    background: selected?.id === client.id ? "#f9f9f8" : "transparent",
                    transition: "background 0.1s"
                  }}
                >
                  {/* Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={client.name} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "500", color: "#1a1a1a" }}>{client.name}</div>
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "1px" }}>{client.company || "—"}</div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "3px" }}>
                    <div style={{ fontSize: "12px", color: "#444" }}>{client.email || "—"}</div>
                    <div style={{ fontSize: "12px", color: "#999" }}>{client.phone || "—"}</div>
                  </div>

                  {/* Channel-specific ID */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px" }}>
                    <ChannelBadge channel={client.channel} />
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                      {client.channel === "whatsapp" && client.whatsapp_number
                        ? `+${client.whatsapp_number}`
                        : client.channel === "slack" && client.slack_id
                        ? client.slack_id
                        : "Web visitor"}
                    </div>
                  </div>

                  {/* Task count */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{
                      fontSize: "12px", padding: "3px 10px", borderRadius: "6px",
                      background: client.task_count > 0 ? "#f0fdf4" : "#f9f9f8",
                      color: client.task_count > 0 ? "#15803d" : "#999",
                      border: `0.5px solid ${client.task_count > 0 ? "#bbf7d0" : "#e8e8e6"}`
                    }}>
                      {client.task_count} task{client.task_count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Date */}
                  <div style={{ display: "flex", alignItems: "center", fontSize: "12px", color: "#bbb" }}>
                    {client.created_at}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — client detail panel */}
          {selected && (
            <div style={{ width: "280px", flexShrink: 0 }}>
              <div style={{ background: "#fff", border: "0.5px solid #e8e8e6", borderRadius: "10px", overflow: "hidden", position: "sticky", top: "24px" }}>

                {/* Panel header */}
                <div style={{ padding: "20px", borderBottom: "0.5px solid #f0f0ef", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Avatar name={selected.name} />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{selected.name}</div>
                      <ChannelBadge channel={selected.channel} />
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: "18px", lineHeight: 1 }}
                  >×</button>
                </div>

                {/* Contact info */}
                <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #f0f0ef" }}>
                  <p style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px", fontWeight: "500" }}>Contact</p>
                  {[
                    { label: "Email",   value: selected.email || "—" },
                    { label: "Phone",   value: selected.phone ? `+${selected.phone}` : "—" },
                    { label: "Company", value: selected.company || "—" },
                    { label: "Joined",  value: selected.created_at },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#999" }}>{label}</span>
                      <span style={{ fontSize: "12px", color: "#1a1a1a", textAlign: "right", maxWidth: "160px", wordBreak: "break-all" }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Channel info */}
                <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #f0f0ef" }}>
                  <p style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px", fontWeight: "500" }}>Channel Details</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#999" }}>Source</span>
                    <ChannelBadge channel={selected.channel} />
                  </div>
                  {selected.channel === "whatsapp" && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#999" }}>WA Number</span>
                      <span style={{ fontSize: "12px", color: "#1a1a1a" }}>+{selected.whatsapp_number}</span>
                    </div>
                  )}
                  {selected.channel === "slack" && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#999" }}>Slack ID</span>
                      <span style={{ fontSize: "12px", color: "#1a1a1a" }}>{selected.slack_id}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #f0f0ef" }}>
                  <p style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px", fontWeight: "500" }}>Activity</p>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "#999" }}>Total Tasks</span>
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "#1a1a1a" }}>{selected.task_count}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px", fontWeight: "500" }}>Actions</p>
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} style={{
                      display: "block", padding: "9px 14px", textAlign: "center",
                      background: "#1a1a1a", color: "#fff", borderRadius: "8px",
                      fontSize: "13px", fontWeight: "500", textDecoration: "none"
                    }}>Send Email</a>
                  )}
                  {selected.channel === "whatsapp" && selected.whatsapp_number && (
                    <a href={`https://wa.me/${selected.whatsapp_number}`} target="_blank" rel="noreferrer" style={{
                      display: "block", padding: "9px 14px", textAlign: "center",
                      background: "#f0fdf4", color: "#15803d",
                      border: "0.5px solid #bbf7d0", borderRadius: "8px",
                      fontSize: "13px", fontWeight: "500", textDecoration: "none"
                    }}>Open WhatsApp</a>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}