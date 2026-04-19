import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Glam Suite',
  description: 'Kelola bisnis parfum kamu dari hulu ke hilir',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Sidebar />
        <main className="app-main">
          <div className="page-wrap">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
