'use client'
// 'use client' tells Next.js this component runs in the browser.
// It's needed here because we use useState, useEffect, and event handlers.
// Server components (without this directive) run on the server and cannot use these.

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
  PENDING:     { label: 'Pending',     classes: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
  DONE:        { label: 'Done',        classes: 'bg-green-100 text-green-700' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // useCallback memoizes the function so it doesn't get recreated on every render,
  // which is important when passing it as a dependency to useEffect
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
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
      if (!res.ok) throw new Error('Failed to create task')
      setNewTitle('')
      fetchTasks()
    } catch {
      setError('Failed to create task')
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
      // Optimistic update: update local state immediately without waiting for a re-fetch
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } catch {
      setError('Failed to update task')
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Failed to delete task')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Tasks</h1>
        <p className="text-sm text-gray-500">POST /api/tasks · GET /api/tasks · PUT/DELETE /api/tasks/:id</p>
      </div>

      <form onSubmit={createTask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title..."
          disabled={submitting}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">dismiss</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-400">No tasks yet. Create your first one above.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                {task.user && <p className="text-xs text-gray-400 mt-0.5">{task.user.name}</p>}
              </div>
              <select
                value={task.status}
                onChange={e => updateStatus(task.id, e.target.value as Task['status'])}
                className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer ${STATUS_CONFIG[task.status].classes}`}
              >
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none"
                aria-label="Delete task"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
