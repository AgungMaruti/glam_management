'use client'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/Toaster'
import Sidebar from '@/components/layout/Sidebar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster>
        <InnerLayout>{children}</InnerLayout>
      </Toaster>
    </AuthProvider>
  )
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // Show nothing while checking auth (prevent flash)
  if (loading) {
    return (
      <html lang="id">
        <body>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          </div>
        </body>
      </html>
    )
  }

  // Not logged in → only show login page, no sidebar
  if (!user) {
    return (
      <html lang="id">
        <body>{children}</body>
      </html>
    )
  }

  // Logged in → sidebar + content
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
