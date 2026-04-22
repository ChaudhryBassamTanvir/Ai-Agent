"use client"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"

type Task   = { id: number; description: string; status: string; trello_url: string; client: string; created_at: string }
type Client = { id: number; name: string; email: string; phone: string; company: string; channel: string; task_count: number; created_at: string }
type Stats  = { total_tasks: number; total_clients: number; pending_tasks: number; done_tasks: number }

const statusColor: Record<string, string> = {
  pending:     "bg-amber-50 text-amber-800 border-amber-200",
  in_progress: "bg-blue-50 text-blue-800 border-blue-200",
  done:        "bg-green-50 text-green-800 border-green-200",
}

const channelColor: Record<string, string> = {
  whatsapp: "bg-green-50 text-green-800 border-green-200",
  slack:    "bg-blue-50 text-blue-800 border-blue-200",
  web:      "bg-purple-50 text-purple-800 border-purple-200",
}

export default function DashboardPage() {
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [clients,      setClients]      = useState<Client[]>([])
  const [stats,        setStats]        = useState<Stats>({ total_tasks: 0, total_clients: 0, pending_tasks: 0, done_tasks: 0 })
  const [loading,      setLoading]      = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchAll = async () => {
    try {
      const [t, c, s] = await Promise.all([
        fetch("http://127.0.0.1:8000/tasks").then(r => r.json()),
        fetch("http://127.0.0.1:8000/clients").then(r => r.json()),
        fetch("http://127.0.0.1:8000/stats").then(r => r.json()),
      ])
      setTasks(t); setClients(c); setStats(s)
    } catch { console.error("Backend not reachable") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (id: number, status: string) => {
    await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
    fetchAll()
  }

  const deleteTask = async (id: number) => {
    if (!confirm("Delete this task?")) return
    await fetch(`http://127.0.0.1:8000/tasks/${id}`, { method: "DELETE" })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const deleteClient = async (id: number) => {
    if (!confirm("Delete this client and all their data?")) return
    await fetch(`http://127.0.0.1:8000/clients/${id}`, { method: "DELETE" })
    setClients(prev => prev.filter(c => c.id !== id))
    fetchAll()
  }

  if (loading) return (
    <div className="flex">
      <Sidebar />
      <main className="ml-[220px] flex-1 flex items-center justify-center h-screen">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    </div>
  )

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-[220px] flex-1 min-h-screen bg-gray-50 p-8 overflow-x-hidden">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-xl font-medium tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Live overview of clients and tasks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-7">
          {[
            { label: "Total Tasks",   value: stats.total_tasks },
            { label: "Total Clients", value: stats.total_clients },
            { label: "Pending",       value: stats.pending_tasks },
            { label: "Completed",     value: stats.done_tasks },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="text-xs text-gray-400 mb-2">{label}</div>
              <div className="text-2xl font-medium text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Tasks</span>
            <span className="text-xs text-gray-400">{tasks.length} total</span>
          </div>

          {tasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-300">No tasks yet.</div>
          ) : tasks.map((task, i) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition ${i < tasks.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] text-gray-400 flex-shrink-0">
                {task.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate font-medium">{task.description}</div>
                <div className="text-xs text-gray-400 mt-0.5">{task.client} · {task.created_at}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md border font-medium flex-shrink-0 ${statusColor[task.status] || statusColor.pending}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Clients */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Clients</span>
            <span className="text-xs text-gray-400">{clients.length} total</span>
          </div>

          {clients.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-300">No clients yet.</div>
          ) : clients.map((client, i) => (
            <div
              key={client.id}
              className={`px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition ${i < clients.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{client.name}</div>
                <div className="text-xs text-gray-400 truncate">{client.company || client.email || client.phone}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md border flex-shrink-0 ${client.task_count > 0 ? "bg-green-50 text-green-800 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                {client.task_count} task{client.task_count !== 1 ? "s" : ""}
              </span>
              <span className={`text-xs px-2 py-1 rounded-md border font-medium flex-shrink-0 capitalize ${channelColor[client.channel] || channelColor.web}`}>
                {client.channel}
              </span>
              <span className="text-xs text-gray-300 flex-shrink-0">{client.created_at}</span>
              <button
                onClick={() => deleteClient(client.id)}
                className="text-xs px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex-shrink-0 cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setSelectedTask(null)}
            />

            {/* Modal Card */}
            <div className="relative bg-white w-[520px] rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-widest font-medium">
                    Task #{selectedTask.id}
                  </div>
                  <div className="text-base font-medium text-gray-900 leading-snug max-w-[380px]">
                    {selectedTask.description.length > 80
                      ? selectedTask.description.slice(0, 80) + "..."
                      : selectedTask.description}
                  </div>
                  <span className={`mt-2 inline-block text-xs px-2.5 py-1 rounded-md border font-medium ${statusColor[selectedTask.status] || statusColor.pending}`}>
                    {selectedTask.status.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-300 hover:text-gray-600 text-2xl leading-none bg-transparent border-none cursor-pointer ml-4 flex-shrink-0"
                >×</button>
              </div>

              {/* Full Description */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-2 font-medium">Full Description</p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-32 overflow-y-auto">
                  {selectedTask.description}
                </div>
              </div>

              {/* Details */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3 font-medium">Details</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Client</span>
                    <span className="text-xs font-medium text-gray-900">{selectedTask.client || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Created</span>
                    <span className="text-xs text-gray-900">{selectedTask.created_at}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Trello</span>
                    {selectedTask.trello_url ? (
                      <a                                        
                        href={selectedTask.trello_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Open Card →
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">No Trello card</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-5 flex flex-col gap-2.5">
                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 font-medium">Actions</p>

                <select
                  value={selectedTask.status}
                  onChange={e => {
                    updateStatus(selectedTask.id, e.target.value)
                    setSelectedTask({ ...selectedTask, status: e.target.value })
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <div className="flex gap-2">
                  {selectedTask.trello_url && (
                    <a                                           
                      href={selectedTask.trello_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 text-center bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors no-underline"
                    >
                      Open in Trello →
                    </a>
                  )}
                  <button
                    onClick={() => { deleteTask(selectedTask.id); setSelectedTask(null) }}
                    className={`py-2.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer bg-red-50 text-red-600 border-red-200 hover:bg-red-100 ${selectedTask.trello_url ? "flex-1" : "w-full"}`}
                  >
                    Delete Task
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}