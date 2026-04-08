export default function Home() {
  const endpoints = [
    { method: 'GET',    color: 'bg-emerald-100 text-emerald-700', url: '/api/tasks',              desc: 'List all tasks' },
    { method: 'POST',   color: 'bg-blue-100 text-blue-700',       url: '/api/tasks',              desc: 'Create a task' },
    { method: 'GET',    color: 'bg-emerald-100 text-emerald-700', url: '/api/tasks/:id',          desc: 'Get a task' },
    { method: 'PUT',    color: 'bg-amber-100 text-amber-700',     url: '/api/tasks/:id',          desc: 'Update a task' },
    { method: 'DELETE', color: 'bg-red-100 text-red-700',         url: '/api/tasks/:id',          desc: 'Delete a task' },
    { method: 'GET',    color: 'bg-emerald-100 text-emerald-700', url: '/api/users',              desc: 'List all users' },
    { method: 'POST',   color: 'bg-blue-100 text-blue-700',       url: '/api/users',              desc: 'Create a user' },
    { method: 'GET',    color: 'bg-emerald-100 text-emerald-700', url: '/api/users/:id',          desc: 'Get a user' },
    { method: 'PUT',    color: 'bg-amber-100 text-amber-700',     url: '/api/users/:id',          desc: 'Update a user' },
    { method: 'DELETE', color: 'bg-red-100 text-red-700',         url: '/api/users/:id',          desc: 'Delete a user' },
    { method: 'POST',   color: 'bg-blue-100 text-blue-700',       url: '/api/cron/weekly-report', desc: 'Trigger weekly report' },
  ]

  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-900">backend-practice</h1>
        <p className="mt-2 text-slate-500 text-lg">
          Learning project — Next.js 14 · TypeScript · Prisma · PostgreSQL · Vercel
        </p>
        <div className="mt-6 flex gap-3">
          <a href="/tasks" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
            Open Tasks →
          </a>
          <a href="/users" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
            Open Users →
          </a>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <a href="/tasks" className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Tasks</h2>
          <p className="text-sm text-slate-500 mt-1">Create, list, update status and delete tasks. Full CRUD with Prisma.</p>
        </a>
        <a href="/users" className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl mb-4">👥</div>
          <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Users</h2>
          <p className="text-sm text-slate-500 mt-1">Manage users and associate them with tasks via foreign key.</p>
        </a>
      </div>

      {/* API Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">API Endpoints</h2>
          <p className="text-sm text-slate-400 mt-0.5">All endpoints accept and return application/json</p>
        </div>
        <div className="divide-y divide-slate-50">
          {endpoints.map((e, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
              <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono ${e.color}`}>
                {e.method}
              </span>
              <span className="font-mono text-sm text-slate-700 flex-1">{e.url}</span>
              <span className="text-sm text-slate-400 hidden sm:block">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
