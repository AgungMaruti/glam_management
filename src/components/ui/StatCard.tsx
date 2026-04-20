'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'violet'
}

const palette = {
  indigo: { bg: '#EEF2FF', icon: '#6366F1', text: '#4338CA' },
  green:  { bg: '#ECFDF5', icon: '#10B981', text: '#059669' },
  amber:  { bg: '#FFFBEB', icon: '#F59E0B', text: '#D97706' },
  red:    { bg: '#FEF2F2', icon: '#EF4444', text: '#DC2626' },
  violet: { bg: '#F5F3FF', icon: '#7C3AED', text: '#6D28D9' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }: StatCardProps) {
  const p = palette[color]
  return (
    <div className="card stat-card">
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: p.bg, marginBottom: 10,
      }}>
        <Icon size={19} color={p.icon} strokeWidth={2} />
      </div>
      <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: p.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
      {subtitle && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{subtitle}</p>}
    </div>
  )
}
