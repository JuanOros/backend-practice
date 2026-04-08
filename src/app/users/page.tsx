'use client'
// 'use client' is required here because we use useState, useEffect, and event handlers.

import { useState, useEffect, useCallback } from 'react'

type User = {
  id: string
  name: string
  email: string
  createdAt: string
  _count: { tasks: number }
}

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
      if (!res.ok) throw new Error('Failed to fetch users')
      setUsers(await res.json())
    } catch {
      setError('Could not load users. Is the server running?')
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
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create user')
      }
      setNewName('')
      setNewEmail('')
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? Their tasks will remain but lose the association.')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      // Remove from local state immediately — no need to re-fetch
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      setError('Failed to delete user')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-gray-500">POST /api/users · GET /api/users · DELETE /api/users/:id</p>
      </div>

      <form onSubmit={createUser} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Full name"
          disabled={submitting}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        <input
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          disabled={submitting}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newName.trim() || !newEmail.trim() || submitting}
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
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-400">No users yet. Create your first one above.</p>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 whitespace-nowrap">
                {user._count.tasks} task{user._count.tasks !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => deleteUser(user.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none"
                aria-label="Delete user"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
