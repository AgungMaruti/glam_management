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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2FF', flexShrink: 0 }}>
          <Icon size={17} color="#6366F1" strokeWidth={2.2} />
        </div>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
