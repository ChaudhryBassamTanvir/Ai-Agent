"use client"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"

type Client = {
  id: number; name: string; email: string; phone: string
  company: string; channel: string; task_count: number
  created_at: string; whatsapp_number: string; slack_id: string
}

const channelCfg: Record<string, { label: string; cls: string; icon: string }> = {
  whatsapp: { label: "WhatsApp", cls: "bg-green-50 text-green-800 border-green-200",  icon: "WA" },
  slack:    { label: "Slack",    cls: "bg-blue-50 text-blue-800 border-blue-200",     icon: "SL" },
  web:      { label: "Web",      cls: "bg-purple-50 text-purple-800 border-purple-200", icon: "WB" },
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
      {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  )
}

function ChannelBadge({ channel }: { channel: string }) {
  const cfg = channelCfg[channel] || channelCfg.web
  return <span className={`text-xs px-2 py-1 rounded-md border font-medium ${cfg.cls}`}>{cfg.label}</span>
}

export default function ClientsPage() {
  const [clients,  setClients]  = useState<Client[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [filter,   setFilter]   = useState("all")
  const [selected, setSelected] = useState<Client | null>(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [newClient, setNewClient] = useState({
    name: "", email: "", phone: "", company: "",
    channel: "whatsapp", cgpa: "", degree: "", target_country: ""
  })

  const load = () => {
    fetch("http://127.0.0.1:8000/clients")
      .then(r => r.json())
      .then(data => { setClients(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        c.phone.includes(search)
    return matchSearch && (filter === "all" || c.channel === filter)
  })

  const deleteClient = async (id: number) => {
    if (!confirm("Delete this client and all their data?")) return
    await fetch(`http://127.0.0.1:8000/clients/${id}`, { method: "DELETE" })
    setClients(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const addClient = async () => {
    if (!newClient.name) return
    await fetch("http://127.0.0.1:8000/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient)
    })
    setShowAdd(false)
    setNewClient({ name: "", email: "", phone: "", company: "", channel: "whatsapp", cgpa: "", degree: "", target_country: "" })
    load()
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-[220px] flex-1 min-h-screen bg-gray-50">

        {/* Header */}
        <div className="px-9 pt-7 pb-0 mb-6">
          <h1 className="text-xl font-medium tracking-tight text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-1">{clients.length} total clients across all channels</p>
        </div>

        <div className="flex gap-6 px-9 pb-9">

          {/* Left */}
          <div className="flex-1 min-w-0">

            {/* Search + Filter + Add */}
            <div className="flex gap-2.5 mb-4">
              <input
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 outline-none focus:border-gray-400"
              />
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 outline-none cursor-pointer">
                <option value="all">All Channels</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="slack">Slack</option>
                <option value="web">Web</option>
              </select>
              <button onClick={() => setShowAdd(true)}
                className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                + Add Client
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: "WhatsApp", icon: "WA", cls: "bg-green-50 text-green-800 border-green-200",   count: clients.filter(c => c.channel === "whatsapp").length },
                { label: "Slack",    icon: "SL", cls: "bg-blue-50 text-blue-800 border-blue-200",      count: clients.filter(c => c.channel === "slack").length },
                { label: "Web",      icon: "WB", cls: "bg-purple-50 text-purple-800 border-purple-200", count: clients.filter(c => c.channel === "web").length },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                    <div className="text-xl font-medium text-gray-900">{s.count}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md border font-medium ${s.cls}`}>{s.icon}</span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_80px_60px] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                {["Client", "Contact", "Channel ID", "Tasks", "Joined", ""].map(h => (
                  <div key={h} className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{h}</div>
                ))}
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-gray-300">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-300">No clients found.</div>
              ) : filtered.map((client, i) => (
                <div
                  key={client.id}
                  onClick={() => setSelected(selected?.id === client.id ? null : client)}
                  className={`grid grid-cols-[2fr_2fr_1.5fr_1fr_80px_60px] px-5 py-3.5 cursor-pointer transition-colors ${selected?.id === client.id ? "bg-gray-50" : "hover:bg-gray-50"} ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={client.name} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-400">{client.company || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-1">
                    <div className="text-xs text-gray-600 truncate">{client.email || "—"}</div>
                    <div className="text-xs text-gray-400">{client.phone || "—"}</div>
                  </div>

                  <div className="flex flex-col justify-center gap-1">
                    <ChannelBadge channel={client.channel} />
                    <div className="text-xs text-gray-400">
                      {client.channel === "whatsapp" && client.whatsapp_number ? `+${client.whatsapp_number}` :
                       client.channel === "slack" && client.slack_id ? client.slack_id : "Web visitor"}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className={`text-xs px-2.5 py-1 rounded-md border ${client.task_count > 0 ? "bg-green-50 text-green-800 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                      {client.task_count} task{client.task_count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-300">{client.created_at}</div>

                  <div className="flex items-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="text-xs px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    >Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-72 flex-shrink-0">
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-6">

                <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <Avatar name={selected.name} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{selected.name}</div>
                      <ChannelBadge channel={selected.channel} />
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-600 text-lg cursor-pointer bg-transparent border-none">×</button>
                </div>

                <div className="p-5 border-b border-gray-100">
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3 font-medium">Contact</p>
                  {[
                    { label: "Email",   value: selected.email || "—" },
                    { label: "Phone",   value: selected.phone ? `+${selected.phone}` : "—" },
                    { label: "Company", value: selected.company || "—" },
                    { label: "Joined",  value: selected.created_at },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between mb-2">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs text-gray-900 text-right max-w-[160px] break-all">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-b border-gray-100">
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3 font-medium">Channel</p>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-400">Source</span>
                    <ChannelBadge channel={selected.channel} />
                  </div>
                  {selected.channel === "whatsapp" && selected.whatsapp_number && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">WA Number</span>
                      <span className="text-xs text-gray-900">+{selected.whatsapp_number}</span>
                    </div>
                  )}
                  {selected.channel === "slack" && selected.slack_id && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Slack ID</span>
                      <span className="text-xs text-gray-900">{selected.slack_id}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 border-b border-gray-100">
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3 font-medium">Activity</p>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Total Tasks</span>
                    <span className="text-xs font-medium text-gray-900">{selected.task_count}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-2">
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 font-medium">Actions</p>
                  {selected.email && (
                    <a href={`mailto:${selected.email}`}
                      className="block py-2.5 text-center bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors no-underline">
                      Send Email
                    </a>
                  )}
                  {selected.channel === "whatsapp" && selected.whatsapp_number && (
                    <a href={`https://wa.me/${selected.whatsapp_number}`} target="_blank" rel="noreferrer"
                      className="block py-2.5 text-center bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors no-underline">
                      Open WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => deleteClient(selected.id)}
                    className="py-2.5 text-center bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer">
                    Delete Client
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-7 w-[480px] border border-gray-100 shadow-lg">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-medium text-gray-900">Add New Client</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-300 hover:text-gray-600 text-xl bg-transparent border-none cursor-pointer">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "name",           label: "Full Name",      placeholder: "Ahmed Khan",           span: true },
                  { key: "email",          label: "Email",          placeholder: "ahmed@example.com",    span: false },
                  { key: "phone",          label: "Phone",          placeholder: "+92 300 1234567",      span: false },
                  { key: "company",        label: "Company",        placeholder: "Company name",         span: false },
                  { key: "target_country", label: "Target Country", placeholder: "Canada",               span: false },
                ].map(f => (
                  <div key={f.key} className={f.span ? "col-span-2" : ""}>
                    <label className="text-xs text-gray-400 block mb-1.5">{f.label}</label>
                    <input
                      placeholder={f.placeholder}
                      value={(newClient as any)[f.key]}
                      onChange={e => setNewClient({ ...newClient, [f.key]: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 outline-none focus:border-gray-400"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Channel</label>
                  <select value={newClient.channel} onChange={e => setNewClient({ ...newClient, channel: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none cursor-pointer">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="slack">Slack</option>
                    <option value="web">Web</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2.5 mt-5 justify-end">
                <button onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer bg-transparent">
                  Cancel
                </button>
                <button onClick={addClient}
                  className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors cursor-pointer">
                  Add Client
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}