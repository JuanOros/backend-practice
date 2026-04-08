export default function Home() {
  const endpoints = [
    { method: 'GET',    color: 'text-green-600',  url: '/api/tasks' },
    { method: 'POST',   color: 'text-blue-600',   url: '/api/tasks' },
    { method: 'GET',    color: 'text-green-600',  url: '/api/tasks/:id' },
    { method: 'PUT',    color: 'text-yellow-600', url: '/api/tasks/:id' },
    { method: 'DELETE', color: 'text-red-600',    url: '/api/tasks/:id' },
    { method: 'GET',    color: 'text-green-600',  url: '/api/users' },
    { method: 'POST',   color: 'text-blue-600',   url: '/api/users' },
    { method: 'GET',    color: 'text-green-600',  url: '/api/users/:id' },
    { method: 'PUT',    color: 'text-yellow-600', url: '/api/users/:id' },
    { method: 'DELETE', color: 'text-red-600',    url: '/api/users/:id' },
    { method: 'POST',   color: 'text-blue-600',   url: '/api/cron/weekly-report' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">backend-practice</h1>
        <p className="mt-1 text-gray-500">Learning project — Next.js 14 · TypeScript · Prisma · PostgreSQL</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a href="/tasks" className="rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">📋</div>
          <h2 className="font-semibold">Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Full CRUD — create, list, update, delete</p>
        </a>
        <a href="/users" className="rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">👥</div>
          <h2 className="font-semibold">Users</h2>
          <p className="text-sm text-gray-500 mt-1">User management with task associations</p>
        </a>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold mb-3">Available API Endpoints</h2>
        <div className="space-y-1.5 font-mono text-sm">
          {endpoints.map((e, i) => (
            <div key={i} className="flex gap-3">
              <span className={`w-14 shrink-0 font-medium ${e.color}`}>{e.method}</span>
              <span className="text-gray-600">{e.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
