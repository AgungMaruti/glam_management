'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  variant: 'default' | 'success' | 'error'
}

interface ToastContextType {
  toast: (opts: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside Toaster')
  return ctx
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { ...opts, id }])
    // Auto dismiss after 4s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
        <ToastPrimitive.Viewport
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 100,
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    default: { bg: '#fff', border: '#E2E8F0', title: '#0F172A', icon: '#6366F1' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', title: '#16A34A', icon: '#16A34A' },
    error: { bg: '#FEF2F2', border: '#FECACA', title: '#DC2626', icon: '#DC2626' },
  }
  const c = colors[toast.variant]

  return (
    <ToastPrimitive.Root
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(15,23,42,.1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 280,
        maxWidth: 380,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <ToastPrimitive.Title style={{ fontSize: 13, fontWeight: 700, color: c.title, marginBottom: toast.description ? 2 : 0 }}>
          {toast.title}
        </ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
            {toast.description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: 2,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}
