import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'backend-practice',
  description: 'Learning project — Next.js, Prisma, PostgreSQL, Vercel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <nav className="bg-white border-b border-slate-200 shadow-sm">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-slate-900 tracking-tight">
              backend<span className="text-blue-600">-practice</span>
            </a>
            <div className="flex gap-1">
              <a href="/tasks" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">
                Tasks
              </a>
              <a href="/users" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">
                Users
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  )
}
