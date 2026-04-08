import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'backend-practice',
  description: 'Learning project — Next.js, Prisma, PostgreSQL, Vercel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <nav className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <a href="/" className="font-semibold text-gray-900">backend-practice</a>
            <div className="flex gap-4 text-sm">
              <a href="/tasks" className="text-gray-500 hover:text-gray-900 transition-colors">Tasks</a>
              <a href="/users" className="text-gray-500 hover:text-gray-900 transition-colors">Users</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl p-6">{children}</main>
      </body>
    </html>
  )
}
