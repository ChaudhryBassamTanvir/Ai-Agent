"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats,   setStats]   = useState<Stats>({ total_tasks: 0, total_clients: 0, pending_tasks: 0, done_tasks: 0 })
  const [loading, setLoading] = useState(true)
const [selectedTask, setSelectedTask] = useState<any | null>(null);
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
          <p className="text-sm text-gray-400 mt-1">
            Live overview of clients and tasks
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-7">
          {[
            { label: "Total Tasks", value: stats.total_tasks },
            { label: "Total Clients", value: stats.total_clients },
            { label: "Pending", value: stats.pending_tasks },
            { label: "Completed", value: stats.done_tasks },
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
            <div className="py-10 text-center text-sm text-gray-300">
              No tasks yet.
            </div>
          ) : tasks.map((task: any, i: number) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`px-5 py-3.5 flex items-center gap-3 cursor-pointer ${
                i < tasks.length - 1 ? "border-b border-gray-50" : ""
              } hover:bg-gray-50 transition`}
            >
              <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] text-gray-400">
                {task.id}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate font-medium">
                  {task.description}
                </div>
              </div>

              <span className={`text-xs px-2 py-1 rounded-md border font-medium ${statusColor[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Clients (UNCHANGED) */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Clients</span>
            <span className="text-xs text-gray-400">{clients.length} total</span>
          </div>

          {clients.map((client: any, i: number) => (
            <div
              key={client.id}
              className={`px-5 py-3.5 flex items-center gap-3 ${
                i < clients.length - 1 ? "border-b border-gray-50" : ""
              } hover:bg-gray-50 transition`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700">
                {client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{client.name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {client.company || client.email || client.phone}
                </div>
              </div>

              <span className={`text-xs px-2 py-1 rounded-md border ${
                client.task_count > 0
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-gray-50 text-gray-400 border-gray-200"
              }`}>
                {client.task_count} tasks
              </span>

              <span className={`text-xs px-2 py-1 rounded-md border ${channelColor[client.channel]}`}>
                {client.channel}
              </span>

              <span className="text-xs text-gray-300">{client.created_at}</span>

              <button
                onClick={() => deleteClient(client.id)}
                className="text-xs px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* 🔥 PREMIUM MODAL */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* Blur Background */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setSelectedTask(null)}
            />

            {/* Card */}
            <div className="relative bg-white w-[520px] rounded-xl shadow-xl border border-gray-100 overflow-hidden">

              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Task #{selectedTask.id}
                  </div>
                  <span className={`mt-1 inline-block text-xs px-2 py-1 rounded-md border ${statusColor[selectedTask.status]}`}>
                    {selectedTask.status}
                  </span>
                </div>

                <button onClick={() => setSelectedTask(null)} className="text-gray-400 text-lg">×</button>
              </div>

              {/* Description */}
              <div className="p-5 border-b border-gray-100">
                <p className="text-[10px] text-gray-300 uppercase mb-2">Description</p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedTask.description}
                </div>
              </div>

              {/* Details */}
              <div className="p-5 border-b border-gray-100">
                <p className="text-[10px] text-gray-300 uppercase mb-2">Details</p>

                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Client</span>
                  <span className="text-gray-900">{selectedTask.client}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Created</span>
                  <span className="text-gray-900">{selectedTask.created_at}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 flex flex-col gap-2">
                <select
                  value={selectedTask.status}
                  onChange={(e) => updateStatus(selectedTask.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <button
                  onClick={() => {
                    deleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100"
                >
                  Delete Task
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}