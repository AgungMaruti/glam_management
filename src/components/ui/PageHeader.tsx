'use client'

import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#EEF2FF',
        }}>
          <Icon size={20} color="#6366F1" strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
