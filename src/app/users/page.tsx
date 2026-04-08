'use client'

import { useState, useEffect, useCallback } from 'react'

type User = {
  id: string
  name: string
  email: string
  createdAt: string
  _count: { tasks: number }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      setError('Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')
      setNewName('')
      setNewEmail('')
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? Their tasks will remain but lose the association.')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      setError('Failed to delete user.')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-400 mt-1">Manage users and their task associations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Total Tasks Assigned</p>
          <p className="text-2xl font-bold text-slate-900">{users.reduce((sum, u) => sum + u._count.tasks, 0)}</p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">New User</h2>
        <form onSubmit={createUser} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Full name"
            disabled={submitting}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
          />
          <input
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            disabled={submitting}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!newName.trim() || !newEmail.trim() || submitting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
          >
            {submitting ? 'Adding...' : 'Add User'}
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

      {/* User list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">All Users</h2>
          <span className="text-xs text-slate-400">{users.length} total</span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No users yet. Create your first one above.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map((user, i) => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                {/* Avatar */}
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {getInitials(user.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>

                {/* Task count */}
                <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                  {user._count.tasks} {user._count.tasks === 1 ? 'task' : 'tasks'}
                </span>

                {/* Delete */}
                <button
                  onClick={() => deleteUser(user.id)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Delete user"
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
