'use client'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/Toaster'
import Sidebar from './Sidebar'

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster>
        <AuthGate>{children}</AuthGate>
      </Toaster>
    </AuthProvider>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <main className="app-main">
        <div className="page-wrap">
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
    </>
  )
}
