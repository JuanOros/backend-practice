'use client'

import { useState, useEffect, useCallback } from 'react'

type Task = {
  id: string
  title: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  createdAt: string
  user: { id: string; name: string } | null
}

const STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     badge: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  DONE:        { label: 'Done',        badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error()
      setTasks(await res.json())
    } catch {
      setError('Could not load tasks. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error()
      setNewTitle('')
      fetchTasks()
    } catch {
      setError('Failed to create task.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, status: Task['status']) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } catch {
      setError('Failed to update task.')
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Failed to delete task.')
    }
  }

  const counts = {
    PENDING: tasks.filter(t => t.status === 'PENDING').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your tasks — create, update status, delete</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs font-medium text-slate-500">{cfg.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{counts[key as Task['status']]}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">New Task</h2>
        <form onSubmit={createTask} className="flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            disabled={submitting}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || submitting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 font-medium underline hover:no-underline">dismiss</button>
        </div>
      )}

      {/* Task list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">All Tasks</h2>
          <span className="text-xs text-slate-400">{tasks.length} total</span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No tasks yet. Create your first one above.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                {/* Status dot */}
                <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[task.status].dot}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  {task.user && (
                    <p className="text-xs text-slate-400 mt-0.5">{task.user.name}</p>
                  )}
                </div>

                {/* Status selector */}
                <select
                  value={task.status}
                  onChange={e => updateStatus(task.id, e.target.value as Task['status'])}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold border-0 cursor-pointer outline-none ${STATUS_CONFIG[task.status].badge}`}
                >
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
